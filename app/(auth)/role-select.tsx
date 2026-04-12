import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Redirect, router } from 'expo-router';
import { GraduationCap, BookOpen } from 'lucide-react-native';
import { supabase } from '../../src/api/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { ScreenContent } from '../../src/components/layout/ScreenContent';
import type { UserRole } from '../../src/types';

/**
 * 역할 선택 완료 후 해당 역할의 프로필 탭으로 이동합니다.
 * (역할 변경 플로우에서 다시 설정 화면으로 돌아오도록 맞춤)
 */
export default function RoleSelectScreen() {
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  if (!profile) return <Redirect href="/" />;

  const handleSelectRole = async (role: UserRole) => {
    setIsLoading(true);
    setSelectedRole(role);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      // 역할별 프로필 탭으로 복귀 (역할 변경 진입과 동일한 맥락)
      if (role === 'teacher') {
        router.replace('/(teacher)/profile');
      } else {
        router.replace('/(student)/profile');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.';
      Alert.alert('오류', msg);
      setSelectedRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <ScreenContent outerClassName="bg-white" innerClassName="justify-center py-10">
      <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
        반갑습니다!
      </Text>
      <Text className="text-base text-gray-500 text-center mb-12">
        {profile.display_name}님, 역할을 선택해주세요.
      </Text>

      <View className="gap-4">
        <RoleCard
          role="teacher"
          title="교사"
          description="AI로 퀴즈를 생성하고 학생 학습을 관리합니다."
          icon={<BookOpen size={40} color="#3B82F6" />}
          selected={selectedRole === 'teacher'}
          onPress={() => handleSelectRole('teacher')}
        />
        <RoleCard
          role="student"
          title="학생"
          description="수업에 참여하고 AI 퀴즈를 풀어봅니다."
          icon={<GraduationCap size={40} color="#3B82F6" />}
          selected={selectedRole === 'student'}
          onPress={() => handleSelectRole('student')}
        />
      </View>
    </ScreenContent>
  );
}

function RoleCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={[
        'flex-row items-center p-5 rounded-2xl border-2',
        selected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white',
      ].join(' ')}
    >
      <View className="mr-4">{icon}</View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900">{title}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{description}</Text>
      </View>
    </Pressable>
  );
}
