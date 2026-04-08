import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../api/supabase';
import { getCurrentProfile, signInWithKakao, signOut } from '../api/auth';
import type { Profile } from '../types';

interface AuthContextValue {
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const p = await getCurrentProfile();
        setProfile(p);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    // 웹: 카카오 OAuth 콜백 시 URL에 포함된 토큰 처리
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        // setSession이 onAuthStateChange SIGNED_IN을 트리거 → 프로필 로드
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(() => {
            window.history.replaceState({}, '', '/');
          });
        return () => subscription.unsubscribe();
      }
    }

    getCurrentProfile().then((p) => {
      setProfile(p);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const p = await signInWithKakao();
    setProfile(p);
  };

  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
  };

  const handleRefreshProfile = async () => {
    const p = await getCurrentProfile();
    setProfile(p);
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isAuthenticated: profile !== null,
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshProfile: handleRefreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}
