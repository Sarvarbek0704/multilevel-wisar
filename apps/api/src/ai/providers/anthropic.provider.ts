import { Injectable } from '@nestjs/common';
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

/**
 * Claude (Anthropic) provider — switch on via AI_PROVIDER=anthropic + ANTHROPIC_API_KEY
 * when the budget allows. Speaking audio is not yet supported over the Messages API
 * audio input path here; speaking falls back to text-only grading of the transcript
 * produced by a separate STT step (TODO when enabling).
 */
@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';

  constructor(private readonly configService: ConfigService) {}

  get model(): string {
    return this.configService.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-5';
  }

  private get apiKey(): string {
    const key = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!key) throw new Error('ANTHROPIC_API_KEY sozlanmagan');
    return key;
  }

  private async messages(systemPrompt: string, userContent: unknown): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API ${response.status}: ${body.slice(0, 500)}`);
    }
    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    return data.content?.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('') ?? '';
  }

  private parseResult(raw: string): EvaluationResult {
    const cleaned = raw.replace(/^```(?:json)?/m, '').replace(/```\s*$/m, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const levels = Object.values(CefrLevel) as string[];
    return {
      overallScore: Math.max(0, Math.min(75, Number(parsed.overallScore) || 0)),
      estimatedLevel: levels.includes(String(parsed.estimatedLevel))
        ? (parsed.estimatedLevel as CefrLevel)
        : null,
      criteria: Array.isArray(parsed.criteria) ? (parsed.criteria as EvaluationResult['criteria']) : [],
      strengthsUz: Array.isArray(parsed.strengthsUz) ? (parsed.strengthsUz as string[]) : [],
      mistakes: Array.isArray(parsed.mistakes) ? (parsed.mistakes as EvaluationResult['mistakes']) : [],
      improvedVersion: typeof parsed.improvedVersion === 'string' ? parsed.improvedVersion : undefined,
      feedbackUz: typeof parsed.feedbackUz === 'string' ? parsed.feedbackUz : '',
      transcript: typeof parsed.transcript === 'string' ? parsed.transcript : undefined,
    };
  }

  async evaluateWriting(input: WritingEvalInput): Promise<EvaluationResult> {
    const raw = await this.messages(writingSystemPrompt(input.subject), [
      { type: 'text', text: writingUserPrompt(input) },
    ]);
    return this.parseResult(raw);
  }

  async evaluateSpeaking(input: SpeakingEvalInput): Promise<EvaluationResult> {
    // TODO(claude-speaking): plug in STT before enabling anthropic for speaking
    const raw = await this.messages(speakingSystemPrompt(input.subject), [
      {
        type: 'text',
        text: `${speakingUserPrompt(input)}\n\nNOTE: audio transcription unavailable — grade as failed transcription.`,
      },
    ]);
    return this.parseResult(raw);
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.messages(systemPrompt, [{ type: 'text', text: userPrompt }]);
  }
}
