-- ============================================================
-- profiles.role NULL 허용 (역할 변경 → 역할 선택 화면)
-- ============================================================
-- 001만 적용된 경우 role NOT NULL 때문에 PATCH 시 400 이 납니다.
-- 002_role_nullable.sql 과 동일한 보정입니다. (미적용 원격 DB용)
-- Supabase Dashboard → SQL Editor 에서 실행하세요.
-- ============================================================

ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;
