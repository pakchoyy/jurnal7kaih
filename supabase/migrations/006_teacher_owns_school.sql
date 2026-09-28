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
