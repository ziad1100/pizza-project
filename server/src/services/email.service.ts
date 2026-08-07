import env from '../config/env';
import { sendMail } from '../config/mailer';

export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  const url = `${env.clientUrl}/verify-email?token=${token}`;
  await sendMail(
    to,
    'تفعيل حسابك - مطعم عرابي',
    `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#0d0d0d;color:#fff;border-radius:12px">
      <h1 style="color:#f6b100;text-align:center">مطعم عرابي | ORABI Restaurant</h1>
      <p>أهلاً بك! اضغط الزر التالي لتفعيل حسابك:</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#e31e24;color:#fff;text-decoration:none;border-radius:8px;margin:12px 0">تفعيل الحساب</a>
      <p style="color:#888;font-size:12px">إذا لم تطلب هذا، تجاهل الرسالة.</p>
    </div>`,
  );
};

export const sendPasswordResetOtpEmail = async (to: string, code: string): Promise<void> => {
  await sendMail(
    to,
    'كود إعادة تعيين كلمة المرور - مطعم عرابي',
    `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#0d0d0d;color:#fff;border-radius:12px">
      <h1 style="color:#f6b100;text-align:center">مطعم عرابي | ORABI Restaurant</h1>
      <p style="font-size:15px;line-height:1.6">استخدم الكود التالي لإعادة تعيين كلمة المرور. الكود صالح لمدة 15 دقيقة:</p>
      <div style="text-align:center;margin:16px 0">
        <span style="display:inline-block;font-size:34px;font-weight:800;letter-spacing:8px;background:#e31e24;color:#fff;padding:14px 26px;border-radius:10px">${code}</span>
      </div>
      <p style="color:#888;font-size:12px">أدخل الكود في صفحة إعادة تعيين كلمة المرور. إذا لم تطلب هذا، تجاهل الرسالة.</p>
    </div>`,
  );
};

export const sendOrderConfirmation = async (to: string, orderNo: string, total: number): Promise<void> => {
  await sendMail(
    to,
    `تأكيد الطلب ${orderNo} - مطعم عرابي`,
    `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#0d0d0d;color:#fff;border-radius:12px">
      <h1 style="color:#f6b100;text-align:center">مطعم عرابي | ORABI Restaurant</h1>
      <p>تم استلام طلبك <strong>${orderNo}</strong> ✅</p>
      <p>الإجمالي: <strong style="color:#f6b100">${total} ج.م</strong></p>
      <p style="color:#888">سنصلك في أقرب وقت 🍕</p>
    </div>`,
  );
};
