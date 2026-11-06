/*
 * Explainer Board
 * A whiteboard you can draw on, plus a step-by-step animation player.
 *
 * The board uses a fixed logical size of 1600 x 900 (16:9). Every coordinate
 * in a scene file and in your drawings is in that space, so it scales to any
 * screen size.
 */
(() => {
  'use strict';

  const W = 1600;
  const H = 900;
  const FONT = '"Caveat", "Comic Sans MS", cursive';
  const SANS = 'Inter, system-ui, -apple-system, sans-serif';

  const COLORS = {
    ink: '#1f2430',
    blue: '#2f6fde',
    red: '#e0453a',
    green: '#2e9e5b',
    orange: '#f08c1a',
    purple: '#8a4fd8',
    gray: '#8a8f98',
    yellow: '#f5c518',
    white: '#ffffff',
  };
  const col = (c) => COLORS[c] || c || COLORS.ink;

  // ---------- small helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOutBack = (t) => {
    const c1 = 1.7, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const now = () => performance.now() / 1000;

  function measure(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    return cum;
  }

  // Resample a polyline so points are roughly `step` px apart.
  function resample(pts, step = 10) {
    if (pts.length < 2) return pts.slice();
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let k = 1; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
    }
    return out;
  }

  // Tiny deterministic wobble so animated strokes look hand drawn.
  function wobble(pts, seed, amp = 1.3) {
    return pts.map(([x, y], i) => [
      x + Math.sin(i * 0.9 + seed) * amp,
      y + Math.cos(i * 1.3 + seed * 2) * amp,
    ]);
  }

  function quadPts(a, b, bend, n = 40) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const cx = mx + (-dy / len) * bend, cy = my + (dx / len) * bend;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push([
        (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0],
        (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1],
      ]);
    }
    return out;
  }

  function catmull(points, closed, n = 12) {
    const P = closed ? [points[points.length - 1], ...points, points[0], points[1]] : [points[0], ...points, points[points.length - 1]];
    const out = [];
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
      }
    }
    out.push(closed ? points[0] : points[points.length - 1]);
    return out;
  }

  function ellipsePts(cx, cy, rx, ry, overshoot = 0.12, n = 72) {
    const out = [];
    const a0 = -Math.PI / 2;
    const total = Math.PI * 2 + overshoot;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (total * i) / n;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }

  function rectPts(x, y, w, h) {
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  }

  // ---------- canvas ----------
  const canvas = document.getElementById('board');
  const screenCtx = canvas.getContext('2d');
  // All drawing goes through `ctx`. The recorder temporarily points it at its
  // own 1920x1080 canvas to render the same board for the video.
  let ctx = screenCtx;
  const stage = document.getElementById('stage');
  let scale = 1;

  function resize() {
    const pad = 24;
    const availW = stage.clientWidth - pad;
    const availH = stage.clientHeight - pad;
    let w = availW, h = (availW * H) / W;
    if (h > availH) { h = availH; w = (availH * W) / H; }
    w = Math.max(200, Math.floor(w));
    h = Math.max(112, Math.floor(h));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    scale = (w * dpr) / W;
  }
  window.addEventListener('resize', resize);

  // Stroke a polyline up to fraction p of its length. Returns the pen tip.
  function strokePartial(pts, cum, p) {
    if (p <= 0 || pts.length < 2) return null;
    const total = cum[cum.length - 1];
    const target = total * p;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    let tip = { x: pts[0][0], y: pts[0][1], a: 0 };
    for (let i = 1; i < pts.length; i++) {
      const a = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
      if (cum[i] <= target) {
        ctx.lineTo(pts[i][0], pts[i][1]);
        tip = { x: pts[i][0], y: pts[i][1], a };
      } else {
        const seg = cum[i] - cum[i - 1];
        const f = seg ? (target - cum[i - 1]) / seg : 0;
        const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f;
        const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
        ctx.lineTo(x, y);
        tip = { x, y, a };
        break;
      }
    }
    ctx.stroke();
    return tip;
  }

  function arrowHead(x, y, angle, size, k = 1) {
    if (k <= 0) return;
    const s = size * k;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(angle - 0.45) * s, y - Math.sin(angle - 0.45) * s);
    ctx.lineTo(x, y);
    ctx.lineTo(x - Math.cos(angle + 0.45) * s, y - Math.sin(angle + 0.45) * s);
    ctx.stroke();
  }

  function setStroke(color, width) {
    ctx.strokeStyle = col(color);
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function drawPenTip(tip, color) {
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(-0.7);
    ctx.fillStyle = col(color);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -14);
    ctx.lineTo(-8, -14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3b4252';
    ctx.fillRect(-9, -70, 18, 56);
    ctx.fillStyle = col(color);
    ctx.fillRect(-9, -78, 18, 10);
    ctx.restore();
  }

  // ---------- scene items ----------
  const DEFAULT_DUR = { text: null, line: 0.7, arrow: 0.8, rect: 1, circle: 1, path: 1.2, highlight: 0.6, icon: 0.5, mover: 0.5, pulse: 0.5 };
  const STROKE_TYPES = new Set(['line', 'arrow', 'rect', 'circle', 'path']);

  function prepare(item, seed) {
    if (item._pts) return;
    let pts = null;
    switch (item.type) {
      case 'line':
      case 'arrow':
        pts = item.bend ? quadPts(item.from, item.to, item.bend) : [item.from, item.to];
        break;
      case 'rect':
        pts = rectPts(item.x, item.y, item.w, item.h);
        break;
      case 'circle':
        pts = ellipsePts(item.x, item.y, item.rx || item.r, item.ry || item.r);
        break;
      case 'path':
        pts = item.smooth === false ? item.points.slice() : catmull(item.points, !!item.closed);
        if (item.closed && item.smooth === false) pts.push(item.points[0]);
        break;
      case 'mover':
        pts = item.smooth ? catmull(item.path, false) : item.path.slice();
        break;
    }
    if (pts) {
      if (item.type === 'mover') {
        item._pts = resample(pts, 6);
      } else {
        item._pts = item.rough === false || item._static ? resample(pts, 10) : wobble(resample(pts, 12), seed);
      }
      item._cum = measure(item._pts);
    }
    if (item.type === 'text') item._lines = String(item.text).split('\n');
    if (item.type === 'svg' && !item._img) {
      item._img = new Image();
      item._img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(item.svg);
    }
  }

  function pointAt(pts, cum, f) {
    const total = cum[cum.length - 1];
    const target = total * f;
    for (let i = 1; i < pts.length; i++) {
      if (cum[i] >= target) {
        const seg = cum[i] - cum[i - 1];
        const t = seg ? (target - cum[i - 1]) / seg : 0;
        return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
      }
    }
    return pts[pts.length - 1];
  }

  // Draws one scene item at progress p (0..1). Returns a pen tip if it is
  // mid-stroke, so the player can draw a marker following the line.
  function renderItem(item, p, t) {
    if (p <= 0) return null;
    // Static items (scene option drawn: false) fade in fully formed instead of
    // being drawn stroke by stroke.
    const base = item._static ? easeInOut(p) : 1;
    const e = item._static ? 1 : easeInOut(p);
    const width = item.width || 5;
    ctx.save();
    ctx.globalAlpha = base;
    let tip = null;
    switch (item.type) {
      case 'line':
      case 'arrow': {
        setStroke(item.color, width);
        if (item.dashed) ctx.setLineDash([width * 3, width * 3]);
        tip = strokePartial(item._pts, item._cum, e);
        ctx.setLineDash([]);
        if (item.type === 'arrow' && tip) {
          const n = item._pts.length;
          const end = item._pts[n - 1], before = item._pts[Math.max(0, n - 4)];
          const a = Math.atan2(end[1] - before[1], end[0] - before[0]);
          arrowHead(end[0], end[1], a, Math.max(18, width * 4), clamp((p - 0.85) / 0.15));
        }
        break;
      }
      case 'rect':
      case 'circle':
      case 'path': {
        if (item.fill) {
          ctx.globalAlpha = base * (item._static ? 1 : clamp((p - 0.6) / 0.4)) * (item.fillOpacity ?? 0.25);
          ctx.fillStyle = col(item.fill);
          ctx.beginPath();
          item._pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = base;
        }
        setStroke(item.color, width);
        if (item.dashed) ctx.setLineDash([width * 3, width * 3]);
        tip = strokePartial(item._pts, item._cum, e);
        break;
      }
      case 'text': {
        const size = item.size || 48;
        ctx.font = `${item.bold ? 700 : item.font === 'sans' ? 600 : 500} ${size}px ${item.font === 'sans' ? SANS : FONT}`;
        ctx.fillStyle = col(item.color);
        ctx.textAlign = item.align || 'left';
        ctx.textBaseline = 'middle';
        const anim = item._static ? 'none' : item.anim || 'type';
        const lines = item._lines;
        let chars = Infinity;
        if (anim === 'type') chars = Math.floor(p * lines.join('').length + 0.0001);
        if (anim === 'fade') ctx.globalAlpha = e;
        if (anim === 'pop') {
          const s = easeOutBack(p);
          ctx.translate(item.x, item.y);
          ctx.scale(s, s);
          ctx.translate(-item.x, -item.y);
        }
        let used = 0;
        lines.forEach((line, i) => {
          const show = line.slice(0, Math.max(0, chars - used));
          used += line.length;
          if (show) ctx.fillText(show, item.x, item.y + i * size * 1.15);
        });
        break;
      }
      case 'icon': {
        const s = item._static ? 1 : easeOutBack(p);
        ctx.translate(item.x, item.y);
        ctx.scale(s, s);
        ctx.font = `${item.size || 80}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.char, 0, 0);
        break;
      }
      case 'svg': {
        const img = item._img;
        if (img && img.complete && img.naturalWidth) ctx.drawImage(img, item.x || 0, item.y || 0, item.w || W, item.h || H);
        break;
      }
      case 'highlight': {
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = base * (item.opacity ?? 0.45);
        ctx.fillStyle = col(item.color || 'yellow');
        ctx.fillRect(item.x, item.y, item.w * e, item.h);
        break;
      }
      case 'mover': {
        ctx.globalAlpha = base * e;
        const count = item.count || 1;
        const period = item.speed || 2.5;
        if (item.showPath) {
          setStroke(item.pathColor || 'gray', 2);
          ctx.globalAlpha = base * e * 0.5;
          ctx.setLineDash([6, 8]);
          strokePartial(item._pts, item._cum, 1);
          ctx.setLineDash([]);
          ctx.globalAlpha = base * e;
        }
        for (let k = 0; k < count; k++) {
          let f = (t / period + k / count) % 1;
          if (item.once) f = clamp(p);
          const [x, y] = pointAt(item._pts, item._cum, f);
          if (item.char) {
            ctx.font = `${item.size || 36}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.char, x, y);
          } else {
            const r = item.r || 10;
            ctx.fillStyle = col(item.color || 'blue');
            ctx.shadowColor = col(item.color || 'blue');
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
          if (item.once) break;
        }
        break;
      }
      case 'pulse': {
        const r = item.r || 40;
        const period = item.speed || 1.6;
        setStroke(item.color || 'red', item.width || 4);
        for (let k = 0; k < 3; k++) {
          const ph = (t / period + k / 3) % 1;
          ctx.globalAlpha = base * (1 - ph) * 0.7 * e;
          ctx.beginPath();
          ctx.arc(item.x, item.y, r * (0.5 + ph), 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
    }
    ctx.restore();
    return tip && !item._static && p < 1 && STROKE_TYPES.has(item.type) ? { ...tip, color: item.color } : null;
  }

  function textDuration(item) {
    if (item.anim && item.anim !== 'type') return 0.6;
    return Math.min(2.5, 0.3 + String(item.text).length * 0.035);
  }

  // Works out when each item in a step starts. Items play one after another
  // unless an item has `with: true` (then it starts with the previous one).
  function layoutStep(step, stepIndex, scene) {
    // drawn: false (on the scene or the step) = everything in the step fades
    // in together, fully formed. Items can still use `wait` to come in later.
    const isStatic = (step.drawn ?? scene.drawn) === false;
    let end = 0, prevStart = 0;
    (step.items || []).forEach((item, i) => {
      item._static = isStatic;
      prepare(item, stepIndex * 31 + i * 7 + 1);
      const dur = isStatic ? item.duration ?? 0.5 : item.duration ?? (item.type === 'text' ? textDuration(item) : DEFAULT_DUR[item.type] ?? 0.6);
      const start = isStatic ? item.wait || 0 : (item.with ? prevStart : end) + (item.wait || 0);
      item._start = start;
      item._dur = Math.max(0.01, dur);
      prevStart = start;
      end = Math.max(end, start + item._dur);
    });
    step._len = end;
  }

  // ---------- scenes ----------
  const scenes = [{ id: 'blank', title: '✏️ Blank board', steps: [] }, ...(window.WB_SCENES || [])];
  scenes.forEach((s) => s.steps.forEach((step, i) => layoutStep(step, i, s)));

  const player = { scene: scenes[0], step: -1, slide: 0, t0: 0, playing: false, waitingForVoice: false };

  const els = {
    select: document.getElementById('sceneSelect'),
    prev: document.getElementById('prev'),
    play: document.getElementById('play'),
    next: document.getElementById('next'),
    label: document.getElementById('stepLabel'),
    caption: document.getElementById('caption'),
    narrate: document.getElementById('narrate'),
  };

  scenes.forEach((s, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = s.title;
    els.select.appendChild(o);
  });

  function speak(text) {
    if (player.scene.audio === false || !els.narrate.checked || !('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    speechSynthesis.speak(u);
  }

  // Slides: a step with `clear: true` starts a new slide. Each slide has its
  // own drawing layer, so your ink stays with the slide you drew it on.
  function slideOf(stepIndex) {
    let s = 0;
    for (let j = 1; j <= stepIndex; j++) if (player.scene.steps[j].clear) s++;
    return s;
  }
  function slideCount() {
    return player.scene.steps.length ? slideOf(player.scene.steps.length - 1) + 1 : 0;
  }

  function goTo(i, animate = true) {
    const steps = player.scene.steps;
    player.step = clamp(i, -1, steps.length - 1);
    const slide = slideOf(player.step);
    if (slide !== player.slide) {
      stashHistory();
      saveInk();
      player.slide = slide;
      replay.active = false;
      current = null;
      loadInk();
    }
    player.t0 = animate ? now() : -Infinity;
    const step = steps[player.step];
    els.caption.textContent = step ? step.say || '' : player.scene.intro || (steps.length ? 'Press ▶ Play or ⏭ to start the explainer. You can draw on the board at any time.' : 'Draw anything. Pick an explainer from the menu to watch an animation.');
    if (step && animate) speak(step.say);
    updateLabels();
  }

  function updateLabels() {
    const n = player.scene.steps.length;
    if (!n) {
      els.label.textContent = '';
    } else {
      const steps = player.scene.steps;
      const si = Math.max(0, player.step);
      let first = si, last = si;
      while (first > 0 && !steps[first].clear) first--;
      while (last + 1 < n && !steps[last + 1].clear) last++;
      const inSlide = last - first + 1;
      els.label.textContent = `Slide ${player.step < 0 ? 0 : slideOf(si) + 1} / ${slideCount()}` +
        (inSlide > 1 && player.step >= 0 ? ` · part ${si - first + 1}/${inSlide}` : '');
    }
    els.play.textContent = player.playing ? '⏸ Pause' : '▶ Play';
    els.play.disabled = els.prev.disabled = els.next.disabled = n === 0;
  }

  function setPlaying(on) {
    player.playing = on;
    if (on && player.step >= player.scene.steps.length - 1) goTo(0);
    else if (on && player.step < 0) goTo(0);
    if (!on && 'speechSynthesis' in window) speechSynthesis.cancel();
    updateLabels();
  }

  function loadScene(index) {
    stashHistory();
    saveInk();
    player.scene = scenes[index];
    player.playing = false;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    // Scenes with audio: false are always silent, so hide the Narrate toggle.
    els.narrate.parentElement.style.display = player.scene.audio === false ? 'none' : '';
    replay.active = false;
    player.slide = 0;
    loadInk();
    // Slide-based explainers (drawn: false) open straight on slide 1.
    goTo(player.scene.drawn === false && player.scene.steps.length ? 0 : -1, false);
  }

  els.select.addEventListener('change', () => loadScene(+els.select.value));
  els.prev.addEventListener('click', () => { player.playing = false; goTo(player.step - 1, false); });
  els.next.addEventListener('click', () => { player.playing = false; goTo(player.step + 1); });
  els.play.addEventListener('click', () => setPlaying(!player.playing));

  function tickPlayer(t) {
    if (!player.playing) return;
    const step = player.scene.steps[player.step];
    if (!step) return;
    const hold = step.hold ?? 1.5;
    const talking = player.scene.audio !== false && els.narrate.checked && 'speechSynthesis' in window && speechSynthesis.speaking;
    if (t - player.t0 > step._len + hold && !talking) {
      if (player.step < player.scene.steps.length - 1) goTo(player.step + 1);
      else setPlaying(false);
    }
  }

  // ---------- your drawing (ink) ----------
  let strokes = [];
  let undoStack = [];
  let redoStack = [];
  const state = { tool: 'pen', color: 'ink', size: 6 };
  let current = null;
  let inkLoaded = false;

  const storeKey = () => 'wb-ink-' + player.scene.id + (player.slide ? '-s' + player.slide : '');
  const historyBySlide = new Map(); // undo/redo kept per slide while the page is open
  // Call before switching slide/scene: remembers undo/redo for the old one.
  function stashHistory() {
    if (inkLoaded) historyBySlide.set(storeKey(), { undo: undoStack, redo: redoStack });
  }
  function saveInk() {
    if (!inkLoaded) return;
    try { localStorage.setItem(storeKey(), JSON.stringify(strokes)); } catch (_) { /* storage unavailable */ }
  }
  function loadInk() {
    strokes = [];
    const h = historyBySlide.get(storeKey());
    undoStack = h ? h.undo : [];
    redoStack = h ? h.redo : [];
    try {
      const raw = localStorage.getItem(storeKey());
      if (raw) strokes = JSON.parse(raw);
    } catch (_) { strokes = []; }
    inkLoaded = true;
  }

  function snapshot() {
    undoStack.push(strokes.slice());
    if (undoStack.length > 200) undoStack.shift();
    redoStack = [];
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(strokes);
    strokes = undoStack.pop();
    saveInk();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(strokes);
    strokes = redoStack.pop();
    saveInk();
  }

  function shapePts(s) {
    const [a, b] = [s.pts[0], s.pts[s.pts.length - 1]];
    switch (s.kind) {
      case 'line':
      case 'arrow': return [a, b];
      case 'rect': return rectPts(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
      case 'ellipse': return ellipsePts((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]) / 2, Math.abs(b[1] - a[1]) / 2, 0, 64);
      default: return s.pts;
    }
  }

  // Draw one of your strokes. f (0..1) is how much of it to show (for replay).
  function drawStroke(s, f = 1) {
    if (f <= 0) return;
    ctx.save();
    if (s.kind === 'text') {
      ctx.globalAlpha = f;
      ctx.font = `500 ${s.size}px ${FONT}`;
      ctx.fillStyle = col(s.color);
      ctx.textBaseline = 'top';
      String(s.text).split('\n').forEach((line, i) => ctx.fillText(line, s.pts[0][0], s.pts[0][1] + i * s.size * 1.15));
      ctx.restore();
      return;
    }
    const hl = s.kind === 'hl';
    setStroke(s.color, hl ? s.size * 4 : s.size);
    if (hl) {
      ctx.globalAlpha = 0.35;
      ctx.lineCap = 'butt';
    }
    const pts = shapePts(s);
    if (f >= 1 && (s.kind === 'pen' || hl)) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      if (pts.length === 1) ctx.lineTo(pts[0][0] + 0.1, pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      if (pts.length > 1) ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      ctx.stroke();
    } else {
      const P = pts.length === 1 ? [pts[0], [pts[0][0] + 0.1, pts[0][1]]] : pts;
      strokePartial(P, measure(P), f);
    }
    if (s.kind === 'arrow' && f >= 0.85) {
      const [a, b] = pts;
      arrowHead(b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]), Math.max(18, s.size * 3.5), clamp((f - 0.85) / 0.15));
    }
    ctx.restore();
  }

  function toBoard(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }

  function hits(s, x, y, rad) {
    if (s.kind === 'text') {
      const lines = String(s.text).split('\n');
      const w = Math.max(...lines.map((l) => l.length)) * s.size * 0.45;
      const h = lines.length * s.size * 1.15;
      return x >= s.pts[0][0] - rad && x <= s.pts[0][0] + w + rad && y >= s.pts[0][1] - rad && y <= s.pts[0][1] + h + rad;
    }
    const pts = resample(shapePts(s), 6);
    const r = rad + (s.kind === 'hl' ? s.size * 2 : s.size / 2);
    return pts.some(([px, py]) => Math.hypot(px - x, py - y) < r);
  }

  function eraseAt(x, y) {
    const before = strokes.length;
    strokes = strokes.filter((s) => !hits(s, x, y, 14));
    return strokes.length !== before;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const [x, y] = toBoard(e);
    replay.active = false;
    if (state.tool === 'text') return; // handled on click, so the text box keeps focus
    canvas.setPointerCapture(e.pointerId);
    if (state.tool === 'eraser') {
      current = { kind: 'eraser', changed: false, before: strokes.slice() };
      current.changed = eraseAt(x, y);
      return;
    }
    current = { kind: state.tool, color: state.color, size: state.size, pts: [[x, y]], t0: now() };
  });

  canvas.addEventListener('pointermove', (e) => {
    const [px, py] = toBoard(e);
    window.WB.pointer = { x: px, y: py, t: now() };
    if (!current) return;
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events.length ? events : [e]) {
      const [x, y] = toBoard(ev);
      if (current.kind === 'eraser') {
        if (eraseAt(x, y)) current.changed = true;
      } else if (current.kind === 'pen' || current.kind === 'hl') {
        const last = current.pts[current.pts.length - 1];
        if (Math.hypot(x - last[0], y - last[1]) > 1.5) current.pts.push([x, y]);
      } else {
        current.pts = [current.pts[0], [x, y]];
      }
    }
  });

  function finishStroke() {
    if (!current) return;
    if (current.kind === 'eraser') {
      if (current.changed) {
        undoStack.push(current.before);
        redoStack = [];
        saveInk();
      }
    } else {
      const s = { kind: current.kind, color: current.color, size: current.size, pts: current.pts.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]), dur: now() - current.t0 };
      const [a, b] = [s.pts[0], s.pts[s.pts.length - 1]];
      const tiny = s.kind !== 'pen' && s.kind !== 'hl' && Math.hypot(b[0] - a[0], b[1] - a[1]) < 4;
      if (!tiny) {
        snapshot();
        strokes.push(s);
        saveInk();
      }
    }
    current = null;
  }
  canvas.addEventListener('click', (e) => {
    if (state.tool !== 'text') return;
    const [x, y] = toBoard(e);
    openTextEntry(x, y);
  });
  canvas.addEventListener('pointerleave', () => { window.WB.pointer = null; });
  canvas.addEventListener('pointerup', finishStroke);
  canvas.addEventListener('pointercancel', finishStroke);

  function openTextEntry(x, y) {
    const r = canvas.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const size = state.size * 6 + 12;
    const input = document.createElement('input');
    input.className = 'text-entry';
    input.placeholder = 'Type, then Enter';
    input.style.left = r.left - sr.left + (x / W) * r.width + 'px';
    input.style.top = r.top - sr.top + (y / H) * r.height + 'px';
    input.style.fontSize = (size / W) * r.width + 'px';
    input.style.color = col(state.color);
    stage.appendChild(input);
    input.focus();
    let done = false;
    const commit = (keep) => {
      if (done) return;
      done = true;
      if (keep && input.value.trim()) {
        snapshot();
        strokes.push({ kind: 'text', color: state.color, size, text: input.value, pts: [[x, y]], dur: 0.6 });
        saveInk();
      }
      input.remove();
    };
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') commit(true);
      if (ev.key === 'Escape') commit(false);
      ev.stopPropagation();
    });
    input.addEventListener('blur', () => commit(true));
  }

  // ---------- replay your drawing ----------
  const replay = { active: false, t0: 0, plan: [] };
  function startReplay() {
    if (!strokes.length) return;
    player.playing = false;
    updateLabels();
    let t = 0;
    replay.plan = strokes.map((s) => {
      const d = s.kind === 'text' ? 0.5 : s.kind === 'pen' || s.kind === 'hl' ? clamp(s.dur || 0.8, 0.25, 2.5) : 0.5;
      const item = { s, start: t, dur: d };
      t += d + 0.12;
      return item;
    });
    replay.t0 = now();
    replay.active = true;
  }

  // ---------- render loop ----------
  function drawBackground() {
    ctx.fillStyle = '#fdfdfb';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e3e6ec';
    for (let x = 40; x < W; x += 40) for (let y = 40; y < H; y += 40) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }

  function frame() {
    const t = now();
    tickPlayer(t);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawBoard(t);
    if (window.WB.onFrame) window.WB.onFrame(t);
    requestAnimationFrame(frame);
  }

  // Draw the whole board (background, scene, your ink) into a canvas context.
  function renderTo(targetCtx, s, t = now()) {
    const prev = ctx;
    ctx = targetCtx;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    drawBoard(t);
    ctx = prev;
  }

  function drawBoard(t) {
    drawBackground();

    // scene animation
    const steps = player.scene.steps;
    let first = 0;
    for (let i = 0; i <= player.step; i++) if (steps[i].clear) first = i;
    const tips = [];
    for (let i = first; i <= player.step; i++) {
      const elapsed = i < player.step ? Infinity : t - player.t0;
      for (const item of steps[i].items || []) {
        const p = clamp((elapsed - item._start) / item._dur);
        const tip = renderItem(item, p, t);
        if (tip) tips.push(tip);
      }
    }

    // your ink
    if (replay.active) {
      const el = t - replay.t0;
      let finished = true;
      let tip = null;
      for (const r of replay.plan) {
        const f = clamp((el - r.start) / r.dur);
        if (f < 1) finished = false;
        drawStroke(r.s, f);
        if (f > 0 && f < 1 && r.s.kind !== 'text') {
          const P = shapePts(r.s);
          const cum = measure(P);
          if (cum[cum.length - 1] > 0) { const [x, y] = pointAt(P, cum, f); tip = { x, y, color: r.s.color }; }
        }
      }
      if (tip) tips.push(tip);
      if (finished) replay.active = false;
    } else {
      for (const s of strokes) drawStroke(s);
    }
    if (current && current.kind !== 'eraser') drawStroke(current);

    tips.forEach((tip) => drawPenTip(tip, tip.color));
  }

  // ---------- toolbar ----------
  const toolButtons = document.querySelectorAll('[data-tool]');
  function setTool(tool) {
    state.tool = tool;
    toolButtons.forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
    canvas.style.cursor = tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair';
  }
  toolButtons.forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));

  const colorBox = document.getElementById('colors');
  ['ink', 'blue', 'red', 'green', 'orange', 'purple', 'yellow'].forEach((c) => {
    const b = document.createElement('button');
    b.className = 'swatch' + (c === state.color ? ' active' : '');
    b.style.background = COLORS[c];
    b.title = c;
    b.addEventListener('click', () => {
      state.color = c;
      colorBox.querySelectorAll('.swatch').forEach((x) => x.classList.toggle('active', x === b));
    });
    colorBox.appendChild(b);
  });

  document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    state.size = +b.dataset.size;
    document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x === b));
  }));

  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);
  document.getElementById('clearInk').addEventListener('click', () => {
    if (!strokes.length) return;
    snapshot();
    strokes = [];
    saveInk();
  });
  document.getElementById('replay').addEventListener('click', startReplay);
  document.getElementById('export').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = (player.scene.id || 'board') + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  const KEYS = { p: 'pen', h: 'hl', l: 'line', a: 'arrow', r: 'rect', o: 'ellipse', t: 'text', e: 'eraser' };
  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.metaKey || e.ctrlKey) && k === 'y') { e.preventDefault(); redo(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { player.playing = false; goTo(player.step + 1); }
    else if (e.key === 'ArrowLeft') { player.playing = false; goTo(player.step - 1, false); }
    else if (e.key === ' ') { e.preventDefault(); if (player.scene.steps.length) setPlaying(!player.playing); }
    else if (KEYS[k]) setTool(KEYS[k]);
  });

  // Start on the first explainer if there is one, otherwise the blank board.
  // A link like index.html#photosynthesis opens that scene directly.
  const fromHash = scenes.findIndex((s) => '#' + s.id === location.hash);
  const startIndex = fromHash >= 0 ? fromHash : scenes.length > 1 ? 1 : 0;
  els.select.value = startIndex;
  // Hooks used by recorder.js.
  window.WB = { W, H, renderTo, onFrame: null, pointer: null, now, sceneId: () => player.scene.id };

  resize();
  loadScene(startIndex);
  requestAnimationFrame(frame);
})();
