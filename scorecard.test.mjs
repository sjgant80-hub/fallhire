// scorecard.test.mjs — PROOF-OF-PLAY for the number that decides whether somebody gets the job.
import { scoreOf, assess, panel, compare } from './scorecard.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ FAIL ') + m); };

// fallhire's real dimensions and weights.
const DIMS = ['technical', 'communication', 'culture', 'ownership', 'craft', 'curiosity', 'scope'];
const WEIGHTS = { technical: 1.2, communication: 1.0, culture: 1.0, ownership: 1.1, craft: 1.0, curiosity: 0.9, scope: 1.0 };
const O = { dimensions: DIMS, weights: WEIGHTS };
const card = (scores, interviewer = 'Sam') => ({ interviewer, scores });
const all = (n) => Object.fromEntries(DIMS.map(d => [d, n]));

console.log('\n=== §1 · ⚑ ONE ANSWER IS NOT A COMPLETED SCORECARD ===');
{
  const thorough = assess(card(all(5)), O);
  const single = assess(card({ technical: 5 }), O);
  ok(thorough.score === 5 && single.score === 5,
     'both still come out at 5.00 — the mean of what was answered, which was never the wrong number');
  ok(thorough.coverage === 1, 'but the thorough one covered everything');
  ok(single.coverage < 0.2,
     '⚑ and the single answer covered barely a fifth — THAT is the difference the old code threw away, because it skipped blanks in the denominator too');
  ok(single.complete === false && thorough.complete === true, 'and only one of them is a complete assessment');
  ok(single.missing.length === 6 && single.scored.length === 1, 'with the six unanswered dimensions named');

  const thoroughFour = assess(card(all(4)), O);
  ok(thoroughFour.score === 4 && thoroughFour.coverage === 1,
     'a thorough four-across-the-board is 4.00 on full coverage — it used to be beaten outright by that single 5');
}

console.log('\n=== §2 · ⚑ ONE OPINION IS NOT AGREEMENT ===');
{
  const one = panel([card(all(5))], O);
  ok(one.agreement === null,
     '⚑ the spread across a panel of ONE is null, not 0 — zero disagreement beside a single scorecard tells a hiring manager the room agreed');
  ok(/only one person/.test(one.reason), 'and it says why in words');

  const two = panel([card(all(5)), card(all(3), 'Alex')], O);
  ok(two.agreement === 1, 'two scorecards two points apart give a spread of 1');
  ok(panel([card(all(4)), card(all(4), 'Alex')], O).agreement === 0,
     'and a genuine agreement really is 0 — the refusal is about not knowing, not about never saying it');
  ok(two.score === 4 && two.count === 2 && two.usable === 2, 'the panel score is the mean of the scorecards');
  ok(panel([], O).score === null && panel([], O).agreement === null, 'an empty panel scores nothing and agrees about nothing');
}

console.log('\n=== §3 · ⚑ A SPARSE SCORECARD IS NAMED, NOT SILENTLY AVERAGED IN ===');
{
  const p = panel([card(all(3), 'Thorough'), card({ technical: 5 }, 'Rushed')], O);
  ok(p.thin.length === 1 && p.thin[0].interviewer === 'Rushed',
     '⚑ the scorecard covering one dimension of seven is NAMED — it still counts toward the mean, and whoever reads the mean is told what it rests on');
  ok(p.thin[0].scored === 1 && p.thin[0].of === 7, 'with how much of it was filled in');
  ok(p.complete === false, 'and the panel is not complete');
  ok(panel([card(all(3)), card(all(4), 'Alex')], O).thin.length === 0, 'two full scorecards leave nothing to flag');
  ok(panel([card({ technical: 5, communication: 5, culture: 5, ownership: 5 })], O).thin.length === 0,
     'and four of seven clears the default floor — the flag is for sparse, not for merely incomplete');
}

