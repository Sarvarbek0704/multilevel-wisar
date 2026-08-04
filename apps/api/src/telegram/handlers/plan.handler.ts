import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanTaskStatus } from '@prisma/client';
import { InlineKeyboard } from 'grammy';
import { StudyPlanService } from '../../study-plan/study-plan.service';
import { TelegramUserService } from '../telegram-user.service';
import { AppBot, BotContext, TelegramHandler } from '../telegram.types';
import { esc, taskIcon } from '../telegram.ui';

@Injectable()
export class PlanHandler implements TelegramHandler {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: TelegramUserService,
    private readonly studyPlanService: StudyPlanService,
  ) {}

  private get webUrl(): string {
    return this.configService.get<string>('WEB_URL') ?? 'https://multilevel.wisar.uz';
  }

  register(bot: AppBot): void {
    bot.command('today', async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      const view = await this.renderPlan(user.id);
      await ctx.reply(view.text, { parse_mode: 'HTML', reply_markup: view.keyboard });
    });

    bot.callbackQuery('menu:today', async (ctx) => {
      await ctx.answerCallbackQuery();
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      const view = await this.renderPlan(user.id);
      await this.edit(ctx, view.text, view.keyboard);
    });

    bot.callbackQuery(/^plan:done:(.+)$/, async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      const taskId = ctx.match[1];
      try {
        await this.studyPlanService.completeTask(user.id, taskId);
        await ctx.answerCallbackQuery({ text: '✅ Bajarildi! +10 XP' });
      } catch {
        await ctx.answerCallbackQuery({ text: 'Vazifa topilmadi' });
      }
      const view = await this.renderPlan(user.id);
      await this.edit(ctx, view.text, view.keyboard);
    });
  }

  private async renderPlan(userId: string): Promise<{ text: string; keyboard: InlineKeyboard }> {
    const active = await this.studyPlanService.getActive(userId);
    const keyboard = new InlineKeyboard();

    if (!active || active.todayTasks.length === 0) {
      keyboard.url('📅 Reja tuzish', `${this.webUrl}/plan`).row().text('⬅️ Asosiy menyu', 'menu:main');
      return {
        text:
          '<b>📅 Bugungi reja</b>\n\n' +
          'Hozircha reja yo‘q. Saytdagi «O‘quv reja» bo‘limida maqsad darajangiz va imtihon sanangizni kiritsangiz, ' +
          'platforma har kun uchun aniq vazifalar tuzib beradi.',
        keyboard,
      };
    }

    const done = active.todayTasks.filter((t) => t.status === PlanTaskStatus.DONE).length;
    const lines = [
      `<b>📅 Bugungi reja</b> — ${done}/${active.todayTasks.length} bajarildi`,
      '',
    ];

    for (const task of active.todayTasks) {
      const mark = task.status === PlanTaskStatus.DONE ? '✅' : '▫️';
      lines.push(
        `${mark} ${taskIcon(task.kind)} ${esc(task.titleUz)} <i>(${task.durationMinutes} daq)</i>`,
      );
    }

    const pending = active.todayTasks.filter((t) => t.status === PlanTaskStatus.PENDING).slice(0, 4);
    for (const task of pending) {
      keyboard.text(`✅ ${this.shorten(task.titleUz)}`, `plan:done:${task.id}`).row();
    }

    if (pending.length === 0) {
      lines.push('', '🎉 <b>Bugungi barcha vazifalar bajarildi! Zo‘r ish!</b>');
    }

    keyboard.url('🌐 Saytda ochish', `${this.webUrl}/plan`).row().text('⬅️ Asosiy menyu', 'menu:main');
    return { text: lines.join('\n'), keyboard };
  }

  private shorten(title: string, max = 28): string {
    return title.length <= max ? title : `${title.slice(0, max - 1)}…`;
  }

  private async edit(ctx: BotContext, text: string, keyboard: InlineKeyboard) {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    }
  }
}
