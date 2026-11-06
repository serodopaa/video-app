# Explainer Board

A whiteboard you can draw on, with animated step-by-step explainers that play
on the same board: hand-drawn lines, arrows, labels and moving parts, with
captions and optional read-aloud narration.

## Use it
Open `index.html` in any browser. No install needed.

- **Draw:** Pen, Marker, Line, Arrow, Box, Circle, Text and Eraser, plus colors and sizes.
  Undo/redo with Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z.
- **Explainers:** pick one from the menu at the bottom, then press **▶ Play**, or step with
  ⏮ / ⏭ (or the ← / → keys). Tick **🔊 Narrate** to have captions read out loud.
  You can draw on top while it plays.
- **🎬 Replay ink:** plays back your own drawing as an animation.
- **💾 PNG:** saves the board as an image.

Keyboard: P pen · H marker · L line · A arrow · R box · O circle · T text · E eraser · Space play/pause.

## Recording videos (for YouTube)
Use Chrome, and open the app from its **https** link (GitHub Pages). Browsers
often block the microphone on files opened straight from your computer.

1. Press **⏺ Record**. After a 3-2-1 countdown, the board and your microphone are
   recorded. The toolbar and buttons are not in the video, and it's always 1920×1080.
2. **⏸ Pause** / **⏵ Resume** as often as you like, then **⏹ Stop**. The recording
   becomes a clip on the timeline.
3. Record more sections. Each one becomes another clip.
4. On each clip: **✂️** watch and trim the start/end, **◀ ▶** move it, **🔁** re-record
   it (your next recording replaces it), **🗑️** delete it.
5. **▶ Preview all** plays everything in order. **⬇ Export video** joins all clips
   into one file in your Downloads. Export runs in real time (a 10-minute video
   takes about 10 minutes), so keep the tab open and visible while it runs.

Clips are saved in this browser, so they're still there after a refresh. They are
not uploaded anywhere. Untick **Pointer in video** to hide the red pointer dot.

## Adding explainers
Each explainer is a small file in `scenes/`. Ask Claude Code something like
*"add an explainer about how vaccines work"* and it will write one. The format is
documented in `CLAUDE.md`.
