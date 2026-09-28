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
