-- ============================================================
-- 011_school_calendar.sql — hari sekolah & tanggal libur. Aman dijalankan ulang.
-- ============================================================

-- '1-5' = Senin–Jumat, '1-6' = Senin–Sabtu
ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_days TEXT NOT NULL DEFAULT '1-6'
  CHECK (school_days IN ('1-5', '1-6'));

CREATE TABLE IF NOT EXISTS school_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_school_holidays_school ON school_holidays(school_id, start_date);
ALTER TABLE school_holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_holidays_select" ON school_holidays;
CREATE POLICY "school_holidays_select" ON school_holidays FOR SELECT USING (
  auth_role() = 'super_admin' OR school_id = auth_school_id()
);
DROP POLICY IF EXISTS "school_holidays_manage" ON school_holidays;
CREATE POLICY "school_holidays_manage" ON school_holidays FOR ALL USING (
  auth_role() = 'super_admin' OR (auth_role() = 'teacher' AND school_id = auth_school_id())
) WITH CHECK (
  auth_role() = 'super_admin' OR (auth_role() = 'teacher' AND school_id = auth_school_id())
);
