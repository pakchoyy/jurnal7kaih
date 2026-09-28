# Jurnal 7 Kebiasaan Anak Indonesia Hebat (7Kaih) — Full Context for AI Coding

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS + Storage)
- **Deploy**: Vercel (frontend) + Supabase cloud (DB/auth)

---

## Roles
| Role | Akses |
|---|---|
| `super_admin` | Kelola semua sekolah |
| `school_admin` | Kelola 1 sekolah (kelas, guru, siswa, generate kode aktivasi) |
| `teacher` | Lihat rekap jurnal kelas, beri catatan |
| `parent` | Isi jurnal harian anaknya |

**TIDAK ADA akun siswa.** Siswa hanya ada di tabel `students` sebagai data, bukan user.

Orang tua **tidak bisa self-register**. Mereka aktifkan akun via kode unik yang di-generate school_admin.

---

## Database Schema (PostgreSQL / Supabase)

> **Catatan migrasi**: urutan CREATE di bawah sudah dependency-safe. Jalankan seluruh blok dalam satu transaksi. `gen_random_uuid()` tersedia via extension `pgcrypto` (aktif default di Supabase). Jalankan `CREATE EXTENSION IF NOT EXISTS pgcrypto;` di awal untuk aman.

```sql
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
  code TEXT UNIQUE NOT NULL, -- kode unik sekolah
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (semua role)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
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

-- Tahun ajaran
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL, -- e.g. "2024/2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kelas
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  name TEXT NOT NULL, -- e.g. "7A", "8B"
  grade INTEGER NOT NULL, -- 7, 8, atau 9
  homeroom_teacher_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, academic_year_id, name) -- cegah nama kelas dobel di tahun ajaran sama
);

-- Siswa
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  class_id UUID REFERENCES classes(id),
  student_number TEXT, -- NIS
  nisn TEXT, -- NISN nasional
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('L', 'P')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, student_number) -- NIS unik per sekolah (boleh NULL)
);

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_class ON students(class_id);

-- Relasi siswa-orang tua (NO separate parents table)
CREATE TABLE student_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  user_id UUID NOT NULL REFERENCES users(id), -- user dengan role='parent'
  relationship TEXT NOT NULL CHECK (relationship IN ('Ayah', 'Ibu', 'Wali')),
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, user_id) -- cegah link dobel
);

CREATE INDEX idx_student_parents_user ON student_parents(user_id);
CREATE INDEX idx_student_parents_student ON student_parents(student_id);

-- Kode aktivasi orang tua
CREATE TABLE parent_activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  student_id UUID NOT NULL REFERENCES students(id),
  code TEXT UNIQUE NOT NULL, -- 8 karakter alphanumeric uppercase
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  used_at TIMESTAMPTZ, -- null = belum dipakai
  used_by UUID REFERENCES users(id), -- siapa yang memakai (audit)
  created_by UUID REFERENCES users(id), -- school_admin yang generate
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activation_codes_school ON parent_activation_codes(school_id);
CREATE INDEX idx_activation_codes_student ON parent_activation_codes(student_id);
CREATE INDEX idx_activation_codes_code ON parent_activation_codes(code);

-- 7 Kebiasaan (seed data, tidak hardcode di frontend)
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- bangun-pagi, beribadah, dst
  description TEXT,
  icon TEXT, -- emoji atau icon name
  color TEXT, -- hex color
  sort_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jurnal harian (1 per anak per hari)
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id), -- WAJIB untuk RLS
  student_id UUID NOT NULL REFERENCES students(id),
  journal_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  parent_note TEXT, -- catatan bebas dari orang tua
  created_by UUID NOT NULL REFERENCES users(id), -- user_id orang tua yang ngisi
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ, -- diisi saat guru membuka/menandai jurnal sudah ditinjau
  reviewed_by UUID REFERENCES users(id), -- guru yang meninjau
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
  note TEXT, -- data spesifik per habit (JSON string atau free text)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(journal_id, habit_id)
);

CREATE INDEX idx_journal_entries_journal ON journal_entries(journal_id);
CREATE INDEX idx_journal_entries_habit ON journal_entries(habit_id);

-- Catatan guru
CREATE TABLE teacher_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  student_id UUID NOT NULL REFERENCES students(id),
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_notes_school ON teacher_notes(school_id);
CREATE INDEX idx_teacher_notes_student ON teacher_notes(student_id);
CREATE INDEX idx_teacher_notes_journal ON teacher_notes(journal_id);

-- Trigger updated_at (semua tabel yang punya kolom updated_at)
CREATE TRIGGER trg_schools_updated    BEFORE UPDATE ON schools           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated      BEFORE UPDATE ON users             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_classes_updated    BEFORE UPDATE ON classes           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_students_updated   BEFORE UPDATE ON students          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_habits_updated     BEFORE UPDATE ON habits            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_journals_updated   BEFORE UPDATE ON journals          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_journal_entries_updated BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_teacher_notes_updated BEFORE UPDATE ON teacher_notes  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### Seed Data: 7 Habits
```sql
INSERT INTO habits (name, slug, description, icon, color, sort_order) VALUES
('Bangun Pagi', 'bangun-pagi', 'Bangun di waktu pagi, idealnya sebelum atau saat subuh', '🌅', '#F5A623', 1),
('Beribadah', 'beribadah', 'Rutinitas ibadah sesuai agama/keyakinan masing-masing', '🙏', '#8B5CF6', 2),
('Berolahraga', 'berolahraga', 'Aktivitas fisik untuk kebugaran, kesehatan, dan kualitas hidup', '🏃', '#22C55E', 3),
('Makan Sehat', 'makan-sehat', 'Pola makan teratur bergizi seimbang sesuai Isi Piringku', '🥗', '#0EA5A0', 4),
('Gemar Belajar', 'gemar-belajar', 'Kebiasaan menambah pengetahuan dan keterampilan dengan senang dan antusias', '📚', '#1A5FBA', 5),
('Bermasyarakat', 'bermasyarakat', 'Interaksi sosial, kerja sama, keterlibatan dalam kegiatan sosial/budaya/lingkungan', '🤝', '#EC4899', 6),
('Tidur Cepat', 'tidur-cepat', 'Tidur tepat waktu, tidak larut malam, sesuai kebutuhan ideal waktu tidur anak', '😴', '#5B6EC8', 7)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;
```

---

## Field Jurnal Per Kebiasaan

Data spesifik per habit disimpan di `journal_entries.note` sebagai **JSON string**. Key WAJIB persis seperti di bawah (snake_case) — validasi bentuk di app layer sebelum simpan (Zod schema per habit). `status` entry (`done`/`not_done`) terpisah dari `note`; kalau `not_done`, `note` boleh `null`.

> **Kontrak umum**: semua form mengirim `{ "status": "done" | "not_done", "note": <object JSON di bawah> }`. Frontend men-`JSON.stringify` objek sebelum INSERT/UPDATE.

### A. Bangun Pagi 🌅
```json
{ "wake_time": "05:00" }
```
UI: Time picker "Jam bangun pagi". Format `HH:mm` 24 jam.

### B. Beribadah 🙏
```json
{ "activities": ["Sholat Subuh", "Sholat Dzuhur", "Sholat Ashar"] }
```
UI: Checkbox list aktivitas ibadah. **Daftar item harus sesuai agama/keyakinan** — sediakan daftar berbeda (mis. Islam: sholat 5 waktu/mengaji; Kristen/Katolik: doa pagi, baca Alkitab, ibadah; Hindu/Buddha: sembahyang/meditasi) dan boleh free-text tambahan. Simpan sebagai array string.

### C. Berolahraga 🏃
```json
{ "activity": "Lari pagi", "feeling": "Segar dan semangat" }
```
UI: Input text "Olahraga apa?" + input "Perasaan/pencapaian" (opsional).

### D. Makan Sehat 🥗
```json
{
  "breakfast": "Nasi + telur + susu",
  "lunch": "Nasi + ayam + sayur",
  "dinner": "Nasi + ikan + tempe"
}
```
UI: 3 input text (sarapan / makan siang / makan malam). Semua field opsional, simpan hanya yang diisi.

### E. Gemar Belajar 📚
```json
{ "subject": "Matematika — soal persamaan linear", "duration": "45 menit" }
```
UI: Input "Belajar apa?" + input "Berapa lama?". `duration` free text.

### F. Bermasyarakat 🤝
```json
{ "activity": "Kerja bakti bersih-bersih lingkungan RT" }
```
UI: Input text "Kegiatan bermasyarakat apa?"

### G. Tidur Cepat 😴
```json
{ "sleep_time": "21:00" }
```
UI: Time picker "Jam tidur malam"

---

## Design System

### Colors
```
Brand Blue:     #1A5FBA
Yellow Accent:  #F5A623
Teal:           #0EA5A0
Green Done:     #22C55E
Dark Text:      #1A1D2E

