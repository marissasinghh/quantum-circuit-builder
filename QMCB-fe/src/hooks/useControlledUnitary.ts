import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchControlledUnitary } from "../services/controlledUnitary";
import { CONTROLLED_UNITARY_SEED_KEY } from "../utils/constants";

/**
 * Fetches and persists a random controlled-U for Level 2.5.
 *
 * Behaviour mirrors useRandomUnitary exactly:
 *  - On first mount the seed is read from sessionStorage. If one exists,
 *    the same controlled-U is reproduced (survives page refresh). If not, the
 *    backend generates a fresh one and we store the returned session_id.
 *  - Calling generateNew() clears the stored seed and triggers a re-fetch
 *    with no seed, producing a brand-new random controlled-U.
 *  - staleTime/gcTime are Infinity so TanStack Query never auto-refetches
 *    (the student stays on the same challenge until they choose otherwise).
 */
export function useControlledUnitary(enabled: boolean) {
  const [instanceKey, setInstanceKey] = useState(0);

  const [seed, setSeed] = useState<number | undefined>(() => {
    const stored = sessionStorage.getItem(CONTROLLED_UNITARY_SEED_KEY);
    return stored !== null ? Number(stored) : undefined;
  });

  const query = useQuery({
    queryKey: ["controlled-unitary", instanceKey],
    queryFn: () => fetchControlledUnitary(seed),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  });

  useEffect(() => {
    if (query.data?.session_id !== undefined) {
      setSeed(query.data.session_id);
      sessionStorage.setItem(CONTROLLED_UNITARY_SEED_KEY, String(query.data.session_id));
    }
  }, [query.data?.session_id]);

  const generateNew = useCallback(() => {
    sessionStorage.removeItem(CONTROLLED_UNITARY_SEED_KEY);
    setSeed(undefined);
    setInstanceKey((k) => k + 1);
  }, []);

  return { query, generateNew, seed };
}
