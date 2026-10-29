// Fills the <!--static:key-->…<!--/static--> regions of today.html and thirteen-months.html for one date
// (default: today in Pacific time), running the site's own calendar code (js/) in a Node vm, so the static
// pages carry the same values the browser would compute. .github/workflows/today.yml runs it every morning.
//   node _src/build_today.mjs [YYYY-MM-DD]
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = vm.createContext({ console, Math, Date, Intl });
for (const f of ["core", "calendars/ancient", "calendars/asian", "calendars/abrahamic", "calendars/maya", "calendars/thirteen", "registry", "today"])
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js", f + ".js"), "utf8"), ctx, { filename: f + ".js" });
const { TodayPage, Thirteen } = vm.runInContext("({ TodayPage, Thirteen })", ctx);

const arg = process.argv[2] || new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
const [y, m, d] = arg.split("-").map(Number);
const iso = arg;

function fill(file, values) {
  const p = path.join(ROOT, file);
  let h = fs.readFileSync(p, "utf8");
  for (const [k, v] of Object.entries(values)) {
    const re = new RegExp("(<!--static:" + k + "-->)[\\s\\S]*?(<!--/static-->)");
    if (!re.test(h)) throw new Error(file + ": no static region " + k);
    h = h.replace(re, (_, a, b) => a + v + b);
  }
  fs.writeFileSync(p, h);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
fill("today.html", {
  date: esc(TodayPage.longDate(y, m, d)),
  count: String(TodayPage.count(y, m, d)),
  stamp: "Page written for " + iso + " (Pacific time); your browser updates it to your own date.",
  rows: "\n" + TodayPage.html(y, m, d) + "\n",
});
const ifc = Thirteen.ifc(y, m, d);
fill("thirteen-months.html", {
  ifc: esc(ifc.special ? ifc.special : ifc.day + " " + ifc.monthName + " " + ifc.year),
  ifcsub: esc((ifc.special ? "Outside the week" : ifc.weekday) + " · Gregorian " + TodayPage.longDate(y, m, d)),
});
console.log("today pages written for", iso);
