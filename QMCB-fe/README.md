# QMCB-FE — The CNOT Game (Frontend)

This is the frontend for [The CNOT Game](https://cnotgame.com) — the quantum analog of The NAND Game. Just as that project builds up from relays to a full CPU, students here start from Rz(θ) and √X and progressively derive every other quantum gate themselves, unlocking each one as a reusable component. Students drag gates from a progressive toolbox onto a 1-, 2-, or 3-wire canvas, submit the circuit to the backend, and compare the **trial** vs **target** truth tables across 23 levels.

Live site: [cnotgame.com](https://cnotgame.com)

## Prerequisites

- **Node.js** ≥ 18 (CI uses Node 20)
- **npm** (comes with Node)
- Backend running locally (see `QMCB-be/README.md`)

## Getting Started

### First Time Setup

1. Clone the repository:

```bash
git clone https://github.com/marissasinghh/quantum-circuit-builder.git
cd quantum-circuit-builder/QMCB-fe
```

Only clone if you haven't already for backend setup.

2. Install deps:

```bash
npm install
```

3. Configure environment:
   Create a local env file:

```bash
cp .env.local.example .env.local
```

Edit .env.local and set your backend URL:

```bash
VITE_API_BASE_URL=http://127.0.0.1:5000
```

This must match where your Flask app is serving and CORS is allowed.

4. Run the dev server:

```bash
npm run dev
```

Open: http://localhost:5173

### Development Workflow

For daily development, you need to:

1. Start backend (`QMCB-be`) and verify `POST /api/simulate` works (Swagger at `http://127.0.0.1:5000/api/docs`, or curl / an HTTP client).

2. Start front end:

```bash
npm run dev
```

3. Build types, lint, format, and tests:

```bash
npm run typecheck
npm run lint
npm run format        # Prettier check (does not write)
npm run format:fix    # Prettier write
npm run test          # Vitest
```

### Environment Variables

The application uses the following environment variables:

- `VITE_API_BASE_URL` = base URL for the backend (e.g., http://127.0.0.1:5000).
  Vite only exposes vars prefixed with VITE\_.
  Do **not** commit your .env.local; commit .env.local.example.

### API Contract

Primary grading path:

1. POST ${VITE_API_BASE_URL}/api/simulate

Other endpoints the frontend also calls:

- `GET /api/levels/random-unitary` and `GET /api/levels/controlled-unitary` (seeded target generation)
- `POST /api/feedback/solution` (Feedback page → GitHub Issue)
- `POST /api/metrics/event` (fire-and-forget instrumentation)

## Example Request:

```json
{
  "target_unitary": "SWAP",
  "number_of_qubits": 2,
  "gates": ["CNOT", "CNOT", "CNOT"],
  "qubit_order": [[0, 1], [1, 0], [0, 1]]
}
```

- Two-qubit CNOT uses orders `[0, 1]` (`C0_T1`) or `[1, 0]` (`C1_T0`) (control→target).
- Single-qubit gates encode wire as `[wire, wire]`:
  - on wire 0 → `[0, 0]` (`Q0`)
  - on wire 1 → `[1, 1]` (`Q1`)
- Three-qubit gates use `[0, 1, 2]` (`C0_C1_T2` / `C0_T1_T2`) or a reconfigured order such as `[0, 2, 1]`.
- Parameterized gates may be objects instead of strings, e.g. `{ "gate": "RX", "theta": 1.57 }`. Optional request fields: `seed`, `target_params`, `parameter_gate_index`.

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

### Scripts

```bash
npm run dev          # start Vite dev server
npm run build        # production build -> dist/
npm run preview      # preview the production build
npm run typecheck    # TypeScript type check (no emit)
npm run lint         # ESLint (flat config)
npm run format       # Prettier check
npm run format:fix   # Prettier write
npm run test         # Vitest
```

### Project Structure

```bash
QMCB-fe/
├─ src/
│  ├─ App.tsx                          # routing shell only
│  ├─ main.tsx
│  ├─ pages/
│  │  ├─ LevelsPage.tsx
│  │  ├─ SolveLevelPage.tsx            # desktop hook wiring (useCircuit, DnD, validation)
│  │  ├─ AboutPage.tsx
│  │  ├─ SettingsPage.tsx
│  │  ├─ FeedbackPage.tsx
│  │  └─ MySolutionsPage.tsx
│  ├─ components/
│  │  ├─ CircuitCanvas.tsx
│  │  ├─ GateDesign.tsx                # SVG glyphs
│  │  ├─ OutputTable.tsx
│  │  ├─ BlochSphere.tsx
│  │  ├─ MobileSolveLayout.tsx         # mobile equivalent of SolveLevelPage wiring
│  │  └─ DragGateOverlay.tsx
│  ├─ hooks/
│  │  ├─ useCircuit.ts
│  │  ├─ useDragAndDrop.ts
│  │  ├─ useCircuitValidation.ts       # Check Solution → POST /api/simulate
│  │  └─ useLevelProgress.ts
│  ├─ config/
│  │  ├─ levels.ts                     # 23 level definitions + LEVEL_ORDER
│  │  └─ gates.ts
│  ├─ controllers/
│  │  └─ simulate.ts                   # buildRequestFromLevel, toTruthRows
│  ├─ services/
│  │  ├─ simulate.ts                   # fetch wrapper (POST /api/simulate)
│  │  ├─ randomUnitary.ts
│  │  ├─ controlledUnitary.ts
│  │  └─ feedback.ts
│  ├─ interfaces/
│  │  ├─ levelDefinition.ts
│  │  ├─ responseDTO.ts
│  │  ├─ truthTable.ts
│  │  └─ unitary.ts                    # UnitaryRequestDTO
│  ├─ types/
│  │  └─ global.ts                     # Gate enum, PlacedGate unions
│  └─ utils/
│     ├─ circuit.ts                    # serializeOrders, serializeUnitaryGateEntries
│     ├─ computeToolbox.ts
│     └─ constants.ts
├─ .env.local.example
├─ eslint.config.js
├─ .prettierrc.json
├─ package.json
└─ vite.config.ts
```

### UI Overview

- Levels page: three tiers; progress persisted in localStorage (`cnot_progress`).
- Toolbox: progressive gateset (starts with Rz(θ) and √X); completing a level unlocks its gate unless `noGatesetUnlock` is set.
- Canvas: 1, 2, or 3 wires depending on the level. Drop gates onto wires; 2-/3-qubit chips can flip or reconfigure order on the canvas.
- Check Solution: POSTs to the backend via `useCircuitValidation`; shows trial vs target truth tables with row-level match. Disabled when no gates are placed.
- Single-qubit levels also show a Bloch sphere; a level-complete modal appears when `all_match` is true.
- First-run onboarding; mobile layout in `MobileSolveLayout`.

### Troubleshooting

- CORS error in console:
  - Make sure backend allows http://localhost:5173 (dev) and your production FE origin.
- 404 on `/api/simulate`:
  - Check backend is running (`python -m app.main` from `QMCB-be`), Swagger at `/api/docs`, `VITE_API_BASE_URL`, and that `src/services/simulate.ts` posts to `/api/simulate`.
- Drag overlay not showing / errors with useDndMonitor:
  - DnD lives in `SolveLevelPage` / `MobileSolveLayout` (`DndContext` props `onDragStart`/`onDragEnd`); the overlay is `DragGateOverlay.tsx`.
- No gates placed but output appears:
  - Check Solution is disabled when no gates are present (`gates.length` guard in `useCircuitValidation.handleCheck`).

### Deploy

- Frontend (Vercel; or any static host)
  - Project root: `QMCB-fe`
  - Build command: `npm run build`
  - Output dir: `dist`
  - Env: set `VITE_API_BASE_URL` to your production backend URL (Render)
  - Live site: cnotgame.com
- Backend
  - Ensure CORS allows the FE production origin.
