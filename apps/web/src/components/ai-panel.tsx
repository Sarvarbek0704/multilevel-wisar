import { LevelBadge, SectionLabel } from '@/components/ui';
import type { EvaluationResult } from '@/lib/types';

/** AI baholash natijasi — dars, mock natijasi va amaliyotda bir xil ko'rinadi. */
export function AiPanel({ result }: { result: EvaluationResult }) {
  return (
    <div className="animate-pop border border-line-3 bg-surface">
      <div className="flex items-center justify-between border-b border-line-2 px-4 py-3">
        <SectionLabel className="text-accent">AI TAHLIL</SectionLabel>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight">
            {result.overallScore}
            <span className="text-sm font-medium text-ink-4">/75</span>
          </span>
          <LevelBadge level={result.estimatedLevel} />
        </div>
      </div>

      {result.criteria.length > 0 && (
        <div className="border-b border-line-2 px-4 py-3.5">
          {result.criteria.map((criterion) => (
            <div key={criterion.name} className="mt-3 first:mt-0">
              <div className="flex items-center gap-3">
                <span className="w-[118px] shrink-0 text-base text-ink-3">{criterion.name}</span>
                <span className="h-[5px] flex-1 bg-desk">
                  <span
                    className="block h-full bg-accent"
                    style={{
                      width: `${Math.min(100, (criterion.score / (criterion.max || 10)) * 100)}%`,
                    }}
                  />
                </span>
                <span className="w-[38px] shrink-0 text-right font-mono text-sm">
                  {criterion.score}/{criterion.max}
                </span>
              </div>
              {criterion.commentUz && (
                <p className="mt-1.5 text-base leading-relaxed text-ink-3">
                  {criterion.commentUz}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {result.strengthsUz.length > 0 && (
        <div className="border-b border-line-2 px-4 py-3.5">
          <SectionLabel className="text-success">KUCHLI TOMONLAR</SectionLabel>
          <ul className="mt-2 flex flex-col gap-1.5">
            {result.strengthsUz.map((strength) => (
              <li key={strength} className="text-base leading-relaxed text-ink-2">
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.mistakes.length > 0 && (
        <div className="border-b border-line-2 px-4 py-3.5">
          <SectionLabel className="text-error">XATOLAR</SectionLabel>
          <div className="mt-2.5 flex flex-col gap-3">
            {result.mistakes.map((mistake, index) => (
              <div key={index} className="border-l-2 border-error-border pl-3">
                <p className="text-base leading-relaxed">
                  <span className="text-error line-through">{mistake.original}</span>
                  <span className="mx-1.5 text-ink-4">→</span>
                  <span className="font-medium text-success">{mistake.corrected}</span>
                </p>
                {mistake.explanationUz && (
                  <p className="mt-1 text-sm leading-relaxed text-ink-4">
                    {mistake.explanationUz}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.improvedVersion && (
        <div className="border-b border-line-2 px-4 py-3.5">
          <SectionLabel>YAXSHILANGAN VARIANT</SectionLabel>
          <p className="mt-2 border border-[#DCE5D9] bg-[#F3F6F1] p-3 text-ui leading-relaxed text-ink-2">
            {result.improvedVersion}
          </p>
        </div>
      )}

      {result.feedbackUz && (
        <div className="px-4 py-3.5">
          <SectionLabel>UMUMIY XULOSA</SectionLabel>
          <p className="mt-2 text-ui leading-relaxed text-ink-2">{result.feedbackUz}</p>
        </div>
      )}
    </div>
  );
}