Habit Colors:
  Bangun Pagi:    #F5A623 (kuning)
  Beribadah:      #8B5CF6 (ungu)
  Berolahraga:    #22C55E (hijau)
  Makan Sehat:    #0EA5A0 (teal)
  Gemar Belajar:  #1A5FBA (biru)
  Bermasyarakat:  #EC4899 (pink)
  Tidur Cepat:    #5B6EC8 (biru-ungu)
```

### Typography
- Display/Heading: **Nunito** weight 800-900
- Body/UI: **Inter** weight 400-600

### Radius
- Card: 16px
- Button: 14px
- Large card/modal: 24px

### Navigation (Parent)
Bottom tab bar: Beranda | Jurnal | Riwayat | Profil

---

## Key Business Logic

### 1. Aktivasi orang tua (Auth Admin API) & Tambah Anak (RPC)

**A. Ortu baru (belum punya akun)**
Karena ortu tidak login saat aktivasi, pembuatan akun dilakukan lewat **server action** dengan Supabase **Auth Admin API** (service role) — atomik & tidak bisa dimanipulasi client. Detail kode di bagian "Aktivasi & Tambah Anak".

1. School admin generate kode 8 karakter alfanumerik uppercase → simpan di `parent_activation_codes` (isi `created_by`, `expires_at` default +30 hari).
2. Kode dibagikan ke ortu (cetak/kirim).
3. Ortu buka `/aktivasi`, isi: **kode + nama + email + password + hubungan (Ayah/Ibu/Wali)**.
4. Server action: validasi kode → `auth.admin.createUser({ email_confirm: true })` → insert `public.users` (role parent) → insert `student_parents` → tandai kode `used_at`/`used_by`.
5. Kalau email sudah terdaftar → error "Email sudah terdaftar, silakan login". Kode invalid/expired/terpakai → error spesifik. Gagal di tengah → rollback manual (hapus user).

**B. Ortu punya anak ke-2 dst (sudah login)**
`student_parents` bersifat **many-to-many** → satu akun ortu bisa pegang banyak anak. Ortu buka *Profil → Tambah Anak*, masukkan kode baru, dan panggil RPC `link_child_by_code` (tidak bikin akun baru, hanya link + audit). Dashboard ortu punya **pemilih anak**, form jurnal mengikuti anak yang dipilih.

### 2. Jurnal harian
- **1 jurnal per anak per hari** (UNIQUE `student_id + journal_date`).
- Jurnal dibuat pertama kali saat ortu membuka form isi hari itu (auto-create `status='draft'`), lalu di-update.
- Ortu menekan **Simpan & Kirim** → `status='submitted'`, `submitted_at=NOW()`.
- Ortu hanya bisa mengubah jurnal bersatus `draft`/`submitted` **pada hari itu**; jurnal hari lampau terkunci (tidak bisa diedit).

### 3. Guru & catatan
- Guru **hanya bisa baca** jurnal + memberi `teacher_notes`. Tidak bisa edit jurnal.
- **Definisi "kelas yang diampu"**: saat ini = kelas dengan `homeroom_teacher_id = auth.uid()` (wali kelas). Guru mapel yang bukan wali kelas tidak melihat data. Jika nanti perlu guru mapel, tambahkan tabel relasi `teacher_classes` dan update RLS.
- `status='reviewed'` + `reviewed_at` + `reviewed_by` diisi otomatis saat guru membuka detail jurnal siswa (menandai sudah ditinjau). Opsional/nice-to-have, paling mudah di-set saat guru pertama kali membuka.

### 4. Rekap kelas
On-the-fly query dari `journal_entries` (join ke `journals` + `students`). Tidak ada tabel rekap terpisah. Rekap per hari/minggu difilter `journal_date BETWEEN ...`.

### 5. Streak (dashboard ortu)
- **Definisi**: jumlah hari **berturut-turut** ke belakang dari hari ini di mana jurnal anak bersatus `submitted` atau `reviewed`.
- Hari ini dihitung jika sudah submit; jika belum submit hari ini, streak mulai dari kemarin (tidak langsung reset — grace untuk hari berjalan).
- Kalau ada satu hari penuh (sebelum hari ini) tanpa submit → streak reset ke 0.
- Dihitung on-the-fly dari `journals` (query tanggal-tanggal `submitted` DESC). Tidak ada kolom tersimpan.

### 6. RLS & multi-sekolah
- Semua tabel penting punya `school_id`. Data antar sekolah terisolasi via `school_id` + RLS.
- **Skema hierarki**: super_admin > school_admin (1 sekolah) > teacher (kelas) > parent (anaknya sendiri).
- RLS **lengkap** ada di bagian "RLS Policies" di bawah (semua tabel ter-cover). PENTING: RLS aktif tanpa policy = deny all, jadi jangan lupa semua tabel.

### 7. Validasi note per habit
`journal_entries.note` = JSON string dengan key tetap (lihat "Field Jurnal Per Kebiasaan"). Validasi bentuk dengan Zod schema per habit **sebelum** simpan. Jangan andalkan DB untuk validasi isi JSON.

---

## Folder Structure (Next.js App Router)

```
app/
  (auth)/
    login/page.tsx
    aktivasi/page.tsx        -- orang tua baru aktivasi kode (+ actions.ts)
  (parent)/
    layout.tsx               -- bottom nav
    beranda/page.tsx
    jurnal/page.tsx          -- list jurnal
    jurnal/isi/page.tsx      -- isi jurnal hari ini
    jurnal/[id]/page.tsx     -- detail jurnal
    riwayat/page.tsx
    profil/page.tsx
    profil/tambah-anak/page.tsx -- ortu tambah anak (RPC link_child_by_code)
  (teacher)/
    layout.tsx
    teacher-dashboard/page.tsx -- rekap kelas
    siswa/[id]/page.tsx      -- detail siswa
  (school-admin)/
    layout.tsx
    admin-dashboard/page.tsx
    kelas/page.tsx
    siswa/page.tsx
    guru/page.tsx
    kode-aktivasi/page.tsx
  (super-admin)/
    layout.tsx
    sekolah/page.tsx
