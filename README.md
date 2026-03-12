# QMCB — Quantum Circuit Builder (Monorepo)

Prototype **full-stack learning tool** where students build quantum circuits, submit them for simulation, and compare **trial** vs **target** truth tables (for example, a two-qubit SWAP gate).

- Backend: `qmcb-be/` (Flask, Python)
- Frontend: `qmcb-fe/` (Vite, React, TypeScript)

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

- A **drag-and-drop circuit builder** where students construct circuits on a two-qubit canvas.
- A **backend simulator** that computes the trial unitary and truth table for the student-designed circuit.
- A **comparison view** between the trial truth table and a target truth table drawn from a small library of canonical two-qubit unitaries (for example, SWAP).

The goal is to make it easy for students to iterate on designs, see immediate feedback, and develop an intuition for how gate placement and qubit ordering affect circuit behavior.

---

## Dataset Description

Although this project is not an ML training pipeline, it does operate over structured data describing quantum circuits and their evaluations.

### Core Data Entities

- **Target unitaries**
  - Small library of named unitaries (for example, `SWAP`) exposed to the frontend.
  - Each target unitary has an associated truth table over all computational basis inputs for the configured number of qubits.

- **Trial circuits**
  - Student-designed gate sequences built in the UI.
  - Represented as an ordered list of gates (for example, `["CNOT", "CNOT", "CNOT"]`) and associated qubit order tuples (for example, `[[0, 1], [1, 0], [0, 1]]`).
  - Encoded as a JSON payload and submitted to the `/simulate` backend endpoint.

- **Truth tables**
  - For a given circuit and number of qubits, the backend computes:
    - Inputs: all basis states (for example, `["00", "01", "10", "11"]` for two qubits).
    - Outputs: the resulting basis states after applying the circuit.
  - Both **trial** and **target** truth tables are returned so the frontend can render side-by-side comparisons.

### Example Simulation Payload

The following example illustrates the data exchanged between frontend and backend for a two-qubit SWAP exercise:

- Request body:
  - `target_unitary`: `"SWAP"`
  - `number_of_qubits`: `2`
  - `gates`: `["CNOT", "CNOT", "CNOT"]`
  - `qubit_order`: `[[0, 1], [1, 0], [0, 1]]`

- Response body (simplified):
  - `trial_truth_table`: trial inputs and outputs for the constructed circuit.
  - `target_truth_table`: reference truth table for the SWAP unitary.

---

## Modeling Approach

The system implements a simple end-to-end modeling pipeline that takes a symbolic circuit description as input and returns discrete truth tables as output.

### 1. Circuit Specification (Frontend)

- Students assemble circuits by dragging gate glyphs from a toolbox onto a two-wire canvas.
- Each placed gate is encoded as:
  - Gate type (for example, `CNOT`, `H`, `T`).
  - Qubit order tuple:
    - For two-qubit gates (for example, `CNOT`): `[control, target]` such as `[0, 1]` or `[1, 0]`.
    - For single-qubit gates: `[wire, wire]` such as `[0, 0]` for the first wire and `[1, 1]` for the second.
- The frontend controller serializes the ordered list of placed gates and wires into a `UnitaryRequestDTO` that is POSTed to `/simulate`.

### 2. Quantum Circuit Construction (Backend)

Within the backend, the modeling pipeline consists of three conceptual layers:

- **Target library**
  - Maps a target unitary label (for example, `"SWAP"`) to a canonical description and reference truth table.
- **Circuit construction**
  - Converts the incoming gate sequence and qubit orders into an internal circuit representation.
  - Uses a quantum gate repository to look up primitive operations and compose them in order.
- **Simulation**
  - Applies the constructed circuit to each computational basis state for the configured number of qubits.
  - Produces the trial unitary behavior in truth-table form rather than exposing raw state vectors or complex amplitudes.

### 3. Comparison and Response Shaping

- The backend computes and returns both:
  - `trial_truth_table`: behavior of the student-designed circuit.
  - `target_truth_table`: behavior of the reference unitary.
- A response DTO structures the result for the frontend to render:
  - Side-by-side truth tables.
  - Row-level equality checks so the UI can mark which inputs match the target behavior.

This approach prioritizes pedagogical clarity over low-level simulation detail: students interact with discrete inputs and outputs, while the backend encapsulates the underlying linear algebra.

---

## Evaluation Metrics

While the system does not train a model, it does compute metrics that characterize how well a trial circuit matches the target behavior and how robust the pipeline is from a correctness perspective.

### Circuit-Level Metrics

- **Truth table match rate**
  - Fraction of input rows where trial and target outputs are identical.
  - For a perfect SWAP implementation on two qubits, this should be 1.0 across all basis states.
