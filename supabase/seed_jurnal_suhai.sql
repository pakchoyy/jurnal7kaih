-- ============================================================
-- seed_jurnal_suhai.sql — Isi jurnal acak untuk demo klien
--
-- CARA PAKAI (Supabase Dashboard -> SQL Editor):
--   1. Sesuaikan KONFIGURASI di blok DO bawah bila perlu
--      (email pemilik kelas & rentang tanggal).
--   2. Jalankan SELURUH file sekaligus.
--   3. Lihat hasil SELECT verifikasi di tengah & akhir output.
--   4. Bila error email tidak ketemu, cek Bagian 1a lalu sesuaikan
--      v_user_email. Aman diulang: data rentang target dihapus dulu
--      sebelum diisi (idempoten).
--
-- ISI SKRIP:
--   Bagian 1 : verifikasi user suhai / sekolah / kelas / siswa
--   Bagian 2 : hapus + isi jurnal acak (DO block, 1 transaksi atomik)
--   Bagian 3 : verifikasi hasil
-- ============================================================


-- ==================== BAGIAN 1: VERIFIKASI ====================
-- 1a. User pemilik kelas (harus tepat 1 baris)
SELECT id, name, email, role, school_id
FROM users
WHERE email = 'srifathan683@gmail.com';

-- 1b. Kelas grade 1-6 + jumlah siswa aktif (tahun ajaran aktif bila ada)
SELECT c.grade, c.name AS kelas, COUNT(s.id) AS jumlah_siswa
FROM classes c
LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
WHERE c.school_id = (SELECT school_id FROM users WHERE email = 'srifathan683@gmail.com' LIMIT 1)
  AND c.grade BETWEEN 1 AND 6
GROUP BY c.grade, c.name
ORDER BY c.grade, c.name;

-- 1c. Jurnal yang SUDAH ADA untuk siswa-siswa itu (sebelum & dalam rentang)
SELECT
  COUNT(*) FILTER (WHERE j.journal_date < DATE '2026-07-20') AS sebelum_20_juli_akan_dihapus,
  COUNT(*) FILTER (WHERE j.journal_date BETWEEN DATE '2026-07-20' AND DATE '2026-10-01') AS dalam_rentang_akan_diganti,
  COUNT(*) FILTER (WHERE j.journal_date > DATE '2026-10-01') AS sesudah_1_okt_tidak_disentuh
FROM journals j
JOIN students s ON s.id = j.student_id
JOIN classes c ON c.id = s.class_id
WHERE c.school_id = (SELECT school_id FROM users WHERE email = 'srifathan683@gmail.com' LIMIT 1)
  AND c.grade BETWEEN 1 AND 6;


-- ==================== BAGIAN 2: SEED ACAK ====================
DO $$
DECLARE
  -- ---------- KONFIGURASI (ubah di sini bila perlu) ----------
  v_user_email TEXT := 'srifathan683@gmail.com';
  v_grades       INT[] := ARRAY[1,2,3,4,5,6];
  v_start        DATE  := DATE '2026-07-20';
  v_end          DATE  := DATE '2026-10-01';
  v_day_p        DOUBLE PRECISION := 0.88;  -- peluang suatu hari sekolah terisi
  v_done_p       DOUBLE PRECISION := 0.75;  -- peluang tiap kebiasaan "done"
  -- ------------------------------------------------------------

  v_suhai_id  UUID;
  v_school_id UUID;
  v_year_id   UUID;
  v_days      INT[];
  v_habit     RECORD;
  v_student   RECORD;
  v_d         DATE;
  v_mood      DOUBLE PRECISION;
  v_labels    TEXT[];
  v_items     JSONB;
  v_note      JSONB;
  v_note_txt  TEXT;
  v_parent    UUID;
  v_journal_id UUID;
  v_n_hari    INT := 0;
  v_n_jurnal  INT := 0;
  v_n_hapus_sebelum INT := 0;
  v_n_hapus_rentang INT := 0;

  v_parent_notes TEXT[] := ARRAY[
    'Anak semangat mengisi jurnal hari ini',
    'Mohon bimbingan untuk hafalan surat pendek',
    'Hari ini anak kurang enak badan, istirahat lebih awal',
    'Terima kasih, anak sudah mulai rajin merapikan tempat tidur',
    'Izin, kemarin ada acara keluarga jadi tidur agak malam'
  ];
  v_catatans TEXT[] := ARRAY[
    'Alhamdulillah lancar',
    'Dilakukan bersama ayah',
    'Dilakukan bersama ibu',
    'Sempat malas tapi akhirnya mau',
    'Hujan, jadi olahraga di dalam rumah',
    'Belajar kelompok dengan teman'
  ];
