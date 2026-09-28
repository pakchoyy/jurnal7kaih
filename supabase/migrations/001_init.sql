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
