// Explainer: how a neuron works. Built slide by slide. Silent (no narration).
// Board is 1600 x 900. See CLAUDE.md for every item type.
(() => {
  // Shared geometry so later slides can reuse the same neuron.
  const soma = { x: 380, y: 480, r: 100 };
  // Dendrite branches, drawn from the tips toward the cell body.
  const dendrites = [
    [[120, 320], [190, 350], [295, 430]],
    [[240, 220], [285, 290], [320, 390]],
    [[90, 480], [180, 476], [280, 480]],
    [[130, 680], [200, 620], [295, 530]],
    [[250, 770], [295, 680], [330, 570]],
  ];
  const axon = [[480, 480], [700, 484], [900, 476], [1100, 484], [1260, 480]];
  const terminals = [
    [[1260, 480], [1330, 425], [1400, 385]],
    [[1260, 480], [1345, 482], [1430, 480]],
    [[1260, 480], [1330, 535], [1400, 575]],
  ];

  const label = (text, x, y, arrowFrom, arrowTo) => [
    { type: 'text', x, y, text, size: 46, color: 'blue', align: 'center' },
    { type: 'arrow', from: arrowFrom, to: arrowTo, color: 'blue', width: 4, with: true, wait: 0.3 },
  ];

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'neuron',
    title: '🧠 How a neuron works',
    audio: false,
    steps: [
      // Slide 1: the parts of a neuron, labelled.
      {
        say: 'A neuron has four main parts: dendrites, a cell body, an axon, and axon terminals.',
        items: [
          { type: 'text', x: 800, y: 80, text: 'How a neuron works', size: 76, bold: true, align: 'center', color: 'purple' },
          { type: 'line', from: [540, 130], to: [1060, 130], color: 'purple', width: 6 },

          // Cell body with nucleus
          { type: 'circle', x: soma.x, y: soma.y, r: soma.r, color: 'purple', fill: 'purple' },
          { type: 'circle', x: soma.x, y: soma.y, r: 34, color: 'purple', fill: 'purple', fillOpacity: 0.6, duration: 0.5 },

          // Dendrites
          ...dendrites.map((points, i) => ({ type: 'path', points, color: 'purple', width: 6, duration: 0.45, with: i > 0 })),

          // Axon
          { type: 'path', points: axon, color: 'purple', width: 10, duration: 1.4 },

          // Axon terminals with their end bulbs
          ...terminals.map((points, i) => ({ type: 'path', points, color: 'purple', width: 6, duration: 0.45, with: i > 0 })),
          ...terminals.map((p, i) => ({ type: 'circle', x: p[2][0], y: p[2][1], r: 18, color: 'purple', fill: 'purple', fillOpacity: 0.6, duration: 0.3, with: i > 0 })),

          // Labels
          ...label('Dendrites', 170, 180, [185, 210], [235, 270]),
          ...label('Cell body', 600, 320, [560, 345], [465, 420]),
          ...label('Axon', 870, 640, [870, 610], [870, 500]),
          ...label('Axon terminal', 1400, 270, [1400, 300], [1400, 355]),
        ],
      },
    ],
  });
})();
