'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LostItemsPage() {
  const [user, setUser] = useState<any>(null)
  const [lostItems, setLostItems] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkUserAndFetchData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      // ดึงข้อมูลจากตาราง lost_items
      const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching lost items:', error)
      } else if (data) {
        const pinColors = [
          'bg-blue-600 border-blue-800',
          'bg-indigo-600 border-indigo-800',
          'bg-cyan-600 border-cyan-800',
          'bg-sky-600 border-sky-800',
          'bg-teal-600 border-teal-800'
        ]
        const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2']

        const formattedData = data.map((item, index) => ({
          ...item,
          pinColor: pinColors[index % pinColors.length],
          rotate: rotations[index % rotations.length],
          date: new Date(item.created_at).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        }))
        setLostItems(formattedData)
      }
      setLoading(false)
    }

    checkUserAndFetchData()
  }, [router])

  // กรองข้อมูลตามหมวดหมู่
  const filteredItems = selectedCategory === 'ทั้งหมด' 
    ? lostItems 
    : lostItems.filter(item => item.category === selectedCategory)

  return (
    <div className="relative min-h-screen w-full text-gray-800 p-6 md:p-10 overflow-x-hidden">
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url('/dashboard.png')` }} />
      <div className="absolute inset-0 bg-black/30 z-0" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white shadow-lg gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="px-3 py-1.5 bg-black/30 hover:bg-black/50 text-amber-200 text-xs font-semibold rounded-xl border border-white/10 transition flex items-center gap-1">
              <span>⬅️</span> กลับหน้าหลัก
            </button>
            <h1 className="text-xl md:text-2xl font-bold tracking-wide flex items-center gap-2">
              <span>🔍</span> รายการของหายทั้งหมด (Lost Items)
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/lost/report')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5">
              <span>➕</span> เปิดเคสของหาย
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {['ทั้งหมด', 'อิเล็กทรอนิกส์', 'กระเป๋า', 'กุญแจ', 'ของใช้ส่วนตัว', 'อื่นๆ'].map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-md font-semibold text-xs transition transform hover:-translate-y-0.5 shadow-md ${selectedCategory === cat ? 'bg-blue-600 text-white ring-2 ring-white scale-105 rotate-0' : 'bg-amber-100/90 text-gray-700 hover:bg-amber-200 rotate-1'}`}>
              🏷️ {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-white py-20 font-semibold">กำลังสืบสวนหาข้อมูลของหาย...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-white py-20 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
            <p className="text-lg">📭 ยังไม่มีบันทึกเคสของหายในหมวดหมู่นี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pt-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="relative w-full max-w-xs mx-auto">
                <div className="absolute inset-0 bg-white/70 rounded-sm shadow-xl transform rotate-3 scale-105 pointer-events-none border border-gray-300" />
                <div onClick={() => alert(`ดูรายละเอียดเคสของหาย: ${item.title}`)} className={`bg-white rounded-sm shadow-2xl p-3 pb-6 transform ${item.rotate} hover:rotate-0 hover:scale-105 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full`}>
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full shadow-md border z-20 ${item.pinColor}`} />
                  <div className="h-60 w-full rounded-sm overflow-hidden mb-3 bg-gray-100 shadow-inner">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="flex flex-col gap-1 text-center">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{item.title}</h3>
                    <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
                      <span>📍</span> {item.location}
                    </p>
                    <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-100 pt-2">
                      <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-700 font-medium">{item.category}</span>
                      <span>📅 {item.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}