// Explainer: how a neuron works. Built slide by slide with the user.
// The user does the drawing; these visuals simply appear (drawn: false).
// Colour code used on every slide: purple = the receiving neuron (the one
// whose dendrites we're studying), blue/other colours = neurons sending to it.
// Board is 1600 x 900. See CLAUDE.md for every item type.
(() => {
  const f1 = (v) => v.toFixed(1);
  const svgDoc = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">${inner}</svg>`;

  // ---------- colour palettes ----------
  const PURPLE = {
    outline: '#5e2f78', fill: '#c69ad8', s0: '#f3e6f8', s1: '#d4afe2', s2: '#ad78c6',
    n0: '#a274bd', n1: '#5a2b75', nStroke: '#4a2062', nl: '#3a1650', b0: '#f1e1f7', b1: '#b47fcb',
    a0: '#e2c8ec', a1: '#b783cc', shine: '#f6ecfa', gran: '#7c4797', shadow: '#3b1452',
  };
  const BLUE = {
    outline: '#2c5a92', fill: '#8fb6e6', s0: '#eef5fd', s1: '#bcd5f2', s2: '#7aa5dc',
    n0: '#6f9fd8', n1: '#24508a', nStroke: '#1d3f6e', nl: '#14325a', b0: '#e3eefb', b1: '#6f9fd8',
    a0: '#cfe1f7', a1: '#86afe2', shine: '#f2f7fd', gran: '#2c5a92', shadow: '#13294a',
  };

  // ---------- realistic whole neuron (board coordinates, ~x 65-1430, y 125-830) ----------
  // Dendrite tree: [path, thickness]. Trunks leave the cell body and split
  // into branches and twigs. Paths run from the cell body outward.
  const trunks = [
    ['M340 400 Q300 330 255 280', 20],
    ['M310 440 Q230 420 170 380', 20],
    ['M300 485 Q220 500 150 505', 18],
    ['M320 535 Q270 600 220 650', 20],
    ['M365 560 Q360 640 330 710', 18],
    ['M400 380 Q410 310 390 250', 18],
  ];
  const branchesN = [
    ['M255 280 Q215 245 170 240', 11], ['M255 280 Q250 225 230 190', 10],
    ['M170 380 Q130 350 95 345', 10], ['M170 380 Q140 400 105 420', 10],
    ['M150 505 Q110 480 80 470', 9], ['M150 505 Q110 530 85 555', 10],
    ['M220 650 Q180 670 140 668', 10], ['M220 650 Q215 700 190 735', 10],
    ['M330 710 Q300 750 285 790', 10], ['M330 710 Q360 755 385 780', 9],
    ['M390 250 Q360 210 345 175', 10], ['M390 250 Q420 210 455 195', 10],
  ];
  const twigs = [
    ['M170 240 Q145 225 120 228', 5], ['M170 240 Q150 258 128 272', 5],
    ['M230 190 Q222 168 228 145', 5], ['M345 175 Q330 150 332 125', 5],
    ['M455 195 Q482 180 505 186', 5], ['M95 345 Q75 330 66 312', 5],
    ['M105 420 Q82 425 66 442', 5], ['M85 555 Q70 575 70 598', 5],
    ['M140 668 Q115 660 95 672', 5], ['M190 735 Q176 760 172 790', 5],
    ['M285 790 Q268 815 248 828', 5], ['M385 780 Q405 805 428 814', 5],
  ];
  const dendrites = [...trunks, ...branchesN, ...twigs];
  const axonPath = 'M535 470 C700 452 850 492 1000 468 S1180 474 1240 470';
  // Sample the axon so things can be placed along it by distance from the cell body.
  const axonSegs = [
    [[535, 470], [700, 452], [850, 492], [1000, 468]],
    [[1000, 468], [1150, 444], [1180, 474], [1240, 470]], // 'S' = mirrored first control point
  ];
  const axonSamples = [];
  axonSegs.forEach(([a, b, c, d], si) => {
    for (let i = si ? 1 : 0; i <= 120; i++) {
      const t = i / 120, u = 1 - t;
      axonSamples.push([0, 1].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]));
    }
  });
  const axonLen = [0];
  for (let i = 1; i < axonSamples.length; i++) {
    axonLen.push(axonLen[i - 1] + Math.hypot(axonSamples[i][0] - axonSamples[i - 1][0], axonSamples[i][1] - axonSamples[i - 1][1]));
  }
  const axonPointsBetween = (from, to) => axonSamples.filter((_, i) => axonLen[i] >= from && axonLen[i] <= to);
  const axonAt = (d) => axonSamples[Math.max(0, axonLen.findIndex((l) => l >= d))];

  // Myelin sheath: insulating wraps along the axon, with small gaps between
  // them (nodes of Ranvier). The start of the axon and its very end are bare.
  // Lengths are what you see (rounded ends included), in px along the axon.
  const SHEATH_START = 90, SHEATH_LEN = 117, NODE_GAP = 36, SHEATH_CAP = 19; // cap = half the sheath thickness
  const sheaths = [0, 1, 2, 3].map((i) => {
    const a = SHEATH_START + i * (SHEATH_LEN + NODE_GAP) + SHEATH_CAP;
    const b = a + SHEATH_LEN - 2 * SHEATH_CAP;
    return { a, b, pts: axonPointsBetween(a, b) };
  });
  const polyD = (pts) => 'M' + pts.map((p) => p.map(f1).join(',')).join(' L');
  const myelinMarkup = sheaths.map(({ pts }) =>
    `<path d="${polyD(pts)}" stroke="#a9802f" stroke-width="38" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${polyD(pts)}" stroke="#f5e4b8" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${polyD(pts.map(([x, y]) => [x, y - 7]))}" stroke="#fffaf0" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.8"/>` +
    `<path d="${polyD(pts.map(([x, y]) => [x, y + 8]))}" stroke="#e2c98a" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>`).join('');
  const nodeOfRanvier = axonAt((sheaths[2].b + sheaths[3].a) / 2);

  // A single axon terminal: a rounded bulb at the end of the axon, packed
  // with vesicles full of neurotransmitters. One vesicle is releasing them.
  const terminal = { x: 1290, y: 470 };
  const terminalD = 'M1228 462 C1248 457 1252 418 1290 416 C1328 414 1348 444 1348 470 C1348 496 1328 526 1290 524 C1252 522 1248 483 1228 478 Z';
  const vesiclePts = [[1268, 447], [1297, 438], [1324, 452], [1282, 473], [1311, 479], [1266, 499], [1296, 505], [1324, 498]];
  // opts.skip: vesicle indexes drawn elsewhere (e.g. animated); opts.releasing: show one releasing.
  const vesicleMarkup = (P, opts = {}) => vesiclePts.filter((_, i) => !(opts.skip || []).includes(i)).map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="11" fill="#ffffff" fill-opacity="0.85" stroke="${P.outline}" stroke-width="2"/>` +
    [[-4, -3], [4, -2], [0, 4]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="2.6" fill="#f08c1a"/>`).join('')).join('') +
    // vesicle fusing with the membrane at the tip, spilling neurotransmitters out
    (opts.releasing === false ? '' :
      `<circle cx="1336" cy="470" r="10" fill="#ffffff" fill-opacity="0.85" stroke="${P.outline}" stroke-width="2"/>` +
      [[1352, 462], [1358, 474], [1351, 482], [1364, 466]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#f08c1a"/>`).join(''));

  const soma = { x: 380, y: 470 };
  const somaPts = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r = 84 + 5 * Math.sin(3 * a + 0.5) + 3 * Math.cos(5 * a);
    somaPts.push(`${f1(soma.x + Math.cos(a) * r)},${f1(soma.y + Math.sin(a) * r)}`);
  }
  const somaD = `M${somaPts.join(' L')} Z`;
  const hillockD = 'M448 425 Q492 456 540 462 L540 478 Q492 486 448 517 Z';
  const granulePts = [[340, 430], [420, 420], [430, 510], [345, 515], [400, 535], [320, 470], [445, 465], [365, 410]];

  const strokes = (list, color, extra) => list
    .map(([d, w]) => `<path d="${d}" stroke="${color}" stroke-width="${w + extra}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');

  // One neuron as SVG markup. `id` keeps gradient ids unique when several
  // neurons share one picture.
  function neuronMarkup(P, id, opts = {}) {
    return `<defs>
    <radialGradient id="somaG-${id}" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="${P.s0}"/><stop offset="0.55" stop-color="${P.s1}"/><stop offset="1" stop-color="${P.s2}"/>
    </radialGradient>
    <radialGradient id="nucG-${id}" cx="38%" cy="35%" r="70%">
      <stop offset="0" stop-color="${P.n0}"/><stop offset="1" stop-color="${P.n1}"/>
    </radialGradient>
    <radialGradient id="boutonG-${id}" cx="40%" cy="35%" r="75%">
      <stop offset="0" stop-color="${P.b0}"/><stop offset="1" stop-color="${P.b1}"/>
    </radialGradient>
    <linearGradient id="axonG-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.a0}"/><stop offset="1" stop-color="${P.a1}"/>
    </linearGradient>
    <filter id="shadow-${id}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="${P.shadow}" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g filter="url(#shadow-${id})">
    ${strokes(dendrites, P.outline, 5)}
    <path d="${axonPath}" stroke="${P.outline}" stroke-width="19" fill="none" stroke-linecap="round"/>
    <path d="${hillockD}" fill="${P.outline}" stroke="${P.outline}" stroke-width="6" stroke-linejoin="round"/>
    <path d="${somaD}" fill="${P.outline}" stroke="${P.outline}" stroke-width="6" stroke-linejoin="round"/>
    <path d="${terminalD}" fill="${P.outline}" stroke="${P.outline}" stroke-width="6" stroke-linejoin="round"/>
    ${strokes(dendrites, P.fill, 0)}
    <path d="${axonPath}" stroke="url(#axonG-${id})" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="${hillockD}" fill="${P.fill}"/>
    <path d="${somaD}" fill="url(#somaG-${id})"/>
    <path d="${terminalD}" fill="url(#boutonG-${id})"/>
  </g>
  <path d="${axonPath}" transform="translate(0,-3)" stroke="${P.shine}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
  <g filter="url(#shadow-${id})">${myelinMarkup}</g>
  ${vesicleMarkup(P, opts)}
  ${granulePts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${P.gran}" opacity="0.45"/>`).join('')}
  <circle cx="${soma.x}" cy="${soma.y}" r="32" fill="url(#nucG-${id})" stroke="${P.nStroke}" stroke-width="2"/>
  <circle cx="${soma.x + 8}" cy="${soma.y - 6}" r="9" fill="${P.nl}"/>
  <ellipse cx="${soma.x - 10}" cy="${soma.y - 12}" rx="9" ry="5" fill="#ffffff" opacity="0.25"/>`;
  }

  // ---------- labels ----------
  const DARK = '#3b4252';
  // Textbook-style label: clean text with a thin leader line ending in a dot.
  const label = (text, x, y, lineFrom, target, align = 'center', size = 36) => [
    { type: 'text', x, y, text, size, font: 'sans', color: 'ink', align },
    { type: 'line', from: lineFrom, to: target, color: DARK, width: 2.5, rough: false },
    { type: 'circle', x: target[0], y: target[1], r: 5, color: DARK, width: 2, fill: DARK, fillOpacity: 1, rough: false },
  ];
  const title = (text) => ({ type: 'text', x: 800, y: 66, text, size: 56, font: 'sans', bold: true, align: 'center', color: 'ink' });
  const note = (text, x, y, align = 'center', color = '#5b6270') => ({ type: 'text', x, y, text, size: 28, font: 'sans', color, align });
  const SIGNAL = '#e8890c'; // colour for signal arrows and moving signals
  const signalArrow = (from, to, bend = 0) => ({ type: 'arrow', from, to, bend, color: SIGNAL, width: 7, rough: false });

  // ---------- slide 2: membrane potential ----------
  // A close-up of the membrane: outside above, inside below, ions on both sides,
  // three ligand-gated channels, and a live membrane-potential readout.
  const MEM = { x0: 60, x1: 1110, top: 410, bot: 500, mid: 455 };
  const CH = { na: 330, k: 620, cl: 910 }; // channel x positions
  const CH_STYLE = {
    na: { fill: '#f8cf8f', edge: '#a8640a', label: 'Na⁺ channel' },
    k: { fill: '#c3b3f2', edge: '#47309a', label: 'K⁺ channel' },
    cl: { fill: '#a6dfbc', edge: '#1d6a3c', label: 'Cl⁻ channel' },
  };
  const bilayer = (() => {
    let out = '';
    for (let x = MEM.x0 + 10; x <= MEM.x1 - 8; x += 20) {
      // phospholipids: a head on each surface with two tails pointing inward
      for (const [hy, t0, t1] of [[MEM.top + 8, MEM.top + 17, MEM.mid - 3], [MEM.bot - 8, MEM.bot - 17, MEM.mid + 3]]) {
        const d = (t1 - t0) / 2;
        out += `<path d="M${x - 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d} M${x + 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d}" stroke="#c99a62" stroke-width="2" fill="none"/>`;
        out += `<circle cx="${x}" cy="${hy}" r="9" fill="#f4c995" stroke="#b67d3c" stroke-width="2"/>`;
      }
    }
    return out;
  })();
  const PUMP_X = 470, K_LEAK = [160, 1040], NA_LEAK = 765;
  const membraneSvg = svgDoc(`
  <rect x="${MEM.x0}" y="112" width="${MEM.x1 - MEM.x0}" height="${MEM.top - 112}" rx="16" fill="#eef6fd"/>
  <rect x="${MEM.x0}" y="${MEM.bot}" width="${MEM.x1 - MEM.x0}" height="${860 - MEM.bot}" rx="16" fill="#f7f0fb"/>
  <rect x="${MEM.x0}" y="${MEM.top}" width="${MEM.x1 - MEM.x0}" height="${MEM.bot - MEM.top}" fill="#fbecd6"/>
  ${bilayer}
  <rect x="${PUMP_X - 34}" y="${MEM.top - 22}" width="68" height="${MEM.bot - MEM.top + 44}" rx="22" fill="#f6d77d" stroke="#a07c00" stroke-width="3"/>
  <text x="${PUMP_X}" y="${MEM.mid + 6}" font-family="Arial, sans-serif" font-weight="700" font-size="15" fill="#7a5b00" text-anchor="middle">ATP</text>
  ${Array.from({ length: 15 }, (_, i) => MEM.x0 + 40 + i * 70).map((x) =>
    `<text x="${x}" y="${MEM.top - 7}" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#e0453a" text-anchor="middle">+</text>` +
    `<text x="${x}" y="${MEM.bot + 25}" font-family="Arial, sans-serif" font-weight="700" font-size="26" fill="#2f6fde" text-anchor="middle">−</text>`).join('')}
`);

  // Ions that stay put. [type, x, y]
  const staticIons = [
    // outside: lots of Na+ and Cl-, a little K+
    ['na', 140, 240], ['na', 240, 320], ['na', 445, 215], ['na', 525, 300], ['na', 700, 235], ['na', 820, 325],
    ['na', 1000, 225], ['na', 1080, 320], ['na', 610, 200],
    ['cl', 230, 205], ['cl', 120, 320], ['cl', 360, 210], ['cl', 700, 320], ['cl', 830, 215], ['cl', 1075, 205], ['cl', 1010, 335],
    ['k', 545, 372], ['k', 720, 378],
    // inside: lots of K+ and negative proteins (A-), a little Na+ and Cl-
    ['k', 140, 625], ['k', 230, 705], ['k', 445, 635], ['k', 520, 760], ['k', 760, 625], ['k', 840, 725],
    ['k', 1000, 630], ['k', 1060, 740], ['k', 330, 800], ['k', 680, 805],
    ['a', 120, 730], ['a', 420, 720], ['a', 770, 770], ['a', 1060, 640 - 0],
    ['na', 250, 805], ['na', 905, 800],
    ['cl', 590, 820], ['cl', 980, 805],
  ];
  // Ions that each channel lets through: [type, from, to].
  const flows = {
    na: [['na', [270, 350], [270, 620]], ['na', [395, 345], [385, 655]], ['na', [300, 262], [330, 705]]],
    k: [['k', [570, 625], [575, 365]], ['k', [680, 655], [670, 345]], ['k', [615, 720], [625, 270]]],
    cl: [['cl', [860, 345], [865, 630]], ['cl', [960, 350], [955, 690]], ['cl', [925, 262], [905, 760]]],
  };
  const throughPore = (x, from, to, inward) => (inward
    ? [from, [x, MEM.top - 50], [x, MEM.mid], [x, MEM.bot + 50], to]
    : [from, [x, MEM.bot + 50], [x, MEM.mid], [x, MEM.top - 50], to]);
  const REST = -70;
  // One button: a neurotransmitter binds, the channel opens, ions cross, the
  // potential moves to `peak`, the channel closes and the potential recovers.
  const channelAction = (kind, label, peak, inward) => {
    const x = CH[kind];
    const site = [x - 28, MEM.top - 22];
    return {
      id: `open-${kind}`,
      label,
      items: [
        { type: 'mover', once: true, r: 8, color: '#e8890c', smooth: true, path: [[x + 95, 190], [x + 40, 300], site], duration: 0.8, at: 0, until: 3.3 },
        { type: 'value', id: `ch-${kind}`, from: 0, to: 1, at: 0.8, duration: 0.35 },
        ...flows[kind].map(([ion, from, to], i) => ({
          type: 'ion', ion, smooth: true, path: throughPore(x, from, to, inward), duration: 1.4, at: 1.0 + i * 0.35,
        })),
        { type: 'value', id: 'vm', from: REST, to: peak, at: 1.2, duration: 1.9 },
        { type: 'mover', once: true, vanish: true, r: 8, color: '#e8890c', smooth: true, path: [site, [x + 40, 300], [x + 95, 190]], duration: 0.8, at: 3.3 },
        { type: 'value', id: `ch-${kind}`, from: 1, to: 0, at: 3.4, duration: 0.35 },
        { type: 'value', id: 'vm', from: peak, to: REST, at: 3.9, duration: 2.2 },
      ],
    };
  };

  // ---------- slide 2: why the resting potential is -70 mV ----------
  const E_ION = { na: 60, k: -90, cl: -75 };
  const ION_TEXT = { na: '#c46f00', k: '#47309a', cl: '#1d6a3c' };
  const EMARKS = [
    { v: E_ION.na, label: 'E(Na⁺) +60', color: '#c46f00', dy: 14 },
    { v: E_ION.cl, label: 'E(Cl⁻) −75', color: '#1d6a3c', dy: 12 },
    { v: E_ION.k, label: 'E(K⁺) −90', color: '#47309a', dy: 12 },
  ];
  const leakPath = (x, inward, from, to) => (inward
    ? [from, [x, MEM.top - 40], [x, MEM.mid], [x, MEM.bot + 40], to]
    : [from, [x, MEM.bot + 40], [x, MEM.mid], [x, MEM.top - 40], to]);
  const restingFlow = [
    // K+ leaks out all the time, through the always-open leak channels
    ...K_LEAK.flatMap((x) => [0, 1].map((k) => ({
      type: 'ion', ion: 'k', r: 15, smooth: true, loop: 3.2, phase: k * 1.6 + x / 400,
      path: leakPath(x, false, [x - 20, 640], [x + 30, 330]),
    }))),
    // a little Na+ leaks in
    { type: 'ion', ion: 'na', r: 15, smooth: true, loop: 6, phase: 1, path: leakPath(NA_LEAK, true, [NA_LEAK + 30, 300], [NA_LEAK - 20, 640]) },
    // the pump: Na+ out, K+ in
    ...[0, 1, 2].map((k) => ({ type: 'ion', ion: 'na', r: 13, smooth: true, loop: 4.5, phase: k * 0.5, path: leakPath(PUMP_X - 12, false, [PUMP_X - 40, 610], [PUMP_X - 50, 340]) })),
    ...[0, 1].map((k) => ({ type: 'ion', ion: 'k', r: 13, smooth: true, loop: 4.5, phase: 2.25 + k * 0.6, path: leakPath(PUMP_X + 12, true, [PUMP_X + 50, 340], [PUMP_X + 40, 610]) })),
  ];
  const caption = (text, at, until) => [
    { type: 'rect', x: 330, y: 120, w: 770, h: 66, color: '#3b4252', width: 2, fill: '#ffffff', fillOpacity: 0.95, rough: false, duration: 0.2, at, until },
    { type: 'text', x: 345, y: 140, text, size: 21, font: 'sans', color: 'ink', anim: 'fade', duration: 0.3, at: at + 0.1, until: until - 0.1 },
  ];
  const whyItems = [
    ...caption('Inside: lots of K⁺. Outside: lots of Na⁺ and Cl⁻.\nThe Na⁺/K⁺ pump keeps it that way (3 Na⁺ out, 2 K⁺ in).', 0, 2.8),
    { type: 'flash', x: PUMP_X, y: MEM.mid, r: 70, color: '#f5c518', duration: 0.9, at: 0.4 },
    ...caption('At rest, mostly K⁺ leak channels are open. K⁺ leaks out,\nleaving the inside negative: it heads for E(K⁺) = −90 mV.', 2.8, 5.6),
    ...K_LEAK.map((x) => ({ type: 'flash', x, y: MEM.mid, r: 60, color: '#7b5cd6', duration: 0.9, at: 3.0 })),
    { type: 'value', id: 'vm', from: REST, to: -90, at: 3.0, duration: 2.2 },
    ...caption('A little Na⁺ also leaks in, pulling it back up.\nThe balance point is the resting potential: −70 mV.', 5.6, 9.0),
    { type: 'flash', x: NA_LEAK, y: MEM.mid, r: 60, color: '#f0a12e', duration: 0.9, at: 5.8 },
    { type: 'value', id: 'vm', from: -90, to: REST, at: 5.8, duration: 2.2 },
  ];
  const membraneActions = [
    { id: 'why', label: 'Why −70 mV?', items: whyItems },
    channelAction('na', 'Open Na⁺ channel', -58, true),
    channelAction('k', 'Open K⁺ channel', -80, false),
    channelAction('cl', 'Open Cl⁻ channel', -74, true),
  ];
  const membraneItems = [
    title('Membrane potential'),
    { type: 'svg', svg: membraneSvg },
    { type: 'text', x: 80, y: 140, text: 'Outside the cell', size: 26, font: 'sans', color: '#2c5a92' },
    { type: 'text', x: 80, y: 838, text: 'Inside the cell', size: 26, font: 'sans', color: '#6b3c87' },
    ...staticIons.map(([ion, x, y]) => ({ type: 'ion', ion, x, y })),
    ...Object.entries(flows).flatMap(([kind, list]) => list.map(([ion, from]) => ({ type: 'ion', ion, x: from[0], y: from[1], hideDuring: `open-${kind}` }))),
    ...['na', 'k', 'cl'].map((kind) => ({ type: 'channel', id: `ch-${kind}`, x: CH[kind], y: MEM.mid, h: 130, ...CH_STYLE[kind] })),
    // always-open leak channels (mostly K+, a little Na+)
    ...K_LEAK.map((x) => ({ type: 'channel', plain: true, open: 1, x, y: MEM.mid, h: 110, ...CH_STYLE.k, label: undefined })),
    { type: 'channel', plain: true, open: 1, x: NA_LEAK, y: MEM.mid, h: 110, ...CH_STYLE.na, label: undefined },
    ...restingFlow,
    ...K_LEAK.map((x) => ({ type: 'text', x, y: 580, text: 'K⁺ leak', size: 19, font: 'sans', color: '#47309a', align: 'center' })),
    { type: 'text', x: NA_LEAK, y: 580, text: 'Na⁺ leak', size: 19, font: 'sans', color: '#a8640a', align: 'center' },
    { type: 'text', x: PUMP_X, y: 580, text: 'Na⁺/K⁺ pump', size: 19, font: 'sans', color: '#7a5b00', align: 'center' },
    {
      type: 'meter', id: 'vm', value: REST, x: 1150, y: 112, w: 410, h: 748, graphH: 330, min: -100, max: 65,
      marks: EMARKS,
    },
    { type: 'text', x: 1180, y: 668, text: 'Equilibrium potential', size: 19, font: 'sans', color: '#5b6270' },
    ...[['na', 'Sodium', '+60 mV'], ['k', 'Potassium', '−90 mV'], ['cl', 'Chloride', '−75 mV'], ['a', 'Proteins', 'can’t cross']].flatMap(([ion, name, e], i) => [
      { type: 'ion', ion, x: 1196, y: 702 + i * 42, r: ion === 'a' ? 18 : 16 },
      { type: 'text', x: 1226, y: 702 + i * 42, text: name, size: 23, font: 'sans', color: 'ink' },
      { type: 'text', x: 1540, y: 702 + i * 42, text: e, size: 23, font: 'sans', bold: true, color: ion === 'a' ? '#8a8f98' : ION_TEXT[ion], align: 'right' },
    ]),
  ];

  // ---------- slide 2: receiving (simple) ----------
  // An excitatory and an inhibitory axon terminal above one dendrite. Generic
  // + / − ions only: more + outside, more − inside. Each terminal has its own
  // receptor type on the dendrite.
  const MR = { x0: 60, x1: 1160, top: 470, bot: 540, mid: 505 };
  const RT = {
    exc: { x: 330, nt: '#f08c1a', ion: 'pos', ch: CH_STYLE.na, name: 'Excitatory', col: '#b05f00', peak: -60, recId: 'r2e' },
    inh: { x: 870, nt: '#16a3b8', ion: 'neg', ch: CH_STYLE.cl, name: 'Inhibitory', col: '#0b6f7e', peak: -75, recId: 'r2i' },
  };
  const bilayerR = (() => {
    let out = '';
    for (let x = MR.x0 + 10; x <= MR.x1 - 8; x += 20) {
      for (const [hy, t0, t1] of [[MR.top + 8, MR.top + 17, MR.mid - 3], [MR.bot - 8, MR.bot - 17, MR.mid + 3]]) {
        const d = (t1 - t0) / 2;
        out += `<path d="M${x - 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d} M${x + 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d}" stroke="#c99a62" stroke-width="2" fill="none"/>`;
        out += `<circle cx="${x}" cy="${hy}" r="9" fill="#f4c995" stroke="#b67d3c" stroke-width="2"/>`;
      }
    }
    return out;
  })();
  const termD = (cx) => `M${cx - 150} 300 C${cx - 150} 225 ${cx - 85} 195 ${cx} 195 C${cx + 85} 195 ${cx + 150} 225 ${cx + 150} 300 Q${cx + 150} 368 ${cx + 100} 372 L${cx - 100} 372 Q${cx - 150} 368 ${cx - 150} 300 Z`;
  const recvSvg = svgDoc(`<defs>
    <linearGradient id="preR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eefb"/><stop offset="1" stop-color="#9cc0ea"/></linearGradient>
    <filter id="shR" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#13294a" flood-opacity="0.2"/></filter>
  </defs>
  <rect x="${MR.x0}" y="112" width="${MR.x1 - MR.x0}" height="${MR.top - 112}" rx="16" fill="#eef6fd"/>
  <rect x="${MR.x0}" y="${MR.bot}" width="${MR.x1 - MR.x0}" height="${860 - MR.bot}" rx="16" fill="#f7f0fb"/>
  <rect x="${MR.x0}" y="${MR.top}" width="${MR.x1 - MR.x0}" height="${MR.bot - MR.top}" fill="#fbecd6"/>
  ${bilayerR}
  <g filter="url(#shR)">
    ${Object.values(RT).map((t) => `
    <path d="M${t.x} 112 L${t.x} 230" stroke="#2c5a92" stroke-width="70"/>
    <path d="M${t.x} 112 L${t.x} 230" stroke="#bcd5f2" stroke-width="62"/>
    <path d="${termD(t.x)}" fill="url(#preR)" stroke="#2c5a92" stroke-width="5"/>`).join('')}
  </g>
`);
  const VESR = [[-95, 280], [-35, 250], [30, 255], [95, 285], [-60, 325], [60, 328], [0, 300]];
  const FUSER = [[4, [-28, 358]], [5, [28, 358]]];        // [vesicle index, fuse point]
  // Ions. Outside: mostly +. Inside: mostly −.
  const recvIons = [
    ['pos', 110, 210], ['pos', 600, 230], ['pos', 640, 330], ['pos', 1100, 230], ['pos', 1110, 330], ['pos', 100, 330],
    ['pos', 560, 410], ['pos', 1060, 430], ['pos', 1110, 130], ['neg', 580, 300], ['neg', 130, 430], ['neg', 1100, 400],
    ['neg', 120, 640], ['neg', 220, 730], ['neg', 430, 640], ['neg', 520, 740], ['neg', 640, 650], ['neg', 760, 740],
    ['neg', 990, 650], ['neg', 1090, 740], ['neg', 330, 800], ['neg', 860, 815], ['pos', 1100, 815], ['pos', 600, 820],
  ];
  // Ions each receptor lets in: [from (outside), to (inside)]
  const RFLOW = {
    exc: [[[250, 420], [270, 680]], [[415, 425], [400, 720]], [[200, 440], [330, 760]]],
    inh: [[[790, 420], [800, 690]], [[955, 425], [950, 720]], [[1010, 440], [880, 770]]],
  };
  const rPore = (x, from, to) => [from, [x, MR.top - 40], [x, MR.mid], [x, MR.bot + 45], to];
  const hideFor = (k) => [k === 'exc' ? 'exc2' : 'inh2', 'both2'];
  const fireR = (k, t0) => {
    const t = RT[k], x = t.x, site = [x - 28, MR.top - 22];
    return [
      { type: 'mover', once: true, vanish: true, r: 9, color: '#ff5a36', path: [[x, 116], [x, 250]], duration: 0.4, at: t0 + 0.05 },
      { type: 'flash', x, y: 290, r: 110, color: '#ff5a36', duration: 0.6, at: t0 + 0.45 },
      ...FUSER.map(([vi, [fx, fy]], i) => ({
        type: 'vesicle', fuse: true, r: 18, color: '#2c5a92', dot: t.nt,
        path: [[x + VESR[vi][0], VESR[vi][1]], [x + fx, fy]], duration: 1.1, at: t0 + 0.6 + i * 0.15,
      })),
      { type: 'mover', once: true, r: 7, color: t.nt, smooth: true, path: [[x - 26, 376], [x - 34, 410], site], duration: 0.6, at: t0 + 1.4, until: 3.2 },
      { type: 'mover', once: true, vanish: true, r: 7, color: t.nt, smooth: true, path: [site, [x - 80, 420], [x - 130, 395]], duration: 0.7, at: t0 + 4.6 },
      ...[[-70, 420], [40, 410], [80, 440], [-110, 445]].map(([dx, dy], i) => ({
        type: 'mover', once: true, vanish: true, r: 6, color: t.nt, smooth: true,
        path: [[x + (i % 2 ? 26 : -26), 376], [x + dx * 0.5, 400], [x + dx, dy]], duration: 1.4, at: t0 + 1.45 + i * 0.1,
      })),
      { type: 'value', id: t.recId, from: 0, to: 1, at: t0 + 2.0, duration: 0.3 },
      ...RFLOW[k].map(([from, to], i) => ({ type: 'ion', ion: t.ion, smooth: true, path: rPore(x, from, to), duration: 1.3, at: t0 + 2.2 + i * 0.3 })),
      { type: 'value', id: t.recId, from: 1, to: 0, at: t0 + 4.4, duration: 0.3 },
    ];
  };
  const vmR = (peak, t0) => [
    { type: 'value', id: 'vm2', from: REST, to: peak, at: t0 + 2.4, duration: 1.7 },
    { type: 'value', id: 'vm2', from: peak, to: REST, at: t0 + 4.8, duration: 2.0 },
  ];
  const recvActions = [
    { id: 'exc2', label: 'Excitatory signal', items: [...fireR('exc', 0), ...vmR(RT.exc.peak, 0)] },
    { id: 'inh2', label: 'Inhibitory signal', items: [...fireR('inh', 0), ...vmR(RT.inh.peak, 0)] },
    { id: 'both2', label: 'Both at once', items: [...fireR('exc', 0), ...fireR('inh', 0), ...vmR(-67, 0)] },
  ];
  const recvItems = [
    title('Receiving signals'),
    { type: 'svg', svg: recvSvg },
    { type: 'charges', id: 'vm2', value: REST, x0: MR.x0, x1: MR.x1, top: MR.top, bot: MR.bot, step: 70 },
    ...Object.entries(RT).flatMap(([k, t]) => VESR.map(([dx, y], vi) => ({
      type: 'vesicle', x: t.x + dx, y, r: 18, color: '#2c5a92', dot: t.nt,
      hideDuring: FUSER.some(([fi]) => fi === vi) ? hideFor(k) : undefined,
    }))),
    ...recvIons.map(([ion, x, y]) => ({ type: 'ion', ion, x, y })),
    ...Object.entries(RFLOW).flatMap(([k, list]) => list.map(([from]) => ({ type: 'ion', ion: RT[k].ion, x: from[0], y: from[1], hideDuring: hideFor(k) }))),
    ...Object.values(RT).map((t) => ({ type: 'channel', id: t.recId, x: t.x, y: MR.mid, h: 120, ...t.ch, label: `${t.name} receptor` })),
    ...Object.values(RT).map((t) => ({ type: 'text', x: t.x + 48, y: 140, text: `${t.name}\naxon terminal`, size: 23, font: 'sans', color: t.col })),
    { type: 'text', x: 80, y: 142, text: 'Outside: more +', size: 24, font: 'sans', color: '#a8281a' },
    { type: 'text', x: 80, y: 838, text: 'Inside the dendrite: more −', size: 24, font: 'sans', color: '#1d4fb0' },
    {
      type: 'meter', id: 'vm2', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 290, min: -90, max: 40,
      title: 'Membrane potential', upText: 'Depolarized (excitatory)', downText: 'Hyperpolarized (inhibitory)',
    },
    { type: 'ion', ion: 'pos', x: 1225, y: 668 },
    { type: 'text', x: 1252, y: 668, text: 'Positive ion', size: 22, font: 'sans', color: 'ink' },
    { type: 'ion', ion: 'neg', x: 1225, y: 712 },
    { type: 'text', x: 1252, y: 712, text: 'Negative ion', size: 22, font: 'sans', color: 'ink' },
    { type: 'rect', x: 1214, y: 744, w: 22, h: 28, color: CH_STYLE.na.edge, fill: CH_STYLE.na.fill, fillOpacity: 1, width: 2, rough: false },
    { type: 'text', x: 1252, y: 758, text: 'Excitatory receptor', size: 22, font: 'sans', color: 'ink' },
    { type: 'rect', x: 1214, y: 788, w: 22, h: 28, color: CH_STYLE.cl.edge, fill: CH_STYLE.cl.fill, fillOpacity: 1, width: 2, rough: false },
    { type: 'text', x: 1252, y: 802, text: 'Inhibitory receptor', size: 22, font: 'sans', color: 'ink' },
  ];

  // ---------- slide 3: glutamate vs GABA synapse ----------
  // Two synapses on the same receiving dendrite. Same membrane, ions and channel
  // styles as slide 2: the glutamate receptor is a Na+ channel, the GABA receptor
  // a Cl- channel. One live potential ('psp') shows EPSPs and IPSPs.
  const M3 = { x0: 60, x1: 1160, top: 410, bot: 500, mid: 455 };
  const SYN = {
    glu: { x: 340, nt: '#f08c1a', ntEdge: '#b9650b', name: 'Glutamate synapse (excitatory)', nameColor: '#b05f00', ch: 'na', receptor: 'Glutamate receptor', lets: 'lets Na⁺ in' },
    gaba: { x: 880, nt: '#16a3b8', ntEdge: '#0b6f7e', name: 'GABA synapse (inhibitory)', nameColor: '#0b6f7e', ch: 'cl', receptor: 'GABA receptor', lets: 'lets Cl⁻ in' },
  };
  const bulbD = (cx) => `M${cx - 180} 262 C${cx - 180} 172 ${cx - 92} 142 ${cx} 142 C${cx + 92} 142 ${cx + 180} 172 ${cx + 180} 262 Q${cx + 180} 300 ${cx + 140} 302 L${cx - 140} 302 Q${cx - 180} 300 ${cx - 180} 262 Z`;
  const synAxons = { glu: 'M-30 250 Q80 246 185 236', gaba: 'M1190 250 Q1120 246 1035 236' }; // axons come in from the sides
  const bilayer3 = (() => {
    let out = '';
    for (let x = M3.x0 + 10; x <= M3.x1 - 8; x += 20) {
      for (const [hy, t0, t1] of [[M3.top + 8, M3.top + 17, M3.mid - 3], [M3.bot - 8, M3.bot - 17, M3.mid + 3]]) {
        const d = (t1 - t0) / 2;
        out += `<path d="M${x - 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d} M${x + 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d}" stroke="#c99a62" stroke-width="2" fill="none"/>`;
        out += `<circle cx="${x}" cy="${hy}" r="9" fill="#f4c995" stroke="#b67d3c" stroke-width="2"/>`;
      }
    }
    return out;
  })();
  const synapsesSvg = svgDoc(`<defs>
    <linearGradient id="preG3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eefb"/><stop offset="1" stop-color="#9cc0ea"/></linearGradient>
    <filter id="sh3b" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#13294a" flood-opacity="0.2"/></filter>
  </defs>
  <rect x="${M3.x0}" y="112" width="${M3.x1 - M3.x0}" height="${M3.top - 112}" rx="16" fill="#eef6fd"/>
  <rect x="${M3.x0}" y="${M3.bot}" width="${M3.x1 - M3.x0}" height="${860 - M3.bot}" rx="16" fill="#f7f0fb"/>
  <rect x="${M3.x0}" y="${M3.top}" width="${M3.x1 - M3.x0}" height="${M3.bot - M3.top}" fill="#fbecd6"/>
  ${bilayer3}
  ${Array.from({ length: 16 }, (_, i) => M3.x0 + 35 + i * 70).map((x) =>
    `<text x="${x}" y="${M3.top - 7}" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#e0453a" text-anchor="middle">+</text>` +
    `<text x="${x}" y="${M3.bot + 25}" font-family="Arial, sans-serif" font-weight="700" font-size="26" fill="#2f6fde" text-anchor="middle">−</text>`).join('')}
  <g filter="url(#sh3b)">
    ${Object.entries(SYN).map(([k, s]) => `
    <path d="${synAxons[k]}" stroke="#2c5a92" stroke-width="64" fill="none" stroke-linecap="round"/>
    <path d="${synAxons[k]}" stroke="#bcd5f2" stroke-width="56" fill="none" stroke-linecap="round"/>
    <path d="${bulbD(s.x)}" fill="url(#preG3)" stroke="#2c5a92" stroke-width="5"/>`).join('')}
  </g>
`);
  // Vesicles inside each terminal (relative to its centre). Two of them fuse.
  const VES = [[-110, 222], [-45, 192], [25, 196], [95, 218], [-75, 262], [5, 248], [80, 266], [140, 262]];
  const FUSE3 = [[4, [-24, 290]], [6, [24, 290]]]; // [vesicle index, fuse point]
  const synStaticIons = [
    // outside the cell, around and between the terminals
    ['na', 105, 168], ['cl', 100, 335], ['na', 565, 170], ['cl', 650, 225], ['na', 575, 300], ['cl', 655, 372],
    ['na', 470, 362], ['cl', 745, 360], ['na', 1110, 168], ['cl', 1112, 335],
    // inside the dendrite
    ['k', 130, 630], ['k', 250, 720], ['a', 120, 760], ['k', 470, 640], ['a', 420, 780], ['k', 560, 730],
    ['k', 690, 640], ['na', 640, 810], ['k', 760, 740], ['a', 990, 660], ['k', 1090, 730], ['cl', 1000, 800], ['k', 860, 805], ['k', 640, 720 - 0],
  ];
  // Ions each receptor lets through: [ion, from (outside), to (inside)]
  const synFlows = {
    glu: [['na', [255, 352], [260, 640]], ['na', [425, 350], [400, 700]], ['na', [180, 372], [350, 655]]],
    gaba: [['cl', [795, 352], [800, 650]], ['cl', [965, 350], [960, 700]], ['cl', [1060, 355], [880, 760]]],
  };
  const synPore = (x, from, to) => [from, [x, M3.top - 40], [x, M3.mid], [x, M3.bot + 50], to];
  // One synapse firing, starting at t0: vesicles fuse, neurotransmitter crosses and
  // binds, the receptor channel opens, ions flow in, then it all closes again.
  const synapseFires = (k, t0, actionId) => {
    const s = SYN[k], x = s.x, site = [x - 28, M3.top - 22];
    return [
      ...FUSE3.map(([vi, [fx, fy]], i) => ({
        type: 'vesicle', fuse: true, r: 13, color: '#2c5a92', dot: s.nt,
        path: [[x + VES[vi][0], VES[vi][1]], [x + fx, fy]], duration: 1.2, at: t0 + i * 0.15,
      })),
      // neurotransmitter: one molecule binds the receptor, others drift in the cleft
      { type: 'mover', once: true, r: 7, color: s.nt, smooth: true, path: [[x - 24, 304], [x - 30, 345], site], duration: 0.7, at: t0 + 0.8, until: 3.4 },
      { type: 'mover', once: true, vanish: true, r: 7, color: s.nt, smooth: true, path: [site, [x - 70, 360], [x - 120, 330]], duration: 0.8, at: t0 + 4.2 },
      ...[[-60, 340], [40, 330], [70, 365], [-100, 365]].map(([dx, dy], i) => ({
        type: 'mover', once: true, vanish: true, r: 6, color: s.nt, smooth: true,
        path: [[x + (i % 2 ? 24 : -24), 304], [x + dx * 0.6, (304 + dy) / 2 + 8], [x + dx, dy]], duration: 1.6, at: t0 + 0.85 + i * 0.1,
      })),
      { type: 'value', id: `ch-${k}`, from: 0, to: 1, at: t0 + 1.5, duration: 0.35 },
      ...synFlows[k].map(([ion, from, to], i) => ({ type: 'ion', ion, smooth: true, path: synPore(x, from, to), duration: 1.4, at: t0 + 1.7 + i * 0.35 })),
      { type: 'value', id: `ch-${k}`, from: 1, to: 0, at: t0 + 4.1, duration: 0.35 },
    ];
  };
  const pspValue = (peak, t0) => [
    { type: 'value', id: 'psp', from: REST, to: peak, at: t0 + 1.9, duration: 1.9 },
    { type: 'value', id: 'psp', from: peak, to: REST, at: t0 + 4.6, duration: 2.2 },
  ];
  const synActions = [
    { id: 'glu', label: 'Release glutamate', items: [...synapseFires('glu', 0), ...pspValue(-60, 0)] },
    { id: 'gaba', label: 'Release GABA', items: [...synapseFires('gaba', 0), ...pspValue(-74, 0)] },
    { id: 'both', label: 'Both at once', items: [...synapseFires('glu', 0), ...synapseFires('gaba', 0), ...pspValue(-66, 0)] },
  ];
  const synItems = [
    title('Glutamate vs GABA'),
    { type: 'svg', svg: synapsesSvg },
    ...Object.values(SYN).map((s) => ({ type: 'text', x: s.x, y: 124, text: s.name, size: 24, font: 'sans', color: s.nameColor, align: 'center' })),
    // vesicles (the fusing ones hide while an animation plays)
    ...Object.entries(SYN).flatMap(([k, s]) => VES.map(([dx, y], vi) => ({
      type: 'vesicle', x: s.x + dx, y, r: 13, color: '#2c5a92', dot: s.nt,
      hideDuring: FUSE3.some(([fi]) => fi === vi) ? (k === 'glu' ? ['glu', 'both'] : ['gaba', 'both']) : undefined,
    }))),
    ...synStaticIons.map(([ion, x, y]) => ({ type: 'ion', ion, x, y })),
    ...Object.entries(synFlows).flatMap(([k, list]) => list.map(([ion, from]) => ({
      type: 'ion', ion, x: from[0], y: from[1], hideDuring: k === 'glu' ? ['glu', 'both'] : ['gaba', 'both'],
    }))),
    ...Object.entries(SYN).flatMap(([k, s]) => [
      { type: 'channel', id: `ch-${k}`, x: s.x, y: M3.mid, h: 130, ...CH_STYLE[s.ch], label: s.receptor },
      { type: 'text', x: s.x, y: M3.mid + 65 + 54, text: s.lets, size: 20, font: 'sans', color: '#5b6270', align: 'center' },
    ]),
    { type: 'text', x: 80, y: 838, text: 'Inside the receiving neuron (dendrite)', size: 24, font: 'sans', color: '#6b3c87' },
    {
      type: 'meter', id: 'psp', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 250, min: -100, max: 65, marks: EMARKS,
      title: 'Postsynaptic potential', upText: 'EPSP: depolarized (excitatory)', downText: 'IPSP: hyperpolarized (inhibitory)',
    },
    { type: 'text', x: 1540, y: 586, text: 'Equilibrium', size: 17, font: 'sans', color: '#5b6270', align: 'right' },
    ...[['ion', 'na', 'Sodium (Na⁺)'], ['ion', 'cl', 'Chloride (Cl⁻)'], ['ion', 'k', 'Potassium (K⁺)'], ['ion', 'a', 'Proteins'],
      ['nt', SYN.glu.nt, 'Glutamate'], ['nt', SYN.gaba.nt, 'GABA']].flatMap(([kind, v, name], i) => [
      kind === 'ion'
        ? { type: 'ion', ion: v, x: 1222, y: 618 + i * 40, r: 15 }
        : { type: 'circle', x: 1222, y: 618 + i * 40, r: 8, color: v, fill: v, fillOpacity: 1, width: 2, rough: false },
      { type: 'text', x: 1248, y: 618 + i * 40, text: name, size: 21, font: 'sans', color: 'ink' },
      ...(kind === 'ion' ? [{
        type: 'text', x: 1540, y: 618 + i * 40, size: 21, font: 'sans', bold: true, align: 'right',
        text: v === 'a' ? 'can’t cross' : `${E_ION[v] > 0 ? '+' : '−'}${Math.abs(E_ION[v])} mV`,
        color: v === 'a' ? '#8a8f98' : ION_TEXT[v],
      }] : []),
    ]),
  ];

  // ---------- shared geometry helpers (tapered branches) ----------
  const quad = (b, t) => [0, 1].map((k) => (1 - t) ** 2 * b.p0[k] + 2 * (1 - t) * t * b.c[k] + t * t * b.p1[k]);
  const normal = (b, t) => {
    const d = [0, 1].map((k) => 2 * (1 - t) * (b.c[k] - b.p0[k]) + 2 * t * (b.p1[k] - b.c[k]));
    const len = Math.hypot(d[0], d[1]) || 1;
    return [-d[1] / len, d[0] / len];
  };
  const widthAt = (b, t) => b.w0 + (b.w1 - b.w0) * t;
  const add = (p, n, k) => [p[0] + n[0] * k, p[1] + n[1] * k];
  function taperD(b) {
    const L = [], R = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48, p = quad(b, t), n = normal(b, t), w = widthAt(b, t) / 2;
      L.push(add(p, n, w));
      R.push(add(p, n, -w));
    }
    return 'M' + L.concat(R.reverse()).map((p) => p.map(f1).join(',')).join(' L') + ' Z';
  }

  // ---------- slide 1 (and 8): three neurons in a chain ----------
  // Left (blue, small) -> main (purple, big) -> right (green, small), all on one
  // axis. Each axon terminal sits just before a dendrite tip of the next neuron.
  const GREEN = { outline: '#2f6b2a', fill: '#9bd18f', light: '#eaf7e6', dark: '#6db35f' };
  const GREENN = {
    outline: '#2f6b2a', fill: '#a9d99d', s0: '#eef9ea', s1: '#c4e8bb', s2: '#86c477',
    n0: '#79b86a', n1: '#2f6b2a', nStroke: '#24521f', nl: '#1b3f17', b0: '#eaf7e6', b1: '#86c477',
    a0: '#d3efcb', a1: '#8fcc80', shine: '#f2fbef', gran: '#2f6b2a', shadow: '#13361a',
  };
  // Neuron 1 shows only the end of its axon + terminal (rest is off the left edge);
  // neuron 3 shows its dendrites and cell body (its axon runs off the right edge).
  const SMALL = 0.7, BIG = 0.86, AXIS = 510, GAP = 24, LEFT_END = 112;
  const TIP = [80, 470];                                   // dendrite tip facing the previous neuron
  const T_L = { k: SMALL, tx: LEFT_END - 1348 * SMALL, ty: AXIS - 470 * SMALL };
  const T_C = { k: BIG, tx: LEFT_END + GAP - TIP[0] * BIG, ty: AXIS - 470 * BIG };
  const T_R = { k: SMALL, tx: 1348 * BIG + T_C.tx + GAP - TIP[0] * SMALL, ty: AXIS - 470 * SMALL };
  const mp = (T, [x, y]) => [x * T.k + T.tx, y * T.k + T.ty];
  const gT = (T, inner) => `<g transform="translate(${f1(T.tx)} ${f1(T.ty)}) scale(${T.k})">${inner}</g>`;
  const FUSING = [2, 4, 7];                                // main-neuron vesicles that release
  const fuseTargets = [[1337, 457], [1339, 474], [1335, 491]];
  const rightTip = mp(T_R, TIP), mainTip = mp(T_C, TIP);
  const receptorYs = [-7, 0, 7].map((d) => rightTip[1] + d);
  // Two more neurons synapse onto the main neuron: one on an upper dendrite tip,
  // one on a lower one. Each: [dendrite tip, direction it comes from, colours, route to soma, where its axon goes off-board].
  const EXTRA_IN = [
    { tip: [228, 145], dir: [-0.05, -1], col: ['#1f6f6b', '#7cc7c0', '#e0f4f2'], off: [205, -40],
      route: [[228, 145], [230, 190], [250, 235], [255, 280], [300, 330], [340, 400], [380, 470]] },
    { tip: [248, 828], dir: [-0.7, 0.72], col: ['#9c2a5c', '#ef9cc0', '#fde8f1'], off: [150, 960],
      route: [[248, 828], [285, 790], [300, 750], [330, 710], [360, 640], [365, 560], [380, 470]] },
  ].map((e) => {
    const t = mp(T_C, e.tip);
    const l = Math.hypot(e.dir[0], e.dir[1]);
    const d = [e.dir[0] / l, e.dir[1] / l];
    const bulb = [t[0] + d[0] * 36, t[1] + d[1] * 36];
    const mid = [bulb[0] + d[0] * 80, bulb[1] + d[1] * 80];
    return { ...e, t, d, bulb, axon: [bulb, mid, e.off] };
  });
  const extraSvg = EXTRA_IN.map((e) => {
    const path = `M${e.off.map(f1).join(' ')} Q${e.axon[1].map(f1).join(' ')} ${e.bulb.map(f1).join(' ')}`;
    return `<path d="${path}" stroke="${e.col[0]}" stroke-width="16" fill="none" stroke-linecap="round"/>` +
      `<path d="${path}" stroke="${e.col[1]}" stroke-width="10" fill="none" stroke-linecap="round"/>` +
      `<circle cx="${f1(e.bulb[0])}" cy="${f1(e.bulb[1])}" r="27" fill="${e.col[0]}"/>` +
      `<circle cx="${f1(e.bulb[0])}" cy="${f1(e.bulb[1])}" r="24" fill="${e.col[2]}"/>` +
      [[-8, -7], [8, -6], [0, 8], [-10, 7], [10, 7], [0, -1]].map(([a, b]) => `<circle cx="${f1(e.bulb[0] + a)}" cy="${f1(e.bulb[1] + b)}" r="4.4" fill="#ffffff" stroke="${e.col[0]}" stroke-width="1.2"/><circle cx="${f1(e.bulb[0] + a)}" cy="${f1(e.bulb[1] + b)}" r="1.8" fill="#f08c1a"/>`).join('');
  }).join('');
  const chainSvg = svgDoc(
    extraSvg +
    gT(T_L, neuronMarkup(BLUE, 'chL', { releasing: false })) +
    gT(T_C, neuronMarkup(PURPLE, 'chC', { skip: FUSING, releasing: false })) +
    gT(T_R, neuronMarkup(GREENN, 'chR', { releasing: false })) +
    receptorYs.map((y) => `<rect x="${f1(rightTip[0] - 5)}" y="${f1(y - 2)}" width="5" height="4" rx="1" fill="#1d5a2e"/>`).join('') +
    [-6, 0, 6].map((d) => `<rect x="${f1(mainTip[0] - 5)}" y="${f1(mainTip[1] + d - 2)}" width="5" height="4" rx="1" fill="#4a2062"/>`).join(''));
  const chainVesicles = (hide) => FUSING.map((vi) => {
    const [x, y] = mp(T_C, vesiclePts[vi]);
    return { type: 'vesicle', x, y, r: 11 * BIG, hideDuring: hide };
  });

  // Main neuron releases neurotransmitters onto the right neuron, starting at t0.
  const releaseFrom = (t0) => [
    ...FUSING.map((vi, k) => ({
      type: 'vesicle', fuse: true, path: [mp(T_C, vesiclePts[vi]), mp(T_C, fuseTargets[k])], r: 11 * BIG, duration: 1.4, at: t0 + k * 0.2,
    })),
    ...FUSING.flatMap((_, k) => [0, 1].map((n) => {
      const [fx, fy] = mp(T_C, fuseTargets[k]);
      const ry = receptorYs[(k + n) % receptorYs.length];
      return {
        type: 'mover', once: true, r: 2.6, color: '#f08c1a', smooth: true,
        path: [[fx + 5, fy], [(fx + rightTip[0]) / 2, (fy + ry) / 2 + (n ? 3 : -3)], [rightTip[0] - 7, ry]],
        duration: 0.8, at: t0 + 0.8 + k * 0.2 + n * 0.1,
      };
    })),
    { type: 'pulse', x: rightTip[0] + 6, y: rightTip[1], r: 22, color: '#2e9e5b', speed: 1.4, at: t0 + 2.0, until: 2 },
  ];
  const releaseItems = [
    ...releaseFrom(0),
    // ...and the right neuron picks it up: the signal heads for its cell body
    { type: 'mover', once: true, vanish: true, r: 6, color: '#2e9e5b', smooth: true, path: DEND_ROUTE().map((p) => mp(T_R, p)), duration: 1.2, at: 2.1 },
  ];
  function DEND_ROUTE() { return [TIP, [110, 480], [150, 505], [220, 500], [300, 485], [380, 470]]; }

  // The whole chain: left neuron -> main neuron -> right neuron (which fires too).
  const SPARK = '#ffb21e'; // electrical signal
  const AP = '#ff5a36';    // action potential
  const nodesAlongAxon = [40, ...sheaths.slice(0, -1).map((sh, i) => (sh.b + sheaths[i + 1].a) / 2), 690];
  const AXON_LENGTH = 707;
  const fireAxon = (T, t0, dur, r) => [
    { type: 'flash', x: mp(T, [495, 470])[0], y: mp(T, [495, 470])[1], r: 70 * T.k, color: AP, duration: 0.6, at: t0 - 0.2 },
    { type: 'mover', once: true, vanish: true, r, color: AP, path: axonSamples.map((p) => mp(T, p)), duration: dur, at: t0 },
    ...nodesAlongAxon.map((d) => {
      const [x, y] = mp(T, axonAt(d));
      return { type: 'flash', x, y, r: 40 * T.k, color: AP, duration: 0.4, at: t0 + (dur * d) / AXON_LENGTH };
    }),
    { type: 'flash', x: mp(T, [terminal.x, terminal.y])[0], y: mp(T, [terminal.x, terminal.y])[1], r: 110 * T.k, color: AP, duration: 0.6, at: t0 + dur },
  ];
  const leftTerm = mp(T_L, [1336, 470]);
  const AP_START = 4.2, AP_TIME = 1.6;
  const fullItems = [
    // 1. the left neuron fires: its action potential runs down its axon
    { type: 'mover', once: true, vanish: true, r: 8, color: AP, path: axonSamples.map((p) => mp(T_L, p)).filter(([x]) => x > -30), duration: 0.7, at: 0.5 },
    { type: 'flash', x: leftTerm[0] - 20, y: leftTerm[1], r: 50, color: AP, duration: 0.6, at: 1.15 },
    // 2. its neurotransmitters cross the gap onto the main neuron's dendrite
    ...[-5, 0, 5].map((dy, n) => ({
      type: 'mover', once: true, r: 2.6, color: '#f08c1a', smooth: true,
      path: [[leftTerm[0] + 3, leftTerm[1] + dy], [(leftTerm[0] + mainTip[0]) / 2, mainTip[1] + dy * 1.2], [mainTip[0] - 6, mainTip[1] + dy]],
      duration: 0.7, at: 1.35 + n * 0.1,
    })),
    { type: 'flash', x: mainTip[0] + 4, y: mainTip[1], r: 20, color: '#8a4fd8', duration: 0.5, at: 2.05 },
    // ...and at the same time the two other input neurons fire onto their dendrite tips
    ...EXTRA_IN.flatMap((e) => [
      { type: 'mover', once: true, vanish: true, r: 7, color: AP, smooth: true, path: [e.off, e.axon[1], e.bulb], duration: 0.65, at: 0.5 },
      { type: 'flash', x: e.bulb[0], y: e.bulb[1], r: 32, color: AP, duration: 0.6, at: 1.15 },
      ...[-5, 0, 5].map((o, n) => ({
        type: 'mover', once: true, r: 2.6, color: '#f08c1a', smooth: true,
        path: [[e.bulb[0] - e.d[0] * 24 - e.d[1] * o, e.bulb[1] - e.d[1] * 24 + e.d[0] * o], [e.t[0] + e.d[0] * 4 - e.d[1] * o, e.t[1] + e.d[1] * 4 + e.d[0] * o]],
        duration: 0.6, at: 1.4 + n * 0.1,
      })),
      { type: 'flash', x: e.t[0], y: e.t[1], r: 20, color: '#8a4fd8', duration: 0.5, at: 2.05 },
      { type: 'mover', once: true, vanish: true, r: 7, color: SPARK, smooth: true, path: e.route.map((p) => mp(T_C, p)), duration: 1.3, at: 2.1 },
    ]),
    // 3. the signal travels along the dendrite to the cell body
    { type: 'mover', once: true, vanish: true, r: 7, color: SPARK, smooth: true, path: DEND_ROUTE().map((p) => mp(T_C, p)), duration: 1.3, at: 2.1 },
    { type: 'flash', x: mp(T_C, [soma.x, soma.y])[0], y: mp(T_C, [soma.x, soma.y])[1], r: 70, color: SPARK, duration: 0.8, at: 3.35 },
    // 4. the axon hillock fires; the action potential jumps node to node
    ...fireAxon(T_C, AP_START, AP_TIME, 8),
    // 5. release onto the right neuron, which picks up the signal and fires too
    ...releaseFrom(AP_START + AP_TIME + 0.25),
    { type: 'mover', once: true, vanish: true, r: 5, color: SPARK, smooth: true, path: DEND_ROUTE().map((p) => mp(T_R, p)), duration: 0.9, at: AP_START + AP_TIME + 2.4 },
    ...fireAxon(T_R, AP_START + AP_TIME + 3.5, 1.0, 5),
  ];

  // ---------- slide 4: adding up inputs at the axon hillock ----------
  // The main neuron (scaled down) with two excitatory synapses on top dendrites,
  // and at the bottom an excitatory synapse at a dendrite tip with an inhibitory
  // one between it and the cell body. The panel shows the axon hillock potential.
  const K4 = 0.82, TX4 = 10, TY4 = 85;
  const S4 = ([x, y]) => [Math.round(x * K4 + TX4), Math.round(y * K4 + TY4)];
  const EXC = { fill: '#f8cf8f', edge: '#a8640a', nt: '#f08c1a' };
  const INH = { fill: '#a8e2ea', edge: '#0b6f7e', nt: '#16a3b8' };
  const norm = ([x, y]) => { const l = Math.hypot(x, y); return [x / l, y / l]; };
  // [name, contact point on the dendrite (neuron coords), direction the axon comes from, style]
  const inputs = {
    E1: { at: [228, 145], dir: norm([-0.35, -1]), st: EXC },
    E2: { at: [332, 125], dir: norm([0.25, -1]), st: EXC },
    E3: { at: [248, 828], dir: norm([-0.45, 1]), st: EXC },
    I: { at: [362, 640], dir: norm([0.75, 1]), st: INH },
  };
  for (const s of Object.values(inputs)) {
    const p = S4(s.at);
    s.p = p;
    s.c = [p[0] + s.dir[0] * 30, p[1] + s.dir[1] * 30];               // terminal centre
    s.axonEnd = [p[0] + s.dir[0] * 700, p[1] + s.dir[1] * 700];       // runs off the board
  }
  const terminalsSvg = svgDoc(`<defs>
    <filter id="sh4" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#13294a" flood-opacity="0.25"/></filter>
  </defs>
  <g filter="url(#sh4)">
  ${Object.values(inputs).map((s) => `
    <path d="M${s.c.map(f1)} L${s.axonEnd.map(f1)}" stroke="${s.st.edge}" stroke-width="16" stroke-linecap="round"/>
    <path d="M${s.c.map(f1)} L${s.axonEnd.map(f1)}" stroke="${s.st.fill}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="${f1(s.c[0])}" cy="${f1(s.c[1])}" r="21" fill="${s.st.edge}"/>
    <circle cx="${f1(s.c[0])}" cy="${f1(s.c[1])}" r="18" fill="${s.st.fill}"/>
    ${[[-6, -5], [6, -4], [0, 6]].map(([a, b]) => `<circle cx="${f1(s.c[0] + a)}" cy="${f1(s.c[1] + b)}" r="3.2" fill="${s.st.nt}"/>`).join('')}`).join('')}
  </g>`);
  // Paths (neuron coords) a signal takes from each synapse to the axon hillock.
  const HILLOCK = [478, 470];
  const routes = {
    E1: [[228, 145], [230, 190], [250, 225], [255, 280], [300, 330], [340, 400], [380, 470], HILLOCK],
    E2: [[332, 125], [345, 175], [360, 210], [390, 250], [410, 310], [400, 380], [380, 470], HILLOCK],
    E3: [[248, 828], [268, 815], [285, 790], [300, 750], [330, 710], [360, 640], [365, 560], [380, 470], HILLOCK],
    I: [[362, 640], [365, 560], [380, 470], HILLOCK],
  };
  const BLOCK_AT = 5; // index in E3's route where the inhibitory synapse sits
  const hillockPt = S4(HILLOCK);

  // A synapse firing at t0: the terminal flashes and an EPSP/IPSP heads to the hillock.
  const fire = (name, t0, { travel = 1.4, stopAt } = {}) => {
    const s = inputs[name];
    const route = (stopAt ? routes[name].slice(0, stopAt + 1) : routes[name]).map(S4);
    const col = s.st === INH ? INH.nt : SPARK;
    return [
      { type: 'flash', x: s.c[0], y: s.c[1], r: 30, color: s.st.nt, duration: 0.5, at: t0 },
      { type: 'flash', x: s.p[0], y: s.p[1], r: 22, color: col, duration: 0.6, at: t0 + 0.3 },
      { type: 'mover', once: true, vanish: true, r: 8, color: col, smooth: true, path: route, duration: travel, at: t0 + 0.4 },
    ];
  };
  // The hillock reaches threshold: an action potential fires and runs down the axon.
  const actionPotential = (t0) => [
    { type: 'flash', x: hillockPt[0], y: hillockPt[1], r: 60, color: AP, duration: 0.8, at: t0 },
    { type: 'value', id: 'axh', from: -50, to: 30, at: t0, duration: 0.25 },
    { type: 'value', id: 'axh', from: 30, to: -80, at: t0 + 0.25, duration: 0.55 },
    { type: 'value', id: 'axh', from: -80, to: REST, at: t0 + 0.8, duration: 1.8 },
    { type: 'mover', once: true, vanish: true, r: 9, color: AP, path: axonSamples.map(S4), duration: 1.4, at: t0 + 0.1 },
    ...nodesAlongAxon.map((d) => {
      const [x, y] = S4(axonAt(d));
      return { type: 'flash', x, y, r: 22, color: AP, duration: 0.45, at: t0 + 0.1 + (1.4 * d) / 707 };
    }),
    { type: 'flash', x: S4([terminal.x, terminal.y])[0], y: S4([terminal.x, terminal.y])[1], r: 55, color: AP, duration: 0.7, at: t0 + 1.5 },
  ];
  const bump = (to, t0, back = 1.8) => [
    { type: 'value', id: 'axh', from: REST, to, at: t0, duration: 0.6 },
    { type: 'value', id: 'axh', from: to, to: REST, at: t0 + 0.9, duration: back },
  ];
  const sumActions = [
    { id: 'e1', label: 'E1 alone', items: [...fire('E1', 0), ...bump(-62, 1.6), { type: 'flash', x: hillockPt[0], y: hillockPt[1], r: 34, color: SPARK, duration: 0.6, at: 1.75 }] },
    {
      id: 'e1e2', label: 'E1 + E2 together',
      items: [...fire('E1', 0), ...fire('E2', 0),
        { type: 'flash', x: hillockPt[0], y: hillockPt[1], r: 40, color: SPARK, duration: 0.5, at: 1.75 },
        { type: 'value', id: 'axh', from: REST, to: -50, at: 1.6, duration: 0.45 }, ...actionPotential(2.05)],
    },
    {
      id: 'e3', label: 'E3 alone',
      items: [...fire('E3', 0, { travel: 1.9 }),
        { type: 'flash', x: hillockPt[0], y: hillockPt[1], r: 40, color: SPARK, duration: 0.5, at: 2.25 },
        { type: 'value', id: 'axh', from: REST, to: -50, at: 2.1, duration: 0.45 }, ...actionPotential(2.55)],
    },
    {
      id: 'e3i', label: 'E3 + I together',
      items: [...fire('I', 0, { travel: 0.8 }), ...fire('E3', 0, { travel: 0.95, stopAt: BLOCK_AT }),
        { type: 'pulse', x: inputs.I.p[0], y: inputs.I.p[1], r: 30, color: INH.nt, speed: 1.2, at: 0.3 },
        { type: 'flash', x: inputs.I.p[0], y: inputs.I.p[1], r: 40, color: INH.nt, duration: 0.7, at: 1.3 },
        { type: 'text', x: inputs.I.p[0] + 64, y: inputs.I.p[1] - 46, text: 'blocked!', size: 26, font: 'sans', bold: true, color: INH.edge, anim: 'pop', duration: 0.4, at: 1.35, until: 2.6 },
        ...bump(-72, 1.2, 2.0)],
    },
    // Temporal summation: the same synapse firing repeatedly.
    {
      id: 'e1slow', label: 'E1 ×3, slow',
      items: [0, 3, 6].flatMap((t0) => [
        ...fire('E1', t0), ...bump(-62, t0 + 1.6),
        { type: 'flash', x: hillockPt[0], y: hillockPt[1], r: 34, color: SPARK, duration: 0.6, at: t0 + 1.75 },
      ]),
    },
    {
      id: 'e1fast', label: 'E1 ×3, fast',
      items: [
        ...[0, 0.5, 1.0].flatMap((t0) => [...fire('E1', t0), { type: 'flash', x: hillockPt[0], y: hillockPt[1], r: 36, color: SPARK, duration: 0.5, at: t0 + 1.75 }]),
        { type: 'value', id: 'axh', from: REST, to: -62, at: 1.6, duration: 0.3 },
        { type: 'value', id: 'axh', from: -62, to: -64, at: 1.9, duration: 0.2 },
        { type: 'value', id: 'axh', from: -64, to: -57, at: 2.1, duration: 0.3 },
        { type: 'value', id: 'axh', from: -57, to: -59, at: 2.4, duration: 0.2 },
        { type: 'value', id: 'axh', from: -59, to: -50, at: 2.6, duration: 0.3 },
        ...actionPotential(2.9),
      ],
    },
  ];
  const sumItems = [
    title('Adding up signals'),
    { type: 'svg', svg: svgDoc(`<g transform="translate(${TX4} ${TY4}) scale(${K4})">${neuronMarkup(PURPLE, 'sum', { releasing: false })}</g>`) },
    { type: 'svg', svg: terminalsSvg },
    // the trigger zone
    { type: 'circle', x: hillockPt[0], y: hillockPt[1], r: 42, color: AP, width: 3, dashed: true, rough: false },
    ...label('Axon hillock\n(adds up all the inputs)', 620, 320, [560, 382], [hillockPt[0] + 22, hillockPt[1] - 30], 'center', 28),
    ...Object.entries(inputs).map(([name, s]) => ({
      type: 'text', x: s.c[0] + (name === 'I' ? 30 : s.dir[0] < 0 ? -36 : 36), y: s.c[1] - (name === 'I' ? 26 : 0), text: name,
      size: 26, font: 'sans', bold: true, color: s.st.edge, align: s.dir[0] < 0 ? 'right' : 'left',
    })),
    { type: 'text', x: 385, y: 152, text: 'Excitatory synapses (E1, E2)', size: 24, font: 'sans', color: EXC.edge },
    { type: 'text', x: 238, y: 822, text: 'Excitatory\nsynapse (E3)', size: 24, font: 'sans', color: EXC.edge },
    { type: 'text', x: 470, y: 760, text: 'Inhibitory synapse (I),\ncloser to the cell body', size: 24, font: 'sans', color: INH.edge },
    {
      type: 'meter', id: 'axh', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 250,
      title: 'Axon hillock potential', upText: 'EPSP: closer to threshold', downText: 'Pushed away from threshold',
      fireText: 'Action potential fired!',
    },
    { type: 'text', x: 1375, y: 650, text: 'Reach −55 mV at the\naxon hillock and the\nneuron fires', size: 24, font: 'sans', color: '#3b4252', align: 'center' },
    { type: 'circle', x: 1232, y: 790, r: 13, color: EXC.edge, fill: EXC.fill, fillOpacity: 1, width: 3, rough: false },
    { type: 'text', x: 1256, y: 790, text: 'Excitatory (glutamate)', size: 21, font: 'sans', color: 'ink' },
    { type: 'circle', x: 1232, y: 828, r: 13, color: INH.edge, fill: INH.fill, fillOpacity: 1, width: 3, rough: false },
    { type: 'text', x: 1256, y: 828, text: 'Inhibitory (GABA)', size: 21, font: 'sans', color: 'ink' },
  ];

  // ---------- slide 5: the action potential at the axon hillock ----------
  // Membrane close-up with voltage-gated Na+ channels (activation gate + an
  // inactivation ball) and a voltage-gated K+ channel, next to an action
  // potential graph whose cursor moves in step with the channels.
  const M5 = { x0: 60, x1: 1000, top: 410, bot: 500, mid: 455 };
  const NA5 = [190, 400, 610], K5 = 840;
  const AP_KEYS = [[0, -70], [0.6, -70], [2.0, -55], [3.0, 30], [4.6, -80], [6.0, -76], [7.4, -70], [8.0, -70]];
  const AP_PHASES = [
    { from: 0, to: 0.6, title: 'At rest', text: 'Na⁺ and K⁺ channels are closed.\nThe inside sits at −70 mV.', color: '#c3cad6', dot: '#5b6270', mark: [0.3, -70] },
    { from: 0.6, to: 2.0, title: 'Reaching threshold', text: 'Inputs from the dendrites raise\nthe hillock to −55 mV.', color: '#f5c518', dot: '#a07c00', mark: [1.3, -62] },
    { from: 2.0, to: 3.0, title: 'Rising phase', text: 'Voltage-gated Na⁺ channels open.\nNa⁺ rushes in: the inside turns positive.', color: '#f0a12e', dot: '#c46f00', mark: [2.5, -12] },
    { from: 3.0, to: 4.6, title: 'Falling phase', text: 'Na⁺ channels inactivate (plugged).\nK⁺ channels open and K⁺ flows out.', color: '#7b5cd6', dot: '#5a3fb0', mark: [3.8, -25] },
    { from: 4.6, to: 6.0, title: 'Undershoot', text: 'K⁺ channels are slow to close,\nso it dips below rest.', color: '#2f6fde', dot: '#1d4fb0', mark: [5.3, -78] },
    { from: 6.0, to: 8.01, title: 'Back to rest', text: 'K⁺ channels close and the Na⁺\nchannels reset, ready to fire again.', color: '#8a8f98', dot: '#5b6270', mark: [7.0, -71] },
  ];
  const bilayer5 = (() => {
    let out = '';
    for (let x = M5.x0 + 10; x <= M5.x1 - 8; x += 20) {
      for (const [hy, t0, t1] of [[M5.top + 8, M5.top + 17, M5.mid - 3], [M5.bot - 8, M5.bot - 17, M5.mid + 3]]) {
        const d = (t1 - t0) / 2;
        out += `<path d="M${x - 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d} M${x + 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d}" stroke="#c99a62" stroke-width="2" fill="none"/>`;
        out += `<circle cx="${x}" cy="${hy}" r="9" fill="#f4c995" stroke="#b67d3c" stroke-width="2"/>`;
      }
    }
    return out;
  })();
  const apMembraneSvg = svgDoc(`
  <rect x="${M5.x0}" y="112" width="${M5.x1 - M5.x0}" height="${M5.top - 112}" rx="16" fill="#eef6fd"/>
  <rect x="${M5.x0}" y="${M5.bot}" width="${M5.x1 - M5.x0}" height="${860 - M5.bot}" rx="16" fill="#f7f0fb"/>
  <rect x="${M5.x0}" y="${M5.top}" width="${M5.x1 - M5.x0}" height="${M5.bot - M5.top}" fill="#fbecd6"/>
  ${bilayer5}`);
  const apStatic = [
    // outside: Na+ and Cl-
    ['na', 120, 205], ['na', 300, 180], ['na', 515, 195], ['na', 720, 175], ['na', 905, 200],
    ['na', 225, 290], ['na', 455, 285], ['na', 690, 290],
    ['cl', 120, 290], ['cl', 385, 210], ['cl', 610, 215], ['cl', 820, 205], ['cl', 950, 300], ['cl', 570, 270],
    // inside: K+ and negative proteins, a little Na+ and Cl-
    ['k', 110, 660], ['k', 250, 720], ['k', 400, 700], ['k', 520, 760], ['k', 680, 680], ['k', 770, 770],
    ['k', 930, 690], ['k', 150, 800], ['k', 610, 810], ['k', 960, 800],
    ['a', 330, 800], ['a', 470, 660], ['a', 850, 650],
    ['na', 700, 830], ['cl', 430, 830],
  ];
  // Ions that move: Na+ in through each Na+ channel, K+ out through the K+ channel.
  const NA_DEST = [[[140, 612], [205, 655]], [[330, 662], [445, 742]], [[560, 690], [640, 615]]];
  const naFlows = NA5.flatMap((x, i) => [
    ['na', [x - 58, 352], NA_DEST[i][0]],
    ['na', [x + 58, 348], NA_DEST[i][1]],
  ]);
  const kFlows = [
    ['k', [790, 650], [785, 330]], ['k', [890, 640], [895, 340]], ['k', [835, 720], [870, 255]], ['k', [905, 760], [790, 250]],
  ];
  const pore5 = (x, from, to, inward) => (inward
    ? [from, [x, M5.top - 40], [x, M5.mid], [x, M5.bot + 46], to]
    : [from, [x, M5.bot + 46], [x, M5.mid], [x, M5.top - 40], to]);
  const apTimeline = [
    { type: 'value', id: 'apt', from: 0, to: 8, at: 0, duration: 8, linear: true },
    ...AP_KEYS.slice(1).map(([t1, v1], i) => ({ type: 'value', id: 'vm5', from: AP_KEYS[i][1], to: v1, at: AP_KEYS[i][0], duration: t1 - AP_KEYS[i][0] })),
    // Na+ channels: activation gate opens at threshold, inactivation ball plugs them at the peak,
    // the activation gate closes while plugged, then the ball leaves (channel reset).
    { type: 'value', id: 'na5', from: 0, to: 1, at: 2.0, duration: 0.25 },
    { type: 'value', id: 'na5i', from: 0, to: 1, at: 3.0, duration: 0.35 },
    { type: 'value', id: 'na5', from: 1, to: 0, at: 4.2, duration: 0.3 },
    { type: 'value', id: 'na5i', from: 1, to: 0, at: 6.2, duration: 0.6 },
    // K+ channel: opens slowly near the peak, closes late (undershoot)
    { type: 'value', id: 'k5', from: 0, to: 1, at: 2.8, duration: 0.5 },
    { type: 'value', id: 'k5', from: 1, to: 0, at: 5.6, duration: 0.6 },
    ...naFlows.map(([ion, from, to], i) => ({ type: 'ion', ion, smooth: true, path: pore5(NA5[Math.floor(i / 2)], from, to, true), duration: 0.95, at: 2.05 + (i % 2) * 0.2 + Math.floor(i / 2) * 0.08 })),
    ...kFlows.map(([ion, from, to], i) => ({ type: 'ion', ion, smooth: true, path: pore5(K5, from, to, false), duration: 1.1, at: 3.1 + i * 0.3 })),
  ];
  const apItems = [
    title('The action potential'),
    { type: 'svg', svg: apMembraneSvg },
    { type: 'text', x: 80, y: 140, text: 'Outside the axon hillock', size: 24, font: 'sans', color: '#2c5a92' },
    { type: 'text', x: 80, y: 840, text: 'Inside the axon hillock', size: 24, font: 'sans', color: '#6b3c87' },
    { type: 'charges', id: 'vm5', value: REST, x0: M5.x0, x1: M5.x1, top: M5.top, bot: M5.bot, step: 70 },
    ...apStatic.map(([ion, x, y]) => ({ type: 'ion', ion, x, y })),
    ...naFlows.map(([ion, from]) => ({ type: 'ion', ion, x: from[0], y: from[1], hideDuring: 'ap' })),
    ...kFlows.map(([ion, from]) => ({ type: 'ion', ion, x: from[0], y: from[1], hideDuring: 'ap' })),
    ...NA5.map((x, i) => ({
      type: 'channel', id: 'na5', inactId: 'na5i', ligand: false, x, y: M5.mid, h: 130, ...CH_STYLE.na,
      label: i === 1 ? 'Voltage-gated\nNa⁺ channels' : undefined,
    })),
    { type: 'channel', id: 'k5', ligand: false, x: K5, y: M5.mid, h: 130, ...CH_STYLE.k, label: 'Voltage-gated\nK⁺ channel' },
    {
      type: 'apgraph', id: 'apt', vmId: 'vm5', x: 1030, y: 112, w: 530, h: 748, graphH: 330,
      title: 'Axon hillock membrane potential', keys: AP_KEYS, phases: AP_PHASES,
      idleText: 'Press ▶ Fire an action potential',
    },
  ];

  // ---------- slide 6: the action potential travels down the axon ----------
  // A straightened axon: cell body + hillock, an unmyelinated stretch, four
  // myelin segments with nodes of Ranvier, a bare stretch, then the terminal
  // and a dendrite of the next neuron. A voltage-vs-position graph sits right
  // above it, lined up in x.
  const AY = 585, AR = 13;                    // axon centre line and half-thickness
  const SHEATHS6 = [[318, 482], [518, 682], [718, 882], [918, 1082]];
  const NODES6 = [500, 700, 900];
  // Where the action potential is regenerated, and when (seconds). Bare membrane:
  // 30 px every 0.2 s. Through the myelin: 200 px node to node in 0.35 s (~4x faster).
  const STEP6 = 0.2, JUMP6 = 0.35;
  const SITES6 = [];
  [180, 210, 240, 270, 300].forEach((x, i) => SITES6.push({ x, t: 0.4 + i * STEP6 }));
  NODES6.forEach((x) => SITES6.push({ x, t: SITES6[SITES6.length - 1].t + JUMP6, node: true }));
  [1100, 1130, 1160, 1190, 1220].forEach((x, i) => SITES6.push({ x, t: SITES6[SITES6.length - 1].t + (i ? STEP6 : JUMP6) }));
  // The action potential at one spot: brief, so it shows as a bump that travels.
  const WAVE6 = [[-0.15, -70], [0, -55], [0.15, 30], [0.4, -80], [0.95, -70]];
  const TERM6 = { x: 1288, y: AY, r: 52 };
  const DEND6 = { p0: [1640, AY], c: [1500, AY], p1: [1372, AY], w0: 48, w1: 36 };
  const RECEPT6 = [AY - 12, AY, AY + 12];
  const VES6 = [[1262, AY - 26], [1290, AY - 32], [1270, AY + 2], [1300, AY + 24], [1258, AY + 28], [1316, AY - 8]];
  const FUSE6 = [[5, [1326, AY - 10]], [3, [1325, AY + 18]], [1, [1322, AY - 32]]];
  const propSvg = svgDoc(`<defs>
    <radialGradient id="soma6" cx="70%" cy="40%" r="80%"><stop offset="0" stop-color="${PURPLE.s0}"/><stop offset="0.6" stop-color="${PURPLE.s1}"/><stop offset="1" stop-color="${PURPLE.s2}"/></radialGradient>
    <linearGradient id="axon6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PURPLE.a0}"/><stop offset="1" stop-color="${PURPLE.a1}"/></linearGradient>
    <radialGradient id="term6" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="${PURPLE.b0}"/><stop offset="1" stop-color="${PURPLE.b1}"/></radialGradient>
    <linearGradient id="dend6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GREEN.light}"/><stop offset="0.5" stop-color="${GREEN.fill}"/><stop offset="1" stop-color="${GREEN.dark}"/></linearGradient>
    <filter id="sh6" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#3b1452" flood-opacity="0.2"/></filter>
  </defs>
  <g filter="url(#sh6)">
    <!-- cell body and axon hillock -->
    <circle cx="-20" cy="${AY}" r="150" fill="${PURPLE.outline}"/>
    <path d="M100 ${AY - 60} Q140 ${AY - 18} 182 ${AY - AR - 3} L182 ${AY + AR + 3} Q140 ${AY + 18} 100 ${AY + 60} Z" fill="${PURPLE.outline}"/>
    <rect x="150" y="${AY - AR - 3}" width="${TERM6.x - 150}" height="${2 * AR + 6}" fill="${PURPLE.outline}"/>
    <circle cx="${TERM6.x}" cy="${TERM6.y}" r="${TERM6.r + 3}" fill="${PURPLE.outline}"/>
    <circle cx="-20" cy="${AY}" r="146" fill="url(#soma6)"/>
    <path d="M96 ${AY - 56} Q140 ${AY - 16} 182 ${AY - AR} L182 ${AY + AR} Q140 ${AY + 16} 96 ${AY + 56} Z" fill="${PURPLE.fill}"/>
    <rect x="150" y="${AY - AR}" width="${TERM6.x - 150}" height="${2 * AR}" fill="url(#axon6)"/>
    <circle cx="${TERM6.x}" cy="${TERM6.y}" r="${TERM6.r}" fill="url(#term6)"/>
    <!-- myelin sheath -->
    ${SHEATHS6.map(([a, b]) => `<rect x="${a}" y="${AY - 38}" width="${b - a}" height="76" rx="34" fill="#f5e4b8" stroke="#a9802f" stroke-width="4"/>
      <path d="M${a + 26} ${AY - 26} H${b - 26} M${a + 26} ${AY + 26} H${b - 26}" stroke="#e2c98a" stroke-width="3" opacity="0.8"/>
      <path d="M${a + 26} ${AY - 31} H${b - 26}" stroke="#fffaf0" stroke-width="4" opacity="0.8"/>`).join('')}
    <!-- dendrite of the next neuron -->
    <path d="${taperD(DEND6)}" fill="${GREEN.outline}" stroke="${GREEN.outline}" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="${DEND6.p1[0]}" cy="${DEND6.p1[1]}" r="${DEND6.w1 / 2 + 3}" fill="${GREEN.outline}"/>
    <path d="${taperD(DEND6)}" fill="url(#dend6)"/>
    <circle cx="${DEND6.p1[0]}" cy="${DEND6.p1[1]}" r="${DEND6.w1 / 2}" fill="${GREEN.fill}"/>
  </g>
  ${RECEPT6.map((y) => `<rect x="${DEND6.p1[0] - DEND6.w1 / 2 - 4}" y="${y - 3}" width="7" height="6" rx="2" fill="#1d5a2e"/>`).join('')}
`);
  const NODE_T = (x) => SITES6.find((s) => s.x === x).t;
  const T_TERM = SITES6[SITES6.length - 1].t + 0.3;
  const propItems6 = [
    { type: 'value', id: 'ap6t', from: 0, to: 9.5, at: 0, duration: 9.5, linear: true },
    // the fast jump inside the myelinated stretch, node to node
    ...[[300, 500], [500, 700], [700, 900], [900, 1100]].map(([a, b]) => ({
      type: 'mover', once: true, vanish: true, r: 7, color: '#ffb21e', path: [[a, AY], [b, AY]],
      duration: NODE_T(b) - NODE_T(a), at: NODE_T(a),
    })),
    { type: 'flash', x: TERM6.x, y: TERM6.y, r: 70, color: AP, duration: 0.7, at: T_TERM },
    // vesicles fuse and release neurotransmitters, which bind the next dendrite
    ...FUSE6.map(([vi, to], k) => ({ type: 'vesicle', fuse: true, path: [VES6[vi], to], r: 10, duration: 1.2, at: T_TERM + 0.2 + k * 0.15 })),
    ...FUSE6.flatMap(([, [fx, fy]], k) => [0, 1].map((n) => {
      const ry = RECEPT6[(k + n) % RECEPT6.length];
      return {
        type: 'mover', once: true, r: 3.5, color: '#f08c1a', smooth: true,
        path: [[fx + 8, fy], [fx + 22, (fy + ry) / 2 + (n ? 5 : -5)], [DEND6.p1[0] - DEND6.w1 / 2 - 8, ry]],
        duration: 0.9, at: T_TERM + 0.95 + k * 0.15 + n * 0.1,
      };
    })),
    { type: 'flash', x: DEND6.p1[0] + 10, y: AY, r: 40, color: '#2e9e5b', duration: 0.7, at: T_TERM + 2.0 },
    { type: 'pulse', x: DEND6.p1[0] + 10, y: AY, r: 30, color: '#2e9e5b', speed: 1.4, at: T_TERM + 2.0 },
    { type: 'mover', once: true, vanish: true, r: 8, color: '#2e9e5b', path: [[DEND6.p1[0] + 10, AY], [1640, AY]], duration: 1.6, at: T_TERM + 2.1 },
  ];
  const propItems = [
    title('The action potential travels'),
    { type: 'svg', svg: propSvg },
    {
      type: 'apwave', id: 'ap6t', gx0: 150, gx1: 1340, gy: 170, gh: 250, axonY: AY, axonR: AR,
      sites: SITES6, wave: WAVE6,
      naStyle: { fill: '#f8cf8f', edge: '#a8640a', dot: '#f0a12e' },
      kStyle: { fill: '#c3b3f2', edge: '#47309a', dot: '#7b5cd6' },
    },
    ...VES6.map(([x, y], vi) => ({ type: 'vesicle', x, y, r: 10, hideDuring: FUSE6.some(([fi]) => fi === vi) ? 'prop' : undefined })),
    ...label('Axon hillock', 195, 700, [160, 678], [150, AY + 22], 'center', 26),
    ...label('Unmyelinated: regenerates\nstep by step (slow)', 330, 790, [322, 790], [240, AY + 30], 'left', 22),
    ...label('Myelin sheath', 600, 690, [600, 668], [600, AY + 38], 'center', 26),
    ...label('Node of Ranvier: the signal\njumps node to node (fast)', 760, 790, [752, 790], [700, AY + 30], 'left', 22),
    ...label('Axon terminal', 1290, 690, [1290, 668], [1290, AY + 52], 'center', 26),
    ...label('Dendrite of the\nnext neuron', 1500, 690, [1500, 664], [1500, AY + 22], 'center', 24),
    { type: 'circle', x: 1180, y: 810, r: 9, color: '#a8640a', fill: '#f8cf8f', fillOpacity: 1, width: 2, rough: false },
    { type: 'text', x: 1198, y: 810, text: 'Na⁺ channel (top)', size: 20, font: 'sans', color: 'ink' },
    { type: 'circle', x: 1180, y: 844, r: 9, color: '#47309a', fill: '#c3b3f2', fillOpacity: 1, width: 2, rough: false },
    { type: 'text', x: 1198, y: 844, text: 'K⁺ channel (bottom)', size: 20, font: 'sans', color: 'ink' },
  ];

  // ---------- slide 7: what happens at the synapse when the action potential arrives ----------
  // Close-up: the main neuron's axon terminal (top), the synaptic cleft, and the
  // next neuron's dendrite (bottom, green). Voltage-gated Ca2+ channels sit at the
  // sides of the terminal; docked vesicles in the middle; the dendrite has both
  // excitatory (Na+) and inhibitory (Cl-) receptors. The transmitter is glutamate,
  // so only the excitatory receptors respond.
  const PRE_Y = 430, POST_Y = 625;
  const CA7 = [365, 955];                       // Ca2+ channels, at the sides
  const DOCK7 = [[520, PRE_Y - 28], [660, PRE_Y - 28], [800, PRE_Y - 28]];
  const EXC7 = [500, 780], INH7 = [640, 920];   // receptors on the dendrite
  const CA_STYLE = { fill: '#f5bcd6', edge: '#9c1f5c' };
  const TRANS7 = [455, 865];                    // reuptake transporters
  const ENZ7 = [[625, 535], [770, 520]];        // enzymes in the cleft
  const rnd = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const synapse7Svg = svgDoc(`<defs>
    <linearGradient id="pre7" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PURPLE.s0}"/><stop offset="1" stop-color="${PURPLE.s2}"/></linearGradient>
    <linearGradient id="post7" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GREEN.light}"/><stop offset="1" stop-color="${GREEN.dark}"/></linearGradient>
    <filter id="sh7" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#3b1452" flood-opacity="0.2"/></filter>
  </defs>
  <rect x="60" y="112" width="1100" height="748" rx="16" fill="#eef6fd"/>
  <g filter="url(#sh7)">
    <path d="M-40 250 Q130 242 300 268" stroke="${PURPLE.outline}" stroke-width="96" fill="none" stroke-linecap="round"/>
    <path d="M-40 250 Q130 242 300 268" stroke="${PURPLE.a0}" stroke-width="88" fill="none" stroke-linecap="round"/>
    <path d="M260 360 C260 200 450 150 660 150 C870 150 1060 200 1060 360 Q1060 428 1000 ${PRE_Y} L320 ${PRE_Y} Q260 428 260 360 Z" fill="url(#pre7)" stroke="${PURPLE.outline}" stroke-width="6"/>
    <path d="M200 900 L200 ${POST_Y + 40} Q200 ${POST_Y} 240 ${POST_Y} L1080 ${POST_Y} Q1120 ${POST_Y} 1120 ${POST_Y + 40} L1120 900 Z" fill="url(#post7)" stroke="${GREEN.outline}" stroke-width="6"/>
  </g>
  <ellipse cx="370" cy="290" rx="64" ry="28" fill="#f6c99a" stroke="#b9650b" stroke-width="3"/>
  <!-- reuptake transporters in the terminal membrane -->
  ${TRANS7.map((x) => `<rect x="${x - 15}" y="${PRE_Y - 34}" width="30" height="68" rx="12" fill="#9ad7e0" stroke="#0b6f7e" stroke-width="3"/>
    <path d="M${x} ${PRE_Y + 22} L${x} ${PRE_Y - 22} M${x - 6} ${PRE_Y - 14} L${x} ${PRE_Y - 22} L${x + 6} ${PRE_Y - 14}" stroke="#0b6f7e" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join('')}
  <!-- enzymes in the cleft -->
  ${ENZ7.map(([x, y]) => `<path d="M${x} ${y} L${f1(x + 20 * Math.cos(0.55))} ${f1(y - 20 * Math.sin(0.55))} A20 20 0 1 0 ${f1(x + 20 * Math.cos(0.55))} ${f1(y + 20 * Math.sin(0.55))} Z" fill="#c9b8ea" stroke="#5a3fb0" stroke-width="3" stroke-linejoin="round"/>`).join('')}
  <path d="M326 290 q10 -18 20 0 t20 0 t20 0 t20 0" stroke="#b9650b" stroke-width="2.5" fill="none"/>
`);
  const FREE7 = [[545, 225], [685, 205], [825, 235], [935, 310], [600, 325], [760, 330]];
  // Ca2+ waiting outside, and the ones that go in through each side channel and drift to the docked vesicles.
  const CA_OUT = [[290, 585], [420, 560], [1050, 585], [900, 565], [110, 470], [1110, 480], [1110, 570], [1110, 400]];
  const CA_IN = [
    [CA7[0], [320, 500], [470, 380]], [CA7[0], [410, 505], [590, 395]],
    [CA7[1], [1000, 500], [850, 380]], [CA7[1], [905, 505], [730, 395]],
  ];
  const caPore = (x, from, to) => [from, [x, PRE_Y + 52], [x, PRE_Y], [x, PRE_Y - 50], to];
  // Na+ near the excitatory receptors, which goes into the next neuron once they open.
  const NA_IN7 = EXC7.map((x, i) => [[x + 70, POST_Y - 32], [x + 10, POST_Y + 120 + i * 30]]);
  const naPore7 = (x, from, to) => [from, [x, POST_Y - 48], [x, POST_Y + 10], [x, POST_Y + 70], to];

  const STEPS7 = [
    { from: 0, to: 1.2, title: 'Action potential arrives', text: 'The electrical signal reaches the\naxon terminal and depolarizes it.', color: '#e0453a' },
    { from: 1.2, to: 1.6, title: 'Ca²⁺ channels open', text: 'Voltage-gated Ca²⁺ channels in the\nterminal membrane sense it and open.', color: '#9c1f5c' },
    { from: 1.6, to: 2.7, title: 'Ca²⁺ rushes in', text: 'There is far more Ca²⁺ outside, so it\nfloods in and reaches the vesicles.', color: '#9c1f5c' },
    { from: 2.7, to: 3.6, title: 'Vesicles fuse', text: 'Ca²⁺ triggers docked vesicles to\nfuse with the membrane (exocytosis).', color: '#5e2f78' },
    { from: 3.6, to: 5.0, title: 'Neurotransmitters diffuse', text: 'Glutamate spills into the synaptic\ncleft and drifts across it.', color: '#c46f00' },
    { from: 5.0, to: 7.6, title: 'They bind the receptors', text: 'Excitatory receptors open and Na⁺\nflows in. The inhibitory (Cl⁻) ones\ndon’t respond to glutamate.', color: '#2e7d32' },
    { from: 7.6, to: 9.4, title: 'Reuptake', text: 'Transporters pump glutamate back\ninto the terminal to be reused.', color: '#0b6f7e' },
    { from: 9.4, to: 11.2, title: 'Enzymes break them down', text: 'At some synapses, enzymes in\nthe cleft break the transmitter\napart (e.g. acetylcholine).', color: '#5a3fb0' },
  ];
  // Clearing the cleft afterwards: unbinding, reuptake, enzyme breakdown.
  const BOUND7 = EXC7.flatMap((x) => [[x - 36, POST_Y - 36], [x - 20, POST_Y - 36]]);
  const FLOAT7 = [[560, 480], [700, 460], [690, 580], [850, 575], [420, 520], [540, 585], [900, 490], [610, 455]];
  const sit = (pos, until) => ({ type: 'mover', once: true, r: 5.5, color: '#f08c1a', path: [pos, [pos[0] + 0.1, pos[1]]], duration: 0.05, at: 0, until });
  const toTransporter = (pos, t0) => {
    const x = pos[0] < 660 ? TRANS7[0] : TRANS7[1];
    const end = [x + (x < 660 ? 50 : -50), PRE_Y - 95];
    return { type: 'mover', once: true, vanish: true, r: 5.5, color: '#f08c1a', smooth: true, path: [pos, [x, PRE_Y + 45], [x, PRE_Y], [x, PRE_Y - 45], end], duration: 1.3, at: t0 };
  };
  const ENZ_FROM = [[560, 480], [690, 580], [540, 585], [850, 575]];
  const cleanItems = [
    { type: 'value', id: 'syn7t', from: 7.6, to: 11.2, at: 0, duration: 3.6, linear: true },
    { type: 'value', id: 'r7', from: 1, to: 1, at: 0, duration: 0.05 },
    { type: 'value', id: 'r7', from: 1, to: 0, at: 0.45, duration: 0.35 },
    ...BOUND7.map((p) => sit(p, 0.35)),
    ...BOUND7.map((p, i) => toTransporter(p, 0.35 + i * 0.1)),
    ...FLOAT7.filter((p) => !ENZ_FROM.some((q) => q[0] === p[0] && q[1] === p[1])).flatMap((p, i) => [sit(p, 0.3 + i * 0.15), toTransporter(p, 0.3 + i * 0.15)]),
    ...TRANS7.map((x) => ({ type: 'flash', x, y: PRE_Y, r: 34, color: '#16a3b8', duration: 0.6, at: 1.1 })),
    ...ENZ_FROM.flatMap((p, i) => {
      const [ex, ey] = ENZ7[i % 2], tArrive = 1.8 + 0.25 * i + 0.7;
      return [
        sit(p, 1.8 + 0.25 * i),
        { type: 'mover', once: true, vanish: true, r: 5.5, color: '#f08c1a', smooth: true, path: [p, [(p[0] + ex) / 2, (p[1] + ey) / 2 + 10], [ex + 6, ey]], duration: 0.7, at: 1.8 + 0.25 * i },
        { type: 'flash', x: ex, y: ey, r: 30, color: '#8a4fd8', duration: 0.5, at: tArrive },
        ...[[-55, -30], [50, 35]].map(([dx, dy]) => ({ type: 'mover', once: true, vanish: true, r: 3.5, color: '#9aa1ad', path: [[ex, ey], [ex + dx, ey + dy]], duration: 0.8, at: tArrive + 0.05 })),
      ];
    }),
  ];
  const syn7Items = [
    { type: 'value', id: 'syn7t', from: 0, to: 7.5, at: 0, duration: 7.5, linear: true },
    { type: 'mover', once: true, vanish: true, r: 11, color: '#ff5a36', smooth: true, path: [[-30, 250], [150, 246], [300, 272], [470, 340]], duration: 0.9, at: 0.1 },
    { type: 'flash', x: 660, y: 330, r: 200, color: '#ff5a36', duration: 0.8, at: 0.9 },
    { type: 'value', id: 'ca7', from: 0, to: 1, at: 1.2, duration: 0.3 },
    ...CA_IN.map(([x, from, to], i) => ({ type: 'ion', ion: 'ca', smooth: true, path: caPore(x, from, to), duration: 1.2, at: 1.5 + (i % 2) * 0.25 })),
    ...DOCK7.map(([x, y]) => ({ type: 'flash', x, y, r: 50, color: '#e0559a', duration: 0.7, at: 2.6 })),
    { type: 'value', id: 'ca7', from: 1, to: 0, at: 3.5, duration: 0.4 },
    ...DOCK7.map(([x, y], k) => ({ type: 'vesicle', fuse: true, path: [[x, y], [x, PRE_Y - 14]], r: 24, color: PURPLE.outline, duration: 1.1, at: 2.7 + k * 0.12 })),
    // neurotransmitters spill out and wander across; some bind the excitatory receptors
    ...DOCK7.flatMap(([x], k) => [0, 1, 2, 3, 4].map((n) => {
      const id = k * 5 + n;
      const sx = x + (n - 2) * 7;
      const bind = n < 2;
      const r = EXC7[(k + n) % 2];
      const to = bind ? [r - 28 + (n ? 8 : -8), POST_Y - 36] : [220 + rnd(id, 1) * 860, PRE_Y + 40 + rnd(id, 2) * 80];
      const w1 = [sx + (rnd(id, 3) - 0.5) * 120, PRE_Y + 28 + rnd(id, 4) * 30];
      const w2 = [(w1[0] + to[0]) / 2 + (rnd(id, 5) - 0.5) * 140, PRE_Y + 70 + rnd(id, 6) * 50];
      return { type: 'mover', once: true, r: 5.5, color: '#f08c1a', smooth: true, path: [[sx, PRE_Y + 4], w1, w2, to], duration: 1.4 + rnd(id, 7) * 0.8, at: 3.4 + rnd(id, 8) * 0.5 };
    })),
    { type: 'value', id: 'r7', from: 0, to: 1, at: 5.2, duration: 0.35 },
    ...NA_IN7.map(([from, to], i) => ({ type: 'ion', ion: 'na', smooth: true, path: naPore7(EXC7[i], from, to), duration: 1.1, at: 5.5 + i * 0.15 })),
    ...EXC7.map((x) => ({ type: 'flash', x, y: POST_Y + 70, r: 46, color: '#2e9e5b', duration: 0.7, at: 6.4 })),
  ];
  const syn7 = [
    title('At the synapse'),
    { type: 'svg', svg: synapse7Svg },
    ...FREE7.map(([x, y]) => ({ type: 'vesicle', x, y, r: 24, color: PURPLE.outline })),
    ...DOCK7.map(([x, y]) => ({ type: 'vesicle', x, y, r: 24, color: PURPLE.outline, hideDuring: 'syn7' })),
    ...CA7.map((x) => ({ type: 'channel', id: 'ca7', ligand: false, x, y: PRE_Y, h: 84, ...CA_STYLE })),
    ...EXC7.map((x) => ({ type: 'channel', id: 'r7', x, y: POST_Y + 10, h: 96, ...CH_STYLE.na, label: undefined })),
    ...INH7.map((x) => ({ type: 'channel', id: 'r7-inh', x, y: POST_Y + 10, h: 96, ...CH_STYLE.cl, label: undefined })),
    ...CA_OUT.map(([x, y]) => ({ type: 'ion', ion: 'ca', x, y })),
    ...CA_IN.map(([, from]) => ({ type: 'ion', ion: 'ca', x: from[0], y: from[1], hideDuring: 'syn7' })),
    ...NA_IN7.map(([from]) => ({ type: 'ion', ion: 'na', x: from[0], y: from[1], hideDuring: 'syn7' })),
    ...[[280, 850], [560, 770], [1010, 760], [1060, 830], [860, 790]].map(([x, y], i) => ({ type: 'ion', ion: i % 2 ? 'a' : 'k', x, y })),
    ...label('Axon terminal\n(sending neuron)', 70, 150, [282, 178], [330, 205], 'left', 24),
    ...label('Vesicles', 70, 345, [170, 345], [576, 325], 'left', 24),
    ...label('Ca²⁺ channel', 70, 410, [228, 410], [CA7[0] - 22, PRE_Y - 10], 'left', 24),
    ...label('Synaptic cleft', 70, 540, [238, 540], [262, 540], 'left', 24),
    ...label('Excitatory\nreceptor (Na⁺)', 70, 680, [274, 704], [EXC7[0] - 22, POST_Y + 30], 'left', 22),
    ...label('Inhibitory\nreceptor (Cl⁻)', 70, 790, [274, 812], [INH7[0] - 22, POST_Y + 50], 'left', 22),
    { type: 'text', x: 660, y: 845, text: 'Dendrite of the next neuron', size: 26, font: 'sans', color: '#1d5a2e', align: 'center' },
    {
      type: 'stepper', id: 'syn7t', x: 1190, y: 112, w: 370, h: 748, title: 'When the signal arrives', rowH: 46,
      steps: STEPS7, idleText: 'Press ▶ Action potential arrives,\nthen ▶ Clear the synapse.',
    },
    { type: 'text', x: 440, y: 362, text: 'Transporter', size: 18, font: 'sans', color: '#0b6f7e', align: 'center' },
    { type: 'text', x: 625, y: 568, text: 'Enzyme', size: 18, font: 'sans', color: '#5a3fb0', align: 'center' },
    { type: 'ion', ion: 'ca', x: 1218, y: 744, r: 15 },
    { type: 'text', x: 1240, y: 744, text: 'Ca²⁺', size: 19, font: 'sans', color: 'ink' },
    { type: 'circle', x: 1388, y: 744, r: 7, color: '#f08c1a', fill: '#f08c1a', fillOpacity: 1, width: 2, rough: false },
    { type: 'text', x: 1406, y: 744, text: 'Glutamate', size: 19, font: 'sans', color: 'ink' },
    { type: 'rect', x: 1209, y: 772, w: 18, h: 24, color: CH_STYLE.na.edge, fill: CH_STYLE.na.fill, fillOpacity: 1, width: 2, rough: false },
    { type: 'text', x: 1240, y: 784, text: 'Excitatory', size: 19, font: 'sans', color: 'ink' },
    { type: 'rect', x: 1379, y: 772, w: 18, h: 24, color: CH_STYLE.cl.edge, fill: CH_STYLE.cl.fill, fillOpacity: 1, width: 2, rough: false },
    { type: 'text', x: 1406, y: 784, text: 'Inhibitory', size: 19, font: 'sans', color: 'ink' },
    { type: 'rect', x: 1209, y: 812, w: 18, h: 24, color: '#0b6f7e', fill: '#9ad7e0', fillOpacity: 1, width: 2, rough: false },
    { type: 'text', x: 1240, y: 824, text: 'Transporter', size: 19, font: 'sans', color: 'ink' },
    { type: 'circle', x: 1388, y: 824, r: 11, color: '#5a3fb0', fill: '#c9b8ea', fillOpacity: 1, width: 2, rough: false },
    { type: 'text', x: 1406, y: 824, text: 'Enzyme', size: 19, font: 'sans', color: 'ink' },
  ];

  // ---------- slide 8: putting it all together ----------
  // The slide-1 circuit with Receive -> Combine -> Send boxes. One button plays
  // the whole chain and highlights each stage as it happens.
  const STAGES8 = [
    { name: 'Receive', from: 1.3, to: 3.35, x: 480, col: '#2f6fde', text: 'Transmitters bind\nto the dendrites' },
    { name: 'Combine', from: 3.35, to: 4.2, x: 725, col: '#e8890c', text: 'Signals add up at\nthe axon hillock' },
    { name: 'Send', from: 4.2, to: 8.2, x: 970, col: '#e0453a', text: 'Action potential\nfires and travels' },
  ];
  const BOX8 = { y: 680, w: 215, h: 132 };
  const finalItems = [
    ...fullItems.map((it) => ({ ...it })),
    ...STAGES8.map((st) => ({
      type: 'rect', x: st.x, y: BOX8.y, w: BOX8.w, h: BOX8.h, color: st.col, width: 5, fill: st.col, fillOpacity: 0.14,
      rough: false, duration: 0.25, at: st.from, until: st.to - st.from,
    })),
  ];
  const finalSlide = [
    title('Putting it all together'),
    { type: 'svg', svg: chainSvg },
    ...chainVesicles('final'),
    ...STAGES8.flatMap((st, i) => [
      { type: 'rect', x: st.x, y: BOX8.y, w: BOX8.w, h: BOX8.h, color: '#d9dce3', width: 2, fill: '#ffffff', fillOpacity: 1, rough: false },
      { type: 'circle', x: st.x + 28, y: BOX8.y + 32, r: 15, color: st.col, fill: st.col, fillOpacity: 1, width: 2, rough: false },
      { type: 'text', x: st.x + 28, y: BOX8.y + 33, text: String(i + 1), size: 18, font: 'sans', bold: true, color: 'white', align: 'center' },
      { type: 'text', x: st.x + 52, y: BOX8.y + 33, text: st.name, size: 26, font: 'sans', bold: true, color: st.col },
      { type: 'text', x: st.x + 16, y: BOX8.y + 78, text: st.text, size: 19, font: 'sans', color: '#3b4252' },
      ...(i < 2 ? [{ type: 'arrow', from: [st.x + BOX8.w + 6, BOX8.y + BOX8.h / 2], to: [st.x + BOX8.w + 26, BOX8.y + BOX8.h / 2], color: '#8a8f98', width: 4, rough: false }] : []),
    ]),
  ];

  // ---------- slide 9: thumbnail ----------
  // Bright cover: white background with a gradient border, the title on the
  // left and the neuron (firing an action potential) on the right.
  const TK = 0.56, TTX = 752, TTY = 205;            // neuron placement
  const tp = ([x, y]) => [x * TK + TTX, y * TK + TTY];
  const apGlowPts = axonSamples.filter((_, i) => i % 3 === 0).map(tp);
  const thumbSvg = svgDoc(`<defs>
    <linearGradient id="thBorder" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7a3cff"/><stop offset="0.55" stop-color="#d14bd0"/><stop offset="1" stop-color="#ff9d00"/>
    </linearGradient>
    <radialGradient id="thHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#e6d4ff" stop-opacity="0.9"/><stop offset="1" stop-color="#e6d4ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="thAp" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ff9d00" stop-opacity="0"/><stop offset="0.6" stop-color="#ff9d00" stop-opacity="0.85"/><stop offset="1" stop-color="#ffd34d"/>
    </linearGradient>
    <filter id="thBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="thBlurS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <rect x="0" y="0" width="1600" height="900" fill="#ffffff"/>
  <!-- soft glow behind the neuron -->
  <ellipse cx="${tp([soma.x, soma.y])[0] + 120}" cy="${tp([soma.x, soma.y])[1]}" rx="520" ry="330" fill="url(#thHalo)"/>
  <g transform="translate(${TTX} ${TTY}) scale(${TK})">${neuronMarkup(PURPLE, 'thumb', { releasing: false })}</g>
  <!-- action potential racing down the axon -->
  <polyline points="${apGlowPts.slice(60, 200).map((p) => p.map(f1).join(',')).join(' ')}" stroke="url(#thAp)" stroke-width="22" fill="none" stroke-linecap="round" filter="url(#thBlurS)"/>
  <polyline points="${apGlowPts.slice(95, 200).map((p) => p.map(f1).join(',')).join(' ')}" stroke="url(#thAp)" stroke-width="8" fill="none" stroke-linecap="round"/>
  ${(() => { const [x, y] = tp(axonAt(560)); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="28" fill="#ffb21e" filter="url(#thBlur)"/><circle cx="${f1(x)}" cy="${f1(y)}" r="10" fill="#fff3c4" stroke="#ff9d00" stroke-width="2"/>`; })()}
  ${(() => { const [x, y] = tp([495, 470]); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="26" fill="#ff5a36" opacity="0.55" filter="url(#thBlur)"/>`; })()}
  <!-- neurotransmitters leaving the terminal -->
  ${[[1385, 430], [1400, 470], [1390, 512], [1425, 450], [1430, 495], [1415, 535]].map(([x, y], i) => {
    const [px, py] = tp([x + 10, y]);
    return `<circle cx="${f1(px)}" cy="${f1(py)}" r="${5 + (i % 2)}" fill="#f08c1a"/>`;
  }).join('')}
  <!-- gradient border -->
  <rect x="18" y="18" width="1564" height="864" rx="34" fill="none" stroke="url(#thBorder)" stroke-width="22"/>
`);
  const thumbItems = [
    { type: 'svg', svg: thumbSvg },
    { type: 'text', x: 92, y: 262, text: 'HOW A', size: 100, font: 'sans', bold: true, color: '#1f2430' },
    { type: 'text', x: 86, y: 402, text: 'NEURON', size: 140, font: 'sans', bold: true, color: '#7a3cff', glow: '#c9b2ff', glowSize: 18 },
    { type: 'rect', x: 74, y: 500, w: 506, h: 118, color: '#ffd34d', width: 2, fill: '#ffd34d', fillOpacity: 0.9, rough: false },
    { type: 'text', x: 92, y: 562, text: 'WORKS', size: 126, font: 'sans', bold: true, color: '#1f2430' },
  ];

  function SLIDE1_LABELS() {
    const c = (p) => mp(T_C, p).map(Math.round);
    const syn1 = [Math.round((LEFT_END + mainTip[0]) / 2), AXIS + 10];
    const syn2 = [Math.round((mp(T_C, [1348, 470])[0] + rightTip[0]) / 2), AXIS + 10];
    return [
      ...label('Dendrites', 18, 262, [88, 282], c([170, 240]), 'left', 28),
      ...label('Cell body', 640, 190, [620, 210], c([420, 420]), 'center', 28),
      ...label('Axon hillock', 590, 700, [585, 678], c([500, 490]), 'center', 28),
      ...label('Myelin sheath', 930, 370, [930, 390], c(axonAt((sheaths[1].a + sheaths[1].b) / 2)).map((v, k) => v - [0, 14][k]), 'center', 28),
      ...label('Axon', 830, 700, [830, 678], c(axonAt((sheaths[0].b + sheaths[1].a) / 2)), 'center', 28),
      ...label('Axon terminal', 1095, 300, [1120, 320], c([1290, 425]), 'center', 28),
      ...label('Synapse', 12, 440, [58, 458], syn1, 'left', 24),
      ...label('Synapse', 1150, 650, [1168, 630], syn2, 'center', 26),
    ];
  }

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'neuron',
    title: '🧠 How a neuron works',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: overview - three neurons in a chain; the main one labelled.
      {
        say: 'A neuron has four main parts: dendrites, a cell body, an axon, and axon terminals.',
        actions: [
          { id: 'release', label: 'Release neurotransmitters', items: releaseItems },
          { id: 'full', label: 'Full signal: neuron to neuron', items: fullItems },
        ],
        items: [
          { type: 'text', x: 800, y: 80, text: 'How a neuron works', size: 60, font: 'sans', bold: true, align: 'center', color: 'ink' },
          { type: 'svg', svg: chainSvg },
          ...chainVesicles(['release', 'full']),
          ...SLIDE1_LABELS(),
        ],
      },
      // Slide 2: receiving - an excitatory and an inhibitory terminal on one dendrite.
      // (The older, detailed membrane-potential slide is still defined above as
      // membraneItems / membraneActions, unused, for a possible deep-dive video.)
      {
        say: 'The inside of the dendrite is more negative (−70 mV). Excitatory signals push it up; inhibitory signals push it down.',
        clear: true,
        actions: recvActions,
        items: recvItems,
      },
      // Slide 3: glutamate vs GABA synapses and their effect on the postsynaptic potential.
      {
        say: 'Glutamate opens Na⁺ channels and excites (EPSP); GABA opens Cl⁻ channels and inhibits (IPSP).',
        clear: true,
        actions: synActions,
        items: synItems,
      },
      // Slide 4: adding up inputs - the axon hillock decides whether to fire.
      {
        say: 'Inputs add up at the axon hillock; if it reaches threshold, the neuron fires an action potential.',
        clear: true,
        actions: sumActions,
        items: sumItems,
      },
      // Slide 5: the action potential at the axon hillock, graph in step with the channels.
      {
        say: 'At threshold, voltage-gated Na⁺ channels open (rise), then inactivate while K⁺ channels open (fall).',
        clear: true,
        actions: [{ id: 'ap', label: 'Fire an action potential', items: apTimeline }],
        items: apItems,
      },
      // Slide 6: the action potential travels down the axon (saltatory conduction) and is passed on.
      {
        say: 'The action potential regenerates along the axon, jumping node to node through the myelin, then triggers release at the terminal.',
        clear: true,
        actions: [{ id: 'prop', label: 'Send the action potential', items: propItems6 }],
        items: propItems,
      },
      // Slide 7: at the synapse - Ca2+ entry, vesicle fusion, neurotransmitters crossing the cleft.
      {
        say: 'The action potential opens Ca²⁺ channels; Ca²⁺ makes vesicles release neurotransmitters, which cross the cleft.',
        clear: true,
        actions: [
          { id: 'syn7', label: 'Action potential arrives', items: syn7Items },
          { id: 'clean', label: 'Clear the synapse', items: cleanItems },
        ],
        items: syn7,
      },
      // Slide 8: putting it all together - receive, combine, send.
      {
        say: 'Receive, combine, send: the neuron listens to many inputs, decides at the axon hillock, and passes the message on.',
        clear: true,
        actions: [{ id: 'final', label: 'Play the whole process', items: finalItems }],
        items: finalSlide,
      },
      // Slide 9: thumbnail for the video (save it with the PNG button).
      {
        say: 'Thumbnail: press 💾 to save it (1920×1080 JPEG, under YouTube’s 2 MB limit).',
        clear: true,
        thumbnail: true,
        items: thumbItems,
      },
    ],
  });

})();
