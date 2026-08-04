#!/usr/bin/env node
/**
 * Kontent yaxlitligini tekshirish.
 *
 * Sxema (zod) faqat shaklni tekshiradi — bu skript MAZMUNIY xatolarni topadi:
 * javob kaliti variantlar ichida bormi, ORDERING javobi haqiqatan permutatsiyami,
 * MATCHING juftliklari ustunlarga mos keladimi va h.k. Bitta noto'g'ri kalit
 * o'quvchiga xato qoidani o'rgatadi — shuning uchun seed'dan oldin ishlating.
 *
 * Ishlatish: node tools/check-content.mjs
 * Chiqish kodi: xato topilsa 1, aks holda 0.
 */
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');

const problems = [];
const warnings = [];
let stats = { courses: 0, lessons: 0, exercises: 0, mocks: 0, questions: 0, words: 0 };

function fail(file, path, message) {
  problems.push(`${relative(ROOT, file)} → ${path}: ${message}`);
}
function warn(file, path, message) {
  warnings.push(`${relative(ROOT, file)} → ${path}: ${message}`);
}

const norm = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[’´`]/g, "'");

/** Mashq yoki savol javobini tekshirish (ikkalasi bir xil qoidalarga bo'ysunadi) */
function checkAnswerable(file, path, item) {
  const { type, data = {}, answer } = item;

  const openEnded = type === 'WRITING_TASK' || type === 'SPEAKING_TASK';
  if (openEnded) {
    if (answer) fail(file, path, `${type} da answer bo'lmasligi kerak`);
    if (type === 'WRITING_TASK' && !data.minWords) {
      warn(file, path, 'WRITING_TASK da minWords yo‘q');
    }
    if (type === 'SPEAKING_TASK' && !data.recordSeconds) {
      warn(file, path, 'SPEAKING_TASK da recordSeconds yo‘q');
    }
    return;
  }

  if (!answer) {
    fail(file, path, `${type} da answer yo'q — server bu mashqni tekshira olmaydi`);
    return;
  }

  switch (type) {
    case 'MCQ_SINGLE': {
      const options = (data.options ?? []).map(norm);
      if (options.length < 2) fail(file, path, 'MCQ_SINGLE da kamida 2 variant kerak');
      if (answer.value === undefined) {
        fail(file, path, 'MCQ_SINGLE da answer.value yo‘q');
      } else if (!options.includes(norm(answer.value))) {
        fail(file, path, `javob "${answer.value}" variantlar ichida yo‘q [${data.options?.join(' | ')}]`);
      }
      if (new Set(options).size !== options.length) {
        fail(file, path, 'variantlar takrorlanadi');
      }
      break;
    }

    case 'MCQ_MULTI': {
      const options = (data.options ?? []).map(norm);
      const values = (answer.values ?? []).map(norm);
      if (values.length === 0) fail(file, path, 'MCQ_MULTI da answer.values bo‘sh');
      for (const value of values) {
        if (!options.includes(value)) fail(file, path, `javob "${value}" variantlar ichida yo‘q`);
      }
      if (values.length === options.length && options.length > 0) {
        fail(file, path, 'MCQ_MULTI da barcha variantlar to‘g‘ri — bu mashq ma’nosiz');
      }
      break;
    }

    case 'TRUE_FALSE': {
      if (!data.statement) fail(file, path, 'TRUE_FALSE da data.statement yo‘q');
      if (!['true', 'false'].includes(String(answer.value))) {
        fail(file, path, `TRUE_FALSE javobi "true"/"false" bo‘lishi kerak, "${answer.value}" berilgan`);
      }
      break;
    }

    case 'GAP_FILL':
    case 'SHORT_ANSWER': {
      const hasAccept = Array.isArray(answer.accept) && answer.accept.length > 0;
      const hasGaps = Array.isArray(answer.gaps) && answer.gaps.length > 0;
      if (!hasAccept && !hasGaps) {
        fail(file, path, `${type} da accept yoki gaps massivi kerak`);
      }
      if (hasAccept && answer.accept.some((value) => !String(value ?? '').trim())) {
        fail(file, path, 'accept ichida bo‘sh qiymat bor');
      }
      if (hasGaps) {
        const gapCount = (String(data.text ?? '').match(/___/g) ?? []).length;
        if (gapCount && gapCount !== answer.gaps.length) {
          fail(file, path, `matnda ${gapCount} ta bo‘sh joy, javobda ${answer.gaps.length} ta`);
        }
      }
      break;
    }

    case 'MATCHING': {
      const left = (data.left ?? []).map(norm);
      const right = (data.right ?? []).map(norm);
      const pairs = answer.pairs ?? {};
      const keys = Object.keys(pairs);
      if (keys.length === 0) fail(file, path, 'MATCHING da pairs bo‘sh');
      if (keys.length !== left.length) {
        fail(file, path, `chapda ${left.length} element, juftliklarda ${keys.length} ta`);
      }
      for (const key of keys) {
        if (!left.includes(norm(key))) fail(file, path, `juftlik kaliti "${key}" left ichida yo‘q`);
        if (!right.includes(norm(pairs[key]))) {
          fail(file, path, `juftlik qiymati "${pairs[key]}" right ichida yo‘q`);
        }
      }
      if (new Set(Object.values(pairs).map(norm)).size !== keys.length) {
        fail(file, path, 'bir nechta chap element bir xil o‘ng elementga bog‘langan');
      }
      break;
    }

    case 'ORDERING': {
      const items = (data.items ?? []).map(norm).sort();
      const order = (answer.order ?? []).map(norm).sort();
      if (order.length === 0) fail(file, path, 'ORDERING da answer.order bo‘sh');
      else if (items.length !== order.length || items.some((value, index) => value !== order[index])) {
        fail(file, path, 'answer.order data.items ning permutatsiyasi emas');
      }
      if (JSON.stringify((data.items ?? []).map(norm)) === JSON.stringify((answer.order ?? []).map(norm))) {
        warn(file, path, 'items allaqachon to‘g‘ri tartibda berilgan — aralashtiring');
      }
      break;
    }

    default:
      warn(file, path, `noma'lum tur: ${type}`);
  }
}