console.log('\n=== §4 · a blank is not a bad answer ===');
{
  const a = assess(card({ technical: 5, communication: null, culture: 9, ownership: 'good' }), O);
  ok(a.missing.includes('communication'), 'a blank dimension is missing');
  ok(a.invalid.includes('culture') && a.invalid.includes('ownership'),
     '⚑ but a 9 out of 5, or the word "good", is INVALID — somebody tried to say something and it did not land, and calling that "not asked" hides a mistake');
  ok(a.scored.length === 1 && a.score === 5, 'only the usable answer counts toward the score');
  ok(a.complete === false, 'and nothing with an invalid answer is complete');

  ok(scoreOf(5, {}) === 5 && scoreOf(1, {}) === 1, 'the ends of the scale are valid');
  ok(scoreOf(0, {}) === null && scoreOf(6, {}) === null, 'and just outside it is not');
  ok(scoreOf(3.5, {}) === 3.5, 'a half mark is a real opinion');
  ok(scoreOf('4', {}) === null, '⚑ text is refused rather than coerced — "4" from a form that forgot to parse is a different bug, and swallowing it hides that too');
  ok(scoreOf(5, { min: 0, max: 10 }) === 5 && scoreOf(9, { min: 0, max: 10 }) === 9, 'and the scale is the caller\'s to set');
}

console.log('\n=== §5 · ⚑ THE COMPARISON A HIRING DECISION RESTS ON ===');
{
  const seenProperly = panel([card(all(4)), card(all(4), 'Alex')], O);
  const seenOnce = panel([card({ technical: 5 }, 'Rushed')], O);
  const c = compare(seenOnce, seenProperly, O);
  ok(c.ahead === null && c.certain === false,
     '⚑ a candidate seen once on one dimension is NOT ranked above one seen twice on all seven, whatever the two means happen to be');
  ok(/comparable evidence/.test(c.reason), 'and it says the evidence is not comparable');

  const a = panel([card(all(5))], O), b = panel([card(all(3), 'Alex')], O);
  const fair = compare(a, b, O);
  ok(fair.ahead === 'a' && fair.certain === true, 'on comparable evidence it answers plainly');
  ok(compare(b, a, O).ahead === 'b', 'and the same the other way round');
  ok(compare(a, panel([card(all(5), 'Alex')], O), O).ahead === null && compare(a, panel([card(all(5), 'Alex')], O), O).certain === true,
     'an honest tie is certain — "the same score" is an answer, not a refusal');
  ok(compare(a, panel([], O), O).certain === false, 'and an unscored candidate cannot be ranked at all');
  ok(compare(null, null, O).ahead === null, 'nor can two of nothing');
}

console.log('\n=== §6 · the weighting, which WAS right ===');
{
  // technical counts 1.2, curiosity 0.9 — a 5 on technical should outweigh a 5 on curiosity.
  const tech = assess(card({ technical: 5, curiosity: 1 }), O);
  const curi = assess(card({ technical: 1, curiosity: 5 }), O);
  ok(tech.score > curi.score,
     '⚑ the same two marks the other way round give a higher score when the 5 is on the heavier dimension — this part always worked and is kept');
  ok(assess(card(all(4)), O).score === 4, 'and weights cannot move a flat score off its own value');
  ok(assess(card({ technical: 5 }), { dimensions: DIMS }).score === 5, 'with no weights supplied every dimension counts one');
  ok(assess(card({ technical: 5 }), { dimensions: DIMS, weights: { technical: -3 } }).score === 5,
     'and a negative weight is ignored rather than inverting the meaning of a mark');
}

console.log('\n=== §7 · pure under garbage ===');
{
  const junk = [null, undefined, '', 0, [], {}, NaN, 'x', { scores: 'no' }, { scores: { technical: {} } }];
  let threw = null;
  for (const j of junk) {
    try { scoreOf(j, j); assess(j, j); panel(j, j); compare(j, j, j); panel([j], O); } catch (e) { threw = `${JSON.stringify(j)} → ${e.message}`; }
  }
  ok(threw === null, 'no input throws' + (threw ? ' — ' + threw : ''));
  ok(assess({}, O).score === null && assess({}, O).coverage === 0, 'an empty scorecard scores nothing');
  ok(assess(card(all(4)), {}).score === null,
     '⚑ with NO dimensions supplied nothing can be scored — inventing a set to average over would be answering a question nobody asked');
  ok(panel([card(all(4)), null, 'x'], O).usable === 1, 'rubbish in a panel is skipped, not scored');
  ok(panel([card(all(4)), null], O).count === 1, 'and it is not counted as a scorecard either');
}

