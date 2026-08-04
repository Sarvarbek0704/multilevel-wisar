import { Injectable } from '@nestjs/common';
import { ExerciseType, Subject } from '@prisma/client';
import { InlineKeyboard } from 'grammy';
import { ExercisesService } from '../../exercises/exercises.service';
import { TelegramUserService } from '../telegram-user.service';
import { AppBot, BotContext, TelegramHandler } from '../telegram.types';
import { clamp, esc, skillIcon } from '../telegram.ui';

const QUIZ_TYPES = [ExerciseType.MCQ_SINGLE, ExerciseType.TRUE_FALSE];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface QuizOption {
  label: string;
  value: string;
}

@Injectable()
export class QuizHandler implements TelegramHandler {
  constructor(
    private readonly userService: TelegramUserService,
    private readonly exercisesService: ExercisesService,
  ) {}

  register(bot: AppBot): void {
    bot.command('quiz', (ctx) => this.sendQuestion(ctx, false));
    bot.callbackQuery('quiz:new', async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.sendQuestion(ctx, true);
    });

    bot.callbackQuery(/^quiz:ans:(.+):(\d+)$/, async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      const [, exerciseId, rawIndex] = ctx.match;

      const exercise = await this.exercisesService.getExercise(exerciseId);
      if (!exercise) {
        await ctx.answerCallbackQuery({ text: 'Savol topilmadi' });
        return;
      }

      const options = this.buildOptions(exercise);
      const chosen = options[Number(rawIndex)];
      if (!chosen) {
        await ctx.answerCallbackQuery({ text: 'Variant topilmadi' });
        return;
      }

      const result = await this.exercisesService.submitAnswer(user.id, exerciseId, {
        value: chosen.value,
      });
      await ctx.answerCallbackQuery({ text: result.isCorrect ? '✅ To‘g‘ri!' : '❌ Xato' });

      const correctValue = (result.correctAnswer as { value?: string } | null)?.value;
      const correctOption = options.find((option) => option.value === correctValue);

      const lines = [
        this.questionText(exercise),
        '',
        result.isCorrect
          ? `✅ <b>To‘g‘ri javob!</b> +${Math.round(exercise.points * 10)} XP`
          : `❌ <b>Xato.</b> Sizning javobingiz: ${esc(chosen.label)}`,
      ];
      if (!result.isCorrect && correctOption) {
        lines.push(`✅ To‘g‘ri javob: <b>${esc(correctOption.label)}</b>`);
      }
      if (result.explanationUz) {
        lines.push('', `💡 <i>${esc(result.explanationUz)}</i>`);
      }

      await this.edit(
        ctx,
        clamp(lines.join('\n')),
        new InlineKeyboard()
          .text('🎯 Keyingi savol', 'quiz:new')
          .row()
          .text('📚 So‘z takrorlash', 'vocab:start')
          .text('⬅️ Menyu', 'menu:main'),
      );
    });
  }

  private async sendQuestion(ctx: BotContext, viaCallback: boolean) {
    const user = await this.userService.ensureUser(ctx);
    if (!user) return;

    const [exercise] = await this.exercisesService.practiceSet({
      subject: Subject.ENGLISH,
      level: user.currentLevel ?? undefined,
      count: 1,
      types: QUIZ_TYPES,
    });

    // Fall back to any level when the user's level has no questions yet
    const question =
      exercise ??
      (
        await this.exercisesService.practiceSet({
          subject: Subject.ENGLISH,
          count: 1,
          types: QUIZ_TYPES,
        })
      )[0];

    if (!question) {
      await this.send(
        ctx,
        'Hozircha testlar mavjud emas. Tez orada qo‘shiladi!',
        new InlineKeyboard().text('⬅️ Asosiy menyu', 'menu:main'),
        viaCallback,
      );
      return;
    }

    const options = this.buildOptions(question);
    const keyboard = new InlineKeyboard();
    for (const [index, option] of options.entries()) {
      keyboard.text(`${LETTERS[index] ?? index + 1}. ${this.shorten(option.label)}`, `quiz:ans:${question.id}:${index}`).row();
    }
    keyboard.text('⬅️ Asosiy menyu', 'menu:main');

    await this.send(ctx, this.questionText(question), keyboard, viaCallback);
  }

  private questionText(exercise: {
    type: ExerciseType;
    skill: string;
    level: string;
    promptUz: string | null;
    promptEn: string | null;
    dataJson: unknown;
  }): string {
    const data = (exercise.dataJson ?? {}) as { text?: string; statement?: string };
    const prompt = exercise.promptUz ?? exercise.promptEn ?? '';
    const body = exercise.type === ExerciseType.TRUE_FALSE ? data.statement : data.text;

    const lines = [`<b>🎯 Tezkor test</b> ${skillIcon(exercise.skill)} <i>${esc(exercise.level)}</i>`, ''];
    if (prompt) lines.push(esc(prompt));
    if (body) lines.push('', `<b>${esc(body)}</b>`);
    return clamp(lines.join('\n'));
  }

  private buildOptions(exercise: { type: ExerciseType; dataJson: unknown }): QuizOption[] {
    if (exercise.type === ExerciseType.TRUE_FALSE) {
      return [
        { label: 'To‘g‘ri', value: 'true' },
        { label: 'Noto‘g‘ri', value: 'false' },
      ];
    }
    const data = (exercise.dataJson ?? {}) as { options?: unknown[] };
    return (data.options ?? []).slice(0, 6).map((option) => ({
      label: String(option),
      value: String(option),
    }));
  }

  private shorten(label: string, max = 40): string {
    return label.length <= max ? label : `${label.slice(0, max - 1)}…`;
  }

  private async send(ctx: BotContext, text: string, keyboard: InlineKeyboard, viaCallback: boolean) {
    if (viaCallback) await this.edit(ctx, text, keyboard);
    else await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }

  private async edit(ctx: BotContext, text: string, keyboard: InlineKeyboard) {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    }
  }
}
