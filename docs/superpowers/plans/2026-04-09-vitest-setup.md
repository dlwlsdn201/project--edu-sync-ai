# Vitest 테스트 환경 구축 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vitest + jsdom 기반의 테스트 환경을 구축하고, API/hooks/컴포넌트 레이어 전체에 테스트 코드를 작성한다.

**Architecture:** 단일 Vitest 런너(jsdom 환경)를 사용하며, `react-native`를 `react-native-web`으로 alias해 jsdom에서 RN 컴포넌트를 렌더링한다. Supabase 클라이언트는 `vi.mock`으로 교체하고, TanStack Query hooks는 `renderHook` + `QueryClientProvider` 래퍼로 테스트한다. 테스트 파일은 소스 파일과 동일한 디렉토리에 `*.test.ts(x)` 이름으로 위치한다.

**Tech Stack:** Vitest, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, react-native-web (alias), @tanstack/react-query

---

## Task 1: 패키지 설치 및 설정 파일 생성

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: devDependencies 설치**

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Expected: `package.json`의 `devDependencies`에 위 패키지들이 추가됨.

- [ ] **Step 2: `package.json` scripts 추가**

`package.json`의 `"scripts"` 블록에 아래 항목을 추가한다:

```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest run --coverage"
```

최종 scripts 블록:
```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "build:web": "expo export --platform web",
  "build:preview": "eas build --profile preview --platform all",
  "build:prod": "eas build --profile production --platform all",
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage"
}
```

- [ ] **Step 3: `vitest.config.ts` 생성**

프로젝트 루트에 생성:

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

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
});
```

- [ ] **Step 4: `vitest.setup.ts` 생성**

프로젝트 루트에 생성:

```ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// expo 관련 모듈 모킹
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('expo-constants', () => ({
  default: { expoConfig: { extra: {} } },
}));

vi.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: vi.fn(),
  openAuthSessionAsync: vi.fn(),
}));

