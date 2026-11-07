# Explainer Board

A whiteboard web app: the user draws freely, and "explainers" (animated scenes)
play step by step on the same board with captions. No build step or
dependencies. Open `index.html` in a browser.

## Files
- `index.html` – layout and the `<script>` list of scenes.
- `style.css` – UI styling.
- `app.js` – engine: drawing tools, animation player, rendering. Exposes
  `window.WB` (renderTo, onFrame, pointer) for the recorder.
- `recorder.js` – recording studio: records the board at 1920×1080 + mic into
  clips (MediaRecorder), timeline (reorder/trim/re-record/delete, stored in
  IndexedDB), preview, and export (plays trimmed clips in order and re-records
  them into one file, in real time). Prefers H.264 MP4, else WebM.
- `vendor/fix-webm-duration.js` – MIT library that writes the length into WebM files.
- `scenes/*.js` – one explainer per file. **Most requests ("add an animation
  explaining X") only need a new scene file plus one `<script>` line in
  `index.html`, placed before `app.js`.**

Every local `<link>`/`<script>` in `index.html` has a `?v=` stamp so browsers fetch
updates. **Bump it (all of them) whenever any file changes.**

## Scene format
The board is **1600 × 900** (x right, y down). Scenes register themselves:

```js
(window.WB_SCENES = window.WB_SCENES || []).push({
  id: 'unique-id',            // also used as the URL hash: index.html#unique-id
  title: '🧪 Title in the menu',
  intro: 'Optional caption before step 1',
  audio: false,               // optional: never read captions aloud, hide Narrate
  drawn: false,               // optional: visuals fade in fully formed (no pen drawing them)
  steps: [
    {
      say: 'Caption shown (and read aloud if Narrate is on).',
      hold: 1.5,              // seconds to wait after the step during Play (default 1.5)
      clear: false,           // true = start a new slide (hides earlier steps)
      drawn: false,           // optional per-step override of the scene setting
      thumbnail: true,        // optional: the 💾 button saves this slide as a 1920×1080 JPEG (YouTube < 2 MB)
      // Animation buttons for this slide: shown in the toolbar (never recorded) only
      // while the slide is on screen; keys 1-9 press them, Shift+R / ↺ resets.
      // Pressing plays `items` (normal animated timing); pressing again replays.
      // When done it holds 1s (HOLD_AT_END), then resets. All animation runs on a
      // pausable clock (animNow): ⏸ / Q / Space / K freezes everything; one global
      // speed (¼×–2×, [ and ] keys) scales it. Durations in scenes are at 1×.
      // A slide item with `hideDuring: '<id>'` is hidden once that action runs.
      actions: [{ id: 'release', label: 'Release neurotransmitters', items: [ /* items */ ] }],
      items: [ /* items below */ ],
    },
  ],
});
```

Within a step, items animate **one after another**. Each item can have:
`duration` (seconds), `wait` (extra delay before it starts), `with: true`
(start at the same time as the previous item), or `at` (exact start time in
seconds; handy for long chained action animations). In actions, `until: s` hides an
item `s` seconds after it starts.

Colors: `ink, blue, red, green, orange, purple, gray, yellow, white` or any CSS color.

| type | props |
|---|---|
| `text` | `x, y` (y = middle of first line), `text` (`\n` for new lines), `size`=48, `color`, `align` left/center/right, `bold`, `font: 'sans'` (the clean label font, Lexend = `LABEL_FONT` in app.js; use it for all built-in text), `anim` type/fade/pop |
| `line` / `arrow` | `from:[x,y]`, `to:[x,y]`, `bend` (curve, px, ±), `color`, `width`=5, `dashed` |
| `rect` | `x, y, w, h`, `color`, `width`, `fill`, `fillOpacity`=0.25, `dashed` |
| `circle` | `x, y, r` (or `rx, ry`), same style props as rect |
| `path` | `points:[[x,y],...]`, `closed`, `smooth` (default true), `fill`, style props |
| `icon` | `x, y, char` (emoji), `size`=80. Pops in |
| `highlight` | `x, y, w, h`, `color`=yellow, `opacity`. Marker sweep behind text |
| `mover` | `path:[[x,y],...]`, `char` (emoji) or dot (`r`, `color`), `count`, `speed` (s per trip), `smooth`, `showPath`, `once` (travel once and stop), `vanish` (with `once`: disappear on arrival). Loops forever otherwise |
| `svg` | `svg` (full SVG markup string), `x, y, w, h` (default: whole board 0,0,1600,900). For detailed, realistic illustrations; use a `viewBox="0 0 1600 900"` so its coordinates match the board |
| `vesicle` | `x, y`, `r`=11 (a bubble of neurotransmitters). With `path` it moves along it; with `fuse: true` it moves in the first 60% of its time, then merges into the membrane and disappears |
| `flash` | `x, y, r`, `color`. One-off glow that grows and fades within its `duration` (e.g. a node firing) |
| `ion` | `ion`: `na` / `k` / `cl` / `ca` / `a` (negative protein), `x, y`; or `path` to travel along (eased, stays at the end, waits at the start before it begins); `loop: s` + `phase` travels the path repeatedly (e.g. leak channels) |
| `channel` | `id`, `x, y` (membrane centre), `h`, `fill`, `edge`, `label` (`\n` allowed; state is appended). Ion channel; how open it is (0–1) is live value `id`. `ligand: false` = voltage-gated (shows + sensors, no binding site); `inactId` = live value (0–1) for an inactivation ball that plugs the pore; `open` = default opening; `plain: true` = leak channel (no sensors / binding site) |
| `meter` | `id`, `value` (resting), `x, y, w, h`, `graphH`, `min`/`max`, `marks` [{v, label, color, dy}] (e.g. equilibrium potentials). Membrane-potential panel: live number, state text and a graph of the last 8 s with 0 / threshold / resting lines |
| `stepper` | `id` (live value = seconds, −1 idle), `steps` [{from, to, title, text, color}], `x, y, w, h`, `title`, `idleText`, `rowH`=52. Numbered step list; the current step is highlighted and explained |
| `charges` | `id` (live mV value), `value`, `x0, x1, top, bot`, `step`. +/− signs on both membrane faces that flip when the inside goes above 0 mV |
| `apgraph` | `id` (live value = seconds along the curve, −1 idle), `keys` [[t, mV]…], `phases` [{from, to, title, text, color, dot, mark}], `x, y, w, h`, `graphH`, `title`, `idleText`. Action-potential panel: full curve, cursor tracing it, phase bands, numbered markers and a caption for the current phase |
| `apwave` | `id` (live value = seconds, −1 idle), `sites` [{x, t, node}], `wave` [[τ, mV]…], `gx0, gx1, gy, gh` (graph strip, x lined up with the axon), `axonY, axonR`, `naStyle`/`kStyle` {fill, edge, dot}. Action potential travelling along a straight axon: voltage-vs-position graph plus Na⁺/K⁺ channels opening, ions crossing and a glow at each site |
| `value` | (in actions) `id`, `from`, `to`, `at`, `duration`, `linear`: animates live value `id` (used by `meter`, `channel`, `charges`, `apgraph`). Eased unless `linear: true`. Latest started segment wins |
| `pulse` | `x, y, r`, `color`, `speed`. Repeating rings to draw attention |

Strokes get a slight hand-drawn wobble. Set `rough: false` to turn it off.
Stroke items show a marker pen following the line while drawing.

## Conventions
- **The user does the drawing.** In explainers built for them (e.g. `neuron`),
  Claude's visuals must not be drawn on: use `drawn: false` so they simply
  appear. Make them realistic (textbook-style SVG illustrations, clean `sans`
  labels with leader lines), not hand-sketched.
- The user builds explainers slide by slide: add one step per request and
  don't add slides they didn't ask for.
- Keep text and icons inside roughly x 60–1540, y 50–860.
- Keep each step short (2–6 items) with a one-sentence `say`.
- Check new scenes in a headless browser (Playwright) and look at screenshots
  for overlaps before committing.
- **Slides:** a step with `clear: true` starts a new slide; steps without it add to
  the current slide. The player shows "Slide N / M". To add a slide, append a
  step with `clear: true` (comment it `// Slide N: ...`).
- User drawings belong to a slide: `localStorage` key `wb-ink-<id>` for slide 1,
  `wb-ink-<id>-s<index>` for later slides (index is 0-based). Undo/redo is per slide.
  Inserting a slide in the middle shifts which saved drawing goes with which slide,
  so prefer adding slides at the end.
