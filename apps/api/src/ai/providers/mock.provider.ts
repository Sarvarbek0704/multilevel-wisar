import { Injectable } from '@nestjs/common';
import { CefrLevel } from '@prisma/client';
import {
  AiProvider,
  EvaluationResult,
  SpeakingEvalInput,
  WritingEvalInput,
} from './ai-provider.interface';

/** Dev/test provider — returns canned results, no API key needed. */
@Injectable()
export class MockAiProvider implements AiProvider {
  readonly name = 'mock';
  readonly model = 'mock-1';

  private canned(transcript?: string): EvaluationResult {
    return {
      overallScore: 55,
      estimatedLevel: CefrLevel.B2,
      criteria: [
        { name: 'Task fulfillment', score: 7, max: 10, commentUz: 'Vazifa asosan bajarilgan.' },
        { name: 'Coherence', score: 7, max: 10, commentUz: 'Fikrlar izchil.' },
        { name: 'Lexical resource', score: 7, max: 10, commentUz: 'So‘z boyligi yetarli.' },
        { name: 'Grammar', score: 7, max: 10, commentUz: 'Ba’zi xatolar bor.' },
      ],
      strengthsUz: ['Tuzilma yaxshi', 'Mavzuga mos'],
      mistakes: [],
      feedbackUz: 'Bu test rejimidagi namunaviy baholash (AI_PROVIDER=mock).',
      transcript,
    };
  }

  async evaluateWriting(_input: WritingEvalInput): Promise<EvaluationResult> {
    return this.canned();
  }

  async evaluateSpeaking(_input: SpeakingEvalInput): Promise<EvaluationResult> {
    return this.canned('(mock transcript)');
  }

  async generateText(_systemPrompt: string, userPrompt: string): Promise<string> {
    return `Mock javob: ${userPrompt.slice(0, 80)}...`;
  }
}
