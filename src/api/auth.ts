import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import type { Profile } from '../types';

WebBrowser.maybeCompleteAuthSession();

const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY!;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

export async function signInWithKakao(): Promise<Profile | null> {
  const redirectUri = `${SUPABASE_URL}/functions/v1/kakao-auth`;

  // 웹: 현재 페이지를 카카오 로그인으로 리다이렉트 (팝업 불필요)
  // state 파라미터로 콜백 URL을 Edge Function에 전달
  if (Platform.OS === 'web') {
    const webCallbackUrl = window.location.origin;
    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${KAKAO_REST_API_KEY}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(webCallbackUrl)}`;
    window.location.href = kakaoAuthUrl;
    return null;
  }

  // 네이티브: Edge Function → edusync:// 딥링크
  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${KAKAO_REST_API_KEY}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code`;

  const result = await WebBrowser.openAuthSessionAsync(
    kakaoAuthUrl,
    'edusync://',
  );

  if (result.type !== 'success' || !result.url) {
    return null;
  }

  const tokens = extractTokensFromDeepLink(result.url);
  if (!tokens) {
    console.error('[Auth] 딥링크에서 토큰 추출 실패:', result.url);
    return null;
  }

  const { error: sessionError } = await supabase.auth.setSession(tokens);
  if (sessionError) {
    console.error('[Auth] 세션 설정 오류:', sessionError.message);
    return null;
  }

  return getCurrentProfile();
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

function extractTokensFromDeepLink(
  url: string,
): { access_token: string; refresh_token: string } | null {
  try {
    const parsed = new URL(url);
    const accessToken = parsed.searchParams.get('access_token');
    const refreshToken = parsed.searchParams.get('refresh_token');
    if (!accessToken || !refreshToken) return null;
    return { access_token: accessToken, refresh_token: refreshToken };
  } catch {
    return null;
  }
}
