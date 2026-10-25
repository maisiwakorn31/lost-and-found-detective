import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(request: Request) {
  try {
    const { lostItem, foundItem } = await request.json()

    if (!lostItem || !foundItem) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
    }

    const prompt = `
      คุณคือนักสืบผู้เชี่ยวชาญด้านการวิเคราะห์หลักฐาน จงเปรียบเทียบสิ่งของสองชิ้นนี้ว่ามีความเกี่ยวข้องกันหรือเป็นชิ้นเดียวกันหรือไม่:
      
      1. ของที่แจ้งหาย:
      - ชื่อ: ${lostItem.title}
      - หมวดหมู่: ${lostItem.category}
      - สถานที่: ${lostItem.location}
      - รายละเอียด: ${lostItem.description || '-'}

      2. ของที่มีผู้พบ:
      - ชื่อ: ${foundItem.title}
      - หมวดหมู่: ${foundItem.category}
      - สถานที่: ${foundItem.location}
      - รายละเอียด: ${foundItem.description || '-'}

      ตอบกลับเป็น JSON บริสุทธิ์เท่านั้น (ไม่ต้องมี markdown code block) ในรูปแบบ:
      {"matchScore": 85, "isMatch": true, "detectiveNotes": "คำวิเคราะห์สั้นๆ"}
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    // ดึงข้อความจาก response (สำหรับ SDK @google/genai)
    const textResult = response.text || ''
    
    // ดึงเฉพาะ JSON string
    const jsonMatch = textResult.match(/\{[\s\S]*\}/)
    const result = jsonMatch 
      ? JSON.parse(jsonMatch[0]) 
      : { matchScore: 0, isMatch: false, detectiveNotes: "ไม่สามารถพาร์สผลลัพธ์จาก AI ได้" }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("AI Match Error:", error)
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 })
  }
}