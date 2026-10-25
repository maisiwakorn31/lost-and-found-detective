'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LettersPage() {
  const [user, setUser] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // State สำหรับแชท
  const [activeChat, setActiveChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  
  // State สำหรับเก็บสถานะข้อความที่ยังไม่ได้อ่าน { match_id: boolean }
  const [unreadMap, setUnreadMap] = useState<{ [key: string]: boolean }>({})
  
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchMatchesAndUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      const [lostRes, foundRes, msgRes] = await Promise.all([
        supabase.from('lost_items').select('*').order('created_at', { ascending: false }),
        supabase.from('found_items').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('id, match_id, sender_email, created_at').order('created_at', { ascending: true })
      ])

      const lostItems = lostRes.data || []
      const foundItems = foundRes.data || []
      const allMessages = msgRes.data || []
      const matchedPairs: any[] = []

      // 1. สร้าง Matched Pairs
      lostItems.forEach(lost => {
        foundItems.forEach(found => {
          let score = 30
          const reasons: string[] = []

          if (lost.category && found.category && lost.category === found.category) {
            score += 40
            reasons.push(`หมวดหมู่ตรงกัน (${lost.category})`)
          }

          const lostWords = lost.title.toLowerCase().split(' ')
          const foundTitle = found.title.toLowerCase()
          const matchedTitleWords = lostWords.filter((w: string) => w.length > 1 && foundTitle.includes(w))
          if (matchedTitleWords.length > 0) {
            score += 30
            reasons.push(`ชื่อสิ่งของคล้ายกัน ("${matchedTitleWords.join(', ')}")`)
          }

          const lostLoc = (lost.location || '').toLowerCase()
          const foundLoc = (found.location || '').toLowerCase()
          if (lostLoc && foundLoc && (lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc))) {
            score += 20
            reasons.push(`สถานที่ใกล้เคียงกัน (${found.location})`)
          }

          if (score >= 40) {
            matchedPairs.push({
              id: `${lost.id}-${found.id}`,
              lostItem: lost,
              foundItem: found,
              matchScore: Math.min(score, 99),
              reasons,
              date: new Date(found.created_at).toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            })
          }
        })
      })

      // 2. คำนวณ Unread Messages (เช็คว่ามีข้อความจากผู้อื่นที่ยังไม่ได้อ่านไหม)
      const initialUnreadMap: { [key: string]: boolean } = {}
      
      matchedPairs.forEach(match => {
        const lastReadMsgId = localStorage.getItem(`read_msg_${match.id}`)
        const roomMessages = allMessages.filter(m => m.match_id === match.id)
        
        if (roomMessages.length > 0) {
          const lastMsg = roomMessages[roomMessages.length - 1]
          // ถ้าข้อความล่าสุดไม่ได้มาจากตัวเอง และ ID ข้อความล่าสุดมากกว่าที่เคยกดอ่านไป
          if (lastMsg.sender_email !== session.user.email) {
            if (!lastReadMsgId || Number(lastMsg.id) > Number(lastReadMsgId)) {
              initialUnreadMap[match.id] = true
            }
          }
        }
      })

      setUnreadMap(initialUnreadMap)
      matchedPairs.sort((a, b) => b.matchScore - a.matchScore)
      setMatches(matchedPairs)
      setLoading(false)
    }

    fetchMatchesAndUser()
  }, [router])

  // เปิดแชทแล้วบันทึกว่าอ่านแล้ว
  const handleOpenChat = (match: any) => {
    setActiveChat(match)
    // ลบจุดแดงของคดีนี้
    setUnreadMap(prev => ({ ...prev, [match.id]: false }))
  }

  // ดึงข้อความแชทเมื่อเปิด Modal
  useEffect(() => {
    if (!activeChat) return

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', activeChat.id)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
        if (data.length > 0) {
          const lastMsg = data[data.length - 1]
          localStorage.setItem(`read_msg_${activeChat.id}`, String(lastMsg.id))
        }
      }
    }

    fetchMessages()

    const channel = supabase
      .channel(`room:${activeChat.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${activeChat.id}` }, (payload) => {
        const newMsg = payload.new
        setMessages((prev) => [...prev, newMsg])
        localStorage.setItem(`read_msg_${activeChat.id}`, String(newMsg.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChat])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat) return

    const { data, error } = await supabase.from('messages').insert([
      {
        match_id: activeChat.id,
        sender_email: user.email,
        message: newMessage.trim()
      }
    ]).select()

    if (!error && data && data.length > 0) {
      setNewMessage('')
      localStorage.setItem(`read_msg_${activeChat.id}`, String(data[0].id))
    }
  }

  return (
    <div className="relative min-h-screen w-full text-gray-800 p-6 md:p-10 overflow-x-hidden">
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url('/dashboard.png')` }} />
      <div className="absolute inset-0 bg-black/30 z-0" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white shadow-lg gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="px-3 py-1.5 bg-black/30 hover:bg-black/50 text-amber-200 text-xs font-semibold rounded-xl border border-white/10 transition flex items-center gap-1">
              <span>⬅️</span> กลับหน้าหลัก
            </button>
            <h1 className="text-xl md:text-2xl font-bold tracking-wide flex items-center gap-2">
              <span>✉️</span> จดหมายแจ้งเบาะแสและห้องสืบสวน
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-white py-20 font-semibold">กำลังตรวจสอบเอกสารลับและรวบรวมเบาะแส...</div>
        ) : matches.length === 0 ? (
          <div className="text-center text-white py-20 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
            <p className="text-lg">📭 ยังไม่มีจดหมายแจ้งเตือนเบาะแสที่เชื่อมโยงกันในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {matches.map((match) => {
              const hasUnread = unreadMap[match.id]

              return (
                <div key={match.id} className="relative bg-amber-50/95 backdrop-blur-md rounded-lg shadow-2xl p-6 border border-amber-200 flex flex-col justify-between">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full shadow-md border border-red-800 z-20" />

                  <div className="flex justify-between items-center border-b border-amber-200 pb-3 mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 bg-yellow-300 text-gray-900 rounded-md">
                      🎯 ความน่าจะเป็น: {match.matchScore}%
                    </span>
                    <span className="text-[11px] text-gray-500">📅 {match.date}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-2">
                    <div className="bg-white/80 p-3 rounded border border-gray-200 flex flex-col items-center text-center shadow-inner">
                      <span className="text-[10px] font-bold text-blue-600 mb-1">🔍 ของที่แจ้งหาย</span>
                      <div className="w-20 h-20 rounded overflow-hidden mb-2 bg-gray-100">
                        <img src={match.lostItem.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <h4 className="font-bold text-xs text-gray-800 truncate w-full">{match.lostItem.title}</h4>
                      <p className="text-[10px] text-gray-500">📍 {match.lostItem.location}</p>
                    </div>

                    <div className="bg-white/80 p-3 rounded border border-gray-200 flex flex-col items-center text-center shadow-inner">
                      <span className="text-[10px] font-bold text-red-600 mb-1">📌 ของที่มีผู้พบ</span>
                      <div className="w-20 h-20 rounded overflow-hidden mb-2 bg-gray-100">
                        <img src={match.foundItem.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <h4 className="font-bold text-xs text-gray-800 truncate w-full">{match.foundItem.title}</h4>
                      <p className="text-[10px] text-gray-500">📍 {match.foundItem.location}</p>
                    </div>
                  </div>

                  <div className="mt-3 bg-amber-100/60 p-2.5 rounded border border-amber-200 text-[11px] text-amber-900">
                    <p className="font-bold mb-1">🕵️‍♂️ ตรวจพบความคล้ายคลึงจาก:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px] text-amber-800">
                      {match.reasons.map((reason: string, idx: number) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-200 flex justify-end">
                    {/* ปุ่มเปิดซองจดหมาย พร้อมจุดแจ้งเตือนสีแดง (Notification Badge) */}
                    <button 
                      onClick={() => handleOpenChat(match)}
                      className="relative px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded shadow transition flex items-center gap-1.5"
                    >
                      {hasUnread && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border border-white"></span>
                        </span>
                      )}
                      <span>✉️</span> เปิดซองจดหมาย (เข้าห้องแชท)
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal ห้องแชท */}
        {activeChat && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-amber-50 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-amber-300 flex flex-col h-[550px]">
              <div className="bg-amber-800 text-white p-4 flex justify-between items-center shadow">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span>🕵️‍♂️</span> ห้องสอบสวนลับเคสเบาะแส
                  </h3>
                  <p className="text-[11px] text-amber-200">
                    หาย: {activeChat.lostItem.title} ⇄ พบ: {activeChat.foundItem.title}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveChat(null)} 
                  className="bg-amber-900 hover:bg-amber-950 px-3 py-1 rounded text-xs font-semibold transition"
                >
                  ✕ ปิด
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-amber-100/40">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs py-10">
                    ยังไม่มีข้อความสนทนา เริ่มส่งข้อความทักทายเพื่อประสานงานรับคืนทรัพย์สินได้เลยครับ
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMyMessage = msg.sender_email === user?.email
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-gray-500 mb-0.5 px-1">{msg.sender_email}</span>
                        <div className={`max-w-[75%] px-3.5 py-2 rounded-xl text-xs shadow ${isMyMessage ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-amber-200'}`}>
                          {msg.message}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-amber-200 flex gap-2">
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder="พิมพ์ข้อความนัดหมายหรือสอบถามเบาะแส..." 
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  ส่ง
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}