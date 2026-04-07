import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { BookOpen, FileQuestion } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useTeacherQuizSets } from '../../src/hooks/useQuiz';
import { getOrCreateDefaultClassroom } from '../../src/api/quiz';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import type { Classroom, QuizSet } from '../../src/types';

export default function QuizLibraryScreen() {
  const { profile } = useAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    getOrCreateDefaultClassroom(profile.id)
      .then(setClassroom)
      .catch((err) => Alert.alert('오류', err.message));
  }, [profile?.id]);

  const { data: quizSets, isLoading } = useTeacherQuizSets(classroom?.id ?? '');

  if (isLoading || !classroom) return <LoadingSpinner fullScreen />;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">퀴즈 목록</Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-sm text-gray-500">입장 코드: </Text>
          <Text className="text-sm font-bold text-primary tracking-widest">
            {classroom.entry_code}
          </Text>
        </View>
      </View>

      {!quizSets || quizSets.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <FileQuestion size={48} color="#D1D5DB" />
          <Text className="text-base text-gray-400 mt-3">아직 생성된 퀴즈가 없습니다.</Text>
          <Text className="text-sm text-gray-400">퀴즈 생성 탭에서 첫 퀴즈를 만들어보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={quizSets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => <QuizCard quiz={item} />}
        />
      )}
    </View>
  );
}

function QuizCard({ quiz }: { quiz: QuizSet }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <View className="flex-row items-start">
        <View className="bg-primary/10 rounded-xl p-2 mr-3">
          <BookOpen size={20} color="#3B82F6" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">{quiz.title}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">{quiz.questions.length}문제</Text>
        </View>
      </View>
      <View className="mt-3 pt-3 border-t border-gray-50 flex-row flex-wrap gap-1.5">
        {quiz.questions.slice(0, 3).map((q) => (
          <View key={q.id} className="bg-gray-100 rounded-full px-2.5 py-0.5">
            <Text className="text-xs text-gray-500">{q.concept_tag}</Text>
          </View>
        ))}
        {quiz.questions.length > 3 && (
          <View className="bg-gray-100 rounded-full px-2.5 py-0.5">
            <Text className="text-xs text-gray-500">+{quiz.questions.length - 3}개</Text>
          </View>
        )}
      </View>
    </View>
  );
}
