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
    // Extra button: an inhibitory input far out on a dendrite. By the time its IPSP reaches the
    // hillock it has faded, so the two excitatory inputs still win. The terminal only appears
    // while this button plays (it is part of the action).
    const S4 = ([x, y]) => [x * W.K4 + W.TX4, y * W.K4 + W.TY4];
    const farTip = S4([172, 790]);
    const farDir = (() => { const l = Math.hypot(-0.2, 1); return [-0.2 / l, 1 / l]; })();
    const farC = [farTip[0] + farDir[0] * 30, farTip[1] + farDir[1] * 30];
    const farEnd = [farTip[0] + farDir[0] * 300, farTip[1] + farDir[1] * 300];
    const farRoute = [[172, 790], [190, 735], [220, 650], [270, 600], [320, 535], [380, 470], [478, 470]].map(S4);
    const farSvg = W.svgDoc(`<path d="M${farC.map(f1)} L${farEnd.map(f1)}" stroke="${INH.edge}" stroke-width="16" stroke-linecap="round"/>
      <path d="M${farC.map(f1)} L${farEnd.map(f1)}" stroke="${INH.fill}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="${f1(farC[0])}" cy="${f1(farC[1])}" r="21" fill="${INH.edge}"/><circle cx="${f1(farC[0])}" cy="${f1(farC[1])}" r="18" fill="${INH.fill}"/>
      ${[[-6, -5], [6, -4], [0, 6]].map(([a, b]) => `<circle cx="${f1(farC[0] + a)}" cy="${f1(farC[1] + b)}" r="3.2" fill="${INH.nt}"/>`).join('')}`);
    actions.push({
      id: 'farI', label: 'E1 + E2 + inhibition far away',
      items: [
        { type: 'svg', svg: farSvg },
        { type: 'text', x: farC[0] + 30, y: farC[1] + 52, text: 'I (far away)', size: 24, font: 'sans', bold: true, color: INH.edge },
        ...fire('E1', 0), ...fire('E2', 0),
        { type: 'flash', x: farC[0], y: farC[1], r: 30, color: INH.nt, duration: 0.5, at: 0 },
        { type: 'flash', x: farTip[0], y: farTip[1], r: 22, color: INH.nt, duration: 0.6, at: 0.3 },
        { type: 'mover', once: true, vanish: true, r: 5, color: INH.nt, smooth: true, path: farRoute, duration: 1.4, at: 0.4 },
        spark(1.75), v(REST, -52, 1.6, 0.45), ...actionPotential(2.05),
        { type: 'text', x: 900, y: 560, text: 'Far-away inhibition fades before\nit arrives: it still fires!', size: 24, font: 'sans', bold: true, color: INH.edge, align: 'center', anim: 'pop', duration: 0.4, at: 2.2, until: 4.5 },
      ],
    });
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
    const SPREAD = 2.6;           // gap when the firings are spread far apart
    const repeated = (n, spread = false) => {
      const items = [];
      let level = REST;
      const gap = spread ? SPREAD : GAP;
      for (let k = 0; k < n; k++) {
        const t = k * gap, a = t + ARRIVE;
        items.push(...fire('E1', t), pop(`${ORD[k]} firing`, EXC.edge, t, t + gap - 0.05));
        items.push({ type: 'flash', x: hillockPt[0], y: hillockPt[1], r: 26 + (spread ? 0 : 6 * k), color: SPARK, duration: 0.5, at: a });
        if (spread) {
          // each EPSP fades completely before the next one arrives, so nothing adds up
          items.push(v(REST, PEAKS[0], a - 0.2, 0.4), v(PEAKS[0], REST, a + 0.2, 2.0));
          continue;
        }
        items.push(v(level, PEAKS[k], a - 0.2, 0.4));        // this EPSP arrives and adds on top of what is left
        if (k < n - 1) { items.push(v(PEAKS[k], FADED[k], a + 0.2, GAP - 0.5)); level = FADED[k]; }
      }
      const last = (n - 1) * gap + ARRIVE;
      if (spread) {
        items.push(pop('Too slow: each EPSP faded\nbefore the next one arrived', '#5b6270', last + 0.5, last + 3.5, 860, 545, 'center', 24));
      } else if (n === 3) {
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
      { id: 'r3s', label: 'Fire 3 times, spread apart', items: repeated(3, true) },
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

  // ---------- why they add up: graded potentials shrink with distance ----------
  const slideWhy = (() => {
    const W = window.WB_SUMMATION;
    if (!W) return null;
    const { EXC, label, SPARK } = W;
    const Y = 450, XA = 250, XB = 720, XH = 1070;      // dendrite height; far input, near input, axon hillock
    const bulb = (x) => `<path d="M${x} 390 L${x} 110" stroke="${EXC.edge}" stroke-width="16" stroke-linecap="round"/>
      <path d="M${x} 390 L${x} 110" stroke="${EXC.fill}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="${x}" cy="390" r="21" fill="${EXC.edge}"/><circle cx="${x}" cy="390" r="18" fill="${EXC.fill}"/>
      ${[[-6, -5], [6, -4], [0, 6]].map(([a, b]) => `<circle cx="${x + a}" cy="${390 + b}" r="3.2" fill="${EXC.nt}"/>`).join('')}`;
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
        ${bulb(XA)}${bulb(XB)}
      </g>`);
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
          { type: 'flash', x, y: Y, r: 10 + vals[i] * 3.2, color: SPARK, duration: 0.7, at: times[i] },
          { type: 'line', from: [x, 478], to: [x, 568], color: '#8a8f98', width: 2, dashed: true, rough: false, at: times[i] },
          { type: 'text', x, y: 590, text: caps[i], size: 20, font: 'sans', color: '#5b6270', align: 'center', anim: 'pop', duration: 0.3, at: times[i] },
          { type: 'text', x, y: 630, text: `+${vals[i]} mV`, size: 36, font: 'sans', bold: true, color: '#e8890c', align: 'center', anim: 'pop', duration: 0.3, at: times[i] },
        ]),
        { type: 'value', id: 'axh', from: REST, to: peak, at: times[2] - 0.2, duration: 0.5 },
        { type: 'value', id: 'axh', from: peak, to: REST, at: times[2] + 0.5, duration: 2.0 },
        { type: 'text', x: 600, y: 720, text: verdict, size: 26, font: 'sans', bold: true, color: EXC.edge, align: 'center', anim: 'pop', duration: 0.4, at: times[2] + 0.3, until: times[2] + 4 },
      ];
    };
    const actions = [
      { id: 'far', label: 'Fire the far input (A)', items: run({ xs: XA, dur: 2.4, vals: [10, 5, 2], peak: -68, verdict: 'Far away: most of it fades on the way.' }) },
      { id: 'near', label: 'Fire the near input (B)', items: run({ xs: XB, dur: 1.6, vals: [10, 9, 8], peak: -62, verdict: 'Close by: much more of it arrives.' }) },
    ];
    const items = [
      title('Why do inputs add up?'),
      { type: 'svg', svg },
      { type: 'text', x: XA - 36, y: 390, text: 'A', size: 30, font: 'sans', bold: true, color: EXC.edge, align: 'right' },
      { type: 'text', x: XB - 36, y: 390, text: 'B', size: 30, font: 'sans', bold: true, color: EXC.edge, align: 'right' },
      ...label('Dendrite', 140, 340, [150, 362], [160, Y - 14], 'center', 26),
      ...label('Cell body', 950, 290, [950, 312], [950, 358], 'center', 26),
      { type: 'circle', x: XH, y: Y, r: 34, color: W.AP, width: 3, dashed: true, rough: false },
      ...label('Axon hillock', 1090, 330, [1080, 352], [XH + 6, Y - 32], 'center', 26),
      { type: 'text', x: 600, y: 800, text: 'An EPSP or IPSP is a graded potential: it gets smaller the farther it travels\nand fades away over time. That is why the location and timing of inputs matter.', size: 22, font: 'sans', color: '#3b4252', align: 'center' },
      {
        type: 'meter', id: 'axh', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 250,
        title: 'Axon hillock potential', upText: 'Closer to threshold', downText: 'Pushed away from threshold',
        fireText: 'Action potential fired!',
      },
      { type: 'text', x: 1375, y: 650, text: 'Both inputs start with\nthe same size EPSP.\nOnly part of it reaches\nthe hillock.', size: 22, font: 'sans', color: '#3b4252', align: 'center' },
    ];
    return { actions, items };
  })();

  // ---------- recap ----------
  const slideRecap = (() => {
    const W = window.WB_SUMMATION;
    if (!W) return null;
    const { EXC, INH } = W;
    const row = (y, color, name, desc) => [
      { type: 'circle', x: 100, y, r: 20, color: color[0], fill: color[1], fillOpacity: 1, width: 3, rough: false },
      { type: 'text', x: 146, y, text: name, size: 34, font: 'sans', bold: true, color: 'ink' },
      { type: 'text', x: 146, y: y + 44, text: desc, size: 24, font: 'sans', color: '#5b6270' },
    ];
    const lab = (text, color, at, until) => ({ type: 'text', x: 1375, y: 660, text, size: 24, font: 'sans', bold: true, color, align: 'center', anim: 'pop', duration: 0.3, at, until });
    const v = (from, to, at, duration) => ({ type: 'value', id: 'rec', from, to, at, duration });
    const actions = [{
      id: 'seq', label: 'Add it up: one at a time',
      items: [
        v(REST, -63, 0.3, 0.4), v(-63, REST, 0.8, 1.2), lab('EPSP: up', '#e8890c', 0.3, 2.2),
        v(REST, -76, 2.6, 0.4), v(-76, REST, 3.1, 1.2), lab('IPSP: down', '#2f6fde', 2.6, 4.4),
        v(REST, -62, 4.6, 0.4), v(-62, -65, 5.0, 0.7), v(-65, -57, 5.7, 0.4), v(-57, -62, 6.1, 0.7), v(-62, -50, 6.8, 0.4),
        v(-50, 30, 7.2, 0.25), v(30, -80, 7.45, 0.55), v(-80, REST, 8.0, 1.8),
        lab('Three EPSPs in\nquick succession:\nthreshold reached!', '#e0453a', 4.7, 9.0),
      ],
    }];
    const items = [
      title('Putting it together'),
      ...row(190, [EXC.edge, EXC.fill], 'Excitatory input (EPSP)', 'Glutamate opens Na⁺ channels: the potential moves up, toward −55 mV.'),
      ...row(320, [INH.edge, INH.fill], 'Inhibitory input (IPSP)', 'GABA opens Cl⁻ channels: the potential moves down, away from threshold.'),
      ...row(450, ['#5e2f78', '#c69ad8'], 'Spatial summation', 'Inputs from different places add up at the axon hillock.\nInhibition close to the hillock is the strongest.'),
      ...row(600, ['#2c5a92', '#9cc0ea'], 'Temporal summation', 'Inputs close together in time add up before they fade.'),
      ...row(730, ['#b3261e', '#ff8a7a'], 'The axon hillock decides', 'If the total reaches −55 mV, an action potential fires.'),
      {
        type: 'meter', id: 'rec', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 250,
        title: 'Axon hillock potential', upText: 'Closer to threshold', downText: 'Pushed away from threshold',
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
      // Slide 3: why inputs add up - an EPSP shrinks with distance and fades with time.
      ...(slideWhy ? [{
        say: 'An EPSP is a graded potential: it shrinks as it travels along the dendrite, so inputs closer to the hillock count for more.',
        clear: true,
        actions: slideWhy.actions,
        items: slideWhy.items,
      }] : []),
      // Slide 4: spatial summation - three inputs add up (or cancel) at the axon hillock.
      ...(slide2 ? [{
        say: 'Inputs add up at the axon hillock: one excitatory input is not enough, two reach threshold, and the nearby inhibitory input blocks it.',
        clear: true,
        actions: slide2.actions,
        items: slide2.items,
      }] : []),
      // Slide 5: temporal summation - the same excitatory neuron firing 1, 2, then 3 times in a row.
      ...(slide3 ? [{
        say: 'Each EPSP fades quickly, but if the same neuron fires again before it has faded, the EPSPs add up: three in a row reach threshold.',
        clear: true,
        actions: slide3.actions,
        items: slide3.items,
      }] : []),
      // Slide 6: recap.
      ...(slideRecap ? [{
        say: 'Excitatory inputs push toward threshold, inhibitory inputs push away, and the axon hillock adds them up over space and time.',
        clear: true,
        actions: slideRecap.actions,
        items: slideRecap.items,
      }] : []),
      // Slide 7: thumbnail for the video (save it with the PNG button).
      {
        say: 'Thumbnail: press 💾 to save it (1920×1080 JPEG, under YouTube’s 2 MB limit).',
        clear: true,
        thumbnail: true,
        items: thumbItems,
      },
    ],
  });
})();
