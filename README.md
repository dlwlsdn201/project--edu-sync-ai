# EduSync AI

> AI 기반 퀴즈 생성 및 실시간 학습 분석 플랫폼

교사가 수업 자료를 입력하면 AI가 자동으로 퀴즈를 생성하고, 학생의 응답을 실시간으로 분석해 취약 개념을 파악할 수 있는 모바일·웹 교육 앱입니다.

---

## 주요 기능

### 교사
- **AI 퀴즈 생성** — 수업 자료 텍스트 입력 → Gemini 2.0 Flash가 4지선다 5문제 자동 생성
- **입장 코드** — 수업별 6자리 코드를 학생에게 공유
- **실시간 대시보드** — 학생 응시 현황·정답률을 Supabase Realtime으로 즉시 반영
- **개념 분석** — 취약/강점 개념 태그 자동 집계

### 학생
- **수업 참여** — 입장 코드 입력으로 간편 참여
- **AI 힌트** — 오답 시 Gemini가 소크라테스식 힌트 제공
- **학습 리포트** — 개념별 정답률 시각화 + 응시 이력

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Expo SDK 54 + Expo Router v6 |
| UI | React Native + NativeWind v4 (Tailwind CSS) |
| 백엔드 | Supabase (Auth · DB · Realtime · Edge Functions) |
| 상태 관리 | TanStack Query v5 + Context API |
| AI | Google Gemini 2.0 Flash API |
| 인증 | 카카오 OAuth (Supabase Edge Function 경유) |
| 배포 | EAS Build (모바일) · Vercel + GitHub Actions (웹) |

---

## 시작하기

### 사전 준비

- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase](https://supabase.com) 프로젝트
- [카카오 개발자 콘솔](https://developers.kakao.com) 앱 등록
- [Google AI Studio](https://aistudio.google.com) Gemini API 키

### 설치

```bash
git clone https://github.com/your-username/project--edu-sync-ai.git
cd project--edu-sync-ai
npm install
```

### 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 값을 입력합니다:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=카카오_앱_키
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
```

### Supabase 설정

**1. DB 마이그레이션 실행** (Supabase Dashboard → SQL Editor)

```bash
# 순서대로 실행
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_role_nullable.sql
```

**2. Edge Function 배포**

```bash
npm install -g supabase
supabase login
supabase functions deploy kakao-auth --project-ref {프로젝트_ref}
```

Edge Function Secrets 추가 (Dashboard → Edge Functions → kakao-auth → Secrets):

| Key | Value |
|-----|-------|
| `KAKAO_REST_API_KEY` | 카카오 REST API 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 |

**3. 카카오 Redirect URI 등록** (카카오 개발자 콘솔 → 내 앱 → 카카오 로그인)

```
https://{supabase-project-ref}.supabase.co/functions/v1/kakao-auth
```

### 실행

```bash
# 개발 서버 시작
npm start

# 웹 브라우저
npm run web

# iOS (Xcode 필요)
npx expo run:ios

# Android (Android Studio 필요)
npx expo run:android
```

---

## 프로젝트 구조

```
├── app/                        # Expo Router 페이지
│   ├── (auth)/                 # 인증 플로우
│   │   └── role-select.tsx     # 역할 선택 화면
│   ├── (teacher)/              # 교사 전용
│   │   ├── quiz-create.tsx     # AI 퀴즈 생성
│   │   ├── quiz-library.tsx    # 퀴즈 목록
│   │   └── dashboard.tsx       # 실시간 대시보드
│   ├── (student)/              # 학생 전용
│   │   ├── quiz-list.tsx       # 퀴즈 목록
│   │   ├── join.tsx            # 수업 참여
│   │   ├── quiz.tsx            # 퀴즈 응시
│   │   └── report.tsx          # 학습 리포트
│   └── index.tsx               # 진입점 (역할별 라우팅)
│
├── src/
│   ├── api/
│   │   ├── ai.ts               # Gemini API (퀴즈 생성·힌트)
│   │   ├── quiz.ts             # 퀴즈 CRUD
│   │   ├── logs.ts             # 대시보드·리포트 집계
│   │   ├── auth.ts             # 카카오 로그인
│   │   └── supabase.ts         # Supabase 클라이언트
│   ├── hooks/
│   │   ├── useQuizGeneration.ts
│   │   ├── useQuiz.ts
│   │   ├── useRealtimeLogs.ts
│   │   └── useReport.ts
│   ├── store/
│   │   └── AuthContext.tsx      # 전역 인증 상태
│   ├── components/common/
│   │   ├── Button.tsx
│   │   └── LoadingSpinner.tsx
│   └── types/index.ts
│
├── supabase/
│   ├── migrations/             # DB 스키마
│   └── functions/kakao-auth/   # 카카오 인증 Edge Function
│
├── docs/
│   └── e2e-test-checklist.md   # 수동 E2E 테스트 체크리스트
│
├── eas.json                    # EAS Build 설정
└── vercel.json                 # Vercel 웹 배포 설정
```

---

## 배포

### 모바일 (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build:configure

# 테스트 빌드 (APK + IPA)
npm run build:preview

# 스토어 제출용 빌드
npm run build:prod
```

### 웹 (Vercel)

`main` 브랜치에 push하면 GitHub Actions가 자동으로 Vercel에 배포합니다.

필요한 GitHub Secrets:

```
VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY, EXPO_PUBLIC_GEMINI_API_KEY
```

수동 배포:

```bash
npm run build:web   # dist/ 폴더 생성
vercel --prod
```

---

## 데이터베이스 스키마

```
profiles          — 사용자 (kakao_id, role, display_name)
classrooms        — 수업 (teacher_id, name, entry_code)
classroom_members — 수업-학생 참여 (N:M)
quiz_sets         — 퀴즈 세트 (classroom_id, title, questions JSONB)
student_logs      — 응답 기록 (student_id, question_id, is_correct, ai_feedback)
```

RLS(Row Level Security) 정책으로 교사는 본인 수업만, 학생은 참여한 수업의 데이터만 접근합니다.

---

## 라이선스

MIT
