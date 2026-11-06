// Explainer: how a neuron works. Built slide by slide with the user.
// The user does the drawing; these visuals simply appear (drawn: false).
// Board is 1600 x 900. See CLAUDE.md for every item type.
(() => {
  // ---------- realistic neuron illustration (SVG, board coordinates) ----------
  const OUTLINE = '#5e2f78';
  const FILL = '#c69ad8';

  // Dendrite tree: [path, thickness]. Thick trunks leave the cell body and
  // split into thinner branches and twigs.
  const dendrites = [
    // trunks
    ['M340 400 Q300 330 255 280', 20],
    ['M310 440 Q230 420 170 380', 20],
    ['M300 485 Q220 500 150 505', 18],
    ['M320 535 Q270 600 220 650', 20],
    ['M365 560 Q360 640 330 710', 18],
    ['M400 380 Q410 310 390 250', 18],
    // branches
    ['M255 280 Q215 245 170 240', 11], ['M255 280 Q250 225 230 190', 10],
    ['M390 250 Q360 210 345 175', 10], ['M390 250 Q420 210 455 195', 10],
    ['M170 380 Q130 350 95 345', 10], ['M170 380 Q140 400 105 420', 10],
    ['M150 505 Q110 480 80 470', 9], ['M150 505 Q110 530 85 555', 10],
    ['M220 650 Q180 670 140 668', 10], ['M220 650 Q215 700 190 735', 10],
    ['M330 710 Q300 750 285 790', 10], ['M330 710 Q360 755 385 780', 9],
    // twigs
    ['M170 240 Q145 225 120 228', 5], ['M170 240 Q150 258 128 272', 5],
    ['M230 190 Q222 168 228 145', 5], ['M345 175 Q330 150 332 125', 5],
    ['M455 195 Q482 180 505 186', 5], ['M95 345 Q75 330 66 312', 5],
    ['M105 420 Q82 425 66 442', 5], ['M85 555 Q70 575 70 598', 5],
    ['M140 668 Q115 660 95 672', 5], ['M190 735 Q176 760 172 790', 5],
    ['M285 790 Q268 815 248 828', 5], ['M385 780 Q405 805 428 814', 5],
  ];

  const axonPath = 'M535 470 C700 452 850 492 1000 468 S1180 474 1240 470';

  // Axon terminal branches and the bulbs (synaptic boutons) at their tips.
  const terminalBranches = [
    ['M1240 470 Q1290 430 1330 380', 9], ['M1240 470 Q1300 465 1370 455', 9],
    ['M1240 470 Q1295 500 1340 545', 9], ['M1240 470 Q1268 540 1280 600', 8],
    ['M1330 380 Q1345 350 1368 336', 5], ['M1330 380 Q1365 386 1394 376', 5],
    ['M1370 455 Q1405 440 1430 430', 5], ['M1370 455 Q1400 476 1424 490', 5],
    ['M1340 545 Q1370 556 1400 570', 5], ['M1280 600 Q1290 630 1310 655', 5],
  ];
  const boutons = [[1368, 336], [1394, 376], [1430, 430], [1424, 490], [1400, 570], [1310, 655]];

  // Slightly irregular, organic cell body outline.
  const soma = { x: 380, y: 470 };
  const somaPts = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r = 84 + 5 * Math.sin(3 * a + 0.5) + 3 * Math.cos(5 * a);
    somaPts.push(`${(soma.x + Math.cos(a) * r).toFixed(1)},${(soma.y + Math.sin(a) * r).toFixed(1)}`);
  }
  const somaD = `M${somaPts.join(' L')} Z`;
  const hillockD = 'M448 425 Q492 456 540 462 L540 478 Q492 486 448 517 Z';

  // Small granules (Nissl bodies) scattered in the cell body.
  const granules = [[340, 430], [420, 420], [430, 510], [345, 515], [400, 535], [320, 470], [445, 465], [365, 410]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#7c4797" opacity="0.45"/>`).join('');

  const strokes = (list, color, extra) => list
    .map(([d, w]) => `<path d="${d}" stroke="${color}" stroke-width="${w + extra}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');

  const neuronSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <radialGradient id="somaG" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#f3e6f8"/><stop offset="0.55" stop-color="#d4afe2"/><stop offset="1" stop-color="#ad78c6"/>
    </radialGradient>
    <radialGradient id="nucG" cx="38%" cy="35%" r="70%">
      <stop offset="0" stop-color="#a274bd"/><stop offset="1" stop-color="#5a2b75"/>
    </radialGradient>
    <radialGradient id="boutonG" cx="35%" cy="35%" r="70%">
      <stop offset="0" stop-color="#f1e1f7"/><stop offset="1" stop-color="#b47fcb"/>
    </radialGradient>
    <linearGradient id="axonG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e2c8ec"/><stop offset="1" stop-color="#b783cc"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#3b1452" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- outlines first, then fills on top, so every joint blends smoothly -->
    ${strokes(dendrites, OUTLINE, 5)}
    ${strokes(terminalBranches, OUTLINE, 5)}
    <path d="${axonPath}" stroke="${OUTLINE}" stroke-width="19" fill="none" stroke-linecap="round"/>
    <path d="${hillockD}" fill="${OUTLINE}" stroke="${OUTLINE}" stroke-width="6" stroke-linejoin="round"/>
    <path d="${somaD}" fill="${OUTLINE}" stroke="${OUTLINE}" stroke-width="6" stroke-linejoin="round"/>
    ${boutons.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="${OUTLINE}"/>`).join('')}

    ${strokes(dendrites, FILL, 0)}
    ${strokes(terminalBranches, FILL, 0)}
    <path d="${axonPath}" stroke="url(#axonG)" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="${hillockD}" fill="${FILL}"/>
    <path d="${somaD}" fill="url(#somaG)"/>
    ${boutons.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="url(#boutonG)"/>`).join('')}
  </g>
  <!-- shine along the axon to make it look round -->
  <path d="${axonPath}" transform="translate(0,-3)" stroke="#f6ecfa" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
  ${granules}
  <!-- nucleus and nucleolus -->
  <circle cx="${soma.x}" cy="${soma.y}" r="32" fill="url(#nucG)" stroke="#4a2062" stroke-width="2"/>
  <circle cx="${soma.x + 8}" cy="${soma.y - 6}" r="9" fill="#3a1650"/>
  <ellipse cx="${soma.x - 10}" cy="${soma.y - 12}" rx="9" ry="5" fill="#ffffff" opacity="0.25"/>
</svg>`;


  // ---------- slide 2: dendrites up close ----------
  const quad = (b, t) => [0, 1].map((k) => (1 - t) ** 2 * b.p0[k] + 2 * (1 - t) * t * b.c[k] + t * t * b.p1[k]);
  const normal = (b, t) => {
    const d = [0, 1].map((k) => 2 * (1 - t) * (b.c[k] - b.p0[k]) + 2 * t * (b.p1[k] - b.c[k]));
    const len = Math.hypot(d[0], d[1]) || 1;
    return [-d[1] / len, d[0] / len];
  };
  const widthAt = (b, t) => b.w0 + (b.w1 - b.w0) * t;
  const add = (p, n, k) => [p[0] + n[0] * k, p[1] + n[1] * k];
  const f1 = (v) => v.toFixed(1);

  // Tapered branch outline (thick near the cell body, thin at the tip).
  function taperD(b) {
    const L = [], R = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48, p = quad(b, t), n = normal(b, t), w = widthAt(b, t) / 2;
      L.push(add(p, n, w));
      R.push(add(p, n, -w));
    }
    return 'M' + L.concat(R.reverse()).map((p) => p.map(f1).join(',')).join(' L') + ' Z';
  }

  // Branches start inside the cell body / parent branch and run to their tips.
  const trunk = { p0: [1390, 520], c: [850, 560], p1: [240, 450], w0: 80, w1: 26 };
  const upper = { p0: [840, 512], c: [650, 380], p1: [430, 235], w0: 38, w1: 14 };
  const lower = { p0: [717, 516], c: [600, 650], p1: [430, 790], w0: 34, w1: 14 };
  const branches = [trunk, upper, lower];

  // Dendritic spines: little mushroom-shaped bumps where other neurons connect.
  function spineAt(b, t, side, len, r) {
    const n = normal(b, t).map((v) => v * side);
    const base = add(quad(b, t), n, widthAt(b, t) / 2 - 3);
    return { base, head: add(base, n, len), n, r };
  }
  const spines = [];
  branches.forEach((b, bi) => {
    const ts = bi === 0 ? [0.12, 0.2, 0.38, 0.45, 0.55, 0.63, 0.72, 0.8, 0.88, 0.95] : [0.18, 0.28, 0.36, 0.6, 0.7, 0.8, 0.9];
    ts.forEach((t, i) => {
      const side = (i + bi) % 2 ? 1 : -1;
      const kind = (i * 7 + bi * 3) % 3; // mushroom, thin, stubby
      spines.push(spineAt(b, t, side, [26, 30, 14][kind], [11, 7, 10][kind]));
    });
  });

  // Synapses: an axon terminal from another neuron meets a spine.
  const synapses = [
    spineAt(trunk, 0.3, 1, 36, 15),
    spineAt(upper, 0.48, 1, 34, 15),
    spineAt(lower, 0.52, -1, 34, 15),
  ].map((sp) => {
    const bouton = add(sp.head, sp.n, sp.r + 14 + 26);
    const perp = [-sp.n[1], sp.n[0]];
    const axonEnd = add(add(bouton, sp.n, 190), perp, 40);
    const gap = add(sp.head, sp.n, sp.r + 7);
    return { ...sp, bouton, axonEnd, gap, perp };
  });

  const spineMarkup = (list, color, extra) => list.map((sp) =>
    `<path d="M${sp.base.map(f1)} L${sp.head.map(f1)}" stroke="${color}" stroke-width="${7 + extra}" stroke-linecap="round"/>` +
    `<circle cx="${f1(sp.head[0])}" cy="${f1(sp.head[1])}" r="${sp.r + extra / 2}" fill="${color}"/>`).join('');

  const dendriteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="dG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e4cdee"/><stop offset="0.5" stop-color="#c69ad8"/><stop offset="1" stop-color="#ad78c6"/>
    </linearGradient>
    <radialGradient id="cbG" cx="30%" cy="40%" r="75%">
      <stop offset="0" stop-color="#f3e6f8"/><stop offset="0.6" stop-color="#d4afe2"/><stop offset="1" stop-color="#ad78c6"/>
    </radialGradient>
    <radialGradient id="axG" cx="35%" cy="35%" r="70%">
      <stop offset="0" stop-color="#e3eefb"/><stop offset="1" stop-color="#6f9fd8"/>
    </radialGradient>
    <filter id="sh2" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#3b1452" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g filter="url(#sh2)">
    <!-- axons from other neurons -->
    ${synapses.map((s) => `<path d="M${s.axonEnd.map(f1)} Q${add(add(s.bouton, s.n, 90), s.perp, -30).map(f1)} ${s.bouton.map(f1)}" stroke="#2c5a92" stroke-width="18" fill="none" stroke-linecap="round"/>`).join('')}
    ${synapses.map((s) => `<path d="M${s.axonEnd.map(f1)} Q${add(add(s.bouton, s.n, 90), s.perp, -30).map(f1)} ${s.bouton.map(f1)}" stroke="#8fb6e6" stroke-width="12" fill="none" stroke-linecap="round"/>`).join('')}
    ${synapses.map((s) => `<circle cx="${f1(s.bouton[0])}" cy="${f1(s.bouton[1])}" r="29" fill="#2c5a92"/><circle cx="${f1(s.bouton[0])}" cy="${f1(s.bouton[1])}" r="26" fill="url(#axG)"/>`).join('')}
    ${synapses.map((s) => [[-9, -6], [7, 8], [-4, 10], [10, -9], [2, -2]].map(([a, b]) => { const p = add(add(s.bouton, s.perp, a), s.n, b); return `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="4.5" fill="#f0a24a" stroke="#c46f12" stroke-width="1"/>`; }).join('')).join('')}

    <!-- dendrite: outlines first, then fills, so joints blend -->
    ${branches.map((b) => `<path d="${taperD(b)}" fill="${OUTLINE}" stroke="${OUTLINE}" stroke-width="6" stroke-linejoin="round"/><circle cx="${b.p1[0]}" cy="${b.p1[1]}" r="${b.w1 / 2 + 3}" fill="${OUTLINE}"/>`).join('')}
    ${spineMarkup(spines.concat(synapses), OUTLINE, 6)}
    <circle cx="1560" cy="520" r="233" fill="${OUTLINE}"/>
    <!-- side branches and spines first, main trunk last so the joints are seamless -->
    ${[upper, lower, trunk].map((b) => `<path d="${taperD(b)}" fill="url(#dG)"/><circle cx="${b.p1[0]}" cy="${b.p1[1]}" r="${b.w1 / 2}" fill="#c69ad8"/>`).join('')}
    ${spineMarkup(spines.concat(synapses), FILL, 0)}
    <path d="${taperD(trunk)}" fill="url(#dG)"/>
    <circle cx="1560" cy="520" r="230" fill="url(#cbG)"/>
  </g>
  <!-- receptors on the spine heads, facing each terminal -->
  ${synapses.map((s) => { const c = add(s.head, s.n, s.r - 2); const a = add(c, s.perp, 11), b = add(c, s.perp, -11); return `<path d="M${a.map(f1)} L${b.map(f1)}" stroke="#2e9e5b" stroke-width="6" stroke-linecap="round"/>`; }).join('')}
  <!-- neurotransmitter molecules crossing the gap -->
  ${synapses.map((s) => [[-6, 0], [5, 3], [0, -4]].map(([a, b]) => { const p = add(add(s.gap, s.perp, a), s.n, b); return `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="3" fill="#f08c1a"/>`; }).join('')).join('')}
  ${[[1450, 420], [1500, 600], [1420, 650], [1530, 380], [1470, 520]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#7c4797" opacity="0.4"/>`).join('')}
</svg>`;

  // Textbook-style label: clean text with a thin leader line ending in a dot.
  const label = (text, x, y, lineFrom, target, align = 'center') => [
    { type: 'text', x, y, text, size: 36, font: 'sans', color: 'ink', align },
    { type: 'line', from: lineFrom, to: target, color: '#3b4252', width: 2.5, rough: false },
    { type: 'circle', x: target[0], y: target[1], r: 5, color: '#3b4252', width: 2, fill: '#3b4252', fillOpacity: 1, rough: false },
  ];

  const [syn1, , syn3] = synapses;
  const DENDRITE_LABELS = [
    ...label('Dendrite', 1226, 300, [1226, 322], quad(trunk, 0.15).map(Math.round)),
    ...label('Synapse', 985, 360, [990, 372], syn1.gap.map(Math.round), 'right'),
    ...label('Dendritic spine', 250, 625, [290, 605], [381, 505]),
    { type: 'text', x: 800, y: 770, text: 'Axon terminal\n(from another neuron)', size: 32, font: 'sans', color: 'ink' },
    { type: 'line', from: [794, 772], to: syn3.bouton.map((v, k) => Math.round(v + [22, 6][k])), color: '#3b4252', width: 2.5, rough: false },
    { type: 'circle', x: Math.round(syn3.bouton[0] + 22), y: Math.round(syn3.bouton[1] + 6), r: 5, color: '#3b4252', width: 2, fill: '#3b4252', fillOpacity: 1, rough: false },
    ...label('Cell body', 1460, 822, [1460, 798], [1460, 712]),
    { type: 'arrow', from: [830, 628], to: [1290, 628], color: 'gray', width: 4, rough: false },
    { type: 'text', x: 1060, y: 664, text: 'Signals travel toward the cell body', size: 28, font: 'sans', color: 'gray', align: 'center' },
  ];

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'neuron',
    title: '🧠 How a neuron works',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: the parts of a neuron, labelled.
      {
        say: 'A neuron has four main parts: dendrites, a cell body, an axon, and axon terminals.',
        items: [
          { type: 'text', x: 800, y: 80, text: 'How a neuron works', size: 60, font: 'sans', bold: true, align: 'center', color: 'ink' },
          { type: 'svg', svg: neuronSvg },
          ...label('Dendrites', 70, 120, [150, 140], [205, 236], 'left'),
          ...label('Cell body', 610, 330, [600, 348], [425, 425]),
          ...label('Axon', 850, 620, [850, 598], [850, 480]),
          ...label('Axon terminals', 1440, 250, [1420, 272], [1382, 340]),
        ],
      },
      // Slide 2: dendrites in more detail.
      {
        say: 'Dendrites are covered in tiny spines. Each spine is a spot where another neuron passes on its signal.',
        clear: true,
        items: [
          { type: 'text', x: 800, y: 70, text: 'Dendrites up close', size: 60, font: 'sans', bold: true, align: 'center', color: 'ink' },
          { type: 'svg', svg: dendriteSvg },
          ...DENDRITE_LABELS,
        ],
      },
    ],
  });
})();
