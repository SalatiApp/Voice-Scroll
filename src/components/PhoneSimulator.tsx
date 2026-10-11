import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Info,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  Volume2,
  Share2,
  MessageCircle,
  Heart,
  Music2,
  Sparkles,
  Smartphone,
  Sliders,
  BookmarkPlus
} from 'lucide-react';
import { CommandType, CustomAlias, VideoItem } from '../types';
import { matchCommand } from '../engine/commandEngine';

interface Props {
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  customAliases: Record<string, CommandType>;
  onOpenAliasesModal: () => void;
  onOpenPrivacyModal: () => void;
  onOpenAboutModal: () => void;
  onOpenTestMode: () => void;
}

const SAMPLE_VIDEOS: VideoItem[] = [
  {
    id: 1,
    creator: 'الشيف سليم 🇲🇦',
    handle: '@chef_salim',
    avatar: '👨‍🍳',
    caption: 'طريقة تحضير طاجين البرقوق المغربي الأصيل بطريقة سهلة وسريعة! قول "دوز" للفيديو التالي 🍲✨',
    music: 'موسيقى كناوة هادئة - أصلية',
    likes: '142.5K',
    comments: '1,842',
    shares: '12.1K',
    bgGradient: 'from-amber-900 via-orange-950 to-slate-950',
    tag: '#طبخ_مغربي #طاجين #أكلات'
  },
  {
    id: 2,
    creator: 'عالم التقنية الحديثة',
    handle: '@tech_arabi',
    avatar: '📱',
    caption: '5 ميزات سرية في أندرويد 14 ستغير طريقة استخدامك للهاتف بالكامل! جرب قول "دوز" أو "طلع" 🚀',
    music: 'Tech Lo-Fi Beat - Electronic',
    likes: '89.2K',
    comments: '932',
    shares: '8.4K',
    bgGradient: 'from-blue-950 via-cyan-950 to-slate-950',
    tag: '#أندرويد #تكنولوجيا #نصائح'
  },
  {
    id: 3,
    creator: 'رحالة المغرب',
    handle: '@morocco_travel',
    avatar: '🏔️',
    caption: 'سحر مدينة شفشاون الزرقاء في الصباح الباكر.. هدوء وجمال لا يوصف في جبال الريف 💙',
    music: 'أندلسيات مغربية تراثية',
    likes: '210.8K',
    comments: '3,120',
    shares: '25.6K',
    bgGradient: 'from-sky-900 via-indigo-950 to-slate-950',
    tag: '#شفشاون #سياحة_المغرب #سفر'
  },
  {
    id: 4,
    creator: 'ضحك وفرفشة',
    handle: '@fun_maroc',
    avatar: '😂',
    caption: 'ردة فعل القطط لما تشوف الخيار لأول مرة هههه! قول "رجع" إذا بغيتي ترجع تشوف اللي فات 🐱🤣',
    music: 'موسيقى مرحة وكوميدية',
    likes: '340.1K',
    comments: '4,520',
    shares: '48.9K',
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-950',
    tag: '#ضحك #مقالب #حيوانات'
  },
  {
    id: 5,
    creator: 'مبرمج مستقل',
    handle: '@code_salati',
    avatar: '💻',
    caption: 'كيف بنينا تطبيق Voice Scroll بمحرك أوامر محلي 100% بدون أي ذكاء اصطناعي وبدون إعلانات! 🛡️⚡',
    music: 'Synthwave Coding Chill',
    likes: '95.4K',
    comments: '1,410',
    shares: '15.3K',
    bgGradient: 'from-purple-950 via-violet-950 to-slate-950',
    tag: '#تطوير #كود #أندرويد'
  }
];

