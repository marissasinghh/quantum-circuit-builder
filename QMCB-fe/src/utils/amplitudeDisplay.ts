/**
 * Parse and format quantum amplitude strings for the output truth table.
 *
 * Term boundaries occur only after ⟩ followed by +/- (not +/- inside coefficients).
 *
 * @example parseAmplitudeTerms("(0.5+0.5j)|0⟩ + 0.707j|1⟩")
 * // [{ sign: '+', value: '(0.5+0.5j)|0⟩' }, { sign: '+', value: '0.707j|1⟩' }]
 *
 * @example parseAmplitudeTerms("(-0.5+0.5j)|0⟩ - 0.707j|1⟩")
 * // [{ sign: '+', value: '(-0.5+0.5j)|0⟩' }, { sign: '-', value: '0.707j|1⟩' }]
 *
 * @example parseAmplitudeTerms("|1⟩")
 * // [{ sign: '+', value: '|1⟩' }]
 */

export type AmplitudeTerm = {
  sign: "+" | "-";
  value: string;
};

/** Split only at ⟩ followed by optional whitespace and a term-level +/- operator. */
const TERM_BOUNDARY = /(?<=\⟩)\s*(?=[+\-])/;

export function parseAmplitudeTerms(amplitude: string): AmplitudeTerm[] {
  const trimmed = amplitude.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(TERM_BOUNDARY);
  const terms: AmplitudeTerm[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    if (i === 0) {
      terms.push({ sign: "+", value: part });
      continue;
    }

    const signMatch = part.match(/^([+\-])\s*(.*)$/);
    if (signMatch) {
      terms.push({ sign: signMatch[1] as "+" | "-", value: signMatch[2] });
    } else {
      terms.push({ sign: "+", value: part });
    }
  }

  return terms.length > 0 ? terms : [{ sign: "+", value: trimmed }];
}

/** Join parsed terms into a single-line Dirac string. */
export function formatAmplitudeOneLine(terms: AmplitudeTerm[]): string {
  if (terms.length === 0) return "";
  return terms
    .map((term, i) => (i === 0 ? term.value : `${term.sign} ${term.value}`))
    .join(" ");
}

/** One display line per term; subsequent lines include their inter-term sign. */
export function formatAmplitudeMultiLine(terms: AmplitudeTerm[]): string[] {
  if (terms.length === 0) return [];
  return terms.map((term, i) => (i === 0 ? term.value : `${term.sign} ${term.value}`));
}
