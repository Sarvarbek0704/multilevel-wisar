#!/usr/bin/env node
/**
 * Listening audio generator (TTS pipeline).
 *
 * Mock JSON fayllaridagi listening partlarda `context.transcript` bor, lekin
 * `audioUrl` yo'q bo'lsa — Microsoft Edge neural ovozlari bilan MP3 yaratadi
 * va JSON'dagi audioUrl maydonini yangilaydi.
 *
 * O'rnatish:  cd tools && npm init -y && npm i msedge-tts
 * Ishlatish:  node tools/generate-audio.mjs [--dry]
 *
 * Transkript formati: "M: ..." / "W: ..." qatorlar erkak/ayol ovozi bilan
 * navbatlashadi; oddiy matn bitta ovoz bilan o'qiladi.
 */
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, createWriteStream } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MOCKS_DIR = join(ROOT, 'content', 'english', 'mocks');
const AUDIO_DIR = join(ROOT, 'apps', 'api', 'uploads', 'audio', 'listening');
const DRY = process.argv.includes('--dry');

const VOICE_MALE = 'en-US-GuyNeural';
const VOICE_FEMALE = 'en-US-AriaNeural';
const VOICE_NARRATOR = 'en-GB-RyanNeural';

const SEGMENT_TIMEOUT_MS = 90_000;
const MAX_TRIES = 3;

/** Bitta matn bo'lagini ovozga aylantirish (timeout va qayta urinish bilan). */
async function synthesizeOnce(text, voice, outPath) {
  const tts = new MsEdgeTTS();
  let timer;
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = await tts.toStream(text);
    await new Promise((resolveDone, reject) => {
      const out = createWriteStream(outPath);
      timer = setTimeout(() => {
        out.destroy();
        reject(new Error(`TTS timeout (${SEGMENT_TIMEOUT_MS / 1000}s)`));
      }, SEGMENT_TIMEOUT_MS);
      audioStream.on('error', reject);
      out.on('error', reject);
      out.on('finish', resolveDone);
      audioStream.pipe(out);
    });
  } finally {
    clearTimeout(timer);
    // Ulanishni yopamiz — aks holda soketlar to'planib qoladi
    try { tts.close?.(); } catch { /* ignore */ }
  }
}

async function synthesize(text, voice, outPath) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    try {
      await synthesizeOnce(text, voice, outPath);
      return;
    } catch (error) {
      lastError = error;
      console.log(`   ⚠ urinish ${attempt}/${MAX_TRIES}: ${error.message}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw lastError;
}

/** Dialog transkriptni [{voice, text}] segmentlarga bo'lish. */
function segmentTranscript(transcript) {
  const lines = transcript.split(/\n+/).filter((l) => l.trim());
  const segments = [];
  for (const line of lines) {
    const match = /^(M|W|Man|Woman|Speaker [AB])\s*:\s*(.+)$/i.exec(line.trim());
    if (match) {
      const isMale = /^(M|Man|Speaker A)$/i.test(match[1]);
      segments.push({ voice: isMale ? VOICE_MALE : VOICE_FEMALE, text: match[2] });
    } else {
      segments.push({ voice: VOICE_NARRATOR, text: line.trim() });
    }
  }
  // Ketma-ket bir xil ovozdagi segmentlarni birlashtirish
  const merged = [];
  for (const seg of segments) {
    if (!seg.text.trim()) continue;
    const last = merged[merged.length - 1];
    if (last && last.voice === seg.voice) last.text += ' ' + seg.text;
    else merged.push({ ...seg });
  }
  return merged;
}

async function main() {
  if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true });
  let generated = 0;

  for (const fileName of readdirSync(MOCKS_DIR).filter((f) => f.endsWith('.json'))) {
    const filePath = join(MOCKS_DIR, fileName);
    const mock = JSON.parse(readFileSync(filePath, 'utf8'));
    let changed = false;

    for (const section of mock.sections ?? []) {
      if (section.skill !== 'LISTENING') continue;
      for (const [index, part] of (section.parts ?? []).entries()) {
        const transcript = part.context?.transcript;
        if (!transcript || part.audioUrl) continue;

        const baseName = `${mock.slug}-part${index + 1}`;
        const outPath = join(AUDIO_DIR, `${baseName}.mp3`);
        console.log(`→ ${baseName} (${transcript.length} belgi)`);
        if (DRY) continue;

        const segments = segmentTranscript(transcript);
        if (segments.length === 1) {
          await synthesize(segments[0].text, segments[0].voice, outPath);
        } else {
          // Segmentlarni alohida sintez qilib birlashtirish (oddiy konkatenatsiya
          // MP3 uchun ishlaydi — ko'p playerlar ketma-ket freymlarni o'qiydi)
          const buffers = [];
          for (const [i, seg] of segments.entries()) {
            const tmpPath = join(AUDIO_DIR, `${baseName}.seg${i}.mp3`);
            await synthesize(seg.text, seg.voice, tmpPath);
            buffers.push(readFileSync(tmpPath));
          }
          writeFileSync(outPath, Buffer.concat(buffers));
          for (let i = 0; i < segments.length; i++) {
            try { const p = join(AUDIO_DIR, `${baseName}.seg${i}.mp3`);
              if (existsSync(p)) { const { unlinkSync } = await import('fs'); unlinkSync(p); }
            } catch { /* ignore */ }
          }
        }

        part.audioUrl = `/uploads/audio/listening/${baseName}.mp3`;
        changed = true;
        generated++;

        // Saqlash har qismdan keyin: uzilib qolsa ham progress yo'qolmaydi
        writeFileSync(filePath, JSON.stringify(mock, null, 2) + '\n', 'utf8');
      }
    }

    if (changed) {
      console.log(`✓ ${fileName} yangilandi (audioUrl qo'shildi)`);
    }
  }

  console.log(DRY ? 'Dry run tugadi' : `Tayyor: ${generated} ta audio. Endi seed qilib bazani yangilang.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
