-- ============================================================
-- 001_init.sql — Schema inti Jurnal 7Kaih
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Trigger helper: auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sekolah
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (semua role)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'teacher', 'parent')),
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_role ON users(role);

-- Tahun ajaran
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

CREATE INDEX idx_academic_years_school ON academic_years(school_id);

-- Kelas
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  homeroom_teacher_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, academic_year_id, name)
);

CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_classes_homeroom ON classes(homeroom_teacher_id);

-- Siswa
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  student_number TEXT,
  nisn TEXT,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('L', 'P')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, student_number)
);

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_class ON students(class_id);

-- Relasi siswa-orang tua
CREATE TABLE student_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('Ayah', 'Ibu', 'Wali')),
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, user_id)
);

CREATE INDEX idx_student_parents_user ON student_parents(user_id);
CREATE INDEX idx_student_parents_student ON student_parents(student_id);

-- Kode aktivasi orang tua
CREATE TABLE parent_activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activation_codes_school ON parent_activation_codes(school_id);
CREATE INDEX idx_activation_codes_student ON parent_activation_codes(student_id);
CREATE INDEX idx_activation_codes_code ON parent_activation_codes(code);

-- 7 Kebiasaan (seed di 002_seed.sql)
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jurnal harian (1 per anak per hari)
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  journal_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  parent_note TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, journal_date)
);

CREATE INDEX idx_journals_school ON journals(school_id);
CREATE INDEX idx_journals_student_date ON journals(student_id, journal_date DESC);
CREATE INDEX idx_journals_status ON journals(status);

-- Entry per kebiasaan dalam 1 jurnal
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id),
  status TEXT DEFAULT 'not_done' CHECK (status IN ('done', 'not_done')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(journal_id, habit_id)
);

CREATE INDEX idx_journal_entries_journal ON journal_entries(journal_id);
CREATE INDEX idx_journal_entries_habit ON journal_entries(habit_id);

-- Catatan guru
CREATE TABLE teacher_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_notes_school ON teacher_notes(school_id);
CREATE INDEX idx_teacher_notes_student ON teacher_notes(student_id);
CREATE INDEX idx_teacher_notes_journal ON teacher_notes(journal_id);

-- Trigger updated_at
CREATE TRIGGER trg_schools_updated          BEFORE UPDATE ON schools             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated            BEFORE UPDATE ON users               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_classes_updated          BEFORE UPDATE ON classes             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_students_updated         BEFORE UPDATE ON students            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_habits_updated           BEFORE UPDATE ON habits              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_journals_updated         BEFORE UPDATE ON journals            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_journal_entries_updated  BEFORE UPDATE ON journal_entries     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_teacher_notes_updated    BEFORE UPDATE ON teacher_notes       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ============================================================
-- 002_seed.sql — Seed 7 Kebiasaan (idempotent)
-- ============================================================

INSERT INTO habits (name, slug, description, icon, color, sort_order) VALUES
('Bangun Pagi', 'bangun-pagi', 'Bangun di waktu pagi, idealnya sebelum atau saat subuh', '🌅', '#F59E0B', 1),
('Beribadah', 'beribadah', 'Rutinitas ibadah sesuai agama/keyakinan masing-masing', '🙏', '#8B5CF6', 2),
('Berolahraga', 'berolahraga', 'Aktivitas fisik untuk kebugaran, kesehatan, dan kualitas hidup', '🏃', '#10B981', 3),
('Makan Sehat', 'makan-sehat', 'Pola makan teratur bergizi seimbang sesuai Isi Piringku', '🥗', '#06B6D4', 4),
('Gemar Belajar', 'gemar-belajar', 'Kebiasaan menambah pengetahuan dan keterampilan dengan senang dan antusias', '📚', '#3B82F6', 5),
('Bermasyarakat', 'bermasyarakat', 'Interaksi sosial, kerja sama, keterlibatan dalam kegiatan sosial/budaya/lingkungan', '🤝', '#EC4899', 6),
('Tidur Cepat', 'tidur-cepat', 'Tidur tepat waktu, tidak larut malam, sesuai kebutuhan ideal waktu tidur anak', '😴', '#6366F1', 7)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;
-- ============================================================
-- 003_rls.sql — Helper functions, ENABLE RLS, policies, RPC
-- ============================================================

