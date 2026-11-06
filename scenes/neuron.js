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

  // ---------- slide 2: two neurons ----------
  const S2 = 0.52;
  const n1 = { tx: -4, ty: 236 };   // sending neuron (blue)
  const n2 = { tx: 690, ty: 236 };  // receiving neuron (purple)
  const at = (n, x, y) => [Math.round(x * S2 + n.tx), Math.round(y * S2 + n.ty)];
  const twoNeuronsSvg = svgDoc(
    `<g transform="translate(${n1.tx} ${n1.ty}) scale(${S2})">${neuronMarkup(BLUE, 'n1')}</g>` +
    `<g transform="translate(${n2.tx} ${n2.ty}) scale(${S2})">${neuronMarkup(PURPLE, 'n2')}</g>`);

  // ---------- slide 3: synapse close-up ----------
  const vesicles = [[700, 250], [785, 225], [875, 245], [955, 290], [735, 330], [870, 335], [1010, 355], [640, 360]];
  const receptorsX = [560, 680, 800, 920, 1040];
  const boundAt = [680, 920]; // receptors already holding a neurotransmitter
  const dots = (cx, cy, color) => [[-8, -6], [7, -8], [0, 4], [-9, 9], [9, 7]]
    .map(([a, b]) => `<circle cx="${cx + a}" cy="${cy + b}" r="4.5" fill="${color}" stroke="#b9650b" stroke-width="1"/>`).join('');
  const synapseSvg = svgDoc(`<defs>
    <linearGradient id="preG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e3eefb"/><stop offset="1" stop-color="#9cc0ea"/>
    </linearGradient>
    <linearGradient id="postG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9d6f1"/><stop offset="1" stop-color="#b783cc"/>
    </linearGradient>
    <radialGradient id="vesG" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d4e5f8"/>
    </radialGradient>
    <filter id="sh3" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#13294a" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g filter="url(#sh3)">
    <!-- axon of the sending neuron, coming in from the top right -->
    <path d="M1560 -40 Q1400 110 980 250" stroke="#2c5a92" stroke-width="80" fill="none" stroke-linecap="round"/>
    <path d="M1560 -40 Q1400 110 980 250" stroke="#bcd5f2" stroke-width="72" fill="none" stroke-linecap="round"/>
    <!-- axon terminal (bulb) -->
    <path d="M470 360 C470 205 640 160 800 160 C960 160 1130 205 1130 360 Q1130 422 1068 425 L532 425 Q470 422 470 360 Z" fill="url(#preG)" stroke="#2c5a92" stroke-width="6"/>
    <!-- receiving dendrite -->
    <path d="M280 940 L280 565 Q280 525 322 525 L1278 525 Q1320 525 1320 565 L1320 940 Z" fill="url(#postG)" stroke="#5e2f78" stroke-width="6"/>
  </g>
  <!-- a mitochondrion powering the terminal -->
  <ellipse cx="570" cy="300" rx="62" ry="28" fill="#f6c99a" stroke="#b9650b" stroke-width="3"/>
  <path d="M528 300 q10 -18 20 0 t20 0 t20 0 t20 0" stroke="#b9650b" stroke-width="2.5" fill="none"/>
  <!-- synaptic vesicles filled with neurotransmitters -->
  ${vesicles.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="27" fill="url(#vesG)" stroke="#2c5a92" stroke-width="3"/>${dots(x, y, '#f0a24a')}`).join('')}
  <!-- a vesicle fusing with the membrane and opening into the gap -->
  <circle cx="800" cy="405" r="26" fill="url(#vesG)" stroke="#2c5a92" stroke-width="3"/>
  <rect x="784" y="414" width="32" height="16" fill="#fdfdfb"/>
  <path d="M784 425 Q790 418 784 412 M816 425 Q810 418 816 412" stroke="#2c5a92" stroke-width="3" fill="none"/>
  ${[[792, 398], [806, 404], [798, 412]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#f0a24a" stroke="#b9650b" stroke-width="1"/>`).join('')}
  <!-- receptors on the dendrite membrane -->
  ${receptorsX.map((x) => `<rect x="${x - 26}" y="497" width="18" height="60" rx="8" fill="#47b26c" stroke="#226b3c" stroke-width="2.5"/>
    <rect x="${x + 8}" y="497" width="18" height="60" rx="8" fill="#47b26c" stroke="#226b3c" stroke-width="2.5"/>`).join('')}
  ${boundAt.map((x) => `<circle cx="${x}" cy="500" r="7" fill="#f08c1a" stroke="#b9650b" stroke-width="1.5"/>`).join('')}
`);
  const neurotransmitterMovers = receptorsX.filter((x) => !boundAt.includes(x)).concat([680, 920]).map((x, i) => ({
    type: 'mover', r: 6, color: '#f08c1a', count: 2, speed: 1.7 + (i % 3) * 0.35, smooth: true,
    path: [[800, 432], [(800 + x) / 2 + (i % 2 ? 20 : -20), 465], [x, 494]],
    with: i > 0,
  }));

  // ---------- slide 4: signals flow from the dendrites to the cell body ----------
  const nums = (d) => d.match(/-?\d+(\.\d+)?/g).map(Number);
  const trunkGeom = trunks.map(([d]) => { const [x0, y0, cx, cy, x1, y1] = nums(d); return { s: [x0, y0], c: [cx, cy], e: [x1, y1] }; });
  // One moving signal per branch: tip -> trunk -> cell body.
  const inwardPaths = branchesN.map(([d]) => {
    const [bx0, by0, bcx, bcy, bx1, by1] = nums(d);
    const t = trunkGeom.find((g) => Math.abs(g.e[0] - bx0) < 1 && Math.abs(g.e[1] - by0) < 1);
    return [[bx1, by1], [bcx, bcy], [bx0, by0], t.c, t.s, [soma.x, soma.y]];
  });
  // Arrows run beside each trunk, pointing toward the cell body.
  const inwardArrows = trunkGeom.map((g) => {
    const dx = g.e[0] - g.s[0], dy = g.e[1] - g.s[1], len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len, off = 30;
    const from = [g.e[0] + nx * off - (dx / len) * 10, g.e[1] + ny * off - (dy / len) * 10];
    const to = [g.s[0] + nx * off + (dx / len) * 12, g.s[1] + ny * off + (dy / len) * 12];
    return { type: 'arrow', from: from.map(Math.round), to: to.map(Math.round), color: SIGNAL, width: 6, rough: false };
  });

  // ---------- slide 5: many branches, many connections ----------
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
  // A branch growing out of a point on its parent.
  const sprout = (parent, t, dc, d1, w0, w1) => {
    const p0 = quad(parent, t);
    return { p0, c: [p0[0] + dc[0], p0[1] + dc[1]], p1: [p0[0] + d1[0], p0[1] + d1[1]], w0, w1 };
  };
  const trunk = { p0: [1390, 520], c: [850, 560], p1: [240, 450], w0: 80, w1: 26 };
  // Main branches alternate up and down along the trunk, angled away from the cell body.
  const bA = sprout(trunk, 0.25, [-20, -200], [-140, -330], 34, 12);
  const bB = sprout(trunk, 0.38, [-10, 170], [-90, 300], 30, 12);
  const bC = sprout(trunk, 0.55, [-60, -220], [-220, -345], 34, 12);
  const bD = sprout(trunk, 0.67, [-20, 170], [-170, 310], 30, 12);
  const bE = sprout(trunk, 0.8, [-30, -160], [-150, -285], 26, 11);
  const bF = sprout(trunk, 0.91, [-20, 130], [-130, 250], 20, 9);
  // Smaller forks off some branches.
  const fA = sprout(bA, 0.55, [60, -60], [150, -90], 16, 8);
  const fB = sprout(bB, 0.55, [70, 30], [150, 60], 15, 8);
  const fC = sprout(bC, 0.5, [70, -50], [150, -70], 16, 8);
  const fD = sprout(bD, 0.55, [-70, 20], [-150, 30], 15, 8);
  const fE = sprout(bE, 0.55, [-70, -10], [-150, 10], 13, 7);
  const sideBranches = [fA, fB, fC, fD, fE, bA, bB, bC, bD, bE, bF];
  const allBranches = [...sideBranches, trunk];

  function spineAt(b, t, side, len, r) {
    const n = normal(b, t).map((v) => v * side);
    const base = add(quad(b, t), n, widthAt(b, t) / 2 - 3);
    return { base, head: add(base, n, len), n, r };
  }
  const spines = [];
  allBranches.forEach((b, bi) => {
    const ts = b === trunk ? [0.12, 0.2, 0.45, 0.55, 0.74, 0.9, 0.96] : [0.3, 0.45, 0.62, 0.78, 0.92];
    ts.forEach((t, i) => {
      const side = (i + bi) % 2 ? 1 : -1;
      const kind = (i * 7 + bi * 3) % 3; // mushroom, thin, stubby
      spines.push(spineAt(b, t, side, [24, 28, 13][kind], [10, 7, 9][kind]));
    });
  });

  // Incoming axon terminals, each from a different neuron (different colours).
  const AXON_COLORS = [
    ['#2c5a92', '#8fb6e6', '#e3eefb', '#6f9fd8'], // blue
    ['#1f6f6b', '#7cc7c0', '#e0f4f2', '#4fa9a1'], // teal
    ['#2f6b2a', '#9bd18f', '#eaf7e6', '#6db35f'], // green
    ['#9a4f0d', '#f2b46d', '#fdf0e1', '#e08a2c'], // orange
    ['#9c2a5c', '#ef9cc0', '#fde8f1', '#d76a99'], // pink
    ['#7a6200', '#e8cf5a', '#fbf5d9', '#c9a923'], // gold
  ];
  const synapseSpecs = [
    [bA, 0.85, -1, 110], [fA, 0.9, 1, 100], [bB, 0.8, 1, 110], [fB, 0.9, -1, 100],
    [bC, 0.8, 1, 70], [fC, 0.9, -1, 70], [bD, 0.85, -1, 110], [fD, 0.9, 1, 100],
    [bE, 0.85, 1, 70], [bF, 0.85, -1, 100],
  ];
  const incoming = synapseSpecs.map(([b, t, side, axonLen], i) => {
    const sp = spineAt(b, t, side, 30, 13);
    const bouton = add(sp.head, sp.n, sp.r + 12 + 22);
    const perp = [-sp.n[1], sp.n[0]];
    const axonEnd = add(add(bouton, sp.n, axonLen), perp, i % 2 ? 30 : -30);
    const ctrl = add(add(bouton, sp.n, axonLen * 0.5), perp, i % 2 ? -20 : 20);
    return { ...sp, bouton, axonEnd, ctrl, perp, col: AXON_COLORS[i % AXON_COLORS.length] };
  });

  const spineMarkup = (list, color, extra) => list.map((sp) =>
    `<path d="M${sp.base.map(f1)} L${sp.head.map(f1)}" stroke="${color}" stroke-width="${7 + extra}" stroke-linecap="round"/>` +
    `<circle cx="${f1(sp.head[0])}" cy="${f1(sp.head[1])}" r="${sp.r + extra / 2}" fill="${color}"/>`).join('');

  const SHIFT5 = 45; // artwork sits a little lower, clear of the title
  const branchesSvg = svgDoc(`<g transform="translate(0 ${SHIFT5})"><defs>
    <linearGradient id="dG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e4cdee"/><stop offset="0.5" stop-color="#c69ad8"/><stop offset="1" stop-color="#ad78c6"/>
    </linearGradient>
    <radialGradient id="cbG" cx="30%" cy="40%" r="75%">
      <stop offset="0" stop-color="#f3e6f8"/><stop offset="0.6" stop-color="#d4afe2"/><stop offset="1" stop-color="#ad78c6"/>
    </radialGradient>
    ${AXON_COLORS.map((c, i) => `<radialGradient id="bt${i}" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[3]}"/></radialGradient>`).join('')}
    <filter id="sh5" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#3b1452" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g filter="url(#sh5)">
    ${incoming.map((s) => `<path d="M${s.axonEnd.map(f1)} Q${s.ctrl.map(f1)} ${s.bouton.map(f1)}" stroke="${s.col[0]}" stroke-width="16" fill="none" stroke-linecap="round"/>`).join('')}
    ${incoming.map((s) => `<path d="M${s.axonEnd.map(f1)} Q${s.ctrl.map(f1)} ${s.bouton.map(f1)}" stroke="${s.col[1]}" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('')}
    ${incoming.map((s, i) => `<circle cx="${f1(s.bouton[0])}" cy="${f1(s.bouton[1])}" r="25" fill="${s.col[0]}"/><circle cx="${f1(s.bouton[0])}" cy="${f1(s.bouton[1])}" r="22" fill="url(#bt${i % AXON_COLORS.length})"/>`).join('')}

    ${allBranches.map((b) => `<path d="${taperD(b)}" fill="${PURPLE.outline}" stroke="${PURPLE.outline}" stroke-width="6" stroke-linejoin="round"/><circle cx="${f1(b.p1[0])}" cy="${f1(b.p1[1])}" r="${b.w1 / 2 + 3}" fill="${PURPLE.outline}"/>`).join('')}
    ${spineMarkup(spines.concat(incoming), PURPLE.outline, 6)}
    <circle cx="1560" cy="520" r="233" fill="${PURPLE.outline}"/>
    ${sideBranches.map((b) => `<path d="${taperD(b)}" fill="url(#dG)"/><circle cx="${f1(b.p1[0])}" cy="${f1(b.p1[1])}" r="${b.w1 / 2}" fill="${PURPLE.fill}"/>`).join('')}
    ${spineMarkup(spines.concat(incoming), PURPLE.fill, 0)}
    <path d="${taperD(trunk)}" fill="url(#dG)"/>
    <circle cx="1560" cy="520" r="230" fill="url(#cbG)"/>
  </g>
  ${incoming.map((s) => { const c = add(s.head, s.n, s.r - 2); const a = add(c, s.perp, 10), b = add(c, s.perp, -10); return `<path d="M${a.map(f1)} L${b.map(f1)}" stroke="#2e9e5b" stroke-width="6" stroke-linecap="round"/>`; }).join('')}
  ${incoming.map((s) => [[-6, 0], [5, 3], [0, -4]].map(([a, b]) => { const p = add(add(add(s.head, s.n, s.r + 6), s.perp, a), s.n, b); return `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="3" fill="#f08c1a"/>`; }).join('')).join('')}
  ${[[1450, 420], [1500, 600], [1420, 650], [1530, 380], [1470, 520]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${PURPLE.gran}" opacity="0.4"/>`).join('')}
</g>`);


  // ---------- slide 1: the main neuron as part of a circuit ----------
  // Left: an axon terminal from another (blue) neuron reaches a dendrite tip.
  // Right: a dendrite of the next (green) neuron sits just past the axon terminal.
  const GREEN = { outline: '#2f6b2a', fill: '#9bd18f', light: '#eaf7e6', dark: '#6db35f' };
  const nextMain = { p0: [1640, 470], c: [1520, 472], p1: [1402, 470], w0: 40, w1: 30 };
  const nextUp = { p0: [1530, 471], c: [1580, 420], p1: [1640, 340], w0: 22, w1: 12 };
  const nextDown = { p0: [1505, 470], c: [1560, 540], p1: [1640, 610], w0: 20, w1: 11 };
  const receptorYs = [458, 466, 474, 482];
  const RECEPTOR_X = 1386;
  const inTerminal = { x: 478, y: 836, r: 24 };
  const inAxon = 'M770 915 Q630 852 500 838';
  const circuitSvg = svgDoc(`<defs>
    <linearGradient id="nextG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GREEN.light}"/><stop offset="0.5" stop-color="${GREEN.fill}"/><stop offset="1" stop-color="${GREEN.dark}"/>
    </linearGradient>
    <radialGradient id="inG" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="${BLUE.b0}"/><stop offset="1" stop-color="${BLUE.b1}"/></radialGradient>
    <filter id="shC" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#13294a" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g filter="url(#shC)">
    <!-- dendrite of the next neuron -->
    ${[nextUp, nextDown, nextMain].map((b) => `<path d="${taperD(b)}" fill="${GREEN.outline}" stroke="${GREEN.outline}" stroke-width="6" stroke-linejoin="round"/><circle cx="${b.p1[0]}" cy="${b.p1[1]}" r="${b.w1 / 2 + 3}" fill="${GREEN.outline}"/>`).join('')}
    ${[nextUp, nextDown].map((b) => `<path d="${taperD(b)}" fill="url(#nextG)"/><circle cx="${b.p1[0]}" cy="${b.p1[1]}" r="${b.w1 / 2}" fill="${GREEN.fill}"/>`).join('')}
    <path d="${taperD(nextMain)}" fill="url(#nextG)"/><circle cx="${nextMain.p1[0]}" cy="${nextMain.p1[1]}" r="${nextMain.w1 / 2}" fill="${GREEN.fill}"/>
    <!-- axon terminal of another neuron -->
    <path d="${inAxon}" stroke="${BLUE.outline}" stroke-width="18" fill="none" stroke-linecap="round"/>
    <path d="${inAxon}" stroke="${BLUE.fill}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <circle cx="${inTerminal.x}" cy="${inTerminal.y}" r="${inTerminal.r + 3}" fill="${BLUE.outline}"/>
    <circle cx="${inTerminal.x}" cy="${inTerminal.y}" r="${inTerminal.r}" fill="url(#inG)"/>
  </g>
  <!-- receptors on the tip of the next neuron's dendrite -->
  ${receptorYs.map((y) => `<rect x="${RECEPTOR_X - 3}" y="${y - 3}" width="7" height="6" rx="2" fill="#1d5a2e"/>`).join('')}
  ${[[-9, -7], [7, -9], [-6, 8], [8, 6]].map(([a, b]) => `<circle cx="${inTerminal.x + a}" cy="${inTerminal.y + b}" r="6" fill="#ffffff" fill-opacity="0.85" stroke="${BLUE.outline}" stroke-width="1.5"/><circle cx="${inTerminal.x + a}" cy="${inTerminal.y + b}" r="2" fill="#f08c1a"/>`).join('')}
`);

  // Vesicles that the "Release neurotransmitters" button sends to the membrane.
  const FUSING = [2, 4, 7]; // indexes into vesiclePts
  const fuseTargets = [[1337, 457], [1339, 474], [1335, 491]];
  const releaseItems = [
    ...FUSING.map((vi, k) => ({
      type: 'vesicle', fuse: true, path: [vesiclePts[vi], fuseTargets[k]], r: 11,
      duration: 1.6, with: k > 0, wait: k ? 0.25 : 0,
    })),
    // neurotransmitters cross the synaptic cleft and bind to the receptors
    ...FUSING.flatMap((_, k) => [0, 1, 2].map((n) => {
      const [fx, fy] = fuseTargets[k];
      const ry = receptorYs[(k + n) % receptorYs.length] + (n - 1) * 2;
      return {
        type: 'mover', once: true, r: 3, color: '#f08c1a', smooth: true,
        path: [[fx + 9, fy], [fx + 24, (fy + ry) / 2 + (n - 1) * 6], [RECEPTOR_X - 6, ry]],
        duration: 1.1, with: true, wait: k === 0 && n === 0 ? 0.6 : 0.12,
      };
    })),
    // the next neuron responds and the signal carries on along its dendrite
    { type: 'pulse', x: 1418, y: 470, r: 34, color: '#2e9e5b', speed: 1.4, wait: 0.2 },
    { type: 'mover', once: true, r: 7, color: '#2e9e5b', path: [[1408, 470], [1520, 472], [1640, 470]], duration: 1.6, with: true },
  ];

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'neuron',
    title: '🧠 How a neuron works',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: the parts of a neuron, labelled, as part of a small circuit.
      {
        say: 'A neuron has four main parts: dendrites, a cell body, an axon, and axon terminals.',
        actions: [{ id: 'release', label: 'Release neurotransmitters', items: releaseItems }],
        items: [
          { type: 'text', x: 800, y: 80, text: 'How a neuron works', size: 60, font: 'sans', bold: true, align: 'center', color: 'ink' },
          { type: 'svg', svg: circuitSvg },
          { type: 'svg', svg: svgDoc(neuronMarkup(PURPLE, 'main', { skip: FUSING, releasing: false })) },
          ...FUSING.map((vi) => ({ type: 'vesicle', x: vesiclePts[vi][0], y: vesiclePts[vi][1], r: 11, hideDuring: 'release' })),
          ...label('Dendrites', 70, 120, [150, 140], [205, 236], 'left', 34),
          ...label('Cell body', 560, 300, [545, 318], [425, 425], 'center', 34),
          ...label('Axon hillock', 560, 640, [555, 618], [500, 488], 'center', 34),
          ...label('Myelin sheath', 880, 330, [880, 352], axonAt((sheaths[1].a + sheaths[1].b) / 2).map((v, k) => Math.round(v - [0, 16][k])), 'center', 34),
          ...label('Axon', 790, 640, [790, 618], axonAt((sheaths[0].b + sheaths[1].a) / 2).map(Math.round), 'center', 34),
          ...label('Axon terminal', 1420, 300, [1395, 322], [1318, 428], 'center', 34),
          ...label('Vesicles with\nneurotransmitters', 1190, 700, [1215, 672], [1290, 514], 'center', 30),
          ...label('Dendrite of the\nnext neuron', 1475, 610, [1475, 586], [1468, 478], 'center', 30),
          ...label('Axon terminal of\nanother neuron', 600, 790, [592, 800], [496, 826], 'left', 30),
        ],
      },
      // Slide 2: their main function. One neuron passes a signal to the next one's dendrites.
      {
        say: "Dendrites' main job: receive signals sent by other neurons.",
        clear: true,
        items: [
          title("Dendrites: their main function"),
          { type: 'svg', svg: twoNeuronsSvg },
          signalArrow(at(n1, 560, 400), at(n1, 1220, 400)),
          note('Signal travels down the axon', ...at(n1, 890, 340)),
          signalArrow(at(n1, 1300, 390), at(n2, 230, 300), -45),
          note('…and is picked up by the\nnext neuron’s dendrites', 780, 220),
          { type: 'circle', x: 714, y: 480, r: 62, color: '#8a8f98', width: 3, dashed: true, rough: false },
          ...label('Neuron 1 (sending)', ...at(n1, 760, 900), at(n1, 760, 830), at(n1, 760, 485), 'center', 32),
          ...label('Neuron 2 (receiving)', ...at(n2, 760, 900), at(n2, 760, 830), at(n2, 760, 485), 'center', 32),
          ...label('Dendrites', ...at(n2, 120, 905), at(n2, 140, 840), at(n2, 180, 690), 'center', 32),
        ],
      },
      // Slide 3: how they receive signals (synapse close-up).
      {
        say: 'Neurotransmitters are released into the gap and attach to receptors on the dendrite.',
        clear: true,
        items: [
          title('How dendrites receive signals'),
          { type: 'svg', svg: synapseSvg },
          ...neurotransmitterMovers,
          ...label('Axon terminal\n(sending neuron)', 60, 200, [335, 222], [478, 300], 'left', 32),
          ...label('Synaptic cleft (gap)', 60, 475, [365, 475], [520, 475], 'left', 32),
          ...label('Synaptic vesicles', 1560, 300, [1285, 300], [982, 292], 'right', 32),
          ...label('Neurotransmitters', 1560, 445, [1275, 448], [828, 455], 'right', 32),
          ...label('Receptors', 1560, 600, [1392, 600], [1060, 540], 'right', 32),
          { type: 'text', x: 800, y: 760, text: 'Dendrite (receiving neuron)', size: 36, font: 'sans', color: 'ink', align: 'center' },
        ],
      },
      // Slide 4: where signals go next (dendrites -> cell body, animated).
      {
        say: 'From the dendrites, signals flow inward to the cell body.',
        clear: true,
        items: [
          title('Where signals go next'),
          { type: 'svg', svg: svgDoc(neuronMarkup(PURPLE, 'flow')) },
          ...inwardArrows,
          ...inwardPaths.map((path, i) => ({ type: 'mover', path, smooth: true, r: 8, color: SIGNAL, speed: 2.2 + (i % 4) * 0.3, with: i > 0 })),
          { type: 'pulse', x: soma.x, y: soma.y, r: 95, color: SIGNAL, speed: 2, with: true },
          ...label('Dendrites', 70, 845, [130, 820], [175, 745], 'left', 32),
          ...label('Cell body', 640, 300, [620, 318], [445, 420], 'center', 32),
          note('Signals flow from the dendrites\ninto the cell body', 1000, 650),
        ],
      },
      // Slide 5: why their shape matters (many branches, many connections).
      {
        say: 'Lots of branches mean lots of connections, so one neuron can listen to many others.',
        clear: true,
        items: [
          title('Why dendrites’ shape matters'),
          { type: 'svg', svg: branchesSvg },
          ...SHAPE_LABELS(),
        ],
      },
    ],
  });

  function SHAPE_LABELS() {
    return [
      ...label('Branches', 80, 175, [195, 192], [372, 292], 'left', 32),
      ...label('Cell body', 1470, 285, [1470, 307], [1470, 372], 'center', 32),
      note('More branches = more connections\n= more signals received', 1290, 160, 'center', 'ink'),
      note('Each colour is a signal coming\nfrom a different neuron', 1340, 820),
      { type: 'line', from: [1190, 805], to: [1112, 752], color: DARK, width: 2.5, rough: false },
      { type: 'circle', x: 1112, y: 752, r: 5, color: DARK, width: 2, fill: DARK, fillOpacity: 1, rough: false },
    ];
  }
})();
