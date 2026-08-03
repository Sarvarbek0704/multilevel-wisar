import { z } from 'zod';

export const subjectSchema = z.enum(['ENGLISH', 'UZBEK']);
export const cefrLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export const skillSchema = z.enum([
  'LISTENING',
  'READING',
  'WRITING',
  'SPEAKING',
  'GRAMMAR',
  'VOCABULARY',
]);
export const exerciseTypeSchema = z.enum([
  'MCQ_SINGLE',
  'MCQ_MULTI',
  'TRUE_FALSE',
  'GAP_FILL',
  'MATCHING',
  'ORDERING',
  'SHORT_ANSWER',
  'WRITING_TASK',
  'SPEAKING_TASK',
]);
export const mockKindSchema = z.enum(['FULL', 'SECTION', 'MINI', 'PLACEMENT']);

export const exerciseSchema = z.object({
  type: exerciseTypeSchema,
  skill: skillSchema,
  level: cefrLevelSchema.optional(),
  order: z.number().int().optional(),
  promptUz: z.string().optional(),
  promptEn: z.string().optional(),
  data: z.record(z.unknown()),
  answer: z.record(z.unknown()).optional(),
  explanationUz: z.string().optional(),
  points: z.number().positive().optional(),
});

export const lessonSchema = z.object({
  slug: z.string().min(1),
  titleUz: z.string().min(1),
  titleEn: z.string().optional(),
  skill: skillSchema.optional(),
  level: cefrLevelSchema.optional(),
  order: z.number().int().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  objectivesUz: z.array(z.string()).optional(),
  content: z.array(z.record(z.unknown())).min(1),
  exercises: z.array(exerciseSchema).optional(),
});

export const courseFileSchema = z.object({
  subject: subjectSchema,
  level: cefrLevelSchema,
  slug: z.string().min(1),
  titleUz: z.string().min(1),
  titleEn: z.string().optional(),
  descriptionUz: z.string().optional(),
  descriptionEn: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
  modules: z
    .array(
      z.object({
        slug: z.string().min(1),
        titleUz: z.string().min(1),
        titleEn: z.string().optional(),
        descriptionUz: z.string().optional(),
        order: z.number().int().optional(),
        lessons: z.array(lessonSchema).min(1),
      }),
    )
    .min(1),
});

export const questionSchema = z.object({
  number: z.number().int().positive(),
  order: z.number().int().optional(),
  type: exerciseTypeSchema,
  promptEn: z.string().optional(),
  promptUz: z.string().optional(),
  data: z.record(z.unknown()),
  answer: z.record(z.unknown()).optional(),
  points: z.number().positive().optional(),
  rubric: z.record(z.unknown()).optional(),
});

export const mockFileSchema = z.object({
  subject: subjectSchema,
  kind: mockKindSchema.optional(),
  slug: z.string().min(1),
  titleUz: z.string().min(1),
  titleEn: z.string().optional(),
  descriptionUz: z.string().optional(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
  sections: z
    .array(
      z.object({
        skill: skillSchema,
        order: z.number().int().optional(),
        durationMinutes: z.number().int().positive(),
        instructionsUz: z.string().optional(),
        instructionsEn: z.string().optional(),
        audioUrl: z.string().optional(),
        parts: z
          .array(
            z.object({
              order: z.number().int().optional(),
              titleUz: z.string().optional(),
              titleEn: z.string().optional(),
              instructionsUz: z.string().optional(),
              instructionsEn: z.string().optional(),
              passageText: z.string().optional(),
              audioUrl: z.string().optional(),
              imageUrl: z.string().optional(),
              context: z.record(z.unknown()).optional(),
              questions: z.array(questionSchema).min(1),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export const vocabFileSchema = z.object({
  subject: subjectSchema,
  words: z
    .array(
      z.object({
        level: cefrLevelSchema,
        topic: z.string().optional(),
        word: z.string().min(1),
        phonetic: z.string().optional(),
        partOfSpeech: z.string().optional(),
        translation: z.string().min(1),
        definitionEn: z.string().optional(),
        exampleEn: z.string().optional(),
        exampleUz: z.string().optional(),
        audioUrl: z.string().optional(),
      }),
    )
    .min(1),
});

export type CourseFile = z.infer<typeof courseFileSchema>;
export type MockFile = z.infer<typeof mockFileSchema>;
export type VocabFile = z.infer<typeof vocabFileSchema>;
