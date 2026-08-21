# QMCB — Quantum Circuit Builder (Monorepo)

Full-stack learning tool where students build quantum circuits, submit them for simulation, and compare **trial** vs **target** truth tables across 23 levels (1–3 qubits). SWAP is one Tier 2 exercise; the same pipeline grades every level.

- Backend: `QMCB-be/` (Flask, Python, Cirq)
- Frontend: `QMCB-fe/` (Vite, React, TypeScript)
- Live site: [cnotgame.com](https://cnotgame.com)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Dataset Description](#dataset-description)
- [Modeling Approach](#modeling-approach)
- [Evaluation Metrics](#evaluation-metrics)
- [Results](#results)
- [How to Run](#how-to-run)
- [Architecture Diagram](#architecture-diagram)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)

---

## Problem Statement

Introductory quantum computing courses often present gate-level concepts (for example, CNOT, H, phase gates) abstractly, which can make it difficult for students to build intuition about how small circuits compose into larger unitaries. Students may understand the matrix representations in isolation but struggle to reason about multi-qubit behavior and truth tables for simple benchmarks such as SWAP.

This project addresses that gap by providing:

- A **drag-and-drop circuit builder** where students construct circuits on a 1-, 2-, or 3-wire canvas, depending on the level.
- A **backend simulator** (Cirq) that computes the trial unitary and truth table for the student-designed circuit.
- A **comparison view** between the trial truth table and a target truth table drawn from a library of 23 named unitaries across three tiers (for example, SWAP on Tier 2).

The goal is to make it easy for students to iterate on designs, see immediate feedback, and develop an intuition for how gate placement and qubit ordering affect circuit behavior.

---

## Dataset Description

Although this project is not an ML training pipeline, it does operate over structured data describing quantum circuits and their evaluations.

### Core Data Entities

- **Target unitaries**
  - Named unitaries in `QMCB-be/app/config/target_library.py`, keyed by `target_unitary` (must match the frontend registry in `QMCB-fe/src/config/levels.ts`).
  - 23 levels: 16 single-qubit (Tier 1), 5 two-qubit (Tier 2, including SWAP), 2 three-qubit (Tier 3: Toffoli, Fredkin).
  - Each target has an associated truth table over all computational basis inputs for the configured number of qubits.

- **Trial circuits**
  - Student-designed gate sequences built in the UI.
  - Represented as an ordered list of gates (plain strings such as `"CNOT"`, or parameterized objects such as `{ "gate": "RX", "theta": 1.57 }`) and associated qubit-order tuples (for example, `[[0, 1], [1, 0], [0, 1]]`; named aliases `Q0`, `C0_T1`, `C0_C1_T2`, … exist in both codebases).
  - Encoded as a JSON payload and submitted to the `POST /api/simulate` backend endpoint.

- **Truth tables**
  - For a given circuit and number of qubits, the backend computes:
    - Inputs: all basis states (for example, `["00", "01", "10", "11"]` for two qubits).
    - Outputs: Dirac-formatted resulting states after applying the circuit.
    - Optional `probabilities` and `amplitudes` per row.
  - Both **trial** and **target** truth tables are returned so the frontend can render side-by-side comparisons. For `random_theta` grading (Rx/Ry), the tables are `null` and the backend grades via sampled unitary comparison instead.

### Example Simulation Payload

The following example illustrates the data exchanged between frontend and backend for a two-qubit SWAP exercise:

- Request body:
  - `target_unitary`: `"SWAP"`
  - `number_of_qubits`: `2`
  - `gates`: `["CNOT", "CNOT", "CNOT"]`
  - `qubit_order`: `[[0, 1], [1, 0], [0, 1]]`
  - Optional fields used by other levels: `seed`, `target_params`, `parameter_gate_index`

- Response body (simplified):
  - `trial_truth_table` / `target_truth_table`: trial and reference tables (or `null` in `random_theta` mode)
  - `all_match`: whether the trial is accepted
  - `grading_mode`: `"unitary_global_phase"` | `"random_theta"` | `null` (Dirac/Born path)

---

## Modeling Approach

The system implements a simple end-to-end modeling pipeline that takes a symbolic circuit description as input and returns discrete truth tables (or a sampled unitary verdict) as output. The frontend does not simulate; all quantum math runs on the backend through Cirq.

### 1. Circuit Specification (Frontend)

- Students assemble circuits by dragging gate glyphs from a progressive toolbox onto a canvas with 1, 2, or 3 wires.
- Each placed gate is encoded as:
  - Gate type (for example, `CNOT`, `H`, `RX`) or a parameterized object `{ gate, theta?, alpha?, beta?, gamma? }`.
  - Qubit order tuple:
    - Single-qubit: `[wire, wire]` such as `[0, 0]` (`Q0`).
    - Two-qubit (for example, `CNOT`): `[control, target]` such as `[0, 1]` (`C0_T1`) or `[1, 0]` (`C1_T0`).
    - Three-qubit: `[0, 1, 2]` (`C0_C1_T2` / `C0_T1_T2`) or a reconfigured order such as `[0, 2, 1]`.
- `buildRequestFromLevel` in `QMCB-fe/src/controllers/simulate.ts` serializes the ordered list of placed gates into a `UnitaryRequestDTO` that is POSTed to `/api/simulate`.

### 2. Quantum Circuit Construction (Backend)

Within the backend, the modeling pipeline consists of three conceptual layers:

- **Target library**
  - Maps a target unitary label (for example, `"SWAP"`) to a canonical Cirq description and reference truth table in `app/config/target_library.py`.
- **Circuit construction**
  - `CircuitBuilder` converts the incoming gate sequence and qubit orders into a Cirq circuit (`app/services/circuit_builder.py`).
  - Composite student gates (for example, `CNOT_FLIPPED`, `CONTROLLED_H`) are expanded before mapping to Cirq primitives.
- **Simulation and grading**
  - Applies the constructed circuit to each computational basis state (or compares full unitaries / sampled angles, depending on `grading_mode`).
  - Produces trial vs target truth tables for the Dirac/Born path, rather than exposing raw state vectors as the primary student-facing output.

### 3. Comparison and Response Shaping

- The backend computes and returns both:
  - `trial_truth_table`: behavior of the student-designed circuit.
  - `target_truth_table`: behavior of the reference unitary.
- A plain response dict structures the result for the frontend to render:
  - Side-by-side truth tables (when present).
  - `all_match` plus row-level equality so the UI can mark which inputs match the target.
  - `grading_mode` so the UI can distinguish truth-table, global-phase, and random-theta results.

This approach prioritizes pedagogical clarity over low-level simulation detail: students interact with discrete inputs and outputs, while the backend encapsulates the underlying linear algebra in Cirq.

---

## Evaluation Metrics

While the system does not train a model, it does compute metrics that characterize how well a trial circuit matches the target behavior and how robust the pipeline is from a correctness perspective.

### Circuit-Level Metrics

- **`all_match`**
  - Authoritative pass/fail for the trial vs the target. Depending on the level, this is a Dirac/Born truth-table match, a full unitary comparison up to global phase (`unitary_global_phase`), or sampled-angle unitary comparison (`random_theta`).
- **Truth table match rate**
  - Fraction of input rows where trial and target outputs are identical (Dirac/Born path).
  - For a perfect SWAP implementation on two qubits, this should be 1.0 across all basis states.
- **Row-level correctness flags**
  - Boolean indicator per input row that the UI uses to highlight mismatches.
- **`samples_passed` / `samples_checked`**
  - For Rx/Ry (`random_theta`) levels only: how many sampled angles passed.

### System-Level Metrics

- **Deterministic simulation**
  - For a fixed circuit description, repeated calls to `/api/simulate` should be stable and idempotent.
- **Input validation**
  - Requests with invalid gate types or qubit orders are rejected with structured error responses rather than causing runtime failures.

These metrics are primarily surfaced in the UI today. The frontend also POSTs fire-and-forget events to `/api/metrics/event` (level start/complete, submission, skip). `MONGO_URI` is reserved in settings but unused.

---

## Results

Three tiers (23 levels) are implemented and live at [cnotgame.com](https://cnotgame.com) (frontend on Vercel, backend on Render).

- Students construct circuits from a progressive toolbox (starting primitives: Rz(θ) and √X), unlocking each built gate as a reusable component.
- The backend simulates trial vs target behavior in Cirq and exposes truth tables (or a sampled unitary verdict) plus `all_match`.
- The UI (1–3 wire canvas, output table, Bloch sphere on single-qubit levels) makes it straightforward to see how gate placement, qubit order, and parameters affect the overall unitary.

*(Narrative / pedagogical copy for this section will be updated separately.)*

---

## How to Run

The repository is organized as a monorepo with separate backend and frontend packages. The following steps assume you are starting from a fresh clone.

### Prerequisites

- Python 3.11 (see `QMCB-be/.python-version`)
- Make
- Node.js 18 or later (CI uses Node 20)
- npm (bundled with Node)

### 1. Clone the Repository

```bash
git clone https://github.com/marissasinghh/quantum-circuit-builder.git
cd quantum-circuit-builder
```

### 2. Start the Backend (Flask)

```bash
cd QMCB-be
make init    # create virtualenv, install dependencies
make run     # starts Flask on http://127.0.0.1:5000
```

Swagger UI: [http://127.0.0.1:5000/api/docs](http://127.0.0.1:5000/api/docs)

Key environment variables (copy `QMCB-be/.env.sample` to `.env`):

- `SECRET_KEY`
- `ALLOWED_ORIGINS` (must include your frontend origin, for example, `http://localhost:5173` in development)
- `API_VERSION`
- `MONGO_URI` (unused; reserved)
- `GITHUB_PAT` / `GITHUB_REPO` (required only for Feedback page submissions)
- `VALIDATE_TARGET_CIRCUITS` (optional)
- `PORT` (optional; defaults to 5000)

### 3. Start the Frontend (Vite + React)

Open a new terminal:

```bash
cd QMCB-fe
npm install
cp .env.local.example .env.local
```

Edit `.env.local` and configure the backend URL:

```bash
VITE_API_BASE_URL=http://127.0.0.1:5000
```

Then run the development server:

```bash
npm run dev
```

Open the application at `http://localhost:5173`. You should be able to place gates on the canvas and use **Check Solution** to trigger simulations via `POST /api/simulate`.

### 4. Recommended Developer Workflow

- Start the backend and verify that `POST /api/simulate` responds as expected (Swagger at `/api/docs`, or `curl` / an HTTP client).
- Start the frontend and confirm the UI can reach the backend without CORS issues.
- Use tooling/scripts in each package for quality checks:
  - Frontend: `npm run typecheck`, `npm run lint`, `npm run format` (check), `npm run format:fix` (write), `npm run test` (Vitest)
  - Backend: `make lint`, `make fmt`, `make check`, and `pytest` from `QMCB-be/`

---

## Architecture Diagram

High-level architecture for QMCB:

```text
┌───────────────────────────────────────────────────────────────┐
│                         STUDENT BROWSER                       │
├───────────────────────────────────────────────────────────────┤
│  React + Vite UI (QMCB-fe)                                    │
│  - App.tsx: routing shell (/levels, /level/:id, …)            │
│  - SolveLevelPage / MobileSolveLayout: DnD + circuit hooks    │
│  - 1–3 wire canvas, progressive toolbox                       │
│  - Builds UnitaryRequestDTO                                   │
│  - Renders trial vs target truth tables, Bloch, level-complete│
└───────────────▲───────────────────────────────────────────────┘
                │  POST /api/simulate (JSON)
                │  GET  /api/levels/…
                │  POST /api/feedback/solution
                │  POST /api/metrics/event
                │
┌───────────────┴───────────────────────────────────────────────┐
│                     FLASK API (QMCB-be)                        │
├───────────────────────────────────────────────────────────────┤
│  API Layer                                                     │
│  - /api/simulate, /api/levels, /api/feedback, /api/metrics     │
│  - Request validation (unitary_payload) and DTO mapping        │
│  - Swagger at /api/docs                                        │
│                                                                 │
│  Controllers / Services                                        │
│  - Construct trial Cirq circuit from gate sequence             │
│  - Look up target unitary from TARGET_LIBRARY                  │
│  - Grade: Dirac/Born | unitary_global_phase | random_theta     │
│                                                                 │
│  Config / Simulation Core                                      │
│  - CirqGateMapper primitives                                   │
│  - CircuitBuilder + CircuitSimulator (Cirq)                    │
│  - Truth table generation for trial and target                 │
└───────────────┬───────────────────────────────────────────────┘
                │  JSON response (truth tables + all_match)
                ▼
┌───────────────────────────────────────────────────────────────┐
│                        FRONTEND VIEW                          │
├───────────────────────────────────────────────────────────────┤
│  - Row-by-row comparison and correctness indicators           │
│  - Feedback loop for students to iterate on circuits          │
└───────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```bash
.
├─ QMCB-be/        # Flask + Cirq API (POST /api/simulate and related)
├─ QMCB-fe/        # Vite + React UI
├─ .gitignore
└─ README.md       # This file
```

For detailed package-level documentation, see:

- Backend: `QMCB-be/README.md` (setup, environment, API contract, project layout).
- Frontend: `QMCB-fe/README.md` (scripts, environment variables, UI overview, troubleshooting).

---

## Technologies Used

- **Python 3.11**: Backend language for the Flask API.
- **Flask + Flask-RESTX**: Web framework and Swagger UI (`/api/docs`).
- **flask-cors**: CORS for the Vite origin.
- **Cirq 1.6**: All quantum circuit construction, simulation, and unitary comparison.
- **Gunicorn**: Production WSGI server (listed in backend requirements; app is hosted on Render).
- **pytest**: Backend tests in `QMCB-be/tests/`.
- **TypeScript / React 18 + Vite 5**: Frontend application logic and DTOs.
- **TanStack Query**: `useMutation` for the simulate call.
- **@dnd-kit/core**: Drag-and-drop circuit building.
- **React Router**: `/levels`, `/level/:id`, and the other app routes.
- **Tailwind CSS**: Styling.
- **ESLint / Prettier / TypeScript**: Static analysis, formatting, and type checking for the frontend.
- **Vitest**: Frontend unit tests.
- **Make**: Task runner for backend setup, run, lint, and format.
