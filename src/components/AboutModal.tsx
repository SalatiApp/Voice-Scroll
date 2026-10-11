import React from 'react';
import { X, Sparkles, Smartphone, Code2, Heart } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-cyan-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Smartphone className="w-8 h-8 text-slate-950" />
        </div>

        <h2 className="text-2xl font-black text-white">Voice Scroll</h2>
        <p className="text-xs text-cyan-400 font-semibold mt-1">الإصدار 1.0.0 (Release APK)</p>

        <p className="text-sm text-slate-300 mt-4 leading-relaxed">
          تطبيق Android مجاني للتحكم في التمرير داخل تطبيقات الفيديو القصيرة (TikTok, YouTube Shorts, Instagram Reels, Facebook) باستخدام أوامر صوتية محلية فورية ودون الحاجة لأي ذكاء اصطناعي أو سيرفرات سحابية.
        </p>

        <div className="my-6 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-400 space-y-1.5">
          <div className="flex justify-between">
            <span>المطور:</span>
            <span className="text-white font-bold">Mohamed Harbaj</span>
          </div>
          <div className="flex justify-between">
            <span>التقنية:</span>
            <span className="text-white font-mono">Android Native (Kotlin)</span>
          </div>
          <div className="flex justify-between">
            <span>الخدمات الأساسية:</span>
            <span className="text-white">AccessibilityService + SpeechRecognizer</span>
          </div>
          <div className="flex justify-between">
            <span>معالجة الذكاء الاصطناعي:</span>
            <span className="text-emerald-400 font-bold">صفر (100% محلي بدون AI)</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
