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
    ...svgItem(f(ease(k / n))), at: t0 + (dur * k) / n, duration: 0.01, ...(k < n || !last ? { until: dur / n + 0.004 } : {}),
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
    for (let i = 0, tries = 0; out.length < n && tries < 2000; i++, tries++) {
      const r1 = Math.abs(Math.sin(seed + i * 12.9898) * 43758.5453) % 1, r2 = Math.abs(Math.sin(seed + i * 78.233) * 12345.678) % 1;
      const x = Math.round(x0 + r1 * (x1 - x0)), y = Math.round(y0 + r2 * (y1 - y0));
      if (avoid.some(([a, b, c, d]) => x > a - 22 && x < c + 22 && y > b - 22 && y < d + 22)) continue;
      if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < (scatter.gap || 44))) continue;
      placed.push([x, y]);
      out.push({ type: 'ion', ion, x, y });
    }
    // not enough room: fill the rest with a looser spacing (never fail)
    for (let i = 0; out.length < n && i < 4000; i++) {
      const r1 = Math.abs(Math.sin(seed + 7 + i * 12.9898) * 43758.5453) % 1, r2 = Math.abs(Math.sin(seed + 7 + i * 78.233) * 12345.678) % 1;
      const x = Math.round(x0 + r1 * (x1 - x0)), y = Math.round(y0 + r2 * (y1 - y0));
      if (i < 3000 && avoid.some(([a, b, c, d]) => x > a - 22 && x < c + 22 && y > b - 22 && y < d + 22)) continue;
      if (i < 2000 && placed.some(([px, py]) => Math.hypot(px - x, py - y) < 30)) continue;
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
    title('The pump that keeps neurons ready to fire'),
    hookArt,
    ...hookIons,
    txt('Outside the neuron', 100, 150, 22, '#2c5a92', { bold: true }),
    txt('Inside the neuron', 100, 836, 22, '#6b3c87', { bold: true }),
    ...label('Na⁺/K⁺ pump', 520, 350, [520, 366], [520, 432], 'center', 24),
    { type: 'rect', x: 1030, y: 120, w: 510, h: 740, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    txt('Your brain is only', 1285, 165, 24, '#3b4252', { align: 'center', bold: true }),
    txt('2%', 1180, 240, 84, BLUE, { align: 'center', bold: true }), txt('20%', 1395, 240, 84, RED, { align: 'center', bold: true }),
    txt('of your\nbody weight', 1180, 320, 21, BLUE, { align: 'center', bold: true }), txt('of your body’s\nenergy', 1395, 320, 21, RED, { align: 'center', bold: true }),
    txt('…and roughly HALF of the\nbrain’s energy goes to\nthis one pump.', 1285, 440, 26, 'ink', { align: 'center', bold: true }),
    { type: 'line', from: [1080, 530], to: [1490, 530], color: '#e3e6ec', width: 2, rough: false },
    txt('Without it, neurons\ncould not fire.', 1285, 590, 26, '#8e1d14', { align: 'center', bold: true }),
    ...(window.WB_LOCATOR ? window.WB_LOCATOR({ x: 1072, y: 668, w: 436, h: 170, spot: [720, 422], title: 'Where we are: a neuron’s membrane' }) : []),
  ];
  const hookActions = [{
    id: 'hrun', label: 'Pumps at work', stay: true, drawn: false,
    items: [...pumpLoops(HPUMPS, H.top, H.bot),
      txt('3 Na⁺ out, 2 K⁺ in, over and over', 535, 695, 22, '#5b6270', { align: 'center', bold: true, at: 0.3, anim: 'fade', duration: 0.4 })],
  }];

  // ====================================================================== slide 2: how the pump works (overview + step by step)
  // --- overview view ---
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
    ...label('Neuron membrane', 790, 250, [790, 266], [790, M3.top + 4], 'center', 21),
    txt('Na⁺/K⁺ pump (Na⁺/K⁺-ATPase)', M3.px, 290, 25, '#2c5a92', { align: 'center', bold: true }),
    txt('Outside the neuron', 100, 150, 22, '#2c5a92', { bold: true }),
    txt('Inside the neuron', 100, 836, 22, '#6b3c87', { bold: true }),
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
    txt('Neurons are packed with these pumps,\nspread over their dendrites,\ncell body and axon.', 1230, 780, 21, '#5b6270', { align: 'center', bold: true }),
  ];
  const meetActions = [
    { id: 'm3in', label: 'Open to the inside', group: 'm3', stay: true, drawn: false, items: [m3View(0), ...m3Labels(0)] },
    { id: 'm3out', label: 'Open to the outside', group: 'm3', stay: true, drawn: false, items: [m3View(1), ...m3Labels(1)] },
  ];

  // --- step-by-step view ---
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
    txt('Outside the neuron', 100, 150, 22, '#2c5a92', { bold: true }),
    txt('Inside the neuron', 100, 836, 22, '#6b3c87', { bold: true }),
    { type: 'stepper', id: 'cyc', x: 890, y: 112, w: 650, h: 748, title: 'One turn of the pump', steps: CYCLE, rowH: 56,
      idleText: 'Click a step to play it, or\nplay the full cycle below.' },
    txt('One cycle: 3 Na⁺ out, 2 K⁺ in, 1 ATP used', 1215, 820, 22, BLUE, { align: 'center', bold: true }),
  ];
  const cycleActions = [
    { id: 'cfull', label: 'Full cycle', group: 'cy', stay: true, drawn: false, items: [1, 2, 3, 4, 5, 6].flatMap((k) => segment(k, (k - 1) * D, k === 6)) },
    ...[1, 2, 3, 4, 5, 6].map((k) => ({ id: `c${k}`, label: `Step ${k}`, group: 'cy', stay: true, drawn: false, items: segment(k, 0, true) })),
  ];


  // --- one slide, two views: Overview (high level) and Step by step (the 6-step cycle) ---
  const ionSvg = (ion, x, y) => {
    const [fill, edge, t] = ion === 'na' ? ['#f0a12e', '#a8640a', 'Na⁺'] : ['#7b5cd6', '#47309a', 'K⁺'];
    return `<circle cx="${f1(x)}" cy="${f1(y)}" r="18" fill="${fill}" stroke="${edge}" stroke-width="2.5"/>
      <text x="${f1(x)}" y="${f1(y + 5)}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="14" text-anchor="middle" fill="#ffffff">${t}</text>`;
  };
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const ph = (u, a, b) => ease(clamp01((u - a) / (b - a)));
  const mixPts = (A, B, t) => A.map((p, i) => [lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)]);
  // the whole cycle in OV_T seconds, without the ATP details: Na⁺ in, flip, Na⁺ out, K⁺ in, flip back, K⁺ released
  const OV_T = 6;
  const ovSvg = (u) => {
    const c = ph(u, 1, 1.8) - ph(u, 3.6, 4.4);
    const na = u < 1.8 ? mixPts(NA_WAIT, cp.sNa, ph(u, 0, 1)) : mixPts(cp.sNa, NA_OUT, ph(u, 1.8, 2.6));
    const k = u < 4.4 ? mixPts(K_WAIT, cp.sK, ph(u, 2.6, 3.6)) : mixPts(cp.sK, K_IN, ph(u, 4.4, 5.4));
    const atp = u < 1 ? pill(cp.atpSite[0], cp.atpSite[1], 'ATP', '#e0453a', '#8e1d14')
      : u < 2.2 ? pill(lerp(cp.atpSite[0], 520, ph(u, 1, 2.2)), lerp(cp.atpSite[1], 790, ph(u, 1, 2.2)), 'ADP', '#8a8f98', '#545b68') : '';
    return pumpAt(c) + atp + na.map(([x, y]) => ionSvg('na', x, y)).join('') + k.map(([x, y]) => ionSvg('k', x, y)).join('');
  };
  const OV_N = 60;
  const ovFrames = [...Array(OV_N + 1)].map((_, i) => ({
    ...svgItem(ovSvg((OV_T * i) / OV_N)), at: 0.3 + (OV_T * i) / OV_N, duration: 0.002, ...(i < OV_N ? { until: OV_T / OV_N + 0.004 } : {}),
  }));
  const PUMP_IDS = ['ov', 'steps', ...CYC_IDS];
  const ovLabels = m3Common.filter((it) => !(it.type === 'text' && /neuron$/.test(it.text)));
  const ovPanel = meetItems.slice(meetItems.indexOf(m3Common[m3Common.length - 1]) + 1);
  const stepPanel = [
    { type: 'stepper', id: 'cyc', x: 900, y: 112, w: 640, h: 748, title: 'One turn of the pump', steps: CYCLE, rowH: 56,
      idleText: 'Click a step to play it, or\nplay the full cycle below.' },
    txt('One cycle: 3 Na⁺ out, 2 K⁺ in, 1 ATP used', 1220, 820, 22, BLUE, { align: 'center', bold: true }),
  ];
  const stepStart = cycleStatic.map(({ hideDuring, ...it }) => it);
  // clickable tabs on the slide: Overview / Step by step (active one filled)
  const TABS = [['Overview', 'ov', 590], ['Step by step', 'steps', 730]];
  const tabs = (active) => TABS.flatMap(([t, id, x]) => [
    { type: 'rect', x, y: 132, w: 132, h: 40, color: '#2c5a92', fill: id === active ? '#2c5a92' : '#ffffff', fillOpacity: 1, width: 2.5, rough: false },
    txt(t, x + 66, 152, 19, id === active ? '#ffffff' : '#2c5a92', { align: 'center', bold: true }),
  ]);
  const tabHotspots = TABS.map(([, id, x]) => ({ type: 'hotspot', x, y: 132, w: 132, h: 40, action: id }));
  // in the step view: click a step in the list to play it, or the button for the whole cycle
  const stepHotspots = [
    ...CYCLE.map((_, i) => ({ type: 'hotspot', x: 914, y: 112 + 92 + i * 56 - 24, w: 612, h: 48, action: `c${i + 1}` })),
    { type: 'rect', x: 1090, y: 708, w: 260, h: 48, color: BLUE, fill: '#eef3ff', fillOpacity: 1, width: 2.5, rough: false },
    txt('▶ Play full cycle', 1220, 732, 22, BLUE, { align: 'center', bold: true }),
    { type: 'hotspot', x: 1090, y: 708, w: 260, h: 48, action: 'cfull' },
  ];
  const pumpItems = [
    title('How the pump works'),
    m3Panel,
    txt('Outside the neuron', 100, 150, 22, '#2c5a92', { bold: true }),
    txt('Inside the neuron', 100, 836, 22, '#6b3c87', { bold: true }),
    ...[m3View(0), ...m3Labels(0), ...ovLabels, ...ovPanel, ...tabs('ov')].map((it) => ({ ...it, hideDuring: PUMP_IDS })),
    ...tabHotspots,
  ];
  const pumpActions = [
    { id: 'ov', label: 'Overview', group: 'pm', stay: true, drawn: false, items: [...ovLabels, ...ovPanel, ...ovFrames, ...tabs('ov')] },
    { id: 'steps', label: 'Step by step', group: 'pm', stay: true, drawn: false, items: [...stepStart, ...stepPanel, ...stepHotspots, ...tabs('steps')] },
    { id: 'cfull', label: 'Full cycle', group: 'pm', stay: true, drawn: false, items: [...stepPanel, ...stepHotspots, ...tabs('steps'), ...[1, 2, 3, 4, 5, 6].flatMap((k) => segment(k, (k - 1) * D, k === 6))] },
    ...[1, 2, 3, 4, 5, 6].map((k) => ({ id: `c${k}`, label: `Step ${k}`, group: 'pm', stay: true, drawn: false, items: [...stepPanel, ...stepHotspots, ...tabs('steps'), ...segment(k, 0, true)] })),
  ];

  // ====================================================================== shared: ions redistributed by the pump
  // Before: Na⁺ and K⁺ spread evenly on both sides (no gradients). The pump carries some Na⁺ out and
  // some K⁺ in (through itself), ending with Na⁺ high outside and K⁺ high inside.
  // g = { x0, x1, top, bot, y0, y1, px } (panel, membrane, pump x). Returns { before, after, moving(t0, dur) }.
  const gradIons = (g, seed, avoid = []) => {
    placed.length = 0;
    const up = [g.x0 + 40, g.x1 - 40, g.y0 + 60, g.top - 50], dn = [g.x0 + 40, g.x1 - 40, g.bot + 50, g.dnBot || g.y1 - 60];
    const keep = {
      naOut: scatter('na', 7, ...up, seed + 1, avoid), kOut: scatter('k', 2, ...up, seed + 2, avoid),
      naIn: scatter('na', 2, ...dn, seed + 3, avoid), kIn: scatter('k', 7, ...dn, seed + 4, avoid),
    };
    const movers = { na: scatter('na', 6, ...dn, seed + 5, avoid), k: scatter('k', 6, ...up, seed + 6, avoid) };
    const ends = { na: scatter('na', 6, ...up, seed + 7, avoid), k: scatter('k', 6, ...dn, seed + 8, avoid) };
    const mid = (g.top + g.bot) / 2;
    return {
      before: [...keep.naOut, ...keep.kOut, ...keep.naIn, ...keep.kIn, ...movers.na, ...movers.k],
      after: [...keep.naOut, ...keep.kOut, ...keep.naIn, ...keep.kIn, ...ends.na, ...ends.k],
      moving: (t0, dur) => [...keep.naOut, ...keep.kOut, ...keep.naIn, ...keep.kIn,
        ...movers.na.map((m, i) => ({ type: 'ion', ion: 'na', path: [[m.x, m.y], [g.px, g.bot + 40], [g.px, mid], [g.px, g.top - 40], [ends.na[i].x, ends.na[i].y]], smooth: true, duration: 1.6, at: t0 + (i * (dur - 1.6)) / 5 })),
        ...movers.k.map((m, i) => ({ type: 'ion', ion: 'k', path: [[m.x, m.y], [g.px, g.top - 40], [g.px, mid], [g.px, g.bot + 40], [ends.k[i].x, ends.k[i].y]], smooth: true, duration: 1.6, at: t0 + 0.6 + (i * (dur - 1.6)) / 5 }))],
    };
  };
  const pumpSmall = (px, top, bot) => `<g transform="translate(${px} ${(top + bot) / 2}) scale(0.62) translate(${-px} ${-(top + bot) / 2})">${pumpSvg(px, top, bot, 0)}</g>`;
  const EVEN = { naOut: 78, naIn: 78, kOut: 72, kIn: 72 };

  // ====================================================================== slide 3: the pump's real job, building the gradients
  const G3 = { x0: 70, x1: 900, y0: 120, y1: 860, top: 440, bot: 540, px: 485 };
  const g3 = gradIons(G3, 31, [[90, 130, 360, 170], [90, 815, 330, 850], [G3.px - 100, 300, G3.px + 200, 640], [150, 740, 820, 820]]);
  const B3 = { x: 930, y: 112, w: 610, h: 560 };
  const gradNote = (x, y, w, h, on) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${on ? '#eef3ff' : '#ffffff'}" stroke="${on ? BLUE : '#d9dce3'}" stroke-width="${on ? 3 : 2}"/>`;
  const slide3Static = [
    svgItem(cellPanel(G3.x0, G3.x1, G3.y0, G3.top, G3.bot, G3.y1, [[G3.px - 100, G3.px + 100]]) + pumpSmall(G3.px, G3.top, G3.bot)),
    ...label('Na⁺/K⁺ pump', G3.px, 330, [G3.px, 346], [G3.px, G3.top - 40], 'center', 22),
    txt('Outside the neuron', 100, 150, 22, '#2c5a92', { bold: true }), txt('Inside the neuron', 100, 836, 22, '#6b3c87', { bold: true }),
  ];
  const slide3Items = [
    title('Why the pump matters: it builds the gradients'),
    ...slide3Static,
    ...g3.before.map((it) => ({ ...it, hideDuring: 'g3' })),
    { ...svgItem(bars(B3.x, B3.y, B3.w, B3.h, EVEN, { title: 'Concentration (mM)' })), hideDuring: 'g3' },
    { ...svgItem(gradNote(930, 690, 610, 170, false)), hideDuring: 'g3' },
    { ...txt('Without the pump, Na⁺ and K⁺ would\nend up evenly spread: no gradients.', 1235, 760, 23, '#5b6270', { align: 'center', bold: true }), hideDuring: 'g3' },
  ];
  const slide3Actions = [{
    id: 'g3', label: 'Run the pump', stay: true, drawn: false,
    items: [
      ...g3.moving(0.3, 7),
      ...pumpLoops([G3.px], G3.top, G3.bot).map((it) => ({ ...it, until: 7.6 })),
      ...frames((t) => bars(B3.x, B3.y, B3.w, B3.h, mixV(EVEN, NORMAL, t), { title: 'Concentration (mM)' }), 0.3, 7, 14),
      { ...svgItem(gradNote(930, 690, 610, 170, true)), at: 7.4, duration: 0.3 },
      txt('Na⁺ gradient: ~12× more OUTSIDE\nK⁺ gradient: ~28× more INSIDE', 1235, 735, 25, BLUE, { align: 'center', bold: true, at: 7.4, anim: 'fade', duration: 0.4 }),
      txt('This is the pump’s main job: building and\nkeeping up these gradients (stored energy).', 1235, 815, 19, '#3b4252', { align: 'center', bold: true, at: 7.8, anim: 'fade', duration: 0.4 }),
    ],
  }];

  // ====================================================================== slide 4: from gradients to −70 mV
  // Stage 1: pump only -> gradients, but the membrane potential barely moves (about −5 mV, electrogenic).
  // Stage 2: + K⁺ leak channels -> K⁺ flows out, inside becomes very negative (about −85 mV, near E_K = −90).
  // Stage 3: + Na⁺ leak channels -> a little Na⁺ leaks in and pulls it up to the real resting potential, −70 mV.
  const G4 = { x0: 70, x1: 760, y0: 120, y1: 860, top: 440, bot: 540, px: 200, kxs: [400, 530], nax: 675, dnBot: 700 };
  scatter.gap = 40;
  const g4 = gradIons(G4, 57, [[90, 130, 360, 170], [90, 815, 330, 850], [G4.px - 120, 290, G4.px + 100, 360], [G4.px - 120, 360, G4.px + 30, 560], [G4.px - 80, 540, G4.px + 180, 640],
    ...G4.kxs.map((x) => [x - 60, 380, x + 60, 630]), [G4.nax - 60, 380, G4.nax + 60, 630]]);
  const STAGES = [
    { title: '1. Pump only', text: 'The pump builds the gradients.\nIts 3-out, 2-in moves a little\ncharge: only about −5 mV.', color: '#2c5a92', v: -5 },
    { title: '2. Add K⁺ leak channels', text: 'K⁺ flows OUT down its\ngradient, carrying + charge\naway: about −85 mV.', color: K_C, v: -85 },
    { title: '3. Add Na⁺ leak channels', text: 'There are fewer Na⁺ leak\nchannels, so only a little Na⁺\nleaks IN. It settles at the true\nresting potential: −70 mV.', color: NA_C, v: -70 },
  ].map((s, i) => ({ ...s, from: i, to: i + 1 }));
  // more K⁺ leak channels than Na⁺ ones: that is why rest (−70) sits close to E K⁺ (−90)
  const kLeaks = G4.kxs.map((x) => ({ type: 'channel', x, y: (G4.top + G4.bot) / 2, h: 120, plain: true, open: 1, fill: '#cdbdf3', edge: '#47309a', label: '' }));
  const naLeak = { type: 'channel', x: G4.nax, y: (G4.top + G4.bot) / 2, h: 120, plain: true, open: 1, fill: '#f8cf8f', edge: '#a8640a', label: '' };
  const tag = (t, x, c, w = 124) => [{ type: 'rect', x: x - w / 2, y: 600, w, h: 30, color: c, fill: '#ffffff', fillOpacity: 1, width: 2, rough: false }, txt(t, x, 615, 17, c, { align: 'center', bold: true })];
  const kLabel = tag('2 × K⁺ leak channels', (G4.kxs[0] + G4.kxs[1]) / 2, K_C, 230);
  const naLabel = tag('Na⁺ leak', G4.nax, NA_C);
  const kLeakLoops = G4.kxs.flatMap((kx, j) => [0, 1].map((i) => ({ type: 'ion', ion: 'k', loop: 1.8, phase: j * 0.45 + i * 0.9, path: [[kx - 30 + i * 60, G4.bot + 110], [kx, (G4.top + G4.bot) / 2], [kx - 40 + i * 80, G4.top - 110]] })));
  const naLeakLoops = [{ type: 'ion', ion: 'na', loop: 3.2, phase: 0, path: [[G4.nax, G4.top - 110], [G4.nax, (G4.top + G4.bot) / 2], [G4.nax + 10, G4.bot + 110]] }];
  const vm4 = (from, to, at, duration) => ({ type: 'value', id: 'vm4', from, to, at, duration });
  const stage = (n) => ({ type: 'value', id: 'st4', from: n + 0.5, to: n + 0.5, at: 0, duration: 0.01 });
  const capBox4 = (text, color, at = 0.4) => [
    { type: 'rect', x: 90, y: 712, w: 650, h: 86, color, fill: '#ffffff', fillOpacity: 0.95, width: 2.5, rough: false, at },
    txt(text, 415, 737, 21, color, { align: 'center', bold: true, at, anim: 'fade', duration: 0.4 }),
  ];
  const slide4Items = [
    title('How the gradients set −70 mV'),
    svgItem(cellPanel(G4.x0, G4.x1, G4.y0, G4.top, G4.bot, G4.y1, [[G4.px - 100, G4.px + 100], ...G4.kxs.map((x) => [x - 46, x + 46]), [G4.nax - 46, G4.nax + 46]]) + pumpSmall(G4.px, G4.top, G4.bot)),
    ...label('Na⁺/K⁺ pump', G4.px, 330, [G4.px, 346], [G4.px, G4.top - 40], 'center', 22),
    txt('Outside the neuron', 100, 150, 22, '#2c5a92', { bold: true }), txt('Inside the neuron', 100, 836, 22, '#6b3c87', { bold: true }),
    ...g4.before.map((it) => ({ ...it, hideDuring: ['s1', 's2', 's3'] })),
    // plain membrane where the channels will go, until they are added
    ...G4.kxs.map((x) => ({ ...svgItem(bilayer(x - 46, x + 46, G4.top, G4.bot)), hideDuring: ['s2', 's3'] })),
    { ...svgItem(bilayer(G4.nax - 46, G4.nax + 46, G4.top, G4.bot)), hideDuring: 's3' },
    { type: 'stepper', id: 'st4', x: 790, y: 112, w: 380, h: 748, title: 'Build it up', steps: STAGES, rowH: 60,
      idleText: 'No pump running yet: no\ngradients, so 0 mV.\n\nClick each step to add it.' },
    ...STAGES.map((_, i) => ({ type: 'hotspot', x: 804, y: 112 + 92 + i * 60 - 26, w: 352, h: 52, action: `s${i + 1}` })),
    { type: 'meter', id: 'vm4', value: 0, x: 1190, y: 112, w: 370, h: 748, graphH: 250, min: -100, max: 20, title: 'Membrane potential',
      downText: 'Inside is negative', restText: 'No charge difference',
      marks: [{ v: -90, label: 'E K⁺ (−90)', color: K_C, dy: 16 }] },
    txt('Equilibrium potentials', 1375, 606, 21, '#1f2430', { align: 'center', bold: true }),
    { type: 'ion', ion: 'na', x: 1226, y: 648, r: 15 }, txt('Sodium (Na⁺)', 1252, 648, 21, '#c46f00', { bold: true }), txt('+60 mV', 1536, 648, 22, '#c46f00', { align: 'right', bold: true }),
    { type: 'ion', ion: 'k', x: 1226, y: 690, r: 15 }, txt('Potassium (K⁺)', 1252, 690, 21, K_C, { bold: true }), txt('−90 mV', 1536, 690, 22, K_C, { align: 'right', bold: true }),
    { type: 'line', from: [1214, 726], to: [1536, 726], color: '#e3e6ec', width: 2, rough: false },
    txt('Resting potential (−70 mV) is much\ncloser to E K⁺ because there are more\nK⁺ leak channels than Na⁺ ones.', 1375, 790, 17, '#5b6270', { align: 'center', bold: true }),
  ];
  const slide4Actions = [
    { id: 's1', label: '1. Pump only', group: 's4', stay: true, drawn: false, items: [
      stage(0), vm4(0, -5, 1, 6), ...g4.moving(0.3, 7), ...pumpLoops([G4.px], G4.top, G4.bot),
      ...capBox4('The pump builds the gradients… but on its own\nit only moves the potential to about −5 mV.', '#2c5a92', 7.4)] },
    { id: 's2', label: '2. + K⁺ leak channels', group: 's4', stay: true, drawn: false, items: [
      stage(1), vm4(-5, -5, -8, 8.5), vm4(-5, -85, 0.6, 3.5), ...g4.after, ...pumpLoops([G4.px], G4.top, G4.bot), ...kLeakLoops, ...kLeaks, ...kLabel,
      ...capBox4('K⁺ leaks OUT down its gradient, taking + charge\nwith it: the inside drops to about −85 mV.', K_C, 0.6)] },
    { id: 's3', label: '3. + Na⁺ leak channels', group: 's4', stay: true, drawn: false, items: [
      stage(2), vm4(-85, -85, -8, 8.5), vm4(-85, -70, 0.6, 3), ...g4.after, ...pumpLoops([G4.px], G4.top, G4.bot), ...kLeakLoops, ...naLeakLoops, ...kLeaks, ...kLabel, naLeak, ...naLabel,
      ...capBox4('Fewer Na⁺ channels, so only a little Na⁺ leaks IN:\nit settles at −70 mV, close to E K⁺. All working together.', NA_C, 0.6)] },
  ];

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'na-k-pump',
    title: '🔋 Sodium–potassium pump (neurons)',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: the hook.
      {
        say: 'Every neuron runs pumps that push sodium out and potassium in, nonstop, so it stays ready to fire.',
        script: `[QUESTIONS THIS SLIDE ANSWERS]
[• What is the sodium–potassium pump, and why does it matter so much for neurons?]
[• Why does the brain spend so much energy on it?]

Your brain is only about 2% of your body weight, but it uses about 20% of your energy. [point to the stats]

And roughly half of that goes to one tiny machine in every neuron's membrane: the sodium–potassium pump. [point to the pumps]

Nonstop, it pushes sodium out and pulls potassium in. [click "Pumps at work"]

Without it, your neurons couldn't fire. So how does it work, and why do neurons need it so badly? Let's find out.`,
        actions: hookActions,
        items: hookItems,
      },
      // Slide 2: how the pump works. Two views: Overview (high level) and Step by step (the 6-step cycle).
      { script: '[QUESTIONS THIS SLIDE ANSWERS]\n[• What does the pump look like, and what are its parts?]\n[• Which way does it move each ion, and how many?]\n[• Why does it need ATP (what is active transport)?]\n[• How does it actually move the ions, step by step?]\n[• Where does ATP come in, and what does the phosphate do?]\n[• How does it switch between facing inside and outside?]\n\n[Start with ▶ Overview, then switch to ▶ Step by step and ▶ Full cycle (or Step 1–6).]', say: 'The Na⁺/K⁺ pump uses ATP to carry 3 Na⁺ out and 2 K⁺ in, flipping its shape each cycle.', clear: true, actions: pumpActions, items: pumpItems },
      // Slide 3: the pump's real job: building the Na⁺ and K⁺ gradients.
      { script: '[QUESTIONS THIS SLIDE ANSWERS]\n[• What is the pump actually for?]\n[• What would happen to Na⁺ and K⁺ without it?]\n[• What are the Na⁺ and K⁺ concentration gradients, and which way do they point?]', say: 'The pump’s main job is to build and maintain the Na⁺ and K⁺ concentration gradients.', clear: true, actions: slide3Actions, items: slide3Items },
      // Slide 4: the gradients set −70 mV indirectly, through leak channels.
      { script: '[QUESTIONS THIS SLIDE ANSWERS]\n[• Does the pump itself make the membrane potential −70 mV? (No: only about −5 mV.)]\n[• How do K⁺ leak channels use the K⁺ gradient to make the inside negative?]\n[• Why does adding Na⁺ leak channels bring it to −70 mV?]\n[• So how does the pump set the resting potential? (Indirectly, by keeping the gradients.)]', say: 'On its own the pump barely changes the membrane potential; the gradients it keeps let K⁺ and Na⁺ leak channels set −70 mV.', clear: true, actions: slide4Actions, items: slide4Items },
    ],
  });
})();
