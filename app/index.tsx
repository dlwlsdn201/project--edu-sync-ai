import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { LoadingSpinner } from '../src/components/common/LoadingSpinner';
import { LoginScreen } from '../src/screens/auth/LoginScreen';

export default function Index() {
  const { isLoading, isAuthenticated, profile } = useAuth();

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <LoginScreen />;

  // 역할에 따라 대시보드로 이동
  if (profile?.role === 'teacher') {
    return <Redirect href="/(teacher)/dashboard" />;
  }

  return <Redirect href="/(student)/quiz" />;
}