lib/
  supabase/
    client.ts                -- browser client (anon key)
    server.ts                -- server client (cookies/SSR)
    admin.ts                 -- SERVICE ROLE client (server-only!)
    types.ts                 -- generated types
  schemas/
    habits.ts                -- Zod schema per habit (validasi note JSON)
  utils.ts
components/
  habits/
    HabitCard.tsx
    BangunPagiForm.tsx
    BeribadahForm.tsx
    BerolahragaForm.tsx
    MakanSehatForm.tsx
    GemarBelajarForm.tsx
    BermasyarakatForm.tsx
    TidurCepatForm.tsx
  forms/
    TimePicker.tsx
    CheckboxGroup.tsx
    TextField.tsx
  ui/
    BottomNav.tsx
    ProgressRing.tsx
    Button.tsx
    Input.tsx
```

---

## RLS Policies (Penting)

> **Wajib**: setiap tabel di bawah harus `ENABLE ROW LEVEL SECURITY`. RLS aktif tanpa policy = **deny all** (query balik kosong / gagal diam-diam). Helper function dipakai untuk hindari rekursi policy di `users`.

```sql
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

-- Daftar student_id yang boleh diakses role saat ini (parent: anaknya; teacher: kelas yang diampu)
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
-- Baca: diri sendiri; super_admin semua; school_admin se-sekolah
CREATE POLICY "users_select" ON users FOR SELECT USING (
  id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
);
-- Update: diri sendiri; school_admin kelola user di sekolahnya
CREATE POLICY "users_update" ON users FOR UPDATE USING (
  id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
) WITH CHECK (
  id = auth.uid()
  OR auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
);
-- Insert: super_admin & school_admin (pembuatan user umum via RPC/trigger, bukan client langsung)
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin')
);