vi.mock('react-native-url-polyfill/auto', () => ({}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// 테스트용 환경변수
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = 'test-kakao-key';
```

- [ ] **Step 5: 설정 동작 확인**

```bash
npm test -- --run
```

Expected: `No test files found` 또는 `0 tests passed` — 에러 없이 종료.

- [ ] **Step 6: 커밋**

```bash
git add vitest.config.ts vitest.setup.ts package.json package-lock.json
git commit -m "chore: Vitest 테스트 환경 설정 추가"
```

---

## Task 2: Quiz API 테스트 (`src/api/quiz.test.ts`)

**Files:**
- Create: `src/api/quiz.test.ts`

Supabase 체인 빌더를 공통 mock 객체로 구성하고, 각 함수의 성공/에러 경로를 검증한다.

- [ ] **Step 1: `src/api/quiz.test.ts` 작성**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrCreateDefaultClassroom,
  saveQuizSet,
  getQuizSetsByClassroom,
  joinClassroom,
  getStudentQuizSets,
  submitAnswer,
  updateFeedback,
} from './quiz';

// Supabase 체인 빌더 mock
const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  upsert: vi.fn(),
  update: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
};

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  // 각 메서드가 다시 체인을 반환하도록 리셋
  mockChain.select.mockReturnThis();
  mockChain.eq.mockReturnThis();
  mockChain.order.mockReturnThis();
  mockChain.limit.mockReturnThis();
  mockChain.insert.mockReturnThis();
  mockChain.update.mockReturnThis();
  mockChain.in.mockReturnThis();
});

// ─── getOrCreateDefaultClassroom ─────────────────────────────────────────────

describe('getOrCreateDefaultClassroom', () => {
  it('기존 수업이 있으면 그대로 반환한다', async () => {
    const existing = { id: 'cls-1', teacher_id: 't-1', name: '내 수업', entry_code: 'ABC123', created_at: '' };
    mockChain.single.mockResolvedValueOnce({ data: existing, error: null });

    const result = await getOrCreateDefaultClassroom('t-1');

    expect(result).toEqual(existing);
    // insert가 호출되지 않아야 한다
    expect(mockChain.insert).not.toHaveBeenCalled();
  });

  it('수업이 없으면 새로 생성해서 반환한다', async () => {
    const created = { id: 'cls-2', teacher_id: 't-1', name: '내 수업', entry_code: 'XYZ789', created_at: '' };
    // 첫 single: 기존 없음
    mockChain.single
      .mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
      // 두 번째 single: 생성 결과
      .mockResolvedValueOnce({ data: created, error: null });

    const result = await getOrCreateDefaultClassroom('t-1');

    expect(result).toEqual(created);
    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        teacher_id: 't-1',
        name: '내 수업',
        entry_code: expect.stringMatching(/^[A-Z0-9]{6}$/),
      }),
    );
  });

  it('생성 실패 시 에러를 throw한다', async () => {
    mockChain.single
      .mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
      .mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

    await expect(getOrCreateDefaultClassroom('t-1')).rejects.toThrow('수업 생성 실패');
  });
});

// ─── saveQuizSet ──────────────────────────────────────────────────────────────

describe('saveQuizSet', () => {
  it('퀴즈 세트를 저장하고 반환한다', async () => {
    const saved = { id: 'qs-1', classroom_id: 'cls-1', title: '테스트 퀴즈', questions: [], created_at: '' };
    mockChain.single.mockResolvedValueOnce({ data: saved, error: null });

    const result = await saveQuizSet('cls-1', '테스트 퀴즈', []);

    expect(result).toEqual(saved);
  });

  it('저장 실패 시 에러를 throw한다', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'insert failed' } });

    await expect(saveQuizSet('cls-1', '제목', [])).rejects.toThrow('퀴즈 저장 실패');
  });
});

// ─── getQuizSetsByClassroom ───────────────────────────────────────────────────

describe('getQuizSetsByClassroom', () => {
  it('퀴즈 목록을 반환한다', async () => {
    const list = [{ id: 'qs-1' }, { id: 'qs-2' }];
    mockChain.order.mockResolvedValueOnce({ data: list, error: null });

    const result = await getQuizSetsByClassroom('cls-1');

    expect(result).toEqual(list);
  });

  it('조회 실패 시 에러를 throw한다', async () => {
    mockChain.order.mockResolvedValueOnce({ data: null, error: { message: 'query failed' } });

    await expect(getQuizSetsByClassroom('cls-1')).rejects.toThrow('퀴즈 목록 조회 실패');
  });
});

// ─── joinClassroom ────────────────────────────────────────────────────────────

describe('joinClassroom', () => {
  it('올바른 입장 코드로 수업에 참여한다', async () => {
    const classroom = { id: 'cls-1', entry_code: 'ABC123' };
    mockChain.single.mockResolvedValueOnce({ data: classroom, error: null });
    mockChain.upsert.mockResolvedValueOnce({ error: null });

    const result = await joinClassroom('abc123', 'student-1');

    expect(result).toEqual(classroom);
    // 입력값이 대문자로 변환되어 사용됐는지 확인
    expect(mockChain.eq).toHaveBeenCalledWith('entry_code', 'ABC123');
  });

  it('잘못된 입장 코드면 에러를 throw한다', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    await expect(joinClassroom('WRONG1', 'student-1')).rejects.toThrow('입장 코드가 올바르지 않습니다');
  });
});

// ─── getStudentQuizSets ───────────────────────────────────────────────────────

describe('getStudentQuizSets', () => {
  it('멤버십이 없으면 빈 배열을 반환한다', async () => {
    // classroom_members 조회 결과: 빈 배열 → 조기 반환
    mockChain.eq.mockResolvedValueOnce({ data: [], error: null });

    const result = await getStudentQuizSets('student-1');

    expect(result).toEqual([]);
  });

  it('멤버십 조회 실패 시 에러를 throw한다', async () => {
    mockChain.eq.mockResolvedValueOnce({ data: null, error: { message: 'query failed' } });

    await expect(getStudentQuizSets('student-1')).rejects.toThrow('수업 목록 조회 실패');
  });
});

// ─── submitAnswer ─────────────────────────────────────────────────────────────

describe('submitAnswer', () => {
  it('응답을 저장한다', async () => {
    mockChain.insert.mockResolvedValueOnce({ error: null });
    // insert가 체인을 반환하지 않고 직접 결과를 반환하는 경우
    // from().insert() 패턴이므로 mockChain.insert에서 resolve
    const log = {
      student_id: 's-1', quiz_set_id: 'qs-1',
      question_id: 'q-1', selected_index: 0, is_correct: true,
    };

    await expect(submitAnswer(log)).resolves.toBeUndefined();
  });

  it('저장 실패 시 에러를 throw한다', async () => {
    mockChain.insert.mockResolvedValueOnce({ error: { message: 'insert failed' } });

    const log = {
      student_id: 's-1', quiz_set_id: 'qs-1',
      question_id: 'q-1', selected_index: 0, is_correct: false,
    };

    await expect(submitAnswer(log)).rejects.toThrow('응답 저장 실패');
  });
});

// ─── updateFeedback ───────────────────────────────────────────────────────────

describe('updateFeedback', () => {
  it('피드백을 업데이트한다', async () => {
    mockChain.eq.mockResolvedValueOnce({ error: null });

    await expect(updateFeedback('log-1', '잘했어요')).resolves.toBeUndefined();
  });

  it('업데이트 실패 시 에러를 throw한다', async () => {
    mockChain.eq.mockResolvedValueOnce({ error: { message: 'update failed' } });

    await expect(updateFeedback('log-1', '피드백')).rejects.toThrow('피드백 저장 실패');
  });
});
```

- [ ] **Step 2: 테스트 실행 및 확인**

```bash
npm test -- --run src/api/quiz.test.ts
```

Expected: 모든 테스트 PASS. 실패하면 mock 체인 반환값을 확인한다 (`mockReturnThis` vs `mockResolvedValueOnce` 위치 조정).

- [ ] **Step 3: 커밋**

```bash
git add src/api/quiz.test.ts
git commit -m "test: Quiz API 단위 테스트 추가"
```

---

## Task 3: Auth API 테스트 (`src/api/auth.test.ts`)

**Files:**
- Create: `src/api/auth.test.ts`

`signInWithKakao`는 플랫폼/브라우저 의존성이 높아 통합 테스트 범위를 벗어나므로 제외한다. `getCurrentProfile`과 `signOut`을 집중 테스트한다.

- [ ] **Step 1: `src/api/auth.test.ts` 작성**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentProfile, signOut } from './auth';

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

const mockAuth = {
  getUser: vi.fn(),
  signOut: vi.fn(),
  setSession: vi.fn(),
};

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
    auth: mockAuth,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockChain.select.mockReturnThis();
  mockChain.eq.mockReturnThis();
});

