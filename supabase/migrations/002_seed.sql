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
