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
  // Font for built-in titles and labels (text items with font: 'sans'). It must
  // also be loaded in index.html (Google Fonts link) with weights 600 and 700.
  const LABEL_FONT = window.WB_LABEL_FONT || 'Lexend';
  const SANS = `"${LABEL_FONT}", system-ui, -apple-system, sans-serif`;

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
  // Also refit when the space around the board changes (toolbar wrapping, timeline growing).
  if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(stage);

  // ---------- zoom & pan ----------
  // `view` is what's shown: zoom z (1 = whole slide) and the board point at
  // the top-left corner. `target` is where the view is gliding to.
  const MAX_ZOOM = 6;
  const view = { z: 1, x: 0, y: 0 };
  const target = { z: 1, x: 0, y: 0 };
  function clampView(v) {
    v.z = clamp(v.z, 1, MAX_ZOOM);
    v.x = clamp(v.x, 0, W - W / v.z);
    v.y = clamp(v.y, 0, H - H / v.z);
    return v;
  }
  const viewMatrix = (s) => [s * view.z, 0, 0, s * view.z, -view.x * s * view.z, -view.y * s * view.z];
  // Zoom by `factor`, keeping board point (bx, by) under the same spot on screen.
  function zoomAt(factor, bx, by, instant) {
    const nz = clamp(target.z * factor, 1, MAX_ZOOM);
    target.x = bx - ((bx - target.x) * target.z) / nz;
    target.y = by - ((by - target.y) * target.z) / nz;
    target.z = nz;
    clampView(target);
    if (instant) Object.assign(view, target);
  }
  const viewCenter = () => [target.x + W / target.z / 2, target.y + H / target.z / 2];
  function zoomFit(instant) {
    Object.assign(target, { z: 1, x: 0, y: 0 });
    if (instant) Object.assign(view, target);
  }
  let lastFrame = 0;
  function stepView(t) {
    const dt = Math.min(0.1, t - lastFrame || 0.016);
    lastFrame = t;
    const k = 1 - Math.pow(0.00005, dt); // smooth glide that settles in about half a second
    for (const p of ['z', 'x', 'y']) {
      view[p] += (target[p] - view[p]) * k;
      if (Math.abs(target[p] - view[p]) < (p === 'z' ? 0.002 : 0.3)) view[p] = target[p];
    }
    const label = document.getElementById('zoomLabel');
    const pct = Math.round(target.z * 100) + '%';
    if (label && label.textContent !== pct) label.textContent = pct;
  }

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
  const ION_STYLES = {
    na: { fill: '#f0a12e', stroke: '#a8640a', text: 'Na⁺', r: 18 },
    k: { fill: '#7b5cd6', stroke: '#47309a', text: 'K⁺', r: 18 },
    cl: { fill: '#39a866', stroke: '#1d6a3c', text: 'Cl⁻', r: 18 },
    a: { fill: '#8f96a3', stroke: '#545b68', text: 'A⁻', r: 24 },
    ca: { fill: '#e0559a', stroke: '#9c1f5c', text: 'Ca²⁺', r: 20 },
    pos: { fill: '#f26b5b', stroke: '#a8281a', text: '+', r: 15, big: true },
    neg: { fill: '#5b8def', stroke: '#1d4fb0', text: '−', r: 15, big: true },
  };

  // Live values (e.g. a membrane potential or how open a channel is). Slide
  // actions animate them with items { type: 'value', id, from, to, at, duration }.
  // The most recently started segment wins; before any segment it's `base`.
  function liveValue(id, base, t) {
    let v = base, best = -Infinity;
    for (const a of slideActions()) {
      if (!actionRuns.has(a.id)) continue;
      const t0 = actionRuns.get(a.id);
      for (const it of a.items) {
        if (it.type !== 'value' || it.id !== id) continue;
        const s = t0 + it._start;
        if (t >= s && s >= best) {
          best = s;
          const k = clamp((t - s) / it._dur);
          v = it.from + (it.to - it.from) * (it.linear ? k : easeInOut(k));
        }
      }
    }
    return v;
  }

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
      case 'vesicle':
      case 'ion':
        pts = item.path ? (item.smooth ? catmull(item.path, false) : item.path.slice()) : null;
        break;
    }
    if (pts) {
      if (item.type === 'mover' || item.type === 'vesicle' || item.type === 'ion') {
        item._pts = resample(pts, 6);
      } else {
        item._pts = item.rough === false || item._static ? resample(pts, 10) : wobble(resample(pts, 12), seed);
      }
      item._cum = measure(item._pts);
    }
    if (item.type === 'text') item._lines = String(item.text).split('\n');
    if ((item.type === 'svg' || item.type === 'inset') && !item._img) {
      item._img = new Image();
      item._img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(item.svg);
    }
  }

  // ---------- picture cache ----------
  // Drawing an SVG picture onto a canvas makes Chrome redraw it from its vector shapes, and Chrome only
  // keeps a few ready-made copies. With the screen and the 1920x1080 recording each needing their own
  // size, those copies get thrown away and redrawn now and then, which shows as stutter. So each picture
  // is drawn once per size into its own small canvas (cropped to where the picture actually has
  // something), and that canvas is reused every frame. Least recently used copies are dropped when the
  // total gets big, so memory stays bounded.
  const svgCache = new Map(); // key -> { canvas, px, used }
  let svgCachePx = 0;
  const SVG_CACHE_MAX_PX = 48e6; // about 190 MB of pixels
  let svgCacheTick = 0;
  // Working out where a picture has content needs a read-back from the GPU, which would stall a frame,
  // so it's done in idle time: when a slide is shown, all its pictures (and those of its animation
  // buttons) are queued. Until a picture is ready it's simply drawn the normal way.
  const bboxQueue = new Set();
  let bboxBusy = false;
  const idle = window.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8 }), 30));
  function queueSvgPrep(items) {
    for (const it of items) {
      if ((it.type !== 'svg' && it.type !== 'inset') || it._bbox || (it.until !== undefined && it.until < 0.5)) continue;
      if (it.svg.length > 15000 || /<filter/.test(it.svg)) bboxQueue.add(it);
    }
    if (bboxQueue.size && !bboxBusy) { bboxBusy = true; idle(prepSvgs, { timeout: 400 }); }
  }
  function prepSvgs(deadline) {
    let n = 0;
    for (const it of bboxQueue) {
      if (n++ >= 2 && deadline.timeRemaining() < 4) break; // always do a couple, even on a busy page
      const img = it._img;
      if (!img || !img.complete) continue; // still loading: try again later
      if (img.naturalWidth) svgBounds(it, img, it.x || 0, it.y || 0, it.w || W, it.h || H);
      bboxQueue.delete(it);
    }
    if (bboxQueue.size) idle(prepSvgs, { timeout: 400 }); else bboxBusy = false;
  }
  function svgBounds(item, img, x, y, w, h) {
    if (item._bbox) return item._bbox;
    let bb = [x, y, w, h];
    try {
      const k = 1 / 6, cw = Math.max(1, Math.ceil(w * k)), ch = Math.max(1, Math.ceil(h * k));
      const c = document.createElement('canvas'); c.width = cw; c.height = ch;
      const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0, cw, ch);
      const d = cx.getImageData(0, 0, cw, ch).data;
      let x0 = cw, y0 = ch, x1 = -1, y1 = -1;
      for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) if (d[(j * cw + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      if (x1 < 0) bb = [x, y, 0, 0];
      else {
        const pad = 14;
        const bx = Math.max(x, x + x0 / k - pad), by = Math.max(y, y + y0 / k - pad);
        bb = [bx, by, Math.min(x + w, x + (x1 + 1) / k + pad) - bx, Math.min(y + h, y + (y1 + 1) / k + pad) - by];
      }
    } catch (_) { /* can't read it: cache the whole rect */ }
    item._bbox = bb;
    return bb;
  }
  function dropSvgCache(e) {
    if (!svgCache.delete(e)) return;
    svgCachePx -= e.px;
    if (e.item._cache === e) e.item._cache = null;
    if (e.item._cache2 === e) e.item._cache2 = null;
    e.canvas.width = e.canvas.height = 0; // free its memory now
  }
  function drawSvgCached(c, item, x, y, w, h) {
    const img = item._img;
    const m = c.getTransform();
    const dev = Math.hypot(m.a, m.b) || 1;
    const sc = Math.min(6, Math.round(dev * 1000) / 1000); // the exact device scale: no resampling, so it looks identical
    // a picture that keeps being drawn (e.g. a slide's background) is prepared right away on its 4th draw;
    // short-lived ones (animation frames) are prepared in idle time and drawn directly meanwhile
    // Only heavy pictures (big, or with shadow/blur effects) are worth caching; simple ones are cheaper to
    // draw directly. Frames of a frame-by-frame animation (shown for under half a second) aren't either.
    if (item._heavy === undefined) item._heavy = item.svg.length > 15000 || /<filter/.test(item.svg);
    if (!item._heavy || (item.until !== undefined && item.until < 0.5)) { c.drawImage(img, x, y, w, h); return; }
    if (!item._bbox && (item._draws = (item._draws || 0) + 1) > 3) svgBounds(item, img, x, y, w, h);
    if (!item._bbox) { queueSvgPrep([item]); c.drawImage(img, x, y, w, h); return; }
    const [bx0, by0, bw0, bh0] = item._bbox;
    if (bw0 <= 0 || bh0 <= 0) return;
    // line the copy up with the device pixel grid (so it is drawn 1:1, not blurred by sub-pixel filtering)
    const bx = Math.floor(bx0 * sc) / sc, by = Math.floor(by0 * sc) / sc;
    const cw = Math.ceil((bx0 + bw0 - bx) * sc), ch = Math.ceil((by0 + bh0 - by) * sc);
    const bw = cw / sc, bh = ch / sc;
    if (cw * ch > 12e6) { c.drawImage(img, x, y, w, h); return; } // hugely zoomed in: draw it directly
    let entry = item._cache && item._cache.sc === sc ? item._cache : item._cache2 && item._cache2.sc === sc ? item._cache2 : null;
    if (!entry) {
      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      canvas.getContext('2d').drawImage(img, (x - bx) * sc, (y - by) * sc, w * sc, h * sc);
      entry = { canvas, sc, px: cw * ch, used: 0, item };
      // keep up to two sizes per picture (screen + recording); drop this picture's oldest size
      if (item._cache2) dropSvgCache(item._cache2);
      item._cache2 = item._cache;
      item._cache = entry;
      svgCache.set(entry, true);
      svgCachePx += entry.px;
      if (svgCachePx > SVG_CACHE_MAX_PX) {
        for (const e of [...svgCache.keys()].sort((p, q) => p.used - q.used)) {
          if (svgCachePx <= SVG_CACHE_MAX_PX * 0.8) break;
          if (e !== entry) dropSvgCache(e);
        }
      }
    } else if (entry === item._cache2) { item._cache2 = item._cache; item._cache = entry; } // most recent first
    entry.used = ++svgCacheTick;
    c.drawImage(entry.canvas, bx, by, bw, bh);
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
    // Moving ions/vesicles wait, visible, at their start until their trip begins.
    if (p <= 0 && !((item.type === 'ion' || item.type === 'vesicle') && item._pts)) return null;
    // Static items (scene option drawn: false) fade in fully formed instead of
    // being drawn stroke by stroke.
    // `solid: true`: no fade-in (shown at full strength as soon as it starts), e.g. frame-by-frame animations
    const base = item._static ? (item.solid ? (p > 0 ? 1 : 0) : easeInOut(p)) : 1;
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
          if (!show) return;
          const ly = item.y + i * size * 1.15;
          if (item.stroke) {
            // outline (drawn first, so the fill sits on top)
            ctx.save();
            ctx.strokeStyle = col(item.stroke);
            ctx.lineWidth = item.strokeWidth || size * 0.12;
            ctx.lineJoin = 'round';
            ctx.strokeText(show, item.x, ly);
            ctx.restore();
          }
          if (item.glow) {
            ctx.save();
            ctx.shadowColor = col(item.glow);
            ctx.shadowBlur = item.glowSize || size * 0.35;
            ctx.fillText(show, item.x, ly);
            ctx.restore();
          }
          ctx.fillText(show, item.x, ly);
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
      case 'inset': {
        // A small picture that blows up to fill the slide when hovered for 1 s
        // (see updateInsets). Its svg's viewBox is the rect x, y, w, h.
        frameInsets.push(item);
        const img = item._img;
        if (img && img.complete && img.naturalWidth) drawSvgCached(ctx, item, item.x, item.y, item.w, item.h);
        break;
      }
      case 'svg': {
        const img = item._img;
        if (img && img.complete && img.naturalWidth) drawSvgCached(ctx, item, item.x || 0, item.y || 0, item.w || W, item.h || H);
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
        if (item.once && item.vanish && p >= 1) break; // arrived: gone
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
      case 'vesicle': {
        // A vesicle (bubble of neurotransmitters). With a `path` it travels to
        // the membrane in the first 60% of its time; with `fuse` it then merges
        // into the membrane and disappears.
        let x = item.x, y = item.y, k = 1;
        if (item._pts) {
          [x, y] = pointAt(item._pts, item._cum, easeInOut(clamp(p / (item.fuse ? 0.6 : 1))));
          if (item.fuse) k = 1 - clamp((p - 0.6) / 0.4);
        }
        if (k <= 0 || (!item._pts && p <= 0)) break;
        const rr = (item.r || 11) * (0.55 + 0.45 * k);
        ctx.globalAlpha = base * Math.min(1, k * 1.4);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.strokeStyle = col(item.color || '#5e2f78');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = col(item.dot || '#f08c1a');
        for (const [a, b] of [[-4, -3], [4, -2], [0, 4]]) {
          ctx.beginPath();
          ctx.arc(x + a * (rr / 11), y + b * (rr / 11), 2.6 * Math.max(1, rr / 15), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'ion': {
        // An ion: a coloured ball with its symbol. With `path` it travels along
        // it (eased) and stays at the end; before it starts it waits at the start.
        const st = ION_STYLES[item.ion] || ION_STYLES.na;
        let x = item.x, y = item.y;
        if (item._pts && item.loop) {
          // travel the path over and over (every `loop` seconds), fading at both ends
          const f = ((((t - (item.phase || 0)) / item.loop) % 1) + 1) % 1;
          [x, y] = pointAt(item._pts, item._cum, f);
          ctx.globalAlpha = base * Math.min(1, Math.sin(Math.PI * f) * 3);
        } else if (item._pts) [x, y] = pointAt(item._pts, item._cum, easeInOut(clamp(p)));
        else if (p <= 0) break;
        const rr = item.r || st.r;
        ctx.fillStyle = st.fill;
        ctx.strokeStyle = st.stroke;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${Math.round(rr * (st.big ? 1.7 : st.text.length > 3 ? 0.68 : 0.82))}px ${SANS}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.text, x, y + 1);
        break;
      }
      case 'channel': {
        // A ligand-gated ion channel spanning the membrane. Its opening (0-1)
        // comes from live value `id`, which slide actions can animate.
        const open = clamp(item.id ? liveValue(item.id, item.open ?? 0, t) : item.open ?? 0);
        const cx = item.x, cy = item.y, hh = (item.h || 130) / 2;
        const gap = 22 + 16 * open, sw = 34;
        const fill = item.fill || '#7fb7e8', edge = item.edge || '#2c5a92';
        for (const sx of [cx - gap / 2 - sw, cx + gap / 2]) {
          ctx.fillStyle = fill;
          ctx.strokeStyle = edge;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(sx, cy - hh, sw, hh * 2, 14);
          ctx.fill();
          ctx.stroke();
        }
        // binding site for the neurotransmitter (a notch on the outer side);
        // voltage-gated channels (ligand: false) show a voltage sensor instead
        ctx.strokeStyle = edge;
        ctx.lineWidth = 3;
        if (item.plain) {
          // leak channel: no gate sensor, no binding site
        } else if (item.ligand === false) {
          ctx.fillStyle = edge;
          ctx.font = `700 20px ${SANS}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', cx - gap / 2 - sw / 2, cy);
          ctx.fillText('+', cx + gap / 2 + sw / 2, cy);
        } else {
          ctx.beginPath();
          ctx.arc(cx - gap / 2 - sw / 2, cy - hh - 1, 8, 0, Math.PI);
          ctx.stroke();
        }
        // the gate closing the pore
        if (open < 1) {
          ctx.globalAlpha = base * (1 - open);
          ctx.fillStyle = edge;
          ctx.beginPath();
          ctx.roundRect(cx - gap / 2 - 2, cy - hh + 22, gap + 4, 10, 4);
          ctx.fill();
          ctx.globalAlpha = base;
        }
        // inactivation gate: a ball on a chain that plugs the pore from the inside
        let inact = 0;
        if (item.inactId) {
          inact = clamp(liveValue(item.inactId, 0, t));
          const anchor = [cx - gap / 2 - sw / 2, cy + hh];
          const rest = [cx - gap / 2 - sw - 14, cy + hh + 26], plug = [cx, cy + hh - 4];
          const e2 = easeInOut(inact);
          const bx = rest[0] + (plug[0] - rest[0]) * e2, by = rest[1] + (plug[1] - rest[1]) * e2;
          ctx.strokeStyle = edge;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(anchor[0], anchor[1]);
          ctx.quadraticCurveTo((anchor[0] + bx) / 2 - 6, Math.max(anchor[1], by) + 14, bx, by);
          ctx.stroke();
          ctx.fillStyle = edge;
          ctx.beginPath();
          ctx.arc(bx, by, 9, 0, Math.PI * 2);
          ctx.fill();
        }
        if (item.label) {
          const state = inact > 0.5 ? ' (inactivated)' : open > 0.5 ? ' (open)' : ' (closed)';
          const lines = String(item.label).split('\n');
          ctx.fillStyle = '#1f2430';
          ctx.font = `600 22px ${SANS}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          lines.forEach((ln, i) => ctx.fillText(ln + (i === lines.length - 1 ? state : ''), cx, cy + hh + 24 + (item.inactId ? 30 : 0) + i * 26));
        }
        break;
      }
      case 'apwave': {
        // An action potential travelling along a (straight, horizontal) axon.
        // Each site (unmyelinated patch or node of Ranvier) fires the waveform
        // `wave` at its own time; between sites the voltage is interpolated.
        // Draws: a graph of voltage vs position above the axon (aligned in x),
        // and at every site Na+ (top) / K+ (bottom) channels opening, ions
        // crossing and a glow. Time = live value `id` (-1 = idle).
        const cur = liveValue(item.id, -1, t);
        const idle = cur < 0;
        const wk = item.wave;
        const wave = (tau, keys = wk) => {
          if (tau <= keys[0][0]) return keys[0][1];
          for (let i = 1; i < keys.length; i++) {
            if (tau <= keys[i][0]) {
              const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
              return v0 + (v1 - v0) * easeInOut(clamp((tau - t0) / (t1 - t0)));
            }
          }
          return keys[keys.length - 1][1];
        };
        const sites = item.sites;
        const vSite = (i) => (idle ? wk[0][1] : wave(cur - sites[i].t, sites[i].wave || wk)); // a site may have its own waveform
        const vAtX = (x) => {
          if (x <= sites[0].x) return vSite(0);
          for (let i = 1; i < sites.length; i++) {
            if (x <= sites[i].x) {
              const f = (x - sites[i - 1].x) / (sites[i].x - sites[i - 1].x);
              return vSite(i - 1) + (vSite(i) - vSite(i - 1)) * f;
            }
          }
          return vSite(sites.length - 1);
        };
        // --- graph strip ---
        const { gx0, gx1, gy, gh } = item;
        const vmin = -90, vmax = 40;
        const Y = (v) => gy + ((vmax - v) / (vmax - vmin)) * gh;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d9dce3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(gx0 - 70, gy - 44, gx1 - gx0 + 90, gh + 64, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1f2430';
        ctx.font = `600 22px ${SANS}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.title || 'Membrane potential along the axon (right now)', gx0 - 50, gy - 22);
        ctx.font = `600 15px ${SANS}`;
        ctx.textAlign = 'right';
        for (const [val, txt, c, dash] of [[30, '+30', '#8a8f98', [2, 5]], [0, '0', '#8a8f98', [8, 6]], [-55, '−55', '#e0453a', [10, 6]], [-70, '−70', '#5b6270', [3, 5]]]) {
          ctx.strokeStyle = c;
          ctx.lineWidth = 1.5;
          ctx.setLineDash(dash);
          ctx.beginPath();
          ctx.moveTo(gx0, Y(val));
          ctx.lineTo(gx1, Y(val));
          ctx.stroke();
          ctx.fillStyle = c;
          ctx.fillText(txt, gx0 - 8, Y(val));
        }
        ctx.setLineDash([]);
        ctx.fillStyle = '#8a8f98';
        ctx.fillText('mV', gx0 - 38, gy + 4);
        // dotted guides from each node down to the axon
        ctx.strokeStyle = '#d4d8e0';
        ctx.setLineDash([3, 6]);
        ctx.lineWidth = 1.5;
        for (const s of sites) {
          if (!s.node) continue;
          ctx.beginPath();
          ctx.moveTo(s.x, gy + gh + 2);
          ctx.lineTo(s.x, item.axonY - item.axonR - 26);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        // the voltage profile, with the part above rest shaded
        const pts = [];
        for (let x = gx0; x <= gx1; x += 3) pts.push([x, Y(vAtX(x))]);
        ctx.fillStyle = 'rgba(224,69,58,0.14)';
        ctx.beginPath();
        ctx.moveTo(gx0, Y(-70));
        pts.forEach(([x, y]) => ctx.lineTo(x, Math.min(y, Y(-70))));
        ctx.lineTo(gx1, Y(-70));
        ctx.fill();
        ctx.strokeStyle = '#2f6fde';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        // --- channels and ions at each site ---
        const ay = item.axonY, ar = item.axonR;
        sites.forEach((s, i) => {
          if (s.hidden) return; // a site that only shapes the graph
          const tau = idle ? -99 : cur - s.t;
          const v = vSite(i);
          // phases come from the waveform: rising (Na+ open) until the peak, falling (K+ open) until the low point
          const tPeak = wk.reduce((m, k) => (k[1] > m[1] ? k : m))[0];
          const tLow = wk.reduce((m, k) => (k[1] < m[1] ? k : m))[0];
          const naOpen = tau > -0.05 && tau < tPeak + 0.05 ? 1 : 0;
          const kOpen = tau > tPeak - 0.02 && tau < tLow + 0.25 ? 1 : 0;
          // glow where the membrane is depolarized
          const heat = clamp((v + 60) / 80);
          if (heat > 0) {
            ctx.globalAlpha = base * heat * 0.75;
            ctx.fillStyle = '#ff5a36';
            ctx.shadowColor = '#ff5a36';
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.arc(s.x, ay, ar + 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = base;
          }
          const chan = (cy, open, st) => {
            const g = 4 + 6 * open, sw = 7, hh = 11;
            ctx.fillStyle = st.fill;
            ctx.strokeStyle = st.edge;
            ctx.lineWidth = 2;
            for (const sx of [s.x - g / 2 - sw, s.x + g / 2]) {
              ctx.beginPath();
              ctx.roundRect(sx, cy - hh, sw, hh * 2, 3);
              ctx.fill();
              ctx.stroke();
            }
          };
          chan(ay - ar, naOpen, item.naStyle);
          if (item.kStyle) chan(ay + ar, kOpen, item.kStyle); // kStyle: null = only one channel type
          // Na+ in through the top, K+ out through the bottom
          const dot = (x, y, c, plus) => {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(x, y, plus ? 7 : 4.5, 0, Math.PI * 2);
            ctx.fill();
            if (plus) {
              ctx.fillStyle = '#ffffff';
              ctx.font = `700 12px ${SANS}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('+', x, y + 0.5);
            }
          };
          const tPk = wk.reduce((m, k) => (k[1] > m[1] ? k : m))[0];
          const tLo = wk.reduce((m, k) => (k[1] < m[1] ? k : m))[0];
          if (tau > 0 && tau < tPk + 0.25) {
            const f = tau / (tPk + 0.25);
            const pl = item.naStyle.plus;
            dot(s.x - 2, ay - ar - 30 + f * (ar + 22), item.naStyle.dot, pl);
            if (f > 0.3 && !pl) dot(s.x + 2, ay - ar - 26 + (f - 0.3) * (ar + 18), item.naStyle.dot);
          }
          if (item.kStyle && tau > tPk && tau < tLo + 0.3) {
            const f = (tau - tPk) / (tLo + 0.3 - tPk);
            dot(s.x + 2, ay + ar - 8 + f * 34, item.kStyle.dot);
            if (f > 0.3) dot(s.x - 2, ay + ar - 8 + (f - 0.3) * 34, item.kStyle.dot);
          }
        });
        break;
      }
      case 'stepper': {
        // A numbered list of steps; the one matching live value `id` (seconds,
        // -1 = idle) is highlighted and explained underneath.
        const { x, y, w, h } = item;
        const cur = liveValue(item.id, -1, t);
        const idx = cur < 0 ? -1 : item.steps.findIndex((s) => cur >= s.from && cur < s.to);
        const now = idx < 0 && cur >= 0 ? item.steps.length - 1 : idx;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d9dce3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 18);
        ctx.fill();
        ctx.stroke();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1f2430';
        ctx.font = `600 26px ${SANS}`;
        ctx.fillText(item.title || 'What happens', x + w / 2, y + 38);
        item.steps.forEach((s, i) => {
          const ry = y + 92 + i * (item.rowH || 52);
          const on = i === now, done = cur >= 0 && i < now;
          if (on) {
            ctx.fillStyle = '#fff1e0';
            ctx.beginPath();
            ctx.roundRect(x + 14, ry - 22, w - 28, 44, 10);
            ctx.fill();
          }
          ctx.fillStyle = on ? (s.color || '#e0453a') : done ? '#8a8f98' : '#c3cad6';
          ctx.beginPath();
          ctx.arc(x + 40, ry, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = `700 16px ${SANS}`;
          ctx.textAlign = 'center';
          ctx.fillText(String(i + 1), x + 40, ry + 1);
          ctx.fillStyle = on ? '#1f2430' : done ? '#5b6270' : '#8a8f98';
          ctx.font = `${on ? 700 : 600} 21px ${SANS}`;
          ctx.textAlign = 'left';
          ctx.fillText(s.title, x + 66, ry);
        });
        const dy = y + 92 + item.steps.length * (item.rowH || 52) + 18;
        ctx.strokeStyle = '#e3e6ec';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 20, dy);
        ctx.lineTo(x + w - 20, dy);
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.fillStyle = '#3b4252';
        ctx.font = `500 20px ${SANS}`;
        String(now >= 0 ? item.steps[now].text : item.idleText || '').split('\n').forEach((ln, i) => ctx.fillText(ln, x + 24, dy + 34 + i * 27));
        break;
      }
      case 'charges': {
        // + / - signs along both faces of a membrane. They flip when the inside
        // becomes positive (live value `id` above 0 mV) and fade near 0 mV.
        const v = liveValue(item.id, item.value ?? -70, t);
        const k = clamp(Math.abs(v) / 25);
        const insidePos = v > 0;
        ctx.globalAlpha = base * k;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 24px ${SANS}`;
        for (let x = item.x0 + 35; x < item.x1 - 10; x += item.step || 70) {
          ctx.fillStyle = insidePos ? '#2f6fde' : '#e0453a';
          ctx.fillText(insidePos ? '−' : '+', x, item.top - 16);
          ctx.fillStyle = insidePos ? '#e0453a' : '#2f6fde';
          ctx.fillText(insidePos ? '+' : '−', x, item.bot + 16);
        }
        break;
      }
      case 'apgraph': {
        // A full action-potential curve with phases. A cursor traces it at the
        // time given by live value `id` (seconds into the curve, -1 = idle).
        const { x, y, w, h } = item;
        const keys = item.keys, T = keys[keys.length - 1][0];
        const vAt = (tt) => {
          for (let i = 1; i < keys.length; i++) {
            if (tt <= keys[i][0]) {
              const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
              return v0 + (v1 - v0) * easeInOut(clamp((tt - t0) / (t1 - t0 || 1)));
            }
          }
          return keys[keys.length - 1][1];
        };
        const cur = liveValue(item.id, -1, t);
        const idle = cur < 0;
        const v = idle ? keys[0][1] : vAt(cur);
        const phaseNow = idle ? null : item.phases.find((ph) => cur >= ph.from && cur < ph.to) || item.phases[item.phases.length - 1];
        // panel
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d9dce3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 18);
        ctx.fill();
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1f2430';
        ctx.font = `600 26px ${SANS}`;
        ctx.fillText(item.title || 'Membrane potential', x + w / 2, y + 34);
        const rv = Math.round(v);
        ctx.fillStyle = rv >= -55 ? '#e0453a' : rv < -70 ? '#2f6fde' : rv > -70 ? '#e8890c' : '#1f2430';
        ctx.font = `700 60px ${SANS}`;
        ctx.fillText(`${rv < 0 ? '−' : rv > 0 ? '+' : ''}${Math.abs(rv)} mV`, x + w / 2, y + 88);
        // graph area
        const vmin = -90, vmax = 40;
        const gx = x + 66, gy = y + 136, gw = w - 90, gh = item.graphH || 300;
        const X = (tt) => gx + (tt / T) * gw;
        const Y = (val) => gy + ((vmax - val) / (vmax - vmin)) * gh;
        for (const ph of item.phases) {
          ctx.fillStyle = ph.color;
          ctx.globalAlpha = base * (phaseNow === ph ? 0.32 : 0.1);
          ctx.fillRect(X(ph.from), gy, X(ph.to) - X(ph.from), gh);
        }
        ctx.globalAlpha = base;
        ctx.strokeStyle = '#c9ced8';
        ctx.lineWidth = 2;
        ctx.strokeRect(gx, gy, gw, gh);
        ctx.font = `600 16px ${SANS}`;
        ctx.textAlign = 'right';
        for (const [val, txt, c, dash] of [[30, '+30', '#8a8f98', [2, 5]], [0, '0', '#8a8f98', [8, 6]], [-55, '−55', '#e0453a', [10, 6]], [-70, '−70', '#5b6270', [3, 5]], [-80, '−80', '#8a8f98', [2, 5]]]) {
          ctx.strokeStyle = c;
          ctx.setLineDash(dash);
          ctx.beginPath();
          ctx.moveTo(gx, Y(val));
          ctx.lineTo(gx + gw, Y(val));
          ctx.stroke();
          ctx.fillStyle = c;
          ctx.fillText(txt, gx - 8, Y(val));
        }
        ctx.setLineDash([]);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e0453a';
        ctx.fillText('threshold', gx + 6, Y(-55) - 11);
        ctx.fillStyle = '#8a8f98';
        ctx.fillText('mV', gx - 50, gy + 10);
        ctx.textAlign = 'right';
        ctx.fillText('time →', gx + gw - 4, gy + gh + 16);
        // the whole curve, faint, then the part traced so far, bold
        const trace = (upTo, colr, width) => {
          ctx.strokeStyle = colr;
          ctx.lineWidth = width;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          const N = 200;
          for (let i = 0; i <= N; i++) {
            const tt = (i / N) * upTo;
            i ? ctx.lineTo(X(tt), Y(vAt(tt))) : ctx.moveTo(X(tt), Y(vAt(tt)));
          }
          ctx.stroke();
        };
        trace(T, '#c3cad6', 4);
        if (!idle) trace(Math.min(cur, T), '#2f6fde', 5);
        // phase numbers on the curve
        item.phases.forEach((ph, i) => {
          if (ph.mark === undefined) return;
          const [mx, my] = [X(ph.mark[0]), Y(ph.mark[1])];
          ctx.fillStyle = ph.dot || '#3b4252';
          ctx.beginPath();
          ctx.arc(mx, my, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = `700 15px ${SANS}`;
          ctx.textAlign = 'center';
          ctx.fillText(String(i + 1), mx, my + 1);
        });
        if (!idle) {
          ctx.strokeStyle = '#1f2430';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(X(Math.min(cur, T)), gy);
          ctx.lineTo(X(Math.min(cur, T)), gy + gh);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#1f2430';
          ctx.beginPath();
          ctx.arc(X(Math.min(cur, T)), Y(v), 8, 0, Math.PI * 2);
          ctx.fill();
        }
        // caption for the current phase, then the list of phases
        const cy0 = gy + gh + 44;
        ctx.textAlign = 'left';
        ctx.fillStyle = phaseNow ? phaseNow.dot : '#5b6270';
        ctx.font = `700 24px ${SANS}`;
        ctx.fillText(phaseNow ? `${item.phases.indexOf(phaseNow) + 1}. ${phaseNow.title}` : item.idleText || 'Press ▶ to fire an action potential', x + 26, cy0);
        ctx.fillStyle = '#3b4252';
        ctx.font = `500 20px ${SANS}`;
        String(phaseNow ? phaseNow.text : '').split('\n').forEach((ln, i) => ctx.fillText(ln, x + 26, cy0 + 34 + i * 26));
        break;
      }
      case 'meter': {
        // Live membrane-potential readout: number + graph of the last few seconds.
        const vmin = item.min ?? -90, vmax = item.max ?? 40, base0 = item.value ?? -70;
        const v = liveValue(item.id, base0, t);
        const { x, y, w, h } = item;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d9dce3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 18);
        ctx.fill();
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1f2430';
        ctx.font = `600 28px ${SANS}`;
        ctx.fillText(item.title || 'Membrane potential', x + w / 2, y + 38);
        const rounded = Math.round(v);
        // With `fireText`, reaching threshold shows it in red (an action potential).
        const fired = item.fireText && v >= (item.threshold ?? -55);
        const stateCol = fired ? '#e0453a' : rounded > base0 ? '#e8890c' : rounded < base0 ? '#2f6fde' : '#1f2430';
        ctx.fillStyle = stateCol;
        ctx.font = `700 72px ${SANS}`;
        ctx.fillText(`${rounded < 0 ? '−' : rounded > 0 ? '+' : ''}${Math.abs(rounded)} mV`, x + w / 2, y + 108);
        ctx.font = `600 20px ${SANS}`;
        ctx.fillText(fired ? item.fireText : rounded > base0 ? item.upText || 'Depolarized (less negative)' : rounded < base0 ? item.downText || 'Hyperpolarized (more negative)' : item.restText || 'Resting potential', x + w / 2, y + 160);
        // graph
        const gx = x + 74, gy = y + 196, gw = w - 98, gh = item.graphH || 260;
        const Y = (val) => gy + ((vmax - clamp(val, vmin, vmax)) / (vmax - vmin)) * gh;
        ctx.strokeStyle = '#c9ced8';
        ctx.lineWidth = 2;
        ctx.strokeRect(gx, gy, gw, gh);
        const refs = [[0, '0', '#8a8f98', [8, 6]], [-55, '−55', '#e0453a', [10, 6]], [-70, '−70', '#5b6270', [3, 5]]];
        ctx.font = `600 17px ${SANS}`;
        ctx.textAlign = 'right';
        for (const [val, txt, c, dash] of refs) {
          ctx.strokeStyle = c;
          ctx.setLineDash(dash);
          ctx.beginPath();
          ctx.moveTo(gx, Y(val));
          ctx.lineTo(gx + gw, Y(val));
          ctx.stroke();
          ctx.fillStyle = c;
          ctx.fillText(txt, gx - 8, Y(val));
        }
        ctx.setLineDash([]);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e0453a';
        ctx.fillText('threshold', gx + 6, Y(-55) - 12);
        ctx.fillStyle = '#5b6270';
        ctx.fillText('resting', gx + 6, Y(-70) + (item.marks ? -11 : 14));
        ctx.fillStyle = '#8a8f98';
        ctx.fillText('mV', gx - 52, gy + 10);
        // equilibrium potentials (or any other reference values), labelled on the right
        ctx.textAlign = 'right';
        for (const m of item.marks || []) {
          ctx.strokeStyle = m.color;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(gx, Y(m.v));
          ctx.lineTo(gx + gw, Y(m.v));
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = m.color;
          ctx.font = `700 16px ${SANS}`;
          ctx.fillText(m.label, gx + gw - 6, Y(m.v) + (m.dy ?? -10));
        }
        // trace over the last `window` seconds (animation time)
        const win = item.window || 8, N = 160;
        ctx.strokeStyle = '#2f6fde';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const tt = t - win + (i / N) * win;
          const px = gx + (i / N) * gw, py = Y(liveValue(item.id, base0, tt));
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
        ctx.fillStyle = stateCol;
        ctx.beginPath();
        ctx.arc(gx + gw, Y(v), 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'hotspot':
      case 'value':
        break; // drives a live value / is an invisible click target (see liveValue); draws nothing
      case 'flash': {
        if (p <= 0 || p >= 1) break;
        const fr = (item.r || 40) * (0.4 + 0.8 * p);
        const c = col(item.color || 'orange');
        ctx.globalAlpha = base * (1 - p);
        ctx.fillStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 30;
        ctx.globalAlpha = base * (1 - p) * 0.35;
        ctx.beginPath();
        ctx.arc(item.x, item.y, fr, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = base * (1 - p);
        setStroke(c, item.width || 5);
        ctx.stroke();
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
      const start = item.at ?? (isStatic ? item.wait || 0 : (item.with ? prevStart : end) + (item.wait || 0));
      item._start = start;
      item._dur = Math.max(0.01, dur);
      prevStart = start;
      end = Math.max(end, start + item._dur);
    });
    step._len = end;
  }

  // ---------- scenes ----------
  const scenes = [{ id: 'blank', title: '✏️ Blank board', steps: [] }, ...(window.WB_SCENES || [])];
  scenes.forEach((s) => s.steps.forEach((step, i) => {
    layoutStep(step, i, s);
    // Action buttons: their items animate normally (never "static").
    (step.actions || []).forEach((act, j) => { act.id = act.id || `a${i}-${j}`; layoutStep(act, i * 10 + j, { drawn: true }); });
  }));

  const player = { scene: scenes[0], step: -1, slide: 0, t0: 0, playing: false, waitingForVoice: false };

  const els = {
    select: document.getElementById('sceneSelect'),
    prev: document.getElementById('prev'),
    play: document.getElementById('play'),
    next: document.getElementById('next'),
    label: document.getElementById('stepLabel'),
    caption: document.getElementById('caption'),
    narrate: document.getElementById('narrate'),
    newTopic: document.getElementById('newTopic'),
    deleteTopic: document.getElementById('deleteTopic'),
  };

  // Custom topics: user-made, start as an empty board. Saved in localStorage.
  // Each topic is isolated: its own drawings, notes and recorded clips (keyed by scene id).
  const TOPICS_KEY = 'wb-topics';
  const readTopics = () => {
    try { const t = JSON.parse(localStorage.getItem(TOPICS_KEY)); return Array.isArray(t) ? t : []; } catch (_) { return []; }
  };
  const writeTopics = (list) => { try { localStorage.setItem(TOPICS_KEY, JSON.stringify(list)); } catch (_) { /* storage unavailable */ } };
  const topicTitle = (name) => '📝 ' + name;
  readTopics().forEach((t) => scenes.push({ id: t.id, title: topicTitle(t.name), steps: [], custom: true }));

  function addOption(s, i) {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = s.title;
    els.select.appendChild(o);
  }
  scenes.forEach(addOption);

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

  // ---------- animation clock (can be paused) ----------
  // Everything that moves on the board runs on this clock, so pausing freezes
  // all animations mid-way while you keep drawing, zooming and recording.
  // Animation time = anchorAnim + (real time since anchorReal) x rate. Changing
  // speed or pausing re-anchors, so nothing jumps.
  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2];
  let savedSpeed = 1;
  try { savedSpeed = parseFloat(localStorage.getItem('wb-anim-speed')) || 1; } catch (_) { /* storage unavailable */ }
  const clock = { paused: false, rate: SPEEDS.includes(savedSpeed) ? savedSpeed : 1, anchorReal: now(), anchorAnim: now() };
  const animNow = () => (clock.paused ? clock.anchorAnim : clock.anchorAnim + (now() - clock.anchorReal) * clock.rate);
  const pausedBadge = document.getElementById('pausedBadge');
  function setAnimPaused(on) {
    if (on === clock.paused) return;
    clock.anchorAnim = animNow();
    clock.anchorReal = now();
    clock.paused = on;
    if (pausedBadge) pausedBadge.hidden = !clock.paused;
    renderActionButtons();
  }
  function setAnimSpeed(rate) {
    clock.anchorAnim = animNow();
    clock.anchorReal = now();
    clock.rate = rate;
    try { localStorage.setItem('wb-anim-speed', String(rate)); } catch (_) { /* storage unavailable */ }
    renderActionButtons();
  }
  function stepSpeed(dir) {
    const i = SPEEDS.indexOf(clock.rate);
    setAnimSpeed(SPEEDS[clamp(i + dir, 0, SPEEDS.length - 1)]);
  }

  // ---------- slide action buttons ----------
  // A step can have `actions: [{ label, items }]`. Each becomes a button in the
  // toolbar (never in the recording) while its slide is shown. Pressing it plays
  // the items; pressing again replays. Items with `hideDuring: '<action id>'`
  // are hidden while that action is playing/played (e.g. a vesicle that moves).
  const actionRuns = new Map(); // action id -> start time
  const actionsBox = document.getElementById('slideActions');
  function slideActions() {
    const steps = player.scene.steps;
    if (player.step < 0) return [];
    let first = player.step;
    while (first > 0 && !steps[first].clear) first--;
    const list = [];
    for (let i = first; i <= player.step; i++) list.push(...(steps[i].actions || []));
    return list;
  }
  const HOLD_AT_END = 1; // seconds an action's last frame stays before the slide resets
  function runAction(a) {
    setAnimPaused(false);
    // Actions in the same `group` replace each other (e.g. one demo shown at a time).
    if (a.group) for (const o of slideActions()) if (o !== a && o.group === a.group) actionRuns.delete(o.id);
    actionRuns.set(a.id, animNow());
  }
  // A `hotspot` item ({ x, y, w, h, action: '<action id>' }) is an invisible click target:
  // clicking it on the board runs that action. Works with any tool.
  function hotspotAt(px, py) {
    const steps = player.scene.steps;
    if (player.step < 0) return null;
    let first = player.step;
    while (first > 0 && !steps[first].clear) first--;
    for (let i = first; i <= player.step; i++) {
      for (const it of steps[i].items || []) {
        if (it.type === 'hotspot' && px >= it.x && px <= it.x + it.w && py >= it.y && py <= it.y + it.h) {
          const a = slideActions().find((x) => x.id === it.action);
          if (a) return a;
        }
      }
    }
    // buttons that live inside an action that is currently showing
    for (const act of slideActions()) {
      if (!actionRuns.has(act.id)) continue;
      for (const it of act.items) {
        if (it.type === 'hotspot' && px >= it.x && px <= it.x + it.w && py >= it.y && py <= it.y + it.h) {
          const a = slideActions().find((x) => x.id === it.action);
          if (a) return a;
        }
      }
    }
    return null;
  }
  function renderActionButtons() {
    // get this slide's pictures (incl. every animation frame) ready in idle time
    {
      const steps = player.scene.steps;
      let first = Math.max(0, player.step);
      while (first > 0 && !steps[first].clear) first--;
      const its = [];
      for (let i = first; i <= player.step && i < steps.length; i++) its.push(...(steps[i].items || []));
      for (const a of slideActions()) its.push(...a.items);
      queueSvgPrep(its);
    }
    if (!actionsBox) return;
    const list = slideActions().filter((a) => !a.hidden);
    actionsBox.innerHTML = '';
    actionsBox.hidden = !player.scene.steps.length;
    const pause = document.createElement('button');
    pause.className = 'pause-btn' + (clock.paused ? ' active' : '');
    pause.textContent = clock.paused ? '⏵ Resume' : '⏸ Pause';
    pause.title = 'Pause / resume all animations on the board (Q). Not shown in recordings.';
    pause.addEventListener('click', () => setAnimPaused(!clock.paused));
    actionsBox.appendChild(pause);
    const speed = document.createElement('select');
    speed.className = 'speed-select';
    speed.title = 'Animation speed for every animation ([ slower, ] faster). Not shown in recordings.';
    SPEEDS.forEach((s) => {
      const o = document.createElement('option');
      o.value = s;
      o.textContent = `${s}×`;
      o.selected = s === clock.rate;
      speed.appendChild(o);
    });
    speed.addEventListener('change', () => { setAnimSpeed(parseFloat(speed.value)); speed.blur(); });
    actionsBox.appendChild(speed);
    list.forEach((a, k) => {
      const b = document.createElement('button');
      b.className = 'action-btn';
      b.textContent = `▶ ${a.label}`;
      b.title = `Play this animation (key ${k + 1}). It only appears on this slide and is not shown in recordings.`;
      b.addEventListener('click', () => runAction(a));
      actionsBox.appendChild(b);
    });
    if (list.length) {
      const reset = document.createElement('button');
      reset.textContent = '↺';
      reset.title = 'Reset this slide’s animations (R)';
      reset.addEventListener('click', () => { actionRuns.clear(); setAnimPaused(false); });
      actionsBox.appendChild(reset);
    }
  }

  function goTo(i, animate = true) {
    const steps = player.scene.steps;
    player.step = clamp(i, -1, steps.length - 1);
    const slide = slideOf(player.step);
    if (slide !== player.slide) {
      zoomFit();
      insetState.item = null; insetState.k = 0; insetState.hoverItem = null;
      actionRuns.clear();
      setAnimPaused(false);
      stashHistory();
      saveInk();
      player.slide = slide;
      replay.active = false;
      current = null;
      loadInk();
    }
    player.t0 = animate ? animNow() : -Infinity;
    const step = steps[player.step];
    els.caption.textContent = step ? step.say || '' : player.scene.intro || (steps.length ? 'Press ▶ Play or ⏭ to start the explainer. You can draw on the board at any time.' : 'Draw anything. Pick an explainer from the menu to watch an animation.');
    if (step && animate) speak(step.say);
    updateLabels();
    renderActionButtons();
    loadNotes();
    loadPrompter();
    rememberPlace();
  }

  // Remember the topic and slide so a refresh comes back to the same place.
  function rememberPlace() {
    try {
      localStorage.setItem('wb-last', JSON.stringify({ id: player.scene.id, step: player.step }));
      if (location.hash !== '#' + player.scene.id) history.replaceState(null, '', '#' + player.scene.id);
    } catch (_) { /* storage unavailable */ }
  }

  // ---------- speaker notes (side panel, never on the board or in recordings) ----------
  const notes = {
    panel: document.getElementById('notesPanel'),
    text: document.getElementById('notesText'),
    title: document.getElementById('notesTitle'),
    saved: document.getElementById('notesSaved'),
    toggle: document.getElementById('notesToggle'),
    key: null,
    timer: 0,
  };
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } };
  function loadNotes() {
    if (!notes.text) return;
    flushNotes();
    const n = player.scene.steps.length ? slideOf(Math.max(0, player.step)) + 1 : 0;
    notes.key = 'wb-notes-' + player.scene.id + '-' + n;
    notes.text.value = lsGet(notes.key) || '';
    notes.title.textContent = n ? `Notes: slide ${n}` : 'Notes';
    notes.saved.textContent = '';
  }
  function flushNotes() {
    if (!notes.key || !notes.text) return;
    clearTimeout(notes.timer);
    if (lsSet(notes.key, notes.text.value)) notes.saved.textContent = 'Saved';
  }
  if (notes.text) {
    notes.text.addEventListener('input', () => {
      notes.saved.textContent = '…';
      clearTimeout(notes.timer);
      notes.timer = setTimeout(flushNotes, 400);
    });
    notes.text.addEventListener('blur', flushNotes);
    // keep typing in the notes from triggering board shortcuts
    notes.text.addEventListener('keydown', (e) => e.stopPropagation());
    const setOpen = (open) => {
      notes.panel.hidden = !open;
      notes.toggle.classList.toggle('active', open);
      lsSet('wb-notes-open', open ? '1' : '0');
      window.dispatchEvent(new Event('resize'));
    };
    notes.toggle.addEventListener('click', () => setOpen(notes.panel.hidden));
    let size = parseFloat(lsGet('wb-notes-size')) || 17;
    const applySize = () => { notes.text.style.fontSize = size + 'px'; lsSet('wb-notes-size', String(size)); };
    document.getElementById('notesSmaller').addEventListener('click', () => { size = Math.max(12, size - 2); applySize(); });
    document.getElementById('notesBigger').addEventListener('click', () => { size = Math.min(32, size + 2); applySize(); });
    applySize();
    if (lsGet('wb-notes-open') === '1') setOpen(true);
    window.addEventListener('beforeunload', flushNotes);
  }

  // ---------- teleprompter ----------
  // A script that scrolls on top of the board, only on screen (the recorder draws the board on
  // its own canvas, so it is never in the video). On/off and the script belong to each slide:
  //   wb-tp-<scene>-<slide>  '1' = on      wb-tps-<scene>-<slide>  your edited script
  // The default script comes from the slide's step in the scene file (`script: '...'`).
  const tp = {
    box: document.getElementById('prompter'),
    view: document.getElementById('tpView'),
    text: document.getElementById('tpText'),
    play: document.getElementById('tpPlay'),
    wpm: document.getElementById('tpWpm'),
    editor: document.getElementById('tpEditor'),
    toggle: document.getElementById('tpToggle'),
    on: false, paused: true, editing: false, y: 0, maxY: 0, speed: 0, startOff: 0, last: 0, recState: 'idle',
    size: parseFloat(lsGet('wb-tp-size')) || 30,
    w: parseFloat(lsGet('wb-tp-w')) || 0,   // window size you dragged to (0 = default)
    h: parseFloat(lsGet('wb-tp-h')) || 0,
    bg: Number.isFinite(parseFloat(lsGet('wb-tp-bg'))) ? parseFloat(lsGet('wb-tp-bg')) : 0.8,   // background opacity (text stays solid)
    spl: parseFloat(lsGet('wb-tp-spl')) || 4,   // seconds per line of text
  };
  const tpKeys = () => {
    const n = player.scene.steps.length ? slideOf(Math.max(0, player.step)) + 1 : 0;
    return { n, on: `wb-tp-${player.scene.id}-${n}`, script: `wb-tps-${player.scene.id}-${n}` };
  };
  function tpScript() {
    const k = tpKeys();
    const saved = lsGet(k.script);
    if (saved !== null) return saved;
    const steps = player.scene.steps;
    for (let i = 0; i < steps.length; i++) if (slideOf(i) + 1 === k.n && steps[i].script) return steps[i].script;
    return '';
  }
  const tpPlace = () => { tp.text.style.transform = `translateY(${tp.startOff - tp.y}px)`; };
  function tpButtons() {
    tp.play.textContent = tp.paused ? (tp.y > 0 && tp.y < tp.maxY ? '▶ Resume' : '▶ Start') : '⏸ Pause';
  }
  // Works out how far to scroll and how fast: the whole script takes (words / pace) minutes.
  function tpMeasure() {
    const frac = tp.maxY ? tp.y / tp.maxY : 0;
    const vh = tp.view.clientHeight, th = tp.text.scrollHeight;
    tp.startOff = vh * 0.2;
    tp.maxY = Math.max(0, th + tp.startOff - vh * 0.55);
    // One line of text scrolls past every `spl` seconds, whatever the line contains.
    const lineH = tp.size * 1.5;
    tp.speed = lineH / tp.spl;
    const secs = tp.maxY / tp.speed;
    const tm = document.getElementById('tpTime');
    if (tm) tm.textContent = `≈ ${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')} in all`;
    tp.y = frac * tp.maxY;
    tpPlace();
    tpButtons();
  }
  function tpRender() {
    const raw = tpScript();
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    tp.text.innerHTML = raw.trim()
      ? esc(raw).replace(/\[([^\]]*)\]/g, '<span class="tp-cue">[$1]</span>')
      : '<span class="tp-cue">No script for this slide yet. Click ✎ Edit to type one.</span>';
    tp.box.style.setProperty('--tp-size', tp.size + 'px');
    tpMeasure();
  }
  function tpCloseEditor(save = true) {
    if (!tp.editing) return;
    if (save) lsSet(tpKeys().script, tp.editor.value);
    tp.editing = false;
    tp.editor.hidden = true;
    tp.view.hidden = false;
    document.getElementById('tpEdit').textContent = '✎ Edit';
  }
  // Applies this slide's saved setting (called whenever the slide changes).
  function loadPrompter() {
    if (!tp.box) return;
    tpCloseEditor(false);
    tp.on = lsGet(tpKeys().on) === '1';
    tp.box.hidden = !tp.on;
    tp.toggle.classList.toggle('active', tp.on);
    tp.y = 0;
    tp.maxY = 0;
    // starts paused at the top, unless a recording is already running
    tp.paused = tp.recState !== 'recording';
    if (tp.on) tpRender();
  }
  function tpSetOn(on) {
    lsSet(tpKeys().on, on ? '1' : '0');
    loadPrompter();
  }
  function tpTogglePlay() {
    if (!tp.on || tp.editing) return;
    if (tp.paused && tp.y >= tp.maxY) tp.y = 0;
    tp.paused = !tp.paused;
    tpButtons();
  }
  function tpApplySize() {
    if (tp.w) tp.box.style.setProperty('--tp-w', tp.w + 'px'); else tp.box.style.removeProperty('--tp-w');
    if (tp.h) tp.box.style.setProperty('--tp-h', tp.h + 'px'); else tp.box.style.removeProperty('--tp-h');
  }
  function tpApplyBg() {
    tp.box.style.setProperty('--tp-bg', String(tp.bg));
    document.getElementById('tpBgVal').textContent = `${Math.round(tp.bg * 100)}%`;
  }
  if (tp.box) {
    tpApplySize();
    tpApplyBg();
    const bgStep = (d) => { tp.bg = Math.round(Math.max(0, Math.min(1, tp.bg + d)) * 10) / 10; lsSet('wb-tp-bg', String(tp.bg)); tpApplyBg(); };
    document.getElementById('tpBgLess').addEventListener('click', () => bgStep(-0.1));
    document.getElementById('tpBgMore').addEventListener('click', () => bgStep(0.1));
    // Drag the corner grip to resize the window (it stays centred); double-click to reset.
    const grip = document.getElementById('tpResize');
    let drag = null;
    grip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      grip.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, w: tp.box.offsetWidth, h: tp.view.clientHeight || tp.editor.clientHeight };
    });
    grip.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const stage = tp.box.parentElement;
      tp.w = Math.round(Math.max(320, Math.min(stage.clientWidth - 24, drag.w + 2 * (e.clientX - drag.x))));
      tp.h = Math.round(Math.max(tp.size * 1.5 * 2, Math.min(stage.clientHeight * 0.85, drag.h + (e.clientY - drag.y))));
      tpApplySize();
      if (!tp.editing) tpMeasure();
    });
    const end = () => { if (!drag) return; drag = null; lsSet('wb-tp-w', String(tp.w)); lsSet('wb-tp-h', String(tp.h)); };
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
    grip.addEventListener('dblclick', () => {
      tp.w = 0; tp.h = 0;
      lsSet('wb-tp-w', '0'); lsSet('wb-tp-h', '0');
      tpApplySize();
      if (!tp.editing) tpMeasure();
    });
    [1.5, 2, 2.5, 3, 4, 5, 6, 8].forEach((v) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = `1 line / ${v} s`;
      o.selected = v === tp.spl;
      tp.wpm.appendChild(o);
    });
    tp.wpm.addEventListener('change', () => { tp.spl = parseFloat(tp.wpm.value); lsSet('wb-tp-spl', String(tp.spl)); tpMeasure(); tp.wpm.blur(); });
    tp.toggle.addEventListener('click', () => tpSetOn(!tp.on));
    document.getElementById('tpClose').addEventListener('click', () => tpSetOn(false));
    tp.play.addEventListener('click', tpTogglePlay);
    document.getElementById('tpRestart').addEventListener('click', () => { tp.y = 0; tp.paused = true; tpPlace(); tpButtons(); });
    const resize = (d) => { tp.size = Math.max(18, Math.min(56, tp.size + d)); lsSet('wb-tp-size', String(tp.size)); tpRender(); };
    document.getElementById('tpSmaller').addEventListener('click', () => resize(-4));
    document.getElementById('tpBigger').addEventListener('click', () => resize(4));
    document.getElementById('tpEdit').addEventListener('click', () => {
      if (tp.editing) { tpCloseEditor(true); tpRender(); return; }
      tp.editing = true;
      tp.paused = true;
      tp.editor.value = tpScript();
      tp.editor.hidden = false;
      tp.view.hidden = true;
      document.getElementById('tpEdit').textContent = '✓ Done';
      tp.editor.focus();
      tpButtons();
    });
    tp.editor.addEventListener('keydown', (e) => e.stopPropagation()); // typing must not trigger board shortcuts
    window.addEventListener('resize', () => { if (tp.on && !tp.editing) tpMeasure(); });
    // The recorder says when it starts / pauses / stops: the script scrolls while you record.
    window.addEventListener('wb-rec', (e) => {
      const prev = tp.recState;
      tp.recState = e.detail;
      if (!tp.on || tp.editing) return;
      if (e.detail === 'recording' && prev !== 'recording') {
        if (tp.y >= tp.maxY) tp.y = 0;
        tp.paused = false;
      } else if (e.detail !== 'recording' && prev === 'recording') tp.paused = true;
      tpButtons();
    });
    const tick = (ts) => {
      if (tp.on && !tp.paused && !tp.editing) {
        const dt = Math.min(0.5, (ts - tp.last) / 1000); // real elapsed time, so slow frames (e.g. while recording) don't slow the scroll
        tp.y = Math.min(tp.maxY, tp.y + tp.speed * dt);
        if (tp.y >= tp.maxY) { tp.paused = true; tpButtons(); }
        tpPlace();
      }
      tp.last = ts;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
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
    actionRuns.clear();
    zoomFit(true);
    loadInk();
    // Slide-based explainers (drawn: false) open straight on slide 1.
    goTo(player.scene.drawn === false && player.scene.steps.length ? 0 : -1, false);
    els.deleteTopic.hidden = !player.scene.custom;
    window.dispatchEvent(new Event('wb-scene'));
  }

  els.select.addEventListener('change', () => loadScene(+els.select.value));

  els.newTopic.addEventListener('click', () => {
    const name = (prompt('Name for the new topic:') || '').trim().slice(0, 60);
    if (!name) return;
    const id = 'topic-' + Date.now().toString(36);
    writeTopics([...readTopics(), { id, name }]);
    scenes.push({ id, title: topicTitle(name), steps: [], custom: true });
    addOption(scenes[scenes.length - 1], scenes.length - 1);
    els.select.value = scenes.length - 1;
    loadScene(scenes.length - 1);
  });

  els.deleteTopic.addEventListener('click', () => {
    const sc = player.scene;
    if (!sc.custom) return;
    if (!confirm(`Delete the topic "${sc.title.replace(/^📝 /, '')}" with all its drawings, notes and recorded clips? This cannot be undone.`)) return;
    const idx = scenes.indexOf(sc);
    loadScene(0); // leave first (this saves the topic's ink), then wipe it
    try {
      const prefixes = ['wb-ink-' + sc.id, 'wb-notes-' + sc.id + '-', 'wb-tp-' + sc.id + '-', 'wb-tps-' + sc.id + '-'];
      Object.keys(localStorage).filter((k) => prefixes.some((p) => k.startsWith(p))).forEach((k) => localStorage.removeItem(k));
    } catch (_) { /* storage unavailable */ }
    [...historyBySlide.keys()].filter((k) => k.startsWith('wb-ink-' + sc.id)).forEach((k) => historyBySlide.delete(k));
    writeTopics(readTopics().filter((t) => t.id !== sc.id));
    scenes.splice(idx, 1);
    els.select.innerHTML = '';
    scenes.forEach(addOption);
    els.select.value = 0;
    window.dispatchEvent(new CustomEvent('wb-topic-deleted', { detail: sc.id }));
  });
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
      ctx.font = s.font === 'sans' ? `600 ${s.size}px ${SANS}` : `500 ${s.size}px ${FONT}`;
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
    return [view.x + ((e.clientX - r.left) / r.width) * W / view.z, view.y + ((e.clientY - r.top) / r.height) * H / view.z];
  }

  const measureCtx = document.createElement('canvas').getContext('2d');
  function hits(s, x, y, rad) {
    if (s.kind === 'text') {
      const lines = String(s.text).split('\n');
      measureCtx.font = s.font === 'sans' ? `600 ${s.size}px ${SANS}` : `500 ${s.size}px ${FONT}`;
      const w = Math.max(...lines.map((l) => measureCtx.measureText(l).width));
      const h = lines.length * s.size * 1.15;
      return x >= s.pts[0][0] - rad && x <= s.pts[0][0] + w + rad && y >= s.pts[0][1] - rad && y <= s.pts[0][1] + h + rad;
    }
    const pts = resample(shapePts(s), 6);
    const r = rad + (s.kind === 'hl' ? s.size * 2 : s.size / 2);
    return pts.some(([px, py]) => Math.hypot(px - x, py - y) < r);
  }

  function eraseAt(x, y) {
    const before = strokes.length;
    strokes = strokes.filter((s) => !hits(s, x, y, 14 / view.z));
    return strokes.length !== before;
  }

  // Your topmost drawing or text under a board point (within a few screen pixels).
  function inkAt(x, y) {
    for (let i = strokes.length - 1; i >= 0; i--) if (hits(strokes[i], x, y, 8 / view.z)) return i;
    return -1;
  }

  // Press and hold on the board while an animation button's animation is playing:
  // it pauses until you let go (you can still draw meanwhile).
  let holdPaused = false;
  function actionPlaying() {
    const t = animNow();
    return slideActions().some((a) => actionRuns.has(a.id) && t - actionRuns.get(a.id) < a._len);
  }
  canvas.addEventListener('pointerdown', () => closeInset());
  canvas.addEventListener('pointerdown', () => {
    if (!clock.paused && actionPlaying()) {
      setAnimPaused(true);
      holdPaused = true;
    }
  });
  const releaseHold = () => {
    if (holdPaused) {
      holdPaused = false;
      setAnimPaused(false);
    }
  };
  window.addEventListener('pointerup', releaseHold);
  window.addEventListener('pointercancel', releaseHold);
  window.addEventListener('blur', releaseHold);

  canvas.addEventListener('pointerdown', (e) => {
    // Clickable bullets on a slide (hotspot items) run their animation instead of drawing.
    if (e.button === 0 && !current) {
      const [hx, hy] = toBoard(e);
      const hot = hotspotAt(hx, hy);
      if (hot) { e.preventDefault(); runAction(hot); return; }
    }
    // Move tool: drag one of your drawings / text boxes to move it.
    if (state.tool === 'pan' && e.button === 0) {
      const [x, y] = toBoard(e);
      const i = inkAt(x, y);
      if (i >= 0) {
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        snapshot();
        // Work on a copy so undo still has the original position.
        const copy = { ...strokes[i], pts: strokes[i].pts.map((p) => p.slice()) };
        strokes = strokes.slice();
        strokes[i] = copy;
        current = { kind: 'drag', s: copy, last: [x, y], moved: false };
        canvas.style.cursor = 'move';
        return;
      }
    }
    // Move tool on empty space (or middle mouse button): look around when zoomed.
    if (state.tool === 'pan' || e.button === 1) {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      current = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: target.x, vy: target.y };
      canvas.style.cursor = 'grabbing';
      return;
    }
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
    current = { kind: state.tool, color: state.color, size: state.size / view.z, pts: [[x, y]], t0: now() };
  });

  let hotCursor = false;
  canvas.addEventListener('pointermove', (e) => {
    const [px, py] = toBoard(e);
    window.WB.pointer = { x: px, y: py, t: now() };
    if (!current) {
      const overHot = !!hotspotAt(px, py);
      if (overHot) { canvas.style.cursor = 'pointer'; hotCursor = true; return; }
      if (hotCursor) { hotCursor = false; setTool(state.tool); }
      if (state.tool === 'pan') canvas.style.cursor = inkAt(px, py) >= 0 ? 'move' : 'grab';
      return;
    }
    if (current.kind === 'drag') {
      const dx = px - current.last[0], dy = py - current.last[1];
      current.s.pts.forEach((p) => { p[0] += dx; p[1] += dy; });
      current.last = [px, py];
      if (dx || dy) current.moved = true;
      return;
    }
    if (current.kind === 'pan') {
      const r = canvas.getBoundingClientRect();
      target.x = current.vx - ((e.clientX - current.sx) / r.width) * W / target.z;
      target.y = current.vy - ((e.clientY - current.sy) / r.height) * H / target.z;
      clampView(target);
      Object.assign(view, target);
      return;
    }
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
    if (current.kind === 'drag') {
      if (current.moved) {
        current.s.pts = current.s.pts.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
        saveInk();
      } else {
        strokes = undoStack.pop(); // just a click: nothing changed
      }
      current = null;
      setTool(state.tool);
      return;
    }
    if (current.kind === 'pan') {
      current = null;
      setTool(state.tool);
      return;
    }
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
    if (hotspotAt(x, y)) return;
    openTextEntry(x, y);
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [bx, by] = toBoard(e);
    if (e.ctrlKey || e.metaKey) {
      zoomAt(Math.exp(-e.deltaY * 0.01), bx, by, true);
    } else if (target.z > 1) {
      const r = canvas.getBoundingClientRect();
      const k = W / r.width / target.z;
      target.x += e.deltaX * k;
      target.y += e.deltaY * k;
      clampView(target);
      Object.assign(view, target);
    } else if (Math.abs(e.deltaY) >= 50 && e.deltaX === 0) {
      zoomAt(Math.exp(-e.deltaY * 0.002), bx, by, true); // a mouse wheel at full view zooms in
    }
  }, { passive: false });
  canvas.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
  // Pinching anywhere else on the page also zooms the board, not the web page.
  window.addEventListener('wheel', (e) => {
    if (e.target === canvas || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    zoomAt(Math.exp(-e.deltaY * 0.01), ...viewCenter(), true);
  }, { passive: false });
  window.addEventListener('gesturestart', (e) => e.preventDefault()); // Safari pinch
  canvas.addEventListener('pointerleave', () => { window.WB.pointer = null; });
  canvas.addEventListener('pointerup', finishStroke);
  canvas.addEventListener('pointercancel', finishStroke);

  function openTextEntry(x, y) {
    const r = canvas.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const size = (state.size * 4 + 12) / view.z; // ~24 / 36 / 60 px for thin / medium / thick
    const input = document.createElement('input');
    input.className = 'text-entry';
    input.placeholder = 'Type, then Enter';
    input.style.left = r.left - sr.left + (((x - view.x) * view.z) / W) * r.width + 'px';
    input.style.top = r.top - sr.top + (((y - view.y) * view.z) / H) * r.height + 'px';
    input.style.fontSize = ((size * view.z) / W) * r.width + 'px';
    input.style.color = col(state.color);
    stage.appendChild(input);
    input.focus();
    let done = false;
    const commit = (keep) => {
      if (done) return;
      done = true;
      if (keep && input.value.trim()) {
        snapshot();
        strokes.push({ kind: 'text', font: 'sans', color: state.color, size, text: input.value, pts: [[x, y]], dur: 0.6 });
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
    replay.t0 = animNow();
    replay.active = true;
  }

  // ---------- render loop ----------
  function drawBackground() {
    ctx.fillStyle = '#fdfdfb';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e3e6ec';
    for (let x = 40; x < W; x += 40) for (let y = 40; y < H; y += 40) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }

  // ---------- hover-to-enlarge insets ----------
  let frameInsets = [];            // inset items drawn in the last frame
  const insetState = { item: null, k: 0, hoverItem: null, hoverStart: 0, lastT: 0 };
  function updateInsets() {
    const p = window.WB.pointer;
    const tReal = now();
    const dt = Math.min(0.1, tReal - (insetState.lastT || tReal));
    insetState.lastT = tReal;
    if (!p) {
      insetState.hoverItem = null;
      insetState.item && (insetState.closing = true);
    } else if (!insetState.item || insetState.closing) {
      const over = frameInsets.find((it) => p.x >= it.x - 10 && p.x <= it.x + it.w + 10 && p.y >= it.y - (it.hoverTop || 10) && p.y <= it.y + it.h + 10);
      if (over !== insetState.hoverItem) { insetState.hoverItem = over || null; insetState.hoverStart = tReal; }
      if (over && tReal - insetState.hoverStart >= 1) { insetState.item = over; insetState.closing = false; }
    }
    // grow / shrink (about a third of a second)
    const target = insetState.item && !insetState.closing ? 1 : 0;
    insetState.k += Math.sign(target - insetState.k) * Math.min(Math.abs(target - insetState.k), dt / 0.35);
    if (insetState.k === 0 && insetState.closing) { insetState.item = null; insetState.closing = false; insetState.hoverItem = null; }
    frameInsets = [];
  }
  function closeInset() {
    if (insetState.item) insetState.closing = true;
    insetState.hoverItem = null;
  }
  function drawInsetOverlay() {
    const it = insetState.item;
    if (!it || insetState.k <= 0 || !it._img || !it._img.complete) return;
    const e = easeInOut(insetState.k);
    const maxW = 1440, maxH = 720;
    const s = Math.min(maxW / it.w, maxH / it.h);
    const bw = it.w * s, bh = it.h * s, bx = (W - bw) / 2, by = 120 + (maxH - bh) / 2 + 20;
    const x = it.x + (bx - it.x) * e, y = it.y + (by - it.y) * e, w = it.w + (bw - it.w) * e, h = it.h + (bh - it.h) * e;
    ctx.save();
    ctx.globalAlpha = 0.97 * e;
    ctx.fillStyle = '#fdfdfb';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d9dce3';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(20,24,40,0.18)';
    ctx.shadowBlur = 24 * e;
    ctx.beginPath();
    ctx.roundRect(x - 16 * e, y - 16 * e, w + 32 * e, h + 32 * e, 18 * e);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.drawImage(it._img, x, y, w, h);
    if (it.title) {
      ctx.globalAlpha = e;
      ctx.fillStyle = '#1f2430';
      ctx.font = `700 40px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.title, W / 2, 70);
    }
    ctx.restore();
  }

  function frame() {
    const t = animNow();
    updateInsets();
    tickPlayer(t);
    stepView(now());
    ctx.setTransform(...viewMatrix(scale));
    drawBoard(t);
    if (window.WB.onFrame) window.WB.onFrame(t);
    requestAnimationFrame(frame);
  }

  // Draw the whole board (background, scene, your ink) into a canvas context.
  function renderTo(targetCtx, s, t = animNow()) {
    const prev = ctx;
    ctx = targetCtx;
    ctx.setTransform(...viewMatrix(s));
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
        if (item.hideDuring && [].concat(item.hideDuring).some((id) => actionRuns.has(id))) continue; // an action is animating it
        const p = clamp((elapsed - item._start) / item._dur);
        const tip = renderItem(item, p, t);
        if (tip) tips.push(tip);
      }
    }
    // animations started with the slide's action buttons
    for (const a of slideActions()) {
      if (!actionRuns.has(a.id)) continue;
      const elapsed = t - actionRuns.get(a.id);
      if (!a.stay && elapsed > a._len + HOLD_AT_END * clock.rate) { actionRuns.delete(a.id); continue; } // finished: back to the start state (unless `stay`)
      for (const item of a.items) {
        if (item.until !== undefined && elapsed - item._start > item.until) continue; // its part is over
        renderItem(item, clamp((elapsed - item._start) / item._dur), t);
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
    if (current && !['eraser', 'pan', 'drag'].includes(current.kind)) drawStroke(current);

    tips.forEach((tip) => drawPenTip(tip, tip.color));
    drawInsetOverlay();
  }

  // ---------- toolbar ----------
  const toolButtons = document.querySelectorAll('[data-tool]');
  function setTool(tool) {
    state.tool = tool;
    toolButtons.forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
    // the tool picker button shows the current tool
    const tb = [...toolButtons].find((b) => b.dataset.tool === tool);
    if (tb && document.getElementById('toolIcon')) {
      document.getElementById('toolIcon').textContent = tb.firstChild.textContent;
      document.getElementById('toolName').textContent = tb.querySelector('span').textContent;
    }
    canvas.style.cursor = tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : tool === 'pan' ? 'grab' : 'crosshair';
  }
  toolButtons.forEach((b) => b.addEventListener('click', () => { setTool(b.dataset.tool); closePops(); }));

  // Tool, colour and size live in small pop-ups that open from their button.
  const pickers = [['toolPick', 'toolPop'], ['colorPick', 'colors'], ['sizePick', 'sizePop']]
    .map(([b, p]) => [document.getElementById(b), document.getElementById(p)]).filter(([b, p]) => b && p);
  function closePops() { pickers.forEach(([b, p]) => { p.hidden = true; b.classList.remove('open'); }); }
  pickers.forEach(([btn, pop]) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = pop.hidden;
    closePops();
    pop.hidden = !open;
    btn.classList.toggle('open', open);
  }));
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.picker')) closePops(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePops(); });

  const colorBox = document.getElementById('colors');
  ['ink', 'blue', 'red', 'green', 'orange', 'purple', 'yellow'].forEach((c) => {
    const b = document.createElement('button');
    b.className = 'swatch' + (c === state.color ? ' active' : '');
    b.style.background = COLORS[c];
    b.title = c;
    b.addEventListener('click', () => {
      state.color = c;
      colorBox.querySelectorAll('.swatch').forEach((x) => x.classList.toggle('active', x === b));
      showPenStyle();
      closePops();
    });
    colorBox.appendChild(b);
  });

  document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    state.size = +b.dataset.size;
    document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x === b));
    showPenStyle();
    closePops();
  }));
  // the colour and size buttons show the current pen colour and thickness
  function showPenStyle() {
    const cur = document.getElementById('colorCur'), sz = document.getElementById('sizeCur');
    if (cur) cur.style.background = COLORS[state.color] || state.color;
    if (sz) {
      const d = { 3: 4, 6: 8, 12: 14 }[state.size] || 8;
      sz.style.width = sz.style.height = d + 'px';
      sz.style.background = COLORS[state.color] || state.color;
    }
  }
  showPenStyle();

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
    // Always full HD (1920x1080), whatever the window size, e.g. for a YouTube thumbnail.
    const c = document.createElement('canvas');
    c.width = 1920;
    c.height = 1080;
    renderTo(c.getContext('2d'), 1920 / W);
    const step = player.scene.steps[player.step];
    const name = (player.scene.id || 'board') + (player.step >= 0 ? '-slide' + (player.slide + 1) : '');
    if (step && step.thumbnail) {
      // YouTube thumbnails must be under 2 MB: a high-quality JPEG fits easily.
      a.download = name + '-thumbnail.jpg';
      a.href = c.toDataURL('image/jpeg', 0.92);
    } else {
      a.download = name + '.png';
      a.href = c.toDataURL('image/png');
    }
    a.click();
  });

  const KEYS = { p: 'pen', h: 'hl', l: 'line', a: 'arrow', r: 'rect', o: 'ellipse', t: 'text', e: 'eraser', m: 'pan' };
  window.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + plus, minus, 0 would zoom the whole web page, which only you see and
    // which is never recorded. Use them for the board's own zoom instead.
    if ((e.metaKey || e.ctrlKey) && ['=', '+', '-', '_', '0'].includes(e.key)) {
      e.preventDefault();
      if (e.key === '0') zoomFit();
      else zoomAt(e.key === '-' || e.key === '_' ? 1 / 1.5 : 1.5, ...viewCenter());
      return;
    }
    if (e.target.matches('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.metaKey || e.ctrlKey) && k === 'y') { e.preventDefault(); redo(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { player.playing = false; goTo(player.step + 1); }
    else if (e.key === 'ArrowLeft') { player.playing = false; goTo(player.step - 1, false); }
    else if (e.key === ' ' && player.scene.drawn === false) { e.preventDefault(); setAnimPaused(!clock.paused); }
    else if (e.key === ' ') { e.preventDefault(); if (player.scene.steps.length) setPlaying(!player.playing); }
    else if (k === 'g') tpSetOn(!tp.on);
    else if (k === 's' && tp.on) tpTogglePlay();
    else if (k === 'k' || k === 'q') setAnimPaused(!clock.paused);
    else if (e.key === '[') stepSpeed(-1);
    else if (e.key === ']') stepSpeed(1);
    else if (e.key === '+' || e.key === '=') zoomAt(1.5, ...viewCenter());
    else if (e.key === '-' || e.key === '_') zoomAt(1 / 1.5, ...viewCenter());
    else if (e.key === '0') zoomFit();
    else if (/^[1-9]$/.test(e.key) && slideActions().filter((a) => !a.hidden)[+e.key - 1]) runAction(slideActions().filter((a) => !a.hidden)[+e.key - 1]);
    else if (e.key === 'R' && e.shiftKey) { actionRuns.clear(); setAnimPaused(false); }
    else if (k === 'a' && window.WB.recorderKey && window.WB.recorderKey()) { /* A paused/resumed the recording */ }
    else if (KEYS[k]) setTool(KEYS[k]);
  });
  document.getElementById('zoomIn').addEventListener('click', () => zoomAt(1.5, ...viewCenter()));
  document.getElementById('zoomOut').addEventListener('click', () => zoomAt(1 / 1.5, ...viewCenter()));
  document.getElementById('zoomLabel').addEventListener('click', () => zoomFit());

  // Start on the first explainer if there is one, otherwise the blank board.
  // A link like index.html#photosynthesis opens that scene directly.
  // Otherwise it reopens the last topic and slide you were on (see rememberPlace).
  let last = null;
  try { last = JSON.parse(localStorage.getItem('wb-last')); } catch (_) { /* none saved */ }
  const fromHash = scenes.findIndex((s) => '#' + s.id === location.hash);
  const fromLast = last ? scenes.findIndex((s) => s.id === last.id) : -1;
  const startIndex = fromHash >= 0 ? fromHash : fromLast >= 0 ? fromLast : scenes.length > 1 ? 1 : 0;
  els.select.value = startIndex;
  // Hooks used by recorder.js.
  window.WB = { W, H, renderTo, animNow, view, viewMatrix, onFrame: null, pointer: null, now, sceneId: () => player.scene.id };

  resize();
  loadScene(startIndex);
  if (last && last.id === scenes[startIndex].id && last.step > 0 && last.step < scenes[startIndex].steps.length) goTo(last.step, false);
  requestAnimationFrame(frame);
})();
