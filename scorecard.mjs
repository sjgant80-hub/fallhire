// scorecard.mjs — the number that decides whether somebody gets the job.
//
// ⚑ A SCORECARD WITH ONE ANSWER LOOKED EXACTLY LIKE A SCORECARD WITH SEVEN. The average skipped any
// dimension the interviewer had left blank — and skipped it in the DENOMINATOR too:
//
//     for each dimension: if the answer is a number, add it to the sum AND add its weight to the total
//     return total ? sum / total : null;
//
// So an interviewer who scored only "technical", and gave it a 5, produced 5.00. Identical to a
// panellist who worked through all seven and gave 5 for every one. And it beat a thorough
// four-across-the-board, which came out at 4.00. The tool could not tell excellent from barely
// assessed, and the number looked the same either way, so nobody could see it.
//
// ⚑ AND ONE OPINION WAS REPORTED AS PERFECT AGREEMENT. The spread across a panel returned 0 when
// there was only a single scorecard. Zero disagreement is what you show when everybody agrees — not
// when only one person has spoken. On a hiring screen that reads as consensus.
//
// The weighting, to be fair, was real: technical counted 1.2, curiosity 0.9. That part worked and the
// weights stay exactly where they were, supplied by the caller.
//
// Pure: no storage, no DOM. Dimensions and weights come in; nothing here decides what matters.

/** A score, or null. Out of range is a typo, and a typo here moves a hire. */
export function scoreOf(value, opts) {
  const o = (opts && typeof opts === 'object') ? opts : {};
  const min = Number.isFinite(Number(o.min)) ? Number(o.min) : 1;
  const max = Number.isFinite(Number(o.max)) ? Number(o.max) : 5;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

function dimensionsOf(opts) {
  const o = (opts && typeof opts === 'object') ? opts : {};
  return Array.isArray(o.dimensions) ? o.dimensions.filter(d => typeof d === 'string' && d) : [];
}

function weightOf(dim, opts) {
  const o = (opts && typeof opts === 'object') ? opts : {};
  const w = o.weights && typeof o.weights === 'object' ? Number(o.weights[dim]) : NaN;
  return (Number.isFinite(w) && w > 0) ? w : 1;
}

/**
 * ⚑ ONE SCORECARD, AND HOW MUCH OF IT WAS ACTUALLY FILLED IN.
 *
 * The score is still the weighted mean of what was answered — that part was right. What changes is
 * that the coverage travels with it, always, so nothing downstream can mistake a single answer for a
 * completed assessment.
 */
export function assess(scorecard, opts) {
  const sc = (scorecard && typeof scorecard === 'object') ? scorecard : {};
  const scores = (sc.scores && typeof sc.scores === 'object') ? sc.scores : {};
  const dims = dimensionsOf(opts);

  const scored = [], missing = [], invalid = [];
  let sum = 0, weightUsed = 0, weightTotal = 0;

  for (const d of dims) {
    const w = weightOf(d, opts);
    weightTotal += w;
    const raw = scores[d];
    if (raw === undefined || raw === null || raw === '') { missing.push(d); continue; }
    const v = scoreOf(raw, opts);
    // ⚑ An unusable answer is NOT the same as a blank one. A 9 on a scale of 5, or the word "good",
    // means somebody tried to say something and it did not land — reporting that as "not asked" hides
    // a mistake instead of surfacing it.
    if (v === null) { invalid.push(d); continue; }
    scored.push(d);
    sum += v * w;
    weightUsed += w;
  }

  const score = weightUsed ? round2(sum / weightUsed) : null;
  const coverage = weightTotal ? round2(weightUsed / weightTotal) : 0;

  return {
    score, coverage,
    scored, missing, invalid,
    dimensions: dims.length,
    complete: dims.length > 0 && missing.length === 0 && invalid.length === 0,
    interviewer: typeof sc.interviewer === 'string' ? sc.interviewer : '',
  };
}

/**
 * ⚑ WHAT THE PANEL SAID, AND HOW MUCH OF A PANEL IT WAS.
 *
 * `agreement` is the spread across the panel's scores — and it is **null** for fewer than two
 * scorecards, never 0. One opinion is not a consensus, and a screen showing 0 spread beside a single
 * scorecard tells a hiring manager the room agreed.
 */
export function panel(scorecards, opts) {
  const o = (opts && typeof opts === 'object') ? opts : {};
  const list = (Array.isArray(scorecards) ? scorecards : []).filter(s => s && typeof s === 'object');
  const assessed = list.map(s => assess(s, o));
  const usable = assessed.filter(a => a.score !== null);

  if (!usable.length) {
    return { score: null, coverage: 0, count: list.length, usable: 0, agreement: null,
             complete: false, thin: [], reason: 'nothing has been scored yet' };
  }

  const score = round2(usable.reduce((a, x) => a + x.score, 0) / usable.length);
  const coverage = round2(usable.reduce((a, x) => a + x.coverage, 0) / usable.length);

  let agreement = null;
  if (usable.length >= 2) {
    const mean = usable.reduce((a, x) => a + x.score, 0) / usable.length;
    const variance = usable.reduce((a, x) => a + (x.score - mean) ** 2, 0) / usable.length;
    agreement = round2(Math.sqrt(variance));
  }

  // Scorecards too sparse to stand on. Named, not silently folded into the average.
  const floor = Number.isFinite(Number(o.minCoverage)) ? Number(o.minCoverage) : 0.5;
  const thin = assessed
    .map((a, i) => ({ index: i, interviewer: a.interviewer, coverage: a.coverage, scored: a.scored.length, of: a.dimensions }))
    .filter((_, i) => assessed[i].score !== null && assessed[i].coverage < floor);

  return {
    score, coverage, count: list.length, usable: usable.length,
    agreement,
    complete: usable.every(a => a.complete),
    thin,
    reason: agreement === null ? 'only one person has scored this candidate' : 'scored by the panel',
  };
}

/**
 * ⚑ IS ONE CANDIDATE ACTUALLY AHEAD OF ANOTHER?
 *
 * Kept separate from the arithmetic, because this is the comparison a hiring decision rests on. It
 * refuses to be certain when the two were not assessed on comparable evidence: a candidate seen once
 * on one dimension is not behind a candidate seen by four people on all seven, whatever the two means
 * happen to be. Saying "cannot compare yet" is the useful answer; a confident ranking of unlike
 * things is the harmful one.
 */
export function compare(a, b, opts) {
  const o = (opts && typeof opts === 'object') ? opts : {};
  const gap = Number.isFinite(Number(o.coverageGap)) ? Number(o.coverageGap) : 0.25;
  const A = (a && typeof a === 'object') ? a : {};
  const B = (b && typeof b === 'object') ? b : {};

  if (A.score === null || A.score === undefined || B.score === null || B.score === undefined) {
    return { ahead: null, certain: false, reason: 'one of them has not been scored' };
  }
  const covA = Number(A.coverage) || 0, covB = Number(B.coverage) || 0;
  if (Math.abs(covA - covB) > gap) {
    return {
      ahead: null, certain: false,
      reason: 'these two were not assessed on comparable evidence — one scorecard covers much more than the other',
    };
  }
  if (A.score === B.score) return { ahead: null, certain: true, reason: 'the same score on comparable evidence' };
  return { ahead: A.score > B.score ? 'a' : 'b', certain: true, reason: 'a higher score on comparable evidence' };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default { scoreOf, assess, panel, compare };
