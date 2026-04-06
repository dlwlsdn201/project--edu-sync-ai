import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import type { Profile } from '../types';

WebBrowser.maybeCompleteAuthSession();

const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY!;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

/**
 * 카카오 OAuth 로그인 (HTTPS redirect → Edge Function → 앱 deep link)
 *
 * 흐름:
 * 1. redirect_uri = Edge Function HTTPS URL (카카오 콘솔에 등록된 URL)
 * 2. 브라우저 열기 → 카카오 로그인
 * 3. 카카오가 Edge Function으로 인증코드 전송 (GET ?code=xxx)
 * 4. Edge Function: 토큰 교환 → 유저 upsert → edusync://auth/callback?tokens 로 리다이렉트
 * 5. openAuthSessionAsync가 edusync:// 감지 → 브라우저 닫기 → 토큰 추출 → 세션 설정
 *
 * ⚠️  테스트 환경:
 *     Expo Go는 edusync:// 커스텀 스킴을 지원하지 않습니다.
 *     카카오 로그인 테스트는 개발 빌드를 사용하세요:
 *       npx expo run:ios   또는   npx expo run:android
 */
export async function signInWithKakao(): Promise<Profile | null> {
  // Edge Function URL을 redirect_uri로 사용 (카카오 콘솔에 등록한 HTTPS URL)
  const redirectUri = `${SUPABASE_URL}/functions/v1/kakao-auth`;

  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${KAKAO_REST_API_KEY}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code`;

  // edusync:// 가 감지되면 브라우저를 자동으로 닫고 result.url 반환
  const result = await WebBrowser.openAuthSessionAsync(
    kakaoAuthUrl,
    'edusync://',
  );

  if (result.type !== 'success' || !result.url) {
    return null;
  }

  // Edge Function이 반환한 edusync://auth/callback?access_token=...&refresh_token=...
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
