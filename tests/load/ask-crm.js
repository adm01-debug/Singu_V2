import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 3 },
    { duration: '1m', target: 8 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.SUPABASE_URL;
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const JWT = __ENV.USER_JWT;

const QUESTIONS = [
  'Quantos contatos eu tenho?',
  'Quais empresas mais ativas este mês?',
  'Resuma o pipeline atual',
];

export default function () {
  const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  const res = http.post(
    `${BASE_URL}/functions/v1/ask-crm`,
    JSON.stringify({ question }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT}`,
        'apikey': ANON_KEY,
      },
      timeout: '30s',
    },
  );

  check(res, {
    'status 200': (r) => r.status === 200,
  });

  sleep(2);
}
