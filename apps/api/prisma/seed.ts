/**
 * Seed: imports everything under <repo>/content into the database.
 *   content/<subject-dir>/curriculum/*.json  → courses
 *   content/<subject-dir>/mocks/*.json       → mock exams
 *   content/<subject-dir>/vocabulary/*.json  → vocab words
 * Also creates/promotes an admin user when ADMIN_EMAIL (+ ADMIN_PASSWORD) is set.
 *
 * Run: pnpm --filter @multilevel/api seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { importCourse, importMock, importVocab } from '../src/content/importer';
import { courseFileSchema, mockFileSchema, vocabFileSchema } from '../src/content/schemas';

// Load apps/api/.env when DATABASE_URL isn't already in the environment
if (!process.env.DATABASE_URL) {
  const envPath = resolve(__dirname, '../.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const match = /^([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line.trim());
      if (match && !line.trim().startsWith('#') && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  }
}

const prisma = new PrismaClient();
const CONTENT_ROOT = resolve(__dirname, '../../../content');

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => join(dir, f));
}

async function seedContent() {
  if (!existsSync(CONTENT_ROOT)) {
    console.log(`content/ topilmadi (${CONTENT_ROOT}) — kontent seedlash o‘tkazib yuborildi`);
    return;
  }
  const subjectDirs = readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(CONTENT_ROOT, d.name));

  for (const subjectDir of subjectDirs) {
    for (const file of jsonFiles(join(subjectDir, 'curriculum'))) {
      const raw = JSON.parse(readFileSync(file, 'utf8'));
      const parsed = courseFileSchema.safeParse(raw);
      if (!parsed.success) {
        console.error(`✗ ${file}:`, parsed.error.issues.slice(0, 5));
        continue;
      }
      const result = await importCourse(prisma, parsed.data);
      console.log(`✓ Kurs: ${result.slug} (${result.lessons} dars, ${result.exercises} mashq)`);
    }

    for (const file of jsonFiles(join(subjectDir, 'mocks'))) {
      const raw = JSON.parse(readFileSync(file, 'utf8'));
      const parsed = mockFileSchema.safeParse(raw);
      if (!parsed.success) {
        console.error(`✗ ${file}:`, parsed.error.issues.slice(0, 5));
        continue;
      }
      try {
        const result = await importMock(prisma, parsed.data, {
          force: process.env.SEED_FORCE === 'true',
        });
        console.log(`✓ Mock: ${result.slug} (${result.questions} savol)`);
      } catch (error) {
        console.warn(`⚠ Mock ${file}: ${(error as Error).message}`);
      }
    }

    for (const file of jsonFiles(join(subjectDir, 'vocabulary'))) {
      const raw = JSON.parse(readFileSync(file, 'utf8'));
      const parsed = vocabFileSchema.safeParse(raw);
      if (!parsed.success) {
        console.error(`✗ ${file}:`, parsed.error.issues.slice(0, 5));
        continue;
      }
      const result = await importVocab(prisma, parsed.data);
      console.log(`✓ Lug‘at: ${file.split(/[\\/]/).pop()} (${result.total} so‘z)`);
    }
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!email) return;
  const password = process.env.ADMIN_PASSWORD;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
      console.log(`✓ ${email} admin qilindi`);
    }
    return;
  }
  if (!password) {
    console.warn('ADMIN_PASSWORD berilmagan — yangi admin yaratilmadi');
    return;
  }
  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      firstName: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin yaratildi: ${email}`);
}

async function main() {
  await seedAdmin();
  await seedContent();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
