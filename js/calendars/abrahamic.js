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
  // Naw-Rúz rule (Universal House of Justice, in force from 172 BE /
  // 2015 CE): Naw-Rúz is the day on which the March equinox occurs
  // *before sunset* in Tehran (the Bahá'í day starts at sunset), so an
  // equinox after Tehran sunset moves Naw-Rúz to the next civil day.
  // Before 2015 the calendar as used in the West fixed Naw-Rúz at
  // 21 March, which this function returns for earlier years.
  //
  // Fixed 2026-10-02: the previous version used Meeus's *mean*
  // equinox polynomial with no periodic terms and took the Tehran
  // civil (midnight-to-midnight) day containing it, ignoring the
  // sunset rule. That put Naw-Rúz on 20 March in 2018, 2022 and 2027,
  // where the equinox falls after Tehran sunset and the published
  // Naw-Rúz is 21 March.
  //
  // Equinox: Meeus, Astronomical Algorithms ch. 27 (mean JDE0 + the
  // 24 periodic terms of table 27.C; quoted accuracy about 1 minute for
  // 1951-2050), converted TT -> UT with an Espenak-Meeus delta-T
  // polynomial. Sunset: NOAA solar-position formulae, standard -0.833°
  // altitude, Tehran 35.6892°N 51.3890°E. Years where the two instants
  // fall within a few minutes of each other (2026 is one: both about
  // 18:16 IRST) cannot be decided this way with certainty — check them
  // against the Bahá'í World Centre's published dates.
  const EQUINOX_TERMS = [
    [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186],
    [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443],
    [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513],
    [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
    [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417],
    [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029],
    [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756],
    [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074],
  ];
  const RAD = Math.PI / 180;
  function marchEquinoxJDE(year) {
    const Y = (year - 2000) / 1000;
    const jde0 = 2451623.80984 + 365242.37404 * Y + 0.05169 * Y ** 2 - 0.00411 * Y ** 3 - 0.00057 * Y ** 4;
    const T = (jde0 - 2451545) / 36525;
    const W = (35999.373 * T - 2.47) * RAD;
    const dLambda = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
    let S = 0;
    for (const [A, B, C] of EQUINOX_TERMS) S += A * Math.cos((B + C * T) * RAD);
    return jde0 + (0.00001 * S) / dLambda;
  }
  function deltaTSeconds(year) {
    const t = year - 2000;
    if (year >= 2005 && year <= 2050) return 62.92 + 0.32217 * t + 0.005589 * t * t;
    const u = (year - 1820) / 100;
    return -20 + 32 * u * u; // long-term parabola (Morrison & Stephenson)
  }
  // JD (UT) of sunset on the civil date whose noon is JDN `jdn`.
  function sunsetJD(jdn, latDeg, lonDeg) {
    let jd = jdn + 0.25 - lonDeg / 360;
    for (let i = 0; i < 3; i++) {
      const T = (jd - 2451545) / 36525;
      const L0 = (280.46646 + T * (36000.76983 + 0.0003032 * T)) % 360;
      const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
      const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
      const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
        Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
      const omega = 125.04 - 1934.136 * T;
      const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);
      const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
      const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
      const dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
      const yv = Math.tan((eps / 2) * RAD) ** 2;
      const eqTimeMin = (4 / RAD) * (yv * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD) +
        4 * e * yv * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
        0.5 * yv * yv * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD));
      const ha = Math.acos(Math.cos(90.833 * RAD) / (Math.cos(latDeg * RAD) * Math.cos(dec)) -
        Math.tan(latDeg * RAD) * Math.tan(dec)) / RAD;
      jd = jdn - 0.5 + (720 - 4 * lonDeg - eqTimeMin + 4 * ha) / 1440;
    }
    return jd;
  }
  function tehranEquinoxJDN(gregorianYear) {
    if (gregorianYear < 2015) return Core.gregorianToJDN(gregorianYear, 3, 21);
    const eqUT = marchEquinoxJDE(gregorianYear) - deltaTSeconds(gregorianYear) / 86400;
    const civilDay = Math.floor(eqUT + 3.5 / 24 + 0.5); // Tehran civil date (UTC+3:30)
    return eqUT < sunsetJD(civilDay, 35.6892, 51.389) ? civilDay : civilDay + 1;
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
      note: "Naw-Rúz computed from the March equinox (Meeus, with periodic terms) and Tehran sunset, per the post-2015 rule; fixed 21 March before 2015. Years where the equinox falls within minutes of Tehran sunset (e.g. 2026) are borderline — check against the Bahá'í World Centre's published dates. Kull-i-Shay'/Váhid numbering follows the straightforward 19×19-year structural definition; cross-check against a Bahá'í almanac for the traditional Váhid name.",
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
