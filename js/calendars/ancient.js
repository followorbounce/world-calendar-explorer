/* ============================================================
   Ancient / era-offset calendar systems.
   Most of these are exact, well-documented arithmetic systems.
   Where a calendar was historically observational/political rather
   than arithmetic (Olympiad, Seleucid, Assyrian), we implement the
   standard modern epoch-offset convention and flag it as such.
   ============================================================ */
const CalAncient = (() => {
  "use strict";
  const { floordiv, mod, jdnToJulian, julianToJDN } = Core;

  /* ---------- Byzantine Calendar ----------
     Julian calendar, year count from the Byzantine Creation era
     epoch: 1 September 5509 BC (proleptic Julian). New Year = 1
     September. Year = Julian year + 5508 (Jan-Aug) or +5509 (Sep-Dec). */
  function byzantine(jdn) {
    const j = jdnToJulian(jdn);
    const year = j.y + (j.m >= 9 ? 5509 : 5508);
    return { calendar: "Byzantine", year, month: j.m, monthName: Core.MONTH_NAMES[j.m - 1], day: j.d, era: "AM (Creation Era of Constantinople)" };
  }

  /* ---------- Coptic Calendar ----------
     Epoch: 29 August AD 284 (Julian) = 1 Thout AM 1 — the "Era of
     Martyrs" / Diocletian. 13 months: 12 of 30 days + 1 epagomenal
     month of 5 days (6 in leap years). Leap year: year mod 4 == 3
     (i.e. the epagomenal month gains its 6th day the Julian year
     before a Julian leap year, since Coptic New Year precedes the
     Julian one). */
  const COPTIC_EPOCH_JDN = julianToJDN(284, 8, 29);
  const COPTIC_MONTHS = [
    "Thout", "Paopi", "Hathor", "Koiak", "Tobi", "Meshir", "Paremhat",
    "Paremoude", "Pashons", "Paoni", "Epip", "Mesori", "Pi Kogi Enavot",
  ];
  function coptic(jdn) {
    const daysSinceEpoch = jdn - COPTIC_EPOCH_JDN;
    const year = floordiv(daysSinceEpoch, 365.25) + 1;
    // Locate exact year start by scanning within +-1 (leap-day boundary safe).
    let y = Math.max(1, year - 1);
    let yearStart = copticYearStartJDN(y);
    while (jdn - yearStart >= copticYearLength(y)) {
      y += 1;
      yearStart = copticYearStartJDN(y);
    }
    while (jdn < yearStart) {
      y -= 1;
      yearStart = copticYearStartJDN(y);
    }
    const dayOfYear = jdn - yearStart; // 0-based
    const month = floordiv(dayOfYear, 30) + 1;
    const day = mod(dayOfYear, 30) + 1;
    return { calendar: "Coptic", year: y, month, monthName: COPTIC_MONTHS[month - 1], day, era: "AM (Anno Martyrum)" };
  }
  function copticIsLeap(y) {
    return mod(y, 4) === 3;
  }
  function copticYearLength(y) {
    return copticIsLeap(y) ? 366 : 365;
  }
  function copticYearStartJDN(y) {
    return COPTIC_EPOCH_JDN + (y - 1) * 365 + floordiv(y - 1, 4);
  }

  /* ---------- Ethiopian Calendar ----------
     Same structure as Coptic (13 months, epagomenal days) but its
     own epoch: 29 August AD 8 (Julian) = 1 Meskerem AM 1 — the
     Ethiopian computation of the Incarnation, 276/284 years behind
     the AD count depending on month. Same leap rule as Coptic. */
  const ETHIOPIAN_EPOCH_JDN = julianToJDN(8, 8, 29);
  const ETHIOPIAN_MONTHS = [
    "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit",
    "Miazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume",
  ];
  function ethiopian(jdn) {
    const c = coptic(jdn - (COPTIC_EPOCH_JDN - ETHIOPIAN_EPOCH_JDN) * 0); // placeholder not used
    // Reuse Coptic's year-search logic with the Ethiopian epoch instead.
    const daysSinceEpoch = jdn - ETHIOPIAN_EPOCH_JDN;
    let y = Math.max(1, floordiv(daysSinceEpoch, 365.25));
    let yearStart = ETHIOPIAN_EPOCH_JDN + (y - 1) * 365 + floordiv(y - 1, 4);
    while (jdn - yearStart >= (copticIsLeap(y) ? 366 : 365)) {
      y += 1;
      yearStart = ETHIOPIAN_EPOCH_JDN + (y - 1) * 365 + floordiv(y - 1, 4);
    }
    while (jdn < yearStart) {
      y -= 1;
      yearStart = ETHIOPIAN_EPOCH_JDN + (y - 1) * 365 + floordiv(y - 1, 4);
    }
    const dayOfYear = jdn - yearStart;
    const month = floordiv(dayOfYear, 30) + 1;
    const day = mod(dayOfYear, 30) + 1;
    return { calendar: "Ethiopian", year: y, month, monthName: ETHIOPIAN_MONTHS[month - 1], day, era: "EC (Ethiopian Calendar / Incarnation Era)" };
  }

  /* ---------- Armenian Calendar ----------
     "Vague year": exactly 365 days, no leap years at all (so it
     drifts through the seasons, completing a full cycle every 1461
     years). Epoch: 11 July AD 552 (Julian) = 1 Navasard, Year 1.
     12 months of 30 days + 5 epagomenal days (aweleats). */
  const ARMENIAN_EPOCH_JDN = julianToJDN(552, 7, 11);
  const ARMENIAN_MONTHS = [
    "Navasard", "Hori", "Sahmi", "Tre", "K'aloch", "Arach", "Mehekan",
    "Areg", "Ahekan", "Mareri", "Margach", "Hrotich",
  ];
  function armenian(jdn) {
    const daysSinceEpoch = jdn - ARMENIAN_EPOCH_JDN;
    const year = floordiv(daysSinceEpoch, 365) + 1;
    const dayOfYear = mod(daysSinceEpoch, 365);
    const month = floordiv(dayOfYear, 30) + 1;
    const day = mod(dayOfYear, 30) + 1;
    return {
      calendar: "Armenian",
      year,
      month: Math.min(month, 13),
      monthName: month <= 12 ? ARMENIAN_MONTHS[month - 1] : "Aweleach (epagomenal)",
      day,
      era: "Armenian Era (vague year, no leap days)",
    };
  }

  /* ---------- Assyrian Calendar ----------
     A modern (20th-century Assyrian nationalist movement) honorific
     era, not a continuously-used traditional calendar with its own
     months in daily use today — implemented as a year-offset on top
     of the Gregorian calendar only. Epoch: 4750 BC, chosen to
     commemorate the traditional founding of Ashur/Nineveh. */
  function assyrian(gregorianYear) {
    return { calendar: "Assyrian", year: gregorianYear + 4750, era: "AA (Assyrian Era)", note: "Modern honorific year-offset only; no independent month/day system in everyday use." };
  }

  /* ---------- Egyptian Civil Calendar ----------
     Exactly 365 days every year, no leap years ever (hence it
     "wanders" through the seasons over a 1461-year Sothic cycle).
     12 months of 30 days + 5 epagomenal days. Epoch used here: the
     Era of Nabonassar, 26 February 747 BC (Julian) — the standard
     reference epoch Ptolemy used for this calendar, and the one
     most calendrical-calculation references anchor to. */
  const EGYPTIAN_EPOCH_JDN = julianToJDN(-746, 2, 26); // 747 BC = astronomical year -746
  const EGYPTIAN_MONTHS = [
    "Thoth", "Phaophi", "Athyr", "Choiak", "Tybi", "Mechir", "Phamenoth",
    "Pharmuthi", "Pachons", "Payni", "Epiphi", "Mesore",
  ];
  function egyptianCivil(jdn) {
    const daysSinceEpoch = jdn - EGYPTIAN_EPOCH_JDN;
    const year = floordiv(daysSinceEpoch, 365) + 1;
    const dayOfYear = mod(daysSinceEpoch, 365);
    const month = floordiv(dayOfYear, 30) + 1;
    const day = mod(dayOfYear, 30) + 1;
    return {
      calendar: "Egyptian Civil",
      year,
      month: Math.min(month, 13),
      monthName: month <= 12 ? EGYPTIAN_MONTHS[month - 1] : "Epagomenal days",
      day,
      era: "Era of Nabonassar",
    };
  }

  /* ---------- Ancient Greek Olympiad Dating ----------
     Epoch: the traditional first Olympiad, summer 776 BC. Olympiads
     were 4 Julian/Attic years long, counted from one summer games to
     the next; we approximate Olympiad boundaries at 1 July (Julian)
     for lack of a universal exact civil epoch. Educational
     approximation, not exact ancient civil-calendar reconstruction. */
  function olympiad(jdn) {
    const j = jdnToJulian(jdn);
    const epochJDN = julianToJDN(-775, 7, 1); // 776 BC = astronomical year -775
    let yearsSince = j.y - (-775);
    if (j.m < 7) yearsSince -= 1;
    const olympiadNumber = Math.floor(yearsSince / 4) + 1;
    const yearInCycle = mod(yearsSince, 4) + 1;
    return {
      calendar: "Olympiad",
      label: `Olympiad ${olympiadNumber}, Year ${yearInCycle}`,
      note: "Approximate — ancient Olympiad civil boundaries are not precisely fixed; epoch taken as summer 776 BC.",
    };
  }

  /* ---------- Seleucid Era ----------
     Epoch: spring 311 BC (Macedonian/Greek reckoning, 1 Disios ~
     autumn) or 312 BC (Babylonian reckoning, 1 Nisanu ~ spring) —
     the two traditions differ by exactly one year for much of the
     calendar year. We report the more commonly cited Macedonian
     count: Seleucid year = Gregorian year + 311 (approximate, whole
     -year granularity only). */
  function seleucid(gregorianYear) {
    return {
      calendar: "Seleucid",
      year: gregorianYear + 311,
      era: "SE (Seleucid Era, Macedonian reckoning)",
      note: "Babylonian reckoning runs one year higher for part of the year (spring epoch vs. autumn epoch) — whole-year approximation only.",
    };
  }

  /* ---------- French Republican Calendar ----------
     True historical calendar (1793-1805) fixed New Year to the
     autumn equinox by observation, and was abolished before a
     long-term leap rule was ever exercised. The algorithmic
     continuation implemented here uses the "Romme rule" that was
     proposed (never actually used contemporaneously): leap years
     are those divisible by 4, except centennial years unless
     divisible by 400 — the same shape as the Gregorian rule. Epoch:
     22 September 1792 (Gregorian) = 1 Vendémiaire, An I. */
  const FR_REP_EPOCH_JDN = Core.gregorianToJDN(1792, 9, 22);
  const FR_REP_MONTHS = [
    "Vendémiaire", "Brumaire", "Frimaire", "Nivôse", "Pluviôse", "Ventôse",
    "Germinal", "Floréal", "Prairial", "Messidor", "Thermidor", "Fructidor", "Sansculottides",
  ];
  function frenchRepublicanIsLeap(y) {
    if (mod(y, 400) === 0) return true;
    if (mod(y, 100) === 0) return false;
    return mod(y, 4) === 0;
  }
  function frenchRepublican(jdn) {
    const daysSinceEpoch = jdn - FR_REP_EPOCH_JDN;
    let year = floordiv(daysSinceEpoch, 365) + 1;
    let yearStart = frRepYearStartJDN(year);
    while (jdn - yearStart >= (frenchRepublicanIsLeap(year) ? 366 : 365)) {
      year += 1;
      yearStart = frRepYearStartJDN(year);
    }
    while (jdn < yearStart) {
      year -= 1;
      yearStart = frRepYearStartJDN(year);
    }
    const dayOfYear = jdn - yearStart;
    const month = floordiv(dayOfYear, 30) + 1;
    const day = mod(dayOfYear, 30) + 1;
    return {
      calendar: "French Republican",
      year,
      month: Math.min(month, 13),
      monthName: month <= 12 ? FR_REP_MONTHS[month - 1] : "Sansculottides (complementary days)",
      day,
      era: "Republican Era",
      note: "Abolished 1805; dates after that use the algorithmic ('Romme rule') continuation common in calendar-conversion software, not a historically enforced rule.",
    };
  }
  function frRepYearStartJDN(y) {
    let leapDaysBefore = 0;
    for (let yy = 1; yy < y; yy++) if (frenchRepublicanIsLeap(yy)) leapDaysBefore += 1;
    return FR_REP_EPOCH_JDN + (y - 1) * 365 + leapDaysBefore;
  }

  /* ---------- Discordian Calendar ----------
     A 1963 parody/religious-satire calendar (Principia Discordia).
     Year = Gregorian year + 1166. 5 seasons of 73 days each
     (Chaos, Discord, Confusion, Bureaucracy, The Aftermath).
     St. Tib's Day is inserted after day 59 (29 Feb equivalent) in
     Gregorian leap years and is not itself a weekday. */
  const DISCORDIAN_SEASONS = ["Chaos", "Discord", "Confusion", "Bureaucracy", "The Aftermath"];
  function discordian(y, m, d, jdn) {
    const isLeap = (m2 => (m2 % 4 === 0 && m2 % 100 !== 0) || m2 % 400 === 0)(y);
    const dayOfYear = jdn - Core.gregorianToJDN(y, 1, 1) + 1; // 1-based
    let ddate = dayOfYear;
    let stTibs = false;
    if (isLeap) {
      if (dayOfYear === 60) {
        stTibs = true;
      } else if (dayOfYear > 60) {
        ddate = dayOfYear - 1;
      }
    }
    const season = Math.min(4, floordiv(ddate - 1, 73));
    const dayOfSeason = ddate - season * 73;
    return {
      calendar: "Discordian",
      year: y + 1166,
      label: stTibs ? `St. Tib's Day, ${y + 1166} YOLD` : `${dayOfSeason} ${DISCORDIAN_SEASONS[season]} ${y + 1166}`,
      season: DISCORDIAN_SEASONS[season],
      dayOfSeason: stTibs ? null : dayOfSeason,
      stTibsDay: stTibs,
      era: "YOLD (Year of Our Lady of Discord)",
    };
  }

  /* ---------- Holocene / Human Era ----------
     Proposed by Cesare Emiliani (1993): simply Gregorian year +
     10000, no month/day change, so approximate "start of the
     Holocene epoch" roughly coincides with year 1. */
  function holocene(gregorianYear) {
    return { calendar: "Holocene", year: gregorianYear + 10000, era: "HE (Holocene Era)" };
  }

  /* ---------- Astronomical Year Numbering ----------
     Same as AD/CE for positive years, but includes a year 0 (= 1 BC)
     and negative years thereafter (2 BC = -1, 3 BC = -2, ...),
     avoiding the AD/BC off-by-one that has no year zero. */
  function astronomicalYear(gregorianYear, isBCE) {
    return { calendar: "Astronomical Year Numbering", year: isBCE ? 1 - gregorianYear : gregorianYear };
  }

  function copticToJDN(year, month, day) {
    return copticYearStartJDN(year) + (month - 1) * 30 + (day - 1);
  }

  function ethiopianToJDN(year, month, day) {
    return ETHIOPIAN_EPOCH_JDN + (year - 1) * 365 + floordiv(year - 1, 4) + (month - 1) * 30 + (day - 1);
  }

  function frenchRepToJDN(year, month, day) {
    return frRepYearStartJDN(year) + (month - 1) * 30 + (day - 1);
  }

  return {
    byzantine, coptic, ethiopian, armenian, assyrian, egyptianCivil,
    olympiad, seleucid, frenchRepublican, discordian, holocene, astronomicalYear,
    copticToJDN, ethiopianToJDN, frenchRepToJDN,
    COPTIC_MONTHS, ETHIOPIAN_MONTHS, FR_REP_MONTHS,
  };
})();
