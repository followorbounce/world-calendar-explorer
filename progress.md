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
  **CORRECTED 2026-10-02: this check used the wrong reference. Official
  Nowruz 1404 was 21 March 2025 (equinox 12:31 IRST, after noon); Birashk
  gave 20 March. Algorithm replaced — see 2026-10-02 entry.**
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

- **2026-09-26 — World Timezone Map page** (`timezones.html`).
  Self-contained second page with interactive SVG world map (simplified
  continent outlines, timezone bands, real-time day/night terminator),
  60+ cities with live clocks (Intl API, handles DST), 24-hour time ruler,
  10 special-zone explainer cards, and educational section. Theme toggle
  unified: both pages now use `fb-theme` localStorage key (shared with
  all followorbounce.github.io sites) instead of the old `wce-theme` key.
  Cross-linked from index.html navigation bar. Passed structure validation
  (balanced braces/parens/brackets/tags); headless Firefox screenshot
  not possible in this environment (known sandbox limitation) but page
  served 200 with no JS errors in Firefox output.

## Next steps
- **2026-10-02 — Science/maths review: 4 conversion defects fixed** (node
  harness loading js/*.js in a vm context; round-trip + day-continuity
  sweep 1781-2219 CE all 0 failures after fixes).
  - Coptic/Ethiopian: year start used floor((y-1)/4) instead of D&R's
    floor(y/4) → 1 Thout/1 Meskerem one day early in every year divisible
    by 4 (Ethiopian 2016 / Coptic 1740 gave 11 Sep 2023, real 12 Sep; day
    "1" was skipped after Pagume 6). Fixed in `ancient.js` (3 places).
  - French Republican: pure Romme rule mis-dated An IV-XIV (18 Brumaire
    VIII came out 10 Nov 1799). Now uses historical sextiles III/VII/XI for
    Ans I-XIV; identical to Romme from An XV on.
  - Persian: Birashk 2820-cycle put Nowruz 1404 on 20 Mar 2025 (official:
    21 Mar). Replaced with Borkowski break-year algorithm (valid AP -61..3177,
    Birashk kept as fallback). Checked 1300, 1304, 1354, 1375, 1399-1407.
  - Bahá'í: Naw-Rúz now = day the equinox (Meeus ch.27 with periodic terms,
    ΔT-corrected) falls before Tehran sunset; fixed 21 Mar before 2015.
    Old code gave 20 Mar for 2018/2022/2027 (published: 21 Mar). 2026 is
    borderline (equinox and sunset both ~18:16 IRST) — check bahai.org.
  - Encyclopedia entries + CLAUDE.md approximations list updated to match.

- The "Deliberately not built this pass" list in CLAUDE.md is shorter now
  (world map is done). The true Chinese lunisolar calendar is the biggest
  remaining lift.
- Images/assets are still zero — pure HTML/CSS/JS/SVG.
- No offline/PWA packaging yet.
