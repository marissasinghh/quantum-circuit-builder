import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRandomUnitary } from "../services/randomUnitary";
import { RANDOM_UNITARY_SEED_KEY } from "../utils/constants";

/**
 * Fetches and persists a random single-qubit unitary for Level 1.6.
 *
 * Behaviour:
 *  - On first mount the seed is read from sessionStorage. If one exists,
 *    the same unitary is reproduced (survives page refresh). If not, the
 *    backend generates a fresh one and we store the returned session_id.
 *  - Calling generateNew() clears the stored seed and triggers a re-fetch
 *    with no seed, producing a brand-new random unitary.
 *  - staleTime/gcTime are Infinity so TanStack Query never auto-refetches
 *    (the student stays on the same challenge until they choose otherwise).
 */
export function useRandomUnitary(enabled: boolean) {
  const [instanceKey, setInstanceKey] = useState(0);

  const [seed, setSeed] = useState<number | undefined>(() => {
    const stored = sessionStorage.getItem(RANDOM_UNITARY_SEED_KEY);
    return stored !== null ? Number(stored) : undefined;
  });

  const query = useQuery({
    queryKey: ["random-unitary", instanceKey],
    queryFn: () => fetchRandomUnitary(seed),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  });

  useEffect(() => {
    if (query.data?.session_id !== undefined) {
      setSeed(query.data.session_id);
      sessionStorage.setItem(RANDOM_UNITARY_SEED_KEY, String(query.data.session_id));
    }
  }, [query.data?.session_id]);

  const generateNew = useCallback(() => {
    sessionStorage.removeItem(RANDOM_UNITARY_SEED_KEY);
    setSeed(undefined);
    setInstanceKey((k) => k + 1);
  }, []);

  return { query, generateNew, seed };
}