- **Row-level correctness flags**
  - Boolean indicator per input row (for example, `00`, `01`, `10`, `11`) that the UI uses to highlight mismatches.

### System-Level Metrics

- **Deterministic simulation**
  - For a fixed circuit description, repeated calls to `/simulate` should be stable and idempotent.
- **Input validation**
  - Requests with invalid gate types or qubit orders are rejected with structured error responses rather than causing runtime failures.

These metrics are primarily surfaced qualitatively in the UI today, but they provide a foundation for future logging and analytics (for example, distribution of student errors over time).

---

## Results

This prototype demonstrates that a lightweight full-stack application is sufficient to support interactive reasoning about small quantum circuits:

- Students can construct and iterate on SWAP-style circuits using only three CNOT gates and simple wire-order semantics.
- The backend reliably simulates trial vs target behavior and exposes clear truth tables for each.
- The UI design (two-wire canvas plus side-by-side tables) makes it straightforward to see how a single misplaced gate or qubit order choice affects the overall unitary.

As the target library grows beyond SWAP, this same pattern can be reused for additional exercises (for example, controlled-phase or simple entangling circuits).

---

## How to Run

The repository is organized as a monorepo with separate backend and frontend packages. The following steps assume you are starting from a fresh clone.

### Prerequisites

- Python 3.x
- Make
- Node.js 18 or later
- npm (bundled with Node)

### 1. Clone the Repository

```bash
git clone https://github.com/marissasinghh/qmcb.git
cd qmcb
```

### 2. Start the Backend (Flask)

```bash
cd qmcb-be
make init    # create virtualenv, install dependencies, set up env
make run     # starts Flask on http://127.0.0.1:5000
```

Key environment variables (configured via `.env`):

- `SECRET_KEY`
- `ALLOWED_ORIGINS` (must include your frontend origin, for example, `http://localhost:5173` in development)
- `API_VERSION`
- `MONGO_URI` (if using persistence)

### 3. Start the Frontend (Vite + React)

Open a new terminal:

```bash
cd qmcb-fe
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

Open the application at `http://localhost:5173`. You should be able to place gates on the canvas and use **Check Solution** to trigger simulations via `POST /simulate`.

### 4. Recommended Developer Workflow

- Start the backend and verify that `POST /simulate` responds as expected (for example, using `curl` or an HTTP client).
- Start the frontend and confirm the UI can reach the backend without CORS issues.
- Use tooling/scripts in each package for quality checks:
  - Frontend: `npm run typecheck`, `npm run lint`, `npm run format`
  - Backend: formatter and linter targets surfaced via `make` if configured.

---

## Architecture Diagram

High-level architecture for the QMCB prototype:

```text
┌───────────────────────────────────────────────────────────────┐
│                         STUDENT BROWSER                       │
├───────────────────────────────────────────────────────────────┤
│  React + Vite UI (qmcb-fe)                                    │
│  - Drag-and-drop gate canvas                                  │
│  - Builds UnitaryRequestDTO                                   │
│  - Renders trial vs target truth tables                       │
└───────────────▲───────────────────────────────────────────────┘
                │  POST /simulate (JSON)
                │
┌───────────────┴───────────────────────────────────────────────┐
│                     FLASK API (qmcb-be)                        │
├───────────────────────────────────────────────────────────────┤
│  API Layer                                                     │
│  - `/simulate` endpoint                                        │
│  - Request validation and DTO mapping                          │
│                                                                 │
│  Controllers / Services                                        │
│  - Construct trial circuit from gate sequence                  │
│  - Look up target unitary from library                         │
│                                                                 │
│  Repositories / Simulation Core                                │
│  - Quantum gate definitions                                    │
│  - Circuit composition and simulation                          │
│  - Truth table generation for trial and target                 │
└───────────────┬───────────────────────────────────────────────┘
                │  JSON response (truth tables)
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
├─ qmcb-be/        # Flask API (POST /simulate)
├─ qmcb-fe/        # Vite + React UI
├─ .gitignore
└─ README.md       # This file
```

For detailed package-level documentation, see:

- Backend: `qmcb-be/README.md` (setup, environment, API contract, project layout).
- Frontend: `qmcb-fe/README.md` (scripts, environment variables, UI overview, troubleshooting).

---

## Technologies Used

- **Python 3.x**: Backend language for the Flask API.
- **Flask**: Lightweight web framework exposing the `/simulate` endpoint.
- **NumPy / quantum gate utilities**: For unitary and truth table computation (in the repositories layer).
- **JavaScript / TypeScript**: Frontend application logic and DTOs.
- **React + Vite**: Frontend framework and dev tooling.
- **ESLint / Prettier / TypeScript**: Static analysis, formatting, and type checking for the frontend.
- **Make**: Task runner for backend setup and execution.