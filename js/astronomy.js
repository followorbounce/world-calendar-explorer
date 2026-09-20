/* ============================================================
   Astronomical Foundations — the two animated SVG diagrams.
   ============================================================ */
const Astronomy = (() => {
  "use strict";

  const SYNODIC_MONTH = 29.53058867; // days, mean value
  const TROPICAL_YEAR = 365.24219;
  const SIDEREAL_YEAR = 365.25636;

  /* ---------- Solar year diagram ---------- */
  // Approximate day-of-year for the four cardinal points (non-leap year).
  const SOLAR_MARKS = [
    { day: 79, label: "Mar equinox" },
    { day: 172, label: "Jun solstice" },
    { day: 265, label: "Sep equinox" },
    { day: 355, label: "Dec solstice" },
  ];

  function ellipsePoint(cx, cy, a, b, angle) {
    return { x: cx + a * Math.cos(angle), y: cy + b * Math.sin(angle) };
  }

  function renderSolarDiagram(svg) {
    const cx = 160, cy = 160, a = 120, b = 100;
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";

    const orbit = document.createElementNS(ns, "ellipse");
    orbit.setAttribute("cx", cx); orbit.setAttribute("cy", cy);
    orbit.setAttribute("rx", a); orbit.setAttribute("ry", b);
    orbit.setAttribute("fill", "none");
    orbit.setAttribute("stroke", "var(--line)");
    orbit.setAttribute("stroke-width", "1.2");
    svg.appendChild(orbit);

    const sun = document.createElementNS(ns, "circle");
    sun.setAttribute("cx", cx); sun.setAttribute("cy", cy); sun.setAttribute("r", 12);
    sun.setAttribute("fill", "var(--brass-bright)");
    svg.appendChild(sun);

    SOLAR_MARKS.forEach((mark) => {
      const angle = (mark.day / 365) * 2 * Math.PI - Math.PI / 2;
      const p = ellipsePoint(cx, cy, a, b, angle);
      const tick = document.createElementNS(ns, "circle");
      tick.setAttribute("cx", p.x); tick.setAttribute("cy", p.y); tick.setAttribute("r", 2.5);
      tick.setAttribute("fill", "var(--accent-2)");
      svg.appendChild(tick);
      const label = document.createElementNS(ns, "text");
      const lp = ellipsePoint(cx, cy, a + 22, b + 20, angle);
      label.setAttribute("x", lp.x); label.setAttribute("y", lp.y);
      label.setAttribute("font-size", "8.5");
      label.setAttribute("fill", "var(--ink-dim)");
      label.setAttribute("text-anchor", "middle");
      label.textContent = mark.label;
      svg.appendChild(label);
    });

    const earthGroup = document.createElementNS(ns, "g");
    earthGroup.setAttribute("id", "earthMarker");
    const earth = document.createElementNS(ns, "circle");
    earth.setAttribute("r", 6);
    earth.setAttribute("fill", "var(--accent-2)");
    earthGroup.appendChild(earth);
    const tiltLine = document.createElementNS(ns, "line");
    tiltLine.setAttribute("x1", -9); tiltLine.setAttribute("y1", 6.5);
    tiltLine.setAttribute("x2", 9); tiltLine.setAttribute("y2", -6.5);
    tiltLine.setAttribute("stroke", "var(--ink)");
    tiltLine.setAttribute("stroke-width", "1.4");
    earthGroup.appendChild(tiltLine);
    svg.appendChild(earthGroup);
  }

  function updateSolarDiagram(svg, dayOfYear) {
    const cx = 160, cy = 160, a = 120, b = 100;
    const angle = (dayOfYear / 365) * 2 * Math.PI - Math.PI / 2;
    const p = ellipsePoint(cx, cy, a, b, angle);
    const group = svg.querySelector("#earthMarker");
    if (group) group.setAttribute("transform", `translate(${p.x},${p.y})`);
  }

  /* ---------- Lunar phase diagram ----------
     Illuminated-region path verified at f=0 (zero area), f=0.25 and
     f=0.75 (exactly half-circle, either quarter), and f=0.5 (full
     circle) before use — see commit notes / progress.md. */
  function moonPhasePath(cx, cy, r, phaseFraction) {
    const theta = phaseFraction * 2 * Math.PI;
    const rx = Math.abs(r * Math.cos(theta));
    const outerSweep = 1;
    const innerSweep = Math.cos(theta) < 0 ? 1 : 0;
    return (
      `M ${cx} ${cy - r} ` +
      `A ${r} ${r} 0 0 ${outerSweep} ${cx} ${cy + r} ` +
      `A ${rx} ${r} 0 0 ${innerSweep} ${cx} ${cy - r} Z`
    );
  }

  function renderLunarDiagram(svg) {
    const cx = 160, cy = 160, r = 90;
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";

    const dark = document.createElementNS(ns, "circle");
    dark.setAttribute("cx", cx); dark.setAttribute("cy", cy); dark.setAttribute("r", r);
    dark.setAttribute("fill", "var(--paper-alt)");
    dark.setAttribute("stroke", "var(--line)");
    svg.appendChild(dark);

    const lit = document.createElementNS(ns, "path");
    lit.setAttribute("id", "moonLit");
    lit.setAttribute("fill", "var(--brass-bright)");
    svg.appendChild(lit);

    updateLunarDiagram(svg, 0);
  }

  function updateLunarDiagram(svg, dayInCycle) {
    const cx = 160, cy = 160, r = 90;
    const f = (dayInCycle / SYNODIC_MONTH) % 1;
    const path = svg.querySelector("#moonLit");
    if (path) path.setAttribute("d", moonPhasePath(cx, cy, r, f));
  }

  function phaseName(f) {
    if (f < 0.03 || f > 0.97) return "New Moon";
    if (f < 0.22) return "Waxing Crescent";
    if (f < 0.28) return "First Quarter";
    if (f < 0.47) return "Waxing Gibbous";
    if (f < 0.53) return "Full Moon";
    if (f < 0.72) return "Waning Gibbous";
    if (f < 0.78) return "Last Quarter";
    return "Waning Crescent";
  }

  return {
    SYNODIC_MONTH, TROPICAL_YEAR, SIDEREAL_YEAR,
    renderSolarDiagram, updateSolarDiagram,
    renderLunarDiagram, updateLunarDiagram, phaseName,
  };
})();
