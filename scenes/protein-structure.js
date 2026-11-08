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
  const HX = helix(380, 210, 720, 70, 5, {});
  const HX_HB = helix(380, 210, 720, 70, 5, { hbonds: true });
  const STR = [[930, 1450, 280], [1450, 930, 400], [930, 1450, 520], [1450, 930, 640]];
  const sheetSvg = STR.map(([a, b, y], i) => strand(a, b, y, 46, i % 2 ? -5 : 5)).join('');
  const sheetHb = STR.slice(0, -1).map(([, , y], i) => [0, 1, 2, 3, 4, 5].map((k) => {
    const x = 990 + k * 70;
    return `<line x1="${x}" y1="${y + 30}" x2="${x}" y2="${STR[i + 1][2] - 30}" stroke="${HB}" stroke-width="3.5" stroke-dasharray="6 5"/>`;
  }).join('')).join('');
  const secondaryActions = [{
    id: 'hb', label: 'Show hydrogen bonds', stay: true, drawn: false,
    items: [
      svgItem(HX_HB.hb + sheetHb),
      txt('Hydrogen bonds', 690, 620, 26, HB, { align: 'center', bold: true }),
      ...label('', 0, 0, [610, 606], HX_HB.hbPts[2], 'center', 24).slice(1),
      ...label('', 0, 0, [780, 640], [1130, 580], 'center', 24).slice(1),
    ],
  }];
  const secondaryItems = [
    title('Secondary structure'),
    svgItem(tube('M262 262 C290 230 330 200 376 192', 12) + HX.svg + tube('M392 724 C400 760 430 780 470 786', 12) + sheetSvg
      + tube('M1450 280 C1500 290 1510 390 1450 400', 12) + tube('M930 400 C880 410 880 510 930 520', 12) + tube('M1450 520 C1500 530 1510 630 1450 640', 12)),
    txt('α-helix', 380, 150, 40, HELIX.front, { align: 'center', bold: true }),
    txt('β-pleated sheet', 1190, 200, 40, '#c58a00', { align: 'center', bold: true }),
    txt('The backbone coils\ninto a spiral', 490, 330, 22, '#3b4252'),
    txt('Strands lie side by side;\nthe sheet zig-zags (pleats)', 1190, 730, 22, '#3b4252', { align: 'center' }),
    txt('Both are held together by hydrogen bonds between backbone atoms (C=O and N–H), not by the R groups.', 800, 846, 23, 'ink', { align: 'center', bold: true }),
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
        say: 'Secondary structure: the backbone folds into α-helices and β-pleated sheets, held by hydrogen bonds.',
        clear: true,
        actions: secondaryActions,
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
