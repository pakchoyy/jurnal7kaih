-- ============================================================
-- seed_demo.sql — Data awal untuk mencoba aplikasi
-- Jalankan SETELAH 001_init.sql, 002_seed.sql, 003_rls.sql
-- Edit bagian "UBAH INI" sesuai kebutuhan, lalu jalankan seluruhnya
-- di Supabase Dashboard -> SQL Editor.
-- ============================================================

-- ===================== UBAH INI ============================
-- Nama & kode sekolah
\set school_name 'SMP Nusantara Hebat'
\set school_code 'SMP001'

-- Akun admin & guru (ganti password di production!)
-- super admin : super@demo.id  / admin123
-- school admin: admin@demo.id  / admin123
-- guru        : guru@demo.id   / guru123
-- ============================================================

-- ---------- 1. Sekolah ----------
INSERT INTO schools (name, code, address, phone)
VALUES ('SMP Nusantara Hebat', 'SMP001', 'Jl. Pendidikan No. 1, Jakarta', '021-555-0101')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address;

-- ---------- 2. Helper: buat auth user bila belum ada ----------
CREATE OR REPLACE FUNCTION seed_demo_auth_user(
  p_email TEXT, p_password TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = p_email;
  IF v_id IS NOT NULL THEN
    RETURN v_id; -- sudah ada, pakai yang lama
  END IF;

  v_id := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    p_email, crypt(p_password, gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}'
  );
  RETURN v_id;
END;
$$;

-- ---------- 3. Akun super admin ----------
DO $$
DECLARE v_uid UUID; v_school UUID;
BEGIN
  SELECT id INTO v_school FROM schools WHERE code = 'SMP001';
  v_uid := seed_demo_auth_user('super@demo.id', 'admin123');
  INSERT INTO public.users (id, school_id, name, email, role, status)
  VALUES (v_uid, v_school, 'Super Admin', 'super@demo.id', 'super_admin', 'active')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ---------- 4. Akun school admin ----------
DO $$
DECLARE v_uid UUID; v_school UUID;
BEGIN
  SELECT id INTO v_school FROM schools WHERE code = 'SMP001';
  v_uid := seed_demo_auth_user('admin@demo.id', 'admin123');
  INSERT INTO public.users (id, school_id, name, email, role, status)
  VALUES (v_uid, v_school, 'Admin Sekolah', 'admin@demo.id', 'school_admin', 'active')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ---------- 5. Akun guru (wali kelas) ----------
DO $$
DECLARE v_uid UUID; v_school UUID;
BEGIN
  SELECT id INTO v_school FROM schools WHERE code = 'SMP001';
  v_uid := seed_demo_auth_user('guru@demo.id', 'guru123');
  INSERT INTO public.users (id, school_id, name, email, phone, role, status)
  VALUES (v_uid, v_school, 'Bu Sari', 'guru@demo.id', '0812-3456-7890', 'teacher', 'active')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ---------- 6. Tahun ajaran ----------
INSERT INTO academic_years (school_id, name, start_date, end_date, is_active)
SELECT s.id, '2024/2025', '2024-07-15', '2025-06-30', TRUE
FROM schools s WHERE s.code = 'SMP001'
AND NOT EXISTS (
  SELECT 1 FROM academic_years ay WHERE ay.school_id = s.id AND ay.name = '2024/2025'
);

-- ---------- 7. Kelas 7A dengan wali kelas Bu Sari ----------
DO $$
DECLARE
  v_school UUID; v_year UUID; v_guru UUID; v_class UUID;
BEGIN
  SELECT id INTO v_school FROM schools WHERE code = 'SMP001';
  SELECT id INTO v_year FROM academic_years WHERE school_id = v_school AND name = '2024/2025';
  SELECT id INTO v_guru FROM public.users WHERE email = 'guru@demo.id';

  SELECT id INTO v_class FROM classes WHERE school_id = v_school AND name = '7A';
  IF v_class IS NULL THEN
    INSERT INTO classes (school_id, academic_year_id, name, grade, homeroom_teacher_id)
    VALUES (v_school, v_year, '7A', 7, v_guru)
    RETURNING id INTO v_class;
  END IF;

  -- ---------- 8. Siswa contoh ----------
  INSERT INTO students (school_id, class_id, student_number, nisn, name, gender)
  VALUES
    (v_school, v_class, '2401', '0012345671', 'Ahmad Fauzi', 'L'),
    (v_school, v_class, '2402', '0012345672', 'Bunga Lestari', 'P'),
    (v_school, v_class, '2403', '0012345673', 'Citra Dewi', 'P'),
    (v_school, v_class, '2404', '0012345674', 'Dimas Prakoso', 'L'),
    (v_school, v_class, '2405', '0012345675', 'Eka Putri', 'P')
  ON CONFLICT (school_id, student_number) DO NOTHING;
END $$;

-- ---------- 9. Kode aktivasi untuk siswa pertama ----------
DO $$
DECLARE
  v_school UUID; v_student UUID; v_admin UUID;
BEGIN
  SELECT id INTO v_school FROM schools WHERE code = 'SMP001';
  SELECT id INTO v_student FROM students
    WHERE school_id = v_school AND student_number = '2401';
  SELECT id INTO v_admin FROM public.users WHERE email = 'admin@demo.id';

  INSERT INTO parent_activation_codes (school_id, student_id, code, created_by)
  VALUES (v_school, v_student, 'DEMO1234', v_admin)
  ON CONFLICT (code) DO NOTHING;
END $$;

-- ---------- 10. Bersihkan helper ----------
DROP FUNCTION IF EXISTS seed_demo_auth_user(TEXT, TEXT);

-- ============================================================
-- SELESAI! Ringkasan akun demo:
--   Super Admin  : super@demo.id / admin123
--   School Admin : admin@demo.id / admin123
--   Guru (7A)    : guru@demo.id  / guru123
--   Kode aktivasi siswa "Ahmad Fauzi": DEMO1234
-- ============================================================
