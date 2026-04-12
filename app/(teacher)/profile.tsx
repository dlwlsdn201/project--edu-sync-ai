import React, { useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/common/Button';
import { supabase } from '../../src/api/supabase';

export default function TeacherProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [isChangingRole, setIsChangingRole] = useState(false);

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

  const handleChangeRole = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('역할을 변경하시겠습니까? 역할 선택 화면으로 이동합니다.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert('역할 변경', '역할 선택 화면으로 이동하시겠습니까?', [
            { text: '취소', style: 'cancel', onPress: () => resolve(false) },
            { text: '변경', onPress: () => resolve(true) },
          ]);
        });

    if (!confirmed) return;

    setIsChangingRole(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: null })
        .eq('id', profile!.id);

      if (error) throw error;
      await refreshProfile();

      router.replace('/(auth)/role-select');
    } catch (err) {
      const raw = err instanceof Error ? err.message : '오류가 발생했습니다.';
      // 웹에서는 Alert 가 눈에 띄지 않는 경우가 있어 window.alert 사용
      const isNullConstraint =
        /null value|not-null|23502|violates.*constraint/i.test(raw);
      const msg = isNullConstraint
        ? `${raw}\n\n[해결] Supabase → SQL Editor 에서 supabase/migrations/003_ensure_profiles_role_nullable.sql 을 실행해 주세요.`
        : raw;
      if (Platform.OS === 'web') {
        window.alert(`오류\n\n${msg}`);
      } else {
        Alert.alert('오류', msg);
      }
    } finally {
      setIsChangingRole(false);
    }
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

      <View className="gap-3">
        <Button label="역할 변경" variant="outline" onPress={handleChangeRole} isLoading={isChangingRole} />
        <Button label="로그아웃" onPress={handleSignOut} />
      </View>
    </View>
  );
}
