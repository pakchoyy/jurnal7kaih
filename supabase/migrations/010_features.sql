-- ============================================================
-- 010_features.sql — chat per jurnal, foto kegiatan, kepala sekolah,
-- notifikasi. Aman dijalankan ulang.
-- ============================================================

-- Chat guru–ortu per jurnal
CREATE TABLE IF NOT EXISTS journal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journal_messages_journal ON journal_messages(journal_id, created_at);
ALTER TABLE journal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_messages_select" ON journal_messages;
CREATE POLICY "journal_messages_select" ON journal_messages FOR SELECT USING (
  journal_id IN (SELECT id FROM journals)
);
DROP POLICY IF EXISTS "journal_messages_insert" ON journal_messages;
CREATE POLICY "journal_messages_insert" ON journal_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND journal_id IN (SELECT id FROM journals)
);

-- Foto kegiatan (file di bucket privat, diunggah lewat server)
CREATE TABLE IF NOT EXISTS journal_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journal_photos_journal ON journal_photos(journal_id);
ALTER TABLE journal_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_photos_select" ON journal_photos;
CREATE POLICY "journal_photos_select" ON journal_photos FOR SELECT USING (
  journal_id IN (SELECT id FROM journals)
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('journal-photos', 'journal-photos', FALSE, 2097152, ARRAY['image/jpeg', 'image/webp', 'image/png'])
ON CONFLICT (id) DO NOTHING;
