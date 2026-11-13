// Pharmacology essentials: the course recap (last slide). Built with the user.
// Adds its slide to the end of the 'pharmacology-essentials' topic. Load it AFTER pharmacology-safety.js.
// The user does the drawing; these visuals simply appear (drawn: false). Board is 1600 x 900.
(() => {
  const A = window.WB_LIGAND_ART, P = window.WB_PHARM_ART, D = window.WB_PHARM_PD;
  const scene = (window.WB_SCENES || []).find((s) => s.id === 'pharmacology-essentials');
  if (!A || !P || !D || !scene) return;
  const { receptor, ligand, DOCK, T, svgItem, txt, title, f1 } = A;
  const { box, rr, capsule, curve, badge } = P;
  const { INK, GREY, DARK, PK, PD, ENDO } = P.COL;
  const { glow, tabsOf } = D;
  const C1 = DARK, C2 = PD, C3 = PK, C4 = '#c0392b';
  const Qs = (...q) => '[QUESTIONS THIS SLIDE ANSWERS]\n' + q.map((x) => `[• ${x}]`).join('\n');
  const at = (items, t) => items.map((it) => ({ ...it, at: t }));
  const cover = svgItem('<rect x="40" y="184" width="1520" height="690" fill="#fcfcfa"/>', { solid: true });
  // switching views: everything already on screen appears at once (no fade), so the old view never shows through
  const solid = (items) => items.map((it) => ({ ...it, solid: true }));

  // ---------- the slide's tabs ----------
  const RC = tabsOf([{ id: 'big40', text: 'The big picture', c: DARK }, { id: 'follow40', text: 'Follow one drug: ibuprofen', c: C3 }, { id: 'take40', text: 'Key takeaways', c: C4 }], 170, 400);

  // ---------- base view: the four parts of the course ----------
  const PARTS = [
    ['PART 1', 'Foundations', C1, 'slides 1–7', 'What is pharmacology?\nWhat is a drug?\nDrug names and classes\nIndications, contraindications\nEndogenous vs exogenous\nPK vs PD'],
    ['PART 2', 'Pharmacodynamics', C2, 'slides 8–23', 'Drug targets\nReceptors and binding\nReceptor types\nAffinity, specificity, selectivity\nAgonists and antagonists\nAllosteric modulators\nEnzymes, transporters,\nion channels\nDose–response curves\nPotency vs efficacy\nTherapeutic index\nReceptor regulation\nThe placebo effect'],
    ['PART 3', 'Pharmacokinetics', C3, 'slides 24–40', 'Routes of administration\nAbsorption, bioavailability\nDistribution, protein binding\nBrain and placenta\nMetabolism, CYP450\nPharmacogenomics\nProdrugs, induction / inhibition\nExcretion\nDrug levels over time\nHalf-life and clearance\nFirst- vs zero-order\nSteady state, loading doses'],
    ['PART 4', 'Drug safety', C4, 'slides 41–46', 'Adverse drug reactions\nDrug toxicity\nSpecial populations\nDrug–drug interactions\nTolerance and dependence'],
  ];
  const baseItems = PARTS.flatMap(([p, t, c, sl, list], i) => {
    const x = 60 + i * 375, w = 355;
    return [
      box(x, 190, w, 670, c),
      { type: 'rect', x, y: 190, w, h: 92, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
      txt(p, x + w / 2, 218, 18, '#ffffff', { align: 'center', bold: true }),
      txt(t, x + w / 2, 254, 26, '#ffffff', { align: 'center', bold: true }),
      txt(sl, x + w / 2, 312, 16, GREY, { align: 'center', bold: true }),
      txt(list, x + 26, 360, 18, INK, { bold: true }),
    ];
  });

  // ---------- tab 1: the big picture (dose → level → effect → benefit vs harm) ----------
  const NX = [215, 605, 995, 1385], NY = 300;
  const scale = (cx, cy) => `<line x1="${cx}" y1="${cy + 40}" x2="${cx}" y2="${cy - 30}" stroke="${DARK}" stroke-width="5"/><path d="M ${cx - 26} ${cy + 44} L ${cx + 26} ${cy + 44} L ${cx} ${cy + 30} Z" fill="${DARK}"/>
    <line x1="${cx - 70}" y1="${cy - 20}" x2="${cx + 70}" y2="${cy - 40}" stroke="${DARK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${cx - 96} ${cy + 6} Q ${cx - 70} ${cy + 26} ${cx - 44} ${cy + 6} Z" fill="#bfe3c1" stroke="${ENDO}" stroke-width="3"/><line x1="${cx - 70}" y1="${cy - 20}" x2="${cx - 90}" y2="${cy + 6}" stroke="${DARK}" stroke-width="2"/><line x1="${cx - 70}" y1="${cy - 20}" x2="${cx - 50}" y2="${cy + 6}" stroke="${DARK}" stroke-width="2"/>
    <path d="M ${cx + 44} ${cy - 14} Q ${cx + 70} ${cy + 6} ${cx + 96} ${cy - 14} Z" fill="#f6b9b0" stroke="${C4}" stroke-width="3"/><line x1="${cx + 70}" y1="${cy - 40}" x2="${cx + 50}" y2="${cy - 14}" stroke="${DARK}" stroke-width="2"/><line x1="${cx + 70}" y1="${cy - 40}" x2="${cx + 90}" y2="${cy - 14}" stroke="${DARK}" stroke-width="2"/>
    ${T(cx - 70, cy + 2, 16, ENDO)('✓')}${T(cx + 70, cy - 18, 16, C4)('!')}`;
  const levelIcon = (cx, cy) => {
    const pts = []; for (let t = 0; t <= 8; t += 0.2) pts.push(`${f1(cx - 70 + t * 17)},${f1(cy + 40 - (1.5 / 1.15) * (Math.exp(-0.35 * t) - Math.exp(-1.5 * t)) * 120)}`);
    return `<line x1="${cx - 70}" y1="${cy + 42}" x2="${cx + 72}" y2="${cy + 42}" stroke="${DARK}" stroke-width="3"/><line x1="${cx - 70}" y1="${cy + 42}" x2="${cx - 70}" y2="${cy - 46}" stroke="${DARK}" stroke-width="3"/><polyline points="${pts.join(' ')}" fill="none" stroke="${C3}" stroke-width="5"/>`;
  };
  const effectIcon = (cx, cy) => receptor(cx, cy + 56, 'tri', 'blue', 0.62) + ligand('tri', cx, cy + 56 + DOCK.tri * 0.62, 'amber', 1, 0.62) + glow(cx, cy + 56, 0.62);
  const NODES = [
    ['DOSE', C1, (cx, cy) => capsule(cx, cy, 1, -25), 'Part 1', 'What a drug is\nHow it\'s given (route)\nHow much, how often'],
    ['DRUG LEVEL', C3, levelIcon, 'Part 3 · PK', 'ADME, bioavailability\nprotein binding, CYP450\nhalf-life, steady state'],
    ['EFFECT', C2, effectIcon, 'Part 2 · PD', 'Targets and receptors\nagonists, antagonists\ndose–response, efficacy'],
    ['BENEFIT vs HARM', C4, scale, 'Part 4 · Safety', 'Therapeutic index\nside effects, toxicity\ninteractions, tolerance'],
  ];
  const bigItems = [
    cover,
    ...NODES.flatMap(([head, c, icon, part, list], i) => at([
      { type: 'rect', x: NX[i] - 150, y: NY - 105, w: 300, h: 260, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
      svgItem(icon(NX[i], NY - 10)),
      txt(head, NX[i], NY + 125, 24, c, { align: 'center', bold: true }),
      { type: 'rect', x: NX[i] - 150, y: NY + 175, w: 300, h: 210, color: c, fill: c, fillOpacity: 0.07, width: 2, rough: false },
      txt(part, NX[i], NY + 205, 17, c, { align: 'center', bold: true }),
      txt(list, NX[i], NY + 250, 18, INK, { align: 'center', bold: true }),
    ], i * 0.9)),
    ...[['PK', C3], ['PD', C2], ['safety', C4]].flatMap(([l, c], i) => at([
      svgItem(curve(`M ${NX[i] + 158} ${NY + 25} L ${NX[i + 1] - 162} ${NY + 25}`, c, 6)),
      txt(l, (NX[i] + NX[i + 1]) / 2, NY - 6, 18, c, { align: 'center', bold: true }),
    ], i * 0.9 + 0.5)),
    ...at([
      { type: 'rect', x: 90, y: 715, w: 1420, h: 120, color: DARK, fill: '#f4f6fa', fillOpacity: 1, width: 3, rough: false },
      txt('Dose  →  drug level  →  effect  →  benefit vs harm', 800, 752, 30, DARK, { align: 'center', bold: true }),
      txt('PK decides the level, PD turns the level into an effect, and safety asks whether it\'s worth it.', 800, 800, 20, GREY, { align: 'center', bold: true }),
    ], 3.4),
  ];

  // ---------- tab 2: follow one drug (ibuprofen) from start to finish ----------
  const STEPS = [
    ['Swallowed', C3, 'PK · route', 'Taken by mouth\n(oral = enteral).\nIt\'s absorbed in the\nsmall intestine.'],
    ['Absorbed', C3, 'PK · absorption', 'Small and fat-soluble\nenough to cross easily.\nMost of it reaches the\nblood (high bioavailability).'],
    ['Carried', C3, 'PK · distribution', '~99% stuck to albumin\nin the blood. Only the\nFREE part works.\n(Careful with warfarin!)'],
    ['Hits its target', C2, 'PD · target', 'Blocks the COX ENZYME\n(not a receptor), so less\nprostaglandin is made.'],
    ['The effect', C2, 'PD · dose–response', 'Less pain, fever and\ninflammation. More drug\n→ more effect, up to a\nmaximum.'],
    ['Broken down', C3, 'PK · metabolism', 'In the liver by a CYP450\nenzyme (CYP2C9) into\ninactive metabolites.'],
    ['Removed', C3, 'PK · excretion', 'Out in the urine.\nHalf-life ~2 hours,\nso it\'s taken every\n4–6 hours.'],
    ['The risks', C4, 'Safety', 'Type A ADRs: stomach\nirritation, ulcers, kidney\nstrain. Interactions:\nwarfarin, lithium.'],
  ];
  const TX = (i) => 60 + (i % 4) * 375, TY = (i) => 195 + Math.floor(i / 4) * 335, TW = 355, TH = 320;
  const tileEmpty = (i) => [
    { type: 'rect', x: TX(i), y: TY(i), w: TW, h: TH, color: '#c9ced8', fill: '#f7f8fa', fillOpacity: 1, width: 2.5, dashed: true, rough: false },
    svgItem(badge(TX(i) + 40, TY(i) + 40, String(i + 1), '#9aa1ad')),
    txt(STEPS[i][0], TX(i) + 74, TY(i) + 40, 22, '#9aa1ad', { bold: true }),
    txt('click', TX(i) + TW / 2, TY(i) + 190, 18, '#b4bac4', { align: 'center', bold: true }),
  ];
  const tileFull = (i) => {
    const [head, c, tag, body] = STEPS[i];
    return [
      { type: 'rect', x: TX(i), y: TY(i), w: TW, h: TH, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
      svgItem(badge(TX(i) + 40, TY(i) + 40, String(i + 1), c)),
      txt(head, TX(i) + 74, TY(i) + 40, 23, c, { bold: true }),
      txt(tag, TX(i) + 26, TY(i) + 92, 16, GREY, { bold: true }),
      txt(body, TX(i) + 26, TY(i) + 150, 19, INK, { bold: true }),
    ];
  };
  const flowArrows = svgItem([0, 1, 2, 4, 5, 6].map((i) => `<path d="M ${TX(i) + TW + 3} ${TY(i) + TH / 2} l 13 0" stroke="#9aa1ad" stroke-width="4"/>`).join('')
    + `<path d="M ${TX(3) + TW / 2} ${TY(3) + TH + 2} C ${TX(3) + TW / 2} ${TY(3) + TH + 14}, ${TX(0) + TW / 2} ${TY(3) + TH + 2}, ${TX(0) + TW / 2} ${TY(4) - 2}" fill="none" stroke="#d3d7de" stroke-width="3" stroke-dasharray="6 6"/>`);
  const followView = (k) => [
    ...solid([cover, flowArrows, ...Array.from({ length: 8 }, (_, i) => (i < k - 1 ? tileFull(i) : i === k - 1 ? [] : tileEmpty(i))).flat()]),
    ...(k ? at(tileFull(k - 1), 0.05) : []),
  ];

  // ---------- tab 3: key takeaways ----------
  const TAKE = [
    [C1, 'A drug is any chemical that changes how the body works, and the DOSE makes the poison.'],
    [C2, 'Drugs act on targets (receptors, enzymes, transporters, ion channels): agonists switch receptors on, antagonists block them.'],
    [C2, 'More drug → more effect, up to a maximum. Potency = how much you need; efficacy = how big the effect can get.'],
    [C3, 'ADME decides how much drug reaches its target, and for how long.'],
    [C3, 'Half-life sets how often you dose; steady state takes ~4–5 half-lives (a loading dose gets there faster).'],
    [C4, 'Side effects, toxicity, interactions and tolerance happen when the level, the target or the person changes.'],
  ];
  const wrap = (t, n) => { const out = []; let line = ''; for (const w of t.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; } out.push(line.trim()); return out.join('\n'); };
  const takeItems = [
    cover,
    ...TAKE.flatMap(([c, t], i) => {
      const x = 60 + (i % 2) * 750, y = 200 + Math.floor(i / 2) * 170;
      return at([
        { type: 'rect', x, y, w: 730, h: 152, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
        svgItem(badge(x + 44, y + 76, String(i + 1), c)),
        txt(wrap(t, 46), x + 90, y + 52, 21, INK, { bold: true }),
      ], i * 0.7);
    }),
    ...at([
      { type: 'rect', x: 60, y: 715, w: 1480, h: 135, color: C4, fill: '#fdf3f1', fillOpacity: 1, width: 3, rough: false },
      txt('Every drug is a balance between BENEFIT and HARM:', 800, 758, 28, C4, { align: 'center', bold: true }),
      txt('the right drug, at the right dose, for the right person.', 800, 806, 26, DARK, { align: 'center', bold: true }),
    ], 4.4),
  ];

  const recapItems = [
    title('Course recap: putting it all together'),
    ...RC.bar(null),
    ...baseItems,
    ...RC.hot,
    ...Array.from({ length: 8 }, (_, i) => ({ type: 'hotspot', x: TX(i), y: TY(i), w: TW, h: TH, action: `ib${i + 1}` })),
  ];
  const recapActions = [
    { id: 'big40', label: 'The big picture', group: 'rc', stay: true, drawn: false, items: [...bigItems, ...solid(RC.bar('big40'))] },
    { id: 'follow40', label: 'Follow one drug', group: 'rc', stay: true, drawn: false, items: [...followView(0), ...solid(RC.bar('follow40'))] },
    { id: 'take40', label: 'Key takeaways', group: 'rc', stay: true, drawn: false, items: [...takeItems, ...solid(RC.bar('take40'))] },
    ...STEPS.map((st, i) => ({ id: `ib${i + 1}`, label: `Ibuprofen ${i + 1}: ${st[0]}`, group: 'rc', stay: true, drawn: false, items: [...followView(i + 1), ...solid(RC.bar('follow40'))] })),
  ];

  scene.steps.push(
    // Slide 47: course recap.
    { script: `${Qs('What did the whole course cover?', 'How do PK, PD and safety fit together?', 'What are the key takeaways?')}
[tabs: The big picture → Follow one drug (click the tiles 1–8) → Key takeaways]`,
      notes: `• Start with the 4 parts on screen: foundations → pharmacodynamics → pharmacokinetics → drug safety
• The big picture: DOSE → DRUG LEVEL → EFFECT → BENEFIT vs HARM
• PK (part 3) decides the level at the target; PD (part 2) turns that level into an effect; safety (part 4) asks whether it's worth it
• Follow one drug (ibuprofen) to tie everything together:
• 1 swallowed (oral) → 2 absorbed (high bioavailability) → 3 carried (~99% bound to albumin)
• 4 blocks the COX enzyme (an enzyme target, not a receptor) → 5 less pain, fever, inflammation (dose–response)
• 6 broken down in the liver (CYP2C9) → 7 removed in the urine (half-life ~2 h → every 4–6 h)
• 8 risks: stomach irritation / ulcers, kidney strain (type A); interactions with warfarin and lithium
• Key takeaways: the 6 big ideas on screen
• Closing message: every drug is a balance between benefit and harm: the right drug, at the right dose, for the right person
• Thank viewers; point to what comes next (e.g. drug classes, specific body systems)`,
      say: 'Pharmacology in one line: the dose sets the level, the level drives the effect, and every drug balances benefit against harm.', clear: true, actions: recapActions, items: recapItems },
  );

  // Part 2 was reordered (drug targets first, receptor types after receptors and binding): app.js moves the
  // user's saved drawings / notes / prompter text for those slides to their new numbers once. Must come after
  // the insert entry added by pharmacology-safety.js (entries apply in order).
  scene.renumber = [...(scene.renumber || []), { key: '2026-11-targets-first', move: { 7: 8, 8: 10, 9: 11, 10: 12, 11: 13, 12: 14, 13: 15, 14: 16, 15: 7, 16: 9 } }];
  // Three slides were inserted after slide 13 (enzymes, transporters, ion channels): move saved work on 14+ by 3.
  scene.renumber = [...scene.renumber, { key: '2026-11-enzyme-transporter-channel', before: [14, 14, 14] }];
})();
