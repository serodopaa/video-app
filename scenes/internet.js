// Explainer: how a message travels across the Internet.
// Board is 1600 x 900. See CLAUDE.md for every item type.
(window.WB_SCENES = window.WB_SCENES || []).push({
  id: 'internet',
  title: '🌐 How a message travels the Internet',
  steps: [
    {
      say: "Let's follow a message from your laptop to a friend's phone.",
      items: [
        { type: 'text', x: 800, y: 80, text: 'How a message travels the Internet', size: 72, bold: true, align: 'center' },
        { type: 'line', from: [430, 130], to: [1170, 130], color: 'blue', width: 6 },
      ],
    },
    {
      say: "Here's you, and here's your friend on the other side of the world.",
      items: [
        { type: 'icon', x: 200, y: 420, char: '💻', size: 120 },
        { type: 'text', x: 200, y: 510, text: 'You', size: 48, align: 'center', with: true, wait: 0.2 },
        { type: 'icon', x: 1400, y: 420, char: '📱', size: 120 },
        { type: 'text', x: 1400, y: 510, text: 'Your friend', size: 48, align: 'center', with: true, wait: 0.2 },
      ],
    },
    {
      say: "The message doesn't go straight there. It hops between computers called routers and servers.",
      items: [
        { type: 'circle', x: 520, y: 260, r: 75, color: 'purple', fill: 'purple' },
        { type: 'text', x: 520, y: 260, text: 'Router', size: 40, align: 'center' },
        { type: 'circle', x: 800, y: 600, r: 75, color: 'orange', fill: 'orange' },
        { type: 'text', x: 800, y: 600, text: 'ISP', size: 40, align: 'center' },
        { type: 'circle', x: 1080, y: 260, r: 75, color: 'green', fill: 'green' },
        { type: 'text', x: 1080, y: 260, text: 'Server', size: 40, align: 'center' },
        { type: 'line', from: [270, 380], to: [450, 290], color: 'gray', width: 4, dashed: true },
        { type: 'line', from: [560, 325], to: [750, 540], color: 'gray', width: 4, dashed: true },
        { type: 'line', from: [850, 540], to: [1040, 325], color: 'gray', width: 4, dashed: true },
        { type: 'line', from: [1150, 290], to: [1330, 380], color: 'gray', width: 4, dashed: true },
      ],
    },
    {
      say: 'First, your message is chopped into small pieces called packets.',
      items: [
        { type: 'rect', x: 80, y: 600, w: 260, h: 70, color: 'ink', width: 4 },
        { type: 'text', x: 210, y: 635, text: '"Hello there!"', size: 40, align: 'center' },
        { type: 'arrow', from: [210, 680], to: [210, 740], color: 'ink', width: 4 },
        { type: 'icon', x: 140, y: 790, char: '📦', size: 56 },
        { type: 'icon', x: 210, y: 790, char: '📦', size: 56, wait: 0.1 },
        { type: 'icon', x: 280, y: 790, char: '📦', size: 56, wait: 0.1 },
      ],
    },
    {
      say: 'Each packet hops from machine to machine. They can even take different routes!',
      hold: 3,
      items: [
        {
          type: 'mover', char: '📦', size: 40, count: 3, speed: 4,
          path: [[270, 380], [450, 290], [520, 260], [560, 325], [750, 540], [800, 600], [850, 540], [1040, 325], [1080, 260], [1150, 290], [1330, 380]],
        },
        { type: 'highlight', x: 1180, y: 690, w: 380, h: 60, wait: 0.5 },
        { type: 'text', x: 1190, y: 720, text: 'about 0.1 seconds!', size: 48, color: 'red', with: true },
      ],
    },
    {
      say: 'At the other end, the packets are put back in order, and your friend reads the message.',
      items: [
        { type: 'pulse', x: 1400, y: 420, r: 110, color: 'green' },
        { type: 'rect', x: 1260, y: 580, w: 280, h: 70, color: 'green', width: 4, fill: 'green' },
        { type: 'text', x: 1400, y: 615, text: '"Hello there!" ✅', size: 40, align: 'center' },
      ],
    },
  ],
});
