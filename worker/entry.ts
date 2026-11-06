import vinextHandler from "vinext/server/fetch-handler";

interface Env {
  CRON_SECRET?: string;
  [key: string]: unknown;
}

// Pengingat jurnal harian: memanggil route yang sama dengan cron Vercel sebelumnya
// (app/api/cron/pengingat), lewat handler aplikasi sendiri tanpa jaringan.
async function runPengingat(env: Env, ctx: ExecutionContext) {
  if (!env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET belum di-set di Worker");
    return;
  }
  const req = new Request("https://sihebat.web.id/api/cron/pengingat", {
    headers: { authorization: `Bearer ${env.CRON_SECRET}` },
  });
  const res = await (vinextHandler as { fetch: (r: Request, e: Env, c: ExecutionContext) => Promise<Response> }).fetch(req, env, ctx);
  console.log(`[cron] pengingat: ${res.status} ${await res.text()}`);
}

// Satu alamat resmi: www dialihkan ke apex supaya aplikasi terpasang dan langganan
// notifikasi tidak terpecah di dua origin (sama seperti pengalihan di Vercel).
function redirectWww(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.hostname !== "www.sihebat.web.id") return null;
  url.hostname = "sihebat.web.id";
  return Response.redirect(url.toString(), 308);
}

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
    redirectWww(request) ??
    (vinextHandler as { fetch: (r: Request, e: Env, c: ExecutionContext) => Promise<Response> }).fetch(request, env, ctx),
  scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runPengingat(env, ctx));
  },
};
