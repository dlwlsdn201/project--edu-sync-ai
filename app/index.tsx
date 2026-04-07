import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { LoadingSpinner } from '../src/components/common/LoadingSpinner';
import { LoginScreen } from '../src/screens/auth/LoginScreen';

export default function Index() {
  const { isLoading, isAuthenticated, profile } = useAuth();

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <LoginScreen />;

  // 역할 미설정 신규 유저 → 역할 선택 화면
  if (profile?.role === null || profile?.role === undefined) {
    return <Redirect href="/(auth)/role-select" />;
  }

  if (profile.role === 'teacher') {
    return <Redirect href="/(teacher)/quiz-create" />;
  }

  return <Redirect href="/(student)/quiz-list" />;
}