function checkCourse(file, course, slugs) {
  stats.courses++;
  if (slugs.has(course.slug)) fail(file, 'slug', `takrorlangan slug: ${course.slug}`);
  slugs.add(course.slug);

  const lessonSlugs = new Set();
  for (const [moduleIndex, module] of (course.modules ?? []).entries()) {
    for (const [lessonIndex, lesson] of (module.lessons ?? []).entries()) {
      stats.lessons++;
      const base = `modul ${moduleIndex + 1} / dars ${lessonIndex + 1} (${lesson.slug})`;

      const key = `${module.slug}/${lesson.slug}`;
      if (lessonSlugs.has(key)) fail(file, base, 'dars slug takrorlangan');
      lessonSlugs.add(key);

      if (!lesson.content?.length) fail(file, base, 'kontent bloklari yo‘q');
      for (const [blockIndex, block] of (lesson.content ?? []).entries()) {
        if (!block.type) fail(file, `${base} / blok ${blockIndex + 1}`, 'type yo‘q');
        if (block.type === 'table') {
          const headers = block.headers?.length ?? 0;
          for (const [rowIndex, row] of (block.rows ?? []).entries()) {
            if (row.length !== headers) {
              fail(
                file,
                `${base} / jadval qator ${rowIndex + 1}`,
                `${headers} ustun kutildi, ${row.length} berilgan`,
              );
            }
          }
        }
      }

      for (const [exerciseIndex, exercise] of (lesson.exercises ?? []).entries()) {
        stats.exercises++;
        const path = `${base} / mashq ${exerciseIndex + 1}`;
        checkAnswerable(file, path, exercise);
        const openEnded =
          exercise.type === 'WRITING_TASK' || exercise.type === 'SPEAKING_TASK';
        if (!openEnded && !exercise.explanationUz) {
          warn(file, path, 'explanationUz yo‘q — o‘quvchi nima uchun xato qilganini bilmaydi');
        }
        if (!exercise.promptUz && !exercise.promptEn) {
          fail(file, path, 'promptUz ham, promptEn ham yo‘q');
        }
      }
    }
  }
}