-- ============================================================
-- Helper functions (SECURITY DEFINER agar tidak rekursi RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION auth_school_id() RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_role() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_accessible_student_ids() RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT sp.student_id FROM student_parents sp WHERE sp.user_id = auth.uid()
  UNION
  SELECT s.id FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.homeroom_teacher_id = auth.uid();
$$;

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE schools                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years           ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE students                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_activation_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_notes            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- schools
-- ============================================================
CREATE POLICY "schools_select" ON schools FOR SELECT USING (
  auth_role() = 'super_admin'
  OR id = auth_school_id()
);
CREATE POLICY "schools_manage" ON schools FOR ALL USING (
  auth_role() = 'super_admin'
) WITH CHECK (auth_role() = 'super_admin');

-- ============================================================
-- users
-- ============================================================
CREATE POLICY "users_select" ON users FOR SELECT USING (
  id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
);
CREATE POLICY "users_update" ON users FOR UPDATE USING (
  id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
) WITH CHECK (
  id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin')
);

-- ============================================================
-- academic_years
-- ============================================================
CREATE POLICY "academic_years_select" ON academic_years FOR SELECT USING (
  auth_role() = 'super_admin' OR school_id = auth_school_id()
);
CREATE POLICY "academic_years_manage" ON academic_years FOR ALL USING (
  auth_role() IN ('super_admin', 'school_admin') AND school_id = auth_school_id()
) WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin') AND school_id = auth_school_id()
);

-- ============================================================
-- classes
-- ============================================================
CREATE POLICY "classes_select" ON classes FOR SELECT USING (
  auth_role() = 'super_admin'
  OR school_id = auth_school_id()
);
CREATE POLICY "classes_manage" ON classes FOR ALL USING (
  auth_role() IN ('super_admin', 'school_admin') AND school_id = auth_school_id()
) WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin') AND school_id = auth_school_id()
);

-- ============================================================
-- students
-- ============================================================
CREATE POLICY "students_select" ON students FOR SELECT USING (
  auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
  OR id IN (SELECT auth_accessible_student_ids())
);
CREATE POLICY "students_manage" ON students FOR ALL USING (
  auth_role() IN ('super_admin', 'school_admin') AND school_id = auth_school_id()
) WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin') AND school_id = auth_school_id()
);

-- ============================================================
-- student_parents
-- ============================================================
CREATE POLICY "student_parents_select" ON student_parents FOR SELECT USING (
  user_id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin'
      AND student_id IN (SELECT id FROM students WHERE school_id = auth_school_id()))
);
CREATE POLICY "student_parents_manage" ON student_parents FOR ALL USING (
  auth_role() IN ('super_admin', 'school_admin')
) WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin')
);

-- ============================================================
-- parent_activation_codes (TIDAK ada akses anon)
-- ============================================================
CREATE POLICY "activation_codes_select" ON parent_activation_codes FOR SELECT USING (
  auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
);
CREATE POLICY "activation_codes_manage" ON parent_activation_codes FOR ALL USING (
  auth_role() IN ('super_admin', 'school_admin') AND school_id = auth_school_id()
) WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin') AND school_id = auth_school_id()
);

-- ============================================================
-- habits
-- ============================================================
CREATE POLICY "habits_select" ON habits FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "habits_manage" ON habits FOR ALL USING (
  auth_role() = 'super_admin'
) WITH CHECK (auth_role() = 'super_admin');

