# Progress — World Calendar Explorer

## Status
Built 2026-09-19, verified working in a real headless Firefox (Selenium +
cached geckodriver from the machinery-site session) — no JS errors, all
28 calendars render, all interactive elements (theme toggle, sliders,
filters, converter buttons) tested and functional. Not yet pushed.

## Recent work
- 2026-09-19 — Full build from a very large, detailed brief ("World
  Calendar Explorer" — 10 page sections, ~40 named calendar systems,
  animated SVG astronomy, world map, encyclopedia, comparison engine,
  math lab). Given the genuine scope (this is closer to a small
  application than a page), prioritized shipping a smaller set of
  **real, individually-verified** conversions over a larger set of
  plausible-looking-but-unverified ones. See CLAUDE.md's "Deliberately
  not built this pass" section for the explicit cut list.

### Research phase
Forked a research agent (500s runtime, 35 tool calls) to find verified
algorithms for the 5 hardest systems (Hebrew, Islamic Tabular, Persian
Solar Hijri, Bahá'í, Indian National Calendar) before writing any code for
them. It found and read the actual source of John Walker's Fourmilab
Calendar Converter (public domain, a direct implementation of Dershowitz
& Reingold's *Calendrical Calculations*) rather than working from prose
descriptions, and flagged several real disagreements/uncertainties up
front (competing Islamic tabular leap patterns; Persian arithmetic vs.
true-astronomical divergence outside ~1925-2090; the Bahá'í Naw-Rúz
equinox needing real astronomy, not arithmetic; an unresolved question
about Bahá'í Váhid-cycle numbering it couldn't fully verify). All of that
made it into the shipped encyclopedia entries and code comments rather
than being silently dropped.

### Verification, not just trust
Every algorithm — whether self-derived or from the research — was
numerically checked in Python against real-world reference dates before
being transcribed into `js/`, specifically:
- Core JDN algorithm: J2000.0 (2000-01-01 → JDN 2451545), Unix epoch
  (1970-01-01 → JDN 2440588), the 1582 Julian→Gregorian 10-day gap.
- Coptic: New Year (1 Thout) AM 1742 = 11 September 2025 ✓.
- Hebrew: Rosh Hashanah 5786 = 23 September 2025 ✓ (checked the boundary
  day before, too).
- Islamic Tabular: 1 Muharram 1447 AH ≈ late June 2025 ✓.
- Persian: Nowruz 1404 AP = 20 March 2025 ✓ (matches the real 2025
  astronomical equinox date, not just the arithmetic approximation's own
  self-consistency).
- Indian National Calendar: Chaitra 1, Saka 1947 = 22 March 2025 ✓, with
  the day-before check landing correctly in the prior Saka year.
- Bahá'í: independently implemented the Naw-Rúz/Ayyám-i-Há logic (this
  part wasn't in the Fourmilab source — the research flagged the
  post-2015 astronomical reform as needing a fresh implementation) and
  checked it against the well-known real Ayyám-i-Há 2025 dates
  (25-28 February) ✓.
- Persian `leap_persian`: caught and fixed a real transcription bug here
  — my first pass at the formula was garbled (wrong grouping of the
  `mod(...)` calls), caught by re-deriving it against the verified source
  formula rather than trusting my own first draft. **Lesson: re-verify a
  transcription even when you believe you copied it correctly — I had
  already verified the *reference* formula, but that didn't protect
  against a copy-paste/rewrite error in my own code.**
- Moon-phase SVG arc-sweep-flag geometry: this one had no external source
  to check against, so it was derived from first principles (SVG's actual
  sweep-flag semantics, verified concretely: "sweep=1 top→bottom = right
  half", etc.) and checked analytically at four boundary phases (new =
  zero area, first/last quarter = exactly half-circle each, full = whole
  circle) before trusting it — then re-confirmed visually in the
  screenshot (a clean half-lit "First Quarter" moon).

### Design
Deliberately different visual language from this account's other sites —
"observatory instrument / antique scientific atlas" rather than the
`tarot` site's Bauhaus/constructivist look. `Spectral` + `Inter` +
`IBM Plex Mono`, two full themes (dark "Observatory", light "Atlas"),
screenshotted and reviewed in both before calling it done.

### Bugs caught during browser verification (not just written-then-assumed-correct)
- Gregorian/Julian/Byzantine/Astronomical-Year-Numbering table rows showed
  "M9" instead of "September" — `fmtResult()`'s fallback used a bare
  `M${month}` when no `monthName` was set; fixed by adding a shared
  `Core.MONTH_NAMES` table and wiring it into the 4 affected `registry.js`
  entries (plus `CalAncient.byzantine`).
- Olympiad, Maya, Discordian, and Chinese Zodiac rows showed "—" for
  their representation — their `compute()` functions returned rich
  structured data but no `label`/`year`+`month`+`day` combination
  `fmtResult()` could render. Added explicit `label` fields to all four.
  **Both of these were real bugs a browser check caught that a bracket-
  balance/syntax check alone would have missed entirely** — worth
  remembering for any future data-heavy table UI: check what actually
  renders, not just that the code parses.

- **2026-09-19 (same day) — Pushed and deployed.** `git init` + `gh repo create` (private first, then made public + Pages enabled on user confirmation, since Pages needs a public repo on this GitHub plan — same constraint hit with the `tarot` repo). Added the Cloudflare Web Analytics beacon (shares the `followorbounce.github.io` site/token). Live at https://followorbounce.github.io/world-calendar-explorer/, confirmed via `gh api .../pages/builds/latest` + a direct fetch showing the analytics beacon present.

## Next steps
- The "Deliberately not built this pass" list in CLAUDE.md is long — say
  which one (if any) to tackle next. The world map and the true Chinese
  lunisolar calendar are the two biggest remaining lifts.
- Images/assets are zero — this is pure HTML/CSS/JS/SVG, no downloaded
  media, so no size concerns like the tarot site had.
- No offline/PWA packaging yet (the sibling Maya-Calendar site has a
  service worker + manifest pattern that could be reused here).
