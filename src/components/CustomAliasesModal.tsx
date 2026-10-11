import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, BookmarkPlus } from 'lucide-react';
import { CommandType, CustomAlias } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  aliases: CustomAlias[];
  onAddAlias: (phrase: string, command: CommandType) => void;
  onDeleteAlias: (id: string) => void;
}

export const CustomAliasesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  aliases,
  onAddAlias,
  onDeleteAlias
}) => {
  const [newPhrase, setNewPhrase] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<CommandType>('NEXT');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) {
      setError('يرجى كتابة الكلمة أو العبارة');
      return;
    }
    onAddAlias(newPhrase.trim(), selectedCommand);
    setNewPhrase('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <BookmarkPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">تخصيص الأوامر الصوتية</h2>
            <p className="text-xs text-slate-400">أضف كلمات بلهجتك الخاصة ليتم تحويلها لأمر محدد</p>
          </div>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 mb-6">
          <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            إضافة كلمة مخصصة جديدة
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">الكلمة أو العبارة (مثال: يلا، سير، دير، دابا):</label>
              <input
                type="text"
                value={newPhrase}
                onChange={(e) => {
                  setNewPhrase(e.target.value);
                  setError('');
                }}
                placeholder="اكتب الكلمة هنا..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition"
              />
              {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">الأمر المستهدف:</label>
              <select
                value={selectedCommand}
                onChange={(e) => setSelectedCommand(e.target.value as CommandType)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="NEXT">التالي (Swipe Up) - تمرير للأعلى</option>
                <option value="PREVIOUS">السابق (Swipe Down) - تمرير للأسفل</option>
                <option value="STOP">إيقاف الاستماع (Stop)</option>
                <option value="RESUME">متابعة الاستماع (Resume)</option>
                <option value="PLAY">تشغيل (Play)</option>
                <option value="PAUSE">إيقاف مؤقت (Pause)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              حفظ الكلمة المخصصة
            </button>
          </div>
        </form>

        {/* Existing Aliases */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 mb-3">الكلمات المخصصة المحفوظة ({aliases.length})</h3>

          {aliases.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700/60 text-xs">
              لا توجد كلمات مخصصة مضافة حالياً.
              <br />
              أضف كلمتك الخاصة بالأعلى لتجربتها فوراً.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {aliases.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 hover:border-slate-600 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-sm">"{item.phrase}"</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                      = {item.command}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteAlias(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="حذف"
                    aria-label="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-sm transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
