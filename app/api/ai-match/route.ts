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

    // 1. จำลองหรือดึงค่าข้อมูลที่ใช้ในการเปรียบเทียบ
    const lostItemTitle = lostItem?.title || 'สิ่งของที่สูญหาย';
    const foundItemTitle = foundItem?.title || 'สิ่งของที่พบเจอ';

    // ตัวอย่างการเรียกใช้งาน Gemini AI เพื่อวิเคราะห์ความสอดคล้อง (Semantic Matching)
    const prompt = `เปรียบเทียบสิ่งของสองชิ้นนี้ว่ามีความเหมือนหรือเชื่อมโยงกันมากน้อยแค่ไหน ให้ตอบกลับเป็นตัวเลขเปอร์เซ็นต์ (0-100) และเหตุผลสั้นๆ:
    - ของหาย: ${lostItemTitle} (${lostItem?.description || '-'})
    - ของที่พบ: ${foundItemTitle} (${foundItem?.description || '-'})`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const aiResultText = response.text || '';
    
    // สมมติว่าระบบคำนวณหรือดึงค่า matchScore ออกมาได้ (ตัวอย่างกำหนดจำลองหรือแปลงจาก AI Response)
    // ในการใช้งานจริง สามารถให้ AI ส่งค่าตัวเลขคะแนนกลับมา หรือใช้ฟังก์ชันคำนวณของคุณ
    const matchScore = 85; // ตัวอย่างคะแนนที่ผ่านเกณฑ์ 80%

    // 2. เงื่อนไขการแจ้งเตือน: หากเปอร์เซ็นต์ความสอดคล้อง >= 80% ให้ส่งอีเมลหาเจ้าของทันที
    if (matchScore >= 80 && lostItemOwnerId) {
      // ดึงข้อมูลอีเมลและชื่อของผู้แจ้งของหายจากตาราง profiles ใน Supabase
      const { data: userData, error: userError } = await (supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', lostItemOwnerId)
        .single() as any);

      if (!userError && userData && userData.email) {
        // เรียกใช้งานฟังก์ชันส่งอีเมล (ทำงานแบบ Background / Async ไม่บล็อก Response หลัก)
        sendMatchNotificationEmail({
          toEmail: userData.email as string,
          ownerName: (userData.full_name as string) || 'ผู้ใช้งานระบบ',
          itemTitle: lostItemTitle,
          matchScore: matchScore,
          matchDetailUrl: `https://beb4804d.lost-and-found-detective.pages.dev/ai-matching`,
        }).catch((err) => console.error('Email send background error:', err));
      }
    }

    // 3. ส่งผลลัพธ์กลับไปยัง Client
    return NextResponse.json({
      success: true,
      matchScore: matchScore,
      analysis: aiResultText,
    });

  } catch (error) {
    console.error('AI Match API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}