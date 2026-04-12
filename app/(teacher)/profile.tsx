import React from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/common/Button';

export default function TeacherProfileScreen() {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('로그아웃 하시겠습니까?')) return;
    } else {
      await new Promise<void>((resolve) => {
        Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
          { text: '취소', style: 'cancel' },
          { text: '로그아웃', style: 'destructive', onPress: () => resolve() },
        ]);
      });
    }
    await signOut();
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-gray-50 px-5 pt-16">
      <Text className="text-2xl font-bold text-gray-900 mb-8">프로필</Text>

      <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
        <Text className="text-xs text-gray-400 mb-1">이름</Text>
        <Text className="text-base font-semibold text-gray-900">{profile?.display_name ?? '—'}</Text>
      </View>

      <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-8">
        <Text className="text-xs text-gray-400 mb-1">역할</Text>
        <Text className="text-base font-semibold text-gray-900">교사</Text>
      </View>

      <Button label="로그아웃" onPress={handleSignOut} />
    </View>
  );
}
