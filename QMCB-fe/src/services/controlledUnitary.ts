/**
 * API client: GET a random controlled-U for Level 2.5.
 * This module does not build DTOs; it just performs the network call.
 */

import type { TruthTableDTO } from "../interfaces/truthTable";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export interface ControlledUnitaryResponseDTO {
  message: string;
  session_id: number;
  truth_table: TruthTableDTO;
  /** Hint: number of rotation gates needed to decompose the inner U (always 3). */
  num_rotation_gates: number;
}

export async function fetchControlledUnitary(seed?: number): Promise<ControlledUnitaryResponseDTO> {
  const url = new URL(`${API_BASE_URL}/api/levels/controlled-unitary`);
  if (seed !== undefined) url.searchParams.set("seed", String(seed));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
