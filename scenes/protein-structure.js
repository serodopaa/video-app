// Explainer: the four levels of protein structure. Built slide by slide with the user.
// The user does the drawing; these visuals simply appear (drawn: false). Board is 1600 x 900.
(() => {
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  const svgDoc = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">${inner}</svg>`;
  const title = (text) => ({ type: 'text', x: 800, y: 66, text, size: 56, font: 'sans', bold: true, align: 'center', color: 'ink' });
  const txt = (text, x, y, size, color = 'ink', extra = {}) => ({ type: 'text', x, y, text, size, font: 'sans', color, ...extra });
  const DARK = '#3b4252';
  const label = (text, x, y, from, to, align = 'center', size = 24) => [
    txt(text, x, y, size, 'ink', { align }),
    { type: 'line', from, to, color: DARK, width: 2.5, rough: false },
    { type: 'circle', x: to[0], y: to[1], r: 5, color: DARK, width: 2, fill: DARK, fillOpacity: 1, rough: false },
  ];
  const svgItem = (inner) => ({ type: 'svg', svg: svgDoc(inner) });
  const at = (x, y, s, inner) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})">${inner}</g>`;

  // ---------- colours ----------
  const AA = { np: '#f5c84c', p: '#7cc47f', pos: '#5b8def', neg: '#f26b5b' };          // nonpolar, polar, +, -
  const AA_EDGE = { np: '#a07c00', p: '#2e7d32', pos: '#1d4fb0', neg: '#a8281a' };
  const HELIX = { front: '#e8506a', back: '#a8314a', edge: '#7a1f33' };
  const SHEET = { a: '#f6c45a', b: '#e2a52f', edge: '#9a6a00' };
  const LOOP = { fill: '#b8c2cf', edge: '#5f6b7a' };
  const HB = '#2f6fde';                                                                   // hydrogen bonds

  // ---------- building blocks (SVG markup) ----------
  // amino-acid bead
  const bead = (x, y, r, kind, name) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${AA[kind]}" stroke="${AA_EDGE[kind]}" stroke-width="3"/>
    <circle cx="${f1(x - r * 0.3)}" cy="${f1(y - r * 0.32)}" r="${f1(r * 0.28)}" fill="#ffffff" opacity="0.45"/>
    ${name ? `<text x="${f1(x)}" y="${f1(y + r * 0.32)}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="${f1(r * 0.78)}" text-anchor="middle" fill="#1f2430">${name}</text>` : ''}`;
  // a chain of beads through points
  const chain = (pts, r, kinds, names = []) => `<polyline points="${pts.map((p) => p.map(f1).join(',')).join(' ')}" fill="none" stroke="#5f6b7a" stroke-width="${f1(r * 0.35)}" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map(([x, y], i) => bead(x, y, r, kinds[i % kinds.length], names[i])).join('')}`;

  // alpha helix ribbon (vertical), back half darker so it reads as a 3-D coil
  const helix = (cx, y0, y1, R, turns, opts = {}) => {
    const N = Math.round(turns * 48), T = turns * Math.PI * 2;
    const P = (t) => [cx + R * Math.sin(t), y0 + ((y1 - y0) * t) / T - R * 0.28 * Math.cos(t)];
    const seg = (front) => {
      let out = '';
      for (let i = 0; i < N; i++) {
        const t = (i / N) * T, t2 = ((i + 1) / N) * T, c = Math.cos((t + t2) / 2);
        if ((c > 0) !== front) continue;
        const [x1, y1_] = P(t), [x2, y2] = P(t2), w = 5 + 17 * Math.abs(c);
        out += `<line x1="${f1(x1)}" y1="${f1(y1_)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${front ? (opts.front || HELIX.front) : (opts.back || HELIX.back)}" stroke-width="${f1(w)}" stroke-linecap="round"/>`;
      }
      return out;
    };
    let hb = '';
    const hbPts = [];
    if (opts.hbonds) {
      for (let k = 0; k < turns - 1; k++) {
        const [xa, ya] = P(k * Math.PI * 2 + 0.25), [xb, yb] = P(k * Math.PI * 2 + 2 * Math.PI + 0.55);
        hbPts.push([(xa + xb) / 2 + 10, (ya + yb) / 2]);
        hb += `<line x1="${f1(xa + 10)}" y1="${f1(ya + 6)}" x2="${f1(xb + 10)}" y2="${f1(yb - 6)}" stroke="${HB}" stroke-width="3.5" stroke-dasharray="5 5"/>`;
      }
    }
    return { svg: `${seg(false)}${seg(true)}${hb}`, hb, hbPts, start: P(0), end: P(T) };
  };

  // beta strand: a broad pleated arrow from (x0,y) to (x1,y); dir = +1 right, -1 left
  const strand = (x0, x1, y, h = 40, ox = 0) => {
    const dir = Math.sign(x1 - x0), head = 46 * dir, shaftEnd = x1 - head;
    let facets = '';
    const n = Math.max(2, Math.round(Math.abs(shaftEnd - x0) / 38));
    for (let i = 0; i < n; i++) {
      const a = x0 + ((shaftEnd - x0) * i) / n, b = x0 + ((shaftEnd - x0) * (i + 1)) / n;
      facets += `<polygon points="${f1(a)},${f1(y - h / 2 + ox)} ${f1(b)},${f1(y - h / 2 - ox)} ${f1(b)},${f1(y + h / 2 - ox)} ${f1(a)},${f1(y + h / 2 + ox)}" fill="${i % 2 ? SHEET.b : SHEET.a}"/>`;
    }
    const outline = `<polygon points="${f1(x0)},${f1(y - h / 2)} ${f1(shaftEnd)},${f1(y - h / 2)} ${f1(shaftEnd)},${f1(y - h)} ${f1(x1)},${f1(y)} ${f1(shaftEnd)},${f1(y + h)} ${f1(shaftEnd)},${f1(y + h / 2)} ${f1(x0)},${f1(y + h / 2)}" fill="none" stroke="${SHEET.edge}" stroke-width="3" stroke-linejoin="round"/>`;
    return `<polygon points="${f1(shaftEnd)},${f1(y - h)} ${f1(x1)},${f1(y)} ${f1(shaftEnd)},${f1(y + h)}" fill="${SHEET.a}"/>${facets}${outline}`;
  };

  // loop / coil tube along a path
  const tube = (d, w = 14) => `<path d="${d}" fill="none" stroke="${LOOP.edge}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${LOOP.fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // a globular subunit (wobbly blob) with faint helices inside
  const blob = (cx, cy, R, color, edge, seed = 0, label = '') => {
    const pts = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2, r = R * (1 + 0.07 * Math.sin(5 * a + seed) + 0.04 * Math.sin(9 * a + seed * 2));
      pts.push(`${f1(cx + Math.cos(a) * r)},${f1(cy + Math.sin(a) * r)}`);
    }
    const id = 'g' + Math.round(cx) + '_' + Math.round(cy);
    const inner = [0, 1, 2].map((k) => {
      const h = helix(cx - R * 0.45 + k * R * 0.45, cy - R * 0.5, cy + R * 0.45, R * 0.12, 3, { front: '#ffffff', back: '#ffffff' });
      return `<g opacity="0.22">${h.svg}</g>`;
    }).join('');
    return `<defs><radialGradient id="${id}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="0.5" stop-color="${color}" stop-opacity="1"/><stop offset="1" stop-color="${edge}" stop-opacity="1"/></radialGradient></defs>
      <polygon points="${pts.join(' ')}" fill="url(#${id})" stroke="${edge}" stroke-width="4" stroke-linejoin="round"/>${inner}
      ${label ? `<text x="${f1(cx)}" y="${f1(cy + 16)}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="${f1(R * 0.36)}" text-anchor="middle" fill="#ffffff" stroke="${edge}" stroke-width="1">${label}</text>` : ''}`;
  };
  const heme = (x, y) => `<rect x="${f1(x - 13)}" y="${f1(y - 13)}" width="26" height="26" rx="4" fill="#c0392b" stroke="#6e1a12" stroke-width="2.5" transform="rotate(45 ${f1(x)} ${f1(y)})"/><circle cx="${f1(x)}" cy="${f1(y)}" r="5" fill="#f5c84c"/>`;

  // ---------- small pictures of each level (local 300 x 220 box) ----------
  const KINDS10 = ['np', 'p', 'pos', 'np', 'neg', 'p', 'np', 'pos', 'p', 'neg'];
  const miniPrimary = () => chain([...Array(8)].map((_, i) => [26 + i * 35, 110 + (i % 2 ? -18 : 18)]), 15, KINDS10);
  const miniSecondary = () => helix(80, 20, 200, 34, 4).svg + strand(150, 290, 70, 30, 4) + strand(290, 150, 130, 30, -4) + strand(150, 290, 190, 30, 4);
  const miniTertiary = () => {
    const h1 = helix(70, 170, 40, 22, 3), h2 = helix(232, 40, 170, 22, 3);
    return tube('M30 205 C40 200 60 190 70 178') + h1.svg + tube('M70 32 C90 4 140 10 150 40 C152 54 130 64 112 70', 11) + strand(112, 200, 80, 22, 3) + strand(200, 112, 120, 22, -3)
      + tube('M200 124 C218 120 226 100 230 52', 11) + h2.svg + tube('M232 178 C236 196 250 206 268 210', 11);
  };
  const miniQuaternary = () => blob(105, 70, 58, '#e8506a', '#7a1f33', 0.3, 'α') + blob(195, 70, 58, '#5b8def', '#1d4fb0', 1.1, 'β')
    + blob(105, 160, 58, '#5b8def', '#1d4fb0', 2.2, 'β') + blob(195, 160, 58, '#e8506a', '#7a1f33', 3.1, 'α');
  const MINIS = [miniPrimary, miniSecondary, miniTertiary, miniQuaternary];
  const LEVELS = [
    { name: 'Primary', color: '#c58a00', what: 'The order of amino acids\nin the chain', bond: 'Peptide bonds' },
    { name: 'Secondary', color: '#d6336c', what: 'Local folds: α-helices\nand β-pleated sheets', bond: 'H-bonds between\nbackbone atoms' },
    { name: 'Tertiary', color: '#2f6fde', what: 'The whole chain folded\ninto one 3-D shape', bond: 'R-group interactions' },
    { name: 'Quaternary', color: '#7b3fd0', what: 'Two or more chains\nfitting together', bond: 'R-group interactions\nbetween chains' },
  ];

  // ====================================================================== slide 1: the hook
  const HOOK_X = [80, 460, 840, 1220];
  const hookItems = [
    title('From a chain to a machine'),
    svgItem(HOOK_X.map((x, i) => at(x, 250, 1, `<rect x="-14" y="-24" width="328" height="268" rx="18" fill="#ffffff" stroke="#d9dce3" stroke-width="2"/>${MINIS[i]()}`)).join('')
      + [0, 1, 2].map((i) => `<path d="M${HOOK_X[i] + 322} 360 L${HOOK_X[i + 1] - 22} 360" stroke="#8a8f98" stroke-width="5" stroke-linecap="round"/><polygon points="${HOOK_X[i + 1] - 16},360 ${HOOK_X[i + 1] - 32},350 ${HOOK_X[i + 1] - 32},370" fill="#8a8f98"/>`).join('')),
    txt('A chain of amino acids', 230, 200, 24, '#5b6270', { align: 'center', bold: true }),
    txt('A working protein', 1370, 200, 24, '#5b6270', { align: 'center', bold: true }),
    txt('How does a simple chain fold into a protein that can do a job?', 800, 680, 34, 'ink', { align: 'center', bold: true }),
    txt('Proteins carry oxygen, fight infections and speed up reactions, but only in the right shape.', 800, 730, 24, '#5b6270', { align: 'center' }),
  ];
  const hookActions = [{
    id: 'levels', label: 'Reveal the four levels', stay: true, drawn: false,
    items: LEVELS.flatMap((lv, i) => [
      txt(`${i + 1}. ${lv.name}`, HOOK_X[i] + 150, 540, 32, lv.color, { align: 'center', bold: true, anim: 'pop', duration: 0.4, at: 0.2 + i * 0.7 }),
      txt(lv.what, HOOK_X[i] + 150, 588, 20, '#3b4252', { align: 'center', anim: 'fade', duration: 0.4, at: 0.35 + i * 0.7 }),
    ]),
  }];

  // ====================================================================== slide 2: primary structure
  const P_PTS = [...Array(10)].map((_, i) => [190 + i * 130, 270 + (i % 2 ? -34 : 34)]);
  const P_NAMES = ['Met', 'Gly', 'Lys', 'Leu', 'Glu', 'Ser', 'Val', 'Arg', 'Thr', 'Asp'];
  const P_KINDS = ['np', 'np', 'pos', 'np', 'neg', 'p', 'np', 'pos', 'p', 'neg'];
  const primaryChain = svgItem(chain(P_PTS, 42, P_KINDS, P_NAMES));
  // a structural formula on one line, as text items; bonds as short lines
  const atom = (t, x, y, color = 'ink', size = 30) => txt(t, x, y, size, color, { align: 'center', bold: true });
  const bond = (x1, y1, x2, y2, double = false) => double
    ? [{ type: 'line', from: [x1 - 4, y1], to: [x2 - 4, y2], color: DARK, width: 3, rough: false }, { type: 'line', from: [x1 + 4, y1], to: [x2 + 4, y2], color: DARK, width: 3, rough: false }]
    : [{ type: 'line', from: [x1, y1], to: [x2, y2], color: DARK, width: 3, rough: false }];
  // a single amino acid centred on (x, y): H2N - C(H)(R) - COOH
  const aminoAcid = (x, y, r = 'R', rColor = '#a07c00', hl = {}) => [
    ...(hl.h ? [atom('H', x - 132, y, hl.h), ...bond(x - 116, y, x - 98, y), atom('N', x - 78, y), ...bond(x - 78, y + 20, x - 78, y + 46), atom('H', x - 78, y + 66)] : [atom('H₂N', x - 96, y, hl.n || 'ink')]), ...bond(x - 58, y, x - 20, y),
    atom('C', x, y), ...bond(x, y - 20, x, y - 46), atom('H', x, y - 64),
    ...bond(x, y + 20, x, y + 46), atom(r, x, y + 66, rColor),
    ...bond(x + 20, y, x + 58, y), atom('C', x + 78, y), ...bond(x + 78, y - 20, x + 78, y - 46, true), atom('O', x + 78, y - 64),
    ...bond(x + 98, y, x + 126, y), atom('OH', x + 152, y, hl.oh || 'ink'),
  ];
  // two amino acids side by side (before) and the dipeptide (after)
  const PB = { x: 630, y: 640 };
  const beforeItems = [
    ...aminoAcid(PB.x - 60, PB.y, 'R₁', '#a07c00', { oh: '#e0453a' }),
    atom('+', PB.x + 170, PB.y, '#5b6270', 34),
    ...aminoAcid(PB.x + 340, PB.y, 'R₂', '#2e7d32', { h: '#e0453a' }),
  ];
  // in the second amino acid the H2N is drawn as "H–N(H)–": split so its H can leave
  const afterItems = (t0) => {
    const x = PB.x - 160, y = PB.y, o = { at: t0 };
    const A = (t, dx, c = 'ink', s = 30) => ({ ...atom(t, x + dx, y, c, s), ...o });
    const B = (x1, y1, x2, y2, d) => bond(x + x1, y1, x + x2, y2, d).map((b) => ({ ...b, ...o }));
    return [
      { type: 'highlight', x: x + 250, y: y - 26, w: 70, h: 52, color: '#ffd34d', opacity: 0.7, ...o },
      A('H₂N', 0), ...B(38, y, 76, y), A('C', 96), ...B(96, y - 20, 96, y - 46), { ...atom('H', x + 96, y - 64), ...o },
      ...B(96, y + 20, 96, y + 46), { ...atom('R₁', x + 96, y + 66, '#a07c00'), ...o },
      ...B(116, y, 154, y), A('C', 174), ...B(174, y - 20, 174, y - 46, true), { ...atom('O', x + 174, y - 64), ...o },
      ...B(194, y, 264, y), A('N', 284), ...B(284, y + 20, 284, y + 46), { ...atom('H', x + 284, y + 66), ...o },
      ...B(304, y, 342, y), A('C', 362), ...B(362, y - 20, 362, y - 46), { ...atom('H', x + 362, y - 64), ...o },
      ...B(362, y + 20, 362, y + 46), { ...atom('R₂', x + 362, y + 66, '#2e7d32'), ...o },
      ...B(382, y, 420, y), A('COOH', 470),
      { ...txt('peptide bond', x + 229, y - 110, 24, '#9a6a00', { align: 'center', bold: true }), ...o },
      { type: 'arrow', from: [x + 229, y - 92], to: [x + 229, y - 34], color: '#9a6a00', width: 3, rough: false, ...o },
      { ...txt('+ H₂O', x + 620, y, 34, '#2f6fde', { align: 'center', bold: true, anim: 'pop' }), ...o, at: t0 + 0.4, duration: 0.4 },
      { ...txt('water is released', x + 620, y + 44, 20, '#2f6fde', { align: 'center' }), ...o, at: t0 + 0.6 },
    ];
  };
  const pepActions = [{
    id: 'pep', label: 'Form a peptide bond', stay: true, drawn: false,
    items: [
      ...beforeItems.map((it) => ({ ...it, at: 0, until: 1.6 })),
      { type: 'flash', x: PB.x + 92, y: PB.y, r: 34, color: '#e0453a', duration: 0.8, at: 0.6 },
      { type: 'flash', x: PB.x + 208, y: PB.y, r: 26, color: '#e0453a', duration: 0.8, at: 0.6 },
      ...afterItems(1.7),
    ],
  }, {
    id: 'swap', label: 'Change one amino acid', stay: true, drawn: false,
    items: [
      svgItem(bead(P_PTS[4][0], P_PTS[4][1], 42, 'np', 'Val')),
      { type: 'pulse', x: P_PTS[4][0], y: P_PTS[4][1], r: 50, color: '#e0453a', speed: 1.2 },
      txt('One change in the sequence (Glu → Val) can change the whole protein:\nthis exact swap in hemoglobin causes sickle cell disease.', 800, 390, 22, '#a8281a', { align: 'center', bold: true }),
    ],
  }];
  const primaryItems = [
    title('Primary structure'),
    primaryChain,
    txt('H₃N⁺', 116, 304, 28, '#3b4252', { align: 'right', bold: true }), txt('N-terminus', 84, 340, 20, '#5b6270', { align: 'center' }),
    txt('COO⁻', 1450, 236, 28, '#3b4252', { bold: true }), txt('C-terminus', 1492, 196, 20, '#5b6270', { align: 'center' }),
    { type: 'line', from: [120, 302], to: [148, 302], color: '#5f6b7a', width: 5, rough: false },
    { type: 'line', from: [1404, 236], to: [1444, 236], color: '#5f6b7a', width: 5, rough: false },
    ...label('Amino acid', 255, 170, [255, 190], [P_PTS[0][0] + 34, P_PTS[0][1] - 28], 'center', 24),
    ...label('Peptide bond', 470, 166, [460, 186], [(P_PTS[1][0] + P_PTS[2][0]) / 2, (P_PTS[1][1] + P_PTS[2][1]) / 2], 'center', 24),
    txt('The primary structure is the exact order (sequence) of amino acids, joined by peptide bonds.', 800, 460, 26, 'ink', { align: 'center', bold: true }),
    { type: 'rect', x: 80, y: 500, w: 1440, h: 340, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    txt('How amino acids join: a peptide bond', 110, 530, 24, '#5b6270', { bold: true }),
    ...beforeItems.map((it) => ({ ...it, hideDuring: 'pep' })),
    txt('The carboxyl group of one amino acid joins the amino group of the next, releasing water.', 800, 808, 21, '#5b6270', { align: 'center' }),
    // key
    ...[['np', 'Nonpolar'], ['p', 'Polar'], ['pos', 'Positive (+)'], ['neg', 'Negative (−)']].flatMap(([k, n], i) => [
      svgItem(bead(1120 + (i % 2) * 190, 140 + Math.floor(i / 2) * 0, 12, k)),
    ]).slice(0, 0),
  ];

  // ====================================================================== slide 3: secondary structure
  // Three tabs (α-helix, β-sheet, random coil). Each one draws the BACKBONE atom by atom
  // (N, Cα, C with C=O and N–H groups): secondary structure is hydrogen bonds between backbone
  // groups. The R groups are drawn faded, on purpose, to show they are not involved.
  const SS = [
    { id: 'ss-helix', name: 'α-helix', color: '#d6336c' },
    { id: 'ss-sheet', name: 'β-sheet', color: '#c58a00' },
    { id: 'ss-coil', name: 'Random coil', color: '#5f6b7a' },
  ];
  const SS_W = 330, SS_GAP = 24, SS_Y = 112, SS_H = 58;
  const SS_X = SS.map((_, i) => Math.round((1600 - (SS.length * SS_W + (SS.length - 1) * SS_GAP)) / 2) + i * (SS_W + SS_GAP));
  const ssTabsStatic = SS.flatMap((t, i) => [
    { type: 'rect', x: SS_X[i], y: SS_Y, w: SS_W, h: SS_H, color: '#c9cfda', fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
    txt(t.name, SS_X[i] + SS_W / 2, SS_Y + SS_H / 2, 28, '#3b4252', { align: 'center', bold: true }),
    { type: 'hotspot', x: SS_X[i], y: SS_Y, w: SS_W, h: SS_H, action: t.id },
  ]);
  const ssTabOn = (t, i) => [
    { type: 'rect', x: SS_X[i], y: SS_Y, w: SS_W, h: SS_H, color: t.color, fill: t.color, fillOpacity: 1, width: 3, rough: false },
    txt(t.name, SS_X[i] + SS_W / 2, SS_Y + SS_H / 2, 28, '#ffffff', { align: 'center', bold: true }),
  ];

  // ---- atoms ----
  const ATM = {
    N: { fill: '#5b8def', stroke: '#1d4fb0', r: 15, t: 'N', tc: '#ffffff' },
    CA: { fill: '#d5d9e0', stroke: '#6b7280', r: 13, t: 'Cα', tc: '#3b4252' },
    C: { fill: '#6b7280', stroke: '#2d3340', r: 15, t: 'C', tc: '#ffffff' },
    O: { fill: '#f26b5b', stroke: '#a8281a', r: 12, t: 'O', tc: '#ffffff' },
    H: { fill: '#ffffff', stroke: '#8a8f98', r: 9, t: 'H', tc: '#3b4252' },
  };
  const atomSvg = (x, y, k, op = 1) => {
    const a = ATM[k];
    return `<g opacity="${op}"><circle cx="${f1(x)}" cy="${f1(y)}" r="${a.r}" fill="${a.fill}" stroke="${a.stroke}" stroke-width="2.5"/>
      <text x="${f1(x)}" y="${f1(y + a.r * 0.36)}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="${f1(a.r * (k === 'CA' ? 0.8 : 1.0))}" text-anchor="middle" fill="${a.tc}">${a.t}</text></g>`;
  };
  const ln = (x1, y1, x2, y2, w, c, op = 1, extra = '') => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${op}" ${extra}/>`;
  // A backbone drawn from atoms [{x, y, k:'N'|'CA'|'C', d: depth (1 = front), o:[dx,dy] for C's oxygen,
  // h:[dx,dy] for N's hydrogen, r:[dx,dy] for Cα's R group}]. The backbone gets an amber glow.
  const backbone = (atoms) => {
    const halo = atoms.slice(1).map((b, i) => ln(atoms[i].x, atoms[i].y, b.x, b.y, 34, '#ffd34d', 0.4)).join('');
    const els = [];
    atoms.forEach((a, i) => {
      const op = a.d !== undefined && a.d < 0 ? 0.38 : 1, d = a.d ?? 1;
      if (i > 0) { const p = atoms[i - 1]; els.push([(d + (p.d ?? 1)) / 2, ln(p.x, p.y, a.x, a.y, 7, '#3b4252', (op + (p.d !== undefined && p.d < 0 ? 0.38 : 1)) / 2)]); }
      if (a.d !== undefined && a.d < 0) return;         // back of the coil: just the faint backbone line
      let side = '';
      if (a.k === 'C' && a.o) {
        const [dx, dy] = a.o, l = Math.hypot(dx, dy), nx = -dy / l * 3.5, ny = dx / l * 3.5;
        side = ln(a.x + nx, a.y + ny, a.x + dx + nx, a.y + dy + ny, 3.5, '#3b4252', op) + ln(a.x - nx, a.y - ny, a.x + dx - nx, a.y + dy - ny, 3.5, '#3b4252', op) + atomSvg(a.x + dx, a.y + dy, 'O', op);
      } else if (a.k === 'N' && a.h) {
        side = ln(a.x, a.y, a.x + a.h[0], a.y + a.h[1], 4, '#3b4252', op) + atomSvg(a.x + a.h[0], a.y + a.h[1], 'H', op);
      } else if (a.k === 'CA' && a.r) {
        const [dx, dy] = a.r;
        side = ln(a.x, a.y, a.x + dx, a.y + dy, 4, '#b9a46a', 0.5 * op) + `<g opacity="${0.55 * op}"><circle cx="${f1(a.x + dx)}" cy="${f1(a.y + dy)}" r="14" fill="#efe2b8" stroke="#b9a46a" stroke-width="2.5" stroke-dasharray="4 3"/><text x="${f1(a.x + dx)}" y="${f1(a.y + dy + 5)}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="14" text-anchor="middle" fill="#8a7a45">R</text></g>`;
      }
      els.push([d + 0.01, side + atomSvg(a.x, a.y, a.k, op)]);
    });
    els.sort((p, q) => p[0] - q[0]);
    return halo + els.map((e) => e[1]).join('');
  };
  const hbLine = (p, q, at) => ({ type: 'line', from: p, to: q, color: HB, width: 4.5, dashed: true, rough: false, at, duration: 0.35 });

  // ---- α-helix: a coiled backbone ribbon. Only the groups that make hydrogen bonds are drawn: each C=O
  // sits directly above the N–H one turn further down (4 residues on). Atoms are placed on the ribbon. ----
  const HC = { cx: 470, y0: 310, y1: 735, R: 135, turns: 3.2 };
  const HT = HC.turns * Math.PI * 2;
  const hP = (t) => [HC.cx + HC.R * Math.sin(t), HC.y0 + ((HC.y1 - HC.y0) * t) / HT - HC.R * 0.28 * Math.cos(t)];
  // [turn k, angle]: bonds from turn k to turn k+1. Alternating angle sets keep the C=O and N–H atoms apart.
  const hxBondDefs = [[0, -0.5], [1, 0.5], [2, -0.5]];
  const hxPairs = hxBondDefs.map(([k, phi]) => {
    const ta = Math.PI * 2 * k + phi, c = hP(ta), n = hP(ta + Math.PI * 2);
    return { c, o: [c[0], c[1] + 28], n, h: [n[0], n[1] - 26] };
  });
  const helixPicture = () => {
    const rib = helix(HC.cx, HC.y0, HC.y1, HC.R, HC.turns, { front: '#f2c14e', back: '#b9882a' }).svg;
    const dbl = (x, y1, y2) => ln(x - 3.5, y1, x - 3.5, y2, 3.5, '#3b4252') + ln(x + 3.5, y1, x + 3.5, y2, 3.5, '#3b4252');
    return rib + hxPairs.map((q) => dbl(q.c[0], q.c[1], q.o[1]) + ln(q.n[0], q.n[1], q.h[0], q.h[1], 4, '#3b4252')
      + atomSvg(q.c[0], q.c[1], 'C') + atomSvg(q.o[0], q.o[1], 'O') + atomSvg(q.n[0], q.n[1], 'N') + atomSvg(q.h[0], q.h[1], 'H')).join('');
  };
  const hxBonds = hxPairs.map((q) => [q.o, q.h]);
  const hxMid = hxPairs[1];  // the bond that gets the labels

  // ---- β-sheet: three antiparallel strands, residues alternate which side their C=O / N–H face ----
  const BS = { x0: 200, dx: 54, ys: [295, 465, 635], nres: 4 };
  const strandAtoms = (s) => {
    const out = [];
    for (let j = 0; j < BS.nres * 3; j++) {
      const r = Math.floor(j / 3), m = j % 3;
      const k = s % 2 === 0 ? ['N', 'CA', 'C'][m] : ['C', 'CA', 'N'][m];          // strand 2 runs the other way
      const down = (r + (s + 1)) % 2 === 1;                                       // which neighbour this residue's groups face
      const y = BS.ys[s] + (j % 2 ? 15 : -15);
      const dir = down ? 1 : -1;
      out.push({ x: BS.x0 + j * BS.dx, y, k, o: [0, 40 * dir], h: [0, 34 * dir], r: [0, (j % 2 ? 1 : -1) * 44], _down: down, _r: r, _m: m });
    }
    return out;
  };
  const shAtoms = [0, 1, 2].map(strandAtoms);
  // H-bonds join groups that face each other in the same column
  const shBonds = [];
  [0, 1].forEach((s) => shAtoms[s].forEach((a, j) => {
    const b = shAtoms[s + 1][j];
    if (!a._down || b._down || a.k === 'CA') return;
    const p = a.k === 'C' ? [a.x + a.o[0], a.y + a.o[1]] : [a.x + a.h[0], a.y + a.h[1]];
    const q = b.k === 'C' ? [b.x + b.o[0], b.y + b.o[1]] : [b.x + b.h[0], b.y + b.h[1]];
    shBonds.push([p, q]);
  }));

  // ---- random coil: an irregular backbone with no repeating pattern of bonds ----
  const coilPts = [[140, 636], [200, 604], [260, 636], [320, 604], [380, 636], [440, 604], [492, 590], [500, 530], [466, 484], [406, 456], [346, 484], [288, 456], [228, 484], [168, 456], [110, 484], [96, 424], [130, 372], [190, 356], [250, 376], [300, 350], [360, 330], [420, 346]];
  const coilOff = { o: [[0, 38], [8, 38], [30, 24], [-26, 30], [0, 38], [0, -38], [30, 20], [-34, -14], [0, -38], [26, -30]], h: [[-8, 36], [10, 34], [-30, 24], [26, 30], [-8, 36], [-6, 34], [30, 20], [-30, 20], [26, -30], [0, 34]], r: [[10, -42], [-14, 42], [-38, -20], [36, 22], [0, 44], [-30, 30], [28, -36], [30, 34], [14, 42], [-26, -34]] };
  const coilAtoms = coilPts.map(([x, y], i) => ({
    x, y, k: ['N', 'CA', 'C'][i % 3],
    o: coilOff.o[Math.floor(i / 3)], h: coilOff.h[Math.floor(i / 3)], r: coilOff.r[Math.floor(i / 3)],
  }));
  // one tight turn does form a single hydrogen bond: C=O of one residue to the N–H facing it
  const coilBond = [[coilAtoms[5].x + coilAtoms[5].o[0], coilAtoms[5].y + coilAtoms[5].o[1]], [coilAtoms[9].x + coilAtoms[9].h[0], coilAtoms[9].y + coilAtoms[9].h[1]]];

  const ssLegend = svgItem(
    `<rect x="84" y="780" width="296" height="42" rx="21" fill="#ffd34d" opacity="0.4"/>`
    + [['N'], ['CA'], ['C'], ['O'], ['H']].map(([k], i) => atomSvg(122 + i * 56, 801, k)).join('')
    + `<g opacity="0.7"><circle cx="700" cy="801" r="14" fill="#efe2b8" stroke="#b9a46a" stroke-width="2.5" stroke-dasharray="4 3"/><text x="700" y="806" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="14" text-anchor="middle" fill="#8a7a45">R</text></g>`);
  const ssLegendText = [
    txt('Backbone atoms', 398, 801, 20, '#8a6d00', { bold: true }),
    txt('R group (faded): not involved', 724, 801, 20, '#8a7a45', { bold: true }),
  ];

  // ---- right-hand box: an explanation, or one of two reference pictures ----
  const SSR_BTN = [['aa', 'An amino acid', 956], ['pic', 'Typical picture', 1248]];
  const aaFormula = () => {
    const cx = 1240, cy = 500, bl = (x1, y1, x2, y2, w = 6, c = '#3b4252', ex = '') => ln(x1, y1, x2, y2, w, c, 1, ex);
    const back = ln(1110, cy, cx, cy, 36, '#ffd34d', 0.4) + ln(cx, cy, 1370, cy, 36, '#ffd34d', 0.4);
    const dbl = (x1, y1, x2, y2) => bl(x1 - 4, y1, x2 - 4, y2, 3.5) + bl(x1 + 4, y1, x2 + 4, y2, 3.5);
    return back
      + bl(1110, cy, cx, cy, 7) + bl(cx, cy, 1370, cy, 7)
      + bl(1110, cy, 1070, cy - 52, 4) + bl(1110, cy, 1070, cy + 52, 4) + bl(cx, cy, cx, cy - 66, 4)
      + bl(cx, cy, cx, cy + 66, 4, '#b9a46a') + dbl(1370, cy, 1370, cy - 66) + bl(1370, cy, 1440, cy + 40, 4) + bl(1440, cy + 40, 1496, cy + 40, 4)
      + atomSvg(1110, cy, 'N') + atomSvg(1070, cy - 52, 'H') + atomSvg(1070, cy + 52, 'H')
      + atomSvg(cx, cy, 'CA') + atomSvg(cx, cy - 66, 'H')
      + atomSvg(1370, cy, 'C') + atomSvg(1370, cy - 66, 'O') + atomSvg(1440, cy + 40, 'O') + atomSvg(1496, cy + 40, 'H')
      + `<circle cx="${cx}" cy="${cy + 90}" r="26" fill="#efe2b8" stroke="#b9a46a" stroke-width="3"/><text x="${cx}" y="${cy + 99}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="#8a7a45">R</text>`;
  };
  const rightPanel = (t, base, mode, head, body) => {
    const items = [
      { type: 'rect', x: 940, y: 200, w: 600, h: 566, color: t.color, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
      ...SSR_BTN.flatMap(([m, label, x]) => [
        { type: 'rect', x, y: 214, w: 280, h: 44, color: t.color, fill: mode === m ? t.color : '#ffffff', fillOpacity: 1, width: 3, rough: false },
        txt(label, x + 140, 236, 24, mode === m ? '#ffffff' : t.color, { align: 'center', bold: true }),
        { type: 'hotspot', x, y: 214, w: 280, h: 44, action: `${base}-${m}` },
      ]),
    ];
    if (mode === 'text') {
      items.push(txt(head, 1240, 306, 34, t.color, { align: 'center', bold: true }), txt(body, 970, 410, 23, '#3b4252'),
        txt('Backbone to backbone', 1240, 730, 24, HB, { align: 'center', bold: true }));
    } else if (mode === 'aa') {
      items.push(txt('One amino acid', 1240, 300, 30, t.color, { align: 'center', bold: true }),
        svgItem(aaFormula()),
        txt('Backbone: N – Cα – C', 1240, 390, 22, '#8a6d00', { align: 'center', bold: true }),
        txt('amino group', 1090, 612, 20, '#3b4252', { align: 'center', bold: true }), txt('carboxyl group', 1430, 612, 20, '#3b4252', { align: 'center', bold: true }),
        txt('R group (side chain)', 1240, 656, 20, '#8a7a45', { align: 'center', bold: true }),
        txt('Every amino acid has this same backbone.\nOnly the R group is different.', 1240, 700, 21, '#5b6270', { align: 'center' }));
    } else {
      const k = base === 'ss-helix' ? 'helix' : base === 'ss-sheet' ? 'sheet' : 'coil';
      const pic = { helix: helix(1240, 372, 664, 72, 4, { hbonds: true }).svg,
        sheet: strand(1000, 1480, 380, 46, 5) + strand(1480, 1000, 500, 46, -5) + strand(1000, 1480, 620, 46, 5)
          + [0, 1, 2, 3, 4, 5].map((i) => [380, 500].map((y) => `<line x1="${1060 + i * 80}" y1="${y + 30}" x2="${1060 + i * 80}" y2="${y + 90}" stroke="${HB}" stroke-width="3.5" stroke-dasharray="6 5"/>`).join('')).join(''),
        coil: tube('M980 620 C1040 380 1120 720 1200 480 C1260 330 1360 650 1500 420', 20) }[k];
      items.push(txt(k === 'helix' ? 'The usual picture of an α-helix' : k === 'sheet' ? 'The usual picture of a β-sheet' : 'The usual picture of a random coil', 1240, 300, 28, t.color, { align: 'center', bold: true }),
        svgItem(pic),
        txt(k === 'coil' ? 'A loose, irregular chain' : 'Dashed lines = hydrogen bonds between\nbackbone groups. The atoms are not drawn,\nbut they are what is bonding.', 1240, k === 'coil' ? 730 : 706, 20, '#5b6270', { align: 'center' }));
    }
    return items;
  };
  const SSB = {
    'ss-helix': { head: 'α-helix', body: 'The backbone coils into a spiral.\n\nEach C=O forms a hydrogen bond with the\nN–H four residues further along the chain,\none turn up.\n\nThe bonds hold the coil in shape like\nthe turns of a spring.\n\nThe R groups stick out and take no part.' },
    'ss-sheet': { head: 'β-pleated sheet', body: 'Stretches of backbone (β-strands) lie\nside by side.\n\nC=O groups on one strand form hydrogen\nbonds with N–H groups on the next strand.\n\nThe bonds link different strands, across\nthe sheet. The R groups point alternately\nabove and below it, and are not involved.' },
    'ss-coil': { head: 'Random coil (loops, turns)', body: 'Regions with no regular, repeating shape.\n\nThe backbone bends and turns irregularly,\nso there is no steady series of hydrogen\nbonds like in a helix or a sheet.\n\nCoils and loops join helices and sheets\ntogether and make the chain flexible.' },
  };
  const leftItems = (id, stagger) => {
    const g = (n) => (stagger ? 0.8 + n : 0);
    if (id === 'ss-helix') {
      const lp = hP(4.71);
      return [svgItem(helixPicture()),
        ...hxBonds.map(([p, q], i) => hbLine(p, q, g(i * 0.35))),
        txt('N-terminus', HC.cx, 232, 18, '#5b6270', { align: 'center', bold: true }),
        ...label('Backbone: the chain\ncoils into a spiral', 70, 392, [280, 404], [lp[0] + 6, lp[1]], 'left', 20),
        ...label('C=O group', 730, hxMid.o[1] - 56, [726, hxMid.o[1] - 46], [hxMid.o[0] + 16, hxMid.o[1] - 2], 'left', 20),
        ...label('N–H group\n(one turn on)', 730, hxMid.h[1] + 40, [726, hxMid.h[1] + 36], [hxMid.h[0] + 11, hxMid.h[1] + 4], 'left', 20),
        txt('Hydrogen bond', 730, (hxMid.o[1] + hxMid.h[1]) / 2, 21, HB, { bold: true, at: stagger ? 3.2 : 0, anim: 'fade', duration: 0.4 }),
        { type: 'line', from: [722, (hxMid.o[1] + hxMid.h[1]) / 2], to: [hxMid.o[0] + 8, (hxMid.o[1] + hxMid.h[1]) / 2], color: HB, width: 2.5, rough: false, at: stagger ? 3.2 : 0 },
        txt('Every C=O bonds to the N–H four residues\nalong. R groups point outward (not drawn).', 80, 730, 19, '#5b6270', { bold: true })];
    }
    if (id === 'ss-sheet') {
      return [svgItem(shAtoms.map((a) => backbone(a)).join('')),
        ...shBonds.map(([p, q], i) => hbLine(p, q, g(i * 0.12))),
        txt('N-term', 70, 295, 17, '#5b6270', { bold: true }), txt('C-term', 822, 295, 17, '#5b6270', { bold: true }),
        txt('C-term', 70, 465, 17, '#5b6270', { bold: true }), txt('N-term', 822, 465, 17, '#5b6270', { bold: true }),
        txt('N-term', 70, 635, 17, '#5b6270', { bold: true }), txt('C-term', 822, 635, 17, '#5b6270', { bold: true }),
        txt('Hydrogen bonds join neighbouring strands', 480, 728, 20, HB, { align: 'center', bold: true, at: stagger ? 2.4 : 0, anim: 'fade', duration: 0.4 })];
    }
    return [svgItem(backbone(coilAtoms)), hbLine(coilBond[0], coilBond[1], g(0.2)),
      txt('Irregular backbone: no repeating pattern', 480, 228, 22, '#5f6b7a', { align: 'center', bold: true }),
      txt('Only an occasional\nhydrogen bond', 560, 548, 20, HB, { bold: true, at: stagger ? 1.2 : 0, anim: 'fade', duration: 0.4 })];
  };
  const ssActions = SS.flatMap((t, i) => ['text', 'aa', 'pic'].map((mode) => ({
    id: mode === 'text' ? t.id : `${t.id}-${mode}`, label: t.name, hidden: mode !== 'text', group: 'ss', stay: true, drawn: false,
    items: [...ssTabOn(t, i), ...leftItems(t.id, mode === 'text'), ...rightPanel(t, t.id, mode, SSB[t.id].head, SSB[t.id].body)],
  })));

  const secondaryItems = [
    title('Secondary structure'),
    ...ssTabsStatic,
    { type: 'rect', x: 60, y: 200, w: 840, h: 566, color: '#e3e6ec', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    { type: 'rect', x: 940, y: 200, w: 600, h: 566, color: '#e3e6ec', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    txt('Choose a type of secondary structure above', 800, 470, 34, '#8a8f98', { align: 'center', bold: true, hideDuring: SS.flatMap((s) => [s.id, `${s.id}-aa`, `${s.id}-pic`]) }),
    ssLegend, ...ssLegendText,
    { type: 'rect', x: 60, y: 836, w: 1480, h: 50, color: '#2f6fde', fill: '#eef3ff', fillOpacity: 1, width: 3, rough: false },
    txt('Secondary structure = hydrogen bonds between BACKBONE atoms (C=O and N–H).  R groups are not involved: they matter in tertiary structure.', 800, 861, 20, '#1d4fb0', { align: 'center', bold: true }),
  ];

  // ====================================================================== slide 4: tertiary structure
  // A single chain folded into a compact shape: two helices, a three-strand sheet and loops,
  // with the R-group interactions that hold the fold together marked on it.
  const T1 = helix(250, 700, 330, 40, 4), T2 = helix(700, 300, 690, 40, 4);
  const foldSvg = tube('M150 780 C170 760 200 740 236 712') + T1.svg
    + tube('M250 316 C260 240 340 220 380 260 C400 280 396 300 380 316')
    + strand(380, 600, 330, 34, 4) + tube('M600 330 C640 336 646 400 600 410') + strand(600, 380, 410, 34, -4) + tube('M380 410 C340 416 336 484 380 490') + strand(380, 600, 490, 34, 4)
    + tube('M600 490 C640 470 660 380 676 300 C680 286 690 284 700 290') + T2.svg + tube('M712 698 C720 740 750 770 790 780');
  const core = [[430, 610], [470, 640], [510, 606], [452, 572], [500, 668], [540, 640]].map(([x, y]) => bead(x, y, 20, 'np')).join('');
  const interactions = `${core}
    <ellipse cx="486" cy="622" rx="96" ry="76" fill="none" stroke="#a07c00" stroke-width="3" stroke-dasharray="9 7"/>
    ${bead(300, 420, 16, 'np', 'S')}${bead(368, 400, 16, 'np', 'S')}<line x1="316" y1="416" x2="352" y2="404" stroke="#d4a300" stroke-width="7" stroke-linecap="round"/>
    ${bead(646, 560, 18, 'pos', '+')}${bead(612, 520, 18, 'neg', '−')}
    ${bead(296, 560, 16, 'p')}${bead(376, 540, 16, 'p')}<line x1="312" y1="556" x2="360" y2="544" stroke="${HB}" stroke-width="3.5" stroke-dasharray="5 4"/>`;
  const unfolded = chain([...Array(16)].map((_, i) => [150 + i * 44, 520 + Math.sin(i * 0.9) * 40]), 18, ['np', 'p', 'pos', 'np', 'neg', 'p', 'np', 'np', 'p', 'neg', 'pos', 'np', 'p', 'np', 'neg', 'p']);
  const CARDS = [
    { y: 230, icon: bead(910, 230, 16, 'np') + bead(936, 244, 16, 'np') + bead(912, 256, 16, 'np'), head: 'Hydrophobic interactions', body: 'Nonpolar R groups cluster in the\ncore, away from water' },
    { y: 380, icon: `${bead(904, 380, 15, 'np', 'S')}${bead(950, 380, 15, 'np', 'S')}<line x1="919" y1="380" x2="935" y2="380" stroke="#d4a300" stroke-width="7"/>`, head: 'Disulfide bridges', body: 'Strong covalent S–S bonds\nbetween two cysteines' },
    { y: 530, icon: `${bead(906, 530, 16, 'pos', '+')}${bead(946, 530, 16, 'neg', '−')}`, head: 'Ionic bonds', body: 'Attraction between + and −\ncharged R groups' },
    { y: 680, icon: `${bead(904, 680, 14, 'p')}${bead(952, 680, 14, 'p')}<line x1="918" y1="680" x2="938" y2="680" stroke="${HB}" stroke-width="3.5" stroke-dasharray="4 3"/>`, head: 'Hydrogen bonds', body: 'Between polar R groups' },
  ];
  const tertiaryActions = [{
    id: 'denature', label: 'Denature it (heat)', stay: true, drawn: false,
    items: [
      { type: 'rect', x: 20, y: 150, w: 840, h: 700, color: '#fdfdfb', fill: '#fdfdfb', fillOpacity: 1, width: 1, rough: false },
      svgItem(unfolded),
      txt('Heat or acid breaks the R-group interactions:\nthe chain unfolds and the protein stops working.', 460, 700, 24, '#a8281a', { align: 'center', bold: true }),
      txt('The sequence (primary structure) is still the same.', 460, 780, 22, '#5b6270', { align: 'center' }),
    ],
  }];
  const tertiaryItems = [
    title('Tertiary structure'),
    svgItem(foldSvg + interactions),
    ...label('Hydrophobic core', 300, 820, [340, 804], [430, 680], 'center', 22),
    ...label('Disulfide bridge', 130, 296, [160, 312], [298, 412], 'center', 22),
    ...label('Ionic bond', 756, 436, [770, 450], [652, 548], 'left', 22),
    ...label('Hydrogen bond', 112, 612, [150, 596], [290, 562], 'center', 22),
    txt('One polypeptide chain folds into a unique 3-D shape,\nheld together by interactions between R groups.', 1210, 118, 23, 'ink', { align: 'center', bold: true }),
    ...CARDS.flatMap((cd, i) => {
      const y = 260 + i * 142, dy = y - cd.y;
      return [
        { type: 'rect', x: 880, y: y - 62, w: 660, h: 124, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
        svgItem(`<g transform="translate(0 ${dy})">${cd.icon}</g>`),
        txt(cd.head, 990, y - 22, 26, 'ink', { bold: true }),
        txt(cd.body, 990, y + 16, 21, '#5b6270'),
      ];
    }),
  ];

  // ====================================================================== slide 5: quaternary structure
  const Q = { cx: 560, cy: 480, R: 128, d: 118 };
  const subunits = (spread) => {
    const s = Q.d + spread;
    return blob(Q.cx - s, Q.cy - s, Q.R, '#e8506a', '#7a1f33', 0.3, 'α₁') + blob(Q.cx + s, Q.cy - s, Q.R, '#5b8def', '#1d4fb0', 1.1, 'β₁')
      + blob(Q.cx - s, Q.cy + s, Q.R, '#5b8def', '#1d4fb0', 2.2, 'β₂') + blob(Q.cx + s, Q.cy + s, Q.R, '#e8506a', '#7a1f33', 3.1, 'α₂')
      + [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => heme(Q.cx + a * s + a * 52, Q.cy + b * s + b * 44)).join('');
  };
  const quaternaryActions = [{
    id: 'assemble', label: 'Assemble the subunits', stay: true, drawn: false,
    items: [
      { ...svgItem(subunits(110)), at: 0, until: 0.9, duration: 0.2 },
      { ...svgItem(subunits(60)), at: 0.9, until: 0.5, duration: 0.15 },
      { ...svgItem(subunits(22)), at: 1.4, until: 0.4, duration: 0.15 },
      { ...svgItem(subunits(0)), at: 1.8, duration: 0.15 },
      { type: 'flash', x: Q.cx, y: Q.cy, r: 120, color: '#7b3fd0', duration: 0.8, at: 1.85 },
    ],
  }];
  const quaternaryItems = [
    title('Quaternary structure'),
    { ...svgItem(subunits(0)), hideDuring: 'assemble' },
    ...label('One subunit\n(a folded chain)', 150, 190, [200, 230], [Q.cx - Q.d - 90, Q.cy - Q.d + 30], 'center', 22),
    ...label('Heme group\n(carries O₂)', 980, 200, [930, 244], [Q.cx + Q.d + 52, Q.cy - Q.d - 44], 'center', 22),
    txt('Hemoglobin', 560, 830, 32, 'ink', { align: 'center', bold: true }),
    { type: 'rect', x: 1010, y: 300, w: 530, h: 470, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    txt('Two or more folded polypeptide\nchains (subunits) fit together\ninto one working protein.', 1040, 350, 24, 'ink', { bold: true }),
    txt('Hemoglobin has 4 subunits:\n2 α chains and 2 β chains.', 1040, 470, 23, '#3b4252'),
    txt('They are held together by the same\nR-group interactions as tertiary\nstructure, now between chains.', 1040, 570, 22, '#3b4252'),
    txt('Not every protein has quaternary\nstructure: only those with\nmore than one chain.', 1040, 690, 21, '#5b6270'),
  ];

  // ====================================================================== slide 6: review
  const RV = { y: 150, w: 350, gap: 20, h: 650 };
  const RVX = [0, 1, 2, 3].map((i) => 60 + i * (RV.w + RV.gap));
  const reviewItems = [
    title('The four levels of protein structure'),
    ...LEVELS.flatMap((lv, i) => [
      { type: 'rect', x: RVX[i], y: RV.y, w: RV.w, h: RV.h, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
      { type: 'circle', x: RVX[i] + 36, y: RV.y + 40, r: 20, color: lv.color, fill: lv.color, fillOpacity: 1, width: 2, rough: false },
      txt(String(i + 1), RVX[i] + 36, RV.y + 41, 22, 'white', { align: 'center', bold: true }),
      txt(lv.name, RVX[i] + 66, RV.y + 41, 32, lv.color, { bold: true }),
      svgItem(at(RVX[i] + 25, RV.y + 90, 1, MINIS[i]())),
      txt('What it is', RVX[i] + 24, RV.y + 352, 18, '#8a8f98', { bold: true }),
      txt(lv.what, RVX[i] + 24, RV.y + 386, 23, 'ink', { bold: true }),
      txt('Held together by', RVX[i] + 24, RV.y + 470, 18, '#8a8f98', { bold: true }),
      txt(lv.bond, RVX[i] + 24, RV.y + 504, 23, lv.color, { bold: true }),
      { type: 'hotspot', x: RVX[i], y: RV.y, w: RV.w, h: RV.h, action: 'card' + i },
    ]),
    ...[0, 1, 2].map((i) => ({ type: 'arrow', from: [RVX[i] + RV.w + 2, RV.y + 200], to: [RVX[i + 1] - 2, RV.y + 200], color: '#8a8f98', width: 3, rough: false })),
    txt('Each level builds on the one before: the sequence decides how the chain folds.', 800, 850, 26, 'ink', { align: 'center', bold: true }),
  ];
  const reviewActions = LEVELS.map((lv, i) => ({
    id: 'card' + i, label: lv.name, group: 'card', stay: true, drawn: false,
    items: [{ type: 'rect', x: RVX[i] - 4, y: RV.y - 4, w: RV.w + 8, h: RV.h + 8, color: lv.color, width: 6, fill: lv.color, fillOpacity: 0.06, rough: false }],
  }));

  // ====================================================================== the topic
  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'protein-structure',
    title: '🧬 Protein structure',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: the hook.
      {
        say: 'A protein starts as a simple chain of amino acids and folds, level by level, into a working machine.',
        script: `Every protein in your body starts out like this. [point to the chain on the left]

A simple chain of building blocks called amino acids.

But a chain on its own can't do anything. To carry oxygen, fight off an infection, or speed up a chemical reaction, it has to fold into one very precise shape. [point along the arrows to the protein on the right]

So how does a floppy chain become a working machine?

Biologists describe it in four levels. [click "Reveal the four levels"]

Primary structure: the order of the amino acids in the chain.

Secondary structure: small, repeating folds, like coils and pleated sheets.

Tertiary structure: the whole chain folding up into one 3-D shape.

And quaternary structure: several folded chains fitting together, like the four parts of hemoglobin. [point to the last picture]

Here's the big idea to keep in mind: each level builds on the one before it. Change the sequence at the start, and you can change everything that follows.

Let's start at the very beginning, with primary structure.`,
        actions: hookActions,
        items: hookItems,
      },
      // Slide 2: primary structure.
      {
        say: 'Primary structure is the sequence of amino acids, joined by peptide bonds.',
        clear: true,
        actions: pepActions,
        items: primaryItems,
      },
      // Slide 3: secondary structure.
      {
        say: 'Secondary structure comes from hydrogen bonds between backbone atoms: α-helices, β-sheets and random coils. The R groups are not involved.',
        clear: true,
        actions: ssActions,
        items: secondaryItems,
      },
      // Slide 4: tertiary structure.
      {
        say: 'Tertiary structure: the whole chain folds into one 3-D shape, held by R-group interactions.',
        clear: true,
        actions: tertiaryActions,
        items: tertiaryItems,
      },
      // Slide 5: quaternary structure.
      {
        say: 'Quaternary structure: two or more folded chains fit together, like the four subunits of hemoglobin.',
        clear: true,
        actions: quaternaryActions,
        items: quaternaryItems,
      },
      // Slide 6: review.
      {
        say: 'Primary, secondary, tertiary, quaternary: each level builds on the one before.',
        clear: true,
        actions: reviewActions,
        items: reviewItems,
      },
    ],
  });
})();
