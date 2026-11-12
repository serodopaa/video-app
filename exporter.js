/*
 * Frame-exact export (used by recorder.js when the browser supports WebCodecs).
 *
 * The old export replayed the clips in real time and re-recorded the screen, so any moment the browser
 * was busy became a stutter in the file. Here every frame of the clips is encoded with an exact
 * timestamp (taken from the clip itself), and the sound is computed separately and lined up exactly,
 * so a busy computer only makes the export take longer: the video itself stays smooth.
 *
 *   window.WB_EXACT_EXPORT({ list, speed, loudness, urlOf, signal, progress })
 *     list: kept pieces in order ({ in, out, blob/_root }), as from recorder.js expand()
 *     → { blob } on success, { aborted: true } when cancelled, null when not possible (old browser):
 *       recorder.js then falls back to the real-time export.
 */
(() => {
  'use strict';
  const W = 1920, H = 1080, SR = 48000, FADE = 0.015;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const once = (el, ev) => new Promise((res) => el.addEventListener(ev, res, { once: true }));

  async function pickCodecs() {
    if (!window.VideoEncoder || !window.AudioEncoder || !window.Mp4Muxer || !('requestVideoFrameCallback' in HTMLVideoElement.prototype)) return null;
    let video = null;
    for (const codec of ['avc1.640028', 'avc1.4d4028', 'avc1.42e028']) {
      const cfg = { codec, width: W, height: H, bitrate: 8_000_000, framerate: 30, avc: { format: 'avc' } };
      try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) { video = cfg; break; } } catch (_) { /* try next */ }
    }
    let audio = null;
    for (const [codec, mux] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) {
      const cfg = { codec, sampleRate: SR, numberOfChannels: 2, bitrate: 160_000 };
      try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) { audio = { cfg, mux }; break; } } catch (_) { /* try next */ }
    }
    return video && audio ? { video, audio } : null;
  }

  // ---------- sound ----------
  // Pitch-preserving speed-up (WSOLA): overlapping 21 ms windows are copied from the input at the faster
  // rate, each nudged to where it lines up best with the previous one, so speech speeds up without
  // sounding like a chipmunk.
  async function wsola(chs, speed) {
    const N = 1024, HOP = N / 2, TOL = 256, x = chs[0];
    const inLen = x.length, outLen = Math.max(0, Math.floor(inLen / speed));
    const out = chs.map(() => new Float32Array(outLen + N));
    const win = new Float32Array(N);
    for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N); // periodic Hann: overlaps sum to 1
    let prev = -1;
    for (let k = 0, o = 0; o < outLen; k++, o += HOP) {
      let best = Math.min(Math.round(o * speed), Math.max(0, inLen - N));
      const ref = prev + HOP;
      if (prev >= 0 && ref + N <= inLen) {
        let bestC = -Infinity;
        for (let d = -TOL; d <= TOL; d += 2) {
          const p = Math.round(o * speed) + d;
          if (p < 0 || p + N > inLen) continue;
          let c = 0;
          for (let i = 0; i < N; i += 8) c += x[ref + i] * x[p + i];
          if (c > bestC) { bestC = c; best = p; }
        }
      }
      for (let c = 0; c < chs.length; c++) {
        const src = chs[c], dst = out[c];
        for (let i = 0; i < N && best + i < inLen; i++) dst[o + i] += src[best + i] * win[i];
      }
      prev = best;
      if (k % 400 === 399) await sleep(0); // keep the page responsive
    }
    return out.map((o) => o.subarray(0, outLen));
  }

  async function renderAudio(pieces, speed, loudness, signal, progress) {
    const total = pieces.reduce((s, p) => s + (p.out - p.in) / speed, 0);
    const n = Math.max(1, Math.ceil(total * SR));
    const mix = [new Float32Array(n), new Float32Array(n)];
    const decoded = new Map();
    const decode = (root) => {
      if (!decoded.has(root)) {
        decoded.set(root, root.blob.arrayBuffer()
          .then((ab) => new OfflineAudioContext(2, 1, SR).decodeAudioData(ab)) // resampled to 48 kHz
          .catch(() => null)); // a clip without sound
      }
      return decoded.get(root);
    };
    let at = 0;
    for (let i = 0; i < pieces.length; i++) {
      if (signal.aborted) return null;
      const p = pieces[i], root = p._root || p, buf = await decode(root);
      const len = (p.out - p.in) / speed;
      if (buf) {
        const a = Math.floor(p.in * SR), b = Math.min(buf.length, Math.floor(p.out * SR));
        if (b > a) {
          let chs = [0, 1].map((c) => buf.getChannelData(Math.min(c, buf.numberOfChannels - 1)).subarray(a, b));
          if (speed !== 1) chs = await wsola(chs, speed);
          const start = Math.round(at * SR), m = Math.min(chs[0].length, n - start), F = Math.min(Math.round(FADE * SR), m >> 2);
          for (let c = 0; c < 2; c++) {
            const src = chs[c], dst = mix[c];
            for (let j = 0; j < m; j++) {
              const g = j < F ? j / F : j > m - F ? (m - j) / F : 1; // short fades: no clicks at joins
              dst[start + j] += src[j] * g;
            }
          }
        }
      }
      at += len;
      progress(0.1 * ((i + 1) / pieces.length));
    }
    // loudness boost + limiter + headroom, the same chain as the preview
    const oc = new OfflineAudioContext(2, n, SR);
    const ab = oc.createBuffer(2, n, SR);
    ab.copyToChannel(mix[0], 0);
    ab.copyToChannel(mix[1], 1);
    const src = oc.createBufferSource();
    src.buffer = ab;
    const gain = oc.createGain();
    gain.gain.value = loudness;
    const lim = oc.createDynamicsCompressor();
    lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.2;
    const trim = oc.createGain();
    trim.gain.value = 0.8;
    src.connect(gain).connect(lim).connect(trim).connect(oc.destination);
    src.start();
    return oc.startRendering();
  }

  // ---------- picture ----------
  // Each clip piece is played (muted) and every frame the browser decodes is encoded with the clip's own
  // time, mapped onto the output timeline. Frames are never sampled by a timer, so none are repeated.
  async function encodeVideo(pieces, speed, urlOf, encoder, signal, progress) {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    const frameDur = Math.round(1e6 / 30 / speed);
    let outStart = 0, lastKey = -Infinity, lastTs = -1, total = pieces.reduce((s, p) => s + (p.out - p.in), 0), done = 0;
    const put = (ts) => {
      if (ts <= lastTs) return;
      lastTs = ts;
      const f = new VideoFrame(v, { timestamp: ts, duration: frameDur });
      const key = ts - lastKey >= 2e6; // a keyframe every 2 s
      if (key) lastKey = ts;
      encoder.encode(f, { keyFrame: key });
      f.close();
    };
    for (const p of pieces) {
      if (signal.aborted) return false;
      const url = urlOf(p);
      if (v._url !== url) { v._url = url; v.src = url; await once(v, 'loadeddata'); }
      v.currentTime = p.in;
      await once(v, 'seeked');
      v.playbackRate = 1;
      const tsOf = (mt) => Math.round((outStart + (mt - p.in) / speed) * 1e6);
      put(tsOf(p.in)); // the frame at the very start of the piece
      await new Promise((resolve) => {
        let finished = false;
        const finish = () => { if (!finished) { finished = true; v.pause(); resolve(); } };
        let lastMt = p.in;
        const onFrame = (_now, meta) => {
          if (finished) return;
          const mt = meta.mediaTime;
          if (signal.aborted || mt >= p.out - 0.002) return finish();
          // a skipped frame (the computer couldn't keep up): go back, and play slower from there on
          if (mt - lastMt > 1.6 / 30 && v.playbackRate > 0.26) {
            v.playbackRate = Math.max(0.25, v.playbackRate / 2);
            v.currentTime = lastMt;
            v.requestVideoFrameCallback(onFrame);
            return;
          }
          lastMt = Math.max(lastMt, mt);
          if (mt > p.in + 0.002) put(tsOf(mt));
          progress(0.1 + 0.9 * ((done + (mt - p.in)) / total));
          // the encoder is behind: let it catch up before more frames come
          if (encoder.encodeQueueSize > 6) {
            v.pause();
            const wait = () => (finished ? 0 : encoder.encodeQueueSize > 2 ? setTimeout(wait, 10) : v.play().catch(() => {}));
            wait();
          }
          v.requestVideoFrameCallback(onFrame);
        };
        v.requestVideoFrameCallback(onFrame);
        v.addEventListener('ended', finish, { once: true });
        // a hidden tab doesn't decode frames: hold until it's visible again
        const vis = () => { if (!finished) { if (document.hidden) v.pause(); else v.play().catch(() => {}); } };
        document.addEventListener('visibilitychange', vis);
        v.play().catch(finish);
        const check = setInterval(() => { if (finished) { clearInterval(check); document.removeEventListener('visibilitychange', vis); } }, 200);
      });
      outStart += (p.out - p.in) / speed;
      done += p.out - p.in;
    }
    v.removeAttribute('src');
    v.load();
    return !signal.aborted;
  }

  window.WB_EXACT_EXPORT = async ({ list, speed = 1, loudness = 1, urlOf, signal, progress = () => {} }) => {
    const codecs = await pickCodecs();
    if (!codecs || !list.length) return null;
    const { Muxer, ArrayBufferTarget } = window.Mp4Muxer;
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: 'avc', width: W, height: H },
      audio: { codec: codecs.audio.mux, numberOfChannels: 2, sampleRate: SR },
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });
    let failed = null;
    const venc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { failed = e; } });
    const aenc = new AudioEncoder({ output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), error: (e) => { failed = e; } });
    venc.configure(codecs.video);
    aenc.configure(codecs.audio.cfg);
    try {
      // 1. the sound (fast: computed, not played)
      const audio = await renderAudio(list, speed, loudness, signal, progress);
      if (!audio) throw new Error('aborted');
      const chs = [audio.getChannelData(0), audio.getChannelData(1)], STEP = 4800;
      for (let i = 0; i < audio.length; i += STEP) {
        const m = Math.min(STEP, audio.length - i), data = new Float32Array(m * 2);
        data.set(chs[0].subarray(i, i + m), 0);
        data.set(chs[1].subarray(i, i + m), m);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: SR, numberOfFrames: m, numberOfChannels: 2, timestamp: Math.round((i / SR) * 1e6), data });
        aenc.encode(ad);
        ad.close();
        if (aenc.encodeQueueSize > 20) await sleep(5);
      }
      await aenc.flush();
      // 2. the picture (plays each clip once, without needing it to be smooth)
      const ok = await encodeVideo(list, speed, urlOf, venc, signal, progress);
      if (!ok) throw new Error('aborted');
      await venc.flush();
      if (failed) throw failed;
      muxer.finalize();
      return { blob: new Blob([target.buffer], { type: 'video/mp4' }) };
    } catch (err) {
      try { venc.close(); } catch (_) { /* closed */ }
      try { aenc.close(); } catch (_) { /* closed */ }
      if (signal.aborted) return { aborted: true };
      console.warn('Frame-exact export failed, using the real-time export instead:', err);
      return null;
    }
  };
})();
