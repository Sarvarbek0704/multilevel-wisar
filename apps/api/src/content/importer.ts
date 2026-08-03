import {
  CefrLevel,
  ExerciseType,
  MockKind,
  Prisma,
  PrismaClient,
  Skill,
  Subject,
} from '@prisma/client';
import { CourseFile, MockFile, VocabFile } from './schemas';

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Idempotent course import: upserts by slug, replaces modules/lessons/exercises.
 * Lesson progress survives only when lesson ids survive — a re-import recreates
 * lessons, so treat imports as content-authoring operations, not routine syncs.
 */
export async function importCourse(db: Db, file: CourseFile) {
  const course = await db.course.upsert({
    where: { slug: file.slug },
    create: {
      subject: file.subject as Subject,
      level: file.level as CefrLevel,
      slug: file.slug,
      titleUz: file.titleUz,
      titleEn: file.titleEn,
      descriptionUz: file.descriptionUz,
      descriptionEn: file.descriptionEn,
      icon: file.icon,
      order: file.order ?? 0,
      isPublished: file.isPublished ?? true,
    },
    update: {
      subject: file.subject as Subject,
      level: file.level as CefrLevel,
      titleUz: file.titleUz,
      titleEn: file.titleEn,
      descriptionUz: file.descriptionUz,
      descriptionEn: file.descriptionEn,
      icon: file.icon,
      order: file.order ?? 0,
      ...(file.isPublished !== undefined ? { isPublished: file.isPublished } : {}),
    },
  });

  await db.courseModule.deleteMany({ where: { courseId: course.id } });

  let lessonCount = 0;
  let exerciseCount = 0;
  for (const [moduleIndex, moduleFile] of file.modules.entries()) {
    const courseModule = await db.courseModule.create({
      data: {
        courseId: course.id,
        slug: moduleFile.slug,
        titleUz: moduleFile.titleUz,
        titleEn: moduleFile.titleEn,
        descriptionUz: moduleFile.descriptionUz,
        order: moduleFile.order ?? moduleIndex,
      },
    });
    for (const [lessonIndex, lessonFile] of moduleFile.lessons.entries()) {
      const lesson = await db.lesson.create({
        data: {
          moduleId: courseModule.id,
          slug: lessonFile.slug,
          titleUz: lessonFile.titleUz,
          titleEn: lessonFile.titleEn,
          skill: (lessonFile.skill as Skill) ?? null,
          level: (lessonFile.level as CefrLevel) ?? (file.level as CefrLevel),
          order: lessonFile.order ?? lessonIndex,
          estimatedMinutes: lessonFile.estimatedMinutes ?? 15,
          objectivesUz: lessonFile.objectivesUz ?? [],
          contentJson: lessonFile.content as Prisma.InputJsonValue,
          isPublished: true,
        },
      });
      lessonCount++;
      for (const [exerciseIndex, exerciseFile] of (lessonFile.exercises ?? []).entries()) {
        await db.exercise.create({
          data: {
            lessonId: lesson.id,
            type: exerciseFile.type as ExerciseType,
            skill: exerciseFile.skill as Skill,
            subject: file.subject as Subject,
            level: (exerciseFile.level as CefrLevel) ?? lesson.level,
            order: exerciseFile.order ?? exerciseIndex,
            promptUz: exerciseFile.promptUz,
            promptEn: exerciseFile.promptEn,
            dataJson: exerciseFile.data as Prisma.InputJsonValue,
            answerJson: (exerciseFile.answer ?? undefined) as Prisma.InputJsonValue | undefined,
            explanationUz: exerciseFile.explanationUz,
            points: exerciseFile.points ?? 1,
          },
        });
        exerciseCount++;
      }
    }
  }
  return { courseId: course.id, slug: course.slug, lessons: lessonCount, exercises: exerciseCount };
}

