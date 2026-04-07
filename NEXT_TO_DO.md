# EduSync AI — 다음 작업 목록

Day 3-4 구현 완료 후 남은 작업입니다.

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
- [ ] `app/(teacher)/_layout.tsx`에 Dashboard 탭 추가

### AI 피드백 고도화

- [ ] Supabase Edge Function `ai-feedback` 생성
  - 오답 데이터 + 문제 내용 → Gemini에 소크라테스식 힌트 생성 요청
  - 생성된 피드백을 `student_logs.ai_feedback`에 업데이트
  - 현재는 클라이언트에서 직접 호출 → Edge Function으로 이관하면 보안 강화

### 학생용 — 학습 리포트

- [ ] `app/(student)/report.tsx` — 본인 취약점 분석 화면
- [ ] `src/hooks/useReport.ts` — `student_logs` 집계 쿼리
- [ ] `app/(student)/_layout.tsx`에 Report 탭 추가

---

## 📋 Day 7 작업

- [ ] 전체 플로우 E2E 테스트
  - 카카오 로그인 → 역할 선택 → 교사: 퀴즈 생성 → 학생: 입장 코드 참여 → 퀴즈 응시 → 결과 확인
- [ ] EAS Build 설정 (`eas.json`) 및 프로덕션 빌드
- [ ] Vercel 웹 프리뷰 배포 (웹 버전 확인)
- [ ] AI 리포트 작성

---

## 📁 Day 3-4에서 완성된 파일

| 파일 | 역할 |
|------|------|
| `app/(auth)/role-select.tsx` | 역할 선택 화면 |
| `app/(teacher)/quiz-create.tsx` | AI 퀴즈 생성 |
| `app/(teacher)/quiz-library.tsx` | 퀴즈 목록 |
| `app/(student)/join.tsx` | 수업 참여 (입장 코드) |
| `app/(student)/quiz-list.tsx` | 퀴즈 목록 |
| `app/(student)/quiz.tsx` | 퀴즈 응시 + AI 힌트 |
| `src/api/ai.ts` | Gemini 2.0 Flash API |
| `src/api/quiz.ts` | Supabase 퀴즈 CRUD |
| `src/hooks/useQuizGeneration.ts` | 퀴즈 생성 훅 |
| `src/hooks/useQuiz.ts` | 퀴즈 조회 훅 |
