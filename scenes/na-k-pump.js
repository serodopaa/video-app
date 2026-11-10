// Explainer: the sodium-potassium pump (Na⁺/K⁺-ATPase). Built with the user.
// The user does the drawing; these visuals simply appear (drawn: false). Board is 1600 x 900.
(() => {
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const svgDoc = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">${inner}</svg>`;
  const svgItem = (inner, extra = {}) => ({ type: 'svg', svg: svgDoc(inner), ...extra });
  const title = (text) => ({ type: 'text', x: 800, y: 66, text, size: 56, font: 'sans', bold: true, align: 'center', color: 'ink' });
  const txt = (text, x, y, size, color = 'ink', extra = {}) => ({ type: 'text', x, y, text, size, font: 'sans', color, ...extra });
  const DARK = '#3b4252';
  const label = (text, x, y, from, to, align = 'center', size = 22, color = 'ink') => [
    txt(text, x, y, size, color, { align }),
    { type: 'line', from, to, color: DARK, width: 2.5, rough: false },
    { type: 'circle', x: to[0], y: to[1], r: 5, color: DARK, width: 2, fill: DARK, fillOpacity: 1, rough: false },
  ];
  const NA_C = '#c46f00', K_C = '#47309a', RED = '#d12f25', BLUE = '#2f6fde';

  // ---------- shared pieces ----------
  // a lipid bilayer from x0 to x1 between top and bot
  const bilayer = (x0, x1, top, bot, skip = []) => {
    let out = `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${bot - top}" fill="#fbecd6"/>`;
    const mid = (top + bot) / 2;
    for (let x = x0 + 10; x <= x1 - 8; x += 20) {
      if (skip.some(([a, b]) => x > a && x < b)) continue;
      for (const [hy, t0, t1] of [[top + 8, top + 17, mid - 3], [bot - 8, bot - 17, mid + 3]]) {
        const d = (t1 - t0) / 2;
        out += `<path d="M${x - 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d} M${x + 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d}" stroke="#c99a62" stroke-width="2" fill="none"/>`;
        out += `<circle cx="${x}" cy="${hy}" r="9" fill="#f4c995" stroke="#b67d3c" stroke-width="2"/>`;
      }
    }
    return out;
  };
  // outside (blue) above, inside (lilac) below, membrane in between
  const cellPanel = (x0, x1, y0, top, bot, y1, skip = []) =>
    `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${top - y0}" rx="16" fill="#eef6fd"/>
     <rect x="${x0}" y="${bot}" width="${x1 - x0}" height="${y1 - bot}" rx="16" fill="#f7f0fb"/>${bilayer(x0, x1, top, bot, skip)}`;

  // The pump. c = 0: open to the inside (E1), c = 1: open to the outside (E2).
  // PX = centre, MT / MB = membrane top / bottom.
  const pumpSvg = (PX, MT, MB, c = 0, o = {}) => {
    const yTop = MT - 60, yBot = MB + 40, ymid = (MT + MB) / 2;
    const yA = lerp(MT + 14, yTop, c), hA = lerp(0, 58, c), yB = lerp(yBot, MB - 14, c), hB = lerp(58, 0, c);
    const id = `pg${Math.round(PX)}${Math.round(c * 100)}`;
    const cav = `${f1(PX - hA)},${f1(yA)} ${f1(PX + hA)},${f1(yA)} ${f1(PX + 38)},${f1(ymid)} ${f1(PX + hB)},${f1(yB)} ${f1(PX - hB)},${f1(yB)} ${f1(PX - 38)},${f1(ymid)}`;
    const dom = { x: PX + 175, y: MB + 100 };
    return `<defs>
      <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4f7fcf"/><stop offset="0.45" stop-color="#9fc0ef"/><stop offset="1" stop-color="#3f6cba"/></linearGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef6fd"/><stop offset="1" stop-color="#f7f0fb"/></linearGradient>
      <radialGradient id="${id}d" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#e4dafa"/><stop offset="1" stop-color="#a48ad9"/></radialGradient>
    </defs>
    <ellipse cx="${dom.x}" cy="${dom.y}" rx="105" ry="68" fill="url(#${id}d)" stroke="#5e46a8" stroke-width="4"/>
    <path d="M${dom.x + 78} ${dom.y + 6} a26 22 0 0 1 -6 34" fill="none" stroke="#5e46a8" stroke-width="3"/>
    <ellipse cx="${dom.x + 70}" cy="${dom.y + 24}" rx="20" ry="16" fill="#7d63c4" opacity="0.55"/>
    <rect x="${PX - 128}" y="${yTop}" width="256" height="${yBot - yTop}" rx="34" fill="url(#${id}b)" stroke="#2c5a92" stroke-width="4"/>
    ${[-86, -44, 44, 86].map((dx) => `<path d="M${PX + dx} ${yTop + 16} v${yBot - yTop - 32}" stroke="#ffffff" stroke-opacity="0.22" stroke-width="10" stroke-linecap="round"/>`).join('')}
    <polygon points="${cav}" fill="url(#${id}c)" stroke="#2c5a92" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="${PX + 96}" cy="${MB + 30}" r="9" fill="#2c5a92" stroke="#ffffff" stroke-width="2"/>
    ${o.sites === 'na' ? [[-21, 14], [21, 14], [0, -22]].map(([dx, dy]) => `<circle cx="${PX + dx}" cy="${ymid + dy}" r="17" fill="none" stroke="${NA_C}" stroke-width="3" stroke-dasharray="5 4"/>`).join('') : ''}
    ${o.sites === 'k' ? [[-20, 0], [20, 0]].map(([dx, dy]) => `<circle cx="${PX + dx}" cy="${ymid + dy}" r="17" fill="none" stroke="${K_C}" stroke-width="3" stroke-dasharray="5 4"/>`).join('') : ''}`;
  };
  // where things sit relative to a pump
  const pumpPts = (PX, MT, MB) => {
    const ymid = (MT + MB) / 2;
    return {
      sNa: [[PX - 21, ymid + 14], [PX + 21, ymid + 14], [PX, ymid - 22]],
      sK: [[PX - 20, ymid], [PX + 20, ymid]],
      pSite: [PX + 96, MB + 30],
      atpSite: [PX + 245, MB + 124],
      top: [PX, MT - 70], bot: [PX, MB + 50],
    };
  };
  const pill = (x, y, t, fill, edge) => `<g transform="translate(${f1(x)} ${f1(y)})"><rect x="-34" y="-17" width="68" height="34" rx="17" fill="${fill}" stroke="${edge}" stroke-width="3"/>
    <text x="0" y="7" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="#ffffff">${t}</text></g>`;
  const pDot = (x, y) => `<g transform="translate(${f1(x)} ${f1(y)})"><circle r="17" fill="#e0453a" stroke="#8e1d14" stroke-width="3"/>
    <text x="0" y="7" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="#ffffff">P</text></g>`;

  // concentration bars (mM) for Na⁺ and K⁺, outside vs inside
  const bars = (x, y, w, h, v, o = {}) => {
    const base = y + h - 56, sc = (h - 150) / 150, bw = (w - 140) / 4;
    const cols = [['Na⁺', 'Outside', v.naOut, '#f0a12e', '#a8640a'], ['Na⁺', 'Inside', v.naIn, '#f6c47a', '#a8640a'],
      ['K⁺', 'Outside', v.kOut, '#a995e6', '#47309a'], ['K⁺', 'Inside', v.kIn, '#7b5cd6', '#47309a']];
    let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#ffffff" stroke="#d9dce3" stroke-width="2"/>
      <text x="${x + w / 2}" y="${y + 40}" font-family="Lexend, Arial, sans-serif" font-weight="600" font-size="26" text-anchor="middle" fill="#1f2430">${o.title || 'Concentration (mM)'}</text>
      <line x1="${x + 30}" y1="${base}" x2="${x + w - 30}" y2="${base}" stroke="#8a8f98" stroke-width="2"/>`;
    cols.forEach(([ion, side, val, fill, edge], i) => {
      const bx = x + 40 + i * bw + (i >= 2 ? 60 : 0), bh = Math.max(2, val * sc);
      out += `<rect x="${f1(bx)}" y="${f1(base - bh)}" width="${f1(bw - 14)}" height="${f1(bh)}" rx="6" fill="${fill}" stroke="${edge}" stroke-width="2.5"/>
        <text x="${f1(bx + (bw - 14) / 2)}" y="${f1(base - bh - 10)}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="19" text-anchor="middle" fill="${edge}">${Math.round(val)}</text>
        <text x="${f1(bx + (bw - 14) / 2)}" y="${base + 24}" font-family="Lexend, Arial, sans-serif" font-weight="600" font-size="16" text-anchor="middle" fill="#5b6270">${side}</text>`;
      if (i % 2 === 0) out += `<text x="${f1(bx + bw - 7)}" y="${base + 48}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="22" text-anchor="middle" fill="${edge}">${ion}</text>`;
    });
    return out;
  };
  const NORMAL = { naOut: 145, naIn: 12, kOut: 5, kIn: 140 };
  const RUNDOWN = { naOut: 92, naIn: 66, kOut: 58, kIn: 88 };
  const mixV = (a, b, t) => Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k], b[k], t)]));
  // frames of something that changes over time: f(t in 0..1) -> svg markup
  const frames = (f, t0, dur, n = 12, last = true) => [...Array(n + 1)].map((_, k) => ({
    ...svgItem(f(ease(k / n))), at: t0 + (dur * k) / n, duration: 0.01, ...(k < n || !last ? { until: dur / n + 0.02 } : {}),
  }));

  // ====================================================================== slide 1: hook
  const H = { top: 470, bot: 560 };
  const HPUMPS = [220, 520, 820];
  const hookArt = svgItem(cellPanel(70, 1000, 120, H.top, H.bot, 860, HPUMPS.map((x) => [x - 140, x + 140]))
    + HPUMPS.map((x) => `<g transform="translate(${x} ${(H.top + H.bot) / 2}) scale(0.62) translate(${-x} ${-(H.top + H.bot) / 2})">${pumpSvg(x, H.top, H.bot, 0)}</g>`).join(''));
  // n ions spread over a box, keeping clear of `avoid` boxes [x0, y0, x1, y1] and of each other
  const placed = [];
  const scatter = (ion, n, x0, x1, y0, y1, seed, avoid = []) => {
    const out = [];
    for (let i = 0, tries = 0; out.length < n && tries < 400; i++, tries++) {
      const r1 = Math.abs(Math.sin(seed + i * 12.9898) * 43758.5453) % 1, r2 = Math.abs(Math.sin(seed + i * 78.233) * 12345.678) % 1;
      const x = Math.round(x0 + r1 * (x1 - x0)), y = Math.round(y0 + r2 * (y1 - y0));
      if (avoid.some(([a, b, c, d]) => x > a - 22 && x < c + 22 && y > b - 22 && y < d + 22)) continue;
      if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < 44)) continue;
      placed.push([x, y]);
      out.push({ type: 'ion', ion, x, y });
    }
    return out;
  };
  const HAV = [[90, 130, 290, 170], [410, 330, 630, 400], [90, 815, 280, 850], [330, 675, 740, 715],
    ...HPUMPS.flatMap((x) => [[x - 95, 380, x + 95, 470], [x - 30, 560, x + 200, 640]])];
  const hookIons = [...scatter('na', 14, 110, 960, 160, 430, 1.3, HAV), ...scatter('k', 3, 110, 960, 170, 430, 7.7, HAV),
    ...scatter('k', 12, 110, 960, 610, 820, 3.1, HAV), ...scatter('na', 3, 110, 960, 620, 820, 9.2, HAV)];
  const pumpLoops = (xs, top, bot, s = 0.62) => xs.flatMap((x, j) => [
    ...[0, 1, 2].map((i) => ({ type: 'ion', ion: 'na', loop: 2.4, phase: j * 0.5 + i * 0.25, path: [[x - 20 + i * 20, bot + 70], [x, (top + bot) / 2], [x - 10 + i * 10, top - 80]] })),
    ...[0, 1].map((i) => ({ type: 'ion', ion: 'k', loop: 2.4, phase: j * 0.5 + 1.2 + i * 0.3, path: [[x - 10 + i * 20, top - 80], [x, (top + bot) / 2], [x - 15 + i * 30, bot + 70]] })),
  ]);
  const hookItems = [
    title('The pump that never stops'),
    hookArt,
    ...hookIons,
    txt('Outside the cell', 100, 150, 22, '#2c5a92', { bold: true }),
    txt('Inside the cell', 100, 836, 22, '#6b3c87', { bold: true }),
    ...label('Na⁺/K⁺ pump', 520, 350, [520, 366], [520, 432], 'center', 24),
    { type: 'rect', x: 1030, y: 120, w: 510, h: 740, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    txt('~⅓', 1285, 250, 120, RED, { align: 'center', bold: true }),
    txt('of the energy your body\nuses at rest goes to\nthis one pump', 1285, 380, 28, 'ink', { align: 'center', bold: true }),
    txt('In neurons: up to ⅔', 1285, 520, 30, '#8e1d14', { align: 'center', bold: true }),
    { type: 'line', from: [1080, 585], to: [1490, 585], color: '#e3e6ec', width: 2, rough: false },
    txt('Ions keep leaking across\nthe membrane all the time.\nSo why don’t the differences\never disappear?', 1285, 690, 25, '#3b4252', { align: 'center' }),
  ];
  const hookActions = [{
    id: 'hrun', label: 'Pumps at work', stay: true, drawn: false,
    items: [...pumpLoops(HPUMPS, H.top, H.bot),
      txt('3 Na⁺ out, 2 K⁺ in, over and over', 535, 695, 22, '#5b6270', { align: 'center', bold: true, at: 0.3, anim: 'fade', duration: 0.4 })],
  }];

  // ====================================================================== slide 2: the leak problem
  const L = { top: 420, bot: 520, x1: 920 };
  const LEAKS = [{ x: 150, ion: 'na' }, { x: 320, ion: 'k' }, { x: 720, ion: 'na' }, { x: 862, ion: 'k' }];
  const L_PUMP = 470;
  const leakArt = svgItem(cellPanel(70, L.x1, 120, L.top, L.bot, 860, LEAKS.map((c) => [c.x - 46, c.x + 46])));
  const leakChannels = LEAKS.map((c) => ({ type: 'channel', x: c.x, y: (L.top + L.bot) / 2, h: 120, plain: true, open: 1,
    fill: c.ion === 'na' ? '#f8cf8f' : '#cdbdf3', edge: c.ion === 'na' ? '#a8640a' : '#47309a', label: c.ion === 'na' ? 'Na⁺\nleak' : 'K⁺\nleak' }));
  const LAV = [[90, 130, 360, 170], [90, 815, 330, 850], [150, 745, 820, 815], ...LEAKS.map((c) => [c.x - 60, 360, c.x + 60, 640]), [L_PUMP - 90, 360, L_PUMP + 200, 640]];
  const leakIons = [...scatter('na', 12, 110, 890, 160, 380, 2.2, LAV), ...scatter('k', 3, 110, 890, 170, 380, 5.5, LAV),
    ...scatter('k', 11, 110, 890, 640, 820, 4.4, LAV), ...scatter('na', 3, 110, 890, 650, 820, 6.6, LAV)];
  const leakLoops = LEAKS.flatMap((c, j) => [0, 1].map((i) => (c.ion === 'na'
    ? { type: 'ion', ion: 'na', loop: 2.2, phase: j * 0.4 + i * 1.1, path: [[c.x - 30 + i * 60, L.top - 90], [c.x, (L.top + L.bot) / 2], [c.x - 40 + i * 80, L.bot + 100]] }
    : { type: 'ion', ion: 'k', loop: 2.2, phase: j * 0.4 + i * 1.1, path: [[c.x - 30 + i * 60, L.bot + 100], [c.x, (L.top + L.bot) / 2], [c.x - 40 + i * 80, L.top - 90]] })));
  const BAR = { x: 950, y: 120, w: 590, h: 740 };
  const capBox = (t0, until, color) => ({ type: 'rect', x: 150, y: 745, w: 670, h: 70, color, fill: '#ffffff', fillOpacity: 0.95, width: 2, rough: false, at: t0, ...(until ? { until } : {}) });
  const leakItems = [
    title('The problem: ions leak'),
    leakArt, ...leakChannels, ...leakIons.map((it) => ({ ...it, hideDuring: ['leak', 'fix'] })),
    txt('Outside: lots of Na⁺', 100, 150, 22, '#2c5a92', { bold: true }),
    txt('Inside: lots of K⁺', 100, 836, 22, '#6b3c87', { bold: true }),
    { ...svgItem(bars(BAR.x, BAR.y, BAR.w, BAR.h, NORMAL)), hideDuring: ['leak', 'fix'] },
  ];
  const leakActions = [
    {
      id: 'leak', label: 'Let the ions leak', group: 'g2', stay: true, drawn: false,
      items: [
        ...leakIons, ...leakLoops,
        ...frames((t) => bars(BAR.x, BAR.y, BAR.w, BAR.h, mixV(NORMAL, RUNDOWN, t)), 0.3, 8),
        capBox(0, 6, '#8a8f98'), txt('Na⁺ leaks in, K⁺ leaks out…', 485, 780, 24, '#5b6270', { align: 'center', bold: true, until: 6 }),
        capBox(6, 0, RED), txt('…so the differences run down.\nWithout a pump, the “battery” goes flat.', 485, 766, 23, RED, { align: 'center', bold: true, at: 6, anim: 'fade', duration: 0.4 }),
      ],
    },
    {
      id: 'fix', label: 'Add the pump', group: 'g2', stay: true, drawn: false,
      items: [
        ...leakIons, ...leakLoops,
        svgItem(`<g transform="translate(${L_PUMP} ${(L.top + L.bot) / 2}) scale(0.62) translate(${-L_PUMP} ${-(L.top + L.bot) / 2})">${pumpSvg(L_PUMP, L.top, L.bot, 0)}</g>`),
        ...pumpLoops([L_PUMP], L.top, L.bot),
        ...frames((t) => bars(BAR.x, BAR.y, BAR.w, BAR.h, mixV(RUNDOWN, NORMAL, t)), 0.3, 6),
        capBox(0.5, 0, BLUE), txt('The pump pushes them back: Na⁺ out, K⁺ in', 485, 780, 24, BLUE, { align: 'center', bold: true, at: 0.5, anim: 'fade', duration: 0.4 }),
      ],
    },
  ];

  // ====================================================================== slide 3: meet the pump
  const M3 = { px: 400, top: 390, bot: 500 };
  const m3pts = pumpPts(M3.px, M3.top, M3.bot);
  const m3Panel = svgItem(cellPanel(70, 880, 120, M3.top, M3.bot, 860, [[M3.px - 140, M3.px + 140]]));
  const m3View = (c) => svgItem(pumpSvg(M3.px, M3.top, M3.bot, c, { sites: c ? 'k' : 'na' }));
  const m3Labels = (c) => [
    ...(c ? label('2 K⁺ binding sites\n(open to the outside)', 160, 250, [200, 274], [M3.px - 20, (M3.top + M3.bot) / 2], 'center', 21, K_C)
      : label('3 Na⁺ binding sites\n(open to the inside)', 160, 640, [190, 616], [M3.px - 21, (M3.top + M3.bot) / 2 + 14], 'center', 21, NA_C)),
  ];
  const m3Common = [
    ...label('Phosphorylation\nsite', 745, 515, [738, 518], m3pts.pSite, 'left', 21),
    ...label('ATP binding site', 790, 760, [740, 748], [M3.px + 245, M3.bot + 124], 'center', 21),
    ...label('Cell membrane', 790, 250, [790, 266], [790, M3.top + 4], 'center', 21),
    txt('Na⁺/K⁺ pump (Na⁺/K⁺-ATPase)', M3.px, 290, 25, '#2c5a92', { align: 'center', bold: true }),
    txt('Outside the cell', 100, 150, 22, '#2c5a92', { bold: true }),
    txt('Inside the cell', 100, 836, 22, '#6b3c87', { bold: true }),
  ];
  const meetItems = [
    title('Meet the pump'),
    m3Panel,
    { ...m3View(0), hideDuring: ['m3in', 'm3out'] },
    ...m3Labels(0).map((it) => ({ ...it, hideDuring: ['m3in', 'm3out'] })),
    ...m3Common,
    { type: 'rect', x: 920, y: 120, w: 620, h: 740, color: '#2f6fde', fill: '#eef3ff', fillOpacity: 1, width: 3, rough: false },
    txt('Active transport', 1230, 175, 34, BLUE, { align: 'center', bold: true }),
    txt('It moves ions AGAINST\ntheir concentration gradients\n(“uphill”), so it needs energy.', 1230, 265, 24, 'ink', { align: 'center', bold: true }),
    { type: 'ion', ion: 'na', x: 990, y: 420 }, txt('3 Na⁺ pumped OUT,\nwhere Na⁺ is already high', 1025, 420, 23, NA_C, { bold: true }),
    { type: 'ion', ion: 'k', x: 990, y: 530 }, txt('2 K⁺ pumped IN,\nwhere K⁺ is already high', 1025, 530, 23, K_C, { bold: true }),
    svgItem(pill(990, 640, 'ATP', '#e0453a', '#8e1d14')),
    txt('1 ATP is used\nevery cycle', 1040, 640, 23, '#8e1d14', { bold: true }),
    txt('It switches between two shapes:\nopen to the inside and open to the\noutside. Try the buttons above.', 1230, 780, 21, '#5b6270', { align: 'center' }),
  ];
  const meetActions = [
    { id: 'm3in', label: 'Open to the inside', group: 'm3', stay: true, drawn: false, items: [m3View(0), ...m3Labels(0)] },
    { id: 'm3out', label: 'Open to the outside', group: 'm3', stay: true, drawn: false, items: [m3View(1), ...m3Labels(1)] },
  ];

  // ====================================================================== slide 4: the pump cycle
  const C = { px: 400, top: 390, bot: 500 };
  const cp = pumpPts(C.px, C.top, C.bot);
  const cPanel = svgItem(cellPanel(70, 860, 120, C.top, C.bot, 860, [[C.px - 140, C.px + 140]]));
  const NA_WAIT = [[C.px - 210, 640], [C.px - 150, 700], [C.px - 230, 760]];
  const NA_OUT = [[C.px - 230, 190], [C.px - 140, 240], [C.px - 60, 175]];
  const K_WAIT = [[C.px + 170, 220], [C.px + 250, 270]];
  const K_IN = [[C.px - 130, 790], [C.px - 50, 740]];
  const ATP_WAIT = [C.px + 330, 800], ADP_GONE = [C.px + 380, 830], PI_GONE = [C.px + 300, 840];
  // state s (0..6) = after step s
  const st = (s) => ({
    na: s < 1 ? NA_WAIT : s < 3 ? cp.sNa : NA_OUT,
    k: s < 4 ? K_WAIT : s < 6 ? cp.sK : K_IN,
    c: s < 3 ? 0 : s < 5 ? 1 : 0,
    p: s >= 2 && s < 5,
    atp: s < 2,
  });
  const CYCLE = [
    { title: '3 Na⁺ bind', text: 'Open to the inside, the pump\npicks up 3 Na⁺ from the cytoplasm.', color: NA_C },
    { title: 'ATP → ADP + P', text: 'ATP is split. Its phosphate (P)\nsticks to the pump.', color: '#c0392b' },
    { title: 'Shape change: Na⁺ out', text: 'The phosphate makes the pump flip\nopen to the outside and let go\nof the 3 Na⁺.', color: '#2c5a92' },
    { title: '2 K⁺ bind', text: 'Open to the outside, the pump\npicks up 2 K⁺.', color: K_C },
    { title: 'P leaves: flip back', text: 'The phosphate comes off and the\npump flips back to face inside.', color: '#c0392b' },
    { title: '2 K⁺ released inside', text: 'The 2 K⁺ are let go into the cell.\nThe pump is ready to start again.', color: K_C },
  ].map((s, i) => ({ ...s, from: i, to: i + 1 }));
  const D = 3.2;
  const pumpAt = (c) => pumpSvg(C.px, C.top, C.bot, c);
  // items for step k (1..6) starting at t0; everything disappears at t0 + D unless it is the last step
  const segment = (k, t0, last) => {
    const a = st(k - 1), b = st(k), out = [];
    const hold = (it, from = 0) => ({ duration: 0.01, ...it, at: t0 + from, ...(last ? {} : { until: D - from }) });
    // pump shape (morphing in steps 3 and 5)
    const morphFrom = k === 3 ? 0 : k === 5 ? 0.9 : -1;
    if (morphFrom >= 0) {
      const n = 10, md = 1.1;
      out.push({ ...svgItem(pumpAt(a.c)), at: t0, duration: 0.01, until: morphFrom + 0.02 });
      for (let i = 1; i <= n; i++) {
        const isEnd = i === n;
        out.push({ ...svgItem(pumpAt(lerp(a.c, b.c, ease(i / n)))), at: t0 + morphFrom + (md * i) / n, duration: 0.01,
          ...(isEnd ? (last ? {} : { until: D - morphFrom - md }) : { until: md / n + 0.02 }) });
      }
    } else out.push(hold({ ...svgItem(pumpAt(a.c)), duration: 0.01 }));
    // ions
    const moveIons = (ion, from, to, via, start, gap) => from.forEach((p, i) => {
      if (p === to[i]) { out.push(hold({ type: 'ion', ion, x: p[0], y: p[1], duration: 0.01 })); return; }
      const s0 = start + i * gap;
      out.push({ type: 'ion', ion, x: p[0], y: p[1], at: t0, duration: 0.01, until: s0 + 0.02 });
      out.push(hold({ type: 'ion', ion, path: [p, ...via(i), to[i]], duration: 1.3 }, s0));
    });
    moveIons('na', a.na, b.na, (i) => (k === 1 ? [[C.px - 60 + i * 20, 590], [C.px - 10 + i * 10, C.bot + 30]] : [[C.px, C.top - 30], [C.px - 40 * i, C.top - 90]]), k === 3 ? 1.6 : 0.2, 0.3);
    moveIons('k', a.k, b.k, (i) => (k === 4 ? [[C.px + 30, 290], [C.px, C.top - 40]] : [[C.px, C.bot + 30], [C.px - 40 - 30 * i, 640]]), 0.2, 0.35);
    // ATP / ADP / phosphate
    if (k === 2) {
      out.push(...frames((t) => pill(lerp(ATP_WAIT[0], cp.atpSite[0], t), lerp(ATP_WAIT[1], cp.atpSite[1], t), 'ATP', '#e0453a', '#8e1d14'), t0, 0.9, 8, false).map((it, i, arr) => (i === arr.length - 1 ? { ...it, until: 0.4 } : it)));
      out.push({ type: 'flash', x: cp.atpSite[0], y: cp.atpSite[1], r: 50, color: '#ffd34d', duration: 0.6, at: t0 + 1.25 });
      out.push(...frames((t) => pill(lerp(cp.atpSite[0], ADP_GONE[0], t), lerp(cp.atpSite[1], ADP_GONE[1], t), 'ADP', '#8a8f98', '#545b68'), t0 + 1.35, 1.0, 8, false).map((it, i, arr) => (i === arr.length - 1 ? (last ? { ...it, until: undefined } : { ...it, until: D - 2.35 }) : it)));
      out.push(...frames((t) => pDot(lerp(cp.atpSite[0], cp.pSite[0], t), lerp(cp.atpSite[1], cp.pSite[1], t)), t0 + 1.35, 0.9, 8, false).map((it, i, arr) => (i === arr.length - 1 ? (last ? { ...it, until: undefined } : { ...it, until: D - 2.25 }) : it)));
    } else if (k === 5) {
      out.push(...frames((t) => pDot(lerp(cp.pSite[0], PI_GONE[0], t), lerp(cp.pSite[1], PI_GONE[1], t)), t0, 0.8, 8, false).map((it, i, arr) => (i === arr.length - 1 ? (last ? { ...it, until: undefined } : { ...it, until: D - 0.8 }) : it)));
    } else {
      if (a.atp) out.push(hold(svgItem(pill(ATP_WAIT[0], ATP_WAIT[1], 'ATP', '#e0453a', '#8e1d14'))));
      if (a.p) out.push(hold(svgItem(pDot(cp.pSite[0], cp.pSite[1]))));
    }
    // state label and the step list
    out.push(hold(txt(b.c ? 'Open to the OUTSIDE' : 'Open to the INSIDE', C.px, 300, 20, '#2c5a92', { bold: true, align: 'center' }), k === 3 ? 1.1 : k === 5 ? 2.0 : 0));
    out.push({ type: 'value', id: 'cyc', from: k - 1 + 0.02, to: k - 0.02, at: t0, duration: D, linear: true });
    return out;
  };
  const cycleStatic = [
    { ...svgItem(pumpAt(0)), hideDuring: 'cyc' },
    ...NA_WAIT.map(([x, y]) => ({ type: 'ion', ion: 'na', x, y, hideDuring: 'cyc' })),
    ...K_WAIT.map(([x, y]) => ({ type: 'ion', ion: 'k', x, y, hideDuring: 'cyc' })),
    { ...svgItem(pill(ATP_WAIT[0], ATP_WAIT[1], 'ATP', '#e0453a', '#8e1d14')), hideDuring: 'cyc' },
    { ...txt('Open to the INSIDE', C.px, 300, 20, '#2c5a92', { bold: true, align: 'center' }), hideDuring: 'cyc' },
  ];
  const CYC_IDS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'cfull'];
  const cycleItems = [
    title('The pump cycle'),
    cPanel,
    ...cycleStatic.map((it) => ({ ...it, hideDuring: CYC_IDS })),
    txt('Outside the cell', 100, 150, 22, '#2c5a92', { bold: true }),
    txt('Inside the cell', 100, 836, 22, '#6b3c87', { bold: true }),
    { type: 'stepper', id: 'cyc', x: 890, y: 112, w: 650, h: 748, title: 'One turn of the pump', steps: CYCLE, rowH: 56,
      idleText: 'Press ▶ Full cycle, or play one\nstep at a time with the buttons.' },
    txt('One cycle: 3 Na⁺ out, 2 K⁺ in, 1 ATP used', 1215, 820, 22, BLUE, { align: 'center', bold: true }),
  ];
  const cycleActions = [
    { id: 'cfull', label: 'Full cycle', group: 'cy', stay: true, drawn: false, items: [1, 2, 3, 4, 5, 6].flatMap((k) => segment(k, (k - 1) * D, k === 6)) },
    ...[1, 2, 3, 4, 5, 6].map((k) => ({ id: `c${k}`, label: `Step ${k}`, group: 'cy', stay: true, drawn: false, items: segment(k, 0, true) })),
  ];

  // ====================================================================== slide 5: 3 out, 2 in -> electrogenic
  const E = { px: 260, top: 400, bot: 500 };
  const ePanel = svgItem(cellPanel(70, 520, 120, E.top, E.bot, 860, [[E.px - 140, E.px + 140]])
    + `<g transform="translate(${E.px} ${(E.top + E.bot) / 2}) scale(0.7) translate(${-E.px} ${-(E.top + E.bot) / 2})">${pumpSvg(E.px, E.top, E.bot, 0)}</g>`);
  const TAL = { x: 550, y: 120, w: 610 };
  const tallyBox = (cyc) => {
    const cols = [['Na⁺ pumped out', `+${3 * cyc}`, NA_C], ['K⁺ pumped in', `+${2 * cyc}`, K_C], ['Net charge out', `+${cyc}`, RED]];
    return cols.map(([h, v, c], i) => {
      const x = TAL.x + 20 + i * 200;
      return `<rect x="${x}" y="${TAL.y + 70}" width="180" height="150" rx="14" fill="#ffffff" stroke="${c}" stroke-width="3"/>
        <text x="${x + 90}" y="${TAL.y + 108}" font-family="Lexend, Arial, sans-serif" font-weight="600" font-size="19" text-anchor="middle" fill="${c}">${h}</text>
        <text x="${x + 90}" y="${TAL.y + 182}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="54" text-anchor="middle" fill="${c}">${v}</text>`;
    }).join('') + `<text x="${TAL.x + TAL.w / 2}" y="${TAL.y + 40}" font-family="Lexend, Arial, sans-serif" font-weight="600" font-size="26" text-anchor="middle" fill="#1f2430">After ${cyc} cycle${cyc === 1 ? '' : 's'}</text>`;
  };
  const E_CYC = 2.4;
  const eCycles = (n) => [...Array(n)].flatMap((_, j) => {
    const t = 0.3 + j * E_CYC;
    return [
      ...[0, 1, 2].map((i) => ({ type: 'ion', ion: 'na', path: [[E.px - 20 + i * 20, E.bot + 90], [E.px, (E.top + E.bot) / 2], [E.px - 70 + i * 50, E.top - 120 - (j % 2) * 40]], duration: 1.2, at: t + i * 0.12, until: n - 1 === j ? undefined : E_CYC })),
      ...[0, 1].map((i) => ({ type: 'ion', ion: 'k', path: [[E.px - 10 + i * 20, E.top - 90], [E.px, (E.top + E.bot) / 2], [E.px - 50 + i * 100, E.bot + 120 + (j % 2) * 40]], duration: 1.2, at: t + 1.0 + i * 0.12, until: n - 1 === j ? undefined : E_CYC - 1.0 })),
      { ...svgItem(tallyBox(j + 1)), at: t + 2.2, duration: 0.01, ...(j < n - 1 ? { until: E_CYC } : {}) },
      { type: 'value', id: 'vm5', from: -70 - j, to: -71 - j, at: t + 0.5, duration: 1.6 },
    ];
  });
  const elecItems = [
    title('3 out, 2 in: why it matters'),
    ePanel,
    txt('Outside', 100, 150, 22, '#2c5a92', { bold: true }), txt('Inside', 100, 836, 22, '#6b3c87', { bold: true }),
    ...label('3 Na⁺ out', 400, 230, [380, 246], [E.px + 10, E.top - 30], 'center', 22, NA_C),
    ...label('2 K⁺ in', 150, 700, [170, 684], [E.px - 10, E.bot + 30], 'center', 22, K_C),
    { ...svgItem(tallyBox(0)), hideDuring: 'e3' },
    { type: 'rect', x: TAL.x, y: TAL.y, w: TAL.w, h: 740, color: '#d9dce3', fill: '#ffffff', fillOpacity: 0, width: 2, rough: false },
    txt('Each cycle moves one more + charge\nout than in, so the pump is', TAL.x + TAL.w / 2, 430, 23, 'ink', { align: 'center' }),
    txt('ELECTROGENIC', TAL.x + TAL.w / 2, 500, 36, RED, { align: 'center', bold: true }),
    txt('It makes the inside a few mV\nmore negative by itself.', TAL.x + TAL.w / 2, 570, 23, 'ink', { align: 'center' }),
    { type: 'line', from: [TAL.x + 40, 635], to: [TAL.x + TAL.w - 40, 635], color: '#e3e6ec', width: 2, rough: false },
    txt('Its BIGGER job: keeping the Na⁺ and K⁺\ngradients that leak channels use to set\nthe −70 mV resting potential.', TAL.x + TAL.w / 2, 730, 23, BLUE, { align: 'center', bold: true }),
    { type: 'meter', id: 'vm5', value: -70, x: 1190, y: 112, w: 370, h: 748, graphH: 220, min: -90, max: -40, title: 'Membrane potential' },
  ];
  const elecActions = [{ id: 'e3', label: 'Run 3 cycles', stay: true, drawn: false, items: eCycles(3) }];

  // ====================================================================== slide 6: when the pump stops
  const S = { top: 420, bot: 520, x1: 760, px: 370 };
  const SLEAKS = [{ x: 150, ion: 'na' }, { x: 690, ion: 'k' }];
  const sArt = svgItem(cellPanel(70, S.x1, 120, S.top, S.bot, 860, [...SLEAKS.map((c) => [c.x - 46, c.x + 46]), [S.px - 100, S.px + 100]])
    + `<g transform="translate(${S.px} ${(S.top + S.bot) / 2}) scale(0.62) translate(${-S.px} ${-(S.top + S.bot) / 2})">${pumpSvg(S.px, S.top, S.bot, 0)}</g>`);
  const sChannels = SLEAKS.map((c) => ({ type: 'channel', x: c.x, y: (S.top + S.bot) / 2, h: 120, plain: true, open: 1,
    fill: c.ion === 'na' ? '#f8cf8f' : '#cdbdf3', edge: c.ion === 'na' ? '#a8640a' : '#47309a', label: c.ion === 'na' ? 'Na⁺\nleak' : 'K⁺\nleak' }));
  const sLeakLoops = SLEAKS.flatMap((c, j) => [0, 1].map((i) => (c.ion === 'na'
    ? { type: 'ion', ion: 'na', loop: 2.2, phase: j * 0.4 + i * 1.1, path: [[c.x - 30 + i * 60, S.top - 90], [c.x, (S.top + S.bot) / 2], [c.x - 40 + i * 80, S.bot + 100]] }
    : { type: 'ion', ion: 'k', loop: 2.2, phase: j * 0.4 + i * 1.1, path: [[c.x - 30 + i * 60, S.bot + 100], [c.x, (S.top + S.bot) / 2], [c.x - 40 + i * 80, S.top - 90]] })));
  const SB = { x: 790, y: 112, w: 380, h: 470 };
  const cellSize = (r) => `<rect x="790" y="600" width="380" height="260" rx="18" fill="#ffffff" stroke="#d9dce3" stroke-width="2"/>
    <text x="980" y="636" font-family="Lexend, Arial, sans-serif" font-weight="600" font-size="22" text-anchor="middle" fill="#1f2430">Cell size</text>
    <circle cx="980" cy="745" r="${f1(r)}" fill="#efe6f8" stroke="#6b3c87" stroke-width="4"/>
    <circle cx="980" cy="745" r="50" fill="none" stroke="#8a8f98" stroke-width="2" stroke-dasharray="6 5"/>`;
  const stopItems = [
    title('What if the pump stops?'),
    sArt, ...sChannels,
    ...sLeakLoops.map((it) => ({ ...it, hideDuring: 'block' })),
    ...pumpLoops([S.px], S.top, S.bot).map((it) => ({ ...it, hideDuring: 'block' })),
    ...label('Na⁺/K⁺ pump', S.px, 300, [S.px, 316], [S.px, S.top - 40], 'center', 22),
    txt('Outside', 100, 150, 22, '#2c5a92', { bold: true }), txt('Inside', 100, 836, 22, '#6b3c87', { bold: true }),
    { ...svgItem(bars(SB.x, SB.y, SB.w, SB.h, NORMAL, { title: 'Gradients (mM)' })), hideDuring: 'block' },
    { ...svgItem(cellSize(50)), hideDuring: 'block' },
    { type: 'meter', id: 'vm6', value: -70, x: 1190, y: 112, w: 370, h: 748, graphH: 220, min: -90, max: 10, title: 'Membrane potential' },
    txt('Digoxin, a heart drug, partly blocks this pump:\nheart muscle cells then contract more strongly.', 415, 790, 19, '#5b6270', { align: 'center' }),
  ];
  const BLOCK_T = 9;
  const stopActions = [{
    id: 'block', label: 'Block the pump (no ATP)', stay: true, drawn: false,
    items: [
      ...sLeakLoops,
      txt('✕', S.px, (S.top + S.bot) / 2 + 2, 120, RED, { align: 'center', bold: true, anim: 'pop', duration: 0.3 }),
      txt('Pump stopped', S.px, 250, 24, RED, { align: 'center', bold: true, at: 0.3, anim: 'fade', duration: 0.3 }),
      ...frames((t) => bars(SB.x, SB.y, SB.w, SB.h, mixV(NORMAL, { naOut: 80, naIn: 78, kOut: 72, kIn: 74 }, t), { title: 'Gradients (mM)' }), 0.5, BLOCK_T, 14),
      ...frames((t) => cellSize(50 + 30 * t), 0.5, BLOCK_T, 14),
      { type: 'mover', once: true, vanish: true, char: '💧', size: 30, path: [[870, 690], [935, 735]], duration: 1.4, at: 2 },
      { type: 'mover', once: true, vanish: true, char: '💧', size: 30, path: [[1090, 690], [1025, 735]], duration: 1.4, at: 4.5 },
      { type: 'mover', once: true, vanish: true, char: '💧', size: 30, path: [[980, 840], [980, 790]], duration: 1.4, at: 7 },
      { type: 'value', id: 'vm6', from: -70, to: -20, at: 0.5, duration: BLOCK_T },
      txt('Gradients run down → resting potential is lost\n→ water follows Na⁺ in and the cell swells', 415, 680, 21, RED, { align: 'center', bold: true, at: BLOCK_T - 1, anim: 'fade', duration: 0.4 }),
    ],
  }];

  // ====================================================================== slide 7: review
  const RV = { x: [60, 432, 804, 1176], y: 140, w: 352, h: 660 };
  const RCARDS = [
    { h: 'What it moves', c: NA_C, b: '3 Na⁺ OUT\n2 K⁺ IN\nevery cycle', icon: (x) => `<circle cx="${x - 60}" cy="250" r="18" fill="#f0a12e" stroke="#a8640a" stroke-width="2.5"/><circle cx="${x - 20}" cy="250" r="18" fill="#f0a12e" stroke="#a8640a" stroke-width="2.5"/><circle cx="${x + 20}" cy="250" r="18" fill="#f0a12e" stroke="#a8640a" stroke-width="2.5"/><path d="M${x + 60} 290 v-80" stroke="#a8640a" stroke-width="6"/><polygon points="${x + 48},214 ${x + 72},214 ${x + 60},196" fill="#a8640a"/><circle cx="${x - 40}" cy="320" r="18" fill="#7b5cd6" stroke="#47309a" stroke-width="2.5"/><circle cx="${x}" cy="320" r="18" fill="#7b5cd6" stroke="#47309a" stroke-width="2.5"/><path d="M${x + 60} 290 v70" stroke="#47309a" stroke-width="6"/><polygon points="${x + 48},356 ${x + 72},356 ${x + 60},374" fill="#47309a"/>` },
    { h: 'What powers it', c: '#c0392b', b: '1 ATP every cycle.\nActive transport: it pushes\nions against their gradients.', icon: (x) => `<g transform="translate(${x} 285) scale(1.6)">${pill(0, 0, 'ATP', '#e0453a', '#8e1d14')}</g>` },
    { h: 'Why it matters', c: BLUE, b: 'Keeps the Na⁺ / K⁺ gradients\nthat set the resting potential\n(−70 mV) and keep the\ncell from swelling.', icon: (x) => `<rect x="${x - 90}" y="${330 - 120}" width="34" height="120" rx="5" fill="#f0a12e"/><rect x="${x - 50}" y="${330 - 14}" width="34" height="14" rx="5" fill="#f6c47a"/><rect x="${x + 16}" y="${330 - 8}" width="34" height="8" rx="5" fill="#a995e6"/><rect x="${x + 56}" y="${330 - 116}" width="34" height="116" rx="5" fill="#7b5cd6"/><line x1="${x - 110}" y1="330" x2="${x + 110}" y2="330" stroke="#8a8f98" stroke-width="2"/>` },
    { h: 'If it stops', c: RED, b: 'The gradients run down,\nthe resting potential is lost\nand the cell swells.', icon: (x) => `<g transform="translate(${x} 280) scale(0.42) translate(${-x} -440)">${pumpSvg(x, 390, 500, 0)}</g><text x="${x}" y="318" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="110" text-anchor="middle" fill="${RED}">✕</text>` },
  ];
  const reviewItems = [
    title('The sodium–potassium pump'),
    ...RCARDS.flatMap((cd, i) => {
      const x = RV.x[i], cx = x + RV.w / 2;
      return [
        { type: 'rect', x, y: RV.y, w: RV.w, h: RV.h, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
        svgItem(`<circle cx="${x + 40}" cy="${RV.y + 40}" r="20" fill="${cd.c}"/><text x="${x + 40}" y="${RV.y + 48}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="22" text-anchor="middle" fill="#ffffff">${i + 1}</text>${cd.icon(cx)}`),
        txt(cd.h, x + 74, RV.y + 40, 27, cd.c, { bold: true }),
        txt(cd.b, cx, 520, 23, 'ink', { align: 'center', bold: true }),
      ];
    }),
    txt('The pump spends ATP to keep the cell’s “battery” charged.', 800, 846, 27, 'ink', { align: 'center', bold: true }),
  ];

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'na-k-pump',
    title: '🔋 Sodium–potassium pump',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: the hook.
      {
        say: 'Every cell runs a pump that pushes sodium out and potassium in, nonstop.',
        script: `Every one of your cells is running a tiny pump, nonstop. [point to the pumps]

It pushes sodium out and pulls potassium in, against the flow. [click "Pumps at work"]

It's so busy it uses about a third of your body's energy at rest. [point to the stat]

So what is it, how does it work, and what happens if it stops? Let's find out.`,
        actions: hookActions,
        items: hookItems,
      },
      // Slide 2: the problem it solves (leaks run the gradients down).
      { say: 'Na⁺ and K⁺ keep leaking across the membrane, so their gradients would run down without a pump.', clear: true, actions: leakActions, items: leakItems },
      // Slide 3: the pump itself.
      { say: 'The Na⁺/K⁺ pump is an ATP-powered protein that moves ions against their gradients.', clear: true, actions: meetActions, items: meetItems },
      // Slide 4: the cycle, step by step.
      { say: 'Each cycle: 3 Na⁺ bind, ATP phosphorylates the pump, it flips and releases them outside, 2 K⁺ bind, the phosphate leaves and K⁺ is released inside.', clear: true, actions: cycleActions, items: cycleItems },
      // Slide 5: 3 out, 2 in (electrogenic).
      { say: 'Moving 3 positive charges out for every 2 in makes the pump electrogenic.', clear: true, actions: elecActions, items: elecItems },
      // Slide 6: when the pump stops.
      { say: 'If the pump stops, the gradients run down, the resting potential is lost and the cell swells.', clear: true, actions: stopActions, items: stopItems },
      // Slide 7: review.
      { say: 'Review: 3 Na⁺ out, 2 K⁺ in, 1 ATP per cycle, keeping the gradients the cell depends on.', clear: true, items: reviewItems },
    ],
  });
})();