-- ============================================================
-- journals
-- ============================================================
CREATE POLICY "journals_parent" ON journals FOR ALL USING (
  school_id = auth_school_id()
  AND student_id IN (SELECT student_id FROM student_parents WHERE user_id = auth.uid())
) WITH CHECK (
  school_id = auth_school_id()
  AND student_id IN (SELECT student_id FROM student_parents WHERE user_id = auth.uid())
  AND created_by = auth.uid()
);
CREATE POLICY "journals_teacher_select" ON journals FOR SELECT USING (
  school_id = auth_school_id()
  AND student_id IN (
    SELECT s.id FROM students s JOIN classes c ON s.class_id = c.id
    WHERE c.homeroom_teacher_id = auth.uid()
  )
);
CREATE POLICY "journals_teacher_review" ON journals FOR UPDATE USING (
  school_id = auth_school_id()
  AND student_id IN (
    SELECT s.id FROM students s JOIN classes c ON s.class_id = c.id
    WHERE c.homeroom_teacher_id = auth.uid()
  )
) WITH CHECK (
  school_id = auth_school_id()
);
CREATE POLICY "journals_admin" ON journals FOR ALL USING (
  auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
) WITH CHECK (
  auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
);

-- ============================================================
-- journal_entries (difilter via RLS journals)
-- ============================================================
CREATE POLICY "journal_entries_access" ON journal_entries FOR ALL USING (
  journal_id IN (SELECT id FROM journals)
) WITH CHECK (
  journal_id IN (SELECT id FROM journals)
);

-- ============================================================
-- teacher_notes
-- ============================================================
CREATE POLICY "teacher_notes_select" ON teacher_notes FOR SELECT USING (
  school_id = auth_school_id()
  AND student_id IN (SELECT auth_accessible_student_ids())
);
CREATE POLICY "teacher_notes_insert" ON teacher_notes FOR INSERT WITH CHECK (
  teacher_id = auth.uid()
  AND school_id = auth_school_id()
  AND student_id IN (
    SELECT s.id FROM students s JOIN classes c ON s.class_id = c.id
    WHERE c.homeroom_teacher_id = auth.uid()
  )
);
CREATE POLICY "teacher_notes_manage" ON teacher_notes FOR ALL USING (
  teacher_id = auth.uid()
) WITH CHECK (
  teacher_id = auth.uid()
);

