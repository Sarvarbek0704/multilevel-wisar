import { Injectable, NotFoundException } from '@nestjs/common';
import { Subject } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCourses(subject?: Subject) {
    return this.prisma.course.findMany({
      where: { isPublished: true, ...(subject ? { subject } : {}) },
      orderBy: [{ subject: 'asc' }, { order: 'asc' }],
      include: {
        _count: { select: { modules: true } },
      },
    });
  }

  async getCourse(slug: string, userId?: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, isPublished: true },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                slug: true,
                titleUz: true,
                titleEn: true,
                skill: true,
                level: true,
                order: true,
                estimatedMinutes: true,
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    if (!userId) return course;

    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const progress = await this.prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    });
    const progressMap = new Map(progress.map((p) => [p.lessonId, p]));
    return {
      ...course,
      modules: course.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => ({
          ...l,
          progress: progressMap.get(l.id)
            ? {
                status: progressMap.get(l.id)!.status,
                score: progressMap.get(l.id)!.score,
              }
            : null,
        })),
      })),
    };
  }

  async getLesson(lessonId: string, userId?: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, isPublished: true },
      include: {
        module: {
          select: {
            id: true,
            titleUz: true,
            course: { select: { id: true, slug: true, titleUz: true, subject: true } },
          },
        },
        exercises: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            skill: true,
            level: true,
            order: true,
            promptUz: true,
            promptEn: true,
            dataJson: true,
            points: true,
            // answerJson intentionally omitted — checked server-side
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    if (userId) {
      // Mark as started
      await this.prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        create: { userId, lessonId },
        update: {},
      });
    }
    return lesson;
  }
}
