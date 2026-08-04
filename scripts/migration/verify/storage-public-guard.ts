// storage-public-guard.ts — Falha se buckets públicos não estão no allowlist.
// Uso: node --experimental-strip-types verify/storage-public-guard.ts
//   env: DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ALLOWLIST_FILE = join(__dirname, "storage-public-allowlist.txt");

const SUPABASE_URL = process.env.DEST_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.DEST_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✖ defina DEST_SUPABASE_URL e DEST_SERVICE_ROLE_KEY");
  process.exit(2);
}

const allowlist = new Set<string>(
  existsSync(ALLOWLIST_FILE)
    ? readFileSync(ALLOWLIST_FILE, "utf8")
        .split("\n").map(l => l.trim())
        .filter(l => l && !l.startsWith("#"))
    : []
);

const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
  headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}` },
});
if (!res.ok) {
  console.error(`✖ storage list falhou: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const buckets = (await res.json()) as Array<{ name: string; public: boolean }>;
const publicBuckets = buckets.filter(b => b.public);
console.log(`ℹ ${buckets.length} bucket(s) total, ${publicBuckets.length} público(s)`);

const violations = publicBuckets.filter(b => !allowlist.has(b.name));
if (violations.length === 0) {
  console.log("✔ Nenhum bucket público fora do allowlist");
  process.exit(0);
}
console.error("🚨 Buckets públicos NÃO whitelisted:");
for (const b of violations) console.error(`  - ${b.name}`);
process.exit(1);