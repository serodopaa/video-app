// Explainer: agonist vs antagonist. Built with the user.
// Uses the receptor / ligand artwork from affinity-specificity.js (window.WB_LIGAND_ART), so load that first.
// The user does the drawing; these visuals simply appear (drawn: false). Board is 1600 x 900.
(() => {
  const A = window.WB_LIGAND_ART;
  if (!A) return;
  const { panel, receptor, ligand, contacts, DOCK, track, frameTrack, T, svgItem, txt, title, label, f1 } = A;
  const AGO = '#1f8a4c', ANT = '#c0392b', DARK_T = '#3b4252';

  // ---------- pieces ----------
  // An antagonist: fits the same pocket (same triangular body) but has a bulky cap, so it wedges in
  // without switching the receptor on.
  let gid = 0;
  const antagonist = (cx, cy, s = 1) => {
    const id = `an${gid++}`;
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">
      <defs><radialGradient id="${id}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#f6a3a3"/><stop offset="1" stop-color="#d9534f"/></radialGradient></defs>
      <rect x="-38" y="-52" width="76" height="28" rx="7" fill="url(#${id})" stroke="#8e1d14" stroke-width="4"/>
      <polygon points="-31,-26 31,-26 0,27" fill="url(#${id})" stroke="#8e1d14" stroke-width="4" stroke-linejoin="round"/>
    </g>`;
  };
  const agonist = (cx, cy, s = 1) => ligand('tri', cx, cy, 'amber', 1, s);
  // receptor switched ON: green glow around the head and a glowing stem
  const onGlow = (x, top, s = 1) => `<g transform="translate(${f1(x)} ${f1(top)}) scale(${s})">
      <rect x="-92" y="-143" width="184" height="142" rx="42" fill="none" stroke="#3ccf6e" stroke-width="10" opacity="0.55"/>
      <rect x="-40" y="-24" width="80" height="122" rx="20" fill="none" stroke="#3ccf6e" stroke-width="8" opacity="0.5"/>
      <rect x="-30" y="-176" width="60" height="28" rx="14" fill="#1f8a4c"/>
      <text x="0" y="-155" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="18" text-anchor="middle" fill="#ffffff">ON</text></g>`;
  // the cell's response: a gauge 0–100 %
  const gauge = (x, y, w, h, v, head = 'Cell response') => {
    const fillH = (h - 60) * Math.max(0, Math.min(1, v));
    const c = v > 0.66 ? AGO : v > 0.05 ? '#e8890c' : '#8a8f98';
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#ffffff" stroke="#d9dce3" stroke-width="2"/>
      ${T(x + w / 2, y + 34, 22, '#1f2430')(head)}
      <rect x="${x + w / 2 - 34}" y="${y + 50}" width="68" height="${h - 60}" rx="12" fill="#eef0f4" stroke="#c9ced8" stroke-width="2"/>
      <rect x="${x + w / 2 - 34}" y="${f1(y + 50 + (h - 60) - fillH)}" width="68" height="${f1(fillH)}" rx="12" fill="${c}"/>
      ${fillH > 60 ? T(x + w / 2, y + 50 + (h - 60) - fillH + 34, 24, '#ffffff')(`${Math.round(v * 100)}%`)
    : T(x + w / 2, y + 50 + (h - 60) - fillH - 14, 24, '#5b6270')(`${Math.round(v * 100)}%`)}`;
  };
  const sigPulse = (x, y, at = 0) => ({ type: 'pulse', x, y, r: 44, color: '#3ccf6e', speed: 1.1, at });

  // ====================================================================== slide 1: hook
  const H = { top: 600, bot: 660, xs: [400, 1200] };
  const hookBase = svgItem(panel(60, 760, 250, H.top, H.bot, 820) + panel(840, 1540, 250, H.top, H.bot, 820)
    + H.xs.map((x) => receptor(x, H.top, 'tri', 'blue')).join(''));
  const HK = { ag: [H.xs[0] - 180, 330], an: [H.xs[1] - 180, 330] };
  const hookItems = [
    title('Agonist vs antagonist'),
    txt('Two molecules can bind the very same receptor… and do opposite things.', 800, 140, 28, DARK_T, { align: 'center', bold: true }),
    hookBase,
    { ...svgItem(agonist(...HK.ag)), hideDuring: 'h1' },
    { ...svgItem(antagonist(...HK.an)), hideDuring: 'h1' },
    txt('Molecule 1', 410, 205, 30, AGO, { align: 'center', bold: true }),
    txt('Molecule 2', 1190, 205, 30, ANT, { align: 'center', bold: true }),
  ];
  const dockY = (top, s = 1) => top + DOCK.tri * s;
  const hookActions = [{
    id: 'h1', label: 'Let them bind', stay: true, drawn: false,
    items: [
      ...track([[0, ...HK.ag], [1.3, H.xs[0], dockY(H.top)], [9, H.xs[0], dockY(H.top)]], ([x, y]) => agonist(x, y)),
      ...track([[0, ...HK.an], [1.3, H.xs[1], dockY(H.top)], [9, H.xs[1], dockY(H.top)]], ([x, y]) => antagonist(x, y)),
      { ...svgItem(contacts(H.xs[0], H.top, 'tri', 4) + contacts(H.xs[1], H.top, 'tri', 4) + onGlow(H.xs[0], H.top)), at: 1.4, duration: 0.3 },
      { ...sigPulse(H.xs[0], H.bot + 52, 1.5), r: 30 },
      txt('Turns the receptor ON', 410, 790, 26, AGO, { align: 'center', bold: true, at: 1.8, anim: 'fade', duration: 0.4 }),
      txt('Blocks the receptor', 1190, 790, 26, ANT, { align: 'center', bold: true, at: 1.8, anim: 'fade', duration: 0.4 }),
      txt('= AGONIST', 410, 850, 34, AGO, { align: 'center', bold: true, at: 2.6, anim: 'pop', duration: 0.4 }),
      txt('= ANTAGONIST', 1190, 850, 34, ANT, { align: 'center', bold: true, at: 3.2, anim: 'pop', duration: 0.4 }),
    ],
  }];

  // ====================================================================== slide 2 & 3: one big receptor + response gauge
  const B = { x0: 60, x1: 1000, top: 610, bot: 670, rx: 530, s: 1.15 };
  const bigBase = () => svgItem(panel(B.x0, B.x1, 112, B.top, B.bot, 860) + receptor(B.rx, B.top, 'tri', 'blue', B.s));
  const bigDock = dockY(B.top, B.s);
  const G = { x: 1340, y: 470, w: 200, h: 390 };
  const infoPanel = (head, c, def, lines) => [
    { type: 'rect', x: 1030, y: 112, w: 510, h: 340, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
    { type: 'rect', x: 1030, y: 112, w: 510, h: 66, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
    txt(head, 1285, 145, 32, '#ffffff', { align: 'center', bold: true }),
    txt(def, 1055, 230, 24, '#1f2430', { bold: true }),
    { type: 'rect', x: 1030, y: 470, w: 290, h: 390, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    txt(lines, 1050, 510, 19, '#3b4252', { bold: true }),
  ];

  // ---------- slide 2: agonist (natural: serotonin, drug: triptan) ----------
  // One serotonin receptor. Two molecules wait above it: serotonin (made by the body) and a triptan (a
  // drug). Either one binds the same pocket and switches the receptor ON, which has an effect on the cell.
  const R2 = { rx: 470, top: B.top, s: B.s };
  const r2Dock = dockY(R2.top, R2.s);
  const MOL = {
    ser: { at: [215, 290], color: 'amber', name: 'Serotonin', sub: 'made by your body', c: '#a8640a' },
    tri: { at: [745, 290], color: 'teal', name: 'Triptan', sub: 'a drug', c: '#0b6f7e' },
  };
  const molSvg = (k, x, y) => {
    const m = MOL[k];
    return ligand('tri', x, y, m.color, 1, R2.s)
      + `<line x1="${f1(x)}" y1="${f1(y - 102)}" x2="${f1(x)}" y2="${f1(y - 70)}" stroke="${m.c}" stroke-width="2" stroke-dasharray="4 4"/>`
      + `<rect x="${f1(x - 78)}" y="${f1(y - 152)}" width="156" height="50" rx="12" fill="#ffffff" stroke="${m.c}" stroke-width="2.5"/>`
      + T(x, y - 130, 21, m.c)(m.name) + T(x, y - 110, 15, '#5b6270', 600)(m.sub);
  };
  const G2 = { x: 860, y: 430, w: 120, h: 400 };
  const gauge2 = (v) => gauge(G2.x, G2.y, G2.w, G2.h, v, 'Effect');
  // right column: definition + the two kinds of agonist (cards are clickable)
  const CARD = { x: 1030, w: 510, ser: 380, tri: 610, h: 210 };
  const cardItems = (k, head, body, tag) => [
    { type: 'rect', x: CARD.x, y: CARD[k], w: CARD.w, h: CARD.h, color: MOL[k].c, fill: '#ffffff', fillOpacity: 1, width: 2.5, rough: false },
    svgItem(ligand('tri', CARD.x + 52, CARD[k] + 62, MOL[k].color, 0.8)),
    txt(tag, CARD.x + 100, CARD[k] + 34, 17, '#5b6270', { bold: true }),
    txt(head, CARD.x + 100, CARD[k] + 66, 26, MOL[k].c, { bold: true }),
    txt(body, CARD.x + 30, CARD[k] + 128, 19, '#1f2430', { bold: true }),
    { type: 'hotspot', x: CARD.x, y: CARD[k], w: CARD.w, h: CARD.h, action: k === 'ser' ? 'a2s' : 'a2t' },
  ];
  const cardOn = (k) => ({ type: 'rect', x: CARD.x - 4, y: CARD[k] - 4, w: CARD.w + 8, h: CARD.h + 8, color: MOL[k].c, fill: MOL[k].c, fillOpacity: 0.07, width: 6, rough: false });
  const agoItems = [
    title('Agonist: binds AND activates'),
    bigBase(),
    ...label('Serotonin receptor', 120, 520, [205, 520], [R2.rx - 92, R2.top - 70], 'center', 21),
    txt('Outside the cell', 90, 585, 21, '#2c5a92', { bold: true }), txt('Inside the cell', 90, 835, 21, '#6b3c87', { bold: true }),
    { ...svgItem(molSvg('ser', ...MOL.ser.at) + molSvg('tri', ...MOL.tri.at) + gauge2(0)), hideDuring: ['a2s', 'a2t'] },
    { type: 'hotspot', x: MOL.ser.at[0] - 80, y: 130, w: 160, h: 200, action: 'a2s' },
    { type: 'hotspot', x: MOL.tri.at[0] - 80, y: 130, w: 160, h: 200, action: 'a2t' },
    { type: 'rect', x: CARD.x, y: 112, w: CARD.w, h: 250, color: AGO, fill: '#eefaf2', fillOpacity: 1, width: 3, rough: false },
    txt('AGONIST', 1285, 150, 32, AGO, { align: 'center', bold: true }),
    txt('Any molecule that BINDS a\nreceptor AND ACTIVATES it.\n\nActivated = the receptor has an\neffect on its cell.', 1285, 210, 21, '#1f2430', { align: 'center', bold: true }),
    ...cardItems('ser', 'Serotonin (5-HT)', 'A neurotransmitter your body makes.\nIt binds serotonin receptors and\nactivates them.', 'NATURAL AGONIST'),
    ...cardItems('tri', 'Triptans', 'Migraine drugs (e.g. sumatriptan).\nThey bind the SAME serotonin\nreceptors and activate them too.', 'DRUG AGONIST (most common use)'),
  ];
  // one molecule binds and activates; the other waits where it was
  const bindView = (k) => {
    const other = k === 'ser' ? 'tri' : 'ser';
    return [
      svgItem(molSvg(other, ...MOL[other].at)),
      ...track([[0, ...MOL[k].at], [1.4, R2.rx, r2Dock], [12, R2.rx, r2Dock]], ([x, y]) => molSvg(k, x, y)),
      { ...svgItem(contacts(R2.rx, R2.top, 'tri', 4, R2.s) + onGlow(R2.rx, R2.top, R2.s)), at: 1.5, duration: 0.3 },
      { type: 'flash', x: R2.rx, y: r2Dock, r: 80, color: '#3ccf6e', duration: 0.6, at: 1.45 },
      { ...sigPulse(R2.rx, B.bot + 80, 1.7), r: 36 },
      txt('Activated → an effect\non the cell', R2.rx + 200, 770, 21, AGO, { align: 'center', bold: true, at: 1.9, anim: 'fade', duration: 0.4 }),
      ...frameTrack([[0, 0], [1.6, 0], [3.2, 1], [12, 1]], ([v]) => gauge2(v), 12),
      cardOn(k),
    ];
  };
  const agoActions = [
    { id: 'a2s', label: 'Serotonin binds (natural)', group: 'ag2', stay: true, drawn: false, items: bindView('ser') },
    { id: 'a2t', label: 'Triptan binds (drug)', group: 'ag2', stay: true, drawn: false, items: bindView('tri') },
  ];

  // ---------- slide 3: antagonist ----------
  const AN0 = [B.rx - 260, 260], AG1 = [B.rx + 260, 250];
  const hover = B.top - 131 * B.s - 70;
  const antItems = [
    title('Antagonist: binds but BLOCKS'),
    bigBase(),
    { ...svgItem(antagonist(...AN0, B.s) + agonist(...AG1, B.s) + gauge(G.x, G.y, G.w, G.h, 0)), hideDuring: 'n3' },
    ...label('Antagonist', 180, 200, [200, 216], [AN0[0] - 30, AN0[1] - 30], 'center', 22).map((it) => ({ ...it, hideDuring: 'n3' })),
    ...label('Agonist', 880, 200, [870, 216], [AG1[0] + 20, AG1[1] - 20], 'center', 22).map((it) => ({ ...it, hideDuring: 'n3' })),
    txt('Outside the cell', 90, 145, 21, '#2c5a92', { bold: true }), txt('Inside the cell', 90, 835, 21, '#6b3c87', { bold: true }),
    ...infoPanel('ANTAGONIST', ANT, 'Binds the receptor but does\nNOT switch it on.\n\nWhile it sits there, the\nagonist can’t get in, so\nthere is no response.',
      'Example\n\n• Naloxone (Narcan):\n  blocks opioid receptors.\n  It knocks morphine and\n  other opioids off the\n  receptors, reversing an\n  overdose.'),
  ];
  const antActions = [{
    id: 'n3', label: 'Antagonist binds, then the agonist arrives', stay: true, drawn: false,
    items: [
      ...track([[0, ...AN0], [1.4, B.rx, bigDock], [13, B.rx, bigDock]], ([x, y]) => antagonist(x, y, B.s)),
      { ...svgItem(contacts(B.rx, B.top, 'tri', 4, B.s)), at: 1.5, duration: 0.3 },
      txt('Bound, but the receptor stays OFF', B.rx, 820, 22, ANT, { align: 'center', bold: true, at: 1.8, anim: 'fade', duration: 0.4 }),
      ...track([[0, ...AG1], [3.0, ...AG1], [4.4, B.rx + 30, hover], [5.0, B.rx + 30, hover], [6.2, B.rx + 300, 300], [13, B.rx + 300, 300]], ([x, y]) => agonist(x, y, B.s)),
      txt('✕', B.rx + 120, hover - 10, 56, ANT, { align: 'center', bold: true, at: 4.4, until: 1.6, anim: 'pop', duration: 0.3 }),
      txt('The agonist can’t get in', B.rx + 200, hover - 80, 22, ANT, { align: 'center', bold: true, at: 4.5, until: 3, anim: 'fade', duration: 0.3 }),
      { ...svgItem(gauge(G.x, G.y, G.w, G.h, 0)), at: 0, duration: 0.01 },
    ],
  }];

  // ====================================================================== slide 4: side by side (tabs)
  const C = { x0: 60, x1: 1100, top: 640, bot: 700, xs: [260, 580, 900] };
  const CASES = [
    { id: 't-none', tab: 'Nothing bound', c: '#5b6270', resp: 0, who: ['', '', ''], verdict: 'No signal',
      body: 'Nothing is bound, so the\nreceptors stay off.' },
    { id: 't-ag', tab: 'Agonist', c: AGO, resp: 1, who: ['ag', 'ag', 'ag'], verdict: 'Full response',
      body: 'The agonist binds and switches\nevery receptor ON.' },
    { id: 't-an', tab: 'Antagonist', c: ANT, resp: 0, who: ['an', 'an', 'an'], verdict: 'No response',
      body: 'The antagonist fills the receptors\nbut switches none of them on.\n\nOn its own it does nothing:\nit just blocks.' },
    { id: 't-both', tab: 'Both: they compete', c: '#c46f00', resp: 1 / 3, who: ['an', 'ag', 'an'], verdict: 'Smaller response',
      body: 'They compete for the same\nreceptors. Wherever the\nantagonist sits, the agonist\ncan’t act.\n\nMore antagonist → fewer\nreceptors on → less response.' },
  ];
  const TABW = 362, TABX = (i) => 60 + i * (TABW + 10);
  const cBase = svgItem(panel(C.x0, C.x1, 195, C.top, C.bot, 860) + C.xs.map((x) => receptor(x, C.top, 'tri', 'blue')).join(''));
  const tabBar = (active) => CASES.flatMap((q, i) => [
    { type: 'rect', x: TABX(i), y: 108, w: TABW, h: 64, color: q.c, fill: q.id === active ? q.c : '#ffffff', fillOpacity: 1, width: 3, rough: false },
    txt(q.tab, TABX(i) + TABW / 2, 140, 24, q.id === active ? '#ffffff' : q.c, { align: 'center', bold: true }),
  ]);
  const tabHot = CASES.map((q, i) => ({ type: 'hotspot', x: TABX(i), y: 108, w: TABW, h: 64, action: q.id }));
  const cDock = dockY(C.top);
  const caseView = (q) => {
    const out = [...tabBar(q.id)];
    q.who.forEach((w, i) => {
      if (!w) return;
      const x = C.xs[i], t0 = 0.4 + i * 0.35 + (q.id === 't-both' && w === 'ag' ? 1.6 : 0);
      const draw = w === 'ag' ? ([a, b]) => agonist(a, b) : ([a, b]) => antagonist(a, b);
      out.push(...track([[0, x - 120, 280], [t0, x - 120, 280], [t0 + 1.2, x, cDock], [12, x, cDock]], draw));
      out.push({ ...svgItem(contacts(x, C.top, 'tri', 4) + (w === 'ag' ? onGlow(x, C.top) : '')), at: t0 + 1.25, duration: 0.3 });
      if (w === 'ag') out.push(sigPulse(x, C.bot + 85, t0 + 1.4));
    });
    if (q.id === 't-both') { // extra agonists try the blocked receptors and bounce off
      [0, 2].forEach((i, j) => {
        const x = C.xs[i], hov = C.top - 131 - 60, t = 2.6 + j * 0.4;
        out.push(...track([[0, x + 120, 270], [t, x + 120, 270], [t + 1.0, x + 20, hov], [t + 1.4, x + 20, hov], [t + 2.3, x + 140, 300], [12, x + 140, 300]], ([a, b]) => agonist(a, b)));
        out.push(txt('✕', x + 100, hov - 10, 40, ANT, { align: 'center', bold: true, at: t + 1.0, until: 1.2, anim: 'pop', duration: 0.3 }));
      });
    }
    const respAt = q.resp > 0 ? (q.id === 't-both' ? 3.4 : 1.8) : 0;
    out.push(...frameTrack([[0, 0], [respAt, 0], [respAt + 1.4, q.resp], [12, q.resp]], ([v]) => gauge(1330, 470, 210, 390, v), 12));
    out.push(
      { type: 'rect', x: 1120, y: 195, w: 420, h: 260, color: q.c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
      txt(q.verdict, 1330, 235, 28, q.c, { align: 'center', bold: true }),
      txt(q.body, 1145, 285, 20, '#1f2430', { bold: true }),
      { type: 'rect', x: 1120, y: 470, w: 195, h: 390, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
      txt('Key', 1217, 500, 20, '#1f2430', { align: 'center', bold: true }),
      svgItem(agonist(1160, 575, 0.6) + antagonist(1160, 680, 0.6)),
      txt('Agonist', 1190, 570, 18, AGO, { bold: true }), txt('Antagonist', 1190, 675, 18, ANT, { bold: true }),
      txt('ON =\nactivated', 1217, 790, 17, '#1f8a4c', { align: 'center', bold: true }),
    );
    return out;
  };
  const CASE_IDS = CASES.map((q) => q.id);
  const sideItems = [
    title('Side by side'),
    cBase,
    ...[...tabBar(null),
      { type: 'rect', x: 1120, y: 195, w: 420, h: 665, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
      txt('Click a tab above to see what\neach one does to the receptors\nand to the cell’s response.', 1330, 300, 21, '#5b6270', { align: 'center', bold: true })].map((it) => ({ ...it, hideDuring: CASE_IDS })),
    ...tabHot,
  ];
  const sideActions = CASES.map((q) => ({ id: q.id, label: q.tab, group: 'case', stay: true, drawn: false, items: caseView(q) }));

  // ====================================================================== slide 5: review
  const card = (x, c, head, q, rows, art) => [
    { type: 'rect', x, y: 120, w: 700, h: 650, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
    { type: 'rect', x, y: 120, w: 700, h: 76, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
    txt(head, x + 350, 158, 36, '#ffffff', { align: 'center', bold: true }),
    txt(q, x + 350, 236, 26, c, { align: 'center', bold: true }),
    svgItem(art),
    ...rows.flatMap(([k, v], i) => [
      txt(k, x + 40, 490 + i * 96, 19, '#5b6270', { bold: true }),
      txt(v, x + 40, 524 + i * 96, 22, '#1f2430', { bold: true }),
    ]),
  ];
  const miniRec = (x, which) => {
    const top = 375, s = 0.6, dy = top + DOCK.tri * s;
    return `<rect x="${x - 120}" y="${top}" width="240" height="20" fill="#fbecd6"/><line x1="${x - 120}" y1="${top}" x2="${x + 120}" y2="${top}" stroke="#c99a62" stroke-width="3"/>`
      + receptor(x, top, 'tri', 'blue', s) + (which === 'ag' ? agonist(x, dy, s) + onGlow(x, top, s) : antagonist(x, dy, s));
  };
  const reviewItems = [
    title('Review: agonist vs antagonist'),
    ...card(60, AGO, 'AGONIST', 'Binds and ACTIVATES', [
      ['What it does', 'Switches the receptor ON, so the cell responds'],
      ['Affinity? Efficacy?', 'Yes: it binds.   Yes: it activates.'],
      ['Example', 'Morphine at opioid receptors'],
    ], miniRec(410, 'ag')),
    ...card(840, ANT, 'ANTAGONIST', 'Binds and BLOCKS', [
      ['What it does', 'Sits in the receptor without switching it on,\nso the agonist can’t act'],
      ['Affinity? Efficacy?', 'Yes: it binds.   No: it doesn’t activate.'],
      ['Example', 'Naloxone (Narcan) blocks opioid receptors'],
    ], miniRec(1190, 'an')),
    { type: 'rect', x: 60, y: 790, w: 1480, h: 70, color: '#1f2430', fill: '#f4f5f8', fillOpacity: 1, width: 2, rough: false },
    txt('Both bind the receptor (affinity). Only the agonist switches it on (efficacy).', 800, 825, 26, '#1f2430', { align: 'center', bold: true }),
  ];

  const Qs = (...q) => '[QUESTIONS THIS SLIDE ANSWERS]\n' + q.map((x) => `[• ${x}]`).join('\n');
  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'agonist-antagonist',
    title: '🔑 Agonist vs antagonist',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: the hook.
      {
        say: 'Two molecules can bind the very same receptor and do opposite things: an agonist turns it on, an antagonist blocks it.',
        script: `${Qs('What are agonists and antagonists?', 'How can two molecules bind the same receptor but do opposite things?')}

Here are two molecules and two identical receptors. [point to each]

Watch what happens when they bind. [click "Let them bind"]

Both of them fit. But one switches the receptor ON, and the other just sits there and blocks it.

The first is an agonist. The second is an antagonist. Let's see how each one works.`,
        actions: hookActions,
        items: hookItems,
      },
      // Slide 2: agonist.
      {
        say: 'An agonist binds a receptor and activates it: serotonin is a natural agonist of serotonin receptors, and triptans are drug agonists of the same receptors.',
        script: `[QUESTIONS THIS SLIDE ANSWERS]
[• What does an agonist do?]
[• Can the body make its own agonists?]
[• How is the word usually used (drugs)?]

So starting with agonists, what they do is activate the receptor that they bind to.

It is important to note though that there are agonists for a given receptor that your body naturally makes. For example, the neurotransmitter serotonin is an agonist for serotonin receptors, because it binds to them and then activates them. [click "Serotonin binds" or the serotonin card]

But the term agonist is most commonly used when talking about drugs that bind to a receptor. So for example, triptans are a class of drugs that are serotonin receptor agonists, because they also bind to serotonin receptors and activate them. [click "Triptan binds" or the triptan card]

So basically, an agonist is any molecule that binds to a receptor and causes that receptor to be activated. [point to the AGONIST box] And being activated means it has some effect on the cell that the receptor is a part of, in most cases. [point to the Effect gauge]`,
        clear: true, actions: agoActions, items: agoItems,
      },
      // Slide 3: antagonist.
      { script: Qs('What is an antagonist?', 'If it binds, why is there no response?', 'How does it stop the agonist from working?', 'What is an example of an antagonist?'), say: 'An antagonist binds the receptor but does not switch it on, and it blocks the agonist from getting in.', clear: true, actions: antActions, items: antItems },
      // Slide 4: side by side (tabs).
      { script: Qs('What does each one do to the cell’s response?', 'What happens when an agonist and an antagonist are both present?', 'Why does more antagonist mean less response?'), say: 'Agonists give a response, antagonists give none, and together they compete for the same receptors.', clear: true, actions: sideActions, items: sideItems },
      // Slide 5: review.
      { script: Qs('What is the difference between an agonist and an antagonist?', 'Which one has affinity, and which one has efficacy?', 'What are examples of each?'), say: 'Both bind the receptor; only the agonist activates it. The antagonist blocks it.', clear: true, items: reviewItems },
    ],
  });
})();
