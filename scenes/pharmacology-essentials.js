// Explainer: Pharmacology essentials | full course. Part 1: introduction to pharmacology. Built with the user.
// Uses the receptor / ligand artwork from affinity-specificity.js (window.WB_LIGAND_ART), so load that first.
// The user does the drawing; these visuals simply appear (drawn: false). Board is 1600 x 900.
(() => {
  const A = window.WB_LIGAND_ART;
  if (!A) return;
  const { panel, receptor, ligand, contacts, DOCK, track, frameTrack, T, svgItem, txt, title, f1 } = A;
  const INK = '#1f2430', GREY = '#5b6270', DARK = '#3b4252';
  const PK = '#2f6fde', PD = '#7b3fd0', ENDO = '#1f8a4c', EXO = '#d0630b', DRUG = '#c0392b';
  const Qs = (...q) => '[QUESTIONS THIS SLIDE ANSWERS]\n' + q.map((x) => `[• ${x}]`).join('\n');
  let gid = 0;

  // ---------- pieces ----------
  const box = (x, y, w, h, c, fill = '#ffffff', extra = {}) => ({ type: 'rect', x, y, w, h, color: c, fill, fillOpacity: 1, width: 3, rough: false, ...extra });
  const rr = (x, y, w, h, c, fill = '#ffffff', sw = 3, r = 16) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${r}" fill="${fill}" stroke="${c}" stroke-width="${sw}"/>`;
  // a two-colour capsule (the "drug")
  const capsule = (cx, cy, s = 1, rot = -30) => {
    const id = `cp${gid++}`;
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${rot}) scale(${s})">
      <defs><linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f28b82"/><stop offset="0.5" stop-color="#d93b30"/><stop offset="1" stop-color="#a5241c"/></linearGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#eef0f4"/><stop offset="1" stop-color="#c9ced8"/></linearGradient></defs>
      <path d="M0 -26 L-44 -26 A26 26 0 0 0 -44 26 L0 26 Z" fill="url(#${id}a)" stroke="#7d1a14" stroke-width="3"/>
      <path d="M0 -26 L44 -26 A26 26 0 0 1 44 26 L0 26 Z" fill="url(#${id}b)" stroke="#6b7280" stroke-width="3"/>
      <rect x="-50" y="-17" width="40" height="7" rx="3.5" fill="#ffffff" opacity="0.45"/></g>`;
  };
  // a small molecule (ball-and-stick)
  const molecule = (cx, cy, s = 1, c = '#16a3b8') => {
    const at = [[0, 0], [34, -18], [34, 22], [-34, -18], [-34, 22], [62, -34], [-62, 38]];
    const bonds = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [4, 6]];
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">${bonds.map(([a, b]) => `<line x1="${at[a][0]}" y1="${at[a][1]}" x2="${at[b][0]}" y2="${at[b][1]}" stroke="#4b5563" stroke-width="6"/>`).join('')}
      ${at.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i ? (i > 4 ? 10 : 14) : 18}" fill="${i > 4 ? '#ffffff' : i % 2 ? c : '#e05a4f'}" stroke="#374151" stroke-width="3"/>`).join('')}</g>`;
  };
  // a person (body silhouette), centre at chest
  const person = (cx, cy, s = 1, fill = '#dfe8f7', edge = '#7c93b8') => `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${s})">
    <circle cx="0" cy="-150" r="36" fill="${fill}" stroke="${edge}" stroke-width="4"/>
    <path d="M-18 -112 L18 -112 Q70 -106 78 -80 L98 30 Q100 44 88 44 L80 42 Q72 40 70 30 L56 -46 L54 20 L50 172 Q48 184 36 184 L20 184 Q8 184 8 172 L4 52 L-4 52 L-8 172 Q-8 184 -20 184 L-36 184 Q-48 184 -50 172 L-54 20 L-56 -46 L-70 30 Q-72 40 -80 42 L-88 44 Q-100 44 -98 30 L-78 -80 Q-70 -106 -18 -112 Z" fill="${fill}" stroke="${edge}" stroke-width="4" stroke-linejoin="round"/></g>`;
  const arrowHead = (id, c) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${c}"/></marker></defs>`;
  const curve = (d, c, w = 6, dash = '') => { const id = `ah${gid++}`; return arrowHead(id, c) + `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${dash ? `stroke-dasharray="${dash}"` : ''} marker-end="url(#${id})"/>`; };
  const dot = (x, y, r, c) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${c}" stroke="#ffffff" stroke-width="2.5"/>`;
  const badge = (x, y, n, c) => `<circle cx="${x}" cy="${y}" r="22" fill="${c}"/>${T(x, y + 8, 22, '#ffffff')(n)}`;
  const tag = (x, y, w, h, c, head, sub) => [box(x, y, w, h, c), txt(head, x + w / 2, y + 30, 22, c, { align: 'center', bold: true }), ...(sub ? [txt(sub, x + w / 2, y + 62, 18, GREY, { align: 'center', bold: true })] : [])];

  // =================================================================== slide 1: title
  const TOPICS = [['1', 'What is\npharmacology?', DARK], ['2', 'What is\na drug?', DRUG], ['3', 'Endogenous vs\nexogenous', ENDO], ['4', 'Pharmacokinetics vs\npharmacodynamics', PK]];
  const titleItems = [
    svgItem(`<rect x="0" y="0" width="1600" height="900" fill="#f4f7fc"/>
      <circle cx="1410" cy="170" r="230" fill="#e3ecfb"/><circle cx="170" cy="760" r="190" fill="#f9e6e4"/>
      ${capsule(1330, 250, 2.1, -32)}${molecule(1180, 430, 1.25)}${capsule(1480, 470, 1.2, 25)}`),
    txt('PHARMACOLOGY', 110, 215, 104, INK, { bold: true }),
    txt('ESSENTIALS', 110, 330, 104, DRUG, { bold: true }),
    box(110, 395, 270, 64, INK, INK, { fillOpacity: 1 }), txt('FULL COURSE', 245, 428, 30, '#ffffff', { align: 'center', bold: true }),
    txt('Part 1 · Introduction to pharmacology', 410, 428, 30, GREY, { bold: true }),
    ...TOPICS.flatMap(([n, t, c], i) => {
      const x = 110 + i * 350;
      return [box(x, 560, 320, 180, c), svgItem(badge(x + 44, 604, n, c)), txt(t, x + 160, 680, 24, c, { align: 'center', bold: true })];
    }),
  ];

  // =================================================================== slide 2: what is pharmacology?
  const P2 = { drug: [925, 470], body: [1370, 520] };
  const pharmItems = [
    title('What is pharmacology?'),
    box(60, 120, 700, 230, DARK, '#f4f6fa'),
    txt('PHARMACOLOGY', 410, 165, 34, DARK, { align: 'center', bold: true }),
    txt('The study of DRUGS and how they\ninteract with living things.', 410, 240, 28, INK, { align: 'center', bold: true }),
    // where the word comes from
    box(60, 375, 700, 160, '#c9ced8'),
    txt('Where the word comes from', 90, 410, 20, GREY, { bold: true }),
    txt('pharmakon', 90, 460, 32, DRUG, { bold: true }), txt('(Greek) = drug, medicine… or poison', 290, 462, 22, INK, { bold: true }),
    txt('-logy', 90, 507, 32, PK, { bold: true }), txt('= the study of', 290, 509, 22, INK, { bold: true }),
    // what it covers
    txt('It covers', 60, 580, 24, DARK, { bold: true }),
    ...[['How drugs work in the body', PD], ['How the body handles drugs', PK], ['What drugs are used for (therapeutics)', ENDO], ['Side effects and toxicity', DRUG], ['How much to give (dosing)', EXO]]
      .flatMap(([t, c], i) => [svgItem(`<circle cx="78" cy="${625 + i * 50}" r="9" fill="${c}"/>`), txt(t, 100, 625 + i * 50, 23, INK, { bold: true })]),
    // the two-way picture: drug ↔ body
    svgItem(`${rr(800, 120, 740, 740, '#d9dce3', '#fbfcfe', 2)}
      ${capsule(...P2.drug, 1.5, -30)}${person(...P2.body, 1.2)}
      ${T(P2.drug[0], 575, 26, DRUG)('DRUG')}${T(P2.body[0], 775, 26, '#2c5a92')('BODY')}
      ${curve('M 950 385 C 1030 220, 1180 220, 1260 320', PD, 7)}
      ${curve('M 1260 640 C 1170 760, 1020 760, 950 600', PK, 7)}`),
    txt('acts on', 1080, 215, 24, PD, { align: 'center', bold: true }),
    txt('acts on', 1080, 795, 24, PK, { align: 'center', bold: true }),
    txt('It works BOTH ways', 1170, 160, 26, DARK, { align: 'center', bold: true }),
  ];

  // =================================================================== slide 3: what is a drug?
  // A 3-step flow (click to build it): a chemical → it interacts with the body (binds a target) → it changes how the body works
  const F = { y0: 300, h: 330, xs: [60, 560, 1060], w: 480 };
  const R3 = { x: 800, top: 540 };
  const flowCard = (i, head, c) => [box(F.xs[i], F.y0, F.w, F.h, c), svgItem(badge(F.xs[i] + 40, F.y0 + 40, String(i + 1), c)), txt(head, F.xs[i] + 75, F.y0 + 40, 25, c, { bold: true })];
  const drugItems = [
    title('What is a drug?'),
    box(60, 115, 1480, 150, DRUG, '#fdf1f0'),
    txt('DRUG', 120, 190, 44, DRUG, { bold: true }),
    txt('Any chemical substance that CHANGES HOW THE BODY WORKS\nwhen it gets into the body.', 300, 190, 30, INK, { bold: true }),
    { ...svgItem(`${[0, 1, 2].map((i) => rr(F.xs[i], F.y0, F.w, F.h, '#c9ced8', '#f7f8fa', 2.5) + T(F.xs[i] + F.w / 2, F.y0 + F.h / 2 + 8, 26, '#9aa1ad')(String(i + 1))).join('')}`), hideDuring: 'd3' },
    { type: 'hotspot', x: 60, y: F.y0, w: 1480, h: F.h, action: 'd3' },
    // examples: medicines and not-medicines
    txt('Medicines', 60, 690, 24, ENDO, { bold: true }),
    txt('ibuprofen · antibiotics · insulin · antidepressants', 60, 730, 23, INK, { bold: true }),
    txt('Not medicines… still drugs', 830, 690, 24, EXO, { bold: true }),
    txt('caffeine · alcohol · nicotine', 830, 730, 23, INK, { bold: true }),
    box(60, 775, 1480, 80, '#c9ced8', '#f7f8fa'),
    txt('Medicines are drugs used to prevent, diagnose or treat disease. Every medicine is a drug,\nbut not every drug is a medicine.', 800, 815, 22, DARK, { align: 'center', bold: true }),
  ];
  const drugActions = [{
    id: 'd3', label: 'Build the definition', stay: true, drawn: false,
    items: [
      ...flowCard(0, 'A chemical substance', DRUG).map((it) => ({ ...it, at: 0 })),
      { ...svgItem(capsule(F.xs[0] + 150, 470, 1.3, -30) + molecule(F.xs[0] + 350, 470, 1.05)), at: 0.1 },
      txt('a medicine, caffeine, alcohol…', F.xs[0] + F.w / 2, F.y0 + 300, 20, GREY, { align: 'center', bold: true, at: 0.1 }),
      ...flowCard(1, 'Interacts with the body', PD).map((it) => ({ ...it, at: 1.2 })),
      { ...svgItem(`<defs><clipPath id="d3c"><rect x="${F.xs[1] + 3}" y="${F.y0 + 75}" width="${F.w - 6}" height="${F.h - 80}" rx="14"/></clipPath></defs><g clip-path="url(#d3c)">${panel(F.xs[1], F.xs[1] + F.w, F.y0 + 75, R3.top, R3.top + 50, F.y0 + F.h)}${receptor(R3.x, R3.top, 'tri', 'blue', 0.85)}</g>`), at: 1.2 },
      ...track([[0, R3.x + 150, 420], [1.0, R3.x, R3.top + DOCK.tri * 0.85], [30, R3.x, R3.top + DOCK.tri * 0.85]], ([x, y]) => ligand('tri', x, y, 'amber', 1, 0.85), null, 1.4),
      { ...svgItem(contacts(R3.x, R3.top, 'tri', 4, 0.85)), at: 2.5, duration: 0.3 },
      txt('binds a target,\ne.g. a receptor', F.xs[1] + 395, F.y0 + 130, 18, GREY, { align: 'center', bold: true, at: 1.4 }),
      ...flowCard(2, 'Changes how it works', ENDO).map((it) => ({ ...it, at: 2.8 })),
      { ...svgItem(`${['Heart rate', 'Pain', 'Alertness'].map((t, i) => {
        const y = F.y0 + 125 + i * 65, up = i === 0;
        return T(F.xs[2] + 50, y + 8, 24, INK, 700, 'start')(t) + rr(F.xs[2] + 210, y - 16, 200, 32, '#d9dce3', '#eef0f4', 2, 10)
          + `<rect x="${F.xs[2] + 210}" y="${y - 16}" width="${up ? 160 : i === 1 ? 50 : 120}" height="32" rx="10" fill="${up ? DRUG : i === 1 ? ENDO : PD}"/>`
          + T(F.xs[2] + 440, y + 9, 26, up ? DRUG : i === 1 ? ENDO : PD)(i === 1 ? '▼' : '▲');
      }).join('')}`), at: 3.0 },
      txt('e.g. speeds up the heart, eases pain', F.xs[2] + F.w / 2, F.y0 + 300, 20, GREY, { align: 'center', bold: true, at: 3.0 }),
      { type: 'arrow', from: [F.xs[0] + F.w + 6, F.y0 + F.h / 2], to: [F.xs[1] - 6, F.y0 + F.h / 2], color: DARK, width: 5, rough: false, at: 1.0 },
      { type: 'arrow', from: [F.xs[1] + F.w + 6, F.y0 + F.h / 2], to: [F.xs[2] - 6, F.y0 + F.h / 2], color: DARK, width: 5, rough: false, at: 2.7 },
    ],
  }];

  // =================================================================== slide 4: endogenous vs exogenous
  const C4 = { endo: 60, exo: 820, w: 720, y: 115, h: 560 };
  const endoP = [C4.endo + 200, 425], exoP = [C4.exo + 200, 425];
  const colHead = (x, c, head, sub, def) => [
    box(x, C4.y, C4.w, C4.h, c, '#ffffff'),
    { type: 'rect', x, y: C4.y, w: C4.w, h: 86, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
    txt(head, x + C4.w / 2, C4.y + 34, 36, '#ffffff', { align: 'center', bold: true }),
    txt(sub, x + C4.w / 2, C4.y + 68, 20, '#ffffff', { align: 'center', bold: true }),
    txt(def, x + 400, C4.y + 150, 25, c, { bold: true }),
  ];
  const exList = (x, c, lines) => lines.flatMap(([h, b], i) => [
    svgItem(`<circle cx="${x + 412}" cy="${C4.y + 245 + i * 95}" r="8" fill="${c}"/>`),
    txt(h, x + 430, C4.y + 245 + i * 95, 23, INK, { bold: true }),
    txt(b, x + 430, C4.y + 277 + i * 95, 19, GREY, { bold: true }),
  ]);
  // inside the body: a gland that releases molecules
  const ENDO_SRC = [endoP[0] + 4, endoP[1] - 40];
  const endoPaths = [[[0, 0], [-20, -80], [-4, -140]], [[0, 0], [60, -50], [62, 70]], [[0, 0], [-62, -40], [-80, 60]], [[0, 0], [16, 110], [-28, 200]]]
    .map((p) => p.map(([dx, dy]) => [ENDO_SRC[0] + dx, ENDO_SRC[1] + dy]));
  const endoItems = [
    svgItem(person(...endoP, 1.0, '#e3f4e8', '#6fa77f') + `<ellipse cx="${ENDO_SRC[0]}" cy="${ENDO_SRC[1]}" rx="30" ry="20" fill="#9fd9ae" stroke="${ENDO}" stroke-width="3"/>`),
    { type: 'text', x: endoP[0], y: C4.y + C4.h - 32, text: 'made INSIDE the body', size: 21, font: 'sans', bold: true, align: 'center', color: ENDO },
  ];
  const exoItems = [
    svgItem(person(...exoP, 1.0, '#fbeee2', '#c9935c') + capsule(exoP[0] - 130, 255, 0.6, -30)),
    { type: 'text', x: exoP[0], y: C4.y + C4.h - 32, text: 'comes from OUTSIDE', size: 21, font: 'sans', bold: true, align: 'center', color: EXO },
  ];
  const endoExoItems = [
    title('Endogenous vs exogenous'),
    ...colHead(C4.endo, ENDO, 'ENDOGENOUS', 'endo = within · -genous = produced', 'Made by your\nown body'),
    ...colHead(C4.exo, EXO, 'EXOGENOUS', 'exo = outside · -genous = produced', 'Comes from\noutside the body'),
    ...endoItems, ...exoItems,
    ...exList(C4.endo, ENDO, [['Hormones', 'insulin, adrenaline, cortisol'], ['Neurotransmitters', 'serotonin, dopamine'], ['Endorphins', 'the body\'s own painkillers']]),
    ...exList(C4.exo, EXO, [['Most medicines', 'ibuprofen, antibiotics'], ['Everyday drugs', 'caffeine, alcohol, nicotine'], ['Plant / lab-made', 'morphine (poppy), aspirin']]),
    { type: 'hotspot', x: C4.endo, y: C4.y, w: C4.w, h: C4.h, action: 'e4' },
    { type: 'hotspot', x: C4.exo, y: C4.y, w: C4.w, h: C4.h, action: 'x4' },
    { ...box(60, 700, 1480, 160, '#c9ced8', '#f7f8fa'), hideDuring: 'k4' },
    { ...txt('Key point (click)', 800, 780, 26, '#9aa1ad', { align: 'center', bold: true }), hideDuring: 'k4' },
    { type: 'hotspot', x: 60, y: 700, w: 1480, h: 160, action: 'k4' },
  ];
  const endoExoActions = [
    { id: 'e4', label: 'Endogenous: made inside', stay: true, drawn: false,
      items: [
        { type: 'pulse', x: ENDO_SRC[0], y: ENDO_SRC[1], r: 34, color: '#3ccf6e', speed: 1.2 },
        ...endoPaths.map((path, i) => ({ type: 'mover', path, r: 9, color: ENDO, count: 2, speed: 2.2 + i * 0.3, smooth: true })),
      ] },
    { id: 'x4', label: 'Exogenous: from outside', stay: true, drawn: false,
      items: [
        { type: 'mover', path: [[exoP[0] - 130, 255], [exoP[0] - 60, 270], [exoP[0], exoP[1] - 130], [exoP[0], exoP[1] - 60], [exoP[0] + 10, exoP[1] + 20]], char: '💊', size: 44, count: 1, speed: 3.2, smooth: true },
        { type: 'pulse', x: exoP[0] + 10, y: exoP[1] + 20, r: 30, color: '#f0a050', speed: 1.4 },
      ] },
    { id: 'k4', label: 'Key point: insulin', stay: true, drawn: false,
      items: [
        box(60, 700, 1480, 160, DARK, '#f4f6fa'),
        txt('KEY POINT', 100, 740, 22, DARK, { bold: true }),
        txt('Most drugs are exogenous, but the body\'s own substances can be given as drugs too.', 100, 785, 25, INK, { bold: true }),
        txt('Insulin for diabetes or adrenaline (EpiPen) for allergic reactions: the SAME molecule, but now it comes from outside.', 100, 828, 21, GREY, { bold: true }),
      ] },
  ];

  // =================================================================== slide 5: pharmacokinetics vs pharmacodynamics
  const TABS = [{ id: 'both5', text: 'Side by side', c: DARK }, { id: 'pk5', text: 'Pharmacokinetics', c: PK }, { id: 'pd5', text: 'Pharmacodynamics', c: PD }];
  const TW = 360, TX = (i) => 260 + i * (TW + 20);
  const tabBar = (active) => TABS.flatMap((t, i) => [
    { type: 'rect', x: TX(i), y: 108, w: TW, h: 62, color: t.c, fill: t.id === active ? t.c : '#ffffff', fillOpacity: 1, width: 3, rough: false },
    txt(t.text, TX(i) + TW / 2, 139, 23, t.id === active ? '#ffffff' : t.c, { align: 'center', bold: true }),
  ]);
  const tabHot = TABS.map((t, i) => ({ type: 'hotspot', x: TX(i), y: 108, w: TW, h: 62, action: t.id }));
  const sideCard = (x, c, head, tagline, word, list) => [
    box(x, 190, 720, 670, c, '#ffffff'),
    { type: 'rect', x, y: 190, w: 720, h: 80, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
    txt(head, x + 360, 230, 36, '#ffffff', { align: 'center', bold: true }),
    txt(tagline, x + 360, 315, 30, c, { align: 'center', bold: true }),
    txt(word, x + 360, 360, 20, GREY, { align: 'center', bold: true }),
    ...list.flatMap(([b, h, s], i) => [
      svgItem(badge(x + 70, 440 + i * 100, b, c)),
      txt(h, x + 112, 430 + i * 100, 25, INK, { bold: true }),
      txt(s, x + 112, 462 + i * 100, 19, GREY, { bold: true }),
    ]),
  ];
  const pkpdItems = [
    title('Pharmacokinetics vs pharmacodynamics'),
    ...tabBar('both5'),
    ...sideCard(60, PK, 'PHARMACOKINETICS', 'What the BODY does to the DRUG', 'kinetics = movement', [
      ['A', 'Absorption', 'gets from where it was given into the blood'], ['D', 'Distribution', 'travels in the blood to the tissues'],
      ['M', 'Metabolism', 'is broken down (mostly in the liver)'], ['E', 'Excretion', 'is removed (mostly by the kidneys)']]),
    ...sideCard(820, PD, 'PHARMACODYNAMICS', 'What the DRUG does to the BODY', 'dynamics = power (Greek dynamis)', [
      ['1', 'Target', 'what it binds (e.g. a receptor)'], ['2', 'Mechanism', 'what binding does (activate or block)'],
      ['3', 'Effect', 'the change in the body (and side effects)'], ['4', 'Dose–response', 'how the effect grows with the dose']]),
    ...tabHot,
  ];
  // ---- full view: pharmacokinetics (body with A-D-M-E, plus the drug level in the blood over time) ----
  const BOD = [430, 560];
  const ORG = { mouth: [BOD[0], 365], gut: [BOD[0], 572], liver: [BOD[0] - 28, 495], heart: [BOD[0] + 22, 440], kidney: [BOD[0] + 52, 560], out: [BOD[0] + 150, 800] };
  const organs = `<ellipse cx="${ORG.liver[0]}" cy="${ORG.liver[1]}" rx="46" ry="22" fill="#c76b5a" stroke="#7d3a2e" stroke-width="3"/>
    <ellipse cx="${ORG.gut[0]}" cy="${ORG.gut[1]}" rx="34" ry="24" fill="#f2b8a0" stroke="#b5694a" stroke-width="3"/>
    <path d="M ${ORG.heart[0]} ${ORG.heart[1] + 22} C ${ORG.heart[0] - 40} ${ORG.heart[1] - 6}, ${ORG.heart[0] - 20} ${ORG.heart[1] - 34}, ${ORG.heart[0]} ${ORG.heart[1] - 14} C ${ORG.heart[0] + 20} ${ORG.heart[1] - 34}, ${ORG.heart[0] + 40} ${ORG.heart[1] - 6}, ${ORG.heart[0]} ${ORG.heart[1] + 22} Z" fill="#e0505a" stroke="#8e1d24" stroke-width="3"/>
    <ellipse cx="${ORG.kidney[0]}" cy="${ORG.kidney[1]}" rx="12" ry="20" fill="#a0525a" stroke="#5e262c" stroke-width="3"/>
    <ellipse cx="${ORG.kidney[0] - 104}" cy="${ORG.kidney[1]}" rx="12" ry="20" fill="#a0525a" stroke="#5e262c" stroke-width="3"/>`;
  const ADME = [
    { k: 'A', name: 'Absorption', at: 0.3, lab: [130, 610], to: [ORG.gut[0] - 36, ORG.gut[1] + 4] },
    { k: 'D', name: 'Distribution', at: 1.3, lab: [730, 400], to: [ORG.heart[0] + 26, ORG.heart[1]] },
    { k: 'M', name: 'Metabolism', at: 2.3, lab: [130, 470], to: [ORG.liver[0] - 48, ORG.liver[1]] },
    { k: 'E', name: 'Excretion', at: 3.3, lab: [730, 610], to: [ORG.kidney[0] + 14, ORG.kidney[1]] },
  ];
  const GR = { x: 830, y: 260, w: 680, h: 470 };
  const conc = (t) => 1.62 * (Math.exp(-0.28 * t) - Math.exp(-1.6 * t)); // a typical "rise then fall" curve, peak ≈ 1
  const gx = (t) => GR.x + 70 + (t / 12) * (GR.w - 110), gy = (c) => GR.y + GR.h - 70 - c * (GR.h - 200);
  const pkGraph = (u) => {
    const pts = [];
    for (let t = 0; t <= 12 * u + 1e-6; t += 0.1) pts.push(`${f1(gx(t))},${f1(gy(conc(t)))}`);
    const tN = 12 * u;
    return `${rr(GR.x, GR.y, GR.w, GR.h, '#d9dce3', '#ffffff', 2)}
      ${T(GR.x + GR.w / 2, GR.y + 40, 24, INK)('Drug level in the blood')}
      <line x1="${gx(0)}" y1="${gy(0)}" x2="${gx(12) + 10}" y2="${gy(0)}" stroke="${DARK}" stroke-width="3"/>
      <line x1="${gx(0)}" y1="${gy(0)}" x2="${gx(0)}" y2="${GR.y + 70}" stroke="${DARK}" stroke-width="3"/>
      ${T(gx(6), gy(0) + 40, 20, GREY)('Time after a dose →')}
      <text x="${GR.x + 40}" y="${f1(GR.y + GR.h / 2 + 10)}" transform="rotate(-90 ${GR.x + 40} ${f1(GR.y + GR.h / 2 + 10)})" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="${GREY}">Level →</text>
      ${pts.length > 1 ? `<polyline points="${pts.join(' ')}" fill="none" stroke="${PK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
      ${pts.length ? dot(gx(tN), gy(conc(tN)), 10, PK) : ''}
      ${u >= 0.25 ? T(gx(0.2), gy(1.18), 19, PK, 700, 'start')('▲ rising: A + D') : ''}
      ${u >= 0.75 ? T(gx(4.6), gy(0.75), 19, PK, 700, 'start')('▼ falling: M + E') : ''}`;
  };
  const pkFull = [
    box(40, 185, 1520, 690, '#ffffff', '#ffffff', { width: 1 }),
    ...tabBar('pk5'),
    svgItem(`${rr(60, 190, 740, 670, PK, '#f6f9ff', 3)}${person(...BOD, 1.45, '#e3ecfb', '#8aa3cc')}${organs}${capsule(ORG.mouth[0] - 190, 300, 0.7, -30)}`),
    txt('What the BODY does to the DRUG', 430, 225, 26, PK, { align: 'center', bold: true }),
    ...ADME.flatMap((a) => [
      { ...svgItem(badge(a.lab[0], a.lab[1], a.k, PK) + `<line x1="${a.lab[0] + (a.lab[0] < 400 ? 24 : -24)}" y1="${a.lab[1]}" x2="${a.to[0]}" y2="${a.to[1]}" stroke="${PK}" stroke-width="2.5" stroke-dasharray="6 5"/>`), at: a.at, duration: 0.3 },
      txt(a.name, a.lab[0] + (a.lab[0] < 400 ? -38 : 38), a.lab[1] + 45, 22, PK, { align: a.lab[0] < 400 ? 'left' : 'right', bold: true, at: a.at, duration: 0.3, anim: 'fade' }),
    ]),
    { type: 'mover', path: [[ORG.mouth[0] - 190, 300], [ORG.mouth[0], ORG.mouth[1]], [ORG.gut[0], ORG.gut[1]], [ORG.liver[0], ORG.liver[1]], [ORG.heart[0], ORG.heart[1]], [ORG.kidney[0], ORG.kidney[1]], ORG.out], r: 11, color: DRUG, count: 1, speed: 5, smooth: true, at: 0.2 },
    ...frameTrack([[0, 0], [0.4, 0], [4.4, 1], [30, 1]], ([u]) => pkGraph(u), 12),
    txt('Pharmacokinetics decides how fast a drug starts\nworking, how strong the level gets and how long it lasts.', GR.x + GR.w / 2, 800, 21, DARK, { align: 'center', bold: true, at: 4.4, anim: 'fade', duration: 0.4 }),
  ];
  // ---- full view: pharmacodynamics (drug binds its target → effect, plus the dose–response curve) ----
  const RP = { x: 420, top: 560, s: 1.3 };
  const PDG = { x: 830, y: 260, w: 680, h: 470 };
  const sig = (d) => 1 / (1 + Math.exp(-(d - 5) * 1.1)); // effect vs dose: an S-curve
  const px = (d) => PDG.x + 70 + (d / 10) * (PDG.w - 110), py = (e) => PDG.y + PDG.h - 70 - e * (PDG.h - 150);
  const pdGraph = (u) => {
    const pts = [];
    for (let d = 0; d <= 10 * u + 1e-6; d += 0.1) pts.push(`${f1(px(d))},${f1(py(sig(d)))}`);
    return `${rr(PDG.x, PDG.y, PDG.w, PDG.h, '#d9dce3', '#ffffff', 2)}
      ${T(PDG.x + PDG.w / 2, PDG.y + 40, 24, INK)('Dose–response')}
      <line x1="${px(0)}" y1="${py(0)}" x2="${px(10) + 10}" y2="${py(0)}" stroke="${DARK}" stroke-width="3"/>
      <line x1="${px(0)}" y1="${py(0)}" x2="${px(0)}" y2="${PDG.y + 70}" stroke="${DARK}" stroke-width="3"/>
      ${T(px(5), py(0) + 40, 20, GREY)('Dose →')}
      <text x="${PDG.x + 40}" y="${f1(PDG.y + PDG.h / 2 + 10)}" transform="rotate(-90 ${PDG.x + 40} ${f1(PDG.y + PDG.h / 2 + 10)})" font-family="Lexend, Arial, sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="${GREY}">Effect →</text>
      <line x1="${px(0)}" y1="${py(1)}" x2="${px(10)}" y2="${py(1)}" stroke="#c9ced8" stroke-width="2" stroke-dasharray="8 6"/>
      ${T(px(10), py(1) - 12, 17, GREY, 700, 'end')('maximum effect')}
      ${pts.length > 1 ? `<polyline points="${pts.join(' ')}" fill="none" stroke="${PD}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
      ${pts.length ? dot(px(10 * u), py(sig(10 * u)), 10, PD) : ''}`;
  };
  const RDOCK = RP.top + DOCK.tri * RP.s;
  const pdFull = [
    box(40, 185, 1520, 690, '#ffffff', '#ffffff', { width: 1 }),
    ...tabBar('pd5'),
    svgItem(`${rr(60, 190, 740, 670, PD, '#ffffff', 3)}<defs><clipPath id="pdc"><rect x="63" y="270" width="734" height="587" rx="14"/></clipPath></defs>
      <g clip-path="url(#pdc)">${panel(63, 797, 270, RP.top, RP.top + 60, 857)}${receptor(RP.x, RP.top, 'tri', 'blue', RP.s)}</g>`),
    txt('What the DRUG does to the BODY', 430, 225, 26, PD, { align: 'center', bold: true }),
    txt('Target (receptor)', 560, 470, 21, DARK, { bold: true }),
    txt('Drug', 210, 300, 22, DRUG, { bold: true, at: 0 }),
    ...track([[0, 250, 360], [1.4, RP.x, RDOCK], [30, RP.x, RDOCK]], ([x, y]) => ligand('tri', x, y, 'amber', 1, RP.s), null, 0.3),
    { ...svgItem(contacts(RP.x, RP.top, 'tri', 4, RP.s) + `<rect x="${RP.x - 34}" y="${RP.top - 205}" width="68" height="30" rx="15" fill="#1f8a4c"/>${T(RP.x, RP.top - 183, 19, '#ffffff')('ON')}`), at: 1.8, duration: 0.3 },
    { type: 'pulse', x: RP.x, y: RP.top + 190, r: 40, color: '#3ccf6e', speed: 1.1, at: 2.0 },
    txt('Effect on the cell', RP.x + 180, RP.top + 200, 22, ENDO, { align: 'center', bold: true, at: 2.1, anim: 'fade', duration: 0.4 }),
    ...frameTrack([[0, 0], [2.4, 0], [6.0, 1], [30, 1]], ([u]) => pdGraph(u), 12),
    txt('More drug → more receptors bound → bigger effect,\nuntil every receptor is busy (the maximum).', PDG.x + PDG.w / 2, 800, 21, DARK, { align: 'center', bold: true, at: 6.0, anim: 'fade', duration: 0.4 }),
  ];
  const pkpdActions = [
    { id: 'both5', label: 'Side by side', group: 'pk', stay: true, drawn: false, items: [...tabBar('both5')] },
    { id: 'pk5', label: 'Pharmacokinetics (full view)', group: 'pk', stay: true, drawn: false, items: pkFull },
    { id: 'pd5', label: 'Pharmacodynamics (full view)', group: 'pk', stay: true, drawn: false, items: pdFull },
  ];

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'pharmacology-essentials',
    title: '💊 Pharmacology essentials',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: title.
      { script: `${Qs('What is this course?', 'What does part 1 cover?')}

Welcome to Pharmacology Essentials, the full course. We'll start with an introduction to pharmacology: what pharmacology is, what a drug is, endogenous vs exogenous substances, and the difference between pharmacokinetics and pharmacodynamics.`,
      say: 'Pharmacology essentials, part 1: an introduction to pharmacology.', clear: true, thumbnail: true, items: titleItems },
      // Slide 2: what is pharmacology?
      { script: Qs('What is pharmacology?', 'Where does the word come from?', 'What does pharmacology cover?', 'It works both ways: drug → body and body → drug'),
        say: 'Pharmacology is the study of drugs and how they interact with living things, in both directions.', clear: true, items: pharmItems },
      // Slide 3: what is a drug?
      { script: `${Qs('What is a drug?', 'What does a drug actually do? (chemical → interacts with the body → changes how it works)', 'Is every drug a medicine?')}
[click the boxes to build the definition step by step]`,
      say: 'A drug is any chemical that changes how the body works; medicines are drugs used to treat or prevent disease.', clear: true, actions: drugActions, items: drugItems },
      // Slide 4: endogenous vs exogenous.
      { script: `${Qs('What does endogenous mean?', 'What does exogenous mean?', 'Examples of each', 'Can an endogenous substance be a drug? (insulin, adrenaline)')}
[click the green side, then the orange side, then the key point]`,
      say: 'Endogenous substances are made by the body; exogenous ones come from outside, like most drugs.', clear: true, actions: endoExoActions, items: endoExoItems },
      // Slide 5: pharmacokinetics vs pharmacodynamics.
      { script: `${Qs('What is pharmacokinetics?', 'What is pharmacodynamics?', 'How do you tell them apart?', 'What are A-D-M-E?')}
[tabs: Side by side → Pharmacokinetics → Pharmacodynamics]`,
      say: 'Pharmacokinetics is what the body does to the drug; pharmacodynamics is what the drug does to the body.', clear: true, actions: pkpdActions, items: pkpdItems },
    ],
  });
})();