-- ============================================================
-- academic_years (school_admin kelola, guru/parent baca)
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
  OR school_id = auth_school_id()  -- guru & parent boleh baca kelas di sekolahnya
);
CREATE POLICY "classes_manage" ON classes FOR ALL USING (
  auth_role() IN ('super_admin', 'school_admin') AND school_id = auth_school_id()
) WITH CHECK (
  auth_role() IN ('super_admin', 'school_admin') AND school_id = auth_school_id()
);

-- ============================================================
-- students
-- ============================================================
-- Parent: anaknya; Teacher: kelasnya; Admin: sekolahnya
CREATE POLICY "students_select" ON students FOR SELECT USING (
  auth_role() = 'super_admin'
  OR (auth_role() IN ('school_admin') AND school_id = auth_school_id())
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
-- parent_activation_codes (JANGAN akses dari anon; validasi via RPC)
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
-- Tidak ada policy untuk anon → ortu TIDAK bisa baca kode langsung.
-- Aktivasi ortu baru divalidasi di server action (Auth Admin API, service role).
-- Tambah anak (sudah login) lewat RPC link_child_by_code (SECURITY DEFINER).

-- ============================================================
-- habits (read-only untuk semua user login; seed via migration)
-- ============================================================
CREATE POLICY "habits_select" ON habits FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "habits_manage" ON habits FOR ALL USING (
  auth_role() = 'super_admin'
) WITH CHECK (auth_role() = 'super_admin');

-- ============================================================
-- journals
-- ============================================================
-- Parent: SELECT + INSERT/UPDATE anaknya (hanya hari ini untuk edit)
CREATE POLICY "journals_parent" ON journals FOR ALL USING (
  school_id = auth_school_id()
  AND student_id IN (SELECT student_id FROM student_parents WHERE user_id = auth.uid())
) WITH CHECK (
  school_id = auth_school_id()
  AND student_id IN (SELECT student_id FROM student_parents WHERE user_id = auth.uid())
  AND created_by = auth.uid()
);
-- Teacher: read-only kelasnya
CREATE POLICY "journals_teacher_select" ON journals FOR SELECT USING (
  school_id = auth_school_id()
  AND student_id IN (
    SELECT s.id FROM students s JOIN classes c ON s.class_id = c.id
    WHERE c.homeroom_teacher_id = auth.uid()
  )
);
-- Teacher: update terbatas untuk set reviewed_at/reviewed_by (via RPC disarankan)
CREATE POLICY "journals_teacher_review" ON journals FOR UPDATE USING (
  school_id = auth_school_id()
  AND student_id IN (
    SELECT s.id FROM students s JOIN classes c ON s.class_id = c.id
    WHERE c.homeroom_teacher_id = auth.uid()
  )
) WITH CHECK (
  school_id = auth_school_id()
);
-- Admin sekolah: semua di sekolahnya
CREATE POLICY "journals_admin" ON journals FOR ALL USING (
  auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
) WITH CHECK (
  auth_role() = 'super_admin'
  OR (auth_role() = 'school_admin' AND school_id = auth_school_id())
);

-- ============================================================
-- journal_entries (ikuti akses parent-nya journal)
-- ============================================================
CREATE POLICY "journal_entries_access" ON journal_entries FOR ALL USING (
  journal_id IN (SELECT id FROM journals)  -- difilter oleh RLS journals
) WITH CHECK (
  journal_id IN (SELECT id FROM journals)
);
-- Catatan: subquery ke journals otomatis mengikuti RLS journals, sehingga parent/guru
-- hanya bisa akses entry dari jurnal yang boleh mereka lihat.

-- ============================================================
-- teacher_notes
-- ============================================================
-- Guru: insert + baca catatan untuk kelasnya; semua pihak terkait bisa baca
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
```

### Aktivasi & Tambah Anak

### RPC Tambah Anak — `link_child_by_code` (SECURITY DEFINER)

Dipakai ortu yang **sudah login** untuk menambah anak ke-2 dst. **Tidak** membuat akun baru — hanya membuat link di `student_parents`.

```sql
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

  -- Pastikan kode milik sekolah yang sama dengan akun ortu
  IF v_code.school_id <> (SELECT school_id FROM users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Kode bukan dari sekolah anak Anda';
  END IF;

  -- Link anak ke akun yang sedang login (bukan bikin user baru)
  INSERT INTO student_parents (student_id, user_id, relationship)
  VALUES (v_code.student_id, auth.uid(), p_relationship)
  ON CONFLICT (student_id, user_id) DO UPDATE SET relationship = EXCLUDED.relationship;

  -- Tandai kode terpakai
  UPDATE parent_activation_codes SET used_at = NOW(), used_by = auth.uid() WHERE id = v_code.id;

  RETURN v_code.student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION link_child_by_code(TEXT, TEXT) TO authenticated;
```

### Alur Aktivasi Ortu Baru — Auth Admin API (Server Action)

Tidak pakai RPC nulis ke `auth.users`. Pakai **Supabase Auth Admin API** dari server action dengan service role (lihat `lib/supabase/admin.ts`). Lebih aman & resmi.

**`app/(auth)/aktivasi/page.tsx`** → form: kode, nama, email, password, hubungan.
**Server action** (`app/(auth)/aktivasi/actions.ts`):

```ts
'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

export async function activateParent(formData: {
  code: string; name: string; email: string; password: string; relationship: string
}) {
  const admin = createAdminClient() // service role

  // 1) Validasi kode (pakai admin agar bisa baca parent_activation_codes)
  const code = formData.code.trim().toUpperCase()
  const { data: act, error: cErr } = await admin
    .from('parent_activation_codes')
    .select('id, school_id, student_id, used_at, expires_at')
    .eq('code', code)
    .maybeSingle()

  if (cErr || !act) throw new Error('Kode aktivasi tidak ditemukan')
  if (act.used_at) throw new Error('Kode sudah digunakan')
  if (new Date(act.expires_at) < new Date()) throw new Error('Kode sudah kedaluwarsa')
  if (!['Ayah','Ibu','Wali'].includes(formData.relationship)) throw new Error('Hubungan tidak valid')

  // 2) Buat auth user via Admin API (auto-confirm email)
  const { data: created, error: uErr } = await admin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
  })
  if (uErr) {
    if (uErr.message.includes('already')) throw new Error('Email sudah terdaftar, silakan login')
    throw new Error(uErr.message)
  }
  const uid = created.user.id

  // 3) Buat profil + link siswa (satu transaksi logis; rollback manual bila gagal)
  const { error: pErr } = await admin.from('users').insert({
    id: uid, school_id: act.school_id, name: formData.name,
    email: formData.email, role: 'parent', status: 'active',
  })
  if (pErr) { await admin.auth.admin.deleteUser(uid); throw new Error(pErr.message) }

  const { error: lErr } = await admin.from('student_parents').insert({
    student_id: act.student_id, user_id: uid, relationship: formData.relationship,
  })
  if (lErr) {
    await admin.from('users').delete().eq('id', uid)
    await admin.auth.admin.deleteUser(uid)
    throw new Error(lErr.message)
  }

  // 4) Tandai kode terpakai
  await admin.from('parent_activation_codes')
    .update({ used_at: new Date().toISOString(), used_by: uid })
    .eq('id', act.id)

  return { ok: true }
}
```

**Alur "Tambah Anak" (ortu sudah login)** → panggil RPC `link_child_by_code`:
```ts
'use client'
import { createClient } from '@/lib/supabase/client'

