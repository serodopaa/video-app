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
  const P_NAMES = ['Ala', 'Ser', 'Gly', 'Asp', 'Glu', 'Ser', 'Val', 'Arg', 'Thr', 'Asp'];
  const P_KINDS = ['np', 'p', 'np', 'neg', 'neg', 'p', 'np', 'pos', 'p', 'neg'];
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
  // ---- peptide bond animation: four amino acids join one at a time (displayed formulas) ----
  // A "piece" is a run of residues already joined. Stage s = pieces [[0..s], [s+1], ..., [3]].
  const PK = 0.82, PFS = 25, PY = 664;
  // the first four amino acids of the chain above, with their real (small) R groups
  const P_RES = [['CH₃'], ['CH₂', 'OH'], ['H'], ['CH₂', 'COO⁻']];
  const pAtom = (t, x, y, c = 'ink') => atom(t, x, y, c, PFS);
  const pBond = (x1, y1, x2, y2, dbl) => bond(x1, y1, x2, y2, dbl);
  const pieceSpan = (n) => (335 + 250 * (n - 1)) * PK;
  const stagePieces = (s) => [[...Array(s + 1)].map((_, i) => i), ...[...Array(3 - s)].map((_, i) => [s + 1 + i])];
  const stageLayout = (s) => {
    const pcs = stagePieces(s), gap = 100 * PK;
    const total = pcs.reduce((w, pc) => w + pieceSpan(pc.length), 0) + gap * (pcs.length - 1);
    let x = 800 - total / 2;
    return pcs.map((pc) => { const o = { res: pc, x }; x += pieceSpan(pc.length) + gap; return o; });
  };
  const RED = '#e0453a';
  // items for one stage; returns { items, joins: x of each "+", bonds: x of each peptide bond }
  const stageDraw = (s) => {
    const L = stageLayout(s), y = PY, items = [], plus = [], pb = [];
    L.forEach((pc, k) => {
      const leftJoin = k === 1, rightJoin = k === 0 && L.length > 1;
      const x0 = pc.x, N1 = x0 + 50 * PK;
      items.push(pAtom('H', x0, y, leftJoin ? RED : 'ink'), ...pBond(x0 + 12, y, N1 - 14, y));
      pc.res.forEach((ri, r) => {
        const N = N1 + 250 * PK * r, Ca = N + 80 * PK, C = Ca + 80 * PK;
        items.push(pAtom('N', N, y), ...pBond(N, y + 17, N, y + 36), pAtom('H', N, y + 54));
        items.push(...pBond(N + 14, y, Ca - 14, y), pAtom('C', Ca, y), ...pBond(Ca, y - 17, Ca, y - 36), pAtom('H', Ca, y - 54),
          svgItem(bead(Ca, y - 94, 21, P_KINDS[ri], P_NAMES[ri])));
        P_RES[ri].forEach((t, j) => items.push(...pBond(Ca, y + 17 + 50 * j, Ca, y + 34 + 50 * j), pAtom(t, Ca, y + 52 + 50 * j, AA_EDGE[P_KINDS[ri]])));
        items.push(...pBond(Ca + 14, y, C - 14, y), pAtom('C', C, y), ...pBond(C, y - 17, C, y - 36, true), pAtom('O', C, y - 54));
        if (r < pc.res.length - 1) {
          const Nn = C + 90 * PK, mid = (C + Nn) / 2;
          items.push({ type: 'highlight', x: C - 16, y: y - 20, w: Nn - C + 32, h: 40, color: '#ffd34d', opacity: 0.6 }, ...pBond(C + 14, y, Nn - 14, y));
          pb.push(mid);
        } else {
          const O = C + 70 * PK, H = O + 55 * PK, c = rightJoin ? RED : 'ink';
          items.push(...pBond(C + 14, y, O - 13, y), pAtom('O', O, y, c), ...pBond(O + 13, y, H - 11, y), pAtom('H', H, y, c));
          if (k < L.length - 1) { const px = H + 50 * PK; plus.push(px); items.push(atom('+', px, y, '#5b6270', 30)); }
        }
      });
    });
    pb.forEach((mx) => items.push(
      txt('peptide bond', mx, y - 104, 19, '#9a6a00', { align: 'center', bold: true }),
      { type: 'arrow', from: [mx, y - 92], to: [mx, y - 26], color: '#9a6a00', width: 2.5, rough: false },
      txt('H₂O out', mx, y + 104, 19, '#2f6fde', { align: 'center', bold: true })));
    return { items, plus, pb };
  };
  const P_CAPS = [
    'Four separate amino acids. The –OH and H in red will leave as water.',
    '1 peptide bond: a dipeptide (1 water released)',
    '2 peptide bonds: a tripeptide (2 waters released)',
    '4 amino acids joined by 3 peptide bonds, 3 waters released. Keep adding and you get a polypeptide chain.',
  ];
  const P_T = [0, 1.7, 3.4, 5.1];
  const pepStages = [0, 1, 2, 3].flatMap((st) => {
    const d = stageDraw(st), at = P_T[st], o = st < 3 ? { until: P_T[st + 1] - at } : {};
    const out = [...d.items, txt(P_CAPS[st], 800, 822, 21, st === 3 ? '#1d4fb0' : '#5b6270', { align: 'center', bold: st === 3 })].map((it) => ({ ...it, at, duration: 0.01, ...o }));
    if (st < 3) {
      const jx = d.plus[0], lastO = jx - 50 * PK;
      out.push({ type: 'flash', x: lastO - 30, y: PY, r: 40, color: RED, duration: 0.7, at: P_T[st + 1] - 0.75 },
        { type: 'flash', x: jx + 50 * PK, y: PY, r: 28, color: RED, duration: 0.7, at: P_T[st + 1] - 0.75 });
    }
    if (st > 0) { const mx = d.pb[st - 1]; out.push({ type: 'flash', x: mx, y: PY, r: 46, color: '#ffd34d', duration: 0.8, at: at + 0.05 }); }
    return out;
  });
  const beforeItems = stageDraw(0).items;
  const pepActions = [{
    id: 'pep', label: 'Join 4 amino acids', stay: true, drawn: false,
    items: pepStages,
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
    { type: 'path', points: [[160, 352], [160, 366], [610, 366], [610, 352]], smooth: false, color: '#8a8f98', width: 3, rough: false },
    txt('These first 4 are joined step by step below', 385, 392, 20, '#5b6270', { align: 'center', bold: true }),
    txt('The primary structure is the exact order (sequence) of amino acids, joined by peptide bonds.', 800, 460, 26, 'ink', { align: 'center', bold: true }),
    { type: 'rect', x: 80, y: 500, w: 1440, h: 352, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    txt('How amino acids join: a peptide bond', 110, 530, 24, '#5b6270', { bold: true }),
    ...beforeItems.map((it) => ({ ...it, hideDuring: 'pep' })),
    txt('The carboxyl group of one amino acid joins the amino group of the next, releasing water.', 800, 822, 21, '#5b6270', { align: 'center', hideDuring: 'pep' }),
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

  // ---- random coil: a loosely tangled backbone that heads off in all directions (no repeating pattern) ----
  const coilAngles = [88, 49, 8, -58, -93, -15, 19, 64, 27, -45, 11, -37, -100, -132, -65, -149, 176, 131, -169, 152, -133, -169, 109];
  const coilPts = [[120, 520]];
  coilAngles.forEach((deg) => { const [x, y] = coilPts[coilPts.length - 1], r = (deg * Math.PI) / 180; coilPts.push([x + 78 * Math.cos(r), y + 78 * Math.sin(r)]); });
  const coilAtoms = coilPts.map(([x, y], i) => ({ x, y, k: ['N', 'CA', 'C'][i % 3] }));
  // The groups on each atom point to whichever side of the chain has more room.
  coilAtoms.forEach((a, i) => {
    const p0 = coilAtoms[Math.max(0, i - 1)], p1 = coilAtoms[Math.min(coilAtoms.length - 1, i + 1)];
    let dx = p1.x - p0.x, dy = p1.y - p0.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const len = a.k === 'CA' ? 44 : a.k === 'C' ? 38 : 34;
    const room = (sgn) => Math.min(...coilAtoms.filter((b) => b !== a).map((b) => Math.hypot(b.x - (a.x - dy * sgn * len), b.y - (a.y + dx * sgn * len))));
    const sgn = room(1) >= room(-1) ? 1 : -1, v = [-dy * sgn * len, dx * sgn * len];
    if (a.k === 'C') a.o = v; else if (a.k === 'N') a.h = v; else a.r = v;
  });
  // one place where the chain loops back close to itself forms a single hydrogen bond
  let cb = null;
  coilAtoms.forEach((c, i) => coilAtoms.forEach((n, j) => {
    if (c.k !== 'C' || n.k !== 'N' || Math.abs(i - j) < 7) return;
    const d = Math.hypot(c.x - n.x, c.y - n.y);
    if (d > 95 && d < 150 && (!cb || d < cb.d)) cb = { c, n, d };
  }));
  if (cb) {
    const u = [(cb.n.x - cb.c.x) / cb.d, (cb.n.y - cb.c.y) / cb.d];
    cb.c.o = [u[0] * 38, u[1] * 38]; cb.n.h = [-u[0] * 34, -u[1] * 34];
  }
  const coilBond = cb ? [[cb.c.x + cb.c.o[0], cb.c.y + cb.c.o[1]], [cb.n.x + cb.n.h[0], cb.n.y + cb.n.h[1]]] : [[0, 0], [0, 0]];

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
      txt('Dashed blue line: the only hydrogen bond\nhere. Nothing repeats, unlike a helix or sheet.', 80, 722, 19, HB, { bold: true, at: stagger ? 1.2 : 0, anim: 'fade', duration: 0.4 })];
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

  // ====================================================================== secondary vs tertiary (slide 4)
  // Two amino acids in displayed formula. Tab "Secondary": the two backbones face each other and
  // bond C=O ··· H–N (R groups faded). Tab "Tertiary": the R groups face each other and interact
  // (backbones faded); buttons pick the interaction and the real amino acids that make it.
  const SVC = { cx: 500, mid: 518 };
  const FADE = '#c3c8d1';
  const SV_SEC = '#d6336c', SV_TER = '#2f6fde';
  const vb = (x1, y1, x2, y2, c = DARK, dbl = false) => (dbl
    ? [{ type: 'line', from: [x1 - 4, y1], to: [x2 - 4, y2], color: c, width: 3, rough: false }, { type: 'line', from: [x1 + 4, y1], to: [x2 + 4, y2], color: c, width: 3, rough: false }]
    : [{ type: 'line', from: [x1, y1], to: [x2, y2], color: c, width: 3, rough: false }]);
  // one amino acid, backbone horizontal at y. rDir: +1 R group points down, -1 up. The other
  // vertical groups (N–H, Cα–H, C=O) point the other way. mirror: backbone runs right-to-left.
  const aaDisp = (cx, y, rDir, mirror, chain, bc, rc) => {
    const m = mirror ? -1 : 1, sd = -rDir, out = [];
    const xN = cx - 110 * m, xC = cx + 110 * m, xO = cx + 220 * m, xH = cx + 310 * m, xNH = cx - 210 * m;
    out.push(atom('H', xNH, y, bc), atom('N', xN, y, bc), atom('C', cx, y, bc), atom('C', xC, y, bc), atom('O', xO, y, bc), atom('H', xH, y, bc));
    [[xNH, xN], [xN, cx], [cx, xC], [xC, xO], [xO, xH]].forEach(([p, q]) => out.push(...vb(p + 17 * m, y, q - 17 * m, y, bc)));
    [[xN, 'H'], [cx, 'H'], [xC, 'O']].forEach(([x, t]) => out.push(...vb(x, y + sd * 20, x, y + sd * 44, bc, t === 'O'), atom(t, x, y + sd * 64, bc)));
    // R group chain from the Cα
    let prev = y + rDir * 20, tipY = y;
    chain.forEach((it, i) => {
      const ly = y + rDir * (64 + i * 56);
      if (it.branch) {
        it.branch.forEach((t, k) => { const dx = k ? 1 : -1; out.push(...vb(cx + dx * 8, prev, cx + dx * 36, ly - rDir * 16, rc), atom(t, cx + dx * 54, ly, rc)); });
      } else {
        out.push(...vb(cx, prev, cx, ly - rDir * 14, rc), atom(it.t || it, cx, ly, rc));
        if (it.side) out.push(...vb(cx + 16, ly, cx + 46, ly, rc), atom(it.side, cx + 62, ly, rc));
      }
      prev = ly + rDir * 14; tipY = ly;
    });
    return { items: out, tipY, nh: [xN, y + sd * 64], co: [xC, y + sd * 64] };
  };
  const svTabs = (active) => [['Secondary structure', SV_SEC, 'sv-sec'], ['Tertiary structure', SV_TER, 'sv-ter']].flatMap(([t, c, id], i) => {
    const x = 340 + i * 470, on = i === active;
    return [
      { type: 'rect', x, y: 104, w: 450, h: 52, color: c, fill: on ? c : '#ffffff', fillOpacity: 1, width: 3, rough: false },
      txt(t, x + 225, 130, 25, on ? '#ffffff' : c, { align: 'center', bold: true }),
      { type: 'hotspot', x, y: 104, w: 450, h: 52, action: id },
    ];
  });
  const svPanel = (c) => ({ type: 'rect', x: 940, y: 178, w: 600, h: 682, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false });

  // ---- secondary: backbone to backbone (antiparallel, two C=O ··· H–N hydrogen bonds) ----
  const secView = () => {
    const { cx } = SVC, T = 400, B = 690;
    const top = aaDisp(cx, T, -1, false, ['R'], 'ink', FADE), bot = aaDisp(cx, B, 1, true, ['R'], 'ink', FADE);
    const hb = (p, q, at) => ({ type: 'line', from: [p[0], p[1] + 20], to: [q[0], q[1] - 22], color: HB, width: 4.5, dashed: true, rough: false, at, duration: 0.4 });
    return [
      ...svTabs(0),
      { type: 'highlight', x: cx - 232, y: T - 26, w: 564, h: 52, color: '#ffd34d', opacity: 0.45 },
      { type: 'highlight', x: cx - 332, y: B - 26, w: 564, h: 52, color: '#ffd34d', opacity: 0.45 },
      ...top.items, ...bot.items,
      hb(top.nh, bot.co, 0.4), hb(top.co, bot.nh, 0.8),
      { type: 'flash', x: top.nh[0], y: (T + B) / 2, r: 60, color: HB, duration: 0.8, at: 0.4 },
      { type: 'flash', x: top.co[0], y: (T + B) / 2, r: 60, color: HB, duration: 0.8, at: 0.8 },
      txt('hydrogen\nbonds', cx, (T + B) / 2 - 12, 22, HB, { align: 'center', bold: true, anim: 'fade', at: 1.1, duration: 0.4 }),
      txt('R groups point away\n(not involved)', cx + 150, T - 64, 19, '#9aa1ae', { bold: true }),
      svPanel(SV_SEC),
      txt('Amber highlight = backbone', 1240, 830, 20, '#8a6d00', { align: 'center', bold: true }),
      txt('Secondary structure', 1240, 232, 34, SV_SEC, { align: 'center', bold: true }),
      txt('Backbone ↔ backbone', 1240, 280, 26, '#3b4252', { align: 'center', bold: true }),
      txt('The C=O of one amino acid forms a\nhydrogen bond with the N–H of\nanother amino acid.\n\nThese atoms are in the BACKBONE,\nwhich is the same in every amino acid.\n\nThe R groups point away and take\nno part.\n\nThis is what holds α-helices and\nβ-pleated sheets together.', 975, 360, 23, '#3b4252'),
    ];
  };

  // ---- tertiary: R group to R group ----
  const TER = [
    { id: 'sv-ter', btn: 'Any R groups', head: 'R group ↔ R group', names: ['Amino acid', 'Amino acid'], top: ['R'], bot: ['R'], gap: 100, rc: ['#8a7a45', '#8a7a45'], kind: 'any',
      body: 'Now the BACKBONES (grey) are far\napart and the R groups (side chains)\nreach towards each other.\n\nWhich interaction forms depends on\nwhich R groups meet. Pick one above.' },
    { id: 'sv-ion', btn: 'Ionic bond', head: 'Lysine (+) and aspartate (−)', names: ['Lysine', 'Aspartate'], top: ['CH₂', 'CH₂', 'CH₂', 'CH₂', 'NH₃⁺'], bot: ['CH₂', 'COO⁻'], gap: 110, rc: ['#1d4fb0', '#a8281a'], kind: 'ion', color: '#7b3fd0',
      body: 'Both R groups are polar and\nCHARGED: lysine ends in NH₃⁺,\naspartate ends in COO⁻.\n\nOpposite charges attract: an ionic\nbond (also called a salt bridge).' },
    { id: 'sv-hyd', btn: 'Hydrophobic', head: 'Valine and alanine', names: ['Valine', 'Alanine'], top: ['CH', { branch: ['H₃C', 'CH₃'] }], bot: ['CH₃'], gap: 100, rc: ['#a07c00', '#a07c00'], kind: 'hyd', color: '#a07c00',
      body: 'Both R groups are NONPOLAR\n(only C and H).\n\nThey avoid water, so they cluster\ntogether in the core of the protein:\nhydrophobic interactions.' },
    { id: 'sv-ss', btn: 'Disulfide bridge', head: 'Two cysteines', names: ['Cysteine', 'Cysteine'], top: ['CH₂', 'S'], bot: ['CH₂', 'S'], gap: 56, rc: ['#b38600', '#b38600'], kind: 'ss', color: '#b38600',
      body: 'Each cysteine R group ends in –SH.\n\nThe two S atoms join (losing their\nH atoms) into a COVALENT S–S bond:\na disulfide bridge, the strongest\nof these interactions.' },
    { id: 'sv-hb', btn: 'Hydrogen bond', head: 'Two serines', names: ['Serine', 'Serine'], top: ['CH₂', 'O', 'H'], bot: ['CH₂', { t: 'O', side: 'H' }], gap: 100, rc: ['#2e7d32', '#2e7d32'], kind: 'hb', color: HB,
      body: 'Serine has an –OH in its R group,\nwhich is polar.\n\nThe H of one –OH is attracted to\nthe O of the other: a hydrogen\nbond between R groups.' },
  ];
  const terView = (e) => {
    const { cx } = SVC;
    const lenT = 64 + (e.top.length - 1) * 56, lenB = 64 + (e.bot.length - 1) * 56, span = lenT + e.gap + lenB;
    const T = Math.round(SVC.mid - span / 2), B = T + span;
    const top = aaDisp(cx, T, 1, false, e.top, FADE, e.rc[0]), bot = aaDisp(cx, B, -1, false, e.bot, FADE, e.rc[1]);
    const t1 = top.tipY + 20, t2 = bot.tipY - 20, my = (top.tipY + bot.tipY) / 2, o = { at: 0.4 };
    const link = [];
    if (e.kind === 'any') link.push({ type: 'arrow', from: [cx, my], to: [cx, t1 + 4], color: '#8a7a45', width: 4, rough: false, ...o }, { type: 'arrow', from: [cx, my], to: [cx, t2 - 4], color: '#8a7a45', width: 4, rough: false, ...o },
      txt('interact', cx + 30, my, 22, '#8a7a45', { bold: true, ...o }));
    if (e.kind === 'ion') link.push({ type: 'line', from: [cx, t1], to: [cx, t2], color: e.color, width: 5, dashed: true, rough: false, ...o }, txt('Ionic bond\n(+ attracts −)', cx + 30, my - 12, 22, e.color, { bold: true, ...o }));
    if (e.kind === 'hyd') link.push({ type: 'circle', x: cx, y: (T + 120 + bot.tipY) / 2, rx: 150, ry: (bot.tipY - T - 120) / 2 + 30, color: e.color, width: 3, fill: e.color, fillOpacity: 0.12, dashed: true, rough: false, ...o },
      txt('Hydrophobic\ninteraction', cx + 166, my - 12, 22, e.color, { bold: true, ...o }));
    if (e.kind === 'ss') link.push({ type: 'line', from: [cx, top.tipY + 18], to: [cx, bot.tipY - 18], color: e.color, width: 7, rough: false, ...o }, txt('Disulfide bridge\n(covalent S–S bond)', cx + 40, my - 12, 22, e.color, { bold: true, ...o }));
    if (e.kind === 'hb') link.push({ type: 'line', from: [cx, t1], to: [cx, t2], color: HB, width: 5, dashed: true, rough: false, ...o }, txt('Hydrogen bond', cx - 30, my, 22, HB, { align: 'right', bold: true, ...o }));
    link.push({ type: 'flash', x: cx, y: my, r: 70, color: e.color || '#8a7a45', duration: 0.8, at: 0.4 });
    return [
      ...svTabs(1),
      ...link.filter((l) => l.type === 'circle'), ...top.items, ...bot.items, ...link.filter((l) => l.type !== 'circle'),
      txt(e.names[0], cx - 250, T, 23, e.rc[0], { align: 'right', bold: true }),
      txt(e.names[1], cx - 250, B, 23, e.rc[1], { align: 'right', bold: true }),
      svPanel(SV_TER),
      txt('Grey = backbone     Colour = R group', 1240, 830, 20, '#8a8f98', { align: 'center', bold: true }),
      ...TER.flatMap((q, i) => {
        const y = 198 + i * 56, on = q.id === e.id;
        return [
          { type: 'rect', x: 966, y, w: 548, h: 46, color: SV_TER, fill: on ? SV_TER : '#ffffff', fillOpacity: 1, width: 2.5, rough: false },
          txt(q.btn, 1240, y + 23, 22, on ? '#ffffff' : SV_TER, { align: 'center', bold: true }),
          { type: 'hotspot', x: 966, y, w: 548, h: 46, action: q.id },
        ];
      }),
      txt(e.head, 1240, 506, 27, e.color || '#3b4252', { align: 'center', bold: true }),
      txt(e.body, 975, 560, 22, '#3b4252'),
    ];
  };
  const SV_IDS = ['sv-sec', ...TER.map((e) => e.id)];
  const svActions = [
    { id: 'sv-sec', label: 'Secondary', group: 'sv', stay: true, drawn: false, items: secView() },
    ...TER.map((e, i) => ({ id: e.id, label: i ? e.btn : 'Tertiary', group: 'sv', stay: true, drawn: false, items: terView(e) })),
  ];
  const secVsTerItems = [
    title('Secondary vs tertiary'),
    ...secView().filter((it) => it.type !== 'flash').map((it) => ({ ...it, at: undefined, anim: undefined, hideDuring: SV_IDS })),
  ];

  // ====================================================================== tertiary structure (slide 5)
  // Focus: tertiary structure IS the final 3-D shape of the whole chain, and the shape gives the job.
  // The chain is three rigid secondary pieces (helix H1, helix H2, a 3-strand sheet) joined by loops.
  // Each piece has a pose (centre, angle) in two stages: U = stretched out, F = folded. Frames in
  // between are drawn by interpolating the poses, so "Fold" / "Denature" animate the real fold.
  const rot = (p, a) => { const c = Math.cos(a), sn = Math.sin(a); return [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]; };
  const DEG = Math.PI / 180;
  const catmull = (pts) => {
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d;
  };
  const HL = (L) => { const h = helix(0, -L / 2, L / 2, 36, 4); return { svg: h.svg, a: [0, -L / 2 - 8], b: [0, L / 2 - 8], dir: [0, 1] }; };
  const SHEET_LOCAL = {
    svg: strand(-115, 115, -46, 32, 4) + tube('M115 -46 C155 -42 155 -4 115 0', 11) + strand(115, -115, 0, 32, -4)
      + tube('M-115 0 C-155 4 -155 42 -115 46', 11) + strand(-115, 115, 46, 32, 4),
    a: [-115, -46], b: [115, 46], dir: [1, 0],
  };
  const TP = [SHEET_LOCAL, HL(250), HL(230)];
  // poses [cx, cy, angleDeg] for U (unfolded) and F (folded)
  const POSE = {
    U: [[230, 330, 0], [470, 560, 270], [720, 330, -40]],
    F: [[500, 650, 180], [290, 490, 180], [500, 330, -90]],
  };
  const TAIL = { U: { n: [80, 190], c: [860, 540] }, F: { n: [760, 790], c: [730, 240] } };
  // folded loops: extra waypoints
  const VIA_F = [[[300, 700]], []];
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpP = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const foldSvgAt = (t) => {
    const pose = POSE.U.map((u, i) => { const f = POSE.F[i]; return [lerp(u[0], f[0], t), lerp(u[1], f[1], t), lerp(u[2], f[2], t)]; });
    const poseU = POSE.U;
    const world = (i, ps) => {
      const [cx, cy, ad] = ps[i], el = TP[i], A = ad * DEG, w = (p) => { const r = rot(p, A); return [cx + r[0], cy + r[1]]; };
      return { a: w(el.a), b: w(el.b), dir: rot(el.dir, A), g: `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(ad)})">${el.svg}</g>` };
    };
    const E = TP.map((_, i) => world(i, pose)), EU = TP.map((_, i) => world(i, poseU));
    const off = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k];
    let loops = '';
    for (let i = 0; i < 2; i++) {
      const p = off(E[i].b, E[i].dir, 45), q = off(E[i + 1].a, E[i + 1].dir, -45);
      const vf = VIA_F[i];
      const pu = off(EU[i].b, EU[i].dir, 45), qu = off(EU[i + 1].a, EU[i + 1].dir, -45);
      const via = vf.map((v, k) => lerpP(lerpP(pu, qu, (k + 1) / (vf.length + 1)), v, t));
      loops += tube(catmull([E[i].b, p, ...via, q, E[i + 1].a]), 12);
    }
    const n = lerpP(TAIL.U.n, TAIL.F.n, t), c = lerpP(TAIL.U.c, TAIL.F.c, t);
    loops += tube(catmull([n, off(E[0].a, E[0].dir, -45), E[0].a]), 12) + tube(catmull([E[2].b, off(E[2].b, E[2].dir, 45), c]), 12);
    const ends = `<text x="${f1(n[0] - 10)}" y="${f1(n[1] + 34)}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="22" fill="#5f6b7a" text-anchor="middle">N</text>`
      + `<text x="${f1(c[0] + 14)}" y="${f1(c[1] + 34)}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="22" fill="#5f6b7a" text-anchor="middle">C</text>`;
    return loops + E.map((e) => e.g).join('') + ends;
  };
  const FOLDED = foldSvgAt(1);
  const foldFrames = (from, to, t0, dur, n = 14) => [...Array(n + 1)].map((_, k) => {
    const u = ease(k / n), t = lerp(from, to, u);
    return { ...svgItem(foldSvgAt(t)), at: t0 + (dur * k) / n, ...(k < n ? { until: dur / n + 0.02 } : {}), duration: 0.01 };
  });
  // the overall shape: a smooth surface around the fold with a pocket (active site) opening to the right
  const SURF = catmull([[250, 300], [400, 250], [600, 250], [700, 300], [690, 390], [560, 400], [470, 440], [462, 530], [560, 572], [690, 580],
    [720, 680], [640, 760], [420, 765], [250, 730], [215, 560], [220, 400], [250, 300]]);
  const surface = (op = 1) => `<path d="${SURF} Z" fill="#7aa2e6" fill-opacity="${0.16 * op}" stroke="#2f6fde" stroke-width="4" stroke-dasharray="12 8" opacity="${op}"/>`;
  const SUB = { x: 522, y: 486 };
  const substrate = (x, y) => `<g transform="translate(${f1(x)} ${f1(y)})"><polygon points="-30,-52 30,-52 58,0 30,52 -30,52 -58,0" fill="#5cc27a" stroke="#1f7a3e" stroke-width="4"/>
    <rect x="52" y="-12" width="70" height="24" rx="12" fill="#5cc27a" stroke="#1f7a3e" stroke-width="4"/><circle cx="-8" cy="-14" r="10" fill="#ffffff" opacity="0.5"/></g>`;
  const subFrames = (x0, x1, t0, dur, n = 10, y0 = SUB.y, y1 = SUB.y) => [...Array(n + 1)].map((_, k) => ({ ...svgItem(substrate(lerp(x0, x1, ease(k / n)), lerp(y0, y1, ease(k / n)))), at: t0 + (dur * k) / n, ...(k < n ? { until: dur / n + 0.02 } : {}), duration: 0.01 }));
  const tLabels = [
    ...label('α-helix', 110, 400, [140, 414], [262, 470], 'center', 22),
    ...label('α-helix', 420, 190, [430, 206], [470, 300], 'center', 22),
    ...label('β-pleated sheet', 470, 840, [470, 822], [470, 712], 'center', 22),
    ...label('loop', 120, 720, [150, 712], [292, 690], 'center', 22),
  ];
  const T_HIDE = ['tfold', 'tdenature'];
  // right column: takeaway + three steps
  const TSTEP = [
    { c: '#d6336c', h: 'Secondary pieces form', b: 'Helices and sheets (backbone\nH-bonds, slide 3).' },
    { c: '#2f6fde', h: 'The whole chain folds up', b: 'R-group interactions (slide 4) pull\nfar-apart pieces together.' },
    { c: '#1f7a3e', h: 'Its shape gives it its job', b: 'The final shape has a pocket that\nfits only the right molecule.' },
  ];
  const tRight = [
    { type: 'rect', x: 920, y: 110, w: 620, h: 160, color: '#2f6fde', fill: '#eef3ff', fillOpacity: 1, width: 3, rough: false },
    txt('Tertiary structure =', 1230, 150, 30, '#2f6fde', { align: 'center', bold: true }),
    txt('the final 3-D shape of\none whole polypeptide chain', 1230, 205, 27, 'ink', { align: 'center', bold: true }),
    ...TSTEP.flatMap((q, i) => {
      const y = 300 + i * 150;
      return [
        { type: 'rect', x: 920, y, w: 620, h: 134, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
        svgItem(`<circle cx="960" cy="${y + 40}" r="20" fill="${q.c}"/><text x="960" y="${y + 48}" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="22" text-anchor="middle" fill="#ffffff">${i + 1}</text>`),
        txt(q.h, 996, y + 40, 26, q.c, { bold: true }),
        txt(q.b, 996, y + 88, 21, '#3b4252'),
      ];
    }),
    txt('Lose the shape → lose the job', 1230, 790, 26, '#a8281a', { align: 'center', bold: true }),
    txt('(heat or the wrong pH can unfold it)', 1230, 828, 21, '#5b6270', { align: 'center' }),
  ];
  const stepOn = (i) => ({ type: 'rect', x: 916, y: 296 + i * 150, w: 628, h: 142, color: TSTEP[i].c, fill: TSTEP[i].c, fillOpacity: 0.07, width: 5, rough: false });
  const tertiaryActions = [
    {
      id: 'tfold', label: 'Fold the chain', group: 'tf', stay: true, drawn: false,
      items: [
        stepOn(0), { ...stepOn(1), at: 1.0 },
        { ...svgItem(foldSvgAt(0)), until: 1.0, duration: 0.01 },
        txt('Secondary structure only: helices and a sheet, loosely strung out', 470, 860, 22, '#d6336c', { align: 'center', bold: true, until: 1.0 }),
        ...foldFrames(0, 1, 1.0, 2.6),
        txt('Folded: one compact 3-D shape', 470, 850, 24, '#2f6fde', { align: 'center', bold: true, at: 3.7, anim: 'fade', duration: 0.4 }),
        { type: 'flash', x: 470, y: 500, r: 260, color: '#2f6fde', duration: 0.9, at: 3.6 },
      ],
    },
    {
      id: 'tshape', label: 'Show its 3-D shape', group: 'tf', stay: true, drawn: false,
      items: [
        svgItem(surface()),
        ...label('Overall shape\n(surface)', 820, 680, [790, 668], [718, 660], 'center', 22).map((it) => ({ ...it, color: it.type === 'text' ? '#2f6fde' : it.color })),
        txt('Active site:\na pocket in\nthe shape', 810, 462, 23, '#1f7a3e', { align: 'center', bold: true, at: 0.6, anim: 'fade', duration: 0.4 }),
        { type: 'pulse', x: 580, y: 486, r: 70, color: '#1f7a3e', speed: 1.4, at: 0.6 },
        stepOn(2),
      ],
    },
    {
      id: 'tbind', label: 'Fit a molecule in', group: 'tf', stay: true, drawn: false,
      items: [
        svgItem(surface()),
        ...subFrames(870, SUB.x, 0.2, 1.6),
        txt('It fits!', 790, 400, 30, '#1f7a3e', { align: 'center', bold: true, at: 1.9, anim: 'pop', duration: 0.4 }),
        txt('Only a molecule with\nthe matching shape\nfits the pocket', 790, 456, 19, '#3b4252', { align: 'center', bold: true, at: 2.1, anim: 'fade', duration: 0.4 }),
        { type: 'flash', x: SUB.x, y: SUB.y, r: 80, color: '#5cc27a', duration: 0.8, at: 1.8 },
        stepOn(2),
      ],
    },
    {
      id: 'tdenature', label: 'Denature it (heat)', group: 'tf', stay: true, drawn: false,
      items: [
        { ...svgItem(surface()), until: 0.6 },
        ...foldFrames(1, 0, 0.6, 2.2),
        ...subFrames(SUB.x, 700, 0.6, 1.8, 10, SUB.y, 720),
        txt('🔥', 470, 170, 60, 'ink', { align: 'center', anim: 'pop', duration: 0.3 }),
        txt('Unfolded: the pocket is gone, so the\nmolecule no longer fits. The protein stops working.', 470, 846, 21, '#a8281a', { align: 'center', bold: true, at: 2.9, anim: 'fade', duration: 0.4 }),
        { type: 'rect', x: 916, y: 766, w: 628, h: 84, color: '#a8281a', fill: '#a8281a', fillOpacity: 0.06, width: 4, rough: false },
      ],
    },
  ];
  const tertiaryItems = [
    title('Tertiary structure'),
    { ...svgItem(FOLDED), hideDuring: T_HIDE },
    ...tLabels.map((it) => ({ ...it, hideDuring: T_HIDE })),
    ...tRight,
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
      // Slide 4: secondary vs tertiary (compares the two, between their dedicated slides).
      {
        say: 'Secondary structure is interactions between the backbones of the amino acids; tertiary structure is interactions between the R groups.',
        clear: true,
        actions: svActions,
        items: secVsTerItems,
      },
      // Slide 5: tertiary structure.
      {
        say: 'Tertiary structure is the final 3-D shape of the whole chain, and that shape decides what the protein can do.',
        clear: true,
        actions: tertiaryActions,
        items: tertiaryItems,
      },
      // Slide 6: quaternary structure.
      {
        say: 'Quaternary structure: two or more folded chains fit together, like the four subunits of hemoglobin.',
        clear: true,
        actions: quaternaryActions,
        items: quaternaryItems,
      },
      // Slide 7: review.
      {
        say: 'Primary, secondary, tertiary, quaternary: each level builds on the one before.',
        clear: true,
        actions: reviewActions,
        items: reviewItems,
      },
    ],
  });
})();
