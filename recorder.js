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
  const clipLen = (c) => Math.max(0, c.out - c.in);
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
  const persist = (c) => dbDo('readwrite', (s) => s.put({ id: c.id, blob: c.blob, duration: c.duration, in: c.in, out: c.out, thumb: c.thumb, order: c.order, mime: c.mime, created: c.created }));
  const unpersist = (id) => dbDo('readwrite', (s) => s.delete(id));
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
  };

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
    rctx.setTransform(s, 0, 0, s, 0, 0);
    rctx.fillStyle = 'rgba(230, 40, 40, 0.9)';
    rctx.shadowColor = 'rgba(230, 40, 40, 0.8)';
    rctx.shadowBlur = 14;
    rctx.beginPath();
    rctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
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
    renderRecFrame(WB.now());
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

  function updateRecUI() {
    const busy = rec.state !== 'idle';
    const replacing = replaceId && clips.find((c) => c.id === replaceId);
    ui.rec.disabled = busy || MIME === null;
    ui.rec.textContent = replacing ? `⏺ Re-record clip ${clips.indexOf(replacing) + 1}` : '⏺ Record';
    ui.rec.classList.toggle('replacing', !!replacing);
    ui.pause.disabled = !(rec.state === 'recording' || rec.state === 'paused');
    ui.pause.textContent = rec.state === 'paused' ? '⏵ Resume' : '⏸ Pause';
    ui.stop.disabled = !(rec.state === 'recording' || rec.state === 'paused');
    ui.badge.hidden = !(rec.state === 'recording' || rec.state === 'paused');
    ui.badge.classList.toggle('paused', rec.state === 'paused');
    ui.badge.lastChild.textContent = rec.state === 'paused' ? ' PAUSED' : ' REC';
    $('exportBtn').disabled = busy || !clips.length || exporting;
    $('previewAll').disabled = busy || !clips.length || exporting;
  }

  setInterval(() => {
    if (rec.state === 'recording' || rec.state === 'paused') ui.time.textContent = fmt(currentElapsed());
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
    updateRecUI();
  }

  function togglePause() {
    if (rec.state === 'recording') {
      rec.recorder.pause();
      rec.elapsed += (performance.now() - rec.segStart) / 1000;
      rec.state = 'paused';
    } else if (rec.state === 'paused') {
      rec.recorder.resume();
      rec.segStart = performance.now();
      rec.state = 'recording';
    }
    updateRecUI();
  }

  async function stopRecording() {
    if (rec.state !== 'recording' && rec.state !== 'paused') return;
    const duration = currentElapsed();
    const recorder = rec.recorder;
    const stopped = once(recorder, 'stop');
    recorder.stop();
    await stopped;
    rec.videoTrack.stop(); // keep the microphone open for the next clip
    rec.state = 'idle';
    ui.time.textContent = '0:00';

    const blob = await withDuration(new Blob(rec.chunks, { type: (recorder.mimeType || MIME || 'video/webm').split(';')[0] }), duration);
    const clip = {
      id: 'clip-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      blob,
      mime: blob.type,
      duration,
      in: 0,
      out: duration,
      thumb: rec.thumb,
      created: Date.now(),
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

  // ---------- timeline ----------
  const tl = $('timeline');
  const urlOf = (c) => c._url || (c._url = URL.createObjectURL(c.blob));

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
      const trimmed = c.in > 0.05 || c.out < c.duration - 0.05;
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
  let previewAbort = null;

  function drawTrim() {
    const c = trim.clip;
    if (!c) return;
    const d = c.duration || 1;
    $('trimRange').style.left = (trim.in / d) * 100 + '%';
    $('trimRange').style.width = ((trim.out - trim.in) / d) * 100 + '%';
    $('trimHead').style.left = (Math.min(vid.currentTime, d) / d) * 100 + '%';
    $('trimText').textContent = `Start ${fmtPrecise(trim.in)}  ·  End ${fmtPrecise(trim.out)}  ·  Length ${fmtPrecise(trim.out - trim.in)}`;
  }

  function openClip(c) {
    trim.clip = c;
    trim.in = c.in;
    trim.out = c.out;
    $('dlgTitle').textContent = `Clip ${clips.indexOf(c) + 1}: watch and trim`;
    $('trimUI').hidden = false;
    $('dlgSave').hidden = false;
    vid.controls = false;
    vid.src = urlOf(c);
    vid.currentTime = c.in;
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
    if (previewAbort) previewAbort.abort();
    trim.clip = null;
  });

  // ---------- play clips in order (used by preview and export) ----------
  async function playSequence(video, list, { signal, beforeClip, afterClip, onProgress } = {}) {
    let done = 0;
    for (const c of list) {
      if (signal && signal.aborted) return false;
      video.src = urlOf(c);
      await once(video, 'loadeddata');
      if (c.in > 0.01) {
        video.currentTime = c.in;
        await once(video, 'seeked');
      }
      if (beforeClip) await beforeClip(c);
      await video.play();
      await new Promise((resolve) => {
        const check = () => {
          const aborted = signal && signal.aborted;
          if (aborted || video.ended || video.currentTime >= c.out - 0.02) {
            video.pause();
            resolve();
          } else {
            if (onProgress) onProgress(done + Math.max(0, video.currentTime - c.in));
            requestAnimationFrame(check);
          }
        };
        check();
      });
      if (afterClip) afterClip(c);
      done += clipLen(c);
    }
    return !(signal && signal.aborted);
  }

  $('previewAll').addEventListener('click', async () => {
    if (!clips.length) return;
    trim.clip = null;
    $('dlgTitle').textContent = 'Preview: all clips in order';
    $('trimUI').hidden = true;
    $('dlgSave').hidden = true;
    vid.controls = false;
    dlg.showModal();
    previewAbort = new AbortController();
    const total = clips.reduce((s, c) => s + clipLen(c), 0);
    await playSequence(vid, clips.slice(), {
      signal: previewAbort.signal,
      onProgress: (s) => { $('dlgTitle').textContent = `Preview: ${fmt(s)} / ${fmt(total)}`; },
    });
    previewAbort = null;
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

    const video = document.createElement('video');
    video.playsInline = true;
    const ac = new AudioContext();
    await ac.resume();
    const dest = ac.createMediaStreamDestination();
    ac.createMediaElementSource(video).connect(dest); // to the file only, not the speakers

    const vTrack = out.captureStream(FPS).getVideoTracks()[0];
    const stream = new MediaStream([vTrack, ...dest.stream.getAudioTracks()]);
    const mr = new MediaRecorder(stream, REC_OPTS);
    const chunks = [];
    mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

    let drawing = true;
    const draw = () => {
      if (!drawing) return;
      if (video.readyState >= 2) octx.drawImage(video, 0, 0, RW, RH);
      requestAnimationFrame(draw);
    };
    draw();

    const total = clips.reduce((s, c) => s + clipLen(c), 0);
    let ok = false;
    try {
      ok = await playSequence(video, clips.slice(), {
        signal: exportAbort.signal,
        beforeClip: async () => {
          octx.drawImage(video, 0, 0, RW, RH); // first frame of this clip, no flash of the last one
          if (mr.state === 'inactive') mr.start(1000);
          else mr.resume();
        },
        afterClip: () => { if (mr.state === 'recording') mr.pause(); },
        onProgress: (s) => { btn.textContent = `Exporting… ${Math.floor((s / total) * 100)}% (click to cancel)`; },
      });
    } catch (err) {
      alert('Export failed: ' + (err.message || err));
    }

    if (mr.state !== 'inactive') {
      const stopped = once(mr, 'stop');
      mr.stop();
      await stopped;
    }
    drawing = false;
    vTrack.stop();
    ac.close();

    if (ok && chunks.length) {
      const blob = await withDuration(new Blob(chunks, { type: (mr.mimeType || MIME || 'video/webm').split(';')[0] }), total);
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
    const saved = (await dbDo('readonly', (s) => s.getAll())) || [];
    clips = saved.sort((a, b) => a.order - b.order);
    renderTimeline();
    window.dispatchEvent(new Event('resize'));
  })();
  updateRecUI();
})();
