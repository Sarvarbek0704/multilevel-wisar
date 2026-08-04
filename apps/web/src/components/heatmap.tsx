'use client';

import type { HeatmapDay } from '@/lib/types';

const WEEKS = 18;

/** GitHub uslubidagi faollik xaritasi: 18 hafta × 7 kun */
export function Heatmap({ days }: { days: HeatmapDay[] }) {
  const byDate = new Map(days.map((day) => [day.date.slice(0, 10), day.xp]));

  const today = new Date();
  const cells: Array<{ key: string; xp: number | null }> = [];
  // Oxirgi kunidan boshlab orqaga: ustunlar hafta, qatorlar kun
  const total = WEEKS * 7;
  for (let offset = total - 1; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    cells.push({ key, xp: byDate.get(key) ?? 0 });
  }

  const level = (xp: number) => {
    if (xp <= 0) return 'bg-desk';
    if (xp < 40) return 'bg-accent-border';
    if (xp < 100) return 'bg-accent-50';
    return 'bg-accent';
  };

  return (
    <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
      {cells.map((cell) => (
        <span
          key={cell.key}
          title={`${cell.key}: ${cell.xp} XP`}
          className={`aspect-square ${level(cell.xp ?? 0)}`}
        />
      ))}
    </div>
  );
}
