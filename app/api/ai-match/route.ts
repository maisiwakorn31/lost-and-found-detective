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

// ฟังก์ชันแปลงรูปภาพจาก URL ให้เป็น Part object ที่ Gemini รองรับ
async function fileToGenerativePart(imageUrl: string) {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    
    return {
      inlineData: {
        data: base64Data,
        mimeType
      },
    };
  } catch (error) {
    console.error('Error fetching image for AI:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lostItem, foundItem, lostItemOwnerId } = body;

    const lostTitle = lostItem?.title || '';
    const lostCategory = lostItem?.category || '';
    const lostLocation = lostItem?.location || '';
    const lostImageUrl = lostItem?.image_url;

    const foundTitle = foundItem?.title || '';
    const foundCategory = foundItem?.category || '';
    const foundLocation = foundItem?.location || '';
    const foundImageUrl = foundItem?.image_url;

    let matchScore = 0;
    let reasoning = '';

    if (process.env.GEMINI_API_KEY) {
      try {
        const contents: any[] = [
          `คุณคือ AI วิเคราะห์ของหาย (Lost & Found Detective) ที่มีความสามารถในการมองเห็นภาพถ่าย
เปรียบเทียบสิ่งของ 2 รายการนี้ทั้งจาก "ข้อความ" และ "รูปภาพ":

1. ของหาย: "${lostTitle}" (หมวดหมู่: ${lostCategory}, สถานที่: ${lostLocation})
2. ของที่พบ: "${foundTitle}" (หมวดหมู่: ${foundCategory}, สถานที่: ${foundLocation})

เกณฑ์การประเมิน:
- หากตรวจสอบจากรูปภาพแล้วพบว่าเป็นสิ่งของชิ้นเดียวกัน สีเดียวกัน หรือลักษณะตรงกัน ให้คะแนนสูง (85-95%)
- หากเป็นสิ่งของคนละประเภทกันอย่างชัดเจน (เช่น ปากกากับกุญแจ) ให้คะแนนต่ำกว่า 20%
- ให้วิเคราะห์เปรียบเทียบรูปภาพประกอบด้วย

ตอบในรูปแบบ JSON ดังนี้เท่านั้น:
{"matchScore": <0-100>, "reasoning": "<สรุปผลการวิเคราะห์รูปภาพและข้อความสั้นๆ 1 ประโยค>"}`
        ];

        // ถ้ามีรูปภาพทั้ง 2 ฝั่ง ให้แนบรูปภาพเข้าไปให้ Gemini วิเคราะห์ด้วย
        if (lostImageUrl) {
          const lostImgPart = await fileToGenerativePart(lostImageUrl);
          if (lostImgPart) contents.push(lostImgPart);
        }
        if (foundImageUrl) {
          const foundImgPart = await fileToGenerativePart(foundImageUrl);
          if (foundImgPart) contents.push(foundImgPart);
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          matchScore = Number(parsed.matchScore) || 0;
          reasoning = parsed.reasoning || '';
        }
      } catch (e) {
        console.error('Gemini Multimodal API Error:', e);
        matchScore = 50;
        reasoning = 'วิเคราะห์ผ่านระบบสำรองเนื่องจากขัดข้องชั่วคราว';
      }
    }

    // เงื่อนไขส่งอีเมลเมื่อคะแนน >= 80%
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