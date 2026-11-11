// Explainer: affinity vs specificity (ligands binding receptors). Built with the user.
// The user does the drawing; these visuals simply appear (drawn: false). Board is 1600 x 900.
(() => {
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const svgDoc = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">${inner}</svg>`;
  const svgItem = (inner, extra = {}) => ({ type: 'svg', svg: svgDoc(inner), ...extra });
  const title = (text) => ({ type: 'text', x: 800, y: 66, text, size: 56, font: 'sans', bold: true, align: 'center', color: 'ink' });
  const txt = (text, x, y, size, color = 'ink', extra = {}) => ({ type: 'text', x, y, text, size, font: 'sans', color, ...extra });
  const DARK = '#3b4252';
  const label = (text, x, y, from, to, align = 'center', size = 21, color = 'ink') => [
    txt(text, x, y, size, color, { align }),
    { type: 'line', from, to, color: DARK, width: 2.5, rough: false },
    { type: 'circle', x: to[0], y: to[1], r: 5, color: DARK, width: 2, fill: DARK, fillOpacity: 1, rough: false },
  ];
  const T = (x, y, s, fill, w = 700, anchor = 'middle') => (str) => `<text x="${f1(x)}" y="${f1(y)}" font-family="Lexend, Arial, sans-serif" font-weight="${w}" font-size="${s}" text-anchor="${anchor}" fill="${fill}">${str}</text>`;
  const AFF = '#2f6fde', SPEC = '#7b3fd0', GOOD = '#1f7a3e', BAD = '#c0392b';
  const OUT = '#eef6fd', IN = '#f7f0fb';

  // ---------- membrane ----------
  const bilayer = (x0, x1, top, bot) => {
    let out = `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${bot - top}" fill="#fbecd6"/>`;
    const mid = (top + bot) / 2;
    for (let x = x0 + 10; x <= x1 - 8; x += 20) {
      for (const [hy, t0, t1] of [[top + 8, top + 17, mid - 3], [bot - 8, bot - 17, mid + 3]]) {
        const d = (t1 - t0) / 2;
        out += `<path d="M${x - 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d} M${x + 3} ${t0} q4 ${d / 2} 0 ${d} t0 ${d}" stroke="#c99a62" stroke-width="2" fill="none"/>`;
        out += `<circle cx="${x}" cy="${hy}" r="9" fill="#f4c995" stroke="#b67d3c" stroke-width="2"/>`;
      }
    }
    return out;
  };
  // a cell-surface panel: outside (light blue) above, membrane, inside (lilac) below
  const panel = (x0, x1, y0, top, bot, y1) =>
    `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${top - y0}" rx="16" fill="${OUT}"/>
     <rect x="${x0}" y="${bot}" width="${x1 - x0}" height="${y1 - bot}" rx="16" fill="${IN}"/>${bilayer(x0, x1, top, bot)}`;

  // ---------- receptors and ligands ----------
  // Receptor standing in the membrane; `top` = membrane top. Its binding pocket (tri / round / square)
  // is cut into the top of the head. Local units, scaled by s.
  const RCOL = { blue: ['#9fc0ef', '#4f7fcf', '#2c5a92'], green: ['#bfe3c1', '#62b067', '#2e7d32'], pink: ['#f6b9c6', '#e0607a', '#9c2a45'] };
  let gid = 0;
  const POCKET = {
    tri: `<polygon points="-37,-131 37,-131 0,-77" fill="${OUT}" stroke="EDGE" stroke-width="4" stroke-linejoin="round"/>`,
    round: `<path d="M-35 -131 A35 35 0 0 0 35 -131 Z" fill="${OUT}" stroke="EDGE" stroke-width="4"/>`,
    square: `<rect x="-31" y="-133" width="62" height="54" fill="${OUT}" stroke="EDGE" stroke-width="4"/>`,
  };
  const receptor = (x, top, pocket, col = 'blue', s = 1) => {
    const [l, m, e] = RCOL[col], id = `rg${gid++}`;
    return `<g transform="translate(${f1(x)} ${f1(top)}) scale(${s})">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${m}"/><stop offset="0.45" stop-color="${l}"/><stop offset="1" stop-color="${m}"/></linearGradient></defs>
      <rect x="-30" y="-24" width="60" height="112" rx="16" fill="url(#${id})" stroke="${e}" stroke-width="4"/>
      <rect x="-80" y="-131" width="160" height="118" rx="34" fill="url(#${id})" stroke="${e}" stroke-width="4"/>
      <path d="M-50 -112 v76 M50 -112 v76" stroke="#ffffff" stroke-opacity="0.28" stroke-width="10" stroke-linecap="round"/>
      ${POCKET[pocket].replace('EDGE', e)}
    </g>`;
  };
  // where a ligand's centre sits when docked, relative to the receptor's membrane-top point (unscaled)
  const DOCK = { tri: -105, round: -131, square: -106 };
  const LCOL = { amber: ['#f6c45a', '#f0a12e', '#a8640a'], pale: ['#fbe3b4', '#f6c47a', '#c08a3a'], teal: ['#8fdbe6', '#16a3b8', '#0b6f7e'] };
  // A ligand (the molecule that binds). kind: tri / round / square / blob. k = size (1 = snug fit).
  const ligand = (kind, cx, cy, color = 'amber', k = 1, s = 1) => {
    const [l, m, e] = LCOL[color], id = `lg${gid++}`;
    const shape = {
      tri: '<polygon points="-31,-26 31,-26 0,27" />',
      round: '<circle r="31" />',
      square: '<rect x="-27" y="-27" width="54" height="54" rx="4" />',
      blob: '<path d="M-22 -14 C-24 -30 -4 -30 2 -24 C12 -32 28 -22 22 -6 C30 4 22 22 6 20 C-2 30 -22 24 -20 10 C-30 4 -28 -8 -22 -14 Z" />',
    }[kind];
    const topY = kind === 'blob' ? -26 : kind === 'round' ? -31 : -26;
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${f1(k * s * 100) / 100})">
      <defs><radialGradient id="${id}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${l}"/><stop offset="1" stop-color="${m}"/></radialGradient></defs>
      <line x1="0" y1="${topY}" x2="0" y2="${topY - 16}" stroke="${e}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="0" cy="${topY - 22}" r="9" fill="${m}" stroke="${e}" stroke-width="3"/>
      <g fill="url(#${id})" stroke="${e}" stroke-width="4" stroke-linejoin="round">${shape}</g>
    </g>`;
  };
  // attractive contacts (bonds) between a docked ligand and its pocket: yellow sparks
  const CONTACTS = {
    tri: [[-24, -118], [24, -118], [-12, -97], [12, -97]],
    round: [[-30, -121], [30, -121], [-18, -104], [18, -104]],
    square: [[-27, -120], [27, -120], [-27, -94], [27, -94]],
  };
  const contacts = (x, top, pocket, n, s = 1) => CONTACTS[pocket].slice(0, n).map(([dx, dy]) =>
    `<g transform="translate(${f1(x + dx * s)} ${f1(top + dy * s)})"><circle r="${f1(9 * s)}" fill="#ffd34d" opacity="0.55"/><circle r="${f1(4.5 * s)}" fill="#f2b300" stroke="#a87900" stroke-width="1.5"/></g>`).join('');

  // ---------- frame animation helper ----------
  // keys: [[t, ...state]] ; draw(state) -> svg. Holds when nothing moves, otherwise frames at fps.
  const OVL = 0.005;
  const track = (keys, draw, fps = 15, t0 = 0, last = true) => {
    const out = [];
    for (let k = 0; k < keys.length; k++) {
      const [ta, ...a] = keys[k];
      if (k === keys.length - 1) { out.push({ ...svgItem(draw(a)), at: t0 + ta, duration: 0.001, solid: true, ...(last ? {} : { until: 0.05 }) }); break; }
      const [tb, ...b] = keys[k + 1];
      const moving = a.some((v, i) => typeof v === 'number' && v !== b[i]);
      if (!moving) { out.push({ ...svgItem(draw(a)), at: t0 + ta, duration: 0.001, solid: true, until: tb - ta + OVL }); continue; }
      const n = Math.max(1, Math.round((tb - ta) * fps));
      for (let i = 0; i < n; i++) {
        const u = ease(i / n), st = a.map((v, j) => (typeof v === 'number' ? lerp(v, b[j], u) : v));
        out.push({ ...svgItem(draw(st)), at: t0 + ta + ((tb - ta) * i) / n, duration: 0.001, solid: true, until: (tb - ta) / n + OVL });
      }
    }
    return out;
  };

  // ====================================================================== slide 1: hook
  const H = { top: 560, bot: 620, rx: 800 };
  const hookArt = svgItem(panel(470, 1130, 300, H.top, H.bot, 700) + receptor(H.rx, H.top, 'tri', 'blue') + ligand('tri', H.rx, H.top + DOCK.tri) + contacts(H.rx, H.top, 'tri', 4)
    + T(800, 335, 20, '#2c5a92')('A ligand (e.g. a drug or neurotransmitter) bound to its receptor'));
  const qCard = (x, head, q, word, c, sub) => [
    { type: 'rect', x, y: 300, w: 380, h: 400, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
    txt(head, x + 190, 345, 26, c, { align: 'center', bold: true }),
    txt(q, x + 190, 430, 34, 'ink', { align: 'center', bold: true }),
    txt(sub, x + 190, 520, 21, '#5b6270', { align: 'center' }),
  ];
  const hookItems = [
    title('Affinity vs specificity'),
    txt('Two words that are easy to mix up, describing how a ligand binds its receptor', 800, 140, 26, '#3b4252', { align: 'center', bold: true }),
    hookArt,
    ...qCard(60, 'Question 1', 'How TIGHTLY\ndoes it bind?', 'AFFINITY', AFF, 'Once it’s there,\nhow strongly does it hold on?'),
    ...qCard(1160, 'Question 2', 'How CHOOSY\nis it?', 'SPECIFICITY', SPEC, 'Does it bind only its target,\nor other receptors too?'),
    txt('Analogy: a handshake. Affinity = how firm the grip. Specificity = whose hand you shake.', 800, 800, 23, '#5b6270', { align: 'center', bold: true }),
  ];
  const hookActions = [{
    id: 'names', label: 'Name them', stay: true, drawn: false,
    items: [
      { type: 'rect', x: 85, y: 600, w: 330, h: 70, color: AFF, fill: AFF, fillOpacity: 1, width: 2, rough: false, at: 0.2 },
      txt('= AFFINITY', 250, 635, 34, '#ffffff', { align: 'center', bold: true, anim: 'pop', duration: 0.4, at: 0.2 }),
      { type: 'rect', x: 1185, y: 600, w: 330, h: 70, color: SPEC, fill: SPEC, fillOpacity: 1, width: 2, rough: false, at: 1.0 },
      txt('= SPECIFICITY', 1350, 635, 34, '#ffffff', { align: 'center', bold: true, anim: 'pop', duration: 0.4, at: 1.0 }),
    ],
  }];

  // ====================================================================== slide 2: affinity
  const A2 = { top: 650, bot: 710, L: { x0: 60, x1: 780, rx: 420 }, R: { x0: 820, x1: 1540, rx: 1180 } };
  const affBase = svgItem(panel(60, 780, 205, A2.top, A2.bot, 860) + panel(820, 1540, 205, A2.top, A2.bot, 860)
    + receptor(A2.L.rx, A2.top, 'tri', 'blue') + receptor(A2.R.rx, A2.top, 'tri', 'blue'));
  const dockL = A2.top + DOCK.tri, dockR = A2.top + DOCK.tri - 4;
  const hiDraw = ([x, y, b]) => ligand('tri', x, y) + (b > 0.5 ? contacts(A2.L.rx, A2.top, 'tri', 4) : '');
  const loDraw = ([x, y, b]) => ligand('tri', x, y, 'pale', 0.74) + (b > 0.5 ? contacts(A2.R.rx, A2.top, 'tri', 1) : '');
  const HI0 = [A2.L.rx - 200, 300], LO0 = [A2.R.rx - 200, 300];
  const affStatic = [
    { ...svgItem(hiDraw([...HI0, 0])), hideDuring: 'bind2' },
    { ...svgItem(loDraw([...LO0, 0])), hideDuring: 'bind2' },
  ];
  const BIND_T = 11;
  const hiKeys = [[0, ...HI0, 0], [1.2, A2.L.rx, dockL, 0], [1.3, A2.L.rx, dockL, 1], [BIND_T, A2.L.rx, dockL, 1]];
  const loKeys = [[0, ...LO0, 0], [1.2, A2.R.rx, dockR, 0], [1.3, A2.R.rx, dockR, 1], [2.1, A2.R.rx, dockR, 1], [2.2, A2.R.rx, dockR, 0],
    [3.0, A2.R.rx + 170, 330, 0], [4.4, A2.R.rx + 170, 330, 0], [5.4, A2.R.rx, dockR, 0], [5.5, A2.R.rx, dockR, 1], [6.2, A2.R.rx, dockR, 1], [6.3, A2.R.rx, dockR, 0],
    [7.1, A2.R.rx - 180, 310, 0], [8.4, A2.R.rx - 180, 310, 0], [9.4, A2.R.rx, dockR, 0], [9.5, A2.R.rx, dockR, 1], [BIND_T, A2.R.rx, dockR, 1]];
  const affItems = [
    title('Affinity: how tightly does it bind?'),
    { type: 'rect', x: 60, y: 112, w: 1480, h: 80, color: AFF, fill: '#eef3ff', fillOpacity: 1, width: 3, rough: false },
    txt('Affinity = how strongly a ligand binds its receptor: how tightly it holds on once it’s there.', 800, 152, 26, AFF, { align: 'center', bold: true }),
    affBase, ...affStatic,
    txt('High affinity', 420, 245, 32, AFF, { align: 'center', bold: true }),
    txt('Low affinity', 1180, 245, 32, '#8a8f98', { align: 'center', bold: true }),
    txt('Snug fit, many bonds', 420, 285, 21, '#3b4252', { align: 'center', bold: true }),
    txt('Loose fit, few bonds', 1180, 285, 21, '#3b4252', { align: 'center', bold: true }),
    ...label('Receptor', 620, 560, [610, 570], [A2.L.rx + 70, A2.top - 60], 'left', 21),
    ...label('Ligand', 150, 330, [165, 318], [HI0[0] - 30, HI0[1] - 6], 'center', 21).map((it) => ({ ...it, hideDuring: 'bind2' })),
    { type: 'circle', x: 92, y: 838, r: 9, color: '#a87900', fill: '#f2b300', fillOpacity: 1, width: 2, rough: false },
    txt('= an attractive interaction (bond) between ligand and receptor', 110, 838, 18, '#5b6270', { bold: true }),
  ];
  const affActions = [{
    id: 'bind2', label: 'Watch them bind', stay: true, drawn: false,
    items: [
      ...track(hiKeys, hiDraw), ...track(loKeys, loDraw),
      { type: 'flash', x: A2.L.rx, y: dockL, r: 60, color: '#ffd34d', duration: 0.6, at: 1.25 },
      txt('Stays bound', 420, 760, 26, AFF, { align: 'center', bold: true, at: 3, anim: 'fade', duration: 0.4 }),
      txt('Keeps falling off', 1180, 760, 26, BAD, { align: 'center', bold: true, at: 3, anim: 'fade', duration: 0.4 }),
      txt('Bound almost all the time', 420, 796, 20, '#3b4252', { align: 'center', at: BIND_T - 0.5, anim: 'fade', duration: 0.4 }),
      txt('Bound only part of the time', 1180, 796, 20, '#3b4252', { align: 'center', at: BIND_T - 0.5, anim: 'fade', duration: 0.4 }),
    ],
  }];

  // ====================================================================== slide 3: Kd
  // Binding curves: fraction bound = C / (C + Kd). x axis is log10 concentration (0.01 nM … 10 µM).
  const G = { x: 130, y: 170, w: 620, h: 500 }, LX0 = -2, LX1 = 4;
  const KD_HI = 1, KD_LO = 100;
  const gx = (lc) => G.x + ((lc - LX0) / (LX1 - LX0)) * G.w, gy = (f) => G.y + G.h - f * G.h;
  const occ = (c, kd) => c / (c + kd);
  const curve = (kd) => { let d = ''; for (let i = 0; i <= 120; i++) { const lc = LX0 + ((LX1 - LX0) * i) / 120; d += `${i ? 'L' : 'M'}${f1(gx(lc))} ${f1(gy(occ(10 ** lc, kd)))}`; } return d; };
  const concLabel = (c) => (c >= 1000 ? `${+(c / 1000).toPrecision(2)} µM` : c >= 1 ? `${+c.toPrecision(2)} nM` : `${+c.toPrecision(2)} nM`);
  const graphSvg = `
    <rect x="${G.x}" y="${G.y}" width="${G.w}" height="${G.h}" fill="#ffffff" stroke="#c9ced8" stroke-width="2"/>
    ${[0, 0.5, 1].map((f) => `<line x1="${G.x}" y1="${gy(f)}" x2="${G.x + G.w}" y2="${gy(f)}" stroke="${f === 0.5 ? '#8a8f98' : '#e3e6ec'}" stroke-width="2" ${f === 0.5 ? 'stroke-dasharray="8 6"' : ''}/>
      ${T(G.x - 12, gy(f) + 7, 18, '#5b6270', 600, 'end')(`${f * 100}%`)}`).join('')}
    ${[-2, -1, 0, 1, 2, 3, 4].map((lc) => `<line x1="${gx(lc)}" y1="${G.y + G.h}" x2="${gx(lc)}" y2="${G.y + G.h + 8}" stroke="#8a8f98" stroke-width="2"/>
      ${T(gx(lc), G.y + G.h + 30, 16, '#5b6270', 600)(concLabel(10 ** lc))}`).join('')}
    ${T(G.x + G.w / 2, G.y + G.h + 64, 20, '#3b4252')('Ligand concentration (log scale) →')}
    <text transform="translate(${G.x - 70} ${G.y + G.h / 2}) rotate(-90)" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="#3b4252">Receptors bound</text>
    <path d="${curve(KD_HI)}" fill="none" stroke="${AFF}" stroke-width="5"/>
    <path d="${curve(KD_LO)}" fill="none" stroke="#e8890c" stroke-width="5"/>
    <line x1="${gx(0)}" y1="${gy(0.5)}" x2="${gx(0)}" y2="${G.y + G.h}" stroke="${AFF}" stroke-width="2.5" stroke-dasharray="4 5"/>
    <line x1="${gx(2)}" y1="${gy(0.5)}" x2="${gx(2)}" y2="${G.y + G.h}" stroke="#e8890c" stroke-width="2.5" stroke-dasharray="4 5"/>
    <circle cx="${gx(0)}" cy="${gy(0.5)}" r="7" fill="${AFF}"/><circle cx="${gx(2)}" cy="${gy(0.5)}" r="7" fill="#e8890c"/>
    ${T(gx(0) - 10, gy(0.5) - 16, 19, AFF, 700, 'end')('Kd = 1 nM')}
    ${T(gx(2) + 12, gy(0.5) + 30, 19, '#c46f00', 700, 'start')('Kd = 100 nM')}
    ${T(gx(-1.2), gy(0.92), 19, AFF, 700, 'middle')('High affinity')}
    ${T(gx(3.1), gy(0.22), 19, '#c46f00', 700, 'middle')('Low affinity')}`;
  // right side: 6 receptors per ligand, filled according to the fraction bound
  const RR = { x0: 830, gap: 110, rowTop: [400, 690], s: 0.55 };
  const rowSvg = (row, kind, frac, color, k) => {
    const n = Math.round(frac * 6), top = RR.rowTop[row];
    let s = '';
    for (let i = 0; i < 6; i++) {
      const x = RR.x0 + 60 + i * RR.gap;
      s += receptor(x, top, 'tri', 'blue', RR.s);
      if (i < n) s += ligand('tri', x, top + DOCK.tri * RR.s - (k < 1 ? 2 : 0), color, k, RR.s);
    }
    return s;
  };
  const RPANEL = `${panel(800, 1540, 230, 400, 434, 470)}${panel(800, 1540, 520, 690, 724, 760)}`;
  const kdDyn = (lc) => {
    const c = 10 ** lc, fh = occ(c, KD_HI), fl = occ(c, KD_LO);
    return `<line x1="${gx(lc)}" y1="${G.y}" x2="${gx(lc)}" y2="${G.y + G.h}" stroke="#1f2430" stroke-width="3"/>
      <rect x="${gx(lc) - 52}" y="${G.y - 36}" width="104" height="30" rx="8" fill="#1f2430"/>${T(gx(lc), G.y - 15, 17, '#ffffff')(concLabel(c))}
      <circle cx="${gx(lc)}" cy="${gy(fh)}" r="9" fill="${AFF}" stroke="#ffffff" stroke-width="3"/><circle cx="${gx(lc)}" cy="${gy(fl)}" r="9" fill="#e8890c" stroke="#ffffff" stroke-width="3"/>
      ${rowSvg(0, 'tri', fh, 'amber', 1)}${rowSvg(1, 'tri', fl, 'pale', 0.74)}
      ${T(1520, 268, 22, AFF, 700, 'end')(`${Math.round(fh * 100)}% bound`)}${T(1520, 558, 22, '#c46f00', 700, 'end')(`${Math.round(fl * 100)}% bound`)}`;
  };
  const kdItems = [
    title('Measuring affinity: Kd'),
    svgItem(graphSvg + RPANEL),
    txt('High-affinity ligand', 820, 268, 22, AFF, { bold: true }),
    txt('Low-affinity ligand', 820, 558, 22, '#c46f00', { bold: true }),
    { ...svgItem(kdDyn(-2)), hideDuring: 'conc' },
    { type: 'rect', x: 60, y: 790, w: 1480, h: 70, color: AFF, fill: '#eef3ff', fillOpacity: 1, width: 3, rough: false },
    txt('Kd = the concentration that fills HALF the receptors.  Lower Kd = higher affinity.', 800, 825, 26, AFF, { align: 'center', bold: true }),
  ];
  const kdActions = [{
    id: 'conc', label: 'Add more and more ligand', stay: true, drawn: false,
    items: track([[0, -2], [10, 4]], ([lc]) => kdDyn(lc), 8),
  }];

  // ====================================================================== slide 4: specificity
  const S4 = { top: 650, bot: 710 };
  const RX = { L: [200, 420, 640], R: [960, 1180, 1400] };
  const RECS = [['tri', 'blue', 'Target'], ['round', 'green', 'Other\nreceptor'], ['square', 'pink', 'Other\nreceptor']];
  const specBase = svgItem(panel(60, 780, 205, S4.top, S4.bot, 860) + panel(820, 1540, 205, S4.top, S4.bot, 860)
    + RX.L.map((x, i) => receptor(x, S4.top, RECS[i][0], RECS[i][1], 0.8)).join('') + RX.R.map((x, i) => receptor(x, S4.top, RECS[i][0], RECS[i][1], 0.8)).join(''));
  const dockY = (pocket, s = 0.8) => S4.top + DOCK[pocket] * s;
  const blobDock = { tri: -112, round: -127, square: -110 };
  // left: specific ligand (triangle) tries all three, binds only the target
  const specL = (i) => {
    const x = RX.L[i], start = [x, 300];
    if (i === 0) return [[0, ...start, 0], [1.2 + i, x, dockY('tri'), 0], [1.3 + i, x, dockY('tri'), 1], [9, x, dockY('tri'), 1]];
    const t = 1 + i * 1.6, hover = S4.top - 135 * 0.8 - 26;
    return [[0, ...start, 0], [t, x, hover, 0], [t + 0.5, x, hover, 0], [t + 1.4, x + 60, 330, 0], [9, x + 60, 330, 0]];
  };
  const specR = (i) => {
    const x = RX.R[i], p = RECS[i][0], d = S4.top + blobDock[p] * 0.8;
    return [[0, x, 300, 0], [1.2 + i * 0.5, x, d, 0], [1.3 + i * 0.5, x, d, 1], [9, x, d, 1]];
  };
  const drawSpecL = (i) => ([x, y, b]) => ligand('tri', x, y, 'amber', 1, 0.8) + (b > 0.5 ? contacts(RX.L[i], S4.top, 'tri', 4, 0.8) : '');
  const drawSpecR = (i) => ([x, y, b]) => ligand('blob', x, y, 'teal', 1, 0.8) + (b > 0.5 ? contacts(RX.R[i], S4.top, RECS[i][0], 2, 0.8) : '');
  const specItems = [
    title('Specificity: how choosy is it?'),
    { type: 'rect', x: 60, y: 112, w: 1480, h: 80, color: SPEC, fill: '#f4eefe', fillOpacity: 1, width: 3, rough: false },
    txt('Specificity = how selectively a ligand binds its target rather than other receptors.', 800, 152, 26, SPEC, { align: 'center', bold: true }),
    specBase,
    ...[0, 1, 2].map((i) => ({ ...svgItem(drawSpecL(i)([RX.L[i], 300, 0])), hideDuring: 'bind4' })),
    ...[0, 1, 2].map((i) => ({ ...svgItem(drawSpecR(i)([RX.R[i], 300, 0])), hideDuring: 'bind4' })),
    txt('High specificity', 420, 245, 32, SPEC, { align: 'center', bold: true }),
    txt('Low specificity', 1180, 245, 32, '#8a8f98', { align: 'center', bold: true }),
    ...[0, 1].flatMap((side) => (side ? RX.R : RX.L).map((x, i) => txt(RECS[i][2], x, 760, 19, i ? '#5b6270' : '#2c5a92', { align: 'center', bold: true }))),
  ];
  const specActions = [{
    id: 'bind4', label: 'Watch them bind', stay: true, drawn: false,
    items: [
      ...[0, 1, 2].flatMap((i) => track(specL(i), drawSpecL(i))),
      ...[0, 1, 2].flatMap((i) => track(specR(i), drawSpecR(i))),
      ...[1, 2].map((i) => txt('✕', RX.L[i], S4.top - 190, 40, BAD, { align: 'center', bold: true, at: 1.4 + i * 1.6, until: 1.6, anim: 'pop', duration: 0.3 })),
      txt('Only its target: fewer side effects', 420, 830, 22, GOOD, { align: 'center', bold: true, at: 5.5, anim: 'fade', duration: 0.4 }),
      txt('Binds other receptors too: side effects', 1180, 830, 22, BAD, { align: 'center', bold: true, at: 3.0, anim: 'fade', duration: 0.4 }),
    ],
  }];

  // ====================================================================== slide 5: independent (2x2)
  const Q = { x0: 260, y0: 150, w: 620, h: 330 };
  const QUADS = [
    { col: 1, row: 0, aff: 'high', spec: 'high', head: 'High affinity + high specificity', body: 'Binds tightly, and only to its target.\nThe ideal drug: works at low doses\nwith few side effects.', c: GOOD },
    { col: 0, row: 0, aff: 'low', spec: 'high', head: 'Low affinity + high specificity', body: 'Only binds its target, but weakly.\nNeeds a high dose to have\nan effect.', c: '#c46f00' },
    { col: 1, row: 1, aff: 'high', spec: 'low', head: 'High affinity + low specificity', body: 'Binds tightly to many receptors.\nStrong effects, and strong\nside effects.', c: BAD },
    { col: 0, row: 1, aff: 'low', spec: 'low', head: 'Low affinity + low specificity', body: 'Binds weakly to many receptors.\nNot much use as a drug.', c: '#8a8f98' },
  ];
  const quadArt = (q) => {
    const x = Q.x0 + q.col * Q.w, y = Q.y0 + q.row * Q.h, top = y + 250, xs = [x + 180, x + 310, x + 440];
    let s = `<rect x="${x + 100}" y="${top}" width="420" height="22" fill="#fbecd6"/><line x1="${x + 100}" y1="${top}" x2="${x + 520}" y2="${top}" stroke="#c99a62" stroke-width="3"/>`;
    xs.forEach((rx, i) => {
      s += receptor(rx, top, RECS[i][0], RECS[i][1], 0.5);
      const bound = q.spec === 'high' ? i === 0 : true;
      if (!bound) return;
      const kind = q.spec === 'high' ? 'tri' : 'blob', color = q.spec === 'high' ? (q.aff === 'high' ? 'amber' : 'pale') : 'teal';
      const k = q.aff === 'high' ? 1 : 0.8, dy = q.spec === 'high' ? DOCK.tri : blobDock[RECS[i][0]];
      s += ligand(kind, rx, top + dy * 0.5 - (q.aff === 'high' ? 0 : 3), color, k, 0.5);
      s += contacts(rx, top, RECS[i][0], q.aff === 'high' ? 4 : 1, 0.5);
    });
    return s;
  };
  const gridSvg = `
    ${QUADS.map((q) => `<rect x="${Q.x0 + q.col * Q.w + 8}" y="${Q.y0 + q.row * Q.h + 8}" width="${Q.w - 16}" height="${Q.h - 16}" rx="18" fill="#ffffff" stroke="#d9dce3" stroke-width="2"/>${quadArt(q)}`).join('')}
    <line x1="${Q.x0}" y1="${Q.y0 + 2 * Q.h + 20}" x2="${Q.x0 + 2 * Q.w}" y2="${Q.y0 + 2 * Q.h + 20}" stroke="${AFF}" stroke-width="5"/>
    <polygon points="${Q.x0 + 2 * Q.w + 18},${Q.y0 + 2 * Q.h + 20} ${Q.x0 + 2 * Q.w},${Q.y0 + 2 * Q.h + 10} ${Q.x0 + 2 * Q.w},${Q.y0 + 2 * Q.h + 30}" fill="${AFF}"/>
    ${T(Q.x0 + Q.w, Q.y0 + 2 * Q.h + 58, 24, AFF)('AFFINITY: low → high')}
    <line x1="${Q.x0 - 20}" y1="${Q.y0 + 2 * Q.h}" x2="${Q.x0 - 20}" y2="${Q.y0}" stroke="${SPEC}" stroke-width="5"/>
    <polygon points="${Q.x0 - 20},${Q.y0 - 18} ${Q.x0 - 30},${Q.y0} ${Q.x0 - 10},${Q.y0}" fill="${SPEC}"/>
    <text transform="translate(${Q.x0 - 52} ${Q.y0 + Q.h}) rotate(-90)" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="24" text-anchor="middle" fill="${SPEC}">SPECIFICITY: low → high</text>`;
  const qHot = (q, i) => ({ type: 'hotspot', x: Q.x0 + q.col * Q.w, y: Q.y0 + q.row * Q.h, w: Q.w, h: Q.h, action: `q${i}` });
  const qText = (q) => {
    const x = Q.x0 + q.col * Q.w, y = Q.y0 + q.row * Q.h;
    return [txt(q.head, x + Q.w / 2, y + 42, 23, q.c, { align: 'center', bold: true })];
  };
  const qBody = (q) => {
    const x = Q.x0 + q.col * Q.w, y = Q.y0 + q.row * Q.h;
    return [
      { type: 'rect', x: x + 8, y: y + 8, w: Q.w - 16, h: Q.h - 16, color: q.c, fill: q.c, fillOpacity: 0.06, width: 5, rough: false },
      { type: 'rect', x: x + 40, y: y + 62, w: Q.w - 80, h: 92, color: q.c, fill: '#ffffff', fillOpacity: 0.97, width: 2, rough: false },
      txt(q.body, x + Q.w / 2, y + 84, 19, '#1f2430', { align: 'center', bold: true, anim: 'fade', duration: 0.3 }),
    ];
  };
  const indItems = [
    title('They are independent of each other'),
    svgItem(gridSvg),
    ...QUADS.flatMap(qText),
    ...QUADS.map(qHot),
    txt('Click a box to see what it means', 1500, 124, 19, '#8a8f98', { align: 'right' }),
  ];
  const indActions = QUADS.map((q, i) => ({ id: `q${i}`, label: q.head.replace(' + ', ' / '), group: 'quad', stay: true, drawn: false, items: qBody(q) }));

  // ====================================================================== slide 6: review
  const RV = (x, c, head, q, rows) => [
    { type: 'rect', x, y: 120, w: 700, h: 650, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
    { type: 'rect', x, y: 120, w: 700, h: 76, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
    txt(head, x + 350, 158, 36, '#ffffff', { align: 'center', bold: true }),
    txt(q, x + 350, 236, 28, c, { align: 'center', bold: true }),
    ...rows.flatMap(([k, v], i) => [
      txt(k, x + 40, 310 + i * 112, 20, '#5b6270', { bold: true }),
      txt(v, x + 40, 346 + i * 112, 23, '#1f2430', { bold: true }),
    ]),
  ];
  const reviewItems = [
    title('Review: affinity vs specificity'),
    ...RV(60, AFF, 'AFFINITY', 'How TIGHTLY does it bind?', [
      ['What it describes', 'How strongly a ligand holds on to ONE receptor'],
      ['How it’s measured', 'Kd: the concentration that fills half the receptors\n(lower Kd = higher affinity)'],
      ['High affinity means', 'It works at low concentrations (low doses)'],
      ['Analogy', 'How firm the handshake is'],
    ]),
    ...RV(840, SPEC, 'SPECIFICITY', 'How CHOOSY is it?', [
      ['What it describes', 'How it binds its target compared with\nOTHER receptors'],
      ['How it’s measured', 'Compare affinities: much higher for the target\nthan for anything else'],
      ['High specificity means', 'Fewer side effects'],
      ['Analogy', 'Whose hand you shake'],
    ]),
    { type: 'rect', x: 60, y: 790, w: 1480, h: 70, color: '#1f2430', fill: '#f4f5f8', fillOpacity: 1, width: 2, rough: false },
    txt('They are independent: a ligand can bind tightly but to many receptors, or loosely but only to one.', 800, 825, 24, '#1f2430', { align: 'center', bold: true }),
  ];

  const Qs = (...q) => '[QUESTIONS THIS SLIDE ANSWERS]\n' + q.map((x) => `[• ${x}]`).join('\n');
  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'affinity-specificity',
    title: '🎯 Affinity vs specificity',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: the hook.
      {
        say: 'Affinity is how tightly a ligand binds; specificity is how choosy it is about what it binds.',
        script: `${Qs('What are affinity and specificity, and why do people mix them up?')}

Every drug and every neurotransmitter works by binding to a receptor. [point to the receptor]

But there are two very different questions we can ask about that binding.

How TIGHTLY does it bind? [point left] And how CHOOSY is it? [point right] [click "Name them"]

The first is affinity. The second is specificity. They sound similar, but they're not the same thing at all.`,
        actions: hookActions,
        items: hookItems,
      },
      // Slide 2: affinity.
      { script: Qs('What is affinity?', 'What makes a ligand bind tightly (fit and number of bonds)?', 'What does high vs low affinity look like at the receptor?'), say: 'A high-affinity ligand fits snugly and makes many bonds, so it stays bound; a low-affinity one keeps falling off.', clear: true, actions: affActions, items: affItems },
      // Slide 3: Kd.
      { script: Qs('How do we measure affinity?', 'What is Kd?', 'Why does a LOWER Kd mean a HIGHER affinity?'), say: 'Kd is the concentration that fills half the receptors: the lower the Kd, the higher the affinity.', clear: true, actions: kdActions, items: kdItems },
      // Slide 4: specificity.
      { script: Qs('What is specificity?', 'What does a specific vs a non-specific ligand do?', 'Why does low specificity cause side effects?'), say: 'A highly specific ligand binds only its target; a non-specific one binds other receptors too, causing side effects.', clear: true, actions: specActions, items: specItems },
      // Slide 5: independent.
      { script: Qs('Are affinity and specificity linked?', 'What do the four combinations look like?', 'Which combination makes the best drug, and why?'), say: 'Affinity and specificity are independent: the best drugs have both high affinity and high specificity.', clear: true, actions: indActions, items: indItems },
      // Slide 6: review.
      { script: Qs('What is the difference between affinity and specificity?', 'How is each one measured?', 'Why do both matter for drugs?'), say: 'Affinity: how tightly. Specificity: how choosy. They are independent, and good drugs need both.', clear: true, items: reviewItems },
    ],
  });
})();
