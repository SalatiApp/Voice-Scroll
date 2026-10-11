import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Radio } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">سياسة الخصوصية والأمان</h2>
            <p className="text-xs text-slate-400">تطبيق Voice Scroll • خصوصية مطلقة 100%</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-base">
              <Radio className="w-4 h-4" />
              <h3>1. إذن الميكروفون (RECORD_AUDIO)</h3>
            </div>
            <p>
              يُستخدم الميكروفون حصرياً لتحويل كلامك إلى نصوص ومطابقتها مع قائمة أوامر التمرير المحلية (دوز، التالي، رجع، وقف، إلخ).
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400 text-xs">
              <li>لا يتم تسجيل أو تخزين أو حفظ أي مقاطع صوتية إطلاقاً على ذاكرة الهاتف.</li>
              <li>لا يتم إرسال أي صوت أو نصوص إلى أي خوادم أو سيرفرات خاصة بنا.</li>
              <li>كل المعالجة تتم على جهازك بشكل مباشر ولحظي.</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-base">
              <Lock className="w-4 h-4" />
              <h3>2. خدمة إمكانية الوصول (Accessibility Service)</h3>
            </div>
            <p>
              تُستخدم خدمة Accessibility فقط لتنفيذ حركة التمرير الشاملة (Swipe Up / Swipe Down) في وسط الشاشة نيابة عنك.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400 text-xs">
              <li>التطبيق لا يقرأ نصوص الشاشة أو الرسائل أو كلمات المرور (canRetrieveWindowContent=false).</li>
              <li>لا يجمع معلومات حول ما تشاهده أو تتصفحه في التطبيقات الأخرى.</li>
              <li>لا يقوم بالضغط على أزرار الشراء أو الإعلانات أو تسجيل الإعجاب التلقائي.</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2 text-purple-400 font-bold text-base">
              <EyeOff className="w-4 h-4" />
              <h3>3. بدون حسابات وبدون تتبع (Zero Analytics)</h3>
            </div>
            <p>
              لا يتطلب التطبيق أي تسجيل حساب، ولا يجمع أي معرفات جهاز أو عناوين IP، ولا يحتوي على أدوات تتبع (No Firebase Analytics, No Crashlytics, No AdMob).
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition"
          >
            فهمت وموافق
          </button>
        </div>
      </div>
    </div>
  );
};
