#!/usr/bin/env node
/**
 * Lug'at fayllari orasidagi dublikatlarni tozalash.
 *
 * Bir nechta fayl parallel yozilganda (turli mualliflar/agentlar) bir xil so'z
 * bir necha faylga tushishi mumkin. Baza (subject, word, translation) bo'yicha
 * unique bo'lgani uchun bu xatoga olib kelmaydi, lekin so'zlar soni aslida
 * kamroq bo'ladi va o'quvchi bir xil kartochkani ikki marta "yangi" deb ko'radi.
 *
 * Birinchi uchragan yozuv qoldiriladi (fayl nomi bo'yicha alifbo tartibida),
 * keyingilari olib tashlanadi.
 *
 * Ishlatish: node tools/dedupe-vocab.mjs [--dry]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const DRY = process.argv.includes('--dry');

const norm = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[’´`]/g, "'");

const seen = new Map(); // key -> qaysi faylda birinchi uchragani
let removed = 0;

for (const subjectDir of readdirSync(CONTENT, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const dir = join(CONTENT, subjectDir.name, 'vocabulary');
  if (!existsSync(dir)) continue;

  for (const name of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const file = join(dir, name);
    const pack = JSON.parse(readFileSync(file, 'utf8'));
    const kept = [];
    const dropped = [];

    for (const word of pack.words ?? []) {
      const key = `${pack.subject}|${norm(word.word)}|${norm(word.translation)}`;
      const owner = seen.get(key);
      if (owner) {
        dropped.push(`${word.word} (${owner} da bor)`);
        removed++;
      } else {
        seen.set(key, name);
        kept.push(word);
      }
    }

    if (dropped.length > 0) {
      console.log(`${relative(ROOT, file)}: ${dropped.length} ta dublikat olib tashlandi`);
      for (const item of dropped.slice(0, 8)) console.log(`   - ${item}`);
      if (dropped.length > 8) console.log(`   … va yana ${dropped.length - 8} ta`);

      if (!DRY) {
        pack.words = kept;
        writeFileSync(file, JSON.stringify(pack, null, 2) + '\n', 'utf8');
      }
    }
  }
}

console.log(
  DRY
    ? `\nDry run: ${removed} ta dublikat topildi, ${seen.size} ta noyob so'z qoladi.`
    : `\nTayyor: ${removed} ta dublikat olib tashlandi, ${seen.size} ta noyob so'z qoldi.`,
);