export const PhoneSimulator: React.FC<Props> = ({
  isVoiceActive,
  onToggleVoice,
  language,
  onLanguageChange,
  customAliases,
  onOpenAliasesModal,
  onOpenPrivacyModal,
  onOpenAboutModal,
  onOpenTestMode
}) => {
  const [currentApp, setCurrentApp] = useState<'voicescroll' | 'tiktok'>('voicescroll');
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [gestureEffect, setGestureEffect] = useState<'up' | 'down' | null>(null);
  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState(true);
  const [liveSpeechStatus, setLiveSpeechStatus] = useState<string>('متوقف');
  const [lastSpokenPhrase, setLastSpokenPhrase] = useState<string>('');
  const [currentTime, setCurrentTime] = useState('12:45');

  const recognitionRef = useRef<any>(null);

  // Time clock simulation
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  // Web Speech recognition integration when Voice Control is active
  useEffect(() => {
    if (!isVoiceActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setLiveSpeechStatus('التحكم الصوتي متوقف');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setLiveSpeechStatus('المتصفح لا يدعم SpeechRecognition (استخدم أزرار المحاكاة)');
      return;
    }

    try {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = language === 'auto' ? 'ar-MA' : language;

      recognizer.onstart = () => {
        setLiveSpeechStatus('🎙️ يستمع إلى صوتك...');
      };

      recognizer.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        const candidate = text.trim();
        if (candidate) {
          setLastSpokenPhrase(candidate);
          const match = matchCommand(candidate, customAliases);
          if (match.command !== 'NONE') {
            handleCommandExecution(match.command, match.rawText);
          }
        }
      };

      recognizer.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech recognizer error', e);
        }
      };

      recognizer.onend = () => {
        if (isVoiceActive) {
          try {
            recognizer.start();
          } catch (_) {}
        }
      };

      recognitionRef.current = recognizer;
      recognizer.start();
    } catch (e) {
      console.error(e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [isVoiceActive, language, customAliases]);

  const handleCommandExecution = (command: CommandType, phrase: string) => {
    if (!isAccessibilityEnabled && command !== 'STOP' && command !== 'RESUME') {
      setLiveSpeechStatus('خطأ: خدمة إمكانية الوصول غير مفعلة!');
      return;
    }

    if (command === 'NEXT') {
      setGestureEffect('up');
      setTimeout(() => setGestureEffect(null), 600);
      setCurrentVideoIdx((prev) => (prev + 1) % SAMPLE_VIDEOS.length);
      setLiveSpeechStatus(`تم التمرير للأعلى ⬆️ ("${phrase}")`);
    } else if (command === 'PREVIOUS') {
      setGestureEffect('down');
      setTimeout(() => setGestureEffect(null), 600);
      setCurrentVideoIdx((prev) => (prev - 1 + SAMPLE_VIDEOS.length) % SAMPLE_VIDEOS.length);
      setLiveSpeechStatus(`تم التمرير للأسفل ⬇️ ("${phrase}")`);
    } else if (command === 'STOP') {
      onToggleVoice();
      setLiveSpeechStatus(`تم إيقاف الاستماع 🛑 ("${phrase}")`);
    } else if (command === 'RESUME') {
      if (!isVoiceActive) onToggleVoice();
      setLiveSpeechStatus(`تم استئناف الاستماع ▶️ ("${phrase}")`);
    }
  };

  const currentVideo = SAMPLE_VIDEOS[currentVideoIdx];

  return (
    <div className="flex flex-col items-center">
      {/* Device Frame */}
      <div className="relative w-[340px] h-[690px] bg-slate-900 rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-800 shadow-cyan-500/10 border-4 border-slate-700/80 overflow-hidden flex flex-col select-none">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-40 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700 mr-4" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-900/60" />
        </div>

        {/* Screen Area */}
        <div className="relative w-full h-full bg-slate-950 rounded-[34px] overflow-hidden flex flex-col text-slate-100">
          {/* Android Status Bar */}
          <div className="h-9 px-6 pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 z-30 bg-transparent">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1.5">
              {isVoiceActive && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" title="الميكروفون يعمل" />
              )}
              <span>5G</span>
              <span className="text-[10px]">98%</span>
            </div>
          </div>

          {/* App Switcher Bar at Top of Phone */}
          <div className="px-3 pb-2 pt-1 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md z-30">
            <div className="flex gap-1 p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setCurrentApp('voicescroll')}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${
                  currentApp === 'voicescroll'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تطبيق Voice Scroll
              </button>
              <button
                onClick={() => setCurrentApp('tiktok')}
                className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
                  currentApp === 'tiktok'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>فيديو TikTok</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </button>
            </div>

            <button
              onClick={() => setIsAccessibilityEnabled(!isAccessibilityEnabled)}
              title={isAccessibilityEnabled ? 'Accessibility مفعلة' : 'Accessibility معطلة'}
              className={`p-1.5 rounded-lg text-xs ${
                isAccessibilityEnabled
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>

          {/* Content Area */}
          <div className="relative flex-1 overflow-hidden">
            {currentApp === 'voicescroll' ? (
              /* VOICE SCROLL NATIVE ANDROID UI - REDESIGNED TO MATCH REFERENCE IMAGE */
              <div className="h-full overflow-y-auto px-4 py-3 space-y-3.5 text-right bg-[#060b13] text-white">
                {/* Top Bar: Settings Gear at Extreme Left, "Voice Scroll" Centered */}
                <div className="relative flex items-center justify-center pt-1 pb-0.5">
                  <button
                    onClick={onOpenAliasesModal}
                    className="absolute left-0 w-8 h-8 flex items-center justify-center text-white/90 hover:text-white transition rounded-xl hover:bg-white/10"
                    title="الإعدادات وتخصيص الأوامر"
                  >
                    <Settings className="w-5 h-5 text-white" />
                  </button>
                  <h1 className="text-2xl font-black text-white tracking-wide">Voice Scroll</h1>
                </div>

                {/* Subtitle Pill Capsule with Cyan Border & Mic Icon */}
                <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full border-2 border-[#00d7f4] bg-[#00d7f4]/5 shadow-[0_0_15px_rgba(0,215,244,0.15)] mx-auto max-w-fit">
                  <Mic className="w-4 h-4 text-[#00d7f4]" />
                  <span className="text-[#00d7f4] text-xs font-bold tracking-tight">
                    تحكم صوتي في تمرير مقاطع الفيديو
                  </span>
                </div>

                {/* Supported Platforms: 4 Rounded Cards in One Centered Row */}
                <div className="grid grid-cols-4 gap-2 pt-0.5">
                  {/* TikTok */}
                  <div className="bg-[#0b1424] border border-[#162740] rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 shadow-sm">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" style={{ filter: 'drop-shadow(-1px -1px 0px #00f2fe) drop-shadow(1px 1px 0px #fe0979)' }}>
                        <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.903 2.883 2.896 2.896 0 0 1-2.894-2.883 2.896 2.896 0 0 1 2.894-2.883c.277 0 .543.04.797.112V9.378a6.34 6.34 0 0 0-.797-.05 6.34 6.34 0 0 0-6.34 6.344 6.34 6.34 0 0 0 6.34 6.343 6.34 6.34 0 0 0 6.34-6.343V9.117a8.17 8.17 0 0 0 4.778 1.523V7.214a4.815 4.815 0 0 1-1-.528z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-white">TikTok</span>
                  </div>

                  {/* YouTube */}
                  <div className="bg-[#0b1424] border border-[#162740] rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 shadow-sm">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#FF0000]">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-white">YouTube</span>
                  </div>

                  {/* Instagram */}
                  <div className="bg-[#0b1424] border border-[#162740] rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 shadow-sm">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center p-0.5">
                      <div className="w-full h-full rounded border-[1.5px] border-white flex items-center justify-center relative">
                        <div className="w-1.5 h-1.5 rounded-full border-[1.2px] border-white" />
                        <div className="w-0.5 h-0.5 rounded-full bg-white absolute top-0.5 right-0.5" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white">Instagram</span>
                  </div>

                  {/* Facebook */}
                  <div className="bg-[#0b1424] border border-[#162740] rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-black text-xs">
                      f
                    </div>
                    <span className="text-[10px] font-bold text-white">Facebook</span>
                  </div>
                </div>

                {/* Voice Control Status Card */}
                <div className="p-4 rounded-2xl bg-[#0b1424] border border-[#162740] flex flex-col items-center text-center shadow-lg">
                  <div
                    className={`w-3.5 h-3.5 rounded-full mb-2 ${
                      isVoiceActive
                        ? 'bg-[#00d7f4] shadow-[0_0_12px_#00d7f4] animate-pulse'
                        : 'bg-slate-400'
                    }`}
                  />
                  <h3 className="text-base font-black text-white">
                    {isVoiceActive ? 'التحكم الصوتي يعمل' : 'التحكم الصوتي متوقف'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {liveSpeechStatus || 'جاهز للبدء'}
                  </p>
                  {lastSpokenPhrase && (
                    <span className="text-[10px] text-[#00d7f4] mt-1 font-mono">
                      آخر التقاط: "{lastSpokenPhrase}"
                    </span>
                  )}
                </div>

                {/* Main Voice Control Button - Solid Cyan with Dark Text */}
                <button
                  onClick={onToggleVoice}
                  className={`w-full py-3.5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,215,244,0.3)] active:scale-[0.98] ${
                    isVoiceActive
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                      : 'bg-[#00d7f4] hover:bg-[#20e2fd] text-[#060b13]'
                  }`}
                >
                  <span>{isVoiceActive ? 'إيقاف التحكم الصوتي' : 'تشغيل التحكم الصوتي'}</span>
                </button>

                {/* Accessibility Status Bar */}
                <div
                  className="w-full p-3 bg-[#0b1424] rounded-xl border border-[#162740] flex items-center justify-center gap-3.5 text-xs select-none"
                  dir="rtl"
                >
                  <span className={`font-bold truncate text-center ${isAccessibilityEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isAccessibilityEnabled ? 'خدمة إمكانية الوصول: مفعلة ✓' : 'خدمة إمكانية الوصول غير مفعلة'}
                  </span>
                  {!isAccessibilityEnabled && (
                    <button
                      onClick={() => setIsAccessibilityEnabled(true)}
                      className="px-3.5 py-1 rounded-lg border border-[#00d7f4]/40 bg-[#00d7f4]/10 text-[#00d7f4] font-bold text-xs hover:bg-[#00d7f4]/20 transition shrink-0 active:scale-95 cursor-pointer"
                    >
                      تفعيل
                    </button>
                  )}
                </div>

                {/* Language Selector Dropdown on ONE Horizontal Line */}
                <div className="relative h-11 px-3 bg-[#0b1424] rounded-xl border border-[#162740] flex items-center justify-center text-xs select-none" dir="rtl">
                  <div className="flex items-center justify-center gap-1.5 w-full min-w-0 text-center px-1">
                    <span className="text-white font-bold truncate text-center text-xs tracking-wide">
                      {language === 'ar-MA'
                        ? 'الدارجة المغربية (ar-MA)'
                        : language === 'ar-SA'
                        ? 'العربية الفصحى (ar-SA) – لغة الأوامر'
                        : language === 'fr-FR'
                        ? 'Français (fr-FR)'
                        : language === 'en-US'
                        ? 'English (en-US)'
                        : 'تلقائي (Auto)'}
                    </span>
                    <span className="text-[#00d7f4] text-[10px] shrink-0">🔻</span>
                  </div>
                  {/* Invisible native select overlay for functionality preservation */}
                  <select
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-center"
                    title="اختيار لغة الأوامر"
                    dir="rtl"
                  >
                    <option value="ar-MA">الدارجة المغربية (ar-MA)</option>
                    <option value="ar-SA">العربية الفصحى (ar-SA) – لغة الأوامر</option>
                    <option value="fr-FR">Français (fr-FR)</option>
                    <option value="en-US">English (en-US)</option>
                    <option value="auto">تلقائي (Auto)</option>
                  </select>
                </div>

                {/* Basic Commands Section */}
                <div className="space-y-2 pt-1 text-right">
                  <h4 className="text-sm font-black text-white">الأوامر الأساسية</h4>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {/* Row 1: Next / Up */}
                    <div className="flex items-center justify-end gap-2 py-0.5">
                      <span className="text-right">التالي، دون التالي، طلع، next suivant</span>
                      <div className="w-4 h-4 rounded bg-[#00d7f4] flex items-center justify-center shrink-0">
                        <ArrowUp className="w-3 h-3 text-[#060b13] stroke-[3]" />
                      </div>
                    </div>

                    {/* Row 2: Previous / Down */}
                    <div className="flex items-center justify-end gap-2 py-0.5">
                      <span className="text-right">السابق، رجع، السابق، هبط، back précédent</span>
                      <div className="w-4 h-4 rounded bg-[#00d7f4] flex items-center justify-center shrink-0">
                        <ArrowDown className="w-3 h-3 text-[#060b13] stroke-[3]" />
                      </div>
                    </div>

                    {/* Row 3: Stop */}
                    <div className="flex items-center justify-end gap-2 py-0.5">
                      <span className="text-right">توقف، وقف، حبس، صافي، stop</span>
                      <div className="w-4 h-4 rounded bg-[#ff2a51] flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 bg-white rounded-xs" />
                      </div>
                    </div>

                    {/* Row 4: Resume */}
                    <div className="flex items-center justify-end gap-2 py-0.5">
                      <span className="text-right">متابعة، كمل، تابع، أبدأ، resume</span>
                      <div className="w-4 h-4 rounded bg-[#f59e0b] flex items-center justify-center shrink-0">
                        <Play className="w-2.5 h-2.5 text-[#060b13] fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons: Cyan Outline */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={onOpenTestMode}
                    className="py-2.5 px-3 rounded-2xl border-2 border-[#00d7f4] text-[#00d7f4] font-bold text-xs bg-transparent hover:bg-[#00d7f4]/10 transition text-center"
                  >
                    اختيار الأوامر
                  </button>
                  <button
                    onClick={onOpenAliasesModal}
                    className="py-2.5 px-3 rounded-2xl border-2 border-[#00d7f4] text-[#00d7f4] font-bold text-xs bg-transparent hover:bg-[#00d7f4]/10 transition text-center"
                  >
                    تخصيص الأوامر
                  </button>
                </div>

                {/* Quick Guide Section with 4 Steps */}
                <div className="space-y-1.5 pt-2 text-right">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentApp('tiktok')}
                      className="text-[10px] text-[#00d7f4] hover:underline font-bold"
                    >
                      تجربة التمرير على الفيديو ⬅
                    </button>
                    <h4 className="text-xs font-black text-white">طريقة الاستخدام السريعة</h4>
                  </div>
                  <div className="p-3 bg-[#0b1424] rounded-xl border border-[#162740] space-y-1.5 text-[11px] text-slate-300">
                    <p className="leading-relaxed">1. امنح صلاحيات الميكروفون وخدمة إمكانية الوصول (Accessibility).</p>
                    <p className="leading-relaxed">2. اضغط على زر "تشغيل التحكم الصوتي" بالأعلى.</p>
                    <p className="leading-relaxed">3. افتح أي تطبيق فيديوهات قصيرة (TikTok، YouTube Shorts، Reels، Facebook).</p>
                    <p className="leading-relaxed">4. انطق الأوامر: "دوز" أو "طلع" للتالي، "رجع" أو "هبط" للسابق، "وقف" للإيقاف.</p>
                  </div>
                </div>

                {/* Bottom Android Home Indicator Bar */}
                <div className="pt-1 pb-1">
                  <div className="w-28 h-1 bg-white/40 rounded-full mx-auto" />
                </div>
              </div>
            ) : (
              /* SIMULATED SHORT VIDEO FEED (TIKTOK / REELS) */
              <div
                className={`relative w-full h-full bg-gradient-to-b ${currentVideo.bgGradient} flex flex-col justify-between p-4 transition-all duration-300`}
              >
                {/* Floating Voice Scroll Accessibility Head at Top */}
                <div className="absolute top-2 left-2 right-2 z-30">
                  <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isVoiceActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`}
                      />
                      <span className="font-bold">Voice Scroll:</span>
                      <span className="text-cyan-300 truncate max-w-[120px]">
                        {isVoiceActive ? 'يستمع لأمرك...' : 'متوقف'}
                      </span>
                    </div>

                    <button
                      onClick={onToggleVoice}
                      className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[9px] font-bold"
                    >
                      {isVoiceActive ? 'إيقاف' : 'تشغيل'}
                    </button>
                  </div>
                </div>

                {/* Gesture Trail Visualizer (The Safe Swipe path executed by Accessibility Service) */}
                {gestureEffect === 'up' && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
                    <div className="w-1.5 h-48 bg-gradient-to-t from-transparent via-cyan-400 to-transparent rounded-full shadow-lg shadow-cyan-400/80 animate-pulse" />
                    <div className="mt-2 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-lg">
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>Swipe Up: دوز (التالي)</span>
                    </div>
                  </div>
                )}

                {gestureEffect === 'down' && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
                    <div className="w-1.5 h-48 bg-gradient-to-b from-transparent via-amber-400 to-transparent rounded-full shadow-lg shadow-amber-400/80 animate-pulse" />
                    <div className="mt-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-lg">
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Swipe Down: رجع (السابق)</span>
                    </div>
                  </div>
                )}

                {/* Right Side Social Actions (Away from the safe center swipe line) */}
                <div className="absolute right-3 bottom-16 flex flex-col items-center gap-4 z-20">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-white/20 flex items-center justify-center text-lg">
                    {currentVideo.avatar}
                  </div>
                  <div className="flex flex-col items-center">
                    <button className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    </button>
                    <span className="text-[10px] text-white font-bold">{currentVideo.likes}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <button className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-[10px] text-white font-bold">{currentVideo.comments}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <button className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition">
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-[10px] text-white font-bold">{currentVideo.shares}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center animate-spin">
                    <Music2 className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>

                {/* Video Info Bottom */}
                <div className="mt-auto pr-2 pl-12 z-20 space-y-1.5 text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{currentVideo.creator}</span>
                    <span className="text-[10px] text-slate-400">{currentVideo.handle}</span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                    {currentVideo.caption}
                  </p>
                  <p className="text-[10px] text-cyan-300 font-mono">{currentVideo.tag}</p>
                </div>

                {/* Gesture Swipe Trigger Control Bar */}
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs z-30">
                  <button
                    onClick={() => handleCommandExecution('PREVIOUS', 'السابق')}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-[11px] flex items-center gap-1"
                  >
                    <ArrowDown className="w-3 h-3 text-amber-400" />
                    <span>السابق ("رجع")</span>
                  </button>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentVideoIdx + 1} / {SAMPLE_VIDEOS.length}
                  </span>

                  <button
                    onClick={() => handleCommandExecution('NEXT', 'دوز')}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-[11px] flex items-center gap-1 font-bold text-cyan-300"
                  >
                    <span>التالي ("دوز")</span>
                    <ArrowUp className="w-3 h-3 text-cyan-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Android Navigation Bar */}
          <div className="h-6 bg-slate-950 flex items-center justify-center gap-12 text-slate-500 text-xs">
            <span className="w-2.5 h-2.5 border-b-2 border-r-2 border-slate-500 rotate-45 transform" />
            <span className="w-3 h-3 rounded-full border border-slate-500" />
            <span className="w-2.5 h-2.5 border border-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