/** Idempotent mock exam import; refuses to replace an exam that already has attempts unless force. */
export async function importMock(db: Db, file: MockFile, options?: { force?: boolean }) {
  const existing = await db.mockExam.findUnique({
    where: { slug: file.slug },
    include: { _count: { select: { attempts: true } } },
  });
  if (existing && existing._count.attempts > 0 && !options?.force) {
    throw new Error(
      `Mock "${file.slug}" already has ${existing._count.attempts} attempts — re-import with force to replace (this cascades attempt answers)`,
    );
  }

  if (existing) {
    await db.examSection.deleteMany({ where: { examId: existing.id } });
  }
  const exam = await db.mockExam.upsert({
    where: { slug: file.slug },
    create: {
      subject: file.subject as Subject,
      kind: (file.kind as MockKind) ?? MockKind.FULL,
      slug: file.slug,
      titleUz: file.titleUz,
      titleEn: file.titleEn,
      descriptionUz: file.descriptionUz,
      order: file.order ?? 0,
      isPublished: file.isPublished ?? true,
    },
    update: {
      subject: file.subject as Subject,
      kind: (file.kind as MockKind) ?? MockKind.FULL,
      titleUz: file.titleUz,
      titleEn: file.titleEn,
      descriptionUz: file.descriptionUz,
      order: file.order ?? 0,
      ...(file.isPublished !== undefined ? { isPublished: file.isPublished } : {}),
    },
  });

  let questionCount = 0;
  for (const [sectionIndex, sectionFile] of file.sections.entries()) {
    const section = await db.examSection.create({
      data: {
        examId: exam.id,
        skill: sectionFile.skill as Skill,
        order: sectionFile.order ?? sectionIndex,
        durationMinutes: sectionFile.durationMinutes,
        instructionsUz: sectionFile.instructionsUz,
        instructionsEn: sectionFile.instructionsEn,
        audioUrl: sectionFile.audioUrl,
      },
    });
    for (const [partIndex, partFile] of sectionFile.parts.entries()) {
      const part = await db.examPart.create({
        data: {
          sectionId: section.id,
          order: partFile.order ?? partIndex,
          titleUz: partFile.titleUz,
          titleEn: partFile.titleEn,
          instructionsUz: partFile.instructionsUz,
          instructionsEn: partFile.instructionsEn,
          passageText: partFile.passageText,
          audioUrl: partFile.audioUrl,
          imageUrl: partFile.imageUrl,
          contextJson: (partFile.context ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
      for (const [questionIndex, questionFile] of partFile.questions.entries()) {
        await db.question.create({
          data: {
            partId: part.id,
            order: questionFile.order ?? questionIndex,
            number: questionFile.number,
            type: questionFile.type as ExerciseType,
            promptEn: questionFile.promptEn,
            promptUz: questionFile.promptUz,
            dataJson: questionFile.data as Prisma.InputJsonValue,
            answerJson: (questionFile.answer ?? undefined) as Prisma.InputJsonValue | undefined,
            points: questionFile.points ?? 1,
            rubricJson: (questionFile.rubric ?? undefined) as Prisma.InputJsonValue | undefined,
          },
        });
        questionCount++;
      }
    }
  }
  return { examId: exam.id, slug: exam.slug, questions: questionCount };
}

/** Vocab import: upserts by (subject, word, translation). */
export async function importVocab(db: Db, file: VocabFile) {
  let created = 0;
  let updated = 0;
  for (const wordFile of file.words) {
    const result = await db.vocabWord.upsert({
      where: {
        subject_word_translation: {
          subject: file.subject as Subject,
          word: wordFile.word,
          translation: wordFile.translation,
        },
      },
      create: {
        subject: file.subject as Subject,
        level: wordFile.level as CefrLevel,
        topic: wordFile.topic,
        word: wordFile.word,
        phonetic: wordFile.phonetic,
        partOfSpeech: wordFile.partOfSpeech,
        translation: wordFile.translation,
        definitionEn: wordFile.definitionEn,
        exampleEn: wordFile.exampleEn,
        exampleUz: wordFile.exampleUz,
        audioUrl: wordFile.audioUrl,
      },
      update: {
        level: wordFile.level as CefrLevel,
        topic: wordFile.topic,
        phonetic: wordFile.phonetic,
        partOfSpeech: wordFile.partOfSpeech,
        definitionEn: wordFile.definitionEn,
        exampleEn: wordFile.exampleEn,
        exampleUz: wordFile.exampleUz,
        audioUrl: wordFile.audioUrl,
      },
    });
    // Prisma upsert lacks created/updated flag — approximate via timestamps
    if (Math.abs(result.createdAt.getTime() - Date.now()) < 5000) created++;
    else updated++;
  }
  return { created, updated, total: file.words.length };
}
