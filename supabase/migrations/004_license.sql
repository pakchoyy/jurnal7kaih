-- ============================================================
-- 004_license.sql — Sistem Lisensi Sekolah (Per Semester & Trial)
-- ============================================================

ALTER TABLE schools
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'semester' CHECK (plan IN ('trial', 'semester', 'annual', 'lifetime')),
ADD COLUMN IF NOT EXISTS active_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '6 months'),
ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS buyer_email TEXT;

CREATE INDEX IF NOT EXISTS idx_schools_plan ON schools(plan);
CREATE INDEX IF NOT EXISTS idx_schools_active_until ON schools(active_until);

-- Update RLS schools agar admin sekolah bisa membaca data status lisensi sekolahnya sendiri
DROP POLICY IF EXISTS "schools_select" ON schools;
CREATE POLICY "schools_select" ON schools FOR SELECT USING (
  auth_role() = 'super_admin'
  OR id = auth_school_id()
);
