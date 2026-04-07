import { useQuery } from '@tanstack/react-query';
import { getStudentQuizSets, getQuizSetsByClassroom } from '../api/quiz';
import { supabase } from '../api/supabase';
import type { QuizSet } from '../types';

export function useStudentQuizSets(studentId: string) {
  return useQuery({
    queryKey: ['studentQuizSets', studentId],
    queryFn: () => getStudentQuizSets(studentId),
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
