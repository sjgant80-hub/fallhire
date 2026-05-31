# ◊ fallhire

**Sovereign hiring pipeline + interview scorecard. Single HTML file. Your candidates stay yours.**

Prime 359 · κ=1

---

## What it is

A complete hiring tool that runs in a browser tab. No cloud. No subscription. No SaaS account. Your entire hiring pipeline — candidates, roles, scorecards, notes — lives in one HTML file you can email to yourself.

Open it. It works. Close it. It's still there.

Rides LinkedIn's verified 1.54× reach multiplier on HR/Recruitment content (AuthoredUp 3M+ post study). Built for hiring managers who want a Greenhouse-grade workflow without the £600/month per-seat tax.

---

## What it does

- **Kanban pipeline** — drag-and-drop candidates across 7 stages: Applied · Phone Screen · Interview 1 · Interview 2 · Offer · Hired · Rejected
- **Interview scorecards** — 7 dimensions (technical · communication · culture · ownership · craft · curiosity · scope), 1-5 scale, weighted averages, multiple per candidate (one per interviewer), variance shown
- **Candidate cards** — name, role, source, applied date, LinkedIn URL, notes, scorecard average
- **Compare mode** — pick 2-3 finalists side-by-side with radar charts
- **Analytics** — time-in-stage histogram, funnel rate, source effectiveness
- **Export** — full JSON, CSV per role, printable summary

---

## Two-audience guide

### For hiring managers

1. Open `index.html` (or visit the live URL)
2. Drag the example candidates between stages
3. Click any candidate to add a scorecard
4. When done, **Export → JSON** to back up your data
5. Send to your laptop / phone / a colleague — same file, same data

That's it. No login. No invoice.

### For developers

- Single HTML file · vanilla JS · no build step · no framework
- IndexedDB primary, localStorage fallback
- HTML5 drag API for the kanban
- SVG radar charts (no Chart.js)
- PWA manifest baked via `data:` URL — Add to Home Screen works
- Konomi licence shim (free cap: 1 role · 20 candidates · watermark; paid: unlimited)
- fallmesh hook on `BroadcastChannel('fall-signal')` — emits `candidate_advanced` / `offer_extended` events
- Optional `window.FallVetter.vet()` hook for candidate dedup if loaded

To fork: edit `index.html`, push, enable Pages.

---

## Pricing

| Tier | Price | What you get |
|---|---|---|
| **Free** | £0 | 1 active role · 20 candidates · watermark |
| **Pro** | £97 one-time | Multi-role · unlimited candidates · audit chain · ATS import |
| **Firm** | from £997 | Org-wide install, branding, training |

---

## Why sovereign?

Hiring data is some of the most sensitive data your company holds. Names, emails, salary expectations, references, rejection reasons. None of it should leave your device by default.

A sovereign tool means:
- No cloud account that can be breached
- No vendor that can change its terms or get acquired
- No subscription to cancel when hiring slows
- No data processing agreement to chase
- No export migration when you switch tools
- Your candidates' data stays under your control · always

---

## Built by

**Simon Gant** · sjgant80-hub · part of the AIN estate

Prime 359 · MIT · ◊·κ=1
