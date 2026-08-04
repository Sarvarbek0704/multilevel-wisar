import type { CefrLevel, Skill } from './types';

const MONTHS_UZ = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];

const WEEKDAYS_UZ = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getDate()}-${MONTHS_UZ[date.getMonth()]}`;
}

export function formatDateFull(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getDate()}-${MONTHS_UZ[date.getMonth()]}, ${date.getFullYear()}`;
}

export function weekdayShort(index: number): string {
  return WEEKDAYS_UZ[index] ?? '';
}

/** 3720 → "1 soat 2 daqiqa" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} daqiqa`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} soat` : `${hours} soat ${rest} daqiqa`;
}

/** Soniyalarni 04:32 ko'rinishida */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Soatlab davom etadigan imtihon uchun 1:04:32 */
export function formatLongClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  if (hours === 0) return formatClock(safe);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const SKILL_LABEL: Record<Skill, string> = {
  LISTENING: 'Listening',
  READING: 'Reading',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
  GRAMMAR: 'Grammatika',
  VOCABULARY: 'Lug‘at',
};

/** Imtihon navigatsiyasida bo'lim uchun bitta harf: L R W S */
export const SKILL_LETTER: Record<Skill, string> = {
  LISTENING: 'L',
  READING: 'R',
  WRITING: 'W',
  SPEAKING: 'S',
  GRAMMAR: 'G',
  VOCABULARY: 'V',
};

/** Daraja badge ranglari — platforma bo'ylab bir xil */
export function levelBadgeClass(level: CefrLevel | null | undefined): string {
  switch (level) {
    case 'C1':
    case 'C2':
      return 'border-gold text-gold-text';
    case 'B2':
      return 'border-purple text-purple-text';
    case 'B1':
      return 'border-warn text-warn';
    default:
      return 'border-line-4 text-ink-3';
  }
}

export function levelBadgeClassOnDark(level: CefrLevel | null | undefined): string {
  switch (level) {
    case 'C1':
    case 'C2':
      return 'border-gold text-gold-ondark';
    case 'B2':
      return 'border-purple text-purple';
    case 'B1':
      return 'border-warn text-warn';
    default:
      return 'border-dark-line-2 text-on-dark-2';
  }
}

/** Umumiy ball → CEFR daraja (backend bilan bir xil chegaralar) */
export function levelFromScore(score: number | null): CefrLevel | null {
  if (score === null) return null;
  if (score >= 65) return 'C1';
  if (score >= 51) return 'B2';
  if (score >= 38) return 'B1';
  return null;
}

/** Keyingi darajagacha necha ball qolgani */
export function pointsToNextLevel(score: number): { level: CefrLevel; points: number } | null {
  if (score < 38) return { level: 'B1', points: Math.round((38 - score) * 10) / 10 };
  if (score < 51) return { level: 'B2', points: Math.round((51 - score) * 10) / 10 };
  if (score < 65) return { level: 'C1', points: Math.round((65 - score) * 10) / 10 };
  return null;
}

export function initials(firstName: string, lastName?: string | null): string {
  const first = firstName?.trim()?.[0] ?? '';
  const last = lastName?.trim()?.[0] ?? '';
  return (first + last).toUpperCase() || 'M';
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
