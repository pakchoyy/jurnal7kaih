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
