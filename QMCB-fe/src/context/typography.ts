/**
 * Shared UI typography tokens (static config — not a React Context provider).
 * If these ever need runtime theming, consider renaming this folder to `tokens/`
 * or wrapping values in a Context; for now a plain module avoids re-render overhead.
 */

/** Primary body copy baseline: 14px (used on About, Levels, and gate-name headings). */
const BODY_REM = 0.875;

/** Relative scale for chrome headers (panel labels, tier/level labels). */
const SECTION_HEADER_SCALE = 0.8;

export const fontSizes = {
  /** Figure captions, table sub-labels (13px). */
  caption: "0.8125rem",
  /** Body text, gate-name headings, paragraph content (14px). */
  body: `${BODY_REM}rem`,
  /** Panel headers, tier headers, level labels — 0.8 × body (11.2px). */
  sectionHeader: `${BODY_REM * SECTION_HEADER_SCALE}rem`,
} as const;

export const cssVarNames = {
  caption: "--font-size-caption",
  body: "--font-size-body",
  sectionHeader: "--font-size-section-header",
} as const;

/** Inject token values as CSS custom properties on :root (call once at app boot). */
export function applyTypographyCssVars(root: HTMLElement = document.documentElement): void {
  root.style.setProperty(cssVarNames.caption, fontSizes.caption);
  root.style.setProperty(cssVarNames.body, fontSizes.body);
  root.style.setProperty(cssVarNames.sectionHeader, fontSizes.sectionHeader);
}

/** Mono panel chrome: GATESET, BLOCH SPHERE, CIRCUIT OUTPUT. */
export const panelHeaderTypography = {
  fontWeight: 500,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
} as const;

/** Mono tier/level labels: // LEVEL, EXPECTED OUTPUT, sidebar tier rows. */
export const chromeLabelTypography = {
  fontWeight: 400,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
} as const;
