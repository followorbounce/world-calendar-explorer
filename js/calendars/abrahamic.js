/* ============================================================
   Hebrew, Islamic (Tabular), and Bahá'í calendars.

   Algorithms transcribed from John Walker's Fourmilab Calendar
   Converter (public domain — https://www.fourmilab.ch/documents/calendar/),
   itself a direct implementation of Dershowitz & Reingold's
   "Calendrical Calculations". Fourmilab's `jd` is a half-integer
   (astronomical, midnight = x.5); this file uses whole-integer
   noon-based JDN throughout (matching Core.js), so every epoch
   constant below is Fourmilab's own constant + 0.5, and the
   `jd = Math.floor(jd) + 0.5` normalization lines from the
   original are simply omitted — the two conventions differ by a
   constant 0.5 that cancels in every formula here (each one only
   ever uses jd in a difference against another jd-scale quantity).
   Verified numerically against known real-world reference dates
   before use — see progress.md.
   ============================================================ */
const CalAbrahamic = (() => {
  "use strict";
  const { mod, floordiv } = Core;

  /* ================= HEBREW ================= */
  const HEBREW_EPOCH = 347996; // Monday, 7 October 3761 BCE (proleptic Julian)
  const HEBREW_MONTH_NAMES = [
    null, "Nisan", "Iyar", "Sivan", "Tammuz", "Av", "Elul",
    "Tishrei", "Cheshvan", "Kislev", "Tevet", "Shevat", "Adar", "Adar II",
  ];

  function hebrewLeap(year) {
    return mod(year * 7 + 1, 19) < 7;
  }
  function hebrewYearMonths(year) {
    return hebrewLeap(year) ? 13 : 12;
  }
  function hebrewDelay1(year) {
    const months = floordiv(235 * year - 234, 19);
    const parts = 12084 + 13753 * months;
    let day = months * 29 + floordiv(parts, 25920);
    if (mod(3 * (day + 1), 7) < 3) day += 1;
    return day;
  }
  function hebrewDelay2(year) {
    const last = hebrewDelay1(year - 1);
    const present = hebrewDelay1(year);
    const next = hebrewDelay1(year + 1);
    if (next - present === 356) return 2;
    if (present - last === 382) return 1;
    return 0;
  }
  function hebrewYearDays(year) {
    return hebrewToJDN(year + 1, 7, 1) - hebrewToJDN(year, 7, 1);
  }
  function hebrewMonthDays(year, month) {
    if ([2, 4, 6, 10, 13].includes(month)) return 29;
    if (month === 12 && !hebrewLeap(year)) return 29;
    if (month === 8 && mod(hebrewYearDays(year), 10) !== 5) return 29;
    if (month === 9 && mod(hebrewYearDays(year), 10) === 3) return 29;
    return 30;
  }
  function hebrewToJDN(year, month, day) {
    const months = hebrewYearMonths(year);
    let jd = HEBREW_EPOCH + hebrewDelay1(year) + hebrewDelay2(year) + day + 1;
    if (month < 7) {
      for (let mon = 7; mon <= months; mon++) jd += hebrewMonthDays(year, mon);
      for (let mon = 1; mon < month; mon++) jd += hebrewMonthDays(year, mon);
    } else {
      for (let mon = 7; mon < month; mon++) jd += hebrewMonthDays(year, mon);
    }
    return jd;
  }
  function jdnToHebrew(jd) {
    let count = floordiv((jd - HEBREW_EPOCH) * 98496.0, 35975351.0);
    let year = count - 1;
    for (let i = count; jd >= hebrewToJDN(i, 7, 1); i++) year++;
    const first = jd < hebrewToJDN(year, 1, 1) ? 7 : 1;
    let month = first;
    for (let i = first; jd > hebrewToJDN(year, i, hebrewMonthDays(year, i)); i++) month++;
    const day = jd - hebrewToJDN(year, month, 1) + 1;
    return { year, month, day };
  }
  function hebrew(jdn) {
    const h = jdnToHebrew(jdn);
    return {
      calendar: "Hebrew",
      year: h.year,
      month: h.month,
      monthName: HEBREW_MONTH_NAMES[h.month],
      day: h.day,
      isLeapYear: hebrewLeap(h.year),
      era: "AM (Anno Mundi)",
    };
  }

  /* ================= ISLAMIC (TABULAR) ================= */
  const ISLAMIC_EPOCH = 1948440; // Friday, 16 July 622 CE (Julian) — civil/tabular epoch
  const ISLAMIC_MONTH_NAMES = [
    null, "Muharram", "Safar", "Rabiʻ I", "Rabiʻ II", "Jumada I", "Jumada II",
    "Rajab", "Shaʻban", "Ramadan", "Shawwal", "Dhu al-Qiʻdah", "Dhu al-Hijjah",
  ];
  function islamicLeap(year) {
    return mod(year * 11 + 14, 30) < 11;
  }
  function islamicToJDN(year, month, day) {
    return day + Math.ceil(29.5 * (month - 1)) + (year - 1) * 354 + floordiv(3 + 11 * year, 30) + ISLAMIC_EPOCH - 1;
  }
  function jdnToIslamic(jd) {
    const year = floordiv(30 * (jd - ISLAMIC_EPOCH) + 10646, 10631);
    const month = Math.min(12, Math.ceil((jd - (29 + islamicToJDN(year, 1, 1))) / 29.5) + 1);
    const day = jd - islamicToJDN(year, month, 1) + 1;
    return { year, month, day };
  }
  function islamicTabular(jdn) {
    const i = jdnToIslamic(jdn);
    return {
      calendar: "Islamic (Tabular)",
      year: i.year,
      month: i.month,
      monthName: ISLAMIC_MONTH_NAMES[i.month],
      day: i.day,
      isLeapYear: islamicLeap(i.year),
      era: "AH (Anno Hegirae)",
      note: "Arithmetic approximation of a lunar calendar traditionally set by moon-sighting — can differ from locally observed/announced Hijri dates by a day.",
    };
  }

  /* ================= BAHÁ'Í (BADÍ) ================= */
  // Post-2015 rule: Naw-Rúz = the Tehran calendar day containing the
  // true March equinox. Equinox instant from Meeus's low-precision
  // mean-equinox polynomial (Astronomical Algorithms, valid 1000-3000
  // CE; mean error on the order of minutes without the omitted
  // periodic correction terms — negligible for picking a calendar day
  // except in the rare case the equinox falls within about an hour of
  // local midnight in Tehran).
  function tehranEquinoxJDN(gregorianYear) {
    const Y = (gregorianYear - 2000) / 1000;
    const JDE0 = 2451623.80984 + 365242.37404 * Y + 0.05169 * Y ** 2 - 0.00411 * Y ** 3 - 0.00057 * Y ** 4;
    const tehranJD = JDE0 + 3.5 / 24; // Iran Standard Time, UTC+3:30
    return Math.floor(tehranJD + 0.5);
  }
  const BAHAI_MONTH_NAMES = [
    "Bahá", "Jalál", "Jamál", "ʻAẓamat", "Núr", "Raḥmat", "Kalimát",
    "Kamál", "Asmáʼ", "ʻIzzat", "Mashíyyat", "ʻIlm", "Qudrat",
    "Qawl", "Masáʼil", "Sharaf", "Sultán", "Mulk", "ʻAláʼ",
  ];
  function bahai(jdn, gregorianYear) {
    // Find this Gregorian year's Naw-Rúz, then last year's, to bracket jdn.
    let nawRuz = tehranEquinoxJDN(gregorianYear);
    if (jdn < nawRuz) nawRuz = tehranEquinoxJDN(gregorianYear - 1);
    const nextNawRuz = tehranEquinoxJDN(jdnToGregYear(nawRuz) + 1);
    const yearLength = nextNawRuz - nawRuz; // 365 or 366
    const dayOfYear = jdn - nawRuz; // 0-based
    const ayyamIHaLength = yearLength - 361; // 4 or 5
    let month, day, isAyyamIHa = false;
    if (dayOfYear < 18 * 19) {
      month = Math.floor(dayOfYear / 19) + 1;
      day = (dayOfYear % 19) + 1;
    } else if (dayOfYear < 18 * 19 + ayyamIHaLength) {
      isAyyamIHa = true;
      month = null;
      day = dayOfYear - 18 * 19 + 1;
    } else {
      month = 19;
      day = dayOfYear - 18 * 19 - ayyamIHaLength + 1;
    }
    const badiYearNum = Core.jdnToGregorian(nawRuz).y - 1844 + 1;
    const kulliShay = Math.floor((badiYearNum - 1) / 361) + 1;
    const vahid = Math.floor(mod(badiYearNum - 1, 361) / 19) + 1;
    const yearInVahid = mod(badiYearNum - 1, 19) + 1;
    return {
      calendar: "Bahá'í (Badí')",
      year: badiYearNum,
      month,
      monthName: isAyyamIHa ? "Ayyám-i-Há (intercalary)" : BAHAI_MONTH_NAMES[month - 1],
      day,
      kulliShay,
      vahid,
      yearInVahid,
      era: "BE (Badíʻ Era)",
      note: "Naw-Rúz date uses a low-precision astronomical approximation (Meeus mean equinox, no periodic correction terms) — accurate to the correct day in the vast majority of years, but can be a day off when the true equinox falls very close to midnight in Tehran. Kull-i-Shay'/Váhid numbering follows the straightforward 19×19-year structural definition; cross-check against a Bahá'í almanac for the traditional Váhid name.",
    };
  }
  function jdnToGregYear(jdn) {
    return Core.jdnToGregorian(jdn).y;
  }

  return {
    hebrew, hebrewLeap, hebrewToJDN, jdnToHebrew,
    islamicTabular, islamicLeap, islamicToJDN, jdnToIslamic,
    bahai, tehranEquinoxJDN,
  };
})();
