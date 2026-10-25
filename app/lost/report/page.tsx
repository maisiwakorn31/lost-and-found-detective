'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ReportLostItemPage() {
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('อิเล็กทรอนิกส์')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !location) {
      alert('กรุณากรอกชื่อสิ่งของและสถานที่ทำหายด้วยครับ')
      return
    }

    setLoading(true)
    try {
      let imageUrl = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=600&auto=format&fit=crop'

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('lost-images')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data: publicData } = supabase.storage
          .from('lost-images')
          .getPublicUrl(filePath)

        imageUrl = publicData.publicUrl
      }

      const { error } = await supabase.from('lost_items').insert([
        {
          title,
          category,
          location,
          description,
          image_url: imageUrl,
          user_email: user?.email,
        }
      ])

      if (error) throw error

      alert('เปิดเคสแจ้งของหายสำเร็จ!')
      router.push('/') // กลับสู่หน้าหลักหรือหน้าแสดงรายการของหาย
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full text-gray-800 p-6 md:p-10 overflow-x-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url('/dashboard.png')` }} />
      <div className="absolute inset-0 bg-black/40 z-0" />

      <div className="relative z-10 max-w-2xl w-full mx-auto">
        <div className="bg-amber-50/95 backdrop-blur-md rounded-lg shadow-2xl p-6 md:p-8 border border-amber-200 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-blue-600 rounded-full shadow-lg border-2 border-blue-800 z-20" />

          <div className="flex justify-between items-center mb-6 border-b border-amber-200 pb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🔍</span> เปิดเคสแจ้งของหาย (Open Lost Case)
              </h1>
              <p className="text-xs text-gray-600 mt-1">กรอกรายละเอียดทรัพย์สินที่คุณทำหาย เพื่อให้ทีมนักสืบและผู้พบเห็นช่วยเบาะแส</p>
            </div>
            <button onClick={() => router.push('/')} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition">✕ ปิด</button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อสิ่งของที่หาย *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น กระเป๋าสตางค์สีดำยี่ห้อ Prada" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">หมวดหมู่สิ่งของ</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner">
                  <option value="อิเล็กทรอนิกส์">อิเล็กทรอนิกส์</option>
                  <option value="กระเป๋า">กระเป๋า</option>
                  <option value="กุญแจ">กุญแจ</option>
                  <option value="ของใช้ส่วนตัว">ของใช้ส่วนตัว</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">สถานที่คาดว่าทำหาย *</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="เช่น บริเวณห้องสมุดกลาง ชั้น 2" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">รายละเอียดตำหนิรูปพรรณ / ของสำคัญข้างใน</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ระบุรอยขีดข่วน บัตรสำคัญ หรือสิ่งของด้านใน" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">รูปถ่ายสิ่งของ (ถ้ามี)</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow transition flex items-center gap-1.5">
                  <span>📷</span> เลือกรูปภาพ
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <span className="text-xs text-gray-500 truncate max-w-xs">{imageFile ? imageFile.name : 'ยังไม่ได้เลือกไฟล์'}</span>
              </div>
              {imagePreview && (
                <div className="mt-3 relative w-32 h-32 rounded border border-gray-300 overflow-hidden shadow">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4 border-t border-amber-200 pt-4">
              <button type="button" onClick={() => router.push('/')} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-bold rounded-md transition">ยกเลิก</button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-md shadow-lg transition flex items-center gap-1.5">
                <span>{loading ? 'กำลังเปิดเคส...' : '🚀 ยืนยันเปิดเคสของหาย'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}