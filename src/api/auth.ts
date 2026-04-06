import { supabase } from './supabase';
import type { Profile } from '../types';

/**
 * 카카오 OAuth 로그인을 처리합니다.
 *
 * [구현 가이드 - Day 1-2]
 * 1. @react-native-kakao/core 또는 expo-auth-session 설치
 * 2. Kakao SDK로 Access Token 획득
 * 3. Supabase Edge Function(kakao-auth)을 통해 JWT로 교환
 */
export async function signInWithKakao(): Promise<Profile | null> {
  // TODO: Step 1 - Kakao SDK를 통한 Access Token 획득
  // const { accessToken } = await KakaoLogin.login();

  // TODO: Step 2 - Supabase Edge Function 호출로 JWT 교환
  // const { data, error } = await supabase.functions.invoke('kakao-auth', {
  //   body: { accessToken },
  // });
  // if (error) throw error;

  // TODO: Step 3 - Supabase 세션 설정
  // await supabase.auth.setSession(data.session);

  console.warn('[Auth] signInWithKakao: Kakao SDK 연동이 필요합니다.');
  return null;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[Auth] 프로필 조회 오류:', error.message);
    return null;
  }

  return data as Profile;
}
