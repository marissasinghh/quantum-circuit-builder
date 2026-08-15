import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    ramp_to_classroom: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },   // small group
        { duration: '30s', target: 15 },  // half class
        { duration: '1m', target: 30 },   // full classroom
        { duration: '30s', target: 0 },   // cooldown
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

const payload = JSON.stringify({
  gates: ["CNOT"],
  qubit_order: ["C1_T0"],
  number_of_qubits: 2,
  target_unitary: "CNOT_FLIPPED",
});

const params = { headers: { 'Content-Type': 'application/json' } };
const BASE_URL = __ENV.BASE_URL || 'https://cnot-game.onrender.com';

export default function () {
  const res = http.post(
    `${BASE_URL}/api/simulate`,
    payload,
    params
  );
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has all_match field': (r) => {
      try { return JSON.parse(r.body).all_match !== undefined; }
      catch { return false; }
    },
  });
  sleep(Math.random() * 3 + 1);
}
