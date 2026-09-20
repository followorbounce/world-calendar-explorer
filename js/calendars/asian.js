/* ============================================================
   East/Southeast Asian systems that don't require full lunisolar
   ephemeris calculation to be exact (or are clearly flagged where
   they only approximate one).
   ============================================================ */
const CalAsian = (() => {
  "use strict";
  const { mod, floordiv, jdnToGregorian } = Core;

  /* ---------- Chinese Zodiac + Sexagenary Cycle ----------
     The TRUE year boundary is Chinese New Year (the second new moon
     after the winter solstice), which requires real lunisolar
     calculation. This implementation approximates the boundary as
     4 February (near lìchūn, the solar "start of spring" term some
     almanacs use for the zodiac changeover) — dates in
     January/early February can be off by a few weeks in years where
     the true Chinese New Year falls later. 1984-02-04 onward = 甲子
     (jiǎzǐ), a widely-cited reference point for the 60-year cycle. */
  const STEMS = ["Jiǎ 甲", "Yǐ 乙", "Bǐng 丙", "Dīng 丁", "Wù 戊", "Jǐ 己", "Gēng 庚", "Xīn 辛", "Rén 壬", "Guǐ 癸"];
  const BRANCHES = ["Zǐ 子", "Chǒu 丑", "Yín 寅", "Mǎo 卯", "Chén 辰", "Sì 巳", "Wǔ 午", "Wèi 未", "Shēn 申", "Yǒu 酉", "Xū 戌", "Hài 亥"];
  const ZODIAC = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
  const ELEMENTS = ["Wood", "Wood", "Fire", "Fire", "Earth", "Earth", "Metal", "Metal", "Water", "Water"];

  function chineseZodiacYear(y, m, d) {
    // approximate boundary: on/after 4 Feb counts as the new zodiac year
    let approxYear = y;
    if (m < 2 || (m === 2 && d < 4)) approxYear = y - 1;
    const offset = mod(approxYear - 1984, 10);
    const offset12 = mod(approxYear - 1984, 12);
    return {
      calendar: "Chinese Zodiac",
      year: approxYear,
      label: `${ZODIAC[offset12]} (${STEMS[offset]} ${BRANCHES[offset12]})`,
      stem: STEMS[offset],
      branch: BRANCHES[offset12],
      animal: ZODIAC[offset12],
      element: ELEMENTS[offset],
      sexagenaryYear: `${STEMS[offset]}-${BRANCHES[offset12]}`,
      note: "Year boundary approximated at 4 February (near lìchūn); the true Chinese New Year (a lunisolar date) can fall up to several weeks later, which would shift dates in Jan/early Feb into the previous zodiac year.",
    };
  }

  /* ---------- Japanese Imperial Eras (元号 gengō) ----------
     Exact, officially proclaimed Gregorian start dates for the five
     most recent eras. Earlier eras exist but are far more numerous
     and short-lived historically; only the modern five are computed
     here as live conversions. */
  const JAPANESE_ERAS = [
    { name: "Reiwa", kanji: "令和", start: [2019, 5, 1] },
    { name: "Heisei", kanji: "平成", start: [1989, 1, 8] },
    { name: "Shōwa", kanji: "昭和", start: [1926, 12, 25] },
    { name: "Taishō", kanji: "大正", start: [1912, 7, 30] },
    { name: "Meiji", kanji: "明治", start: [1868, 10, 23] },
  ];
  function japaneseEra(jdn, y, m, d) {
    for (const era of JAPANESE_ERAS) {
      const startJDN = Core.gregorianToJDN(...era.start);
      if (jdn >= startJDN) {
        const eraYear = y - era.start[0] + 1;
        return { calendar: "Japanese Era", era: era.name, kanji: era.kanji, year: eraYear, label: `${era.kanji}${eraYear === 1 ? "元" : eraYear}年` };
      }
    }
    return { calendar: "Japanese Era", era: "pre-Meiji", note: "Earlier eras not individually modeled here — see the encyclopedia section." };
  }

  /* ---------- Buddhist Era (Thailand & mainland Southeast Asia) ----------
     Thai civil use: Gregorian year + 543, same month/day, no
     independent leap rule (synced to the Gregorian calendar since
     the 1941 reform that moved Thai New Year to 1 January). Myanmar,
     Laos, Cambodia, Sri Lanka use related but not always identical
     offsets (some use +544 depending on the historical New Year
     date) — this implements the Thai convention specifically. */
  function buddhistEraThai(gregorianYear) {
    return { calendar: "Buddhist Era (Thai)", year: gregorianYear + 543, era: "BE" };
  }

  /* ---------- Persian / Iranian Solar Hijri Calendar ----------
     Birashk's 2820-year arithmetic approximation of the true
     astronomical calendar (algorithm from John Walker's Fourmilab
     Calendar Converter, public domain — a direct implementation of
     Dershowitz & Reingold). Verified against the real 2025 Nowruz
     date (20 March) before use. The true official Iranian calendar
     is defined by the actual astronomical equinox at Tehran, not
     arithmetic — this approximation is known to match it closely
     for roughly 1925-2090 CE and can drift outside that window. */
  const PERSIAN_EPOCH = 1948321; // 19 March 622 CE (Julian)
  const PERSIAN_MONTHS = [
    "Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar",
    "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand",
  ];
  function leapPersian(year) {
    const y = year > 0 ? year - 474 : year - 473;
    return mod((mod(y, 2820) + 474 + 38) * 682, 2816) < 682;
  }
  function persianToJDN(year, month, day) {
    const epbase = year - (year >= 0 ? 474 : 473);
    const epyear = 474 + mod(epbase, 2820);
    return (
      day +
      (month <= 7 ? (month - 1) * 31 : (month - 1) * 30 + 6) +
      floordiv(epyear * 682 - 110, 2816) +
      (epyear - 1) * 365 +
      floordiv(epbase, 2820) * 1029983 +
      (PERSIAN_EPOCH - 1)
    );
  }
  function jdnToPersian(jd) {
    const depoch = jd - persianToJDN(475, 1, 1);
    const cycle = floordiv(depoch, 1029983);
    const cyear = mod(depoch, 1029983);
    let ycycle;
    if (cyear === 1029982) {
      ycycle = 2820;
    } else {
      const aux1 = floordiv(cyear, 366);
      const aux2 = mod(cyear, 366);
      ycycle = floordiv(2134 * aux1 + 2816 * aux2 + 2815, 1028522) + aux1 + 1;
    }
    let year = ycycle + 2820 * cycle + 474;
    if (year <= 0) year -= 1;
    const yday = jd - persianToJDN(year, 1, 1) + 1;
    const month = yday <= 186 ? Math.ceil(yday / 31) : Math.ceil((yday - 6) / 30);
    const day = jd - persianToJDN(year, month, 1) + 1;
    return { year, month, day };
  }
  function persianSolarHijri(jdn) {
    const p = jdnToPersian(jdn);
    return {
      calendar: "Persian (Solar Hijri)",
      year: p.year,
      month: p.month,
      monthName: PERSIAN_MONTHS[p.month - 1],
      day: p.day,
      era: "AP (Anno Persico)",
      note: "Arithmetic (2820-year cycle) approximation of the astronomically-defined official calendar; matches the true equinox-based calendar closely c. 1925-2090 CE.",
    };
  }

  /* ---------- Indian National Calendar (Saka Era, 1957 reform) ----------
     Algorithm from Fourmilab/Dershowitz & Reingold, verified against
     the real 2025 Chaitra 1 date (22 March) before use. */
  function indianCivilToJDN(year, month, day) {
    const gyear = year + 78;
    const leap = isGregorianLeap(gyear);
    const start = Core.gregorianToJDN(gyear, 3, leap ? 21 : 22);
    const chaitra = leap ? 31 : 30;
    if (month === 1) return start + (day - 1);
    let jd = start + chaitra;
    const m = Math.min(month - 2, 5);
    jd += m * 31;
    if (month >= 8) jd += (month - 7) * 30;
    return jd + (day - 1);
  }
  function jdnToIndianCivil(jd) {
    const SAKA_OFFSET = 78;
    const START = 80;
    const greg = jdnToGregorian(jd);
    const leap = isGregorianLeap(greg.y);
    let year = greg.y - SAKA_OFFSET;
    const greg0 = Core.gregorianToJDN(greg.y, 1, 1);
    let yday = jd - greg0;
    const chaitra = leap ? 31 : 30;
    if (yday < START) {
      year -= 1;
      yday += chaitra + 31 * 5 + 30 * 3 + 10 + START;
    }
    yday -= START;
    let month, day;
    if (yday < chaitra) {
      month = 1;
      day = yday + 1;
    } else {
      let mday = yday - chaitra;
      if (mday < 31 * 5) {
        month = floordiv(mday, 31) + 2;
        day = mod(mday, 31) + 1;
      } else {
        mday -= 31 * 5;
        month = floordiv(mday, 30) + 7;
        day = mod(mday, 30) + 1;
      }
    }
    return { year, month, day };
  }
  function isGregorianLeap(y) {
    return mod(y, 4) === 0 && !(mod(y, 100) === 0 && mod(y, 400) !== 0);
  }
  const INDIAN_MONTHS = [
    "Chaitra", "Vaishakha", "Jyaishtha", "Ashadha", "Shravana", "Bhadra",
    "Ashwin", "Kartika", "Agrahayana", "Pausha", "Magha", "Phalguna",
  ];
  function indianNational(jdn) {
    const i = jdnToIndianCivil(jdn);
    return {
      calendar: "Indian National (Saka)",
      year: i.year,
      month: i.month,
      monthName: INDIAN_MONTHS[i.month - 1],
      day: i.day,
      era: "Saka Era",
    };
  }

  /* ---------- Vikram Samvat (elapsed-year approximation only) ----------
     A true lunisolar calendar like the Hebrew calendar, needing its
     own tithi/lunar-month arithmetic beyond this research pass's
     scope — implemented here as a year-offset only (the commonly
     cited +56/+57 rule, month unknown depends on the local school —
     Chaitradi vs Kartikadi — and region), clearly NOT a full
     conversion. */
  function vikramSamvatYear(y, m, d) {
    const year = m >= 4 ? y + 57 : y + 56;
    return {
      calendar: "Vikram Samvat",
      year,
      era: "VS",
      note: "Year number only (+56/+57 approximation, Chaitradi convention) — exact month/day requires regional lunisolar Panchang calculation not implemented here.",
    };
  }

  return {
    chineseZodiacYear, japaneseEra, buddhistEraThai, JAPANESE_ERAS,
    persianSolarHijri, leapPersian, persianToJDN, jdnToPersian,
    indianNational, indianCivilToJDN, jdnToIndianCivil,
    vikramSamvatYear,
  };
})();
