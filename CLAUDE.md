# Explainer Board

A whiteboard web app: the user draws freely, and "explainers" (animated scenes)
play step by step on the same board with captions. No build step or
dependencies. Open `index.html` in a browser.

## Files
- `index.html` – layout and the `<script>` list of scenes. Keep the UI compact: ONE toolbar row above
  the board (tool / colour / size are pop-up pickers, edit buttons are icon-only, the slide's animation
  buttons scroll sideways if they don't fit) and at most TWO rows below it (player + output buttons, then
  the recording controls); only the timeline may add more. The caption text is hidden.
- `style.css` – UI styling.
- `app.js` – engine: drawing tools, animation player, rendering. Exposes
  `window.WB` (renderTo, onFrame, pointer) for the recorder.
  Heavy `svg`/`inset` pictures (>15 KB or with filters) are drawn from a cached bitmap per device scale
  (`drawSvgCached`: cropped to their content, pixel-aligned, LRU-bounded ~48 M px); short-lived animation
  frames (`until` < 0.5 s) and small SVGs are drawn directly. Chrome's own SVG cache thrashes when the
  screen and the 1920×1080 recording draw at different sizes, which caused stutter.
  SVG images are built lazily: only for the slide being shown, and the next slide's in idle chunks
  (`ensureSlideImages` / `prefetchSlideImages`); building every topic's images at start-up took ~35 s.
  An `svg` item can have `move: [[t, dx, dy], …]` (eased offsets over its duration) so ONE picture
  travels, instead of a new picture per animation frame. Prefer it for anything that moves.
- `recorder.js` – recording studio: records the board at 1920×1080 + mic into
  clips (MediaRecorder), timeline (reorder/trim/re-record/delete, stored in
  IndexedDB), preview, and export (plays trimmed clips in order and re-records
  them into one file, in real time). Prefers H.264 MP4, else WebM.
  While a clip is paused, ✂ Cut part / ✂ −5 s drop the last recorded part; the recording keeps
  running and the clip stores the kept file ranges in `keep` ([[start, end], …]; missing = whole
  file). Preview, trim and export skip the gaps (`expand()` turns clips into kept pieces).
  ▶ Last 10 s (while recording) pauses and plays the end of the kept recording so far in a small
  on-screen window (`.replay-pop`, never recorded); it closes on Resume / Stop / a cut.
  🔊 Volume (`wb-loudness` in localStorage, 100–400%) boosts the audio in export and previews,
  with a limiter (+ ~2 dB headroom trim) so it never distorts. Export decodes each clip's audio
  (`decodeAudioData`) and schedules every kept piece on the AudioContext clock with 12 ms fades, so
  joins and cut parts never click; video elements are muted then and only give the picture.
  Record mode (`#recMode`, saved as `wb-recmode`): 🎥 Voice + board (default) or 🎙 Voice only. A voice
  take is an audio-only clip (`voiceOnly: true`); its card has 🎬 Add visuals, which plays the kept
  parts of the take on an AudioContext (also to the speakers) and records the board with that sound
  instead of the mic; it stops by itself when the voice ends and replaces the take with a normal clip
  that keeps the take in `voice` (so 🎬 Redo visuals works). Pause suspends the AudioContext too.
  Preview and export leave voice-only takes out.
  Speed (`#outSpeed`, saved as `wb-speed`: 1× to 2× in 0.1 steps, default 1.2×) applies to Preview and Export. Videos play
  at that `playbackRate` with `preservesPitch` (like YouTube). At 1× export uses the decoded-audio path;
  faster, the sound comes from the video elements (fade gains, delayed fade-in at each join).
  Per-clip volume: optional `gain` on a clip (25–300%, select on each timeline card; missing = 100%),
  applied before the overall 🔊 Volume in export (both paths), Preview and the clip dialog (`clipGain`).
  Never change how existing clips are stored (only add optional fields).
- `exporter.js` – frame-exact export (`window.WB_EXACT_EXPORT`, used first by recorder.js when WebCodecs
  H.264 + AAC/Opus encoding exist; else the old real-time export runs). Sound: each kept piece is decoded,
  sped up with pitch-preserving WSOLA if speed ≠ 1, faded (15 ms) and mixed, then the volume + limiter
  chain is applied in an OfflineAudioContext. Picture: each piece plays muted and every decoded frame
  (`requestVideoFrameCallback`) is encoded with its exact clip time mapped to the output; a skipped frame
  makes it seek back and play slower. Output: MP4 via `vendor/mp4-muxer.js` (MIT, Vanilagy).
  Recording pushes frames itself (`captureStream(0)` + `requestFrame` every other screen refresh): a
  fixed-rate capture timer drifts against the screen and repeats/skips frames (stutter).
- `vendor/fix-webm-duration.js` – MIT library that writes the length into WebM files.
- `scenes/brain-midsagittal.js` – the user-supplied midsagittal brain drawing (vector, 190 paths) as
  `window.WB_BRAIN_MID`; `brain-art.js` uses it for the medial view and the midsagittal cut face. Load it first.
