import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CefrLevel } from '@prisma/client';
import {
  AiProvider,
  EvaluationResult,
  SpeakingEvalInput,
  WritingEvalInput,
} from './ai-provider.interface';
import {
  speakingSystemPrompt,
  speakingUserPrompt,
  writingSystemPrompt,
  writingUserPrompt,
} from '../prompts';

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly configService: ConfigService) {}

  get model(): string {
    return this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  private get apiKey(): string {
    const key = this.configService.get<string>('GEMINI_API_KEY');
    if (!key) throw new Error('GEMINI_API_KEY sozlanmagan');
    return key;
  }

  private async generate(
    systemPrompt: string,
    parts: GeminiPart[],
    jsonMode: boolean,
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    };

    // Retry on rate limits (429) / transient 5xx with backoff. Free-tier Gemini
    // throttles by requests-per-minute and returns "Please retry in Ns" — honour
    // it so a single grading request succeeds instead of surfacing a 500.
    const maxRetries = 5;
    let response!: Response;
    for (let attempt = 0; ; attempt++) {
      response = await fetch(url, init);
      if (response.ok) break;
      const body = await response.text();
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt >= maxRetries) {
        throw new Error(`Gemini API ${response.status}: ${body.slice(0, 500)}`);
      }
      const match = body.match(/retry in ([0-9.]+)s/i);
      const delayMs = match
        ? Math.ceil(parseFloat(match[1]) * 1000) + 500
        : 2000 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 60000)));
    }
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    if (!text) throw new Error('Gemini bo‘sh javob qaytardi');
    return text;
  }

  private parseResult(raw: string): EvaluationResult {
    // Strip accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?/m, '').replace(/```\s*$/m, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const levels = Object.values(CefrLevel) as string[];
    const estimatedLevel = levels.includes(String(parsed.estimatedLevel))
      ? (parsed.estimatedLevel as CefrLevel)
      : null;

    return {
      overallScore: Math.max(0, Math.min(75, Number(parsed.overallScore) || 0)),
      estimatedLevel,
      criteria: Array.isArray(parsed.criteria) ? (parsed.criteria as EvaluationResult['criteria']) : [],
      strengthsUz: Array.isArray(parsed.strengthsUz) ? (parsed.strengthsUz as string[]) : [],
      mistakes: Array.isArray(parsed.mistakes) ? (parsed.mistakes as EvaluationResult['mistakes']) : [],
      improvedVersion: typeof parsed.improvedVersion === 'string' ? parsed.improvedVersion : undefined,
      feedbackUz: typeof parsed.feedbackUz === 'string' ? parsed.feedbackUz : '',
      transcript: typeof parsed.transcript === 'string' ? parsed.transcript : undefined,
    };
  }

  async evaluateWriting(input: WritingEvalInput): Promise<EvaluationResult> {
    const raw = await this.generate(
      writingSystemPrompt(input.subject),
      [{ text: writingUserPrompt(input) }],
      true,
    );
    return this.parseResult(raw);
  }

  async evaluateSpeaking(input: SpeakingEvalInput): Promise<EvaluationResult> {
    const raw = await this.generate(
      speakingSystemPrompt(input.subject),
      [
        { text: speakingUserPrompt(input) },
        { inlineData: { mimeType: input.mimeType, data: input.audioBase64 } },
      ],
      true,
    );
    return this.parseResult(raw);
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.generate(systemPrompt, [{ text: userPrompt }], false);
  }
}
