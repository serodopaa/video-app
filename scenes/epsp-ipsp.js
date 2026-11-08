// Explainer: EPSPs and IPSPs. Built slide by slide with the user.
// The user does the drawing; these visuals simply appear (drawn: false).
// Board is 1600 x 900. See CLAUDE.md for every item type.
(() => {
  const svgDoc = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">${inner}</svg>`;
  const title = (text) => ({ type: 'text', x: 800, y: 66, text, size: 56, font: 'sans', bold: true, align: 'center', color: 'ink' });

  const REST = -70;
  const f1 = (n) => n.toFixed(1);
  const PEAK = { glu: -60, gaba: -74 }; // EPSP 10 mV up; IPSP down, but never past E(Cl⁻) = −75
  const E_ION = { na: 60, cl: -75 }; // equilibrium potentials (same values as the neuron explainer)
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
  const release = (k, drive = true) => {
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
      ...(drive ? [
        { type: 'value', id: 'psp', from: REST, to: PEAK[k], at: t0 + 1.9, duration: 1.9 },
        { type: 'value', id: 'psp', from: PEAK[k], to: REST, at: t0 + 4.6, duration: 2.2 },
      ] : []),
    ];
  };

  const slide1 = [
    title('EPSPs and IPSPs'),
    { type: 'svg', svg: sceneSvg },
    ...Object.values(SYN).map((s) => ({ type: 'text', x: s.x, y: 124, text: s.name, size: 24, font: 'sans', color: s.nameColor, align: 'center' })),
    // vesicles (the fusing ones hide while their animation plays)
    ...Object.entries(SYN).flatMap(([k, s]) => VES.map(([dx, y], vi) => ({
      type: 'vesicle', x: s.x + dx, y, r: 13, color: '#2c5a92', dot: s.nt,
      hideDuring: FUSE.some(([fi]) => fi === vi) ? [k, 'both'] : undefined,
    }))),
    ...staticIons.map(([ion, x, y]) => ({ type: 'ion', ion, x, y })),
    ...Object.entries(flows).flatMap(([k, list]) => list.map(([ion, from]) => ({ type: 'ion', ion, x: from[0], y: from[1], hideDuring: [k, 'both'] }))),
    ...Object.entries(SYN).flatMap(([k, s]) => [
      { type: 'channel', id: `ch-${k}`, x: s.x, y: M.mid, h: 130, ...CH_STYLE[s.ch], label: s.receptor },
      { type: 'text', x: s.x, y: M.mid + 65 + 54, text: s.lets, size: 20, font: 'sans', color: '#5b6270', align: 'center' },
    ]),
    { type: 'text', x: 80, y: 838, text: 'Inside the dendrite of the receiving neuron', size: 24, font: 'sans', color: '#6b3c87' },
    {
      type: 'meter', id: 'psp', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 220, min: -90, max: -40,
      title: 'Membrane potential', upText: 'Depolarization: EPSP', downText: 'Hyperpolarization: IPSP',
    },
    { type: 'text', x: 1540, y: 556, text: 'Equilibrium potential', size: 17, font: 'sans', color: '#5b6270', align: 'right' },
    ...[['ion', 'na', 'Sodium (Na⁺)'], ['ion', 'cl', 'Chloride (Cl⁻)'], ['nt', SYN.glu.nt, 'Glutamate'], ['nt', SYN.gaba.nt, 'GABA']].flatMap(([kind, v, name], i) => [
      kind === 'ion'
        ? { type: 'ion', ion: v, x: 1222, y: 584 + i * 34, r: 15 }
        : { type: 'circle', x: 1222, y: 584 + i * 34, r: 8, color: v, fill: v, fillOpacity: 1, width: 2, rough: false },
      { type: 'text', x: 1248, y: 584 + i * 34, text: name, size: 21, font: 'sans', color: kind === 'ion' ? ION_TEXT[v] : 'ink' },
      ...(kind === 'ion' ? [{
        type: 'text', x: 1540, y: 584 + i * 34, size: 21, font: 'sans', bold: true, align: 'right', color: ION_TEXT[v],
        text: `${E_ION[v] > 0 ? '+' : '−'}${Math.abs(E_ION[v])} mV`,
      }] : []),
    ]),
    { type: 'line', from: [1210, 710], to: [1540, 710], color: '#e3e6ec', width: 2, rough: false },
    // "Where we are": hover for a second to see the whole neuron with the dendrite spot circled
    ...(window.WB_LOCATOR ? window.WB_LOCATOR({ x: 1212, y: 728, w: 330, h: 120, spot: [66, 442], terminal: true }) : []),
  ];

  // ---------- intro slide: a neuron has to decide ----------
  const slideIntro = (() => {
    const W = window.WB_SUMMATION;
    if (!W) return null;
    const { EXC, INH, hillockPt, label } = W;
    const S4 = ([x, y]) => [x * W.K4 + W.TX4, y * W.K4 + W.TY4];
    const soma = S4([380, 470]);
    // [dendrite tip (neuron coordinates), excitatory?]
    const tips = [[120, 228, 1], [228, 145, 0], [332, 125, 1], [505, 186, 1], [66, 312, 0], [66, 442, 1],
      [70, 598, 1], [95, 672, 0], [172, 790, 1], [248, 828, 1], [428, 814, 1]];
    const ts = tips.map(([x, y, exc]) => {
      const p = S4([x, y]);
      const l = Math.hypot(p[0] - soma[0], p[1] - soma[1]);
      const d = [(p[0] - soma[0]) / l, (p[1] - soma[1]) / l];
      return { p, d, c: [p[0] + d[0] * 30, p[1] + d[1] * 30], end: [p[0] + d[0] * 160, p[1] + d[1] * 160], st: exc ? EXC : INH, exc };
    });
    const svg = W.svgDoc(`<defs><filter id="shI" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#13294a" flood-opacity="0.25"/></filter></defs>
      <g transform="translate(${W.TX4} ${W.TY4}) scale(${W.K4})">${W.neuronMarkup(W.PURPLE, 'intro', { releasing: false })}</g>
      <g filter="url(#shI)">${ts.map((t) => `
        <path d="M${t.c.map(f1)} L${t.end.map(f1)}" stroke="${t.st.edge}" stroke-width="14" stroke-linecap="round"/>
        <path d="M${t.c.map(f1)} L${t.end.map(f1)}" stroke="${t.st.fill}" stroke-width="9" stroke-linecap="round"/>
        <circle cx="${f1(t.c[0])}" cy="${f1(t.c[1])}" r="19" fill="${t.st.edge}"/><circle cx="${f1(t.c[0])}" cy="${f1(t.c[1])}" r="16" fill="${t.st.fill}"/>
        ${[[-5, -4], [5, -3], [0, 5]].map(([a, b]) => `<circle cx="${f1(t.c[0] + a)}" cy="${f1(t.c[1] + b)}" r="2.8" fill="${t.st.nt}"/>`).join('')}`).join('')}</g>`);
    const actions = [{
      id: 'decide', label: 'Inputs arrive',
      items: [
        ...ts.flatMap((t, i) => [
          { type: 'flash', x: t.c[0], y: t.c[1], r: 28, color: t.st.nt, duration: 0.6, at: 0.2 + i * 0.22 },
          { type: 'text', x: t.c[0] - t.d[1] * 38, y: t.c[1] + t.d[0] * 38, text: t.exc ? '+' : '−', size: 34, font: 'sans', bold: true, color: t.st.edge, align: 'center', anim: 'pop', duration: 0.3, at: 0.3 + i * 0.22, until: 4.6 },
        ]),
        { type: 'flash', x: hillockPt[0], y: hillockPt[1], r: 60, color: W.SPARK, duration: 0.8, at: 3.2 },
        { type: 'text', x: 800, y: 560, text: 'Fire, or not?', size: 40, font: 'sans', bold: true, color: '#3b4252', align: 'center', anim: 'pop', duration: 0.4, at: 3.4, until: 5.4 },
      ],
    }];
    const row = (y, color, name, desc) => [
      { type: 'circle', x: 1226, y, r: 14, color: color[0], fill: color[1], fillOpacity: 1, width: 3, rough: false },
      { type: 'text', x: 1252, y, text: name, size: 21, font: 'sans', bold: true, color: 'ink' },
      { type: 'text', x: 1210, y: y + 32, text: desc, size: 19, font: 'sans', color: '#5b6270' },
    ];
    const items = [
      title('How does a neuron decide?'),
      { type: 'svg', svg },
      { type: 'circle', x: hillockPt[0], y: hillockPt[1], r: 42, color: W.AP, width: 3, dashed: true, rough: false },
      ...label('Axon hillock', 640, 290, [610, 320], [hillockPt[0] + 12, hillockPt[1] - 30], 'center', 28),
      { type: 'rect', x: 1190, y: 112, w: 370, h: 748, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
      { type: 'text', x: 1375, y: 150, text: 'Thousands of inputs', size: 28, font: 'sans', bold: true, color: '#1f2430', align: 'center' },
      ...row(220, [EXC.edge, EXC.fill], 'Excitatory (+)', 'Pushes the neuron toward firing'),
      ...row(300, [INH.edge, INH.fill], 'Inhibitory (−)', 'Pushes it away from firing'),
      { type: 'line', from: [1210, 366], to: [1540, 366], color: '#e3e6ec', width: 2, rough: false },
      { type: 'text', x: 1375, y: 410, text: 'The axon hillock adds\nthem all up.', size: 24, font: 'sans', bold: true, color: '#3b4252', align: 'center' },
      { type: 'text', x: 1375, y: 500, text: 'If the total reaches\n−55 mV, the neuron\nfires an action potential.', size: 22, font: 'sans', color: '#e0453a', bold: true, align: 'center' },
      { type: 'text', x: 1375, y: 640, text: 'How do the inputs add up?\nThat is what this video\nis about: EPSPs, IPSPs,\nand summation.', size: 22, font: 'sans', color: '#5b6270', align: 'center' },
    ];
    return { actions, items };
  })();

  // ---------- shared drawing for the spatial and temporal slides ----------
  // A dendrite leading to the cell body and axon hillock, with excitatory inputs on the dendrite
  // and one inhibitory input (I) on the cell body right next to the hillock, plus the graph panel.
  const STRIP = { Y: 450, XH: 1070, IX: 985, IY: 318 };
  const buildStrip = (W, { title: head, exc, foot, excLegend }) => {
    const { EXC, INH, label } = W;
    const { Y, XH, IX, IY } = STRIP;
    const bulb = (x, y, st) => `<path d="M${x} ${y} L${x} 110" stroke="${st.edge}" stroke-width="16" stroke-linecap="round"/>
      <path d="M${x} ${y} L${x} 110" stroke="${st.fill}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="${x}" cy="${y}" r="21" fill="${st.edge}"/><circle cx="${x}" cy="${y}" r="18" fill="${st.fill}"/>
      ${[[-6, -5], [6, -4], [0, 6]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="3.2" fill="${st.nt}"/>`).join('')}`;
    const svg = W.svgDoc(`<defs>
      <radialGradient id="somaW" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f3e6f8"/><stop offset="0.55" stop-color="#d4afe2"/><stop offset="1" stop-color="#ad78c6"/></radialGradient>
      <filter id="shW" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#13294a" flood-opacity="0.25"/></filter></defs>
      <g filter="url(#shW)">
        <path d="M110 ${Y} L870 ${Y}" stroke="#5e2f78" stroke-width="50" stroke-linecap="round"/>
        <path d="M110 ${Y} L870 ${Y}" stroke="#c69ad8" stroke-width="43" stroke-linecap="round"/>
        <path d="M1000 ${Y - 28} Q1040 ${Y - 6} 1085 ${Y - 4} L1085 ${Y + 4} Q1040 ${Y + 6} 1000 ${Y + 28} Z" fill="#c69ad8" stroke="#5e2f78" stroke-width="4"/>
        <path d="M1085 ${Y} L1172 ${Y}" stroke="#5e2f78" stroke-width="13" stroke-linecap="round"/>
        <path d="M1085 ${Y} L1172 ${Y}" stroke="#d4afe2" stroke-width="7" stroke-linecap="round"/>
        <circle cx="950" cy="${Y}" r="105" fill="url(#somaW)" stroke="#5e2f78" stroke-width="5"/>
        <circle cx="940" cy="${Y - 10}" r="30" fill="#5a2b75"/><circle cx="950" cy="${Y - 16}" r="9" fill="#3a1650"/>
        ${exc.map((e) => bulb(e.x, 390, EXC)).join('')}${bulb(IX, IY, INH)}
      </g>`);
    const items = [
      title(head),
      { type: 'svg', svg },
      ...exc.map((e) => ({ type: 'text', x: e.x - 36, y: 390, text: e.letter, size: 30, font: 'sans', bold: true, color: EXC.edge, align: 'right' })),
      { type: 'text', x: IX - 36, y: IY, text: 'I', size: 30, font: 'sans', bold: true, color: INH.edge, align: 'right' },
      ...label('Dendrite', 140, 340, [150, 362], [160, Y - 14], 'center', 26),
      { type: 'circle', x: XH, y: Y, r: 34, color: W.AP, width: 3, dashed: true, rough: false },
      ...label('Axon hillock', 1100, 335, [1086, 357], [XH + 6, Y - 32], 'center', 26),
      { type: 'text', x: 600, y: 800, text: foot, size: 21, font: 'sans', color: '#3b4252', align: 'center' },
      {
        type: 'meter', id: 'axh', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 250,
        title: 'Axon hillock potential', upText: 'Closer to threshold', downText: 'Pushed away from threshold',
        fireText: 'Action potential fired!',
      },
      { type: 'text', x: 1375, y: 650, text: 'Reach −55 mV at the\naxon hillock and the\nneuron fires', size: 22, font: 'sans', color: '#3b4252', align: 'center' },
      { type: 'circle', x: 1232, y: 790, r: 13, color: EXC.edge, fill: EXC.fill, fillOpacity: 1, width: 3, rough: false },
      { type: 'text', x: 1256, y: 790, text: excLegend, size: 21, font: 'sans', color: 'ink' },
      { type: 'circle', x: 1232, y: 828, r: 13, color: INH.edge, fill: INH.fill, fillOpacity: 1, width: 3, rough: false },
      { type: 'text', x: 1256, y: 828, text: 'I: inhibitory', size: 21, font: 'sans', color: 'ink' },
    ];
    return { items };
  };

  // ---------- spatial summation ----------
  // One dendrite with two excitatory inputs (A far from the axon hillock, B nearer) and an
  // inhibitory input (I) right next to the hillock. An EPSP/IPSP is a graded potential: it shrinks
  // as it travels, so what matters is where each input lands. Numbers (mV above/below rest):
  //   A reaches the hillock as +6, B as +10, I as -5. A + B = +16 (to -54 mV: fires); A + B + I = +11 (-59: blocked).
  const slideWhy = (() => {
    const W = window.WB_SUMMATION;
    if (!W) return null;
    const { EXC, INH, SPARK } = W;
    const { Y, XH, IX, IY } = STRIP;
    const XA = 250, XB = 720;                          // far and near excitatory inputs
    // one excitatory input alone: shows how much of its EPSP is left at each point along the way
    const run = ({ xs, dur, vals, peak, verdict }) => {
      const xm = (xs + XH) / 2, xsList = [xs, xm, XH];
      const total = 92 + (XH - xs);
      const tAt = (len) => 0.4 + dur * (len / total);
      const times = [tAt(92), tAt(92 + (XH - xs) / 2), tAt(total)];
      const caps = ['at the synapse', 'halfway', 'at the hillock'];
      return [
        { type: 'flash', x: xs, y: 390, r: 30, color: EXC.nt, duration: 0.5, at: 0 },
        { type: 'mover', once: true, vanish: true, r: 9, color: SPARK, path: [[xs, 400], [xs, Y], [XH, Y]], duration: dur, at: 0.4 },
        ...xsList.flatMap((x, i) => [
          { type: 'flash', x, y: Y, r: 10 + vals[i] * 2.8, color: SPARK, duration: 0.7, at: times[i] },
          { type: 'line', from: [x, 478], to: [x, 568], color: '#8a8f98', width: 2, dashed: true, rough: false, at: times[i] },
          { type: 'text', x, y: 590, text: caps[i], size: 20, font: 'sans', color: '#5b6270', align: 'center', anim: 'pop', duration: 0.3, at: times[i] },
          { type: 'text', x, y: 630, text: `+${vals[i]} mV`, size: 36, font: 'sans', bold: true, color: '#e8890c', align: 'center', anim: 'pop', duration: 0.3, at: times[i] },
        ]),
        { type: 'value', id: 'axh', from: REST, to: peak, at: times[2] - 0.2, duration: 0.5 },
        { type: 'value', id: 'axh', from: peak, to: REST, at: times[2] + 0.5, duration: 2.0 },
        { type: 'text', x: 600, y: 720, text: verdict, size: 26, font: 'sans', bold: true, color: EXC.edge, align: 'center', anim: 'pop', duration: 0.4, at: times[2] + 0.3, until: times[2] + 4 },
      ];
    };
    // several inputs at once: their potentials arrive together and add up at the hillock
    const together = ({ withI }) => {
      const T = 2.6;                                  // when everything reaches the hillock
      const sum = withI ? '+6  +10  −5  =  +11 mV' : '+6  +10  =  +16 mV';
      const out = [
        { type: 'flash', x: XA, y: 390, r: 30, color: EXC.nt, duration: 0.5, at: 0 },
        { type: 'flash', x: XB, y: 390, r: 30, color: EXC.nt, duration: 0.5, at: 0 },
        { type: 'mover', once: true, vanish: true, r: 9, color: SPARK, path: [[XA, 400], [XA, Y], [XH, Y]], duration: T - 0.4, at: 0.4 },
        { type: 'mover', once: true, vanish: true, r: 9, color: SPARK, path: [[XB, 400], [XB, Y], [XH, Y]], duration: T - 0.4, at: 0.4 },
        { type: 'flash', x: XH, y: Y, r: 34, color: SPARK, duration: 0.6, at: T },
        { type: 'line', from: [XH, 478], to: [XH, 568], color: '#8a8f98', width: 2, dashed: true, rough: false, at: T },
        { type: 'text', x: XH, y: 590, text: 'at the hillock', size: 20, font: 'sans', color: '#5b6270', align: 'center', anim: 'pop', duration: 0.3, at: T },
        { type: 'text', x: XH - 40, y: 630, text: sum, size: 30, font: 'sans', bold: true, color: '#e8890c', align: 'center', anim: 'pop', duration: 0.3, at: T },
      ];
      if (!withI) {
        out.push({ type: 'value', id: 'axh', from: REST, to: -54, at: T - 0.2, duration: 0.5 },
          { type: 'flash', x: XH, y: Y, r: 44, color: W.AP, duration: 0.8, at: T + 0.5 },
          { type: 'value', id: 'axh', from: -54, to: 30, at: T + 0.5, duration: 0.25 },
          { type: 'value', id: 'axh', from: 30, to: -80, at: T + 0.75, duration: 0.55 },
          { type: 'value', id: 'axh', from: -80, to: REST, at: T + 1.3, duration: 1.8 },
          { type: 'mover', once: true, vanish: true, r: 8, color: W.AP, path: [[1085, Y], [1172, Y]], duration: 0.6, at: T + 0.6 },
          { type: 'text', x: 600, y: 720, text: 'Added together they reach −55 mV:\nthe neuron fires!', size: 26, font: 'sans', bold: true, color: '#e0453a', align: 'center', anim: 'pop', duration: 0.4, at: T + 0.4, until: 4.5 });
      } else {
        out.push({ type: 'flash', x: IX, y: IY, r: 30, color: INH.nt, duration: 0.5, at: 1.5 },
          { type: 'mover', once: true, vanish: true, r: 7, color: INH.nt, smooth: true, path: [[IX, IY + 22], [1012, 400], [1060, Y - 12]], duration: 0.9, at: T - 0.9 },
          { type: 'pulse', x: 1030, y: 405, r: 26, color: INH.nt, speed: 1.2, at: T - 0.9, until: 2.4 },
          { type: 'flash', x: XH, y: Y, r: 46, color: INH.nt, duration: 0.8, at: T + 0.1 },
          { type: 'value', id: 'axh', from: REST, to: -54, at: T - 0.45, duration: 0.4 },
          { type: 'value', id: 'axh', from: -54, to: -59, at: T - 0.05, duration: 0.5 },
          { type: 'value', id: 'axh', from: -59, to: REST, at: T + 0.9, duration: 1.8 },
          { type: 'text', x: 600, y: 720, text: 'The inhibitory input right next to the hillock\ncancels them: no action potential.', size: 26, font: 'sans', bold: true, color: INH.edge, align: 'center', anim: 'pop', duration: 0.4, at: T + 0.4, until: 4.5 });
      }
      return out;
    };
    const actions = [
      { id: 'far', label: 'Fire the far input (A)', items: run({ xs: XA, dur: 2.4, vals: [12, 8, 6], peak: -64, verdict: 'Far away: much of it fades on the way.' }) },
      { id: 'near', label: 'Fire the near input (B)', items: run({ xs: XB, dur: 1.6, vals: [12, 11, 10], peak: -60, verdict: 'Closer: more of it arrives.' }) },
      { id: 'ab', label: 'Fire A + B together', items: together({ withI: false }) },
      { id: 'abi', label: 'Fire A + B + I', items: together({ withI: true }) },
    ];
    const { items } = buildStrip(W, {
      title: 'Spatial summation',
      exc: [{ x: XA, letter: 'A' }, { x: XB, letter: 'B' }],
      excLegend: 'A, B: excitatory',
      foot: 'An EPSP or IPSP gets smaller the farther it travels, so inputs close to the hillock count for more.\nInputs from different places add up at the hillock: this is spatial summation.',
    });
    return { actions, items };
  })();

  // ---------- temporal summation ----------
  // Same picture as the spatial slide, but one excitatory input (E) firing again and again, and the
  // inhibitory input (I) next to the hillock. Each EPSP fades, so only quick repeats pile up;
  // I takes a bit off every EPSP, and enough extra firing of E overcomes it.
  const slide3 = (() => {
    const W = window.WB_SUMMATION;
    if (!W) return null;
    const { EXC, INH, SPARK, AP } = W;
    const { Y, XH, IX, IY } = STRIP;
    const XE = 720;
    const GAP = 1.2, SPREAD = 2.6, ARR = 1.3;            // seconds between firings; time for a signal to reach the hillock
    const ORD = ['1st', '2nd', '3rd', '4th', '5th'];
    const v = (from, to, at, duration) => ({ type: 'value', id: 'axh', from, to, at, duration });
    const say = (text, color, at, until) => ({ type: 'text', x: 600, y: 700, text, size: 26, font: 'sans', bold: true, color, align: 'center', anim: 'pop', duration: 0.4, at, until });
    const sendE = (t) => [
      { type: 'flash', x: XE, y: 390, r: 28, color: EXC.nt, duration: 0.5, at: t },
      { type: 'mover', once: true, vanish: true, r: 8, color: SPARK, path: [[XE, 400], [XE, Y], [XH, Y]], duration: 1.0, at: t + 0.3 },
    ];
    const sendI = (t) => [
      { type: 'flash', x: IX, y: IY, r: 28, color: INH.nt, duration: 0.5, at: t },
      { type: 'mover', once: true, vanish: true, r: 7, color: INH.nt, smooth: true, path: [[IX, IY + 22], [1012, 400], [1060, Y - 12]], duration: 0.9, at: t + ARR - 0.9 },
      { type: 'flash', x: XH, y: Y, r: 40, color: INH.nt, duration: 0.7, at: t + ARR },
    ];
    const fireAP = (t0) => [
      { type: 'flash', x: XH, y: Y, r: 44, color: AP, duration: 0.8, at: t0 },
      v(-50, 30, t0, 0.25), v(30, -80, t0 + 0.25, 0.55), v(-80, REST, t0 + 0.8, 1.8),
      { type: 'mover', once: true, vanish: true, r: 8, color: AP, path: [[1085, Y], [1172, Y]], duration: 0.6, at: t0 + 0.1 },
    ];
    // n firings of E (paired with an IPSP for the first nI of them). `peaks` is the hillock potential just
    // after each EPSP lands; `faded` is what is left when the next one arrives. `fires`: the last one reaches threshold.
    const run = ({ n, nI = 0, peaks, faded = [], fires = false, spread = false, verdict, color }) => {
      const out = [];
      const gap = spread ? SPREAD : GAP;
      let level = REST;
      for (let k = 0; k < n; k++) {
        const t = k * gap, a = t + ARR;
        out.push(...sendE(t),
          { type: 'text', x: XE + 34, y: 390, text: `${ORD[k]} firing`, size: 20, font: 'sans', bold: true, color: EXC.edge, anim: 'pop', duration: 0.3, at: t, until: gap - 0.05 },
          { type: 'flash', x: XH, y: Y, r: 26, color: SPARK, duration: 0.5, at: a });
        if (k < nI) out.push(...sendI(t));
        if (spread) { out.push(v(REST, peaks[0], a - 0.2, 0.4), v(peaks[0], REST, a + 0.2, 2.0)); continue; }
        out.push(v(level, peaks[k], a - 0.2, 0.4));
        if (k < n - 1) { out.push(v(peaks[k], faded[k], a + 0.2, gap - 0.5)); level = faded[k]; }
      }
      const last = (n - 1) * gap + ARR;
      if (fires) out.push(say(verdict, color, last + 0.3, 4), ...fireAP(last + 0.25));
      else out.push(v(peaks[n - 1], REST, last + 0.4, 2.4), say(verdict, color, last + 0.4, 3.2));
      return out;
    };
    const GREY = '#5b6270';
    const actions = [
      { id: 'r1', label: 'Fire 1 time', items: run({ n: 1, peaks: [-62], verdict: 'Fades away. Not enough.', color: GREY }) },
      { id: 'r2', label: 'Fire 2 times', items: run({ n: 2, peaks: [-62, -57], faded: [-65], verdict: 'Closer, but still below threshold.', color: GREY }) },
      { id: 'r3', label: 'Fire 3 times', items: run({ n: 3, peaks: [-62, -57, -50], faded: [-65, -62], fires: true, verdict: 'The EPSPs piled up past −55 mV:\nthe neuron fires!', color: '#e0453a' }) },
      { id: 'r3s', label: 'Fire 3 times, spread apart', items: run({ n: 3, peaks: [-62], spread: true, verdict: 'Too slow: each EPSP faded\nbefore the next one arrived.', color: GREY }) },
      { id: 'r3i', label: 'Fire 3 times + inhibition', items: run({ n: 3, nI: 3, peaks: [-66, -64, -62], faded: [-68, -66], verdict: 'The inhibitory input cancels each EPSP:\nno action potential.', color: INH.edge }) },
      { id: 'r5i', label: 'Fire 5 times + inhibition', items: run({ n: 5, nI: 3, peaks: [-66, -64, -62, -56, -50], faded: [-68, -66, -64, -59], fires: true, verdict: 'Five excitatory firings outlast the three\ninhibitory ones: threshold reached!', color: '#e0453a' }) },
    ];
    const { items } = buildStrip(W, {
      title: 'Temporal summation',
      exc: [{ x: XE, letter: 'E' }],
      excLegend: 'E: excitatory',
      foot: 'Each EPSP fades quickly. If the same input fires again before it has faded, the EPSPs add up:\nthis is temporal summation. Inhibition next to the hillock takes a bit off every one.',
    });
    return { actions, items };
  })();

  // ---------- recap: click a bullet to see that idea in action ----------
  // Each bullet has an invisible click target (hotspot) that plays one demo on the right.
  // The demos use `stay` (the last frame stays on screen for talking over) and share a
  // `group` (clicking another bullet replaces the demo). All of them drive the same meter.
  const slideRecap = (() => {
    const W = window.WB_SUMMATION;
    if (!W) return null;
    const { EXC, INH, SPARK, AP } = W;
    const CX = 1205;                       // centre of the demo panel
    const GROUP = 'concept';
    const v = (from, to, at, duration) => ({ type: 'value', id: 'rec', from, to, at, duration });
    const caption = (text, at = 0, until) => ({ type: 'text', x: CX, y: 138, text, size: 21, font: 'sans', bold: true, color: '#3b4252', align: 'center', anim: 'pop', duration: 0.3, at, until });
    const ids = ['epsp', 'ipsp', 'spatial', 'temporal', 'hillock'];
    const ROWS = [
      { id: 'epsp', y: 190, color: [EXC.edge, EXC.fill], name: 'Excitatory input (EPSP)', desc: 'Glutamate opens Na⁺ channels:\nthe potential moves up toward −55 mV.' },
      { id: 'ipsp', y: 330, color: [INH.edge, INH.fill], name: 'Inhibitory input (IPSP)', desc: 'GABA opens Cl⁻ channels: the potential\nmoves down, away from threshold.' },
      { id: 'spatial', y: 470, color: ['#5e2f78', '#c69ad8'], name: 'Spatial summation', desc: 'Inputs from different places add up at the\naxon hillock. Nearby inhibition is strongest.' },
      { id: 'temporal', y: 610, color: ['#2c5a92', '#9cc0ea'], name: 'Temporal summation', desc: 'Inputs close together in time add up\nbefore they fade.' },
      { id: 'hillock', y: 750, color: ['#b3261e', '#ff8a7a'], name: 'The axon hillock decides', desc: 'If the total reaches −55 mV,\nan action potential fires.' },
    ];
    const ring = (id) => ({ type: 'circle', x: 100, y: ROWS.find((r) => r.id === id).y, r: 30, color: '#1f2430', width: 4, rough: false });

    // --- a tiny synapse: terminal above, membrane with one receptor, ions crossing ---
    const synapse = (kind) => {
      const glu = kind === 'glu';
      const nt = glu ? EXC.nt : INH.nt, st = glu ? CH_STYLE.na : CH_STYLE.cl, ion = glu ? 'na' : 'cl';
      const peak = glu ? -60 : -74, nameColor = glu ? '#b05f00' : '#0b6f7e';
      const MT = 330, MB = 372, MID = 351;
      const flows = [[-60, -46, 402], [30, 6, 408], [-14, 52, 398]].map(([sx, ex, ey], i) => [sx, ex, ey, i]);
      const items = [
        { type: 'rect', x: 866, y: MT, w: 678, h: MB - MT, color: '#b67d3c', fill: '#fbecd6', fillOpacity: 1, width: 2, rough: false },
        { type: 'circle', x: CX, y: 235, rx: 150, ry: 52, color: '#2c5a92', fill: '#bcd5f2', fillOpacity: 1, width: 4, rough: false },
        ...[[-90, 228], [-30, 214], [40, 224], [100, 238]].map(([dx, y]) => ({ type: 'vesicle', x: CX + dx, y, r: 10, color: '#2c5a92', dot: nt })),
        { type: 'vesicle', fuse: true, r: 10, color: '#2c5a92', dot: nt, path: [[CX - 55, 258], [CX - 24, 288]], duration: 1.2, at: 0 },
        { type: 'vesicle', fuse: true, r: 10, color: '#2c5a92', dot: nt, path: [[CX + 10, 256], [CX + 24, 288]], duration: 1.2, at: 0.15 },
        { type: 'text', x: CX + 166, y: 235, text: glu ? 'Excitatory\nterminal\n(glutamate)' : 'Inhibitory\nterminal\n(GABA)', size: 19, font: 'sans', bold: true, color: nameColor },
        { type: 'text', x: 872, y: 312, text: 'Outside', size: 17, font: 'sans', color: '#8a8f98' },
        { type: 'text', x: 872, y: 392, text: 'Inside', size: 17, font: 'sans', color: '#8a8f98' },
        { type: 'channel', id: 'rc', x: CX, y: MID, h: 80, ...st, label: undefined },
        { type: 'text', x: CX + 80, y: MID, text: glu ? 'Glutamate receptor' : 'GABA receptor', size: 18, font: 'sans', bold: true, color: st.edge },
        // ions that stay put
        { type: 'ion', ion: 'na', x: CX - 250, y: 304, r: 14 }, { type: 'ion', ion: 'cl', x: CX + 240, y: 306, r: 14 }, { type: 'ion', ion: 'na', x: CX - 150, y: 312, r: 14 },
        { type: 'ion', ion: 'k', x: CX - 230, y: 402, r: 14 }, { type: 'ion', ion: 'a', x: CX + 210, y: 404, r: 14 }, { type: 'ion', ion: 'k', x: CX + 110, y: 410, r: 14 },
        // the neurotransmitter binds
        { type: 'mover', once: true, r: 6, color: nt, smooth: true, path: [[CX - 22, 290], [CX - 26, 310], [CX - 28, 324]], duration: 0.7, at: 0.8, until: 3.4 },
        { type: 'mover', once: true, vanish: true, r: 6, color: nt, smooth: true, path: [[CX - 28, 324], [CX - 70, 312], [CX - 110, 296]], duration: 0.8, at: 4.2 },
        { type: 'mover', once: true, vanish: true, r: 5, color: nt, smooth: true, path: [[CX + 22, 290], [CX + 50, 306], [CX + 80, 300]], duration: 1.6, at: 0.9 },
        { type: 'value', id: 'rc', from: 0, to: 1, at: 1.5, duration: 0.35 },
        ...flows.map(([sx, ex, ey, i]) => ({ type: 'ion', ion, smooth: true, path: [[CX + sx, 306], [CX, MT - 8], [CX, MID], [CX, MB + 10], [CX + ex, ey]], duration: 1.4, at: 1.7 + i * 0.35 })),
        { type: 'value', id: 'rc', from: 1, to: 0, at: 4.1, duration: 0.35 },
        v(REST, peak, 1.9, 1.9), v(peak, REST, 4.6, 2.2),
        caption(glu ? 'Glutamate opens Na⁺ channels.\nNa⁺ flows in: the potential rises (EPSP).' : 'GABA opens Cl⁻ channels.\nCl⁻ flows in: the potential falls (IPSP).'),
      ];
      return items;
    };

    // --- a dendrite strip leading to the cell body and axon hillock ---
    const bulb = (t) => [
      { type: 'line', from: [t.x, t.y], to: [t.x, 185], color: t.st.edge, width: 14, rough: false },
      { type: 'line', from: [t.x, t.y], to: [t.x, 185], color: t.st.fill, width: 8, rough: false },
      { type: 'circle', x: t.x, y: t.y, r: 20, color: t.st.edge, fill: t.st.fill, fillOpacity: 1, width: 4, rough: false },
      { type: 'text', x: t.x - 30, y: t.y, text: t.name, size: 22, font: 'sans', bold: true, color: t.st.edge, align: 'right' },
    ];
    const HX = 1458, HY = 300;
    const strip = (terms) => [
      { type: 'line', from: [880, 300], to: [1340, 300], color: '#5e2f78', width: 34, rough: false },
      { type: 'line', from: [880, 300], to: [1340, 300], color: '#c69ad8', width: 26, rough: false },
      { type: 'line', from: [HX, HY], to: [1555, HY], color: '#5e2f78', width: 12, rough: false },
      { type: 'line', from: [HX, HY], to: [1555, HY], color: '#d4afe2', width: 7, rough: false },
      { type: 'circle', x: 1395, y: 300, r: 60, color: '#5e2f78', fill: '#d4afe2', fillOpacity: 1, width: 4, rough: false },
      { type: 'circle', x: 1385, y: 292, r: 18, color: '#5a2b75', fill: '#5a2b75', fillOpacity: 1, width: 2, rough: false },
      { type: 'circle', x: HX, y: HY, r: 24, color: AP, width: 3, dashed: true, rough: false },
      { type: 'text', x: 1498, y: 352, text: 'Axon hillock', size: 18, font: 'sans', bold: true, color: '#3b4252', align: 'center' },
      { type: 'text', x: 960, y: 345, text: 'Dendrite', size: 18, font: 'sans', color: '#5b6270', align: 'center' },
      ...terms.flatMap(bulb),
    ];
    const E1 = { x: 930, y: 250, st: EXC, name: 'E1' }, E2 = { x: 1070, y: 250, st: EXC, name: 'E2' };
    const INHT = { x: 1478, y: 232, st: INH, name: 'I' };
    const send = (t, at, dur = 1.5) => [
      { type: 'flash', x: t.x, y: t.y, r: 26, color: t.st.nt, duration: 0.5, at },
      { type: 'mover', once: true, vanish: true, r: 7, color: SPARK, smooth: true, path: [[t.x, t.y + 22], [t.x, 300], [1330, 300], [HX, HY]], duration: dur, at: at + 0.3 },
    ];
    const fireAP = (t0) => [
      { type: 'flash', x: HX, y: HY, r: 44, color: AP, duration: 0.8, at: t0 },
      v(-50, 30, t0, 0.25), v(30, -80, t0 + 0.25, 0.55), v(-80, REST, t0 + 0.8, 1.8),
      { type: 'mover', once: true, vanish: true, r: 8, color: AP, path: [[HX, HY], [1555, HY]], duration: 0.6, at: t0 + 0.1 },
    ];

    const spatial = () => {
      const S = 6.6;
      return [
        ...strip([E1, E2, INHT]),
        // 1. two excitatory inputs from different places add up: threshold
        ...send(E1, 0), ...send(E2, 0),
        v(REST, -50, 1.7, 0.45), { type: 'flash', x: HX, y: HY, r: 34, color: SPARK, duration: 0.5, at: 1.75 }, ...fireAP(2.1),
        caption('Two excitatory inputs from different places\nadd up at the hillock: threshold reached!', 0, 6.0),
        // 2. add the inhibitory input right next to the hillock: blocked
        ...send(E1, S), ...send(E2, S),
        { type: 'flash', x: INHT.x, y: INHT.y, r: 26, color: INH.nt, duration: 0.5, at: S + 0.7 },
        { type: 'mover', once: true, vanish: true, r: 6, color: INH.nt, smooth: true, path: [[INHT.x, INHT.y + 20], [HX + 8, HY - 22]], duration: 0.5, at: S + 1.0 },
        { type: 'flash', x: HX, y: HY, r: 34, color: SPARK, duration: 0.5, at: S + 1.75 },
        { type: 'flash', x: HX, y: HY, r: 46, color: INH.nt, duration: 0.8, at: S + 1.9 },
        v(REST, -58, S + 1.7, 0.35), v(-58, -66, S + 2.05, 0.5), v(-66, REST, S + 2.55, 1.8),
        caption('Add inhibition right next to the hillock:\nthe neuron is blocked.', S),
      ];
    };
    const temporal = () => {
      const T = { x: 1100, y: 250, st: EXC, name: 'E1' };
      const GAP = 1.2, ARR = 1.3, PEAKS = [-62, -57, -50], FADED = [-65, -62], ORD = ['1st', '2nd', '3rd'];
      const out = [...strip([T]), caption('The same input firing again and again:\nthe EPSPs pile up to threshold!')];
      let level = REST;
      for (let k = 0; k < 3; k++) {
        const t = k * GAP, a = t + ARR;
        out.push(...send(T, t, 1.0),
          { type: 'text', x: T.x + 34, y: T.y, text: `${ORD[k]} firing`, size: 20, font: 'sans', bold: true, color: EXC.edge, anim: 'pop', duration: 0.3, at: t, until: GAP - 0.05 },
          v(level, PEAKS[k], a - 0.2, 0.4));
        if (k < 2) { out.push(v(PEAKS[k], FADED[k], a + 0.2, GAP - 0.5)); level = FADED[k]; }
      }
      out.push({ type: 'flash', x: HX, y: HY, r: 34, color: SPARK, duration: 0.5, at: 2 * GAP + ARR }, ...fireAP(2 * GAP + ARR + 0.25));
      return out;
    };
    const hillock = () => [
      ...strip([]),
      { type: 'text', x: 1474, y: 376, text: 'threshold: −55 mV', size: 16, font: 'sans', bold: true, color: '#e0453a', align: 'center' },
      v(REST, -60, 0.3, 0.6), { type: 'flash', x: HX, y: HY, r: 30, color: SPARK, duration: 0.6, at: 0.6 },
      caption('Below −55 mV: nothing happens.', 0, 3.2),
      v(-60, -50, 3.6, 0.4), { type: 'flash', x: HX, y: HY, r: 34, color: SPARK, duration: 0.5, at: 3.8 }, ...fireAP(4.1),
      caption('It reaches −55 mV: an action potential fires!', 3.4),
    ];

    const bodies = { epsp: () => synapse('glu'), ipsp: () => synapse('gaba'), spatial, temporal, hillock };
    const actions = ROWS.map((r) => ({
      id: r.id, label: r.name.replace(/ \(.*\)/, ''), group: GROUP, stay: true, drawn: false,
      items: [ring(r.id), ...bodies[r.id]()],
    }));
    const items = [
      title('Putting it together'),
      ...ROWS.flatMap((r) => [
        { type: 'circle', x: 100, y: r.y, r: 20, color: r.color[0], fill: r.color[1], fillOpacity: 1, width: 3, rough: false },
        { type: 'text', x: 146, y: r.y, text: r.name, size: 32, font: 'sans', bold: true, color: 'ink' },
        { type: 'text', x: 146, y: r.y + 42, text: r.desc, size: 22, font: 'sans', color: '#5b6270' },
        { type: 'hotspot', x: 60, y: r.y - 38, w: 90, h: 76, action: r.id },
      ]),
      { type: 'rect', x: 850, y: 112, w: 710, h: 316, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
      { type: 'text', x: CX, y: 270, text: 'Click a bullet on the left\nto see it in action', size: 30, font: 'sans', bold: true, color: '#8a8f98', align: 'center', hideDuring: ids },
      {
        type: 'meter', id: 'rec', value: REST, x: 850, y: 438, w: 710, h: 422, graphH: 200, min: -90, max: 40,
        title: 'Membrane potential', upText: 'Closer to threshold', downText: 'Pushed away from threshold',
        fireText: 'Action potential fired!',
      },
    ];
    return { actions, items };
  })();

  // ---------- thumbnail ----------
  const thumbItems = [
    { type: 'svg', svg: svgDoc(`<defs><linearGradient id="thBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b1740"/><stop offset="1" stop-color="#4a2a8a"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#thBg)"/>
      <line x1="820" y1="330" x2="1520" y2="330" stroke="#ff6b6b" stroke-width="5" stroke-dasharray="16 10"/>
      <line x1="820" y1="520" x2="1520" y2="520" stroke="#c9ccd6" stroke-width="4" stroke-dasharray="6 8"/>
      <path d="M820 520 L930 520 C1000 520 1010 470 1050 405 C1085 355 1120 375 1150 430 C1180 485 1210 520 1290 520" fill="none" stroke="#ffb21e" stroke-width="12" stroke-linecap="round"/>
      <path d="M1290 520 C1350 520 1380 560 1410 610 C1440 655 1480 640 1520 550" fill="none" stroke="#3ad0e0" stroke-width="12" stroke-linecap="round"/>
      <text x="1490" y="310" font-family="Arial, sans-serif" font-weight="700" font-size="30" fill="#ff8a8a" text-anchor="end">threshold</text>
      <text x="1050" y="372" font-family="Arial, sans-serif" font-weight="700" font-size="46" fill="#ffb21e" text-anchor="middle">+</text>
      <text x="1440" y="700" font-family="Arial, sans-serif" font-weight="700" font-size="52" fill="#3ad0e0" text-anchor="middle">−</text>`)},
    { type: 'text', x: 80, y: 180, text: 'EPSP', size: 150, font: 'sans', bold: true, color: '#ffb21e', glow: '#ffd98a', glowSize: 16 },
    { type: 'text', x: 80, y: 340, text: '& IPSP', size: 150, font: 'sans', bold: true, color: '#3ad0e0', glow: '#9beaf2', glowSize: 16 },
    { type: 'rect', x: 66, y: 470, w: 730, h: 124, color: '#ffd34d', width: 2, fill: '#ffd34d', fillOpacity: 0.95, rough: false },
    { type: 'text', x: 84, y: 534, text: 'SUMMATION', size: 98, font: 'sans', bold: true, color: '#1f2430' },
    { type: 'text', x: 84, y: 680, text: 'spatial + temporal', size: 58, font: 'sans', bold: true, color: '#ffffff' },
  ];

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'epsp-ipsp',
    title: '⚡ EPSP and IPSP',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: intro - a neuron receives thousands of inputs and has to decide whether to fire.
      ...(slideIntro ? [{
        say: 'A neuron receives thousands of excitatory and inhibitory inputs, and the axon hillock adds them all up to decide whether to fire.',
        script: `Right now, thousands of tiny signals are landing on this neuron. [point to the terminals around the dendrites]

Some of them are excitatory. They're saying "fire!" [point to an orange terminal]

Others are inhibitory. They're saying "don't fire." [point to a teal terminal]

[click "Inputs arrive"]

All of these signals arrive at once, and the neuron has to make a decision. Down here, at the axon hillock, [point to the circled hillock] it adds them all up. If the total reaches negative 55 millivolts, it fires an action potential. If not, nothing happens.

So how does a neuron add up all those signals? That's what we're going to figure out. We'll start with the two types of signals, EPSPs and IPSPs, and then look at how they combine across space and across time.`,
        actions: slideIntro.actions,
        items: slideIntro.items,
      }] : []),
      // Slide 2: two inputs onto one dendrite, and what each does to the membrane potential.
      {
        say: 'Glutamate opens Na⁺ channels and gives an EPSP; GABA opens Cl⁻ channels and gives an IPSP.',
        clear: true,
        actions: [
          { id: 'glu', label: 'Release glutamate', items: release('glu') },
          { id: 'gaba', label: 'Release GABA', items: release('gaba') },
          { // both at once: the EPSP and IPSP cancel each other out
            id: 'both', label: 'Release both',
            items: [...release('glu', false), ...release('gaba', false),
              { type: 'value', id: 'psp', from: REST, to: -67, at: 1.9, duration: 1.9 },
              { type: 'value', id: 'psp', from: -67, to: REST, at: 4.6, duration: 2.2 }],
          },
        ],
        items: slide1,
      },
      // Slide 3: spatial summation - A + B add up and fire; the inhibitory input next to the hillock cancels them.
      ...(slideWhy ? [{
        say: 'Inputs from different places add up at the axon hillock: two excitatory inputs reach threshold together, and the nearby inhibitory input cancels them.',
        clear: true,
        actions: slideWhy.actions,
        items: slideWhy.items,
      }] : []),
      // Slide 4: temporal summation - the same excitatory neuron firing 1, 2, then 3 times in a row.
      ...(slide3 ? [{
        say: 'Each EPSP fades quickly, but repeated firing adds up: three in a row reach threshold, inhibition can cancel that, and enough extra firing overcomes the inhibition.',
        clear: true,
        actions: slide3.actions,
        items: slide3.items,
      }] : []),
      // Slide 5: recap.
      ...(slideRecap ? [{
        script: `So let's put it all together.

[click "Excitatory input"] An excitatory input opens sodium channels, and the membrane potential moves up, toward threshold.

[click "Inhibitory input"] An inhibitory input opens chloride channels, and moves it the other way: down, away from threshold.

[click "Spatial summation"] Spatial summation: inputs from different places add up at the axon hillock, and inhibition close to the hillock is the strongest.

[click "Temporal summation"] Temporal summation: inputs that arrive close together in time add up before they fade.

[click "The axon hillock decides"] And in the end, the axon hillock decides. If the total reaches negative 55 millivolts, an action potential fires.

That's how one neuron turns thousands of signals into a single decision. Thanks for watching.`,
        say: 'Click each bullet to see it in action: excitatory inputs push toward threshold, inhibitory inputs push away, and the axon hillock adds them up over space and time.',
        clear: true,
        actions: slideRecap.actions,
        items: slideRecap.items,
      }] : []),
      // Slide 6: thumbnail for the video (save it with the PNG button).
      {
        say: 'Thumbnail: press 💾 to save it (1920×1080 JPEG, under YouTube’s 2 MB limit).',
        clear: true,
        thumbnail: true,
        items: thumbItems,
      },
    ],
  });
})();