- `scenes/brain-art.js` – stylised brain illustrations (lateral, medial, superior, inferior, anterior,
  posterior views, coronal/axial sections) as SVG markup, shared via `window.WB_BRAIN_ART`; used by
  `brain-views.js` (must be loaded before it).
- `scenes/affinity-specificity.js` – also shares its receptor / ligand artwork and animation helpers as
  `window.WB_LIGAND_ART` (`track` = a moving picture via `move`; `frameTrack` = per-frame pictures for
  things that change shape, e.g. gauges); `agonist-antagonist.js` uses them (load it after).
- `scenes/pharmacology-pd.js` – part 2 (pharmacodynamics, slides 6–18) of the `pharmacology-essentials` topic: it appends its slides to
  that scene (one video) and reuses `window.WB_PHARM_ART` from `pharmacology-essentials.js`; load it right after that file.
- `scenes/pharmacology-pk.js` – part 3 (pharmacokinetics, slides 19–34) of the same topic; reuses `window.WB_PHARM_PD`
  (cards, tabs, graph helpers) shared by `pharmacology-pd.js`; load it right after that file.
- `scenes/pharmacology-safety.js` – part 4 (drug safety and interactions, slides 35–39) of the same topic; load it right
  after `pharmacology-pk.js`. (Slide 18 = placebo, end of part 2; slide 33 = first- vs zero-order, part 3.)
- `scenes/pharmacology-recap.js` – slide 40, the course recap (big picture / follow ibuprofen / key takeaways); load it
  last. Part 2 order: targets, receptors & binding, receptor types, affinity…, receptor regulation (17), placebo (18).
- Inserting slides mid-topic: give the scene `renumber: [{ key, before: [old slide numbers] }]` (or `move: { old: new }` for reordered slides); app.js
  (`applyRenumbers`) then moves the user's saved per-slide drawings / notes / prompter text to the new numbers once.
- `scenes/*.js` – one explainer per file. **Most requests ("add an animation
  explaining X") only need a new scene file plus one `<script>` line in
  `index.html`, placed before `app.js`.**

Every local `<link>`/`<script>` in `index.html` has a `?v=` stamp so browsers fetch
updates. **Bump it (all of them) whenever any file changes.**

## Topics
Every scene in the menu is a **topic**, and topics are isolated: ink (`wb-ink-<id>`), notes
(📝 panel, two boxes: 📜 Key points = the slide's `notes` (bullets get a blank line between them) + the user's
edits in `wb-notes-<id>-<n>`; ✏️ My notes = the user's own, empty to start, `wb-mynotes-<id>-<n>`; view buttons
Points / Mine / Both (side by side; the panel widens), saved in `wb-notes-tab`) and recorded clips (IndexedDB `clips`, field `scene` = scene id) are all
keyed by the scene id. Users can make quick empty topics with ➕ (saved in localStorage
`wb-topics`, deletable with 🗑️); topics Claude builds are scene files in `scenes/` (e.g.
`epsp-ipsp.js`) and can't be deleted from the UI. `app.js` fires `wb-scene` on every topic
switch, and `recorder.js` reloads the timeline from it.

## Teleprompter
📜 Prompter (key **G**) turns a scrolling script on or off **per slide** (default off). It sits on
top of the board on screen only: the recorder draws the board on its own canvas, so it is never
in the video, and clicks pass through the text. A step's `script` is the slide's default script;
✎ Edit in the prompter overwrites it for that slide in `localStorage` (`wb-tps-<id>-<n>`; the
on/off flag is `wb-tp-<id>-<n>`; `n` = slide number, 0 on the blank board). It starts paused at the
top (key **S** or ▶ to start/pause) and starts by itself when a recording starts (`recorder.js`
fires a `wb-rec` event with `recording` / `paused` / `idle`). Speed is seconds per line (`1 line / N s`, default 4), independent of word count. Drag the grip in its bottom-right corner to resize the window (saved; double-click the grip to reset). ◐ − / ◐ + change only the background opacity of the script area (text and the control strip stay solid; saved).

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
      notes: 'Optional default 📝 Notes for this slide (on its first step); the user\'s own saved notes (wb-notes-<id>-<n>) win.',
      script: 'Optional teleprompter script for this slide (see Teleprompter). [stage directions] show in amber.',
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

Actions can also have `stay: true` (the last frame stays on screen instead of resetting after 1 s),
`group: 'name'` (starting one action of a group stops the others; with `stay` this makes a
click-to-switch demo panel) and `drawn: false` (items appear fully formed at once; without it,
action items without `at` play one after another).

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
| `inset` | `x, y, w, h`, `svg` (its viewBox must be that rect; draw it large for crispness), `title`, `hoverTop`. Small picture that, after a 1 s hover, grows to fill the slide (also in recordings); pointer leaving the board or a click shrinks it. `locatorInset()` in neuron.js builds a "Where we are" one |
| `hotspot` | `x, y, w, h`, `action` (an action id on the same slide). Invisible click target on the board: clicking it (any tool) runs that action instead of drawing. Used for clickable bullets |
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
