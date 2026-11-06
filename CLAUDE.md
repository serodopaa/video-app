# Explainer Board

A whiteboard web app: the user draws freely, and "explainers" (animated scenes)
play step by step on the same board with captions. No build step or
dependencies. Open `index.html` in a browser.

## Files
- `index.html` – layout and the `<script>` list of scenes.
- `style.css` – UI styling.
- `app.js` – engine: drawing tools, animation player, rendering.
- `scenes/*.js` – one explainer per file. **Most requests ("add an animation
  explaining X") only need a new scene file plus one `<script>` line in
  `index.html`, placed before `app.js`.**

## Scene format
The board is **1600 × 900** (x right, y down). Scenes register themselves:

```js
(window.WB_SCENES = window.WB_SCENES || []).push({
  id: 'unique-id',            // also used as the URL hash: index.html#unique-id
  title: '🧪 Title in the menu',
  intro: 'Optional caption before step 1',
  steps: [
    {
      say: 'Caption shown (and read aloud if Narrate is on).',
      hold: 1.5,              // seconds to wait after the step during Play (default 1.5)
      clear: false,           // true = hide everything from earlier steps
      items: [ /* items below */ ],
    },
  ],
});
```

Within a step, items animate **one after another**. Each item can have:
`duration` (seconds), `wait` (extra delay before it starts), `with: true`
(start at the same time as the previous item).

Colors: `ink, blue, red, green, orange, purple, gray, yellow, white` or any CSS color.

| type | props |
|---|---|
| `text` | `x, y` (y = middle of first line), `text` (`\n` for new lines), `size`=48, `color`, `align` left/center/right, `bold`, `anim` type/fade/pop |
| `line` / `arrow` | `from:[x,y]`, `to:[x,y]`, `bend` (curve, px, ±), `color`, `width`=5, `dashed` |
| `rect` | `x, y, w, h`, `color`, `width`, `fill`, `fillOpacity`=0.25, `dashed` |
| `circle` | `x, y, r` (or `rx, ry`), same style props as rect |
| `path` | `points:[[x,y],...]`, `closed`, `smooth` (default true), `fill`, style props |
| `icon` | `x, y, char` (emoji), `size`=80. Pops in |
| `highlight` | `x, y, w, h`, `color`=yellow, `opacity`. Marker sweep behind text |
| `mover` | `path:[[x,y],...]`, `char` (emoji) or dot (`r`, `color`), `count`, `speed` (s per trip), `smooth`, `showPath`, `once`. Loops forever |
| `pulse` | `x, y, r`, `color`, `speed`. Repeating rings to draw attention |

Strokes get a slight hand-drawn wobble. Set `rough: false` to turn it off.
Stroke items show a marker pen following the line while drawing.

## Conventions
- Keep text and icons inside roughly x 60–1540, y 50–860.
- Keep each step short (2–6 items) with a one-sentence `say`.
- Check new scenes in a headless browser (Playwright) and look at screenshots
  for overlaps before committing.
- User drawings are saved in `localStorage` per scene (`wb-ink-<id>`).
