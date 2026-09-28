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
