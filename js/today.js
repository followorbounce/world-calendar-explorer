/* ============================================================
   "Today in every calendar" (today.html): one renderer used twice.
   _src/build_today.mjs runs it in Node each morning to write the static page (so the dates are in the HTML),
   and the page runs it again in the browser for the visitor's own local date.
   Needs Core, Registry and Thirteen (js/core.js, js/calendars/*.js, js/registry.js, js/calendars/thirteen.js).
   ============================================================ */
const TodayPage = (() => {
  "use strict";

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const MAYA = "https://followorbounce.github.io/Maya-Calendar/";
  // where a reader can go deeper from a row
  const MORE = {
    maya: [MAYA, "Maya Calendar"],
    hebrew: ["./#encyclopedia", "Encyclopedia"],
    islamic: ["./#encyclopedia", "Encyclopedia"],
    persian: ["./#encyclopedia", "Encyclopedia"],
    ethiopian: ["./thirteen-months#crossing", "Fixed-month calendars"],
    coptic: ["./thirteen-months#crossing", "Fixed-month calendars"],
    frenchrep: ["./thirteen-months#crossing", "Fixed-month calendars"],
    ifc: ["./thirteen-months", "How the 13-month calendar works"],
    thirteenmoon: ["./thirteen-months#history", "13-month calendars"],
  };
  const ORDER = ["modern", "christian", "jewish", "islamic", "persian", "indian", "eastasian", "buddhist", "mesoamerican", "ancient", "other", "reform"];

  function value(r) {
    if (r.error) return "—";
    if (r.key === "japanese" && r.era) return r.era + " " + r.year + (r.label ? " (" + r.label + ")" : "");
    if (r.label) return r.label;
    const p = [];
    if (r.day != null) p.push(r.day);
    if (r.monthName) p.push(r.monthName);
    if (r.year != null) p.push(r.year);
    return p.join(" ") + (r.era ? " " + r.era.replace(/\s*\(.*\)$/, "") : "");
  }

  function ctxFor(y, m, d) {
    const jdn = Core.gregorianToJDN(y, m, d);
    return { jdn, y, m, d, isBCE: false, hoursUTC: 12, weekday: Core.weekdayFromJDN(jdn) };
  }

  /** All rows for a Gregorian date: the registry's systems plus the two 13 x 28 systems. */
  function rows(y, m, d) {
    const list = Registry.computeAll(ctxFor(y, m, d)).filter((r) => r.key !== "unix");   // a timestamp, not a date
    const ifc = Thirteen.ifc(y, m, d), tm = Thirteen.thirteenMoon(y, m, d);
    list.push({ key: "ifc", name: "International Fixed Calendar (13 × 28)", category: "reform", categoryLabel: "Proposed reforms",
                label: ifc.special ? ifc.label : ifc.label + " (" + ifc.weekday + ")", note: "Proposed 1902, never adopted; shown as if in use this year." });
    list.push({ key: "thirteenmoon", name: "Thirteen Moon (Dreamspell)", category: "reform", categoryLabel: "Proposed reforms",
                label: tm.label, note: "A modern 13 × 28 count (1987–1990), not a Maya calendar." });
    return list;
  }

  /** The grouped rows as HTML (static build and browser). */
  function html(y, m, d) {
    const list = rows(y, m, d), groups = {};
    list.forEach((r) => { (groups[r.category] = groups[r.category] || []).push(r); });
    return ORDER.filter((c) => groups[c]).map((c) =>
      '<section class="grp" aria-labelledby="g-' + c + '"><h2 id="g-' + c + '">' + esc(groups[c][0].categoryLabel) + "</h2><dl>" +
      groups[c].map((r) =>
        '<div class="row" id="' + r.key + '"><dt>' + esc(r.name) + "</dt><dd><span class=\"v\">" + esc(value(r)) + "</span>" +
        (r.note ? '<span class="n">' + esc(r.note) + "</span>" : "") +
        (MORE[r.key] ? '<a class="more" href="' + MORE[r.key][0] + '">' + esc(MORE[r.key][1]) + " →</a>" : "") + "</dd></div>").join("") +
      "</dl></section>").join("\n");
  }

  function count(y, m, d) { return rows(y, m, d).length; }

  function longDate(y, m, d) {
    const wd = Core.weekdayName(Core.gregorianToJDN(y, m, d));
    return wd + " " + d + " " + Core.MONTH_NAMES[m - 1] + " " + y;
  }

  return { rows, html, count, longDate, value };
})();
if (typeof module !== "undefined") module.exports = TodayPage;
