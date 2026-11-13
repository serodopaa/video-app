// Pharmacology essentials, part 3: pharmacokinetics (ADME + drug levels over time). Built with the user.
// Adds its slides to the end of the 'pharmacology-essentials' topic (one video). Load it AFTER
// pharmacology-pd.js (it reuses WB_LIGAND_ART, WB_PHARM_ART and WB_PHARM_PD).
// The user does the drawing; these visuals simply appear (drawn: false). Board is 1600 x 900.
(() => {
  const A = window.WB_LIGAND_ART, P = window.WB_PHARM_ART, D = window.WB_PHARM_PD;
  const scene = (window.WB_SCENES || []).find((s) => s.id === 'pharmacology-essentials');
  if (!A || !P || !D || !scene) return;
  const { panel, receptor, ligand, frameTrack, track, T, svgItem, txt, title, f1 } = A;
  const { box, rr, capsule, person, curve, dot, badge } = P;
  const { INK, GREY, DARK, PK, PD, ENDO, EXO, DRUG } = P.COL;
  const { gauge, card, tabsOf, plot, axes, dash, chip } = D;
  const ABS = '#d0630b', DIS = '#1f8a4c', MET = '#7b3fd0', EXC = '#2f6fde', TIME = '#c0392b';
  const OUT = '#eef6fd', LIVER = '#a0522d';
  const Qs = (...q) => '[QUESTIONS THIS SLIDE ANSWERS]\n' + q.map((x) => `[• ${x}]`).join('\n');
  let gid = 0;

  // ---------------------------------------------------------------- shared pieces
  const arrow = (x1, y1, x2, y2, c = DARK, w = 5, dashed = '') => curve(`M ${f1(x1)} ${f1(y1)} L ${f1(x2)} ${f1(y2)}`, c, w, dashed);
  const pill = (x, y, w, text, c, fill = c, tc = '#ffffff', size = 17) => `<rect x="${f1(x - w / 2)}" y="${f1(y - 16)}" width="${w}" height="32" rx="16" fill="${fill}" stroke="${c}" stroke-width="2"/>${T(x, y + 6, size, tc)(text)}`;
  const liverShape = (cx, cy, s = 1) => `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">
      <path d="M -70 -10 C -70 -45 -20 -52 30 -46 C 70 -42 82 -20 74 -4 C 62 20 20 30 -10 36 C -40 42 -70 30 -70 -10 Z" fill="#b5654a" stroke="#6e3220" stroke-width="4"/>
      <path d="M 0 -46 C -6 -20 -4 10 -10 36" fill="none" stroke="#6e3220" stroke-width="3" opacity="0.6"/></g>`;
  const kidneyShape = (cx, cy, s = 1) => `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">
      <path d="M 0 -40 C 30 -42 38 -10 30 10 C 22 30 30 40 12 44 C -20 50 -34 20 -32 -2 C -30 -26 -24 -38 0 -40 Z" fill="#a0525a" stroke="#5e262c" stroke-width="4"/>
      <path d="M 26 -6 C 14 -4 10 8 22 14" fill="none" stroke="#f3d6d9" stroke-width="4"/></g>`;
  const gutShape = (cx, cy, s = 1) => `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">
      <path d="M -60 -30 C -30 -50 0 -10 30 -30 C 60 -50 70 -10 50 0 C 20 14 -20 -16 -40 6 C -60 28 -20 40 10 26 C 40 12 60 34 50 44" fill="none" stroke="#e58fa0" stroke-width="20" stroke-linecap="round"/>
      <path d="M -60 -30 C -30 -50 0 -10 30 -30 C 60 -50 70 -10 50 0 C 20 14 -20 -16 -40 6 C -60 28 -20 40 10 26 C 40 12 60 34 50 44" fill="none" stroke="#f7c6d0" stroke-width="10" stroke-linecap="round"/></g>`;
  const heartBlood = (cx, cy, s = 1) => `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">
      <path d="M 0 40 C -60 0 -50 -50 -20 -50 C -5 -50 0 -38 0 -30 C 0 -38 5 -50 20 -50 C 50 -50 60 0 0 40 Z" fill="#e0505a" stroke="#8e1d24" stroke-width="4"/></g>`;
  // a small drug molecule: a ring with a side chain; `extra` adds a Phase I (-OH) or Phase II (big tag) group
  const drugMol = (cx, cy, s = 1, extra = '') => {
    const hx = [0, 1, 2, 3, 4, 5].map((k) => [Math.cos((Math.PI / 3) * k + Math.PI / 6) * 30, Math.sin((Math.PI / 3) * k + Math.PI / 6) * 30]);
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">
      <polygon points="${hx.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ')}" fill="#f6c45a" stroke="#a8640a" stroke-width="4"/>
      <circle r="13" fill="none" stroke="#a8640a" stroke-width="3"/>
      <line x1="26" y1="15" x2="56" y2="32" stroke="#a8640a" stroke-width="5"/><line x1="56" y1="32" x2="84" y2="14" stroke="#a8640a" stroke-width="5"/>
      <circle cx="84" cy="14" r="9" fill="#f6c45a" stroke="#a8640a" stroke-width="3"/>
      <line x1="-26" y1="15" x2="-52" y2="32" stroke="#a8640a" stroke-width="5"/><circle cx="-52" cy="32" r="9" fill="#f6c45a" stroke="#a8640a" stroke-width="3"/>
      ${extra}</g>`;
  };
  const OH = `<line x1="0" y1="-30" x2="0" y2="-52" stroke="#c0392b" stroke-width="5"/><circle cx="0" cy="-64" r="15" fill="#f6a3a3" stroke="#c0392b" stroke-width="3"/><text x="0" y="-58" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="14" text-anchor="middle" fill="#8e1d14">OH</text>`;
  const TAG = `<line x1="0" y1="-78" x2="0" y2="-92" stroke="#2c5a92" stroke-width="5"/><rect x="-48" y="-136" width="96" height="44" rx="14" fill="#9fc0ef" stroke="#2c5a92" stroke-width="3"/><text x="0" y="-108" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="14" text-anchor="middle" fill="#1d3f6e">water-loving</text>`;
  // a horizontal level bar with a label
  const levelBar = (x, y, w, v, c, label, valText) => `${rr(x, y, w, 26, '#c9ced8', '#eef0f4', 2, 13)}<rect x="${x}" y="${y}" width="${f1(Math.max(0, w * v))}" height="26" rx="13" fill="${c}"/>
      ${T(x, y - 12, 18, INK, 700, 'start')(label)}${T(x + w, y - 12, 18, c, 700, 'end')(valText)}`;
  const at = (items, t) => items.map((it) => ({ ...it, at: t }));
  // concentration after one oral dose (absorbed at rate ka, removed at rate k)
  const bateman = (t, k, ka = 1.5) => (ka / (ka - k)) * (Math.exp(-k * t) - Math.exp(-ka * t));
  const polyline = (pts, c, w = 6, op = 1) => (pts.length > 1 ? `<polyline points="${pts.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}"/>` : '');
  const band = (G, p, v0, v1, fill, op = 0.14) => `<rect x="${G.x0}" y="${f1(p.y(v1))}" width="${G.x1 - G.x0}" height="${f1(p.y(v0) - p.y(v1))}" fill="${fill}" opacity="${op}"/>`;

  // ================================================================ slide 19: part 3 intro
  const SECTIONS = [
    ['A', 'Absorption', ABS, 'Routes\nGetting absorbed\nBioavailability and\nfirst-pass', (cx, cy) => capsule(cx, cy, 0.7, -30)],
    ['D', 'Distribution', DIS, 'Into the tissues\nProtein binding\nBrain and placenta', (cx, cy) => person(cx, cy + 6, 0.32, '#e3f4e8', '#6fa77f') + [[-14, -10], [12, 4], [-4, 22], [16, -26]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="6" fill="${DIS}"/>`).join('')],
    ['M', 'Metabolism', MET, 'Phase I and II\nCYP450 enzymes\nProdrugs\nInduction / inhibition', (cx, cy) => liverShape(cx, cy, 0.8)],
    ['E', 'Excretion', EXC, 'The kidneys\nOther routes', (cx, cy) => kidneyShape(cx - 22, cy, 0.9) + kidneyShape(cx + 26, cy, 0.9)],
    ['⏱', 'Drug levels\nover time', TIME, 'Concentration curve\nHalf-life, clearance\nFirst vs zero order\nSteady state and\ndosing', (cx, cy) => {
      const pts = []; for (let t = 0; t <= 8; t += 0.2) pts.push([cx - 60 + t * 15, cy + 34 - bateman(t, 0.35) * 90]);
      return `<line x1="${cx - 60}" y1="${cy + 36}" x2="${cx + 64}" y2="${cy + 36}" stroke="${DARK}" stroke-width="2.5"/><line x1="${cx - 60}" y1="${cy + 36}" x2="${cx - 60}" y2="${cy - 38}" stroke="${DARK}" stroke-width="2.5"/>` + polyline(pts, TIME, 4);
    }],
  ];
  const introItems = [
    svgItem(`<rect x="0" y="0" width="1600" height="900" fill="#f1f6fd"/><circle cx="1440" cy="140" r="210" fill="#dfeafa"/>
      ${person(1340, 245, 0.62, '#e3ecfb', '#8aa3cc')}${capsule(1205, 170, 0.65, -30)}
      ${curve('M 1240 200 C 1270 190, 1290 190, 1318 196', EXO, 4)}
      ${[[1330, 230], [1352, 262], [1322, 292], [1360, 318]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${ABS}" opacity="0.85"/>`).join('')}`),
    box(110, 112, 190, 58, PK, PK), txt('PART 3', 205, 141, 28, '#ffffff', { align: 'center', bold: true }),
    txt('PHARMACOKINETICS', 110, 235, 86, PK, { bold: true }),
    txt('What the BODY does to the DRUG', 110, 318, 30, GREY, { bold: true }),
    ...SECTIONS.flatMap(([k, t, c, list, art], i) => {
      const x = 60 + i * 300, y = 400, w = 280;
      return [
        box(x, y, w, 440, c),
        svgItem(`<circle cx="${x + w / 2}" cy="${y + 50}" r="32" fill="${c}"/>${T(x + w / 2, y + 62, 32, '#ffffff')(k)}${art(x + w / 2, y + 205)}`),
        txt(t, x + w / 2, y + 112, 25, c, { align: 'center', bold: true }),
        txt(list, x + w / 2, y + 300, 18, INK, { align: 'center', bold: true }),
      ];
    }),
  ];

  // ================================================================ slide 20: routes of administration
  const BODY = [420, 500], BS = 1.55;
  const ROUTES = {
    ent: { c: ABS, rows: [
      ['Oral', 'swallowed, absorbed in the gut\nSLOW: 30–60 min', [398, 312]],
      ['Sublingual', 'under the tongue, straight\ninto the blood: FAST', [458, 296]],
      ['Rectal', 'suppository: useful if\nvomiting or unconscious', [420, 590]],
    ], ys: [250, 400, 560] },
    par: { c: PK, rows: [
      ['IV (intravenous)', 'into a vein: FASTEST,\nall of it reaches the blood', [560, 548]],
      ['IM (intramuscular)', 'into a muscle: minutes\n(e.g. many vaccines)', [530, 380]],
      ['Subcutaneous', 'under the skin: slower, steady\n(e.g. insulin)', [462, 520]],
      ['Inhaled', 'into the lungs: very fast\n(e.g. asthma inhalers)', [400, 425]],
      ['Transdermal', 'skin patch: slow and steady\n(e.g. nicotine patch)', [302, 402]],
    ], ys: [215, 335, 455, 575, 695] },
  };
  const RT = tabsOf([{ id: 'ent19', text: 'Enteral (through the gut)', c: ABS }, { id: 'par19', text: 'Parenteral (everything else)', c: PK }, { id: 'spd19', text: 'Compare the speed', c: DARK }], 170, 400);
  const routeView = (key) => {
    const R = ROUTES[key];
    return [
      svgItem(R.rows.map(([, , [mx, my]], i) => `<line x1="${mx}" y1="${my}" x2="640" y2="${R.ys[i]}" stroke="${R.c}" stroke-width="2.5" stroke-dasharray="6 5"/>`).join('')
        + R.rows.map(([, , [mx, my]], i) => `<circle cx="${mx}" cy="${my}" r="15" fill="${R.c}" stroke="#ffffff" stroke-width="3"/>${T(mx, my + 6, 15, '#ffffff')(String(i + 1))}`).join('')),
      ...R.rows.flatMap(([name, desc], i) => [
        txt(`${i + 1}  ${name}`, 650, R.ys[i], 22, R.c, { bold: true }),
        txt(desc, 676, R.ys[i] + 30, 17, GREY, { bold: true }),
      ]),
      ...R.rows.map(([, , [mx, my]]) => ({ type: 'pulse', x: mx, y: my, r: 22, color: R.c, speed: 1.4 })),
    ];
  };
  // compare the speed: drug level over time after the same dose by different routes
  const GR = { x0: 170, x1: 940, y0: 260, y1: 760 };
  const pR = plot(GR);
  const KEL = 0.3, TR = 12;
  const routeLevel = {
    iv: (t) => Math.exp(-KEL * t),
    inh: (t) => 0.9 * bateman(t, KEL, 5),
    im: (t) => 0.95 * bateman(t, KEL, 1.6),
    oral: (t) => 0.55 * bateman(t, KEL, 0.7),
    patch: (t) => 0.32 * (1 - Math.exp(-0.45 * t)),
  };
  const SPD = [['iv', 'IV', PK], ['inh', 'Inhaled', DIS], ['im', 'IM', MET], ['oral', 'Oral', ABS], ['patch', 'Patch', '#8a8f98']];
  const speedGraph = (u) => {
    const tN = TR * u;
    const lines = SPD.map(([k, , c]) => { const pts = []; for (let t = 0; t <= tN + 1e-6; t += 0.08) pts.push([pR.x(t / TR), pR.y(routeLevel[k](t))]); return polyline(pts, c, 5); }).join('');
    const legend = SPD.map(([, n, c], i) => `<rect x="${GR.x0 + 20 + i * 150}" y="${GR.y0 - 52}" width="24" height="9" rx="4" fill="${c}"/>${T(GR.x0 + 52 + i * 150, GR.y0 - 42, 18, c, 700, 'start')(n)}`).join('');
    return `<rect x="62" y="192" width="936" height="666" fill="#fbfcfe"/>${axes(GR, 'Time after the dose →', 'Drug level in the blood →', false)}${legend}${lines}`;
  };
  const speedItems = [
    ...frameTrack([[0, 0], [3.5, 1], [30, 1]], ([u]) => speedGraph(u), 12),
    txt('IV: instant, all of it', pR.x(0.02) + 12, pR.y(1) + 6, 17, PK, { bold: true, at: 3.5, anim: 'fade', duration: 0.3 }),
    txt('Oral: slower, and less gets in', pR.x(0.42), pR.y(0.42), 17, ABS, { bold: true, at: 3.7, anim: 'fade', duration: 0.3 }),
    { ...svgItem(`<line x1="${f1(pR.x(0.42) - 6)}" y1="${f1(pR.y(0.42) + 8)}" x2="${f1(pR.x(0.2) + 8)}" y2="${f1(pR.y(0.31) - 6)}" stroke="${ABS}" stroke-width="2.5" stroke-dasharray="6 5"/>`), at: 3.7, duration: 0.3 },
    txt('Patch: slow, steady, long-lasting', pR.x(0.62), pR.y(0.36), 17, '#6b7280', { bold: true, at: 3.9, anim: 'fade', duration: 0.3 }),
  ];
  const routeItems = [
    title('Routes of administration'),
    ...RT.bar(null),
    svgItem(rr(60, 190, 940, 670, '#d9dce3', '#fbfcfe', 2) + person(...BODY, BS, '#e3ecfb', '#8aa3cc')),
    txt('Pick a group above →\nto see the routes', 760, 470, 22, '#9aa1ad', { align: 'center', bold: true, hideDuring: ['ent19', 'par19', 'spd19'] }),
    ...card(1030, 190, 510, 670, DARK, 'HOW THE DRUG GETS IN', 'The ROUTE decides how FAST and\nhow MUCH of a drug gets in.\n\nENTERAL: through the gut\n(enteron = intestine)\n\nPARENTERAL: any other way\n(para = beside the gut)', 22),
    ...RT.hot,
  ];
  const routeActions = [
    { id: 'ent19', label: 'Enteral routes', group: 'rt', stay: true, drawn: false, items: [
      ...RT.bar('ent19'), ...routeView('ent'),
      ...card(1030, 190, 510, 670, ABS, 'ENTERAL', 'Through the digestive tract.\n\n✓ Easy, cheap, painless\n\n✗ Slower\n✗ Stomach acid and food can\n   get in the way\n✗ Swallowed drugs pass the liver\n   first (first-pass), so less of\n   them reaches the blood', 22),
    ] },
    { id: 'par19', label: 'Parenteral routes', group: 'rt', stay: true, drawn: false, items: [
      ...RT.bar('par19'), ...routeView('par'),
      ...card(1030, 190, 510, 670, PK, 'PARENTERAL', 'Any route that skips the gut.\n\n✓ Faster and more reliable\n✓ Skips the liver\'s first pass\n✓ Works if someone can\'t swallow\n\n✗ Often needs a needle (and\n   training), and is harder to\n   undo if something goes wrong', 22),
    ] },
    { id: 'spd19', label: 'Compare the speed', group: 'rt', stay: true, drawn: false, items: [
      ...RT.bar('spd19').map((it) => ({ ...it, solid: true })), ...speedItems,
      ...card(1030, 190, 510, 670, DARK, 'SAME DOSE, DIFFERENT ROUTE', 'The route changes how FAST the\nlevel rises, how HIGH it gets and\nhow LONG it lasts.\n\nIV: instant, 100% gets in\nInhaled: very fast\nIM: within minutes\nOral: slowest, and less gets in\n(first-pass, next slides)\nPatch: slow, low and steady\nfor a long time', 21),
    ] },
  ];

  // ================================================================ slide 21: getting absorbed
  const MEM = { top: 470, bot: 530 };
  const FAT = [150, 330, 510], BIG = [240, 420, 600];
  const absItems = [
    title('Getting absorbed'),
    txt('Most drugs get in by simply slipping through cell membranes (passive diffusion)', 530, 150, 21, DARK, { align: 'center', bold: true }),
    svgItem(panel(60, 1000, 190, MEM.top, MEM.bot, 860)
      + T(90, 228, 20, '#2c5a92', 700, 'start')('Inside the gut') + T(90, 840, 20, '#8e1d24', 700, 'start')('Blood')
      + rr(690, 215, 290, 120, '#d9dce3', '#ffffff', 2, 12)
      + `<circle cx="716" cy="252" r="10" fill="#f6c45a" stroke="#a8640a" stroke-width="3"/>${T(736, 258, 17, INK, 700, 'start')('small, fat-soluble')}`
      + `<circle cx="716" cy="300" r="17" fill="#f6a3a3" stroke="#c0392b" stroke-width="3"/>${T(716, 306, 16, '#8e1d14')('+')}${T(744, 306, 17, INK, 700, 'start')('large or charged')}`),
    { ...svgItem(FAT.map((x) => `<circle cx="${x}" cy="300" r="10" fill="#f6c45a" stroke="#a8640a" stroke-width="3"/>`).join('')
      + BIG.map((x) => `<circle cx="${x}" cy="300" r="17" fill="#f6a3a3" stroke="#c0392b" stroke-width="3"/>${T(x, 306, 16, '#8e1d14')('+')}`).join('')), hideDuring: 'abs20' },
    { type: 'hotspot', x: 60, y: 190, w: 940, h: 670, action: 'abs20' },
    ...[
      ['Fat solubility', 'Fat-soluble drugs slip through\nmembranes easily'],
      ['Size', 'Small molecules get through;\nvery big ones struggle'],
      ['Charge and stomach acid', 'Charged drugs struggle to cross;\nacid can change a drug\'s charge'],
      ['Food', 'Can slow or block absorption\n(some drugs: empty stomach)'],
      ['Blood flow and surface area', 'Small intestine: huge surface and\nlots of blood → most absorption'],
    ].flatMap(([h, t], i) => {
      const y = 112 + i * 152;
      return [box(1030, y, 510, 140, ABS), svgItem(badge(1066, y + 36, String(i + 1), ABS)), txt(h, 1100, y + 36, 22, ABS, { bold: true }), txt(t, 1056, y + 82, 18, INK, { bold: true })];
    }),
  ];
  const absActions = [{ id: 'abs20', label: 'Watch them cross', stay: true, drawn: false, items: [
    ...FAT.map((x, i) => ({ type: 'mover', path: [[x, 300], [x + 10, 500], [x + 20, 760]], r: 10, color: '#f0a12e', count: 1, speed: 2.6 + i * 0.3 })),
    ...BIG.map((x, i) => ({ type: 'mover', path: [[x, 300], [x + 4, 440], [x + 30, 320]], r: 17, color: '#e0606a', count: 1, speed: 2.0 + i * 0.3 })),
    txt('✓ gets through', 330, 640, 22, DIS, { align: 'center', bold: true, at: 1.4, anim: 'fade', duration: 0.3 }),
    txt('✕ bounces off', 560, 400, 22, TIME, { align: 'center', bold: true, at: 1.0, anim: 'fade', duration: 0.3 }),
  ] }];

  // ================================================================ slide 22: bioavailability and first-pass
  const NODE = { y: 400, xs: [150, 390, 630, 880] };
  const nodeBox = (i, head, art, c) => `${rr(NODE.xs[i] - 85, NODE.y - 75, 170, 150, c, '#ffffff', 3, 18)}${art}${T(NODE.xs[i], NODE.y + 108, 21, c)(head)}`;
  const nodes = nodeBox(0, 'Dose', capsule(NODE.xs[0], NODE.y, 0.75, -30), DARK)
    + nodeBox(1, 'Gut', gutShape(NODE.xs[1], NODE.y - 6, 0.95), '#c2566b')
    + nodeBox(2, 'Liver', liverShape(NODE.xs[2], NODE.y, 0.95), LIVER)
    + nodeBox(3, 'Blood (body)', heartBlood(NODE.xs[3], NODE.y + 6, 0.95), '#8e1d24');
  const BA = tabsOf([{ id: 'iv21', text: 'IV (intravenous)', c: PK }, { id: 'oral21', text: 'Oral (swallowed)', c: ABS }, { id: 'sl21', text: 'Sublingual', c: DIS }], 170, 400);
  const ivPath = [[NODE.xs[0] + 40, NODE.y - 75], [NODE.xs[0] + 200, 240], [NODE.xs[3] - 220, 240], [NODE.xs[3] - 40, NODE.y - 75]];
  const oralPath = [[NODE.xs[0] + 85, NODE.y], [NODE.xs[1], NODE.y + 40], [NODE.xs[2], NODE.y + 40]];
  const oralOn = [[NODE.xs[2], NODE.y + 40], [NODE.xs[3], NODE.y + 40]];
  const slPath = [[NODE.xs[0] + 40, NODE.y + 75], [NODE.xs[0] + 200, 570], [NODE.xs[3] - 220, 570], [NODE.xs[3] - 40, NODE.y + 75]];
  const pathD = (pts) => `M ${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L ')}`;
  const bioBar = (v, c, txtV) => frameTrack([[0, 0], [1.2, 0], [3.4, v], [30, v]], ([u]) => levelBar(140, 660, 820, u, c, 'Bioavailability (F): how much reaches the blood', u >= v - 0.001 ? txtV : `${Math.round(u * 100)}%`), 12);
  const dotsAlong = (path, n, c, t0 = 0, vanish = false, speed = 2.2) => Array.from({ length: n }, (_, k) => ({ type: 'mover', path, r: 9, color: c, count: 1, speed, once: true, vanish, smooth: false, at: t0 + k * 0.12 }));
  const bioItems = [
    title('Bioavailability and first-pass metabolism'),
    ...BA.bar(null),
    svgItem(rr(60, 190, 940, 670, '#d9dce3', '#fbfcfe', 2) + nodes),
    ...card(1030, 190, 510, 430, PK, 'BIOAVAILABILITY (F)', 'The fraction of a dose that reaches\nthe bloodstream unchanged.\n\nIV = 100% (it goes straight in).\nOther routes: usually less.', 21),
    ...card(1030, 640, 510, 220, LIVER, 'FIRST-PASS METABOLISM', 'Swallowed drugs go gut → liver\nBEFORE the rest of the body.\nThe liver breaks some down first.', 20),
    ...BA.hot,
  ];
  const bioActions = [
    { id: 'iv21', label: 'IV', group: 'ba', stay: true, drawn: false, items: [
      ...BA.bar('iv21'),
      svgItem(curve(`M ${ivPath[0][0]} ${ivPath[0][1]} C ${NODE.xs[0] + 120} 220, ${NODE.xs[3] - 120} 220, ${ivPath[3][0]} ${ivPath[3][1]}`, PK, 5, '10 8')),
      ...dotsAlong(ivPath, 10, PK, 0.2),
      ...bioBar(1, PK, '100%'),
      txt('Straight into the blood: nothing is lost', 550, 780, 22, PK, { align: 'center', bold: true, at: 1.6, anim: 'fade', duration: 0.4 }),
    ] },
    { id: 'oral21', label: 'Oral', group: 'ba', stay: true, drawn: false, items: [
      ...BA.bar('oral21'),
      svgItem(arrow(NODE.xs[0] + 88, NODE.y, NODE.xs[1] - 92, NODE.y, ABS) + arrow(NODE.xs[1] + 88, NODE.y, NODE.xs[2] - 92, NODE.y, ABS) + arrow(NODE.xs[2] + 88, NODE.y, NODE.xs[3] - 92, NODE.y, ABS)
        + T((NODE.xs[1] + NODE.xs[2]) / 2, NODE.y + 30, 14, GREY)('portal') + T((NODE.xs[1] + NODE.xs[2]) / 2, NODE.y + 47, 14, GREY)('vein')),
      ...dotsAlong(oralPath, 6, ABS, 0.2, true, 1.6),
      ...dotsAlong(oralPath.concat(oralOn.slice(1)), 4, ABS, 0.95, false, 2.2),
      { type: 'pulse', x: NODE.xs[2], y: NODE.y, r: 60, color: '#d88a6a', speed: 1.2, at: 1.6 },
      txt('the liver breaks\nsome down', NODE.xs[2], 285, 18, LIVER, { align: 'center', bold: true, at: 1.7, anim: 'fade', duration: 0.3 }),
      ...bioBar(0.4, ABS, '≈ 40% (varies by drug)'),
      txt('Lost to the gut and liver before it gets anywhere', 550, 780, 22, ABS, { align: 'center', bold: true, at: 2.4, anim: 'fade', duration: 0.4 }),
    ] },
    { id: 'sl21', label: 'Sublingual', group: 'ba', stay: true, drawn: false, items: [
      ...BA.bar('sl21'),
      svgItem(curve(`M ${slPath[0][0]} ${slPath[0][1]} C ${NODE.xs[0] + 120} 590, ${NODE.xs[3] - 120} 590, ${slPath[3][0]} ${slPath[3][1]}`, DIS, 5, '10 8')
        + T(515, 612, 16, DIS)('veins under the tongue')),
      ...dotsAlong(slPath, 9, DIS, 0.2),
      ...bioBar(0.85, DIS, 'much higher than oral'),
      txt('Skips the liver, e.g. nitroglycerin for chest pain', 550, 780, 22, DIS, { align: 'center', bold: true, at: 1.6, anim: 'fade', duration: 0.4 }),
    ] },
  ];

  // ================================================================ slide 23: distribution and volume of distribution
  const VES = { y0: 420, y1: 520 };
  const tissueSpots = [[150, 300], [300, 250], [470, 320], [640, 260], [820, 300], [210, 630], [400, 680], [590, 620], [780, 690], [900, 610]];
  const VD = tabsOf([{ id: 'small22', text: 'Stays in the blood (small Vd)', c: PK }, { id: 'large22', text: 'Spreads into tissues (large Vd)', c: DIS }], 230, 560);
  const distBase = `${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}
    <rect x="62" y="192" width="936" height="${VES.y0 - 192}" rx="14" fill="#fbe5e5"/>${T(90, 225, 20, '#8e3b3b', 700, 'start')('Tissues (muscle, organs)')}
    <rect x="62" y="${VES.y1}" width="936" height="${858 - VES.y1}" rx="14" fill="#fff4d6"/>${T(90, 838, 20, '#8a6a16', 700, 'start')('Fat')}
    <rect x="62" y="${VES.y0}" width="936" height="${VES.y1 - VES.y0}" fill="#e0505a" opacity="0.22"/><line x1="62" y1="${VES.y0}" x2="998" y2="${VES.y0}" stroke="#b03a44" stroke-width="4"/><line x1="62" y1="${VES.y1}" x2="998" y2="${VES.y1}" stroke="#b03a44" stroke-width="4"/>
    ${T(90, VES.y0 + 58, 20, '#8e1d24', 700, 'start')('Blood vessel')}`;
  const blood12 = Array.from({ length: 10 }, (_, k) => [240 + k * 72, VES.y0 + 28 + (k % 3) * 22]);
  const distItems = [
    title('Distribution'),
    ...VD.bar(null),
    svgItem(distBase),
    { ...svgItem(blood12.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${EXO}" stroke="#ffffff" stroke-width="2"/>`).join('')), hideDuring: ['small22', 'large22'] },
    ...card(1030, 190, 510, 450, DIS, 'VOLUME OF DISTRIBUTION (Vd)', 'How much a drug spreads OUT of\nthe blood into the body\'s tissues.\n\nOrgans with lots of blood flow\n(brain, heart, liver, kidneys) get\nthe drug first.', 21),
    ...VD.hot,
  ];
  const levelCard = (v, c, txtV) => [box(1030, 660, 510, 200, c), svgItem(levelBar(1060, 740, 450, v, c, 'Drug level in a blood test', txtV)),
    txt('Same dose, very different blood level!', 1285, 815, 18, GREY, { align: 'center', bold: true })];
  const distActions = [
    { id: 'small22', label: 'Small Vd', group: 'vd', stay: true, drawn: false, items: [
      ...VD.bar('small22'),
      svgItem(blood12.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${EXO}" stroke="#ffffff" stroke-width="2"/>`).join('')),
      ...[0, 1, 2].map((k) => ({ type: 'mover', path: [[80, VES.y0 + 30 + k * 22], [990, VES.y0 + 30 + k * 22]], r: 10, color: EXO, count: 1, speed: 3 + k })),
      ...card(1030, 190, 510, 450, PK, 'SMALL Vd', 'The drug mostly STAYS in the blood.\n\nUsually big molecules, or drugs\nstuck to blood proteins.\ne.g. warfarin\n\n→ a high level in a blood test', 21),
      ...levelCard(0.85, PK, 'HIGH'),
    ] },
    { id: 'large22', label: 'Large Vd', group: 'vd', stay: true, drawn: false, items: [
      ...VD.bar('large22'),
      ...tissueSpots.map(([x, y], k) => ({ type: 'mover', path: [[x - 20, VES.y0 + 50], [x, y]], r: 10, color: EXO, count: 1, speed: 1.6, once: true, at: k * 0.12 })),
      ...[0, 1].map((k) => ({ type: 'mover', path: [[80 + k * 400, VES.y0 + 40 + k * 26], [990, VES.y0 + 40 + k * 26]], r: 10, color: EXO, count: 1, speed: 6 - k * 2 })),
      ...card(1030, 190, 510, 450, DIS, 'LARGE Vd', 'The drug SPREADS out of the blood\ninto the tissues.\n\nUsually small, fat-soluble drugs.\nSome are stored in fat and linger\n(e.g. THC from cannabis).\n\n→ a low level in a blood test', 21),
      ...levelCard(0.15, DIS, 'LOW'),
    ] },
  ];

  // ================================================================ slide 24: plasma protein binding
  const ALB = [[220, 330], [500, 300], [780, 340], [330, 600], [650, 610]];
  const albumin = (x, y) => `<path d="M ${x - 70} ${y} C ${x - 72} ${y - 50} ${x - 20} ${y - 66} ${x + 10} ${y - 58} C ${x + 60} ${y - 64} ${x + 80} ${y - 20} ${x + 68} ${y + 10} C ${x + 74} ${y + 50} ${x + 20} ${y + 64} ${x - 10} ${y + 54} C ${x - 50} ${y + 66} ${x - 76} ${y + 36} ${x - 70} ${y} Z" fill="#fde9b8" stroke="#c89a3a" stroke-width="4"/>`;
  const spot = (i, k) => { const [x, y] = ALB[i]; return k ? [x + 58, y - 34] : [x - 52, y + 38]; };
  const drugDot = (x, y, free = false) => `${free ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="22" fill="none" stroke="#3ccf6e" stroke-width="5" opacity="0.8"/>` : ''}<circle cx="${f1(x)}" cy="${f1(y)}" r="13" fill="${EXO}" stroke="#ffffff" stroke-width="3"/>`;
  const otherDot = (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="13" fill="${MET}" stroke="#ffffff" stroke-width="3"/>`;
  const FREE0 = [[380, 450], [900, 520]];
  const PB = tabsOf([{ id: 'norm23', text: 'Normal', c: DIS }, { id: 'disp23', text: 'A second drug is added', c: TIME }], 230, 560);
  const pbBase = `${rr(60, 190, 940, 670, '#e9b4b4', '#fdf0f0', 3)}${T(90, 225, 20, '#8e1d24', 700, 'start')('Blood')}${ALB.map(([x, y]) => albumin(x, y)).join('')}${T(ALB[0][0], ALB[0][1] + 6, 17, '#8a6a16')('albumin')}`;
  const legend23 = `${rr(80, 770, 900, 70, '#d9dce3', '#ffffff', 2, 12)}${drugDot(120, 805)}${T(145, 811, 17, INK, 700, 'start')('our drug')}<circle cx="290" cy="805" r="22" fill="none" stroke="#3ccf6e" stroke-width="5"/>${T(322, 811, 17, INK, 700, 'start')('free = can work')}${otherDot(520, 805)}${T(545, 811, 17, INK, 700, 'start')('a second drug that also binds albumin')}`;
  const pbItems = [
    title('Plasma protein binding'),
    ...PB.bar(null),
    svgItem(pbBase + legend23 + ALB.map((_, i) => drugDot(...spot(i, 0))).join('') + FREE0.map(([x, y]) => drugDot(x, y, true)).join('')),
    { ...svgItem(ALB.map((_, i) => drugDot(...spot(i, 1))).join('')), hideDuring: 'disp23' },
    ...card(1030, 190, 510, 470, DIS, 'BOUND vs FREE', 'Many drugs ride around in the\nblood stuck to proteins (mostly\nALBUMIN).\n\nBound: can\'t reach its target,\nso it doesn\'t work (yet). A store.\n\nFree: the part that actually works\n(and gets removed).', 20),
    ...PB.hot,
  ];
  const freeGauge = (keys) => frameTrack(keys, ([v]) => `${rr(1030, 680, 510, 180, '#d9dce3', '#ffffff', 2)}${levelBar(1060, 760, 450, v, v > 0.4 ? TIME : DIS, 'Free (active) drug', `${Math.round(v * 100)}%`)}`, 12);
  const pbActions = [
    { id: 'norm23', label: 'Normal', group: 'pb', stay: true, drawn: false, items: [
      ...PB.bar('norm23'), ...freeGauge([[0, 0.17], [30, 0.17]]),
      ...FREE0.map(([x, y]) => ({ type: 'pulse', x, y, r: 26, color: '#3ccf6e', speed: 1.3 })),
      txt('Most of the drug is bound; only a little is free', 530, 735, 21, DIS, { align: 'center', bold: true, at: 0.4, anim: 'fade', duration: 0.3 }),
    ] },
    { id: 'disp23', label: 'Displaced by a second drug', group: 'pb', stay: true, drawn: false, items: [
      ...PB.bar('disp23'),
      // the second drug arrives and takes the binding spots; our drug is pushed off and becomes free
      ...[0, 1, 2, 3, 4].flatMap((i) => track([[0, 990, 260 + i * 80], [0.4 + i * 0.15, 990, 260 + i * 80], [1.4 + i * 0.15, ...spot(i, 1)], [30, ...spot(i, 1)]], ([x, y]) => otherDot(x, y))),
      ...[0, 1, 2, 3, 4].flatMap((i) => {
        const [x, y] = spot(i, 1), to = [[300, 220], [640, 220], [900, 420], [470, 470], [820, 700]][i];
        return track([[0, x, y], [1.3 + i * 0.15, x, y], [2.2 + i * 0.15, ...to], [30, ...to]], ([px, py]) => drugDot(px, py, true));
      }),
      ...freeGauge([[0, 0.17], [1.6, 0.17], [3.0, 0.7], [30, 0.7]]),
      txt('Pushed off → free level jumps → toxicity risk', 530, 735, 21, TIME, { align: 'center', bold: true, at: 2.6, anim: 'fade', duration: 0.3 }),
      ...card(1030, 190, 510, 470, TIME, 'DISPLACEMENT', 'Two drugs that both bind albumin\ncompete for the same spots.\n\nOne pushes the other off → much\nmore FREE drug → a bigger effect,\nmaybe toxic.\n\ne.g. warfarin (~99% bound):\nmore free → bleeding risk.\nLow albumin (liver disease,\nmalnutrition) does the same.', 19),
    ] },
  ];

  // ================================================================ slide 25: barriers: brain and placenta
  const BAR = { y0: 112, top: 400, bot: 470, y1: 600 };
  const wall = (x0, x1, tight) => {
    let out = '', x = x0 + 4;
    const w = tight ? 112 : 92, gap = tight ? 0 : 22;
    while (x + w <= x1 - 2) {
      out += `<rect x="${x}" y="${BAR.top}" width="${w}" height="${BAR.bot - BAR.top}" rx="${tight ? 6 : 16}" fill="#f6c9b4" stroke="#b5694a" stroke-width="3"/><ellipse cx="${x + w / 2}" cy="${(BAR.top + BAR.bot) / 2}" rx="16" ry="11" fill="#d88a6a"/>`;
      if (tight && x > x0 + 4) out += `<rect x="${x - 4}" y="${BAR.top + 8}" width="8" height="${BAR.bot - BAR.top - 16}" rx="3" fill="#6e3220"/>`;
      x += w + gap;
    }
    return out;
  };
  const barPanel = (x0, x1, head, sub, tight) => `${rr(x0, BAR.y0, x1 - x0, BAR.y1 - BAR.y0, '#d9dce3', '#ffffff', 2)}
    <rect x="${x0 + 2}" y="${BAR.y0 + 60}" width="${x1 - x0 - 4}" height="${BAR.top - BAR.y0 - 60}" fill="#fbe5e5"/>
    <rect x="${x0 + 2}" y="${BAR.bot}" width="${x1 - x0 - 4}" height="${BAR.y1 - BAR.bot - 2}" fill="${tight ? '#efe6fb' : '#e9f6ec'}"/>
    ${wall(x0, x1, tight)}${T((x0 + x1) / 2, BAR.y0 + 38, 23, tight ? MET : DIS)(head)}
    ${T(x0 + 20, BAR.y0 + 90, 17, '#8e1d24', 700, 'start')('Blood')}${T(x0 + 20, BAR.y1 - 18, 17, tight ? '#4a1f8a' : '#1d6b3a', 700, 'start')(sub)}`;
  const BX = { body: [60, 780], brain: [820, 1540] };
  const fatDot = (x, y) => `<circle cx="${x}" cy="${y}" r="11" fill="#f6c45a" stroke="#a8640a" stroke-width="3"/>`;
  const watDot = (x, y) => `<circle cx="${x}" cy="${y}" r="11" fill="#7fb2f0" stroke="#2c5a92" stroke-width="3"/>`;
  const bodyGaps = [];
  for (let x = BX.body[0] + 4 + 92; x < BX.body[1] - 20; x += 114) bodyGaps.push(x + 11);
  const barItems = [
    title('Barriers: the brain and the placenta'),
    svgItem(barPanel(...BX.body, 'Most capillaries: leaky', 'Body tissue', false) + barPanel(...BX.brain, 'Brain capillaries: sealed tight', 'Brain', true)),
    { ...svgItem([0, 1, 2].map((k) => fatDot(bodyGaps[k] - 30, 250 + k * 40) + watDot(bodyGaps[k] + 30, 270 + k * 30)).join('')
      + [0, 1, 2].map((k) => fatDot(900 + k * 200, 250 + k * 40) + watDot(960 + k * 200, 280 + k * 30)).join('')), hideDuring: 'bbb24' },
    { type: 'hotspot', x: 60, y: 112, w: 1480, h: 488, action: 'bbb24' },
    svgItem(`${fatDot(1360, 515)}${T(1380, 521, 16, INK, 700, 'start')('fat-soluble')}${watDot(1360, 555)}${T(1380, 561, 16, INK, 700, 'start')('water-soluble')}`),
    ...card(60, 620, 480, 240, MET, 'BLOOD-BRAIN BARRIER', 'Brain capillaries are sealed tight\nand pump many drugs back out.\nMostly small, fat-soluble drugs\nget in.', 19),
    ...card(560, 620, 480, 240, DARK, 'EXAMPLES', 'Get in: alcohol, diazepam, morphine\n\nKept out: loperamide (an opioid\nfor diarrhoea: no high), many\nantibiotics', 19),
    ...card(1060, 620, 480, 240, '#c2566b', 'THE PLACENTA', 'Not much of a barrier: most drugs\nreach the baby.\n\n→ extra care with medicines\nin pregnancy', 19),
  ];
  const barActions = [{ id: 'bbb24', label: 'Send the drugs in', stay: true, drawn: false, items: [
    ...[0, 1, 2].flatMap((k) => [
      { type: 'mover', path: [[bodyGaps[k] - 30, 250 + k * 40], [bodyGaps[k], BAR.top - 10], [bodyGaps[k], BAR.bot + 10], [bodyGaps[k] - 20, 550]], r: 11, color: '#f0a12e', count: 1, speed: 2.6 + k * 0.2 },
      { type: 'mover', path: [[bodyGaps[k] + 30, 270 + k * 30], [bodyGaps[k], BAR.top - 10], [bodyGaps[k], BAR.bot + 10], [bodyGaps[k] + 25, 560]], r: 11, color: '#5c97e6', count: 1, speed: 2.9 + k * 0.2 },
      { type: 'mover', path: [[900 + k * 200, 250 + k * 40], [910 + k * 200, 430], [920 + k * 200, 560]], r: 11, color: '#f0a12e', count: 1, speed: 2.6 + k * 0.2 },
      { type: 'mover', path: [[960 + k * 200, 280 + k * 30], [965 + k * 200, BAR.top - 14], [990 + k * 200, 260]], r: 11, color: '#5c97e6', count: 1, speed: 2.2 + k * 0.2 },
    ]),
    txt('Both get through the gaps', 420, 540, 21, DIS, { align: 'center', bold: true, at: 1.4, anim: 'fade', duration: 0.3 }),
    txt('Only fat-soluble gets in', 1180, 540, 21, MET, { align: 'center', bold: true, at: 1.4, anim: 'fade', duration: 0.3 }),
  ] }];

  // ================================================================ slide 26: why metabolism, phase I and II
  const MC = (i) => 60 + i * 375, MW = 355;
  const STAGES = [
    { c: EXO, head: 'Fat-soluble drug', mol: (cx, cy) => drugMol(cx, cy, 1.1), text: 'Easy to absorb… but hard to\nget rid of: the kidneys just\nsoak it back up.', v: 0.12 },
    { c: PK, head: 'Phase I: modify', mol: (cx, cy) => drugMol(cx, cy, 1.1, OH), text: 'Enzymes (mostly CYP450) make\na small change, e.g. add an\n-OH group.', v: 0.38 },
    { c: MET, head: 'Phase II: attach', mol: (cx, cy) => drugMol(cx, cy, 1.1, OH + TAG), text: 'A big water-loving group is\nstuck on (conjugation), e.g.\nglucuronic acid.', v: 0.9 },
    { c: DIS, head: 'Excreted', mol: (cx, cy) => kidneyShape(cx - 30, cy, 1.1) + `<path d="M ${cx + 40} ${cy - 30} C ${cx + 60} ${cy} ${cx + 70} ${cy + 20} ${cx + 55} ${cy + 40} C ${cx + 40} ${cy + 55} ${cx + 25} ${cy + 30} ${cx + 40} ${cy - 30} Z" fill="#f6e27a" stroke="#b59a1a" stroke-width="3"/>`, text: 'Now water-soluble, so it leaves\nin the URINE (or in bile).\nMostly happens in the LIVER.', v: 0.9 },
  ];
  const stageItems = (i) => {
    const S = STAGES[i], x = MC(i), cx = x + MW / 2;
    return [
      box(x, 112, MW, 748, S.c),
      { type: 'rect', x, y: 112, w: MW, h: 62, color: S.c, fill: S.c, fillOpacity: 1, width: 3, rough: false },
      txt(`${i ? i + '. ' : ''}${S.head}`, cx, 143, 24, '#ffffff', { align: 'center', bold: true }),
      svgItem(S.mol(cx, 360)),
      txt(S.text, x + 24, 560, 19, INK, { bold: true }),
      svgItem(levelBar(x + 24, 760, MW - 48, S.v, S.c, 'Water-soluble?', S.v > 0.6 ? 'very' : S.v > 0.3 ? 'a bit' : 'no')),
    ];
  };
  const metItems = [
    title('Metabolism: making drugs easy to remove'),
    ...stageItems(0),
    { ...svgItem([1, 2, 3].map((i) => `${rr(MC(i), 112, MW, 748, '#c9ced8', '#f7f8fa', 2.5)}${T(MC(i) + MW / 2, 486, 40, '#c2c7d0')('?')}`).join('')), hideDuring: 'met25' },
    { type: 'hotspot', x: 60, y: 112, w: 1480, h: 748, action: 'met25' },
  ];
  const metActions = [{ id: 'met25', label: 'Build it step by step', stay: true, drawn: false, items: [
    ...[1, 2, 3].flatMap((i) => at([...stageItems(i), svgItem(arrow(MC(i) - 34, 360, MC(i) + 8, 360, STAGES[i].c, 6))], (i - 1) * 1.4)),
  ] }];

  // ================================================================ slide 27: cytochrome P450
  const CYPS = [['CYP3A4', 0.5, MET], ['CYP2D6', 0.25, PK], ['CYP2C9 / 2C19', 0.15, ABS], ['others', 0.1, '#8a8f98']];
  const GG = { x0: 900, x1: 1500, y0: 340, y1: 640 };
  const pG = plot(GG);
  const WIN = [0.5, 0.75];
  const levelGraph = (G, ks, cols, u = 1, labels = []) => {
    const p = plot(G);
    const curves = ks.map((k, j) => {
      const pts = []; for (let t = 0; t <= 10 * u + 1e-6; t += 0.1) pts.push([p.x(t / 10), p.y(bateman(t, k))]);
      return polyline(pts, cols[j], 5);
    }).join('');
    return `${band(G, p, WIN[0], WIN[1], DIS, 0.13)}${band(G, p, WIN[1], 1.02, TIME, 0.08)}
      ${axes(G, 'Time →', 'Drug level →', false)}
      ${T(G.x1 - 6, p.y(WIN[1]) + 22, 15, '#1d6b3a', 700, 'end')('works (window)')}${T(G.x1 - 6, p.y(1.0) + 18, 15, TIME, 700, 'end')('toxic')}${T(G.x1 - 6, p.y(0.15), 15, GREY, 700, 'end')('too low: no effect')}
      ${curves}${labels.join('')}`;
  };
  const CY = [{ id: 'cn26', text: 'Normal', k: 0.35, c: DIS }, { id: 'cp26', text: 'Poor metaboliser', k: 0.08, c: TIME }, { id: 'cu26', text: 'Ultra-rapid', k: 1.0, c: '#8a8f98' }];
  const cyChips = (active) => CY.flatMap((q, i) => chip(860 + i * 222, 220, 212, q.text, MET, q.id === active));
  const cypItems = [
    title('Cytochrome P450 enzymes'),
    ...card(60, 112, 760, 330, MET, 'CYTOCHROME P450 (CYP)', 'A family of enzymes, mostly in the LIVER,\nthat do most Phase I metabolism.\n\nThey\'re named like CYP3A4\n(family 3, subfamily A, enzyme 4).', 21),
    box(60, 462, 760, 398, MET),
    txt('Share of drugs each one handles (roughly)', 440, 500, 21, MET, { align: 'center', bold: true }),
    svgItem(CYPS.map(([n, v, c], i) => { const y = 560 + i * 72; return `${T(90, y + 20, 20, INK, 700, 'start')(n)}${rr(290, y, 480, 30, '#c9ced8', '#eef0f4', 2, 12)}<rect x="290" y="${y}" width="${f1(480 * v)}" height="30" rx="12" fill="${c}"/>${T(300 + 480 * v, y + 22, 18, c, 700, 'start')(`~${Math.round(v * 100)}%`)}`; }).join('')),
    box(840, 112, 700, 748, DARK),
    txt('Genes matter: people have different versions', 1190, 160, 22, DARK, { align: 'center', bold: true }),
    ...cyChips(null),
    svgItem(levelGraph(GG, [0.35], [DIS])),
    ...CY.map((q) => ({ type: 'hotspot', x: 860 + CY.indexOf(q) * 222, y: 220, w: 212, h: 44, action: q.id })),
    txt('Same dose for everyone. Click a type ↑', 1190, 760, 20, GREY, { align: 'center', bold: true, hideDuring: CY.map((q) => q.id) }),
  ];
  const cypText = {
    cn26: ['Normal: the level sits in the window', DIS],
    cp26: ['Poor metaboliser: too little enzyme →\nthe drug builds up → side effects', TIME],
    cu26: ['Ultra-rapid: too much enzyme → cleared\ntoo fast → the drug doesn\'t work', GREY],
  };
  const cypActions = CY.map((q) => ({ id: q.id, label: q.text, group: 'cy', stay: true, drawn: false, items: [
    ...cyChips(q.id),
    svgItem(`<rect x="842" y="300" width="696" height="430" fill="#ffffff"/>`),
    ...frameTrack([[0, 0], [2.2, 1], [30, 1]], ([u]) => levelGraph(GG, [0.35, q.k].filter((k, j) => !j || q.k !== 0.35), q.k === 0.35 ? [DIS] : ['#b8dcc4', q.c], u), 12),
    { ...svgItem(`<rect x="842" y="732" width="696" height="126" fill="#ffffff"/>`), at: 2.2, duration: 0.01 },
    txt(cypText[q.id][0], 1190, 780, 20, cypText[q.id][1], { align: 'center', bold: true, at: 2.2, anim: 'fade', duration: 0.3 }),
  ] }));

  // ================================================================ slide 28: prodrugs and active metabolites
  const PR = tabsOf([{ id: 'usual27', text: 'Usual', c: DARK }, { id: 'pro27', text: 'Prodrug', c: DIS }, { id: 'act27', text: 'Active metabolite', c: MET }], 170, 400);
  const BOXL = [90, 280, 300, 280], BOXR = [660, 280, 300, 280];
  const molBox = ([x, y, w, h], name, active) => `${rr(x, y, w, h, active ? DIS : '#9aa1ad', '#ffffff', 3, 18)}${drugMol(x + w / 2 - 14, y + 120, 1, '')}
    ${pill(x + w / 2, y + 205, active ? 120 : 140, active ? 'ACTIVE' : 'inactive', active ? DIS : '#9aa1ad', active ? DIS : '#ffffff', active ? '#ffffff' : GREY)}
    ${T(x + w / 2, y + 252, 19, INK)(name)}`;
  const prBase = `${rr(60, 190, 940, 670, '#d9dce3', '#fbfcfe', 2)}${T(BOXL[0] + 150, 255, 21, DARK)('The drug you take')}${T(BOXR[0] + 150, 255, 21, DARK)('What the liver turns it into')}
    ${liverShape(525, 420, 0.9)}${arrow(400, 420, 445, 420, LIVER, 5)}${arrow(605, 420, 650, 420, LIVER, 5)}${T(525, 486, 17, LIVER)('liver enzymes')}`;
  const PRV = {
    usual27: { l: ['most drugs', true], r: ['inactive metabolite', false], cap: 'Metabolism ENDS the effect', c: DARK },
    pro27: { l: ['codeine', false], r: ['morphine', true], cap: 'Only works AFTER the liver activates it', c: DIS },
    act27: { l: ['diazepam', true], r: ['desmethyldiazepam', true], cap: 'The metabolite keeps working → the effect lasts much longer', c: MET },
  };
  const prItems = [
    title('Prodrugs and active metabolites'),
    ...PR.bar(null),
    svgItem(prBase + `${rr(BOXL[0], BOXL[1], 300, 280, '#c9ced8', '#f7f8fa', 2.5, 18)}${rr(BOXR[0], BOXR[1], 300, 280, '#c9ced8', '#f7f8fa', 2.5, 18)}`),
    ...card(1030, 190, 510, 670, MET, 'IT DEPENDS ON THE DRUG', 'Metabolism usually switches a drug\nOFF… but not always.\n\nPRODRUG: given in an inactive\nform; the body switches it ON.\ne.g. codeine → morphine,\nenalapril, clopidogrel\n\nACTIVE METABOLITE: the broken-\ndown form still works, so the\neffect lasts longer.\ne.g. diazepam', 20),
    ...PR.hot,
  ];
  const prActions = Object.entries(PRV).map(([id, v]) => ({ id, label: { usual27: 'Usual', pro27: 'Prodrug', act27: 'Active metabolite' }[id], group: 'pr', stay: true, drawn: false, items: [
    ...PR.bar(id),
    svgItem(molBox(BOXL, v.l[0], v.l[1])),
    ...track([[0, BOXL[0] + 136, 400], [0.4, BOXL[0] + 136, 400], [1.3, 512, 410], [1.8, 512, 410], [2.6, BOXR[0] + 136, 400], [2.65, BOXR[0] + 136, 400]], ([x, y]) => drugMol(x, y, 0.6)),
    { ...svgItem(molBox(BOXR, v.r[0], v.r[1])), at: 2.6, duration: 0.3 },
    txt(v.cap, 530, 700, 22, v.c, { align: 'center', bold: true, at: 2.9, anim: 'fade', duration: 0.4 }),
  ] }));

  // ================================================================ slide 29: enzyme induction and inhibition
  const IG = { x0: 820, x1: 1500, y0: 300, y1: 560 };
  const IN = tabsOf([{ id: 'n28', text: 'Normal', c: DIS }, { id: 'ind28', text: 'Inducer', c: '#8a8f98' }, { id: 'inh28', text: 'Inhibitor', c: TIME }], 170, 400);
  const pac = (x, y, c = MET, blocked = false) => `<path d="M ${x} ${y} L ${x + 24} ${y - 14} A 28 28 0 1 0 ${x + 24} ${y + 14} Z" fill="${c}" stroke="#4a1f8a" stroke-width="3" opacity="${blocked ? 0.45 : 1}"/>${blocked ? `<line x1="${x - 22}" y1="${y - 22}" x2="${x + 22}" y2="${y + 22}" stroke="${TIME}" stroke-width="6"/><line x1="${x - 22}" y1="${y + 22}" x2="${x + 22}" y2="${y - 22}" stroke="${TIME}" stroke-width="6"/>` : ''}`;
  const ENZ = [[220, 380], [400, 330], [560, 420], [300, 560], [480, 600], [640, 560], [220, 700], [560, 730]];
  const cell = (n, blocked = 0) => `${rr(80, 200, 680, 640, '#b5694a', '#f8e3d6', 4, 60)}${T(420, 245, 21, '#6e3220')('Liver cell')}
    <ellipse cx="660" cy="760" rx="70" ry="50" fill="#e6c3ae" stroke="#b5694a" stroke-width="3"/>${T(660, 766, 15, '#6e3220')('nucleus')}
    ${ENZ.slice(0, n).map(([x, y], i) => pac(x, y, MET, i < blocked)).join('')}`;
  const indGraph = (k, c, u = 1) => {
    const p = plot(IG);
    const pts = []; for (let t = 0; t <= 10 * u + 1e-6; t += 0.1) pts.push([p.x(t / 10), p.y(bateman(t, k))]);
    const ref = []; for (let t = 0; t <= 10; t += 0.1) ref.push([p.x(t / 10), p.y(bateman(t, 0.35))]);
    return `${rr(780, 190, 760, 410, '#d9dce3', '#ffffff', 2)}${band(IG, p, WIN[0], WIN[1], DIS, 0.13)}${band(IG, p, WIN[1], 1.02, TIME, 0.08)}${axes(IG, 'Time →', 'Drug level →', false)}
      ${T(IG.x1 - 6, p.y(WIN[1]) + 22, 15, '#1d6b3a', 700, 'end')('works (window)')}${T(IG.x1 - 6, p.y(1.0) + 18, 15, TIME, 700, 'end')('toxic')}
      ${k !== 0.35 ? polyline(ref, '#b8dcc4', 4) : ''}${polyline(pts, c, 5)}`;
  };
  const indItems = [
    title('Enzyme induction and inhibition'),
    ...IN.bar(null),
    svgItem(cell(4) + indGraph(0.35, DIS)),
    ...card(780, 620, 760, 240, DIS, 'DRUG INTERACTIONS', 'Some drugs (and foods) change how many CYP enzymes\nthere are, or how well they work. That changes the\nlevels of OTHER drugs broken down by them.', 20),
    ...IN.hot,
  ];
  const INV = {
    n28: { n: 4, b: 0, k: 0.35, c: DIS, head: 'NORMAL', body: 'A normal amount of enzyme: the\ndrug level sits in the window.', fl: 1.4 },
    ind28: { n: 8, b: 0, k: 1.0, c: '#8a8f98', head: 'INDUCER: MORE ENZYMES', body: 'The drug is broken down faster → level too LOW → may stop working.\ne.g. rifampicin, carbamazepine, St John\'s wort, smoking\n→ e.g. the contraceptive pill can fail', fl: 0.8 },
    inh28: { n: 4, b: 3, k: 0.08, c: TIME, head: 'INHIBITOR: ENZYMES BLOCKED', body: 'The drug is broken down slower → level too HIGH → toxic.\ne.g. grapefruit juice, clarithromycin, fluconazole\n→ e.g. statin levels rise → muscle damage', fl: 2.4 },
  };
  const indActions = Object.entries(INV).map(([id, v]) => ({ id, label: { n28: 'Normal', ind28: 'Inducer', inh28: 'Inhibitor' }[id], group: 'in', stay: true, drawn: false, items: [
    ...IN.bar(id),
    svgItem(cell(v.n, v.b)),
    ...[0, 1, 2].map((k) => ({ type: 'mover', path: [[100, 300 + k * 160], [ENZ[k * 2 % v.n][0] - 30, ENZ[k * 2 % v.n][1]]], r: 10, color: EXO, count: 1, speed: v.fl + k * 0.2, once: false })),
    ...frameTrack([[0, 0], [2.2, 1], [30, 1]], ([u]) => indGraph(v.k, v.c, u), 12),
    ...card(780, 620, 760, 240, v.c, v.head, v.body, 19),
  ] }));

  // ================================================================ slide 30: excretion
  const NEPH = { cap: [190, 330], tubY: 330, capY: 480, x1: 880, urineY: 780 };
  const nephron = `${rr(60, 112, 940, 748, '#d9dce3', '#ffffff', 2)}
    <path d="M 70 300 L 150 315" stroke="#c0392b" stroke-width="18" stroke-linecap="round" fill="none"/>${T(72, 270, 16, '#8e1d24', 700, 'start')('blood in')}
    <path d="M ${NEPH.cap[0]} 395 L ${NEPH.cap[0]} ${NEPH.capY} L 960 ${NEPH.capY}" stroke="#e0606a" stroke-width="24" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>${T(862, NEPH.capY + 46, 16, '#8e1d24', 700, 'end')('blood back to the body →')}
    <path d="M ${NEPH.cap[0] + 60} ${NEPH.tubY} L ${NEPH.x1} ${NEPH.tubY} L ${NEPH.x1} ${NEPH.urineY}" stroke="#e9c98f" stroke-width="40" fill="none" stroke-linejoin="round"/>
    <path d="M ${NEPH.cap[0] + 60} ${NEPH.tubY} L ${NEPH.x1} ${NEPH.tubY} L ${NEPH.x1} ${NEPH.urineY}" stroke="#fdf3d8" stroke-width="28" fill="none" stroke-linejoin="round"/>
    <path d="M ${NEPH.cap[0] - 40} ${NEPH.cap[1] - 70} A 75 75 0 1 0 ${NEPH.cap[0] + 60} ${NEPH.cap[1] - 20}" stroke="#c89a3a" stroke-width="8" fill="#fdf3d8"/>
    ${[[-20, -10], [10, -24], [24, 8], [-6, 22], [-28, 16], [8, 0]].map(([dx, dy]) => `<circle cx="${NEPH.cap[0] + dx}" cy="${NEPH.cap[1] + dy}" r="17" fill="#e0606a" stroke="#8e1d24" stroke-width="2.5"/>`).join('')}
    ${T(NEPH.cap[0], NEPH.cap[1] + 112, 16, GREY)('glomerulus (filter)')}
    ${T(NEPH.x1 + 28, 620, 16, '#8a6a16', 700, 'start')('tubule')}
    <path d="M ${NEPH.x1 - 40} ${NEPH.urineY} L ${NEPH.x1 + 40} ${NEPH.urineY} L ${NEPH.x1 + 30} 840 L ${NEPH.x1 - 30} 840 Z" fill="#f6e27a" stroke="#b59a1a" stroke-width="3"/>${T(NEPH.x1 - 52, 820, 20, '#8a6a16', 700, 'end')('URINE')}
    ${badge(NEPH.cap[0], 200, '1', EXC)}${T(NEPH.cap[0] + 32, 207, 20, EXC, 700, 'start')('Filtration')}
    ${arrow(430, NEPH.capY - 18, 430, NEPH.tubY + 26, MET, 5)}${badge(470, 405, '2', MET)}${T(500, 412, 20, MET, 700, 'start')('Secretion')}
    ${arrow(700, NEPH.tubY + 22, 700, NEPH.capY - 20, ABS, 5)}${badge(740, 405, '3', ABS)}${T(770, 412, 20, ABS, 700, 'start')('Reabsorption')}
    ${rr(90, 560, 660, 270, '#d9dce3', '#fbfcfe', 2, 12)}
    <circle cx="120" cy="600" r="10" fill="#7fb2f0" stroke="#2c5a92" stroke-width="3"/>${T(142, 606, 17, INK, 700, 'start')('water-soluble drug → stays in the urine')}
    <circle cx="120" cy="645" r="10" fill="#f6c45a" stroke="#a8640a" stroke-width="3"/>${T(142, 651, 17, INK, 700, 'start')('fat-soluble drug → slips back into the blood')}
    <circle cx="120" cy="690" r="10" fill="#c9a8f2" stroke="#4a1f8a" stroke-width="3"/>${T(142, 696, 17, INK, 700, 'start')('pumped in (secreted), e.g. penicillin')}
    ${T(120, 750, 17, GREY, 700, 'start')('Protein-bound drug is too big to be filtered.')}
    ${T(120, 790, 17, GREY, 700, 'start')('Kidney disease → drugs build up → lower doses.')}`;
  const excItems = [
    title('Excretion'),
    svgItem(nephron),
    { type: 'hotspot', x: 60, y: 112, w: 940, h: 440, action: 'kid29' },
    ...card(1030, 112, 510, 360, EXC, 'THE KIDNEYS (main route)', '1. Filtration: free drug is\n   filtered out of the blood\n2. Secretion: pumps push some\n   drugs into the urine\n3. Reabsorption: fat-soluble drug\n   slips back into the blood', 20),
    ...card(1030, 492, 510, 368, DARK, 'OTHER ROUTES', '• Bile → faeces (via the liver)\n\n• Lungs: anaesthetic gases,\n   alcohol (the breath test)\n\n• Breast milk: care when\n   breastfeeding\n\n• Sweat and saliva (minor)', 20),
  ];
  const excActions = [{ id: 'kid29', label: 'Watch the kidney work', stay: true, drawn: false, items: [
    ...[0, 1].map((k) => ({ type: 'mover', path: [[70, 300], [NEPH.cap[0], NEPH.cap[1]], [NEPH.cap[0] + 70, NEPH.tubY], [NEPH.x1, NEPH.tubY], [NEPH.x1, NEPH.urineY + 20]], r: 10, color: '#5c97e6', count: 1, speed: 4.2, phase: k / 2, smooth: false })),
    { type: 'mover', path: [[70, 300], [NEPH.cap[0], NEPH.cap[1]], [NEPH.cap[0] + 70, NEPH.tubY], [700, NEPH.tubY], [700, NEPH.capY], [960, NEPH.capY]], r: 10, color: '#f0a12e', count: 1, speed: 4.2, smooth: false },
    { type: 'mover', path: [[NEPH.cap[0], NEPH.capY], [430, NEPH.capY], [430, NEPH.tubY], [NEPH.x1, NEPH.tubY], [NEPH.x1, NEPH.urineY + 20]], r: 10, color: '#a77be8', count: 1, speed: 4.2, smooth: false, phase: 0.3 },
  ] }];

  // ================================================================ slide 31: drug levels over time
  const GC = { x0: 170, x1: 940, y0: 240, y1: 760 };
  const pC = plot(GC);
  const MEC = 0.3, MTC = 0.85, KC = 0.35, TMAXX = 10;
  const cAt = (t) => bateman(t, KC);
  const tPeak = Math.log(1.5 / KC) / (1.5 - KC);
  const cross = (lvl, from, to) => { let a = from, b = to; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if ((cAt(a) - lvl) * (cAt(m) - lvl) <= 0) b = m; else a = m; } return (a + b) / 2; };
  const tOn = cross(MEC, 0, tPeak), tOff = cross(MEC, tPeak, TMAXX);
  const cx = (t) => pC.x(t / TMAXX), cy = (v) => pC.y(v);
  const ctGraph = (u, labels) => {
    const pts = []; for (let t = 0; t <= TMAXX * u + 1e-6; t += 0.05) pts.push([cx(t), cy(cAt(t))]);
    return `${rr(60, 112, 940, 748, '#d9dce3', '#ffffff', 2)}
      ${band(GC, pC, MTC, 1.0, TIME, 0.1)}${band(GC, pC, MEC, MTC, DIS, 0.12)}
      ${axes(GC, 'Time after one oral dose →', 'Drug level in the blood →', false)}
      ${T(GC.x1 - 8, cy(1.0) + 24, 17, TIME, 700, 'end')('TOXIC')}${T(GC.x1 - 8, cy(MTC) + 26, 17, '#1d6b3a', 700, 'end')('THERAPEUTIC WINDOW: it works')}${T(GC.x1 - 8, cy(MEC) + 26, 17, GREY, 700, 'end')('too low: no effect')}
      ${polyline(pts, TIME, 6)}${u > 0 && u < 1 ? dot(cx(TMAXX * u), cy(cAt(TMAXX * u)), 10, TIME) : ''}${labels ? ctLabels : ''}`;
  };
  const ctLabels = `${dot(cx(tPeak), cy(cAt(tPeak)), 10, TIME)}${T(cx(tPeak) + 16, cy(cAt(tPeak)) - 14, 19, TIME, 700, 'start')('Cmax (peak level)')}
    ${dash(cx(tPeak), cy(cAt(tPeak)), cx(tPeak), GC.y1, TIME)}${T(cx(tPeak), GC.y1 + 24, 17, TIME)('Tmax')}
    ${dot(cx(tOn), cy(MEC), 9, DIS)}${T(cx(tOn) + 12, cy(MEC) + 30, 17, DIS, 700, 'start')('onset')}
    <line x1="${f1(cx(tOn))}" y1="${f1(GC.y1 - 40)}" x2="${f1(cx(tOff))}" y2="${f1(GC.y1 - 40)}" stroke="${DIS}" stroke-width="4"/>
    <line x1="${f1(cx(tOn))}" y1="${f1(GC.y1 - 52)}" x2="${f1(cx(tOn))}" y2="${f1(GC.y1 - 28)}" stroke="${DIS}" stroke-width="4"/><line x1="${f1(cx(tOff))}" y1="${f1(GC.y1 - 52)}" x2="${f1(cx(tOff))}" y2="${f1(GC.y1 - 28)}" stroke="${DIS}" stroke-width="4"/>
    ${T((cx(tOn) + cx(tOff)) / 2, GC.y1 - 54, 17, DIS)('duration of action')}`;
  const ctItems = [
    title('Drug levels over time'),
    svgItem(ctGraph(0, false)),
    { type: 'hotspot', x: 60, y: 112, w: 940, h: 748, action: 'ct30' },
    txt('Click the graph to give a dose', 560, 520, 22, '#9aa1ad', { align: 'center', bold: true, hideDuring: 'ct30' }),
    ...card(1030, 112, 510, 748, TIME, 'THE CONCENTRATION CURVE', 'After a dose, the level RISES\n(absorption) then FALLS\n(metabolism and excretion).\n\nCmax: the peak level\nTmax: when the peak happens\n\nTHERAPEUTIC WINDOW: between\ntoo low (no effect) and too high\n(toxic). The goal is to stay in it.\n\nOnset: when it starts working\nDuration: how long it stays above\nthe "works" line', 20),
  ];
  const ctActions = [{ id: 'ct30', label: 'Give a dose', stay: true, drawn: false, items: [
    ...frameTrack([[0, 0], [4, 1], [30, 1]], ([u]) => ctGraph(u, false), 12),
    { ...svgItem(ctGraph(1, true)), at: 4.0, duration: 0.3 },
  ] }];

  // ================================================================ slide 32: half-life and clearance
  const GH = { x0: 170, x1: 940, y0: 260, y1: 760 };
  const pH = plot(GH);
  const NH = 5;
  const hx = (t) => pH.x(t / NH), hy = (v) => pH.y(v / 100);
  const hlGraph = (u) => {
    const tN = NH * u, pts = [];
    for (let t = 0; t <= tN + 1e-6; t += 0.04) pts.push([hx(t), hy(100 * 0.5 ** t)]);
    const marks = []; for (let n = 0; n <= NH && n <= tN + 1e-6; n++) {
      const v = 100 * 0.5 ** n;
      marks.push(`${n ? dash(hx(n), hy(v), hx(n), GH.y1, '#c9ced8') : ''}${dot(hx(n), hy(v), 9, EXC)}${T(hx(n) + 12, hy(v) - 14, 18, EXC, 700, 'start')(`${v % 1 ? v.toFixed(1) : v}%`)}`);
    }
    const left = Math.round(100 * 0.5 ** tN);
    return `${rr(60, 112, 940, 748, '#d9dce3', '#ffffff', 2)}${axes(GH, 'Time →', 'Drug left in the body →', false)}
      ${Array.from({ length: NH }, (_, n) => T(hx(n + 1), GH.y1 + 26, 16, GREY)(`${n + 1} t½`)).join('')}
      ${polyline(pts, EXC, 6)}${marks.join('')}
      ${rr(700, 140, 280, 80, EXC, '#eef4fe', 2.5, 14)}${T(840, 172, 17, GREY)('left in the body')}${T(840, 206, 28, EXC)(`${left}%`)}`;
  };
  const hlItems = [
    title('Half-life and clearance'),
    svgItem(hlGraph(0)),
    { type: 'hotspot', x: 60, y: 112, w: 940, h: 748, action: 'hl31' },
    txt('Click to watch the drug being removed', 560, 520, 22, '#9aa1ad', { align: 'center', bold: true, hideDuring: 'hl31' }),
    ...card(1030, 112, 510, 300, EXC, 'HALF-LIFE (t½)', 'The time it takes for the drug\nlevel to fall by HALF.\n\nAfter ~4–5 half-lives it\'s\nbasically gone (~95%).\ne.g. paracetamol ~2 h, diazepam ~2 days', 19),
    ...card(1030, 432, 510, 200, DARK, 'CLEARANCE', 'How fast the body removes the drug\n(mostly the liver and kidneys).\nLower clearance → longer half-life.', 19),
    ...card(1030, 652, 510, 208, TIME, 'WHAT SLOWS CLEARANCE', 'Kidney or liver disease · older age,\nnewborns · genetics · enzyme\ninhibitors → the drug builds up\n→ lower or less frequent doses', 19),
  ];
  const hlActions = [{ id: 'hl31', label: 'Watch it halve', stay: true, drawn: false, items: [
    ...frameTrack([[0, 0], [6, 1], [30, 1]], ([u]) => hlGraph(u), 12),
  ] }];

  // ================================================================ slide: first-order vs zero-order elimination
  const GZ = { x0: 170, x1: 940, y0: 280, y1: 740 };
  const pZ = plot(GZ);
  const ZH = 5;
  const zx = (t) => pZ.x(t / ZH), zy = (v) => pZ.y(v / 100);
  const firstAt = (t) => 100 * 0.5 ** t, zeroAt = (t) => Math.max(0, 100 - 20 * t);
  const zoGraph = (mode, u = 1) => {
    const line = (f, c, w, op, uu) => { const pts = []; for (let t = 0; t <= ZH * uu + 1e-6; t += 0.04) pts.push([zx(t), zy(f(t))]); return polyline(pts, c, w, op); };
    const f = mode === 'first' ? firstAt : zeroAt, c = mode === 'first' ? EXC : TIME;
    const other = mode === 'first' ? zeroAt : firstAt, oc = mode === 'first' ? TIME : EXC;
    const steps = [];
    for (let n = 0; n < ZH && n + 1 <= ZH * u + 1e-6; n++) {
      const a = f(n), b = f(n + 1), d = a - b;
      steps.push(`${dot(zx(n + 1), zy(b), 8, c)}${T(zx(n + 0.5) + 6, zy((a + b) / 2) - 8, 17, c, 700, 'start')(`−${d % 1 ? d.toFixed(1) : d}`)}`);
    }
    return `${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}${axes(GZ, 'Hours →', 'Drug in the body →', false)}
      ${Array.from({ length: ZH }, (_, n) => T(zx(n + 1), GZ.y1 + 26, 16, GREY)(`${n + 1} h`)).join('')}
      ${mode ? line(other, oc, 4, 0.22, 1) : line(firstAt, EXC, 5, 1, 1) + line(zeroAt, TIME, 5, 1, 1)}
      ${mode ? line(f, c, 6, 1, u) + dot(zx(0), zy(100), 8, c) + steps.join('') : ''}`;
  };
  const enzymesBusy = (busy) => `${rr(660, 205, 320, 125, '#e4e7ee', '#ffffff', 2, 12)}${T(820, 232, 16, DARK)(busy ? 'enzymes: ALL busy' : 'enzymes: spare room')}
    ${[0, 1, 2].map((k) => { const x = 700 + k * 62, y = 285; return `<path d="M ${x} ${y} L ${x + 22} ${y - 13} A 25 25 0 1 0 ${x + 22} ${y + 13} Z" fill="#c9a8f2" stroke="#4a1f8a" stroke-width="3"/>${busy || k === 0 ? `<circle cx="${x + 14}" cy="${y}" r="8" fill="${EXO}"/>` : ''}`; }).join('')}
    ${busy ? [0, 1, 2].map((k) => `<circle cx="${905 + (k % 2) * 22}" cy="${262 + k * 18}" r="8" fill="${EXO}"/>`).join('') + T(935, 322, 13, GREY)('waiting') : ''}`;
  const ZO = tabsOf([{ id: 'first33', text: 'First-order (most drugs)', c: EXC }, { id: 'zero33', text: 'Zero-order (e.g. alcohol)', c: TIME }], 230, 560);
  const zoItems = [
    title('First-order vs zero-order elimination'),
    ...ZO.bar(null),
    svgItem(zoGraph(null)),
    svgItem(`${T(zx(0.35), zy(16), 18, EXC, 700, 'start')('first-order: a curve')}${T(zx(3.2) + 12, zy(zeroAt(3.2)) - 14, 18, TIME, 700, 'start')('zero-order: a straight line')}`),
    ...card(1030, 190, 510, 670, DARK, 'TWO WAYS TO BE REMOVED', 'FIRST-ORDER: the same FRACTION\nis removed every hour (e.g. half).\nMost drugs. Has a half-life.\n\nZERO-ORDER: the same AMOUNT is\nremoved every hour, however\nmuch is there. No fixed half-life.\n\nClick the tabs to compare →', 21),
    ...ZO.hot,
  ];
  const zoActions = [
    { id: 'first33', label: 'First-order', group: 'zo', stay: true, drawn: false, items: [
      ...ZO.bar('first33'),
      ...frameTrack([[0, 0], [5, 1], [30, 1]], ([u]) => zoGraph('first', u), 12),
      svgItem(enzymesBusy(false)),
      ...card(1030, 190, 510, 670, EXC, 'FIRST-ORDER (MOST DRUGS)', 'The same FRACTION goes each hour:\n−50, −25, −12.5…\n\nLots of drug → lots removed;\na little drug → a little removed.\n\nThe enzymes have spare room, so\nthey keep up with whatever\'s there.\n\n→ a fixed HALF-LIFE (slide 32)', 21),
    ] },
    { id: 'zero33', label: 'Zero-order', group: 'zo', stay: true, drawn: false, items: [
      ...ZO.bar('zero33'),
      ...frameTrack([[0, 0], [5, 1], [30, 1]], ([u]) => zoGraph('zero', u), 12),
      svgItem(enzymesBusy(true)),
      ...card(1030, 190, 510, 670, TIME, 'ZERO-ORDER', 'The same AMOUNT goes each hour:\n−20, −20, −20… however much\nis there.\n\nWhy: the enzymes are ALL busy\n(saturated), working flat out.\n\ne.g. alcohol (~1 unit an hour),\nphenytoin, high-dose aspirin\n\n→ a small extra dose can cause a\nBIG rise in level → toxicity', 20),
    ] },
  ];

  // ================================================================ slide 34: steady state, loading vs maintenance doses
  const GS = { x0: 170, x1: 940, y0: 270, y1: 740 };
  const pS = plot(GS);
  const NS = 7, YMAX = 2.6, SWIN = [0.85, 2.3];
  const sx = (t) => pS.x(t / NS), sy = (v) => pS.y(v / YMAX);
  // each dose adds 1 unit; one dose every half-life (so the level halves between doses)
  const levelAt = (t, loading) => { let c = 0; for (let n = 0; n <= Math.floor(t + 1e-9) && n < NS; n++) c += (n === 0 && loading ? 2 : 1) * 0.5 ** (t - n); return c; };
  const ssGraph = (u, loading) => {
    const tN = NS * u, pts = [];
    for (let n = 0; n < NS; n++) {
      if (n > tN) break;
      pts.push([sx(n), sy(n ? levelAt(n - 1e-6, loading) : 0)]);
      for (let t = n; t <= Math.min(n + 1, tN) + 1e-6; t += 0.05) pts.push([sx(t), sy(levelAt(Math.min(t, n + 0.9999), loading))]);
    }
    const doses = Array.from({ length: NS }, (_, n) => (n <= tN ? `${curve(`M ${f1(sx(n))} ${GS.y1 + 50} L ${f1(sx(n))} ${GS.y1 + 14}`, n === 0 && loading ? TIME : DARK, 4)}` : '')).join('');
    return `${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}
      <rect x="${GS.x0}" y="${f1(sy(SWIN[1]))}" width="${GS.x1 - GS.x0}" height="${f1(sy(SWIN[0]) - sy(SWIN[1]))}" fill="${DIS}" opacity="0.12"/>
      ${axes(GS, '', 'Drug level →', false)}${T(GS.x1 - 8, sy(SWIN[1]) + 24, 17, '#1d6b3a', 700, 'end')('therapeutic window')}
      ${T(GS.x0 + 10, GS.y1 + 70, 16, GREY, 700, 'start')(loading ? 'doses (the first one is bigger) ↑' : 'a dose every half-life ↑')}
      ${doses}${polyline(pts, loading ? TIME : EXC, 5)}`;
  };
  const SS = tabsOf([{ id: 'main32', text: 'Maintenance doses', c: EXC }, { id: 'load32', text: 'Loading + maintenance', c: TIME }], 230, 560);
  const ssItems = [
    title('Steady state: loading vs maintenance doses'),
    ...SS.bar(null),
    svgItem(ssGraph(0, false)),
    ...card(1030, 190, 510, 670, EXC, 'STEADY STATE', 'When the amount going in (each\ndose) = the amount being removed.\nThe level goes up and down around\na steady average.\n\nTakes ~4–5 half-lives to reach.\n\nMAINTENANCE DOSE: the regular\ndose that keeps you there.\n\nLOADING DOSE: a bigger first dose\nto get there straight away.', 20),
    ...SS.hot,
  ];
  const ssActions = [
    { id: 'main32', label: 'Maintenance doses', group: 'ss', stay: true, drawn: false, items: [
      ...SS.bar('main32'),
      ...frameTrack([[0, 0], [6, 1], [30, 1]], ([u]) => ssGraph(u, false), 12),
      { ...svgItem(`<line x1="${f1(sx(4))}" y1="${f1(sy(2.45))}" x2="${f1(sx(NS))}" y2="${f1(sy(2.45))}" stroke="${EXC}" stroke-width="4"/>${T((sx(4) + sx(NS)) / 2, sy(2.45) - 12, 18, EXC)('steady state')}
        ${dash(sx(0), sy(0.2), sx(4), sy(0.2), EXC)}${T((sx(0) + sx(4)) / 2, sy(0.2) - 10, 17, EXC)('~4–5 half-lives to build up')}`), at: 6.0, duration: 0.3 },
      ...card(1030, 190, 510, 670, EXC, 'MAINTENANCE DOSES', 'The same dose at regular times.\n\nEach dose adds a bit more than is\nremoved… until in = out.\n\nThe level climbs for ~4–5 half-\nlives, then levels off: steady state.\n\nFine for most drugs, but slow if\nthe half-life is long.', 20),
    ] },
    { id: 'load32', label: 'Loading + maintenance', group: 'ss', stay: true, drawn: false, items: [
      ...SS.bar('load32'),
      ...frameTrack([[0, 0], [6, 1], [30, 1]], ([u]) => ssGraph(u, true), 12),
      { ...svgItem(`${T(sx(0) + 16, sy(0.5), 18, TIME, 700, 'start')('loading dose → in the window straight away')}`), at: 1.0, duration: 0.3 },
      ...card(1030, 190, 510, 670, TIME, 'LOADING + MAINTENANCE', 'One BIG first dose (loading)\nfills the body up to the steady-\nstate level straight away.\n\nThen the regular maintenance\ndoses keep it there.\n\nUsed when you can\'t wait days:\ne.g. amiodarone, digoxin,\nsome antibiotics.', 20),
    ] },
  ];

  // ================================================================ the slides (added after part 2)
  scene.steps.push(
    // Slide 19: part 3 intro.
    { script: Qs('What is part 3 about?', 'What does ADME stand for?'),
      notes: `• Part 3 = pharmacokinetics: what the BODY does to the DRUG
• Structure: ADME = absorption, distribution, metabolism, excretion
• Then drug levels over time: the concentration curve, half-life and clearance, first- vs zero-order, steady state and dosing
• Why it matters: PK decides how fast a drug works, how strong it gets and how long it lasts → how we dose it`,
      say: 'Part 3: pharmacokinetics, what the body does to the drug.', clear: true, items: introItems },
    // Slide 20: routes of administration.
    { script: `${Qs('What are the routes of administration?', 'Enteral vs parenteral?', 'Which routes are fast and which are slow?')}
[tabs: Enteral → Parenteral → Compare the speed]`,
      notes: `• Route = how the drug gets into the body; it decides how FAST and how MUCH gets in
• Enteral = through the gut (enteron = intestine): oral, sublingual, rectal
• Oral: easy, cheap, painless, but slow, affected by food and acid, and loses some to first-pass
• Sublingual: under the tongue, straight into the blood (fast, skips the liver)
• Rectal: useful if vomiting or unconscious
• Parenteral = any other way: IV, IM, subcutaneous, inhaled, transdermal
• IV: fastest, 100% reaches the blood; IM: minutes (vaccines); subcutaneous: slower and steady (insulin)
• Inhaled: very fast (asthma inhalers); transdermal patch: slow and steady (nicotine patch)
• Compare the speed: same dose, the route changes how fast the level rises, how high it gets and how long it lasts (IV instant; oral slow and lower; patch low and steady)`,
      say: 'Drugs can be given through the gut (enteral) or any other way (parenteral), and the route decides how fast and how much gets in.', clear: true, actions: routeActions, items: routeItems },
    // Slide 21: getting absorbed.
    { script: `${Qs('How do drugs cross into the body?', 'What affects how well a drug is absorbed?')}
[click the left side to watch them cross]`,
      notes: `• Absorption = the drug getting from where it was given into the blood
• Most drugs simply slip through cell membranes (passive diffusion)
• Small, fat-soluble drugs cross easily; large or charged drugs struggle
• Factors: fat solubility, size, charge (stomach acid can change it)
• Food can slow or block absorption (some drugs: take on an empty stomach)
• Blood flow and surface area: the small intestine is huge → most oral absorption happens there`,
      say: 'Most drugs slip through membranes; small, fat-soluble drugs get absorbed most easily.', clear: true, actions: absActions, items: absItems },
    // Slide 22: bioavailability and first-pass.
    { script: `${Qs('What is bioavailability?', 'What is first-pass metabolism?', 'Why is oral bioavailability often low?')}
[tabs: IV → Oral → Sublingual]`,
      notes: `• Bioavailability (F) = the fraction of a dose that reaches the bloodstream unchanged
• IV = 100% by definition (straight into the blood)
• Oral: drug goes gut → liver (via the portal vein) BEFORE the rest of the body
• First-pass metabolism: the liver breaks some of it down first → lower F (e.g. morphine orally ~30%)
• That's why oral doses are often bigger than IV doses
• Sublingual skips the liver → much higher F (e.g. nitroglycerin for chest pain)`,
      say: 'Bioavailability is how much of a dose reaches the blood; first-pass metabolism in the liver lowers it for swallowed drugs.', clear: true, actions: bioActions, items: bioItems },
    // Slide 23: distribution.
    { script: `${Qs('What is distribution?', 'What is the volume of distribution?', 'Small vs large Vd: what does it mean?')}
[tabs: Stays in the blood → Spreads into tissues]`,
      notes: `• Distribution = the drug travelling from the blood into the body's tissues
• Organs with lots of blood flow (brain, heart, liver, kidneys) get the drug first
• Volume of distribution (Vd) = how much a drug spreads OUT of the blood into the tissues
• Small Vd: stays in the blood (big or protein-bound drugs, e.g. warfarin) → high blood level
• Large Vd: spreads into tissues (small, fat-soluble drugs) → low blood level for the same dose
• Some drugs are stored in fat and linger (e.g. THC)`,
      say: 'Volume of distribution describes whether a drug stays in the blood or spreads into the tissues.', clear: true, actions: distActions, items: distItems },
    // Slide 24: plasma protein binding.
    { script: `${Qs('What is plasma protein binding?', 'Why does only free drug work?', 'What happens when a drug is displaced?')}
[tabs: Normal → A second drug is added]`,
      notes: `• Many drugs travel in the blood stuck to proteins, mostly albumin
• Bound drug can't reach its target or be removed: it's a store
• Only FREE drug works (and gets metabolised and excreted)
• Displacement: two drugs compete for the same albumin spots → one pushes the other off → more free drug → bigger effect, maybe toxic
• e.g. warfarin is ~99% bound: a little displacement → big jump in free drug → bleeding risk
• Low albumin (liver disease, malnutrition) also means more free drug`,
      say: 'Many drugs are carried bound to albumin, and only the free drug works.', clear: true, actions: pbActions, items: pbItems },
    // Slide 25: barriers.
    { script: `${Qs('What is the blood-brain barrier?', 'Which drugs get into the brain?', 'Do drugs cross the placenta?')}
[click the panels to send the drugs in]`,
      notes: `• Most capillaries are leaky: drugs pass through the gaps between cells
• Brain capillaries are sealed (tight junctions) and pump many drugs back out = blood-brain barrier
• Mostly small, fat-soluble drugs get into the brain
• Get in: alcohol, diazepam, morphine; kept out: loperamide (an opioid for diarrhoea, no high), many antibiotics
• The placenta is not much of a barrier: most drugs reach the baby → extra care with medicines in pregnancy`,
      say: 'The blood-brain barrier lets mostly small, fat-soluble drugs into the brain; the placenta lets most drugs through.', clear: true, actions: barActions, items: barItems },
    // Slide 26: metabolism, phase I and II.
    { script: `${Qs('Why are drugs metabolised?', 'What happens in Phase I?', 'What happens in Phase II?')}
[click to build it step by step]`,
      notes: `• Metabolism = the body chemically changing a drug, mostly in the LIVER
• Why: fat-soluble drugs are hard to excrete (the kidneys reabsorb them) → make them water-soluble
• Phase I (modify): enzymes, mostly CYP450, make a small change (e.g. add an -OH group)
• Phase II (attach / conjugation): a big water-loving group is attached (e.g. glucuronic acid)
• Result: water-soluble → excreted in the urine (or bile); usually inactive
• Not every drug goes through both phases, or in that order`,
      say: 'Metabolism, mostly in the liver, makes drugs water-soluble in two phases so they can be excreted.', clear: true, actions: metActions, items: metItems },
    // Slide 27: cytochrome P450.
    { script: `${Qs('What are CYP450 enzymes?', 'Which ones matter most?', 'How do genes change drug levels?')}
[chips: Normal → Poor metaboliser → Ultra-rapid]`,
      notes: `• Cytochrome P450 (CYP) = a family of enzymes, mostly in the liver, that do most Phase I metabolism
• Named like CYP3A4 (family 3, subfamily A, enzyme 4)
• CYP3A4 handles roughly half of all drugs; CYP2D6 ~25%; CYP2C9 / 2C19 ~15%
• Genetics: people have different versions of these enzymes
• Poor metaboliser: drug builds up → side effects / toxicity
• Ultra-rapid metaboliser: drug cleared too fast → doesn't work
• For a prodrug it flips: e.g. ultra-rapid CYP2D6 + codeine → too much morphine (dangerous)`,
      say: 'CYP450 enzymes in the liver break down most drugs, and genetic differences change how fast.', clear: true, actions: cypActions, items: cypItems },
    // Slide 28: prodrugs and active metabolites.
    { script: `${Qs('What is a prodrug?', 'What is an active metabolite?', 'Does metabolism always switch a drug off?')}
[tabs: Usual → Prodrug → Active metabolite]`,
      notes: `• Usually metabolism switches a drug OFF (active drug → inactive metabolite) → the effect ends
• Prodrug: given in an inactive (or barely active) form; the body switches it ON
• e.g. codeine → morphine (by CYP2D6), enalapril → enalaprilat, clopidogrel
• Active metabolite: the broken-down form still works → the effect lasts longer
• e.g. diazepam → desmethyldiazepam (very long-acting)`,
      say: 'Metabolism usually switches drugs off, but prodrugs are switched on and some metabolites stay active.', clear: true, actions: prActions, items: prItems },
    // Slide 29: enzyme induction and inhibition.
    { script: `${Qs('What is enzyme induction?', 'What is enzyme inhibition?', 'How do they cause drug interactions?')}
[tabs: Normal → Inducer → Inhibitor]`,
      notes: `• Some drugs and foods change how many CYP enzymes there are, or how well they work → this changes the levels of OTHER drugs
• Inducer = more enzyme → the other drug is broken down faster → level too low → may stop working
• Inducers: rifampicin, carbamazepine, St John's wort, smoking → e.g. the contraceptive pill can fail
• Inhibitor = enzymes blocked → broken down slower → level too high → toxicity
• Inhibitors: grapefruit juice, clarithromycin, fluconazole → e.g. statin levels rise → muscle damage
• Induction takes days to weeks (new enzyme is made); inhibition can happen within hours`,
      say: 'Enzyme inducers lower other drugs’ levels and inhibitors raise them, causing drug interactions.', clear: true, actions: indActions, items: indItems },
    // Slide 30: excretion.
    { script: `${Qs('How do the kidneys remove drugs?', 'What are filtration, secretion and reabsorption?', 'What are the other routes of excretion?')}
[click the nephron to watch it work]`,
      notes: `• Excretion = the drug leaving the body; the kidneys are the main route
• 1 Filtration: free drug is filtered out of the blood at the glomerulus (protein-bound drug is too big)
• 2 Secretion: pumps actively push some drugs into the urine (e.g. penicillin)
• 3 Reabsorption: fat-soluble drug slips back into the blood; water-soluble drug stays → urine
• (That's why metabolism making drugs water-soluble matters)
• Other routes: bile → faeces; lungs (anaesthetic gases, alcohol breath test); breast milk; sweat and saliva
• Kidney disease → drugs build up → lower doses`,
      say: 'The kidneys remove drugs by filtration and secretion, while fat-soluble drugs get reabsorbed.', clear: true, actions: excActions, items: excItems },
    // Slide 31: drug levels over time.
    { script: `${Qs('What does a concentration-time curve show?', 'What are Cmax and Tmax?', 'What is the therapeutic window?')}
[click the graph to give a dose]`,
      notes: `• After a dose, the level in the blood RISES (absorption) then FALLS (metabolism and excretion)
• Cmax = the peak level; Tmax = the time it takes to reach the peak
• Therapeutic window = between too low (no effect) and too high (toxic); the goal is to stay in it
• Onset = when the level first enters the window (starts working)
• Duration of action = how long the level stays above the "works" line
• Links back to the therapeutic index from part 2`,
      say: 'After a dose the level rises then falls, and it needs to stay in the therapeutic window to work safely.', clear: true, actions: ctActions, items: ctItems },
    // Slide 32: half-life and clearance.
    { script: `${Qs('What is half-life?', 'How long until a drug is gone?', 'What is clearance and what slows it?')}
[click the graph to watch it halve]`,
      notes: `• Half-life (t½) = the time for the drug level to fall by HALF
• 100% → 50% → 25% → 12.5% → 6%: after ~4–5 half-lives the drug is basically gone (~95%)
• e.g. paracetamol ~2 hours, diazepam ~2 days
• Clearance = how fast the body removes the drug (mostly liver and kidneys)
• Lower clearance → longer half-life → the drug builds up
• What lowers clearance: kidney or liver disease, older age, newborns, genetics, enzyme inhibitors → lower or less frequent doses`,
      say: 'Half-life is the time for the level to halve; lower clearance means a longer half-life.', clear: true, actions: hlActions, items: hlItems },
    // Slide 33: first-order vs zero-order elimination.
    { script: `${Qs('What is first-order elimination?', 'What is zero-order elimination?', 'Why is zero-order dangerous?')}
[tabs: First-order → Zero-order]`,
      notes: `• Two ways the body can remove a drug
• First-order (most drugs): a constant FRACTION is removed each hour (e.g. half: −50, −25, −12.5…)
• More drug → more removed; the enzymes have spare capacity → a fixed half-life; the graph is a curve
• Zero-order: a constant AMOUNT is removed each hour (−20, −20, −20…), however much is there
• Why: the enzymes are saturated (all busy, working flat out) → no fixed half-life; the graph is a straight line
• e.g. alcohol (~1 unit per hour), phenytoin, high-dose aspirin (can switch from first- to zero-order at high doses)
• Danger: a small dose increase can cause a big jump in level → toxicity; levels come down slowly`,
      say: 'Most drugs are removed at a constant fraction per hour (first-order), but some at a constant amount (zero-order).', clear: true, actions: zoActions, items: zoItems },
    // Slide 34: steady state, loading vs maintenance doses.
    { script: `${Qs('What is steady state?', 'How long does it take to reach?', 'Loading vs maintenance doses?')}
[tabs: Maintenance doses → Loading + maintenance]`,
      notes: `• With repeated doses, each dose adds a bit more than is removed, so the level builds up
• Steady state = amount going in (each dose) = amount being removed; the level goes up and down around a steady average
• Takes ~4–5 half-lives to reach steady state (same rule as for the drug being removed)
• Maintenance dose = the regular dose that keeps you at steady state
• Loading dose = a bigger first dose that gets you to steady state straight away
• Used when you can't wait days: e.g. amiodarone, digoxin, some antibiotics`,
      say: 'Regular doses build up to steady state over about four to five half-lives; a loading dose gets there straight away.', clear: true, actions: ssActions, items: ssItems },
  );
})();