// ─── getCurrentProfile ────────────────────────────────────────────────────────

describe('getCurrentProfile', () => {
  it('인증된 유저의 프로필을 반환한다', async () => {
    const profile = { id: 'u-1', kakao_id: '123', role: 'teacher', display_name: '이진우', created_at: '' };
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u-1' } } });
    mockChain.single.mockResolvedValueOnce({ data: profile, error: null });

    const result = await getCurrentProfile();

    expect(result).toEqual(profile);
  });

  it('비인증 상태면 null을 반환한다', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null } });

    const result = await getCurrentProfile();

    expect(result).toBeNull();
  });

  it('프로필 조회 에러면 null을 반환한다', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u-1' } } });
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const result = await getCurrentProfile();

    expect(result).toBeNull();
  });
});

// ─── signOut ──────────────────────────────────────────────────────────────────

describe('signOut', () => {
  it('로그아웃에 성공한다', async () => {
    mockAuth.signOut.mockResolvedValueOnce({ error: null });

    await expect(signOut()).resolves.toBeUndefined();
  });

  it('로그아웃 실패 시 에러를 throw한다', async () => {
    const err = new Error('sign out failed');
    mockAuth.signOut.mockResolvedValueOnce({ error: err });

    await expect(signOut()).rejects.toThrow('sign out failed');
  });
});
```

- [ ] **Step 2: 테스트 실행 및 확인**

```bash
npm test -- --run src/api/auth.test.ts
```

Expected: 모든 테스트 PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/api/auth.test.ts
git commit -m "test: Auth API 단위 테스트 추가"
```

