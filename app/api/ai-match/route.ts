export const runtime = 'edge';

import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMatchNotificationEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || 'placeholder-api-key' 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lostItem, foundItem, lostItemOwnerId } = body;

    const lostTitle = lostItem?.title || '';
    const lostCategory = lostItem?.category || '';
    const lostLocation = lostItem?.location || '';

    const foundTitle = foundItem?.title || '';
    const foundCategory = foundItem?.category || '';
    const foundLocation = foundItem?.location || '';

    let matchScore = 0;
    let reasoning = '';

    // เช็กเบื้องต้นก่อนส่ง AI: ถ้าคนละประเภทกันอย่างชัดเจน ตัดคะแนนทิ้งทันที
    const lostTitleLower = lostTitle.toLowerCase();
    const foundTitleLower = foundTitle.toLowerCase();

    // กฎสำรอง (Fallback / Quick Check)
    const isPenLost = lostTitleLower.includes('ปากกา');
    const isPenFound = foundTitleLower.includes('ปากกา');
    const isKeyLost = lostTitleLower.includes('กุญแจ');
    const isKeyFound = foundTitleLower.includes('กุญแจ');

    if ((isPenLost && isKeyFound) || (isKeyLost && isPenFound)) {
      // คนละประเภทชัดเจน
      return NextResponse.json({
        success: true,
        matchScore: 5,
        analysis: 'สิ่งของคนละประเภทกันอย่างชัดเจน (ปากกา กับ กุญแจ)'
      });
    }

    // เรียกใช้งาน Gemini AI
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `คุณคือ AI วิเคราะห์ของหาย (Lost & Found Detector)
เปรียบเทียบสิ่งของ 2 รายการนี้:
1. ของหาย: "${lostTitle}" (หมวดหมู่: ${lostCategory}, สถานที่: ${lostLocation})
2. ของที่พบ: "${foundTitle}" (หมวดหมู่: ${foundCategory}, สถานที่: ${foundLocation})

เกณฑ์การประเมิน:
- ถ้าเป็นสิ่งของชนิดเดียวกัน (เช่น ปากกากับปากกา) ให้คะแนน 80-95%
- ถ้าสถานที่ใกล้เคียงกัน เพิ่มคะแนน
- ถ้าสิ่งของต่างชนิดกัน ให้คะแนนต่ำกว่า 20%

ตอบในรูปแบบ JSON ดังนี้เท่านั้น:
{"matchScore": <0-100>, "reasoning": "<สรุปสั้นๆ 1 ประโยค>"}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          matchScore = Number(parsed.matchScore) || 0;
          reasoning = parsed.reasoning || '';
        }
      } catch (e) {
        console.error('Gemini API Error, using fallback rule:', e);
      }
    }

    // หาก Gemini ไม่คืนค่า ใช้วิธีคำนวณเบื้องต้นสำรอง
    if (matchScore === 0) {
      if ((isPenLost && isPenFound) || (isKeyLost && isKeyFound) || (lostTitleLower === foundTitleLower)) {
        matchScore = 85;
        reasoning = `สิ่งของมีชื่อและลักษณะตรงกัน ("${lostTitle}")`;
      } else {
        matchScore = 20;
        reasoning = 'รูปพรรณสัณฐานยังมีความแตกต่างกัน';
      }
    }

    // ส่งอีเมลผ่าน Resend หากคะแนน >= 80%
    const ownerId = lostItemOwnerId || lostItem?.user_id || lostItem?.owner_id;
    if (matchScore >= 80 && ownerId) {
      const { data: userData } = await (supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', ownerId)
        .single() as any);

      if (userData?.email) {
        sendMatchNotificationEmail({
          toEmail: userData.email,
          ownerName: userData.full_name || 'ผู้ใช้งานระบบ',
          itemTitle: lostTitle,
          matchScore: matchScore,
          matchDetailUrl: `https://beb4804d.lost-and-found-detective.pages.dev/ai-matching`,
        }).catch((err) => console.error('Email send background error:', err));
      }
    }

    return NextResponse.json({
      success: true,
      matchScore,
      analysis: reasoning
    });

  } catch (error) {
    console.error('AI Match API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}