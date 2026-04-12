import { supabase } from './supabase';
import type { Classroom, Question, QuizSet, StudentLog } from '../types';

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function generateEntryCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── 교사용 ────────────────────────────────────────────────────────────────────

/**
 * 교사의 기본 수업을 조회하거나, 없으면 자동 생성합니다.
 */
export async function getOrCreateDefaultClassroom(teacherId: string): Promise<Classroom> {
  const { data: existing, error: fetchErr } = await supabase
    .from('classrooms')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (existing && !fetchErr) return existing as Classroom;

  // 수업이 없으면 기본 수업 생성
  const { data: created, error: createErr } = await supabase
    .from('classrooms')
    .insert({
      teacher_id: teacherId,
      name: '내 수업',
      entry_code: generateEntryCode(),
    })
    .select()
    .single();

  if (createErr) throw new Error(`수업 생성 실패: ${createErr.message}`);
  return created as Classroom;
}

/**
 * 퀴즈 세트를 저장합니다.
 */
export async function saveQuizSet(
  classroomId: string,
  title: string,
  questions: Question[],
): Promise<QuizSet> {
  const { data, error } = await supabase
    .from('quiz_sets')
    .insert({ classroom_id: classroomId, title, questions })
    .select()
    .single();

  if (error) throw new Error(`퀴즈 저장 실패: ${error.message}`);
  return data as QuizSet;
}

/**
 * 수업의 퀴즈 목록을 조회합니다.
 */
export async function getQuizSetsByClassroom(classroomId: string): Promise<QuizSet[]> {
  const { data, error } = await supabase
    .from('quiz_sets')
    .select('*')
    .eq('classroom_id', classroomId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`퀴즈 목록 조회 실패: ${error.message}`);
  return (data ?? []) as QuizSet[];
}

// ── 학생용 ────────────────────────────────────────────────────────────────────

/**
 * entry_code로 수업에 참여합니다.
 */
export async function joinClassroom(
  entryCode: string,
  studentId: string,
): Promise<Classroom> {
  const { data: classroom, error: findErr } = await supabase
    .from('classrooms')
    .select('*')
    .eq('entry_code', entryCode.toUpperCase())
    .single();

  if (findErr || !classroom) {
    throw new Error('입장 코드가 올바르지 않습니다.');
  }

  // 이미 참여한 경우 upsert로 중복 방지
  const { error: joinErr } = await supabase
    .from('classroom_members')
    .upsert({ classroom_id: classroom.id, student_id: studentId });

  if (joinErr) throw new Error(`수업 참여 실패: ${joinErr.message}`);
  return classroom as Classroom;
}

/**
 * 학생이 참여한 수업의 퀴즈 목록을 조회합니다.
 */
export async function getStudentQuizSets(studentId: string): Promise<QuizSet[]> {
  const { data: memberships, error: memberErr } = await supabase
    .from('classroom_members')
    .select('classroom_id')
    .eq('student_id', studentId);

  if (memberErr) throw new Error(`수업 목록 조회 실패: ${memberErr.message}`);
  if (!memberships || memberships.length === 0) return [];

  const classroomIds = memberships.map((m) => m.classroom_id);

  const { data, error } = await supabase
    .from('quiz_sets')
    .select('*')
    .in('classroom_id', classroomIds)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`퀴즈 목록 조회 실패: ${error.message}`);
  return (data ?? []) as QuizSet[];
}

/**
 * 학생 응답을 저장하고, 이후 AI 힌트와 연결할 수 있도록 행 id를 반환합니다.
 */
export async function submitAnswer(
  log: Omit<StudentLog, 'id' | 'created_at' | 'ai_feedback'>,
): Promise<string> {
  const { data, error } = await supabase
    .from('student_logs')
    .insert(log)
    .select('id')
    .single();

  if (error) throw new Error(`응답 저장 실패: ${error.message}`);
  return data.id;
}

/**
 * student_logs.ai_feedback 업데이트
 */
export async function updateFeedback(logId: string, feedback: string): Promise<void> {
  const { error } = await supabase
    .from('student_logs')
    .update({ ai_feedback: feedback })
    .eq('id', logId);
  if (error) throw new Error(`피드백 저장 실패: ${error.message}`);
}
