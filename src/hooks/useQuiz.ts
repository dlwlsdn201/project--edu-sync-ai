import { useQuery } from '@tanstack/react-query';
import { getStudentQuizContext, getQuizSetsByClassroom } from '../api/quiz';
import { supabase } from '../api/supabase';
import type { QuizSet } from '../types';

/**
 * 학생 퀴즈 목록 + 입장 코드로 수업에 참여했는지(`hasClassroomMembership`) 동시 조회.
 */
export function useStudentQuizSets(studentId: string) {
  return useQuery({
    queryKey: ['studentQuizSets', studentId],
    queryFn: () => getStudentQuizContext(studentId),
    enabled: !!studentId,
  });
}

export function useTeacherQuizSets(classroomId: string) {
  return useQuery({
    queryKey: ['quizSets', classroomId],
    queryFn: () => getQuizSetsByClassroom(classroomId),
    enabled: !!classroomId,
  });
}

export function useQuizSet(quizSetId: string) {
  return useQuery({
    queryKey: ['quizSet', quizSetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_sets')
        .select('*')
        .eq('id', quizSetId)
        .single();
      if (error) throw new Error(`퀴즈 조회 실패: ${error.message}`);
      return data as QuizSet;
    },
    enabled: !!quizSetId,
  });
}
