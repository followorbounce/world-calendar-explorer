# World Calendar Explorer

A single-page, museum-exhibit-style educational site: convert dates between
any of 10 bidirectional calendar systems (and display in all 28 supported
systems), with real (not simulated) astronomical diagrams, a full
mathematical conversion lab, an encyclopedia entry per system, a
chronological timeline, and a poster-export feature. No build step, no
framework — plain HTML/CSS/JS.

## Design
"Observatory instrument / antique scientific atlas" aesthetic, deliberately
distinct from this account's other sites (compare the Bauhaus/constructivist
`tarot` site). Two full themes (`data-theme="dark"`/`"light"`, plus
`prefers-color-scheme` auto-detection): a dark "Observatory" theme (navy,
brass/gold accents) and a light "Atlas" theme (parchment, ink, brass).
Typography: `Spectral` (serif, headings — evokes museum placards/scientific
atlases), `Inter` (body), `IBM Plex Mono` (data: JDN, timestamps, formulas,
table labels). All from Google Fonts.

## Architecture
- `js/core.js` — the mathematical foundation. Every calendar converts
  to/from the Julian Day Number (JDN, integer, noon-based, standard
  Fliegel & Van Flandern 1968 algorithm) — never directly calendar-to-calendar.
  Same algorithm already verified and in production on the sibling
  `Maya-Calendar` repo. Also: ISO week date (via native `Date`), Unix
  epoch conversion, weekday-from-JDN, month names.
- `js/calendars/ancient.js` — Byzantine, Coptic, Ethiopian, Armenian,
  Assyrian, Egyptian Civil, Olympiad, Seleucid, French Republican,
  Discordian, Holocene, Astronomical Year Numbering. All exact/well-defined
  epoch-offset or 30-day+epagomenal-day arithmetic, verified against known
  reference dates (e.g. Coptic New Year 2025) before use. Now also exports
  `copticToJDN`, `ethiopianToJDN`, `frenchRepToJDN` for the any-to-any
  converter, plus month-name arrays.
  Ancient Roman calendar, Julian Reform, and (fully) Ancient Greek Olympiad
  civil dating are covered as **encyclopedia content only** — they were
  never continuously-defined arithmetic systems, so a "live converter" for
  them would be fabricating precision that doesn't exist historically.
- `js/calendars/abrahamic.js` — Hebrew (full molad/dehiyyot arithmetic),
  Islamic Tabular, Bahá'í (Badí', post-2015 astronomical Naw-Rúz).
  Hebrew and Islamic algorithms transcribed from John Walker's Fourmilab
  Calendar Converter (public domain, a direct implementation of
  Dershowitz & Reingold's *Calendrical Calculations*) — see "Sourcing &
  verification" below. Bahá'í Naw-Rúz uses Meeus's equinox (with periodic
  terms) vs. computed Tehran sunset (see caveat in its encyclopedia entry).
- `js/calendars/asian.js` — Chinese Zodiac + Sexagenary Cycle (see
  approximation caveat below), Japanese Imperial Eras (5 most recent,
  exact proclaimed dates), Buddhist Era (Thai), Persian Solar Hijri
  (Borkowski break-year algorithm, Birashk 2820-cycle only as an
  out-of-range fallback; verified against Nowruz 2024/2025/2026), Indian National
  Calendar / Saka Era (Fourmilab/D&R algorithm, verified against 2025
  Chaitra 1), Vikram Samvat (year-offset only, explicitly flagged as
  incomplete — see below).
- `js/calendars/maya.js` — Long Count / Tzolk'in / Haab', byte-for-byte
  the same GMT 584283 correlation and algorithm as the `Maya-Calendar` repo.
  Now also exports `toJDN(baktun, katun, tun, uinal, kin)` for the
  any-to-any converter.
- `js/registry.js` — the central `CALENDARS` array: every system's key,
  display name, category, and a `compute(ctx)` function. `ctx = { jdn, y,
  m, d, isBCE, weekday, hoursUTC }`, built once per selected date in
  `app.js`. This is what the dashboard, conversion table, converter, and
  era explorer all iterate over. Also exports `SOURCES` — the 10
  bidirectional calendar systems with their month names and field
  definitions, used by the any-to-any converter UI.
- `js/data/encyclopedia.js` — history/use/religious-context/astronomical-
  basis/epoch/leap-logic/method for every calendar in the registry.
- `js/data/timeline.js` — 28 chronological entries (3114 BCE Maya era-base
  through 2019 CE Reiwa), each with a real, well-documented date.
- `js/astronomy.js` — the two animated SVG diagrams (solar-year orbit with
  equinox/solstice markers; lunar-phase illuminated-region path). The moon
  phase path's arc-sweep-flag logic was derived and verified analytically
  at four checkpoints (new/first-quarter/full/last-quarter) before use —
  see progress.md for the derivation.
- `js/app.js` — wires everything to the DOM: dashboard (live-updating
  clock), conversion table (with category filter chips), converter
  (now with a source-calendar dropdown for any-to-any conversion, dynamic
  input fields per calendar, and Maya Long Count 5-field input),
  timeline, encyclopedia (with filter chips, `<details>` accordion),
  astronomy diagram sliders, comparison-engine table, era/epoch explorer,
  math lab (renders the actual JDN arithmetic for the selected date, plus
  a couple of worked non-trivial conversions), theme toggle (persisted to
  `localStorage` key `fb-theme`, shared across all followorbounce sites),
  scroll-spy nav, poster export (Canvas API → PNG download), and Maya
  result links to the sibling Maya-Calendar site.
