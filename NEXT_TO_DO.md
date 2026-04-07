# EduSync AI — 다음 작업 목록

---

## 🔧 즉시 처리 필요 (환경 설정)

### 1. Supabase DB 마이그레이션 실행

Supabase Dashboard → SQL Editor에서 실행:

```sql
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;
```

### 2. Google Gemini API 키 발급

[Google AI Studio](https://aistudio.google.com)에서 무료 API 키 발급 후 `.env`에 추가:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Supabase Edge Function 재배포

`kakao-auth` Edge Function이 수정됐습니다 (신규 유저 role 초기값 제거).

```bash
supabase functions deploy kakao-auth --project-ref {프로젝트_ref}
```

### 4. Vercel & GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions에 추가:

| Secret | 값 |
|--------|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` | 카카오 앱 키 |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Gemini API 키 |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel env ls` 또는 Vercel 대시보드 |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 설정에서 확인 |

### 5. EAS 프로젝트 연결

```bash
npm install -g eas-cli
eas login
eas build:configure   # app.json에 EAS 프로젝트 ID 자동 추가
```

---

## ✅ 완료된 작업

### Day 1-2
- [x] Expo + Supabase + NativeWind 초기 세팅
- [x] 카카오 로그인 + Edge Function
- [x] DB 스키마 (profiles, classrooms, quiz_sets, student_logs)

### Day 3-4
- [x] 역할 선택 화면 (`app/(auth)/role-select.tsx`)
- [x] 교사: AI 퀴즈 생성 + 목록 (`app/(teacher)/`)
- [x] 학생: 수업 참여 + 퀴즈 응시 + AI 힌트 (`app/(student)/`)
- [x] Gemini 2.0 Flash API 연동 (`src/api/ai.ts`)

### Day 5-6
- [x] 교사: 실시간 대시보드 (`app/(teacher)/dashboard.tsx`)
- [x] 학생: 학습 리포트 (`app/(student)/report.tsx`)
- [x] Supabase Realtime 구독 (`src/hooks/useRealtimeLogs.ts`)

### Day 7
- [x] EAS Build 설정 (`eas.json`) — preview + production
- [x] Vercel 웹 배포 설정 (`vercel.json`)
- [x] GitHub Actions CI/CD (`.github/workflows/deploy-vercel.yml`)
- [x] E2E 테스트 체크리스트 (`docs/e2e-test-checklist.md`)
- [ ] **실제 E2E 테스트 실행** → `docs/e2e-test-checklist.md` 참고
- [ ] **EAS 빌드 실행** → `npm run build:preview`
- [ ] **AI 리포트 작성** (본인 작성)

---

## 📁 전체 주요 파일

| 파일 | 역할 |
|------|------|
| `src/api/supabase.ts` | Supabase 클라이언트 |
| `src/api/auth.ts` | 카카오 로그인 |
| `src/api/ai.ts` | Gemini 퀴즈 생성 + 힌트 |
| `src/api/quiz.ts` | 퀴즈 CRUD |
| `src/api/logs.ts` | 대시보드·리포트 집계 |
| `src/store/AuthContext.tsx` | 전역 인증 상태 |
| `app/(auth)/role-select.tsx` | 역할 선택 |
| `app/(teacher)/quiz-create.tsx` | AI 퀴즈 생성 |
| `app/(teacher)/dashboard.tsx` | 실시간 대시보드 |
| `app/(student)/quiz.tsx` | 퀴즈 응시 |
| `app/(student)/report.tsx` | 학습 리포트 |
| `supabase/functions/kakao-auth/` | 카카오 인증 Edge Function |
| `eas.json` | EAS Build 설정 |
| `vercel.json` | Vercel 웹 배포 설정 |
| `.github/workflows/deploy-vercel.yml` | CI/CD |
| `docs/e2e-test-checklist.md` | E2E 테스트 체크리스트 |
