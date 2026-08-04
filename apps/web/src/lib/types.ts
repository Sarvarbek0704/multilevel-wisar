// Backend API turlari — apps/api/src dagi Prisma modellari va DTO'lar bilan mos.

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Subject = 'ENGLISH' | 'UZBEK';
export type Skill =
  | 'LISTENING'
  | 'READING'
  | 'WRITING'
  | 'SPEAKING'
  | 'GRAMMAR'
  | 'VOCABULARY';
export type ExerciseType =
  | 'MCQ_SINGLE'
  | 'MCQ_MULTI'
  | 'TRUE_FALSE'
  | 'GAP_FILL'
  | 'MATCHING'
  | 'ORDERING'
  | 'SHORT_ANSWER'
  | 'WRITING_TASK'
  | 'SPEAKING_TASK';
export type MockKind = 'FULL' | 'SECTION' | 'MINI' | 'PLACEMENT';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'SCORING' | 'SCORED' | 'ABANDONED';
export type PlanTaskKind =
  | 'LESSON'
  | 'EXERCISE_SET'
  | 'VOCAB_REVIEW'
  | 'MOCK_FULL'
  | 'MOCK_SECTION'
  | 'CUSTOM';
export type PlanTaskStatus = 'PENDING' | 'DONE' | 'SKIPPED';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  googleId: string | null;
  telegramId: string | null;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  uiLanguage: string;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  targetLevel: CefrLevel | null;
  currentLevel: CefrLevel | null;
  examDate: string | null;
  dailyGoalMinutes: number;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: TokenPair;
}

export interface OtpSentResponse {
  sent: true;
  channel: 'EMAIL' | 'TELEGRAM';
  target: string;
  expiresInSeconds: number;
  devCode?: string;
}

export interface BotContactRequired {
  sent: false;
  needsBotContact: true;
  botUrl: string | null;
  message: string;
}

export type OtpRequestResponse = OtpSentResponse | BotContactRequired;

export function needsBotContact(r: OtpRequestResponse): r is BotContactRequired {
  return r.sent === false;
}

// ---------- Progress ----------

export interface DashboardResponse {
  user: {
    firstName: string;
    targetLevel: CefrLevel | null;
    currentLevel: CefrLevel | null;
    examDate: string | null;
    dailyGoalMinutes: number;
  };
  daysToExam: number | null;
  streak: number;
  today: { xp: number; minutes: number; goalMinutes: number; wordsReviewed: number };
  totals: { xp: number; minutes: number; wordsReviewed: number; lessonsCompleted: number };
  vocabDue: number;
  lastMockResult: {
    exam: { titleUz: string; slug: string; subject: Subject };
    overallScore: number | null;
    estimatedLevel: CefrLevel | null;
    scoredAt: string | null;
  } | null;
}

export interface HeatmapDay {
  date: string;
  xp: number;
  minutes: number;
}

// ---------- Courses ----------

export interface CourseSummary {
  id: string;
  subject: Subject;
  level: CefrLevel;
  slug: string;
  titleUz: string;
  titleEn: string | null;
  descriptionUz: string | null;
  icon: string | null;
  order: number;
  _count: { modules: number };
}

export interface LessonSummary {
  id: string;
  slug: string;
  titleUz: string;
  titleEn: string | null;
  skill: Skill | null;
  level: CefrLevel;
  order: number;
  estimatedMinutes: number;
  progress?: { status: 'IN_PROGRESS' | 'COMPLETED'; score: number | null } | null;
}

export interface CourseDetail extends Omit<CourseSummary, '_count'> {
  modules: Array<{
    id: string;
    slug: string;
    titleUz: string;
    descriptionUz: string | null;
    order: number;
    lessons: LessonSummary[];
  }>;
}

export type ContentBlock = Record<string, unknown> & { type: string };

export interface ExercisePublic {
  id: string;
  type: ExerciseType;
  skill: Skill;
  level: CefrLevel;
  order: number;
  promptUz: string | null;
  promptEn: string | null;
  dataJson: Record<string, unknown>;
  points: number;
}

export interface LessonDetail {
  id: string;
  slug: string;
  titleUz: string;
  skill: Skill | null;
  level: CefrLevel;
  estimatedMinutes: number;
  objectivesUz: string[];
  contentJson: ContentBlock[];
  module: {
    id: string;
    titleUz: string;
    course: { id: string; slug: string; titleUz: string; subject: Subject };
  };
  exercises: ExercisePublic[];
}

export interface SubmitAnswerResult {
  isCorrect: boolean;
  ratio: number;
  detail: unknown;
  correctAnswer: Record<string, unknown> | null;
  explanationUz: string | null;
}

// ---------- Mocks ----------

