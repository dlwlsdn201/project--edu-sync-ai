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
