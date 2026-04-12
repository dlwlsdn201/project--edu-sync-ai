# EduSync AI — 다음 작업 목록

---

## 제출·시연

- **웹(Vercel) 데모 시연**: [docs/demo-guide.md](docs/demo-guide.md) — 사전 체크, 5~7분 스크립트, 트러블슈팅 요약.
- **화면별 사용법**: [docs/user-guide.md](docs/user-guide.md).
- **전체 수동 검증**: [docs/e2e-test-checklist.md](docs/e2e-test-checklist.md) (시연은 웹 우선, 네이티브는 개발 빌드).

---

## 배포·인프라 점검

### 1. 카카오 개발자 콘솔 설정 (KOE101 등)

로그인 오류 시 아래를 순서대로 확인합니다.

1. [카카오 Developers](https://developers.kakao.com) → 내 애플리케이션 → **카카오 로그인 활성화** ON 확인
2. **Redirect URI** 등록 확인:
   ```
   https://fkmfmdgcjpiihrkkeqghi.supabase.co/functions/v1/kakao-auth
   ```
3. **앱 키** → REST API 키가 `.env`의 `EXPO_PUBLIC_KAKAO_REST_API_KEY` 값과 일치하는지 확인
4. **플랫폼** → iOS(`com.edusync.ai`) / Android(`com.edusync.ai`) 등록 확인

> 네이티브 앱에서의 카카오 로그인 테스트는 Expo Go가 아닌 **개발 빌드**가 필요합니다:
> ```bash
> npx expo run:ios
> ```
> 웹 시연은 브라우저에서 진행하면 됩니다([데모 가이드](docs/demo-guide.md)).

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

카카오 로그인 연동 후 → [docs/e2e-test-checklist.md](docs/e2e-test-checklist.md) 참고

### 5. EAS 빌드 실행

```bash
npm run build:preview
```

---

## 완료된 작업 (요약)

- Expo + Supabase + NativeWind, 카카오 Edge Function, DB 스키마
- 역할 선택, 교사(퀴즈 생성·목록·대시보드), 학생(응시·리포트), Gemini 퀴즈·힌트
- **학생 UX**: 퀴즈 탭에 입장 코드·**내 퀴즈** 통합, 참여 성공 인라인 배너, 미참여 시 안내 카드, 오답 시 힌트 선택·**응시 완료** 시 목록 취소선·재응시 차단
- Supabase Realtime, EAS·Vercel·GitHub Actions, E2E·데모·사용자 가이드
- Gemini 429/503 대응(폴백 모델·백오프) 등 `src/api/ai.ts` 안정화

---

## 주요 파일

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
| `app/(student)/quiz-list.tsx` | 입장 코드 + 퀴즈 목록(완료 표시) |
| `app/(student)/quiz.tsx` | 퀴즈 응시·완료 시 진입 차단 |
| `app/(student)/report.tsx` | 학습 리포트 |
| `supabase/functions/kakao-auth/` | 카카오 인증 Edge Function |
| `eas.json` | EAS Build 설정 |
| `vercel.json` | Vercel 웹 배포 설정 |
| `.github/workflows/deploy-vercel.yml` | CI/CD |
| `docs/demo-guide.md` | 데모 시연 가이드 |
| `docs/e2e-test-checklist.md` | E2E 테스트 체크리스트 |
| `docs/sample-quiz-materials.md` | 퀴즈 생성 테스트용 샘플 지문 |
| `docs/기획안.md` | 기획 비전·MVP 부록 |
