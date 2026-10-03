'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#E2D2A5] via-[#C3D9C4] to-[#438A5E] p-4">
      {/* การ์ดหลัก */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 border border-white/40 p-6 lg:p-8">
        
        {/* ฝั่งซ้าย: รูปภาพบรรยากาศ + โลโก้มุมบนซ้าย + ไอคอนไอเทม */}
        <div className="lg:col-span-7 flex flex-col justify-between pr-0 lg:pr-6">
          <div className="relative h-72 lg:h-96 w-full rounded-2xl overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10" />
            <img 
              src="/kusrc.jpg" 
              alt="Campus" 
              className="object-cover w-full h-full"
            />
            
            {/* พื้นที่สำหรับใส่โลโก้มุมบนซ้ายตามเรฟ */}
            <div className="absolute top-4 left-4 z-20 w-12 h-12 rounded-full bg-white/90 shadow-md flex items-center justify-center border border-emerald-600/30 overflow-hidden">
              <span className="text-xs font-bold text-emerald-800">KU</span>
            </div>
          </div>

          {/* แถบไอคอนสิ่งของจำลองด้านล่าง */}
          <div className="mt-6 flex items-center justify-around bg-white/90 p-4 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-2xl" title="กระเป๋า">🎒</span>
            <span className="text-2xl" title="กระเป๋าเงิน">👛</span>
            <span className="text-2xl" title="กุญแจ">🔑</span>
            <span className="text-2xl" title="มือถือ">📱</span>
            <span className="text-2xl" title="แว่นตา">👓</span>
            <span className="text-2xl" title="กระบอกน้ำ">🍼</span>
          </div>
        </div>

        {/* ฝั่งขวา: ฟอร์ม Login */}
        <div className="lg:col-span-5 pl-0 lg:pl-6 flex flex-col justify-center mt-6 lg:mt-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Login</h1>
            <p className="text-sm text-gray-500 mt-1">เข้าสู่ระบบเพื่อตามหาหรือแจ้งของหาย</p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition bg-gray-50/50 text-gray-800 placeholder:text-gray-400 font-medium"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition bg-gray-50/50 text-gray-800 placeholder:text-gray-400 font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#2E7D52] hover:bg-[#236340] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center text-sm"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <a href="/register" className="text-sm text-red-600 hover:underline font-medium">
              Register now
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}