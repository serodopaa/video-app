// Stylised brain illustrations (SVG markup) used by the "Views of the brain" topic.
// Every function returns SVG *inner* markup in a local 600 x 470 box (x right, y down) so it can be
// placed anywhere with <g transform="translate(..) scale(..)">. `id` keeps gradient / clip ids unique.
// Orientation: lateral and medial look at the LEFT side of the head (anterior = left of the picture).
// Superior, inferior, anterior and posterior views are mirror-symmetric, drawn as one half + its mirror.
(() => {
  const C = {
    frontal: '#f3b3a2', parietal: '#f6d98c', temporal: '#a6d3a0', occipital: '#9bc4ec',
    cerebellum: '#cbb0e2', stem: '#e5b0c4', line: '#6d4040', sulcus: 'rgba(110, 55, 55, 0.5)', white: '#fbf2ea',
  };
  const stroke = (d, w = 3, extra = '') => `<path d="${d}" fill="none" stroke="${C.sulcus}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const shade = (id) => `<radialGradient id="sh${id}" cx="38%" cy="28%" r="75%"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#5a2a2a" stop-opacity="0.22"/></radialGradient>`;
  const poly = (d, fill) => `<path d="${d}" fill="${fill}"/>`;

  // ---------------------------------------------------------------- lateral (left side, anterior = left)
  // Outline of the cerebrum: frontal pole (left), occipital pole (right), temporal lobe hanging
  // below the lateral (Sylvian) fissure with its pole pointing forward.
  const OUT_LAT = 'M40 232 C26 160 92 62 236 40 C352 22 470 42 540 104 C584 146 598 206 584 240 C576 262 556 282 520 294 C496 302 478 302 466 300 C430 318 380 336 300 342 C244 346 196 340 172 318 C156 302 154 286 162 272 C150 262 136 258 122 262 C96 268 60 262 40 232 Z';
  const SYLVIAN = 'M150 262 C196 246 246 226 296 214 C334 206 362 198 384 182';
  const CENTRAL = 'M336 30 C326 70 312 106 300 140 C290 168 274 192 262 216';
  const LOBES_LAT = {
    frontal: 'M0 0 L338 0 L336 30 C326 70 312 106 300 140 C290 168 274 192 262 216 L262 228 C228 236 190 248 150 262 L150 470 L0 470 Z',
    parietal: 'M338 0 L512 0 L508 58 L486 198 C452 194 420 188 384 182 C362 198 334 206 296 214 C284 217 272 222 262 228 L262 216 C274 192 290 168 300 140 C312 106 326 70 336 30 Z',
    temporal: 'M150 262 C190 248 228 236 262 228 C272 222 284 217 296 214 C334 206 362 198 384 182 C420 188 452 194 486 198 L466 300 L466 470 L150 470 Z',
    occipital: 'M512 0 L600 0 L600 470 L466 470 L466 300 L486 198 L508 58 Z',
  };
  const CEREB_LAT = 'M418 318 C446 300 530 294 566 314 C592 340 580 388 522 402 C466 414 426 396 414 364 C410 348 410 330 418 318 Z';
  const cerebellumLat = `<path d="${CEREB_LAT}" fill="${C.cerebellum}" stroke="${C.line}" stroke-width="3"/>
    ${[0, 1, 2, 3, 4].map((i) => stroke(`M${424 + i * 3} ${328 + i * 15} C468 ${316 + i * 15} 528 ${318 + i * 14} ${568 - i * 9} ${334 + i * 13}`, 2.3)).join('')}`;
  const stemLat = `<path d="M362 320 C352 352 346 380 352 404 C358 432 370 456 378 470 L414 470 C410 446 414 420 418 398 C422 370 418 344 410 320 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>
    <ellipse cx="376" cy="378" rx="34" ry="30" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>${stroke('M346 384 C366 392 390 392 408 382', 2)}${stroke('M350 368 C368 374 388 374 406 366', 2)}`;
  const lateral = (id) => `<defs><clipPath id="c${id}"><path d="${OUT_LAT}"/></clipPath>${shade(id)}</defs>
    ${stemLat}${cerebellumLat}
    <g clip-path="url(#c${id})">
      ${Object.entries(LOBES_LAT).map(([k, d]) => poly(d, C[k])).join('')}
      <rect width="600" height="470" fill="url(#sh${id})"/>
      ${stroke('M300 34 C292 74 276 112 262 150 C252 176 240 196 230 214', 2.6)}${stroke('M372 36 C362 80 346 120 334 154 C326 176 316 192 308 204', 2.6)}
      ${stroke('M286 70 C240 64 190 74 136 102', 2.6)}${stroke('M272 138 C224 140 172 156 118 188', 2.6)}${stroke('M72 202 C100 192 130 198 150 216', 2.2)}
      ${stroke('M350 140 C392 120 440 116 486 128', 2.6)}${stroke('M412 64 C430 86 440 108 442 132', 2.2)}${stroke('M400 200 C418 172 448 160 472 168', 2.2)}
      ${stroke('M190 284 C240 264 300 250 360 238 C400 230 440 232 470 248', 2.6)}${stroke('M210 316 C262 302 330 292 400 288 C430 286 452 290 466 298', 2.4)}
      ${stroke('M522 150 C540 180 552 210 560 240', 2.2)}${stroke('M500 252 C530 258 556 254 576 238', 2.2)}${stroke('M530 92 C548 112 560 132 566 156', 2.2)}
      <path d="${SYLVIAN}" fill="none" stroke="${C.line}" stroke-width="6" stroke-linecap="round"/>
      <path d="${CENTRAL}" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      <path d="M508 58 C504 72 500 84 496 96" fill="none" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
    </g>
    <path d="${OUT_LAT}" fill="none" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`;

  // ---------------------------------------------------------------- medial (midsagittal cut, anterior = left)
  const LOBES_MED = {
    frontal: 'M0 0 L338 0 L336 30 L334 120 L320 236 L200 300 L150 470 L0 470 Z',
    parietal: 'M338 0 L512 0 L506 60 C494 120 474 180 450 240 L320 236 L334 120 L336 30 Z',
    occipital: 'M512 0 L600 0 L600 470 L470 470 L450 240 C474 180 494 120 506 60 Z',
    temporal: 'M200 300 L320 236 L450 240 L470 470 L150 470 Z',
  };
  const CEREB_MED = 'M404 322 C440 306 528 302 562 324 C588 352 574 396 516 410 C458 420 414 398 406 364 Z';
  const arborVitae = `<path d="M412 362 C440 360 470 356 500 352 M440 360 C456 342 476 332 500 326 M452 358 C474 350 506 348 534 340 M462 356 C488 362 520 372 548 368 M444 364 C466 378 494 390 520 394 M476 344 L486 330 M498 352 L514 344 M496 364 L512 376" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.9"/>`;
  const medial = (id) => `<defs><clipPath id="c${id}"><path d="${OUT_LAT}"/></clipPath>${shade(id)}</defs>
    <path d="${CEREB_MED}" fill="${C.cerebellum}" stroke="${C.line}" stroke-width="3"/>${arborVitae}
    <g clip-path="url(#c${id})">
      ${Object.entries(LOBES_MED).map(([k, d]) => poly(d, C[k])).join('')}
      <rect width="600" height="470" fill="url(#sh${id})"/>
      <path d="M156 222 C152 150 204 96 300 90 C392 86 456 118 472 162 C476 178 468 188 452 192" fill="none" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
      ${stroke('M334 30 C334 50 330 70 322 90', 3)}${stroke('M150 140 C190 120 230 112 270 112', 2.4)}${stroke('M120 200 C130 180 140 168 150 160', 2.4)}${stroke('M400 60 C420 80 430 100 432 120', 2.4)}
      <path d="M506 60 C494 120 474 180 450 240" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      <path d="M450 240 C490 236 540 236 584 232" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      ${stroke('M520 150 C540 170 556 190 566 206', 2.4)}${stroke('M500 270 C530 276 556 276 576 270', 2.4)}${stroke('M240 330 C300 320 360 316 420 318', 2.6)}
    </g>
    <path d="M168 212 C160 160 210 124 290 118 C368 114 430 132 452 178 C458 192 454 206 440 212 C428 196 404 176 360 168 C310 160 248 162 214 182 C196 194 190 206 186 218 C180 226 168 222 168 212 Z" fill="${C.white}" stroke="${C.line}" stroke-width="3"/>
    <path d="M436 214 C408 220 362 214 322 218 C298 222 280 236 272 256" fill="none" stroke="${C.line}" stroke-width="9" stroke-linecap="round"/>
    <path d="M436 214 C408 220 362 214 322 218 C298 222 280 236 272 256" fill="none" stroke="${C.white}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="336" cy="244" rx="46" ry="24" fill="#e6bfb8" stroke="${C.line}" stroke-width="2.5"/>
    <path d="M296 262 C304 290 300 312 306 340 C312 380 318 430 334 470 L382 470 C374 430 368 394 368 358 C368 320 376 296 372 270 C352 262 316 258 296 262 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>
    <path d="M304 318 C292 348 296 382 316 400 L362 400 C370 380 372 348 366 320 Z" fill="#dca0b8" stroke="${C.line}" stroke-width="2.5"/>
    <path d="M370 334 L402 358 L372 384 Z" fill="#cfe6f4" stroke="${C.line}" stroke-width="2"/>
    <circle cx="378" cy="276" r="7" fill="#e6bfb8" stroke="${C.line}" stroke-width="2"/><circle cx="382" cy="294" r="7" fill="#e6bfb8" stroke="${C.line}" stroke-width="2"/>
    <circle cx="404" cy="252" r="6" fill="#b9857f" stroke="${C.line}" stroke-width="2"/>
    <path d="M232 276 L264 286 M232 286 L264 276" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>
    <path d="M276 288 C280 300 286 308 294 312" fill="none" stroke="${C.line}" stroke-width="3"/><circle cx="296" cy="316" r="6" fill="#dca0b8" stroke="${C.line}" stroke-width="2"/>
    <path d="${OUT_LAT}" fill="none" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`;

  // ---------------------------------------------------------------- mirror-symmetric views (one half + mirror)
  const mirrored = (id, half, extraHalf, shared = '') => `<defs>${shade(id)}</defs>
    <g transform="translate(300 0)">
      <g>${half}</g><g transform="scale(-1 1)">${half}</g>
    </g>${shared}`;

  // superior: anterior at the top of the picture
  const SUP_HALF = 'M0 22 C92 22 170 85 190 180 C210 275 185 395 115 445 C75 470 35 470 0 462 Z';
  const superior = (id) => {
    const half = `<defs><clipPath id="c${id}"><path d="${SUP_HALF}"/></clipPath></defs>
      <g clip-path="url(#c${id})">
        ${poly('M0 0 L220 0 L220 178 C150 205 70 238 0 262 Z', C.frontal)}
        ${poly('M0 262 C70 238 150 205 220 178 L220 372 C150 360 70 370 0 392 Z', C.parietal)}
        ${poly('M0 392 C70 370 150 360 220 372 L220 480 L0 480 Z', C.occipital)}
        <rect width="220" height="480" fill="url(#sh${id})"/>
        ${stroke('M0 262 C70 238 150 205 190 180', 5, 'style="stroke:#6d4040;stroke-opacity:0.85"')}
        ${stroke('M0 392 C70 372 150 362 196 372', 4, 'style="stroke:#6d4040;stroke-opacity:0.7"')}
        ${stroke('M0 235 C60 215 130 185 175 160', 3)}${stroke('M0 290 C70 268 140 238 186 212', 3)}
        ${stroke('M0 120 C60 105 120 95 160 110', 2.5)}${stroke('M0 170 C60 150 120 140 172 150', 2.5)}${stroke('M0 70 C50 58 100 62 135 82', 2.5)}
        ${stroke('M0 330 C70 312 140 296 190 300', 2.5)}${stroke('M0 430 C60 418 120 410 160 420', 2.5)}${stroke('M40 300 C60 320 110 336 160 340', 2.5)}
        ${stroke('M40 150 C70 170 110 180 150 190', 2.5)}
      </g>
      <path d="${SUP_HALF}" fill="none" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`;
    return mirrored(id, half) + `<path d="M300 24 L300 462" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>`;
  };

  // inferior: anterior at the top, looking up at the underside (patient's right on the viewer's left)
  const inferior = (id) => {
    const FRONT = 'M3 30 C80 22 156 52 178 116 C190 152 186 186 168 206 C130 198 80 196 40 204 L3 206 Z';
    const TEMP = 'M168 206 C196 220 210 264 208 314 C206 362 188 398 158 412 C130 422 104 406 98 380 C92 346 96 288 108 246 C118 222 140 206 168 206 Z';
    const CEREB = 'M3 356 C60 340 152 348 182 392 C188 430 152 456 92 462 C52 466 22 464 3 462 Z';
    const OCC = 'M182 392 C204 412 206 444 172 464 C152 472 120 470 100 466 C150 456 184 432 182 396 Z';
    const half = `<defs><clipPath id="c${id}"><path d="${FRONT}"/></clipPath></defs>
      <path d="M3 186 L172 196 C196 230 206 300 196 380 L3 384 Z" fill="#ecd6cc"/>
      <path d="${OCC}" fill="${C.occipital}" stroke="${C.line}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="${FRONT}" fill="${C.frontal}"/>
      <g clip-path="url(#c${id})"><rect width="220" height="470" fill="url(#sh${id})"/>
        ${stroke('M40 70 C80 76 110 100 120 140 C126 160 120 180 108 196', 2.6)}${stroke('M70 110 C100 104 130 112 150 128', 2.4)}${stroke('M86 150 C110 146 140 152 160 168', 2.4)}
      </g>
      <path d="${FRONT}" fill="none" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M26 64 C28 100 30 140 32 190" fill="none" stroke="#f6e3c7" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="26" cy="62" rx="8" ry="16" fill="#f6e3c7" stroke="${C.line}" stroke-width="2.5"/>
      <path d="${TEMP}" fill="${C.temporal}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      ${stroke('M126 240 C150 270 162 310 162 360', 2.6)}${stroke('M150 226 C178 256 190 300 188 346', 2.6)}${stroke('M112 300 C120 330 124 360 120 388', 2.4)}
      <path d="${CEREB}" fill="${C.cerebellum}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      ${stroke('M10 380 C60 372 124 378 166 400', 2.3)}${stroke('M10 404 C60 398 120 402 160 420', 2.3)}${stroke('M10 428 C60 424 112 426 148 438', 2.3)}${stroke('M10 450 C50 448 90 450 118 454', 2.3)}
      <path d="M22 262 C40 256 56 262 62 282 C66 300 58 318 44 332 L22 336 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M62 284 L96 276 M60 306 L94 312 M50 330 L84 346" stroke="#f6e3c7" stroke-width="4" stroke-linecap="round"/>`;
    return mirrored(id, half) + `<path d="M300 30 L300 206" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
      <path d="M274 212 L326 232 M326 212 L274 232" stroke="#f6e3c7" stroke-width="9" stroke-linecap="round"/>
      <path d="M274 212 L326 232 M326 212 L274 232" stroke="${C.line}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
      <circle cx="292" cy="250" r="7" fill="${C.stem}" stroke="${C.line}" stroke-width="2"/><circle cx="308" cy="250" r="7" fill="${C.stem}" stroke="${C.line}" stroke-width="2"/>
      <ellipse cx="300" cy="300" rx="48" ry="40" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>
      ${stroke('M262 296 C280 302 320 302 338 296', 2)}${stroke('M266 316 C284 322 316 322 334 316', 2)}
      <path d="M278 338 C280 352 284 364 288 376 L312 376 C316 364 320 352 322 338 Z" fill="#dca0b8" stroke="${C.line}" stroke-width="3"/>
      <path d="M300 340 L300 374" stroke="${C.line}" stroke-width="2"/>
      <path d="M300 352 L300 462" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>`;
  };

  // anterior: front view
  const anterior = (id) => {
    const OUTL = 'M3 30 C100 26 176 82 194 170 C206 236 192 290 160 318 C146 330 130 326 114 316 C80 302 40 304 3 304 Z';
    const half = `<defs><clipPath id="c${id}"><path d="${OUTL}"/></clipPath></defs>
      <path d="${OUTL}" fill="${C.frontal}"/>
      <g clip-path="url(#c${id})"><rect width="220" height="400" fill="url(#sh${id})"/>
        ${stroke('M10 90 C60 82 120 90 170 130', 3)}${stroke('M10 150 C60 140 120 150 180 190', 3)}${stroke('M20 220 C70 206 130 214 188 250', 3)}${stroke('M40 60 C80 70 120 100 140 140', 2.5)}${stroke('M20 262 C60 254 100 262 124 284', 2.5)}
      </g>
      <path d="${OUTL}" fill="none" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M112 236 C150 228 190 246 196 290 C198 320 176 340 148 338 C122 336 104 316 100 290 C98 264 102 244 112 236 Z" fill="${C.temporal}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      ${stroke('M120 262 C140 258 168 268 182 290', 2.5)}${stroke('M118 292 C138 288 162 296 178 314', 2.5)}`;
    return mirrored(id, half) + `<path d="M300 30 L300 300" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      <path d="M272 300 C276 340 280 380 286 424 L314 424 C320 380 324 340 328 300 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>
      <ellipse cx="300" cy="344" rx="30" ry="20" fill="#dca0b8" stroke="${C.line}" stroke-width="3"/>`;
  };

  // posterior: back view
  const posterior = (id) => {
    const OUTL = 'M3 28 C100 24 178 78 194 170 C206 240 196 290 168 316 C120 326 60 324 3 318 Z';
    const half = `<defs><clipPath id="c${id}"><path d="${OUTL}"/></clipPath></defs>
      <path d="M3 306 C50 296 150 300 188 336 C206 368 188 412 144 430 C100 446 40 444 3 440 Z" fill="${C.cerebellum}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      ${stroke('M12 346 C60 338 130 342 172 360', 2.5)}${stroke('M12 372 C60 364 130 368 176 382', 2.5)}${stroke('M12 398 C60 392 120 394 168 406', 2.5)}${stroke('M12 422 C60 418 110 418 150 424', 2.5)}
      <g clip-path="url(#c${id})">
        ${poly('M0 0 L220 0 L220 160 C150 150 60 150 0 170 Z', C.parietal)}
        ${poly('M0 170 C60 150 150 150 220 160 L220 340 L0 340 Z', C.occipital)}
        <rect width="220" height="340" fill="url(#sh${id})"/>
        ${stroke('M0 170 C60 150 150 150 214 160', 4, 'style="stroke:#6d4040;stroke-opacity:0.8"')}
        ${stroke('M10 80 C60 70 130 80 176 118', 3)}${stroke('M20 40 C70 42 120 60 150 90', 2.5)}${stroke('M10 210 C60 200 130 206 186 232', 3)}${stroke('M10 262 C60 252 120 258 170 280', 2.5)}${stroke('M70 170 C80 220 90 270 90 316', 2.5)}
      </g>
      <path d="${OUTL}" fill="none" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`;
    return mirrored(id, half) + `<path d="M300 28 L300 318" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      <path d="M300 322 L300 438" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
      <path d="M280 440 C284 452 290 462 296 466 L304 466 C310 462 316 452 320 440 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>`;
  };

  // ---------------------------------------------------------------- cross-sections (for the planes slide)
  // Grey matter (cortex) is a rim around white matter: draw the outline filled white and stroked with a
  // thick grey line, clipped to the outline, so the rim lies inside. Folds are short grey strokes.
  const WM = '#fbf1e8', GM = '#e2b6b0', GMD = '#d49c97', CSF = '#cfe6f4';
  const rim = (id, d, w = 34) => `<defs><clipPath id="r${id}"><path d="${d}"/></clipPath></defs>
    <g clip-path="url(#r${id})"><path d="${d}" fill="${WM}" stroke="${GM}" stroke-width="${w}"/></g>`;
  // a sulcus seen in a slice: a fold of grey matter with the groove down its middle
  const folds = (list, w = 15) => list.map((d) => `<path d="${d}" fill="none" stroke="${GM}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#b98a86" stroke-width="2" stroke-linecap="round"/>`).join('');
  const outline = (d) => `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`;

  // coronal: a front-to-back slice through the thalamus, seen from the front (mirror halves; x = 0 is the midline)
  const coronalSection = (id) => {
    const OUT = 'M3 26 C96 22 170 70 194 150 C206 198 204 240 194 260 C180 264 162 266 152 272 C162 280 180 282 194 288 C204 316 200 352 184 378 C166 404 136 410 112 400 C92 392 80 374 74 354 C68 338 58 324 44 318 L3 318 Z';
    const half = `${rim(id, OUT)}
      <g clip-path="url(#r${id})">${folds(['M194 150 L160 160', 'M182 92 L150 112', 'M140 46 L124 80', 'M80 28 L74 64', 'M200 210 L168 214', 'M196 330 L164 326', 'M150 404 L138 374', 'M3 64 L26 68', 'M3 98 L22 100'])}</g>
      ${folds(['M152 240 C144 254 144 288 152 302'], 14)}
      <path d="M3 116 C24 112 46 116 58 128 C50 140 30 146 3 146 Z" fill="${CSF}" stroke="${C.line}" stroke-width="2"/>
      <ellipse cx="62" cy="150" rx="14" ry="18" fill="${GM}" stroke="${C.line}" stroke-width="2"/>
      <path d="M100 168 C124 164 136 184 136 212 C134 238 118 250 102 246 C108 222 106 192 100 168 Z" fill="${GMD}" stroke="${C.line}" stroke-width="2"/>
      <path d="M100 176 C108 196 108 226 102 244 C92 236 88 216 90 196 C92 186 96 178 100 176 Z" fill="${GM}" stroke="${C.line}" stroke-width="1.5"/>
      <ellipse cx="34" cy="214" rx="30" ry="34" fill="${GMD}" stroke="${C.line}" stroke-width="2"/>
      <path d="M86 330 C96 322 110 324 118 334" fill="none" stroke="${CSF}" stroke-width="6" stroke-linecap="round"/>
      <path d="M78 344 C90 352 108 354 120 346 C114 360 96 364 84 356 Z" fill="${GMD}" stroke="${C.line}" stroke-width="1.5"/>
      ${outline(OUT)}`;
    return mirrored(id, half) + `<path d="M300 28 L300 104" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
      <path d="M232 106 C260 98 340 98 368 106 L368 118 C340 112 260 112 232 118 Z" fill="${WM}" stroke="${C.line}" stroke-width="2"/>
      <path d="M296 118 L296 146 L304 146 L304 118 Z" fill="${WM}" stroke="${C.line}" stroke-width="1.5"/>
      <path d="M297 184 L297 246 L303 246 L303 184 Z" fill="${CSF}" stroke="${C.line}" stroke-width="1.5"/>
      <path d="M262 318 C268 352 274 392 282 440 L318 440 C326 392 332 352 338 318 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>`;
  };

  // axial: a horizontal slice through the basal ganglia, seen from above (anterior at the top)
  const axialSection = (id) => {
    const OUT = 'M3 18 C100 14 178 70 192 160 C206 260 186 366 120 430 C84 462 40 462 3 456 Z';
    const half = `${rim(id, OUT)}
      <g clip-path="url(#r${id})">${folds(['M130 40 L118 70', 'M182 120 L152 128', 'M196 206 L166 206', 'M190 300 L160 296', 'M162 380 L136 366', 'M96 446 L90 418', 'M60 22 L58 54', 'M3 80 L24 82', 'M3 400 L24 398'])}</g>
      <g clip-path="url(#r${id})">${folds(['M196 236 C182 240 172 248 168 258'], 14)}${folds(['M164 228 C158 244 158 272 164 288'], 13)}</g>
      <path d="M3 142 C18 132 34 132 44 146 C48 164 40 182 24 190 C16 194 8 194 3 194 Z" fill="${CSF}" stroke="${C.line}" stroke-width="2"/>
      <ellipse cx="60" cy="168" rx="16" ry="24" fill="${GM}" stroke="${C.line}" stroke-width="2"/>
      <path d="M96 186 C124 190 140 214 140 244 C140 272 122 290 98 286 C106 258 104 216 96 186 Z" fill="${GMD}" stroke="${C.line}" stroke-width="2"/>
      <path d="M96 196 C100 222 102 256 98 278 C88 268 84 246 86 224 C88 210 92 200 96 196 Z" fill="${GM}" stroke="${C.line}" stroke-width="1.5"/>
      <ellipse cx="38" cy="276" rx="32" ry="40" fill="${GMD}" stroke="${C.line}" stroke-width="2"/>
      <path d="M40 334 C60 334 78 350 80 376 C80 396 70 408 58 410 C56 390 48 366 30 352 Z" fill="${CSF}" stroke="${C.line}" stroke-width="2"/>
      ${outline(OUT)}`;
    return mirrored(id, half) + `<path d="M300 20 L300 108 M300 384 L300 456" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
      <path d="M248 118 C268 104 332 104 352 118 L344 130 C326 120 274 120 256 130 Z" fill="${WM}" stroke="${C.line}" stroke-width="2"/>
      <path d="M298 130 L298 194 L302 194 L302 130 Z" fill="${WM}" stroke="${C.line}" stroke-width="1.5"/>
      <path d="M297 244 L297 312 L303 312 L303 244 Z" fill="${CSF}" stroke="${C.line}" stroke-width="1.5"/>
      <path d="M250 352 C272 370 328 370 350 352 L356 366 C330 386 270 386 244 366 Z" fill="${WM}" stroke="${C.line}" stroke-width="2"/>`;
  };

  // sagittal (off the midline): a left-to-right slice through one hemisphere, seen from the side
  const sagittalSection = (id) => `<defs><clipPath id="s${id}"><path d="${OUT_LAT}"/></clipPath></defs>
    <path d="${CEREB_MED}" fill="${GM}" stroke="${C.line}" stroke-width="3"/>${arborVitae}
    ${rim(id, OUT_LAT, 28)}
    <g clip-path="url(#s${id})">
      ${folds(['M120 70 L140 104', 'M220 42 L224 80', 'M300 30 L294 68', 'M370 32 L360 70', 'M450 56 L430 90', 'M540 104 L512 120', 'M586 200 L556 196', 'M40 210 L74 206', 'M80 120 L108 134', 'M260 344 L262 312', 'M380 330 L376 300', 'M200 336 L206 306', 'M530 290 L510 270'])}
      ${folds([SYLVIAN], 16)}
      <path d="M240 200 C280 178 352 172 402 188 C422 196 428 212 414 222 C390 206 340 200 296 208 C268 214 250 216 240 206 Z" fill="${CSF}" stroke="${C.line}" stroke-width="2"/>
      <path d="M414 222 C430 250 420 282 380 302 C352 314 320 314 300 308 C320 300 350 292 372 276 C394 258 404 238 404 224 Z" fill="${CSF}" stroke="${C.line}" stroke-width="2"/>
      <ellipse cx="262" cy="222" rx="24" ry="13" fill="${GM}" stroke="${C.line}" stroke-width="2"/>
      <ellipse cx="300" cy="252" rx="42" ry="22" fill="${GMD}" stroke="${C.line}" stroke-width="2"/>
      <path d="M318 304 C340 312 364 310 384 300 C376 318 352 326 330 322 Z" fill="${GMD}" stroke="${C.line}" stroke-width="1.5"/>
    </g>
    <path d="${OUT_LAT}" fill="none" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`;

  window.WB_BRAIN_ART = { C, lateral, medial, superior, inferior, anterior, posterior, coronalSection, axialSection, sagittalSection, W: 600, H: 470 };
})();
