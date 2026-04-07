export type UserRole = 'teacher' | 'student';

export interface Profile {
  id: string;
  kakao_id: string;
  role: UserRole | null;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  entry_code: string;
  created_at: string;
}

export interface Question {
  id: string;
  content: string;
  options: string[];
  correct_index: number;
  concept_tag: string;
}

export interface QuizSet {
  id: string;
  classroom_id: string;
  title: string;
  questions: Question[];
  created_at: string;
}

export interface StudentLog {
  id: string;
  student_id: string;
  quiz_set_id: string;
  question_id: string;
  selected_index: number;
  is_correct: boolean;
  ai_feedback?: string;
  created_at: string;
}

// ── 대시보드 / 리포트용 집계 타입 ───────────────────────────────────────────

export interface StudentResult {
  student_id: string;
  display_name: string;
  correct: number;
  total: number;
  accuracy: number; // 0~100
}

export interface ClassroomStats {
  total_students: number;
  answered_students: number;
  avg_accuracy: number;
  student_results: StudentResult[];
  weak_concepts: string[];   // 평균 정답률 60% 미만 concept_tag
  strong_concepts: string[]; // 평균 정답률 80% 이상 concept_tag
}

export interface ConceptStat {
  concept_tag: string;
  correct: number;
  total: number;
  accuracy: number; // 0~100
}

export interface MyLog {
  quiz_set_id: string;
  quiz_title: string;
  correct: number;
  total: number;
  accuracy: number;
  created_at: string;
}
