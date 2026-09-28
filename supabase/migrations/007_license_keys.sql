-- ============================================================
-- 007_license_keys.sql — Tabel kode lisensi untuk upgrade Pro
-- ============================================================

CREATE TABLE IF NOT EXISTS license_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT UNIQUE NOT NULL,
  plan            TEXT NOT NULL CHECK (plan IN ('semester', 'annual', 'lifetime')),
  duration_months INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  used_at         TIMESTAMPTZ,
  used_by_school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;

-- Hanya super_admin bisa lihat semua key
CREATE POLICY "license_keys_super" ON license_keys FOR ALL USING (
  auth_role() = 'super_admin'
);

-- Teacher bisa INSERT (saat pakai key) — tapi via server action dengan admin client
-- jadi tidak perlu RLS untuk INSERT dari client

-- Index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(key);
CREATE INDEX IF NOT EXISTS idx_license_keys_used ON license_keys(used_by_school_id);

-- Fix: parent bisa baca nama + WA guru di sekolah mereka
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT USING (
  id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() IN ('school_admin', 'teacher') AND school_id = auth_school_id())
  OR (auth_role() = 'parent' AND school_id = auth_school_id() AND role IN ('teacher', 'school_admin'))
);
