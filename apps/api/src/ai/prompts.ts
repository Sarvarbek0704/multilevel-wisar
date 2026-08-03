import { Subject } from '@prisma/client';
import { SpeakingEvalInput, WritingEvalInput } from './providers/ai-provider.interface';

const RESULT_SHAPE = `{
  "overallScore": <number 0-75, UzBMB section scale>,
  "estimatedLevel": "<A1|A2|B1|B2|C1|C2>",
  "criteria": [{"name": "<criterion>", "score": <number>, "max": 10, "commentUz": "<izoh o'zbekcha>"}],
  "strengthsUz": ["<kuchli tomon o'zbekcha>"],
  "mistakes": [{"original": "<xato parcha>", "corrected": "<to'g'ri varianti>", "explanationUz": "<nima uchun, o'zbekcha>"}],
  "improvedVersion": "<yaxshilangan to'liq matn>",
  "feedbackUz": "<umumiy tavsiya o'zbek tilida, 3-5 gap>",
  "transcript": "<speaking uchun: to'liq transkripsiya>"
}`;

function subjectName(subject: Subject): string {
  return subject === Subject.ENGLISH ? 'English (UzBMB multilevel)' : 'O‘zbek tili (milliy sertifikat)';
}

export function writingSystemPrompt(subject: Subject): string {
  return `You are a strict, experienced ${subjectName(subject)} examiner. You grade writing tasks exactly per the official UzBMB multilevel rubric: Task fulfillment, Coherence & cohesion, Lexical resource, Grammatical range & accuracy (each 0-10). Map the total to a 0-75 section score (C1: 65-75, B2: 51-64, B1: 38-50). All feedback, comments and explanations MUST be written in Uzbek (Latin script) so a learner can understand them; keep quoted mistakes in the original language. Respond with ONLY valid JSON matching this shape:\n${RESULT_SHAPE}`;
}

export function writingUserPrompt(input: WritingEvalInput): string {
  return [
    `TASK PROMPT:\n${input.taskPrompt}`,
    input.rubric ? `RUBRIC:\n${JSON.stringify(input.rubric)}` : null,
    input.targetLevel ? `LEARNER TARGET LEVEL: ${input.targetLevel}` : null,
    `LEARNER'S ANSWER:\n${input.text}`,
    `Grade the answer. Count words; if severely under-length, penalize Task fulfillment and say so in feedbackUz. Do NOT include "transcript" for writing.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function speakingSystemPrompt(subject: Subject): string {
  return `You are a strict, experienced ${subjectName(subject)} speaking examiner. First transcribe the learner's audio exactly. Then grade per the official UzBMB multilevel speaking rubric: Fluency & coherence, Lexical resource, Grammatical range & accuracy, Pronunciation (each 0-10). Map the total to a 0-75 section score (C1: 65-75, B2: 51-64, B1: 38-50). All feedback MUST be in Uzbek (Latin script); keep quoted mistakes in the original language. Respond with ONLY valid JSON matching this shape:\n${RESULT_SHAPE}`;
}

export function speakingUserPrompt(input: SpeakingEvalInput): string {
  return [
    `TASK PROMPT:\n${input.taskPrompt}`,
    input.rubric ? `RUBRIC:\n${JSON.stringify(input.rubric)}` : null,
    input.targetLevel ? `LEARNER TARGET LEVEL: ${input.targetLevel}` : null,
    `The learner's spoken answer is attached as audio. Transcribe it into "transcript", then grade it. If the audio is silent or unintelligible, give overallScore 0 and explain in feedbackUz.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
