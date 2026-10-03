'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ReportFoundItemPage() {
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

  // จัดการเมื่อเลือกรูปภาพ
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // ส่งฟอร์มบันทึกข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !location) {
      alert('กรุณากรอกชื่อสิ่งของและสถานที่พบด้วยครับ')
      return
    }

    setLoading(true)
    try {
      // ตัวอย่างจำลองการบันทึกข้อมูล (สามารถปรับเชื่อมต่อตาราง found_items ใน Supabase ต่อได้)
      console.log({
        title,
        category,
        location,
        description,
        user_email: user?.email,
        created_at: new Date()
      })

      alert('บันทึกข้อมูลแจ้งพบสิ่งของสำเร็จ!')
      router.push('/found') // กลับไปหน้าหน้ารายการพบเจอสิ่งของ
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full text-gray-800 p-6 md:p-10 overflow-x-hidden flex items-center justify-center">
      
      {/* รูปพื้นหลังบอร์ดสืบสวน */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url('/dashboard.png')` }}
      />
      <div className="absolute inset-0 bg-black/40 z-0" />

      <div className="relative z-10 max-w-2xl w-full mx-auto">
        
        {/* กล่องฟอร์มสไตล์กระดาษรายงานคดี */}
        <div className="bg-amber-50/95 backdrop-blur-md rounded-lg shadow-2xl p-6 md:p-8 border border-amber-200 relative">
          
          {/* หมุดปักกระดาษด้านบน */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-red-600 rounded-full shadow-lg border-2 border-red-800 z-20" />

          {/* หัวข้อฟอร์ม */}
          <div className="flex justify-between items-center mb-6 border-b border-amber-200 pb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>📝</span> ฟอร์มแจ้งพบสิ่งของ (Report Found Item)
              </h1>
              <p className="text-xs text-gray-600 mt-1">กรอกรายละเอียดของกลางที่คุณเก็บได้ เพื่อประกาศตามหาเจ้าของ</p>
            </div>
            <button 
              onClick={() => router.push('/found')}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition"
            >
              ✕ ปิด
            </button>
          </div>

          {/* ฟอร์มกรอกข้อมูล */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* ชื่อสิ่งของ */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อสิ่งของ / รายละเอียดสั้นๆ *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น กระเป๋าสตางค์หนังสีน้ำตาล, กุญแจรถ" 
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                required
              />
            </div>

            {/* หมวดหมู่ & สถานที่พบ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">หมวดหมู่สิ่งของ</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                >
                  <option value="อิเล็กทรอนิกส์">อิเล็กทรอนิกส์</option>
                  <option value="กระเป๋า">กระเป๋า</option>
                  <option value="กุญแจ">กุญแจ</option>
                  <option value="ของใช้ส่วนตัว">ของใช้ส่วนตัว</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">สถานที่พบ *</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="เช่น โรงอาหารวิศวะฯ, หน้าตึก A" 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                  required
                />
              </div>
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">รายละเอียดเพิ่มเติม / จุดสังเกต</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อย่าระบุรายละเอียดเชิงลึกของสิ่งของมากเกินไป เพื่อป้องกันการแอบอ้างสิทธิ์"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
            </div>

            {/* อัปโหลดรูปภาพหลักฐาน */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">รูปถ่ายของกลาง</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow transition flex items-center gap-1.5">
                  <span>📷</span> เลือกรูปภาพ
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <span className="text-xs text-gray-500 truncate max-w-xs">
                  {imageFile ? imageFile.name : 'ยังไม่ได้เลือกไฟล์'}
                </span>
              </div>

              {/* พรีวิวรูปภาพ */}
              {imagePreview && (
                <div className="mt-3 relative w-32 h-32 rounded border border-gray-300 overflow-hidden shadow">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* ปุ่มกดส่งข้อมูล */}
            <div className="flex justify-end gap-3 mt-4 border-t border-amber-200 pt-4">
              <button
                type="button"
                onClick={() => router.push('/found')}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-bold rounded-md transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-xs font-bold rounded-md shadow-lg transition flex items-center gap-1.5"
              >
                <span>{loading ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูลแจ้งพบ'}</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  )
}