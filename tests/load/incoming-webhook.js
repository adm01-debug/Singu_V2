import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
  },
};

const BASE_URL = __ENV.SUPABASE_URL;
const WEBHOOK_TOKEN = __ENV.WEBHOOK_TOKEN;

export default function () {
  const payload = {
    event: 'load-test',
    data: { id: __VU * 1000 + __ITER, ts: Date.now() },
  };

  const res = http.post(
    `${BASE_URL}/functions/v1/incoming-webhook?token=${WEBHOOK_TOKEN}`,
    JSON.stringify(payload),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'status 200 or 202': (r) => r.status === 200 || r.status === 202,
  });

  sleep(0.5);
}
