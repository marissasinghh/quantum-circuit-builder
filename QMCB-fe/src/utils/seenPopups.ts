/**
 * Persists per-level first-run popup dismissal to localStorage.
 * Independent of cnot_progress — do not merge into unlock state.
 */

import { SEEN_POPUPS_KEY } from "./constants";

export type SeenPopupsMap = Record<string, boolean>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getSeenPopups(): SeenPopupsMap {
  try {
    const raw = localStorage.getItem(SEEN_POPUPS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return {};
    const next: SeenPopupsMap = {};
    for (const [levelId, seen] of Object.entries(parsed)) {
      if (typeof seen === "boolean") next[levelId] = seen;
    }
    return next;
  } catch {
    return {};
  }
}

export function markPopupSeen(levelId: string): void {
  try {
    const current = getSeenPopups();
    const next: SeenPopupsMap = { ...current, [levelId]: true };
    localStorage.setItem(SEEN_POPUPS_KEY, JSON.stringify(next));
  } catch {}
}
