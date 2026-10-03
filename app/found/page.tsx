'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ตัวอย่างข้อมูลจำลองรายการของที่พบ (Mock Data) พร้อมหมวดหมู่ "อื่นๆ"
const MOCK_FOUND_ITEMS = [
  {
    id: 1,
    title: 'กระเป๋าสตางค์หนังสีน้ำตาล',
    category: 'กระเป๋า',
    location: 'โรงอาหารคณะวิศวะฯ',
    date: '2 ต.ค. 2026',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=600&auto=format&fit=crop',
    pinColor: 'bg-red-600 border-red-800',
    rotate: '-rotate-2'
  },
  {
    id: 2,
    title: 'กุญแจรถ Honda พร้อมรีโมท',
    category: 'กุญแจ',
    location: 'ลานจอดรถตึก A',
    date: '3 ต.ค. 2026',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=600&auto=format&fit=crop',
    pinColor: 'bg-blue-600 border-blue-800',
    rotate: 'rotate-1'
  },
  {
    id: 3,
    title: 'iPad Pro สี Space Gray',
    category: 'อิเล็กทรอนิกส์',
    location: 'ห้องสมุดกลาง ชั้น 2',
    date: '1 ต.ค. 2026',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop',
    pinColor: 'bg-yellow-500 border-yellow-700',
    rotate: '-rotate-1'
  },
  {
    id: 4,
    title: 'ร่มพับกันยูวี ลายทาง',
    category: 'ของใช้ส่วนตัว',
    location: 'ป้ายรถเมล์หน้ามอ',
    date: '30 ก.ย. 2026',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    pinColor: 'bg-green-600 border-green-800',
    rotate: 'rotate-2'
  },
  {
    id: 5,
    title: 'หนังสือเรียน Computer Architecture',
    category: 'อื่นๆ',
    location: 'ตึกเรียนรวม 3',
    date: '28 ก.ย. 2026',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop',
    pinColor: 'bg-purple-600 border-purple-800',
    rotate: '-rotate-1'
  }
]

export default function FoundItemsPage() {
  const [user, setUser] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด')
  const router = useRouter()

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
    }
    checkUser()
  }, [router])

  // กรองข้อมูลตามหมวดหมู่
  const filteredItems = selectedCategory === 'ทั้งหมด' 
    ? MOCK_FOUND_ITEMS 
    : MOCK_FOUND_ITEMS.filter(item => item.category === selectedCategory)

  return (
    <div className="relative min-h-screen w-full text-gray-800 p-6 md:p-10 overflow-x-hidden">
      
      {/* รูปพื้นหลังบอร์ดสืบสวน */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url('/dashboard.png')` }}
      />
      <div className="absolute inset-0 bg-black/30 z-0" />

      <div className="relative z-10 max-w-6xl mx-auto">
        
        {/* แถบ Header ด้านบน */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white shadow-lg gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/')}
              className="px-3 py-1.5 bg-black/30 hover:bg-black/50 text-amber-200 text-xs font-semibold rounded-xl border border-white/10 transition flex items-center gap-1"
            >
              <span>⬅️</span> กลับหน้าหลัก
            </button>
            <h1 className="text-xl md:text-2xl font-bold tracking-wide flex items-center gap-2">
              <span>📌</span> รายการพบเจอสิ่งของ (Found Items)
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/found/report')}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <span>➕</span> แจ้งพบสิ่งของ
            </button>
          </div>
        </div>

        {/* แถบฟิลเตอร์หมวดหมู่ (เพิ่ม "อื่นๆ") */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {['ทั้งหมด', 'อิเล็กทรอนิกส์', 'กระเป๋า', 'กุญแจ', 'ของใช้ส่วนตัว', 'อื่นๆ'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-md font-semibold text-xs transition transform hover:-translate-y-0.5 shadow-md ${
                selectedCategory === cat 
                  ? 'bg-yellow-300 text-gray-900 ring-2 ring-white scale-105 rotate-0' 
                  : 'bg-amber-100/90 text-gray-700 hover:bg-amber-200 rotate-1'
              }`}
            >
              🏷️ {cat}
            </button>
          ))}
        </div>

        {/* ตารางแสดงการ์ดโพลารอยด์สิ่งของที่พบ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pt-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="relative w-full max-w-xs mx-auto">
              
              {/* กรอบรูปซ้อนด้านหลัง */}
              <div className="absolute inset-0 bg-white/70 rounded-sm shadow-xl transform rotate-3 scale-105 pointer-events-none border border-gray-300" />

              {/* การ์ดโพลารอยด์หลัก */}
              <div 
                onClick={() => alert(`ดูรายละเอียดเคส: ${item.title}`)}
                className={`bg-white rounded-sm shadow-2xl p-3 pb-6 transform ${item.rotate} hover:rotate-0 hover:scale-105 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full`}
              >
                {/* หมุดปักกระดาน */}
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full shadow-md border z-20 ${item.pinColor}`} />

                {/* รูปภาพของกลาง */}
                <div className="h-60 w-full rounded-sm overflow-hidden mb-3 bg-gray-100 shadow-inner">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>

                {/* รายละเอียด */}
                <div className="flex flex-col gap-1 text-center">
                  <h3 className="font-bold text-gray-800 text-sm truncate">{item.title}</h3>
                  <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
                    <span>📍</span> {item.location}
                  </p>
                  <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-100 pt-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{item.category}</span>
                    <span>📅 {item.date}</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}