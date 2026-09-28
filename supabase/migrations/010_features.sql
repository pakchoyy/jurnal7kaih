-- ============================================================
-- 010_features.sql — chat per jurnal, foto kegiatan, kepala sekolah,
-- notifikasi. Aman dijalankan ulang.
-- ============================================================

-- Chat guru–ortu per jurnal
CREATE TABLE IF NOT EXISTS journal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journal_messages_journal ON journal_messages(journal_id, created_at);
ALTER TABLE journal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_messages_select" ON journal_messages;
CREATE POLICY "journal_messages_select" ON journal_messages FOR SELECT USING (
  journal_id IN (SELECT id FROM journals)
);
DROP POLICY IF EXISTS "journal_messages_insert" ON journal_messages;
CREATE POLICY "journal_messages_insert" ON journal_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND journal_id IN (SELECT id FROM journals)
);

-- Foto kegiatan (file di bucket privat, diunggah lewat server)
CREATE TABLE IF NOT EXISTS journal_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journal_photos_journal ON journal_photos(journal_id);
ALTER TABLE journal_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_photos_select" ON journal_photos;
CREATE POLICY "journal_photos_select" ON journal_photos FOR SELECT USING (
  journal_id IN (SELECT id FROM journals)
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('journal-photos', 'journal-photos', FALSE, 2097152, ARRAY['image/jpeg', 'image/webp', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Peran kepala sekolah
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'school_admin', 'teacher', 'principal', 'parent'));

-- Rekap untuk kepala sekolah (agregat, dibatasi ke sekolahnya sendiri)
CREATE OR REPLACE FUNCTION principal_class_stats(p_today DATE)
RETURNS TABLE (class_id UUID, class_name TEXT, grade INT, teacher_name TEXT,
               total_students BIGINT, today_count BIGINT, week_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name, c.grade, u.name,
    (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.status = 'active'),
    (SELECT COUNT(*) FROM journals j JOIN students s ON s.id = j.student_id
      WHERE s.class_id = c.id AND j.status <> 'draft' AND j.journal_date = p_today),
    (SELECT COUNT(*) FROM journals j JOIN students s ON s.id = j.student_id
      WHERE s.class_id = c.id AND j.status <> 'draft' AND j.journal_date BETWEEN p_today - 6 AND p_today)
  FROM classes c
  JOIN academic_years ay ON ay.id = c.academic_year_id AND ay.is_active
  LEFT JOIN users u ON u.id = c.homeroom_teacher_id
  WHERE c.school_id = auth_school_id() AND auth_role() = 'principal'
  ORDER BY c.grade, c.name;
$$;

CREATE OR REPLACE FUNCTION principal_habit_stats(p_from DATE)
RETURNS TABLE (habit_id UUID, done_count BIGINT, journal_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH js AS (
    SELECT id FROM journals
    WHERE school_id = auth_school_id() AND status <> 'draft' AND journal_date >= p_from
      AND auth_role() = 'principal'
  )
  SELECT h.id,
    (SELECT COUNT(*) FROM journal_entries e WHERE e.habit_id = h.id AND e.status = 'done'
      AND e.journal_id IN (SELECT id FROM js)),
    (SELECT COUNT(*) FROM js)
  FROM habits h WHERE h.is_active ORDER BY h.sort_order;
$$;

GRANT EXECUTE ON FUNCTION principal_class_stats(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION principal_habit_stats(DATE) TO authenticated;

-- Langganan notifikasi (web push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_own" ON push_subscriptions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
