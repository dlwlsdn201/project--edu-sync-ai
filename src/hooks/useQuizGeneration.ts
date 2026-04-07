import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateQuizQuestions } from '../api/ai';
import { saveQuizSet } from '../api/quiz';

interface GenerateParams {
  title: string;
  text: string;
}

export function useQuizGeneration(classroomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, text }: GenerateParams) => {
      const questions = await generateQuizQuestions(text);
      const quizSet = await saveQuizSet(classroomId, title, questions);
      return quizSet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizSets', classroomId] });
    },
  });
}
