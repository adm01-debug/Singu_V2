import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // ramp-up
    { duration: '1m', target: 10 },   // steady load
    { duration: '30s', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // <1% errors
    http_req_duration: ['p(95)<2000'], // 95% < 2s
  },
};

const BASE_URL = __ENV.SUPABASE_URL;
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const JWT = __ENV.USER_JWT;

export default function () {
  const res = http.post(
    `${BASE_URL}/functions/v1/external-data`,
    JSON.stringify({ action: 'list', table: 'companies', limit: 50 }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT}`,
        'apikey': ANON_KEY,
      },
    },
  );

  check(res, {
    'status 200': (r) => r.status === 200,
    'has data': (r) => {
      try { return Array.isArray(JSON.parse(r.body).data); }
      catch { return false; }
    },
  });

  sleep(1);
}
