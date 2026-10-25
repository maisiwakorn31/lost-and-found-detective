'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AIMatchingPage() {
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function runLocalAIMatching() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // ดึงข้อมูลของหายและของที่พบ
      const [lostRes, foundRes] = await Promise.all([
        supabase.from('lost_items').select('*').order('created_at', { ascending: false }),
        supabase.from('found_items').select('*').order('created_at', { ascending: false })
      ])

      const lostItems = lostRes.data || []
      const foundItems = foundRes.data || []
      const pairs: any[] = []

      // ระบบวิเคราะห์จำลองการทำงานของ AI (Smart Detective Scoring)
      lostItems.forEach(lost => {
        foundItems.forEach(found => {
          let score = 30
          const notes: string[] = []

          // 1. เช็คหมวดหมู่
          if (lost.category === found.category) {
            score += 40
            notes.push(`หมวดหมู่ตรงกัน (${lost.category}) ซึ่งเป็นจุดเชื่อมโยงสำคัญของคดี`)
          } else {
            notes.push(`หมวดหมู่แตกต่างกันเล็กน้อย แต่รูปพรรณอาจคาดเคลื่อนได้`)
          }

          // 2. เช็คสถานที่
          const lostLoc = (lost.location || '').toLowerCase()
          const foundLoc = (found.location || '').toLowerCase()
          if (lostLoc && foundLoc && (lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc))) {
            score += 20
            notes.push(`พิกัดจุดเกิดเหตุและจุดพบเจออยู่ในบริเวณใกล้เคียงกัน (${found.location})`)
          }

          // 3. เช็คชื่อสิ่งของ
          const lostWords = lost.title.toLowerCase().split(' ')
          const foundTitle = found.title.toLowerCase()
          const matchedWords = lostWords.filter((w: string) => w.length > 1 && foundTitle.includes(w))
          if (matchedWords.length > 0) {
            score += 10
            notes.push(`ตรวจพบรูปพรรณสัณฐานและชื่อเรียกที่สอดคล้องกัน ("${matchedWords.join(', ')}")`)
          }

          // คัดเฉพาะคู่ที่มีคะแนนความน่าจะเป็น 50% ขึ้นไป
          if (score >= 50) {
            pairs.push({
              id: `${lost.id}-${found.id}`,
              lost,
              found,
              matchScore: Math.min(score, 98),
              detectiveNotes: notes.join(' อีกทั้ง ') + ' สรุปรูปสำนวนมีความสอดคล้องควรเรียกสอบสวนเพิ่มเติม'
            })
          }
        })
      })

      pairs.sort((a, b) => b.matchScore - a.matchScore)
      setAnalyses(pairs)
      setLoading(false)
    }

    runLocalAIMatching()
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
          <div className="text-center text-white py-20 font-semibold">🔍 AI กำลังตรวจสอบลายนิ้วมือและวิเคราะห์หลักฐาน...</div>
        ) : analyses.length === 0 ? (
          <div className="text-center text-white py-20 bg-black/20 rounded-xl">📭 AI ยังไม่พบหลักฐานที่เชื่อมโยงกันอย่างมีนัยสำคัญ</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analyses.map((item) => (
              <div key={item.id} className="bg-amber-50/95 backdrop-blur-md rounded-lg p-5 border border-amber-200 shadow-xl relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-600 rounded-full shadow border border-purple-800" />
                
                <div className="flex justify-between items-center mb-3 border-b border-amber-200 pb-2">
                  <span className="text-xs font-bold bg-purple-200 text-purple-900 px-2.5 py-1 rounded">
                    🎯 ความมั่นใจของ AI: {item.matchScore}%
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