BEGIN
  -- --- 1. Resolve user -> sekolah (harus tepat 1) ---
  SELECT id, school_id INTO v_suhai_id, v_school_id
  FROM users WHERE email = v_user_email;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User email "%" tidak ketemu. Periksa Bagian 1a.', v_user_email;
  END IF;
  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'User % belum terhubung ke sekolah (school_id NULL).', v_user_email;
  END IF;

  -- --- 2. Hari sekolah dari pengaturan (1-5 = Sen-Jum, 1-6 = Sen-Sab) ---
  SELECT CASE WHEN school_days = '1-5'
              THEN ARRAY[1,2,3,4,5]
              ELSE ARRAY[1,2,3,4,5,6] END
    INTO v_days
  FROM schools WHERE id = v_school_id;
  -- Minggu (0) tidak pernah diisi.

  -- --- 3. Tahun ajaran aktif (bila ada) ---
  SELECT id INTO v_year_id FROM academic_years
  WHERE school_id = v_school_id AND is_active LIMIT 1;

  IF NOT EXISTS (
    SELECT 1 FROM students s JOIN classes c ON c.id = s.class_id
    WHERE s.school_id = v_school_id AND s.status = 'active'
      AND c.grade = ANY (v_grades)
      AND (v_year_id IS NULL OR c.academic_year_id = v_year_id)
  ) THEN
    RAISE EXCEPTION 'Tidak ada siswa aktif grade 1-6 di sekolah user %.', v_user_email;
  END IF;

  -- --- 4. Bersihkan: sebelum 20 Juli HARUS kosong; rentang target di-reset ---
  DELETE FROM journals j USING students s, classes c
  WHERE j.student_id = s.id AND s.class_id = c.id
    AND c.school_id = v_school_id AND c.grade = ANY (v_grades)
    AND (v_year_id IS NULL OR c.academic_year_id = v_year_id)
    AND j.journal_date < v_start;
  GET DIAGNOSTICS v_n_hapus_sebelum = ROW_COUNT;

  DELETE FROM journals j USING students s, classes c
  WHERE j.student_id = s.id AND s.class_id = c.id
    AND c.school_id = v_school_id AND c.grade = ANY (v_grades)
    AND (v_year_id IS NULL OR c.academic_year_id = v_year_id)
    AND j.journal_date BETWEEN v_start AND v_end;
  GET DIAGNOSTICS v_n_hapus_rentang = ROW_COUNT;

  RAISE NOTICE 'Hapus: % jurnal sebelum 20 Juli, % jurnal dalam rentang (reset).',
    v_n_hapus_sebelum, v_n_hapus_rentang;

  -- --- 5. Isi acak per siswa per hari sekolah ---
  FOR v_student IN
    SELECT s.id, s.name, c.name AS kelas
    FROM students s JOIN classes c ON c.id = s.class_id
    WHERE s.school_id = v_school_id AND s.status = 'active'
      AND c.grade = ANY (v_grades)
      AND (v_year_id IS NULL OR c.academic_year_id = v_year_id)
    ORDER BY c.grade, c.name, s.name
  LOOP
    -- created_by: ortu terhubung (bila ada), fallback user suhai
    SELECT sp.user_id INTO v_parent
    FROM student_parents sp
    WHERE sp.student_id = v_student.id
    ORDER BY sp.is_primary DESC NULLS LAST
    LIMIT 1;
    IF v_parent IS NULL THEN v_parent := v_suhai_id; END IF;

    FOR v_d IN SELECT (g::date) FROM generate_series(v_start, v_end, INTERVAL '1 day') g
    LOOP
      -- Lewati: bukan hari sekolah / hari libur kalender sekolah
      IF NOT (EXTRACT(DOW FROM v_d)::int = ANY (v_days)) THEN CONTINUE; END IF;
      IF EXISTS (SELECT 1 FROM school_holidays h
                 WHERE h.school_id = v_school_id
                   AND v_d BETWEEN h.start_date AND h.end_date) THEN CONTINUE; END IF;

      -- Tidak semua hari terisi (biar acak & alami)
      IF random() >= v_day_p THEN CONTINUE; END IF;

      -- "Mood" harian: peluang done naik-turun tiap hari
      v_mood := random() * 0.30 - 0.15;

      INSERT INTO journals (school_id, student_id, journal_date, status, parent_note, created_by, submitted_at)
      VALUES (
        v_school_id, v_student.id, v_d, 'submitted',
        CASE WHEN random() < 0.18
             THEN v_parent_notes[1 + floor(random() * array_length(v_parent_notes, 1))::int]
             ELSE NULL END,
        v_parent,
        v_d::timestamptz + make_interval(hours => (6 + random() * 13)::int, mins => floor(random() * 60)::int)
      )
      RETURNING id INTO v_journal_id;
      v_n_jurnal := v_n_jurnal + 1;

      FOR v_habit IN
        SELECT id AS habit_id, slug FROM habits WHERE is_active ORDER BY sort_order
      LOOP
        IF random() < v_done_p + v_mood THEN
          -- Ambil label: custom sekolah bila ada, else bawaan
          SELECT array_agg(label ORDER BY sort_order) INTO v_labels
          FROM school_habit_items
          WHERE school_id = v_school_id AND habit_id = v_habit.habit_id;
          IF v_labels IS NULL OR array_length(v_labels, 1) IS NULL THEN
            v_labels := CASE v_habit.slug
              WHEN 'bangun-pagi' THEN ARRAY['Bangun sebelum jam 05.30','Merapikan tempat tidur','Mandi pagi','Sarapan']
              WHEN 'beribadah' THEN ARRAY['Ibadah wajib','Berdoa sebelum & sesudah kegiatan','Membaca kitab suci','Bersyukur']
              WHEN 'berolahraga' THEN ARRAY['Jalan / lari pagi','Bersepeda','Senam','Main bola','Lompat tali','Renang']
              WHEN 'makan-sehat' THEN ARRAY['Sarapan','Makan sayur','Makan buah','Minum air putih cukup','Tidak jajan sembarangan']
              WHEN 'gemar-belajar' THEN ARRAY['Mengulang pelajaran','Mengerjakan PR','Membaca buku 15 menit','Menghafal']
              WHEN 'bermasyarakat' THEN ARRAY['Membantu orang tua','Membantu teman / tetangga','Kerja bakti','Menyapa & bersikap sopan']
              WHEN 'tidur-cepat' THEN ARRAY['Tidur sebelum jam 21.00','Tanpa HP 1 jam sebelum tidur','Gosok gigi','Berdoa sebelum tidur']
              ELSE ARRAY['Dilakukan'] END;
          END IF;

          -- Subset acak 1-3 pilihan
          SELECT COALESCE(jsonb_agg(l), '[]'::jsonb) INTO v_items
          FROM (SELECT unnest(v_labels) AS l ORDER BY random()
                LIMIT (1 + floor(random() * LEAST(3, array_length(v_labels, 1))))::int) s;

          v_note := jsonb_build_object('items', v_items);

          -- Detail acak per kebiasaan (kadang-kadang)
          IF v_habit.slug = 'bangun-pagi' AND random() < 0.5 THEN
            v_note := v_note || jsonb_build_object('wake_time',
              '0' || (4 + floor(random() * 2))::int::text || ':' || lpad(floor(random() * 60)::text, 2, '0'));
          ELSIF v_habit.slug = 'tidur-cepat' AND random() < 0.5 THEN
            v_note := v_note || jsonb_build_object('sleep_time',
              (19 + floor(random() * 3))::int::text || ':' || lpad(floor(random() * 60)::text, 2, '0'));
          ELSIF v_habit.slug = 'gemar-belajar' AND random() < 0.4 THEN
            v_note := v_note || jsonb_build_object(
              'subject', (ARRAY['Matematika','Bahasa Indonesia','IPA','Mengaji','Bahasa Inggris'])[1 + floor(random() * 5)::int],
              'duration', (15 + floor(random() * 4) * 15)::int::text || ' menit');
          ELSIF v_habit.slug = 'berolahraga' AND random() < 0.35 THEN
            v_note := v_note || jsonb_build_object(
              'activity', (ARRAY['Lari pagi','Senam','Bersepeda','Main bola'])[1 + floor(random() * 4)::int]);
          ELSIF v_habit.slug = 'makan-sehat' AND random() < 0.3 THEN
            v_note := v_note || jsonb_build_object(
              'breakfast', (ARRAY['Nasi + telur','Bubur ayam','Roti + susu','Nasi goreng'])[1 + floor(random() * 4)::int]);
          ELSIF v_habit.slug = 'bermasyarakat' AND random() < 0.3 THEN
            v_note := v_note || jsonb_build_object(
              'activity', (ARRAY['Membantu ibu masak','Menyapu halaman','Membantu adik belajar'])[1 + floor(random() * 3)::int]);
          END IF;

          -- Catatan singkat, kadang-kadang
          IF random() < 0.25 THEN
            v_note := v_note || jsonb_build_object('catatan',
              v_catatans[1 + floor(random() * array_length(v_catatans, 1))::int]);
          END IF;

          v_note_txt := v_note::text;
        ELSE
          v_note_txt := NULL;  -- not_done tanpa detail
        END IF;

        INSERT INTO journal_entries (journal_id, habit_id, status, note)
        VALUES (v_journal_id, v_habit.habit_id,
                CASE WHEN v_note_txt IS NULL THEN 'not_done' ELSE 'done' END,
                v_note_txt);
      END LOOP;
    END LOOP;
  END LOOP;

  -- --- 6. Ringkasan ---
  SELECT COUNT(DISTINCT journal_date) INTO v_n_hari
  FROM journals WHERE school_id = v_school_id AND journal_date BETWEEN v_start AND v_end;

  RAISE NOTICE 'SELESAI: % jurnal pada % tanggal berbeda (% - %).', v_n_jurnal, v_n_hari, v_start, v_end;
