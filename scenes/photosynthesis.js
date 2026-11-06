// Explainer: photosynthesis.
// Board is 1600 x 900. See CLAUDE.md for every item type.
(window.WB_SCENES = window.WB_SCENES || []).push({
  id: 'photosynthesis',
  title: '🌱 Photosynthesis',
  steps: [
    {
      say: 'Plants make their own food. This is called photosynthesis.',
      items: [
        { type: 'text', x: 800, y: 80, text: 'Photosynthesis', size: 80, bold: true, align: 'center', color: 'green' },
        { type: 'path', points: [[560, 130], [700, 140], [900, 125], [1040, 135]], color: 'green', width: 6 },
      ],
    },
    {
      say: 'Here is our plant, growing in the soil.',
      items: [
        { type: 'line', from: [450, 780], to: [1150, 780], color: 'ink', width: 5 },
        { type: 'path', points: [[800, 780], [790, 650], [805, 520], [800, 420]], color: 'green', width: 8 },
        { type: 'path', closed: true, points: [[798, 560], [700, 500], [640, 520], [700, 575]], color: 'green', fill: 'green', fillOpacity: 0.45 },
        { type: 'path', closed: true, points: [[802, 470], [900, 400], [970, 420], [900, 490]], color: 'green', fill: 'green', fillOpacity: 0.45 },
        { type: 'path', points: [[800, 780], [760, 830], [720, 850]], color: 'orange', width: 4, duration: 0.5 },
        { type: 'path', points: [[800, 780], [830, 835], [880, 855]], color: 'orange', width: 4, duration: 0.5, with: true },
      ],
    },
    {
      say: 'The leaves soak up energy from sunlight.',
      items: [
        { type: 'icon', x: 200, y: 200, char: '☀️', size: 150 },
        { type: 'pulse', x: 200, y: 200, r: 110, color: 'yellow', with: true },
        { type: 'arrow', from: [300, 260], to: [640, 470], color: 'orange', width: 6, bend: -30 },
        { type: 'text', x: 360, y: 420, text: 'Light energy', size: 44, color: 'orange' },
      ],
    },
    {
      say: 'They take in carbon dioxide from the air, and water from the soil through the roots.',
      items: [
        { type: 'arrow', from: [220, 560], to: [630, 545], color: 'gray', width: 6 },
        { type: 'text', x: 230, y: 610, text: 'CO₂ from the air', size: 44, color: 'gray' },
        { type: 'arrow', from: [560, 870], to: [770, 700], color: 'blue', width: 6, bend: 40 },
        { type: 'text', x: 250, y: 860, text: 'H₂O from the soil', size: 44, color: 'blue' },
        { type: 'mover', char: '💧', size: 30, count: 3, speed: 2.5, path: [[560, 870], [650, 790], [770, 700]], smooth: true },
      ],
    },
    {
      say: 'Using that energy, the plant turns them into sugar for food, and releases oxygen.',
      hold: 2.5,
      items: [
        { type: 'arrow', from: [980, 410], to: [1300, 290], color: 'blue', width: 6, bend: -30 },
        { type: 'text', x: 1310, y: 260, text: 'O₂ released', size: 44, color: 'blue' },
        { type: 'mover', char: '🫧', size: 34, count: 3, speed: 2.2, path: [[980, 410], [1140, 320], [1300, 290]], smooth: true },
        { type: 'icon', x: 1150, y: 600, char: '🍬', size: 90 },
        { type: 'arrow', from: [900, 520], to: [1080, 590], color: 'purple', width: 5 },
        { type: 'text', x: 1210, y: 600, text: 'Glucose (food!)', size: 44, color: 'purple' },
      ],
    },
    {
      say: 'Carbon dioxide plus water plus light gives glucose plus oxygen. That is photosynthesis!',
      clear: true,
      items: [
        { type: 'text', x: 800, y: 160, text: 'The recipe', size: 72, bold: true, align: 'center', color: 'green' },
        { type: 'highlight', x: 140, y: 400, w: 1320, h: 100 },
        { type: 'text', x: 800, y: 450, text: '6 CO₂  +  6 H₂O  +  light  →  C₆H₁₂O₆  +  6 O₂', size: 64, align: 'center', bold: true, with: true },
        { type: 'text', x: 350, y: 560, text: 'carbon dioxide', size: 36, color: 'gray', align: 'center' },
        { type: 'text', x: 580, y: 560, text: 'water', size: 36, color: 'blue', align: 'center', with: true },
        { type: 'text', x: 1040, y: 560, text: 'sugar', size: 36, color: 'purple', align: 'center', with: true },
        { type: 'text', x: 1270, y: 560, text: 'oxygen', size: 36, color: 'blue', align: 'center', with: true },
        { type: 'circle', x: 1040, y: 452, rx: 150, ry: 70, color: 'red', width: 5, wait: 0.3 },
      ],
    },
  ],
});
