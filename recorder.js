/*
 * Recording studio: record the board + microphone in clips, arrange and trim
 * them on a timeline, and export everything as one video.
 *
 * - Only the board is recorded, rendered at 1920x1080 regardless of window size.
 * - Clips are saved in the browser (IndexedDB) so they survive a refresh.
 * - Export plays the trimmed clips back in order and records them into one
 *   file, so it takes about as long as the finished video.
 */
(() => {
  'use strict';

  const WB = window.WB;
  const RW = 1920;
  const RH = 1080;
  const FPS = 30;
  const $ = (id) => document.getElementById(id);

  // Prefer MP4 with H.264 (plays everywhere, incl. QuickTime/iMovie), else WebM.
  // Plain 'video/mp4' is skipped: Chrome may put VP9 in it, which Macs can't play.
  const MIME_TYPES = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1.4d401f,mp4a.40.2',
    'video/mp4;codecs=avc1.42e01e,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  const MIME = window.MediaRecorder ? MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || '' : null;
  const EXT = MIME && MIME.startsWith('video/mp4') ? 'mp4' : 'webm';
  const REC_OPTS = { videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 160_000 };
  if (MIME) REC_OPTS.mimeType = MIME;

  const fmt = (s) => {
    s = Math.max(0, s || 0);
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };
  const fmtPrecise = (s) => `${fmt(s)}.${Math.floor(((s || 0) % 1) * 10)}`;
  // A clip can have parts cut out while it was being recorded: `keep` lists the
  // [start, end] ranges of the file that are kept (missing = the whole file).
  const keepOf = (c) => (c.keep && c.keep.length ? c.keep : [[0, c.duration]]);
  const piecesOf = (c) => keepOf(c).map(([a, b]) => [Math.max(a, c.in), Math.min(b, c.out)]).filter(([a, b]) => b - a > 0.05);
  const clipLen = (c) => piecesOf(c).reduce((s, [a, b]) => s + (b - a), 0);
  // Every kept piece of every clip, in order, as clip-like objects (they share the clip's file).
  const expand = (list) => list.flatMap((c, ci) => piecesOf(c).map(([a, b]) => {
    const seg = Object.create(c);
    seg.in = a; seg.out = b; seg._root = c; seg._ci = ci;
    return seg;
  }));
  const once = (el, ev) => new Promise((res) => el.addEventListener(ev, res, { once: true }));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Chrome's WebM recordings don't store their length, which breaks seeking
  // and progress bars in players. Write it in (MP4 files don't need this).
  async function withDuration(blob, seconds) {
    if (!blob.type.includes('webm') || !window.ysFixWebmDuration) return blob;
    try {
      return await window.ysFixWebmDuration(blob, Math.round(seconds * 1000), { logger: false });
    } catch (_) {
      return blob;
    }
  }

  // ---------- storage (IndexedDB) ----------
  let db = null;
  function openDb() {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('explainer-board-video', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('clips', { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }
  function dbDo(mode, fn) {
    if (!db) return Promise.resolve(null);
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('clips', mode);
        const req = fn(tx.objectStore('clips'));
        tx.oncomplete = () => resolve(req && req.result);
        tx.onerror = tx.onabort = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }
  const persist = (c) => dbDo('readwrite', (s) => s.put({ id: c.id, scene: c.scene, blob: c.blob, duration: c.duration, in: c.in, out: c.out, thumb: c.thumb, order: c.order, mime: c.mime, created: c.created, keep: c.keep }));
  const unpersist = (id) => dbDo('readwrite', (s) => s.delete(id));
  const curScene = () => WB.sceneId();
  const saveOrder = () => clips.forEach((c, i) => { c.order = i; persist(c); });

  // ---------- state ----------
  let clips = [];
  let replaceId = null;
  const rec = {
    state: 'idle', // idle | countdown | recording | paused
    recorder: null,
    chunks: [],
    elapsed: 0,
    segStart: 0,
    thumb: null,
    videoTrack: null,
    parts: [],      // kept [start, end] ranges of this recording (file time)
    partStart: 0,   // file time where the part being recorded now started
  };
  const keptTime = () => rec.parts.reduce((s, [a, b]) => s + (b - a), 0) + (rec.state === 'recording' ? Math.max(0, currentElapsed() - rec.partStart) : 0);

  // ---------- the 1920x1080 recording canvas ----------
  const recCanvas = document.createElement('canvas');
  recCanvas.width = RW;
  recCanvas.height = RH;
  const rctx = recCanvas.getContext('2d');

  function drawPointer() {
    const p = WB.pointer;
    if (!$('showPointer').checked || !p || WB.now() - p.t > 3) return;
    const s = RW / WB.W;
    rctx.save();
    rctx.setTransform(...WB.viewMatrix(s));
    rctx.fillStyle = 'rgba(230, 40, 40, 0.9)';
    rctx.shadowColor = 'rgba(230, 40, 40, 0.8)';
    rctx.shadowBlur = 14;
    rctx.beginPath();
    rctx.arc(p.x, p.y, 8 / WB.view.z, 0, Math.PI * 2);
    rctx.fill();
    rctx.restore();
  }

  function renderRecFrame(t) {
    WB.renderTo(rctx, RW / WB.W, t);
    drawPointer();
  }

  WB.onFrame = (t) => {
    if (rec.state === 'recording' || rec.state === 'paused') renderRecFrame(t);
  };

  function makeThumb() {
    renderRecFrame(WB.animNow());
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 180;
    c.getContext('2d').drawImage(recCanvas, 0, 0, 320, 180);
    return c.toDataURL('image/jpeg', 0.75);
  }

  // ---------- microphone ----------
  let micStream = null;
  let meterRaf = 0;
  async function getMic() {
    if (micStream && micStream.getAudioTracks().some((t) => t.readyState === 'live')) return micStream;
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    startMeter(micStream);
    return micStream;
  }
  function startMeter(stream) {
    try {
      const ac = new AudioContext();
      const an = ac.createAnalyser();
      an.fftSize = 512;
      ac.createMediaStreamSource(stream).connect(an);
      const data = new Uint8Array(an.fftSize);
      const fill = $('meterFill');
      cancelAnimationFrame(meterRaf);
      const tick = () => {
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        const level = Math.min(1, Math.sqrt(sum / data.length) * 4);
        fill.style.width = Math.round(level * 100) + '%';
        fill.style.background = level > 0.9 ? '#e0453a' : '#2e9e5b';
        meterRaf = requestAnimationFrame(tick);
      };
      tick();
    } catch (_) { /* meter is optional */ }
  }

  // ---------- recording ----------
  const ui = {
    rec: $('recBtn'),
    pause: $('pauseBtn'),
    stop: $('stopBtn'),
    time: $('recTime'),
    badge: $('recBadge'),
    countdown: $('countdown'),
  };

  function currentElapsed() {
    return rec.elapsed + (rec.state === 'recording' ? (performance.now() - rec.segStart) / 1000 : 0);
  }

  let lastRecState = 'idle';
  function updateRecUI() {
    if (rec.state !== lastRecState) { lastRecState = rec.state; window.dispatchEvent(new CustomEvent('wb-rec', { detail: rec.state })); }
    const busy = rec.state !== 'idle';
    const replacing = replaceId && clips.find((c) => c.id === replaceId);
    ui.rec.disabled = busy || MIME === null;
    ui.rec.textContent = replacing ? `⏺ Re-record clip ${clips.indexOf(replacing) + 1}` : '⏺ Record';
    ui.rec.classList.toggle('replacing', !!replacing);
    ui.pause.disabled = !(rec.state === 'recording' || rec.state === 'paused');
    ui.pause.textContent = rec.state === 'paused' ? '⏵ Resume' : '⏸ Pause';
    ui.stop.disabled = !(rec.state === 'recording' || rec.state === 'paused');
    const canCut = rec.state === 'paused' && rec.parts.length > 0;
    $('cutPartBtn').disabled = !canCut;
    $('cut5Btn').disabled = !canCut;
    $('cutPartBtn').hidden = $('cut5Btn').hidden = $('replayBtn').hidden = !(rec.state === 'recording' || rec.state === 'paused'); // only while a clip is being recorded
    $('replayBtn').disabled = !(rec.state === 'recording' || canCut);
    const last = rec.parts[rec.parts.length - 1];
    $('cutPartBtn').textContent = canCut ? `✂ Cut part (${fmt(last[1] - last[0])})` : '✂ Cut part';
    ui.badge.hidden = !(rec.state === 'recording' || rec.state === 'paused');
    ui.badge.classList.toggle('paused', rec.state === 'paused');
    ui.badge.lastChild.textContent = rec.state === 'paused' ? ' PAUSED' : ' REC';
    // Switching topics mid-recording/export would mix clips up, so lock the picker.
    ['sceneSelect', 'newTopic', 'deleteTopic'].forEach((id) => { $(id).disabled = busy || exporting; });
    $('exportBtn').disabled = busy || !clips.length || exporting;
    $('previewAll').disabled = busy || !clips.length || exporting;
    $('deleteAllClips').disabled = busy || !clips.length || exporting;
  }

  setInterval(() => {
    if (rec.state === 'recording' || rec.state === 'paused') ui.time.textContent = fmt(keptTime()) + (rec.parts.length > 1 || (rec.parts.length && rec.state === 'recording') ? ` · ${rec.parts.length + (rec.state === 'recording' ? 1 : 0)} parts` : '');
  }, 250);

  async function startRecording() {
    if (MIME === null) {
      alert('This browser cannot record video. Please use a recent version of Chrome.');
      return;
    }
    let audioTracks = [];
    try {
      audioTracks = (await getMic()).getAudioTracks();
    } catch (err) {
      if (!confirm('The microphone could not be used (' + (err.message || err.name) + ').\n\nRecord without sound?')) return;
    }

    rec.state = 'countdown';
    updateRecUI();
    ui.countdown.hidden = false;
    for (const n of [3, 2, 1]) {
      ui.countdown.textContent = n;
      await sleep(800);
    }
    ui.countdown.hidden = true;

    rec.state = 'recording';
    rec.thumb = makeThumb();
    const stream = recCanvas.captureStream(FPS);
    rec.videoTrack = stream.getVideoTracks()[0];
    const mixed = new MediaStream([rec.videoTrack, ...audioTracks]);
    rec.chunks = [];
    rec.recorder = new MediaRecorder(mixed, REC_OPTS);
    rec.recorder.ondataavailable = (e) => { if (e.data && e.data.size) rec.chunks.push(e.data); };
    rec.recorder.start(1000);
    rec.elapsed = 0;
    rec.segStart = performance.now();
    rec.parts = [];
    rec.partStart = 0;
    updateRecUI();
  }

  function togglePause() {
    if (rec.state === 'recording') {
      rec.recorder.pause();
      rec.elapsed += (performance.now() - rec.segStart) / 1000;
      if (rec.elapsed - rec.partStart > 0.05) rec.parts.push([rec.partStart, rec.elapsed]);
      rec.state = 'paused';
    } else if (rec.state === 'paused') {
      closeReplay();
      rec.recorder.resume();
      rec.segStart = performance.now();
      rec.partStart = rec.elapsed;
      rec.state = 'recording';
    }
    updateRecUI();
  }

  // While paused: throw away the last part (or the last few seconds) and record it again.
  // The recording keeps running underneath; the cut bit is simply left out of the clip.
  function cutLastPart() {
    if (rec.state !== 'paused' || !rec.parts.length) return;
    closeReplay();
    rec.parts.pop();
    updateRecUI();
    ui.time.textContent = fmt(keptTime());
  }
  function cutSeconds(sec) {
    if (rec.state !== 'paused' || !rec.parts.length) return;
    closeReplay();
    let left = sec;
    while (left > 0 && rec.parts.length) {
      const last = rec.parts[rec.parts.length - 1], len = last[1] - last[0];
      if (len <= left + 0.05) { rec.parts.pop(); left -= len; } else { last[1] -= left; left = 0; }
    }
    updateRecUI();
    ui.time.textContent = fmt(keptTime());
  }
  // ---------- replay the end of what has been recorded so far (while paused) ----------
  // Plays the last 10 s of the kept parts in a small window over the board. It is
  // never in the video: the recorder draws the board on its own canvas.
  const REPLAY_S = 10;
  const rp = { box: null, video: null, url: null, ranges: [], end: 0, raf: 0 };
  function replayBox() {
    if (rp.box) return rp.box;
    const box = document.createElement('div');
    box.className = 'replay-pop';
    box.innerHTML = `<div class="replay-head"><b>Where you left off</b><span>Only you see and hear this</span><button title="Close">✕</button></div>
      <video playsinline></video>
      <div class="replay-foot"><button data-a="again">↺ Play again</button><span class="replay-note"></span></div>`;
    document.body.appendChild(box);
    rp.box = box;
    rp.video = box.querySelector('video');
    box.querySelector('.replay-head button').addEventListener('click', closeReplay);
    box.querySelector('[data-a="again"]').addEventListener('click', () => startReplayAt());
    return box;
  }
  function closeReplay() {
    if (!rp.box || rp.box.hidden) return;
    rp.video.pause();
    cancelAnimationFrame(rp.raf);
    rp.box.hidden = true;
    if (rp.url) { URL.revokeObjectURL(rp.url); rp.url = null; }
  }
  // file time that is REPLAY_S seconds of kept recording before the end
  function replayStart() {
    let left = REPLAY_S;
    for (let i = rp.ranges.length - 1; i >= 0; i--) {
      const [a, b] = rp.ranges[i];
      if (b - a >= left) return b - left;
      left -= b - a;
    }
    return rp.ranges.length ? rp.ranges[0][0] : 0;
  }
  function startReplayAt() {
    const v = rp.video;
    cancelAnimationFrame(rp.raf);
    v.currentTime = replayStart();
    v.play().catch(() => {});
    const step = () => {
      if (rp.box.hidden) return;
      const t = v.currentTime;
      if (t >= rp.end - 0.03) { v.pause(); return; }
      if (!v.paused && !rp.ranges.some(([a, b]) => t >= a - 0.01 && t < b)) {  // skip parts that were cut
        const next = rp.ranges.find(([a]) => a > t);
        if (next) v.currentTime = next[0]; else { v.pause(); return; }
      }
      rp.raf = requestAnimationFrame(step);
    };
    rp.raf = requestAnimationFrame(step);
  }
  async function replayLast() {
    if (rec.state === 'recording') togglePause();
    if (rec.state !== 'paused' || !rec.parts.length) return;
    const mr = rec.recorder;
    // get everything recorded so far out of the recorder
    await Promise.race([new Promise((res) => { mr.addEventListener('dataavailable', res, { once: true }); try { mr.requestData(); } catch (_) { res(); } }), sleep(800)]);
    const blob = await withDuration(new Blob(rec.chunks, { type: (mr.mimeType || MIME || 'video/webm').split(';')[0] }), rec.elapsed);
    replayBox();
    closeReplay();
    rp.ranges = rec.parts.map((p) => p.slice());
    rp.end = rp.ranges[rp.ranges.length - 1][1];
    rp.url = URL.createObjectURL(blob);
    rp.box.hidden = false;
    rp.box.querySelector('.replay-note').textContent = `Last ${fmt(Math.min(REPLAY_S, keptTime()))} of ${fmt(keptTime())} kept`;
    const v = rp.video;
    v.src = rp.url;
    await Promise.race([once(v, 'loadeddata'), sleep(3000)]);
    startReplayAt();
  }
  $('replayBtn').addEventListener('click', replayLast);
  $('cutPartBtn').addEventListener('click', cutLastPart);
  $('cut5Btn').addEventListener('click', () => cutSeconds(5));

  async function stopRecording() {
    if (rec.state !== 'recording' && rec.state !== 'paused') return;
    const duration = currentElapsed();
    if (rec.state === 'recording' && duration - rec.partStart > 0.05) rec.parts.push([rec.partStart, duration]);
    const keep = rec.parts.slice();
    const recorder = rec.recorder;
    closeReplay();
    const stopped = once(recorder, 'stop');
    recorder.stop();
    await stopped;
    rec.videoTrack.stop(); // keep the microphone open for the next clip
    rec.state = 'idle';
    ui.time.textContent = '0:00';

    const kept = keep.reduce((s, [a, b]) => s + (b - a), 0);
    if (kept < 0.3) {
      alert('Everything in this recording was cut out, so no clip was added.');
      replaceId = null;
      renderTimeline();
      updateRecUI();
      return;
    }
    const whole = keep.length === 1 && keep[0][0] < 0.1 && keep[0][1] > duration - 0.1;
    const blob = await withDuration(new Blob(rec.chunks, { type: (recorder.mimeType || MIME || 'video/webm').split(';')[0] }), duration);
    const clip = {
      keep: whole ? undefined : keep,
      id: 'clip-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      blob,
      mime: blob.type,
      duration,
      in: 0,
      out: duration,
      thumb: rec.thumb,
      created: Date.now(),
      scene: curScene(),
      order: clips.length,
    };
    const idx = clips.findIndex((c) => c.id === replaceId);
    if (idx >= 0) {
      const old = clips[idx];
      clips[idx] = clip;
      unpersist(old.id);
      if (old._url) URL.revokeObjectURL(old._url);
    } else {
      clips.push(clip);
    }
    replaceId = null;
    saveOrder();
    renderTimeline();
    updateRecUI();
  }

  ui.rec.addEventListener('click', startRecording);
  ui.pause.addEventListener('click', togglePause);
  ui.stop.addEventListener('click', stopRecording);
  // The A key pauses / resumes while a clip is recording (otherwise A is the arrow tool).
  WB.recorderKey = () => {
    if (rec.state !== 'recording' && rec.state !== 'paused') return false;
    togglePause();
    return true;
  };

  // Chrome stops redrawing a page you're not looking at (another tab or app in
  // front, minimized or fully covered window), so a recording would freeze.
  // Pause it instead; you resume when you're back.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && rec.state === 'recording') {
      togglePause();
      ui.badge.lastChild.textContent = ' PAUSED (tab was hidden)';
    }
  });

  // ---------- timeline ----------
  const tl = $('timeline');
  const urlOf = (c) => { const root = c._root || c; return root._url || (root._url = URL.createObjectURL(root.blob)); };

  function renderTimeline() {
    tl.innerHTML = '';
    const total = clips.reduce((s, c) => s + clipLen(c), 0);
    $('tlInfo').textContent = clips.length ? `${clips.length} clip${clips.length > 1 ? 's' : ''} · ${fmt(total)}` : '';
    if (!clips.length) {
      const p = document.createElement('div');
      p.className = 'empty';
      p.textContent = 'No clips yet. Press ⏺ Record to record your first section. Each recording becomes a clip here.';
      tl.appendChild(p);
      updateRecUI();
      return;
    }
    clips.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'clip' + (c.id === replaceId ? ' replace' : '');
      const trimmed = c.in > 0.05 || c.out < c.duration - 0.05 || (c.keep && c.keep.length > 0);
      card.innerHTML = `
        <img alt="Clip ${i + 1}" title="Open to watch and trim" />
        <div class="meta"><b>Clip ${i + 1}</b><span>${trimmed ? '✂ ' : ''}${fmt(clipLen(c))}</span></div>
        <div class="acts">
          <button data-a="left" title="Move earlier" ${i === 0 ? 'disabled' : ''}>◀</button>
          <button data-a="trim" title="Watch and trim">✂️</button>
          <button data-a="redo" title="${c.id === replaceId ? 'Cancel re-record' : 'Re-record this clip (the next recording replaces it)'}">🔁</button>
          <button data-a="del" title="Delete clip">🗑️</button>
          <button data-a="right" title="Move later" ${i === clips.length - 1 ? 'disabled' : ''}>▶</button>
        </div>`;
      card.querySelector('img').src = c.thumb || '';
      card.querySelector('img').addEventListener('click', () => openClip(c));
      card.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => clipAction(b.dataset.a, c)));
      tl.appendChild(card);
    });
    if (replaceId) {
      const n = document.createElement('div');
      n.className = 'empty';
      n.textContent = 'The next recording will replace the highlighted clip.';
      tl.appendChild(n);
    }
    updateRecUI();
  }

  function clipAction(action, c) {
    if (rec.state !== 'idle' || exporting) return;
    const i = clips.indexOf(c);
    if (action === 'left' && i > 0) [clips[i - 1], clips[i]] = [clips[i], clips[i - 1]];
    if (action === 'right' && i < clips.length - 1) [clips[i + 1], clips[i]] = [clips[i], clips[i + 1]];
    if (action === 'trim') return openClip(c);
    if (action === 'redo') replaceId = replaceId === c.id ? null : c.id;
    if (action === 'del') {
      if (!confirm(`Delete clip ${i + 1}? This cannot be undone.`)) return;
      clips.splice(i, 1);
      if (replaceId === c.id) replaceId = null;
      unpersist(c.id);
      if (c._url) URL.revokeObjectURL(c._url);
    }
    saveOrder();
    renderTimeline();
  }

  // Delete every clip of the current topic (other topics are not touched).
  $('deleteAllClips').addEventListener('click', async () => {
    if (rec.state !== 'idle' || exporting || !clips.length) return;
    const sel = $('sceneSelect');
    const topic = (sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].text) || 'this topic';
    const total = clips.reduce((sum, c) => sum + clipLen(c), 0);
    const n = clips.length;
    if (!confirm(`Delete ALL ${n} clip${n > 1 ? 's' : ''} (${fmt(total)}) in "${topic}"?\n\nClips in other topics are not affected.\nThis cannot be undone.`)) return;
    const scene = curScene();
    const gone = clips.slice();
    clips = [];
    replaceId = null;
    for (const c of gone) {
      if (c.scene === scene) await unpersist(c.id);
      if (c._url) URL.revokeObjectURL(c._url);
    }
    renderTimeline();
    updateRecUI();
  });

  $('tlToggle').addEventListener('click', () => {
    const hidden = tl.classList.toggle('hidden');
    $('tlToggle').textContent = hidden ? '▸ Timeline' : '▾ Timeline';
    window.dispatchEvent(new Event('resize'));
  });

  // ---------- clip dialog: watch + trim ----------
  const dlg = $('clipDialog');
  const vid = $('dlgVideo');
  const trim = { clip: null, in: 0, out: 0 };
  let stopAt = null;

  function drawTrim() {
    const c = trim.clip;
    if (!c) return;
    const d = c.duration || 1;
    $('trimRange').style.left = (trim.in / d) * 100 + '%';
    $('trimRange').style.width = ((trim.out - trim.in) / d) * 100 + '%';
    $('trimHead').style.left = (Math.min(vid.currentTime, d) / d) * 100 + '%';
    const len = clipLen({ ...c, in: trim.in, out: trim.out });
    $('trimText').textContent = `Start ${fmtPrecise(trim.in)}  ·  End ${fmtPrecise(trim.out)}  ·  Length ${fmtPrecise(len)}`;
    // the parts cut out while recording, shown hatched
    const bar = $('trimBar');
    bar.querySelectorAll('.trim-cut').forEach((n) => n.remove());
    const k = keepOf(c);
    let prev = 0;
    [...k, [d, d]].forEach(([a, b]) => {
      if (a - prev > 0.05) {
        const n = document.createElement('div');
        n.className = 'trim-cut';
        n.title = 'Cut out while recording';
        n.style.left = (prev / d) * 100 + '%';
        n.style.width = ((a - prev) / d) * 100 + '%';
        bar.appendChild(n);
      }
      prev = Math.max(prev, b);
    });
  }
  // Skip the cut-out parts while the clip plays in the dialog.
  (function skipCuts() {
    const c = trim.clip;
    if (c && c.keep && !vid.paused) {
      const t = vid.currentTime;
      if (!c.keep.some(([a, b]) => t >= a - 0.01 && t < b)) {
        const next = c.keep.find(([a]) => a > t);
        if (next) vid.currentTime = next[0]; else vid.pause();
      }
    }
    requestAnimationFrame(skipCuts);
  })();

  function openClip(c) {
    ensureMonitor();
    trim.clip = c;
    trim.in = c.in;
    trim.out = c.out;
    $('dlgTitle').textContent = `Clip ${clips.indexOf(c) + 1}: watch and trim`;
    $('trimUI').hidden = false;
    $('dlgSave').hidden = false;
    $('previewUI').hidden = true;
    vid.controls = false;
    vid.src = urlOf(c);
    vid.currentTime = Math.max(c.in, keepOf(c)[0][0]);
    stopAt = null;
    drawTrim();
    dlg.showModal();
  }

  vid.addEventListener('timeupdate', () => {
    if (stopAt !== null && vid.currentTime >= stopAt) {
      vid.pause();
      stopAt = null;
    }
    drawTrim();
  });
  vid.addEventListener('ended', () => { stopAt = null; });

  $('trimBar').addEventListener('click', (e) => {
    if (!trim.clip) return;
    const r = e.currentTarget.getBoundingClientRect();
    vid.currentTime = ((e.clientX - r.left) / r.width) * trim.clip.duration;
    drawTrim();
  });
  $('dlgPlay').addEventListener('click', () => {
    stopAt = null;
    vid.paused ? vid.play() : vid.pause();
  });
  $('dlgPlayTrim').addEventListener('click', () => {
    vid.currentTime = trim.in;
    stopAt = trim.out;
    vid.play();
  });
  $('setIn').addEventListener('click', () => {
    trim.in = Math.min(vid.currentTime, trim.out - 0.2);
    drawTrim();
  });
  $('setOut').addEventListener('click', () => {
    trim.out = Math.max(Math.min(vid.currentTime, trim.clip.duration), trim.in + 0.2);
    drawTrim();
  });
  $('resetTrim').addEventListener('click', () => {
    trim.in = 0;
    trim.out = trim.clip.duration;
    drawTrim();
  });
  $('dlgSave').addEventListener('click', () => {
    const c = trim.clip;
    c.in = Math.max(0, trim.in);
    c.out = Math.min(c.duration, trim.out);
    persist(c);
    renderTimeline();
    dlg.close();
  });
  $('dlgCancel').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => {
    vid.pause();
    trim.clip = null;
    pvStop();
    $('previewUI').hidden = true;
    pvCanvas.hidden = true;
    vid.hidden = false;
  });

  // ---------- loudness ----------
  // Boosts the voice in the exported video (and in previews, so you hear it first).
  // A limiter after the boost stops loud bits from distorting.
  let loudness = 1;
  try { loudness = Math.max(1, Math.min(4, parseFloat(localStorage.getItem('wb-loudness')) || 1)); } catch (_) { /* default */ }
  function loudChain(ac, out) {
    const gain = ac.createGain();
    gain.gain.value = loudness;
    const lim = ac.createDynamicsCompressor();
    lim.threshold.value = -2;
    lim.knee.value = 0;
    lim.ratio.value = 20;
    lim.attack.value = 0.002;
    lim.release.value = 0.2;
    gain.connect(lim).connect(out);
    return gain;
  }
  // Previews play through the same boost.
  let monAc = null, monGain = null;
  function ensureMonitor() {
    try {
      if (!monAc) {
        monAc = new AudioContext();
        monGain = loudChain(monAc, monAc.destination);
        [vid, ...pv.vids].forEach((v) => monAc.createMediaElementSource(v).connect(monGain));
      }
      monAc.resume();
      monGain.gain.value = loudness;
    } catch (_) { /* previews just play at normal volume */ }
  }
  const loudInput = $('loudness');
  const showLoud = () => { $('loudVal').textContent = Math.round(loudness * 100) + '%'; };
  loudInput.value = loudness;
  showLoud();
  loudInput.addEventListener('input', () => {
    loudness = parseFloat(loudInput.value) || 1;
    try { localStorage.setItem('wb-loudness', String(loudness)); } catch (_) { /* not saved */ }
    if (monGain) monGain.gain.value = loudness;
    showLoud();
  });

  // ---------- gapless playback helpers ----------
  // Two video elements take turns: while one plays, the next clip is loaded and
  // parked on its first frame in the other, so a cut never shows a black frame.
  function makeVideo() {
    const v = document.createElement('video');
    v.playsInline = true;
    v.preload = 'auto';
    return v;
  }
  // Load clip c into video v and park it `local` seconds into its trimmed part.
  async function parkAt(v, c, local = 0) {
    if (v._clip !== c) {
      v._clip = c;
      v.src = urlOf(c);
      await once(v, 'loadeddata');
    }
    const target = c.in + Math.max(0, Math.min(clipLen(c) - 0.05, local));
    if (Math.abs(v.currentTime - target) > 0.02) {
      v.currentTime = target;
      await once(v, 'seeked');
    }
  }

  // ---------- preview all: one seekable timeline over every clip ----------
  const pvCanvas = $('pvCanvas');
  const pvCtx = pvCanvas.getContext('2d');
  const pv = {
    active: false, list: [], starts: [], total: 0, idx: -1, playing: false, dragging: false,
    vids: [makeVideo(), makeVideo()], cur: 0, nextReady: -1, token: 0,
  };
  const pvLen = (i) => clipLen(pv.list[i]);
  const clamp01 = (v, max) => Math.max(0, Math.min(max, v));
  const pvVid = () => pv.vids[pv.cur];
  const pvOther = () => pv.vids[1 - pv.cur];
  function pvGlobal() {
    if (pv.idx < 0) return 0;
    return pv.starts[pv.idx] + clamp01(pvVid().currentTime - pv.list[pv.idx].in, pvLen(pv.idx));
  }
  function pvDraw() {
    const g = pvGlobal();
    const pct = pv.total ? (g / pv.total) * 100 : 0;
    $('pvHead').style.left = pct + '%';
    $('pvFill').style.width = pct + '%';
    $('pvTime').textContent = `${fmt(g)} / ${fmt(pv.total)}${pv.idx >= 0 ? `  ·  Clip ${pv.list[pv.idx]._ci + 1} of ${clips.length}` : ''}`;
    $('pvPlay').textContent = pv.playing ? '⏸ Pause' : '▶ Play';
  }
  // Get the clip after the current one ready in the spare video element.
  function pvPreloadNext() {
    const i = pv.idx + 1;
    pv.nextReady = -1;
    if (i >= pv.list.length) return;
    const token = pv.token;
    const v = pvOther();
    v.pause();
    parkAt(v, pv.list[i], 0).then(() => { if (token === pv.token && pv.idx + 1 === i) pv.nextReady = i; }).catch(() => {});
  }
  async function pvSeek(g) {
    g = clamp01(g, pv.total);
    let i = pv.starts.findIndex((s, k) => g < s + pvLen(k));
    if (i < 0) i = pv.list.length - 1;
    const token = ++pv.token;
    const v = pvVid();
    v.pause();
    if (v._clip !== pv.list[i] && pvOther()._clip === pv.list[i]) pv.cur = 1 - pv.cur; // already loaded there
    await parkAt(pvVid(), pv.list[i], g - pv.starts[i]);
    if (token !== pv.token) return;
    pv.idx = i;
    pvPreloadNext();
    if (pv.playing && !pv.dragging) pvVid().play().catch(() => {});
  }
  function pvSetPlaying(on) {
    pv.playing = on;
    if (on) {
      if (pvGlobal() >= pv.total - 0.1) pvSeek(0);
      else pvVid().play().catch(() => {});
    } else pvVid().pause();
    pvDraw();
  }
  function pvTick() {
    if (!pv.active) return;
    const v = pvVid(), c = pv.list[pv.idx];
    if (c && v._clip === c && v.readyState >= 2) pvCtx.drawImage(v, 0, 0, pvCanvas.width, pvCanvas.height);
    if (c && pv.playing && !pv.dragging && (v.ended || v.currentTime >= c.out - 0.03)) {
      if (pv.idx < pv.list.length - 1) {
        if (pv.nextReady === pv.idx + 1) {
          // instant cut to the parked next clip
          v.pause();
          pv.cur = 1 - pv.cur;
          pv.idx++;
          pvVid().play().catch(() => {});
          pvCtx.drawImage(pvVid(), 0, 0, pvCanvas.width, pvCanvas.height);
          pvPreloadNext();
        } else {
          v.pause(); // next one is still loading: hold the last frame
        }
      } else {
        v.pause();
        pv.playing = false;
      }
    }
    pvDraw();
    requestAnimationFrame(pvTick);
  }
  const barToGlobal = (e) => {
    const rr = $('pvBar').getBoundingClientRect();
    return clamp01((e.clientX - rr.left) / rr.width, 1) * pv.total;
  };
  $('pvBar').addEventListener('pointerdown', (e) => {
    pv.dragging = true;
    $('pvBar').setPointerCapture(e.pointerId);
    pvVid().pause();
    pvSeek(barToGlobal(e));
  });
  $('pvBar').addEventListener('pointermove', (e) => { if (pv.dragging) pvSeek(barToGlobal(e)); });
  const endDrag = () => {
    if (!pv.dragging) return;
    pv.dragging = false;
    if (pv.playing) pvVid().play().catch(() => {});
  };
  $('pvBar').addEventListener('pointerup', endDrag);
  $('pvBar').addEventListener('pointercancel', endDrag);
  $('pvPlay').addEventListener('click', () => pvSetPlaying(!pv.playing));
  $('pvRestart').addEventListener('click', () => pvSeek(0));
  $('pvBack').addEventListener('click', () => pvSeek(pvGlobal() - 5));
  $('pvFwd').addEventListener('click', () => pvSeek(pvGlobal() + 5));
  dlg.addEventListener('keydown', (e) => {
    if (!pv.active) return;
    if (e.key === ' ') { e.preventDefault(); pvSetPlaying(!pv.playing); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); pvSeek(pvGlobal() - 5); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); pvSeek(pvGlobal() + 5); }
    else return;
    e.stopPropagation();
  });
  function pvStop() {
    pv.active = false;
    pv.playing = false;
    pv.token++;
    pv.vids.forEach((v) => v.pause());
  }

  $('previewAll').addEventListener('click', async () => {
    if (!clips.length) return;
    trim.clip = null;
    $('dlgTitle').textContent = 'Preview: all clips in order';
    $('trimUI').hidden = true;
    $('dlgSave').hidden = true;
    $('previewUI').hidden = false;
    vid.hidden = true;
    pvCanvas.hidden = false;
    ensureMonitor();
    pv.list = expand(clips);
    pv.starts = [];
    let acc = 0;
    for (const c of pv.list) { pv.starts.push(acc); acc += clipLen(c); }
    pv.total = acc;
    pv.idx = -1;
    pv.cur = 0;
    pv.vids.forEach((v) => { v._clip = null; });
    pv.active = true;
    pv.playing = true;
    const segs = $('pvSegs');
    segs.innerHTML = '';
    clips.forEach((c, i) => {
      const d = document.createElement('div');
      d.style.width = (pv.total ? (clipLen(c) / pv.total) * 100 : 0) + '%';
      d.textContent = `Clip ${i + 1}`;
      segs.appendChild(d);
    });
    pvCtx.fillStyle = '#fdfdfb';
    pvCtx.fillRect(0, 0, pvCanvas.width, pvCanvas.height);
    dlg.showModal();
    requestAnimationFrame(pvTick);
    await pvSeek(0);
  });

  // ---------- export ----------
  let exporting = false;
  let exportAbort = null;

  async function exportVideo() {
    if (exporting) {
      if (exportAbort) exportAbort.abort();
      return;
    }
    if (!clips.length) return;
    exporting = true;
    exportAbort = new AbortController();
    const btn = $('exportBtn');
    updateRecUI();
    btn.disabled = false;
    btn.textContent = 'Exporting… 0% (click to cancel)';

    const out = document.createElement('canvas');
    out.width = RW;
    out.height = RH;
    const octx = out.getContext('2d');
    octx.fillStyle = '#000';
    octx.fillRect(0, 0, RW, RH);

    // Two videos take turns (the next clip is parked while the current one plays),
    // and the recorder runs continuously, so cuts are seamless.
    const vids = [makeVideo(), makeVideo()];
    const ac = new AudioContext();
    await ac.resume();
    const dest = ac.createMediaStreamDestination();
    const boost = loudChain(ac, dest); // loudness boost + limiter
    vids.forEach((v) => ac.createMediaElementSource(v).connect(boost)); // to the file only, not the speakers

    // The recorder is created once the first clip's first frame is on the canvas,
    // so the file doesn't start with a black frame.
    let vTrack = null, mr = null;
    const chunks = [];
    const startRecorder = () => {
      vTrack = out.captureStream(FPS).getVideoTracks()[0];
      mr = new MediaRecorder(new MediaStream([vTrack, ...dest.stream.getAudioTracks()]), REC_OPTS);
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      mr.start(1000);
    };

    let active = null;
    // Chrome stops redrawing hidden pages, which would freeze the picture while
    // the sound carries on. So while this tab is hidden, export holds still.
    let held = false, playingNow = false;
    const whenVisible = () => (document.hidden ? new Promise((res) => {
      const f = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', f); res(); } };
      document.addEventListener('visibilitychange', f);
    }) : Promise.resolve());
    const onVisibility = () => {
      if (document.hidden) {
        held = true;
        if (active) active.pause();
        if (mr && mr.state === 'recording') mr.pause();
        btn.textContent = 'Export paused: come back to this tab to continue';
      } else if (held) {
        held = false;
        if (mr && mr.state === 'paused') mr.resume();
        if (active && playingNow) active.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    let drawing = true;
    const draw = () => {
      if (!drawing) return;
      if (active && active.readyState >= 2) octx.drawImage(active, 0, 0, RW, RH);
      requestAnimationFrame(draw);
    };
    draw();

    const list = expand(clips);
    const total = list.reduce((s, c) => s + clipLen(c), 0);
    const signal = exportAbort.signal;
    let ok = false;
    try {
      await parkAt(vids[0], list[0]);
      let nextPrep = list.length > 1 ? parkAt(vids[1], list[1]) : null;
      let done = 0;
      for (let i = 0; i < list.length && !signal.aborted; i++) {
        const v = vids[i % 2], c = list[i];
        if (i > 0) await nextPrep;
        await whenVisible();
        active = v;
        octx.drawImage(v, 0, 0, RW, RH);
        if (i === 0) startRecorder();
        await v.play();
        playingNow = true;
        if (i > 0) {
          const spare = vids[(i + 1) % 2];
          spare.pause();
          nextPrep = i + 1 < list.length ? parkAt(spare, list[i + 1]) : null;
        }
        await new Promise((resolve) => {
          const check = () => {
            if (held) { requestAnimationFrame(check); return; }
            if (signal.aborted || v.ended || v.currentTime >= c.out - 0.02) return resolve();
            btn.textContent = `Exporting… ${Math.floor(((done + Math.max(0, v.currentTime - c.in)) / total) * 100)}% (click to cancel)`;
            requestAnimationFrame(check);
          };
          check();
        });
        playingNow = false;
        if (i + 1 < list.length && nextPrep) await nextPrep; // hold this frame until the next is parked
        v.pause();
        done += clipLen(c);
      }
      ok = !signal.aborted;
    } catch (err) {
      alert('Export failed: ' + (err.message || err));
    }

    if (mr && mr.state !== 'inactive') {
      const stopped = once(mr, 'stop');
      mr.stop();
      await stopped;
    }
    drawing = false;
    document.removeEventListener('visibilitychange', onVisibility);
    if (vTrack) vTrack.stop();
    ac.close();

    if (ok && chunks.length) {
      const blob = await withDuration(new Blob(chunks, { type: ((mr && mr.mimeType) || MIME || 'video/webm').split(';')[0] }), total);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
      a.download = `explainer-${stamp}.${EXT}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
    }
    exporting = false;
    exportAbort = null;
    btn.textContent = '⬇ Export video';
    updateRecUI();
  }
  $('exportBtn').addEventListener('click', exportVideo);

  // Don't lose a recording by accident.
  window.addEventListener('beforeunload', (e) => {
    if (rec.state !== 'idle' || exporting) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ---------- start ----------
  (async () => {
    db = await openDb();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) { /* optional */ }
    await migrateLegacyClips();
    await loadSceneClips();
    window.dispatchEvent(new Event('resize'));
  })();

  // ---------- topics: every topic (scene) has its own clips ----------
  // Clips made before topics existed have no scene; they belong to the first
  // explainer (or the blank board if there is none).
  async function migrateLegacyClips() {
    const all = (await dbDo('readonly', (s) => s.getAll())) || [];
    const first = (window.WB_SCENES && window.WB_SCENES[0] && window.WB_SCENES[0].id) || 'blank';
    for (const c of all) if (!c.scene) { c.scene = first; await dbDo('readwrite', (s) => s.put(c)); }
  }
  let loadToken = 0;
  async function loadSceneClips() {
    const token = ++loadToken;
    const id = curScene();
    const all = (await dbDo('readonly', (s) => s.getAll())) || [];
    if (token !== loadToken) return;
    clips.forEach((c) => c._url && URL.revokeObjectURL(c._url));
    clips = all.filter((c) => c.scene === id).sort((a, b) => a.order - b.order);
    replaceId = null;
    renderTimeline();
    updateRecUI();
  }
  window.addEventListener('wb-scene', () => { if (db) loadSceneClips(); });
  window.addEventListener('wb-topic-deleted', async (e) => {
    const all = (await dbDo('readonly', (s) => s.getAll())) || [];
    for (const c of all) if (c.scene === e.detail) await unpersist(c.id);
  });
  updateRecUI();
})();
