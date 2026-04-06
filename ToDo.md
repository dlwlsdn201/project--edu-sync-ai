# EduSync AI — 작업 ToDo

> 7일 완성 플랜 기준. 완료된 항목은 `[x]`, 미완료는 `[ ]`로 표시합니다.

---

## ✅ 완료 (Day 1-2)

- [x] Expo SDK 54 + Expo Router v6 프로젝트 초기화
- [x] 필수 라이브러리 설치 (Supabase, NativeWind, TanStack Query, lucide-react-native 등)
- [x] `src/` 디렉토리 구조 세팅 (api, components, hooks, screens, store, types, utils)
- [x] NativeWind v4 + Tailwind v3 설정 (tailwind.config.js, metro.config.js, babel.config.js)
- [x] Supabase client 설정 (`src/api/supabase.ts`)
- [x] AuthContext 설정 (`src/store/AuthContext.tsx`)
- [x] 공통 컴포넌트 생성 (Button, LoadingSpinner)
- [x] Supabase DB 스키마 생성 (`supabase/migrations/001_initial_schema.sql` — SQL Editor 실행 완료)
- [x] 카카오 로그인 구현 (`src/api/auth.ts` — Edge Function 방식)
- [x] Supabase Edge Function 작성 (`supabase/functions/kakao-auth/index.ts`)

---

## 🔧 Day 2 미완료 — 내일 먼저 처리

### A. 카카오 개발자 콘솔 — Redirect URI 등록

카카오 REST API는 HTTPS URL만 허용합니다. 아래 URL을 등록하세요:

```
https://{supabase-project-ref}.supabase.co/functions/v1/kakao-auth
```

> Kakao Developers → 내 앱 → 카카오 로그인 → Redirect URI

---

### B. .env 키 추가 (새 맥북에서 설정)

`.env.example`을 복사해 `.env` 생성 후 아래 값을 채워주세요:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_KAKAO_REST_API_KEY=카카오_REST_API_키   # 앱 키 → REST API 키
```

---

### C. Supabase Edge Function 배포

```bash
npm install -g supabase       # CLI 설치 (없는 경우)
supabase login
supabase functions deploy kakao-auth --project-ref {프로젝트_ref}
```

배포 후 **Supabase Dashboard → Edge Functions → kakao-auth → Secrets**에 추가:

| Key | Value |
|-----|-------|
| `KAKAO_REST_API_KEY` | 카카오 REST API 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |

---

### D. 카카오 로그인 테스트 (개발 빌드 필요)

Expo Go는 `edusync://` 커스텀 스킴을 지원하지 않으므로, 네이티브 개발 빌드로 테스트합니다:

```bash
# iOS (Xcode 필요)
npx expo run:ios

# Android (Android Studio 필요)
npx expo run:android
```

로그인 성공 시 확인 항목:
- Supabase Dashboard → Authentication → Users에 신규 유저 생성
- Supabase Dashboard → Table Editor → profiles에 프로필 레코드 생성

---

## 📋 Day 3-4 작업

### 역할 선택 화면 (신규 가입 시)

- [ ] `app/(auth)/role-select.tsx` 생성
  - 신규 유저(카카오 로그인 직후 `role === 'student'` 기본값)에게 teacher/student 선택 UI
  - 선택 후 `profiles` 테이블 `role` 업데이트
  - `app/index.tsx`에서 신규 유저 감지 → role-select로 이동 로직 추가

### 교사용 — AI 퀴즈 생성

- [ ] `app/(teacher)/` 디렉토리 + 탭 레이아웃 생성
- [ ] `app/(teacher)/quiz-create.tsx` — 수업 자료 텍스트 입력 UI
- [ ] `src/api/ai.ts` — GPT-4o 또는 Claude API 호출 (퀴즈 JSON 생성)
- [ ] `src/hooks/useQuizGeneration.ts` — `useMutation` 기반 퀴즈 생성 훅
- [ ] 생성된 퀴즈를 `quiz_sets` 테이블에 저장

### 학생용 — 퀴즈 응시 UI

- [ ] `app/(student)/` 디렉토리 + 탭 레이아웃 생성
- [ ] `app/(student)/quiz.tsx` — 퀴즈 문제 카드 + 선택지 UI
- [ ] `src/hooks/useQuiz.ts` — `useQuery`로 퀴즈 데이터 조회
- [ ] 응답 제출 시 `student_logs` 테이블에 기록
- [ ] 오답 시 AI 튜터 힌트 표시 (Edge Function 또는 직접 AI API 호출)

---

## 📋 Day 5-6 작업

### 교사용 — 실시간 대시보드

- [ ] `app/(teacher)/dashboard.tsx` — 학생별 정답률 시각화
- [ ] `src/hooks/useRealtimeLogs.ts` — Supabase Realtime 구독
  ```typescript
  supabase
    .channel('student_logs')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_logs' }, handler)
    .subscribe()
  ```
- [ ] 취약 개념 태그(`concept_tag`) 기반 집계 차트

### AI 피드백 고도화

- [ ] Supabase Edge Function `ai-feedback` 생성
  - 오답 데이터 + 문제 내용 → Claude/GPT에 소크라테스식 힌트 생성 요청
  - 생성된 피드백을 `student_logs.ai_feedback`에 업데이트

### 학생용 — 학습 리포트

- [ ] `app/(student)/report.tsx` — 본인 취약점 분석 화면
- [ ] `src/hooks/useReport.ts` — student_logs 집계 쿼리

---

## 📋 Day 7 작업

- [ ] 전체 플로우 E2E 테스트 (카카오 로그인 → 역할 선택 → 퀴즈 → 결과 → 리포트)
- [ ] EAS Build 설정 (`eas.json`) 및 프로덕션 빌드
- [ ] Vercel 웹 프리뷰 배포 (웹 버전 확인)
- [ ] AI 리포트 작성

---

## 📁 주요 파일 위치 참고

| 파일 | 역할 |
|------|------|
| `src/api/supabase.ts` | Supabase client |
| `src/api/auth.ts` | 카카오 로그인 전체 흐름 |
| `src/store/AuthContext.tsx` | 전역 Auth 상태 |
| `src/hooks/useAuth.ts` | Auth 훅 |
| `supabase/functions/kakao-auth/index.ts` | Edge Function (토큰 교환 + 유저 upsert) |
| `supabase/migrations/001_initial_schema.sql` | DB 스키마 (이미 실행 완료) |
| `app/_layout.tsx` | 루트 레이아웃 (QueryClient + AuthProvider) |
| `app/index.tsx` | 진입점 (인증 상태에 따라 라우팅) |
| `.env.example` | 환경변수 템플릿 |
