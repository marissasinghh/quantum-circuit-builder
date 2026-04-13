# QMCB-FE — Quantum Circuit Builder (Frontend)

This is the **prototype frontend** for building quantum circuits in a NAND-Game–style UI.  
Students drag gates from a toolbox onto a two-wire canvas (|a⟩ and |b⟩), submit the circuit to the backend, and compare the **trial** vs **target** truth tables (e.g., SWAP).

## Prerequisites

- **Node.js** ≥ 18 (LTS is fine)
- **npm** (comes with Node)
- Backend running locally (see `qmcb-be/README.md`)

## Getting Started

### First Time Setup

1. Clone the repository:

```bash
git clone https://github.com/marissasinghh/qmcb.git
cd qmcb/qmcb-fe
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

1. Start backend (qmcb-be) and verify `POST /api/simulate` works (for example with curl or your HTTP client).

2. Start front end:

```bash
npm run dev
```

3. Build types & lint:

```bash
npm run typecheck
npm run lint
npm run format
```

### Environment Variables

The application uses the following environment variables:

- `VITE_API_BASE_URL` =base URL for the backend (e.g., http://127.0.0.1:5000).
  Vite only exposes vars prefixed with VITE\_.
  Do **not** commit your .env.local; commit .env.local.example.

### API Contract

1. POST ${VITE_API_BASE_URL}/api/simulate

## Example Request:

{
"target_unitary": "SWAP",
"number_of_qubits": 2,
"gates": ["CNOT", "CNOT", "CNOT"],
"qubit_order": [[0, 1], [1, 0], [0, 1]]
}

- Two-qubit CNOT uses orders [0,1] or [1,0] (control→target).
- Single-qubit gates (H, T/Rz) encode wire as [wire, wire]:
  - on |a⟩ → [0,0]
  - on |b⟩ → [1,1]

## Example Response:

{
"message": "Successfully simulated trial and target unitaries.",
"trial_truth_table": {
"input": [
"00",
"01",
"10",
"11"
],
"output": [
"00",
"10",
"01",
"11"
]
},
"target_truth_table": {
"input": [
"00",
"01",
"10",
"11"
],
"output": [
"00",
"10",
"01",
"11"
]
}
}

### Scripts

```bash
npm run dev        # start Vite dev server
npm run build      # production build -> dist/
npm run preview    # preview the production build
npm run typecheck  # TypeScript type check (no emit)
npm run lint       # ESLint (flat config)
npm run format     # Prettier write
```

### Project Structure

```bash
qmcb-fe/
├─ src/
│  ├─ services/
│  │  └─ simulate.ts           # fetch wrapper (POST /api/simulate)
│  ├─ components/
│  │  └─ gate-designs.tsx      # SVG glyphs for CNOT, H, T
│  ├─ controllers/
│  │  └─ simulate.ts           # buildRequestFromLevel, toTruthRows
│  ├─ dto/
│  │  ├─ level-definition.ts   # LevelDefinition, SWAP level metadata
│  │  ├─ response-dto.ts       # SimulationResponseDTO
│  │  ├─ truth-table.ts        # TruthTableDTO
│  │  └─ unitary.ts            # UnitaryRequestDTO
│  ├─ hooks/
│  │  └─ use-circuit.ts        # circuit state: placed gates, orders, wires
│  ├─ repositories/
│  │  ├─ circuit-repo.ts       # pure helpers for serializing/sorting (optional)
│  │  ├─ quantum-gates.ts      # UI metadata: allowed orders, arity, labels
│  │  └─ target-library.ts     # SWAP level definition
│  ├─ types/
│  │  └─ global.ts             # ToolboxGate, PlacedGate unions, tuple types
│  ├─ utils/
│  │  ├─ constants.ts          # MAX_GATES, ALLOWED_QUBIT_ORDERS, etc.
│  │  └─ dnd-helpers.tsx       # DraggableTool, DroppableStrip
│  ├─ App.tsx                  # layout, DnD wiring, canvas rendering
│  ├─ index.css
│  └─ main.tsx
├─ .env.local.example
├─ eslint.config.cjs
├─ .prettierrc.json
├─ package.json
└─ vite.config.ts
```

### UI Overview

- Task: instructions and expected SWAP truth table.
- Toolbox: draggable CNOT, H, T glyphs.
- Canvas: two wires (|a⟩, |b⟩).
- Drop CNOT onto the canvas, then set control→target order in the list.
- Drop H/T directly onto a specific wire.
- Check Solution: POSTs to backend; shows trial vs target truth tables with ✓.

### Troubleshooting

- CORS error in console:
  - Make sure backend allows http://localhost:5173 (dev) and your production FE origin.
- 404 on `/api/simulate`:
  - Check backend routes (`flask --app app.main routes`), `VITE_API_BASE_URL`, and that `src/services/simulate.ts` posts to `/api/simulate`.
- Drag overlay not showing / errors with useDndMonitor:
  - We use DndContext props (onDragStart/onDragEnd) instead of useDndMonitor to avoid provider issues.
- No gates placed but output appears:
  - Check Solution is disabled when no gates are present; verify gates.length guards in App.tsx.

### Deploy

- Frontend (Vercel/Netlify)
  - Project root: qmcb-fe
  - Build command: npm run build
  - Output dir: dist
  - Env: set VITE_API_BASE_URL to your production backend URL
- Backend
  - Ensure CORS allows the FE production origin.
