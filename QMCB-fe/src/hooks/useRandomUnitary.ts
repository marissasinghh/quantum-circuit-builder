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

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRandomUnitary } from "../services/randomUnitary";

const SEED_KEY = "qmcb-random-unitary-seed";

export function useRandomUnitary(enabled: boolean) {
  // instanceKey is incremented by generateNew() to force a new query key,
  // which bypasses the staleTime: Infinity cache and triggers a fresh fetch.
  const [instanceKey, setInstanceKey] = useState(0);

  // Seed is initialised from sessionStorage so refreshes reproduce the same U.
  const [seed, setSeed] = useState<number | undefined>(() => {
    const stored = sessionStorage.getItem(SEED_KEY);
    return stored !== null ? Number(stored) : undefined;
  });

  const query = useQuery({
    queryKey: ["random-unitary", instanceKey],
    queryFn: () => fetchRandomUnitary(seed),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  });

  // Persist the session_id returned by the backend so it survives a refresh.
  useEffect(() => {
    if (query.data?.session_id !== undefined) {
      setSeed(query.data.session_id);
      sessionStorage.setItem(SEED_KEY, String(query.data.session_id));
    }
  }, [query.data?.session_id]);

  const generateNew = useCallback(() => {
    sessionStorage.removeItem(SEED_KEY);
    setSeed(undefined);
    setInstanceKey((k) => k + 1);
  }, []);

  return { query, generateNew, seed };
}
