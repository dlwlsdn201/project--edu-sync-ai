-- profiles.role 컬럼을 NULL 허용으로 변경
-- 신규 가입 유저는 role이 null → 역할 선택 화면으로 이동
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;
