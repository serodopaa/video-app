// Explainer: Pharmacology essentials | full course. Part 1: introduction to pharmacology. Built with the user.
// Uses the receptor / ligand artwork from affinity-specificity.js (window.WB_LIGAND_ART), so load that first.
// The user does the drawing; these visuals simply appear (drawn: false). Board is 1600 x 900.
(() => {
  const A = window.WB_LIGAND_ART;
  if (!A) return;
  const { panel, receptor, ligand, contacts, DOCK, track, frameTrack, svgItem, title, f1 } = A;
  // labels and visual text: small sizes made a bit bigger so they're easy to read
  const bump = (s) => (s < 22 ? Math.round(s * 1.18) : s);
  const T = (x, y, s, ...r) => A.T(x, y, bump(s), ...r);
  const txt = (t, x, y, s, ...r) => A.txt(t, x, y, bump(s), ...r);
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

  // little pictures for the four topic cards (centred on cx, cy; about 200 x 90)
  const miniArrow = (d, c) => { const id = `ma${gid++}`; return arrowHead(id, c) + `<path d="${d}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" marker-end="url(#${id})"/>`; };
  const cardArt = [
    // 1. pharmacology: drug ⇄ body
    (cx, cy) => capsule(cx - 62, cy + 4, 0.55, -30) + person(cx + 66, cy + 10, 0.24)
      + miniArrow(`M ${cx - 30} ${cy - 22} Q ${cx + 4} ${cy - 46} ${cx + 34} ${cy - 24}`, PD)
      + miniArrow(`M ${cx + 34} ${cy + 30} Q ${cx + 2} ${cy + 52} ${cx - 30} ${cy + 32}`, PK),
    // 2. drug: a capsule and a molecule
    (cx, cy) => capsule(cx - 50, cy, 0.62, -30) + molecule(cx + 55, cy, 0.62),
    // 3. endogenous vs exogenous: made inside (green) vs a pill coming in from outside (orange)
    (cx, cy) => person(cx - 50, cy + 10, 0.24, '#e3f4e8', '#6fa77f') + `<circle cx="${cx - 50}" cy="${cy + 2}" r="7" fill="${ENDO}"/><circle cx="${cx - 50}" cy="${cy + 2}" r="13" fill="none" stroke="${ENDO}" stroke-width="2" opacity="0.5"/>`
      + T(cx, cy + 12, 22, GREY)('vs') + person(cx + 60, cy + 10, 0.24, '#fbeee2', '#c9935c') + capsule(cx + 22, cy - 26, 0.32, -30)
      + miniArrow(`M ${cx + 34} ${cy - 18} L ${cx + 52} ${cy - 4}`, EXO),
    // 4. PK vs PD: the drug-level curve and the dose-response S-curve
    (cx, cy) => {
      const g = (x0, c, f) => {
        const pts = []; for (let k = 0; k <= 40; k++) pts.push(`${f1(x0 + k * 2)},${f1(cy + 34 - f(k / 40) * 64)}`);
        return `<line x1="${x0}" y1="${cy + 36}" x2="${x0 + 84}" y2="${cy + 36}" stroke="${DARK}" stroke-width="2.5"/><line x1="${x0}" y1="${cy + 36}" x2="${x0}" y2="${cy - 36}" stroke="${DARK}" stroke-width="2.5"/>`
          + `<polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`;
      };
      return g(cx - 98, PK, (u) => 1.62 * (Math.exp(-3.4 * u) - Math.exp(-19 * u)) / 1)
        + g(cx + 14, PD, (u) => 1 / (1 + Math.exp(-(u - 0.5) * 12)));
    },
  ];

  // =================================================================== slide 1: title
  // the four parts of the course
  const RED1 = '#c0392b';
  const TOPICS = [['1', 'Introduction', DARK, 'the basics'], ['2', 'Pharmacodynamics', PD, 'what the drug does\nto the body'],
    ['3', 'Pharmacokinetics', PK, 'what the body does\nto the drug'], ['4', 'Drug safety', RED1, 'when drugs\ncause harm']];
  const warnIcon = (cx, cy) => `<polygon points="${cx},${cy - 42} ${cx + 48},${cy + 38} ${cx - 48},${cy + 38}" fill="${RED1}" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/><rect x="${cx - 5}" y="${cy - 16}" width="10" height="32" rx="4" fill="#ffffff"/><circle cx="${cx}" cy="${cy + 27}" r="6" fill="#ffffff"/>`;
  const partArt = [
    (cx, cy) => cardArt[0](cx, cy),
    (cx, cy) => receptor(cx, cy + 26, 'tri', 'blue', 0.42) + ligand('tri', cx, cy + 26 + DOCK.tri * 0.42, 'amber', 1, 0.42),
    (cx, cy) => {
      const pts = []; for (let k = 0; k <= 30; k++) { const t = k / 3; pts.push(`${(cx + 2 + t * 8).toFixed(1)},${(cy + 34 - 1.62 * (Math.exp(-0.28 * t) - Math.exp(-1.6 * t)) * 66).toFixed(1)}`); }
      return person(cx - 52, cy + 8, 0.28) + [[-60, -4], [-46, 14], [-54, 28]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="5" fill="${EXO}"/>`).join('')
        + `<line x1="${cx}" y1="${cy + 36}" x2="${cx + 86}" y2="${cy + 36}" stroke="${DARK}" stroke-width="2.5"/><line x1="${cx}" y1="${cy + 36}" x2="${cx}" y2="${cy - 36}" stroke="${DARK}" stroke-width="2.5"/>`
        + `<polyline points="${pts.join(' ')}" fill="none" stroke="${PK}" stroke-width="4" stroke-linejoin="round"/>`;
    },
    (cx, cy) => warnIcon(cx, cy),
  ];
  const titleItems = [
    svgItem(`<rect x="0" y="0" width="1600" height="900" fill="#f4f7fc"/>
      <circle cx="1410" cy="170" r="230" fill="#e3ecfb"/><circle cx="170" cy="760" r="190" fill="#f9e6e4"/>
      ${capsule(1330, 250, 2.1, -32)}${molecule(1180, 430, 1.25)}${capsule(1480, 470, 1.2, 25)}`),
    txt('PHARMACOLOGY', 110, 215, 104, INK, { bold: true }),
    txt('ESSENTIALS', 110, 330, 104, DRUG, { bold: true }),
    box(110, 395, 270, 64, INK, INK, { fillOpacity: 1 }), txt('FULL COURSE', 245, 428, 30, '#ffffff', { align: 'center', bold: true }),
    txt('4 parts · from the basics to drug safety', 410, 428, 30, GREY, { bold: true }),
    ...TOPICS.flatMap(([n, t, c], i) => {
      const x = 110 + i * 350;
      return [box(x, 515, 320, 285, c), svgItem(badge(x + 38, 553, n, c) + partArt[i](x + 160, 610)),
        txt(t, x + 160, 700, 27, c, { align: 'center', bold: true }),
        txt(TOPICS[i][3], x + 160, 745, 19, GREY, { align: 'center', bold: true })];
    }),
  ];

  // =================================================================== slide 2: what is pharmacology?
  const P2 = { drug: [925, 470], body: [1370, 520] };
  // the drug ⇄ body picture (drawn at 800..1540 × 120..860, shrunk into the bottom-left box)
  const P2S = 0.64, P2X = 60 + (700 - 740 * P2S) / 2, P2Y = 378;
  const COVERS = [['How drugs work in the body', PD], ['How the body handles drugs', PK], ['What drugs are used for', ENDO, 'the symptoms and conditions they treat'],
    ['Side effects and toxicity', DRUG], ['How much to give (dosing)', EXO]];
  const CY = (i) => 254 + i * 74, SAFE = '#1f8a4c', DISC = '#0b7a8a';
  const pharmItems = [
    title('What is pharmacology?'),
    box(60, 120, 700, 230, DARK, '#f4f6fa'),
    txt('PHARMACOLOGY', 410, 165, 34, DARK, { align: 'center', bold: true }),
    txt('The study of how DRUGS interact with\nliving organisms, and how the BODY\ninteracts with the drug.', 410, 228, 27, INK, { align: 'center', bold: true }),
    // the two-way picture: drug ↔ body (bottom left)
    svgItem(`${rr(60, 370, 700, 490, '#d9dce3', '#fbfcfe', 2)}
      <g transform="translate(${P2X - 800 * P2S} ${P2Y - 120 * P2S}) scale(${P2S})">
      ${capsule(...P2.drug, 1.5, -30)}${person(...P2.body, 1.2)}
      ${T(P2.drug[0], 590, 38, DRUG)('DRUG')}${T(P2.body[0], 790, 38, '#2c5a92')('BODY')}
      ${curve('M 950 385 C 1030 220, 1180 220, 1260 320', PD, 8)}
      ${curve('M 1260 640 C 1170 760, 1020 760, 950 600', PK, 8)}
      ${T(1100, 225, 36, PD)('the drug acts on the body')}${T(1000, 830, 36, PK)('the body acts on the drug')}
      ${T(1170, 168, 38, DARK)('It works BOTH ways')}</g>`),
    // what it covers (right side, the focus)
    box(800, 120, 740, 740, DARK, '#ffffff'),
    txt('Pharmacology covers…', 840, 175, 34, DARK, { bold: true }),
    // 1–5: what you need to give drugs safely
    svgItem(`${rr(822, 212, 696, 452, SAFE, '#f1f9f3', 2.5, 14)}
      <path d="M 846 ${CY(3)} H 834 V ${CY(4)} H 846" fill="none" stroke="${DARK}" stroke-width="3"/>`),
    ...COVERS.flatMap(([t, c, sub], i) => [
      svgItem(`<circle cx="864" cy="${CY(i)}" r="15" fill="${c}"/>`),
      txt(t, 898, CY(i) - (sub ? 8 : 0), 29, INK, { bold: true }),
      ...(sub ? [txt(sub, 898, CY(i) + 24, 18, GREY, { bold: true })] : []),
    ]),
    txt('↳ side effects depend on the dose', 898, CY(4) + 34, 17, GREY, { bold: true }),
    txt('→ all needed to give drugs to people SAFELY', 1170, 634, 22, SAFE, { align: 'center', bold: true }),
    // 6: discovering and creating new drugs
    svgItem(`${rr(822, 684, 696, 156, DISC, '#eaf5f6', 2.5, 14)}<circle cx="864" cy="728" r="15" fill="${DISC}"/>
      ${molecule(1440, 770, 0.5, DISC)}`),
    txt('Drug discovery and development', 898, 728, 29, INK, { bold: true }),
    txt('finding and creating new drugs:\nalmost endless possible molecules', 898, 784, 19, DISC, { bold: true }),
  ];

  // =================================================================== slide 3: what is a drug?
  // Definition on top, then 4 tabs that follow the script: what drugs do → natural or lab-made → medicine vs drug → not always good
  const OK3 = '#1f8a4c', BAD3 = '#c0392b', NAT = '#2e7d32', LAB = '#2f6fde';
  const DT = [{ id: 'do3', text: 'What drugs do', c: PD }, { id: 'src3', text: 'Natural or lab-made?', c: NAT }, { id: 'med3', text: 'Medicine vs drug', c: LAB }, { id: 'bad3', text: 'Not always good', c: BAD3 }];
  const DTX = (i) => 60 + i * 375, DTW = 355;
  const dTabs = (active) => DT.flatMap((t, i) => [
    { type: 'rect', x: DTX(i), y: 250, w: DTW, h: 58, color: t.c, fill: t.id === active ? t.c : '#ffffff', fillOpacity: 1, width: 3, rough: false, solid: true },
    { ...txt(t.text, DTX(i) + DTW / 2, 279, 24, t.id === active ? '#ffffff' : t.c, { align: 'center', bold: true }), solid: true },
  ]);
  const AREA = { x: 60, y: 328, w: 1480, h: 532 };
  const cover3 = () => svgItem(`<rect x="${AREA.x}" y="${AREA.y}" width="${AREA.w}" height="${AREA.h}" rx="16" fill="#fbfcfe" stroke="#d9dce3" stroke-width="2"/>`, { solid: true });
  // tab 1: three effects, each a before → after bar
  const EFF = [['❤️', 'Heart rate', 'a stimulant speeds it up', 0.45, 0.85, '▲'], ['🤕', 'Pain', 'ibuprofen reduces how much you feel', 0.8, 0.3, '▼'], ['⚡', 'Alertness', 'caffeine makes you more alert', 0.35, 0.8, '▲']];
  const effBars = (u) => EFF.map(([icon, name, sub, a, b, arr], i) => {
    const y = 400 + i * 140, v = a + (b - a) * u, c = b > a ? BAD3 : OK3;
    return `${T(120, y + 14, 44, INK)(icon)}${T(175, y, 30, INK, 700, 'start')(name)}${T(175, y + 36, 20, GREY, 700, 'start')(sub)}
      ${rr(700, y - 18, 600, 40, '#c9ced8', '#eef0f4', 2, 20)}<rect x="700" y="${y - 18}" width="${(600 * v).toFixed(1)}" height="40" rx="20" fill="${u > 0 ? c : '#9aa1ad'}"/>
      ${u >= 1 ? T(1345, y + 14, 40, c)(arr) : ''}`;
  }).join('');
  // tab 2: where drugs come from
  const poppy = (cx, cy) => `<path d="M ${cx} ${cy + 20} C ${cx + 6} ${cy + 70}, ${cx - 6} ${cy + 110}, ${cx} ${cy + 150}" stroke="#4f8a3a" stroke-width="7" fill="none"/>
    ${[[-30, -6], [30, -6], [0, -34], [0, 22]].map(([dx, dy]) => `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="34" ry="28" fill="#e0402f" stroke="#a52a1c" stroke-width="3"/>`).join('')}<circle cx="${cx}" cy="${cy - 4}" r="16" fill="#2b2b2b"/>`;
  const mold = (cx, cy) => `<ellipse cx="${cx}" cy="${cy}" rx="80" ry="36" fill="#eef6fb" stroke="#8aa3cc" stroke-width="4"/>
    ${[[-30, -6, 16], [10, 4, 20], [36, -10, 12], [-6, -14, 10]].map(([dx, dy, r]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}" fill="#6fae5a" opacity="0.85"/>`).join('')}`;
  const flask = (cx, cy) => `<path d="M ${cx - 16} ${cy - 60} L ${cx - 16} ${cy - 10} L ${cx - 56} ${cy + 50} Q ${cx - 62} ${cy + 66} ${cx - 44} ${cy + 66} L ${cx + 44} ${cy + 66} Q ${cx + 62} ${cy + 66} ${cx + 56} ${cy + 50} L ${cx + 16} ${cy - 10} L ${cx + 16} ${cy - 60} Z" fill="#e6f0fb" stroke="${LAB}" stroke-width="4"/>
    <path d="M ${cx - 40} ${cy + 30} L ${cx + 40} ${cy + 30} L ${cx + 52} ${cy + 54} Q ${cx + 54} ${cy + 62} ${cx + 44} ${cy + 62} L ${cx - 44} ${cy + 62} Q ${cx - 54} ${cy + 62} ${cx - 52} ${cy + 54} Z" fill="#7fb2f0"/>`;
  const srcItems = [
    svgItem(`${rr(90, 350, 860, 400, NAT, '#f1f8ef', 3)}${rr(980, 350, 530, 400, LAB, '#eef4fd', 3)}
      ${T(520, 392, 28, NAT)('From NATURE')}${T(1245, 392, 28, LAB)('Made in a LAB')}
      ${poppy(270, 520)}${T(270, 712, 22, INK)('poppy → MORPHINE')}${T(270, 738, 17, GREY)('(painkiller)')}
      ${mold(730, 560)}${T(730, 712, 22, INK)('mould → PENICILLIN')}${T(730, 738, 17, GREY)('(antibiotic)')}
      ${flask(1245, 540)}${T(1245, 680, 22, INK)('e.g. ibuprofen,')}${T(1245, 708, 22, INK)('most modern medicines')}`, { solid: true }),
    txt('Where it comes from doesn\'t matter: if it changes the body, it\'s a drug.', 800, 805, 26, DARK, { align: 'center', bold: true, at: 0.6, anim: 'fade', duration: 0.4 }),
  ];
  // tab 3: medicines are a smaller circle inside drugs
  const medItems = [
    svgItem(`<ellipse cx="560" cy="580" rx="470" ry="222" fill="#eef4fd" stroke="${LAB}" stroke-width="4"/>
      <ellipse cx="420" cy="610" rx="245" ry="165" fill="#e8f6ec" stroke="${OK3}" stroke-width="4"/>
      ${T(560, 385, 30, LAB)('DRUGS')}${T(420, 498, 28, OK3)('MEDICINES')}
      ${T(420, 545, 18, GREY)('used to prevent, diagnose')}${T(420, 567, 18, GREY)('or treat disease')}
      ${['ibuprofen', 'insulin', 'antibiotics'].map((t, i) => T(420, 625 + i * 40, 23, INK)(t)).join('')}
      ${['caffeine', 'nicotine'].map((t, i) => T(830, 520 + i * 44, 23, INK)(t)).join('')}
      ${rr(745, 615, 170, 50, BAD3, '#fdecea', 3, 25)}${T(830, 648, 24, BAD3)('alcohol')}`, { solid: true }),
    { type: 'pulse', x: 830, y: 640, r: 50, color: '#e0606a', speed: 1.4, at: 0.8 },
    { type: 'rect', x: 1060, y: 360, w: 450, h: 470, color: BAD3, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false, at: 1.0 },
    txt('Is alcohol a medicine?', 1285, 400, 26, BAD3, { align: 'center', bold: true, at: 1.0 }),
    txt('✓ Sometimes used as a\n   painkiller or a disinfectant\n\n✗ A Saturday night drink isn\'t\n   treating a disease\n\n→ a DRUG, but usually\n   not a medicine', 1090, 470, 22, INK, { bold: true, at: 1.0 }),
    txt('Every medicine is a drug, but not every drug is a medicine.', 560, 832, 23, DARK, { align: 'center', bold: true, at: 1.4, anim: 'fade', duration: 0.4 }),
  ];
  // tab 4: wanted vs unwanted effects
  const badItems = [
    svgItem(`${capsule(800, 400, 1.0, -25)}${T(800, 465, 22, DARK)('the same drug changes the body in more than one way')}
      ${curve('M 740 480 C 640 500, 520 510, 480 540', OK3, 5)}${curve('M 860 480 C 960 500, 1080 510, 1120 540', BAD3, 5)}`, { solid: true }),
    { type: 'rect', x: 140, y: 555, w: 620, h: 210, color: OK3, fill: '#eaf6ee', fillOpacity: 1, width: 3, rough: false, at: 0.3 },
    txt('WANTED effects', 450, 590, 26, OK3, { align: 'center', bold: true, at: 0.3 }),
    txt('ibuprofen: ✓ less pain\nalcohol: ✓ feel relaxed', 180, 655, 24, INK, { bold: true, at: 0.3 }),
    { type: 'rect', x: 840, y: 555, w: 620, h: 210, color: BAD3, fill: '#fdecea', fillOpacity: 1, width: 3, rough: false, at: 0.9 },
    txt('UNWANTED = SIDE EFFECTS', 1150, 590, 26, BAD3, { align: 'center', bold: true, at: 0.9 }),
    txt('ibuprofen: ✗ stomach irritation\nalcohol: ✗ slower reactions,\n   hangover', 880, 655, 24, INK, { bold: true, at: 0.9 }),
    txt('A drug doesn\'t have to treat a disease, or only do good things.', 800, 812, 25, DARK, { align: 'center', bold: true, at: 1.5, anim: 'fade', duration: 0.4 }),
  ];
  const drugItems = [
    title('What is a drug?'),
    box(60, 112, 1480, 118, DRUG, '#fdf1f0'),
    txt('DRUG', 120, 171, 44, DRUG, { bold: true }),
    txt('A chemical substance that changes the way the body\nis STRUCTURED or the way it FUNCTIONS.', 300, 153, 30, INK, { bold: true }),
    ...dTabs(null),
    cover3(),
    svgItem(`${capsule(640, 560, 1.6, -25)}${molecule(900, 560, 1.3)}`),
    txt('Click a tab above ↑', 800, 760, 24, '#9aa1ad', { align: 'center', bold: true, hideDuring: DT.map((t) => t.id) }),
    ...DT.map((t, i) => ({ type: 'hotspot', x: DTX(i), y: 250, w: DTW, h: 58, action: t.id })),
  ];
  const drugActions = [
    { id: 'do3', label: 'What drugs do', group: 'dr3', stay: true, drawn: false, items: [...dTabs('do3'), cover3(),
      ...frameTrack([[0, 0], [0.4, 0], [2.4, 1], [30, 1]], ([u]) => effBars(u), 12),
      txt('before → after taking the drug', 1000, 360, 18, GREY, { align: 'center', bold: true }),
      txt('It can change how the body WORKS (function) or how it\'s BUILT (structure).', 800, 820, 23, DARK, { align: 'center', bold: true, at: 2.4, anim: 'fade', duration: 0.4 })] },
    { id: 'src3', label: 'Natural or lab-made?', group: 'dr3', stay: true, drawn: false, items: [...dTabs('src3'), cover3(), ...srcItems] },
    { id: 'med3', label: 'Medicine vs drug', group: 'dr3', stay: true, drawn: false, items: [...dTabs('med3'), cover3(), ...medItems] },
    { id: 'bad3', label: 'Not always good', group: 'dr3', stay: true, drawn: false, items: [...dTabs('bad3'), cover3(), ...badItems] },
  ];

  // =================================================================== slide 6: endogenous vs exogenous
  // Tabs follow the script: the basics (adrenaline vs caffeine) → the same chemical can be either → why it matters (adenosine vs caffeine)
  const C4 = { endo: 60, exo: 820, w: 720, y: 180, h: 680 };
  const endoP = [C4.endo + 200, 500], exoP = [C4.exo + 200, 500];
  const colHead = (x, c, head, sub, def) => [
    box(x, C4.y, C4.w, C4.h, c, '#ffffff'),
    { type: 'rect', x, y: C4.y, w: C4.w, h: 86, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
    txt(head, x + C4.w / 2, C4.y + 34, 36, '#ffffff', { align: 'center', bold: true }),
    txt(sub, x + C4.w / 2, C4.y + 68, 20, '#ffffff', { align: 'center', bold: true }),
    txt(def, x + 400, C4.y + 150, 25, c, { bold: true }),
  ];
  const exList = (x, c, lines) => lines.flatMap(([h, b], i) => [
    svgItem(`<circle cx="${x + 412}" cy="${C4.y + 265 + i * 110}" r="9" fill="${c}"/>`),
    txt(h, x + 432, C4.y + 265 + i * 110, 25, INK, { bold: true }),
    txt(b, x + 432, C4.y + 299 + i * 110, 17, GREY, { bold: true }),
  ]);
  // inside the body: a gland that releases molecules
  const ENDO_SRC = [endoP[0] + 4, endoP[1] - 40];
  const endoPaths = [[[0, 0], [-20, -80], [-4, -140]], [[0, 0], [60, -50], [62, 70]], [[0, 0], [-62, -40], [-80, 60]], [[0, 0], [16, 110], [-28, 200]]]
    .map((p) => p.map(([dx, dy]) => [ENDO_SRC[0] + dx, ENDO_SRC[1] + dy]));
  const cup = (cx, cy, s = 1) => `<g transform="translate(${cx} ${cy}) scale(${s})"><path d="M -34 -28 H 34 L 28 34 Q 26 42 18 42 H -18 Q -26 42 -28 34 Z" fill="#ffffff" stroke="#6b4a2a" stroke-width="4"/><path d="M 34 -14 q 22 0 18 18 q -3 14 -22 12" fill="none" stroke="#6b4a2a" stroke-width="4"/><rect x="-30" y="-24" width="60" height="10" fill="#6b4a2a" opacity="0.8"/>
    <path d="M -10 -40 q -8 -10 0 -20 M 8 -40 q -8 -10 0 -20" stroke="#9aa1ad" stroke-width="3" fill="none"/></g>`;
  const EX6 = { x0: 60, x1: 1540 };
  const T6 = [{ id: 'basic6', text: 'Made inside vs outside', c: DARK }, { id: 'same6', text: 'Same chemical, either way', c: PD }, { id: 'why6', text: 'Why it matters', c: PK }];
  const T6X = (i) => 170 + i * 430, T6W = 400;
  const tabs6 = (active) => T6.flatMap((t, i) => [
    { type: 'rect', x: T6X(i), y: 110, w: T6W, h: 54, color: t.c, fill: t.id === active ? t.c : '#ffffff', fillOpacity: 1, width: 3, rough: false, solid: true },
    { ...txt(t.text, T6X(i) + T6W / 2, 137, 22, t.id === active ? '#ffffff' : t.c, { align: 'center', bold: true }), solid: true },
  ]);
  const cover6 = () => svgItem(`<rect x="54" y="174" width="1492" height="692" fill="#fbfcfe"/><rect x="60" y="180" width="1480" height="680" rx="16" fill="#fbfcfe" stroke="#d9dce3" stroke-width="2"/>`, { solid: true });
  const endoExoItems = [
    title('Endogenous vs exogenous'),
    ...tabs6(null),
    ...colHead(C4.endo, ENDO, 'ENDOGENOUS', 'endo = within · -genous = produced', 'Made INSIDE\nyour body'),
    ...colHead(C4.exo, EXO, 'EXOGENOUS', 'exo = outside · -genous = produced', 'Comes from\nOUTSIDE your body'),
    svgItem(person(...endoP, 1.1, '#e3f4e8', '#6fa77f') + `<ellipse cx="${ENDO_SRC[0]}" cy="${ENDO_SRC[1]}" rx="30" ry="20" fill="#9fd9ae" stroke="${ENDO}" stroke-width="3"/>`),
    svgItem(person(...exoP, 1.1, '#fbeee2', '#c9935c') + cup(exoP[0] - 130, 300, 0.9)),
    txt('made INSIDE the body', endoP[0], C4.y + C4.h - 30, 21, ENDO, { align: 'center', bold: true }),
    txt('comes from OUTSIDE', exoP[0], C4.y + C4.h - 30, 21, EXO, { align: 'center', bold: true }),
    ...exList(C4.endo, ENDO, [['Adrenaline', 'from your adrenal glands'], ['Adenosine', 'makes you sleepy'], ['Hormones', 'insulin, cortisol']]),
    ...exList(C4.exo, EXO, [['Caffeine', 'coffee, tea'], ['Most medicines', 'ibuprofen, antibiotics'], ['Alcohol, nicotine', 'drinks, cigarettes']]),
    { type: 'hotspot', x: C4.endo, y: C4.y + 90, w: C4.w, h: C4.h - 90, action: 'e4' },
    { type: 'hotspot', x: C4.exo, y: C4.y + 90, w: C4.w, h: C4.h - 90, action: 'x4' },
    ...T6.map((t, i) => ({ type: 'hotspot', x: T6X(i), y: 110, w: T6W, h: 54, action: t.id })),
  ];
  // tab 2: adrenaline made by the body vs given with an EpiPen
  const adren = (cx, cy, s = 1) => `<g transform="translate(${cx} ${cy}) scale(${s})"><polygon points="-26,-22 26,-22 34,8 0,30 -34,8" fill="#f6c45a" stroke="#a8640a" stroke-width="4"/>${A.T(0, 8, 16, '#7a4a08')('A')}</g>`;
  const epipen = (cx, cy) => `<g transform="translate(${cx} ${cy}) rotate(-35)"><rect x="-80" y="-16" width="150" height="32" rx="14" fill="#f6c45a" stroke="#a8640a" stroke-width="4"/><rect x="70" y="-12" width="26" height="24" rx="6" fill="${EXO}"/><rect x="-80" y="-16" width="40" height="32" rx="10" fill="#2f6fde"/>${A.T(5, 7, 15, '#7a4a08')('EpiPen')}</g>`;
  const sameItems = [
    cover6(),
    svgItem(`${rr(90, 210, 600, 560, ENDO, '#f1f9f3', 3)}${rr(910, 210, 600, 560, EXO, '#fdf4ec', 3)}
      ${person(330, 470, 0.95, '#e3f4e8', '#6fa77f')}<ellipse cx="312" cy="470" rx="18" ry="12" fill="#9fd9ae" stroke="${ENDO}" stroke-width="3"/><ellipse cx="350" cy="470" rx="18" ry="12" fill="#9fd9ae" stroke="${ENDO}" stroke-width="3"/>
      ${A.T(480, 480, 18, ENDO, 700, 'start')('adrenal glands')}
      ${person(1150, 470, 0.95, '#fbeee2', '#c9935c')}${epipen(1290, 560)}
      ${A.T(390, 250, 26, ENDO)('Your body makes it')}${A.T(1210, 250, 26, EXO)('Given with an EpiPen')}
      ${A.T(390, 730, 30, ENDO)('ENDOGENOUS')}${A.T(1210, 730, 30, EXO)('EXOGENOUS')}
      ${adren(800, 400, 1.6)}${A.T(800, 480, 24, DARK)('adrenaline')}${A.T(800, 515, 20, GREY)('the SAME chemical')}
      ${curve('M 720 400 L 640 400', DARK, 4)}${curve('M 880 400 L 960 400', DARK, 4)}`, { solid: true }),
    ...[0, 1, 2].map((k) => ({ type: 'mover', path: [[330, 470], [300 + k * 30, 380 - k * 20], [260 + k * 50, 330]], r: 10, color: '#f0a12e', count: 1, speed: 1.8 + k * 0.3 })),
    { type: 'mover', path: [[1255, 585], [1200, 560], [1160, 520]], r: 10, color: '#f0a12e', count: 1, speed: 1.6 },
    txt('What matters is HOW the chemical got into your body.', 800, 818, 30, PD, { align: 'center', bold: true, at: 0.8, anim: 'fade', duration: 0.4 }),
  ];
  // tab 3: adenosine (endogenous) vs caffeine (exogenous) at the adenosine receptor
  const R6 = { x: 400, top: 650, s: 1.2 };
  const R6D = R6.top + DOCK.tri * R6.s;
  const caff = (cx, cy, s = 1) => `<g transform="translate(${cx} ${cy}) scale(${s})"><rect x="-38" y="-52" width="76" height="28" rx="7" fill="#6b4a2a" stroke="#3b2814" stroke-width="4"/><polygon points="-31,-26 31,-26 0,27" fill="#a77b52" stroke="#3b2814" stroke-width="4" stroke-linejoin="round"/></g>`;
  const tagAt = (x, y, t, c) => `<rect x="${x - 110}" y="${y - 22}" width="220" height="36" rx="18" fill="#ffffff" stroke="${c}" stroke-width="2.5"/>${A.T(x, y + 3, 18, c)(t)}`;
  const meter6 = (v) => {
    const x = 870, y = 220, w = 150, h = 610, ih = h - 110, fh = ih * v, c = v > 0.5 ? '#7b3fd0' : '#e8890c';
    return `${rr(x, y, w, h, '#d9dce3', '#ffffff', 2, 16)}${A.T(x + w / 2, y + 36, 22, INK)('Sleepiness')}
      ${rr(x + w / 2 - 32, y + 60, 64, ih, '#c9ced8', '#eef0f4', 2, 12)}<rect x="${x + w / 2 - 32}" y="${(y + 60 + ih - fh).toFixed(1)}" width="64" height="${fh.toFixed(1)}" rx="12" fill="${c}"/>
      ${A.T(x + w / 2, y + h - 20, 22, c)(v > 0.5 ? '😴 sleepy' : '⚡ alert')}`;
  };
  const whyBase = `${rr(80, 200, 770, 640, '#d9dce3', '#ffffff', 2)}<defs><clipPath id="w6"><rect x="82" y="202" width="766" height="636" rx="14"/></clipPath></defs>
    <g clip-path="url(#w6)">${panel(82, 848, 202, R6.top, R6.top + 56, 838)}${receptor(R6.x, R6.top, 'tri', 'blue', R6.s)}</g>
    ${A.T(R6.x + 100, R6.top - 30, 20, '#2c5a92', 700, 'start')('adenosine receptor')}`;
  const whyItems = [
    cover6(),
    svgItem(whyBase, { solid: true }),
    // 1. adenosine binds → sleepy
    ...track([[0, 170, 300], [1.2, R6.x, R6D], [3.6, R6.x, R6D], [4.4, 180, 330], [5.6, 180, 330], [6.6, R6.x + 10, R6.top - 131 * R6.s - 60], [7.2, R6.x + 10, R6.top - 131 * R6.s - 60], [8.0, 180, 330], [30, 180, 330]],
      ([x, y]) => ligand('tri', x, y, 'amber', 1, R6.s) + tagAt(x, y - 92, 'adenosine (endogenous)', '#a8640a')),
    { ...svgItem(contacts(R6.x, R6.top, 'tri', 4, R6.s) + `<rect x="${R6.x - 110}" y="${R6.top - 172}" width="220" height="176" rx="44" fill="none" stroke="#3ccf6e" stroke-width="10" opacity="0.55"/>`), at: 1.3, duration: 0.2, until: 2.3 },
    // 2. caffeine takes the spot and blocks it → alert
    ...track([[0, 700, 380], [4.2, 700, 380], [5.2, R6.x, R6D], [30, R6.x, R6D]], ([x, y]) => caff(x, y, R6.s) + tagAt(x, y - 104, 'caffeine (exogenous)', '#6b4a2a')),
    ...frameTrack([[0, 0.15], [1.3, 0.15], [2.8, 0.85], [5.2, 0.85], [6.8, 0.2], [30, 0.2]], ([v]) => meter6(v), 12),
    txt('adenosine binds → you feel sleepy', 465, 795, 21, '#7b3fd0', { align: 'center', bold: true, at: 1.6, until: 2.6, anim: 'fade', duration: 0.3 }),
    txt('caffeine blocks the receptor →\nadenosine can\'t bind → more alert', 465, 780, 21, '#b0521c', { align: 'center', bold: true, at: 6.0, anim: 'fade', duration: 0.3 }),
    { type: 'rect', x: 1050, y: 200, w: 470, h: 640, color: PK, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false, solid: true },
    { type: 'rect', x: 1050, y: 200, w: 470, h: 58, color: PK, fill: PK, fillOpacity: 1, width: 3, rough: false, solid: true },
    { ...txt('WHY IT MATTERS', 1285, 229, 25, '#ffffff', { align: 'center', bold: true }), solid: true },
    { ...txt('The body is built to work with\nits OWN (endogenous) chemicals.\n\nMany drugs look similar to them,\nso they can act on the same\nreceptors, in similar but\ndifferent ways.\n\nCaffeine "hijacks" the receptor\nmade for adenosine.', 1075, 300, 22, INK, { bold: true }), solid: true },
  ];
  const endoExoActions = [
    { id: 'basic6', label: 'Made inside vs outside', group: 'ee6', stay: true, drawn: false, items: [...tabs6('basic6')] },
    { id: 'same6', label: 'Same chemical, either way', group: 'ee6', stay: true, drawn: false, items: [...tabs6('same6'), ...sameItems] },
    { id: 'why6', label: 'Why it matters', group: 'ee6', stay: true, drawn: false, items: [...tabs6('why6'), ...whyItems] },
    { id: 'e4', label: 'Endogenous: made inside', hidden: true, stay: true, drawn: false,
      items: [
        { type: 'pulse', x: ENDO_SRC[0], y: ENDO_SRC[1], r: 34, color: '#3ccf6e', speed: 1.2 },
        ...endoPaths.map((path, i) => ({ type: 'mover', path, r: 9, color: ENDO, count: 2, speed: 2.2 + i * 0.3, smooth: true })),
      ] },
    { id: 'x4', label: 'Exogenous: from outside', hidden: true, stay: true, drawn: false,
      items: [
        { type: 'mover', path: [[exoP[0] - 130, 300], [exoP[0] - 60, 320], [exoP[0], exoP[1] - 130], [exoP[0], exoP[1] - 60], [exoP[0] + 10, exoP[1] + 20]], r: 11, color: '#6b4a2a', count: 1, speed: 3.2, smooth: true },
        { type: 'pulse', x: exoP[0] + 10, y: exoP[1] + 20, r: 30, color: '#f0a050', speed: 1.4 },
      ] },
  ];

  // =================================================================== slide 7: pharmacokinetics vs pharmacodynamics
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

  // shared with the later parts of the course (pharmacology-pd.js)
  window.WB_PHARM_ART = { box, rr, capsule, molecule, person, arrowHead, curve, dot, badge, COL: { INK, GREY, DARK, PK, PD, ENDO, EXO, DRUG } };

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'pharmacology-essentials',
    title: '💊 Pharmacology essentials',
    audio: false,
    drawn: false,
    steps: [
      // Slide 1: title.
      { chapter: 'Introduction to pharmacology', script: `${Qs('What is this course?', 'What does part 1 cover?')}`,
        notes: `• Welcome: Pharmacology Essentials, the full course
• Part 1 = introduction to pharmacology
• Preview the 4 topics: what pharmacology is, what a drug is, endogenous vs exogenous, PK vs PD`,
      say: 'Pharmacology essentials, part 1: an introduction to pharmacology.', clear: true, thumbnail: true, items: titleItems },
      // Slide 2: what is pharmacology?
      { script: `${Qs('What is pharmacology?', 'Where does the word come from?', 'What does pharmacology cover?', 'It works both ways: drug → body and body → drug')}`,
        notes: `• Definition: the study of drugs and how they interact with living things
• Word origin: pharmakon (Greek) = drug / medicine / poison + -logy = study of
• Poison link: almost any drug becomes harmful at a high enough dose
• What it covers: how drugs work, how the body handles them, what they're used for (symptoms / conditions), side effects and toxicity (linked to dosing): all needed to give drugs safely
• Also: discovering and creating new drugs (an almost endless number of possible molecules)
• It works BOTH ways: drug → body and body → drug (sets up PK vs PD later)`,
        say: 'Pharmacology is the study of drugs and how they interact with living things, in both directions.', clear: true, items: pharmItems },
      // Slide 3: what is a drug?
      { script: `${Qs('What is a drug?', 'Are drugs always made in a lab?', 'Is every drug a medicine?', 'Do drugs always do good things?')}
[tabs: What drugs do → Natural or lab-made? → Medicine vs drug → Not always good]`,
        notes: `• Definition: a chemical substance that changes the way the body is structured or functions
• Examples: something that speeds up your heart rate; ibuprofen reducing pain; caffeine making you more alert
• Misconception: drugs aren't always synthetic / lab-made; natural drugs: morphine (poppy), penicillin (mould)
• Where it comes from doesn't matter: if it changes the body, it's a drug
• Every medicine is a drug, but not every drug is a medicine (medicine = used to prevent, diagnose or treat disease)
• Alcohol: sometimes a painkiller or disinfectant, but a Saturday night drink isn't treating a disease
• A drug doesn't have to treat a disease or only do good: that's why side effects happen`,
      say: 'A drug is any chemical that changes how the body is built or works, whether natural or lab-made, helpful or not.', clear: true, actions: drugActions, items: drugItems },
      // Slide 6: endogenous vs exogenous.
      { script: `${Qs('What do endogenous and exogenous mean?', 'Can the same chemical be both?', 'Why does it matter for drugs? (adenosine vs caffeine)')}
[tabs: Made inside vs outside (click each side) → Same chemical, either way → Why it matters]`,
        notes: `• Endogenous = the chemical was made INSIDE your body (e.g. your body making its own adrenaline)
• Exogenous = it came from OUTSIDE your body (e.g. caffeine)
• The same chemical can be either: adrenaline your body makes = endogenous; adrenaline from an EpiPen = exogenous
• What matters is HOW the chemical got into your body
• Why it matters: the body is built to work with endogenous chemicals; many drugs are similar to them and act in similar but different ways
• Adenosine (endogenous) binds adenosine receptors → you feel sleepy
• Caffeine (exogenous) blocks those receptors → adenosine can't bind → you feel less sleepy: it hijacks a receptor built for adenosine`,
      say: 'Endogenous chemicals are made by the body, exogenous ones come from outside, and drugs often mimic or block the body\u2019s own.', clear: true, actions: endoExoActions, items: endoExoItems },
      // Slide 7: pharmacokinetics vs pharmacodynamics.
      { script: `${Qs('What is pharmacokinetics?', 'What is pharmacodynamics?', 'How do you tell them apart?', 'What are A-D-M-E?')}
[tabs: Side by side → Pharmacokinetics → Pharmacodynamics]`,
        notes: `• PK = what the BODY does to the drug (kinetics = movement)
• ADME: absorption, distribution, metabolism (mostly liver), excretion (mostly kidneys)
• Drug level in the blood rises (A + D) then falls (M + E)
• PK decides how fast a drug works, how high the level gets, how long it lasts
• PD = what the DRUG does to the body (dynamis = power)
• Drug binds its target → effect; dose–response: more drug → bigger effect up to a maximum
• Link back to "it works both ways" from slide 2`,
      say: 'Pharmacokinetics is what the body does to the drug; pharmacodynamics is what the drug does to the body.', clear: true, actions: pkpdActions, items: pkpdItems },
    ],
  });
})();
