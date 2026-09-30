'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const location = formData.get('location') as string
    const description = formData.get('description') as string
    const secret_clue = formData.get('secret_clue') as string

    try {
      // บันทึกลงตาราง lost_items ใน Supabase
      const { error } = await supabase.from('lost_items').insert([
        {
          title,
          category,
          location,
          description,
          secret_clue,
          status: 'searching'
        }
      ])

      if (error) throw error

      setSuccessMessage('🕵️‍♂️ เปิดเคสสืบสวนสำเร็จ! ระบบกำลังช่วยตามหาของให้คุณ...')
      ;(e.target as HTMLFormElement).reset()
    } catch (error: any) {
      setErrorMessage('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col items-center">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/20">
            AI Detective Agency
          </span>
          <h1 className="text-3xl font-bold mt-3 text-white tracking-wide">
            Lost & Found Detective
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            กรอกเบาะแสของที่หาย เพื่อให้ AI ของเราช่วยวิเคราะห์และตามหาให้ครับ
          </p>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              ชื่อสิ่งของที่หาย (Title)
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="เช่น กระเป๋าสตางค์หนังสีดำ, iPhone 15"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                หมวดหมู่ (Category)
              </label>
              <select
                name="category"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition"
              >
                <option value="electronics">อุปกรณ์อิเล็กทรอนิกส์</option>
                <option value="wallet_keys">กระเป๋าเงิน / กุญแจ</option>
                <option value="accessories">เครื่องประดับ / นาฬิกา</option>
                <option value="documents">เอกสารสำคัญ</option>
                <option value="others">อื่นๆ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                สถานที่คาดว่าทำหาย (Location)
              </label>
              <input
                type="text"
                name="location"
                required
                placeholder="เช่น BTS สยาม, คาเฟ่แถวอารีย์"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              รายละเอียดและตำหนิ (Description)
            </label>
            <textarea
              name="description"
              rows={3}
              required
              placeholder="ระบุสี รอยขีดข่วน หรือสติกเกอร์ที่ติดอยู่ เพื่อเพิ่มความแม่นยำในการ Matching"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-400 mb-1.5">
              🔐 ความลับยืนยันความเป็นเจ้าของ (Secret Clue)
            </label>
            <input
              type="text"
              name="secret_clue"
              required
              placeholder="เช่น มีรูปหน้าจอล็อกเป็นรูปแมว, รอยขีดข่วนมุมขวาบน"
              className="w-full bg-slate-950 border border-amber-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
            />
            <p className="text-xs text-slate-500 mt-1">ข้อมูลนี้จะถูกซ่อนไว้ ใช้สำหรับยืนยันเมื่อมีคนเจอของชิ้นนี้</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3.5 rounded-xl transition shadow-lg shadow-amber-500/10 disabled:opacity-50 mt-2"
          >
            {loading ? 'กำลังเปิดเคสสืบสวน...' : '🚀 เปิดเคสแจ้งของหาย (Submit Case)'}
          </button>
        </form>

      </div>
    </main>
  )
}