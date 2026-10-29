import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMatchNotificationEmail({
  toEmail,
  ownerName,
  itemTitle,
  matchScore,
  matchDetailUrl,
}: {
  toEmail: string;
  ownerName: string;
  itemTitle: string;
  matchScore: number;
  matchDetailUrl: string;
}) {
  try {
    await resend.emails.send({
      from: 'Lost & Found Detective <onboarding@resend.dev>', // หรือ Domain ของคุณถ้ามี
      to: [toEmail],
      subject: `🔍 พบรายการที่ตรงกับ "${itemTitle}" ของคุณ (${matchScore}% Match!)`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>สวัสดีคุณ ${ownerName}</h2>
          <p>ระบบ <strong>Lost & Found Detective</strong> ได้ทำการวิเคราะห์และพบสิ่งของที่มีลักษณะตรงกับรายการของหายของคุณ!</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0;"><strong>รายการของคุณ:</strong> ${itemTitle}</p>
            <p style="margin: 5px 0 0 0;"><strong>ความสอดคล้อง (Matching Score):</strong> <span style="color: #16a34a; font-weight: bold;">${matchScore}%</span></p>
          </div>

          <p>คุณสามารถคลิกปุ่มด้านล่างเพื่อเข้าตรวจสอบรายละเอียดและติดต่อรับของคืนได้ทันที:</p>
          <a href="${matchDetailUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">ดูรายละเอียดสิ่งของที่พบ</a>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}