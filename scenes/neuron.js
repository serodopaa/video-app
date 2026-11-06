// Explainer: how a neuron works. Silent (no narration).
// Board is 1600 x 900. See CLAUDE.md for every item type.
(() => {
  // Dendrite branches, drawn from the tips toward the cell body so incoming
  // signals can travel along the same paths.
  const dendrites = [
    [[110, 300], [170, 330], [255, 405]],
    [[220, 210], [260, 270], [290, 370]],
    [[90, 455], [170, 450], [240, 452]],
    [[120, 640], [180, 590], [255, 500]],
    [[230, 720], [270, 640], [295, 535]],
  ];
  const axon = [[420, 450], [600, 452], [800, 448], [1000, 452], [1250, 450]];
  const terminals = [
    [[1250, 450], [1320, 400], [1380, 360]],
    [[1250, 450], [1330, 452], [1410, 450]],
    [[1250, 450], [1320, 500], [1380, 540]],
  ];

  (window.WB_SCENES = window.WB_SCENES || []).push({
    id: 'neuron',
    title: '🧠 How a neuron works',
    audio: false,
    steps: [
      {
        say: 'Your brain has about 86 billion neurons: cells that pass messages to each other.',
        items: [
          { type: 'text', x: 800, y: 80, text: 'How a neuron works', size: 76, bold: true, align: 'center', color: 'purple' },
          { type: 'line', from: [540, 130], to: [1060, 130], color: 'purple', width: 6 },
        ],
      },
      {
        say: 'Here is one neuron. It has a cell body, branches called dendrites, and a long tail called the axon.',
        items: [
          { type: 'circle', x: 330, y: 450, r: 90, color: 'purple', fill: 'purple' },
          { type: 'circle', x: 330, y: 450, r: 32, color: 'purple', fill: 'purple', fillOpacity: 0.6, duration: 0.5 },
          ...dendrites.map((points, i) => ({ type: 'path', points, color: 'purple', width: 6, duration: 0.4, with: i > 0 })),
          { type: 'path', points: axon, color: 'purple', width: 10, duration: 1.4 },
          ...[520, 700, 880, 1060].map((x, i) => ({ type: 'rect', x, y: 425, w: 130, h: 50, color: 'orange', fill: 'orange', fillOpacity: 0.55, width: 4, duration: 0.35, with: i > 0, wait: i * 0.15 })),
          ...terminals.map((points, i) => ({ type: 'path', points, color: 'purple', width: 6, duration: 0.4, with: i > 0 })),
          ...terminals.map((p, i) => ({ type: 'circle', x: p[2][0], y: p[2][1], r: 16, color: 'purple', fill: 'purple', fillOpacity: 0.6, duration: 0.3, with: i > 0 })),
        ],
      },
      {
        say: 'Each part has a job.',
        items: [
          { type: 'text', x: 150, y: 160, text: 'Dendrites', size: 44, color: 'blue', align: 'center' },
          { type: 'arrow', from: [170, 190], to: [215, 245], color: 'blue', width: 4, with: true, wait: 0.3 },
          { type: 'text', x: 520, y: 300, text: 'Cell body', size: 44, color: 'blue', align: 'center' },
          { type: 'arrow', from: [480, 325], to: [400, 385], color: 'blue', width: 4, with: true, wait: 0.3 },
          { type: 'text', x: 790, y: 300, text: 'Axon', size: 44, color: 'blue', align: 'center' },
          { type: 'arrow', from: [790, 330], to: [790, 415], color: 'blue', width: 4, with: true, wait: 0.3 },
          { type: 'text', x: 950, y: 600, text: 'Myelin sheath', size: 44, color: 'orange', align: 'center' },
          { type: 'arrow', from: [950, 570], to: [950, 485], color: 'orange', width: 4, with: true, wait: 0.3 },
          { type: 'text', x: 1400, y: 270, text: 'Axon terminals', size: 44, color: 'blue', align: 'center' },
          { type: 'arrow', from: [1395, 300], to: [1385, 335], color: 'blue', width: 4, with: true, wait: 0.3 },
        ],
      },
      {
        say: 'The dendrites pick up signals from other neurons and carry them to the cell body.',
        hold: 2.5,
        items: [
          ...dendrites.map((path, i) => ({ type: 'mover', path, r: 9, color: 'blue', speed: 1.4 + i * 0.25, smooth: true, with: i > 0 })),
          { type: 'text', x: 150, y: 820, text: 'Signals in', size: 44, color: 'blue', align: 'center' },
        ],
      },
      {
        say: 'If enough signals add up and pass a threshold, the neuron fires!',
        items: [
          { type: 'pulse', x: 330, y: 450, r: 120, color: 'red', speed: 1 },
          { type: 'text', x: 520, y: 640, text: 'Threshold reached! ⚡', size: 52, color: 'red', bold: true, anim: 'pop', align: 'center' },
        ],
      },
      {
        say: 'An electrical pulse, the action potential, races down the axon. The myelin makes it jump from gap to gap, so it is very fast.',
        hold: 3,
        items: [
          { type: 'mover', path: axon.concat([[1330, 452], [1410, 450]]), char: '⚡', size: 46, count: 2, speed: 1.6 },
          { type: 'highlight', x: 1000, y: 700, w: 420, h: 70, wait: 0.6 },
          { type: 'text', x: 1210, y: 735, text: 'up to 120 m/s!', size: 52, color: 'red', align: 'center', with: true },
        ],
      },
      {
        say: 'Zooming in on one axon terminal: the end of the neuron does not touch the next one. There is a tiny gap called the synapse.',
        clear: true,
        items: [
          { type: 'text', x: 800, y: 80, text: 'The synapse (zoomed in)', size: 68, bold: true, align: 'center', color: 'purple' },
          { type: 'circle', x: 500, y: 460, r: 200, color: 'purple', fill: 'purple' },
          { type: 'text', x: 470, y: 720, text: 'Axon terminal', size: 44, color: 'purple', align: 'center' },
          { type: 'rect', x: 900, y: 250, w: 320, h: 420, color: 'green', fill: 'green' },
          { type: 'text', x: 1060, y: 720, text: 'Next neuron', size: 44, color: 'green', align: 'center' },
          ...[310, 410, 510, 600].map((y, i) => ({ type: 'rect', x: 880, y, w: 22, h: 46, color: 'green', fill: 'green', fillOpacity: 0.8, width: 4, duration: 0.3, with: i > 0 })),
          { type: 'arrow', from: [790, 820], to: [790, 680], color: 'ink', width: 4 },
          { type: 'text', x: 790, y: 850, text: 'Synaptic gap', size: 40, align: 'center' },
        ],
      },
      {
        say: 'When the pulse arrives, little bubbles release chemical messengers called neurotransmitters into the gap.',
        hold: 3,
        items: [
          ...[[440, 380], [540, 470], [450, 540]].map(([x, y], i) => ({ type: 'circle', x, y, r: 30, color: 'orange', fill: 'orange', fillOpacity: 0.5, width: 4, duration: 0.4, with: i > 0 })),
          { type: 'mover', path: [[690, 400], [770, 360], [878, 333]], smooth: true, r: 8, color: 'orange', count: 3, speed: 1.5 },
          { type: 'mover', path: [[700, 460], [790, 440], [878, 433]], smooth: true, r: 8, color: 'orange', count: 3, speed: 1.3, with: true },
          { type: 'mover', path: [[690, 520], [780, 540], [878, 533]], smooth: true, r: 8, color: 'orange', count: 3, speed: 1.7, with: true },
          { type: 'mover', path: [[680, 570], [770, 610], [878, 623]], smooth: true, r: 8, color: 'orange', count: 3, speed: 1.5, with: true },
          { type: 'text', x: 470, y: 200, text: 'Neurotransmitters', size: 44, color: 'orange', align: 'center' },
        ],
      },
      {
        say: 'They lock onto receptors on the next neuron, which starts its own signal, and the message travels on.',
        items: [
          { type: 'pulse', x: 1060, y: 460, r: 110, color: 'green' },
          { type: 'mover', path: [[960, 460], [1500, 460]], char: '⚡', size: 46, count: 2, speed: 1.4, with: true },
          { type: 'text', x: 1360, y: 200, text: 'Message passed on ✅', size: 48, color: 'green', align: 'center', bold: true },
        ],
      },
    ],
  });
})();
