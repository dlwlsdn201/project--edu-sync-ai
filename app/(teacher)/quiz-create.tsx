import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useQuizGeneration } from '../../src/hooks/useQuizGeneration';
import { getOrCreateDefaultClassroom } from '../../src/api/quiz';
import { Button } from '../../src/components/common/Button';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { ScreenContent } from '../../src/components/layout/ScreenContent';
import { showAppAlert } from '../../src/utils/appAlert';
import type { Classroom } from '../../src/types';

export default function QuizCreateScreen() {
  const { profile } = useAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { mutate: generate, isPending } = useQuizGeneration(classroom?.id ?? '');

  useEffect(() => {
    if (!profile?.id) return;
    getOrCreateDefaultClassroom(profile.id)
      .then(setClassroom)
      .catch((err) => showAppAlert('오류', err.message));
  }, [profile?.id]);

  const handleGenerate = () => {
    if (!classroom) {
      showAppAlert('오류', '수업 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (!title.trim()) {
      showAppAlert('알림', '퀴즈 제목을 입력해주세요.');
      return;
    }
    if (content.trim().length < 50) {
      showAppAlert('알림', '수업 자료를 50자 이상 입력해주세요.');
      return;
    }

    generate(
      { title: title.trim(), text: content.trim() },
      {
        onSuccess: () => {
          setTitle('');
          setContent('');
          if (Platform.OS === 'web') {
            window.alert('완료\n\n퀴즈가 생성되었습니다!');
            router.push('/(teacher)/quiz-library');
          } else {
            Alert.alert('완료', '퀴즈가 생성되었습니다!', [
              { text: '확인', onPress: () => router.push('/(teacher)/quiz-library') },
            ]);
          }
        },
        onError: (err) => {
          showAppAlert(
            '생성 실패',
            err instanceof Error ? err.message : '오류가 발생했습니다.',
          );
        },
      },
    );
  };

  return (
    <ScreenContent outerClassName="bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}
        >
        <Text className="text-2xl font-bold text-gray-900 mb-1">AI 퀴즈 생성</Text>
        <Text className="text-sm text-gray-500 mb-6">
          수업 자료를 입력하면 AI가 자동으로 퀴즈를 만들어드립니다.
        </Text>

        {classroom && (
          <View className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6">
            <Text className="text-xs text-gray-500">입장 코드</Text>
            <Text className="text-xl font-bold text-primary tracking-widest">
              {classroom.entry_code}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5">학생에게 이 코드를 알려주세요.</Text>
          </View>
        )}

        <Text className="text-sm font-medium text-gray-700 mb-1.5">퀴즈 제목</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
          placeholder="예: 1단원 핵심 개념 퀴즈"
          value={title}
          onChangeText={setTitle}
          editable={!isPending}
        />

        <Text className="text-sm font-medium text-gray-700 mb-1.5">수업 자료</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-2"
          placeholder="수업 자료 내용을 붙여넣거나 직접 입력하세요. (50자 이상)"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          style={{ minHeight: 180 }}
          editable={!isPending}
        />
        <Text className="text-xs text-gray-400 mb-8 text-right">{content.length}자</Text>

        {isPending ? (
          <View className="items-center py-4">
            <LoadingSpinner />
            <Text className="text-sm text-gray-500 mt-3">AI가 퀴즈를 생성하고 있습니다...</Text>
          </View>
        ) : (
          <Button label="AI로 퀴즈 생성" onPress={handleGenerate} />
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContent>
  );
}