-- ============================================================
-- RPC: link_child_by_code (tambah anak, ortu sudah login)
-- ============================================================
CREATE OR REPLACE FUNCTION link_child_by_code(
  p_code TEXT, p_relationship TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code parent_activation_codes%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Harus login'; END IF;
  IF (SELECT role FROM users WHERE id = auth.uid()) <> 'parent' THEN
    RAISE EXCEPTION 'Hanya akun orang tua yang bisa menambah anak';
  END IF;
  IF p_relationship NOT IN ('Ayah','Ibu','Wali') THEN RAISE EXCEPTION 'Hubungan tidak valid'; END IF;

  SELECT * INTO v_code FROM parent_activation_codes WHERE code = upper(p_code) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kode aktivasi tidak ditemukan'; END IF;
  IF v_code.used_at IS NOT NULL THEN RAISE EXCEPTION 'Kode sudah digunakan'; END IF;
  IF v_code.expires_at < NOW() THEN RAISE EXCEPTION 'Kode sudah kedaluwarsa'; END IF;

  IF v_code.school_id <> (SELECT school_id FROM users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Kode bukan dari sekolah anak Anda';
  END IF;

  INSERT INTO student_parents (student_id, user_id, relationship)
  VALUES (v_code.student_id, auth.uid(), p_relationship)
  ON CONFLICT (student_id, user_id) DO UPDATE SET relationship = EXCLUDED.relationship;

  UPDATE parent_activation_codes SET used_at = NOW(), used_by = auth.uid() WHERE id = v_code.id;

  RETURN v_code.student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION link_child_by_code(TEXT, TEXT) TO authenticated;
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
-- ============================================================
-- 005_habit_colors.sql — Selaraskan warna habit dengan mockup-v2
-- Aman dijalankan berulang.
-- ============================================================

UPDATE habits SET color = '#F59E0B', icon = '🌅' WHERE slug = 'bangun-pagi';
UPDATE habits SET color = '#8B5CF6', icon = '🙏' WHERE slug = 'beribadah';
UPDATE habits SET color = '#10B981', icon = '🏃' WHERE slug = 'berolahraga';
UPDATE habits SET color = '#06B6D4', icon = '🥗' WHERE slug = 'makan-sehat';
UPDATE habits SET color = '#3B82F6', icon = '📚' WHERE slug = 'gemar-belajar';
UPDATE habits SET color = '#EC4899', icon = '🤝' WHERE slug = 'bermasyarakat';
UPDATE habits SET color = '#6366F1', icon = '😴' WHERE slug = 'tidur-cepat';
-- ============================================================
-- 006_teacher_owns_school.sql
-- Teacher (guru yang daftar sekolah sendiri) bisa kelola kelas
-- dan siswa di sekolahnya. School_admin role tidak lagi dipakai.
-- ============================================================

-- Tambah whatsapp column di users (untuk nomor WA guru)
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- ============================================================
-- classes — teacher bisa INSERT/UPDATE/DELETE kelas miliknya
-- ============================================================
DROP POLICY IF EXISTS "classes_manage" ON classes;
CREATE POLICY "classes_manage" ON classes FOR ALL USING (
  auth_role() IN ('super_admin', 'school_admin', 'teacher')
  AND school_id = auth_school_id()
) WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin', 'teacher')
  AND school_id = auth_school_id()
);

-- ============================================================
-- students — teacher bisa INSERT/UPDATE siswa di sekolahnya
-- ============================================================
DROP POLICY IF EXISTS "students_manage" ON students;
CREATE POLICY "students_manage" ON students FOR ALL USING (
  auth_role() IN ('super_admin', 'school_admin', 'teacher')
  AND school_id = auth_school_id()
) WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin', 'teacher')
  AND school_id = auth_school_id()
);

-- ============================================================
-- academic_years — teacher bisa baca (sudah ada), tambah manage
-- ============================================================
DROP POLICY IF EXISTS "academic_years_manage" ON academic_years;
CREATE POLICY "academic_years_manage" ON academic_years FOR ALL USING (
  auth_role() IN ('super_admin', 'school_admin', 'teacher')
  AND school_id = auth_school_id()
) WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin', 'teacher')
  AND school_id = auth_school_id()
);

-- ============================================================
-- schools — teacher bisa SELECT sekolahnya sendiri (sudah ada)
-- Tambah: teacher bisa UPDATE sekolahnya (untuk update nama dll)
-- ============================================================
DROP POLICY IF EXISTS "schools_manage" ON schools;
CREATE POLICY "schools_manage" ON schools FOR ALL USING (
  auth_role() = 'super_admin'
  OR (auth_role() IN ('school_admin', 'teacher') AND id = auth_school_id())
) WITH CHECK (
  auth_role() = 'super_admin'
  OR (auth_role() IN ('school_admin', 'teacher') AND id = auth_school_id())
);

-- ============================================================
-- users — teacher bisa INSERT user baru (untuk aktivasi ortu)
-- ============================================================
DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin', 'teacher')
);

-- ============================================================
-- parent_activation_codes — teacher bisa manage (hapus school_admin only)
-- ============================================================
DROP POLICY IF EXISTS "activation_codes_select" ON parent_activation_codes;
DROP POLICY IF EXISTS "activation_codes_manage" ON parent_activation_codes;

CREATE POLICY "activation_codes_select" ON parent_activation_codes FOR SELECT USING (
  auth_role() = 'super_admin'
  OR (auth_role() IN ('school_admin', 'teacher') AND school_id = auth_school_id())
);
CREATE POLICY "activation_codes_manage" ON parent_activation_codes FOR ALL USING (
  auth_role() IN ('super_admin', 'school_admin', 'teacher')
  AND school_id = auth_school_id()
) WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin', 'teacher')
  AND school_id = auth_school_id()
);
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

