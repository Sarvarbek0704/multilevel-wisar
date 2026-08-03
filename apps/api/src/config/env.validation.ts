import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  APP_URL: z.string().url().default('http://localhost:3001'),
  WEB_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('900s'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),

  AI_PROVIDER: z.enum(['gemini', 'anthropic', 'mock']).default('gemini'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5'),

  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_WEBHOOK_SECRET: z.string().default('change-me-webhook-secret'),

  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(25),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  return parsed.data;
}
