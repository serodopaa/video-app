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
  const CER_LAT = 'M30 215 C28 130 110 45 230 32 C330 21 450 36 520 86 C576 126 592 200 570 250 C560 285 530 300 495 302 C440 312 410 336 360 343 C300 351 230 350 190 330 C165 318 158 296 175 282 C140 288 62 272 30 215 Z';
  const cerebellumLat = `<path d="M405 316 C440 302 520 304 548 326 C566 350 546 390 496 398 C440 406 402 382 398 348 Z" fill="${C.cerebellum}" stroke="${C.line}" stroke-width="3"/>
    ${[0, 1, 2, 3].map((i) => stroke(`M${416 + i * 6} ${334 + i * 15} C450 ${322 + i * 14} 515 ${326 + i * 12} ${538 - i * 6} ${342 + i * 10}`, 2.5)).join('')}`;
  const stemLat = `<path d="M298 336 C302 380 312 426 326 464 L378 464 C376 420 368 380 364 338 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>
    <ellipse cx="340" cy="388" rx="36" ry="22" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>${stroke('M312 388 C330 396 352 396 368 388', 2)}`;
  const lateral = (id) => `<defs><clipPath id="c${id}"><path d="${CER_LAT}"/></clipPath>${shade(id)}</defs>
    ${stemLat}${cerebellumLat}
    <g clip-path="url(#c${id})">
      ${poly('M0 0 L335 0 L335 22 C320 100 290 170 262 222 L180 272 L0 340 Z', C.frontal)}
      ${poly('M335 0 L520 0 L520 62 C503 130 494 195 482 238 L400 218 L262 222 C292 170 322 100 335 22 Z', C.parietal)}
      ${poly('M520 0 L600 0 L600 340 L462 340 L482 238 C494 195 503 130 520 62 Z', C.occipital)}
      ${poly('M180 272 L262 222 L400 218 L482 238 L462 340 L400 400 L120 400 L120 300 Z', C.temporal)}
      <rect width="600" height="400" fill="url(#sh${id})"/>
      ${stroke('M312 28 C300 100 272 165 240 215', 3)}${stroke('M358 26 C345 100 316 168 285 220', 3)}
      ${stroke('M60 190 C110 120 190 80 300 56', 3)}${stroke('M70 238 C130 196 200 165 268 150', 3)}
      ${stroke('M120 110 C150 140 200 140 232 118', 2.5)}${stroke('M100 160 C140 170 190 190 230 200', 2.5)}
      ${stroke('M190 312 C260 292 340 286 440 288', 3)}${stroke('M215 336 C280 320 350 320 420 320', 3)}${stroke('M230 290 C280 275 330 270 380 272', 2.5)}
      ${stroke('M362 108 C420 112 470 148 488 192', 3)}${stroke('M385 60 C440 68 480 100 498 140', 2.5)}${stroke('M410 170 C440 180 465 200 478 224', 2.5)}
      ${stroke('M524 150 C545 170 560 200 562 235', 2.5)}${stroke('M528 252 C520 270 500 285 480 290', 2.5)}
      <path d="M178 272 C230 250 300 232 410 218 C440 214 470 226 484 240" fill="none" stroke="${C.line}" stroke-width="6" stroke-linecap="round"/>
      <path d="M335 24 C322 100 292 168 262 222" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      <path d="M522 64 C505 130 495 195 482 238" fill="none" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
    </g>
    <path d="${CER_LAT}" fill="none" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`;

  // ---------------------------------------------------------------- medial (midsagittal cut, anterior = left)
  const CER_MED = 'M30 215 C28 130 110 45 230 32 C330 21 450 36 520 86 C576 126 592 200 570 250 C560 285 530 300 495 304 C455 314 410 324 372 334 L300 334 C260 334 216 322 186 302 C120 292 62 272 30 215 Z';
  const medial = (id) => `<defs><clipPath id="c${id}"><path d="${CER_MED}"/></clipPath>${shade(id)}</defs>
    <path d="M405 322 C440 308 520 310 548 332 C566 356 546 394 496 402 C440 410 402 386 398 354 Z" fill="${C.cerebellum}" stroke="${C.line}" stroke-width="3"/>
    <path d="M424 350 C440 340 458 346 466 352 M440 372 C460 360 490 364 508 360 M434 392 C460 384 500 384 524 376 M470 352 C488 338 516 338 530 346 M452 360 L470 376 M482 356 L486 382 M508 366 L500 384" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
    <path d="M296 244 C292 286 300 310 304 346 C308 396 316 442 330 468 L378 468 C372 430 364 390 362 346 C358 306 364 282 354 244 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>
    <ellipse cx="337" cy="372" rx="34" ry="24" fill="#dca0b8" stroke="${C.line}" stroke-width="2.5"/>
    <path d="M356 332 C370 346 380 360 382 380" fill="none" stroke="${C.line}" stroke-width="2.5"/>
    <g clip-path="url(#c${id})">
      ${poly('M0 0 L330 0 C325 70 322 150 318 260 L186 302 L0 300 Z', C.frontal)}
      ${poly('M330 0 L506 0 C494 80 470 150 440 260 L318 260 C322 150 325 70 330 0 Z', C.parietal)}
      ${poly('M506 0 L600 0 L600 340 L420 340 L440 260 C470 150 494 80 506 0 Z', C.occipital)}
      ${poly('M186 302 L318 260 L440 260 L420 340 L300 340 L186 340 Z', C.temporal)}
      <rect width="600" height="400" fill="url(#sh${id})"/>
      ${stroke('M70 215 C130 150 220 118 320 110 C400 108 470 140 520 190', 3)}${stroke('M505 100 C492 160 470 220 440 262', 3.5)}
    </g>
    <path d="M142 214 C140 160 190 118 282 110 C372 104 446 128 474 192 C480 206 478 218 470 230 C456 216 440 186 400 170 C342 148 250 148 206 178 C182 194 174 214 162 234 C148 238 140 228 142 214 Z" fill="${C.white}" stroke="${C.line}" stroke-width="3"/>
    <path d="M196 212 C214 238 252 244 290 246 C318 244 318 224 300 214 C270 206 222 196 196 212 Z" fill="#ddb0b4" stroke="${C.line}" stroke-width="2.5"/>
    <path d="M208 200 C240 214 280 224 330 232" fill="none" stroke="${C.line}" stroke-width="3"/>
    <circle cx="412" cy="244" r="7" fill="#b9857f" stroke="${C.line}" stroke-width="2"/>
    <path d="${CER_MED}" fill="none" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`;

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

  // inferior: anterior at the top, looking up at the underside
  const inferior = (id) => {
    const half = `<path d="M3 26 C80 22 150 56 160 120 C166 160 146 196 108 208 L3 208 Z" fill="${C.frontal}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      ${stroke('M10 60 C60 56 110 70 140 110', 3)}${stroke('M12 120 C60 118 110 130 140 160', 3)}
      <path d="M108 208 C160 196 188 224 198 270 C210 330 196 396 160 420 C130 438 100 420 92 392 C84 360 86 310 80 262 L60 218 Z" fill="${C.temporal}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      ${stroke('M120 240 C150 262 168 300 170 360', 3)}${stroke('M140 226 C176 250 190 300 186 350', 3)}
      <path d="M3 372 C50 356 150 366 176 410 C168 450 100 470 3 464 Z" fill="${C.cerebellum}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      ${stroke('M10 392 C60 384 120 390 160 410', 2.5)}${stroke('M10 418 C60 410 120 416 154 432', 2.5)}${stroke('M10 444 C60 438 110 440 140 450', 2.5)}
      <path d="M56 220 C50 260 50 300 48 340 L3 344 L3 224 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>`;
    return mirrored(id, half) + `<ellipse cx="300" cy="262" rx="34" ry="44" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>
      <ellipse cx="300" cy="332" rx="26" ry="24" fill="#dca0b8" stroke="${C.line}" stroke-width="3"/>
      <path d="M284 360 L284 390 L316 390 L316 360 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>
      <path d="M286 214 C292 204 308 204 314 214" fill="none" stroke="${C.line}" stroke-width="3"/>
      <path d="M296 90 L296 206 M304 90 L304 206" stroke="${C.line}" stroke-width="2"/>`;
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
  const WM = '#fbf1e8', GM = '#e2b6b0';
  const coronalSection = (id) => {
    const half = `<defs><clipPath id="c${id}"><path d="M3 30 C100 26 176 76 196 160 C206 215 198 262 176 292 C190 312 192 340 168 352 C140 362 112 352 92 334 C78 346 60 352 3 352 Z"/></clipPath></defs>
      <path d="M3 30 C100 26 176 76 196 160 C206 215 198 262 176 292 C190 312 192 340 168 352 C140 362 112 352 92 334 C78 346 60 352 3 352 Z" fill="${GM}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M3 52 C94 50 160 94 178 164 C190 214 182 258 162 284 C170 302 170 322 152 332 C130 338 108 330 92 314 C74 324 50 328 3 328 Z" fill="${WM}"/>
      <path d="M3 128 C40 118 90 130 128 160 C150 178 156 200 140 206 C110 214 50 200 3 206 Z" fill="#cfe6f4" stroke="${C.line}" stroke-width="2.5"/>
      <path d="M3 96 C60 92 112 106 140 130 C146 138 140 144 130 138 C100 120 50 112 3 114 Z" fill="${C.white}" stroke="${C.line}" stroke-width="2.5"/>
      ${stroke('M170 200 C150 232 120 250 92 252', 3)}${stroke('M40 60 C80 70 120 92 140 118', 2.5)}`;
    return mirrored(id, half) + `<path d="M300 36 L300 120" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
      <path d="M278 352 C282 380 284 410 288 440 L312 440 C316 410 318 380 322 352 Z" fill="${C.stem}" stroke="${C.line}" stroke-width="3"/>`;
  };
  const axialSection = (id) => {
    const half = `<defs><clipPath id="c${id}"><path d="M3 18 C100 14 178 70 192 160 C206 260 186 366 120 430 C84 462 40 462 3 456 Z"/></clipPath></defs>
      <path d="M3 18 C100 14 178 70 192 160 C206 260 186 366 120 430 C84 462 40 462 3 456 Z" fill="${GM}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M3 44 C92 42 160 90 172 164 C186 256 168 356 110 412 C80 440 40 440 3 434 Z" fill="${WM}"/>
      <path d="M3 96 C40 90 82 104 96 140 C104 170 90 190 60 184 C40 180 20 170 3 172 Z" fill="#cfe6f4" stroke="${C.line}" stroke-width="2.5"/>
      <path d="M3 238 C36 226 70 238 78 270 C84 296 62 312 38 306 C20 302 10 296 3 300 Z" fill="#d8aeb2" stroke="${C.line}" stroke-width="2.5"/>
      <path d="M60 316 C70 350 80 380 70 410 C56 408 30 406 3 404 L3 338 Z" fill="#cfe6f4" stroke="${C.line}" stroke-width="2.5"/>
      ${stroke('M150 170 C140 230 130 290 100 340', 3)}${stroke('M60 60 C110 80 148 116 160 160', 2.5)}${stroke('M130 330 C110 380 80 410 40 420', 2.5)}`;
    return mirrored(id, half) + `<path d="M300 20 L300 70 M300 392 L300 458" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>`;
  };

  window.WB_BRAIN_ART = { C, lateral, medial, superior, inferior, anterior, posterior, coronalSection, axialSection, W: 600, H: 470 };
})();