DROP POLICY IF EXISTS "license_keys_super" ON license_keys;
CREATE POLICY "license_keys_super" ON license_keys FOR ALL USING (
  auth_role() = 'super_admin'
);

CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(key);
CREATE INDEX IF NOT EXISTS idx_license_keys_used ON license_keys(used_by_school_id);

-- ============================================================
-- Fix: parent bisa baca nama + WA guru di sekolah mereka
-- ============================================================
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT USING (
  id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() IN ('school_admin', 'teacher') AND school_id = auth_school_id())
  OR (auth_role() = 'parent' AND school_id = auth_school_id() AND role IN ('teacher', 'school_admin'))
);

-- ============================================================
-- 008_security_fixes.sql
-- ============================================================

-- Penanda ortu sudah ganti password default (NIS)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT FALSE;

-- User tidak boleh mengubah role / sekolah / status miliknya sendiri
-- (tanpa ini ortu bisa menjadikan dirinya super_admin lewat API).
-- Service role (auth.uid() NULL) dan super_admin tetap boleh.
CREATE OR REPLACE FUNCTION protect_user_columns() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND COALESCE(auth_role(), '') <> 'super_admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.school_id IS DISTINCT FROM OLD.school_id
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Tidak diizinkan mengubah role, sekolah, status, atau email';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protect_user_columns ON users;
CREATE TRIGGER trg_protect_user_columns
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION protect_user_columns();

-- Akun dibuat lewat server (service role), bukan dari browser
DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth_role() = 'super_admin');

-- Guru tidak boleh mengubah plan / masa aktif sekolah sendiri (bypass lisensi)
DROP POLICY IF EXISTS "schools_manage" ON schools;
CREATE POLICY "schools_manage" ON schools FOR ALL
  USING (auth_role() = 'super_admin') WITH CHECK (auth_role() = 'super_admin');

-- Guru hanya kelola kelas miliknya
DROP POLICY IF EXISTS "classes_manage" ON classes;
CREATE POLICY "classes_manage" ON classes FOR ALL USING (
  auth_role() = 'super_admin'
  OR (auth_role() = 'teacher' AND school_id = auth_school_id() AND homeroom_teacher_id = auth.uid())
) WITH CHECK (
  auth_role() = 'super_admin'
  OR (auth_role() = 'teacher' AND school_id = auth_school_id() AND homeroom_teacher_id = auth.uid())
);

-- Guru hanya kelola siswa di kelas miliknya
DROP POLICY IF EXISTS "students_manage" ON students;
CREATE POLICY "students_manage" ON students FOR ALL USING (
  auth_role() = 'super_admin'
  OR (auth_role() = 'teacher' AND school_id = auth_school_id()
      AND class_id IN (SELECT id FROM classes WHERE homeroom_teacher_id = auth.uid()))
) WITH CHECK (
  auth_role() = 'super_admin'
  OR (auth_role() = 'teacher' AND school_id = auth_school_id()
      AND class_id IN (SELECT id FROM classes WHERE homeroom_teacher_id = auth.uid()))
);

-- Guru lihat relasi ortu-siswa di kelasnya
DROP POLICY IF EXISTS "student_parents_select" ON student_parents;
CREATE POLICY "student_parents_select" ON student_parents FOR SELECT USING (
  user_id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() = 'teacher' AND student_id IN (SELECT auth_accessible_student_ids()))
);

-- Ortu hanya boleh lihat nama & WA guru, bukan data ortu lain
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT USING (
  id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() = 'teacher' AND school_id = auth_school_id())
  OR (auth_role() = 'parent' AND school_id = auth_school_id() AND role = 'teacher')
);
