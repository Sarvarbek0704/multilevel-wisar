import { Bot, Context, SessionFlavor } from 'grammy';

export interface WritingTopic {
  promptEn: string;
  promptUz: string;
  minWords: number;
}

export interface SessionData {
  /** Multi-step flow the user is currently in */
  mode?: 'awaiting_writing';
  /** Prompt the user is answering while mode === 'awaiting_writing' */
  writingPrompt?: string;
  writingMinWords?: number;
  /** Topics offered in the last /writing menu (index → topic) */
  writingTopics?: WritingTopic[];
  /** Remaining vocab card ids in the current review session */
  vocabQueue?: string[];
  vocabReviewed?: number;
  /** Cached user id so we don't re-resolve on every update */
  userId?: string;
  profileSynced?: boolean;
}

export type BotContext = Context & SessionFlavor<SessionData>;
export type AppBot = Bot<BotContext>;

/** Every feature handler registers its own commands/callbacks on the bot. */
export interface TelegramHandler {
  register(bot: AppBot): void;
}
