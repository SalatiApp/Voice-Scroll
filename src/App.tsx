import React, { useState } from 'react';
import {
  Mic,
  ShieldCheck,
  Smartphone,
  Sliders,
  Download,
  Terminal,
  ExternalLink,
  Code2,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Zap,
  Volume2,
  BookmarkPlus
} from 'lucide-react';
import { PhoneSimulator } from './components/PhoneSimulator';
import { CommandEngineTester } from './components/CommandEngineTester';
import { NativeProjectViewer } from './components/NativeProjectViewer';
import { CustomAliasesModal } from './components/CustomAliasesModal';
import { PrivacyModal } from './components/PrivacyModal';
import { AboutModal } from './components/AboutModal';
import { CommandType, CustomAlias } from './types';

export default function App() {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [language, setLanguage] = useState('ar-MA');
  const [customAliases, setCustomAliases] = useState<CustomAlias[]>([
    { id: '1', phrase: 'يلا', command: 'NEXT' },
    { id: '2', phrase: 'سير', command: 'NEXT' },
    { id: '3', phrase: 'بركة', command: 'STOP' }
  ]);

  const [activeTab, setActiveTab] = useState<'simulator' | 'tester' | 'code'>('simulator');
  const [isAliasesModalOpen, setIsAliasesModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const customAliasesMap = customAliases.reduce<Record<string, CommandType>>((acc, item) => {
    acc[item.phrase] = item.command;
    return acc;
  }, {});

  const handleAddAlias = (phrase: string, command: CommandType) => {
    setCustomAliases((prev) => [
      ...prev.filter((a) => a.phrase !== phrase),
      { id: Date.now().toString(), phrase, command }
    ]);
  };

  const handleDeleteAlias = (id: string) => {
    setCustomAliases((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDownload = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string,
    filename: string,
    mimeType?: string
  ) => {
    // 1. Do NOT call e.preventDefault() - allowing the native anchor tag download to execute with direct user activation.
    // 2. Synchronous hidden-iframe trigger (safest & most reliable download pattern for sandboxed iframes)
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 6000);
    } catch (_) {}

    // 3. Synchronous standalone anchor click fallback
    try {
      const tempLink = document.createElement('a');
      tempLink.href = url;
      tempLink.setAttribute('download', filename);
      tempLink.style.display = 'none';
      document.body.appendChild(tempLink);
      tempLink.click();
      setTimeout(() => {
        if (document.body.contains(tempLink)) {
          document.body.removeChild(tempLink);
        }
      }, 1000);
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100 font-['Cairo',sans-serif]">
      {/* Top Navigation Banner */}
      <header className="sticky top-0 z-40 bg-[#0b1424]/90 backdrop-blur-md border-b border-[#162740] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & App Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00d7f4] flex items-center justify-center text-[#060b13] shadow-lg shadow-[#00d7f4]/20 font-black">
              <Mic className="w-5 h-5 text-[#060b13]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">Voice Scroll</h1>
                <span className="px-2 py-0.5 rounded-full bg-[#00d7f4]/10 text-[#00d7f4] text-[11px] font-bold border border-[#00d7f4]/30">
                  Android Native
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                  100% بدون AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تحكم صوتي فوري في فيديوهات TikTok, YouTube, Instagram بواسطة Accessibility Service
              </p>
            </div>
          </div>

          {/* Header Controls & Download Actions */}
          <div className="flex items-center gap-2">
            <a
              href="/VoiceScroll-release.apk"
              download="VoiceScroll-release.apk"
              onClick={(e) => handleDownload(e, '/VoiceScroll-release.apk', 'VoiceScroll-release.apk', 'application/vnd.android.package-archive')}
              className="px-4 py-2 bg-[#00d7f4] hover:bg-[#20e2fd] text-[#060b13] font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-[#00d7f4]/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل ملف APK الجاهز</span>
            </a>

            <a
              href="/VoiceScroll-Android-Native-Source.zip"
              download="VoiceScroll-Android-Native-Source.zip"
              onClick={(e) => handleDownload(e, '/VoiceScroll-Android-Native-Source.zip', 'VoiceScroll-Android-Native-Source.zip', 'application/zip')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>كود المشروع (ZIP)</span>
            </a>

            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="الخصوصية"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="حول التطبيق"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 pb-px gap-2">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-slate-900 text-cyan-400 border-t border-x border-slate-800 border-b-2 border-b-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>محاكي الهاتف وتطبيق الفيديو (Live Sim)</span>
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'tester'
                ? 'bg-slate-900 text-cyan-400 border-t border-x border-slate-800 border-b-2 border-b-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>شاشة اختبار الأوامر الصوتية</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'code'
                ? 'bg-slate-900 text-cyan-400 border-t border-x border-slate-800 border-b-2 border-b-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>استعراض ملفات Android Native المترجمة</span>
          </button>
        </div>

        {/* Tab 1: Simulator & Phone Test */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Phone Display Column */}
            <div className="lg:col-span-5 flex justify-center">
              <PhoneSimulator
                isVoiceActive={isVoiceActive}
                onToggleVoice={() => setIsVoiceActive(!isVoiceActive)}
                language={language}
                onLanguageChange={setLanguage}
                customAliases={customAliasesMap}
                onOpenAliasesModal={() => setIsAliasesModalOpen(true)}
                onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
                onOpenAboutModal={() => setIsAboutModalOpen(true)}
                onOpenTestMode={() => setActiveTab('tester')}
              />
            </div>

            {/* Dashboard & Instructions Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Quick Status Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    حالة تشغيل Voice Scroll
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isVoiceActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isVoiceActive ? '● نشط ويستمع' : '● متوقف'}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  يمكنك التحدث مباشرة في الميكروفون بالأوامر (دوز، التالي، رجع، وقف، كمل)، أو التبديل إلى تبويب "فيديو TikTok" داخل شاشة الهاتف لرؤية التمرير الحي التلقائي (Swipe Up / Down)!
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-400 block mb-1">التعرف على الصوت:</span>
                    <span className="font-bold text-cyan-400">محلي (On-Device)</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-400 block mb-1">الذكاء الاصطناعي:</span>
                    <span className="font-bold text-emerald-400">0% (بدون AI)</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-400 block mb-1">تنفيذ الحركات:</span>
                    <span className="font-bold text-purple-400">Accessibility API</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-400 block mb-1">الإعلانات والحسابات:</span>
                    <span className="font-bold text-white">خالٍ تماماً 100%</span>
                  </div>
                </div>
              </div>

              {/* Supported Commands Overview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">قائمة الأوامر الصوتية المدعومة</h3>
                  <button
                    onClick={() => setIsAliasesModalOpen(true)}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>تخصيص وإضافة كلمات جديدة</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                    <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold shrink-0">
                      ⬆️ التالي (NEXT)
                    </span>
                    <div className="space-y-1">
                      <p className="text-slate-300 font-medium">ينفذ Swipe Up للانتقال للفيديو التالي</p>
                      <p className="text-slate-400 font-mono">
                        المغربية: <span className="text-white">دوز، طلع، طلع للفوق، الفيديو الجاي، زيد</span> • الفصحى: <span className="text-white">التالي، مرر، الفيديو التالي</span> • EN: <span className="text-white">next, scroll up</span> • FR: <span className="text-white">suivant, monte</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 font-bold shrink-0">
                      ⬇️ السابق (PREV)
                    </span>
                    <div className="space-y-1">
                      <p className="text-slate-300 font-medium">ينفذ Swipe Down للرجوع للفيديو السابق</p>
                      <p className="text-slate-400 font-mono">
                        المغربية: <span className="text-white">رجع، هبط، هبط لتحت، الفيديو لي فات</span> • الفصحى: <span className="text-white">السابق، ارجع، رجوع</span> • EN: <span className="text-white">back, previous</span> • FR: <span className="text-white">précédent, retour</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                    <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 font-bold shrink-0">
                      🛑 إيقاف (STOP)
                    </span>
                    <div className="space-y-1">
                      <p className="text-slate-300 font-medium">يوقف الاستماع مؤقتاً لتوفير الطاقة</p>
                      <p className="text-slate-400 font-mono">
                        العربية: <span className="text-white">وقف، حبس، صافي، بركة</span> • EN: <span className="text-white">stop, stop listening</span> • FR: <span className="text-white">arrête, stop</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold shrink-0">
                      ▶️ متابعة (RESUME)
                    </span>
                    <div className="space-y-1">
                      <p className="text-slate-300 font-medium">يستأنف الاستماع للأوامر</p>
                      <p className="text-slate-400 font-mono">
                        العربية: <span className="text-white">كمل، تابع، ابدأ، عاود خدم</span> • EN: <span className="text-white">resume, continue</span> • FR: <span className="text-white">reprendre</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Build & APK Status Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    جاهزية حزمة التطبيق (Build & APK Ready)
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    Compiled Successfully
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  تم بناء وتصريف كود المشروع الأصلي بواسطة Android SDK 34 و Kotlin Compiler بدون أي أخطاء. الكود جاهز للفتح في Android Studio أو التثبيت المباشر على الهاتف.
                </p>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="/VoiceScroll-release.apk"
                    download="VoiceScroll-release.apk"
                    onClick={(e) => handleDownload(e, '/VoiceScroll-release.apk', 'VoiceScroll-release.apk', 'application/vnd.android.package-archive')}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    تحميل ملف VoiceScroll-release.apk
                  </a>

                  <a
                    href="/VoiceScroll-Android-Native-Source.zip"
                    download="VoiceScroll-Android-Native-Source.zip"
                    onClick={(e) => handleDownload(e, '/VoiceScroll-Android-Native-Source.zip', 'VoiceScroll-Android-Native-Source.zip', 'application/zip')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 border border-slate-700 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    تحميل أرشيف المشروع كاملاً (.ZIP)
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Test Voice Engine Directly */}
        {activeTab === 'tester' && (
          <CommandEngineTester customAliases={customAliasesMap} language={language} />
        )}

        {/* Tab 3: Native Project Source Viewer */}
        {activeTab === 'code' && <NativeProjectViewer />}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>Voice Scroll • تطوير: Mohamed Harbaj • تطبيق محلي 100% بدون أي ذكاء اصطناعي وبدون إعلانات</p>
      </footer>

      {/* Modals */}
      <CustomAliasesModal
        isOpen={isAliasesModalOpen}
        onClose={() => setIsAliasesModalOpen(false)}
        aliases={customAliases}
        onAddAlias={handleAddAlias}
        onDeleteAlias={handleDeleteAlias}
      />

      <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
}
