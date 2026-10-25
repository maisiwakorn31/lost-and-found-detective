'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<any[]>([])
  const [lostItems, setLostItems] = useState<any[]>([])
  const [foundItems, setFoundItems] = useState<any[]>([])
  const [matchPairs, setMatchPairs] = useState<any[]>([])
  const [stats, setStats] = useState({ totalLost: 0, totalFound: 0, totalMatches: 0 })
  const [loading, setLoading] = useState(true)

  // State สำหรับควบคุมการเปิด Modal ดูรายละเอียดแต่ละเมนู
  const [activeModal, setActiveModal] = useState<'lost' | 'found' | 'matches' | null>(null)

  const router = useRouter()

  useEffect(() => {
    const isAuth = localStorage.getItem('isAdminAuthenticated')
    if (!isAuth) {
      router.push('/admin/login')
      return
    }

    async function fetchAdminData() {
      try {
        const [profileRes, lostRes, foundRes] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('lost_items').select('*').order('created_at', { ascending: false }),
          supabase.from('found_items').select('*').order('created_at', { ascending: false })
        ])

        const profiles = profileRes.data || []
        const lost = lostRes.data || []
        const found = foundRes.data || []

        // จัดรูปแบบรายชื่อผู้ใช้
        const userList = profiles.map(p => ({
          full_name: p.full_name || p.email?.split('@')[0] || 'ไม่ระบุชื่อ',
          email: p.email || 'N/A',
          student_id: p.student_id || 'N/A',
          major: p.major || 'N/A'
        }))

        // คำนวณคู่แมตช์
        const pairs: any[] = []
        lost.forEach(l => {
          found.forEach(f => {
            let score = 30
            const reasons: string[] = []

            if (l.category && f.category && l.category === f.category) {
              score += 40
              reasons.push(`หมวดหมู่ตรงกัน (${l.category})`)
            }

            const lostWords = (l.title || '').toLowerCase().split(' ')
            const foundTitle = (f.title || '').toLowerCase()
            const matchedWords = lostWords.filter((w: string) => w.length > 1 && foundTitle.includes(w))
            if (matchedWords.length > 0) {
              score += 30
              reasons.push(`ชื่อสิ่งของคล้ายกัน ("${matchedWords.join(', ')}")`)
            }

            const lostLoc = (l.location || '').toLowerCase()
            const foundLoc = (f.location || '').toLowerCase()
            if (lostLoc && foundLoc && (lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc))) {
              score += 20
              reasons.push(`สถานที่ใกล้เคียง (${f.location})`)
            }

            if (score >= 40) {
              pairs.push({
                id: `${l.id}-${f.id}`,
                lostItem: l,
                foundItem: f,
                matchScore: Math.min(score, 99),
                reasons
              })
            }
          })
        })

        pairs.sort((a, b) => b.matchScore - a.matchScore)

        setUsers(userList)
        setLostItems(lost)
        setFoundItems(found)
        setMatchPairs(pairs)
        setStats({
          totalLost: lost.length,
          totalFound: found.length,
          totalMatches: pairs.length
        })
      } catch (err) {
        console.error("Admin fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated')
    router.push('/admin/login')
  }

  return (
    <div className="relative min-h-screen w-full text-gray-800 p-6 md:p-10 overflow-x-hidden">
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url('/dashboard.png')` }} />
      <div className="absolute inset-0 bg-black/30 z-0" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white shadow-lg">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>🛡️</span> Admin Command Center (แดชบอร์ดผู้ดูแลระบบ)
          </h1>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition">
            ออกจากระบบแอดมิน
          </button>
        </div>

        {loading ? (
          <div className="text-center text-white py-20 font-semibold">กำลังโหลดข้อมูลระบบ...</div>
        ) : (
          <div className="space-y-8">
            {/* สถิติภาพรวม (คลิกเพื่อดูรายละเอียดแต่ละเมนูได้) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* การ์ดที่ 1: เคสของหาย */}
              <div 
                onClick={() => setActiveModal('lost')}
                className="bg-amber-50/95 backdrop-blur-md p-5 rounded-lg border border-amber-200 shadow-xl text-center cursor-pointer hover:scale-105 hover:bg-amber-100 transition duration-300 relative group"
              >
                <div className="absolute top-2 right-2 text-xs text-amber-700 bg-amber-200 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">คลิกดูรายการ 🔍</div>
                <span className="text-3xl">🔍</span>
                <h3 className="text-sm font-bold text-gray-600 mt-2">เคสของหายทั้งหมด</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalLost} เคส</p>
              </div>

              {/* การ์ดที่ 2: รายการพบเจอของ */}
              <div 
                onClick={() => setActiveModal('found')}
                className="bg-amber-50/95 backdrop-blur-md p-5 rounded-lg border border-amber-200 shadow-xl text-center cursor-pointer hover:scale-105 hover:bg-amber-100 transition duration-300 relative group"
              >
                <div className="absolute top-2 right-2 text-xs text-amber-700 bg-amber-200 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">คลิกดูรายการ 📌</div>
                <span className="text-3xl">📌</span>
                <h3 className="text-sm font-bold text-gray-600 mt-2">รายการพบเจอของ</h3>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.totalFound} รายการ</p>
              </div>

              {/* การ์ดที่ 3: สถิติการแมตช์ */}
              <div 
                onClick={() => setActiveModal('matches')}
                className="bg-amber-50/95 backdrop-blur-md p-5 rounded-lg border border-amber-200 shadow-xl text-center cursor-pointer hover:scale-105 hover:bg-amber-100 transition duration-300 relative group"
              >
                <div className="absolute top-2 right-2 text-xs text-amber-700 bg-amber-200 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">คลิกดูรายการ 🤖</div>
                <span className="text-3xl">🤖</span>
                <h3 className="text-sm font-bold text-gray-600 mt-2">สถิติการแมตช์ (Matches)</h3>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalMatches} คู่ความน่าจะเป็น</p>
              </div>

            </div>

            {/* ตารางรายชื่อผู้ใช้งานทั้งหมด */}
            <div className="bg-amber-50/95 backdrop-blur-md rounded-lg p-6 border border-amber-200 shadow-xl">
              <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                <span>👥</span> รายชื่อผู้ใช้งานทั้งหมดในระบบ ({users.length} คน)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-200/70 text-amber-900 border-b border-amber-300">
                      <th className="p-3">ชื่อ-นามสกุล / ชื่อผู้ใช้</th>
                      <th className="p-3">อีเมล</th>
                      <th className="p-3">รหัสนิสิต</th>
                      <th className="p-3">สาขา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">ยังไม่มีผู้ใช้งานในระบบ</td>
                      </tr>
                    ) : (
                      users.map((u, index) => (
                        <tr key={index} className="border-b border-amber-200 hover:bg-white/50">
                          <td className="p-3 font-semibold text-gray-800">{u.full_name}</td>
                          <td className="p-3 text-gray-600">{u.email}</td>
                          <td className="p-3 text-blue-700 font-mono">{u.student_id}</td>
                          <td className="p-3 text-gray-700">{u.major}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: แสดงรายละเอียดเมื่อคลิกการ์ด */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-amber-50 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-amber-300 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="bg-amber-800 text-white p-4 flex justify-between items-center shadow">
              <h3 className="font-bold text-sm flex items-center gap-2">
                {activeModal === 'lost' && '🔍 รายการเคสของหายทั้งหมด'}
                {activeModal === 'found' && '📌 รายการพบเจอของทั้งหมด'}
                {activeModal === 'matches' && '🤖 รายการคู่ความน่าจะเป็น (AI Matching)'}
              </h3>
              <button 
                onClick={() => setActiveModal(null)} 
                className="bg-amber-900 hover:bg-amber-950 px-3 py-1 rounded text-xs font-semibold transition"
              >
                ✕ ปิด
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-amber-100/30">
              
              {/* 1. กรณีดูเคสของหาย */}
              {activeModal === 'lost' && (
                lostItems.length === 0 ? <p className="text-center text-gray-500 text-xs py-10">ยังไม่มีเคสของหายในระบบ</p> :
                lostItems.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm flex items-center gap-4">
                    {item.image_url && <img src={item.image_url} alt="" className="w-16 h-16 object-cover rounded border" />}
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-blue-700">{item.title}</h4>
                      <p className="text-[11px] text-gray-600">📍 สถานที่: {item.location} | หมวดหมู่: {item.category}</p>
                      <p className="text-[10px] text-gray-400">👤 ผู้แจ้ง: {item.user_email || 'ไม่ระบุ'} | 📅 {new Date(item.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                ))
              )}

              {/* 2. กรณีดูรายการพบเจอของ */}
              {activeModal === 'found' && (
                foundItems.length === 0 ? <p className="text-center text-gray-500 text-xs py-10">ยังไม่มีรายการพบเจอของในระบบ</p> :
                foundItems.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm flex items-center gap-4">
                    {item.image_url && <img src={item.image_url} alt="" className="w-16 h-16 object-cover rounded border" />}
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-red-600">{item.title}</h4>
                      <p className="text-[11px] text-gray-600">📍 จุดที่พบ: {item.location} | หมวดหมู่: {item.category}</p>
                      <p className="text-[10px] text-gray-400">👤 ผู้พบ: {item.user_email || 'ไม่ระบุ'} | 📅 {new Date(item.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                ))
              )}

              {/* 3. กรณีดูสถิติการแมตช์ */}
              {activeModal === 'matches' && (
                matchPairs.length === 0 ? <p className="text-center text-gray-500 text-xs py-10">ยังไม่พบข้อมูลความเชื่อมโยงของสิ่งของ</p> :
                matchPairs.map(match => (
                  <div key={match.id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">🎯 ความมั่นใจ: {match.matchScore}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="font-bold text-blue-600">หาย: {match.lostItem.title}</p>
                        <p className="text-[10px] text-gray-500">📍 {match.lostItem.location}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="font-bold text-red-600">พบ: {match.foundItem.title}</p>
                        <p className="text-[10px] text-gray-500">📍 {match.foundItem.location}</p>
                      </div>
                    </div>
                    <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
                      <b>เหตุผลที่แมตช์:</b> {match.reasons.join(', ')}
                    </div>
                  </div>
                ))
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  )
}