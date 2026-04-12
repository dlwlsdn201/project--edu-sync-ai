import React from "react";
import { Text, View } from "react-native";
import { Button } from "../../components/common/Button";
import { ScreenContent } from "../../components/layout/ScreenContent";
import { useAuth } from "../../hooks/useAuth";

/**
 * 미로그인 시 진입 화면 — 로그인 CTA를 중앙에 배치합니다.
 */
export function LoginScreen() {
  const { signIn, isLoading } = useAuth();

  return (
    <ScreenContent outerClassName="bg-white" innerClassName="justify-center items-center">
      <View className="items-center">
        <Text className="mb-2 text-3xl font-bold text-gray-900">EduSync AI</Text>
        <Text className="mb-12 text-center text-base text-gray-500">
          실시간 맞춤형 학습 진단 솔루션
        </Text>

        <Button label="카카오 로그인" onPress={signIn} isLoading={isLoading} />
      </View>
    </ScreenContent>
  );
}
