// Core types for Xenon AI Learning Platform

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin' | 'self-learner' | 'tenant-manager';
  avatar?: string;
  createdAt: string;
  tenantId?: string; // for B2B users
  plan?: 'free' | 'pro' | 'team' | 'enterprise';
}

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  createdAt: string;
  plan: 'team' | 'enterprise';
  managerIds: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacher: User;
  status: 'draft' | 'ready' | 'published' | 'archived';
  resources: Resource[];
  route: CourseRoute;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  url: string;
  title: string;
  type: 'pdf' | 'html' | 'markdown' | 'text';
  processed: boolean;
}

export interface CourseRoute {
  modules: Module[];
}

export interface Module {
  moduleId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  lessonId: string;
  title: string;
  description: string;
  order: number;
  minMastery: number;
  content?: LessonContent;
}

export interface LessonContent {
  id: string;
  lessonId: string;
  material: string;
  quiz?: Quiz;
  resources: Resource[];
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
  startedAt: string;
  completedAt?: string;
}

export interface StudentProgress {
  enrollmentId: string;
  lessonId: string;
  mastery: number;
  attempts: number;
  lastAttemptAt: string;
  completed: boolean;
}

// Lesson progress (server-authoritative)
export type LessonStep = 'QUIZ' | 'LESSON' | 'RESULTS' | 'PRACTICE' | 'CODE';
export type LessonProgressStatus = 'NOT_STARTED' | 'STARTED' | 'FINISHED';

export interface LessonProgress {
  id: string;
  lessonId: string;
  lessonPosition: number;
  studentId: string;
  mastery: number; // 0..1
  step: LessonStep;
  completedAt?: string;
  status: LessonProgressStatus;
}

export interface ChatMessage {
  id: string;
  lessonId: string;
  studentId: string;
  message: string;
  response: string;
  timestamp: string;
}

// Student profile & onboarding
export type LearningStyle = 'VIDEO' | 'TEXT' | 'MIXED';

export interface StudentProfileDTO {
  id: string;
  userId: string;
  interests: string[];
  hobbies: string[];
  learningStyle: LearningStyle;
}

export interface SearchResult {
  chunkId: number;
  content: string;
  sourceRef?: string;
  metadata: Record<string, any>;
  scores: {
    similarity: number;
    text: number;
    combined: number;
  };
}

// API Request/Response types
export interface IngestRequest {
  course_id: string;
  title: string;
  description?: string;
  resources: string[];
  lang: string;
}

export interface IngestResponse {
  status: string;
  job_id: string;
}

export interface SearchRequest {
  query: string;
  course_id?: string;
  top_k?: number;
  use_hybrid?: boolean;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total_results: number;
  search_type: string;
}

// Materialization types
export interface MaterializationSection {
  lessonMaterialId: string;
  title: string;
  content: string;
  examples: string[];
}

export type MaterializationStatus = 'GENERATING' | 'FINISHED' | 'FAILED';
export type MaterializationStrategy = 'RESOURCE_RICH';

export interface Materialization {
  lessonId: string;
  lessonMaterialId: string;
  studentId: string;
  sections: MaterializationSection[];
  strategy: MaterializationStrategy;
  createdAt: string;
  generatedFromChunks: string[];
  generationStatus: MaterializationStatus;
}

export interface StartMaterializationRequest {
  courseId: string;
  lessonId: string;
}

// Materialization Quiz types (from /materialization/quiz)
export type MaterializationQuizStatus = 'GENERATING' | 'FINISHED' | 'FAILED';

export interface MaterializationQuizOption {
  id: string;
  optionRef: string;
  text: string;
  question: string;
}

export interface MaterializationQuizQuestion {
  id: string;
  questionId: string;
  type: string;
  prompt: string;
  quiz: string;
  options: MaterializationQuizOption[];
}

export interface MaterializationQuiz {
  id: string;
  quizId?: string;
  lessonMaterialId: string;
  questions: MaterializationQuizQuestion[];
  status: MaterializationQuizStatus;
}

export interface MaterializationQuizEvaluateItem {
  question: string;
  answer: string[];
}

export interface MaterializationQuizEvaluateRequest {
  quizId: string;
  items: MaterializationQuizEvaluateItem[];
}

export interface MaterializationQuizEvaluateContentItem {
  question: string;
  options: string[];
}

export interface MaterializationQuizEvaluateDetail {
  questionId: string;
  verdict: string;
  score: number;
  explanation: string;
}

export interface MaterializationQuizEvaluateResponse {
  id: string;
  quizId: string;
  studentId: string;
  scorePercent: number;
  content: MaterializationQuizEvaluateContentItem[];
  details: MaterializationQuizEvaluateDetail[];
  createdAt: string;
}

export interface MaterializationQuizAttempt extends MaterializationQuizEvaluateResponse {}