- `timezones.html` — **World Timezone Map** (P2). Self-contained page
  (links to shared `style.css` for design tokens, all JS inline). SVG
  equirectangular world map with simplified continent outlines, 27 timezone
  bands, real-time day/night terminator (solar declination formula),
  60+ city dots with labels. Five sections: interactive map, 24-hour time
  ruler (all UTC offsets with fractional), live world clocks grid (updates
  every second via `Intl` API — handles DST automatically), 10 special-zone
  explainer cards (India, Nepal, Iran, China, Chatham, Kiribati, Australia,
  Spain, IDL, Russia), and a "How Timezones Work" educational section.
  Theme toggle unified with `fb-theme` localStorage key. Cross-linked
  from `index.html` nav bar.

## Sourcing & verification
Every non-trivial algorithm was either (a) independently re-derived and
numerically verified against known reference dates in Python before being
transcribed to JS, or (b) sourced from a named, checkable reference
(primarily John Walker's Fourmilab Calendar Converter, public domain) and
then *still* independently verified against real-world reference dates
(2025 Rosh Hashanah, 2025 1 Muharram, 2025 Nowruz, 2025 Chaitra 1, 2025
Ayyám-i-Há, the 1582 Julian→Gregorian transition, J2000.0, the Unix
epoch) — not just trusted at face value. See `progress.md` for the
specific checks run for each system.

## Known approximations (deliberately flagged, not hidden)
- **Chinese Zodiac/Sexagenary Cycle**: year boundary approximated at 4
  February instead of the true lunisolar Chinese New Year (can be off by
  a few weeks in Jan/early Feb of some years).
- **Persian (Solar Hijri)**: Borkowski's arithmetic reproduction of the
  equinox-based official calendar, valid AP -61..3177 (Birashk's 2820-year
  cycle outside that range). Birashk alone was wrong for 2025 — see
  progress.md 2026-10-02.
- **Bahá'í Naw-Rúz**: equinox (Meeus ch. 27, ~1 min) compared with computed
  Tehran sunset (NOAA formulae); fixed 21 March before 2015. Years where
  the two fall within minutes (2026: both ~18:16 IRST) are borderline. Kull-i-Shay'/Váhid numbering follows
  the calendar's straightforward structural definition but wasn't
  cross-verified against a Bahá'í almanac.
- **Vikram Samvat**: year-offset only (+56/+57, Chaitradi convention) —
  NOT a full lunisolar conversion; exact month/day needs regional Panchang
  data outside this project's current scope. Documented as incomplete
  rather than silently wrong.
- **Islamic Tabular**: one of at least two historically-used 30-year leap
  patterns; real observed/announced Hijri dates can differ from this
  arithmetic approximation by a day.
- **Maya**: GMT 584283 correlation (the majority-scholarly-support value);
  the nearby 584285 "Lounsbury" correlation shifts every date by two days.
- **Olympiad / Seleucid**: whole-year or civil-boundary approximations of
  systems that were never precisely fixed historically.

## Deliberately not built this pass
The brief asked for as much as possible; these were the highest-effort,
lowest-certainty items, cut to keep everything actually shipped accurate
and real rather than padding out fake precision:
- ~~**Human Timekeeping Map**~~ — **DONE** as `timezones.html`: interactive
  SVG world timezone map with continent outlines, timezone bands, day/night
  terminator, 60+ city markers with live clocks, 24-hour time ruler, 10
  special-zone explainers, and a "How Timezones Work" educational section.
- **Calendar relationship graph** — not started.
- **Literal rotating zodiac wheel widget** — the Chinese Zodiac is fully
  computed and displayed, but not as an animated wheel; the astronomy
  section's two SVG diagrams (solar orbit, lunar phase) were prioritized
  instead as the "real astronomy" showpiece.
- **Civilization timeline overlays** on the timeline (parallel bands per
  civilization) — the timeline is a single chronological list, not a
  multi-track visualization.
- **True Chinese lunisolar calendar, Korean calendar, Vietnamese
  calendar** — all need real ephemeris-level new-moon/solar-term
  astronomical calculation (VSOP87-class), not just arithmetic — out of
  scope for this pass. Only the (flagged-approximate) Zodiac/Sexagenary
  layer is implemented for the Chinese calendar family.
- **Zoroastrian calendar** (three rival variants — Fasli/Qadimi/
  Shahanshahi), **Regnal year systems**, **full Ancient Roman calendar**
  — covered nowhere yet, not even as encyclopedia content; genuinely
  contested/non-arithmetic systems.
- **Internationalization** — English only.
- **Offline/PWA packaging** (service worker + manifest, like the sibling
  Maya-Calendar site has) — not added.
- **Full WCAG accessibility audit** — reasonable semantic HTML,
  `aria-hidden` on decorative SVGs, `aria-live` on the copy-status message,
  but no formal audit pass.

## Conventions
- English UI by default per the standing no-Russian-unless-specified rule.
- Never hand-edit a calendar's output without also updating its
  `EncyclopediaData` entry and, if the algorithm itself changes, its
  verification note in progress.md.
- If you add a calendar, verify it against at least one real-world
  reference date before shipping — every existing entry was.

## Deploy
Public repo, GitHub Pages from `main` root — live at
https://followorbounce.github.io/world-calendar-explorer/. Shares the
`followorbounce.github.io` Cloudflare Web Analytics site (see
`[[cloudflare-analytics-setup]]` in the assistant's memory).
