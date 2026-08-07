/**
 * Fire-and-forget metrics event helper.
 *
 * POSTs to the backend's structured-log-line endpoint (see
 * QMCB-be/app/api/metrics.py). keepalive lets the request survive a page
 * navigation/unload that would otherwise abort it (relevant for skip/
 * level_complete events fired right before navigating to the next level).
 *
 * Contract call sites can rely on:
 * - Never throws (all failures are swallowed internally).
 * - Synchronous, no Promise returned — nothing to await.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export function trackEvent(eventType: string, levelId: string): void {
  try {
    const payload = {
      eventType,
      levelId,
      timestamp: new Date().toISOString(),
    };
    fetch(`${API_BASE_URL}/api/metrics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Metrics must never affect the caller; swallow any network failure.
    });
  } catch {
    // Metrics must never affect the caller; swallow any failure.
  }
}
