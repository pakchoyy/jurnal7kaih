import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "sihebat",
    entrypoint: "./worker/entry.ts",
    compatibilityDate: "2026-11-06",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    // 12:00 UTC = 19:00 WIB, sama dengan jadwal di vercel.json
    triggers: [triggers.scheduled({ schedule: "0 12 * * *" })],
    env: {
      ASSETS: bindings.assets(),
    },
  }),
});
