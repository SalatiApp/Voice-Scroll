import { CommandType } from '../types';

export const DIACRITICS_REGEX = /[\u064B-\u065F\u0670]/g;

export function normalizeArabic(raw: string): string {
  if (!raw) return '';
  let text = raw.trim().toLowerCase();
  text = text.replace(DIACRITICS_REGEX, '');
  text = text.replace(/[أإآٱ]/g, 'ا');
  text = text.replace(/ة/g, 'ه');
  text = text.replace(/ى/g, 'ي');
  text = text.replace(/[,.!?:;"'\-_/\\()[\]{}]/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

export const DEFAULT_BUILTIN_COMMANDS: Record<CommandType, string[]> = {
  NEXT: [
    // Standard Arabic
    'التالي',
    'مرر',
    'مرّر',
    'مرر للاعلي',
    'مرر للأعلى',
    'الفيديو التالي',
    'التالي من فضلك',
    // Moroccan Darija
    'دوز',
    'دوز للفيديو الجاي',
    'طلع',
    'طلع للفوق',
    'طلع الفيديو',
    'الفيديو الجاي',
    'دوز للي بعد',
    'دوز للفيديو اللي بعدو',
    'زيد',
    // French
    'suivant',
    'suivante',
    'passe',
    'fais defiler',
    'fais défiler',
    'video suivante',
    'vidéo suivante',
    'passe a la suivante',
    'passe à la suivante',
    'vers le haut',
    'monte',
    // English
    'next',
    'next video',
    'scroll',
    'scroll up',
    'swipe up',
    'up'
  ],

  PREVIOUS: [
    // Standard Arabic
    'السابق',
    'ارجع',
    'رجوع',
    'الفيديو السابق',
    'مرر للاسفل',
    'مرر للأسفل',
    'ارجع للفيديو السابق',
    // Moroccan Darija
    'رجع',
    'رجوع',
    'هبط',
    'هبط لتحت',
    'رجع للفيديو اللي فات',
    'الفيديو اللي فات',
    'الفيديو لي فات',
    'هود',
    // French
    'precedent',
    'précédent',
    'precedente',
    'précédente',
    'retour',
    'reviens',
    'video precedente',
    'vidéo précédente',
    'vers le bas',
    'descend',
    'descends',
    // English
    'previous',
    'previous video',
    'back',
    'go back',
    'scroll down',
    'swipe down',
    'down'
  ],

  STOP: [
    // Arabic
    'توقف',
    'وقف',
    'حبس',
    'اوقف',
    'أوقف',
    'توقف عن الاستماع',
    // Darija
    'وقف',
    'حبس',
    'صافي',
    'حبّس',
    'بركة',
    'وقف الاستماع',
    // French
    'stop',
    'arrete',
    'arrête',
    'arreter',
    'arrêter',
    // English
    'stop',
    'stop listening',
    'halt'
  ],

  RESUME: [
    // Arabic
    'تابع',
    'استمر',
    'كمل',
    'ابدا',
    'ابدأ',
    'استئناف',
    // Darija
    'كمل',
    'كمّل',
    'تابع',
    'عاود خدم',
    'بدا',
    // French
    'continue',
    'continuer',
    'reprendre',
    'recommence',
    // English
    'resume',
    'continue',
    'start'
  ],

  PAUSE: ['ايقاف مؤقت', 'pause', 'وقفة'],
  PLAY: ['شغل', 'تشغيل', 'خدم', 'play'],
  NONE: []
};

// Normalized lookup cache
const normalizedMap: Map<string, CommandType> = new Map();
Object.entries(DEFAULT_BUILTIN_COMMANDS).forEach(([cmd, aliases]) => {
  aliases.forEach((alias) => {
    const norm = normalizeArabic(alias);
    if (norm) normalizedMap.set(norm, cmd as CommandType);
  });
});

export function matchCommand(
  rawText: string,
  customAliases: Record<string, CommandType> = {}
): { command: CommandType; matchedAlias: string; rawText: string } {
  if (!rawText || !rawText.trim()) {
    return { command: 'NONE', matchedAlias: '', rawText: '' };
  }

  const normalized = normalizeArabic(rawText);
  if (!normalized) {
    return { command: 'NONE', matchedAlias: '', rawText };
  }

  // 1. Check custom aliases first
  for (const [phrase, cmd] of Object.entries(customAliases)) {
    const normCustom = normalizeArabic(phrase);
    if (normCustom && (normalized === normCustom || normalized.includes(normCustom))) {
      return { command: cmd, matchedAlias: phrase, rawText };
    }
  }

  // 2. Exact match in built-ins
  if (normalizedMap.has(normalized)) {
    return { command: normalizedMap.get(normalized)!, matchedAlias: normalized, rawText };
  }

  // 3. Substring match
  for (const [phrase, cmd] of normalizedMap.entries()) {
    if (normalized.includes(phrase)) {
      return { command: cmd, matchedAlias: phrase, rawText };
    }
  }

  return { command: 'NONE', matchedAlias: '', rawText };
}
