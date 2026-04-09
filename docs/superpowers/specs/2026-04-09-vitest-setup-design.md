# Vitest 테스트 환경 설계

**날짜:** 2026-04-09  
**상태:** 승인됨

---

## 개요

EduSync AI 프로젝트에 Vitest 기반 테스트 환경을 구축한다.  
대상 레이어: API 함수, React hooks, React Native 컴포넌트, 유틸리티.  
단일 테스트 런너(Vitest + jsdom)로 모든 레이어를 통합 관리한다.

---

## 접근 방식

**Vitest 단일 런너 (jsdom 환경)**

- `react-native` 모듈을 `react-native-web`으로 alias 처리해 jsdom에서 렌더링 가능하게 함
- Supabase 클라이언트는 `vi.mock`으로 교체
- TanStack Query hooks는 `renderHook` + `QueryClientProvider` 래퍼로 테스트
- expo 관련 모듈은 `vitest.setup.ts`에서 전역 모킹

---

## 파일 구조

테스트 파일은 소스 파일과 동일한 디렉토리에 위치하며 `*.test.ts(x)` 형식을 사용한다.

```
vitest.config.ts
vitest.setup.ts
src/
  api/
    quiz.ts / quiz.test.ts
    auth.ts / auth.test.ts
    ai.ts  / ai.test.ts
  hooks/
    useQuiz.ts / useQuiz.test.ts
    useAuth.ts / useAuth.test.ts
    useReport.ts / useReport.test.ts
    useQuizGeneration.ts / useQuizGeneration.test.ts
    useRealtimeLogs.ts / useRealtimeLogs.test.ts
  components/
    common/
      Button.tsx / Button.test.tsx
      LoadingSpinner.tsx / LoadingSpinner.test.tsx
  utils/
    index.ts / index.test.ts
```

---

## 설정 파일 상세

### `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-native': 'react-native-web',
    },
  },
})
```

### `vitest.setup.ts`

```ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))
vi.mock('expo-constants', () => ({
  default: { expoConfig: { extra: {} } },
}))

process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
```

### `package.json` scripts 추가

```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest run --coverage"
```

---

## 레이어별 테스트 전략

### API 레이어

- `vi.mock('../api/supabase')`로 Supabase 클라이언트 교체
- 성공 경로와 에러 경로 모두 검증
- 주요 케이스:
  - `generateEntryCode()` → 6자리 대문자 영숫자 반환
  - `getOrCreateDefaultClassroom()` → 기존 수업 반환 / 없으면 생성
  - `joinClassroom()` → 잘못된 코드 입력 시 에러 throw

### Hooks 레이어

- `renderHook` + `QueryClientProvider` 래퍼 사용
- API 함수는 `vi.mock`으로 교체
- 주요 케이스:
  - `studentId` 없으면 `queryFn` 미호출 (`enabled: false`)
  - 데이터 로드 성공 시 `data` 반환
  - API 에러 시 `error` 상태 반환

### 컴포넌트 레이어

- `@testing-library/react`로 렌더링
- `react-native-web` alias로 RN 컴포넌트 호환
- 주요 케이스:
  - 텍스트 렌더링 확인
  - `onPress` 콜백 호출 확인
  - `disabled` 상태에서 클릭 무반응

### 유틸 레이어

- 모킹 없이 순수 함수 직접 호출 및 반환값 검증

---

## 설치 의존성

```
devDependencies:
  vitest
  @vitest/ui
  @vitest/coverage-v8
  jsdom
  @testing-library/react
  @testing-library/user-event
  @testing-library/jest-dom
```