function checkMock(file, mock, slugs) {
  stats.mocks++;
  if (slugs.has(mock.slug)) fail(file, 'slug', `takrorlangan slug: ${mock.slug}`);
  slugs.add(mock.slug);

  for (const [sectionIndex, section] of (mock.sections ?? []).entries()) {
    const numbers = new Set();
    let sectionQuestions = 0;

    for (const [partIndex, part] of (section.parts ?? []).entries()) {
      const partPath = `${section.skill} / qism ${partIndex + 1}`;

      if (section.skill === 'LISTENING' && !part.context?.transcript && !part.audioUrl) {
        fail(file, partPath, 'listening qismida na transcript, na audioUrl bor');
      }
      if (section.skill === 'READING' && !part.passageText && (part.questions ?? []).length > 2) {
        warn(file, partPath, 'reading qismida passageText yo‘q');
      }

      for (const question of part.questions ?? []) {
        stats.questions++;
        sectionQuestions++;
        const path = `${partPath} / savol ${question.number}`;
        if (numbers.has(question.number)) {
          fail(file, path, `bo‘lim ichida raqam takrorlangan: ${question.number}`);
        }
        numbers.add(question.number);
        checkAnswerable(file, path, question);
        if (!question.promptUz && !question.promptEn && !question.data?.text && !question.data?.statement) {
          fail(file, path, 'savol matni yo‘q (promptUz/promptEn/data.text/data.statement)');
        }
      }
    }

    // Raqamlar 1..N uzluksiz bo'lishi kerak
    const sorted = [...numbers].sort((a, b) => a - b);
    if (sorted.length && (sorted[0] !== 1 || sorted[sorted.length - 1] !== sorted.length)) {
      warn(
        file,
        `bo‘lim ${sectionIndex + 1} (${section.skill})`,
        `raqamlar uzluksiz emas: ${sorted[0]}..${sorted[sorted.length - 1]}, jami ${sectionQuestions}`,
      );
    }
  }
}

function checkVocab(file, pack, seen) {
  for (const [index, word] of (pack.words ?? []).entries()) {
    stats.words++;
    const path = `so‘z ${index + 1} (${word.word})`;
    const key = `${pack.subject}|${norm(word.word)}|${norm(word.translation)}`;
    if (seen.has(key)) fail(file, path, `takrorlangan so‘z: ${word.word} — ${word.translation}`);
    seen.add(key);

    if (!word.translation?.trim()) fail(file, path, 'tarjima yo‘q');
    if (!word.exampleEn?.trim()) warn(file, path, 'exampleEn yo‘q');
    if (word.phonetic && !/^\/.*\/$/.test(word.phonetic.trim())) {
      warn(file, path, `fonetika slash ichida emas: ${word.phonetic}`);
    }
    if (word.exampleEn && word.exampleUz === undefined) {
      warn(file, path, 'exampleUz yo‘q — misol tarjimasiz');
    }
  }
}

function main() {
  if (!existsSync(CONTENT)) {
    console.error(`content/ topilmadi: ${CONTENT}`);
    process.exit(1);
  }

  const courseSlugs = new Set();
  const mockSlugs = new Set();
  const vocabSeen = new Set();

  for (const subjectDir of readdirSync(CONTENT, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const base = join(CONTENT, subjectDir.name);

    for (const [kind, checker, state] of [
      ['curriculum', checkCourse, courseSlugs],
      ['mocks', checkMock, mockSlugs],
      ['vocabulary', checkVocab, vocabSeen],
    ]) {
      const dir = join(base, kind);
      if (!existsSync(dir)) continue;

      for (const name of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
        const file = join(dir, name);
        let parsed;
        try {
          parsed = JSON.parse(readFileSync(file, 'utf8'));
        } catch (error) {
          fail(file, 'JSON', error.message);
          continue;
        }
        checker(file, parsed, state);
      }
    }
  }

  console.log('KONTENT:', Object.entries(stats).map(([k, v]) => `${k}=${v}`).join('  '));

  if (warnings.length) {
    console.log(`\n⚠  ${warnings.length} ta ogohlantirish:`);
    for (const warning of warnings.slice(0, 40)) console.log('   ' + warning);
    if (warnings.length > 40) console.log(`   … va yana ${warnings.length - 40} ta`);
  }

  if (problems.length) {
    console.log(`\n✗  ${problems.length} ta XATO:`);
    for (const problem of problems.slice(0, 60)) console.log('   ' + problem);
    if (problems.length > 60) console.log(`   … va yana ${problems.length - 60} ta`);
    process.exit(1);
  }

  console.log('\n✓ Barcha javob kalitlari va tuzilmalar to‘g‘ri.');
}

main();
