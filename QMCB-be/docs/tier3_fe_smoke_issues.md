# Tier 3 manual smoke test — known issues (Week 10)

Logged during Toffoli level E2E smoke. **Do not fix this week** — track for follow-up.

## Backend pytest (verified)

- `python -m pytest -v -k "toffoli or fredkin"` — **28 passed** (2026-06-23)
- Coverage: `test_tier3_targets.py`, `test_3qubit_smoke.py`, `test_target_library.py[TOFFOLI|FREDKIN]`
- `target_library.py` entries confirmed: 8 `expected_outputs` each for `TOFFOLI` and `FREDKIN`

## Frontend / UX (3-qubit canvas not fully wired)

1. **CNOT order dropdown** — only offers `[0,1]` and `[1,0]` (`allowedOrdersFor` in `QMCB-fe/src/config/gates.ts`). On a 3-wire canvas, cannot target q0–q2 or q1–q2 pairs needed for Toffoli decomposition.

2. **Single-qubit wire typing** — `SingleWire` and `useDragAndDrop` cast drop target to `0 | 1` only. Dropping on wire 2 (`drop-wire-2`) may misbehave or fail type checks.

3. **Gate budget** — `MAX_GATES = 10` in `constants.ts`. Canonical Nielsen–Chuang Toffoli decomposition is 15 gates; full solution cannot fit in the current limit.

4. **No native 3-qubit primitives** — `TOFFOLI` / `FREDKIN` are not in `PlacedGate`, toolbox `GATE_CONFIG`, or drag-and-drop mappings. Cannot place a single Toffoli gate for quick verification.

5. **Glyphs not on canvas** — `ToffoliGlyph` / `FredkinGlyph` exist in `GateDesign.tsx` but are not wired into `CircuitCanvas` or `DragOverlay`.

## Manual smoke procedure (for browser verification)

1. Start BE: `python -m app.main` (port 5000)
2. Start FE: `$env:VITE_API_BASE_URL="http://127.0.0.1:5000"; npm run dev`
3. Unlock Toffoli in localStorage key `cnot_progress`:
   ```json
   {"completedLevels":["CNOT_FLIPPED","CONTROLLED_Z","SWAP","CONTROLLED_H","CONTROLLED_U"],"unlockedGates":["RZ","SQRT_X"]}
   ```
4. Open `/level/TOFFOLI` — expect 3 wires, TaskCard with 8 expected rows
5. Place a partial CNOT + H circuit; click Check Solution — expect 8-row OutputTable (pass/fail OK)

## Environment note (Windows dev server)

Flask `POST /api/simulate` may return HTTP 500 on Windows when debug logging tries to print circuit diagrams containing Unicode (e.g. `⟩`) to a cp1252 console. Controller-path pytest (`test_tier3_targets.py`) passes; issue is logging/encoding, not simulation math. Workaround: run backend in UTF-8 terminal or reduce circuit print verbosity.
