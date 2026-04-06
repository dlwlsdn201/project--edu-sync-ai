# System Architecture

## 1. Authentication Flow
- Kakao SDK를 통한 인가 코드 획득 -> Supabase Auth Exchange -> 세션 유지.

## 2. AI Logic Flow
1. 교사가 PDF/텍스트 업로드
2. Edge Functions (or Gemini API) 호출
3. JSON 형태로 퀴즈 데이터 생성
4. Supabase `quizzes` 테이블 저장 및 실시간 Push.

## 3. Data Integrity
- RLS(Row Level Security) 정책을 통해 본인이 속한 클래스의 데이터만 접근 가능하도록 설정.