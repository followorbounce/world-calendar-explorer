/* ============================================================
   Central registry: every calendar system available on this page,
   how to compute it from a context object, and its metadata for
   the table/encyclopedia/comparison sections.

   ctx shape (built once per selected date in app.js):
   { jdn, y, m, d, isBCE, weekday, hoursUTC }
   ============================================================ */
const Registry = (() => {
  "use strict";

  const CATEGORIES = {
    modern: "Modern Civil",
    christian: "Christian Era",
    jewish: "Jewish",
    islamic: "Islamic",
    persian: "Persian / Iranian",
    indian: "Indian",
    eastasian: "East Asian",
    buddhist: "Buddhist",
    ancient: "Ancient",
    mesoamerican: "Mesoamerican",
    other: "Other Historical",
  };

  const CALENDARS = [
    {
      key: "gregorian", name: "Gregorian", category: "modern",
      compute: (ctx) => ({ calendar: "Gregorian", year: ctx.y, month: ctx.m, monthName: Core.MONTH_NAMES[ctx.m - 1], day: ctx.d, note: ctx.isBCE ? "Proleptic (before 1582 adoption)" : "" }),
    },
    {
      key: "julian", name: "Julian", category: "modern",
      compute: (ctx) => { const j = Core.jdnToJulian(ctx.jdn); return { calendar: "Julian", year: j.y, month: j.m, monthName: Core.MONTH_NAMES[j.m - 1], day: j.d, note: "Still used liturgically by several Orthodox churches" }; },
    },
    {
      key: "isoweek", name: "ISO Week Date", category: "modern",
      compute: (ctx) => { const w = Core.isoWeekFromGregorian(ctx.y, ctx.m, ctx.d); return { calendar: "ISO Week Date", year: w.isoYear, month: null, day: null, label: `${w.isoYear}-W${String(w.isoWeek).padStart(2, "0")}-${w.isoDay}`, note: "Year-Week-Weekday, ISO 8601" }; },
    },
    {
      key: "unix", name: "Unix Time", category: "modern",
      compute: (ctx) => ({ calendar: "Unix Time", year: null, month: null, day: null, label: `${Core.unixSecondsFromJDN(ctx.jdn, ctx.hoursUTC * 3600)}`, note: "Seconds since 1 Jan 1970 UTC" }),
    },
    {
      key: "jdn", name: "Julian Day Number", category: "modern",
      compute: (ctx) => ({ calendar: "Julian Day Number", year: null, month: null, day: null, label: `${ctx.jdn}`, note: "Astronomers' running day count since 4713 BCE" }),
    },
    {
      key: "astroyear", name: "Astronomical Year Numbering", category: "christian",
      compute: (ctx) => ({ calendar: "Astronomical Year Numbering", year: ctx.isBCE ? 1 - ctx.y : ctx.y, month: ctx.m, monthName: Core.MONTH_NAMES[ctx.m - 1], day: ctx.d, note: "Includes year 0 (= 1 BCE)" }),
    },
    {
      key: "adbc", name: "AD/CE — BC/BCE", category: "christian",
      compute: (ctx) => ({ calendar: "AD/CE — BC/BCE", year: ctx.y, month: ctx.m, monthName: Core.MONTH_NAMES[ctx.m - 1], day: ctx.d, label: `${Core.MONTH_NAMES[ctx.m - 1]} ${ctx.d}, ${ctx.y} ${ctx.isBCE ? "BCE" : "CE"}`, note: "No year 0 in this system" }),
    },
    {
      key: "holocene", name: "Holocene Era", category: "other",
      compute: (ctx) => CalAncient.holocene(ctx.isBCE ? 1 - ctx.y : ctx.y),
    },
    {
      key: "hebrew", name: "Hebrew", category: "jewish",
      compute: (ctx) => CalAbrahamic.hebrew(ctx.jdn),
    },
    {
      key: "islamic", name: "Islamic (Tabular)", category: "islamic",
      compute: (ctx) => CalAbrahamic.islamicTabular(ctx.jdn),
    },
    {
      key: "persian", name: "Persian (Solar Hijri)", category: "persian",
      compute: (ctx) => CalAsian.persianSolarHijri(ctx.jdn),
    },
    {
      key: "indian", name: "Indian National (Saka)", category: "indian",
      compute: (ctx) => CalAsian.indianNational(ctx.jdn),
    },
    {
      key: "vikram", name: "Vikram Samvat", category: "indian",
      compute: (ctx) => CalAsian.vikramSamvatYear(ctx.isBCE ? -(ctx.y - 1) : ctx.y, ctx.m, ctx.d),
    },
    {
      key: "chinesezodiac", name: "Chinese Zodiac", category: "eastasian",
      compute: (ctx) => CalAsian.chineseZodiacYear(ctx.isBCE ? -(ctx.y - 1) : ctx.y, ctx.m, ctx.d),
    },
    {
      key: "japanese", name: "Japanese Imperial Era", category: "eastasian",
      compute: (ctx) => CalAsian.japaneseEra(ctx.jdn, ctx.isBCE ? -(ctx.y - 1) : ctx.y, ctx.m, ctx.d),
    },
    {
      key: "buddhist", name: "Buddhist Era (Thai)", category: "buddhist",
      compute: (ctx) => CalAsian.buddhistEraThai(ctx.isBCE ? 1 - ctx.y : ctx.y),
    },
    {
      key: "bahai", name: "Bahá'í (Badí')", category: "other",
      compute: (ctx) => CalAbrahamic.bahai(ctx.jdn, ctx.isBCE ? -(ctx.y - 1) : ctx.y),
    },
    {
      key: "byzantine", name: "Byzantine", category: "christian",
      compute: (ctx) => CalAncient.byzantine(ctx.jdn),
    },
    {
      key: "coptic", name: "Coptic", category: "christian",
      compute: (ctx) => CalAncient.coptic(ctx.jdn),
    },
    {
      key: "ethiopian", name: "Ethiopian", category: "christian",
      compute: (ctx) => CalAncient.ethiopian(ctx.jdn),
    },
    {
      key: "armenian", name: "Armenian", category: "christian",
      compute: (ctx) => CalAncient.armenian(ctx.jdn),
    },
    {
      key: "assyrian", name: "Assyrian", category: "ancient",
      compute: (ctx) => CalAncient.assyrian(ctx.isBCE ? 1 - ctx.y : ctx.y),
    },
    {
      key: "egyptian", name: "Egyptian Civil", category: "ancient",
      compute: (ctx) => CalAncient.egyptianCivil(ctx.jdn),
    },
    {
      key: "olympiad", name: "Olympiad", category: "ancient",
      compute: (ctx) => CalAncient.olympiad(ctx.jdn),
    },
    {
      key: "seleucid", name: "Seleucid Era", category: "ancient",
      compute: (ctx) => CalAncient.seleucid(ctx.isBCE ? 1 - ctx.y : ctx.y),
    },
    {
      key: "frenchrep", name: "French Republican", category: "other",
      compute: (ctx) => CalAncient.frenchRepublican(ctx.jdn),
    },
    {
      key: "discordian", name: "Discordian", category: "other",
      compute: (ctx) => CalAncient.discordian(ctx.isBCE ? 1 - ctx.y : ctx.y, ctx.m, ctx.d, ctx.jdn),
    },
    {
      key: "maya", name: "Maya (Long Count / Tzolk'in / Haab')", category: "mesoamerican",
      compute: (ctx) => CalMaya.fromJDN(ctx.jdn),
    },
  ];

  function computeAll(ctx) {
    return CALENDARS.map((c) => {
      let result;
      try {
        result = c.compute(ctx);
      } catch (e) {
        result = { calendar: c.name, error: true, note: `Out of range for this date (${e.message})` };
      }
      return { key: c.key, name: c.name, category: c.category, categoryLabel: CATEGORIES[c.category], ...result };
    });
  }

  const SOURCES = [
    { key: "gregorian", name: "Gregorian", months: Core.MONTH_NAMES, hasDay: true, fields: ["year", "month", "day"] },
    { key: "julian", name: "Julian", months: Core.MONTH_NAMES, hasDay: true, fields: ["year", "month", "day"] },
    { key: "hebrew", name: "Hebrew", months: ["Nisan", "Iyar", "Sivan", "Tammuz", "Av", "Elul", "Tishrei", "Cheshvan", "Kislev", "Tevet", "Shevat", "Adar", "Adar II"], hasDay: true, fields: ["year", "month", "day"] },
    { key: "islamic", name: "Islamic (Tabular)", months: ["Muharram", "Safar", "Rabiʻ I", "Rabiʻ II", "Jumada I", "Jumada II", "Rajab", "Shaʻban", "Ramadan", "Shawwal", "Dhu al-Qiʻdah", "Dhu al-Hijjah"], hasDay: true, fields: ["year", "month", "day"] },
    { key: "persian", name: "Persian (Solar Hijri)", months: ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"], hasDay: true, fields: ["year", "month", "day"] },
    { key: "indian", name: "Indian National (Saka)", months: ["Chaitra", "Vaishakha", "Jyaishtha", "Ashadha", "Shravana", "Bhadra", "Ashwin", "Kartika", "Agrahayana", "Pausha", "Magha", "Phalguna"], hasDay: true, fields: ["year", "month", "day"] },
    { key: "coptic", name: "Coptic", months: ["Thout", "Paopi", "Hathor", "Koiak", "Tobi", "Meshir", "Paremhat", "Paremoude", "Pashons", "Paoni", "Epip", "Mesori", "Pi Kogi Enavot"], hasDay: true, fields: ["year", "month", "day"] },
    { key: "ethiopian", name: "Ethiopian", months: ["Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit", "Miazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume"], hasDay: true, fields: ["year", "month", "day"] },
    { key: "frenchrep", name: "French Republican", months: ["Vendémiaire", "Brumaire", "Frimaire", "Nivôse", "Pluviôse", "Ventôse", "Germinal", "Floréal", "Prairial", "Messidor", "Thermidor", "Fructidor", "Sansculottides"], hasDay: true, fields: ["year", "month", "day"] },
    { key: "maya", name: "Maya Long Count", months: null, hasDay: false, fields: ["baktun", "katun", "tun", "uinal", "kin"] },
  ];

  return { CALENDARS, CATEGORIES, SOURCES, computeAll };
})();
