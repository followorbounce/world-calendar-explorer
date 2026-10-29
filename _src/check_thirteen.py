#!/usr/bin/env python3
"""Independent check of js/calendars/thirteen.js: walks the calendar day by day (no day-of-year arithmetic) and
compares every date 2020-01-01..2031-12-31 with the JS (run through node). Exit 1 on any mismatch."""
import datetime as dt, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
IFC = ["January", "February", "March", "April", "May", "June", "Sol", "July", "August", "September", "October", "November", "December"]
MOONS = ["Magnetic", "Lunar", "Electric", "Self-Existing", "Overtone", "Rhythmic", "Resonant", "Galactic", "Solar", "Planetary", "Spectral", "Crystal", "Cosmic"]
WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
start, end = dt.date(2019, 7, 26), dt.date(2031, 12, 31)
want = {}
# IFC: walk each Gregorian year, handing out 13 x 28 days; Leap Day after 28 June, Year Day after 28 December
for y in range(2020, 2032):
    d, mi, dd, leap_done = dt.date(y, 1, 1), 0, 1, False
    leap = (y % 4 == 0 and y % 100) or y % 400 == 0
    while d.year == y:
        if leap and mi == 6 and dd == 1 and not leap_done:
            want[d.isoformat()] = ['Leap Day']; d += dt.timedelta(1); leap_done = True; continue
        if mi == 13:
            want[d.isoformat()] = ['Year Day']
        else:
            want[d.isoformat()] = [IFC[mi], dd, WD[(dd - 1) % 7]]
        dd += 1
        if dd > 28: dd, mi = 1, mi + 1
        d += dt.timedelta(1)
# Thirteen Moon: walk from 26 July 2019, skipping 29 February
moon, day, d = 0, 1, start
while d <= end:
    k = d.isoformat()
    if d.month == 2 and d.day == 29:
        tm = ['0.0 Hunab Ku']
    elif moon == 13:
        tm = ['Day Out of Time']; moon, day = 0, 0
    else:
        tm = [MOONS[moon], day]
    if k in want: want[k].append(tm)
    if not (d.month == 2 and d.day == 29) and tm[0] != 'Day Out of Time':
        day += 1
        if day > 28: day, moon = 1, moon + 1
    elif tm[0] == 'Day Out of Time':
        day = 1
    d += dt.timedelta(1)
js = subprocess.run(['node', '-e', '''
const T = require(process.argv[1]); const out = {};
for (let t = Date.UTC(2020,0,1); t <= Date.UTC(2031,11,31); t += 864e5) {
  const d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
  const a = T.ifc(y, m, dd), b = T.thirteenMoon(y, m, dd);
  out[d.toISOString().slice(0, 10)] = [a.special ? [a.special] : [a.monthName, a.day, a.weekday], b.special ? [b.special] : [b.moonName, b.day]];
}
console.log(JSON.stringify(out));''', os.path.join(HERE, '..', 'js', 'calendars', 'thirteen.js')], capture_output=True, text=True, check=True).stdout
got = json.loads(js)
bad = 0
for k, w in want.items():
    g = got[k]
    wi, wt = w[:-1], w[-1]
    if g[0] != wi or g[1] != wt:
        bad += 1
        if bad < 10: print('MISMATCH', k, 'js', g, 'walk', wi, wt)
print('checked %d dates, %d mismatches' % (len(want), bad))
sys.exit(1 if bad else 0)
