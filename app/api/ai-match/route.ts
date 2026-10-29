export const runtime = 'edge';

import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMatchNotificationEmail } from '@/lib/email';

// ตั้งค่า Supabase Client สำหรับดึงข้อมูลผู้ใช้งานใน Edge Runtime
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// กำหนดค่าเริ่มต้นให้กับ Gemini AI (พร้อมสำรองตัวแปรตอน Build)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'placeholder-api-key'
});

export async function POST(request: Request) {
  // ตรวจสอบ API Key เบื้องต้น
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { lostItem, foundItem, lostItemOwnerId } = body;

    // 1. ดึงข้อมูลสิ่งของที่จะนำมาเปรียบเทียบ
    const lostTitle = lostItem?.title || 'สิ่งของที่สูญหาย';
    const lostCategory = lostItem?.category || 'อื่นๆ';
    const lostDesc = lostItem?.description || '-';
    const lostLocation = lostItem?.location || '-';

    const foundTitle = foundItem?.title || 'สิ่งของที่พบเจอ';
    const foundCategory = foundItem?.category || 'อื่นๆ';
    const foundDesc = foundItem?.description || '-';
    const foundLocation = foundItem?.location || '-';

    // 2. สร้าง Prompt ที่มี Strict Rules ป้องกัน AI ให้คะแนนผิดประเภท
    const prompt = `คุณคือระบบ AI Detective วิเคราะห์และจับคู่ของหาย (Lost & Found Matching System)
โปรดวิเคราะห์ข้อมูลสิ่งของ 2 ชิ้นด้านล่างนี้ และคำนวณคะแนนความสอดคล้อง (0 - 100%):

[รายการที่ 1 - ของหาย]
- ชื่อ: ${lostTitle} (- ${lostDesc}) - สถานที่: ${lostLocation}

[รายการที่ 2 - ของที่พบ]
- ชื่อ: ${foundTitle} (- ${foundDesc}) - สถานที่: ${foundLocation}

กฎการให้คะแนน:
- หากเป็นสิ่งของประเภทเดียวกัน (เช่น ปากกากับปากกา) ให้คะแนนเริ่มต้นที่ 70% ทันที
- หากสถานที่ใกล้เคียงกัน ให้บวกเพิ่มจนถึง 80-95%
- หากคนละประเภทกันให้ให้คะแนนต่ำกว่า 20%

ตอบกลับเป็น JSON Format เท่านั้น:
{
  "matchScore": <ตัวเลข 0-100>,
  "reasoning": "<สรุปเหตุผลสั้นๆ>"
}`;

    // เรียก Gemini AI เพื่อวิเคราะห์
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const aiResultText = response.text || '';

    // 3. สกัดค่า matchScore และ reasoning จาก AI Response JSON
    let matchScore = 0;
    let reasoning = 'ไม่สามารถวิเคราะห์ข้อมูลได้';

    try {
      // ดึงเฉพาะข้อความส่วนที่เป็น JSON
      const jsonMatch = aiResultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        matchScore = Number(parsed.matchScore) || 0;
        reasoning = parsed.reasoning || aiResultText;
      } else {
        reasoning = aiResultText;
      }
    } catch (parseError) {
      console.error('Failed to parse AI JSON output:', parseError);
      reasoning = aiResultText;
    }

    // 4. เงื่อนไขการแจ้งเตือน: หากเปอร์เซ็นต์ความสอดคล้องจาก AI จริง >= 80% ให้ส่งอีเมลหาเจ้าของ
    if (matchScore >= 80 && lostItemOwnerId) {
      // ดึงข้อมูลอีเมลและชื่อของผู้แจ้งของหายจากตาราง profiles ใน Supabase
      const { data: userData, error: userError } = await (supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', lostItemOwnerId)
        .single() as any);

      if (!userError && userData && userData.email) {
        // เรียกใช้งานฟังก์ชันส่งอีเมล (Async Background)
        sendMatchNotificationEmail({
          toEmail: userData.email as string,
          ownerName: (userData.full_name as string) || 'ผู้ใช้งานระบบ',
          itemTitle: lostTitle,
          matchScore: matchScore,
          matchDetailUrl: `https://beb4804d.lost-and-found-detective.pages.dev/ai-matching`,
        }).catch((err) => console.error('Email send background error:', err));
      }
    }

    // 5. ส่งผลลัพธ์การวิเคราะห์จริงกลับไปยัง Frontend
    return NextResponse.json({
      success: true,
      matchScore: matchScore,
      analysis: reasoning,
    });

  } catch (error) {
    console.error('AI Match API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}