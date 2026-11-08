// Explainer: EPSPs and IPSPs. Built slide by slide with the user.
// The user does the drawing; these visuals simply appear (drawn: false).
// Board is 1600 x 900. See CLAUDE.md for every item type.
(() => {
  const svgDoc = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">${inner}</svg>`;
  const title = (text) => ({ type: 'text', x: 800, y: 66, text, size: 56, font: 'sans', bold: true, align: 'center', color: 'ink' });

  const REST = -70;
  const PEAK = { glu: -60, gaba: -80 }; // EPSP is 10 mV up, IPSP 10 mV down
  const ION_TEXT = { na: '#c46f00', cl: '#1d6a3c' };
  const CH_STYLE = {
    na: { fill: '#f8cf8f', edge: '#a8640a' },
    cl: { fill: '#a6dfbc', edge: '#1d6a3c' },
  };

  // ---------- slide 1: the two inputs onto one dendrite ----------
  // Glutamate terminal (excitatory) on the left, GABA terminal (inhibitory) on the
  // right, both above the same dendrite. Outside is above the membrane, inside below.
  const M = { x0: 60, x1: 1160, top: 410, bot: 500, mid: 455 };
  const SYN = {
    glu: { x: 340, nt: '#f08c1a', name: 'Excitatory terminal (glutamate)', nameColor: '#b05f00', ch: 'na', receptor: 'Glutamate receptor', lets: 'lets Na⁺ in' },
    gaba: { x: 880, nt: '#16a3b8', name: 'Inhibitory terminal (GABA)', nameColor: '#0b6f7e', ch: 'cl', receptor: 'GABA receptor', lets: 'lets Cl⁻ in' },
  };
  const bulbD = (cx) => `M${cx - 180} 262 C${cx - 180} 172 ${cx - 92} 142 ${cx} 142 C${cx + 92} 142 ${cx + 180} 172 ${cx + 180} 262 Q${cx + 180} 300 ${cx + 140} 302 L${cx - 140} 302 Q${cx - 180} 300 ${cx - 180} 262 Z`;
  const axons = { glu: 'M-30 250 Q80 246 185 236', gaba: 'M1190 250 Q1120 246 1035 236' }; // axons come in from the sides
  const bilayer = (() => {
    let out = '';
    for (let x = M.x0 + 10; x <= M.x1 - 8; x += 20) {
      for (const [hy, t0, t1] of [[M.top + 8, M.top + 17, M.mid - 3], [M.bot - 8, M.bot - 17, M.mid + 3]]) {
        const d = (t1 - t0) / 2;
        out += `<path d="M${x - 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d} M${x + 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d}" stroke="#c99a62" stroke-width="2" fill="none"/>`;
        out += `<circle cx="${x}" cy="${hy}" r="9" fill="#f4c995" stroke="#b67d3c" stroke-width="2"/>`;
      }
    }
    return out;
  })();
  const sceneSvg = svgDoc(`<defs>
    <linearGradient id="preG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eefb"/><stop offset="1" stop-color="#9cc0ea"/></linearGradient>
    <filter id="shE" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#13294a" flood-opacity="0.2"/></filter>
  </defs>
  <rect x="${M.x0}" y="112" width="${M.x1 - M.x0}" height="${M.top - 112}" rx="16" fill="#eef6fd"/>
  <rect x="${M.x0}" y="${M.bot}" width="${M.x1 - M.x0}" height="${860 - M.bot}" rx="16" fill="#f7f0fb"/>
  <rect x="${M.x0}" y="${M.top}" width="${M.x1 - M.x0}" height="${M.bot - M.top}" fill="#fbecd6"/>
  ${bilayer}
  ${Array.from({ length: 16 }, (_, i) => M.x0 + 35 + i * 70).map((x) =>
    `<text x="${x}" y="${M.top - 7}" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#e0453a" text-anchor="middle">+</text>` +
    `<text x="${x}" y="${M.bot + 25}" font-family="Arial, sans-serif" font-weight="700" font-size="26" fill="#2f6fde" text-anchor="middle">−</text>`).join('')}
  <g filter="url(#shE)">
    ${Object.entries(SYN).map(([k, s]) => `
    <path d="${axons[k]}" stroke="#2c5a92" stroke-width="64" fill="none" stroke-linecap="round"/>
    <path d="${axons[k]}" stroke="#bcd5f2" stroke-width="56" fill="none" stroke-linecap="round"/>
    <path d="${bulbD(s.x)}" fill="url(#preG)" stroke="#2c5a92" stroke-width="5"/>`).join('')}
  </g>
`);

  // Vesicles inside each terminal (relative to its centre). Two of them fuse.
  const VES = [[-110, 222], [-45, 192], [25, 196], [95, 218], [-75, 262], [5, 248], [80, 266], [140, 262]];
  const FUSE = [[4, [-24, 290]], [6, [24, 290]]]; // [vesicle index, fuse point]
  const staticIons = [
    // outside the cell, around and between the terminals (Na⁺ and Cl⁻)
    ['na', 105, 168], ['cl', 100, 335], ['na', 565, 170], ['cl', 650, 225], ['na', 575, 300], ['cl', 655, 372],
    ['na', 470, 362], ['cl', 745, 360], ['na', 1110, 168], ['cl', 1112, 335],
    // inside the dendrite (K⁺ and negative proteins, a little Na⁺ and Cl⁻)
    ['k', 130, 630], ['k', 250, 720], ['a', 120, 760], ['k', 470, 640], ['a', 420, 780], ['k', 560, 730],
    ['k', 690, 640], ['na', 640, 810], ['k', 760, 740], ['a', 990, 660], ['k', 1090, 730], ['cl', 1000, 800], ['k', 860, 805],
  ];
  // Ions each receptor lets through: [ion, from (outside), to (inside)]
  const flows = {
    glu: [['na', [255, 352], [260, 640]], ['na', [425, 350], [400, 700]], ['na', [180, 372], [350, 655]]],
    gaba: [['cl', [795, 352], [800, 650]], ['cl', [965, 350], [960, 700]], ['cl', [1060, 355], [880, 760]]],
  };
  const pore = (x, from, to) => [from, [x, M.top - 40], [x, M.mid], [x, M.bot + 50], to];

  // One terminal releasing, starting at t0: vesicles fuse, neurotransmitter crosses
  // and binds, the receptor channel opens, ions flow in, then it all closes again.
  const release = (k) => {
    const s = SYN[k], x = s.x, site = [x - 28, M.top - 22], t0 = 0;
    return [
      ...FUSE.map(([vi, [fx, fy]], i) => ({
        type: 'vesicle', fuse: true, r: 13, color: '#2c5a92', dot: s.nt,
        path: [[x + VES[vi][0], VES[vi][1]], [x + fx, fy]], duration: 1.2, at: t0 + i * 0.15,
      })),
      // one molecule binds the receptor, the others drift in the cleft
      { type: 'mover', once: true, r: 7, color: s.nt, smooth: true, path: [[x - 24, 304], [x - 30, 345], site], duration: 0.7, at: t0 + 0.8, until: 3.4 },
      { type: 'mover', once: true, vanish: true, r: 7, color: s.nt, smooth: true, path: [site, [x - 70, 360], [x - 120, 330]], duration: 0.8, at: t0 + 4.2 },
      ...[[-60, 340], [40, 330], [70, 365], [-100, 365]].map(([dx, dy], i) => ({
        type: 'mover', once: true, vanish: true, r: 6, color: s.nt, smooth: true,
        path: [[x + (i % 2 ? 24 : -24), 304], [x + dx * 0.6, (304 + dy) / 2 + 8], [x + dx, dy]], duration: 1.6, at: t0 + 0.85 + i * 0.1,
      })),
      { type: 'value', id: `ch-${k}`, from: 0, to: 1, at: t0 + 1.5, duration: 0.35 },
      ...flows[k].map(([ion, from, to], i) => ({ type: 'ion', ion, smooth: true, path: pore(x, from, to), duration: 1.4, at: t0 + 1.7 + i * 0.35 })),
      { type: 'value', id: `ch-${k}`, from: 1, to: 0, at: t0 + 4.1, duration: 0.35 },
      // the membrane potential rises (EPSP) or falls (IPSP) while the ions cross, then recovers
      { type: 'value', id: 'psp', from: REST, to: PEAK[k], at: t0 + 1.9, duration: 1.9 },
      { type: 'value', id: 'psp', from: PEAK[k], to: REST, at: t0 + 4.6, duration: 2.2 },
    ];
  };

  const slide1 = [
    title('EPSPs and IPSPs'),
    { type: 'svg', svg: sceneSvg },
    ...Object.values(SYN).map((s) => ({ type: 'text', x: s.x, y: 124, text: s.name, size: 24, font: 'sans', color: s.nameColor, align: 'center' })),
    // vesicles (the fusing ones hide while their animation plays)
    ...Object.entries(SYN).flatMap(([k, s]) => VES.map(([dx, y], vi) => ({
      type: 'vesicle', x: s.x + dx, y, r: 13, color: '#2c5a92', dot: s.nt,
      hideDuring: FUSE.some(([fi]) => fi === vi) ? k : undefined,
    }))),
    ...staticIons.map(([ion, x, y]) => ({ type: 'ion', ion, x, y })),
    ...Object.entries(flows).flatMap(([k, list]) => list.map(([ion, from]) => ({ type: 'ion', ion, x: from[0], y: from[1], hideDuring: k }))),
    ...Object.entries(SYN).flatMap(([k, s]) => [
      { type: 'channel', id: `ch-${k}`, x: s.x, y: M.mid, h: 130, ...CH_STYLE[s.ch], label: s.receptor },
      { type: 'text', x: s.x, y: M.mid + 65 + 54, text: s.lets, size: 20, font: 'sans', color: '#5b6270', align: 'center' },
    ]),
    { type: 'text', x: 80, y: 838, text: 'Inside the dendrite of the receiving neuron', size: 24, font: 'sans', color: '#6b3c87' },
    {
      type: 'meter', id: 'psp', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 330, min: -100, max: 0,
      title: 'Membrane potential', upText: 'EPSP: depolarized (excitatory)', downText: 'IPSP: hyperpolarized (inhibitory)',
    },
    ...[['ion', 'na', 'Sodium (Na⁺)'], ['ion', 'cl', 'Chloride (Cl⁻)'], ['nt', SYN.glu.nt, 'Glutamate'], ['nt', SYN.gaba.nt, 'GABA']].flatMap(([kind, v, name], i) => [
      kind === 'ion'
        ? { type: 'ion', ion: v, x: 1222, y: 664 + i * 40, r: 15 }
        : { type: 'circle', x: 1222, y: 664 + i * 40, r: 8, color: v, fill: v, fillOpacity: 1, width: 2, rough: false },
      { type: 'text', x: 1248, y: 664 + i * 40, text: name, size: 21, font: 'sans', color: kind === 'ion' ? ION_TEXT[v] : 'ink' },
    ]),
  ];

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'epsp-ipsp',
    title: '⚡ EPSP and IPSP',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: two inputs onto one dendrite, and what each does to the membrane potential.
      {
        say: 'Glutamate opens Na⁺ channels and gives an EPSP; GABA opens Cl⁻ channels and gives an IPSP.',
        actions: [
          { id: 'glu', label: 'Release glutamate', items: release('glu') },
          { id: 'gaba', label: 'Release GABA', items: release('gaba') },
        ],
        items: slide1,
      },
    ],
  });
})();
