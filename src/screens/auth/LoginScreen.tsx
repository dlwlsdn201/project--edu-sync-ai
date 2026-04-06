import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export function LoginScreen() {
  const { signIn, isLoading } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-2 text-3xl font-bold text-gray-900">EduSync AI</Text>
      <Text className="mb-12 text-base text-gray-500">
        실시간 맞춤형 학습 진단 솔루션
      </Text>

      <Button
        label="카카오로 시작하기"
        onPress={signIn}
        isLoading={isLoading}
        className="w-full"
      />
    </View>
  );
}
