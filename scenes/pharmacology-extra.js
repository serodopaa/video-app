// Pharmacology essentials: four slides added after the course was built (load LAST, after pharmacology-recap.js).
// They are spliced into the topic at their places:
//   drug names and classes + therapeutic effects / indications / contraindications → after "What is a drug?" (new 4, 5)
//   pharmacogenomics → after CYP450 (new 33);  special populations → after drug toxicity (new 44)
// A `renumber` entry moves the user's saved per-slide work on the later slides to their new numbers (once).
(() => {
  const A = window.WB_LIGAND_ART, P = window.WB_PHARM_ART, D = window.WB_PHARM_PD;
  const scene = (window.WB_SCENES || []).find((s) => s.id === 'pharmacology-essentials');
  if (!A || !P || !D || !scene || scene.steps.length !== 43) return;
  const { frameTrack, T, svgItem, txt, title, f1 } = A;
  const { box, rr, capsule, person, curve, badge } = P;
  const { INK, GREY, DARK, PK, PD, ENDO, EXO, DRUG } = P.COL;
  const { card, tabsOf, plot, axes } = D;
  const RED = '#c0392b', OK = '#1f8a4c', ORANGE = '#d0630b', PURPLE = '#7b3fd0', BLUE = '#2f6fde', TEAL = '#0b7a8a';
  const Qs = (...q) => '[QUESTIONS THIS SLIDE ANSWERS]\n' + q.map((x) => `[• ${x}]`).join('\n');
  const sol = (items) => items.map((it) => ({ ...it, solid: true }));
  const at = (items, t) => items.map((it) => ({ ...it, at: t }));
  const stage = () => svgItem(rr(60, 190, 940, 670, '#d9dce3', '#fbfcfe', 2));
  const cover = () => svgItem('<rect x="62" y="192" width="936" height="666" fill="#fbfcfe"/>', { solid: true });
  const polyline = (pts, c, w = 6, op = 1, dashArr = '') => (pts.length > 1 ? `<polyline points="${pts.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}" ${dashArr ? `stroke-dasharray="${dashArr}"` : ''}/>` : '');
  const bateman = (t, k, ka = 1.5) => (t <= 0 ? 0 : (ka / (ka - k)) * (Math.exp(-k * t) - Math.exp(-ka * t)));
  const sideCard = (c, head, body, size = 21) => sol(card(1030, 190, 510, 670, c, head, body, size));
  // a row: coloured label pill on the left, text to its right
  const row = (y, c, label, main, sub) => [
    { type: 'rect', x: 90, y, w: 880, h: 130, color: c, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
    { type: 'rect', x: 90, y, w: 220, h: 130, color: c, fill: c, fillOpacity: 1, width: 3, rough: false },
    txt(label, 200, y + 65, 21, '#ffffff', { align: 'center', bold: true }),
    txt(main, 340, y + 46, 26, c, { bold: true }),
    txt(sub, 340, y + 92, 17, GREY, { bold: true }),
  ];

  // ================================================================ drug names and classes (new slide 4)
  const NM = tabsOf([{ id: 'nm4', text: 'Three names', c: BLUE }, { id: 'cl4', text: 'Ways to classify', c: PURPLE }, { id: 'sx4', text: 'Name clues', c: ORANGE }], 170, 400);
  const namesItems = [
    title('Drug names and classes'),
    ...NM.bar(null),
    stage(),
    svgItem(capsule(530, 420, 2.0, -25)),
    txt('Every drug has several names,\nand belongs to groups (classes)', 530, 650, 26, DARK, { align: 'center', bold: true, hideDuring: ['nm4', 'cl4', 'sx4'] }),
    ...card(1030, 190, 510, 670, DARK, 'NAMES AND CLASSES', 'One drug, three names:\nCHEMICAL: its full chemistry\nGENERIC: its official name\nBRAND: a company\'s trade name\n\nDrugs are grouped into CLASSES\n(e.g. NSAIDs, beta-blockers), so\nwhat you learn about one drug\nmostly applies to the others.', 21),
    ...NM.hot,
  ];
  const namesActions = [
    { id: 'nm4', label: 'Three names', group: 'nm', stay: true, drawn: false, items: [
      cover(), ...sol(NM.bar('nm4')),
      txt('Example: ibuprofen', 530, 232, 24, DARK, { align: 'center', bold: true }),
      ...at(row(270, '#6b7280', 'CHEMICAL', '2-(4-isobutylphenyl)propanoic acid', 'describes the molecule; used by chemists'), 0),
      ...at(row(420, BLUE, 'GENERIC', 'ibuprofen', 'the official name, the same worldwide; used by doctors (lower case)'), 0.7),
      ...at(row(570, ORANGE, 'BRAND', 'Advil®, Nurofen®, Motrin®', 'a company\'s trade name (capital letter, ®); one drug, many brands'), 1.4),
      txt('A generic copy has the SAME active drug, dose and effect, just usually much cheaper.', 530, 775, 19, OK, { align: 'center', bold: true, at: 2.2, anim: 'fade', duration: 0.4 }),
      ...sideCard(BLUE, 'THREE NAMES', 'CHEMICAL: long and exact; rarely\nused outside chemistry.\n\nGENERIC: the one to learn. Used\nin medicine and textbooks.\n\nBRAND: chosen by the company\nthat sells it; there can be many.\n\nWhen a patent ends, other\ncompanies can make GENERIC\nversions of the same drug.'),
    ] },
    { id: 'cl4', label: 'Ways to classify', group: 'nm', stay: true, drawn: false, items: [
      cover(), ...sol(NM.bar('cl4')),
      svgItem(`${capsule(530, 300, 1.0, -25)}${T(530, 368, 22, DARK)('ibuprofen')}
        ${curve('M 470 380 C 380 420, 250 430, 230 470', PURPLE, 4)}${curve('M 530 385 L 530 470', PURPLE, 4)}${curve('M 590 380 C 680 420, 810 430, 830 470', PURPLE, 4)}`),
      ...[[230, 'By TARGET /\nMECHANISM', 'COX inhibitor\n(an NSAID)', 'what it does in the body'], [530, 'By what it\nTREATS', 'painkiller (analgesic),\nanti-inflammatory', 'its uses'], [830, 'By CHEMICAL\nSTRUCTURE', 'propionic acid\nderivative', 'its shape']]
        .flatMap(([x, h, main, sub], i) => at([
          { type: 'rect', x: x - 140, y: 480, w: 280, h: 300, color: PURPLE, fill: '#ffffff', fillOpacity: 1, width: 3, rough: false },
          txt(h, x, 525, 20, PURPLE, { align: 'center', bold: true }),
          txt(main, x, 640, 21, INK, { align: 'center', bold: true }),
          txt(sub, x, 745, 16, GREY, { align: 'center', bold: true }),
        ], 0.4 + i * 0.5)),
      ...sideCard(PURPLE, 'WAYS TO CLASSIFY', 'The same drug can sit in several\nclasses at once:\n\nBy TARGET / MECHANISM: the most\nuseful for pharmacology\n(e.g. beta-blocker, SSRI)\n\nBy what it TREATS\n(e.g. antidepressant, antibiotic)\n\nBy CHEMICAL STRUCTURE\n(e.g. benzodiazepine)'),
    ] },
    { id: 'sx4', label: 'Name clues', group: 'nm', stay: true, drawn: false, items: [
      cover(), ...sol(NM.bar('sx4')),
      txt('Generic names often END with a clue to the class', 530, 235, 23, DARK, { align: 'center', bold: true }),
      ...[['-olol', 'beta-blocker', 'atenolol, propranolol'], ['-pril', 'ACE inhibitor', 'ramipril, lisinopril'], ['-statin', 'statin (lowers cholesterol)', 'atorvastatin, simvastatin'],
        ['-prazole', 'proton pump inhibitor', 'omeprazole, lansoprazole'], ['-triptan', 'migraine (serotonin agonist)', 'sumatriptan'], ['-azepam', 'benzodiazepine', 'diazepam, lorazepam']]
        .flatMap(([sfx, cls, ex], i) => {
          const y = 280 + i * 92;
          return at([
            { type: 'rect', x: 100, y, w: 860, h: 78, color: '#e4e7ee', fill: i % 2 ? '#ffffff' : '#f7f8fb', fillOpacity: 1, width: 2, rough: false },
            txt(sfx, 130, y + 39, 26, ORANGE, { bold: true }),
            txt(cls, 330, y + 39, 21, INK, { bold: true }),
            txt(ex, 940, y + 39, 18, GREY, { align: 'right', bold: true }),
          ], 0.3 + i * 0.35);
        }),
      ...sideCard(ORANGE, 'NAME CLUES', 'Drugs in the same class often\nshare an ending (a "stem").\n\nSo a new name tells you a lot:\n"bisoprolol" → -olol →\na beta-blocker.\n\n(It\'s a handy rule, not a\nguarantee.)'),
    ] },
  ];

  // ================================================================ therapeutic effects, indications, contraindications (new slide 5)
  const IC = tabsOf([{ id: 'te5', text: 'Therapeutic effect', c: OK }, { id: 'ind5', text: 'Indications', c: BLUE }, { id: 'ci5', text: 'Contraindications', c: RED }], 170, 400);
  const tickRow = (y, ok, head, sub, c) => [
    svgItem(`<circle cx="140" cy="${y}" r="24" fill="${c}"/>${T(140, y + 9, 26, '#ffffff')(ok ? '✓' : '✕')}`),
    txt(head, 185, y - 8, 23, c, { bold: true }),
    txt(sub, 185, y + 22, 17, GREY, { bold: true }),
  ];
  const icItems = [
    title('Therapeutic effects, indications and contraindications'),
    ...IC.bar(null),
    stage(),
    svgItem(capsule(530, 420, 2.0, -25)),
    txt('When should a drug be used,\nand when should it NOT?', 530, 650, 26, DARK, { align: 'center', bold: true, hideDuring: ['te5', 'ind5', 'ci5'] }),
    ...card(1030, 190, 510, 670, DARK, 'THREE KEY WORDS', 'THERAPEUTIC EFFECT: the effect\nyou WANT from the drug\n\nINDICATION: a reason TO use it\n(what it\'s for)\n\nCONTRAINDICATION: a reason NOT\nto use it (the risk outweighs the\nbenefit)\n\nExample all the way through:\nibuprofen', 21),
    ...IC.hot,
  ];
  const icActions = [
    { id: 'te5', label: 'Therapeutic effect', group: 'ic', stay: true, drawn: false, items: [
      cover(), ...sol(IC.bar('te5')),
      svgItem(`${capsule(530, 280, 1.0, -25)}${T(530, 345, 21, DARK)('ibuprofen blocks COX')}
        ${curve('M 470 360 C 400 400, 300 410, 290 440', OK, 5)}${curve('M 590 360 C 660 400, 760 410, 770 440', ORANGE, 5)}`),
      ...at([
        { type: 'rect', x: 100, y: 455, w: 380, h: 330, color: OK, fill: '#eaf6ee', fillOpacity: 1, width: 3, rough: false },
        txt('THERAPEUTIC effects\n(wanted)', 290, 495, 21, OK, { align: 'center', bold: true }),
        txt('✓ less pain\n✓ less fever\n✓ less inflammation', 140, 620, 22, INK, { bold: true }),
      ], 0.4),
      ...at([
        { type: 'rect', x: 580, y: 455, w: 380, h: 330, color: ORANGE, fill: '#fdf1e6', fillOpacity: 1, width: 3, rough: false },
        txt('SIDE effects\n(unwanted)', 770, 495, 21, ORANGE, { align: 'center', bold: true }),
        txt('! stomach irritation\n! ulcers, bleeding\n! kidney strain', 620, 620, 22, INK, { bold: true }),
      ], 1.0),
      txt('Same action (blocking COX) causes both!', 530, 820, 20, DARK, { align: 'center', bold: true, at: 1.6, anim: 'fade', duration: 0.4 }),
      ...sideCard(OK, 'THERAPEUTIC EFFECT', 'The effect you WANT: the reason\nthe drug is given.\n\nSide effects come from the very\nsame action, in other parts of\nthe body (COX also protects the\nstomach and kidneys).\n\nPrescribing = weighing the\nbenefit against the harm.'),
    ] },
    { id: 'ind5', label: 'Indications', group: 'ic', stay: true, drawn: false, items: [
      cover(), ...sol(IC.bar('ind5')),
      txt('INDICATIONS for ibuprofen (reasons TO use it)', 530, 240, 23, BLUE, { align: 'center', bold: true }),
      ...[['Pain', 'headache, toothache, period pain, back pain'], ['Fever', 'e.g. with a cold or flu'], ['Inflammation', 'sprains, arthritis'], ['After an injury', 'swelling and pain together']]
        .flatMap(([h, sub], i) => at(tickRow(330 + i * 120, true, h, sub, BLUE), 0.3 + i * 0.4)),
      ...sideCard(BLUE, 'INDICATION', 'A condition or situation where\nthe drug SHOULD be used:\nwhat it\'s for.\n\nIndications come from evidence\n(trials against placebo).\n\nThey\'re listed on the patient\nleaflet as "what this medicine\nis used for".'),
    ] },
    { id: 'ci5', label: 'Contraindications', group: 'ic', stay: true, drawn: false, items: [
      cover(), ...sol(IC.bar('ci5')),
      txt('CONTRAINDICATIONS for ibuprofen (reasons NOT to use it)', 530, 240, 23, RED, { align: 'center', bold: true }),
      ...[['Stomach ulcer or bleeding', 'it makes ulcers worse'], ['Severe kidney or heart failure', 'it strains the kidneys and holds in fluid'], ['Late pregnancy (3rd trimester)', 'it can harm the baby\'s heart'], ['Allergy to NSAIDs', 'e.g. it has triggered asthma or a rash before']]
        .flatMap(([h, sub], i) => at(tickRow(330 + i * 120, false, h, sub, RED), 0.3 + i * 0.4)),
      txt('Caution (use carefully): asthma, older age, taking warfarin', 530, 815, 19, ORANGE, { align: 'center', bold: true, at: 2.0, anim: 'fade', duration: 0.4 }),
      ...sideCard(RED, 'CONTRAINDICATION', 'A situation where the drug should\nNOT be used, because the risk\noutweighs the benefit.\n\nABSOLUTE: never use it.\nRELATIVE (a caution): only with\ncare, if the benefit is worth it.\n\nOften linked to the drug\'s side\neffects, or to special\npopulations (part 4).'),
    ] },
  ];

  // ================================================================ pharmacogenomics (new slide 33)
  const GN = tabsOf([{ id: 'met33', text: 'Metabolism (CYP2D6)', c: PURPLE }, { id: 'tgt33', text: 'Target (warfarin)', c: BLUE }, { id: 'hla33', text: 'Allergy risk (HLA test)', c: RED }], 170, 400);
  const PPL = [210, 530, 850];
  const dna = (cx, cy, s = 1) => {
    let d1 = '', d2 = '', rungs = '';
    for (let i = 0; i <= 24; i++) {
      const y = cy - 90 * s + i * 7.5 * s, x1 = cx + Math.sin(i * 0.5) * 30 * s, x2 = cx - Math.sin(i * 0.5) * 30 * s;
      d1 += `${i ? 'L' : 'M'} ${f1(x1)} ${f1(y)} `; d2 += `${i ? 'L' : 'M'} ${f1(x2)} ${f1(y)} `;
      if (i % 2) rungs += `<line x1="${f1(x1)}" y1="${f1(y)}" x2="${f1(x2)}" y2="${f1(y)}" stroke="${['#e0606a', '#f0a12e', '#62b067', '#5c97e6'][i % 4]}" stroke-width="${3 * s}"/>`;
    }
    return `${rungs}<path d="${d1}" fill="none" stroke="${PURPLE}" stroke-width="${5 * s}"/><path d="${d2}" fill="none" stroke="${BLUE}" stroke-width="${5 * s}"/>`;
  };
  const three = (fills, labels, c) => PPL.map((x, i) => `${person(x, 400, 0.62, fills[i][0], fills[i][1])}${T(x, 300 - 30, 18, c)(labels[i])}`).join('');
  const barRow = (vals, cols, texts, label, y0 = 600) => PPL.map((x, i) => `${rr(x - 110, y0, 220, 26, '#c9ced8', '#eef0f4', 2, 13)}<rect x="${x - 110}" y="${y0}" width="${f1(220 * vals[i])}" height="26" rx="13" fill="${cols[i]}"/>
      ${T(x, y0 + 60, 18, cols[i])(texts[i])}`).join('') + T(100, y0 - 16, 17, GREY, 700, 'start')(label);
  const pgxItems = [
    title('Pharmacogenomics: genes and drug response'),
    ...GN.bar(null),
    stage(),
    svgItem(dna(530, 440, 1.6)),
    txt('Same drug, same dose…\ndifferent genes → different response', 530, 720, 26, DARK, { align: 'center', bold: true, hideDuring: ['met33', 'tgt33', 'hla33'] }),
    ...card(1030, 190, 510, 670, PURPLE, 'PHARMACOGENOMICS', 'How a person\'s GENES change the\nway they respond to a drug.\n\nGenes can change:\n• how fast a drug is broken down\n• how well its target responds\n• the risk of a serious reaction\n\nThe goal: the right drug at the\nright dose for THAT person,\nsometimes with a gene test first.', 21),
    ...GN.hot,
  ];
  const pgxActions = [
    { id: 'met33', label: 'Metabolism', group: 'pgx', stay: true, drawn: false, items: [
      cover(), ...sol(GN.bar('met33')),
      txt('Everyone takes the same dose of CODEINE (a prodrug: the liver\'s CYP2D6 turns it into morphine)', 530, 228, 17, DARK, { align: 'center', bold: true }),
      svgItem(three([['#eef0f4', '#9aa1ad'], ['#e3f4e8', '#6fa77f'], ['#fde3df', '#c0392b']], ['poor metaboliser', 'normal', 'ultra-rapid'], PURPLE)),
      ...frameTrack([[0, 0], [0.5, 0], [2.2, 1], [30, 1]], ([u]) => barRow([0.08 * u, 0.5 * u, 0.95 * u], ['#8a8f98', OK, RED], (u >= 1 ? ['little morphine', 'works as expected', 'TOO MUCH morphine'] : ['', '', '']), 'Morphine made from the same dose'), 12),
      ...[['no pain relief', '#8a8f98'], ['', OK], ['risk of slowed breathing', RED]].map(([t, c], i) => txt(t, PPL[i], 712, 16, c, { align: 'center', bold: true, at: 2.2, anim: 'fade', duration: 0.3 })),
      ...sideCard(PURPLE, 'GENES CHANGE METABOLISM', 'Genes decide which version of a\nCYP enzyme you have (slide 32).\n\nCodeine needs CYP2D6 to work:\n• poor metaboliser: barely works\n• ultra-rapid: too much morphine\n   → dangerous (why codeine is\n   avoided in children and when\n   breastfeeding)\n\nFix: a different drug or dose.'),
    ] },
    { id: 'tgt33', label: 'Target', group: 'pgx', stay: true, drawn: false, items: [
      cover(), ...sol(GN.bar('tgt33')),
      txt('Genes for warfarin\'s TARGET (VKORC1) make people more or less sensitive', 530, 228, 18, DARK, { align: 'center', bold: true }),
      svgItem(three([['#fde3df', '#c0392b'], ['#e3f4e8', '#6fa77f'], ['#e3ecfb', '#8aa3cc']], ['very sensitive', 'average', 'less sensitive'], BLUE)),
      ...frameTrack([[0, 0], [0.5, 0], [2.2, 1], [30, 1]], ([u]) => barRow([0.25 * u, 0.55 * u, 0.9 * u], [RED, OK, BLUE], u >= 1 ? ['low dose', 'usual dose', 'high dose'] : ['', '', ''], 'Daily warfarin dose needed for the same effect'), 12),
      ...sideCard(BLUE, 'GENES CHANGE THE TARGET', 'Genes can change the drug\'s\nTARGET, so the same level of\ndrug has a bigger or smaller\neffect.\n\ne.g. warfarin: some people need a\nfew times more than others for\nthe same blood-thinning effect.\n(Its breakdown enzyme, CYP2C9,\nalso varies.)\n\n→ doses are adjusted using\nblood tests.'),
    ] },
    { id: 'hla33', label: 'Allergy risk', group: 'pgx', stay: true, drawn: false, items: [
      cover(), ...sol(GN.bar('hla33')),
      txt('Before prescribing ABACAVIR (an HIV drug), test for the gene HLA-B*5701', 530, 228, 18, DARK, { align: 'center', bold: true }),
      svgItem(`${person(330, 420, 0.62, '#e3f4e8', '#6fa77f')}${person(730, 420, 0.62, '#fde3df', '#c0392b')}
        ${rr(220, 600, 220, 50, OK, '#eaf6ee', 3, 25)}${T(330, 632, 19, OK)('gene test: −')}${rr(620, 600, 220, 50, RED, '#fdecea', 3, 25)}${T(730, 632, 19, RED)('gene test: +')}`),
      ...at([txt('✓ safe to give', 330, 700, 22, OK, { align: 'center', bold: true }), txt('✕ DON\'T give:\nhigh risk of a severe,\nlife-threatening allergy', 730, 720, 20, RED, { align: 'center', bold: true })], 0.6),
      ...sideCard(RED, 'GENES CHANGE ALLERGY RISK', 'Some gene versions make a\nserious immune reaction (a type B\nADR, part 4) much more likely.\n\nTesting first prevents it:\n• HLA-B*5701 → avoid abacavir\n• HLA-B*1502 → avoid\n   carbamazepine (more common\n   in people of Asian ancestry)\n\nThis is pharmacogenomics in\neveryday practice.'),
    ] },
  ];

  // ================================================================ special populations (new slide 44)
  const SP = tabsOf([{ id: 'kid44', text: 'Children', c: ORANGE }, { id: 'old44', text: 'Older adults', c: PURPLE }, { id: 'preg44', text: 'Pregnancy & breastfeeding', c: '#c2566b' }, { id: 'organ44', text: 'Kidney & liver disease', c: BLUE }], 60, 355, 20);
  const GS = { x0: 520, x1: 950, y0: 290, y1: 640 };
  const pS = plot(GS);
  const doseLevel = (k, d = 0.55) => (t) => [0, 2.5, 5, 7.5].reduce((s, t0) => s + d * bateman(t - t0, k), 0);
  const ADULT = doseLevel(0.5), TM = 10, YM = 1.9;
  const levelGraph = (f, c, u = 1) => {
    const line = (g, cc, w, op, uu) => { const pts = []; for (let t = 0; t <= TM * uu + 1e-6; t += 0.06) pts.push([pS.x(t / TM), pS.y(Math.min(g(t), YM) / YM)]); return polyline(pts, cc, w, op); };
    return `${axes(GS, 'Time (regular doses) →', 'Drug level →', false)}
      <rect x="${GS.x0}" y="${f1(pS.y(1.25 / YM))}" width="${GS.x1 - GS.x0}" height="${f1(pS.y(0.55 / YM) - pS.y(1.25 / YM))}" fill="${OK}" opacity="0.1"/>
      ${T(GS.x1 - 6, pS.y(1.25 / YM) + 20, 15, '#1d6b3a', 700, 'end')('safe window')}
      ${line(ADULT, '#a9d6b8', 4, 1, 1)}${T(GS.x1 - 6, pS.y(0.5 / YM), 14, '#6fa77f', 700, 'end')('typical adult')}
      ${f ? line(f, c, 6, 1, u) : ''}`;
  };
  const spView = (id, c, fig, f, caption, head, body) => ({ id, label: { kid44: 'Children', old44: 'Older adults', preg44: 'Pregnancy & breastfeeding', organ44: 'Kidney & liver disease' }[id], group: 'sp', stay: true, drawn: false, items: [
    cover(), ...sol(SP.bar(id)),
    svgItem(fig),
    ...(f ? frameTrack([[0, 0], [2.4, 1], [30, 1]], ([u]) => levelGraph(f, c, u), 12) : []),
    ...(caption ? [txt(caption, 735, 760, 19, c, { align: 'center', bold: true, at: f ? 2.4 : 0.6, anim: 'fade', duration: 0.3 })] : []),
    ...sideCard(c, head, body, 20),
  ] });
  const spItems = [
    title('Special populations'),
    ...SP.bar(null),
    stage(),
    svgItem(`${person(200, 470, 0.5, '#fdeede', '#d0630b')}${person(380, 450, 0.8, '#efe6fa', '#7b3fd0')}${person(590, 450, 0.8, '#fbe3e8', '#c2566b')}<ellipse cx="590" cy="470" rx="46" ry="44" fill="#fbe3e8" stroke="#c2566b" stroke-width="3"/>${person(800, 450, 0.8, '#e3ecfb', '#8aa3cc')}`),
    txt('The same dose doesn\'t suit everyone', 530, 700, 26, DARK, { align: 'center', bold: true, hideDuring: ['kid44', 'old44', 'preg44', 'organ44'] }),
    ...card(1030, 190, 510, 670, DARK, 'SPECIAL POPULATIONS', 'Groups whose bodies handle drugs\ndifferently (PK) or respond\ndifferently (PD), so doses and\ndrug choices need extra care.\n\n• children\n• older adults\n• pregnancy and breastfeeding\n• kidney and liver disease\n\nIt pulls together ADME, clearance\nand toxicity from earlier.', 21),
    ...SP.hot,
  ];
  const spActions = [
    spView('kid44', ORANGE, `${person(260, 470, 0.7, '#fdeede', '#d0630b')}${T(260, 700, 18, ORANGE)('dose by WEIGHT (mg per kg)')}`,
      doseLevel(0.2), 'Newborns clear many drugs slowly → build-up',
      'CHILDREN', 'Not just "small adults".\n\n• Doses worked out by WEIGHT\n   (mg/kg) or body size\n• Newborns: liver and kidneys\n   not fully working yet → drugs\n   clear slowly and build up\n• Some drugs are avoided:\n   aspirin (Reye\'s syndrome),\n   codeine (ultra-rapid risk)\n• Liquids and correct measuring'),
    spView('old44', PURPLE, `${person(260, 470, 0.85, '#efe6fa', '#7b3fd0')}<line x1="330" y1="430" x2="345" y2="620" stroke="#6b4a2a" stroke-width="7" stroke-linecap="round"/>${T(260, 700, 18, PURPLE)('"start low, go slow"')}`,
      doseLevel(0.22), 'Slower kidneys and liver → higher, longer levels',
      'OLDER ADULTS', '• Kidneys and liver clear drugs\n   more slowly → levels build up\n• More fat, less water → fat-\n   soluble drugs linger\n• More SENSITIVE (e.g. sedatives\n   → confusion, falls)\n• Often on many medicines\n   (polypharmacy) → more\n   interactions\n\n→ "start low, go slow"'),
    spView('preg44', '#c2566b', `${person(300, 450, 0.9, '#fbe3e8', '#c2566b')}<ellipse cx="300" cy="475" rx="58" ry="54" fill="#fbe3e8" stroke="#c2566b" stroke-width="4"/>
        <circle cx="300" cy="478" r="22" fill="#f6c6cf" stroke="#9c2a45" stroke-width="3"/>${T(300, 562, 15, '#9c2a45')('baby')}
        ${curve('M 470 330 C 420 380, 370 420, 330 460', EXO, 5)}${capsule(500, 310, 0.5, -25)}${T(560, 380, 17, '#9c2a45', 700, 'start')('most drugs cross')}${T(560, 400, 17, '#9c2a45', 700, 'start')('the placenta')}
        ${rr(560, 460, 400, 280, '#e8bcc6', '#ffffff', 2, 14)}${T(585, 495, 18, '#9c2a45', 700, 'start')('Some drugs harm the baby:')}${T(585, 530, 17, INK, 700, 'start')('• valproate (epilepsy)')}${T(585, 560, 17, INK, 700, 'start')('• isotretinoin (acne)')}${T(585, 590, 17, INK, 700, 'start')('• warfarin')}${T(585, 620, 17, INK, 700, 'start')('• ACE inhibitors')}${T(585, 650, 17, INK, 700, 'start')('• NSAIDs late in pregnancy')}${T(585, 700, 16, GREY, 700, 'start')('Many drugs also pass into breast milk.')}`,
      null, null,
      'PREGNANCY & BREASTFEEDING', 'Most drugs CROSS the placenta\nand reach the baby (slide 30).\n\nDrugs that can harm the baby are\ncalled TERATOGENS; the first\n3 months are the riskiest.\n\nPregnancy also changes PK (more\nblood, faster kidneys).\n\nMany drugs pass into breast milk.\n→ only use what\'s needed, choose\n   drugs known to be safe'),
    spView('organ44', BLUE, `<ellipse cx="200" cy="420" rx="90" ry="55" fill="#b5654a" stroke="#6e3220" stroke-width="4"/>${T(200, 500, 18, '#6e3220')('liver: metabolism')}
        <path d="M 330 360 C 380 356 392 400 382 430 C 372 460 384 476 360 482 C 318 490 300 450 302 420 C 304 386 312 362 330 360 Z" fill="#a0525a" stroke="#5e262c" stroke-width="4"/>${T(345, 545, 18, '#5e262c')('kidneys: excretion')}
        ${T(270, 620, 18, BLUE)('either one failing →')}${T(270, 645, 18, BLUE)('the drug builds up')}`,
      doseLevel(0.08), 'Same doses, can\'t be cleared → into the toxic zone',
      'KIDNEY & LIVER DISEASE', 'KIDNEY disease: drugs removed in\nurine build up (e.g. gentamicin,\nlithium, digoxin).\n→ lower dose or longer gaps,\nbased on kidney function tests\n\nLIVER disease: less metabolism,\nless albumin (more free drug)\n(e.g. opioids, benzodiazepines).\n\nLinks: slides 36, 38 and 43.'),
  ];

  // ---------------------------------------------------------------- splice them in (latest positions first)
  const st = (o) => ({ clear: true, ...o });
  scene.steps.splice(40, 0, st({
    script: `${Qs('Who needs extra care with drugs?', 'Why do children, older adults, pregnancy and organ disease change dosing?')}\n[tabs: Children → Older adults → Pregnancy & breastfeeding → Kidney & liver disease]`,
    notes: `• Special populations = groups whose bodies handle drugs differently (PK) or respond differently (PD)
• Children: not small adults; doses by weight (mg/kg); newborns' liver and kidneys are immature → slow clearance; avoid aspirin (Reye's syndrome) and codeine
• Older adults: slower kidney and liver clearance → build-up; more fat; more sensitive (sedatives → confusion, falls); polypharmacy → interactions; "start low, go slow"
• Pregnancy: most drugs cross the placenta; teratogens (valproate, isotretinoin, warfarin, ACE inhibitors, NSAIDs late in pregnancy); first trimester riskiest; many drugs pass into breast milk
• Kidney disease: renally cleared drugs build up (gentamicin, lithium, digoxin) → lower doses / longer gaps based on kidney function
• Liver disease: less metabolism and less albumin → more free drug (opioids, benzodiazepines)`,
    say: 'Children, older adults, pregnant women and people with kidney or liver disease handle drugs differently, so doses need care.',
    actions: spActions, items: spItems,
  }));
  scene.steps.splice(30, 0, st({
    script: `${Qs('What is pharmacogenomics?', 'How can genes change drug metabolism, the target, and allergy risk?')}\n[tabs: Metabolism (CYP2D6) → Target (warfarin) → Allergy risk (HLA test)]`,
    notes: `• Pharmacogenomics = how a person's genes change their response to a drug
• Metabolism: CYP enzyme versions (links to the CYP450 slide); codeine needs CYP2D6 → poor metabolisers get no pain relief, ultra-rapid get too much morphine (dangerous; why codeine is avoided in children and breastfeeding)
• Target: genes for the drug's target change sensitivity, e.g. warfarin (VKORC1) → doses vary a lot between people → adjusted with blood tests
• Allergy risk: HLA-B*5701 → don't give abacavir; HLA-B*1502 → avoid carbamazepine (more common in people of Asian ancestry)
• Goal: the right drug at the right dose for that person, sometimes with a gene test first ("personalised medicine")`,
    say: 'Pharmacogenomics is how our genes change the way we respond to drugs: their breakdown, their target, and allergy risk.',
    actions: pgxActions, items: pgxItems,
  }));
  scene.steps.splice(3, 0, st({
    script: `${Qs('What names does a drug have?', 'How are drugs grouped into classes?', 'What clues do drug names give?')}\n[tabs: Three names → Ways to classify → Name clues]`,
    notes: `• Every drug has 3 kinds of name: chemical (exact chemistry), generic (official, use this one, lower case), brand (company trade name, capital letter, ®)
• Example: 2-(4-isobutylphenyl)propanoic acid = ibuprofen = Advil / Nurofen / Motrin
• Generic copies: same active drug, dose and effect; usually much cheaper (made once the patent ends)
• Classes group similar drugs: by target / mechanism (beta-blocker, SSRI), by what they treat (antidepressant, antibiotic), by chemical structure (benzodiazepine)
• What you learn about one drug in a class mostly applies to the others
• Name clues (stems): -olol beta-blocker, -pril ACE inhibitor, -statin, -prazole PPI, -triptan, -azepam benzodiazepine`,
    say: 'Drugs have chemical, generic and brand names, and are grouped into classes by target, use or structure.',
    actions: namesActions, items: namesItems,
  }), st({
    script: `${Qs('What is a therapeutic effect?', 'What is an indication?', 'What is a contraindication?')}\n[tabs: Therapeutic effect → Indications → Contraindications]`,
    notes: `• Therapeutic effect = the effect you WANT; side effects come from the same action elsewhere in the body (ibuprofen blocks COX → less pain, but stomach and kidney effects)
• Indication = a reason TO use a drug (what it's for): ibuprofen for pain, fever, inflammation
• Contraindication = a reason NOT to use it (risk outweighs benefit): ibuprofen with stomach ulcers / bleeding, severe kidney or heart failure, late pregnancy, NSAID allergy
• Absolute (never) vs relative / caution (only with care): asthma, older age, taking warfarin
• Prescribing = weighing benefit vs harm for each person`,
    say: 'A therapeutic effect is the wanted effect; indications are reasons to use a drug and contraindications are reasons not to.',
    actions: icActions, items: icItems,
  }));

  // saved per-slide work on later slides follows them (old numbers: 2 inserted before old 4, 1 before old 31, 1 before old 41)
  scene.renumber = [...(scene.renumber || []), { key: '2026-11-names-pgx-special', before: [4, 4, 31, 41] }];
})();
