# Deploy ke Cloudflare Workers (vinext)

Worker: `sihebat` -> https://sihebat.pulsachoy.workers.dev, https://trial.sihebat.web.id

## Deploy

`npm run deploy:vinext` **membangun ulang** aplikasi. Variabel `NEXT_PUBLIC_*` ikut
tertanam saat build, jadi harus ada di shell yang sama saat deploy. Kalau kosong,
semua halaman login memberi 500 ("NEXT_PUBLIC_SUPABASE_URL ... belum di-set").

```
export NEXT_PUBLIC_SUPABASE_URL=...        # URL proyek Supabase
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # publishable key (aman publik)
export NEXT_PUBLIC_VAPID_PUBLIC_KEY=...    # HARUS pasangan dari VAPID_PRIVATE_KEY di Worker
export CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=...
npm run deploy:vinext
```

## Secret di Worker (bukan di repo)

`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`
diisi lewat dashboard Cloudflare atau `npx wrangler secret put <NAMA> --name sihebat`.

Mengganti pasangan VAPID memutus langganan notifikasi yang sudah ada: pengguna harus
menyalakan notifikasi lagi.

## Cron pengingat

`worker/entry.ts` menjalankan `/api/cron/pengingat` lewat `scheduled()`.
Jadwal `0 12 * * *` (19.00 WIB) ada di `cloudflare.config.ts`.

## Cara deploy sehari-hari

Deploy dijalankan manual (oleh Claude dari sesi yang punya token Cloudflare, atau dari
komputer sendiri dengan perintah di bagian "Deploy" di atas). Tidak ada deploy otomatis
dari push GitHub.

Workflow GitHub Actions untuk deploy otomatis pernah dibuat di commit `b0d0eb3`
(`.github/workflows/deploy-cloudflare.yml`). Untuk mengaktifkannya lagi: ambil file itu
dari riwayat git, lalu isi secret `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` dan
variable `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_ADMIN_WA` di GitHub (Settings -> Secrets and
variables -> Actions). Gunakan token khusus CI dengan izin Workers Scripts: Edit saja.
