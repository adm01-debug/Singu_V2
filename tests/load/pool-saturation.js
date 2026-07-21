// Connection Pool Saturation Simulator — k6.
// Ramp 0→500 VUs em 60s durante janela de cutover simulada. Valida que o
// pgbouncer/supavisor não colapsa e que p99 fica < 500ms.
//
// Uso: k6 run -e BASE_URL=$DEST_SUPABASE_URL -e ANON_KEY=$SUPABASE_ANON_KEY tests/load/pool-saturation.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const p99 = new Trend("query_latency", true);
const errors = new Rate("query_errors");

export const options = {
  scenarios: {
    ramp_to_500: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "60s", target: 500 },   // ramp up
        { duration: "120s", target: 500 },  // sustain
        { duration: "30s", target: 0 },     // ramp down
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    "query_latency": ["p(99)<500"],
    "query_errors":  ["rate<0.01"],
    "http_req_failed": ["rate<0.01"],
  },
};

const BASE = __ENV.BASE_URL;
const KEY  = __ENV.ANON_KEY;

if (!BASE || !KEY) {
  throw new Error("BASE_URL e ANON_KEY obrigatórios (k6 run -e ...)");
}

const HEADERS = {
  "apikey": KEY,
  "Authorization": `Bearer ${KEY}`,
  "Accept-Profile": "public",
};

export default function () {
  // Query leve, com index (não é benchmark de app; é saturação de pool).
  const url = `${BASE}/rest/v1/feature_flags?select=key,enabled&limit=1`;
  const t0 = Date.now();
  const res = http.get(url, { headers: HEADERS, timeout: "10s" });
  p99.add(Date.now() - t0);

  const ok = check(res, {
    "status 200": (r) => r.status === 200,
    "body é array": (r) => {
      try { return Array.isArray(r.json()); } catch { return false; }
    },
  });
  errors.add(!ok);
  sleep(0.05);
}

export function handleSummary(data) {
  return { stdout: JSON.stringify(data.metrics, null, 2) };
}