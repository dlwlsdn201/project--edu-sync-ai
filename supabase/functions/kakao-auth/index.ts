import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const KAKAO_REST_API_KEY = Deno.env.get('KAKAO_REST_API_KEY')!;
const KAKAO_CLIENT_SECRET_KEY = Deno.env.get('KAKAO_CLIENT_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/kakao-auth`;
const APP_DEEP_LINK = 'edusync://auth/callback';

function resolveCallbackUrl(state: string | null): string {
  // state가 HTTP(S) URL이면 웹 콜백, 아니면 네이티브 딥링크
  if (state && (state.startsWith('https://') || state.startsWith('http://'))) return state;
  return APP_DEEP_LINK;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── GET: 카카오가 인증코드와 함께 리다이렉트 ────────────────
  // 카카오 콘솔의 redirect_uri가 이 Edge Function을 가리킵니다.
  if (req.method === 'GET') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');
    const callbackUrl = resolveCallbackUrl(state);

    if (error || !code) {
      return Response.redirect(`${callbackUrl}?error=${error ?? 'no_code'}`);
    }

    try {
      const { accessToken, refreshToken } = await exchangeCodeForSession(
        code,
        FUNCTION_URL,
      );

      const redirectTarget =
        `${callbackUrl}` +
        `?access_token=${encodeURIComponent(accessToken)}` +
        `&refresh_token=${encodeURIComponent(refreshToken)}`;

      return Response.redirect(redirectTarget, 302);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      return Response.redirect(`${callbackUrl}?error=${encodeURIComponent(message)}`);
    }
  }

  // ── POST: 레거시 / 직접 호출 용도 유지 ──────────────────────
  if (req.method === 'POST') {
    try {
      const { code } = await req.json() as { code: string };
      const { accessToken, refreshToken } = await exchangeCodeForSession(
        code,
        FUNCTION_URL,
      );

      return new Response(
        JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      return new Response(
        JSON.stringify({ error: message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      );
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});

// ── 공통 로직: 인증코드 → Supabase 세션 발급 ──────────────────

async function exchangeCodeForSession(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  // Step 1: 카카오 액세스토큰 교환
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      client_secret: KAKAO_CLIENT_SECRET_KEY,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`카카오 토큰 교환 실패: ${await tokenRes.text()}`);
  }

  const { access_token: kakaoAccessToken } = await tokenRes.json() as {
    access_token: string;
  };

  // Step 2: 카카오 유저 정보 조회
  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${kakaoAccessToken}` },
  });

  if (!userRes.ok) throw new Error('카카오 유저 정보 조회 실패');

  const kakaoUser = await userRes.json() as {
    id: number;
    kakao_account?: {
      profile?: { nickname?: string; profile_image_url?: string };
    };
  };

  const kakaoId = String(kakaoUser.id);
  const displayName = kakaoUser.kakao_account?.profile?.nickname ?? '사용자';
  const avatarUrl = kakaoUser.kakao_account?.profile?.profile_image_url ?? null;

  // Step 3: Supabase 유저 생성 또는 조회
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('kakao_id', kakaoId)
    .single();

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    const email = `kakao_${kakaoId}@edusync.ai`;
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { kakao_id: kakaoId, display_name: displayName },
    });
    if (error) throw new Error(`유저 생성 실패: ${error.message}`);

    userId = newUser.user.id;

    await admin.from('profiles').insert({
      id: userId,
      kakao_id: kakaoId,
      display_name: displayName,
      avatar_url: avatarUrl,
    });
  }

  // Step 4: Supabase 세션 발급
  const email = `kakao_${kakaoId}@edusync.ai`;

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (linkError) throw new Error(`매직링크 생성 실패: ${linkError.message}`);

  const { data: sessionData, error: sessionErr } = await admin.auth.verifyOtp({
    email,
    token: linkData.properties.hashed_token,
    type: 'magiclink',
  });
  if (sessionErr) throw new Error(`세션 발급 실패: ${sessionErr.message}`);

  return {
    accessToken: sessionData.session!.access_token,
    refreshToken: sessionData.session!.refresh_token,
  };
}
