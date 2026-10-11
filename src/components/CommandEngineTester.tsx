import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Check, AlertCircle, ArrowUp, ArrowDown, Octagon, Play, HelpCircle } from 'lucide-react';
import { CommandType, CustomAlias } from '../types';
import { matchCommand } from '../engine/commandEngine';

interface Props {
  customAliases: Record<string, CommandType>;
  language: string;
}

export const CommandEngineTester: React.FC<Props> = ({ customAliases, language }) => {
  const [isListening, setIsListening] = useState(false);
  const [rawText, setRawText] = useState('');
  const [matchedCommand, setMatchedCommand] = useState<CommandType>('NONE');
  const [matchedAlias, setMatchedAlias] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Map language codes
  const speechLang =
    language === 'ar-MA' ? 'ar-MA' :
    language === 'ar-SA' ? 'ar-SA' :
    language === 'fr-FR' ? 'fr-FR' :
    language === 'en-US' ? 'en-US' : 'ar-MA';

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    try {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = speechLang;

      recognizer.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
      };

      recognizer.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const candidate = (finalTranscript || interimTranscript).trim();
        if (candidate) {
          setRawText(candidate);
          const result = matchCommand(candidate, customAliases);
          setMatchedCommand(result.command);
          setMatchedAlias(result.matchedAlias);
          setAudioLevel(Math.min(100, Math.floor(Math.random() * 50 + 50)));
        }
      };

      recognizer.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal timeout, ignore
          return;
        }
        if (event.error === 'not-allowed') {
          setErrorMsg('تم رفض إذن الميكروفون في المتصفح. يرجى السماح به من شريط العنوان.');
          setIsListening(false);
        } else {
          setErrorMsg(`تنبيه: ${event.error}`);
        }
      };

      recognizer.onend = () => {
        if (isListening) {
          try {
            recognizer.start();
          } catch (_) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
          setAudioLevel(0);
        }
      };

      recognitionRef.current = recognizer;
    } catch (err: any) {
      setRecognitionSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [speechLang, customAliases]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    } else {
      setErrorMsg('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const simulateSpeech = (phrase: string) => {
    setRawText(phrase);
    const result = matchCommand(phrase, customAliases);
    setMatchedCommand(result.command);
    setMatchedAlias(result.matchedAlias);
    setAudioLevel(75);
    setTimeout(() => setAudioLevel(0), 400);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            شاشة اختبار الأوامر الصوتية (Test Mode)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تحدث بحرية لاختبار استجابة المحرك. لن يتم تنفيذ أي Swipe أثناء وضع الاختبار.
          </p>
        </div>
        <span className="px-2.5 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
          مطابقة محلية 100% (بدون AI)
        </span>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Mic Button & Visualizer */}
      <div className="my-6 flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800">
        <div className="relative">
          {isListening && (
            <div
              className="absolute -inset-4 rounded-full bg-cyan-500/20 animate-ping opacity-75"
              style={{ animationDuration: '1.5s' }}
            />
          )}
          <button
            onClick={toggleListening}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition shadow-2xl ${
              isListening
                ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/30'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/30'
            }`}
            title={isListening ? 'إيقاف الاستماع' : 'بدء الاستماع'}
            aria-label={isListening ? 'إيقاف الاستماع' : 'بدء الاستماع'}
          >
            {isListening ? <Mic className="w-8 h-8 animate-pulse" /> : <MicOff className="w-8 h-8" />}
          </button>
        </div>

        <p className="text-sm font-bold text-white mt-4">
          {isListening ? '🎙️ يستمع إليك الآن… تفضل بالتحدث' : 'الميكروفون متوقف - اضغط للبدء'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          جرب نطق: "دوز" • "التالي" • "طلع" • "رجع" • "السابق" • "وقف" • "كمل" • "next" • "suivant"
        </p>

        {/* Audio Wave Sim */}
        {isListening && (
          <div className="flex items-center gap-1 mt-4 h-6">
            {[40, 70, 90, 60, 100, 50, 80, 45, 95, 60].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-cyan-400 rounded-full transition-all duration-150 animate-pulse"
                style={{
                  height: `${Math.max(4, (h * audioLevel) / 100)}px`,
                  animationDelay: `${i * 80}ms`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recognition Results Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-1">الكلام الملتقط من الميكروفون:</span>
          <div className="text-base font-bold text-white min-h-[1.75rem] flex items-center">
            {rawText ? `"${rawText}"` : <span className="text-slate-600 font-normal">بانتظار كلامك…</span>}
          </div>
        </div>

        <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-1">الأمر المطابق (CommandType):</span>
          <div className="flex items-center gap-2 min-h-[1.75rem]">
            {matchedCommand === 'NEXT' && (
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold text-base">
                <ArrowUp className="w-5 h-5 text-cyan-400" />
                NEXT (Swipe Up - للأعلى)
              </span>
            )}
            {matchedCommand === 'PREVIOUS' && (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold text-base">
                <ArrowDown className="w-5 h-5 text-amber-400" />
                PREVIOUS (Swipe Down - للأسفل)
              </span>
            )}
            {matchedCommand === 'STOP' && (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold text-base">
                <Octagon className="w-5 h-5 text-rose-400" />
                STOP (إيقاف الاستماع)
              </span>
            )}
            {matchedCommand === 'RESUME' && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-base">
                <Play className="w-5 h-5 text-emerald-400" />
                RESUME (استئناف الاستماع)
              </span>
            )}
            {matchedCommand === 'NONE' && (
              <span className="text-slate-500 text-sm">
                {rawText ? 'لم يطابق أي أمر (لا يتم اتخاذ أي إجراء)' : '—'}
              </span>
            )}
            {matchedAlias && (
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                عبر: {matchedAlias}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Test Chips (simulates speaking without mic hardware) */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-400 block mb-2 font-medium">
          أو انقر لتجربة المطابقة الفورية (محاكاة الصوت):
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'دوز (مغربية)', text: 'دوز' },
            { label: 'التالي (فصحى)', text: 'التالي' },
            { label: 'طلع (دارجة)', text: 'طلع' },
            { label: 'رجع (دارجة)', text: 'رجع' },
            { label: 'السابق (فصحى)', text: 'السابق' },
            { label: 'هبط (دارجة)', text: 'هبط' },
            { label: 'وقف (دارجة/فصحى)', text: 'وقف' },
            { label: 'صافي (مغربية)', text: 'صافي' },
            { label: 'كمل (مغربية)', text: 'كمل' },
            { label: 'next (English)', text: 'next' },
            { label: 'suivant (Français)', text: 'suivant' },
            { label: 'كلمة عشوائية (رفض)', text: 'السلام عليكم كيف الحال' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => simulateSpeech(item.text)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition border border-slate-700/50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
