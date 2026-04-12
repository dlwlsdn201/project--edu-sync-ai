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
    const timeout = setTimeout(() => {
      console.warn('[Auth] 10초 타임아웃 → isLoading 강제 해제');
      setIsLoading(false);
    }, 10000);

    // 웹 콜백 처리 중 onAuthStateChange 이벤트 간섭 차단 플래그
    let isHandlingWebCallback = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isHandlingWebCallback) {
        console.log('[Auth] 웹 콜백 처리 중 → 이벤트 무시:', event);
        return;
      }

      console.log('[Auth] onAuthStateChange:', event, '| userId:', session?.user?.id ?? 'none');

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        try {
          if (session) {
            console.log('[Auth] 프로필 조회 시작 (userId:', session.user.id, ')');
            const p = await getCurrentProfile(session.user.id);
            console.log('[Auth] 프로필 조회 결과:', p ? `role=${p.role}` : 'null');
            setProfile(p);
          } else {
            console.log('[Auth] session 없음 → 비인증 상태');
          }
        } catch (err) {
          console.error('[Auth] 프로필 조회 에러:', err);
        } finally {
          clearTimeout(timeout);
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] 로그아웃 완료');
        clearTimeout(timeout);
        setProfile(null);
        setIsLoading(false);
      }
    });

    // 웹: 카카오 OAuth 콜백 처리
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('[Auth] 웹 콜백 감지 → setSession 시작');
        isHandlingWebCallback = true;

        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(async ({ data, error }) => {
            if (error || !data.session) {
              console.error('[Auth] setSession 실패:', error?.message);
              return;
            }
            console.log('[Auth] setSession 성공 → 프로필 조회');
            window.history.replaceState({}, '', '/');
            const p = await getCurrentProfile(data.session.user.id);
            console.log('[Auth] 웹 콜백 프로필 결과:', p ? `role=${p.role}` : 'null');
            setProfile(p);
          })
          .catch((err) => {
            console.error('[Auth] setSession 예외:', err);
          })
          .finally(() => {
            isHandlingWebCallback = false;
            clearTimeout(timeout);
            setIsLoading(false);
          });

        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      }
    }

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    console.log('[Auth] 로그인 시작');
    await signInWithKakao();
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
