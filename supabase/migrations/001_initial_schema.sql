-- ============================================================
-- EduSync AI — 초기 DB 스키마 및 RLS 정책
-- Supabase Dashboard > SQL Editor에서 실행하세요.
-- ============================================================

-- ── 1단계: 테이블 생성 ────────────────────────────────────────
-- (RLS 정책은 모든 테이블 생성 이후에 추가합니다)

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_id     TEXT UNIQUE NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('teacher', 'student')) DEFAULT 'student',
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classrooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  entry_code  TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 학생-수업 N:M 관계 (classrooms 이후에 생성)
CREATE TABLE IF NOT EXISTS public.classroom_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id  UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (classroom_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.quiz_sets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id  UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  questions     JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_set_id    UUID NOT NULL REFERENCES public.quiz_sets(id) ON DELETE CASCADE,
  question_id    TEXT NOT NULL,
  selected_index INTEGER NOT NULL,
  is_correct     BOOLEAN NOT NULL,
  ai_feedback    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 2단계: RLS 활성화 ─────────────────────────────────────────

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_logs      ENABLE ROW LEVEL SECURITY;


-- ── 3단계: 정책 설정 ─────────────────────────────────────────
-- (모든 테이블이 존재하는 상태에서 적용)

-- profiles: 본인만 조회/수정
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- classrooms: 교사는 본인 수업 관리, 학생은 참여한 수업 조회
CREATE POLICY "classrooms_teacher_all"
  ON public.classrooms FOR ALL
  USING (auth.uid() = teacher_id);

CREATE POLICY "classrooms_student_select"
  ON public.classrooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_members
      WHERE classroom_id = classrooms.id
        AND student_id   = auth.uid()
    )
  );

-- classroom_members: 학생 본인 참여 관리, 교사는 본인 수업 멤버 조회
CREATE POLICY "classroom_members_student_all"
  ON public.classroom_members FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "classroom_members_teacher_select"
  ON public.classroom_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id         = classroom_id
        AND teacher_id = auth.uid()
    )
  );

-- quiz_sets: 교사는 본인 수업 퀴즈 관리, 학생은 참여한 수업 퀴즈 조회
CREATE POLICY "quiz_sets_teacher_all"
  ON public.quiz_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id         = classroom_id
        AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "quiz_sets_student_select"
  ON public.quiz_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_members
      WHERE classroom_id = quiz_sets.classroom_id
        AND student_id   = auth.uid()
    )
  );

-- student_logs: 학생 본인 로그 관리, 교사는 본인 수업 로그 조회
CREATE POLICY "student_logs_own"
  ON public.student_logs FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "student_logs_teacher_select"
  ON public.student_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.quiz_sets qs
      JOIN public.classrooms c ON c.id = qs.classroom_id
      WHERE qs.id        = quiz_set_id
        AND c.teacher_id = auth.uid()
    )
  );


-- ── 4단계: Realtime 활성화 ───────────────────────────────────
-- 교사 대시보드의 실시간 학생 응답 수신에 필요합니다.

ALTER PUBLICATION supabase_realtime ADD TABLE public.student_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sets;
