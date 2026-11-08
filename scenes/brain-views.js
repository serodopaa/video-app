// Explainer: views of the brain. Built slide by slide with the user.
// The user does the drawing; these visuals simply appear (drawn: false).
// Brain pictures come from brain-art.js (window.WB_BRAIN_ART). Board is 1600 x 900.
(() => {
  const A = window.WB_BRAIN_ART;
  if (!A) return;
  const svgDoc = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">${inner}</svg>`;
  const title = (text) => ({ type: 'text', x: 800, y: 66, text, size: 56, font: 'sans', bold: true, align: 'center', color: 'ink' });
  const f1 = (n) => Math.round(n * 10) / 10;
  // a brain picture placed on the board
  const art = (kind, id, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${A[kind](id)}</g>`;
  const txt = (text, x, y, size, color = 'ink', extra = {}) => ({ type: 'text', x, y, text, size, font: 'sans', color, ...extra });

  // ---------- clickable tab row ----------
  // Static tabs + an invisible hotspot over each; a chosen tab is re-drawn in its colour by the action.
  const TAB_Y = 112, TAB_H = 58;
  const tabGeometry = (n, w, gap) => {
    const total = n * w + (n - 1) * gap, x0 = Math.round((1600 - total) / 2);
    return Array.from({ length: n }, (_, i) => x0 + i * (w + gap));
  };
  const tabsStatic = (tabs, w, gap) => tabGeometry(tabs.length, w, gap).flatMap((x, i) => [
    { type: 'rect', x, y: TAB_Y, w, h: TAB_H, color: '#c9cfda', fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
    txt(tabs[i].name, x + w / 2, TAB_Y + TAB_H / 2, 28, '#3b4252', { align: 'center', bold: true }),
    { type: 'hotspot', x, y: TAB_Y, w, h: TAB_H, action: tabs[i].id },
  ]);
  const tabOn = (tab, x, w) => [
    { type: 'rect', x, y: TAB_Y, w, h: TAB_H, color: tab.color, fill: tab.color, fillOpacity: 1, width: 3, rough: false },
    txt(tab.name, x + w / 2, TAB_Y + TAB_H / 2, 28, '#ffffff', { align: 'center', bold: true }),
  ];

  // ====================================================================== slide 1: the hook
  const hookItems = [
    title('Same brain. Different view.'),
    { type: 'svg', svg: svgDoc(art('lateral', 'h1', 60, 205, 0.78) + art('superior', 'h2', 566, 205, 0.78) + art('anterior', 'h3', 1072, 205, 0.78)) },
    txt('Three very different pictures of one brain.', 800, 700, 34, 'ink', { align: 'center', bold: true }),
    txt('How do we describe what we are looking at, and where we are cutting?', 800, 752, 28, '#5b6270', { align: 'center' }),
  ];
  const hookActions = [{
    id: 'name', label: 'Name the views', stay: true, drawn: false,
    items: [
      txt('Lateral view', 294, 618, 28, '#2f6fde', { align: 'center', bold: true, anim: 'pop', duration: 0.4, at: 0.2 }),
      txt('Superior view', 800, 618, 28, '#e8890c', { align: 'center', bold: true, anim: 'pop', duration: 0.4, at: 0.9 }),
      txt('Anterior view', 1306, 618, 28, '#d6336c', { align: 'center', bold: true, anim: 'pop', duration: 0.4, at: 1.6 }),
      txt('Planes and views give everyone the same language.', 800, 818, 34, '#1f2430', { align: 'center', bold: true, anim: 'pop', duration: 0.5, at: 2.6 }),
    ],
  }];

  // ====================================================================== slide 2: anatomical planes
  const PLANES = [
    { id: 'sagittal', name: 'Sagittal', color: '#2f6fde' },
    { id: 'midsagittal', name: 'Midsagittal', color: '#7b3fd0' },
    { id: 'coronal', name: 'Coronal', color: '#e8890c' },
    { id: 'axial', name: 'Axial', color: '#1d9a5a' },
  ];
  const PTAB_W = 330, PTAB_GAP = 24;
  const PX = tabGeometry(PLANES.length, PTAB_W, PTAB_GAP);
  const R = { x: 150, y: 340, w: 450, h: 352 }, D = [170, -120];      // front face of the 3-D box, and the "depth" direction
  const poly = (pts, fill, stroke, w = 4, dash = '') => `<polygon points="${pts.map((p) => p.map(f1).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  const rectAt = (t) => [[R.x + D[0] * t, R.y + D[1] * t], [R.x + R.w + D[0] * t, R.y + D[1] * t], [R.x + R.w + D[0] * t, R.y + R.h + D[1] * t], [R.x + D[0] * t, R.y + R.h + D[1] * t]];
  const boxSvg = svgDoc(`
    ${poly(rectAt(0), 'none', '#c4cad6', 2.5, '8 6')}${poly(rectAt(1), 'none', '#c4cad6', 2.5, '8 6')}
    ${rectAt(0).map((p, i) => `<line x1="${p[0]}" y1="${p[1]}" x2="${rectAt(1)[i][0]}" y2="${rectAt(1)[i][1]}" stroke="#c4cad6" stroke-width="2.5" stroke-dasharray="8 6"/>`).join('')}
    ${art('lateral', 'pb', R.x + D[0] / 2, R.y + D[1] / 2, 0.75)}`);
  const planeShape = {
    sagittal: () => poly(rectAt(0.68), 'none', '#2f6fde', 2.5, '10 8') + poly(rectAt(0.86), 'none', '#2f6fde', 2.5, '10 8') + poly(rectAt(0.22), 'rgba(47,111,222,0.30)', '#2f6fde', 5),
    midsagittal: () => poly(rectAt(0.5), 'rgba(123,63,208,0.26)', '#7b3fd0', 5),
    coronal: () => { const xc = R.x + R.w * 0.52; return poly([[xc, R.y], [xc, R.y + R.h], [xc + D[0], R.y + R.h + D[1]], [xc + D[0], R.y + D[1]]], 'rgba(232,137,12,0.30)', '#e8890c', 5); },
    axial: () => { const yc = R.y + R.h * 0.56; return poly([[R.x, yc], [R.x + R.w, yc], [R.x + R.w + D[0], yc + D[1]], [R.x + D[0], yc + D[1]]], 'rgba(29,154,90,0.30)', '#1d9a5a', 5); },
  };
  const PLANE_TEXT = {
    sagittal: { head: 'Sagittal plane', body: 'A vertical cut from front to back.\nIt divides the brain into left and right parts.\nAny plane parallel to the midline is sagittal.', cut: 'medial', cap: 'A slice through one hemisphere' },
    midsagittal: { head: 'Midsagittal plane', body: 'The sagittal plane exactly through the midline.\nIt divides the brain into equal left\nand right halves.', cut: 'medial', cap: 'The inner (medial) face of one half' },
    coronal: { head: 'Coronal plane', body: 'A vertical cut from side to side.\nIt divides the brain into anterior (front)\nand posterior (back) parts.', cut: 'coronalSection', cap: 'A slice seen from the front' },
    axial: { head: 'Axial plane', body: 'A horizontal cut, parallel to the ground.\nIt divides the brain into superior (top)\nand inferior (bottom) parts.', cut: 'axialSection', cap: 'A slice seen from above' },
  };
  const planeActions = PLANES.map((pl, i) => {
    const t = PLANE_TEXT[pl.id];
    return {
      id: pl.id, label: pl.name, group: 'plane', stay: true, drawn: false,
      items: [
        ...tabOn(pl, PX[i], PTAB_W),
        { type: 'svg', svg: svgDoc(planeShape[pl.id]()) },
        txt(t.head, 930, 252, 42, pl.color, { bold: true }),
        txt(t.body, 930, 328, 25, '#3b4252'),
        txt('What the cut looks like', 930, 470, 22, '#8a8f98', { bold: true }),
        { type: 'svg', svg: svgDoc(`<g transform="translate(1030 490) scale(0.6)">${A[t.cut === 'medial' ? 'medial' : t.cut]('cut')}</g>`) },
        txt(t.cap, 1210, 806, 22, '#5b6270', { align: 'center' }),
      ],
    };
  });
  const planeItems = [
    title('Anatomical planes'),
    ...tabsStatic(PLANES, PTAB_W, PTAB_GAP),
    { type: 'svg', svg: boxSvg },
    txt('Superior', 96, 316, 24, '#5b6270', { bold: true, align: 'center' }), txt('Inferior', 96, 716, 24, '#5b6270', { bold: true, align: 'center' }),
    { type: 'line', from: [96, 336], to: [96, 696], color: '#9aa1ae', width: 2, rough: false },
    { type: 'line', from: [150, 730], to: [600, 730], color: '#9aa1ae', width: 2, rough: false },
    txt('Anterior', 150, 762, 24, '#5b6270', { bold: true }), txt('Posterior', 600, 762, 24, '#5b6270', { bold: true, align: 'right' }),
    txt('Left', 612, 716, 22, '#8a8f98', { bold: true }), txt('Right', 790, 566, 22, '#8a8f98', { bold: true }),
    { type: 'line', from: [606, 696], to: [776, 576], color: '#9aa1ae', width: 2, rough: false },
    { type: 'rect', x: 900, y: 200, w: 640, h: 660, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    txt('Click a plane above\nto see where it cuts', 1220, 480, 34, '#8a8f98', { align: 'center', bold: true, hideDuring: PLANES.map((p) => p.id) }),
  ];

  // ====================================================================== slide 3: anatomical views
  const VIEWS = [
    { id: 'lateral', name: 'Lateral', color: '#2f6fde' },
    { id: 'medial', name: 'Medial', color: '#7b3fd0' },
    { id: 'superior', name: 'Superior', color: '#e8890c' },
    { id: 'inferior', name: 'Inferior', color: '#1d9a5a' },
    { id: 'anterior', name: 'Anterior', color: '#d6336c' },
    { id: 'posterior', name: 'Posterior', color: '#0b8aa6' },
  ];
  const VTAB_W = 228, VTAB_GAP = 16;
  const VX = tabGeometry(VIEWS.length, VTAB_W, VTAB_GAP);
  const FIG = { x: 150, y: 215, s: 1.05 };
  // where the picture really sits inside its 600 x 470 box, and which way each edge faces
  const VIEW_INFO = {
    lateral: { ext: [28, 592, 22, 468], edges: ['Superior', 'Inferior', 'Anterior', 'Posterior'], cube: 'lateral',
      body: 'Seen from the side: the outer\nsurface of one hemisphere.\nShows the four lobes, the\ncerebellum and the brainstem.' },
    medial: { ext: [0, 600, 0, 470], edges: ['Superior', 'Inferior', 'Anterior', 'Posterior'], cube: 'medial',
      body: 'Seen from the midline, after a\nmidsagittal cut: the inner surface.\nShows the corpus callosum,\nthalamus, brainstem and cerebellum.' },
    superior: { ext: [108, 492, 20, 470], edges: ['Anterior', 'Posterior', 'Left', 'Right'], cube: 'superior',
      body: 'Seen from above (dorsal view).\nShows both hemispheres and the\nlongitudinal fissure between them.' },
    inferior: { ext: [100, 500, 24, 470], edges: ['Anterior', 'Posterior', 'Right', 'Left'], cube: 'inferior',
      body: 'Seen from below (ventral view).\nShows the underside: frontal and\ntemporal lobes, brainstem, cerebellum.' },
    anterior: { ext: [104, 496, 26, 424], edges: ['Superior', 'Inferior', 'Right', 'Left'], cube: 'anterior',
      body: 'Seen from the front.\nShows the frontal lobes, the\nlongitudinal fissure and the\ntips of the temporal lobes.' },
    posterior: { ext: [104, 496, 24, 470], edges: ['Superior', 'Inferior', 'Left', 'Right'], cube: 'posterior',
      body: 'Seen from behind.\nShows the occipital lobes (and\nparietal lobes) with the\ncerebellum below them.' },
  };
  // a see-through cube: the face being looked at is coloured, with an eye and arrow
  const CUBE = { x: 1120, y: 640, s: 140, d: [66, -56] };
  const cubeSvg = (kind, color) => {
    const { x, y, s, d } = CUBE;
    const F = [[x, y], [x + s, y], [x + s, y + s], [x, y + s]], B = F.map(([a, b]) => [a + d[0], b + d[1]]);
    const face = {
      anterior: F, posterior: B,
      superior: [F[0], F[1], B[1], B[0]], inferior: [F[3], F[2], B[2], B[3]], lateral: [F[1], B[1], B[2], F[2]],
      medial: [[x + s / 2, y], [x + s / 2 + d[0], y + d[1]], [x + s / 2 + d[0], y + s + d[1]], [x + s / 2, y + s]],
    }[kind];
    const cx = face.reduce((a, p) => a + p[0], 0) / 4, cy = face.reduce((a, p) => a + p[1], 0) / 4;
    const eyePos = {
      anterior: [cx - 70, cy + 86], posterior: [cx + 76, cy - 70], superior: [cx, cy - 92], inferior: [cx, cy + 92],
      lateral: [cx + 110, cy + 10], medial: [cx + 190, cy + 10],
    }[kind];
    const [ex, ey] = eyePos, len = Math.hypot(cx - ex, cy - ey), ux = (cx - ex) / len, uy = (cy - ey) / len;
    const ax = cx - ux * 14, ay = cy - uy * 14, sx = ex + ux * 26, sy = ey + uy * 26;
    const wire = (pts) => poly(pts, 'none', '#aab1bf', 2.5);
    return svgDoc(`${wire(F)}${wire(B)}${F.map((p, i) => `<line x1="${p[0]}" y1="${p[1]}" x2="${B[i][0]}" y2="${B[i][1]}" stroke="#aab1bf" stroke-width="2.5"/>`).join('')}
      ${poly(face, color + '55', color, 5)}
      <line x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(ax)}" y2="${f1(ay)}" stroke="${color}" stroke-width="5" stroke-linecap="round" ${kind === 'medial' ? 'stroke-dasharray="10 8"' : ''}/>
      <polygon points="${f1(ax)},${f1(ay)} ${f1(ax - ux * 16 - uy * 9)},${f1(ay - uy * 16 + ux * 9)} ${f1(ax - ux * 16 + uy * 9)},${f1(ay - uy * 16 - ux * 9)}" fill="${color}"/>
      <ellipse cx="${ex}" cy="${ey}" rx="26" ry="15" fill="#fff" stroke="#3b4252" stroke-width="3.5"/><circle cx="${ex}" cy="${ey}" r="9" fill="${color}"/><circle cx="${ex}" cy="${ey}" r="4" fill="#1f2430"/>`);
  };
  const viewActions = VIEWS.map((v, i) => {
    const info = VIEW_INFO[v.id];
    const [l, r, t, b] = info.ext, s = FIG.s;
    const [top, bottom, left, right] = info.edges;
    const cx = FIG.x + ((l + r) / 2) * s, cyy = FIG.y + ((t + b) / 2) * s;
    const edge = (text, x, y, align) => txt(text, x, y, 26, '#5b6270', { bold: true, align });
    return {
      id: v.id, label: v.name, group: 'view', stay: true, drawn: false,
      items: [
        ...tabOn(v, VX[i], VTAB_W),
        { type: 'svg', svg: svgDoc(art(v.id, 'v', FIG.x, FIG.y, s)) },
        edge(top, cx, FIG.y + t * s - 14, 'center'), edge(bottom, cx, FIG.y + b * s + 18, 'center'),
        edge(left, FIG.x + l * s - 14, cyy, 'right'), edge(right, FIG.x + r * s + 14, cyy, 'left'),
        txt(v.name + ' view', 950, 252, 44, v.color, { bold: true }),
        txt(info.body, 950, 326, 25, '#3b4252'),
        txt('Where you are looking from', 950, 520, 22, '#8a8f98', { bold: true }),
        { type: 'svg', svg: cubeSvg(info.cube, v.color) },
        ...(v.id === 'medial' ? [txt('after cutting along the midline', 1330, 800, 20, '#5b6270', { align: 'center' })] : []),
      ],
    };
  });
  const viewItems = [
    title('Anatomical views'),
    ...tabsStatic(VIEWS, VTAB_W, VTAB_GAP),
    { type: 'rect', x: 930, y: 200, w: 610, h: 660, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    txt('Click a view above to see\nthe brain from that angle', 480, 480, 34, '#8a8f98', { align: 'center', bold: true, hideDuring: VIEWS.map((v) => v.id) }),
  ];

  // ====================================================================== the topic
  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'brain-views',
    title: '🧠 Views of the brain',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: the hook.
      {
        say: 'The same brain looks completely different depending on how you look at it. Planes and views give us a shared language.',
        script: `Here is one brain, shown three ways. [point to each picture]

A view from the side. A view from above. A view from the front.

Same brain, three completely different pictures. [click "Name the views"]

Now imagine you're a surgeon, or a radiologist reading a scan, or a student reading a textbook. You need to say exactly what you're looking at, and exactly where something is. "That bit, over there" doesn't cut it.

So in this video we'll learn the language that everyone uses. First, the anatomical planes: the ways we slice the brain. Then, the anatomical views: the directions we look at it from.`,
        actions: hookActions,
        items: hookItems,
      },
      // Slide 2: anatomical planes - click a plane to see where it cuts.
      {
        say: 'Click a plane to see where it cuts: sagittal, midsagittal, coronal and axial.',
        clear: true,
        actions: planeActions,
        items: planeItems,
      },
      // Slide 3: anatomical views - click a view to see the brain from that angle.
      {
        say: 'Click a view to see the brain from that angle: lateral, medial, superior, inferior, anterior and posterior.',
        clear: true,
        actions: viewActions,
        items: viewItems,
      },
    ],
  });
})();
