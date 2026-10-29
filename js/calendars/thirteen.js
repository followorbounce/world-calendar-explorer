/* ============================================================
   Thirteen months of 28 days: two systems built on 13 x 28 = 364.

   International Fixed Calendar (Cotsworth, 1902): January-June, Sol, July-December, 28 days each, every month
   starting on a Sunday. Year Day follows 28 December and Leap Day (leap years, Gregorian rule) follows 28 June;
   neither belongs to a month or to a week. Year and leap years are the Gregorian ones, so the mapping is by
   day of the Gregorian year:
     leap year, day 169 (Gregorian 17 June)  -> Leap Day
     then (after removing Leap Day) day 365  -> Year Day (Gregorian 31 December)
     otherwise month = floor((n-1)/28), day = (n-1) mod 28 + 1
   Checked by hand and in _src/check_thirteen.py: 1 Jan -> 1 January, 29 Jan -> 1 February, 17 Jun (common) ->
   28 June, 18 Jun -> 1 Sol, 30 Dec -> 28 December, 31 Dec -> Year Day; leap years: 17 Jun -> Leap Day,
   18 Jun -> 1 Sol, 31 Dec -> Year Day.

   Thirteen Moon / Dreamspell (Argüelles, 1987-1990): a modern system, not a Maya calendar. The year starts on
   26 July; 13 moons of 28 days, then 25 July is the "Day Out of Time"; 29 February is not counted ("0.0 Hunab Ku").
   ============================================================ */
const Thirteen = (() => {
  "use strict";

  const IFC_MONTHS = ["January", "February", "March", "April", "May", "June", "Sol",
                      "July", "August", "September", "October", "November", "December"];
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MOONS = ["Magnetic", "Lunar", "Electric", "Self-Existing", "Overtone", "Rhythmic", "Resonant",
                 "Galactic", "Solar", "Planetary", "Spectral", "Crystal", "Cosmic"];

  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const dayOfYear = (y, m, d) => {
    const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    return cum[m - 1] + d + (m > 2 && isLeap(y) ? 1 : 0);
  };

  /** Gregorian y-m-d -> International Fixed Calendar date. */
  function ifc(y, m, d) {
    let n = dayOfYear(y, m, d);
    const leap = isLeap(y);
    if (leap && n === 169) return { year: y, special: "Leap Day", label: `Leap Day ${y}`, weekday: null, dayOfYear: n };
    if (leap && n > 169) n -= 1;
    if (n === 365) return { year: y, special: "Year Day", label: `Year Day ${y}`, weekday: null, dayOfYear: dayOfYear(y, m, d) };
    const month = Math.floor((n - 1) / 28), day = (n - 1) % 28 + 1;
    return { year: y, month: month + 1, monthName: IFC_MONTHS[month], day, weekday: WEEKDAYS[(day - 1) % 7],
             label: `${day} ${IFC_MONTHS[month]} ${y}`, dayOfYear: dayOfYear(y, m, d) };
  }

  /** IFC month (1-13) and day -> Gregorian {y, m, d} for IFC year y; month 0 = Year Day, -1 = Leap Day. */
  function ifcToGregorian(y, month, day) {
    let n;
    if (month === -1) n = 169;
    else {
      n = month === 0 ? 365 : (month - 1) * 28 + day;
      if (isLeap(y) && n >= 169) n += 1;
    }
    const lens = [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let mm = 0;
    while (n > lens[mm]) { n -= lens[mm]; mm++; }
    return { y, m: mm + 1, d: n };
  }

  /** Gregorian y-m-d -> Thirteen Moon (Dreamspell) date. */
  function thirteenMoon(y, m, d) {
    if (m === 2 && d === 29) return { special: "0.0 Hunab Ku", label: "0.0 Hunab Ku (29 February is not counted)" };
    const startY = (m > 7 || (m === 7 && d >= 26)) ? y : y - 1;         // the year that began on 26 July
    let n = 0;                                                          // days since 26 July, without 29 February
    const lens = (yy) => [31, isLeap(yy) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let yy = startY, mm = 7, dd = 26;
    // walk month by month (at most 12 steps)
    while (!(yy === y && mm === m)) {
      const ml = (mm === 2) ? 28 : lens(yy)[mm - 1];                    // 29 February never counts
      n += ml - dd + 1;
      dd = 1; mm += 1; if (mm > 12) { mm = 1; yy += 1; }
    }
    n += d - dd;
    if (n === 364) return { special: "Day Out of Time", label: `Day Out of Time (${startY}–${startY + 1} year)`, yearStart: startY };
    const moon = Math.floor(n / 28), day = n % 28 + 1;
    return { moon: moon + 1, moonName: MOONS[moon], day, yearStart: startY,
             label: `${MOONS[moon]} Moon ${moon + 1}, day ${day}` };
  }

  return { IFC_MONTHS, WEEKDAYS, MOONS, isLeap, dayOfYear, ifc, ifcToGregorian, thirteenMoon };
})();
if (typeof module !== "undefined") module.exports = Thirteen;
