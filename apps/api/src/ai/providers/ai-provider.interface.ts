import { CefrLevel, Subject } from '@prisma/client';

export interface EvalCriterion {
  name: string;
  score: number;
  max: number;
  commentUz: string;
}

export interface EvalMistake {
  original: string;
  corrected: string;
  explanationUz: string;
}

export interface EvaluationResult {
  /** Section score on the UzBMB 0–75 scale */
  overallScore: number;
  estimatedLevel: CefrLevel | null;
  criteria: EvalCriterion[];
  strengthsUz: string[];
  mistakes: EvalMistake[];
  improvedVersion?: string;
  feedbackUz: string;
  /** Filled for speaking evaluations */
  transcript?: string;
}

export interface WritingEvalInput {
  subject: Subject;
  taskPrompt: string;
  rubric?: unknown;
  text: string;
  targetLevel?: CefrLevel | null;
}

export interface SpeakingEvalInput {
  subject: Subject;
  taskPrompt: string;
  rubric?: unknown;
  audioBase64: string;
  mimeType: string;
  targetLevel?: CefrLevel | null;
}

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  evaluateWriting(input: WritingEvalInput): Promise<EvaluationResult>;
  evaluateSpeaking(input: SpeakingEvalInput): Promise<EvaluationResult>;
  /** Generic text generation (study plan advice, lesson helper, bot quiz) */
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
