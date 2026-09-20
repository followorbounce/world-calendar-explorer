/* ============================================================
   App wiring: dashboard, converter, table, timeline, encyclopedia,
   astronomy diagrams, comparison engine, era explorer, math lab.
   ============================================================ */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const dateInput = $("#dateInput");
  const timeInput = $("#timeInput");

  function todayParts() {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  }

  function currentSelection() {
    let y, m, d;
    if (dateInput.value) {
      const [yy, mm, dd] = dateInput.value.split("-").map(Number);
      y = yy; m = mm; d = dd;
    } else {
      ({ y, m, d } = todayParts());
    }
    let h = 12, min = 0;
    const t = (timeInput.value || "12:00").split(":").map(Number);
    if (t.length === 2 && !Number.isNaN(t[0])) { h = t[0]; min = t[1]; }
    return { y, m, d, hoursUTC: h + min / 60 };
  }

  function buildContext(sel) {
    const jdn = Core.gregorianToJDN(sel.y, sel.m, sel.d);
    return { jdn, y: sel.y, m: sel.m, d: sel.d, isBCE: false, hoursUTC: sel.hoursUTC, weekday: Core.weekdayFromJDN(jdn) };
  }

  function fmtResult(r) {
    if (r.error) return r.note || "unavailable";
    if (r.label) return r.label;
    const parts = [];
    if (r.day != null) parts.push(r.day);
    if (r.monthName) parts.push(r.monthName);
    else if (r.month != null) parts.push(`M${r.month}`);
    if (r.year != null) parts.push(r.year);
    return parts.length ? parts.join(" ") : "—";
  }

  /* ---------- 1. Dashboard ---------- */
  function renderDashboard(ctx) {
    const now = new Date();
    const grid = $("#dashGrid");
    const items = [
      { label: "Gregorian Date", value: `${ctx.y}-${String(ctx.m).padStart(2, "0")}-${String(ctx.d).padStart(2, "0")}`, sub: Core.weekdayName(ctx.jdn) },
      { label: "Local Time", value: now.toLocaleTimeString(), sub: Intl.DateTimeFormat().resolvedOptions().timeZone },
      { label: "UTC Time", value: now.toUTCString().slice(17, 25), sub: now.toISOString().slice(0, 10) },
      { label: "Julian Day Number", value: `${ctx.jdn}`, sub: "days since 4713 BCE" },
      { label: "Unix Timestamp", value: `${Math.floor(now.getTime() / 1000)}`, sub: "seconds since 1970" },
    ];
    grid.innerHTML = items.map((i) => `
      <div class="dash-card">
        <div class="label">${i.label}</div>
        <div class="value">${i.value}</div>
        <div class="sub">${i.sub}</div>
      </div>`).join("");
  }

  /* ---------- 2. Conversion table ---------- */
  let tableFilter = "all";
  function renderTableFilters() {
    const cats = [{ key: "all", label: "All" }, ...Object.entries(Registry.CATEGORIES).map(([k, v]) => ({ key: k, label: v }))];
    $("#tableFilters").innerHTML = cats.map((c) => `<button class="chip${c.key === tableFilter ? " active" : ""}" data-cat="${c.key}">${c.label}</button>`).join("");
    $$("#tableFilters .chip").forEach((btn) => btn.addEventListener("click", () => {
      tableFilter = btn.dataset.cat;
      renderTableFilters();
      renderTable(lastCtx);
    }));
  }
  function renderTable(ctx) {
    const results = Registry.computeAll(ctx);
    const filtered = tableFilter === "all" ? results : results.filter((r) => r.category === tableFilter);
    const tbody = $("#conversionTable tbody");
    tbody.innerHTML = filtered.map((r) => `
      <tr>
        <td>${r.name}</td>
        <td class="category">${r.categoryLabel}</td>
        <td>${fmtResult(r)}</td>
        <td>${r.year ?? "—"}</td>
        <td>${r.monthName || (r.month ?? "—")}</td>
        <td>${r.day ?? "—"}</td>
        <td>${r.note || r.era || ""}</td>
      </tr>`).join("");
  }

  /* ---------- 3. Converter ---------- */
  function renderConverter(ctx) {
    const results = Registry.computeAll(ctx);
    $("#converterResults").innerHTML = results.map((r) => `
      <div class="result-card">
        <div class="cal-name">${r.name}</div>
        <div class="cal-value">${fmtResult(r)}</div>
        ${r.note ? `<div class="cal-note">${r.note}</div>` : (r.era ? `<div class="cal-note">${r.era}</div>` : "")}
      </div>`).join("");
  }

  /* ---------- 4. Timeline ---------- */
  function renderTimeline() {
    const sorted = [...TimelineData].sort((a, b) => a.year - b.year);
    $("#timelineList").innerHTML = sorted.map((t) => `
      <div class="timeline-item">
        <div class="t-year">${t.label}</div>
        <h3>${t.title}</h3>
        <p>${t.text}</p>
      </div>`).join("");
  }

  /* ---------- 5. Encyclopedia ---------- */
  let encycloFilter = "all";
  function renderEncycloFilters() {
    const cats = [{ key: "all", label: "All" }, ...Object.entries(Registry.CATEGORIES).map(([k, v]) => ({ key: k, label: v }))];
    $("#encycloFilters").innerHTML = cats.map((c) => `<button class="chip${c.key === encycloFilter ? " active" : ""}" data-cat="${c.key}">${c.label}</button>`).join("");
    $$("#encycloFilters .chip").forEach((btn) => btn.addEventListener("click", () => {
      encycloFilter = btn.dataset.cat;
      renderEncycloFilters();
      renderEncyclopedia();
    }));
  }
  function renderEncyclopedia() {
    const cals = encycloFilter === "all" ? Registry.CALENDARS : Registry.CALENDARS.filter((c) => c.category === encycloFilter);
    $("#encyclopediaList").innerHTML = cals.map((c) => {
      const e = EncyclopediaData[c.key];
      if (!e) return "";
      return `
      <details class="encyclo-entry">
        <summary>${c.name} <span class="tag">${Registry.CATEGORIES[c.category]}</span></summary>
        <div class="encyclo-body">
          <dl>
            <dt>History</dt><dd>${e.history}</dd>
            <dt>Geographic use</dt><dd>${e.use}</dd>
            <dt>Religious context</dt><dd>${e.religious}</dd>
            <dt>Astronomical basis</dt><dd>${e.astronomical}</dd>
            <dt>Epoch</dt><dd>${e.epoch}</dd>
            <dt>Leap logic</dt><dd>${e.leap}</dd>
            <dt>Conversion method</dt><dd>${e.method}</dd>
          </dl>
        </div>
      </details>`;
    }).join("");
  }

  /* ---------- 6. Astronomy ---------- */
  function initAstronomy(ctx) {
    const solarSvg = $("#solarDiagram");
    const lunarSvg = $("#lunarDiagram");
    Astronomy.renderSolarDiagram(solarSvg);
    Astronomy.renderLunarDiagram(lunarSvg);

    const dayOfYear = ctx.jdn - Core.gregorianToJDN(ctx.y, 1, 1);
    $("#solarSlider").value = dayOfYear;
    Astronomy.updateSolarDiagram(solarSvg, dayOfYear);
    $("#solarReadout").textContent = `Day ${dayOfYear}`;
    $("#solarSlider").addEventListener("input", (e) => {
      const v = Number(e.target.value);
      Astronomy.updateSolarDiagram(solarSvg, v);
      $("#solarReadout").textContent = `Day ${v}`;
    });

    const knownNewMoon = Core.gregorianToJDN(2000, 1, 6); // 6 Jan 2000 ~ new moon reference
    const daysSinceNew = Core.mod(ctx.jdn - knownNewMoon, Astronomy.SYNODIC_MONTH);
    $("#lunarSlider").value = daysSinceNew.toFixed(1);
    Astronomy.updateLunarDiagram(lunarSvg, daysSinceNew);
    $("#lunarReadout").textContent = `${Astronomy.phaseName(daysSinceNew / Astronomy.SYNODIC_MONTH)}`;
    $("#lunarSlider").addEventListener("input", (e) => {
      const v = Number(e.target.value);
      Astronomy.updateLunarDiagram(lunarSvg, v);
      $("#lunarReadout").textContent = Astronomy.phaseName(v / Astronomy.SYNODIC_MONTH);
    });

    $("#astroFacts").innerHTML = [
      { label: "Tropical year", value: `${Astronomy.TROPICAL_YEAR.toFixed(5)} days`, sub: "equinox to equinox — what solar calendars track" },
      { label: "Sidereal year", value: `${Astronomy.SIDEREAL_YEAR.toFixed(5)} days`, sub: "one full orbit relative to the fixed stars" },
      { label: "Synodic month", value: `${Astronomy.SYNODIC_MONTH.toFixed(5)} days`, sub: "new moon to new moon — what lunar calendars track" },
      { label: "Sidereal month", value: "27.32166 days", sub: "one orbit of the Moon relative to the stars" },
      { label: "Axial tilt", value: "23.44°", sub: "the obliquity that produces the seasons" },
      { label: "Precession cycle", value: "~25,772 years", sub: "the slow wobble of Earth's axis (Hipparchus, 2nd c. BCE)" },
    ].map((f) => `<div class="dash-card"><div class="label">${f.label}</div><div class="value">${f.value}</div><div class="sub">${f.sub}</div></div>`).join("");
  }

  /* ---------- 7. Comparison engine ---------- */
  const COMPARISON_DATA = [
    { name: "Gregorian", type: "Solar", length: "365.2425", correction: "Leap day every 4y, skip centuries not ÷400", drift: "~1 day / 3,300 years" },
    { name: "Julian", type: "Solar", length: "365.25", correction: "Leap day every 4y, no exceptions", drift: "~1 day / 128 years" },
    { name: "Egyptian Civil", type: "Solar", length: "365", correction: "None", drift: "~1 day / 4 years (full cycle every 1461y)" },
    { name: "Armenian", type: "Solar ('vague year')", length: "365", correction: "None", drift: "~1 day / 4 years (full cycle every 1461y)" },
    { name: "Islamic (Tabular)", type: "Lunar", length: "354.367", correction: "11 leap days per 30-year cycle", drift: "Not solar-anchored — cycles through all seasons every ~33 years by design" },
    { name: "Hebrew", type: "Lunisolar", length: "365.2468 (avg.)", correction: "7 intercalary months per 19-year Metonic cycle", drift: "~1 day / 216 years vs. the tropical year" },
    { name: "Chinese", type: "Lunisolar", length: "365.25 (avg.)", correction: "Intercalary month added ~every 3 years, tied to solar terms", drift: "Kept close to the solar year by design" },
    { name: "Persian (Solar Hijri)", type: "Solar (astronomical)", length: "365.2422", correction: "True equinox observation (or 2820-year arithmetic approximation)", drift: "Negligible when astronomically observed" },
    { name: "Bahá'í (Badí')", type: "Solar (astronomical)", length: "365.2422", correction: "Ayyám-i-Há intercalary days (4 or 5), Naw-Rúz set by true equinox", drift: "Negligible" },
    { name: "French Republican", type: "Solar", length: "365.25 (algorithmic)", correction: "True equinox originally; Gregorian-style rule in later algorithmic use", drift: "N/A — abolished 1805" },
  ];
  function renderComparison() {
    const max = 366;
    $("#comparisonTable tbody").innerHTML = COMPARISON_DATA.map((c) => {
      const pct = Math.min(100, (parseFloat(c.length) / max) * 100);
      return `<tr>
        <td>${c.name}</td>
        <td>${c.type}</td>
        <td class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>${c.length} days</td>
        <td>${c.correction}</td>
        <td>${c.drift}</td>
      </tr>`;
    }).join("");
  }

  /* ---------- 9. Era explorer ---------- */
  function renderEras(ctx) {
    const eraKeys = ["adbc", "astroyear", "buddhist", "hebrew", "islamic", "holocene", "unix", "bahai", "byzantine", "seleucid"];
    const results = Registry.computeAll(ctx).filter((r) => eraKeys.includes(r.key));
    $("#eraResults").innerHTML = results.map((r) => `
      <div class="result-card">
        <div class="cal-name">${r.name}</div>
        <div class="cal-value">${fmtResult(r)}</div>
        <div class="cal-note">${r.era || r.note || ""}</div>
      </div>`).join("");
  }

  /* ---------- 10. Math lab ---------- */
  function renderMathLab(ctx) {
    const a = Core.floordiv(14 - ctx.m, 12);
    const yy = ctx.y + 4800 - a;
    const mm = ctx.m + 12 * a - 3;
    $("#jdnFormula").textContent =
`a  = floor((14 − m) / 12)        = floor((14 − ${ctx.m}) / 12) = ${a}
y′ = y + 4800 − a                = ${ctx.y} + 4800 − ${a} = ${yy}
m′ = m + 12·a − 3                = ${ctx.m} + 12·${a} − 3 = ${mm}

JDN = d + floor((153·m′ + 2) / 5) + 365·y′
        + floor(y′/4) − floor(y′/100) + floor(y′/400) − 32045

    = ${ctx.d} + ${Core.floordiv(153 * mm + 2, 5)} + ${365 * yy}
        + ${Core.floordiv(yy, 4)} − ${Core.floordiv(yy, 100)} + ${Core.floordiv(yy, 400)} − 32045

    = ${ctx.jdn}`;

    const h = CalAbrahamic.hebrew(ctx.jdn);
    const isl = CalAbrahamic.islamicTabular(ctx.jdn);
    $("#workedFormulas").textContent =
`Hebrew — molad-based arithmetic:
  hebrewDelay1(${h.year}) locates the postponed Tishrei 1 for this year
  by estimating the mean lunar conjunction (molad) in "chalakim"
  (1/1080 hour units) since the epoch, then applying the four
  dehiyyot postponement rules.
  Result: ${h.year} ${h.monthName} ${h.day} (${h.isLeapYear ? "leap" : "common"} year, ${CalAbrahamic.hebrewLeap(h.year) ? 13 : 12} months)

Islamic (Tabular) — direct closed form:
  JDN = day + ceil(29.5×(month−1)) + (year−1)×354
           + floor((3 + 11×year)/30) + ISLAMIC_EPOCH − 1
  Result: ${isl.year} AH, ${isl.monthName} ${isl.day} (${isl.isLeapYear ? "leap" : "common"} year of the 30-year cycle)`;
  }

  /* ---------- theme + nav ---------- */
  function initTheme() {
    const saved = localStorage.getItem("wce-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    $("#themeToggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("wce-theme", next); } catch (e) { /* ignore */ }
    });
  }

  function initNavScrollSpy() {
    const links = $$("#sectionNav a");
    const sections = links.map((l) => document.querySelector(l.getAttribute("href")));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = `#${entry.target.id}`;
          links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === id));
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach((s) => s && obs.observe(s));
  }

  /* ---------- converter buttons ---------- */
  function initConverterButtons() {
    $("#todayBtn").addEventListener("click", () => {
      const t = todayParts();
      dateInput.value = `${t.y}-${String(t.m).padStart(2, "0")}-${String(t.d).padStart(2, "0")}`;
      updateAll();
    });
    $("#copyBtn").addEventListener("click", () => {
      const results = Registry.computeAll(lastCtx);
      const text = results.map((r) => `${r.name}: ${fmtResult(r)}`).join("\n");
      navigator.clipboard?.writeText(text).then(() => {
        $("#copyStatus").textContent = "Copied all results to clipboard.";
        setTimeout(() => { $("#copyStatus").textContent = ""; }, 2500);
      }).catch(() => { $("#copyStatus").textContent = "Copy failed — clipboard access blocked."; });
    });
    $("#shareBtn").addEventListener("click", () => {
      const url = new URL(location.href);
      url.searchParams.set("date", dateInput.value);
      navigator.clipboard?.writeText(url.toString()).then(() => {
        $("#copyStatus").textContent = "Link copied.";
        setTimeout(() => { $("#copyStatus").textContent = ""; }, 2500);
      });
    });
    dateInput.addEventListener("change", updateAll);
    timeInput.addEventListener("change", updateAll);
  }

  /* ---------- orchestration ---------- */
  let lastCtx = null;
  function updateAll() {
    const sel = currentSelection();
    lastCtx = buildContext(sel);
    renderDashboard(lastCtx);
    renderTable(lastCtx);
    renderConverter(lastCtx);
    renderEras(lastCtx);
    renderMathLab(lastCtx);
  }

  function init() {
    const params = new URLSearchParams(location.search);
    const t = todayParts();
    dateInput.value = params.get("date") || `${t.y}-${String(t.m).padStart(2, "0")}-${String(t.d).padStart(2, "0")}`;
    timeInput.value = "12:00";

    initTheme();
    initNavScrollSpy();
    initConverterButtons();
    renderTableFilters();
    renderEncycloFilters();
    renderEncyclopedia();
    renderTimeline();
    renderComparison();

    updateAll();
    initAstronomy(lastCtx);

    setInterval(() => { renderDashboard(lastCtx); }, 1000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
