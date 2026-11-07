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
    // Moving ions/vesicles wait, visible, at their start until their trip begins.
    if (p <= 0 && !((item.type === 'ion' || item.type === 'vesicle') && item._pts)) return null;
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
        if (item._pts) [x, y] = pointAt(item._pts, item._cum, easeInOut(clamp(p)));
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
        ctx.font = `700 ${Math.round(rr * (st.text.length > 3 ? 0.68 : 0.82))}px ${SANS}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.text, x, y + 1);
        break;
      }
      case 'channel': {
        // A ligand-gated ion channel spanning the membrane. Its opening (0-1)
        // comes from live value `id`, which slide actions can animate.
        const open = clamp(liveValue(item.id, 0, t));
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
        if (item.ligand === false) {
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
        const wave = (tau) => {
          if (tau <= wk[0][0]) return wk[0][1];
          for (let i = 1; i < wk.length; i++) {
            if (tau <= wk[i][0]) {
              const [t0, v0] = wk[i - 1], [t1, v1] = wk[i];
              return v0 + (v1 - v0) * easeInOut(clamp((tau - t0) / (t1 - t0)));
            }
          }
          return wk[wk.length - 1][1];
        };
        const sites = item.sites;
        const vSite = (i) => (idle ? wk[0][1] : wave(cur - sites[i].t));
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
          chan(ay + ar, kOpen, item.kStyle);
          // Na+ in through the top, K+ out through the bottom
          const dot = (x, y, c) => {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            ctx.fill();
          };
          const tPk = wk.reduce((m, k) => (k[1] > m[1] ? k : m))[0];
          const tLo = wk.reduce((m, k) => (k[1] < m[1] ? k : m))[0];
          if (tau > 0 && tau < tPk + 0.25) {
            const f = tau / (tPk + 0.25);
            dot(s.x - 2, ay - ar - 26 + f * (ar + 18), item.naStyle.dot);
            if (f > 0.3) dot(s.x + 2, ay - ar - 26 + (f - 0.3) * (ar + 18), item.naStyle.dot);
          }
          if (tau > tPk && tau < tLo + 0.3) {
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
        ctx.fillText('resting', gx + 6, Y(-70) + 14);
        ctx.fillStyle = '#8a8f98';
        ctx.fillText('mV', gx - 52, gy + 10);
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
      case 'value':
        break; // drives a live value (see liveValue); draws nothing
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
    actionRuns.set(a.id, animNow());
  }
  function renderActionButtons() {
    if (!actionsBox) return;
    const list = slideActions();
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
      o.textContent = `Speed ${s}×`;
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

  canvas.addEventListener('pointermove', (e) => {
    const [px, py] = toBoard(e);
    window.WB.pointer = { x: px, y: py, t: now() };
    if (!current) {
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

  function frame() {
    const t = animNow();
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
      if (elapsed > a._len + HOLD_AT_END * clock.rate) { actionRuns.delete(a.id); continue; } // finished: back to the start state
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
  }

  // ---------- toolbar ----------
  const toolButtons = document.querySelectorAll('[data-tool]');
  function setTool(tool) {
    state.tool = tool;
    toolButtons.forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
    canvas.style.cursor = tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : tool === 'pan' ? 'grab' : 'crosshair';
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
    else if (k === 'k' || k === 'q') setAnimPaused(!clock.paused);
    else if (e.key === '[') stepSpeed(-1);
    else if (e.key === ']') stepSpeed(1);
    else if (e.key === '+' || e.key === '=') zoomAt(1.5, ...viewCenter());
    else if (e.key === '-' || e.key === '_') zoomAt(1 / 1.5, ...viewCenter());
    else if (e.key === '0') zoomFit();
    else if (/^[1-9]$/.test(e.key) && slideActions()[+e.key - 1]) runAction(slideActions()[+e.key - 1]);
    else if (e.key === 'R' && e.shiftKey) { actionRuns.clear(); setAnimPaused(false); }
    else if (KEYS[k]) setTool(KEYS[k]);
  });
  document.getElementById('zoomIn').addEventListener('click', () => zoomAt(1.5, ...viewCenter()));
  document.getElementById('zoomOut').addEventListener('click', () => zoomAt(1 / 1.5, ...viewCenter()));
  document.getElementById('zoomLabel').addEventListener('click', () => zoomFit());

  // Start on the first explainer if there is one, otherwise the blank board.
  // A link like index.html#photosynthesis opens that scene directly.
  const fromHash = scenes.findIndex((s) => '#' + s.id === location.hash);
  const startIndex = fromHash >= 0 ? fromHash : scenes.length > 1 ? 1 : 0;
  els.select.value = startIndex;
  // Hooks used by recorder.js.
  window.WB = { W, H, renderTo, animNow, view, viewMatrix, onFrame: null, pointer: null, now, sceneId: () => player.scene.id };

  resize();
  loadScene(startIndex);
  requestAnimationFrame(frame);
})();
