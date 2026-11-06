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

  // Textbook-style label: clean text with a thin leader line ending in a dot.
  const label = (text, x, y, lineFrom, target, align = 'center') => [
    { type: 'text', x, y, text, size: 36, font: 'sans', color: 'ink', align },
    { type: 'line', from: lineFrom, to: target, color: '#3b4252', width: 2.5, rough: false },
    { type: 'circle', x: target[0], y: target[1], r: 5, color: '#3b4252', width: 2, fill: '#3b4252', fillOpacity: 1, rough: false },
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
    ],
  });
})();
