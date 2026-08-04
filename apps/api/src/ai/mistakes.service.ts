import { Injectable } from '@nestjs/common';
import { EvalStatus, Skill } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluationResult, EvalMistake } from './providers/ai-provider.interface';

export interface MistakePattern {
  /** Normallashtirilgan kalit — bir xil xatoni guruhlash uchun */
  key: string;
  /** Foydalanuvchiga ko'rsatiladigan nom */
  label: string;
  category: MistakeCategory;
  count: number;
  skills: Skill[];
  examples: Array<{
    original: string;
    corrected: string;
    explanationUz: string;
    at: string;
  }>;
}

export type MistakeCategory =
  | 'TENSE'
  | 'AGREEMENT'
  | 'ARTICLE'
  | 'PREPOSITION'
  | 'WORD_FORM'
  | 'WORD_CHOICE'
  | 'WORD_ORDER'
  | 'PLURAL'
  | 'SPELLING'
  | 'PUNCTUATION'
  | 'REGISTER'
  | 'OTHER';

const CATEGORY_LABEL: Record<MistakeCategory, string> = {
  TENSE: 'Fe’l zamoni',
  AGREEMENT: 'Ega-kesim moslashuvi',
  ARTICLE: 'Artikl (a/an/the)',
  PREPOSITION: 'Predlog',
  WORD_FORM: 'So‘z shakli',
  WORD_CHOICE: 'So‘z tanlash',
  WORD_ORDER: 'So‘z tartibi',
  PLURAL: 'Ko‘plik shakli',
  SPELLING: 'Imlo',
  PUNCTUATION: 'Tinish belgilari',
  REGISTER: 'Uslub (rasmiy/norasmiy)',
  OTHER: 'Boshqa',
};

/**
 * Har bir AI izohi o'zbekcha yoziladi, shuning uchun kategoriya izoh matnidan
 * aniqlanadi. Kalit so'zlar — izohda eng ko'p uchraydigan iboralar.
 */
const CATEGORY_RULES: Array<{ category: MistakeCategory; patterns: RegExp[] }> = [
  {
    category: 'TENSE',
    patterns: [/zamon/i, /o‘tgan zamon/i, /o'tgan zamon/i, /present perfect/i, /past simple/i],
  },
  {
    category: 'AGREEMENT',
    patterns: [/moslash/i, /ega.*kesim/i, /3-shaxs/i, /uchinchi shaxs/i, /birlik.*fe/i],
  },
  { category: 'ARTICLE', patterns: [/artikl/i, /\ba\/an\b/i, /\bthe\b.*qo‘shil/i, /aniqlik artikli/i] },
  { category: 'PREPOSITION', patterns: [/predlog/i, /ko‘makchi/i, /old ko/i] },
  { category: 'WORD_FORM', patterns: [/so‘z shakl/i, /so'z shakl/i, /sifat.*ravish/i, /ot shaklida/i, /fe’l shakl/i, /fe'l shakl/i] },
  { category: 'PLURAL', patterns: [/ko‘plik/i, /ko'plik/i, /sanaladigan/i, /sanalmaydigan/i] },
  { category: 'WORD_ORDER', patterns: [/tartib/i, /so‘z tartibi/i, /gap tuzilishi/i] },
  { category: 'SPELLING', patterns: [/imlo/i, /xato yozil/i, /harf/i] },
  { category: 'PUNCTUATION', patterns: [/vergul/i, /tinish/i, /nuqta/i, /apostrof/i] },
  { category: 'REGISTER', patterns: [/uslub/i, /rasmiy/i, /norasmiy/i, /qisqartma/i] },
  { category: 'WORD_CHOICE', patterns: [/so‘z tanla/i, /so'z tanla/i, /mos kelmaydi/i, /kollokatsiya/i, /noto‘g‘ri so‘z/i] },
];

function classify(mistake: EvalMistake): MistakeCategory {
  const haystack = `${mistake.explanationUz} ${mistake.original} ${mistake.corrected}`;
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) return rule.category;
  }
  return 'OTHER';
}

@Injectable()
export class MistakesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Foydalanuvchining barcha AI baholashlaridan xatolarni yig'ib, takrorlanish
   * bo'yicha guruhlaydi. Eng ko'p takrorlangani birinchi bo'ladi — aynan shular
   * ustida ishlash ballni eng tez ko'taradi.
   */
  async patternsFor(userId: string): Promise<{
    total: number;
    patterns: MistakePattern[];
    byCategory: Array<{ category: MistakeCategory; label: string; count: number }>;
  }> {
    const evaluations = await this.prisma.aiEvaluation.findMany({
      where: { userId, status: EvalStatus.COMPLETED },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { skill: true, resultJson: true, createdAt: true },
    });

    const grouped = new Map<MistakeCategory, MistakePattern>();
    let total = 0;

    for (const evaluation of evaluations) {
      const result = evaluation.resultJson as unknown as EvaluationResult | null;
      for (const mistake of result?.mistakes ?? []) {
        if (!mistake?.corrected) continue;
        total++;

        const category = classify(mistake);
        const existing = grouped.get(category);
        const example = {
          original: mistake.original,
          corrected: mistake.corrected,
          explanationUz: mistake.explanationUz,
          at: evaluation.createdAt.toISOString(),
        };

        if (existing) {
          existing.count++;
          if (!existing.skills.includes(evaluation.skill)) existing.skills.push(evaluation.skill);
          if (existing.examples.length < 5) existing.examples.push(example);
        } else {
          grouped.set(category, {
            key: category,
            label: CATEGORY_LABEL[category],
            category,
            count: 1,
            skills: [evaluation.skill],
            examples: [example],
          });
        }
      }
    }

    const patterns = [...grouped.values()].sort((a, b) => b.count - a.count);

    return {
      total,
      patterns,
      byCategory: patterns.map((pattern) => ({
        category: pattern.category,
        label: pattern.label,
        count: pattern.count,
      })),
    };
  }

  /**
   * Eng ko'p takrorlangan xato kategoriyalari bo'yicha mashq to'plami.
   * Kategoriya -> mashq skill/turi bog'lanishi orqali mavjud kontentdan tanlanadi.
   */
  async drillsFor(userId: string, limit = 10) {
    const { patterns } = await this.patternsFor(userId);
    if (patterns.length === 0) return { patterns: [], exercises: [] };

    const top = patterns.slice(0, 3).map((pattern) => pattern.category);
    const grammarCategories: MistakeCategory[] = [
      'TENSE',
      'AGREEMENT',
      'ARTICLE',
      'PREPOSITION',
      'WORD_FORM',
      'WORD_ORDER',
      'PLURAL',
    ];

    const wantsGrammar = top.some((category) => grammarCategories.includes(category));
    const skill: Skill = wantsGrammar ? Skill.GRAMMAR : Skill.VOCABULARY;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const exercises = await this.prisma.exercise.findMany({
      where: {
        isPublished: true,
        skill,
        ...(user?.currentLevel ? { level: user.currentLevel } : {}),
        type: { in: ['MCQ_SINGLE', 'GAP_FILL', 'TRUE_FALSE', 'SHORT_ANSWER'] },
      },
      take: limit,
      select: {
        id: true,
        type: true,
        skill: true,
        level: true,
        promptUz: true,
        promptEn: true,
        dataJson: true,
        points: true,
      },
    });

    return { patterns: patterns.slice(0, 3), exercises };
  }
}
