'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="relative min-h-screen w-full text-gray-800 p-6 md:p-10 overflow-x-hidden">
      
      {/* รูปพื้นหลัง dashboard.png */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url('/dashboard.png')` }}
      />
      <div className="absolute inset-0 bg-black/20 z-0" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* แถบ Header ด้านบน */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white shadow-lg gap-4">
          
          {/* ส่วนหัวข้อบอร์ด */}
          <h1 className="text-2xl font-bold tracking-wide flex items-center gap-2">
            <span>🔍</span> Lost & Found Detective Board
          </h1>

          {/* ส่วนโปรไฟล์นักสืบ + ปุ่มออกจากระบบ */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/25 border-2 border-amber-300 flex items-center justify-center shadow relative">
                <img 
                  src="/profile.png" 
                  alt="โปรไฟล์นักสืบ" 
                  className="w-full h-full object-cover"
                  onError={(e)=>{
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="absolute text-xs">🕵️‍♂️</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-white">นักสืบ</span>
                <span className="text-xs text-amber-200 truncate max-w-[160px]">{user?.email || 'กำลังโหลด...'}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-xl shadow transition whitespace-nowrap"
            >
              ออกจากระบบ
            </button>
          </div>

        </div>

        {/* บอร์ดจำลอง (Corkboard Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-4">
          
          {/* การ์ดที่ 1: พบเจอสิ่งของ */}
          <div className="relative w-full max-w-xs mx-auto">
            <div 
              onClick={() => router.push('/found')}
              className="bg-white rounded-sm shadow-2xl p-4 pb-8 transform -rotate-1 hover:rotate-0 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full shadow-md border border-red-800 z-20" />
              <div className="h-80 w-full rounded-sm overflow-hidden mb-4 bg-gray-100 shadow-inner">
                <img 
                  src="/1.png" 
                  alt="พบเจอสิ่งของ" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="text-center font-bold text-gray-800 tracking-wide text-sm">
                <span className="bg-yellow-300 px-2 py-0.5 rounded shadow-sm inline-block">พบเจอสิ่งของ</span>
              </div>
            </div>
          </div>

          {/* การ์ดที่ 2: เปิดเคสของหาย (มีกรอบรูปซ้อนด้านหลัง) */}
          <div className="relative w-full max-w-xs mx-auto">
            <div className="absolute inset-0 bg-white/80 rounded-sm shadow-xl transform rotate-6 scale-105 pointer-events-none border border-gray-300" />
            
            <div 
              onClick={() => router.push('')}
              className="bg-white rounded-sm shadow-2xl p-4 pb-8 transform rotate-1 hover:rotate-0 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-md border border-blue-800 z-20" />
              <div className="h-80 w-full rounded-sm overflow-hidden mb-4 bg-gray-100 shadow-inner">
                <img 
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop" 
                  alt="เปิดเคสของหาย" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="text-center font-bold text-gray-800 tracking-wide text-sm">
                <span className="bg-yellow-300 px-2 py-0.5 rounded shadow-sm inline-block">เปิดเคสของหาย</span>
              </div>
            </div>
          </div>

          {/* การ์ดที่ 3: ของหายทั้งหมด */}
          <div className="relative w-full max-w-xs mx-auto">
            <div 
              onClick={() => alert('ไปหน้าของหายทั้งหมด')}
              className="bg-white rounded-sm shadow-2xl p-4 pb-8 transform -rotate-2 hover:rotate-0 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-500 rounded-full shadow-md border border-yellow-700 z-20" />
              <div className="h-80 w-full rounded-sm overflow-hidden mb-4 bg-gray-100 shadow-inner">
                <img 
                  src="/3.png" 
                  alt="ของหายทั้งหมด" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="text-center font-bold text-gray-800 tracking-wide text-sm">
                <span className="bg-yellow-300 px-2 py-0.5 rounded shadow-sm inline-block">ของหายทั้งหมด</span>
              </div>
            </div>
          </div>

          {/* 2 การ์ดล่าง จัดให้อยู่กึ่งกลางหน้าจอ */}
          <div className="col-span-full flex flex-col md:flex-row justify-center items-center gap-10 mt-4">
            
            {/* การ์ดที่ 4: จดหมาย (มีกรอบรูปซ้อนด้านหลัง) */}
            <div className="relative w-full max-w-xs mx-auto">
              <div className="absolute inset-0 bg-white/80 rounded-sm shadow-xl transform -rotate-6 scale-105 pointer-events-none border border-gray-300" />

              <div 
                onClick={() => alert('ไปหน้าจดหมาย')}
                className="bg-white rounded-sm shadow-2xl p-4 pb-8 transform rotate-2 hover:rotate-0 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full"
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-600 rounded-full shadow-md border border-green-800 z-20" />
                <div className="h-80 w-full rounded-sm overflow-hidden mb-4 bg-amber-50/60 shadow-inner flex items-center justify-center">
                  <img 
                    src="/4.png" 
                    alt="จดหมาย" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="text-center font-bold text-gray-800 tracking-wide text-sm">
                  <span className="bg-yellow-300 px-2 py-0.5 rounded shadow-sm inline-block">จดหมาย</span>
                </div>
              </div>
            </div>

            {/* การ์ดที่ 5: สิ่งของใกล้เคียงกับที่ทำหาย */}
            <div className="relative w-full max-w-xs mx-auto">
              <div 
                onClick={() => alert('ไปหน้า AI Matching สิ่งของใกล้เคียง')}
                className="bg-white rounded-sm shadow-2xl p-4 pb-8 transform -rotate-1 hover:rotate-0 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full"
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-purple-600 rounded-full shadow-md border border-purple-800 z-20" />
                <div className="h-80 w-full rounded-sm overflow-hidden mb-4 bg-amber-50/60 shadow-inner flex items-center justify-center">
                  <img 
                    src="/2.png" 
                    alt="สิ่งของใกล้เคียงกับที่ทำหาย (AI Matching)" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="text-center font-bold text-gray-800 tracking-wide text-sm">
                  <span className="bg-yellow-300 px-2 py-0.5 rounded shadow-sm inline-block">สิ่งของใกล้เคียงกับที่ทำหาย (AI Matching)</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}