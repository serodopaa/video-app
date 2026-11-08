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
      type: 'meter', id: 'psp', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 220, min: -90, max: -40,
      title: 'Membrane potential', upText: 'EPSP: depolarized (excitatory)', downText: 'IPSP: hyperpolarized (inhibitory)',
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

  // ---------- slide 2: spatial summation ----------
  // A zoomed-out neuron with three input neurons: two excitatory ones far out on the
  // dendrites and an inhibitory one at the base, right next to the axon hillock.
  // The neuron drawing and signal animations come from neuron.js (window.WB_SUMMATION).
  const slide2 = (() => {
    const W = window.WB_SUMMATION;
    if (!W) return null;
    const { fire, actionPotential, hillockPt, inputs, INH, EXC, SPARK, label } = W;
    const AXH = 'axh'; // live value actionPotential() drives
    const spark = (t, r = 40) => ({ type: 'flash', x: hillockPt[0], y: hillockPt[1], r, color: SPARK, duration: 0.5, at: t });
    const verdict = (text, color, t) => ({ type: 'text', x: 600, y: 400, text, size: 26, font: 'sans', bold: true, color, anim: 'pop', duration: 0.4, at: t, until: t + 1.6 });
    const v = (from, to, at, duration) => ({ type: 'value', id: AXH, from, to, at, duration });
    const actions = [
      { // one excitatory input: a small bump, nowhere near threshold
        id: 'one', label: 'Fire one excitatory (E1)',
        items: [...fire('E1', 0), spark(1.75, 26), v(REST, -62, 1.6, 0.5), v(-62, REST, 2.5, 1.8),
          verdict('Not enough: stays below threshold', '#5b6270', 2.0)],
      },
      { // both excitatory inputs add up and reach threshold
        id: 'two', label: 'Fire both excitatory (E1 + E2)',
        items: [...fire('E1', 0), ...fire('E2', 0), spark(1.75), v(REST, -50, 1.6, 0.45), ...actionPotential(2.05)],
      },
      { // the inhibitory input pulls the sum back below threshold
        id: 'all', label: 'Fire all three (E1 + E2 + I)',
        items: [...fire('E1', 0), ...fire('E2', 0), ...fire('I', 0.75, { travel: 0.6 }),
          { type: 'pulse', x: inputs.I.p[0], y: inputs.I.p[1], r: 26, color: INH.nt, speed: 1.2, at: 1.0, until: 2.4 },
          spark(1.75), { type: 'flash', x: hillockPt[0], y: hillockPt[1], r: 52, color: INH.nt, duration: 0.8, at: 1.9 },
          v(REST, -58, 1.6, 0.35), v(-58, -66, 1.95, 0.5), v(-66, REST, 2.45, 1.8),
          verdict('Blocked: no action potential', INH.edge, 2.0)],
      },
    ];
    const items = [
      title('Spatial summation'),
      { type: 'svg', svg: W.svgDoc(`<g transform="translate(${W.TX4} ${W.TY4}) scale(${W.K4})">${W.neuronMarkup(W.PURPLE, 'sum2', { releasing: false })}</g>`) },
      { type: 'svg', svg: W.terminalsSvg },
      { type: 'circle', x: hillockPt[0], y: hillockPt[1], r: 42, color: W.AP, width: 3, dashed: true, rough: false },
      ...label('Axon hillock\n(adds up all the inputs)', 640, 290, [600, 340], [hillockPt[0] + 12, hillockPt[1] - 30], 'center', 28),
      ...Object.entries(inputs).map(([name, s]) => ({
        type: 'text', x: s.c[0] + (s.dir[0] < 0 ? -36 : 36), y: s.c[1], text: name,
        size: 26, font: 'sans', bold: true, color: s.st.edge, align: s.dir[0] < 0 ? 'right' : 'left',
      })),
      { type: 'text', x: 520, y: 640, text: 'Inhibitory synapse,\nright next to the\naxon hillock', size: 24, font: 'sans', color: INH.edge },
      {
        type: 'meter', id: AXH, value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 250,
        title: 'Axon hillock potential', upText: 'Closer to threshold', downText: 'Pushed away from threshold',
        fireText: 'Action potential fired!',
      },
      { type: 'text', x: 1375, y: 650, text: 'Reach −55 mV at the\naxon hillock and the\nneuron fires', size: 24, font: 'sans', color: '#3b4252', align: 'center' },
      { type: 'circle', x: 1232, y: 790, r: 13, color: EXC.edge, fill: EXC.fill, fillOpacity: 1, width: 3, rough: false },
      { type: 'text', x: 1256, y: 790, text: 'E1, E2: excitatory', size: 21, font: 'sans', color: 'ink' },
      { type: 'circle', x: 1232, y: 828, r: 13, color: INH.edge, fill: INH.fill, fillOpacity: 1, width: 3, rough: false },
      { type: 'text', x: 1256, y: 828, text: 'I: inhibitory', size: 21, font: 'sans', color: 'ink' },
    ];
    return { actions, items };
  })();

  // ---------- slide 3: temporal summation ----------
  // The same neuron, but only E1 is active: it fires 1, 2 or 3 times in quick succession.
  // Each EPSP fades on its own, so only when they pile up does the hillock reach -55 mV.
  const slide3 = (() => {
    const W = window.WB_SUMMATION;
    if (!W) return null;
    const { fire, actionPotential, hillockPt, inputs, EXC, SPARK, label } = W;
    const e1 = inputs.E1;
    const GAP = 1.2;              // seconds between firings
    const ARRIVE = 1.8;           // a firing at t reaches the hillock at t + ARRIVE (fire() travel time)
    const PEAKS = [-62, -57, -50];   // hillock potential right after the 1st, 2nd, 3rd EPSP arrives
    const FADED = [-65, -62];        // how far each EPSP has faded by the time the next one arrives
    const ORD = ['1st', '2nd', '3rd'];
    const v = (from, to, at, duration) => ({ type: 'value', id: 'axh', from, to, at, duration });
    const pop = (text, color, at, until, x = e1.c[0] + 46, y = e1.c[1], align = 'left', size = 28) =>
      ({ type: 'text', x, y, text, size, font: 'sans', bold: true, color, align, anim: 'pop', duration: 0.3, at, until });
    const repeated = (n) => {
      const items = [];
      let level = REST;
      for (let k = 0; k < n; k++) {
        const t = k * GAP, a = t + ARRIVE;
        items.push(...fire('E1', t), pop(`${ORD[k]} firing`, EXC.edge, t, t + GAP - 0.05));
        items.push({ type: 'flash', x: hillockPt[0], y: hillockPt[1], r: 26 + 6 * k, color: SPARK, duration: 0.5, at: a });
        items.push(v(level, PEAKS[k], a - 0.2, 0.4));        // this EPSP arrives and adds on top of what is left
        if (k < n - 1) { items.push(v(PEAKS[k], FADED[k], a + 0.2, GAP - 0.5)); level = FADED[k]; }
      }
      const last = (n - 1) * GAP + ARRIVE;
      if (n === 3) {
        items.push(pop('Piled up past −55 mV!', '#e0453a', last + 0.1, last + 3.5, 860, 545, 'center', 26), ...actionPotential(last + 0.25));
      } else {
        items.push(v(PEAKS[n - 1], REST, last + 0.4, 2.4),
          pop(n === 1 ? 'Fades away. Not enough.' : 'Closer, but still below threshold', '#5b6270', last + 0.3, last + 3.2, 860, 545, 'center', 26));
      }
      return items;
    };
    const actions = [
      { id: 'r1', label: 'Fire 1 time', items: repeated(1) },
      { id: 'r2', label: 'Fire 2 times', items: repeated(2) },
      { id: 'r3', label: 'Fire 3 times', items: repeated(3) },
    ];
    const terminal = `<g filter="url(#sh3)">
      <path d="M${e1.c.map(f1)} L${e1.axonEnd.map(f1)}" stroke="${EXC.edge}" stroke-width="16" stroke-linecap="round"/>
      <path d="M${e1.c.map(f1)} L${e1.axonEnd.map(f1)}" stroke="${EXC.fill}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="${f1(e1.c[0])}" cy="${f1(e1.c[1])}" r="21" fill="${EXC.edge}"/>
      <circle cx="${f1(e1.c[0])}" cy="${f1(e1.c[1])}" r="18" fill="${EXC.fill}"/>
      ${[[-6, -5], [6, -4], [0, 6]].map(([a, b]) => `<circle cx="${f1(e1.c[0] + a)}" cy="${f1(e1.c[1] + b)}" r="3.2" fill="${EXC.nt}"/>`).join('')}</g>`;
    const items = [
      title('Temporal summation'),
      { type: 'svg', svg: W.svgDoc(`<defs><filter id="sh3" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#13294a" flood-opacity="0.25"/></filter></defs>
        <g transform="translate(${W.TX4} ${W.TY4}) scale(${W.K4})">${W.neuronMarkup(W.PURPLE, 'sum3', { releasing: false })}</g>${terminal}`) },
      { type: 'circle', x: hillockPt[0], y: hillockPt[1], r: 42, color: W.AP, width: 3, dashed: true, rough: false },
      ...label('Axon hillock\n(adds up the signals)', 640, 290, [600, 340], [hillockPt[0] + 12, hillockPt[1] - 30], 'center', 28),
      { type: 'text', x: e1.c[0] - 36, y: e1.c[1], text: 'E1', size: 26, font: 'sans', bold: true, color: EXC.edge, align: 'right' },
      { type: 'text', x: 520, y: 640, text: 'One excitatory neuron,\nfiring again and again', size: 26, font: 'sans', color: EXC.edge },
      {
        type: 'meter', id: 'axh', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 250,
        title: 'Axon hillock potential', upText: 'Closer to threshold', downText: 'Pushed away from threshold',
        fireText: 'Action potential fired!',
      },
      { type: 'text', x: 1375, y: 650, text: 'Each EPSP fades fast.\nOne that arrives before the\nlast has faded adds on top.', size: 22, font: 'sans', color: '#3b4252', align: 'center' },
      { type: 'text', x: 1375, y: 770, text: 'Reach −55 mV and\nthe neuron fires', size: 22, font: 'sans', bold: true, color: '#e0453a', align: 'center' },
    ];
    return { actions, items };
  })();

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
      // Slide 2: spatial summation - three inputs add up (or cancel) at the axon hillock.
      ...(slide2 ? [{
        say: 'Inputs add up at the axon hillock: one excitatory input is not enough, two reach threshold, and the nearby inhibitory input blocks it.',
        clear: true,
        actions: slide2.actions,
        items: slide2.items,
      }] : []),
      // Slide 3: temporal summation - the same excitatory neuron firing 1, 2, then 3 times in a row.
      ...(slide3 ? [{
        say: 'Each EPSP fades quickly, but if the same neuron fires again before it has faded, the EPSPs add up: three in a row reach threshold.',
        clear: true,
        actions: slide3.actions,
        items: slide3.items,
      }] : []),
    ],
  });
})();
