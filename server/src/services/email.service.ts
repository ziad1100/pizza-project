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

export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const url = `${env.clientUrl}/reset-password?token=${token}`;
  await sendMail(
    to,
    'إعادة تعيين كلمة المرور - مطعم عرابي',
    `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#0d0d0d;color:#fff;border-radius:12px">
      <h1 style="color:#f6b100;text-align:center">مطعم عرابي | ORABI Restaurant</h1>
      <p>اضغط الزر التالي لإعادة تعيين كلمة المرور (صالح لمدة 15 دقيقة):</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#f6b100;color:#0d0d0d;text-decoration:none;border-radius:8px;margin:12px 0;font-weight:bold">إعادة التعيين</a>
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
