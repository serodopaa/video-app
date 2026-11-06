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
  const membraneSvg = svgDoc(`
  <rect x="${MEM.x0}" y="112" width="${MEM.x1 - MEM.x0}" height="${MEM.top - 112}" rx="16" fill="#eef6fd"/>
  <rect x="${MEM.x0}" y="${MEM.bot}" width="${MEM.x1 - MEM.x0}" height="${860 - MEM.bot}" rx="16" fill="#f7f0fb"/>
  <rect x="${MEM.x0}" y="${MEM.top}" width="${MEM.x1 - MEM.x0}" height="${MEM.bot - MEM.top}" fill="#fbecd6"/>
  ${bilayer}
  ${Array.from({ length: 15 }, (_, i) => MEM.x0 + 40 + i * 70).map((x) =>
    `<text x="${x}" y="${MEM.top - 7}" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#e0453a" text-anchor="middle">+</text>` +
    `<text x="${x}" y="${MEM.bot + 25}" font-family="Arial, sans-serif" font-weight="700" font-size="26" fill="#2f6fde" text-anchor="middle">−</text>`).join('')}
`);

  // Ions that stay put. [type, x, y]
  const staticIons = [
    // outside: lots of Na+ and Cl-, a little K+
    ['na', 140, 230], ['na', 240, 320], ['na', 445, 205], ['na', 525, 300], ['na', 700, 225], ['na', 790, 325],
    ['na', 1000, 215], ['na', 1070, 320], ['na', 610, 175],
    ['cl', 190, 180], ['cl', 120, 320], ['cl', 360, 175], ['cl', 700, 320], ['cl', 820, 195], ['cl', 1075, 185], ['cl', 1010, 330],
    ['k', 455, 365], ['k', 765, 380],
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
  const membraneActions = [
    channelAction('na', 'Open Na⁺ channel', -58, true),
    channelAction('k', 'Open K⁺ channel', -80, false),
    channelAction('cl', 'Open Cl⁻ channel', -76, true),
  ];
  const membraneItems = [
    title('Membrane potential'),
    { type: 'svg', svg: membraneSvg },
    { type: 'text', x: 80, y: 140, text: 'Outside the cell', size: 26, font: 'sans', color: '#2c5a92' },
    { type: 'text', x: 80, y: 838, text: 'Inside the cell', size: 26, font: 'sans', color: '#6b3c87' },
    ...staticIons.map(([ion, x, y]) => ({ type: 'ion', ion, x, y })),
    ...Object.entries(flows).flatMap(([kind, list]) => list.map(([ion, from]) => ({ type: 'ion', ion, x: from[0], y: from[1], hideDuring: `open-${kind}` }))),
    ...['na', 'k', 'cl'].map((kind) => ({ type: 'channel', id: `ch-${kind}`, x: CH[kind], y: MEM.mid, h: 130, ...CH_STYLE[kind] })),
    { type: 'meter', id: 'vm', value: REST, x: 1150, y: 112, w: 410, h: 748, graphH: 250 },
    ...[['na', 'Sodium'], ['k', 'Potassium'], ['cl', 'Chloride'], ['a', 'Negative proteins']].flatMap(([ion, name], i) => [
      { type: 'ion', ion, x: 1200, y: 615 + i * 58 },
      { type: 'text', x: 1236, y: 615 + i * 58, text: name, size: 24, font: 'sans', color: 'ink' },
    ]),
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
    { id: 'gaba', label: 'Release GABA', items: [...synapseFires('gaba', 0), ...pspValue(-75, 0)] },
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
      type: 'meter', id: 'psp', value: REST, x: 1190, y: 112, w: 370, h: 748, graphH: 230,
      title: 'Postsynaptic potential', upText: 'EPSP: depolarized (excitatory)', downText: 'IPSP: hyperpolarized (inhibitory)',
    },
    ...[['ion', 'na', 'Sodium (Na⁺)'], ['ion', 'cl', 'Chloride (Cl⁻)'], ['ion', 'k', 'Potassium (K⁺)'], ['ion', 'a', 'Negative proteins'],
      ['nt', SYN.glu.nt, 'Glutamate'], ['nt', SYN.gaba.nt, 'GABA']].flatMap(([kind, v, name], i) => [
      kind === 'ion'
        ? { type: 'ion', ion: v, x: 1228, y: 592 + i * 42, r: 15 }
        : { type: 'circle', x: 1228, y: 592 + i * 42, r: 8, color: v, fill: v, fillOpacity: 1, width: 2, rough: false },
      { type: 'text', x: 1258, y: 592 + i * 42, text: name, size: 22, font: 'sans', color: 'ink' },
    ]),
  ];

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
  // Main terminal releases neurotransmitters onto the next neuron, starting at time t0.
  const releaseFrom = (t0) => [
    ...FUSING.map((vi, k) => ({
      type: 'vesicle', fuse: true, path: [vesiclePts[vi], fuseTargets[k]], r: 11, duration: 1.6, at: t0 + k * 0.25,
    })),
    // neurotransmitters cross the synaptic cleft and bind to the receptors
    ...FUSING.flatMap((_, k) => [0, 1, 2].map((n) => {
      const [fx, fy] = fuseTargets[k];
      const ry = receptorYs[(k + n) % receptorYs.length] + (n - 1) * 2;
      return {
        type: 'mover', once: true, r: 3, color: '#f08c1a', smooth: true,
        path: [[fx + 9, fy], [fx + 24, (fy + ry) / 2 + (n - 1) * 6], [RECEPTOR_X - 6, ry]],
        duration: 1.1, at: t0 + 0.9 + k * 0.25 + n * 0.12,
      };
    })),
    // the next neuron responds and the signal carries on along its dendrite
    { type: 'pulse', x: 1418, y: 470, r: 34, color: '#2e9e5b', speed: 1.4, at: t0 + 2.6 },
    { type: 'mover', once: true, vanish: true, r: 7, color: '#2e9e5b', path: [[1408, 470], [1520, 472], [1640, 470]], duration: 1.6, at: t0 + 2.6 },
  ];
  const releaseItems = releaseFrom(0);

  // The whole chain: another neuron -> main neuron -> next neuron.
  const SPARK = '#ffb21e'; // electrical signal
  const AP = '#ff5a36';    // action potential
  const dendriteTip = [430, 815];
  const nodesAlongAxon = [40, ...sheaths.slice(0, -1).map((sh, i) => (sh.b + sheaths[i + 1].a) / 2), 690];
  const AP_START = 4.5, AP_TIME = 1.7, AXON_LENGTH = 707;
  const fullItems = [
    // 1. an action potential arrives along the other neuron's axon
    { type: 'mover', once: true, vanish: true, r: 8, color: SPARK, smooth: true, path: [[770, 915], [690, 878], [600, 849], [503, 838]], duration: 1.2, at: 0 },
    { type: 'flash', x: inTerminal.x, y: inTerminal.y, r: 34, color: SPARK, duration: 0.6, at: 1.15 },
    // 2. its neurotransmitters cross the gap and bind to the main neuron's dendrite
    ...[[-8, -6], [-2, 6], [-12, 4], [-6, -12], [-14, -2]].map(([dx, dy], n) => ({
      type: 'mover', once: true, r: 3, color: '#f08c1a', smooth: true,
      path: [[inTerminal.x - 22, inTerminal.y + dy * 0.6], [inTerminal.x - 34, inTerminal.y - 8 + dy], [dendriteTip[0] + 6 + dx * 0.3, dendriteTip[1] + 2 + dy * 0.5]],
      duration: 0.9, at: 1.4 + n * 0.1,
    })),
    { type: 'flash', x: dendriteTip[0], y: dendriteTip[1], r: 26, color: '#8a4fd8', duration: 0.6, at: 2.3 },
    // 3. the signal travels along the dendrite to the cell body, which adds up its inputs
    { type: 'mover', once: true, vanish: true, r: 8, color: SPARK, smooth: true, path: [dendriteTip, [405, 802], [385, 780], [355, 745], [330, 710], [360, 640], [365, 560], [380, 500]], duration: 1.4, at: 2.4 },
    { type: 'flash', x: soma.x, y: soma.y, r: 110, color: SPARK, duration: 0.9, at: 3.7 },
    // 4. the axon hillock fires an action potential, which jumps from node to node
    { type: 'flash', x: 495, y: 470, r: 46, color: AP, duration: 0.7, at: 4.3 },
    { type: 'mover', once: true, vanish: true, r: 9, color: AP, path: axonSamples, duration: AP_TIME, at: AP_START },
    ...nodesAlongAxon.map((d) => {
      const [x, y] = axonAt(d);
      return { type: 'flash', x, y, r: 26, color: AP, duration: 0.45, at: AP_START + (AP_TIME * d) / AXON_LENGTH };
    }),
    { type: 'flash', x: terminal.x, y: terminal.y, r: 70, color: AP, duration: 0.7, at: AP_START + AP_TIME },
    // 5. the main neuron releases its neurotransmitters onto the next neuron
    ...releaseFrom(AP_START + AP_TIME + 0.3),
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

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'neuron',
    title: '🧠 How a neuron works',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: the parts of a neuron, labelled, as part of a small circuit.
      {
        say: 'A neuron has four main parts: dendrites, a cell body, an axon, and axon terminals.',
        actions: [
          { id: 'release', label: 'Release neurotransmitters', items: releaseItems },
          { id: 'full', label: 'Full signal: neuron to neuron', items: fullItems },
        ],
        items: [
          { type: 'text', x: 800, y: 80, text: 'How a neuron works', size: 60, font: 'sans', bold: true, align: 'center', color: 'ink' },
          { type: 'svg', svg: circuitSvg },
          { type: 'svg', svg: svgDoc(neuronMarkup(PURPLE, 'main', { skip: FUSING, releasing: false })) },
          ...FUSING.map((vi) => ({ type: 'vesicle', x: vesiclePts[vi][0], y: vesiclePts[vi][1], r: 11, hideDuring: ['release', 'full'] })),
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
      // Slide 2: membrane potential and how ion channels change it.
      {
        say: 'Membrane potential is the voltage across the membrane. Opening ion channels changes it.',
        clear: true,
        actions: membraneActions,
        items: membraneItems,
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
