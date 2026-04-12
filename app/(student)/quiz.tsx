import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react-native';
import { useQuizSet } from '../../src/hooks/useQuiz';
import { useAuth } from '../../src/hooks/useAuth';
import { isQuizSetCompletedByStudent, submitAnswer, updateFeedback } from '../../src/api/quiz';
import { generateHint } from '../../src/api/ai';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { Button } from '../../src/components/common/Button';
import { ScreenContent } from '../../src/components/layout/ScreenContent';
import type { Question } from '../../src/types';

type Phase = 'answering' | 'correct' | 'wrong' | 'hint_loading' | 'hint_shown' | 'finished';

/** 응시 가능 여부: 로그 완료 여부 확인 전까지 대기 */
type EntryGate = 'checking' | 'allowed' | 'blocked';

/**
 * 학생 퀴즈 응시 화면 — 제출 로그와 AI 힌트(ai_feedback)를 연동합니다.
 */
export default function QuizScreen() {
  const { quizSetId } = useLocalSearchParams<{ quizSetId: string }>();
  const { profile } = useAuth();
  const { data: quizSet, isLoading } = useQuizSet(quizSetId ?? '');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('answering');
  const [hint, setHint] = useState('');
  const [score, setScore] = useState(0);
  // 오답 행의 id — 힌트 생성 후 DB의 ai_feedback 컬럼에 저장할 때 사용
  const [lastLogId, setLastLogId] = useState<string | null>(null);
  const [entryGate, setEntryGate] = useState<EntryGate>('checking');

  // 이미 전체 문항을 제출한 퀴즈는 URL 직접 진입도 막아 통계 일관성을 유지합니다.
  useEffect(() => {
    if (!quizSet || !profile?.id) {
      setEntryGate('checking');
      return;
    }
    let cancelled = false;
    setEntryGate('checking');
    isQuizSetCompletedByStudent(profile.id, quizSet).then((done) => {
      if (cancelled) return;
      setEntryGate(done ? 'blocked' : 'allowed');
    });
    return () => {
      cancelled = true;
    };
  }, [quizSet, profile?.id]);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!quizSet) return (
    <ScreenContent outerClassName="bg-white" innerClassName="justify-center items-center">
      <Text className="text-gray-500">퀴즈를 불러올 수 없습니다.</Text>
    </ScreenContent>
  );

  if (entryGate === 'checking') {
    return <LoadingSpinner fullScreen />;
  }

  if (entryGate === 'blocked') {
    return (
      <ScreenContent outerClassName="bg-white" innerClassName="justify-center items-center px-6 py-12">
        <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
          이미 응시를 완료한 퀴즈입니다
        </Text>
        <Text className="text-sm text-gray-500 text-center mb-8 leading-6">
          학습 리포트·통계 신뢰도를 위해 동일 퀴즈를 다시 풀 수 없습니다.
        </Text>
        <Button label="퀴즈 목록으로" onPress={() => router.back()} />
      </ScreenContent>
    );
  }

  const questions = quizSet.questions;
  const question: Question = questions[currentIndex];
  const isFinished = phase === 'finished';

  const handleSelect = (index: number) => {
    if (phase !== 'answering') return;
    setSelectedIndex(index);
  };

  const handleSubmit = async () => {
    if (selectedIndex === null || !profile?.id) return;

    const isCorrect = selectedIndex === question.correct_index;

    try {
      const logId = await submitAnswer({
        student_id: profile.id,
        quiz_set_id: quizSet.id,
        question_id: question.id,
        selected_index: selectedIndex,
        is_correct: isCorrect,
      });

      if (isCorrect) {
        setLastLogId(null);
        setScore((s) => s + 1);
        setPhase('correct');
      } else {
        setLastLogId(logId);
        setPhase('wrong');
      }
    } catch {
      // 로그 저장 실패 시에도 UI 피드백은 진행 (Realtime·리포트는 누락될 수 있음)
      if (isCorrect) {
        setLastLogId(null);
        setScore((s) => s + 1);
        setPhase('correct');
      } else {
        setLastLogId(null);
        setPhase('wrong');
      }
    }
  };

  const handleGetHint = async () => {
    setPhase('hint_loading');
    try {
      const h = await generateHint(question, selectedIndex!);
      setHint(h);
      setPhase('hint_shown');
      // Supabase에 힌트 텍스트를 남겨 두어 향후 리포트·분석에 활용 가능
      if (lastLogId) {
        await updateFeedback(lastLogId, h).catch(() => {});
      }
    } catch {
      setHint('힌트를 불러올 수 없습니다.');
      setPhase('hint_shown');
    }
  };

  const handleNext = () => {
    setLastLogId(null);
    if (currentIndex + 1 >= questions.length) {
      setPhase('finished');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setPhase('answering');
      setHint('');
    }
  };

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <ScreenContent outerClassName="bg-white" innerClassName="justify-center items-center py-12">
        <Text className="text-4xl font-bold text-primary mb-2">{pct}%</Text>
        <Text className="text-xl font-semibold text-gray-900 mb-1">퀴즈 완료!</Text>
        <Text className="text-base text-gray-500 mb-8 text-center">
          {questions.length}문제 중 {score}개 정답
        </Text>
        <Button label="목록으로 돌아가기" onPress={() => router.back()} />
      </ScreenContent>
    );
  }

  return (
    <ScreenContent outerClassName="bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingTop: 60, paddingBottom: 40 }}>
      {/* 진행률 */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-gray-400">{currentIndex + 1} / {questions.length}</Text>
        <Text className="text-sm text-gray-400">정답 {score}개</Text>
      </View>
      <View className="h-1.5 bg-gray-100 rounded-full mb-6">
        <View
          className="h-1.5 bg-primary rounded-full"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </View>

      {/* 문제 */}
      <View className="bg-gray-50 rounded-2xl p-5 mb-6">
        <Text className="text-xs font-medium text-primary mb-2">{question.concept_tag}</Text>
        <Text className="text-base font-semibold text-gray-900 leading-relaxed">
          {question.content}
        </Text>
      </View>

      {/* 선택지 */}
      <View className="gap-3 mb-6">
        {question.options.map((opt, idx) => {
          const isSelected = selectedIndex === idx;
          const isAnswered = phase !== 'answering';
          const isCorrectOpt = idx === question.correct_index;

          let optStyle = 'border-gray-200 bg-white';
          let textStyle = 'text-gray-800';

          if (isAnswered) {
            if (isCorrectOpt) {
              optStyle = 'border-success bg-success/5';
              textStyle = 'text-success font-semibold';
            } else if (isSelected && !isCorrectOpt) {
              optStyle = 'border-error bg-error/5';
              textStyle = 'text-error';
            }
          } else if (isSelected) {
            optStyle = 'border-primary bg-primary/5';
            textStyle = 'text-primary font-semibold';
          }

          return (
            <Pressable
              key={idx}
              onPress={() => handleSelect(idx)}
              className={`border-2 rounded-2xl px-4 py-3.5 ${optStyle}`}
            >
              <Text className={`text-base ${textStyle}`}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* 피드백 영역 */}
      {phase === 'correct' && (
        <View className="flex-row items-center bg-success/10 rounded-xl px-4 py-3 mb-4">
          <CheckCircle size={20} color="#10B981" />
          <Text className="text-success font-semibold ml-2">정답입니다!</Text>
        </View>
      )}

      {phase === 'wrong' && (
        <View className="bg-error/10 rounded-xl px-4 py-3 mb-4">
          <View className="flex-row items-center mb-3">
            <XCircle size={20} color="#EF4444" />
            <Text className="text-error font-semibold ml-2">오답입니다.</Text>
          </View>
          {/* 힌트는 선택 — 힌트 없이도 다음 문제로 진행 가능 */}
          <View className="gap-2">
            <Button label="힌트 보기" onPress={handleGetHint} variant="outline" className="!w-full" />
            <Button
              label={currentIndex + 1 >= questions.length ? '결과 보기' : '다음 문제'}
              onPress={handleNext}
              className="!w-full"
            />
          </View>
        </View>
      )}

      {phase === 'hint_loading' && (
        <View className="items-center py-3 mb-4">
          <LoadingSpinner />
          <Text className="text-sm text-gray-400 mt-2">힌트를 생성하고 있습니다...</Text>
        </View>
      )}

      {phase === 'hint_shown' && (
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4">
          <View className="flex-row items-center mb-1.5">
            <Lightbulb size={16} color="#F59E0B" />
            <Text className="text-sm font-semibold text-yellow-700 ml-1.5">AI 힌트</Text>
          </View>
          <Text className="text-sm text-yellow-800 leading-relaxed">{hint}</Text>
        </View>
      )}

      {/* 제출 / 다음 버튼 */}
      {phase === 'answering' && (
        <Button label="제출" onPress={handleSubmit} />
      )}

      {(phase === 'correct' || phase === 'hint_shown') && (
        <Button
          label={currentIndex + 1 >= questions.length ? '결과 보기' : '다음 문제'}
          onPress={handleNext}
        />
      )}
      </ScrollView>
    </ScreenContent>
  );
}
