export const runtime = 'edge';

import { GoogleGenAI } from '@google/genai'; // หรือไลบรารีที่คุณใช้งานอยู่
import { NextResponse } from 'next/server';

// ใส่ค่าสำรองชั่วคราวตอน Build
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || 'placeholder-api-key' 
});

export async function POST(request: Request) {
  // หาก API Key เป็นตัว placeholder ให้แจ้งเตือน หรือปล่อยผ่านตอน Build
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
  }

  try {
    // โค้ดเรียกใช้งาน AI เดิมของคุณ...
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}