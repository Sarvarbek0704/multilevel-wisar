import { RichText } from '@/components/rich-text';
import { SectionLabel } from '@/components/ui';
import type { ContentBlock } from '@/lib/types';

const LABEL: Record<string, string> = {
  theory: 'NAZARIYA',
  example: 'MISOLLAR',
  table: 'JADVAL',
  dialogue: 'DIALOG',
  tip: 'MASLAHAT',
};

interface ExampleItem {
  en?: string;
  uz?: string;
}

interface DialogueLine {
  speaker?: string;
  en?: string;
  uz?: string;
}

export function LessonContentBlock({ block }: { block: ContentBlock }) {
  const label = LABEL[block.type] ?? block.type.toUpperCase();

  return (
    <div>
      <SectionLabel className="text-accent">{label}</SectionLabel>

      {block.type === 'theory' && (
        <>
          {typeof block.titleUz === 'string' && (
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
              {block.titleUz}
            </h2>
          )}
          {typeof block.bodyUz === 'string' && (
            <RichText text={block.bodyUz} className="prose-lesson mt-4" />
          )}
        </>
      )}

      {block.type === 'example' && (
        <>
          {typeof block.titleUz === 'string' && (
            <h3 className="mt-3 font-display text-2xl font-semibold">{block.titleUz}</h3>
          )}
          <div className="mt-4 flex flex-col gap-2.5">
            {(block.items as ExampleItem[] | undefined)?.map((item, index) => (
              <div key={index} className="border border-line bg-surface p-4">
                <p className="text-xl font-medium leading-snug">{item.en}</p>
                {item.uz && <p className="mt-1.5 text-ui text-ink-3">{item.uz}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {block.type === 'table' && (
        <>
          {typeof block.titleUz === 'string' && (
            <h3 className="mt-3 font-display text-2xl font-semibold">{block.titleUz}</h3>
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[460px] border-collapse text-left">
              <thead>
                <tr className="bg-surface-alt">
                  {(block.headers as string[] | undefined)?.map((header) => (
                    <th
                      key={header}
                      className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-3"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(block.rows as string[][] | undefined)?.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-line-2">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3.5 py-2.5 text-ui text-ink-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-ink-5">← jadvalni yon tomonga suring</p>
        </>
      )}

      {block.type === 'dialogue' && (
        <>
          {typeof block.titleUz === 'string' && (
            <h3 className="mt-3 font-display text-2xl font-semibold">{block.titleUz}</h3>
          )}
          <div className="mt-4 flex flex-col gap-3">
            {(block.lines as DialogueLine[] | undefined)?.map((line, index) => {
              const isSecond = index % 2 === 1;
              return (
                <div
                  key={index}
                  className={`flex gap-2.5 ${isSecond ? 'flex-row-reverse' : ''}`}
                >
                  <span
                    className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center text-xs font-semibold ${
                      isSecond ? 'bg-ink text-bg' : 'bg-desk text-ink-3'
                    }`}
                  >
                    {(line.speaker ?? '?').slice(0, 1)}
                  </span>
                  <div
                    className={`max-w-[270px] border p-3 ${
                      isSecond
                        ? 'border-accent-border bg-accent-soft'
                        : 'border-line bg-surface'
                    }`}
                  >
                    <p className="text-md leading-snug">{line.en}</p>
                    {line.uz && <p className="mt-1 text-base text-ink-4">{line.uz}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {block.type === 'tip' && (
        <div className="mt-3 border-l-[3px] border-accent bg-accent-soft p-4 pl-4">
          {typeof block.titleUz === 'string' && (
            <h3 className="font-display text-xl font-semibold text-accent-dark">
              {block.titleUz}
            </h3>
          )}
          {typeof block.bodyUz === 'string' && (
            <RichText text={block.bodyUz} className="mt-2 text-md leading-relaxed text-ink-2" />
          )}
        </div>
      )}
    </div>
  );
}