export async function tambahAnak(code: string, relationship: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('link_child_by_code', {
    p_code: code, p_relationship: relationship,
  })
  if (error) throw new Error(error.message)
  return data // student_id
}
```

> **Keputusan**: aktivasi ortu baru pakai **Auth Admin API** (aman, resmi, error jelas). Tambah anak pakai **RPC** `link_child_by_code` (tidak bikin user, murni link + audit). Jangan campur kedua pendekatan untuk 1 alur. `SUPABASE_SERVICE_ROLE_KEY` wajib server-only.


---

## Environment Variables

```env
# Client (aman diekspos, prefix NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# SERVER-ONLY — JANGAN pernah import ke client component / prefix NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=
```

> **Peringatan**: `SUPABASE_SERVICE_ROLE_KEY` melewati semua RLS. Hanya boleh dipakai di `lib/supabase/admin.ts` yang di-import oleh server actions / route handlers. Simpan di Vercel Environment Variables (bukan di repo). Tambahkan `.env.local` ke `.gitignore`.

---

## PRD Singkat

**Tujuan**: Aplikasi digital untuk program 7 Kebiasaan Anak Indonesia Hebat (7Kaih) dari Kemendikdasmen. Orang tua mencatat kebiasaan harian anak di rumah; guru memantau dan memberi catatan; school admin kelola data; super admin kelola multi-sekolah.

**Target user**: SMP (bisa dikembangkan ke SD/SMA).

**Fitur MVP**:
- Auth multi-role
- Aktivasi akun orang tua via kode
- Isi jurnal harian per 7 kebiasaan (form berbeda tiap habit)
- Dashboard orang tua: progress hari ini + streak (definisi streak lihat "Key Business Logic" #5)
- Dashboard guru: rekap kelas per hari/minggu + beri catatan
- School admin: kelola siswa, kelas, guru, generate kode aktivasi
