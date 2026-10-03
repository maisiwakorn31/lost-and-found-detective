'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [major, setMajor] = useState('Computer Engineering')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน')
      setLoading(false)
      return
    }

    // สมัครสมาชิกผ่าน Supabase Auth พร้อมเก็บข้อมูลเพิ่มเติมใน user_metadata
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          student_id: studentId,
          major: major,
        },
      },
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
    } else {
      setMessage('สมัครสมาชิกสำเร็จ! กำลังพากลับไปหน้า Login...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#E2D2A5] via-[#C3D9C4] to-[#438A5E] p-4 py-10">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-lg w-full border border-white/40">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Register</h1>
        <p className="text-sm text-gray-500 mb-6">สร้างบัญชีใหม่เพื่อใช้งาน Lost & Found Detective</p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-xl">
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* ชื่อ - นามสกุล */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              ชื่อ - นามสกุล
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50/50 text-gray-800 placeholder:text-gray-400"
              placeholder="ชื่อ นามสกุล"
            />
          </div>

          {/* รหัสนิสิต */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              รหัสนิสิต
            </label>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50/50 text-gray-800 placeholder:text-gray-400"
              placeholder="รหัสนิสิต"
            />
          </div>

          {/* Dropdown สาขาวิชา */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              สาขาวิชา
            </label>
            <select
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50/50 text-gray-800"
            >
              <option value="Computer Engineering">วิศวกรรมคอมพิวเตอร์ (Computer Engineering)</option>
              <option value="Electrical Engineering">วิศวกรรมไฟฟ้า (Electrical Engineering)</option>
              <option value="Mechanical Engineering">วิศวกรรมเครื่องกล (Mechanical Engineering)</option>
              <option value="Industrial Engineering">วิศวกรรมอุตสาหการ (Industrial Engineering)</option>
              <option value="Software Engineering">วิศวกรรมซอฟต์แวร์ (Software Engineering)</option>
              <option value="Other">สาขาวิชาอื่นๆ</option>
            </select>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50/50 text-gray-800 placeholder:text-gray-400"
              placeholder="name@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50/50 text-gray-800 placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              ยืนยันรหัสผ่าน (Confirm Password)
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50/50 text-gray-800 placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#2E7D52] hover:bg-[#236340] text-white font-medium rounded-xl shadow-md transition text-sm mt-2"
          >
            {loading ? 'กำลังสมัครสมาชิก...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-emerald-700 hover:underline font-medium">
            ← กลับไปหน้า Login
          </a>
        </div>
      </div>
    </div>
  )
}