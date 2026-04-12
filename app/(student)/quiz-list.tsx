import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, ChevronRight, FileQuestion } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useStudentQuizSets } from '../../src/hooks/useQuiz';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { ScreenContent } from '../../src/components/layout/ScreenContent';
import type { QuizSet } from '../../src/types';

export default function QuizListScreen() {
  const { profile } = useAuth();
  const { data: quizSets, isLoading } = useStudentQuizSets(profile?.id ?? '');

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <ScreenContent>
      <View className="flex-1">
        <View className="bg-white pt-14 pb-4 border-b border-gray-100 -mx-5 px-5">
          <Text className="text-2xl font-bold text-gray-900">내 퀴즈</Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            참여한 수업의 퀴즈 목록입니다.
          </Text>
        </View>

        {!quizSets || quizSets.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <FileQuestion size={48} color="#D1D5DB" />
            <Text className="text-base text-gray-400 mt-3">아직 퀴즈가 없습니다.</Text>
            <Text className="text-sm text-gray-400">수업 참여 탭에서 수업에 참여해보세요!</Text>
          </View>
        ) : (
          <FlatList
            className="flex-1"
            data={quizSets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 16, gap: 10 }}
            renderItem={({ item }) => <QuizListItem quiz={item} />}
          />
        )}
      </View>
    </ScreenContent>
  );
}

function QuizListItem({ quiz }: { quiz: QuizSet }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(student)/quiz', params: { quizSetId: quiz.id } })}
      className="bg-white rounded-2xl px-4 py-4 border border-gray-100 flex-row items-center active:bg-gray-50"
    >
      <View className="bg-primary/10 rounded-xl p-2.5 mr-3">
        <BookOpen size={20} color="#3B82F6" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{quiz.title}</Text>
        <Text className="text-sm text-gray-500">{quiz.questions.length}문제</Text>
      </View>
      <ChevronRight size={18} color="#D1D5DB" />
    </Pressable>
  );
}