console.log('\n=== §8 · ⚑ NaN IS A NUMBER, AND IT IS NOT A SCORE ===');
{
  ok(scoreOf(NaN, {}) === null,
     '⚑ NaN passes a typeof check for "number" — so the finite test has to stand on its own, or a broken calculation arrives on a scorecard as a mark');
  ok(scoreOf(Infinity, {}) === null && scoreOf(-Infinity, {}) === null, 'and so do the infinities');
  ok(assess(card({ technical: NaN }), O).invalid.includes('technical'), 'and inside a scorecard it is reported as an unusable answer');
  ok(assess(card({ technical: NaN }), O).score === null, 'not quietly folded into the mean');
}

console.log('\n=== §9 · the exact edges ===');
{
  // A weight of zero: does the dimension count for nothing, or count as one?
  const zero = assess(card({ technical: 5, curiosity: 1 }), { dimensions: ['technical', 'curiosity'], weights: { technical: 0 } });
  ok(zero.score === 3,
     '⚑ a weight of ZERO is ignored and the dimension counts as one — a zero weight silently deleting an answer somebody wrote down is worse than treating it as unset');

  // Coverage exactly at the sparse floor. Four of seven WEIGHTED dimensions is 0.597, not 0.5 — so
  // this uses four equal ones, where two scored really is exactly a half. A boundary test that does
  // not land on the boundary tests nothing.
  const FOUR = { dimensions: ['a', 'b', 'c', 'd'], minCoverage: 0.5 };
  const half = panel([card({ a: 5, b: 5 }, 'Half')], FOUR);
  ok(half.thin.length === 0,
     '⚑ coverage exactly ON the floor is not thin — the boundary belongs to the scorecard, or a rule of "at least half" quietly means "more than half"');
  ok(panel([card({ a: 5 }, 'Under')], FOUR).thin.length === 1, 'and just under it is');
  ok(assess(card({ a: 5, b: 5 }), FOUR).coverage === 0.5, 'two of four equal dimensions really is a half');

  // Coverage gap exactly at the tolerance.
  const a = { score: 5, coverage: 1 }, b = { score: 3, coverage: 0.75 };
  ok(compare(a, b, { coverageGap: 0.25 }).certain === true,
     '⚑ a gap exactly AT the tolerance is still comparable — the boundary belongs to the comparison');
  ok(compare(a, { score: 3, coverage: 0.7 }, { coverageGap: 0.25 }).certain === false, 'and a hair beyond it is not');
}

console.log('\n=== §10 · nothing is scored on a dimension that is not one ===');
{
  ok(assess(card({ technical: 5 }), { dimensions: ['technical', '', null, 42] }).dimensions === 1,
     '⚑ an empty or non-text dimension is dropped — otherwise it sits in the denominator for ever as a thing nobody can ever answer');
  ok(assess(card(all(4)), { dimensions: DIMS }).complete === true, 'a real list still works');
  ok(assess(card(all(4)), { dimensions: [] }).complete === false,
     '⚑ and an EMPTY list is never "complete" — with nothing to ask about, nothing has been assessed');
  ok(assess(card(all(4)), { dimensions: [] }).score === null, 'and there is no score to report');
}

console.log('\n=== §11 · each side of the comparison, on its own ===');
{
  const good = { score: 4, coverage: 1 };
  ok(compare({ score: null, coverage: 1 }, good, O).certain === false, 'an unscored FIRST candidate cannot be ranked');
  ok(compare(good, { score: null, coverage: 1 }, O).certain === false, 'nor an unscored second');
  ok(compare({ coverage: 1 }, good, O).certain === false, 'nor one whose score is simply absent');
  ok(compare(good, { coverage: 1 }, O).certain === false, 'from either side');
  ok(compare(good, good, O).certain === true, 'while two real scores compare fine');
}

console.log(`\n${fail === 0 ? '✓ ALL PASS' : '✗ FAILURES'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
