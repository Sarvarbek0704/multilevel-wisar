import { InlineKeyboard } from 'grammy';
import { EvaluationResult } from '../ai/providers/ai-provider.interface';

/** Telegram HTML parse mode escaping. */
export function esc(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Telegram caps messages at 4096 chars. */
export function clamp(text: string, limit = 3900): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

export function mainMenu(webUrl: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('📅 Bugungi reja', 'menu:today')
    .text('📚 So‘z takrorlash', 'vocab:start')
    .row()
    .text('🎯 Tezkor test', 'quiz:new')
    .text('✍️ Writing mashq', 'wr:start')
    .row()
    .text('📊 Statistikam', 'menu:stats')
    .text('⚙️ Sozlamalar', 'menu:settings')
    .row()
    .url('🌐 Saytni ochish', webUrl);
}

export function backToMenu(extra?: InlineKeyboard): InlineKeyboard {
  const keyboard = extra ?? new InlineKeyboard();
  return keyboard.row().text('⬅️ Asosiy menyu', 'menu:main');
}

export const LEVEL_BADGE: Record<string, string> = {
  A1: '🐣 A1',
  A2: '🌱 A2',
  B1: '🥉 B1',
  B2: '🥈 B2',
  C1: '🥇 C1',
  C2: '💎 C2',
};

export function levelBadge(level?: string | null): string {
  if (!level) return 'B1 dan past';
  return LEVEL_BADGE[level] ?? level;
}

/** Progress bar like ██████░░░░ 60% */
export function progressBar(current: number, total: number, width = 10): string {
  if (total <= 0) return '░'.repeat(width);
  const ratio = Math.max(0, Math.min(1, current / total));
  const filled = Math.round(ratio * width);
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)} ${Math.round(ratio * 100)}%`;
}

const SKILL_ICON: Record<string, string> = {
  LISTENING: '🎧',
  READING: '📖',
  WRITING: '✍️',
  SPEAKING: '🎤',
  GRAMMAR: '🧠',
  VOCABULARY: '📚',
};

export function skillIcon(skill?: string | null): string {
  return skill ? (SKILL_ICON[skill] ?? '•') : '•';
}

const TASK_ICON: Record<string, string> = {
  LESSON: '📘',
  EXERCISE_SET: '✏️',
  VOCAB_REVIEW: '📚',
  MOCK_FULL: '📝',
  MOCK_SECTION: '📄',
  CUSTOM: '🎯',
};

export function taskIcon(kind: string): string {
  return TASK_ICON[kind] ?? '•';
}

/** Format an AI evaluation result for a Telegram message (HTML parse mode). */
export function formatEvaluation(result: EvaluationResult, title = '✍️ Writing baholash'): string {
  const lines: string[] = [`<b>${esc(title)}</b>`, ''];

  lines.push(`🏆 <b>Ball:</b> ${result.overallScore}/75 — ${esc(levelBadge(result.estimatedLevel))}`);
  lines.push('');

  if (result.criteria.length > 0) {
    lines.push('<b>Mezonlar bo‘yicha:</b>');
    for (const criterion of result.criteria) {
      lines.push(
        `• <b>${esc(criterion.name)}</b>: ${criterion.score}/${criterion.max}\n  <i>${esc(criterion.commentUz)}</i>`,
      );
    }
    lines.push('');
  }

  if (result.strengthsUz.length > 0) {
    lines.push('<b>✅ Kuchli tomonlar:</b>');
    for (const strength of result.strengthsUz.slice(0, 4)) {
      lines.push(`• ${esc(strength)}`);
    }
    lines.push('');
  }

  if (result.mistakes.length > 0) {
    lines.push('<b>⚠️ Asosiy xatolar:</b>');
    for (const [index, mistake] of result.mistakes.slice(0, 5).entries()) {
      lines.push(
        `${index + 1}. <s>${esc(mistake.original)}</s> → <b>${esc(mistake.corrected)}</b>\n   <i>${esc(mistake.explanationUz)}</i>`,
      );
    }
    lines.push('');
  }

  if (result.feedbackUz) {
    lines.push(`<b>💡 Tavsiya:</b>\n${esc(result.feedbackUz)}`);
  }

  return clamp(lines.join('\n'));
}
