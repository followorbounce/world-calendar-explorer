/* ============================================================
   World Calendar Explorer — mathematical core.
   Julian Day Number (JDN) is the universal pivot: every calendar
   module below converts to/from JDN, never directly to/from any
   other calendar. JDN here is the integer day count (noon-based
   astronomical convention omitted — we track whole civil days),
   using the standard Fliegel & Van Flandern (1968) algorithm,
   the same one already verified and in production on the sibling
   Maya-Calendar site (GMT 584283 correlation).
   ============================================================ */
const Core = (() => {
  "use strict";

  function mod(n, k) {
    return ((n % k) + k) % k;
  }

  function floordiv(n, k) {
    return Math.floor(n / k);
  }

  /* ---------- Gregorian <-> JDN ---------- */
  function gregorianToJDN(y, m, d) {
    const a = floordiv(14 - m, 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return (
      d +
      floordiv(153 * mm + 2, 5) +
      365 * yy +
      floordiv(yy, 4) -
      floordiv(yy, 100) +
      floordiv(yy, 400) -
      32045
    );
  }

  function jdnToGregorian(jdn) {
    const a = jdn + 32044;
    const b = floordiv(4 * a + 3, 146097);
    const c = a - floordiv(146097 * b, 4);
    const dd = floordiv(4 * c + 3, 1461);
    const e = c - floordiv(1461 * dd, 4);
    const m = floordiv(5 * e + 2, 153);
    return {
      d: e - floordiv(153 * m + 2, 5) + 1,
      m: m + 3 - 12 * floordiv(m, 10),
      y: 100 * b + dd - 4800 + floordiv(m, 10),
    };
  }

  /* ---------- Julian (old-style) <-> JDN ---------- */
  function julianToJDN(y, m, d) {
    const a = floordiv(14 - m, 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + floordiv(153 * mm + 2, 5) + 365 * yy + floordiv(yy, 4) - 32083;
  }

  function jdnToJulian(jdn) {
    const a = jdn + 32082;
    const b = floordiv(4 * a + 3, 1461);
    const c = a - floordiv(1461 * b, 4);
    const m = floordiv(5 * c + 2, 153);
    return {
      d: c - floordiv(153 * m + 2, 5) + 1,
      m: m + 3 - 12 * floordiv(m, 10),
      y: b - 4800 + floordiv(m, 10),
    };
  }

  /* ---------- Weekday from JDN ----------
     JDN 0 = Monday 1 Jan 4713 BC (proleptic Julian). JDN mod 7:
     0=Mon 1=Tue 2=Wed 3=Thu 4=Fri 5=Sat 6=Sun (verified against
     JDN 2451545 = 1 Jan 2000 = Saturday: 2451545 mod 7 = 5). */
  const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function weekdayFromJDN(jdn) {
    return mod(jdn, 7);
  }
  function weekdayName(jdn) {
    return WEEKDAY_NAMES[weekdayFromJDN(jdn)];
  }

  /* ---------- ISO week date (native Date is reliable for this) ---------- */
  function isoWeekFromGregorian(y, m, d) {
    const date = new Date(Date.UTC(y, m - 1, d));
    const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
    const week = 1 + Math.round((date - firstThursday) / (7 * 86400000));
    return { isoYear: date.getUTCFullYear(), isoWeek: week, isoDay: dayNum + 1 };
  }

  /* ---------- Unix time ---------- */
  const UNIX_EPOCH_JDN = 2440588; // 1 Jan 1970 = JDN 2440588
  function unixSecondsFromJDN(jdn, secondsIntoDay = 0) {
    return (jdn - UNIX_EPOCH_JDN) * 86400 + secondsIntoDay;
  }

  /* ---------- Astronomical Julian Date (JD, with time-of-day) ----------
     JDN above is a whole-day count anchored at local noon convention
     used throughout this app for civil-date math; true astronomical JD
     adds the fractional day since the preceding noon UTC. */
  function astronomicalJD(jdn, hoursUTC = 12) {
    return jdn - 0.5 + hoursUTC / 24;
  }

  return {
    mod,
    floordiv,
    gregorianToJDN,
    jdnToGregorian,
    julianToJDN,
    jdnToJulian,
    weekdayFromJDN,
    weekdayName,
    WEEKDAY_NAMES,
    isoWeekFromGregorian,
    MONTH_NAMES,
    UNIX_EPOCH_JDN,
    unixSecondsFromJDN,
    astronomicalJD,
  };
})();
