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
  // Each plane is shown edge-on, as a line cutting through the brain, from a view where that is
  // obvious (side view for coronal and axial, top view for the sagittal planes). The two parts it
  // separates are labelled, and the right panel shows what the cut surface looks like.
  const PLANES = [
    { id: 'sagittal', name: 'Sagittal', color: '#2f6fde' },
    { id: 'midsagittal', name: 'Midsagittal', color: '#7b3fd0' },
    { id: 'coronal', name: 'Coronal', color: '#e8890c' },
    { id: 'axial', name: 'Axial', color: '#1d9a5a' },
  ];
  const PTAB_W = 330, PTAB_GAP = 24;
  const PX = tabGeometry(PLANES.length, PTAB_W, PTAB_GAP);
  const poly = (pts, fill, stroke, w = 4, dash = '') => `<polygon points="${pts.map((p) => p.map(f1).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  const REF = { x: 205, y: 205, s: 0.85 };                         // where the reference brain sits
  const bx = (x) => REF.x + x * REF.s, by = (y) => REF.y + y * REF.s;
  // a plane seen edge-on: a translucent band with a solid line through it
  const planeLine = (x1, y1, x2, y2, color) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${color}" stroke-opacity="0.22" stroke-width="26" stroke-linecap="round"/>
    <line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="16 9"/>`;
  // orientation compass for the reference picture
  const compass = (up, down, left, right) => {
    const cx = 150, cy = 650, L = 38;
    const arrow = (dx, dy) => { const x2 = cx + dx * L, y2 = cy + dy * L; return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#8a8f98" stroke-width="3"/><polygon points="${x2 + dx * 10},${y2 + dy * 10} ${x2 - dy * 7},${y2 + dx * 7} ${x2 + dy * 7},${y2 - dx * 7}" fill="#8a8f98"/>`; };
    return [
      { type: 'svg', svg: svgDoc(arrow(0, -1) + arrow(0, 1) + arrow(-1, 0) + arrow(1, 0)) },
      txt(up, cx, cy - L - 20, 17, '#5b6270', { align: 'center', bold: true }), txt(down, cx, cy + L + 20, 17, '#5b6270', { align: 'center', bold: true }),
      txt(left, cx - L - 14, cy, 17, '#5b6270', { align: 'right', bold: true }), txt(right, cx + L + 14, cy, 17, '#5b6270', { bold: true }),
    ];
  };
  const PLANE_INFO = {
    sagittal: {
      ref: 'superior', seen: 'Seen from above', at: { x: 390 }, parts: ['← Left part', 'Right part →'],
      head: 'Sagittal plane', body: 'A vertical cut running from front to back.\nIt divides the brain into left and right parts.\nAny cut parallel to the midline is sagittal.',
      cut: 'sagittalSection', cap: 'The cut face, seen from the side', note: 'Off the midline: through one hemisphere',
    },
    midsagittal: {
      ref: 'superior', seen: 'Seen from above', at: { x: 300 }, parts: ['← Left half', 'Right half →'],
      head: 'Midsagittal plane', body: 'The sagittal plane exactly on the midline,\nbetween the two hemispheres. It divides the\nbrain into equal left and right halves.',
      cut: 'medial', cap: 'The cut face (medial surface), seen from the side', note: 'Shows the corpus callosum and brainstem',
    },
    coronal: {
      ref: 'lateral', seen: 'Seen from the side', at: { x: 330 }, parts: ['← Anterior part', 'Posterior part →'],
      head: 'Coronal plane', body: 'A vertical cut running from side to side\n(like a headband). It divides the brain into\nanterior (front) and posterior (back) parts.',
      cut: 'coronalSection', cap: 'The cut face, seen from the front', note: 'Both hemispheres, ventricles and deep nuclei',
    },
    axial: {
      ref: 'lateral', seen: 'Seen from the side', at: { y: 230 }, parts: ['Superior part ↑', 'Inferior part ↓'],
      head: 'Axial (horizontal) plane', body: 'A horizontal cut, parallel to the ground.\nIt divides the brain into superior (top)\nand inferior (bottom) parts.',
      cut: 'axialSection', cap: 'The cut face, seen from above', note: 'Front of the brain at the top',
    },
  };
  const COMPASS = {
    lateral: ['Superior', 'Inferior', 'Anterior', 'Posterior'],
    superior: ['Anterior', 'Posterior', 'Left', 'Right'],
  };
  const SEC = { x: 940, y: 262, s: 0.95 };
  const planeActions = PLANES.map((pl, i) => {
    const t = PLANE_INFO[pl.id];
    const c = pl.color;
    let line, lineLabel, partItems;
    if (t.at.x !== undefined) {
      const X = bx(t.at.x);
      line = planeLine(X, 198, X, 632, c);
      lineLabel = txt(pl.name + ' plane', X, 186, 24, c, { align: 'center', bold: true });
      partItems = [txt(t.parts[0], X - 16, 656, 22, '#3b4252', { align: 'right', bold: true }), txt(t.parts[1], X + 16, 656, 22, '#3b4252', { bold: true })];
    } else {
      const Y = by(t.at.y);
      line = planeLine(188, Y, 732, Y, c);
      lineLabel = txt('Axial plane', 746, Y, 24, c, { bold: true });
      partItems = [txt(t.parts[0], 222, Y - 70, 22, '#3b4252', { align: 'right', bold: true }), txt(t.parts[1], 222, Y + 70, 22, '#3b4252', { align: 'right', bold: true })];
    }
    return {
      id: pl.id, label: pl.name, group: 'plane', stay: true, drawn: false,
      items: [
        ...tabOn(pl, PX[i], PTAB_W),
        { type: 'svg', svg: svgDoc(art(t.ref, 'pr' + i, REF.x, REF.y, REF.s) + line) },
        lineLabel, ...partItems,
        ...compass(...COMPASS[t.ref]),
        txt(t.seen, 150, 556, 17, '#8a8f98', { align: 'center', bold: true }),
        txt(t.head, 470, 708, 36, c, { align: 'center', bold: true }),
        txt(t.body, 470, 752, 22, '#3b4252', { align: 'center' }),
        { type: 'rect', x: 910, y: 200, w: 630, h: 660, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
        txt('What the cut looks like', 1225, 232, 26, c, { align: 'center', bold: true }),
        { type: 'svg', svg: svgDoc(`<g transform="translate(${SEC.x} ${SEC.y}) scale(${SEC.s})">${A[t.cut]('cut' + i)}</g>`) },
        txt(t.cap, 1225, 778, 22, '#3b4252', { align: 'center', bold: true }),
        txt(t.note, 1225, 814, 20, '#5b6270', { align: 'center' }),
      ],
    };
  });
  const planeItems = [
    title('Anatomical planes'),
    ...tabsStatic(PLANES, PTAB_W, PTAB_GAP),
    { type: 'rect', x: 910, y: 200, w: 630, h: 660, color: '#d9dce3', fill: '#ffffff', fillOpacity: 1, width: 2, rough: false },
    txt('Click a plane above to see\nwhere it cuts through the brain', 470, 480, 34, '#8a8f98', { align: 'center', bold: true, hideDuring: PLANES.map((p) => p.id) }),
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
  // A human head in profile (facing left, like the brain pictures, so we see the left side of the head,
  // with the brain inside it). The eye and arrow show where you are looking from for each view.
  const HEAD = { x: 1120, y: 540, s: 0.9 };
  const SKIN = '#f5d5bc', HLINE = '#6b4a3a';
  // Realistic profile: cranium bigger behind the ear, forehead, brow, nose, lips, chin, jaw, ear,
  // short hair with a natural hairline, and the neck. Local coords ~0..260 x 0..330, facing left.
  const HEAD_OUT = 'M150 14 C214 14 252 58 254 120 C254 160 244 190 228 212 C220 226 218 246 222 270 L232 330 L112 330 L104 300 C100 284 86 272 68 264 C54 258 50 248 52 238 C54 230 56 226 54 222 C48 218 46 212 50 208 C46 204 46 198 48 196 C46 192 50 188 52 186 C46 184 32 180 30 172 C30 164 40 154 50 140 C54 132 58 128 56 122 C52 118 52 110 56 104 C58 56 92 14 150 14 Z';
  const HAIR = 'M60 78 C70 36 108 10 156 10 C214 10 256 54 258 118 C259 156 250 186 232 212 C226 200 222 186 222 170 C222 156 214 144 202 140 C192 132 178 132 170 140 C162 132 152 112 150 100 C138 92 118 84 100 78 C88 74 72 74 60 78 Z';
  const headArt = () => `<g transform="translate(${HEAD.x} ${HEAD.y}) scale(${HEAD.s})">
    <defs>
      <linearGradient id="skinG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7dcc6"/><stop offset="0.6" stop-color="#f1cdb2"/><stop offset="1" stop-color="#e6b998"/></linearGradient>
      <linearGradient id="hairG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6450"/><stop offset="1" stop-color="#5e4234"/></linearGradient>
      <clipPath id="headClip"><path d="${HEAD_OUT}"/></clipPath>
    </defs>
    <path d="${HEAD_OUT}" fill="url(#skinG)"/>
    <g clip-path="url(#headClip)">
      <path d="M104 300 C140 268 176 252 222 250 L240 340 L100 340 Z" fill="#e2b493" opacity="0.35"/>
      <path d="M66 262 C104 264 142 252 168 222" fill="none" stroke="#d29f80" stroke-width="3" stroke-linecap="round"/>
    </g>
    <path d="${HAIR}" fill="url(#hairG)"/>
    ${[['M90 40 C120 26 160 24 196 36', 0.35], ['M110 62 C150 46 196 48 232 74', 0.3], ['M196 98 C220 110 238 132 244 158', 0.3], ['M80 58 C100 50 124 48 146 54', 0.25]].map(([d, o]) => `<path d="${d}" fill="none" stroke="#3f2b22" stroke-width="2.5" stroke-linecap="round" opacity="${o}"/>`).join('')}
    <path d="${HEAD_OUT}" fill="none" stroke="${HLINE}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M60 106 C70 100 84 100 96 106" fill="none" stroke="#5e4234" stroke-width="5" stroke-linecap="round"/>
    <path d="M64 124 C70 118 82 117 90 122 C84 128 72 130 64 124 Z" fill="#ffffff" stroke="${HLINE}" stroke-width="2"/>
    <circle cx="72" cy="123" r="4" fill="#4a3a32"/><circle cx="71" cy="122" r="1.4" fill="#ffffff"/>
    <path d="M63 119 C70 113 82 112 92 118" fill="none" stroke="${HLINE}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M44 172 C46 176 52 178 58 176" fill="none" stroke="${HLINE}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M50 207 L60 206" stroke="${HLINE}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M178 142 C194 132 210 144 209 164 C208 184 198 200 186 202 C176 203 172 194 176 186 C172 172 170 152 178 142 Z" fill="#efc2a3" stroke="${HLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M184 152 C194 148 200 158 198 170 C196 182 190 188 184 186 M186 168 C190 168 192 172 190 178" fill="none" stroke="${HLINE}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M222 270 L232 330" stroke="${HLINE}" stroke-width="0"/></g>`;
  // eye position and where its arrow points (board coordinates), per view
  const LOOK = {
    lateral: { eye: [1376, 766], to: [1296, 700], text: 'Looking at the left side of the head' },
    medial: { eye: [1404, 584], to: [1282, 642], dashed: true, text: 'Looking from the midline (head cut in half)' },
    superior: { eye: [1237, 520], to: [1252, 546], text: 'Looking down on the top of the head' },
    inferior: { eye: [1190, 838], to: [1192, 786], text: 'Looking up at the underside of the head' },
    anterior: { eye: [1052, 702], to: [1132, 700], text: 'Looking at the front of the head (the face)' },
    posterior: { eye: [1418, 652], to: [1348, 662], text: 'Looking at the back of the head' },
  };
  const headSvg = (kind, color) => {
    const { eye: [ex, ey], to: [tx, ty], dashed } = LOOK[kind];
    const len = Math.hypot(tx - ex, ty - ey), ux = (tx - ex) / len, uy = (ty - ey) / len;
    const sx = ex + ux * 30, sy = ey + uy * 30;
    return svgDoc(`${headArt()}
      <line x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(tx - ux * 14)}" y2="${f1(ty - uy * 14)}" stroke="${color}" stroke-width="6" stroke-linecap="round" ${dashed ? 'stroke-dasharray="11 9"' : ''}/>
      <polygon points="${f1(tx)},${f1(ty)} ${f1(tx - ux * 20 - uy * 11)},${f1(ty - uy * 20 + ux * 11)} ${f1(tx - ux * 20 + uy * 11)},${f1(ty - uy * 20 - ux * 11)}" fill="${color}"/>
      <ellipse cx="${ex}" cy="${ey}" rx="28" ry="16" fill="#fff" stroke="#3b4252" stroke-width="3.5" ${dashed ? 'stroke-dasharray="8 6"' : ''}/><circle cx="${ex}" cy="${ey}" r="10" fill="${color}"/><circle cx="${ex}" cy="${ey}" r="4.5" fill="#1f2430"/>`);
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
        txt('Where you are looking from', 950, 450, 22, '#8a8f98', { bold: true }),
        txt(LOOK[v.id].text, 950, 480, 22, v.color, { bold: true }),
        { type: 'svg', svg: headSvg(info.cube, v.color) },
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
