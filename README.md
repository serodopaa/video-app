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

## Adding explainers
Each explainer is a small file in `scenes/`. Ask Claude Code something like
*"add an explainer about how vaccines work"* and it will write one. The format is
documented in `CLAUDE.md`.
