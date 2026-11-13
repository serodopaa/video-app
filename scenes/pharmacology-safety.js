// Pharmacology essentials, part 4: drug safety and interactions. Built with the user.
// Adds its slides to the end of the 'pharmacology-essentials' topic (one video). Load it AFTER
// pharmacology-pk.js (it reuses WB_LIGAND_ART, WB_PHARM_ART and WB_PHARM_PD).
// The user does the drawing; these visuals simply appear (drawn: false). Board is 1600 x 900.
(() => {
  const A = window.WB_LIGAND_ART, P = window.WB_PHARM_ART, D = window.WB_PHARM_PD;
  const scene = (window.WB_SCENES || []).find((s) => s.id === 'pharmacology-essentials');
  if (!A || !P || !D || !scene) return;
  const { frameTrack, T, svgItem, txt, title, f1 } = A;
  const { box, rr, capsule, curve, dot, badge, person } = P;
  const { INK, GREY, DARK, PK, PD, ENDO, EXO, DRUG } = P.COL;
  const { card, tabsOf, plot, axes, dash } = D;
  const RED = '#c0392b', ADR = '#d0630b', TOX = '#8e1d14', DDI = '#7b3fd0', TOL = '#2f6fde', OK = '#1f8a4c';
  const Qs = (...q) => '[QUESTIONS THIS SLIDE ANSWERS]\n' + q.map((x) => `[• ${x}]`).join('\n');

  const polyline = (pts, c, w = 6, op = 1, dashArr = '') => (pts.length > 1 ? `<polyline points="${pts.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}" ${dashArr ? `stroke-dasharray="${dashArr}"` : ''}/>` : '');
  const bateman = (t, k, ka = 1.5) => (t <= 0 ? 0 : (ka / (ka - k)) * (Math.exp(-k * t) - Math.exp(-ka * t)));
  const warn = (cx, cy, s = 1, c = ADR) => `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})"><polygon points="0,-46 52,40 -52,40" fill="${c}" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
      <rect x="-5" y="-18" width="10" height="34" rx="4" fill="#ffffff"/><circle cx="0" cy="27" r="6" fill="#ffffff"/></g>`;

  // ================================================================ slide 41: part 4 intro
  const INTRO = [
    ['Adverse drug\nreactions', ADR, 'Unwanted effects:\npredictable vs\nunpredictable', (cx, cy) => warn(cx, cy, 0.85)],
    ['Drug toxicity', TOX, 'When the level\ngets too high,\nand why', (cx, cy) => {
      const pts = []; for (let t = 0; t <= 8; t += 0.2) pts.push([cx - 60 + t * 15, cy + 34 - bateman(t, 0.12) * 80]);
      return `<line x1="${cx - 60}" y1="${cy + 36}" x2="${cx + 64}" y2="${cy + 36}" stroke="${DARK}" stroke-width="2.5"/><line x1="${cx - 60}" y1="${cy + 36}" x2="${cx - 60}" y2="${cy - 40}" stroke="${DARK}" stroke-width="2.5"/>`
        + `<line x1="${cx - 60}" y1="${cy - 12}" x2="${cx + 64}" y2="${cy - 12}" stroke="${RED}" stroke-width="2.5" stroke-dasharray="6 5"/>` + polyline(pts, TOX, 4);
    }],
    ['Special\npopulations', '#c2566b', 'Children, older\nadults, pregnancy,\nkidney / liver', (cx, cy) => person(cx - 40, cy + 8, 0.22, '#fdeede', '#d0630b') + person(cx + 30, cy, 0.28, '#efe6fa', '#7b3fd0')],
    ['Drug–drug\ninteractions', DDI, 'Effects that add\nup or cancel; levels\nthat rise or fall', (cx, cy) => capsule(cx - 52, cy, 0.5, -30) + capsule(cx + 52, cy, 0.5, 30)
      + `<path d="M ${cx - 6} ${cy - 28} L ${cx + 8} ${cy - 4} L ${cx - 4} ${cy - 2} L ${cx + 8} ${cy + 26}" fill="none" stroke="${DDI}" stroke-width="5" stroke-linejoin="round"/>`],
    ['Tolerance and\ndependence', TOL, 'Needing more,\nneeding it, and\nwithdrawal', (cx, cy) => [1, 0.75, 0.52, 0.38].map((v, i) => `<rect x="${cx - 62 + i * 32}" y="${f1(cy + 36 - 72 * v)}" width="24" height="${f1(72 * v)}" rx="5" fill="${TOL}" opacity="${1 - i * 0.15}"/>`).join('')],
  ];
  const introItems = [
    svgItem(`<rect x="0" y="0" width="1600" height="900" fill="#fdf3f1"/><circle cx="1440" cy="150" r="210" fill="#f8dfda"/>
      ${warn(1340, 210, 1.5, RED)}${capsule(1190, 300, 0.7, -30)}${capsule(1480, 320, 0.55, 25)}`),
    box(110, 112, 190, 58, RED, RED), txt('PART 4', 205, 141, 28, '#ffffff', { align: 'center', bold: true }),
    txt('DRUG SAFETY', 110, 235, 86, RED, { bold: true }),
    txt('and interactions: when drugs cause harm', 110, 318, 30, GREY, { bold: true }),
    ...INTRO.flatMap(([t, c, list, art], i) => {
      const x = 60 + i * 298, y = 400, w = 284;
      return [
        box(x, y, w, 440, c),
        svgItem(`${badge(x + 38, y + 38, String(i + 1), c)}${art(x + w / 2, y + 130)}`),
        txt(t, x + w / 2, y + 250, 25, c, { align: 'center', bold: true }),
        txt(list, x + w / 2, y + 340, 19, INK, { align: 'center', bold: true }),
      ];
    }),
  ];

  // ================================================================ slide 42: adverse drug reactions
  const GA = { x0: 170, x1: 940, y0: 300, y1: 740 };
  const pA = plot(GA);
  const sig = (u, mid, steep = 10) => 1 / (1 + Math.exp(-(u - mid) * steep));
  const adrGraph = (kind, u = 1) => {
    const pts = [];
    for (let x = 0; x <= u + 1e-6; x += 0.01) pts.push([pA.x(x), pA.y(kind === 'A' ? sig(x, 0.62) * 0.95 : 0.14)]);
    const normal = pA.x(0.35), high = pA.x(0.8);
    return `${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}
      ${axes(GA, 'Dose →', 'Chance of the reaction →', false)}
      ${dash(normal, GA.y0, normal, GA.y1, '#9aa1ad')}${T(normal, GA.y0 - 14, 17, GREY)('normal dose')}
      ${dash(high, GA.y0, high, GA.y1, '#9aa1ad')}${T(high, GA.y0 - 14, 17, GREY)('high dose')}
      ${kind ? polyline(pts, kind === 'A' ? ADR : DDI, 6) : ''}`;
  };
  const AD = tabsOf([{ id: 'a34', text: 'Type A: dose-related', c: ADR }, { id: 'b34', text: 'Type B: unpredictable', c: DDI }], 230, 560);
  const adrItems = [
    title('Adverse drug reactions'),
    ...AD.bar(null),
    svgItem(adrGraph(null)),
    txt('Pick a type above ↑', 555, 520, 22, '#9aa1ad', { align: 'center', bold: true, hideDuring: ['a34', 'b34'] }),
    ...card(1030, 190, 510, 670, RED, 'ADVERSE DRUG REACTION', 'An unwanted, harmful effect of a\ndrug at a NORMAL dose.\n\nThey\'re common: one of the main\nreasons people end up in hospital.\n\nTwo main types:\n\nA: Augmented (dose-related)\nB: Bizarre (unpredictable)', 21),
    ...AD.hot,
  ];
  const adrActions = [
    { id: 'a34', label: 'Type A', group: 'adr', stay: true, drawn: false, items: [
      ...AD.bar('a34'),
      ...frameTrack([[0, 0], [2.2, 1], [30, 1]], ([u]) => adrGraph('A', u), 12),
      txt('More drug → more likely\n(and worse)', pA.x(0.58), pA.y(0.62), 20, ADR, { align: 'right', bold: true, at: 2.2, anim: 'fade', duration: 0.3 }),
      ...card(1030, 190, 510, 670, ADR, 'TYPE A: AUGMENTED', 'Too much of the drug\'s NORMAL\neffect, or its side effects.\n\n✓ Predictable from how it works\n✓ Common (most ADRs)\n✓ Worse at higher doses\n\ne.g. bleeding with warfarin,\nlow blood sugar with insulin,\ndrowsiness with antihistamines\n\nFix: lower the dose', 21),
    ] },
    { id: 'b34', label: 'Type B', group: 'adr', stay: true, drawn: false, items: [
      ...AD.bar('b34'),
      ...frameTrack([[0, 0], [2.2, 1], [30, 1]], ([u]) => adrGraph('B', u), 12),
      txt('Rare, but can happen at ANY dose,\neven a tiny one', 555, pA.y(0.42), 20, DDI, { align: 'center', bold: true, at: 2.2, anim: 'fade', duration: 0.3 }),
      ...card(1030, 190, 510, 670, DDI, 'TYPE B: BIZARRE', 'NOT related to how the drug\nnormally works.\n\n✗ Unpredictable\n✗ Rare, but can be serious\n✗ Not dose-related\n\nOften the immune system\n(an ALLERGY), or genes.\ne.g. penicillin allergy →\nanaphylaxis\n\nFix: stop the drug, avoid it for life', 21),
    ] },
  ];

  // ================================================================ slide 43: drug toxicity
  const GT = { x0: 170, x1: 940, y0: 280, y1: 740 };
  const pT = plot(GT);
  const TMAX = 12, YMAX = 1.4, WIN = [0.3, 0.75];
  const tx = (t) => pT.x(t / TMAX), ty = (v) => pT.y(Math.min(v, YMAX) / YMAX);
  const curveOf = (f, u = 1) => { const pts = []; for (let t = 0; t <= TMAX * u + 1e-6; t += 0.06) pts.push([tx(t), ty(f(t))]); return pts; };
  const NORMAL = (t) => bateman(t, 0.35);
  const REPEAT = (k, d = 0.5) => (t) => [0, 3, 6, 9].reduce((s, t0) => s + d * bateman(t - t0, k), 0);
  const toxGraph = (f, c, ref, u = 1) => `${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}
    <rect x="${GT.x0}" y="${f1(ty(YMAX))}" width="${GT.x1 - GT.x0}" height="${f1(ty(WIN[1]) - ty(YMAX))}" fill="${RED}" opacity="0.12"/>
    <rect x="${GT.x0}" y="${f1(ty(WIN[1]))}" width="${GT.x1 - GT.x0}" height="${f1(ty(WIN[0]) - ty(WIN[1]))}" fill="${OK}" opacity="0.12"/>
    ${axes(GT, 'Time →', 'Drug level in the blood →', false)}
    ${T(GT.x1 - 8, ty(YMAX) + 26, 18, RED, 700, 'end')('TOXIC')}${T(GT.x1 - 8, ty(WIN[1]) + 26, 17, '#1d6b3a', 700, 'end')('therapeutic window')}
    ${ref ? polyline(curveOf(ref), '#a9d6b8', 4) : ''}${f ? polyline(curveOf(f, u), c, 6) : ''}`;
  const TX = tabsOf([{ id: 'od35', text: 'Too much taken', c: TOX }, { id: 'cl35', text: 'Can\'t clear it', c: ADR }, { id: 'ix35', text: 'Another drug', c: DDI }], 170, 400);
  const toxItems = [
    title('Drug toxicity'),
    ...TX.bar(null),
    svgItem(toxGraph(NORMAL, OK, null)),
    txt('A normal dose stays in the window', 555, 800, 20, OK, { align: 'center', bold: true, hideDuring: ['od35', 'cl35', 'ix35'] }),
    ...card(1030, 190, 510, 670, TOX, 'DRUG TOXICITY', 'Harm caused by TOO MUCH drug in\nthe body: the level climbs above\nthe therapeutic window.\n\n"The dose makes the poison"\n(remember: pharmakon = drug\nAND poison)\n\nThree common ways in →\n\nMost at risk: narrow therapeutic\nindex drugs (warfarin, lithium,\ndigoxin) → blood levels checked', 20),
    ...TX.hot,
  ];
  const toxActions = [
    { id: 'od35', label: 'Overdose', group: 'tox', stay: true, drawn: false, items: [
      ...TX.bar('od35'),
      ...frameTrack([[0, 0], [2.5, 1], [30, 1]], ([u]) => toxGraph((t) => 2 * NORMAL(t), TOX, NORMAL, u), 12),
      txt('Twice the dose → into the toxic zone', 555, 800, 20, TOX, { align: 'center', bold: true, at: 2.5, anim: 'fade', duration: 0.3 }),
      ...card(1030, 190, 510, 670, TOX, 'TOO MUCH TAKEN (OVERDOSE)', 'Accidental or deliberate.\n\ne.g. paracetamol overdose →\nliver damage\ne.g. opioid overdose → breathing\nslows or stops\n\nSome have ANTIDOTES:\nacetylcysteine for paracetamol,\nnaloxone for opioids', 20),
    ] },
    { id: 'cl35', label: 'Can\'t clear it', group: 'tox', stay: true, drawn: false, items: [
      ...TX.bar('cl35'),
      ...frameTrack([[0, 0], [3.5, 1], [30, 1]], ([u]) => toxGraph(REPEAT(0.1), ADR, REPEAT(0.45), u), 12),
      txt('Same regular doses, slower removal → builds up', 555, 800, 20, ADR, { align: 'center', bold: true, at: 3.5, anim: 'fade', duration: 0.3 }),
      ...card(1030, 190, 510, 670, ADR, 'CAN\'T CLEAR IT', 'Normal doses, but the body removes\nthe drug too SLOWLY, so each dose\nadds to the last (low clearance).\n\ne.g. kidney disease → lithium or\ndigoxin builds up\ne.g. liver disease, older age,\npoor metabolisers (genes)\n\n→ lower or less frequent doses', 20),
    ] },
    { id: 'ix35', label: 'Another drug', group: 'tox', stay: true, drawn: false, items: [
      ...TX.bar('ix35'),
      ...frameTrack([[0, 0], [2.5, 1], [30, 1]], ([u]) => toxGraph((t) => bateman(t, 0.07) * 1.05, DDI, NORMAL, u), 12),
      txt('An enzyme inhibitor slows its breakdown → level rises', 555, 800, 20, DDI, { align: 'center', bold: true, at: 2.5, anim: 'fade', duration: 0.3 }),
      ...card(1030, 190, 510, 670, DDI, 'ANOTHER DRUG', 'A second drug blocks the enzymes\nthat break the first one down, or\npushes it off its blood proteins.\n\ne.g. clarithromycin + a statin →\nmuscle damage\ne.g. grapefruit juice + some\nstatins or blood-pressure drugs\n\n(More on the next slide)', 20),
    ] },
  ];

  // ================================================================ slide 45: drug–drug interactions
  const half = (x, c, head, sub) => [
    { type: 'rect', x, y: 112, w: 720, h: 70, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
    txt(head, x + 360, 136, 24, '#ffffff', { align: 'center', bold: true }), txt(sub, x + 360, 163, 17, '#ffffff', { align: 'center', bold: true }),
  ];
  const icard = (x, y, c, head, body, art) => [
    box(x, y, 720, 320, c),
    svgItem(`${rr(x + 18, y + 18, 230, 284, '#e4e7ee', '#f7f8fb', 2, 14)}${art(x + 133, y + 160)}`),
    txt(head, x + 272, y + 44, 24, c, { bold: true }),
    txt(body, x + 272, y + 100, 18, INK, { bold: true }),
  ];
  // u = 0..1 builds it up: drug A's bar, then drug B's, then both together crossing the danger line
  const artAdd = (cx, cy, u = 1) => {
    const k = (i) => Math.max(0, Math.min(1, u * 3 - i));
    const a = 90 * k(0), b = 60 * k(1), ab = k(2);
    return `<line x1="${cx - 90}" y1="${cy - 30}" x2="${cx + 90}" y2="${cy - 30}" stroke="${RED}" stroke-width="3" stroke-dasharray="7 5"/>${T(cx - 90, cy - 40, 14, RED, 700, 'start')('danger')}
    <rect x="${cx - 80}" y="${f1(cy + 100 - a)}" width="50" height="${f1(a)}" rx="6" fill="${PK}"/>${T(cx - 55, cy + 128, 14, GREY)('A')}
    <rect x="${cx - 15}" y="${f1(cy + 100 - b)}" width="50" height="${f1(b)}" rx="6" fill="${DDI}"/>${T(cx + 10, cy + 128, 14, GREY)('B')}
    <rect x="${cx + 50}" y="${f1(cy + 100 - 60 * ab)}" width="50" height="${f1(60 * ab)}" rx="6" fill="${DDI}"/><rect x="${cx + 50}" y="${f1(cy + 100 - 60 * ab - 90 * ab)}" width="50" height="${f1(90 * ab)}" rx="6" fill="${PK}"/>${T(cx + 75, cy + 128, 14, GREY)('A + B')}
    ${ab >= 1 ? `<circle cx="${cx + 75}" cy="${cy - 30}" r="18" fill="none" stroke="${RED}" stroke-width="4"/>${T(cx + 75, cy - 66, 15, RED)('⚠')}` : ''}
    <line x1="${cx - 100}" y1="${cy + 100}" x2="${cx + 110}" y2="${cy + 100}" stroke="${DARK}" stroke-width="3"/>`;
  };
  const artOpp = (cx, cy) => `${curve(`M ${cx - 70} ${cy + 60} L ${cx - 70} ${cy - 60}`, PK, 8)}${T(cx - 70, cy + 90, 16, PK)('drug A')}
    ${curve(`M ${cx + 70} ${cy - 60} L ${cx + 70} ${cy + 60}`, DDI, 8)}${T(cx + 70, cy - 76, 16, DDI)('drug B')}
    ${T(cx, cy + 8, 30, GREY)('=')}${T(cx, cy + 128, 17, DARK)('little or no effect')}`;
  const artMet = (cx, cy) => {
    const g = (k) => { const pts = []; for (let t = 0; t <= 10; t += 0.25) pts.push([cx - 90 + t * 18, cy + 80 - bateman(t, k) * 150]); return pts; };
    return `<line x1="${cx - 90}" y1="${cy + 82}" x2="${cx + 96}" y2="${cy + 82}" stroke="${DARK}" stroke-width="3"/><line x1="${cx - 90}" y1="${cy + 82}" x2="${cx - 90}" y2="${cy - 90}" stroke="${DARK}" stroke-width="3"/>
      <rect x="${cx - 88}" y="${f1(cy + 80 - 0.75 * 150)}" width="184" height="${f1((0.75 - 0.3) * 150)}" fill="${OK}" opacity="0.13"/>
      ${polyline(g(0.35), OK, 4)}${polyline(g(0.07), RED, 4)}${polyline(g(1.0), '#8a8f98', 4)}
      ${T(cx + 92, cy - 50, 14, RED, 700, 'end')('inhibitor ↑')}${T(cx + 92, cy + 66, 14, '#6b7280', 700, 'end')('inducer ↓')}`;
  };
  const artOther = (cx, cy) => `${capsule(cx - 50, cy - 70, 0.42, -30)}<line x1="${cx - 76}" y1="${cy - 92}" x2="${cx - 24}" y2="${cy - 48}" stroke="${RED}" stroke-width="5"/><line x1="${cx - 76}" y1="${cy - 48}" x2="${cx - 24}" y2="${cy - 92}" stroke="${RED}" stroke-width="5"/>
    ${T(cx + 40, cy - 64, 15, DARK, 700, 'start')('absorb')}
    <ellipse cx="${cx - 50}" cy="${cy + 10}" rx="38" ry="28" fill="#fde9b8" stroke="#c89a3a" stroke-width="3"/><circle cx="${cx - 20}" cy="${cy - 10}" r="9" fill="${DDI}"/><circle cx="${cx + 10}" cy="${cy - 26}" r="9" fill="${EXO}"/>${T(cx + 40, cy + 16, 15, DARK, 700, 'start')('bind')}
    <path d="M ${cx - 50} ${cy + 64} C ${cx - 26} ${cy + 62} ${cx - 20} ${cy + 88} ${cx - 28} ${cy + 104} C ${cx - 36} ${cy + 120} ${cx - 74} ${cy + 116} ${cx - 76} ${cy + 92} C ${cx - 78} ${cy + 74} ${cx - 72} ${cy + 64} ${cx - 50} ${cy + 64} Z" fill="#a0525a" stroke="#5e262c" stroke-width="3"/>${T(cx + 40, cy + 96, 15, DARK, 700, 'start')('excrete')}`;
  const ddiItems = [
    title('Drug–drug interactions'),
    ...half(60, PD, 'PHARMACODYNAMIC', 'they change each other\'s EFFECT'),
    ...half(820, PK, 'PHARMACOKINETIC', 'one changes the other\'s LEVEL'),
    ...icard(60, 200, PD, 'Adding up', 'Two drugs with the same effect add\nup (sometimes to more than the sum).\n\ne.g. alcohol + opioids or\nbenzodiazepines → dangerous\ndrowsiness, slowed breathing', artAdd),
    ...icard(60, 540, PD, 'Cancelling out', 'One drug blocks the other\'s effect.\n\ne.g. a beta-blocker can stop an\nasthma inhaler (salbutamol) working\n\nUseful too: naloxone vs opioids', artOpp),
    ...icard(820, 200, PK, 'Metabolism (most common)', 'One drug speeds up or slows down\nthe other\'s breakdown (CYP450).\n\nInhibitor → level UP → toxic\n(grapefruit juice + statins)\nInducer → level DOWN → fails\n(rifampicin + the pill)', artMet),
    { type: 'hotspot', x: 78, y: 218, w: 230, h: 284, action: 'add38' },
    ...icard(820, 540, PK, 'Absorption, binding, excretion', 'Absorb: antacids block some\nantibiotics\nBind: pushed off blood proteins\n(warfarin)\nExcrete: NSAIDs slow lithium\nremoval → lithium builds up', artOther),
  ];

  const ddiActions = [{ id: 'add38', label: 'Adding up: build it', stay: true, drawn: false, items: [
    ...frameTrack([[0, 0], [3.2, 1], [30, 1]], ([u]) => `${rr(78, 218, 230, 284, '#e4e7ee', '#f7f8fb', 2, 14)}${artAdd(193, 360, u)}`, 12),
  ] }];

  // ================================================================ slide 46: tolerance and dependence
  const GD = { x0: 170, x1: 940, y0: 300, y1: 740 };
  const pD = plot(GD);
  const DAYS = [1, 0.8, 0.64, 0.52, 0.45, 0.4];
  const tolGraph = (u) => {
    const n = DAYS.length, bw = (GD.x1 - GD.x0) / n;
    return `${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}${axes(GD, 'Day (same dose every day) →', 'Effect of the dose →', false)}
      ${DAYS.map((v, i) => {
        const show = Math.max(0, Math.min(1, u * n - i));
        const h = (GD.y1 - GD.y0 - 20) * v * show, x = GD.x0 + i * bw + 22;
        return `<rect x="${f1(x)}" y="${f1(GD.y1 - h)}" width="${f1(bw - 44)}" height="${f1(h)}" rx="8" fill="${TOL}" opacity="${0.55 + 0.45 * v}"/>${T(x + (bw - 44) / 2, GD.y1 + 24, 16, GREY)(String(i + 1))}${show >= 1 ? T(x + (bw - 44) / 2, GD.y1 - h - 12, 17, TOL)(`${Math.round(v * 100)}%`) : ''}`;
      }).join('')}`;
  };
  // physical dependence: how you feel over time (0 = normal); the body adapts against the drug, and that adaptation lingers when it stops
  const STOP = 6, TEND = 11;
  const feel = (t) => {
    if (t < 1) return 0;
    const adapt = t < STOP ? 0.85 * (1 - Math.exp(-(t - 1) * 0.55)) : 0.85 * (1 - Math.exp(-(STOP - 1) * 0.55)) * Math.exp(-(t - STOP) * 0.55);
    const drug = t < STOP ? 1 : Math.exp(-(t - STOP) * 4);
    return drug - adapt;
  };
  const fx = (t) => pD.x(t / TEND), fy = (v) => pD.y((v + 1) / 2.2);
  const depGraph = (u) => {
    const pts = []; for (let t = 0; t <= TEND * u + 1e-6; t += 0.04) pts.push([fx(t), fy(feel(t))]);
    return `${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}
      <rect x="${f1(fx(1))}" y="${GD.y0}" width="${f1(fx(STOP) - fx(1))}" height="${GD.y1 - GD.y0}" fill="${TOL}" opacity="0.07"/>
      ${axes(GD, 'Time →', 'How you feel →', false)}
      <line x1="${GD.x0}" y1="${f1(fy(0))}" x2="${GD.x1}" y2="${f1(fy(0))}" stroke="#9aa1ad" stroke-width="2.5" stroke-dasharray="8 6"/>${T(GD.x0 + 8, fy(0) - 10, 16, GREY, 700, 'start')('normal')}
      ${T((fx(1) + fx(STOP)) / 2, GD.y0 + 26, 17, TOL)('taking the drug every day')}
      ${dash(fx(1), GD.y0, fx(1), GD.y1, TOL)}${dash(fx(STOP), GD.y0, fx(STOP), GD.y1, RED)}
      ${T(fx(1), GD.y1 + 24, 15, TOL)('start')}${T(fx(STOP), GD.y1 + 24, 15, RED)('stop')}
      ${polyline(pts, DDI, 6)}`;
  };
  const depLabels = `${T(fx(2.2), fy(0.88), 17, DDI, 700, 'start')('the drug\'s effect…')}
    ${T(fx(3.0), fy(0.66), 17, DDI, 700, 'start')('…shrinks as')}${T(fx(3.0), fy(0.66) + 22, 17, DDI, 700, 'start')('the body adapts')}
    ${T(fx(STOP) + 14, fy(-0.72), 17, RED, 700, 'start')('WITHDRAWAL: the opposite')}
    ${T(fx(STOP) + 14, fy(-0.72) + 22, 17, RED, 700, 'start')('of the drug\'s effect')}
    ${T(fx(9.2), fy(0.16), 16, GREY)('body re-adjusts')}`;
  // psychological dependence: the reward loop
  const LOOP = [['Use the drug', 555, 300, DDI], ['Reward:\na dopamine rush', 790, 490, OK], ['Brain learns:\n"do that again"', 555, 680, TOL], ['Craving', 320, 490, RED]];
  const loopSvg = `${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}
    ${curve('M 650 320 C 740 340, 790 390, 795 440', DARK, 5)}${curve('M 790 545 C 780 620, 720 660, 660 675', DARK, 5)}
    ${curve('M 450 680 C 380 660, 330 610, 322 545', DARK, 5)}${curve('M 325 440 C 340 380, 390 330, 455 305', DARK, 5)}`;
  const loopItems = LOOP.flatMap(([t, x, y, c], i) => [
    { type: 'rect', x: x - 110, y: y - 42, w: 220, h: 84, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false, at: i * 0.5 },
    txt(t, x, y - (t.includes('\n') ? 11 : 0), 19, c, { align: 'center', bold: true, at: i * 0.5 }),
  ]);
  const TD = tabsOf([{ id: 'tol37', text: 'Tolerance', c: TOL }, { id: 'phys37', text: 'Physical dependence', c: DDI }, { id: 'psy37', text: 'Psychological (addiction)', c: RED }], 170, 400);
  const tdItems = [
    title('Tolerance and dependence'),
    ...TD.bar(null),
    svgItem(`${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}`),
    txt('Three different things that\noften get mixed up ↑', 530, 500, 24, '#9aa1ad', { align: 'center', bold: true, hideDuring: ['tol37', 'phys37', 'psy37'] }),
    ...card(1030, 190, 510, 670, DARK, 'NOT THE SAME THING', 'TOLERANCE: needing MORE drug\nfor the same effect\n\nPHYSICAL DEPENDENCE: the body\nNEEDS the drug to feel normal;\nstopping causes withdrawal\n\nPSYCHOLOGICAL DEPENDENCE\n(ADDICTION): craving and\ncompulsive use, even when it\ncauses harm', 21),
    ...TD.hot,
  ];
  const tdActions = [
    { id: 'tol37', label: 'Tolerance', group: 'td', stay: true, drawn: false, items: [
      ...TD.bar('tol37'),
      ...frameTrack([[0, 0], [3, 1], [30, 1]], ([u]) => tolGraph(u), 12),
      txt('Same dose, less effect every day', 555, 800, 20, TOL, { align: 'center', bold: true, at: 3, anim: 'fade', duration: 0.3 }),
      ...card(1030, 190, 510, 670, TOL, 'TOLERANCE', 'Needing MORE of a drug to get\nthe same effect.\n\nWhy:\n• fewer or less responsive\n   receptors (slide 22)\n• the body breaks the drug down\n   faster (enzyme induction)\n\ne.g. opioids, alcohol, caffeine,\nbenzodiazepines', 21),
    ] },
    { id: 'phys37', label: 'Physical dependence', group: 'td', stay: true, drawn: false, items: [
      ...TD.bar('phys37'),
      ...frameTrack([[0, 0], [4, 1], [30, 1]], ([u]) => depGraph(u), 12),
      { ...svgItem(depLabels), at: 4, duration: 0.3 },
      ...card(1030, 190, 510, 670, DDI, 'PHYSICAL DEPENDENCE', 'The body has adapted to the drug\nand now NEEDS it to feel normal.\n\nStop suddenly → WITHDRAWAL,\nusually the opposite of the\ndrug\'s effect.\ne.g. alcohol, benzodiazepines,\nopioids, caffeine (headaches)\n\nSome drugs must be reduced\nslowly (tapered), not stopped', 20),
    ] },
    { id: 'psy37', label: 'Psychological dependence', group: 'td', stay: true, drawn: false, items: [
      ...TD.bar('psy37'),
      svgItem(loopSvg),
      ...loopItems,
      txt('Addiction:\ncompulsive use,\neven when it harms', 555, 468, 19, RED, { align: 'center', bold: true, at: 2.2, anim: 'fade', duration: 0.3 }),
      ...card(1030, 190, 510, 670, RED, 'ADDICTION', 'Craving and compulsive use of a\ndrug, even when it causes harm.\n\nDriven by the brain\'s REWARD\nsystem (dopamine).\n\nDependence ≠ addiction:\nsomeone can need a medicine\n(e.g. long-term steroids, some\nantidepressants) and get\nwithdrawal, without being\naddicted', 20),
    ] },
  ];

  // Two slides were inserted in the middle of this topic (placebo = new slide 18, zero-order = new slide 33):
  // app.js moves the user's saved drawings / notes / prompter text for the later slides to their new numbers once.
  scene.renumber = [...(scene.renumber || []), { key: '2026-11-placebo-zero-order', before: [18, 32] }];

  // ================================================================ the slides (added after part 3)
  scene.steps.push(
    // Slide 41: part 4 intro.
    { script: Qs('What is part 4 about?'),
      notes: `• Part 4 = drug safety and interactions: when drugs cause harm
• Adverse drug reactions: predictable (type A) vs unpredictable (type B)
• Drug toxicity: when the level gets too high, and the main reasons why
• Special populations: children, older adults, pregnancy, kidney and liver disease
• Drug–drug interactions: effects that add up or cancel; levels that rise or fall
• Tolerance and dependence: needing more, needing it, and withdrawal`,
      say: 'Part 4: drug safety and interactions.', clear: true, items: introItems },
    // Slide 42: adverse drug reactions.
    { script: `${Qs('What is an adverse drug reaction?', 'Type A vs type B?', 'Examples of each')}
[tabs: Type A → Type B]`,
      notes: `• Adverse drug reaction (ADR) = an unwanted, harmful effect of a drug at a normal dose
• Very common: a major cause of hospital admissions
• Type A (Augmented): too much of the drug's normal effect / known side effects
• Predictable, common (most ADRs), dose-related → fix by lowering the dose
• e.g. bleeding with warfarin, low blood sugar with insulin, drowsiness with antihistamines
• Type B (Bizarre): not related to how the drug normally works
• Unpredictable, rare but can be serious, can happen at any dose; often allergic (immune) or genetic
• e.g. penicillin allergy → anaphylaxis → stop the drug and avoid it for life
• (Other types exist, e.g. long-term and withdrawal effects, but A and B are the key ones)`,
      say: 'Adverse drug reactions are either dose-related and predictable (type A) or unpredictable (type B).', clear: true, actions: adrActions, items: adrItems },
    // Slide 43: drug toxicity.
    { script: `${Qs('What is drug toxicity?', 'How does a drug level get too high?', 'Which drugs are most at risk?')}
[tabs: Too much taken → Can't clear it → Another drug]`,
      notes: `• Toxicity = harm from TOO MUCH drug in the body: the level goes above the therapeutic window
• "The dose makes the poison" (links back to pharmakon = drug and poison)
• Too much taken (overdose): paracetamol → liver damage; opioids → breathing slows or stops
• Antidotes: acetylcysteine (paracetamol), naloxone (opioids)
• Can't clear it: low clearance → each dose adds up (kidney disease + lithium / digoxin, liver disease, older age, poor metabolisers)
• Another drug: enzyme inhibition or protein-binding displacement raises the level (clarithromycin + statin)
• Most at risk: narrow therapeutic index drugs (warfarin, lithium, digoxin) → blood levels are monitored`,
      say: 'Toxicity happens when the drug level rises above the therapeutic window: too much taken, too little cleared, or another drug.', clear: true, actions: toxActions, items: toxItems },
    // Slide 45: drug–drug interactions.
    { script: `${Qs('What is a drug–drug interaction?', 'Pharmacodynamic vs pharmacokinetic interactions?', 'Examples of each')}
[click the "Adding up" picture to build it]`,
      notes: `• Drug–drug interaction = one drug changes what another drug does
• Pharmacodynamic: they change each other's EFFECT
• Adding up: same effect → bigger (sometimes more than the sum): alcohol + opioids / benzodiazepines → dangerous drowsiness, slowed breathing
• Cancelling out: one blocks the other: beta-blocker vs asthma inhaler (salbutamol); useful: naloxone vs opioids
• Pharmacokinetic: one changes the other's LEVEL
• Metabolism (most common): inhibitors raise levels (grapefruit juice + statins), inducers lower them (rifampicin + the pill)
• Absorption (antacids + some antibiotics), protein binding (warfarin), excretion (NSAIDs → lithium builds up)
• Herbal remedies, alcohol and food can interact too`,
      say: 'Drug interactions either change each other’s effect (pharmacodynamic) or each other’s level (pharmacokinetic).', clear: true, actions: ddiActions, items: ddiItems },
    // Slide 46: tolerance and dependence.
    { script: `${Qs('What is tolerance?', 'What is physical dependence and withdrawal?', 'What is addiction, and is it the same as dependence?')}
[tabs: Tolerance → Physical dependence → Psychological (addiction)]`,
      notes: `• Three different things that often get mixed up
• Tolerance: needing MORE drug for the same effect (fewer / less responsive receptors, faster breakdown)
• e.g. opioids, alcohol, caffeine, benzodiazepines
• Physical dependence: the body has adapted and NEEDS the drug to feel normal
• Stop suddenly → withdrawal, usually the opposite of the drug's effect (alcohol, benzodiazepines, opioids, caffeine headaches)
• Some drugs must be tapered slowly rather than stopped
• Psychological dependence / addiction: craving and compulsive use despite harm; driven by the brain's reward system (dopamine)
• Dependence ≠ addiction: you can need a medicine and get withdrawal without being addicted`,
      say: 'Tolerance means needing more, physical dependence means needing it, and addiction means compulsive use despite harm.', clear: true, actions: tdActions, items: tdItems },
  );
})();
