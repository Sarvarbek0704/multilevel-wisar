'use client';

import { useEffect, useRef, useState } from 'react';
import { MicIcon, PlayIcon } from '@/components/icons';
import { Button, SectionLabel } from '@/components/ui';
import { api } from '@/lib/api';
import { formatClock } from '@/lib/format';

type Phase = 'idle' | 'prep' | 'rec' | 'done';

/**
 * Speaking javobini yozib olish: tayyorgarlik countdown → avtomatik yozish →
 * tinglash → serverga yuklash. MediaRecorder (webm/opus) ishlatiladi.
 */
export function AudioRecorder({
  preparationSeconds,
  recordSeconds,
  onUploaded,
  busy,
  retriesAllowed = 1,
}: {
  preparationSeconds: number;
  recordSeconds: number;
  onUploaded: (audioUrl: string) => void;
  busy?: boolean;
  retriesAllowed?: number;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [left, setLeft] = useState(preparationSeconds);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [retries, setRetries] = useState(retriesAllowed);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [levels, setLevels] = useState<number[]>(Array.from({ length: 28 }, () => 12));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Faza taymerlari
  useEffect(() => {
    if (phase !== 'prep' && phase !== 'rec') return;
    const timer = setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          if (phase === 'prep') startRecording();
          else stopRecording();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Yozish paytida dekorativ waveform
  useEffect(() => {
    if (phase !== 'rec') return;
    const timer = setInterval(() => {
      setLevels((current) => [...current.slice(1), 10 + Math.round(Math.random() * 62)]);
    }, 180);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const startPrep = () => {
    setError(null);
    setLeft(preparationSeconds);
    setPhase('prep');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setBlobUrl(URL.createObjectURL(blob));
        setPhase('done');
        await upload(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setLeft(recordSeconds);
      setPhase('rec');
    } catch {
      setError('Mikrofonga ruxsat berilmadi. Brauzer sozlamalarini tekshiring.');
      setPhase('idle');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const upload = async (blob: Blob) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', blob, `answer.${blob.type.includes('ogg') ? 'ogg' : 'webm'}`);
      const response = await api<{ url: string }>('/files/audio', { method: 'POST', body: form });
      setUploadedUrl(response.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Audio yuklanmadi');
    } finally {
      setUploading(false);
    }
  };

  if (phase === 'idle') {
    return (
      <div className="border border-line-3 bg-surface p-4">
        <p className="text-ui leading-relaxed text-ink-2">
          Tayyorgarlik uchun <b className="font-semibold">{preparationSeconds} soniya</b>, javob
          uchun <b className="font-semibold">{recordSeconds} soniya</b> beriladi. Yozish
          avtomatik boshlanadi.
        </p>
        <Button full className="mt-3.5" onClick={startPrep} disabled={busy}>
          Tayyorgarlikni boshlash
        </Button>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
      </div>
    );
  }

  if (phase === 'prep') {
    return (
      <div className="flex flex-col items-center border border-line-3 bg-surface p-6">
        <SectionLabel className="text-warn">TAYYORGARLIK</SectionLabel>
        <CountdownRing value={left} max={preparationSeconds} color="#8A5A2B" />
        <p className="mt-3 text-base text-ink-4">Yozish avtomatik boshlanadi</p>
        <button onClick={startRecording} className="mt-2 text-base font-medium text-accent">
          Hozir boshlash →
        </button>
      </div>
    );
  }

  if (phase === 'rec') {
    return (
      <div className="flex flex-col items-center border border-line-3 bg-surface p-6">
        <div className="flex items-center gap-2">
          <span className="h-[9px] w-[9px] rounded-full bg-error" />
          <SectionLabel className="text-error">YOZILMOQDA</SectionLabel>
        </div>
        <div className="mt-4 flex h-[72px] items-end gap-[3px]">
          {levels.map((height, index) => (
            <span key={index} className="w-1 bg-accent" style={{ height }} />
          ))}
        </div>
        <p className="mt-4 font-mono text-6xl">{formatClock(left)}</p>
        <Button variant="danger" full className="mt-4" onClick={stopRecording}>
          Yozishni tugatish
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-success-border bg-success-bg p-4">
      <p className="text-ui font-semibold text-success-dark">
        ✓ Javob yozildi{uploading ? ' — yuklanmoqda…' : ''}
      </p>
      {blobUrl && (
        <audio controls src={blobUrl} className="mt-3 w-full">
          <track kind="captions" />
        </audio>
      )}
      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <div className="mt-3 flex gap-2">
        {uploadedUrl && (
          <Button
            className="flex-1"
            disabled={busy}
            onClick={() => onUploaded(uploadedUrl)}
          >
            AI&rsquo;ga yuborish
          </Button>
        )}
        {retries > 0 && (
          <Button
            variant="secondary"
            className="flex-1"
            disabled={busy || uploading}
            onClick={() => {
              setRetries(retries - 1);
              setBlobUrl(null);
              setUploadedUrl(null);
              startPrep();
            }}
          >
            Qayta yozish ({retries})
          </Button>
        )}
      </div>
    </div>
  );
}

function CountdownRing({ value, max, color }: { value: number; max: number; color: string }) {
  const size = 132;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? value / max : 0;

  return (
    <div className="relative mt-4" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EDEAE4" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-6xl">
        {formatClock(value)}
      </span>
    </div>
  );
}

function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}
