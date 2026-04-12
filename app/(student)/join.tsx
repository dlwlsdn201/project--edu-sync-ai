import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { joinClassroom } from '../../src/api/quiz';
import { Button } from '../../src/components/common/Button';
import { ScreenContent } from '../../src/components/layout/ScreenContent';
import { useQueryClient } from '@tanstack/react-query';

export default function JoinScreen() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!profile?.id) return;
    if (code.trim().length < 4) {
      Alert.alert('알림', '입장 코드를 올바르게 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await joinClassroom(code.trim(), profile.id);
      await queryClient.invalidateQueries({ queryKey: ['studentQuizSets', profile.id] });
      Alert.alert('참여 완료!', '수업에 참여했습니다.', [
        { text: '퀴즈 보기', onPress: () => router.push('/(student)/quiz-list') },
      ]);
      setCode('');
    } catch (err) {
      Alert.alert('오류', err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContent outerClassName="bg-white" innerClassName="justify-center">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-center">
        <Text className="text-2xl font-bold text-gray-900 mb-2">수업 참여</Text>
        <Text className="text-sm text-gray-500 mb-8">
          교사에게 받은 입장 코드를 입력하세요.
        </Text>

        <TextInput
          className="border-2 border-gray-200 rounded-2xl px-5 py-4 text-2xl font-bold text-center text-gray-900 tracking-widest mb-6"
          placeholder="XXXXXX"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          maxLength={8}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isLoading}
        />

        <Button label="참여하기" onPress={handleJoin} isLoading={isLoading} />
        </View>
      </KeyboardAvoidingView>
    </ScreenContent>
  );
}
