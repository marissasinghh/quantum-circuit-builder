[![CI](https://github.com/marissasinghh/quantum-circuit-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/marissasinghh/quantum-circuit-builder/actions/workflows/ci.yml)

# QMCB-BE — Quantum Circuit Builder (Backend)

This project is the **backend** for a web application that allows users to build quantum circuits from scratch, test output results, and compare the results via a truth table with the target circuit output results. All quantum simulation goes through Cirq.

## Prerequisites

- Python 3.11.12 (see `.python-version`)
- Make

## Getting Started

### First Time Setup

1. Clone the repository:
```bash
git clone https://github.com/marissasinghh/quantum-circuit-builder.git
cd quantum-circuit-builder/QMCB-be
```
Only clone if you haven't already for frontend setup.

2. Initialize the project (creates virtual environment, installs dependencies):
```bash
make init
```

Copy `.env.sample` to `.env` and fill in values as needed:
```bash
cp .env.sample .env
```

3. Run the Flask application:
```bash
make run
```

Swagger UI: [http://127.0.0.1:5000/api/docs](http://127.0.0.1:5000/api/docs)

### Development Workflow

For daily development, you need to:

1. Activate the virtual environment:
```bash
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows
```

2. Run the Flask application:
```bash
make run
```

3. Quality checks (from `QMCB-be/`):
```bash
make lint
make fmt
make check
pytest
```


### Environment Variables

The application uses the following environment variables (see `.env.sample`):
- `SECRET_KEY`=dev_secret_key
- `ALLOWED_ORIGINS`=http://localhost:5173 (unset or `*` → wildcard; comma-separated list in production)
- `API_VERSION`=v1
- `MONGO_URI`= (unused; reserved)
- `GITHUB_PAT`= (fine-grained PAT with Issues read/write; required for Feedback submissions)
- `GITHUB_REPO`=marissasinghh/quantum-circuit-builder
- `VALIDATE_TARGET_CIRCUITS`=false (optional; set `true` to recompute target circuits live)
- `PORT`=5000 (optional; Flask bind port)


### API Endpoints

1. POST /api/simulate: Simulates a quantum circuit built from gates provided by the frontend and returns truth tables plus `all_match`
2. GET /api/levels/random-unitary: Generate (or reproduce via `?seed=`) a random single-qubit unitary
3. GET /api/levels/controlled-unitary: Generate (or reproduce via `?seed=`) a random controlled-U
4. POST /api/feedback/solution: Creates a GitHub Issue labeled `student-submission` from a Feedback page solution payload
5. POST /api/metrics/event: Records a frontend instrumentation event as a structured log line
6. GET /api/docs: Swagger UI

## Example Request:
```json
{
  "target_unitary": "SWAP",
  "number_of_qubits": 2,
  "gates": ["CNOT", "CNOT", "CNOT"],
  "qubit_order": [[0, 1], [1, 0], [0, 1]]
}
```

`gates` entries may also be parameterized objects, e.g. `{ "gate": "RX", "theta": 1.57 }`. Optional fields: `seed`, `target_params`, `parameter_gate_index`. Qubit-order tuples match the named aliases in `app/utils/qubit_orders.py` (`Q0`, `C0_T1`, `C0_C1_T2`, …).

## Example Response:
```json
{
  "message": "Successfully simulated circuits.",
  "grading_mode": null,
  "samples_checked": null,
  "samples_passed": null,
  "trial_truth_table": {
    "input": ["00", "01", "10", "11"],
    "output": ["00", "10", "01", "11"]
  },
  "target_truth_table": {
    "input": ["00", "01", "10", "11"],
    "output": ["00", "10", "01", "11"]
  },
  "all_match": true,
  "validation_mode": false
}
```

`grading_mode` is `"random_theta"` (Rx/Ry sampling; truth tables are `null`), `"unitary_global_phase"`, or `null` (Dirac/Born path). Truth tables may also include `probabilities` and `amplitudes`.


### Makefile Commands

- `make init` → Creates virtual environment, installs dependencies
- `make run` → Runs Flask application (`python -m app.main`)
- `make lint` → flake8
- `make fmt` → black (write)
- `make fmt-check` → black --check
- `make check` → mypy
- `make clean` → Remove virtual environment

Run tests with `pytest` from `QMCB-be/` (not a Make target). k6 load tests live in `load-tests/` — see `load-tests/README.md`.


### Project Structure

```bash
QMCB-be/
├── app/
│   ├── __init__.py              # create_app, CORS
│   ├── main.py                  # entry point
│   ├── settings.py
│   ├── api/
│   │   ├── simulate.py
│   │   ├── levels.py
│   │   ├── feedback.py
│   │   ├── metrics.py
│   │   └── debug.py             # temporary diagnostic; not student-facing
│   ├── controllers/
│   │   ├── simulate.py
│   │   ├── random_unitary.py
│   │   └── controlled_unitary.py
│   ├── services/
│   │   ├── circuit_builder.py
│   │   ├── simulator.py
│   │   ├── target_builder.py
│   │   └── github_issue.py
│   ├── config/
│   │   ├── gates.py             # CirqGateMapper
│   │   └── target_library.py    # 23 level targets
│   ├── dto/
│   │   ├── simulate_request.py
│   │   ├── response_dto.py
│   │   ├── truth_table.py
│   │   └── unitary.py
│   └── utils/
│       ├── unitary_payload.py
│       ├── qubit_orders.py
│       ├── constants.py
│       └── helpers.py
├── tests/                       # pytest
├── load-tests/                  # k6
├── venv/
├── .env.sample
├── Makefile
└── requirements.txt
```


### Notes
- The backend and frontend communicate via REST. The primary grading path is `/api/simulate`.
- Be sure `ALLOWED_ORIGINS` matches your frontend dev/prod URLs (`http://localhost:5173` in development).
- Swagger UI is at `/api/docs`. In production the app is hosted on Render; Gunicorn is listed in `requirements.txt` for WSGI serving. UptimeRobot pings `/api/docs` to limit cold starts.
