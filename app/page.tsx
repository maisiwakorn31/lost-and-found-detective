'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // State สำหรับจัดการหน้าต่างโปรไฟล์และเคสส่วนตัว
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileTab, setProfileTab] = useState<'lost' | 'found'>('lost')
  const [myLostItems, setMyLostItems] = useState<any[]>([])
  const [myFoundItems, setMyFoundItems] = useState<any[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // State สำหรับแก้ไขข้อมูล (Edit Modal)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editDescription, setEditDescription] = useState('')

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

  // ฟังก์ชันดึงข้อมูลเคสส่วนตัวของผู้ใช้ปัจจุบัน
  const fetchMyItems = async (email: string) => {
    setLoadingItems(true)
    const [lostRes, foundRes] = await Promise.all([
      supabase.from('lost_items').select('*').eq('user_email', email).order('created_at', { ascending: false }),
      supabase.from('found_items').select('*').eq('user_email', email).order('created_at', { ascending: false })
    ])
    setMyLostItems(lostRes.data || [])
    setMyFoundItems(foundRes.data || [])
    setLoadingItems(false)
  }

  const handleOpenProfile = () => {
    setShowProfileModal(true)
    if (user?.email) {
      fetchMyItems(user.email)
    }
  }

  // ฟังก์ชันลบเคส
  const handleDelete = async (id: number, type: 'lost' | 'found') => {
    if (!confirm('คุณต้องการลบแฟ้มคดีนี้ใช่หรือไม่?')) return

    const tableName = type === 'lost' ? 'lost_items' : 'found_items'
    const { error } = await supabase.from(tableName).delete().eq('id', id)

    if (error) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message)
    } else {
      alert('ลบแฟ้มคดีสำเร็จ!')
      fetchMyItems(user.email)
    }
  }

  // เปิด Modal แก้ไข
  const handleOpenEdit = (item: any, type: 'lost' | 'found') => {
    setEditingItem({ ...item, type })
    setEditTitle(item.title)
    setEditCategory(item.category)
    setEditLocation(item.location)
    setEditDescription(item.description || '')
  }

  // บันทึกการแก้ไข
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    const tableName = editingItem.type === 'lost' ? 'lost_items' : 'found_items'
    const { error } = await supabase
      .from(tableName)
      .update({
        title: editTitle,
        category: editCategory,
        location: editLocation,
        description: editDescription
      })
      .eq('id', editingItem.id)

    if (error) {
      alert('เกิดข้อผิดพลาดในการแก้ไข: ' + error.message)
    } else {
      alert('อัปเดตแฟ้มคดีสำเร็จ!')
      setEditingItem(null)
      fetchMyItems(user.email)
    }
  }

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
          
          <h1 className="text-2xl font-bold tracking-wide flex items-center gap-2">
            <span>🔍</span> Lost & Found Detective Board
          </h1>

          {/* ส่วนโปรไฟล์นักสืบ (คลิกเพื่อเปิดจัดการเคสส่วนตัว) */}
          <div className="flex items-center gap-4">
            <div 
              onClick={handleOpenProfile}
              className="flex items-center gap-3 bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-xl border border-white/20 cursor-pointer transition shadow"
              title="คลิกเพื่อจัดการเคสของคุณ"
            >
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
                <span className="text-xs font-semibold text-amber-200">นักสืบ (จัดการเคส)</span>
                <span className="text-xs text-white truncate max-w-[160px]">{user?.email || 'กำลังโหลด...'}</span>
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
                <img src="/1.png" alt="พบเจอสิ่งของ" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="text-center font-bold text-gray-800 tracking-wide text-sm">
                <span className="bg-yellow-300 px-2 py-0.5 rounded shadow-sm inline-block">พบเจอสิ่งของ</span>
              </div>
            </div>
          </div>

          {/* การ์ดที่ 2: เปิดเคสของหาย */}
          <div className="relative w-full max-w-xs mx-auto">
            <div className="absolute inset-0 bg-white/80 rounded-sm shadow-xl transform rotate-6 scale-105 pointer-events-none border border-gray-300" />
            <div 
              onClick={() => router.push('/lost/report')}
              className="bg-white rounded-sm shadow-2xl p-4 pb-8 transform rotate-1 hover:rotate-0 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-md border border-blue-800 z-20" />
              <div className="h-80 w-full rounded-sm overflow-hidden mb-4 bg-gray-100 shadow-inner">
                <img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop" alt="เปิดเคสของหาย" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="text-center font-bold text-gray-800 tracking-wide text-sm">
                <span className="bg-yellow-300 px-2 py-0.5 rounded shadow-sm inline-block">เปิดเคสของหาย</span>
              </div>
            </div>
          </div>

          {/* การ์ดที่ 3: ของหายทั้งหมด */}
          <div className="relative w-full max-w-xs mx-auto">
            <div 
              onClick={() => router.push('/lost')}
              className="bg-white rounded-sm shadow-2xl p-4 pb-8 transform -rotate-2 hover:rotate-0 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-500 rounded-full shadow-md border border-yellow-700 z-20" />
              <div className="h-80 w-full rounded-sm overflow-hidden mb-4 bg-gray-100 shadow-inner">
                <img src="/3.png" alt="ของหายทั้งหมด" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="text-center font-bold text-gray-800 tracking-wide text-sm">
                <span className="bg-yellow-300 px-2 py-0.5 rounded shadow-sm inline-block">ของหายทั้งหมด</span>
              </div>
            </div>
          </div>

          {/* การ์ดล่าง 2 ใบ */}
          <div className="col-span-full flex flex-col md:flex-row justify-center items-center gap-10 mt-4">
            
            {/* การ์ดที่ 4: จดหมาย */}
            <div className="relative w-full max-w-xs mx-auto">
              <div className="absolute inset-0 bg-white/80 rounded-sm shadow-xl transform -rotate-6 scale-105 pointer-events-none border border-gray-300" />
              <div 
                onClick={() => router.push('/letters')}
                className="bg-white rounded-sm shadow-2xl p-4 pb-8 transform rotate-2 hover:rotate-0 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full"
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-600 rounded-full shadow-md border border-green-800 z-20" />
                <div className="h-80 w-full rounded-sm overflow-hidden mb-4 bg-amber-50/60 shadow-inner flex items-center justify-center">
                  <img src="/4.png" alt="จดหมาย" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="text-center font-bold text-gray-800 tracking-wide text-sm">
                  <span className="bg-yellow-300 px-2 py-0.5 rounded shadow-sm inline-block">จดหมาย</span>
                </div>
              </div>
            </div>

            {/* การ์ดที่ 5: AI Matching */}
            <div className="relative w-full max-w-xs mx-auto">
              <div 
                onClick={() => router.push('/ai-matching')}
                className="bg-white rounded-sm shadow-2xl p-4 pb-8 transform -rotate-1 hover:rotate-0 transition duration-300 cursor-pointer border border-gray-200 relative z-10 group flex flex-col justify-between h-full"
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-purple-600 rounded-full shadow-md border border-purple-800 z-20" />
                <div className="h-80 w-full rounded-sm overflow-hidden mb-4 bg-amber-50/60 shadow-inner flex items-center justify-center">
                  <img src="/2.png" alt="AI Matching" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="text-center font-bold text-gray-800 tracking-wide text-sm">
                  <span className="bg-yellow-300 px-2 py-0.5 rounded shadow-sm inline-block">สิ่งของใกล้เคียงกับที่ทำหาย (AI Matching)</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Profile Modal: จัดการเคสของฉัน (แก้ไข / ลบ) */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-amber-50 rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden border border-amber-300 flex flex-col max-h-[85vh]">
            
            {/* Header Modal */}
            <div className="bg-amber-800 text-white p-4 flex justify-between items-center shadow">
              <div className="flex items-center gap-2">
                <span className="text-xl">🕵️‍♂️</span>
                <div>
                  <h3 className="font-bold text-sm">แฟ้มคดีส่วนตัวของนักสืบ</h3>
                  <p className="text-[11px] text-amber-200">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)} 
                className="bg-amber-900 hover:bg-amber-950 px-3 py-1 rounded text-xs font-semibold transition"
              >
                ✕ ปิด
              </button>
            </div>

            {/* Tabs เปลี่ยนระหว่าง ของหาย กับ พบเจอของ */}
            <div className="flex border-b border-amber-200 bg-amber-100/50">
              <button 
                onClick={() => setProfileTab('lost')} 
                className={`flex-1 py-3 text-xs font-bold transition ${profileTab === 'lost' ? 'bg-amber-200/80 text-amber-900 border-b-2 border-amber-600' : 'text-gray-600 hover:bg-amber-100'}`}
              >
                🔍 เคสของหายของฉัน ({myLostItems.length})
              </button>
              <button 
                onClick={() => setProfileTab('found')} 
                className={`flex-1 py-3 text-xs font-bold transition ${profileTab === 'found' ? 'bg-amber-200/80 text-amber-900 border-b-2 border-amber-600' : 'text-gray-600 hover:bg-amber-100'}`}
              >
                📌 รายการพบเจอของของฉัน ({myFoundItems.length})
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-amber-100/20">
              {loadingItems ? (
                <div className="text-center py-10 text-xs text-gray-500">กำลังค้นหาแฟ้มคดีของคุณ...</div>
              ) : profileTab === 'lost' ? (
                myLostItems.length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-500">คุณยังไม่มีการเปิดเคสของหาย</div>
                ) : (
                  myLostItems.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={item.image_url} alt="" className="w-16 h-16 object-cover rounded border" />
                        <div>
                          <h4 className="font-bold text-xs text-gray-800">{item.title}</h4>
                          <p className="text-[11px] text-gray-500">📍 {item.location} | หมวด: {item.category}</p>
                          <p className="text-[10px] text-gray-400">📅 {new Date(item.created_at).toLocaleDateString('th-TH')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(item, 'lost')} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded shadow transition">แก้ไข</button>
                        <button onClick={() => handleDelete(item.id, 'lost')} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded shadow transition">ลบ</button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                myFoundItems.length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-500">คุณยังไม่มีรายการพบเจอสิ่งของ</div>
                ) : (
                  myFoundItems.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={item.image_url} alt="" className="w-16 h-16 object-cover rounded border" />
                        <div>
                          <h4 className="font-bold text-xs text-gray-800">{item.title}</h4>
                          <p className="text-[11px] text-gray-500">📍 {item.location} | หมวด: {item.category}</p>
                          <p className="text-[10px] text-gray-400">📅 {new Date(item.created_at).toLocaleDateString('th-TH')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(item, 'found')} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded shadow transition">แก้ไข</button>
                        <button onClick={() => handleDelete(item.id, 'found')} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded shadow transition">ลบ</button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

          </div>
        </div>
      )}

      {/* Edit Modal: หน้าต่างแก้ไขข้อมูล */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-amber-50 rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-amber-300 p-6">
            <div className="flex justify-between items-center mb-4 border-b border-amber-200 pb-2">
              <h3 className="font-bold text-sm text-gray-800">📝 แก้ไขแฟ้มคดี ({editingItem.type === 'lost' ? 'ของหาย' : 'พบเจอ'})</h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-500 hover:text-gray-800 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">ชื่อสิ่งของ</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs focus:ring-2 focus:ring-amber-500" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">หมวดหมู่</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs">
                    <option value="อิเล็กทรอนิกส์">อิเล็กทรอนิกส์</option>
                    <option value="กระเป๋า">กระเป๋า</option>
                    <option value="กุญแจ">กุญแจ</option>
                    <option value="ของใช้ส่วนตัว">ของใช้ส่วนตัว</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">สถานที่</label>
                  <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" required />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">รายละเอียดตำหนิ</label>
                <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-bold rounded">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow">บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}