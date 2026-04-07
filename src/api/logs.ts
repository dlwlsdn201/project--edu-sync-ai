import { supabase } from './supabase';
import type { ClassroomStats, ConceptStat, MyLog, StudentResult } from '../types';

/**
 * classroom의 모든 quiz_sets에 대한 학생별 전체 정답률 집계
 */
export async function getClassroomStats(classroomId: string): Promise<ClassroomStats> {
  // 1. 해당 classroom의 quiz_sets 조회
  const { data: quizSets, error: qErr } = await supabase
    .from('quiz_sets')
    .select('id, questions')
    .eq('classroom_id', classroomId);

  if (qErr) throw new Error(`퀴즈 조회 실패: ${qErr.message}`);
  if (!quizSets || quizSets.length === 0) {
    return { total_students: 0, answered_students: 0, avg_accuracy: 0, student_results: [], weak_concepts: [], strong_concepts: [] };
  }

  const quizSetIds = quizSets.map((q) => q.id);

  // 2. 수업 참여 학생 목록
  const { data: members, error: mErr } = await supabase
    .from('classroom_members')
    .select('student_id, profiles(display_name)')
    .eq('classroom_id', classroomId);

  if (mErr) throw new Error(`학생 목록 조회 실패: ${mErr.message}`);

  // 3. 해당 quiz_sets의 student_logs 전체 조회
  const { data: logs, error: lErr } = await supabase
    .from('student_logs')
    .select('student_id, question_id, is_correct, quiz_set_id')
    .in('quiz_set_id', quizSetIds);

  if (lErr) throw new Error(`로그 조회 실패: ${lErr.message}`);

  // 4. 학생별 집계
  const logsByStudent = new Map<string, { correct: number; total: number }>();
  for (const log of logs ?? []) {
    const cur = logsByStudent.get(log.student_id) ?? { correct: 0, total: 0 };
    logsByStudent.set(log.student_id, {
      correct: cur.correct + (log.is_correct ? 1 : 0),
      total: cur.total + 1,
    });
  }

  const studentResults: StudentResult[] = (members ?? []).map((m) => {
    const stats = logsByStudent.get(m.student_id);
    const displayName = (m.profiles as unknown as { display_name: string } | null)?.display_name ?? '알 수 없음';
    if (!stats) {
      return { student_id: m.student_id, display_name: displayName, correct: 0, total: 0, accuracy: -1 };
    }
    return {
      student_id: m.student_id,
      display_name: displayName,
      correct: stats.correct,
      total: stats.total,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    };
  });

  // 5. concept_tag별 집계 (weak/strong 판별)
  const allQuestions = quizSets.flatMap((qs) => qs.questions as Array<{ id: string; concept_tag: string }>);
  const qIdToTag = new Map(allQuestions.map((q) => [q.id, q.concept_tag]));

  const conceptMap = new Map<string, { correct: number; total: number }>();
  for (const log of logs ?? []) {
    const tag = qIdToTag.get(log.question_id);
    if (!tag) continue;
    const cur = conceptMap.get(tag) ?? { correct: 0, total: 0 };
    conceptMap.set(tag, { correct: cur.correct + (log.is_correct ? 1 : 0), total: cur.total + 1 });
  }

  const weak_concepts: string[] = [];
  const strong_concepts: string[] = [];
  for (const [tag, stat] of conceptMap.entries()) {
    const acc = (stat.correct / stat.total) * 100;
    if (acc < 60) weak_concepts.push(tag);
    else if (acc >= 80) strong_concepts.push(tag);
  }

  const answered = studentResults.filter((s) => s.accuracy >= 0);
  const avg_accuracy = answered.length > 0
    ? Math.round(answered.reduce((sum, s) => sum + s.accuracy, 0) / answered.length)
    : 0;

  return {
    total_students: studentResults.length,
    answered_students: answered.length,
    avg_accuracy,
    student_results: studentResults,
    weak_concepts,
    strong_concepts,
  };
}

/**
 * 학생 본인의 concept_tag별 정답률 집계
 */
export async function getMyConceptStats(studentId: string): Promise<ConceptStat[]> {
  // student_logs 조회 후 quiz_sets에서 concept_tag 매핑
  const { data: logs, error: lErr } = await supabase
    .from('student_logs')
    .select('question_id, is_correct, quiz_set_id')
    .eq('student_id', studentId);

  if (lErr) throw new Error(`로그 조회 실패: ${lErr.message}`);
  if (!logs || logs.length === 0) return [];

  const quizSetIds = [...new Set(logs.map((l) => l.quiz_set_id))];
  const { data: quizSets, error: qErr } = await supabase
    .from('quiz_sets')
    .select('id, questions')
    .in('id', quizSetIds);

  if (qErr) throw new Error(`퀴즈 조회 실패: ${qErr.message}`);

  const qIdToTag = new Map<string, string>();
  for (const qs of quizSets ?? []) {
    for (const q of qs.questions as Array<{ id: string; concept_tag: string }>) {
      qIdToTag.set(q.id, q.concept_tag);
    }
  }

  const conceptMap = new Map<string, { correct: number; total: number }>();
  for (const log of logs) {
    const tag = qIdToTag.get(log.question_id);
    if (!tag) continue;
    const cur = conceptMap.get(tag) ?? { correct: 0, total: 0 };
    conceptMap.set(tag, { correct: cur.correct + (log.is_correct ? 1 : 0), total: cur.total + 1 });
  }

  return [...conceptMap.entries()]
    .map(([concept_tag, stat]) => ({
      concept_tag,
      correct: stat.correct,
      total: stat.total,
      accuracy: Math.round((stat.correct / stat.total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy); // 취약 순서대로
}

/**
 * 학생 본인의 응시 이력 (quiz_set별 집계, 최신순)
 */
export async function getMyLogs(studentId: string): Promise<MyLog[]> {
  const { data: logs, error: lErr } = await supabase
    .from('student_logs')
    .select('quiz_set_id, is_correct, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (lErr) throw new Error(`로그 조회 실패: ${lErr.message}`);
  if (!logs || logs.length === 0) return [];

  const quizSetIds = [...new Set(logs.map((l) => l.quiz_set_id))];
  const { data: quizSets, error: qErr } = await supabase
    .from('quiz_sets')
    .select('id, title')
    .in('id', quizSetIds);

  if (qErr) throw new Error(`퀴즈 조회 실패: ${qErr.message}`);

  const qIdToTitle = new Map((quizSets ?? []).map((qs) => [qs.id, qs.title]));

  // quiz_set_id별 집계 (첫 번째 응시 시각 사용)
  const setMap = new Map<string, { correct: number; total: number; created_at: string }>();
  for (const log of logs) {
    const cur = setMap.get(log.quiz_set_id);
    if (!cur) {
      setMap.set(log.quiz_set_id, { correct: log.is_correct ? 1 : 0, total: 1, created_at: log.created_at });
    } else {
      setMap.set(log.quiz_set_id, { ...cur, correct: cur.correct + (log.is_correct ? 1 : 0), total: cur.total + 1 });
    }
  }

  return [...setMap.entries()].map(([quiz_set_id, stat]) => ({
    quiz_set_id,
    quiz_title: qIdToTitle.get(quiz_set_id) ?? '알 수 없는 퀴즈',
    correct: stat.correct,
    total: stat.total,
    accuracy: Math.round((stat.correct / stat.total) * 100),
    created_at: stat.created_at,
  }));
}
