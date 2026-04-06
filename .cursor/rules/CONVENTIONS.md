# Engineering Conventions

## 1. Directory Structure
- `src/api`: Supabase 관련 API 정의
- `src/components`: 재사용 가능한 UI 원자 단위 컴포넌트
- `src/hooks`: 커스텀 훅 (Data fetching, Auth 등)
- `src/screens`: 페이지 단위 스크린 컴포넌트
- `src/store`: Context API 전역 상태
- `src/types`: TypeScript 공통 타입 정의

## 2. Styling (NativeWind)
- 모든 스타일은 인라인 class 대신 `className` 속성을 사용한다.
- 디자인 시스템: Primary Color (#3B82F6), Success (#10B981), Error (#EF4444).

## 3. Data Fetching
- `react-query`를 사용하여 캐싱과 로딩 상태를 관리한다.
- `useQuery`와 `useMutation`을 적극 활용하여 선언적으로 작성한다.