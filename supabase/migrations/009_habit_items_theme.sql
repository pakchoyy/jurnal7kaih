-- ============================================================
-- 009_habit_items_theme.sql — Isi poin kebiasaan per sekolah,
-- logo & warna tema sekolah. Aman dijalankan ulang.
-- ============================================================

CREATE TABLE IF NOT EXISTS school_habit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 60),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, habit_id, label)
);
CREATE INDEX IF NOT EXISTS idx_school_habit_items_school ON school_habit_items(school_id, habit_id);

ALTER TABLE school_habit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_habit_items_select" ON school_habit_items;
CREATE POLICY "school_habit_items_select" ON school_habit_items FOR SELECT USING (
  auth_role() = 'super_admin' OR school_id = auth_school_id()
);

DROP POLICY IF EXISTS "school_habit_items_manage" ON school_habit_items;
CREATE POLICY "school_habit_items_manage" ON school_habit_items FOR ALL USING (
  auth_role() = 'super_admin' OR (auth_role() = 'teacher' AND school_id = auth_school_id())
) WITH CHECK (
  auth_role() = 'super_admin' OR (auth_role() = 'teacher' AND school_id = auth_school_id())
);

ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS theme_color TEXT NOT NULL DEFAULT 'blue';

-- Bucket publik untuk logo (upload hanya lewat server / service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('school-logos', 'school-logos', TRUE, 1048576, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
