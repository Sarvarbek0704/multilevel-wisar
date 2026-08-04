import { Fragment, type ReactNode } from 'react';

/**
 * Kontentdagi yengil markdown: **qalin**, *kursiv*, `kod`, "- " ro'yxatlari,
 * bo'sh qator bilan ajratilgan paragraflar.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n');
        const isList = lines.every((line) => /^\s*[-•]\s+/.test(line));

        if (isList) {
          return (
            <ul key={blockIndex} className="mt-3.5 list-disc pl-5 leading-relaxed first:mt-0">
              {lines.map((line, index) => (
                <li key={index}>{inline(line.replace(/^\s*[-•]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex} className="mt-3.5 first:mt-0">
            {lines.map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** **qalin**, *kursiv*, `kod` */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <b key={index} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </b>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-surface-alt px-1 font-mono text-[0.92em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <i key={index}>{part.slice(1, -1)}</i>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
