# EduSync AI — 다음 작업 목록

---

## 🔧 내일 할 일 (Day 8)

### 1. 카카오 개발자 콘솔 설정 확인 (KOE101 해결)

카카오 로그인 버튼 클릭 시 KOE101 에러 발생 중. 아래 항목 순서대로 확인:

1. [카카오 Developers](https://developers.kakao.com) → 내 애플리케이션 → **카카오 로그인 활성화** ON 확인
2. **Redirect URI** 등록 확인:
   ```
   https://fkmfmdgcjpiihrkkeqghi.supabase.co/functions/v1/kakao-auth
   ```
3. **앱 키** → REST API 키가 `.env`의 `EXPO_PUBLIC_KAKAO_REST_API_KEY` 값과 일치하는지 확인
4. **플랫폼** → iOS(`com.edusync.ai`) / Android(`com.edusync.ai`) 등록 확인

> ⚠️ 카카오 로그인 테스트는 Expo Go 불가. 반드시 개발 빌드로 실행:
> ```bash
> npx expo run:ios
> ```

### 2. Vercel & GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions에 추가:

| Secret | 값 |
|--------|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_KAKAO_REST_API_KEY` | 카카오 REST API 키 |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Gemini API 키 |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel env ls` 또는 Vercel 대시보드 |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 설정에서 확인 |

### 3. EAS 프로젝트 연결

```bash
npm install -g eas-cli
eas login
eas build:configure   # app.json에 EAS 프로젝트 ID 자동 추가
```

### 4. E2E 테스트 실행

카카오 로그인 연동 완료 후 → `docs/e2e-test-checklist.md` 참고하여 전체 플로우 검증

### 5. EAS 빌드 실행

```bash
npm run build:preview
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
- [x] 로그인 버튼 UI 스타일 보완 (`Button.tsx` className override 버그 수정)
- [x] 카카오 로그인 후 무한 스피너 해결 (`AuthContext.tsx`)

### Day 8 (오늘)
- [x] `react-native-worklets` 누락으로 인한 Bundling 에러 수정
- [x] `Button` 컴포넌트 `className` prop이 내부 스타일을 덮어쓰는 버그 수정

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
