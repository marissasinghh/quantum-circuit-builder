/**
 * API client: GET a random single-qubit unitary for Level 1.6.
 * This module does not build DTOs; it just performs the network call.
 */

import type { TruthTableDTO } from "../interfaces/truthTable";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export interface RandomUnitaryResponseDTO {
  message: string;
  session_id: number;
  truth_table: TruthTableDTO;
  /** Hint: number of rotation gates in the ZXZ decomposition (always 3). */
  num_rotation_gates: number;
  /** Analytically-computed Bloch sphere coordinates for the target state (|0⟩ input). */
  target_bloch: { theta: number; phi: number };
  /** ZXZ angles used to build this unitary — round-trip on POST for grading consistency. */
  angles: { alpha: number; beta: number; gamma: number };
}

export async function fetchRandomUnitary(seed?: number): Promise<RandomUnitaryResponseDTO> {
  const url = new URL(`${API_BASE_URL}/api/levels/random-unitary`);
  if (seed !== undefined) url.searchParams.set("seed", String(seed));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
