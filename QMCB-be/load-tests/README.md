# Load tests (k6)

k6 scripts that hit `POST /api/simulate`. These live here (not in `tests/`) because they are not pytest unit tests — they load-test the Flask API as a deployed or locally running service.

## Prerequisites

Install [k6](https://k6.io/) once:

```bash
brew install k6
```

Confirm:

```bash
k6 version
```

## Run against production (Render)

From the **monorepo root**:

```bash
k6 run QMCB-be/load-tests/classroom.js
```

Or from this directory:

```bash
cd QMCB-be/load-tests
k6 run classroom.js
```

Default target: `https://cnot-game.onrender.com/api/simulate`.

## Run against a local backend

Start Flask (`make run` in `QMCB-be/`), then:

```bash
k6 run -e BASE_URL=http://127.0.0.1:5000 QMCB-be/load-tests/classroom.js
```

## What `classroom.js` does

Ramps virtual users (VUs) to a ~30-student classroom, then cools down:

| Stage | Duration | VUs |
| --- | --- | --- |
| small group | 30s | 5 |
| half class | 30s | 15 |
| full classroom | 1m | 30 |
| cooldown | 30s | 0 |

Each VU POSTs a CNOT-flipped simulate request (`qubit_order: [[1, 0]]`, not the legacy `"C1_T0"` string), then sleeps 1–4s.

Thresholds (k6 exits non-zero if these fail):

- 95th percentile latency under 2s
- HTTP error rate under 1%

## Notes

- Paste the script into a `.js` file and run `k6 run <file>` — do not paste it into the shell (zsh will throw `parse error near '}'`).
- Render free/starter instances spin down; the first requests may be slow while the service wakes up.
