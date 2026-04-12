import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, ChevronRight, CheckCircle2, FileQuestion, KeyRound } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useStudentQuizSets } from '../../src/hooks/useQuiz';
import { joinClassroom } from '../../src/api/quiz';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { ScreenContent } from '../../src/components/layout/ScreenContent';
import { Button } from '../../src/components/common/Button';
import { useQueryClient } from '@tanstack/react-query';
import type { QuizSet } from '../../src/types';

const JOIN_SUCCESS_MS = 6000;

/**
 * 학생 퀴즈 목록 + 동일 화면 상단에서 입장 코드로 수업 참여(병합 UX).
 * 참여 성공 시 목록이 갱신되고, 인라인 배너로 성공 여부를 즉시 표시합니다.
 */
export default function QuizListScreen() {
  const { profile } = useAuth();
  const studentId = profile?.id ?? '';
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useStudentQuizSets(studentId);
  const quizSets = data?.quizSets ?? [];
  const hasClassroomMembership = data?.hasClassroomMembership ?? false;

  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // 성공 배너 자동 숨김(결과가 잠시라도 명확히 보이도록)
  useEffect(() => {
    if (!joinSuccess) return;
    const t = setTimeout(() => setJoinSuccess(null), JOIN_SUCCESS_MS);
    return () => clearTimeout(t);
  }, [joinSuccess]);

  const handleJoin = useCallback(async () => {
    if (!studentId) return;
    setJoinError(null);
    setJoinSuccess(null);

    if (code.trim().length < 4) {
      setJoinError('입장 코드를 4자 이상 입력해 주세요.');
      return;
    }

    setIsJoining(true);
    try {
      const classroom = await joinClassroom(code.trim(), studentId);
      await queryClient.invalidateQueries({ queryKey: ['studentQuizSets', studentId] });
      await refetch();
      setJoinSuccess(`「${classroom.name}」 수업에 참여했습니다. 아래 목록에서 퀴즈를 선택하세요.`);
      setCode('');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : '수업 참여에 실패했습니다.');
    } finally {
      setIsJoining(false);
    }
  }, [code, queryClient, refetch, studentId]);

  if (isLoading && data === undefined) return <LoadingSpinner fullScreen />;

  return (
    <ScreenContent>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <FlatList
          className="flex-1"
          data={quizSets}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1, gap: 10, paddingTop: 4 }}
          ListHeaderComponent={
            <QuizListHeader
              code={code}
              onCodeChange={(t) => {
                setCode(t.toUpperCase());
                setJoinError(null);
              }}
              onJoin={handleJoin}
              isJoining={isJoining}
              joinSuccess={joinSuccess}
              joinError={joinError}
            />
          }
          ListEmptyComponent={
            <QuizListEmptyState hasClassroomMembership={hasClassroomMembership} />
          }
          renderItem={({ item }) => <QuizListItem quiz={item} />}
        />
      </KeyboardAvoidingView>
    </ScreenContent>
  );
}

interface QuizListHeaderProps {
  code: string;
  onCodeChange: (text: string) => void;
  onJoin: () => void;
  isJoining: boolean;
  joinSuccess: string | null;
  joinError: string | null;
}

/**
 * 상단: 입장 코드 입력 + 참여 — 성공·실패를 같은 카드 안에서 즉시 표시
 */
function QuizListHeader({
  code,
  onCodeChange,
  onJoin,
  isJoining,
  joinSuccess,
  joinError,
}: QuizListHeaderProps) {
  return (
    <View className="pb-2">
      <View className="bg-white pt-14 pb-4 border-b border-gray-100 -mx-5 px-5 mb-4">
        <Text className="text-2xl font-bold text-gray-900">퀴즈</Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          입장 코드로 수업에 참여한 뒤, 아래에서 퀴즈를 선택하세요.
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1.5">입장 코드</Text>
        <Text className="text-xs text-gray-500 mb-3">
          교사 화면(퀴즈 생성) 상단에 표시된 코드를 입력합니다.
        </Text>

        <TextInput
          className="border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-xl font-bold text-center text-gray-900 tracking-widest mb-3"
          placeholder="예: ABC123"
          value={code}
          onChangeText={onCodeChange}
          maxLength={8}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isJoining}
          accessibilityLabel="수업 입장 코드 입력"
        />

        <Button label="참여하기" onPress={onJoin} isLoading={isJoining} />

        {joinSuccess ? (
          <View
            className="mt-4 flex-row items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-3"
            accessibilityRole="alert"
          >
            <CheckCircle2 size={20} color="#059669" style={{ marginTop: 2 }} />
            <Text className="text-sm text-emerald-900 flex-1 leading-5">{joinSuccess}</Text>
          </View>
        ) : null}

        {joinError ? (
          <Text
            className="mt-3 text-sm text-red-600"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {joinError}
          </Text>
        ) : null}
      </View>

      <Text className="text-base font-semibold text-gray-900 mb-2 px-0.5">내 퀴즈</Text>
    </View>
  );
}

interface QuizListEmptyStateProps {
  /** 입장 코드로 최소 한 수업에 참여한 경우 true */
  hasClassroomMembership: boolean;
}

/**
 * 수업 미참여 시 · 참여했으나 퀴즈 0개 시 메시지를 구분합니다.
 */
function QuizListEmptyState({ hasClassroomMembership }: QuizListEmptyStateProps) {
  if (!hasClassroomMembership) {
    return (
      <View
        className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-5 py-8 items-center"
        accessibilityRole="text"
      >
        <KeyRound size={40} color="#9CA3AF" />
        <Text className="text-base text-gray-600 mt-4 text-center font-medium leading-6">
          입장 코드를 먼저 입력한 후,{'\n'}참여하기 버튼을 눌러주세요
        </Text>
        <Text className="text-xs text-gray-400 mt-3 text-center leading-5">
          수업에 참여하면 교사가 만든 퀴즈가 여기에 표시됩니다.
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-8 px-2">
      <FileQuestion size={48} color="#D1D5DB" />
      <Text className="text-base text-gray-500 mt-3 text-center font-medium">
        아직 표시할 퀴즈가 없습니다
      </Text>
      <Text className="text-sm text-gray-400 mt-1 text-center leading-5">
        교사가 해당 수업에 퀴즈를 만들면 목록에 나타납니다.
      </Text>
    </View>
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
