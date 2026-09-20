/* ============================================================
   Mesoamerican calendars: Maya Long Count, Tzolk'in, Haab'.
   Same GMT 584283 correlation and algorithm already verified and
   in production on the sibling Maya-Calendar site — kept
   byte-for-byte consistent with that repo rather than re-derived.
   ============================================================ */
const CalMaya = (() => {
  "use strict";
  const { mod, floordiv } = Core;
  const CORRELATION = 584283;

  const DAY_SIGNS = [
    "Imix", "Ik'", "Ak'bal", "K'an", "Chikchan", "Kimi", "Manik'", "Lamat",
    "Muluk", "Ok", "Chuwen", "Eb'", "Ben", "Ix", "Men", "Kib'", "Kaban", "Etz'nab'", "Kawak", "Ajaw",
  ];
  const HAAB_MONTHS = [
    "Pop", "Wo'", "Sip", "Sotz'", "Sek", "Xul", "Yaxk'in", "Mol", "Ch'en",
    "Yax", "Sak'", "Keh", "Mak", "K'ank'in", "Muwan", "Pax", "K'ayab", "Kumk'u", "Wayeb'",
  ];

  function longCountFromTotal(total) {
    let rem = total;
    const baktun = floordiv(rem, 144000); rem -= baktun * 144000;
    const katun = floordiv(rem, 7200); rem -= katun * 7200;
    const tun = floordiv(rem, 360); rem -= tun * 360;
    const uinal = floordiv(rem, 20); rem -= uinal * 20;
    return { baktun, katun, tun, uinal, kin: rem };
  }

  function formatLC(lc) {
    return `${lc.baktun}.${lc.katun}.${lc.tun}.${lc.uinal}.${lc.kin}`;
  }

  function tzolkin(total) {
    const num = mod(total + 3, 13) + 1;
    const idx = mod(total + 19, 20);
    return { num, sign: DAY_SIGNS[idx], label: `${num} ${DAY_SIGNS[idx]}` };
  }

  function haab(total) {
    const h = mod(total + 348, 365);
    const month = floordiv(h, 20);
    const day = mod(h, 20);
    return { day, month: HAAB_MONTHS[month], label: `${day} ${HAAB_MONTHS[month]}` };
  }

  function fromJDN(jdn) {
    const total = jdn - CORRELATION;
    const lc = longCountFromTotal(total);
    return {
      calendar: "Maya",
      label: `${formatLC(lc)} — ${tzolkin(total).label}, ${haab(total).label}`,
      longCount: formatLC(lc),
      tzolkin: tzolkin(total).label,
      haab: haab(total).label,
      correlation: "GMT 584283",
      note: "The nearby 584285 (Lounsbury) correlation shifts every date by two days; both are used in scholarship.",
    };
  }

  return { fromJDN, longCountFromTotal, formatLC, tzolkin, haab, CORRELATION };
})();