---

## Task 4: useQuiz hooks 테스트 (`src/hooks/useQuiz.test.ts`)

**Files:**
- Create: `src/hooks/useQuiz.test.ts`

- [ ] **Step 1: `src/hooks/useQuiz.test.ts` 작성**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useStudentQuizSets, useTeacherQuizSets } from './useQuiz';

// API 모킹
vi.mock('../api/quiz', () => ({
  getStudentQuizSets: vi.fn(),
  getQuizSetsByClassroom: vi.fn(),
}));

vi.mock('../api/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { getStudentQuizSets, getQuizSetsByClassroom } from '../api/quiz';

// 테스트마다 신선한 QueryClient 생성
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── useStudentQuizSets ───────────────────────────────────────────────────────

describe('useStudentQuizSets', () => {
  it('studentId가 없으면 API를 호출하지 않는다', () => {
    renderHook(() => useStudentQuizSets(''), { wrapper: createWrapper() });

    expect(getStudentQuizSets).not.toHaveBeenCalled();
  });

  it('studentId가 있으면 데이터를 불러온다', async () => {
    const mockData = [{ id: 'qs-1', title: '수학 퀴즈' }];
    vi.mocked(getStudentQuizSets).mockResolvedValueOnce(mockData as any);

    const { result } = renderHook(() => useStudentQuizSets('student-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('API 에러 시 error 상태가 된다', async () => {
    vi.mocked(getStudentQuizSets).mockRejectedValueOnce(new Error('API 오류'));

    const { result } = renderHook(() => useStudentQuizSets('student-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

// ─── useTeacherQuizSets ───────────────────────────────────────────────────────

describe('useTeacherQuizSets', () => {
  it('classroomId가 없으면 API를 호출하지 않는다', () => {
    renderHook(() => useTeacherQuizSets(''), { wrapper: createWrapper() });

    expect(getQuizSetsByClassroom).not.toHaveBeenCalled();
  });

  it('classroomId가 있으면 데이터를 불러온다', async () => {
    const mockData = [{ id: 'qs-2', title: '영어 퀴즈' }];
    vi.mocked(getQuizSetsByClassroom).mockResolvedValueOnce(mockData as any);

    const { result } = renderHook(() => useTeacherQuizSets('cls-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});
```

- [ ] **Step 2: 테스트 실행 및 확인**

```bash
npm test -- --run src/hooks/useQuiz.test.ts
```

Expected: 모든 테스트 PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useQuiz.test.ts
git commit -m "test: useQuiz hooks 테스트 추가"
```

---

## Task 5: useReport hooks 테스트 (`src/hooks/useReport.test.ts`)

**Files:**
- Create: `src/hooks/useReport.test.ts`

- [ ] **Step 1: `src/hooks/useReport.test.ts` 작성**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMyConceptStats, useMyLogs } from './useReport';

vi.mock('../api/logs', () => ({
  getMyConceptStats: vi.fn(),
  getMyLogs: vi.fn(),
}));

import { getMyConceptStats, getMyLogs } from '../api/logs';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── useMyConceptStats ────────────────────────────────────────────────────────

describe('useMyConceptStats', () => {
  it('studentId가 없으면 API를 호출하지 않는다', () => {
    renderHook(() => useMyConceptStats(''), { wrapper: createWrapper() });

    expect(getMyConceptStats).not.toHaveBeenCalled();
  });

  it('studentId가 있으면 개념별 통계를 반환한다', async () => {
    const mockData = [{ concept_tag: '분수', correct: 4, total: 5, accuracy: 80 }];
    vi.mocked(getMyConceptStats).mockResolvedValueOnce(mockData as any);

    const { result } = renderHook(() => useMyConceptStats('student-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});

// ─── useMyLogs ────────────────────────────────────────────────────────────────

describe('useMyLogs', () => {
  it('studentId가 없으면 API를 호출하지 않는다', () => {
    renderHook(() => useMyLogs(''), { wrapper: createWrapper() });

    expect(getMyLogs).not.toHaveBeenCalled();
  });

  it('studentId가 있으면 로그 목록을 반환한다', async () => {
    const mockData = [{ quiz_set_id: 'qs-1', quiz_title: '수학', correct: 3, total: 5, accuracy: 60, created_at: '' }];
    vi.mocked(getMyLogs).mockResolvedValueOnce(mockData as any);

    const { result } = renderHook(() => useMyLogs('student-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('API 에러 시 error 상태가 된다', async () => {
    vi.mocked(getMyLogs).mockRejectedValueOnce(new Error('조회 실패'));

    const { result } = renderHook(() => useMyLogs('student-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

- [ ] **Step 2: 테스트 실행 및 확인**

```bash
npm test -- --run src/hooks/useReport.test.ts
```

Expected: 모든 테스트 PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useReport.test.ts
git commit -m "test: useReport hooks 테스트 추가"
```

---

## Task 6: Button 컴포넌트 테스트 (`src/components/common/Button.test.tsx`)

**Files:**
- Create: `src/components/common/Button.test.tsx`

`react-native`가 `react-native-web`으로 alias되므로 `@testing-library/react`의 `render`로 렌더링 가능하다. `Pressable`은 웹에서 `div[role="button"]`으로 렌더링된다.

- [ ] **Step 1: `src/components/common/Button.test.tsx` 작성**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Button } from './Button';

describe('Button', () => {
  it('label 텍스트를 렌더링한다', () => {
    render(<Button label="로그인" />);

    expect(screen.getByText('로그인')).toBeInTheDocument();
  });

  it('onPress 콜백이 클릭 시 호출된다', () => {
    const onPress = vi.fn();
    render(<Button label="확인" onPress={onPress} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태에서는 클릭이 동작하지 않는다', () => {
    const onPress = vi.fn();
    render(<Button label="비활성" disabled onPress={onPress} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('isLoading 상태에서는 클릭이 동작하지 않는다', () => {
    const onPress = vi.fn();
    render(<Button label="로딩중" isLoading onPress={onPress} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('accessibilityLabel이 label과 동일하게 설정된다', () => {
    render(<Button label="제출" />);

    expect(screen.getByLabelText('제출')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 및 확인**

```bash
npm test -- --run src/components/common/Button.test.tsx
```

Expected: 모든 테스트 PASS. `fireEvent.click`이 `Pressable`에서 동작하지 않으면 `fireEvent.press` 또는 `userEvent.click`으로 교체한다.

- [ ] **Step 3: 커밋**

```bash
git add src/components/common/Button.test.tsx
git commit -m "test: Button 컴포넌트 테스트 추가"
```

---

## Task 7: LoadingSpinner 컴포넌트 테스트 (`src/components/common/LoadingSpinner.test.tsx`)

**Files:**
- Create: `src/components/common/LoadingSpinner.test.tsx`

`ActivityIndicator`는 `react-native-web`에서 `div[role="progressbar"]`로 렌더링된다.

- [ ] **Step 1: `src/components/common/LoadingSpinner.test.tsx` 작성**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('기본(인라인) 스피너를 렌더링한다', () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fullScreen prop이 있으면 스피너가 렌더링된다', () => {
    render(<LoadingSpinner fullScreen />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 및 확인**

```bash
npm test -- --run src/components/common/LoadingSpinner.test.tsx
```

Expected: 모든 테스트 PASS.

- [ ] **Step 3: 전체 테스트 실행**

```bash
npm test -- --run
```

Expected: 전체 테스트 스위트 PASS. 실패하는 테스트가 있으면 해당 Task로 돌아가 수정한다.

- [ ] **Step 4: 최종 커밋**

```bash
git add src/components/common/LoadingSpinner.test.tsx
git commit -m "test: LoadingSpinner 컴포넌트 테스트 추가"
```
