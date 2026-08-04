import { Injectable } from '@nestjs/common';
import { CefrLevel, Subject } from '@prisma/client';
import { InlineKeyboard } from 'grammy';
import { VocabularyService } from '../../vocabulary/vocabulary.service';
import { TelegramUserService } from '../telegram-user.service';
import { AppBot, BotContext, TelegramHandler } from '../telegram.types';
import { esc } from '../telegram.ui';

const SESSION_SIZE = 10;
const NEW_WORDS_BATCH = 10;

@Injectable()
export class VocabularyHandler implements TelegramHandler {
  constructor(
    private readonly userService: TelegramUserService,
    private readonly vocabularyService: VocabularyService,
  ) {}

  register(bot: AppBot): void {
    bot.command('words', (ctx) => this.startSession(ctx, false));
    bot.callbackQuery('vocab:start', async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.startSession(ctx, true);
    });

    bot.callbackQuery('vocab:add', async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      const added = await this.vocabularyService.startLearning(user.id, {
        subject: Subject.ENGLISH,
        level: user.currentLevel ?? CefrLevel.A2,
        count: NEW_WORDS_BATCH,
      });
      await ctx.answerCallbackQuery({ text: `${added.added} ta so‘z qo‘shildi` });
      await this.startSession(ctx, true);
    });

    bot.callbackQuery(/^vocab:show:(.+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      try {
        const card = await this.vocabularyService.getCard(user.id, ctx.match[1]);
        await this.edit(ctx, this.backText(card), this.gradeKeyboard(card.id));
      } catch {
        await this.edit(ctx, '⚠️ Kartochka topilmadi.', this.doneKeyboard());
      }
    });

    bot.callbackQuery(/^vocab:grade:(.+):(\d)$/, async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      const [, cardId, rawGrade] = ctx.match;
      try {
        const result = await this.vocabularyService.review(user.id, cardId, Number(rawGrade));
        const nextIn =
          result.intervalDays >= 1
            ? `${Math.round(result.intervalDays)} kundan keyin`
            : 'bugun yana';
        await ctx.answerCallbackQuery({ text: `Saqlandi — ${nextIn}` });
      } catch {
        await ctx.answerCallbackQuery({ text: 'Xatolik' });
      }
      ctx.session.vocabReviewed = (ctx.session.vocabReviewed ?? 0) + 1;
      await this.showNext(ctx);
    });
  }

  private async startSession(ctx: BotContext, viaCallback: boolean) {
    const user = await this.userService.ensureUser(ctx);
    if (!user) return;

    const due = await this.vocabularyService.dueCards(user.id, SESSION_SIZE);
    if (due.length === 0) {
      const stats = await this.vocabularyService.stats(user.id);
      const text =
        stats.total === 0
          ? '<b>📚 Lug‘at</b>\n\nHali so‘z to‘plamingiz yo‘q. Darajangizga mos 10 ta so‘z qo‘shamizmi?'
          : `<b>📚 Lug‘at</b>\n\n🎉 Hozircha takrorlash kerak bo‘lgan so‘z yo‘q!\n\n` +
            `Jami: ${stats.total} ta so‘z\nPuxta o‘zlashtirilgan: ${stats.mature} ta\n\n` +
            `Yangi so‘zlar qo‘shishni xohlaysizmi?`;
      const keyboard = new InlineKeyboard()
        .text(`➕ ${NEW_WORDS_BATCH} ta yangi so‘z`, 'vocab:add')
        .row()
        .text('⬅️ Asosiy menyu', 'menu:main');
      await this.send(ctx, text, keyboard, viaCallback);
      return;
    }

    ctx.session.vocabQueue = due.map((card) => card.id);
    ctx.session.vocabReviewed = 0;

    const first = due[0];
    ctx.session.vocabQueue = due.slice(1).map((card) => card.id);
    await this.send(ctx, this.frontText(first, due.length), this.frontKeyboard(first.id), viaCallback);
  }

  private async showNext(ctx: BotContext) {
    const queue = ctx.session.vocabQueue ?? [];
    const nextId = queue.shift();
    ctx.session.vocabQueue = queue;

    if (!nextId) {
      const reviewed = ctx.session.vocabReviewed ?? 0;
      ctx.session.vocabReviewed = 0;
      await this.edit(
        ctx,
        `<b>✅ Sessiya tugadi!</b>\n\n📚 Takrorlangan so‘zlar: <b>${reviewed}</b> ta\n⭐ XP qo‘shildi\n\n` +
          `Ilmiy takrorlash algoritmi har bir so‘zni aynan unutishga yaqin paytda yana ko‘rsatadi — shuning uchun har kuni qaytib turing!`,
        this.doneKeyboard(),
      );
      return;
    }

    const user = await this.userService.ensureUser(ctx);
    if (!user) return;
    try {
      const card = await this.vocabularyService.getCard(user.id, nextId);
      await this.edit(ctx, this.frontText(card, queue.length + 1), this.frontKeyboard(card.id));
    } catch {
      await this.showNext(ctx);
    }
  }

  private frontText(card: { word: { word: string; phonetic: string | null; partOfSpeech: string | null } }, left: number): string {
    const lines = [
      `<b>📚 So‘z takrorlash</b> <i>(qolgani: ${left})</i>`,
      '',
      `<b>${esc(card.word.word)}</b>`,
    ];
    if (card.word.phonetic) lines.push(`<code>${esc(card.word.phonetic)}</code>`);
    if (card.word.partOfSpeech) lines.push(`<i>${esc(card.word.partOfSpeech)}</i>`);
    lines.push('', 'Tarjimasini eslay olasizmi?');
    return lines.join('\n');
  }

  private backText(card: {
    word: {
      word: string;
      phonetic: string | null;
      translation: string;
      definitionEn: string | null;
      exampleEn: string | null;
      exampleUz: string | null;
    };
  }): string {
    const lines = [
      `<b>${esc(card.word.word)}</b>${card.word.phonetic ? ` <code>${esc(card.word.phonetic)}</code>` : ''}`,
      `🇺🇿 <b>${esc(card.word.translation)}</b>`,
    ];
    if (card.word.definitionEn) lines.push('', `<i>${esc(card.word.definitionEn)}</i>`);
    if (card.word.exampleEn) {
      lines.push('', `💬 ${esc(card.word.exampleEn)}`);
      if (card.word.exampleUz) lines.push(`   <i>${esc(card.word.exampleUz)}</i>`);
    }
    lines.push('', 'Qanchalik yaxshi esladingiz?');
    return lines.join('\n');
  }

  private frontKeyboard(cardId: string): InlineKeyboard {
    return new InlineKeyboard()
      .text('👁 Javobni ko‘rish', `vocab:show:${cardId}`)
      .row()
      .text('⏹ Yakunlash', 'menu:main');
  }

  private gradeKeyboard(cardId: string): InlineKeyboard {
    return new InlineKeyboard()
      .text('❌ Bilmadim', `vocab:grade:${cardId}:0`)
      .text('😬 Qiyin', `vocab:grade:${cardId}:3`)
      .row()
      .text('🙂 Yaxshi', `vocab:grade:${cardId}:4`)
      .text('😎 Oson', `vocab:grade:${cardId}:5`)
      .row()
      .text('⏹ Yakunlash', 'menu:main');
  }

  private doneKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
      .text('📚 Yana takrorlash', 'vocab:start')
      .text('🎯 Tezkor test', 'quiz:new')
      .row()
      .text('⬅️ Asosiy menyu', 'menu:main');
  }

  private async send(ctx: BotContext, text: string, keyboard: InlineKeyboard, viaCallback: boolean) {
    if (viaCallback) {
      await this.edit(ctx, text, keyboard);
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    }
  }

  private async edit(ctx: BotContext, text: string, keyboard: InlineKeyboard) {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    }
  }
}