export interface MockSummary {
  id: string;
  subject: Subject;
  kind: MockKind;
  slug: string;
  titleUz: string;
  descriptionUz: string | null;
  order: number;
  sections: Array<{ id: string; skill: Skill; durationMinutes: number }>;
}

export interface QuestionPublic {
  id: string;
  order: number;
  number: number;
  type: ExerciseType;
  promptEn: string | null;
  promptUz: string | null;
  dataJson: Record<string, unknown>;
  points: number;
}

export interface ExamPart {
  id: string;
  order: number;
  titleUz: string | null;
  titleEn: string | null;
  instructionsUz: string | null;
  instructionsEn: string | null;
  passageText: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  contextJson: Record<string, unknown> | null;
  questions: QuestionPublic[];
}

export interface ExamSection {
  id: string;
  skill: Skill;
  order: number;
  durationMinutes: number;
  instructionsUz: string | null;
  instructionsEn: string | null;
  audioUrl: string | null;
  parts: ExamPart[];
}

export interface AttemptForTaking {
  id: string;
  status: AttemptStatus;
  startedAt: string;
  exam: {
    id: string;
    slug: string;
    titleUz: string;
    subject: Subject;
    kind: MockKind;
    sections: ExamSection[];
  };
  answers: Array<{
    questionId: string;
    answerJson: Record<string, unknown> | null;
    audioUrl: string | null;
  }>;
}

export interface SectionScore {
  skill: Skill;
  raw: number;
  max: number;
  /** 0–75 shkala (har bo'lim alohida, umumiy ball ularning o'rtachasi) */
  scaled: number | null;
  pendingAi: boolean;
}

export interface EvalCriterion {
  name: string;
  score: number;
  max: number;
  commentUz: string;
}

export interface EvalMistake {
  original: string;
  corrected: string;
  explanationUz: string;
}

export interface EvaluationResult {
  overallScore: number;
  estimatedLevel: CefrLevel | null;
  criteria: EvalCriterion[];
  strengthsUz: string[];
  mistakes: EvalMistake[];
  improvedVersion?: string;
  feedbackUz: string;
  transcript?: string;
}

export interface AttemptResult {
  id: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  scoredAt: string | null;
  overallScore: number | null;
  estimatedLevel: CefrLevel | null;
  sectionScoresJson: SectionScore[] | null;
  exam: { slug: string; titleUz: string; subject: Subject; kind: MockKind };
  answers: Array<{
    questionId: string;
    answerJson: Record<string, unknown> | null;
    audioUrl: string | null;
    isCorrect: boolean | null;
    score: number | null;
    question: {
      id: string;
      number: number;
      type: ExerciseType;
      promptEn: string | null;
      promptUz: string | null;
      dataJson: Record<string, unknown>;
      answerJson: Record<string, unknown> | null;
      points: number;
      part: { titleUz: string | null; titleEn: string | null; section: { skill: Skill } };
    };
  }>;
  evaluations: Array<{
    id: string;
    questionId: string | null;
    skill: Skill;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    transcript: string | null;
    resultJson: EvaluationResult | null;
  }>;
}

export interface AttemptSummary {
  id: string;
  status: AttemptStatus;
  startedAt: string;
  scoredAt: string | null;
  overallScore: number | null;
  estimatedLevel: CefrLevel | null;
  exam: { slug: string; titleUz: string; subject: Subject; kind: MockKind };
}

// ---------- Vocabulary ----------

export interface VocabWord {
  id: string;
  subject: Subject;
  level: CefrLevel;
  topic: string | null;
  word: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  translation: string;
  definitionEn: string | null;
  exampleEn: string | null;
  exampleUz: string | null;
  audioUrl: string | null;
}

export interface VocabCard {
  id: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  word: VocabWord;
}

export interface VocabStats {
  total: number;
  due: number;
  learning: number;
  mature: number;
}

export interface VocabTopic {
  topic: string | null;
  level: CefrLevel;
  count: number;
}

// ---------- Study plan ----------

export interface PlanTask {
  id: string;
  date: string;
  order: number;
  kind: PlanTaskKind;
  titleUz: string;
  durationMinutes: number;
  status: PlanTaskStatus;
  vocabCount: number | null;
  lesson: { id: string; slug: string; titleUz: string } | null;
  mockExam: { id: string; slug: string; titleUz: string; kind: MockKind } | null;
}

export interface ActivePlan {
  plan: {
    id: string;
    subject: Subject;
    startLevel: CefrLevel;
    targetLevel: CefrLevel;
    examDate: string | null;
    dailyMinutes: number;
    metaJson: {
      horizonDays: number;
      phases: Array<{ level: CefrLevel; fromDay: number; toDay: number }>;
      lessonsPerDay: number;
    } | null;
  };
  todayTasks: PlanTask[];
  weekTasks: PlanTask[];
  pastStats: { done: number; missed: number };
}