END $$;


-- ==================== BAGIAN 3: VERIFIKASI HASIL ====================
-- 3a. Harus NOL (sebelum 20 Juli kosong)
SELECT COUNT(*) AS jurnal_sebelum_20_juli_harus_nol
FROM journals j
JOIN students s ON s.id = j.student_id
JOIN classes c ON c.id = s.class_id
WHERE c.school_id = (SELECT school_id FROM users WHERE email = 'srifathan683@gmail.com' LIMIT 1)
  AND c.grade BETWEEN 1 AND 6
  AND j.journal_date < DATE '2026-07-20';

-- 3b. Rekap per kelas dalam rentang
SELECT c.grade, c.name AS kelas, COUNT(DISTINCT s.id) AS siswa, COUNT(j.id) AS jurnal
FROM classes c
JOIN students s ON s.class_id = c.id AND s.status = 'active'
LEFT JOIN journals j ON j.student_id = s.id
  AND j.journal_date BETWEEN DATE '2026-07-20' AND DATE '2026-10-01'
WHERE c.school_id = (SELECT school_id FROM users WHERE email = 'srifathan683@gmail.com' LIMIT 1)
  AND c.grade BETWEEN 1 AND 6
GROUP BY c.grade, c.name
ORDER BY c.grade, c.name;

-- 3c. Variasi: contoh 1 siswa, 10 hari pertama (done per hari harus beda-beda)
SELECT j.journal_date,
       COUNT(*) FILTER (WHERE je.status = 'done') AS done_dari_7,
       j.status
FROM journals j
JOIN journal_entries je ON je.journal_id = j.id
WHERE j.student_id = (
  SELECT s.id FROM students s JOIN classes c ON c.id = s.class_id
  WHERE c.school_id = (SELECT school_id FROM users WHERE email = 'srifathan683@gmail.com' LIMIT 1)
    AND c.grade BETWEEN 1 AND 6 AND s.status = 'active'
  ORDER BY s.name LIMIT 1
)
AND j.journal_date BETWEEN DATE '2026-07-20' AND DATE '2026-10-01'
GROUP BY j.journal_date, j.status
ORDER BY j.journal_date
LIMIT 10;
