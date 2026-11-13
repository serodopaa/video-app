// Pharmacology essentials, part 2: pharmacodynamics. Built with the user.
// Adds its slides to the end of the 'pharmacology-essentials' topic (one video), so load it AFTER
// affinity-specificity.js (WB_LIGAND_ART) and pharmacology-essentials.js (WB_PHARM_ART + the scene).
// The user does the drawing; these visuals simply appear (drawn: false). Board is 1600 x 900.
(() => {
  const A = window.WB_LIGAND_ART, P = window.WB_PHARM_ART;
  const scene = (window.WB_SCENES || []).find((s) => s.id === 'pharmacology-essentials');
  if (!A || !P || !scene) return;
  const { panel, receptor, ligand, contacts, DOCK, track, frameTrack, T, svgItem, txt, title, f1 } = A;
  const { box, rr, capsule, curve, dot, badge, person } = P;
  const { INK, GREY, DARK, PK, PD, ENDO, EXO, DRUG } = P.COL;
  const AGO = '#1f8a4c', ANT = '#c0392b', MOD = '#7b3fd0', OUT = '#eef6fd', AFF = '#2f6fde', SEL = '#7b3fd0';
  const Qs = (...q) => '[QUESTIONS THIS SLIDE ANSWERS]\n' + q.map((x) => `[• ${x}]`).join('\n');
  let gid = 0;

  // ---------------------------------------------------------------- shared pieces
  // receptor switched ON: green glow; k = how strongly (1 full, ~0.45 partly)
  const glow = (x, top, s = 1, k = 1, label = 'ON', bc = AGO) => {
    const w = 26 + label.length * 13;
    return `<g transform="translate(${f1(x)} ${f1(top)}) scale(${s})">
      <rect x="-92" y="-143" width="184" height="142" rx="42" fill="none" stroke="#3ccf6e" stroke-width="10" opacity="${f1(0.6 * k)}"/>
      <rect x="-40" y="-24" width="80" height="122" rx="20" fill="none" stroke="#3ccf6e" stroke-width="8" opacity="${f1(0.55 * k)}"/>
      <rect x="${-w / 2}" y="-178" width="${w}" height="30" rx="15" fill="${bc}"/>
      <text x="0" y="-156" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="18" text-anchor="middle" fill="#ffffff">${label}</text></g>`;
  };
  const offBadge = (x, top, s = 1, label = '✕ OFF') => `<g transform="translate(${f1(x)} ${f1(top)}) scale(${s})">
      <rect x="-56" y="-178" width="112" height="30" rx="15" fill="${ANT}"/>
      <text x="0" y="-156" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="18" text-anchor="middle" fill="#ffffff">${label}</text></g>`;
  // the response of the cell: a 0–100 % gauge
  const gauge = (x, y, w, h, v, head = 'Response') => {
    const ih = h - 64, fillH = ih * Math.max(0, Math.min(1, v));
    const c = v > 0.66 ? AGO : v > 0.05 ? '#e8890c' : '#8a8f98';
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#ffffff" stroke="#d9dce3" stroke-width="2"/>
      ${T(x + w / 2, y + 34, 21, INK)(head)}
      <rect x="${x + w / 2 - 32}" y="${y + 52}" width="64" height="${ih}" rx="12" fill="#eef0f4" stroke="#c9ced8" stroke-width="2"/>
      <rect x="${x + w / 2 - 32}" y="${f1(y + 52 + ih - fillH)}" width="64" height="${f1(fillH)}" rx="12" fill="${c}"/>
      ${fillH > 60 ? T(x + w / 2, y + 52 + ih - fillH + 34, 22, '#ffffff')(`${Math.round(v * 100)}%`) : T(x + w / 2, y + 52 + ih - fillH - 12, 22, GREY)(`${Math.round(v * 100)}%`)}`;
  };
  // an antagonist: same triangular body (fits the pocket) with a bulky cap, so it can't switch the receptor on
  const antag = (cx, cy, s = 1) => {
    const id = `an${gid++}`;
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">
      <defs><radialGradient id="${id}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#f6a3a3"/><stop offset="1" stop-color="#d9534f"/></radialGradient></defs>
      <rect x="-38" y="-52" width="76" height="28" rx="7" fill="url(#${id})" stroke="#8e1d14" stroke-width="4"/>
      <polygon points="-31,-26 31,-26 0,27" fill="url(#${id})" stroke="#8e1d14" stroke-width="4" stroke-linejoin="round"/></g>`;
  };
  // a small round molecule that binds the side (allosteric) site
  const ball = (cx, cy, s = 1, c1 = '#c9a8f2', c2 = '#7b3fd0', e = '#4a1f8a') => {
    const id = `bl${gid++}`;
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})"><defs><radialGradient id="${id}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>
      <circle r="19" fill="url(#${id})" stroke="${e}" stroke-width="4"/></g>`;
  };
  // the receptor's second (allosteric) site: a round notch in the right side of its head
  const sideSite = (x, top, s = 1, edge = '#2c5a92') => `<g transform="translate(${f1(x)} ${f1(top)}) scale(${s})">
      <rect x="77" y="-91" width="8" height="38" fill="${OUT}"/><path d="M81 -92 A20 20 0 0 0 81 -52" fill="${OUT}" stroke="${edge}" stroke-width="4"/></g>`;
  const sideAt = (x, top, s = 1) => [x + 86 * s, top - 72 * s];
  const dockY = (top, s = 1, kind = 'tri') => top + DOCK[kind] * s;
  // a labelled pill above a molecule (follows it when drawn together)
  const tagOver = (x, y, text, c, dy = 70) => { const w = Math.max(120, text.length * 11 + 34); return `<rect x="${f1(x - w / 2)}" y="${f1(y - dy - 22)}" width="${w}" height="36" rx="18" fill="#ffffff" stroke="${c}" stroke-width="2.5"/>${T(x, y - dy + 3, 18, c)(text)}`; };
  const tagRight = (x, y, text, c) => tagOver(x + 36 + Math.max(120, text.length * 11 + 34) / 2, y, text, c, 0);
  // tabs drawn on the slide (clickable through hotspots)
  const tabsOf = (tabs, x0, w, gap = 18, y = 108, h = 62) => {
    const X = (i) => x0 + i * (w + gap);
    return {
      bar: (active) => tabs.flatMap((t, i) => [
        { type: 'rect', x: X(i), y, w, h, color: t.c, fill: t.id === active ? t.c : '#ffffff', fillOpacity: 1, width: 3, rough: false },
        txt(t.text, X(i) + w / 2, y + h / 2, 22, t.id === active ? '#ffffff' : t.c, { align: 'center', bold: true }),
      ]),
      hot: tabs.map((t, i) => ({ type: 'hotspot', x: X(i), y, w, h, action: t.id })),
    };
  };
  // a card with a coloured header strip
  const card = (x, y, w, h, c, head, body, size = 21, extra = {}) => [
    box(x, y, w, h, c, '#ffffff', extra),
    { type: 'rect', x, y, w, h: 58, color: c, fill: c, fillOpacity: 1, width: 3, rough: false, ...extra },
    txt(head, x + w / 2, y + 29, 25, '#ffffff', { align: 'center', bold: true, ...extra }),
    txt(body, x + 26, y + 92, size, INK, { bold: true, ...extra }),
  ];
  const at = (items, t) => items.map((it) => ({ ...it, at: t }));
  // graph helpers: plot area (x0..x1, y0 top .. y1 bottom), u = 0..1 along x, v = 0..1 up
  const plot = (G) => ({ x: (u) => G.x0 + u * (G.x1 - G.x0), y: (v) => G.y1 - v * (G.y1 - G.y0) });
  const axes = (G, xl, yl, yt = true) => {
    const p = plot(G);
    return `<line x1="${G.x0}" y1="${G.y1}" x2="${G.x1 + 14}" y2="${G.y1}" stroke="${DARK}" stroke-width="3"/>
      <line x1="${G.x0}" y1="${G.y1}" x2="${G.x0}" y2="${G.y0 - 20}" stroke="${DARK}" stroke-width="3"/>
      ${T((G.x0 + G.x1) / 2, G.y1 + 44, 20, GREY)(xl)}
      <text x="${G.x0 - 62}" y="${f1((G.y0 + G.y1) / 2)}" transform="rotate(-90 ${G.x0 - 62} ${f1((G.y0 + G.y1) / 2)})" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="${GREY}">${yl}</text>
      ${yt ? [0, 0.5, 1].map((v) => T(G.x0 - 14, p.y(v) + 7, 17, GREY, 700, 'end')(`${v * 100}%`)).join('') : ''}`;
  };
  const sCurve = (G, mid, top = 1, steep = 12, u1 = 1, c = PK, w = 6, op = 1) => {
    const p = plot(G), pts = [];
    for (let u = 0; u <= u1 + 1e-6; u += 0.01) pts.push(`${f1(p.x(u))},${f1(p.y(top / (1 + Math.exp(-(u - mid) * steep))))}`);
    return pts.length > 1 ? `<polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}"/>` : '';
  };
  const sig = (u, mid, top = 1, steep = 12) => top / (1 + Math.exp(-(u - mid) * steep));
  const dash = (x1, y1, x2, y2, c = GREY) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${c}" stroke-width="2.5" stroke-dasharray="8 6"/>`;

  // ---------------------------------------------------------------- slide: part 2 intro
  const miniS = (x0, yb, w, h, c, mid = 0.5, top = 1, steep = 12) => {
    const pts = []; for (let k = 0; k <= 30; k++) { const u = k / 30; pts.push(`${f1(x0 + u * w)},${f1(yb - sig(u, mid, top, steep) * h)}`); }
    return `<polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`;
  };
  const miniAxes = (x0, yb, w, h) => `<line x1="${x0}" y1="${yb}" x2="${x0 + w + 6}" y2="${yb}" stroke="${DARK}" stroke-width="2.5"/><line x1="${x0}" y1="${yb}" x2="${x0}" y2="${yb - h - 6}" stroke="${DARK}" stroke-width="2.5"/>`;
  const S2 = 0.42;
  const miniRec = (cx, cy, extra = '') => receptor(cx, cy + 46, 'tri', 'blue', S2) + extra;
  const INTRO = [
    ['Drug targets\n(all 4 types)', EXO, (cx, cy) => [[-40, -22, AFF], [12, -22, EXO], [-40, 28, PD], [12, 28, ENDO]].map(([dx, dy, c]) => `<rect x="${cx + dx}" y="${cy + dy - 18}" width="44" height="40" rx="10" fill="${c}" opacity="0.85"/>`).join('')],
    ['Receptors, binding\n& receptor types', AFF, (cx, cy) => miniRec(cx, cy, ligand('tri', cx, cy + 46 + DOCK.tri * S2, 'amber', 1, S2) + ligand('tri', cx - 70, cy - 4, 'amber', 1, S2))],
    ['Agonists\n(full & partial)', AGO, (cx, cy) => miniRec(cx, cy, ligand('tri', cx, cy + 46 + DOCK.tri * S2, 'amber', 1, S2) + glow(cx, cy + 46, S2))],
    ['Antagonists &\nmodulators', ANT, (cx, cy) => miniRec(cx, cy, antag(cx, cy + 46 + DOCK.tri * S2, S2) + sideSite(cx, cy + 46, S2) + ball(...sideAt(cx, cy + 46, S2), S2))],
    ['Dose–response\ncurves', PK, (cx, cy) => miniAxes(cx - 55, cy + 40, 110, 80) + miniS(cx - 55, cy + 40, 110, 76, PK)],
    ['Potency vs\nefficacy', PD, (cx, cy) => miniAxes(cx - 55, cy + 40, 110, 80) + miniS(cx - 55, cy + 40, 110, 76, PK, 0.35) + miniS(cx - 55, cy + 40, 110, 76, EXO, 0.45, 0.5)],
    ['Therapeutic\nindex', ENDO, (cx, cy) => miniAxes(cx - 55, cy + 40, 110, 80) + miniS(cx - 55, cy + 40, 110, 76, ENDO, 0.3) + miniS(cx - 55, cy + 40, 110, 76, ANT, 0.75)],
    ['Receptor regulation\n& the placebo effect', DARK, (cx, cy) => [0, 1, 2].map((i) => receptor(cx - 52 + i * 52, cy + 40, 'tri', 'blue', 0.3).replace('<g ', `<g opacity="${1 - i * 0.33}" `)).join('') + curve(`M ${cx + 82} ${cy - 30} L ${cx + 82} ${cy + 40}`, ANT, 4)],
  ];
  const IC = { w: 352, h: 205, x: (i) => 60 + (i % 4) * 372, y: (i) => 400 + Math.floor(i / 4) * 228 };
  const introItems = [
    svgItem(`<rect x="0" y="0" width="1600" height="900" fill="#f6f3fc"/><circle cx="1440" cy="140" r="210" fill="#ebe2fa"/>
      <defs><clipPath id="pdi"><rect x="1150" y="95" width="380" height="270" rx="22"/></clipPath></defs>
      <rect x="1150" y="95" width="380" height="270" rx="22" fill="#ffffff" stroke="#d9cdf2" stroke-width="3"/>
      <g clip-path="url(#pdi)">${panel(1150, 1530, 95, 300, 335, 365)}${receptor(1340, 300, 'tri', 'blue', 0.85)}${ligand('tri', 1340, dockY(300, 0.85), 'amber', 1, 0.85)}${contacts(1340, 300, 'tri', 4, 0.85)}${glow(1340, 300, 0.85)}</g>`),
    box(110, 112, 190, 58, PD, PD), txt('PART 2', 205, 141, 28, '#ffffff', { align: 'center', bold: true }),
    txt('PHARMACODYNAMICS', 110, 235, 86, PD, { bold: true }),
    txt('How drugs affect the body: what the DRUG does to the BODY', 110, 318, 30, GREY, { bold: true }),
    ...INTRO.flatMap(([t, c, art], i) => {
      const x = IC.x(i), y = IC.y(i);
      return [box(x, y, IC.w, IC.h, c), svgItem(badge(x + 36, y + 36, String(i + 1), c) + art(x + 190, y + 52)), txt(t, x + IC.w / 2, y + 166, 22, c, { align: 'center', bold: true })];
    }),
  ];

  // ---------------------------------------------------------------- slide: receptors and binding
  const R7 = { x: 420, top: 630, s: 1.15 };
  const L7 = [210, 300];
  const r7Dock = dockY(R7.top, R7.s);
  const squish = 'scale(1.06 0.93)';
  const recItems = [
    title('Receptors and binding'),
    svgItem(panel(60, 1000, 112, R7.top, R7.top + 60, 860) + receptor(R7.x, R7.top, 'tri', 'blue', R7.s)),
    txt('Outside the cell', 90, 145, 21, '#2c5a92', { bold: true }), txt('Inside the cell', 90, 835, 21, '#6b3c87', { bold: true }),
    { type: 'line', from: [700, 500], to: [R7.x + 95, 520], color: DARK, width: 2.5, rough: false },
    txt('Receptor\n(a protein)', 712, 480, 22, DARK, { bold: true }),
    { ...svgItem(ligand('tri', ...L7, 'amber', 1, R7.s) + tagOver(...L7, 'Ligand', '#a8640a', 78)), hideDuring: 'b7' },
    { type: 'hotspot', x: 60, y: 112, w: 940, h: 748, action: 'b7' },
    ...card(1030, 112, 510, 225, AFF, 'RECEPTOR', 'A protein, usually on the surface of\na cell, with a pocket that only the\nright molecule fits into.\n(like a lock and key)'),
    ...card(1030, 357, 510, 200, '#a8640a', 'LIGAND', 'Any molecule that binds a receptor:\nneurotransmitters, hormones,\nor drugs.'),
    ...card(1030, 577, 510, 283, AGO, 'BINDING → ACTIVATION', 'When the right ligand binds, the\nreceptor CHANGES SHAPE.\n\nThat shape change switches it ON\nand passes a message into the cell.'),
  ];
  const recActions = [{
    id: 'b7', label: 'Bind and switch on', stay: true, drawn: false,
    items: [
      ...track([[0, ...L7], [1.3, R7.x, r7Dock], [1.85, R7.x, r7Dock]], ([x, y]) => ligand('tri', x, y, 'amber', 1, R7.s)),
      { ...svgItem(contacts(R7.x, R7.top, 'tri', 4, R7.s)), at: 1.35, duration: 0.2, until: 0.5 },
      // the shape change: the receptor squashes slightly and turns green, then it's ON
      { ...svgItem(`<g transform="translate(${R7.x} ${R7.top}) ${squish} translate(${-R7.x} ${-R7.top})">${receptor(R7.x, R7.top, 'tri', 'green', R7.s)}${ligand('tri', R7.x, r7Dock, 'amber', 1, R7.s)}${contacts(R7.x, R7.top, 'tri', 4, R7.s)}</g>`), at: 1.85, duration: 0.4 },
      { ...svgItem(curve(`M ${R7.x - 140} ${R7.top - 150} q -30 40 0 80`, AGO, 5) + curve(`M ${R7.x + 140} ${R7.top - 150} q 30 40 0 80`, AGO, 5)), at: 1.9, duration: 0.3 },
      txt('shape changes', R7.x - 230, R7.top - 200, 21, AGO, { align: 'center', bold: true, at: 1.9, anim: 'fade', duration: 0.3 }),
      { ...svgItem(glow(R7.x, R7.top, R7.s * 0.97)), at: 2.5, duration: 0.3 },
      { type: 'pulse', x: R7.x, y: R7.top + 175, r: 40, color: '#3ccf6e', speed: 1.1, at: 2.6 },
      txt('Message passed\ninto the cell', R7.x + 200, R7.top + 165, 22, AGO, { align: 'center', bold: true, at: 2.7, anim: 'fade', duration: 0.4 }),
    ],
  }];

  // ---------------------------------------------------------------- slide: affinity, specificity, selectivity
  // Three sections side by side. Specificity and selectivity get the same Low dose / High dose buttons, so the
  // difference shows: at a high dose the specific drug STILL binds only its target; the selective one binds others too.
  const RECS = [['tri', 'blue'], ['round', 'green'], ['square', 'pink']];
  const blobDock = { tri: -112, round: -127, square: -110 };
  const SPEC = '#0b7a8a';
  const COLX = [60, 560, 1060], CW3 = 480;
  const P8 = { y0: 324, top: 705, bot: 755, y1: 845 };
  const chip = (x, y, w, label, c, on = false) => [
    { type: 'rect', x, y, w, h: 44, color: c, fill: on ? c : '#ffffff', fillOpacity: 1, width: 3, rough: false },
    txt(label, x + w / 2, y + 22, 19, on ? '#ffffff' : c, { align: 'center', bold: true }),
  ];
  const section = (i, c, head, def) => {
    const x = COLX[i];
    return [
      box(x, 112, CW3, 748, c), { type: 'rect', x, y: 112, w: CW3, h: 58, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
      txt(head, x + CW3 / 2, 141, 27, '#ffffff', { align: 'center', bold: true }),
      txt(def, x + CW3 / 2, 196, 19, c, { align: 'center', bold: true }),
    ];
  };
  // affinity
  const AS = 0.82, AX = [COLX[0] + 130, COLX[0] + 350];
  const AFF_START = [[AX[0] - 90, 400], [AX[1] - 90, 400]];
  const affDock = dockY(P8.top, AS);
  const lowKeys = (x, st) => {
    const d = affDock, a = 1.3;
    return [[0, ...st, 0], [a, x, d, 0], [a + 0.05, x, d, 1], [a + 0.9, x, d, 1], [a + 0.95, x, d, 0], [a + 1.9, x + 70, 420, 0], [a + 3.0, x + 70, 420, 0],
      [a + 4.0, x, d, 0], [a + 4.05, x, d, 1], [a + 4.9, x, d, 1], [a + 4.95, x, d, 0], [a + 5.9, x - 80, 410, 0], [a + 7.0, x - 80, 410, 0], [a + 8.0, x, d, 0], [a + 8.05, x, d, 1], [30, x, d, 1]];
  };
  // specificity / selectivity panels: target + two other receptors
  const RS = 0.72;
  const rx3 = (i) => [COLX[i] + 95, COLX[i] + 240, COLX[i] + 385];
  const panel3 = (i) => svgItem(panel(COLX[i] + 15, COLX[i] + CW3 - 15, P8.y0, P8.top, P8.bot, P8.y1)
    + rx3(i).map((x, k) => receptor(x, P8.top, RECS[k][0], RECS[k][1], RS)).join('')
    + T(rx3(i)[0], 795, 18, '#2c5a92')('Target') + T(rx3(i)[1], 795, 18, GREY)('Other') + T(rx3(i)[2], 795, 18, GREY)('Other'));
  // chip widths: equal for two; the third (Non-selective) a bit wider
  const chipGeo = (i, n) => {
    const ws = n === 3 ? [128, 128, 184] : [205, 205], out = [];
    let x = COLX[i] + 20;
    for (const w of ws) { out.push([x, w]); x += w + 10; }
    return out;
  };
  const doseChips = (i, c, ids, labels, active) => chipGeo(i, ids.length).flatMap(([x, w], k) => chip(x, 240, w, labels[k], c, ids[k] === active));
  const doseHot = (i, ids) => chipGeo(i, ids.length).map(([x, w], k) => ({ type: 'hotspot', x, y: 240, w, h: 44, action: ids[k] }));
  // where the extra molecules of a high dose wait
  const crowd = (i) => [[COLX[i] + 60, 400], [COLX[i] + 150, 360], [COLX[i] + 245, 405], [COLX[i] + 330, 365], [COLX[i] + 420, 400]];
  const cap = (i, text, c, t) => txt(text, COLX[i] + CW3 / 2, 830, 18, c, { align: 'center', bold: true, at: t, anim: 'fade', duration: 0.4 });
    const SP_IDS = ['spLo8', 'spHi8'], SE_IDS = [['sHL8', 'sHH8'], ['sLL8', 'sLH8']];
  // selectivity buttons: a small grid, rows = high / low selectivity, columns = low / high dose
  const SG = { cols: [COLX[2] + 196, COLX[2] + 330], w: 128, rows: [248, 284], h: 30 };
  const selCell = (id) => {
    const r = SE_IDS.findIndex((row) => row.includes(id)), c = SE_IDS[r].indexOf(id);
    return { x: SG.cols[c], y: SG.rows[r], w: SG.w, h: SG.h };
  };
  const selGrid = (active) => [
    ...['Low dose', 'High dose'].map((t, c) => txt(t, SG.cols[c] + SG.w / 2, 233, 15, SEL, { align: 'center', bold: true })),
    ...['High selectivity', 'Low selectivity'].map((t, r) => txt(t, COLX[2] + 22, SG.rows[r] + SG.h / 2, 16, SEL, { bold: true })),
    ...SE_IDS.flat().flatMap((id) => {
      const g = selCell(id), on = id === active;
      return [{ type: 'rect', ...g, color: SEL, fill: on ? SEL : '#ffffff', fillOpacity: 1, width: 2.5, rough: false },
        txt(on ? '■ playing' : '▶', g.x + g.w / 2, g.y + g.h / 2, 15, on ? '#ffffff' : SEL, { align: 'center', bold: true })];
    }),
  ];
  const affSelItems = [
    title('Affinity, specificity and selectivity'),
    ...section(0, AFF, 'AFFINITY', 'How TIGHTLY a drug\nbinds its receptor'),
    ...chip(COLX[0] + 100, 240, 280, '▶ Watch them bind', AFF), { type: 'hotspot', x: COLX[0] + 100, y: 240, w: 280, h: 44, action: 'aff8' },
    svgItem(panel(COLX[0] + 15, COLX[0] + CW3 - 15, P8.y0, P8.top, P8.bot, P8.y1) + AX.map((x) => receptor(x, P8.top, 'tri', 'blue', AS)).join('')
      + T(AX[0], 345, 20, AFF)('High affinity') + T(AX[1], 345, 20, '#8a8f98')('Low affinity')),
    { ...svgItem(ligand('tri', ...AFF_START[0], 'amber', 1, AS) + ligand('tri', ...AFF_START[1], 'pale', 0.82, AS)), hideDuring: 'aff8' },
    ...section(1, SPEC, 'SPECIFICITY', 'Binds ONLY ONE target,\nat ANY dose (all-or-nothing)'),
    ...doseChips(1, SPEC, SP_IDS, ['Low dose', 'High dose'], null), ...doseHot(1, SP_IDS),
    panel3(1),
    ...section(2, SEL, 'SELECTIVITY', 'How strongly a drug PREFERS its target'),
    ...selGrid(null), ...SE_IDS.flat().map((id) => ({ type: 'hotspot', ...selCell(id), action: id })),
    panel3(2),
  ];
  const dk = (i, k, kind) => [rx3(i)[k], P8.top + (kind === 'tri' ? DOCK.tri : blobDock[RECS[k][0]]) * RS];
  const bindTo = (i, k, from, t, kind, color, n) => track([[0, ...from, 0], [t, ...from, 0], [t + 1.1, ...dk(i, k, kind), 0], [t + 1.15, ...dk(i, k, kind), 1], [30, ...dk(i, k, kind), 1]],
    ([x, y]) => ligand(kind, x, y, color, 1, RS), () => contacts(rx3(i)[k], P8.top, RECS[k][0], n, RS));
  const tryAndLeave = (i, k, from, t) => {
    const hover = P8.top - 131 * RS - 40, x = rx3(i)[k];
    return track([[0, ...from], [t, ...from], [t + 1.0, x, hover], [t + 1.6, x, hover], [t + 2.4, ...from], [30, ...from]], ([px, py]) => ligand('tri', px, py, 'amber', 1, RS));
  };
  const idle = (from, kind, color) => svgItem(ligand(kind, ...from, color, 1, RS));
  const sideFx = (i, ks, t) => ks.map((k) => txt('⚠ side effect', rx3(i)[k], 560, 17, ANT, { align: 'center', bold: true, at: t, anim: 'pop', duration: 0.3 }));
  const affSelActions = [
    { id: 'aff8', label: 'Affinity: watch them bind', stay: true, drawn: false, items: [
      ...chip(COLX[0] + 100, 240, 280, '▶ Watch them bind', AFF, true),
      ...track([[0, ...AFF_START[0], 0], [1.3, AX[0], affDock, 0], [1.35, AX[0], affDock, 1], [30, AX[0], affDock, 1]], ([x, y]) => ligand('tri', x, y, 'amber', 1, AS), () => contacts(AX[0], P8.top, 'tri', 4, AS)),
      ...track(lowKeys(AX[1], AFF_START[1]), ([x, y]) => ligand('tri', x, y, 'pale', 0.82, AS), () => contacts(AX[1], P8.top, 'tri', 1, AS)),
      txt('Snug fit, many bonds:\nstays bound', AX[0], 818, 17, AFF, { align: 'center', bold: true, at: 2.2, anim: 'fade', duration: 0.4 }),
      txt('Loose fit, few bonds:\nkeeps falling off', AX[1], 818, 17, GREY, { align: 'center', bold: true, at: 3.4, anim: 'fade', duration: 0.4 }),
    ] },
    // specificity: a triangle that fits only the triangular pocket
    { id: 'spLo8', label: 'Specificity: low dose', group: 'spc', stay: true, drawn: false, items: [
      ...doseChips(1, SPEC, SP_IDS, ['Low dose', 'High dose'], 'spLo8'),
      ...bindTo(1, 0, crowd(1)[0], 0, 'tri', 'amber', 4),
      cap(1, 'Low dose: binds its target', SPEC, 1.4),
    ] },
    { id: 'spHi8', label: 'Specificity: high dose', group: 'spc', stay: true, drawn: false, items: [
      ...doseChips(1, SPEC, SP_IDS, ['Low dose', 'High dose'], 'spHi8'),
      ...bindTo(1, 0, crowd(1)[0], 0, 'tri', 'amber', 4),
      idle(crowd(1)[1], 'tri', 'amber'), idle(crowd(1)[3], 'tri', 'amber'),
      ...tryAndLeave(1, 1, crowd(1)[2], 0.8), ...tryAndLeave(1, 2, crowd(1)[4], 1.1),
      txt('✕ doesn\'t fit', rx3(1)[1], 560, 17, GREY, { align: 'center', bold: true, at: 1.9, anim: 'pop', duration: 0.3 }),
      txt('✕ doesn\'t fit', rx3(1)[2], 560, 17, GREY, { align: 'center', bold: true, at: 2.2, anim: 'pop', duration: 0.3 }),
      cap(1, 'High dose: STILL only its target', SPEC, 3.4),
    ] },
    // selectivity × dose: high selectivity only spills over to other receptors at a HIGH dose;
    // low selectivity hits them even at a LOW dose, and everything at a high dose
    { id: 'sHL8', label: 'High selectivity, low dose', group: 'sel', stay: true, drawn: false, items: [
      ...selGrid('sHL8'),
      ...bindTo(2, 0, crowd(2)[0], 0, 'blob', 'amber', 4),
      cap(2, 'Low dose: just its target → no side effects', SEL, 1.4),
    ] },
    { id: 'sHH8', label: 'High selectivity, high dose', group: 'sel', stay: true, drawn: false, items: [
      ...selGrid('sHH8'),
      ...bindTo(2, 0, crowd(2)[0], 0, 'blob', 'amber', 4),
      idle(crowd(2)[1], 'blob', 'amber'), idle(crowd(2)[3], 'blob', 'amber'),
      ...bindTo(2, 1, crowd(2)[2], 1.0, 'blob', 'amber', 1), ...bindTo(2, 2, crowd(2)[4], 1.4, 'blob', 'amber', 1),
      ...sideFx(2, [1, 2], 2.8),
      cap(2, 'High dose: starts binding others (weakly)', ANT, 3.1),
    ] },
    { id: 'sLL8', label: 'Low selectivity, low dose', group: 'sel', stay: true, drawn: false, items: [
      ...selGrid('sLL8'),
      ...bindTo(2, 0, crowd(2)[0], 0, 'blob', 'teal', 3), ...bindTo(2, 1, crowd(2)[2], 0.4, 'blob', 'teal', 3),
      ...sideFx(2, [1], 1.8),
      cap(2, 'Even a LOW dose hits other receptors', ANT, 2.0),
    ] },
    { id: 'sLH8', label: 'Low selectivity, high dose', group: 'sel', stay: true, drawn: false, items: [
      ...selGrid('sLH8'),
      idle(crowd(2)[1], 'blob', 'teal'), idle(crowd(2)[3], 'blob', 'teal'),
      ...[0, 1, 2].flatMap((k) => bindTo(2, k, [crowd(2)[0], crowd(2)[2], crowd(2)[4]][k], 0.1 + k * 0.2, 'blob', 'teal', 3)),
      ...sideFx(2, [1, 2], 1.8),
      cap(2, 'High dose: hits everything → MANY side effects', ANT, 2.0),
    ] },
  ];

  // ---------------------------------------------------------------- slide: agonists (full vs partial)
  const ST = { x0: 60, x1: 1000, y0: 190, top: 650, bot: 710, y1: 860 };
  const R9 = { x: 400, top: ST.top, s: 1.1 };
  const r9Dock = dockY(R9.top, R9.s);
  const G9 = { x: 860, y: 215, w: 120, h: 620 };
  const stage = (extra = '') => svgItem(panel(ST.x0, ST.x1, ST.y0, ST.top, ST.bot, ST.y1) + receptor(R9.x, R9.top, 'tri', 'blue', R9.s) + extra);
  const AG9 = tabsOf([{ id: 'full9', text: 'Full agonist', c: AGO }, { id: 'part9', text: 'Partial agonist', c: '#7a9a2a' }, { id: 'both9', text: 'Partial + full together', c: DARK }], 170, 400);
  const gaugeTrack = (keys, head = 'Response') => frameTrack(keys, ([v]) => gauge(G9.x, G9.y, G9.w, G9.h, v, head), 12);
  const L9 = [190, 340];
  const agoItems = [
    title('Agonists: full vs partial'),
    ...AG9.bar(null),
    stage(gauge(G9.x, G9.y, G9.w, G9.h, 0)),
    txt('Receptor', 120, 560, 21, DARK, { bold: true }),
    ...card(1030, 190, 510, 300, AGO, 'AGONIST', 'Binds a receptor AND switches it ON.\n\nBut not every agonist switches it\non by the same amount…'),
    ...card(1030, 510, 510, 350, DARK, 'HOW MUCH RESPONSE?', 'Full agonist → the MAXIMUM\nresponse the receptor can give.\n\nPartial agonist → only PART of it,\neven when every receptor is bound.'),
    ...AG9.hot,
  ];
  const sideCard = (c, head, body) => card(1030, 190, 510, 670, c, head, body, 22);
  const PCOL = '#7a9a2a';
  const agoActions = [
    { id: 'full9', label: 'Full agonist', group: 'ag9', stay: true, drawn: false, items: [
      ...AG9.bar('full9'),
      ...track([[0, ...L9], [1.3, R9.x, r9Dock], [30, R9.x, r9Dock]], ([x, y]) => ligand('tri', x, y, 'amber', 1, R9.s) + tagOver(x, y, 'Full agonist', '#a8640a', 125)),
      { ...svgItem(contacts(R9.x, R9.top, 'tri', 4, R9.s) + glow(R9.x, R9.top, R9.s, 1, 'FULLY ON')), at: 1.4, duration: 0.3 },
      { type: 'pulse', x: R9.x, y: R9.top + 160, r: 44, color: '#3ccf6e', speed: 1.0, at: 1.6 },
      ...gaugeTrack([[0, 0], [1.5, 0], [3.0, 1], [30, 1]]),
      ...sideCard(AGO, 'FULL AGONIST', 'Binds and switches the receptor\nFULLY on.\n\n→ The biggest response the\nreceptor can give.\n\nExamples:\n• Your own neurotransmitters\n   (usually full agonists)\n• Morphine at opioid receptors'),
    ] },
    { id: 'part9', label: 'Partial agonist', group: 'ag9', stay: true, drawn: false, items: [
      ...AG9.bar('part9'),
      ...track([[0, ...L9], [1.3, R9.x, r9Dock], [30, R9.x, r9Dock]], ([x, y]) => ligand('tri', x, y, 'pale', 1, R9.s) + tagOver(x, y, 'Partial agonist', PCOL, 125)),
      { ...svgItem(contacts(R9.x, R9.top, 'tri', 4, R9.s) + glow(R9.x, R9.top, R9.s, 0.4, 'PARTLY ON', PCOL)), at: 1.4, duration: 0.3 },
      { type: 'pulse', x: R9.x, y: R9.top + 160, r: 26, color: '#b5d88a', speed: 1.6, at: 1.6 },
      ...gaugeTrack([[0, 0], [1.5, 0], [3.0, 0.4], [30, 0.4]]),
      ...sideCard(PCOL, 'PARTIAL AGONIST', 'Binds and switches the receptor\nonly PARTLY on.\n\n→ A smaller response, even when\nevery receptor is bound.\n\nExample:\n• Buprenorphine at opioid\n   receptors'),
    ] },
    { id: 'both9', label: 'Partial + full together', group: 'ag9', stay: true, drawn: false, items: [
      ...AG9.bar('both9'),
      ...track([[0, ...L9], [1.3, R9.x, r9Dock], [30, R9.x, r9Dock]], ([x, y]) => ligand('tri', x, y, 'pale', 1, R9.s) + tagOver(x, y, 'Partial agonist', PCOL, 125)),
      { ...svgItem(contacts(R9.x, R9.top, 'tri', 4, R9.s) + glow(R9.x, R9.top, R9.s, 0.4, 'PARTLY ON', PCOL)), at: 1.4, duration: 0.3 },
      ...gaugeTrack([[0, 0], [1.5, 0], [3.0, 0.4], [30, 0.4]]),
      ...track([[0, 690, 340], [2.6, 690, 340], [3.8, R9.x + 20, R9.top - 131 * R9.s - 70], [4.4, R9.x + 20, R9.top - 131 * R9.s - 70], [5.3, 690, 360], [30, 690, 360]], ([x, y]) => ligand('tri', x, y, 'amber', 1, R9.s) + tagOver(x, y, 'Full agonist', '#a8640a', 125)),
      txt('Spot taken: the full agonist\ncan\'t get in', 680, 570, 20, ANT, { align: 'center', bold: true, at: 4.2, anim: 'fade', duration: 0.4 }),
      ...sideCard(DARK, 'PARTIAL + FULL TOGETHER', 'The partial agonist takes the spot,\nso the full agonist can\'t bind.\n\n→ The response is CAPPED at the\npartial level.\n\nSo a partial agonist can also BLOCK\na full agonist. That\'s why\nbuprenorphine is used to treat\nopioid addiction.'),
    ] },
  ];

  // ---------------------------------------------------------------- slide: antagonists (competitive vs noncompetitive)
  const AN = tabsOf([{ id: 'comp10', text: 'Competitive', c: ANT }, { id: 'non10', text: 'Noncompetitive', c: '#8e1d14' }], 300, 480);
  const SIDE = sideAt(R9.x, R9.top, R9.s);
  const antItems = [
    title('Antagonists'),
    ...AN.bar(null),
    stage(sideSite(R9.x, R9.top, R9.s) + gauge(G9.x, G9.y, G9.w, G9.h, 0)),
    { type: 'line', from: [575, 432], to: [SIDE[0] + 10, SIDE[1] - 16], color: DARK, width: 2.5, rough: false },
    txt('a second site', 580, 418, 20, DARK, { bold: true }),
    ...card(1030, 190, 510, 470, ANT, 'ANTAGONIST', 'Binds the receptor but does NOT\nswitch it on.\n\nWhile it\'s there, agonists can\'t\nwork, so it BLOCKS them.\n\nTwo main ways to block →'),
    ...card(1030, 680, 510, 180, '#8a8f98', 'REVERSIBLE vs IRREVERSIBLE', 'Reversible: lets go again (most drugs)\nIrreversible: binds for good, so the\ncell has to make new receptors', 19),
    ...AN.hot,
  ];
  const hoverY = R9.top - 131 * R9.s - 60;
  const antActions = [
    { id: 'comp10', label: 'Competitive antagonist', group: 'an10', stay: true, drawn: false, items: [
      ...AN.bar('comp10'),
      ...track([[0, ...L9], [1.3, R9.x, r9Dock], [4.8, R9.x, r9Dock], [5.8, 150, 330], [30, 150, 330]], ([x, y]) => antag(x, y, R9.s) + tagOver(x, y, 'Antagonist', ANT, 125)),
      ...track([[0, 690, 290], [1.6, 690, 290], [2.6, R9.x + 10, hoverY], [3.1, R9.x + 10, hoverY], [4.0, 720, 330], [30, 720, 330]], ([x, y]) => ligand('tri', x, y, 'amber', 1, R9.s)),
      txt('Add MORE agonist…', 690, 230, 22, '#a8640a', { align: 'center', bold: true, at: 3.9, anim: 'fade', duration: 0.3 }),
      ...[[540, 300], [300, 260], [430, 250]].flatMap(([x, y], i) => track([[0, x + 400, y], [3.9, x + 400, y], [4.7 + i * 0.1, x, y], [30, x, y]], ([px, py]) => ligand('tri', px, py, 'amber', 1, R9.s * 0.9))),
      ...track([[0, 720, 330], [5.0, 720, 330], [6.0, R9.x, r9Dock], [30, R9.x, r9Dock]], ([x, y]) => ligand('tri', x, y, 'amber', 1, R9.s)),
      { ...svgItem(contacts(R9.x, R9.top, 'tri', 4, R9.s) + glow(R9.x, R9.top, R9.s)), at: 6.1, duration: 0.3 },
      ...gaugeTrack([[0, 0], [6.1, 0], [7.4, 1], [30, 1]]),
      txt('…and the agonist wins:\nthe block is overcome', 640, 790, 21, AGO, { align: 'center', bold: true, at: 6.6, anim: 'fade', duration: 0.4 }),
      ...card(1030, 190, 510, 470, ANT, 'COMPETITIVE', 'Fights the agonist for the SAME spot.\nWhichever there\'s more of wins.\n\n→ Enough agonist can overcome it.\n\nExample: naloxone pushes opioids\noff their receptors, reversing an\noverdose.'),
    ] },
    { id: 'non10', label: 'Noncompetitive antagonist', group: 'an10', stay: true, drawn: false, items: [
      ...AN.bar('non10'),
      ...track([[0, 700, 300], [1.3, ...SIDE], [30, ...SIDE]], ([x, y]) => ball(x, y, R9.s, '#f6a3a3', '#d9534f', '#8e1d14') + tagRight(x, y, 'Antagonist', ANT)),
      { ...svgItem(`<polygon points="${R9.x - 37 * R9.s},${R9.top - 131 * R9.s} ${R9.x + 37 * R9.s},${R9.top - 131 * R9.s} ${R9.x},${R9.top - 77 * R9.s}" fill="none" stroke="${ANT}" stroke-width="5" stroke-dasharray="7 5"/>`), at: 1.5, duration: 0.3 },
      txt('changes the\nreceptor\'s shape', 700, 330, 20, ANT, { align: 'center', bold: true, at: 1.5, anim: 'fade', duration: 0.3 }),
      ...track([[0, ...L9], [2.0, ...L9], [3.2, R9.x, r9Dock], [30, R9.x, r9Dock]], ([x, y]) => ligand('tri', x, y, 'amber', 1, R9.s) + tagOver(x, y, 'Agonist', '#a8640a', 125)),
      { ...svgItem(offBadge(R9.x, R9.top, R9.s)), at: 3.4, duration: 0.3 },
      ...gaugeTrack([[0, 0], [30, 0]]),
      txt('More agonist doesn\'t help:\nthe receptor stays OFF', 640, 790, 21, ANT, { align: 'center', bold: true, at: 3.8, anim: 'fade', duration: 0.4 }),
      ...card(1030, 190, 510, 470, '#8e1d14', 'NONCOMPETITIVE', 'Binds a DIFFERENT site and changes\nthe receptor\'s shape, so the agonist\ncan\'t switch it on.\n\n→ Adding more agonist doesn\'t\nhelp: you can\'t out-compete it.\n\nExample: ketamine at NMDA\nreceptors.'),
    ] },
  ];

  // ---------------------------------------------------------------- slide: allosteric modulators
  const AM = tabsOf([{ id: 'g11', text: 'GABA alone', c: '#a8640a' }, { id: 'gb11', text: 'GABA + benzodiazepine', c: MOD }, { id: 'b11', text: 'Benzodiazepine alone', c: DARK }], 170, 400);
  const GABA0 = [190, 340], BZ0 = [700, 300];
  const gabaIn = (t0 = 0) => [
    ...track([[0, ...GABA0], [t0, ...GABA0], [t0 + 1.3, R9.x, r9Dock], [30, R9.x, r9Dock]], ([x, y]) => ligand('tri', x, y, 'amber', 1, R9.s) + tagOver(x, y, 'GABA', '#a8640a', 125)),
    { ...svgItem(contacts(R9.x, R9.top, 'tri', 4, R9.s)), at: t0 + 1.35, duration: 0.2 },
  ];
  const bzIn = (t0 = 0) => track([[0, ...BZ0], [t0, ...BZ0], [t0 + 1.2, ...SIDE], [30, ...SIDE]], ([x, y]) => ball(x, y, R9.s) + tagRight(x, y, 'Benzodiazepine', MOD));
  const modItems = [
    title('Allosteric modulators'),
    ...AM.bar(null),
    stage(sideSite(R9.x, R9.top, R9.s) + gauge(G9.x, G9.y, G9.w, G9.h, 0, 'Calming')),
    txt('GABA-A\nreceptor', 120, 560, 21, DARK, { bold: true }),
    { type: 'line', from: [575, 432], to: [SIDE[0] + 10, SIDE[1] - 16], color: DARK, width: 2.5, rough: false },
    txt('allosteric site', 580, 418, 20, DARK, { bold: true }),
    ...card(1030, 190, 510, 400, MOD, 'ALLOSTERIC MODULATOR', 'Binds a DIFFERENT site from the\nnormal ligand (allo = other) and\nturns the receptor\'s response\nUP or DOWN.\n\n▲ Positive modulator: boosts it\n▼ Negative modulator: dampens it'),
    ...card(1030, 610, 510, 250, '#a8640a', 'EXAMPLE', 'Benzodiazepines (e.g. diazepam)\nboost GABA, the brain\'s main\ncalming signal. On their own,\nthey do almost nothing.', 20),
    ...AM.hot,
  ];
  const modActions = [
    { id: 'g11', label: 'GABA alone', group: 'am11', stay: true, drawn: false, items: [
      ...AM.bar('g11'), ...gabaIn(0),
      { ...svgItem(glow(R9.x, R9.top, R9.s, 0.55)), at: 1.45, duration: 0.3 },
      ...gaugeTrack([[0, 0], [1.5, 0], [2.8, 0.45], [30, 0.45]], 'Calming'),
      txt('Normal calming signal', 640, 790, 21, '#a8640a', { align: 'center', bold: true, at: 2.2, anim: 'fade', duration: 0.4 }),
    ] },
    { id: 'gb11', label: 'GABA + benzodiazepine', group: 'am11', stay: true, drawn: false, items: [
      ...AM.bar('gb11'), ...bzIn(0), ...gabaIn(1.4),
      { ...svgItem(glow(R9.x, R9.top, R9.s, 1.15, 'BOOSTED', MOD)), at: 2.85, duration: 0.3 },
      { type: 'pulse', x: R9.x, y: R9.top + 160, r: 46, color: '#b48ef0', speed: 0.9, at: 3.0 },
      ...gaugeTrack([[0, 0], [2.9, 0], [4.3, 0.95], [30, 0.95]], 'Calming'),
      txt('Same GABA, much BIGGER effect', 640, 790, 21, MOD, { align: 'center', bold: true, at: 3.4, anim: 'fade', duration: 0.4 }),
    ] },
    { id: 'b11', label: 'Benzodiazepine alone', group: 'am11', stay: true, drawn: false, items: [
      ...AM.bar('b11'), ...bzIn(0),
      ...gaugeTrack([[0, 0], [30, 0]], 'Calming'),
      txt('No GABA → (almost) no effect:\nit only boosts what\'s already there', 640, 790, 21, DARK, { align: 'center', bold: true, at: 1.6, anim: 'fade', duration: 0.4 }),
    ] },
  ];

  // ---------------------------------------------------------------- slides: enzymes, transporters, ion channels
  // One slide per non-receptor target. Same shape on each: what it normally does → what the drug does → the effect.
  const STG = () => svgItem(rr(60, 190, 940, 670, '#d9dce3', '#fbfcfe', 2));
  const GT3 = { x: 860, y: 215, w: 120, h: 620 };
  const meter3 = (keys, head) => frameTrack(keys, ([v]) => gauge(GT3.x, GT3.y, GT3.w, GT3.h, v, head), 12);
  const sol = (items) => items.map((it) => ({ ...it, solid: true }));
  const topCard = (c, head, body) => sol(card(1030, 190, 510, 330, c, head, body, 19));
  const exCard = (c, body) => card(1030, 540, 510, 320, c, 'EXAMPLES', body, 18);
  const pill = (cx, cy, s = 0.5) => capsule(cx, cy, s, 0);

  // ---- enzymes ----
  const EZ = { cx: 380, cy: 480 };
  const SITE = [EZ.cx + 178, EZ.cy];
  const enzymeBig = `<ellipse cx="${EZ.cx}" cy="${EZ.cy}" rx="190" ry="140" fill="#f4c995" stroke="#b67d3c" stroke-width="5"/>
    <circle cx="${SITE[0] + 12}" cy="${SITE[1]}" r="50" fill="#fbfcfe" stroke="#b67d3c" stroke-width="5"/><rect x="${SITE[0] + 18}" y="${SITE[1] - 60}" width="70" height="120" fill="#fbfcfe"/>
    ${T(EZ.cx - 40, EZ.cy + 10, 34, '#8a5a22')('ENZYME')}${T(SITE[0] - 4, SITE[1] + 82, 16, '#8a5a22')('active site')}
    <circle cx="590" cy="250" r="12" fill="#f6c45a" stroke="#a8640a" stroke-width="3"/>${T(610, 256, 17, INK, 700, 'start')('starting molecule')}
    <circle cx="590" cy="800" r="9" fill="${ANT}"/>${T(610, 806, 17, INK, 700, 'start')('product')}`;
  const subIn = (k) => ({ type: 'mover', path: [[700 - k * 30, 290 + k * 10], [SITE[0] + 10, SITE[1] - 6]], r: 12, color: '#f0a12e', count: 1, speed: 1.6 + k * 0.4 });
  const prodOut = (k) => ({ type: 'mover', path: [[SITE[0] + 10, SITE[1] + 6], [700 - k * 30, 740 - k * 10]], r: 9, color: ANT, count: 1, speed: 1.6 + k * 0.4 });
  const subBounce = (k) => ({ type: 'mover', path: [[700 - k * 40, 290 + k * 20], [SITE[0] + 70, SITE[1] - 70], [720 - k * 40, 300 + k * 20]], r: 12, color: '#f0a12e', count: 1, speed: 1.8 + k * 0.5 });
  const lock = (x, y) => `<rect x="${x - 14}" y="${y - 2}" width="28" height="22" rx="4" fill="${ANT}"/><path d="M ${x - 9} ${y - 2} v -8 a 9 9 0 0 1 18 0 v 8" fill="none" stroke="${ANT}" stroke-width="4"/>`;
  const EN = tabsOf([{ id: 'en14', text: 'Normal', c: ENDO }, { id: 'rev14', text: 'Reversible inhibitor', c: '#e8890c' }, { id: 'irr14', text: 'Irreversible inhibitor', c: ANT }], 170, 400);
  const enzItems = [
    title('Drugs that act on enzymes'),
    ...EN.bar(null),
    STG(), svgItem(enzymeBig + gauge(GT3.x, GT3.y, GT3.w, GT3.h, 0, 'Product made')),
    ...card(1030, 190, 510, 330, '#b5694a', 'ENZYMES', 'Proteins that speed up chemical\nreactions: they turn a starting\nmolecule into a product.\n\nMany drugs are enzyme INHIBITORS:\nthey block the enzyme, so less\nproduct is made.', 19),
    ...exCard('#b5694a', '• Statins: block the enzyme that\n   makes cholesterol\n• ACE inhibitors (e.g. ramipril): less\n   of a vessel-tightening hormone\n   → lower blood pressure\n• NSAIDs and aspirin: block COX\n   → less pain and inflammation'),
    ...EN.hot,
  ];
  const enzActions = [
    { id: 'en14', label: 'Normal', group: 'en', stay: true, drawn: false, items: [
      ...sol(EN.bar('en14')),
      ...[0, 1, 2].flatMap((k) => [subIn(k), prodOut(k)]),
      ...meter3([[0, 0], [2.5, 0.9], [30, 0.9]], 'Product made'),
      ...topCard(ENDO, 'NORMALLY', 'The enzyme grabs the starting\nmolecule, changes it, and lets\nthe product go, over and over.\n\nLots of product is made.'),
    ] },
    { id: 'rev14', label: 'Reversible inhibitor', group: 'en', stay: true, drawn: false, items: [
      ...sol(EN.bar('rev14')),
      ...track([[0, 640, 420], [0.9, ...SITE], [2.6, ...SITE], [3.4, 640, 420], [4.4, 640, 420], [5.3, ...SITE], [7.0, ...SITE], [7.8, 640, 420], [8.8, 640, 420], [9.7, ...SITE], [30, ...SITE]], ([x, y]) => pill(x, y)),
      subBounce(0), subIn(1), prodOut(1),
      ...meter3([[0, 0], [2.5, 0.35], [30, 0.35]], 'Product made'),
      txt('binds… lets go… binds again', 400, 760, 20, '#e8890c', { align: 'center', bold: true, at: 1.2, anim: 'fade', duration: 0.3 }),
      ...topCard('#e8890c', 'REVERSIBLE INHIBITOR', 'Binds the enzyme, then lets go.\nLike a competitive antagonist:\nlots of starting molecule can\npush it out.\n\nThe effect wears off as the drug\nis removed. e.g. statins, ibuprofen'),
    ] },
    { id: 'irr14', label: 'Irreversible inhibitor', group: 'en', stay: true, drawn: false, items: [
      ...sol(EN.bar('irr14')),
      ...track([[0, 640, 420], [0.9, ...SITE], [30, ...SITE]], ([x, y]) => pill(x, y)),
      { ...svgItem(lock(SITE[0] + 2, SITE[1] - 44)), at: 1.1, duration: 0.3 },
      subBounce(0), subBounce(1), subBounce(2),
      ...meter3([[0, 0], [30, 0]], 'Product made'),
      txt('locked on for good: this enzyme is\nuseless until the body makes a new one', 400, 760, 20, ANT, { align: 'center', bold: true, at: 1.3, anim: 'fade', duration: 0.3 }),
      ...topCard(ANT, 'IRREVERSIBLE INHIBITOR', 'Locks onto the enzyme for good.\nThe effect lasts until the body\nmakes NEW enzyme, long after\nthe drug is gone.\n\ne.g. aspirin: platelets can\'t make\nnew COX, so one dose lasts ~a week'),
    ] },
  ];

  // ---- transporters ----
  const SY = { top: 380, post: 560, tr: 520 };
  const synapse = `<path d="M 100 200 L 640 200 L 640 ${SY.top - 40} Q 640 ${SY.top} 600 ${SY.top} L 140 ${SY.top} Q 100 ${SY.top} 100 ${SY.top - 40} Z" fill="#efe6fb" stroke="#7b3fd0" stroke-width="4"/>
    ${T(130, 235, 19, '#4a1f8a', 700, 'start')('nerve ending')}
    <circle cx="280" cy="300" r="34" fill="#ffffff" stroke="#a77be8" stroke-width="3"/>${[[268, 290], [292, 296], [276, 312], [294, 316]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="7" fill="#f6c45a" stroke="#a8640a" stroke-width="2"/>`).join('')}
    <rect x="${SY.tr - 28}" y="${SY.top - 44}" width="56" height="74" rx="16" fill="#c9a8f2" stroke="#4a1f8a" stroke-width="4"/><rect x="${SY.tr - 7}" y="${SY.top - 44}" width="14" height="74" fill="#efe6fb" stroke="#4a1f8a" stroke-width="2.5"/>
    ${T(SY.tr + 40, SY.top - 54, 16, '#4a1f8a', 700, 'start')('transporter')}
    ${T(600, 520, 17, GREY)('the gap (synapse)')}
    <rect x="100" y="${SY.post}" width="540" height="140" rx="20" fill="#e6f0fb" stroke="#2c5a92" stroke-width="4"/>${T(130, SY.post + 112, 19, '#2c5a92', 700, 'start')('next nerve')}
    ${[220, 330, 440].map((x) => receptor(x, SY.post + 8, 'round', 'green', 0.38)).join('')}
    <circle cx="140" cy="790" r="9" fill="#f6c45a" stroke="#a8640a" stroke-width="2.5"/>${T(158, 796, 16, INK, 700, 'start')('serotonin')}`;
  const SG3 = { x0: 700, x1: 960, y0: 600, y1: 800 };
  const sigGraph = (kind, u = 1) => {
    const p = plot(SG3), f = (t) => (kind === 'long' ? 0.9 * (1 - Math.exp(-t * 3)) * Math.exp(-Math.max(0, t - 0.55) * 0.6) : 0.85 * (1 - Math.exp(-t * 5)) * Math.exp(-t * 4));
    const pts = []; for (let t = 0; t <= u + 1e-6; t += 0.01) pts.push(`${f1(p.x(t))},${f1(p.y(f(t)))}`);
    return `${rr(680, 540, 300, 300, '#d9dce3', '#ffffff', 2, 12)}${T(830, 572, 17, DARK)('Signal over time')}
      <line x1="${SG3.x0}" y1="${SG3.y1}" x2="${SG3.x1}" y2="${SG3.y1}" stroke="${DARK}" stroke-width="2.5"/><line x1="${SG3.x0}" y1="${SG3.y1}" x2="${SG3.x0}" y2="${SG3.y0 - 6}" stroke="${DARK}" stroke-width="2.5"/>
      ${pts.length > 1 ? `<polyline points="${pts.join(' ')}" fill="none" stroke="${kind === 'long' ? PD : ENDO}" stroke-width="5" stroke-linejoin="round"/>` : ''}
      ${T(830, 826, 16, kind === 'long' ? PD : ENDO)(kind === 'long' ? 'stronger, lasts longer' : 'short')}`;
  };
  const release = (k) => ({ type: 'mover', path: [[280, 330], [300 + k * 40, 470], [220 + k * 110, SY.post - 30], [SY.tr - 20, 440], [SY.tr, SY.top + 10], [SY.tr, SY.top - 50]], r: 9, color: '#f0a12e', count: 1, speed: 2.4 + k * 0.4 });
  const stuck = (k) => ({ type: 'mover', path: [[280, 330], [240 + k * 60, 470], [220 + k * 110, SY.post - 30], [470 - k * 80, 450], [180 + k * 120, 500], [240 + k * 60, 470]], r: 9, color: '#f0a12e', count: 1, speed: 2.8 + k * 0.4 });
  const stomach = `<rect x="62" y="192" width="936" height="666" fill="#fbfcfe"/>
    <rect x="100" y="210" width="740" height="230" rx="18" fill="#fde6cf" stroke="#d0630b" stroke-width="3"/>${T(130, 245, 19, '#a64e08', 700, 'start')('Inside the stomach (acid)')}
    <rect x="100" y="440" width="740" height="260" rx="18" fill="#f8dce3" stroke="#c2566b" stroke-width="3"/>${T(130, 680, 19, '#9c2a45', 700, 'start')('Stomach-lining cell')}
    <rect x="420" y="400" width="84" height="84" rx="20" fill="#f6b48f" stroke="#b5560e" stroke-width="4"/>${T(462, 448, 15, '#7a3a08')('acid')}${T(462, 466, 15, '#7a3a08')('pump')}
    ${[[200, 300], [300, 340], [620, 290], [720, 350], [560, 360]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="15" fill="#ffb3a7" stroke="${ANT}" stroke-width="2.5"/>${T(a, b + 5, 13, '#8e1d14')('H⁺')}`).join('')}`;
  const TR = tabsOf([{ id: 'tn15', text: 'Normal', c: ENDO }, { id: 'ssri15', text: 'Reuptake blocked (SSRI)', c: PD }, { id: 'ppi15', text: 'Acid pump blocked (PPI)', c: '#d0630b' }], 170, 400);
  const transItems = [
    title('Drugs that act on transporters'),
    ...TR.bar(null),
    STG(), svgItem(synapse + sigGraph('short', 0)),
    ...card(1030, 190, 510, 330, PD, 'TRANSPORTERS', 'Proteins that MOVE things across\ncell membranes:\n• reuptake transporters pull a\n   chemical back into a cell\n• pumps push things out, using\n   energy\nDrugs usually BLOCK them.', 19),
    ...exCard(PD, '• SSRIs (e.g. fluoxetine): block\n   serotonin reuptake → depression,\n   anxiety\n• PPIs (e.g. omeprazole): block the\n   stomach\'s acid pump → reflux, ulcers\n• Digoxin: blocks the Na⁺/K⁺ pump\n   in heart cells'),
    ...TR.hot,
  ];
  const transActions = [
    { id: 'tn15', label: 'Normal', group: 'tr', stay: true, drawn: false, items: [
      ...sol(TR.bar('tn15')), release(0), release(1), release(2),
      ...frameTrack([[0, 0], [2.5, 1], [30, 1]], ([u]) => sigGraph('short', u), 12),
      ...topCard(ENDO, 'NORMALLY', 'Serotonin is released, switches\non the next nerve\'s receptors,\nthen the transporter pulls it\nback in.\n\n→ the signal is SHORT.'),
    ] },
    { id: 'ssri15', label: 'SSRI', group: 'tr', stay: true, drawn: false, items: [
      ...sol(TR.bar('ssri15')),
      { ...svgItem(pill(SY.tr, SY.top + 20, 0.42)), at: 0, duration: 0.3 },
      stuck(0), stuck(1), stuck(2),
      ...frameTrack([[0, 0], [2.5, 1], [30, 1]], ([u]) => sigGraph('long', u), 12),
      txt('can\'t get back in', SY.tr + 40, SY.top + 30, 17, PD, { align: 'left', bold: true, at: 0.6, anim: 'fade', duration: 0.3 }),
      ...topCard(PD, 'SSRI', 'The transporter is blocked, so\nserotonin stays in the gap longer\n→ a stronger, longer signal.\n\ne.g. fluoxetine, sertraline\n(Cocaine blocks the dopamine\ntransporter the same way.)'),
    ] },
    { id: 'ppi15', label: 'PPI', group: 'tr', stay: true, drawn: false, items: [
      ...sol(TR.bar('ppi15')),
      svgItem(stomach, { solid: true }),
      ...[0, 1, 2].map((k) => ({ type: 'mover', path: [[462, 640], [462, 440], [400 + k * 60, 300]], r: 14, color: '#ff8f80', count: 1, speed: 1.0 + k * 0.2, until: 1.6 })),
      ...track([[0, 640, 560], [1.4, 462, 442], [30, 462, 442]], ([x, y]) => pill(x, y, 0.45)),
      { ...svgItem(`<rect x="${GT3.x - 2}" y="${GT3.y - 2}" width="${GT3.w + 4}" height="${GT3.h + 4}" fill="#fbfcfe"/>`), solid: true },
      ...meter3([[0, 0.85], [1.6, 0.85], [3.4, 0.2], [30, 0.2]], 'Stomach acid'),
      txt('pump switched off → much less acid', 470, 760, 20, '#d0630b', { align: 'center', bold: true, at: 2.0, anim: 'fade', duration: 0.3 }),
      ...topCard('#d0630b', 'PROTON PUMP INHIBITOR', 'Cells in the stomach lining pump\nacid (H⁺) into the stomach.\nPPIs switch this pump off\n→ much less acid.\n\ne.g. omeprazole, lansoprazole\n(reflux, stomach ulcers)'),
    ] },
  ];

  // ---- ion channels ----
  const NV = { x0: 150, x1: 840, y: 430, h: 70 };
  const axonChannels = (blockFrom = 0, blockTo = 0) => {
    let out = '';
    for (let x = NV.x0 + 40; x <= NV.x1 - 30; x += 70) {
      const blocked = x >= blockFrom && x <= blockTo;
      for (const y of [NV.y - NV.h / 2 - 6, NV.y + NV.h / 2 - 8]) {
        out += `<rect x="${x - 10}" y="${y}" width="20" height="14" rx="4" fill="#62b067" stroke="#2e7d32" stroke-width="2"/>`;
        if (blocked) out += `<rect x="${x - 7}" y="${y + 2}" width="14" height="10" rx="3" fill="${ANT}"/>`;
      }
    }
    return out;
  };
  const nerve = (block) => `<rect x="62" y="192" width="936" height="666" fill="#fbfcfe"/>
    <rect x="${NV.x0}" y="${NV.y - NV.h / 2}" width="${NV.x1 - NV.x0}" height="${NV.h}" rx="${NV.h / 2}" fill="#fde9b8" stroke="#c89a3a" stroke-width="4"/>
    ${block ? `<rect x="440" y="${NV.y - 90}" width="200" height="180" rx="16" fill="#9fc0ef" opacity="0.28"/>${T(540, NV.y - 104, 17, '#2c5a92')('lidocaine injected here')}` : ''}
    ${axonChannels(block ? 440 : 0, block ? 640 : 0)}
    <path d="M 110 ${NV.y - 22} l 14 14 l -14 8 l 18 16" fill="none" stroke="${ANT}" stroke-width="4"/>${T(110, NV.y + 80, 17, ANT)('pain at')}${T(110, NV.y + 100, 17, ANT)('the finger')}
    <ellipse cx="900" cy="${NV.y}" rx="62" ry="50" fill="#f6c6cf" stroke="#c2566b" stroke-width="4"/>${T(900, NV.y + 6, 17, '#9c2a45')('brain')}
    ${T(495, NV.y + 92, 16, '#2e7d32')('Na⁺ channels along the nerve')}`;
  const VC = { cx: 360, cy: 520 };
  const vessel = (u) => {
    const lumen = 62 + 58 * u, outer = 182 + 6 * u;
    return `<rect x="62" y="192" width="936" height="666" fill="#fbfcfe"/>
      <circle cx="${VC.cx}" cy="${VC.cy}" r="${f1(outer)}" fill="#f2b8a0" stroke="#b5694a" stroke-width="5"/>
      <circle cx="${VC.cx}" cy="${VC.cy}" r="${f1(lumen)}" fill="#e0505a" stroke="#8e1d24" stroke-width="4"/>
      ${T(VC.cx, VC.cy + 6, 18, '#ffffff')('blood')}
      ${T(VC.cx, VC.cy - outer - 18, 18, '#8a3a1a')('muscle in the vessel wall')}
      ${T(VC.cx, VC.cy + outer + 34, 20, u > 0.5 ? ENDO : ANT)(u > 0.5 ? 'relaxed → WIDER' : 'squeezed → NARROW')}`;
  };
  const CN = tabsOf([{ id: 'nn16', text: 'Nerve: normal', c: ENDO }, { id: 'lido16', text: 'Nerve + lidocaine', c: '#2c5a92' }, { id: 'ccb16', text: 'Calcium channel blocker', c: ANT }], 170, 400);
  const pulse = (to, speed) => ({ type: 'mover', path: [[NV.x0 + 10, NV.y], [to, NV.y]], r: 16, color: '#ffcf3d', count: 1, speed });
  const chanItems = [
    title('Drugs that act on ion channels'),
    ...CN.bar(null),
    svgItem(nerve(false)),
    ...card(1030, 190, 510, 330, ENDO, 'ION CHANNELS', 'Pores that let ions (Na⁺, K⁺, Ca²⁺,\nCl⁻) flow across a membrane\n→ electrical signals in nerves,\nheart and muscle.\n\nDrugs can BLOCK them (most\ncommon) or help OPEN them.', 19),
    ...exCard(ENDO, '• Lidocaine: blocks Na⁺ channels\n   → numbness\n• Amlodipine: blocks Ca²⁺ channels\n   → lower blood pressure\n• Some anti-epileptics block Na⁺\n   channels → calm overactive nerves\n• Benzodiazepines OPEN the GABA-A\n   Cl⁻ channel more (slide 13)'),
    ...CN.hot,
  ];
  const chanActions = [
    { id: 'nn16', label: 'Nerve: normal', group: 'ch', stay: true, drawn: false, items: [
      ...sol(CN.bar('nn16')), svgItem(nerve(false), { solid: true }),
      pulse(NV.x1 + 40, 2.0),
      { type: 'pulse', x: 900, y: NV.y, r: 66, color: '#e0606a', speed: 1.2, at: 1.8 },
      txt('OUCH! the brain feels it', 900, NV.y - 84, 19, ANT, { align: 'center', bold: true, at: 1.9, anim: 'pop', duration: 0.3 }),
      ...topCard(ENDO, 'NORMALLY', 'Na⁺ channels open one after\nanother along the nerve, passing\nthe signal (e.g. pain) all the way\nto the brain.'),
    ] },
    { id: 'lido16', label: 'Nerve + lidocaine', group: 'ch', stay: true, drawn: false, items: [
      ...sol(CN.bar('lido16')), svgItem(nerve(true), { solid: true }),
      pulse(440, 1.3),
      txt('✕ signal stops here', 440, NV.y + 130, 19, '#2c5a92', { align: 'center', bold: true, at: 1.2, anim: 'fade', duration: 0.3 }),
      txt('no pain felt\n(numb)', 900, NV.y - 100, 19, '#2c5a92', { align: 'center', bold: true, at: 1.4, anim: 'fade', duration: 0.3 }),
      ...topCard('#2c5a92', 'LIDOCAINE (Na⁺ BLOCKER)', 'Plugs the Na⁺ channels where it\'s\ninjected. The signal can\'t get past,\nso the brain never hears about\nthe pain → numb.\n\nUsed for dental work, stitches,\nsmall operations.'),
    ] },
    { id: 'ccb16', label: 'Calcium channel blocker', group: 'ch', stay: true, drawn: false, items: [
      ...sol(CN.bar('ccb16')),
      ...frameTrack([[0, 0], [1.8, 0], [3.8, 1], [30, 1]], ([u]) => vessel(u), 12),
      ...[0, 1, 2, 3].map((k) => ({ type: 'mover', path: [[VC.cx + Math.cos(k * 1.57 + 0.6) * 260, VC.cy + Math.sin(k * 1.57 + 0.6) * 260], [VC.cx + Math.cos(k * 1.57 + 0.6) * 120, VC.cy + Math.sin(k * 1.57 + 0.6) * 120]], r: 12, color: '#9fd0f0', count: 1, speed: 0.9, until: 1.7 })),
      txt('Ca²⁺ flows in → the muscle squeezes', VC.cx, 240, 18, '#2c5a92', { align: 'center', bold: true, at: 0.1, anim: 'fade', duration: 0.3, until: 1.7 }),
      ...[0, 1, 2, 3].map((k) => ({ ...svgItem(pill(VC.cx + Math.cos(k * 1.57 + 0.6) * 205, VC.cy + Math.sin(k * 1.57 + 0.6) * 205, 0.3)), at: 1.5, duration: 0.3 })),
      txt('blocker added → Ca²⁺ can\'t get in', VC.cx, 240, 18, ANT, { align: 'center', bold: true, at: 1.8, anim: 'fade', duration: 0.3 }),
      ...meter3([[0, 0.8], [1.8, 0.8], [3.8, 0.5], [30, 0.5]], 'Blood pressure'),
      ...topCard(ANT, 'CALCIUM CHANNEL BLOCKER', 'Ca²⁺ flowing into the muscle in\nblood-vessel walls makes it\nsqueeze. Block it → the muscle\nrelaxes → the vessel WIDENS\n→ blood pressure falls.\n\ne.g. amlodipine'),
    ] },
  ];

  // ---------------------------------------------------------------- slide: dose–response curve
  const GD = { x0: 170, x1: 940, y0: 230, y1: 740 };
  const pD = plot(GD);
  const doseTicks = (G) => { const p = plot(G); return ['0.1', '1', '10', '100', '1000'].map((t, i) => T(p.x(i / 4), G.y1 + 26, 16, GREY)(t)).join(''); };
  const ZONES = [[0, 0.3, 'little effect', '#8a8f98'], [0.3, 0.7, 'steep part', '#e8890c'], [0.7, 1, 'levels off (max)', AGO]];
  const drGraph = (u) => {
    const E = sig(Math.min(u, 1), 0.5);
    return `${rr(60, 112, 940, 748, '#d9dce3', '#ffffff', 2)}${T(530, 165, 26, INK)('Dose–response curve')}
      ${ZONES.map(([a, b, l, c]) => (u >= a ? `<rect x="${f1(pD.x(a))}" y="${GD.y0 - 20}" width="${f1(pD.x(Math.min(b, Math.max(a, u))) - pD.x(a))}" height="${GD.y1 - GD.y0 + 20}" fill="${c}" opacity="0.08"/>` + (u >= b - 0.02 ? T((pD.x(a) + pD.x(b)) / 2, GD.y0 + 36, 18, c)(l) : '') : '')).join('')}
      ${axes(GD, 'Dose (each step = 10× more) →', 'Effect →')}${doseTicks(GD)}
      ${dash(GD.x0, pD.y(1), GD.x1, pD.y(1), '#c9ced8')}
      ${sCurve(GD, 0.5, 1, 12, Math.min(u, 1), PK, 6)}${u > 0 ? dot(pD.x(Math.min(u, 1)), pD.y(E), 11, PK) : ''}`;
  };
  const OCC = { xs: [0, 1, 2, 3, 4, 5].map((i) => 1088 + i * 79), top: 420, s: 0.4 };
  const occPanel = (u) => {
    const E = sig(Math.min(u, 1), 0.5), n = Math.round(E * 6);
    return `${rr(1030, 112, 510, 440, '#d9dce3', '#ffffff', 2)}${T(1285, 160, 24, INK)('Receptors bound')}
      <defs><clipPath id="occ${gid}"><rect x="1050" y="190" width="470" height="320" rx="12"/></clipPath></defs>
      <g clip-path="url(#occ${gid++})">${panel(1050, 1520, 190, OCC.top, OCC.top + 30, 510)}
      ${OCC.xs.map((x, i) => receptor(x, OCC.top, 'tri', 'blue', OCC.s) + (i < n ? ligand('tri', x, dockY(OCC.top, OCC.s), 'amber', 1, OCC.s) + glow(x, OCC.top, OCC.s) : '')).join('')}</g>
      ${T(1285, 535, 22, n ? AGO : GREY)(`${n} of 6 bound → ${Math.round(E * 100)}% effect`)}`;
  };
  const drItems = [
    title('Dose–response curves'),
    svgItem(drGraph(0)), svgItem(occPanel(0)),
    ...card(1030, 572, 510, 288, PK, 'WHAT IT SHOWS', 'How the EFFECT changes as the\nDOSE goes up.\n\nMore drug → more receptors bound\n→ bigger effect, until (nearly) all\nare bound and it levels off.', 20),
    { type: 'hotspot', x: 60, y: 112, w: 940, h: 748, action: 'dr12' },
  ];
  const drActions = [{ id: 'dr12', label: 'Raise the dose', stay: true, drawn: false, items: [
    ...frameTrack([[0, 0], [7, 1], [30, 1]], ([u]) => drGraph(u), 12),
    ...frameTrack([[0, 0], [7, 1], [30, 1]], ([u]) => occPanel(u), 6),
  ] }];

  // ---------------------------------------------------------------- slide: potency vs efficacy
  const GP = { x0: 170, x1: 940, y0: 280, y1: 760 };
  const pP = plot(GP);
  const DRUGS = { a: { mid: 0.32, top: 1, c: AFF, n: 'Drug A' }, b: { mid: 0.62, top: 1, c: PD, n: 'Drug B' }, c: { mid: 0.4, top: 0.5, c: EXO, n: 'Drug C' } };
  const pvGraph = (on, u = 1) => `${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}${axes(GP, 'Dose (log scale) →', 'Effect →')}
    ${Object.entries(DRUGS).map(([k, d]) => sCurve(GP, d.mid, d.top, 12, on.includes(k) ? u : 1, d.c, on.includes(k) ? 6 : 4, on.includes(k) ? 1 : 0.22)).join('')}
    ${Object.entries(DRUGS).map(([k, d], i) => `<rect x="${GP.x0 + 20 + i * 150}" y="${GP.y0 - 50}" width="22" height="8" rx="4" fill="${d.c}" opacity="${on.includes(k) ? 1 : 0.3}"/>` + T(GP.x0 + 50 + i * 150, GP.y0 - 40, 18, d.c, 700, 'start')(d.n)).join('')}`;
  const PV = tabsOf([{ id: 'pot13', text: 'Potency', c: AFF }, { id: 'eff13', text: 'Efficacy', c: EXO }], 300, 480);
  const pvItems = [
    title('Potency vs efficacy'),
    ...PV.bar(null),
    svgItem(pvGraph(['a', 'b', 'c'])),
    ...card(1030, 190, 510, 670, DARK, 'TWO WAYS TO COMPARE DRUGS', 'POTENCY\nHow MUCH drug you need\nto get an effect.\n\nEFFICACY\nThe BIGGEST effect a drug can\nproduce, however much you give.\n\nThey\'re NOT the same thing!', 22),
    ...PV.hot,
  ];
  const ec = (d) => d.mid; // u where the curve reaches half of its own maximum
  const pvActions = [
    { id: 'pot13', label: 'Potency (EC50)', group: 'pv13', stay: true, drawn: false, items: [
      ...PV.bar('pot13'),
      ...frameTrack([[0, 0], [2, 1], [30, 1]], ([u]) => pvGraph(['a', 'b'], u), 12),
      { ...svgItem(['a', 'b'].map((k) => { const d = DRUGS[k]; return dash(pP.x(ec(d)), pP.y(0.5), pP.x(ec(d)), GP.y1, d.c) + dot(pP.x(ec(d)), pP.y(0.5), 9, d.c) + T(pP.x(ec(d)) - 8, GP.y1 - 14, 17, d.c, 700, 'end')(`EC50 ${k.toUpperCase()}`); }).join('')
        + dash(GP.x0, pP.y(0.5), pP.x(0.7), pP.y(0.5), '#9aa1ad') + T(GP.x0 + 12, pP.y(0.5) - 10, 16, GREY, 700, 'start')('50% of max')
        + curve(`M ${pP.x(ec(DRUGS.b)) - 14} ${pP.y(0.24)} L ${pP.x(ec(DRUGS.a)) + 18} ${pP.y(0.24)}`, AFF, 4)), at: 2.1, duration: 0.3 },
      txt('A needs less drug\n→ A is MORE POTENT', pP.x(0.17), pP.y(0.84), 19, AFF, { align: 'center', bold: true, at: 2.4, anim: 'fade', duration: 0.4 }),
      ...card(1030, 190, 510, 670, AFF, 'POTENCY', 'How MUCH drug you need to get\nan effect.\n\nEC50 = the dose that gives HALF\nof the drug\'s maximum effect.\n\nLower EC50 → more potent.\n\nA and B reach the SAME maximum;\nA just gets there with less drug.', 22),
    ] },
    { id: 'eff13', label: 'Efficacy (Emax)', group: 'pv13', stay: true, drawn: false, items: [
      ...PV.bar('eff13'),
      ...frameTrack([[0, 0], [2, 1], [30, 1]], ([u]) => pvGraph(['a', 'c'], u), 12),
      { ...svgItem(dash(GP.x0, pP.y(1), GP.x1, pP.y(1), AFF) + dash(GP.x0, pP.y(0.5), GP.x1, pP.y(0.5), EXO)
        + T(GP.x1 - 4, pP.y(1) - 12, 18, AFF, 700, 'end')('Emax A') + T(GP.x1 - 4, pP.y(0.5) - 12, 18, EXO, 700, 'end')('Emax C')
        + curve(`M ${pP.x(0.85)} ${pP.y(0.53)} L ${pP.x(0.85)} ${pP.y(0.95)}`, ANT, 4)), at: 2.1, duration: 0.3 },
      txt('C can never reach\nA\'s effect, at ANY dose', pP.x(0.66), pP.y(0.72), 19, ANT, { align: 'center', bold: true, at: 2.4, anim: 'fade', duration: 0.4 }),
      ...card(1030, 190, 510, 670, EXO, 'EFFICACY', 'The BIGGEST effect a drug can\nproduce, however much you give.\n\nEmax = the maximum effect\n(the top of the curve).\n\nC is like a partial agonist: more\ndrug just can\'t get it higher.\n\nIn practice, efficacy usually\nmatters more than potency.', 22),
    ] },
  ];

  // ---------------------------------------------------------------- slide: therapeutic index
  const GT = { x0: 170, x1: 940, y0: 280, y1: 760 };
  const pT = plot(GT);
  const tiGraph = (ed, td, u = 1) => `${rr(60, 190, 940, 670, '#d9dce3', '#ffffff', 2)}${axes(GT, 'Dose (log scale) →', '% of people →')}
    ${u >= 1 ? `<rect x="${f1(pT.x(ed))}" y="${GT.y0 - 10}" width="${f1(pT.x(td) - pT.x(ed))}" height="${GT.y1 - GT.y0 + 10}" fill="#3ccf6e" opacity="0.10"/>` : ''}
    ${sCurve(GT, ed, 1, 14, u, AGO, 6)}${sCurve(GT, td, 1, 14, u, ANT, 6)}
    <rect x="${GT.x0 + 20}" y="${GT.y0 - 50}" width="22" height="8" rx="4" fill="${AGO}"/>${T(GT.x0 + 50, GT.y0 - 40, 18, AGO, 700, 'start')('Helps (therapeutic effect)')}
    <rect x="${GT.x0 + 330}" y="${GT.y0 - 50}" width="22" height="8" rx="4" fill="${ANT}"/>${T(GT.x0 + 360, GT.y0 - 40, 18, ANT, 700, 'start')('Toxic effect')}
    ${u >= 1 ? dash(pT.x(ed), pT.y(0.5), pT.x(ed), GT.y1, AGO) + dash(pT.x(td), pT.y(0.5), pT.x(td), GT.y1, ANT) + dot(pT.x(ed), pT.y(0.5), 9, AGO) + dot(pT.x(td), pT.y(0.5), 9, ANT)
      + T(pT.x(ed) - 8, GT.y1 - 14, 17, AGO, 700, 'end')('ED50') + T(pT.x(td) + 8, GT.y1 - 14, 17, ANT, 700, 'start')('TD50')
      + T((pT.x(ed) + pT.x(td)) / 2, GT.y0 + 14, 18, '#1d7a3a')('safety margin') : ''}`;
  const TI = tabsOf([{ id: 'wide14', text: 'Wide (safe)', c: AGO }, { id: 'narrow14', text: 'Narrow (risky)', c: ANT }], 300, 480);
  const tiItems = [
    title('Therapeutic index'),
    ...TI.bar(null),
    svgItem(tiGraph(0.25, 0.8)),
    ...card(1030, 190, 510, 470, AGO, 'THERAPEUTIC INDEX (TI)', 'How SAFE a drug is: how far apart\nthe helpful dose and the harmful\ndose are.\n\nTI = TD50 ÷ ED50\n\nED50: dose that works in half of people\nTD50: dose that\'s toxic in half of people', 20),
    ...card(1030, 680, 510, 180, DARK, 'BIG vs SMALL', 'Big TI → lots of room for error\nSmall TI → easy to overdose', 21),
    ...TI.hot,
  ];
  const tiActions = [
    { id: 'wide14', label: 'Wide therapeutic index', group: 'ti14', stay: true, drawn: false, items: [
      ...TI.bar('wide14'),
      ...frameTrack([[0, 0], [1.8, 1], [30, 1]], ([u]) => tiGraph(0.25, 0.8, u), 12),
      ...card(1030, 680, 510, 180, AGO, 'WIDE TI', 'The toxic dose is FAR above the\nhelpful dose. e.g. penicillin', 21),
    ] },
    { id: 'narrow14', label: 'Narrow therapeutic index', group: 'ti14', stay: true, drawn: false, items: [
      ...TI.bar('narrow14'),
      ...frameTrack([[0, 0], [1.8, 1], [30, 1]], ([u]) => tiGraph(0.42, 0.58, u), 12),
      ...card(1030, 680, 510, 180, ANT, 'NARROW TI', 'Toxic dose is CLOSE to the helpful\none. e.g. warfarin, lithium, digoxin:\nblood levels are checked often', 20),
    ] },
  ];

  // ---------------------------------------------------------------- slide: other drug targets
  // Two views via tabs: "Normally (no drug)" shows what each target does on its own; "With the drug" shows the drug
  // blocking or switching it (the base view). Cards: 730 x 330; picture area x+20..x+330, y+70..y+318.
  const TCARDS = [[60, 190], [810, 190], [60, 530], [810, 530]];
  const tcard = (x, y, c, head, body, art) => [
    box(x, y, 730, 330, c), { type: 'rect', x, y, w: 730, h: 54, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
    txt(head, x + 365, y + 27, 25, '#ffffff', { align: 'center', bold: true }),
    svgItem(art(x, y)),
    txt(body, x + 355, y + 100, 20, INK, { bold: true }),
  ];
  const clipArt = (id, x, y, inner) => `<defs><clipPath id="${id}"><rect x="${x + 20}" y="${y + 70}" width="310" height="248" rx="12"/></clipPath></defs><g clip-path="url(#${id})">${inner}</g>`;
  const recArt = (x, y, natural) => {
    const cx = x + 175, top = y + 232;
    return clipArt(`t1${natural ? 'n' : ''}`, x, y, `${panel(x + 20, x + 330, y + 70, top, top + 38, y + 318)}${receptor(cx, top, 'tri', 'blue', 0.82)}${ligand('tri', cx, dockY(top, 0.82), natural ? 'pale' : 'amber', 1, 0.82)}${contacts(cx, top, 'tri', 4, 0.82)}${glow(cx, top, 0.82)}`)
      + T(x + 265, y + 286, 14, natural ? '#a8640a' : ANT)(natural ? 'your own' : 'a drug, e.g.') + T(x + 265, y + 304, 14, natural ? '#a8640a' : ANT)(natural ? 'messenger' : 'morphine');
  };
  const artRec = (x, y) => recArt(x, y, false);
  const enzBody = (cx, cy) => `<ellipse cx="${cx}" cy="${cy}" rx="112" ry="82" fill="#f4c995" stroke="#b67d3c" stroke-width="4"/>
      <circle cx="${cx + 108}" cy="${cy}" r="32" fill="#ffffff" stroke="#b67d3c" stroke-width="4"/><rect x="${cx + 112}" y="${cy - 40}" width="40" height="80" fill="#ffffff"/>
      ${T(cx - 20, cy - 4, 22, '#8a5a22')('COX')}${T(cx - 20, cy + 22, 16, '#8a5a22', 600)('enzyme')}`;
  const ENZ_C = (x, y) => [x + 150, y + 205];
  const artEnz = (x, y) => {
    const [cx, cy] = ENZ_C(x, y);
    return `${enzBody(cx, cy)}${capsule(cx + 112, cy, 0.42, 0)}${T(cx + 112, cy + 52, 17, ANT)('aspirin')}${T(cx + 20, y + 100, 17, ANT)('✕ no pain signals made')}`;
  };
  const TR_C = (x, y) => [x + 175, y + 200];
  const transBody = (x, y) => {
    const [cx, top] = TR_C(x, y);
    return `${panel(x + 20, x + 330, y + 70, top, top + 38, y + 318)}
      <rect x="${cx - 40}" y="${top - 30}" width="80" height="98" rx="20" fill="#c9a8f2" stroke="#4a1f8a" stroke-width="4"/><rect x="${cx - 9}" y="${top - 30}" width="18" height="98" fill="#eef6fd" stroke="#4a1f8a" stroke-width="3"/>
      <circle cx="${x + 44}" cy="${y + 294}" r="8" fill="#f6c45a" stroke="#a8640a" stroke-width="2.5"/>${T(x + 58, y + 300, 15, GREY, 700, 'start')('serotonin')}${T(cx + 70, top + 95, 15, GREY, 700, 'start')('back into')}${T(cx + 70, top + 113, 15, GREY, 700, 'start')('the nerve')}`;
  };
  const SER = (x, y) => { const [cx, top] = TR_C(x, y); return [[cx - 110, top - 80], [cx - 60, top - 110], [cx + 80, top - 92], [cx + 120, top - 52], [cx - 120, top - 34], [cx + 40, top - 118]]; };
  const serDots = (x, y) => SER(x, y).map(([a, b]) => `<circle cx="${a}" cy="${b}" r="11" fill="#f6c45a" stroke="#a8640a" stroke-width="3"/>`).join('');
  const artTrans = (x, y) => { const [cx, top] = TR_C(x, y); return clipArt('t3', x, y, `${transBody(x, y)}${serDots(x, y)}${capsule(cx, top - 50, 0.36, 0)}`); };
  const CH_C = (x, y) => [x + 175, y + 195];
  const chanBody = (x, y, plug) => {
    const [cx, top] = CH_C(x, y);
    return `${panel(x + 20, x + 330, y + 70, top, top + 38, y + 318)}
      <rect x="${cx - 62}" y="${top - 34}" width="46" height="106" rx="16" fill="#9fd9ae" stroke="#2e7d32" stroke-width="4"/><rect x="${cx + 16}" y="${top - 34}" width="46" height="106" rx="16" fill="#9fd9ae" stroke="#2e7d32" stroke-width="4"/>
      ${plug ? `<rect x="${cx - 20}" y="${top - 14}" width="40" height="40" rx="10" fill="#d9534f" stroke="#8e1d14" stroke-width="3"/>${T(cx, top + 13, 14, '#ffffff')('drug')}` : ''}
      ${T(cx, top + 105, 16, GREY)(plug ? 'ions can\'t get through' : 'ions flow in → nerve signal')}`;
  };
  const naDot = (a, b) => `<circle cx="${a}" cy="${b}" r="15" fill="#f6d04d" stroke="#a87900" stroke-width="3"/>${T(a, b + 5, 13, '#5c4400')('Na⁺')}`;
  const NA = (x, y) => { const [cx, top] = CH_C(x, y); return [[cx - 80, top - 85], [cx + 60, top - 95], [cx + 110, top - 65]]; };
  const artChan = (x, y) => clipArt('t4', x, y, `${chanBody(x, y, true)}${NA(x, y).map(([a, b]) => naDot(a, b)).join('')}${naDot(CH_C(x, y)[0] - 20, CH_C(x, y)[1] - 70)}`);
  const TG = tabsOf([{ id: 'norm7', text: 'Normally (no drug)', c: ENDO }, { id: 'drug7', text: 'With the drug', c: ANT }], 230, 560);
  const targetItems = [
    title('Drug targets: where drugs act'),
    ...TG.bar(null),
    ...tcard(...TCARDS[0], AFF, 'RECEPTORS', 'The MOST common target. The\ndrug switches it ON (agonist) or\nblocks it (antagonist).\n(more on these next)\n\ne.g. morphine at opioid receptors', artRec),
    ...tcard(...TCARDS[1], EXO, 'ENZYMES', 'The drug blocks an enzyme, so\nit can\'t make its product.\n\ne.g. aspirin and ibuprofen\nblock COX, which makes pain\nand inflammation signals', artEnz),
    ...tcard(...TCARDS[2], PD, 'TRANSPORTERS', 'The drug blocks a pump that\nclears a chemical away, so more\nof it stays around.\n\ne.g. SSRIs (like fluoxetine)\nblock serotonin reuptake', artTrans),
    ...tcard(...TCARDS[3], ENDO, 'ION CHANNELS', 'The drug plugs a channel, so\nions can\'t flow through.\n\ne.g. lidocaine blocks Na⁺\nchannels in nerves → numbness', artChan),
    ...TG.hot,
  ];
  // "normally": cover each picture and text with the no-drug version, plus the natural flow
  const coverCard = (x, y, art, body) => [
    svgItem(`<rect x="${x + 4}" y="${y + 58}" width="722" height="268" fill="#ffffff"/>${art}`, { solid: true }),
    { ...txt(body, x + 355, y + 100, 20, ENDO, { bold: true }), solid: true },
  ];
  const [E0, E1] = ENZ_C(...TCARDS[1]), [R0, R1] = TR_C(...TCARDS[2]), [C0, C1] = CH_C(...TCARDS[3]);
  const normItems = [
    ...coverCard(...TCARDS[0], recArt(...TCARDS[0], true), 'NORMALLY: your body\'s own\nmessengers (neurotransmitters,\nhormones) bind and switch\nit ON.'),
    ...coverCard(...TCARDS[1], enzBody(E0, E1) + T(E0 + 20, TCARDS[1][1] + 100, 17, ENDO)('✓ pain signals made'), 'NORMALLY: the enzyme turns a\nstarting molecule into a\nproduct, e.g. COX makes\nprostaglandins (pain and\ninflammation signals).'),
    ...coverCard(...TCARDS[2], clipArt('t3n', ...TCARDS[2], transBody(...TCARDS[2])), 'NORMALLY: a pump pulls a\nchemical back into the nerve\n(reuptake), clearing it away\nso the signal stops.'),
    ...coverCard(...TCARDS[3], clipArt('t4n', ...TCARDS[3], chanBody(...TCARDS[3], false)), 'NORMALLY: the channel opens\nand ions (e.g. Na⁺) flow in,\nsending a nerve signal.'),
    // enzyme: starting molecules go in, products (pain signals) come out
    ...[0, 1, 2].flatMap((k) => [
      { type: 'mover', path: [[E0 + 150 + k * 10, E1 - 115], [E0 + 112, E1]], r: 9, color: '#f0a12e', count: 1, speed: 1.4 + k * 0.35 },
      { type: 'mover', path: [[E0 + 112, E1], [E0 + 165 - k * 10, E1 + 100]], r: 7, color: ANT, count: 1, speed: 1.2 + k * 0.35 },
    ]),
    // transporter: serotonin pulled back into the nerve
    ...SER(...TCARDS[2]).slice(0, 4).map(([a, b], k) => ({ type: 'mover', path: [[a, b], [R0, R1 - 40], [R0, R1 + 60], [R0 + 30, R1 + 110]], r: 11, color: '#f0a12e', count: 1, speed: 2.2 + k * 0.3 })),
    // channel: ions flow through
    ...NA(...TCARDS[3]).map(([a, b], k) => ({ type: 'mover', path: [[a, b], [C0, C1 - 40], [C0, C1 + 70], [C0 + 20 - k * 20, C1 + 100]], r: 13, color: '#f6d04d', count: 1, speed: 1.8 + k * 0.3 })),
  ];
  // "with the drug": the same flows get stuck
  const drugItems = [
    ...[0, 1].map((k) => ({ type: 'mover', path: [[E0 + 150 + k * 14, E1 - 115], [E0 + 128 + k * 10, E1 - 48], [E0 + 160 + k * 14, E1 - 120]], r: 9, color: '#f0a12e', count: 1, speed: 1.6 + k * 0.4 })),
    ...SER(...TCARDS[2]).slice(0, 3).map(([a, b], k) => ({ type: 'mover', path: [[a, b], [R0 + (k - 1) * 20, R1 - 72], [a + 10, b - 6]], r: 11, color: '#f0a12e', count: 1, speed: 2.0 + k * 0.3 })),
    ...NA(...TCARDS[3]).map(([a, b], k) => ({ type: 'mover', path: [[a, b], [C0 + (k - 1) * 14, C1 - 26], [a, b]], r: 13, color: '#f6d04d', count: 1, speed: 1.8 + k * 0.3 })),
  ];
  const targetActions = [
    { id: 'norm7', label: 'Normally (no drug)', group: 'tg', stay: true, drawn: false, items: [...TG.bar('norm7').map((it) => ({ ...it, solid: true })), ...normItems] },
    { id: 'drug7', label: 'With the drug', group: 'tg', stay: true, drawn: false, items: [...TG.bar('drug7').map((it) => ({ ...it, solid: true })), ...drugItems] },
  ];

  // ---------------------------------------------------------------- slide: receptor types
  const COLS = [
    { c: '#2e7d32', head: 'Ion channel', sub: 'ligand-gated', how: 'Ligand binds → a channel\nopens → ions rush in.', ex: 'e.g. nicotinic ACh,\nGABA-A receptors', speed: 'milliseconds', v: 0.08 },
    { c: AFF, head: 'G-protein-coupled', sub: '(GPCR)', how: 'Ligand binds → a G-protein\ninside the cell passes the\nsignal on (via messengers\nlike cAMP).', ex: 'e.g. adrenaline (β receptors),\nopioid receptors. The most\ncommon drug target!', speed: 'seconds', v: 0.32 },
    { c: EXO, head: 'Enzyme-linked', sub: '(kinase-linked)', how: 'Ligand binds → the receptor\'s\nown enzyme switches on\ninside the cell.', ex: 'e.g. insulin receptor', speed: 'minutes – hours', v: 0.6 },
    { c: PD, head: 'Intracellular', sub: '(nuclear)', how: 'Ligand crosses the membrane\n→ binds a receptor inside\n→ changes which genes\nare switched on.', ex: 'e.g. steroids like\ncortisol, oestrogen', speed: 'hours – days', v: 0.95 },
  ];
  const CX = (i) => 60 + i * 375, CW = 355, MT = 330;
  const typeArt = (i, cx) => {
    const x0 = CX(i) + 12, x1 = CX(i) + CW - 12, clip = `<defs><clipPath id="rt${i}"><rect x="${x0}" y="190" width="${x1 - x0}" height="270" rx="12"/></clipPath></defs>`;
    const base = panel(x0, x1, 190, MT, MT + 40, 460);
    if (i === 0) {
      return `${clip}<g clip-path="url(#rt0)">${base}<rect x="${cx - 54}" y="${MT - 40}" width="42" height="120" rx="14" fill="#9fd9ae" stroke="#2e7d32" stroke-width="4"/><rect x="${cx + 12}" y="${MT - 40}" width="42" height="120" rx="14" fill="#9fd9ae" stroke="#2e7d32" stroke-width="4"/>
        ${ligand('tri', cx - 33, MT - 62, 'amber', 1, 0.45)}${ligand('tri', cx + 33, MT - 62, 'amber', 1, 0.45)}</g>`;
    }
    if (i === 1) {
      let d = `M ${cx - 70} ${MT - 30}`;
      for (let k = 0; k < 7; k++) { const xx = cx - 70 + k * 23; d += ` L ${xx} ${k % 2 ? MT - 30 : MT + 70} L ${xx + 23} ${k % 2 ? MT + 70 : MT - 30}`; }
      return `${clip}<g clip-path="url(#rt1)">${base}<path d="M ${cx - 70} ${MT - 30} ${Array.from({ length: 7 }, (_, k) => `C ${cx - 70 + k * 21} ${k % 2 ? MT - 40 : MT + 80}, ${cx - 70 + k * 21 + 21} ${k % 2 ? MT - 40 : MT + 80}, ${cx - 70 + (k + 1) * 21} ${k % 2 ? MT - 30 : MT + 70}`).join(' ')}" fill="none" stroke="#2c5a92" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        ${ligand('tri', cx - 4, MT - 60, 'amber', 1, 0.45)}
        <circle cx="${cx + 30}" cy="${MT + 100}" r="20" fill="#f28b82" stroke="#a5241c" stroke-width="3"/><circle cx="${cx + 62}" cy="${MT + 92}" r="13" fill="#9fc0ef" stroke="#2c5a92" stroke-width="3"/><circle cx="${cx + 80}" cy="${MT + 108}" r="10" fill="#c9a8f2" stroke="#4a1f8a" stroke-width="3"/>
        ${T(cx + 30, MT + 106, 13, '#ffffff')('G')}</g>`;
    }
    if (i === 2) {
      return `${clip}<g clip-path="url(#rt2)">${base}${[-1, 1].map((sd) => `<rect x="${cx + sd * 38 - 16}" y="${MT - 70}" width="32" height="200" rx="12" fill="#f4c995" stroke="#b67d3c" stroke-width="4"/><circle cx="${cx + sd * 38}" cy="${MT + 108}" r="22" fill="#f6a35a" stroke="#b5560e" stroke-width="3"/>`).join('')}
        <ellipse cx="${cx}" cy="${MT - 78}" rx="58" ry="20" fill="#f6c45a" stroke="#a8640a" stroke-width="4"/>
        ${[-1, 1].map((sd) => `<circle cx="${cx + sd * 74}" cy="${MT + 108}" r="13" fill="#fff3c4" stroke="#b5560e" stroke-width="3"/>${T(cx + sd * 74, MT + 113, 13, '#b5560e')('P')}`).join('')}</g>`;
    }
    return `${clip}<g clip-path="url(#rt3)">${base}<ellipse cx="${cx + 20}" cy="${MT + 112}" rx="90" ry="40" fill="#e8dcf7" stroke="#7b3fd0" stroke-width="3"/>${T(cx + 20, MT + 118, 15, '#4a1f8a')('nucleus (DNA)')}
      <path d="M ${cx - 90} ${MT - 70} C ${cx - 80} ${MT}, ${cx - 70} ${MT + 30}, ${cx - 60} ${MT + 60}" fill="none" stroke="#9aa1ad" stroke-width="3" stroke-dasharray="6 5"/>
      <polygon points="${cx - 104},${MT - 92} ${cx - 86},${MT - 102} ${cx - 68},${MT - 92} ${cx - 68},${MT - 72} ${cx - 86},${MT - 62} ${cx - 104},${MT - 72}" fill="#f6c45a" stroke="#a8640a" stroke-width="3"/>
      <rect x="${cx - 82}" y="${MT + 52}" width="52" height="34" rx="12" fill="#9fc0ef" stroke="#2c5a92" stroke-width="3"/>
      ${curve(`M ${cx - 30} ${MT + 74} Q ${cx} ${MT + 70} ${cx + 10} ${MT + 86}`, PD, 3)}</g>`;
  };
  const typeItems = [
    title('The four main receptor types'),
    ...COLS.flatMap((col, i) => {
      const x = CX(i), cx = x + CW / 2;
      return [
        box(x, 112, CW, 748, col.c),
        { type: 'rect', x, y: 112, w: CW, h: 70, color: col.c, fill: col.c, fillOpacity: 1, width: 3, rough: false },
        txt(col.head, cx, 136, 24, '#ffffff', { align: 'center', bold: true }), txt(col.sub, cx, 164, 17, '#ffffff', { align: 'center', bold: true }),
        svgItem(typeArt(i, cx)),
        txt(col.how, x + 22, 500, 19, INK, { bold: true }),
        txt(col.ex, x + 22, 640, 18, GREY, { bold: true }),
        svgItem(`<rect x="${x + 22}" y="755" width="${CW - 44}" height="16" rx="8" fill="#eef0f4"/><rect x="${x + 22}" y="755" width="${f1((CW - 44) * col.v)}" height="16" rx="8" fill="${col.c}"/>`),
        txt(`⏱ ${col.speed}`, cx, 810, 22, col.c, { align: 'center', bold: true }),
      ];
    }),
    txt('FAST', 70, 735, 16, GREY, { bold: true }), txt('SLOW', 1530, 735, 16, GREY, { bold: true, align: 'right' }),
  ];
  const typeActions = [{ id: 'sig16', label: 'Show the signals', stay: true, drawn: false, items: [
    // ion channel: ions rush through
    ...[0, 1, 2].map((k) => ({ type: 'mover', path: [[CX(0) + CW / 2, MT - 110], [CX(0) + CW / 2, MT + 120]], r: 8, color: '#e8890c', count: 1, speed: 0.9, phase: k / 3 })),
    // GPCR: messengers spread
    ...[0, 1, 2].map((k) => ({ type: 'mover', path: [[CX(1) + CW / 2 + 40, MT + 100], [CX(1) + CW / 2 + 110 - k * 40, MT + 125]], r: 6, color: '#2f6fde', count: 1, speed: 1.6 })),
    { type: 'pulse', x: CX(2) + CW / 2, y: MT + 108, r: 34, color: '#f0a050', speed: 1.4 },
    { type: 'mover', path: [[CX(3) + CW / 2 - 86, MT - 82], [CX(3) + CW / 2 - 76, MT - 10], [CX(3) + CW / 2 - 60, MT + 60], [CX(3) + CW / 2 + 10, MT + 100]], r: 9, color: '#f0a12e', count: 1, speed: 3.5 },
  ] }];

  // ---------------------------------------------------------------- slide: tolerance (receptor regulation)
  const TL = tabsOf([{ id: 'norm17', text: 'Normal', c: DARK }, { id: 'down17', text: 'Too much stimulation', c: ANT }, { id: 'up17', text: 'Too little stimulation', c: AFF }], 170, 400);
  const TS = { top: 560, s: 0.55, xs: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => 120 + i * 98) };
  const NORMAL = [0, 2, 3, 5, 6, 8], EXTRA = [1, 4, 7], GONE = [2, 5, 8];
  const rec = (i, extra = '') => receptor(TS.xs[i], TS.top, 'tri', 'blue', TS.s) + extra;
  const onRec = (i) => ligand('tri', TS.xs[i], dockY(TS.top, TS.s), 'amber', 1, TS.s);
  const counter = (n, c) => `<rect x="340" y="770" width="320" height="64" rx="32" fill="${c}"/>` + T(500, 812, 28, '#ffffff')(`${n} receptors`);
  const tolBase = (inner) => svgItem(panel(60, 1000, 190, TS.top, TS.top + 50, 860) + inner);
  const tolItems = [
    title('Receptor regulation: up and down'),
    ...TL.bar(null),
    tolBase(NORMAL.map((i) => rec(i)).join('') + counter(6, DARK)),
    ...card(1030, 190, 510, 670, DARK, 'RECEPTOR REGULATION', 'Cells adjust how many receptors\nthey have (and how strongly they\nrespond) to keep things balanced.\n\nToo much stimulation → DOWN\nToo little stimulation → UP\n\nThis is a big reason for tolerance\nand withdrawal (more in part 4).\n\nClick the tabs to see how →', 21),
    ...TL.hot,
  ];
  const tolActions = [
    { id: 'norm17', label: 'Normal', group: 'tl17', stay: true, drawn: false, items: [
      ...TL.bar('norm17'),
      svgItem(NORMAL.map((i) => (i % 3 === 0 ? onRec(i) + glow(TS.xs[i], TS.top, TS.s) : '')).join('')),
      ...card(1030, 190, 510, 670, DARK, 'NORMAL', 'A normal number of receptors.\n\nNow and then a signal binds and\nswitches some of them on.\n\nThe cell is balanced.', 22),
    ] },
    { id: 'down17', label: 'Too much stimulation → downregulation', group: 'tl17', stay: true, drawn: false, items: [
      ...TL.bar('down17'),
      tolBase(NORMAL.filter((i) => !GONE.includes(i)).map((i) => rec(i)).join('')),
      svgItem(NORMAL.filter((i) => !GONE.includes(i)).map((i) => onRec(i) + glow(TS.xs[i], TS.top, TS.s, 0.6)).join('')),
      ...GONE.flatMap((i) => track([[0, TS.xs[i], TS.top], [0.6, TS.xs[i], TS.top], [2.2, TS.xs[i], TS.top + 115], [30, TS.xs[i], TS.top + 115]], ([x, y]) => `<g opacity="0.55">${receptor(x, y, 'tri', 'blue', TS.s * 0.8)}</g>`)),
      txt('pulled inside the cell', 463, 712, 20, ANT, { align: 'center', bold: true, at: 2.2, anim: 'fade', duration: 0.3 }),
      { ...svgItem(`<rect x="300" y="766" width="400" height="72" rx="36" fill="#f7f0fb"/>${counter(3, ANT)}`), at: 2.2, duration: 0.3 },
      ...card(1030, 190, 510, 670, ANT, 'DOWNREGULATION', 'A receptor is switched on too much\nfor too long (e.g. taking opioids\nevery day).\n\nThe cell pulls receptors inside and\nmakes fewer, and the rest respond\nless (desensitisation).\n\n→ Same dose, less effect\n   = TOLERANCE\n→ Stop suddenly → WITHDRAWAL', 21),
    ] },
    { id: 'up17', label: 'Too little stimulation → upregulation', group: 'tl17', stay: true, drawn: false, items: [
      ...TL.bar('up17'),
      svgItem(NORMAL.map((i) => antag(TS.xs[i], dockY(TS.top, TS.s), TS.s)).join('')),
      ...EXTRA.flatMap((i) => track([[0, TS.xs[i], TS.top + 115], [0.6, TS.xs[i], TS.top + 115], [2.2, TS.xs[i], TS.top], [30, TS.xs[i], TS.top]], ([x, y]) => receptor(x, y, 'tri', 'blue', TS.s))),
      txt('new receptors added', 500, 712, 20, AFF, { align: 'center', bold: true, at: 2.2, anim: 'fade', duration: 0.3 }),
      { ...svgItem(`<rect x="300" y="766" width="400" height="72" rx="36" fill="#f7f0fb"/>${counter(9, AFF)}`), at: 2.2, duration: 0.3 },
      ...card(1030, 190, 510, 670, AFF, 'UPREGULATION', 'A receptor is blocked or barely\nused for a long time (e.g. taking a\nbeta-blocker every day).\n\nThe cell makes MORE receptors\nto catch more of the signal.\n\n→ It becomes extra sensitive\n→ Stop suddenly → REBOUND\n   (e.g. a racing heart)', 21),
    ] },
  ];

  // ---------------------------------------------------------------- slide: the placebo effect
  const PLA = '#8e5cc7', REAL = '#1f8a4c';
  const PB = tabsOf([{ id: 'what18', text: 'What is a placebo?', c: PLA }, { id: 'trial18', text: 'A fair test', c: REAL }, { id: 'why18', text: 'Why does it work?', c: AFF }], 170, 400);
  const plaItems = [
    title('The placebo effect'),
    ...PB.bar(null),
    svgItem(`${rr(60, 190, 940, 670, '#d9dce3', '#fbfcfe', 2)}${capsule(530, 470, 2.2, -25)}`),
    txt('A pill with NO drug in it…\ncan still make people feel better', 530, 700, 26, PLA, { align: 'center', bold: true, hideDuring: ['what18', 'trial18', 'why18'] }),
    ...card(1030, 190, 510, 670, PLA, 'PLACEBO', 'A dummy treatment with NO active\ndrug in it, e.g. a sugar pill or a\nsalt-water injection.\n\nPLACEBO EFFECT\nA real improvement that comes\nfrom EXPECTING to get better,\nnot from a drug.', 22),
    ...PB.hot,
  ];
  // tab 1: two identical-looking pills
  const whatItems = [
    svgItem(`${rr(60, 190, 940, 670, '#d9dce3', '#fbfcfe', 2)}
      ${T(300, 250, 26, REAL)('Real drug')}${T(760, 250, 26, PLA)('Placebo')}
      ${capsule(300, 380, 1.6, -25)}${capsule(760, 380, 1.6, -25)}
      ${T(530, 392, 44, GREY)('=')}${T(530, 450, 18, GREY)('they look exactly the same')}
      ${rr(150, 490, 300, 70, REAL, '#eaf6ee', 2.5, 14)}${T(300, 532, 19, REAL)('✓ contains the drug')}
      ${rr(610, 490, 300, 70, PLA, '#f3edfa', 2.5, 14)}${T(760, 520, 19, PLA)('✕ no drug inside')}${T(760, 545, 16, GREY)('(e.g. just sugar)')}
      ${rr(150, 640, 760, 160, '#e2d6f2', '#ffffff', 2.5, 16)}`),
    txt('Yet people taking the PLACEBO often\nfeel BETTER too.', 530, 690, 25, INK, { align: 'center', bold: true, at: 0.6, anim: 'fade', duration: 0.4 }),
    txt('→ the PLACEBO EFFECT', 530, 768, 26, PLA, { align: 'center', bold: true, at: 1.4, anim: 'pop', duration: 0.4 }),
  ];
  // tab 2: a fair (blinded) trial, two groups and their results
  const people = (y, c, edge) => [0, 1, 2, 3, 4, 5].map((k) => person(120 + k * 66, y, 0.2, c, edge)).join('');
  const BARS = { base: 770, h: 470, xP: 610, xR: 770, w: 110 };
  const trialBars = (u) => {
    const pH = BARS.h * 0.35 * Math.min(1, u * 1.6), rTot = BARS.h * 0.6 * u, rLow = Math.min(rTot, BARS.h * 0.35);
    return `<line x1="580" y1="${BARS.base}" x2="990" y2="${BARS.base}" stroke="${DARK}" stroke-width="3"/>
      <rect x="${BARS.xP}" y="${f1(BARS.base - pH)}" width="${BARS.w}" height="${f1(pH)}" rx="8" fill="#c9b3e8"/>
      <rect x="${BARS.xR}" y="${f1(BARS.base - rLow)}" width="${BARS.w}" height="${f1(rLow)}" fill="#c9b3e8"/>
      <rect x="${BARS.xR}" y="${f1(BARS.base - rTot)}" width="${BARS.w}" height="${f1(rTot - rLow)}" rx="8" fill="${REAL}"/>
      ${T(BARS.xP + BARS.w / 2, BARS.base + 28, 18, PLA)('Placebo')}${T(BARS.xR + BARS.w / 2, BARS.base + 28, 18, REAL)('Real drug')}
      ${u >= 1 ? T(BARS.xP + BARS.w / 2, BARS.base - pH - 14, 20, PLA)('35%') + T(BARS.xR + BARS.w / 2, BARS.base - rTot - 14, 20, REAL)('60%') : ''}
      ${T(785, 255, 20, DARK)('How many feel better')}`;
  };
  const trialItems = [
    svgItem(`${rr(60, 190, 940, 670, '#d9dce3', '#fbfcfe', 2)}
      ${T(90, 245, 20, REAL, 700, 'start')('Group 1 gets the REAL drug')}${people(345, '#dff1e5', '#6fa77f')}${capsule(500, 330, 0.5, -25)}
      ${T(90, 515, 20, PLA, 700, 'start')('Group 2 gets the PLACEBO')}${people(615, '#efe6fa', '#9b7ac9')}${capsule(500, 600, 0.5, -25)}
      ${rr(80, 720, 470, 100, '#e4e7ee', '#ffffff', 2, 12)}${T(315, 760, 18, DARK)('Nobody knows which pill they got')}${T(315, 790, 18, GREY)('("blinded", so expectations are equal)')}
      <line x1="565" y1="210" x2="565" y2="840" stroke="#e4e7ee" stroke-width="2"/>`),
    ...frameTrack([[0, 0], [0.5, 0], [2.5, 1], [30, 1]], ([u]) => trialBars(u), 12),
    { ...svgItem(`<path d="M ${BARS.xR + BARS.w + 12} ${BARS.base} l 10 0 l 0 ${-BARS.h * 0.35} l -10 0" fill="none" stroke="${PLA}" stroke-width="3"/>
      <path d="M ${BARS.xR + BARS.w + 12} ${BARS.base - BARS.h * 0.35} l 10 0 l 0 ${-BARS.h * 0.25} l -10 0" fill="none" stroke="${REAL}" stroke-width="3"/>`), at: 2.6, duration: 0.3 },
    txt('placebo\neffect', BARS.xR + BARS.w + 30, BARS.base - BARS.h * 0.2, 16, PLA, { bold: true, at: 2.6, anim: 'fade', duration: 0.3 }),
    txt('drug\'s REAL\neffect', BARS.xR + BARS.w + 30, BARS.base - BARS.h * 0.49, 16, REAL, { bold: true, at: 2.9, anim: 'fade', duration: 0.3 }),
  ];
  // tab 3: why it works, and what it can and can't do
  const step3 = (x, n, head, body, c) => [
    { type: 'rect', x, y: 220, w: 270, h: 210, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
    svgItem(badge(x + 34, 254, String(n), c)), txt(head, x + 66, 254, 21, c, { bold: true }), txt(body, x + 22, 330, 18, INK, { bold: true }),
  ];
  const whyItems = [
    svgItem(`${rr(60, 190, 940, 670, '#d9dce3', '#fbfcfe', 2)}${curve('M 368 325 L 392 325', DARK, 5)}${curve('M 678 325 L 702 325', DARK, 5)}`),
    ...at([...step3(90, 1, 'Expect it', 'You believe the\ntreatment will\nhelp you', PLA)], 0),
    ...at([...step3(395, 2, 'Brain reacts', 'It releases its\nown chemicals\n(e.g. endorphins:\nnatural painkillers)', AFF)], 0.6),
    ...at([...step3(705, 3, 'Feel better', 'Less pain, less\nnausea, better\nmood', REAL)], 1.2),
    ...at([
      { type: 'rect', x: 90, y: 470, w: 425, h: 250, color: REAL, fill: '#eaf6ee', fillOpacity: 1, width: 2.5, rough: false },
      txt('✓ Works best on how you FEEL', 110, 505, 20, REAL, { bold: true }),
      txt('• pain\n• nausea\n• mood and anxiety\n• tiredness and sleep', 115, 560, 19, INK, { bold: true }),
      { type: 'rect', x: 545, y: 470, w: 425, h: 250, color: '#c0392b', fill: '#fbecea', fillOpacity: 1, width: 2.5, rough: false },
      txt('✕ Can\'t fix the disease itself', 565, 505, 20, '#c0392b', { bold: true }),
      txt('• infections\n• tumours\n• broken bones\n• high blood sugar', 570, 560, 19, INK, { bold: true }),
    ], 1.8),
    txt('Also helping: natural recovery, and extra care and attention', 530, 780, 19, GREY, { align: 'center', bold: true, at: 2.2, anim: 'fade', duration: 0.3 }),
  ];
  const plaActions = [
    { id: 'what18', label: 'What is a placebo?', group: 'pla', stay: true, drawn: false, items: [...PB.bar('what18'), ...whatItems] },
    { id: 'trial18', label: 'A fair test', group: 'pla', stay: true, drawn: false, items: [...PB.bar('trial18'), ...trialItems,
      ...card(1030, 190, 510, 670, REAL, 'A FAIR TEST (A TRIAL)', 'One group gets the real drug, the\nother an identical-looking placebo.\nNobody knows who got which.\n\nThe placebo group improves too!\n\nThe drug\'s REAL effect = how much\nMORE the drug group improves.\n\nThat\'s why new drugs are always\ntested against a placebo.', 21)] },
    { id: 'why18', label: 'Why does it work?', group: 'pla', stay: true, drawn: false, items: [...PB.bar('why18'), ...whyItems,
      ...card(1030, 190, 510, 670, AFF, 'WHY DOES IT WORK?', 'Expectation: the brain responds to\nwhat it thinks will happen, and\nreleases its own chemicals.\n\nIt\'s a REAL effect, not "all in\nyour head", but it mostly changes\nsymptoms, not the disease.\n\nNOCEBO: the opposite. Expecting\nside effects can cause them\n(e.g. after reading the leaflet).', 21)] },
  ];

  // shared with part 3 (pharmacology-pk.js)
  window.WB_PHARM_PD = { glow, gauge, card, tabsOf, plot, axes, sCurve, sig, dash, tagOver, chip, ball };

  // ---------------------------------------------------------------- the slides (added after part 1)
  scene.steps.push(
    // Slide 6: part 2 intro.
    { script: `${Qs('What is part 2 about?', 'What will we cover in pharmacodynamics?')}`,
      notes: `• Part 2 = pharmacodynamics: what the drug does to the body
• Goal: understand how drugs actually produce their effects
• Roadmap: drug targets → receptors & binding → receptor types → affinity / specificity / selectivity → agonists → antagonists & modulators → enzymes, transporters, ion channels → dose–response → potency vs efficacy → therapeutic index → receptor regulation → the placebo effect`,
      say: 'Part 2: pharmacodynamics, how drugs affect the body.', clear: true, items: introItems },
    // Slide 7: drug targets.
    { script: `${Qs('Where do drugs act?', 'What are the four main drug targets?', 'What does each target do normally, and what does the drug change?')}
[tabs: Normally (no drug) → With the drug]`,
      notes: `• First, the big picture: drugs act on 4 main types of target (receptors are the most common, but not the only one)
• Receptors come next (slides 8–13); enzymes, transporters and ion channels each get their own slide after that (14–16)
• Receptors: switched on or blocked (morphine at opioid receptors)
• Enzymes: blocked so they can't make their product (aspirin / ibuprofen block COX → less pain and inflammation)
• Transporters: blocked so a chemical stays around (SSRIs block serotonin reuptake)
• Ion channels: plugged so ions can't flow (lidocaine blocks Na⁺ channels → numbness)`,
      say: 'Drugs act on four main targets: receptors, enzymes, transporters and ion channels.', clear: true, actions: targetActions, items: targetItems },
    // Slide 8: receptors and binding.
    { script: `${Qs('What is a receptor?', 'What is a ligand?', 'What happens when a ligand binds? (shape change → ON)')}
[click the left side to bind]`,
      notes: `• Receptor = a protein (usually on the cell surface) with a pocket only the right molecule fits (lock and key)
• Ligand = any molecule that binds a receptor (neurotransmitter, hormone, drug)
• Binding changes the receptor's SHAPE
• The shape change switches it ON → a message is passed into the cell
• This is the basis for agonists and antagonists`,
      say: 'A receptor is a protein a ligand fits into; binding changes its shape, which switches it on.', clear: true, actions: recActions, items: recItems },
    // Slide 9: receptor types.
    { script: `${Qs('What are the four main receptor types?', 'How does each one pass on its signal?', 'Which is fastest and which is slowest?')}
[optional: press "Show the signals"]`,
      notes: `• 4 receptor types differ in how they pass the signal on, and how fast
• Ligand-gated ion channel: channel opens, ions rush in; milliseconds (nicotinic ACh, GABA-A)
• GPCR: G-protein passes the signal on via messengers (cAMP); seconds; most common drug target (β receptors, opioid receptors)
• Enzyme-linked: receptor's own enzyme switches on; minutes–hours (insulin receptor)
• Intracellular: ligand crosses the membrane, changes which genes are on; hours–days (steroids: cortisol, oestrogen)`,
      say: 'The four receptor types pass signals in different ways, from millisecond ion channels to slow intracellular receptors.', clear: true, actions: typeActions, items: typeItems },
    // Slide 10: affinity and selectivity.
    { script: `${Qs('What is affinity?', 'Specificity vs selectivity: what is the difference?', 'Why does low selectivity cause side effects?')}
[▶ Watch them bind · Specificity: Low → High dose · Selectivity grid: high sel. low → high dose, then low sel. low → high dose]`,
      notes: `• Affinity = how TIGHTLY a drug binds its receptor
• High affinity: snug fit, many bonds, stays bound; low affinity: loose fit, keeps falling off
• Specificity = binds ONLY its target, at any dose (all-or-nothing; very rare for real drugs)
• Low vs high dose: a specific drug STILL only binds its target, even at a high dose
• Selectivity = how strongly a drug PREFERS its target over other receptors (a matter of degree)
• High selectivity: mostly binds its target, other receptors only weakly → few side effects
• Low selectivity: binds other receptors about as well as its target → many side effects
• Dose matters: high selectivity → other receptors only at HIGH doses; low selectivity → even at LOW doses
• So raising the dose of any selective drug brings more side effects (e.g. metoprolol: β1 heart → β2 lungs)
• Most drugs are selective, not truly specific
• Ideal drug: high affinity AND high selectivity`,
      say: 'Affinity is how tightly a drug binds; specificity and selectivity are how choosy it is, and poor selectivity causes side effects.', clear: true, actions: affSelActions, items: affSelItems },
    // Slide 11: agonists.
    { script: `${Qs('What is a full agonist?', 'What is a partial agonist?', 'What happens when a partial and a full agonist are both around?')}
[tabs: Full agonist → Partial agonist → Partial + full together]`,
      notes: `• Agonist = binds AND activates a receptor
• Full agonist: switches it fully on → maximum response (e.g. most neurotransmitters, morphine)
• Partial agonist: only partly on → smaller response even with every receptor bound (e.g. buprenorphine)
• Partial + full together: the partial agonist takes the spot → response capped at the partial level
• So a partial agonist can block a full agonist → why buprenorphine is used for opioid addiction`,
      say: 'Full agonists switch a receptor fully on; partial agonists only partly, and can even block full agonists.', clear: true, actions: agoActions, items: agoItems },
    // Slide 12: antagonists.
    { script: `${Qs('What is an antagonist?', 'Competitive vs noncompetitive: what is the difference?', 'Reversible vs irreversible')}
[tabs: Competitive → Noncompetitive]`,
      notes: `• Antagonist = binds but does NOT activate → blocks agonists
• Competitive: same spot as the agonist; whichever there's more of wins; enough agonist overcomes it
• Example: naloxone reverses opioid overdose
• Noncompetitive: binds a different site, changes the receptor's shape; more agonist doesn't help
• Example: ketamine (NMDA receptors)
• Reversible (lets go, most drugs) vs irreversible (binds for good → cell must make new receptors)`,
      say: 'Antagonists bind without switching the receptor on; competitive ones can be outcompeted, noncompetitive ones cannot.', clear: true, actions: antActions, items: antItems },
    // Slide 13: allosteric modulators.
    { script: `${Qs('What is an allosteric modulator?', 'Positive vs negative modulators', 'Example: benzodiazepines and GABA')}
[tabs: GABA alone → GABA + benzodiazepine → Benzodiazepine alone]`,
      notes: `• Allosteric modulator = binds a DIFFERENT site (allo = other) and turns the response up or down
• Positive modulator boosts; negative modulator dampens
• Example: benzodiazepines (e.g. diazepam) at GABA-A receptors; GABA = the brain's main calming signal
• GABA alone → normal calming signal
• GABA + benzodiazepine → same GABA, much bigger effect
• Benzodiazepine alone → almost no effect (it only boosts what's already there)`,
      say: 'Allosteric modulators bind a different site and turn the response up or down, like benzodiazepines boosting GABA.', clear: true, actions: modActions, items: modItems },
    // Slide 14: drugs that act on enzymes.
    { script: `${Qs('What do enzymes do?', 'How do enzyme inhibitors work?', 'Reversible vs irreversible inhibitors?')}
[tabs: Normal → Reversible inhibitor → Irreversible inhibitor]`,
      notes: `• Enzyme = a protein that speeds up a reaction: turns a starting molecule into a product
• Many drugs are enzyme INHIBITORS: they block the enzyme → less product is made
• Reversible inhibitor: binds and lets go; lots of starting molecule can push it out (like a competitive antagonist); the effect wears off as the drug is removed
• Irreversible inhibitor: locks on for good; the effect lasts until the body makes NEW enzyme
• Aspirin: irreversibly blocks COX in platelets, which can't make new COX → one dose lasts ~a week (why low-dose aspirin thins the blood)
• Examples: statins (cholesterol-making enzyme), ACE inhibitors such as ramipril (lower blood pressure), NSAIDs / aspirin (COX → less pain and inflammation)`,
      say: 'Enzyme inhibitors block an enzyme so less product is made, either reversibly or for good.', clear: true, actions: enzActions, items: enzItems },
    // Slide 15: drugs that act on transporters.
    { script: `${Qs('What do transporters do?', 'How do SSRIs work?', 'How do proton pump inhibitors work?')}
[tabs: Normal → Reuptake blocked (SSRI) → Acid pump blocked (PPI)]`,
      notes: `• Transporter = a protein that MOVES things across a cell membrane
• Two kinds: reuptake transporters (pull a chemical back into a cell) and pumps (push things out using energy)
• Drugs usually BLOCK them
• Normally: serotonin is released, activates receptors, then is pulled back in → a short signal
• SSRIs (fluoxetine, sertraline) block serotonin reuptake → serotonin stays in the gap → stronger, longer signal (depression, anxiety)
• Cocaine blocks the dopamine transporter the same way
• PPIs (omeprazole) switch off the stomach's acid pump → much less acid (reflux, ulcers)
• Digoxin blocks the Na⁺/K⁺ pump in heart cells`,
      say: 'Transporter-blocking drugs stop a chemical being moved, like SSRIs keeping serotonin around or PPIs switching off the acid pump.', clear: true, actions: transActions, items: transItems },
    // Slide 16: drugs that act on ion channels.
    { script: `${Qs('What do ion channels do?', 'How does lidocaine make you numb?', 'How do calcium channel blockers lower blood pressure?')}
[tabs: Nerve: normal → Nerve + lidocaine → Calcium channel blocker]`,
      notes: `• Ion channel = a pore that lets ions (Na⁺, K⁺, Ca²⁺, Cl⁻) flow across a membrane → electrical signals in nerves, heart and muscle
• Drugs can BLOCK channels (most common) or help OPEN them
• Normally: Na⁺ channels open one after another along a nerve, carrying the signal (e.g. pain) to the brain
• Lidocaine plugs Na⁺ channels where it's injected → the signal can't get past → numb (dental work, stitches)
• Calcium channel blockers (amlodipine): Ca²⁺ makes blood-vessel muscle squeeze; blocking it → muscle relaxes → vessel widens → lower blood pressure
• Some anti-epileptics block Na⁺ channels; benzodiazepines OPEN the GABA-A Cl⁻ channel more (slide 13)`,
      say: 'Ion channel drugs mostly block channels, like lidocaine stopping nerve signals or calcium channel blockers relaxing blood vessels.', clear: true, actions: chanActions, items: chanItems },
    // Slide 17: dose–response curves.
    { script: `${Qs('What is a dose-response curve?', 'Why is it S-shaped?', 'How does it link to receptors being bound?')}
[click the graph to raise the dose]`,
      notes: `• Dose–response curve = how the effect changes as the dose goes up
• Low dose: few receptors bound → little effect
• Middle: steep part, small dose change → big effect change
• High dose: nearly all receptors bound → effect levels off (maximum)
• Dose axis is usually a log scale (each step = 10× more) → S-shaped curve`,
      say: 'A dose-response curve shows the effect rising with dose until nearly every receptor is bound.', clear: true, actions: drActions, items: drItems },
    // Slide 18: potency vs efficacy.
    { script: `${Qs('What is potency? (EC50)', 'What is efficacy? (Emax)', 'Which matters more?')}
[tabs: Potency → Efficacy]`,
      notes: `• Two different ways to compare drugs (often confused)
• Potency = how MUCH drug you need for an effect
• EC50 = dose giving half of the drug's maximum effect; lower EC50 → more potent
• A vs B: same maximum, A just needs less drug
• Efficacy = the BIGGEST effect a drug can produce at any dose (Emax = top of the curve)
• A vs C: C can never reach A's effect (like a partial agonist)
• Efficacy usually matters more than potency; more potent ≠ stronger`,
      say: 'Potency is how much drug you need (EC50); efficacy is the biggest effect it can give (Emax).', clear: true, actions: pvActions, items: pvItems },
    // Slide 19: therapeutic index.
    { script: `${Qs('What is the therapeutic index?', 'How is it calculated? (TD50 ÷ ED50)', 'Wide vs narrow: why does it matter?')}
[tabs: Wide → Narrow]`,
      notes: `• Therapeutic index = how SAFE a drug is (gap between the helpful and the harmful dose)
• TI = TD50 ÷ ED50 (ED50: works in half of people; TD50: toxic in half of people)
• Note the graph: the y-axis is '% of PEOPLE' who respond (a population curve), not how big the effect is in one person as on the dose–response slide
• Wide TI → big safety margin (e.g. penicillin)
• Narrow TI → easy to overdose (warfarin, lithium, digoxin) → blood levels monitored
• Bigger TI = safer drug`,
      say: 'The therapeutic index compares the toxic dose to the helpful dose; the wider it is, the safer the drug.', clear: true, actions: tiActions, items: tiItems },
    // Slide 20: receptor regulation (up and down).
    { script: `${Qs('What is tolerance?', 'What is downregulation (and desensitisation)?', 'What is upregulation?', 'Why do withdrawal and rebound effects happen?')}
[tabs: Normal → Too much stimulation → Too little stimulation]`,
      notes: `• Receptor regulation = cells adjust how many receptors they have (and how strongly they respond) to stay balanced
• (This is a big reason for tolerance and withdrawal, covered properly in part 4)
• Tolerance = needing more drug for the same effect
• Big reason: cells adjust their receptors to stay balanced
• Too much stimulation (e.g. daily opioids) → downregulation: receptors pulled inside, fewer made
• Remaining receptors respond less = desensitisation
• Same dose, less effect = tolerance; stop suddenly → too few receptors → withdrawal
• Too little stimulation (e.g. daily beta-blocker) → upregulation: more receptors → extra sensitive
• Stop suddenly → rebound (e.g. racing heart)`,
      say: 'Cells regulate their receptors: too much stimulation means fewer receptors, too little means more.', clear: true, actions: tolActions, items: tolItems },
    // Slide 21: the placebo effect.
    { script: `${Qs('What is a placebo?', 'What is the placebo effect?', 'How do we know a drug really works?', 'Why does a placebo work, and what can it not do?')}
[tabs: What is a placebo? → A fair test → Why does it work?]`,
      notes: `• Placebo = a dummy treatment with NO active drug (e.g. a sugar pill, salt-water injection) that looks exactly like the real thing
• Placebo effect = a real improvement that comes from EXPECTING to get better, not from a drug
• Fair test (clinical trial): one group gets the real drug, the other an identical placebo; nobody knows who got which (blinded)
• The placebo group improves too (e.g. 35%), the drug group more (e.g. 60%)
• The drug's REAL effect = how much MORE the drug group improves than the placebo group → why new drugs are tested against placebo
• Why it works: expectation → the brain releases its own chemicals (e.g. endorphins, the body's natural painkillers) → you feel better
• Works best on symptoms you feel: pain, nausea, mood, anxiety, tiredness, sleep
• Can't fix the disease itself: infections, tumours, broken bones, high blood sugar
• It's a real effect, not "all in your head"; natural recovery and extra care also help
• Nocebo = the opposite: expecting side effects can cause them`,
      say: 'A placebo has no drug in it, yet people often feel better because they expect to, so drugs are tested against placebos.', clear: true, actions: plaActions, items: plaItems },
  );
})();
