'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AIMatchingPage() {
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function runRealAIMatching() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // 1. ดึงข้อมูลรายการของหายและของที่พบจาก Supabase
      const [lostRes, foundRes] = await Promise.all([
        supabase.from('lost_items').select('*').order('created_at', { ascending: false }),
        supabase.from('found_items').select('*').order('created_at', { ascending: false })
      ])

      const lostItems = lostRes.data || []
      const foundItems = foundRes.data || []

      // 2. ส่งข้อมูลไปประมวลผลผ่าน Gemini API ใน Backend (`/api/ai-match`)
      const matchPromises = lostItems.flatMap(lost =>
        foundItems.map(async (found) => {
          try {
            const res = await fetch('/api/ai-match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lostItem: lost,
                foundItem: found,
                lostItemOwnerId: lost.user_id || lost.owner_id // ส่ง ID เจ้าของของหายไปส่งอีเมล
              })
            })

            const data = await res.json()

            // เก็บผลลัพธ์เฉพาะคู่ที่ AI จริงให้คะแนน >= 30%
            if (data.success && data.matchScore >= 30) {
              return {
                id: `${lost.id}-${found.id}`,
                lost,
                found,
                matchScore: data.matchScore,
                detectiveNotes: data.analysis
              }
            }
          } catch (err) {
            console.error('Matching Error:', err)
          }
          return null
        })
      )

      // รอให้ Gemini AI ประมวลผลเสร็จทุกคู่
      const results = await Promise.all(matchPromises)
      const validPairs = results.filter((item): item is any => item !== null)

      // เรียงลำดับรายการที่มีคะแนนความสอดคล้องมากที่สุดขึ้นก่อน
      validPairs.sort((a, b) => b.matchScore - a.matchScore)

      setAnalyses(validPairs)
      setLoading(false)
    }

    runRealAIMatching()
  }, [router])

  return (
    <div className="relative min-h-screen w-full text-gray-800 p-6 md:p-10 overflow-x-hidden">
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url('/dashboard.png')` }} />
      <div className="absolute inset-0 bg-black/30 z-0" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white shadow-lg">
          <button onClick={() => router.push('/')} className="px-3 py-1.5 bg-black/30 hover:bg-black/50 text-amber-200 text-xs font-semibold rounded-xl border border-white/10 transition">
            ⬅️ กลับหน้าหลัก
          </button>
          <h1 className="text-xl font-bold">🤖 ระบบ AI สรุปสำนวนและวิเคราะห์สิ่งของใกล้เคียง</h1>
        </div>

        {loading ? (
          <div className="text-center text-white py-20 font-semibold">🔍 AI (Gemini) กำลังตรวจสอบลักษณะสิ่งของและวิเคราะห์หลักฐาน...</div>
        ) : analyses.length === 0 ? (
          <div className="text-center text-white py-20 bg-black/20 rounded-xl">📭 AI ไม่พบสิ่งของที่มีลักษณะสอดคล้องกัน</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analyses.map((item) => (
              <div key={item.id} className="bg-amber-50/95 backdrop-blur-md rounded-lg p-5 border border-amber-200 shadow-xl relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-600 rounded-full shadow border border-purple-800" />
                
                <div className="flex justify-between items-center mb-3 border-b border-amber-200 pb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                    item.matchScore >= 80 
                      ? 'bg-emerald-200 text-emerald-900 border border-emerald-400' 
                      : 'bg-purple-200 text-purple-900'
                  }`}>
                    🎯 ความมั่นใจของ AI: {item.matchScore}% {item.matchScore >= 80 ? '(ส่งอีเมลแจ้งเตือนแล้ว)' : ''}
                  </span>
                </div>

                {/* ส่วนแสดงรูปภาพและรายละเอียดเปรียบเทียบ */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  {/* ฝั่งของหาย */}
                  <div className="bg-white p-2 rounded border shadow-inner flex flex-col items-center text-center">
                    {item.lost.image_url && (
                      <div className="w-full h-24 rounded overflow-hidden mb-2 bg-gray-100">
                        <img src={item.lost.image_url} alt={item.lost.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="font-bold text-blue-600 truncate w-full">หาย: {item.lost.title}</p>
                    <p className="text-gray-500 text-[10px]">📍 {item.lost.location}</p>
                  </div>

                  {/* ฝั่งของที่พบ */}
                  <div className="bg-white p-2 rounded border shadow-inner flex flex-col items-center text-center">
                    {item.found.image_url && (
                      <div className="w-full h-24 rounded overflow-hidden mb-2 bg-gray-100">
                        <img src={item.found.image_url} alt={item.found.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="font-bold text-red-600 truncate w-full">พบ: {item.found.title}</p>
                    <p className="text-gray-500 text-[10px]">📍 {item.found.location}</p>
                  </div>
                </div>

                <div className="bg-amber-100/70 p-3 rounded text-xs text-amber-900 border border-amber-300">
                  <p className="font-bold mb-1">🕵️‍♂️ บันทึกข้อความจาก AI Detective:</p>
                  <p>{item.detectiveNotes}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}