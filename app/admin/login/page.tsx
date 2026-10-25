'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === 'admin' && password === '12345678') {
      localStorage.setItem('isAdminAuthenticated', 'true')
      router.push('/admin/dashboard')
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านแอดมินไม่ถูกต้อง')
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 text-gray-800">
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url('/dashboard.png')` }} />
      <div className="absolute inset-0 bg-black/40 z-0" />

      <div className="relative z-10 bg-amber-50/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-amber-300 w-full max-w-md">
        <h2 className="text-xl font-bold text-center mb-6 text-amber-900 flex items-center justify-center gap-2">
          <span>🛡️</span> เข้าสู่ระบบผู้ดูแลระบบ (Admin)
        </h2>

        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 text-xs rounded text-center font-bold">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs focus:ring-2 focus:ring-amber-500"
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs focus:ring-2 focus:ring-amber-500"
              required 
            />
          </div>

          <button type="submit" className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded shadow transition">
            เข้าสู่ระบบแอดมิน
          </button>
        </form>
      </div>
    </div>
  )
}