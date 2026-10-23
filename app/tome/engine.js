// Ported from the Portfolio Tome artifact; Three.js r128 API on purpose.
import * as THREE from 'three';

export function mountTome(host, opts) {
  const { data, onList, onNavigate, insetTop } = opts;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ac = new AbortController(), sig = { signal: ac.signal };
  let alive = true, raf = 0;
  const el = (cls, tag = 'div') => { const n = document.createElement(tag); n.className = cls; return n; };
  const stage = el('tome__stage'), hint = el('tome__hint'), tip = el('tome__tip'), live = el('sr-only');
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', `A leather tome of ${data.name}'s work. Click it to open; turn pages with the arrow keys, by dragging, or by pulling a ribbon. Press L for the plain list.`);
  hint.textContent = 'Click the tome to open it'; tip.hidden = true; live.setAttribute('aria-live', 'polite');
  host.append(stage, hint, tip, live);
  const openList = () => onList();
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { host.replaceChildren(); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  stage.appendChild(renderer.domElement);

  // ---------- palette and type ----------
  const P = { parch: '#f1e5c8', parchEdge: '#d9c497', ink: '#33261a', muted: '#7b6649', rule: '#c5ad82', accent: '#17785c', accentSoft: 'rgba(23,120,92,0.16)', gold: '#caa24c', goldDark: '#7d5f22', leather: '#3c4c66', leatherDark: '#26324a' };
  const SECT = ['#7b2a33', '#8a5a1e', '#9b2f2a', '#1e6b58', '#2f4d80', '#5e3a66'];
  const FACE_COLOR = { contents: SECT[0], about: SECT[0], bezl: SECT[1], bezlNotes: SECT[1], kbui: SECT[2], kbuiNotes: SECT[2], studies: SECT[4], studyNotes: SECT[4], contact: SECT[5], colophon: SECT[5] };
  let curColor = null;
  const HEAD = '"Cinzel", "Trajan Pro", Georgia, serif';
  const BODY = '"EB Garamond", Garamond, Georgia, serif';
  const TW = 1024, TH = 1392;
  const W = 1, H = TH / TW, PT = 0.26, CT = 0.05, CW = W + 0.06, CH = H + 0.08, SEG = 64;
  // Gutter: no geometry. Sheets and block tops stay flat; the curve into the spine is painted shade on the page.
  const gutter = () => 0;
  // Spine covering: XE board edge, SA back bulge, SF flange laid on each cover face; UF = a flange's share of the map.
  const XE = -0.012, SA = 0.11, SF = 0.04, SB = (2 * CT + PT) / 2;
  const arcLen = (b) => { let s = 0, px = 0, pz = b; for (let k = 1; k <= 96; k++) { const t = k / 96 * Math.PI, x = -SA * Math.sin(t), z = b * Math.cos(t); s += Math.hypot(x - px, z - pz); px = x; pz = z; } return s; };
  const SL = 2 * SF + arcLen(SB), UF = SF / SL;
  const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const font = (sz, wt = 400, fam = BODY, it = false) => `${it ? 'italic ' : ''}${wt} ${sz}px ${fam}`;
  // Shrinks a font until text fits; letter spacing already set on ctx counts.
  function fitFont(ctx, text, maxW, size, fam) { while (size > 12 && ctx.measureText(text).width > maxW) { size -= 2; ctx.font = font(size, 700, fam); } }
  function spaced(ctx, px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }
  // Letterpress bite: type pressed into the sheet. Pale lip below-right where the far wall catches the key light,
  // shadow above-left inside the impression, then the ink.
  function bite(ctx, text, x, y, ink) {
    ctx.fillStyle = 'rgba(255,250,236,0.62)'; ctx.fillText(text, x + 1.5, y + 1.7);
    ctx.fillStyle = 'rgba(45,28,10,0.3)'; ctx.fillText(text, x - 0.9, y - 1.1);
    ctx.fillStyle = ink; ctx.fillText(text, x, y);
  }
  function wrap(ctx, text, x, y, maxW, lh) {
    let line = '';
    const put = (t) => ctx.bite ? bite(ctx, t, x, y, ctx.bite) : ctx.fillText(t, x, y);
    for (const w of text.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { put(line); y += lh; line = w; } else line = t;
    }
    if (line) { put(line); y += lh; }
    return y;
  }
  // Fibre-clump noise: a small random canvas scaled up with bilinear filtering, so the tooth is soft blobs, never pixels.
  function pulp(ctx, w, h, cell, alpha) {
    const nw = Math.ceil(w / cell), nh = Math.ceil(h / cell), c = document.createElement('canvas'); c.width = nw; c.height = nh;
    const nc = c.getContext('2d'), img = nc.createImageData(nw, nh), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const light = rand() > 0.5; d[i] = light ? 255 : 124; d[i + 1] = light ? 246 : 90; d[i + 2] = light ? 222 : 44; d[i + 3] = rand() * rand() * 255; }
    nc.putImageData(img, 0, 0);
    ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(c, -cell, -cell, w + 2 * cell, h + 2 * cell); ctx.restore();
  }
  // Handmade paper at reading distance: cloudy pulp density in three scales, a few pale fibres, no lines and no dots.
  function paperGrain(ctx, w, h, k = 1) {
    const k2 = (w * h) / (1024 * 1392);
    for (let i = 0; i < 28 * k2; i++) { const x = rand() * w, y = rand() * h, r = 160 + rand() * 300, warm = rand() > 0.45, g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, warm ? `rgba(150,112,58,${(0.035 + rand() * 0.035) * k})` : `rgba(255,247,226,${(0.06 + rand() * 0.06) * k})`); g.addColorStop(0.6, warm ? `rgba(150,112,58,${0.014 * k})` : `rgba(255,247,226,${0.02 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    for (let i = 0; i < 160 * k2; i++) { const x = rand() * w, y = rand() * h, r = 40 + rand() * 90, warm = rand() > 0.5, g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, warm ? `rgba(140,104,54,${(0.025 + rand() * 0.03) * k})` : `rgba(255,247,226,${(0.04 + rand() * 0.05) * k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    pulp(ctx, w, h, 11, 0.16 * k);
    pulp(ctx, w, h, 4, 0.13 * k);
    ctx.lineCap = 'round'; ctx.lineWidth = 0.9;
    for (let i = 0; i < 700 * k2 * k; i++) { const x = rand() * w, y = rand() * h, l = 3 + rand() * 11, a = rand() * Math.PI; ctx.strokeStyle = `rgba(255,252,242,${0.05 + rand() * 0.08})`; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
  }
  function speckle(ctx, w, h, n, color, alpha) {
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) { ctx.globalAlpha = alpha * rand(); ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2.5, 1 + rand() * 2.5); }
    ctx.globalAlpha = 1;
  }

  // ---------- page faces ----------
  // side 'R' = right-hand page (spine on its left); 'L' = left-hand page (spine on its right).
  // One sheet of paper, baked once; every page stamps it in one of four orientations, so grain is never regenerated on a redraw.
  let paperBase = null;
  const paperSheet = () => paperBase || (paperBase = heightCanvas(TW, TH, (ctx, w, h) => { const s0 = seed; seed = 4242; ctx.fillStyle = P.parch; ctx.fillRect(0, 0, w, h); paperGrain(ctx, w, h, 1); seed = s0; }));
  let curName = '', curSide = null;
  function parchment(ctx, side, title, folio) {
    curSide = side;
    const hsh = [...curName].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7), fx = hsh & 1 ? -1 : 1, fy = hsh & 2 ? -1 : 1;
    ctx.save(); ctx.translate(fx < 0 ? TW : 0, fy < 0 ? TH : 0); ctx.scale(fx, fy); ctx.drawImage(paperSheet(), 0, 0); ctx.restore();
    const out = side === 'R' ? TW : 0, inn = TW - out;
    // Show-through: the verso's ink, mirrored and softened, under this page's own. The ghost copy is low-res, so the blur is free.
    const verso = faceTex[PARTNER[curName]];
    if (verso && verso.ghost) { ctx.save(); ctx.globalAlpha = 0.12; ctx.globalCompositeOperation = 'multiply'; ctx.translate(TW, 0); ctx.scale(-1, 1); ctx.drawImage(verso.ghost, 0, 0, TW, TH); ctx.restore(); }
    // Age lives in the toning: light-browned edges, a thumb-soiled outer corner, a cleaner gutter; marks stay sparse and soft.
    for (const [x0, y0, x1, y1, bx, by, bw, bh] of [[0, 0, 0, 110, 0, 0, TW, 110], [0, TH, 0, TH - 110, 0, TH - 110, TW, 110], [out, 0, out + (inn - out) * 0.1, 0, Math.min(out, out + (inn - out) * 0.1), 0, 102, TH]]) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(105,70,25,0.3)'); g.addColorStop(0.4, 'rgba(105,70,25,0.08)'); g.addColorStop(1, 'rgba(105,70,25,0)'); ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh); }
    const vg = ctx.createRadialGradient(inn * 0.6 + out * 0.4, TH * 0.45, TH * 0.22, inn * 0.6 + out * 0.4, TH * 0.45, TH * 0.82);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(110,78,30,0.19)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, TW, TH);
    for (const [cy, a, r] of [[TH, 0.14, 560], [0, 0.06, 420]]) { const g = ctx.createRadialGradient(out, cy, 0, out, cy, r); g.addColorStop(0, `rgba(88,62,34,${a})`); g.addColorStop(0.45, `rgba(88,62,34,${a * 0.45})`); g.addColorStop(1, 'rgba(88,62,34,0)'); ctx.fillStyle = g; ctx.fillRect(out - r, cy - r, 2 * r, 2 * r); }
    // Painted roll: deep in the crease, easing out over the inner margin so the flat sheet still reads as curving into the fold.
    const gg = ctx.createLinearGradient(inn, 0, inn + (out - inn) * 0.17, 0);
    for (const [t, a] of [[0, 0.7], [0.03, 0.58], [0.1, 0.42], [0.22, 0.26], [0.4, 0.13], [0.65, 0.05], [0.85, 0.015], [1, 0]]) gg.addColorStop(t, `rgba(48,30,11,${a})`);
    ctx.fillStyle = gg; ctx.fillRect(0, 0, TW, TH);
    const sh = ctx.createLinearGradient(inn + (out - inn) * 0.15, 0, inn + (out - inn) * 0.26, 0);
    for (const [t, a] of [[0, 0], [0.45, 0.09], [1, 0]]) sh.addColorStop(t, `rgba(255,250,236,${a})`);
    ctx.fillStyle = sh; ctx.fillRect(0, 0, TW, TH);
    // Foxing: a few rust blooms with wide halos, gathered toward the outer and top edges where damp got in.
    for (let i = 0; i < 7; i++) { const x = inn + (out - inn) * (0.55 + 0.45 * Math.sqrt(rand())), y = rand() < 0.6 ? TH * rand() * rand() : TH * rand(), r = 9 + rand() * 22, a = 0.05 + rand() * 0.05; const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4); g.addColorStop(0, `rgba(148,92,38,${a})`); g.addColorStop(0.3, `rgba(148,92,38,${a * 0.6})`); g.addColorStop(0.55, `rgba(160,120,60,${a * 0.22})`); g.addColorStop(1, 'rgba(160,120,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8); }
    if (curColor) {
      ctx.fillStyle = curColor; ctx.globalAlpha = 0.85; ctx.fillRect(side === 'R' ? TW - 18 : 0, 0, 18, TH); ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(0,0,0,${rand() * 0.6})`; ctx.fillRect(side === 'R' ? TW - 18 + rand() * 18 : rand() * 18, rand() * TH, 3, 3 + rand() * 6); } ctx.globalCompositeOperation = 'source-over';
    }
    const inner = 118, outer = 84, L = side === 'R' ? inner : outer, R = TW - (side === 'R' ? outer : inner);
    ctx.strokeStyle = P.rule; ctx.lineWidth = 3; ctx.strokeRect(L - 30, 64, R - L + 60, TH - 128);
    ctx.lineWidth = 1.5; ctx.strokeRect(L - 20, 74, R - L + 40, TH - 148);
    ctx.fillStyle = P.muted; ctx.font = font(22, 500, HEAD); ctx.textAlign = 'center'; spaced(ctx, 4);
    if (title) { ctx.fillText(title.toUpperCase(), (L + R) / 2, 128); if (curColor) { const tw2 = ctx.measureText(title.toUpperCase()).width / 2 + 26; ctx.fillStyle = curColor; for (const sx of [-1, 1]) { const x = (L + R) / 2 + sx * tw2; ctx.beginPath(); ctx.moveTo(x, 112); ctx.lineTo(x + 8, 120); ctx.lineTo(x, 128); ctx.lineTo(x - 8, 120); ctx.fill(); } ctx.fillStyle = P.muted; } }
    spaced(ctx, 0); ctx.font = font(26, 400, BODY, true); if (folio) ctx.fillText(folio, (L + R) / 2, TH - 100);
    ctx.textAlign = 'left';
    return { L, R, w: R - L, cx: (L + R) / 2 };
  }
  function heading(ctx, m, text, y, size = 76) {
    ctx.font = font(size, 700, HEAD); spaced(ctx, 1);
    ctx.textAlign = 'center'; bite(ctx, text, m.cx, y, P.ink); ctx.textAlign = 'left'; spaced(ctx, 0);
    ctx.strokeStyle = P.rule; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(m.cx - 120, y + 28); ctx.lineTo(m.cx - 14, y + 28); ctx.moveTo(m.cx + 14, y + 28); ctx.lineTo(m.cx + 120, y + 28); ctx.stroke();
    ctx.fillStyle = P.accent; ctx.beginPath(); ctx.moveTo(m.cx, y + 20); ctx.lineTo(m.cx + 8, y + 28); ctx.lineTo(m.cx, y + 36); ctx.lineTo(m.cx - 8, y + 28); ctx.fill();
  }
  function rule(ctx, m, y) { ctx.strokeStyle = P.rule; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(m.L, y); ctx.lineTo(m.R, y); ctx.stroke(); }
  function smallcaps(ctx, text, x, y, color = P.muted, align = 'left') { ctx.fillStyle = color; ctx.font = font(20, 500, HEAD); spaced(ctx, 3); ctx.textAlign = align; ctx.fillText(text.toUpperCase(), x, y); spaced(ctx, 0); ctx.textAlign = 'left'; }
  function para(ctx, m, text, y, size = 32, lh = 44, x = m.L, w = m.w) { ctx.fillStyle = P.ink; ctx.font = font(size, 400); return wrap(ctx, text, x, y, w, lh); }

  const D = data.chapters;
  const centered = (ctx, text, x, y) => { ctx.textAlign = 'center'; ctx.fillText(text, x, y); ctx.textAlign = 'left'; };
  const chapterHead = (ctx, m, d) => {
    heading(ctx, m, d.title, 250, 72);
    ctx.fillStyle = P.muted; ctx.font = font(30, 400, BODY, true); centered(ctx, d.summary, m.cx, 345);
  };
  const footnote = (ctx, m, text, y = TH - 160) => { ctx.fillStyle = P.muted; ctx.font = font(26, 400, BODY, true); centered(ctx, text, m.cx, y); };
  const chapterPage = (ctx, title, folio, d, hs) => {
    const m = parchment(ctx, 'R', title, folio);
    chapterHead(ctx, m, d);
    para(ctx, m, d.about, 450, 34, 50);
    // The way out to the project's 2D page: an outlined button in the accent colour.
    const bw = 440, bh = 76, bx = m.cx - bw / 2, by = TH - 300;
    ctx.fillStyle = P.accentSoft; ctx.strokeStyle = P.accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = P.accent; ctx.font = font(32, 600); ctx.textBaseline = 'middle';
    centered(ctx, 'Open the project page  →', m.cx, by + bh / 2 + 2); ctx.textBaseline = 'alphabetic';
    hs.push({ x: bx, y: by, w: bw, h: bh, act: () => onNavigate(d.path) });
    footnote(ctx, m, d.status, TH - 158);
  };
  const notesPage = (ctx, side, title, folio, d) => {
    const m = parchment(ctx, side, title, folio);
    heading(ctx, m, 'Notes', 262, 56);
    let y = 350;
    for (const [k, v] of d.notes) { smallcaps(ctx, k, m.L, y); y = para(ctx, m, v, y + 50, 30, 42) + 34; }
    rule(ctx, m, y);
    const cw = m.w / 3;
    d.facts.forEach(([k, v], i) => { smallcaps(ctx, k, m.L + i * cw, y + 60); ctx.fillStyle = P.ink; ctx.font = font(30, 600); wrap(ctx, v, m.L + i * cw, y + 104, cw - 16, 36); });
  };

  const faces = {
    exlibris(ctx) {
      ctx.fillStyle = '#e6d8b6'; ctx.fillRect(0, 0, TW, TH);
      paperGrain(ctx, TW, TH, 1.2);
      // Printed diaper in the gem's green: a double lattice with a dot at every crossing, slightly under-inked.
      const ink = 'rgba(38,92,78,';
      ctx.lineWidth = 2.4; ctx.strokeStyle = ink + '0.42)';
      for (let i = -TH; i < TW + TH; i += 72) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + TH, TH); ctx.moveTo(i, TH); ctx.lineTo(i + TH, 0); ctx.stroke(); }
      ctx.lineWidth = 1; ctx.strokeStyle = ink + '0.28)';
      for (let i = -TH + 8; i < TW + TH; i += 72) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + TH, TH); ctx.moveTo(i - 8, TH); ctx.lineTo(i + TH - 8, 0); ctx.stroke(); }
      ctx.fillStyle = ink + '0.5)';
      for (let j = -1; j * 36 < TH + 72; j++) for (let i = -1; i * 72 < TW + 72; i++) { const x = i * 72 + (j % 2 ? 36 : 0), y = j * 36; ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 5, y); ctx.fill(); }
      ctx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 700; i++) { ctx.fillStyle = `rgba(0,0,0,${rand() * 0.18})`; ctx.fillRect(rand() * TW, rand() * TH, 2 + rand() * 4, 1 + rand() * 2); } ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#e6d8b6'; ctx.globalAlpha = 0.35; ctx.fillRect(0, 0, TW, TH); ctx.globalAlpha = 1;
      const px = 200, py = 360, pw = TW - 400, ph = 620;
      ctx.save(); ctx.shadowColor = 'rgba(40,30,10,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 6; ctx.fillStyle = P.parch; ctx.fillRect(px, py, pw, ph); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip(); paperGrain(ctx, TW, TH, 0.5); ctx.restore();
      ctx.strokeStyle = P.goldDark; ctx.lineWidth = 3; ctx.strokeRect(px + 18, py + 18, pw - 36, ph - 36);
      ctx.textAlign = 'center';
      ctx.fillStyle = P.muted; ctx.font = font(30, 400, BODY, true); ctx.fillText('Ex libris', TW / 2, py + 120);
      ctx.font = font(64, 700, HEAD); fitFont(ctx, data.name, pw - 80, 64, HEAD); bite(ctx, data.name, TW / 2, py + 240, P.ink);
      ctx.font = font(32, 400); ctx.fillText(data.role, TW / 2, py + 300);
      ctx.fillStyle = P.accent; ctx.beginPath(); ctx.moveTo(TW / 2, py + 340); ctx.lineTo(TW / 2 + 12, py + 354); ctx.lineTo(TW / 2, py + 368); ctx.lineTo(TW / 2 - 12, py + 354); ctx.fill();
      ctx.fillStyle = P.muted; ctx.font = font(28, 400, BODY, true);
      ctx.fillText('Turn the page, drag a corner,', TW / 2, py + 450);
      ctx.fillText('or pull a colored ribbon to find a chapter.', TW / 2, py + 490);
      ctx.textAlign = 'left';
    },
    contents(ctx, hs) {
      const m = parchment(ctx, 'R', 'Contents', 'i');
      heading(ctx, m, 'Contents', 260);
      const rows = [['About', 'Who wrote this book', 'ii', 2, 0], [D.bezl.title, 'Chapter I', '1', 2, 1], [D.kbui.title, 'Chapter II', '3', 3, 2], ['Work studies', 'Three short deep dives', '5', 4, 4], ['Contact', 'Where to find me', '7', 5, 5], ['Colophon', 'How this book was made', '8', 6, 5]];
      let y = 360;
      for (const [t, s, n, go, ci] of rows) {
        ctx.fillStyle = SECT[ci]; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.roundRect(m.L, y + 10, 14, 68, 4); ctx.fill(); ctx.globalAlpha = 1;
        ctx.save(); ctx.translate(36, 0);
        ctx.fillStyle = P.ink; ctx.font = font(40, 600); ctx.fillText(t, m.L, y + 40);
        ctx.fillStyle = P.muted; ctx.font = font(26, 400, BODY, true); ctx.fillText(s, m.L, y + 76); ctx.restore();
        ctx.fillStyle = P.accent; ctx.font = font(34, 500); ctx.textAlign = 'right'; ctx.fillText(n, m.R, y + 40); ctx.textAlign = 'left';
        ctx.strokeStyle = P.rule; ctx.setLineDash([2, 8]); ctx.lineWidth = 2;
        ctx.font = font(40, 600); ctx.beginPath(); ctx.moveTo(m.L + 36 + ctx.measureText(t).width + 24, y + 34); ctx.lineTo(m.R - 50, y + 34); ctx.stroke(); ctx.setLineDash([]);
        hs.push({ x: m.L - 10, y, w: m.w + 20, h: 96, act: () => goTo(go) });
        y += 118;
      }
    },
    about(ctx) {
      const m = parchment(ctx, 'L', 'About', 'ii');
      heading(ctx, m, 'About', 270);
      let y = 400;
      for (const p of data.about) y = para(ctx, m, p, y, 32, 46) + 24;
      rule(ctx, m, y + 4);
      smallcaps(ctx, 'Now building', m.L, y + 74);
      ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(m.L + 12, y + 122, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.ink; ctx.font = font(38, 600); ctx.fillText(data.nowBuilding, m.L + 36, y + 134);
      ctx.fillStyle = P.muted; ctx.font = font(28, 400, BODY, true); ctx.fillText(`as of ${data.asOf}`, m.L + 36, y + 176);
    },

    // Chapters say what each project is; images wait for real screenshots.
    bezl(ctx, hs) { chapterPage(ctx, 'Chapter I', '1', D.bezl, hs); },
    bezlNotes(ctx) { notesPage(ctx, 'L', D.bezl.title, '2', D.bezl); },

    kbui(ctx, hs) { chapterPage(ctx, 'Chapter II', '3', D.kbui, hs); },
    kbuiNotes(ctx) { notesPage(ctx, 'L', D.kbui.title, '4', D.kbui); },

    studies(ctx, hs) {
      const m = parchment(ctx, 'R', 'Studies', '5');
      heading(ctx, m, 'Work studies', 260, 64);
      let y = 360;
      for (const s of data.studies) {
        rule(ctx, m, y);
        smallcaps(ctx, `${s.when} · ${s.format}`, m.L, y + 50);
        ctx.fillStyle = P.ink; ctx.font = font(36, 600);
        const yy = wrap(ctx, s.title, m.L, y + 102, m.w, 44);
        ctx.fillStyle = P.accent; ctx.font = font(27, 400, BODY, true); ctx.fillText('Read the plan →', m.L, yy + 4);
        hs.push({ x: m.L, y, w: m.w, h: yy + 20 - y, act: () => onNavigate(s.path) });
        y = yy + 52;
      }
      rule(ctx, m, y);
      para(ctx, m, 'One-week deep dives, each ending in a small working piece a project will reuse.', y + 56, 28, 38);
    },
    studyNotes(ctx) {
      const m = parchment(ctx, 'L', 'Notes', '6');
      heading(ctx, m, 'Why these three', 262, 56);
      let y = 350;
      for (const s of data.studies) { smallcaps(ctx, s.short, m.L, y); y = para(ctx, m, s.why, y + 50, 30, 42) + 34; }
    },
    contact(ctx, hs) {
      const m = parchment(ctx, 'R', 'Contact', '7');
      heading(ctx, m, 'Find me', 280, 70);
      let y = para(ctx, m, data.contactLine, 400, 34, 48) + 30;
      rule(ctx, m, y);
      for (const { label, value: v, href } of data.contact) {
        const act = href.startsWith('mailto:') ? () => { window.location.href = href; } : () => window.open(href, '_blank', 'noopener');
        smallcaps(ctx, label, m.L, y + 56);
        ctx.fillStyle = P.accent; ctx.font = font(40, 600); ctx.fillText(v, m.L, y + 112);
        hs.push({ x: m.L, y: y + 20, w: m.w, h: 120, act });
        y += 150; rule(ctx, m, y);
      }
    },
    colophon(ctx) {
      const m = parchment(ctx, 'L', 'Colophon', '8');
      heading(ctx, m, 'Colophon', 270);
      let y = 400;
      for (const [k, v] of [['Type', 'Cinzel for titles, EB Garamond for reading.'], ['Pages', 'Painted in the browser, then wrapped onto pages in Three.js that bend as they turn.'], ['Covers', 'Leather, brass and an emerald, all made in code with no image files.'], ['Chapters', 'A ribbon marks where each chapter starts.'], ['Access', 'Everything here is also a plain website: press L, or use the 3D/2D switch at the top.'], ['Bound', data.asOf]]) {
        smallcaps(ctx, k, m.L, y);
        y = para(ctx, m, v, y + 50, 30, 42) + 30;
      }
    },
    finis(ctx, hs) {
      const m = parchment(ctx, 'R', '', '');
      ctx.textAlign = 'center';
      ctx.font = font(72, 700, HEAD); bite(ctx, 'Finis', m.cx, TH / 2 - 40, P.ink);
      ctx.fillStyle = P.accent; ctx.font = font(34, 500); ctx.fillText('Close the book', m.cx, TH / 2 + 50);
      ctx.textAlign = 'left';
      hs.push({ x: m.cx - 160, y: TH / 2, w: 320, h: 80, act: () => goTo(0) });
    }
  };

  // ---------- textures ----------
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const faceTex = {}, faceHs = {};
  function makeFace(name, flip) {
    const c = document.createElement('canvas'); c.width = TW; c.height = TH;
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = maxAniso;
    if (flip) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; }
    faceTex[name] = { canvas: c, tex: t };
    redraw(name);
    return t;
  }
  function redraw(name) {
    const { canvas, tex } = faceTex[name]; const ctx = canvas.getContext('2d');
    seed = 7 + name.length * 31; ctx.clearRect(0, 0, TW, TH);
    curColor = FACE_COLOR[name] || null; curName = name; curSide = null;
    faceHs[name] = []; faces[name](ctx, faceHs[name]);
    // Ink sits in the fibres: a last pass of fine tooth over the type, so print reads pressed into the sheet rather than laid on it.
    pulp(ctx, TW, TH, 4, 0.085);
    if (PARTNER[name]) {
      const g = faceTex[name].ghost || (faceTex[name].ghost = document.createElement('canvas')); g.width = 256; g.height = 348;
      const gc = g.getContext('2d'); gc.drawImage(canvas, 0, 0, 256, 348);
      const img = gc.getImageData(0, 0, 256, 348), d = img.data;
      for (let i = 0; i < d.length; i += 4) { const lum = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255; d[i] = 60; d[i + 1] = 40; d[i + 2] = 20; d[i + 3] = Math.max(0, Math.min(1, (0.62 - lum) / 0.35)) * 255; }
      gc.putImageData(img, 0, 0);
    }
    if (name !== 'exlibris') deckle(ctx, curSide, name === 'finis' ? P.parchEdge : null);
    tex.needsUpdate = true;
  }
  // Recto/verso pairs, filled once SHEETS is known; a face without a partner (endpaper, finis) gets no show-through.
  const PARTNER = {};
  // Ragged, worn page edges: keep only a jittered rounded outline. The spine edge is sewn, so it stays straight and square.
  function deckle(ctx, side, backing) {
    const pts = [], j = () => 4 + rand() * 9, r = 30, sL = side === 'R', sR = side === 'L';
    for (let x = sL ? 0 : r; x <= TW - (sR ? 0 : r); x += 22) pts.push([x, j()]);
    if (sR) pts.push([TW, 0], [TW, TH]); else for (let y = r; y <= TH - r; y += 22) pts.push([TW - j(), y]);
    for (let x = TW - (sR ? 0 : r); x >= (sL ? 0 : r); x -= 22) pts.push([x, TH - j()]);
    if (sL) pts.push([0, TH], [0, 0]); else for (let y = TH - r; y >= r; y -= 22) pts.push([j(), y]);
    ctx.globalCompositeOperation = 'destination-in'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = '#000'; ctx.fill();
    if (backing) { ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = backing; ctx.fillRect(0, 0, TW, TH); }
    ctx.globalCompositeOperation = 'source-over';
  }
  // Height field painted in grey, converted to a tangent-space normal map; strength scales the slope.
  function heightToNormal(hc, strength) {
    const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
    const out = document.createElement('canvas'); out.width = w; out.height = h; const octx = out.getContext('2d'); const img = octx.createImageData(w, h), d = img.data;
    const at = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
      d[i] = (-dx / len * 0.5 + 0.5) * 255; d[i + 1] = (dy / len * 0.5 + 0.5) * 255; d[i + 2] = (1 / len * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
    octx.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(out); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso; return t;
  }
  function heightCanvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
  function linearTex(c) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso; return t; }
  // A tool impression: gilt (foil pressed into a groove) or blind (groove only). Draw the path twice, shadow then face.
  // stampMX = -1 while painting the spine: its texture-left is the viewer's right, so painted shadows must mirror in x.
  let stampMX = 1;
  const stamp = (ctx, draw, gilt, depth = 1) => {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgba(4,8,16,${0.75 * depth})`; ctx.fillStyle = `rgba(4,8,16,${0.75 * depth})`; ctx.translate(1.2 * stampMX, 1.4); draw(ctx, 'shadow'); ctx.translate(-1.2 * stampMX, -1.4);
    if (gilt) { ctx.strokeStyle = '#caa75a'; ctx.fillStyle = '#caa75a'; draw(ctx, 'face'); ctx.strokeStyle = 'rgba(255,242,205,0.55)'; ctx.fillStyle = 'rgba(255,242,205,0.55)'; ctx.translate(-0.6 * stampMX, -0.7); draw(ctx, 'hi'); }
    else { ctx.strokeStyle = `rgba(185,200,225,${0.3 * depth})`; ctx.fillStyle = `rgba(185,200,225,${0.3 * depth})`; ctx.translate(-0.8 * stampMX, -0.9); draw(ctx, 'face'); }
    ctx.restore();
  };
  // Fleuron: a leafy sprig with a central bud; the workhorse small tool.
  const fleuron = (ctx, x, y, r, rot = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineWidth = r * 0.14;
    ctx.beginPath(); ctx.moveTo(0, r); ctx.quadraticCurveTo(r * 0.55, r * 0.2, 0, -r); ctx.quadraticCurveTo(-r * 0.55, r * 0.2, 0, r); ctx.fill();
    for (const sg of [1, -1]) { ctx.beginPath(); ctx.moveTo(0, r * 0.2); ctx.quadraticCurveTo(sg * r * 0.9, r * 0.1, sg * r * 0.75, -r * 0.55); ctx.quadraticCurveTo(sg * r * 0.4, -r * 0.25, 0, r * 0.1); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, r * 1.15, r * 0.16, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
  // Lotus/acanthus corner tool: three curling lobes.
  const corner = (ctx, x, y, r, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineWidth = r * 0.12;
    for (const a of [-0.55, 0, 0.55]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(r * 0.3, -r * 0.3, r * 0.95, -r * 0.35, r * 0.75, -r * 0.95); ctx.bezierCurveTo(r * 0.6, -r * 0.6, r * 0.35, -r * 0.55, 0, 0); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
  // Fillet: a single or double gilt line.
  const fillet = (ctx, x, y, w, h, r, lw) => { ctx.lineWidth = lw; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke(); };
  // Roll: a repeating border motif (leaf-and-dot) run along a rectangle.
  const roll = (ctx, x, y, w, h, step, size, open) => { ctx.lineWidth = size * 0.3;
    const seg = (x0, y0, x1, y1) => { const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / step)), ang = Math.atan2(y1 - y0, x1 - x0); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t; ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(-size * 0.5, 0); ctx.quadraticCurveTo(0, -size * 0.55, size * 0.5, 0); ctx.quadraticCurveTo(0, size * 0.25, -size * 0.5, 0); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, size * 0.09, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } };
    seg(open ? 0 : x, y, x + w, y); seg(x + w, y, x + w, y + h); seg(x + w, y + h, open ? 0 : x, y + h); if (!open) seg(x, y + h, x, y); };
  // Open frame: a fillet that runs off the spine edge, so the line carries on over the spine.
  const frameOpen = (ctx, inset, r, lw) => { const w = ctx.canvas.width, h = ctx.canvas.height, R = w - inset; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(0, inset); ctx.lineTo(R - r, inset); ctx.quadraticCurveTo(R, inset, R, inset + r); ctx.lineTo(R, h - inset - r); ctx.quadraticCurveTo(R, h - inset, R - r, h - inset); ctx.lineTo(0, h - inset); ctx.stroke(); };
  // Diaper: a lattice of small blind stamps over the open field.
  const diaper = (ctx, x, y, w, h, cell) => { for (let j = 0; j * cell < h; j++) for (let i = 0; i * cell < w; i++) { const px = x + i * cell + (j % 2 ? cell / 2 : 0), py = y + j * cell; if (px > x + w - cell * 0.5 || py > y + h - cell * 0.5) continue; ctx.beginPath(); ctx.moveTo(px, py - cell * 0.22); ctx.lineTo(px + cell * 0.22, py); ctx.lineTo(px, py + cell * 0.22); ctx.lineTo(px - cell * 0.22, py); ctx.closePath(); ctx.lineWidth = 1.6; ctx.stroke(); ctx.beginPath(); ctx.arc(px, py, cell * 0.05, 0, Math.PI * 2); ctx.fill(); } };
  // Engraved vine: a running scroll with leaves and berries, as cut into cast hardware.
  const vine = (ctx, w, h, size) => { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const rows = Math.max(1, Math.round(h / size)), cols = Math.max(1, Math.round(w / size));
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = (i + 0.5) * (w / cols), y = (j + 0.5) * (h / rows), r = size * 0.42, dir = (i + j) % 2 ? 1 : -1;
      ctx.lineWidth = size * 0.07; ctx.beginPath(); ctx.moveTo(x - r, y + dir * r * 0.3); ctx.bezierCurveTo(x - r * 0.3, y - dir * r * 0.7, x + r * 0.3, y + dir * r * 0.7, x + r, y - dir * r * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dir * r * 0.5, y - r * 0.6, x + dir * r * 0.15, y - r * 0.85); ctx.quadraticCurveTo(x - dir * r * 0.1, y - r * 0.5, x, y); ctx.fill();
      ctx.beginPath(); ctx.arc(x - r * 0.55, y - dir * r * 0.05, size * 0.06, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + r * 0.6, y + dir * r * 0.1, size * 0.05, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore(); };
  // Pebbled leather grain: overlapping soft bumps plus fine creases.
  // One pebble list feeds both the relief and the colour shading, so every highlight sits on a real bump.
  const PEBBLES = (() => { seed = 101; const a = []; for (let i = 0; i < 5200; i++) a.push({ x: rand() * 1024, y: rand() * 1024, r: 6 + rand() * 12, hgt: 0.6 + rand() * 0.4 }); return a; })();
  const leatherHeight = heightCanvas(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); seed = 102;
    // Pebble cells packed densely; each a dome with a rounded crown and a steep skirt.
    for (const { x, y, r, hgt } of PEBBLES) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); const l = 128 + 72 * hgt; g.addColorStop(0, `rgb(${l},${l},${l})`); g.addColorStop(0.45, `rgb(${(128 + 48 * hgt) | 0},${(128 + 48 * hgt) | 0},${(128 + 48 * hgt) | 0})`); g.addColorStop(0.85, 'rgb(116,116,116)'); g.addColorStop(1, 'rgba(128,128,128,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    // Pores: tiny pits.
    for (let i = 0; i < 3000; i++) { ctx.fillStyle = 'rgb(70,70,70)'; ctx.fillRect(rand() * w, rand() * h, 1.5, 1.5); }
    // Creases: grooves.
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(60,60,60,0.75)'; ctx.lineWidth = 1.8;
    for (let i = 0; i < 160; i++) { let x = rand() * w, y = rand() * h; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rand() - 0.5) * 70; y += (rand() - 0.5) * 50; ctx.lineTo(x, y); } ctx.stroke(); }
    // Broad undulation so the surface is not perfectly flat.
    for (let i = 0; i < 40; i++) { const x = rand() * w, y = rand() * h, r = 60 + rand() * 160, g = ctx.createRadialGradient(x, y, 0, x, y, r); const l = rand() > 0.5 ? 140 : 116; g.addColorStop(0, `rgba(${l},${l},${l},0.5)`); g.addColorStop(1, 'rgba(128,128,128,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
  });
  const leatherNormal = heightToNormal(leatherHeight, 3.4);
  // A second height map for the covers that carries the tooling as grooves (gilt lines sit lower than the field).
  const coverHeight = heightCanvas(1024, 1400, (ctx, w, h) => {
    ctx.drawImage(leatherHeight, 0, 0, w, h);
    const groove = (draw) => { ctx.save(); ctx.strokeStyle = 'rgb(62,62,62)'; ctx.fillStyle = 'rgb(62,62,62)'; draw(ctx); ctx.restore(); };
    groove((c) => { frameOpen(c, 64, 8, 5); frameOpen(c, 80, 6, 2.4); fillet(c, 134, 134, w - 268, h - 268, 4, 2.6); });
    groove((c) => { roll(c, 104, 104, w - 208, h - 208, 30, 22, true); });
    ctx.save(); ctx.strokeStyle = 'rgb(104,104,104)'; ctx.fillStyle = 'rgb(104,104,104)'; diaper(ctx, 150, 150, w - 300, h - 300, 64); ctx.restore();
    const cx = w / 2, cy = h / 2, lx = 230, ly = 300;
    groove((c) => { c.lineWidth = 4; c.beginPath(); c.moveTo(cx, cy - ly); c.lineTo(cx + lx, cy); c.lineTo(cx, cy + ly); c.lineTo(cx - lx, cy); c.closePath(); c.stroke(); fleuron(c, cx, cy - ly - 34, 24, Math.PI); fleuron(c, cx, cy + ly + 34, 24, 0); fleuron(c, cx - lx - 34, cy, 24, Math.PI / 2); fleuron(c, cx + lx + 34, cy, 24, -Math.PI / 2); });
  });
  const coverNormal = heightToNormal(coverHeight, 3.4); coverNormal.wrapS = coverNormal.wrapT = THREE.ClampToEdgeWrapping;
  let coverNormalF = coverNormal;
  // Spine map: 512 px over flange, back and flange at the covers' pixel scale; ornament sits between the shoulders.
  const SW = 512, SH = 1400, SXL = Math.round(UF * SW), SXR = SW - SXL, SIN = 26;
  const SBANDS = [0.18, 0.4, 0.6, 0.82].map((f) => f * SH), SBH = 46;
  const SCOMPS = (() => { const c = [[150, SBANDS[0] - SBH / 2 - 14]]; for (let i = 0; i < 3; i++) c.push([SBANDS[i] + SBH / 2 + 14, SBANDS[i + 1] - SBH / 2 - 14]); c.push([SBANDS[3] + SBH / 2 + 14, SH - 150]); return c; })();
  // Panel furniture from each box's inner rect: short panels get one sprig lying across, tall ones a column of three plus corner tools turned into the field.
  const SPANELS = SCOMPS.map(([y0, y1], i) => {
    const x = SXL + SIN, w = SXR - SXL - 2 * SIN, m = i === 1 ? 16 : 12, y = y0 + m, h = y1 - y0 - 2 * m, cx = SW / 2, cy = y + h / 2, tools = [];
    if (i === 1) return { x, y, w, h, title: true, tools };
    const short = h < 110, pad = short ? 8 : 10, ih = h - 2 * pad;
    if (short) { const r = Math.min(13, ih / 1.6); tools.push({ k: 'f', x: cx - 1.31 * r - 4, y: cy, r, rot: -Math.PI / 2 }, { k: 'f', x: cx + 1.31 * r + 4, y: cy, r, rot: Math.PI / 2 }, { k: 'd', x: cx, y: cy, r: r * 0.2 }); }
    else {
      const r0 = Math.min(28, ih / 5.2), r1 = r0 * 0.46, gap = r0 * 0.36, top = cy - (2.31 * (r0 + 2 * r1) + 2 * gap) / 2;
      tools.push({ k: 'f', x: cx, y: top + 1.31 * r1, r: r1, rot: Math.PI }, { k: 'f', x: cx, y: top + 2.31 * r1 + gap + r0, r: r0, rot: 0 }, { k: 'f', x: cx, y: top + 2.31 * (r1 + r0) + 2 * gap + r1, r: r1, rot: 0 });
      // Corner tool's tip sits 0.903 rad off its local +x; rot aims it down the diagonal.
      for (const [sx, sy, a] of [[1, 1, Math.PI / 4], [-1, 1, 3 * Math.PI / 4], [1, -1, -Math.PI / 4], [-1, -1, -3 * Math.PI / 4]]) tools.push({ k: 'c', x: cx - sx * (w / 2 - 14), y: cy - sy * (h / 2 - 14), r: 18, rot: a + 0.903 });
    }
    return { x, y, w, h, tools };
  });
  const tool = (c, t) => { if (t.k === 'f') fleuron(c, t.x, t.y, t.r, t.rot); else if (t.k === 'c') corner(c, t.x, t.y, t.r, t.rot); else { c.beginPath(); c.arc(t.x, t.y, t.r, 0, Math.PI * 2); c.fill(); } };
  // Band dots: whole row centred between the shoulders.
  const bandDots = (c, y) => { const n = Math.floor((SXR - SXL - 32) / 18); for (let i = 0; i < n; i++) { c.beginPath(); c.arc(SW / 2 + (i - (n - 1) / 2) * 18, y, 3, 0, Math.PI * 2); c.fill(); } };
  const leaf = (c, x, y) => { c.save(); c.translate(x, y); c.beginPath(); c.moveTo(-11, 0); c.quadraticCurveTo(0, -12, 11, 0); c.quadraticCurveTo(0, 5.5, -11, 0); c.fill(); c.beginPath(); c.arc(0, 0, 2, 0, Math.PI * 2); c.fill(); c.restore(); };
  const hline = (c, y, lw, x0, x1) => { c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); };
  // Roll leaves over the back keep the cover roll's phase at both shoulders, so the copied strips and the arc line up.
  const SLEAF = (() => { const seg = 1024 - 104, stepC = seg / Math.round(seg / 30), f0 = stepC / 2, nA = Math.round((SXR - SXL - 2 * f0) / stepC), stepA = (SXR - SXL - 2 * f0) / nA, a = []; for (let k = 0; k <= nA; k++) a.push(SXL + f0 + k * stepA); return a; })();
  // Flanges copy the cover's own strip (mirrored on the front) and fade it out past the shoulder, so the hide reads as one piece.
  const FADE = 48;
  const blendFromCover = (ctx, src) => {
    const h = ctx.canvas.height;
    const strip = (sw, dx0, flip, fade) => {
      const t = document.createElement('canvas'); t.width = sw; t.height = h; const tc = t.getContext('2d');
      if (flip) { tc.translate(sw, 0); tc.scale(-1, 1); }
      tc.drawImage(src, 0, 0, sw, h, 0, 0, sw, h);
      if (fade) { tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'destination-in'; const g = tc.createLinearGradient(fade > 0 ? 0 : sw, 0, fade > 0 ? sw : 0, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); tc.fillStyle = g; tc.fillRect(0, 0, sw, h); }
      ctx.drawImage(t, dx0, 0);
    };
    strip(SXL, 0, true, 0); strip(FADE, SXL, false, 1); strip(SXL, SXR, false, 0); strip(FADE, SXR - FADE, true, -1);
  };
  const spineHeight = heightCanvas(SW, SH, (ctx, w, h) => {
    // Same grain and the same vertical stretch as the covers, so relief matches across the joint.
    ctx.drawImage(leatherHeight, 0, 0, w, 1024, 0, 0, w, h);
    blendFromCover(ctx, coverHeight);
    ctx.strokeStyle = 'rgb(60,60,60)'; ctx.fillStyle = 'rgb(60,60,60)';
    for (const y of [64, h - 64]) hline(ctx, y, 5, SXL, SXR); for (const y of [80, h - 80]) hline(ctx, y, 2.4, SXL, SXR); for (const y of [134, h - 134]) hline(ctx, y, 2.6, SXL, SXR);
    for (const y of [104, h - 104]) for (const x of SLEAF) leaf(ctx, x, y);
    for (const p of SPANELS) { if (p.title) { fillet(ctx, p.x, p.y, p.w, p.h, 6, 4); ctx.fillStyle = 'rgb(108,108,108)'; ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8); ctx.fillStyle = 'rgb(60,60,60)'; } else { fillet(ctx, p.x, p.y, p.w, p.h, 6, 3.4); for (const t of p.tools) tool(ctx, t); } }
    for (const y of SBANDS) { hline(ctx, y - SBH / 2 - 4, 2.5, SXL + 8, SXR - 8); hline(ctx, y + SBH / 2 + 4, 2.5, SXL + 8, SXR - 8); }
  });
  const spineNormal = heightToNormal(spineHeight, 3.4); spineNormal.wrapS = spineNormal.wrapT = THREE.ClampToEdgeWrapping;
  const leatherRoughC = heightCanvas(256, 256, (ctx, w, h) => { ctx.fillStyle = '#b4b4b4'; ctx.fillRect(0, 0, w, h); seed = 77; for (let i = 0; i < 40; i++) { const x = rand() * w, y = rand() * h, r = 10 + rand() * 50, g = ctx.createRadialGradient(x, y, 0, x, y, r); const l = 130 + rand() * 70; g.addColorStop(0, `rgb(${l},${l},${l})`); g.addColorStop(1, 'rgba(180,180,180,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); } });
  const leatherRough = linearTex(leatherRoughC);
  // Cover-sized roughness: the 256 px pattern tiled at the covers' 1.4 x 2 repeat; the spine copies its flange strips.
  const tileRough = (w, h) => heightCanvas(w, h, (ctx) => { for (let y = 0; y < h; y += 700) for (let x = 0; x < w; x += 731) ctx.drawImage(leatherRoughC, x, y, 731, 700); });
  const coverRoughC = tileRough(1024, 1400), coverRough = linearTex(coverRoughC); coverRough.wrapS = coverRough.wrapT = THREE.ClampToEdgeWrapping;
  const spineRough = linearTex(heightCanvas(SW, SH, (ctx, w, h) => { for (let y = 0; y < h; y += 700) for (let x = 0; x < w; x += 731) ctx.drawImage(leatherRoughC, x, y, 731, 700); blendFromCover(ctx, coverRoughC); })); spineRough.wrapS = spineRough.wrapT = THREE.ClampToEdgeWrapping;
  // Hammered, pitted bronze.
  const bronzeHeight = heightCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); seed = 55;
    // Cast texture: broad shallow dimples (hammer/cast marks).
    for (let i = 0; i < 520; i++) { const x = rand() * w, y = rand() * h, r = 5 + rand() * 20, g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); g.addColorStop(0, 'rgb(146,146,146)'); g.addColorStop(0.7, 'rgb(118,118,118)'); g.addColorStop(1, 'rgba(128,128,128,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    // Pits.
    for (let i = 0; i < 1400; i++) { const x = rand() * w, y = rand() * h, r = 0.8 + rand() * 2.6; ctx.fillStyle = 'rgb(72,72,72)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    // Fine scratches.
    ctx.strokeStyle = 'rgb(100,100,100)'; ctx.lineWidth = 0.8; for (let i = 0; i < 300; i++) { const x = rand() * w, y = rand() * h, l = 6 + rand() * 40, a = rand() * Math.PI; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
    // Engraving as a deep groove.
    ctx.strokeStyle = 'rgb(48,48,48)'; ctx.fillStyle = 'rgb(48,48,48)'; vine(ctx, w, h, 128);
  });
  const bronzeNormal = heightToNormal(bronzeHeight, 2.8);
  const bronzeRough = linearTex(heightCanvas(512, 512, (ctx, w, h) => { ctx.fillStyle = '#6a6a6a'; ctx.fillRect(0, 0, w, h); seed = 66; for (let i = 0; i < 120; i++) { const x = rand() * w, y = rand() * h, r = 8 + rand() * 40, g = ctx.createRadialGradient(x, y, 0, x, y, r); const l = rand() > 0.6 ? 170 : 50; g.addColorStop(0, `rgb(${l},${l},${l})`); g.addColorStop(1, 'rgba(106,106,106,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); } for (let i = 0; i < 500; i++) { ctx.fillStyle = 'rgb(220,220,220)'; ctx.fillRect(rand() * w, rand() * h, 2, 2); } }));
  // Paper relief: fibre-clump tooth in two scales and broad shallow cockle; the tile edges wrap because the noise is drawn with a 1-cell overlap.
  const paperHeight = heightCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); seed = 88;
    // Noise is periodic (last row/column repeat the first) and the domes are drawn in wrapped copies, so the tile has no seam.
    const tooth = (cell, alpha) => { const n = Math.ceil(w / cell), c = document.createElement('canvas'); c.width = c.height = n + 1; const nc = c.getContext('2d'), img = nc.createImageData(n + 1, n + 1), d = img.data; for (let y = 0; y <= n; y++) for (let x = 0; x <= n; x++) { const i = (y * (n + 1) + x) * 4, src = (((y % n) * (n + 1)) + (x % n)) * 4; const l = x < n && y < n ? 60 + (rand() * 136) | 0 : d[src]; d[i] = d[i + 1] = d[i + 2] = l; d[i + 3] = 255; } nc.putImageData(img, 0, 0); ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(c, 0.5, 0.5, n, n, 0, 0, w, h); ctx.restore(); };
    tooth(3, 0.45); tooth(9, 0.35);
    for (let i = 0; i < 24; i++) { const x = rand() * w, y = rand() * h, r = 70 + rand() * 120, l = rand() > 0.5 ? 140 : 116; for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { if (x + dx + r < 0 || x + dx - r > w || y + dy + r < 0 || y + dy - r > h) continue; const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); g.addColorStop(0, `rgba(${l},${l},${l},0.55)`); g.addColorStop(1, 'rgba(128,128,128,0)'); ctx.fillStyle = g; ctx.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r); } }
  });
  const paperNormal = heightToNormal(paperHeight, 1.3); paperNormal.repeat.set(2, 2.72);
  // Brocade at the ribbon's own texel scale: satin ribs, raised gold quatrefoils and vines, a piped edge in the chapter colour.
  const RTW = 256, RTH = 1408;
  // Satin ground: a fine plain-weave thread grid with a faint diagonal twill, no rib stripes; inv swaps light and dark.
  const weave = (ctx, w, h, amp, warpAmp, sd, inv = false) => {
    seed = sd; const hi = inv ? '0,0,0' : '255,255,255', lo = inv ? '255,255,255' : '0,0,0';
    for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 3) { const up = ((x / 3 + y / 3) & 1) === 0; ctx.fillStyle = `rgba(${up ? hi : lo},${amp * (0.35 + rand() * 0.45)})`; ctx.fillRect(x, y, 3, 3); }
    ctx.lineWidth = 1; ctx.strokeStyle = `rgba(${hi},${amp * 0.5})`;
    for (let d = -h; d < w; d += 9) { ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + h, h); ctx.stroke(); }
    ctx.strokeStyle = `rgba(${lo},${amp * 0.35})`;
    for (let d = -h + 4; d < w; d += 9) { ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + h, h); ctx.stroke(); }
    for (let x = 0; x < w; x += 3) { ctx.fillStyle = `rgba(${hi},${warpAmp * rand() * 0.6})`; ctx.fillRect(x, 0, 1, h); }
  };
  // Motif paths, shared by colour, relief and roughness maps so every float sits on its own ridge.
  const quatrefoil = (ctx, x, y, r) => { ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.moveTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); ctx.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, 0, Math.PI * 2); } };
  const leafAt = (ctx, x, y, r, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(r * 0.9, -r * 0.6, r * 1.6, 0); ctx.quadraticCurveTo(r * 0.9, r * 0.6, 0, 0); ctx.restore(); };
  // style(kind) sets fill/stroke for 'ground' | 'gold' | 'accent' | 'pipe'; returns false to skip that layer.
  const brocade = (ctx, w, h, style) => {
    const PITCH = 300, cx = w / 2;
    if (style(ctx, 'ground')) ctx.fillRect(0, 0, w, h);
    const goldOn = style(ctx, 'gold');
    for (let y = 150; y < h - 60; y += PITCH) {
      if (goldOn) {
        // Vine: a stem swinging side to side with a leaf at each bend.
        ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 30, y + 60); ctx.bezierCurveTo(cx + 70, y + 110, cx - 70, y + 190, cx + 30, y + 240); ctx.stroke();
        for (const [ox, oy, a] of [[-10, 90, -2.3], [12, 200, 0.6], [-40, 150, 2.6], [38, 120, -0.4]]) { leafAt(ctx, cx + ox, y + oy, 22, a); ctx.fill(); if (ctx.outline) ctx.stroke(); }
        quatrefoil(ctx, cx, y, 46); ctx.fill(); if (ctx.outline) ctx.stroke(); ctx.beginPath(); ctx.arc(cx, y, 9, 0, Math.PI * 2); ctx.fill();
        for (const sx of [-1, 1]) { quatrefoil(ctx, cx + sx * 78, y + 150, 17); ctx.fill(); if (ctx.outline) ctx.stroke(); }
      }
    }
    if (style(ctx, 'accent')) for (let y = 150; y < h - 60; y += PITCH) { for (const sx of [-1, 1]) { quatrefoil(ctx, cx + sx * 78, y + 150, 12); ctx.fill(); } ctx.beginPath(); ctx.arc(cx, y, 5, 0, Math.PI * 2); ctx.fill(); }
    if (style(ctx, 'pipe')) { ctx.fillRect(0, 0, 9, h); ctx.fillRect(w - 9, 0, 9, h); }
  };
  const silkNormal = heightToNormal(heightCanvas(RTW, RTH, (ctx, w, h) => {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); weave(ctx, w, h, 0.26, 0.14, 5);
    brocade(ctx, w, h, (c, k) => { if (k === 'ground') return false; c.fillStyle = c.strokeStyle = k === 'gold' ? 'rgb(178,178,178)' : k === 'accent' ? 'rgb(150,150,150)' : 'rgb(146,146,146)'; return true; });
    for (const x of [0, w - 8]) { const g = ctx.createLinearGradient(x, 0, x + 8, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x, 0, 8, h); }
  }), 3);
  // G = roughness, B = metalness: gold floats are the smooth metallic thread, the ground a duller metallic satin, piping and accents plain silk.
  const silkRough = linearTex(heightCanvas(RTW, RTH, (ctx, w, h) => {
    ctx.fillStyle = 'rgb(0,140,120)'; ctx.fillRect(0, 0, w, h); weave(ctx, w, h, 0.18, 0.08, 6, true);
    brocade(ctx, w, h, (c, k) => { if (k === 'ground') return false; c.fillStyle = c.strokeStyle = k === 'gold' ? 'rgb(0,96,215)' : 'rgb(0,170,0)'; return true; });
  }));
  function paint(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = maxAniso; return t; }
  // Shared leather surface: base dye, grain in two scales, pores, creases, sun-fade and rubbed edges.
  const leatherSurface = (ctx, w, h, sd, edges = 'ltrb', base, mirror = false) => {
    seed = sd; const mx = mirror ? -1 : 1;
    const k = (w * h) / (1024 * 1400);
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#4f6078'); g.addColorStop(0.5, '#37475f'); g.addColorStop(1, '#222d41');
    ctx.fillStyle = base ? base(ctx) : g; ctx.fillRect(0, 0, w, h);
    // Dye blotches: uneven absorption, soft and wide so they read as dye, not discs.
    for (let i = 0; i < 50 * k; i++) { const x = rand() * w, y = rand() * h, r = 90 + rand() * 220, dark = rand() > 0.5, gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, dark ? 'rgba(10,16,30,0.16)' : 'rgba(165,185,210,0.07)'); gg.addColorStop(0.5, dark ? 'rgba(10,16,30,0.08)' : 'rgba(165,185,210,0.035)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    // Pebble grain on the relief's own domes: lit crown toward the top-left, shadow pooled under the skirt, at the map's vertical stretch.
    const sy = h / 1024;
    for (const { x, y: py, r, hgt } of PEBBLES) { if (x > w) continue; const y = py * sy, rr = r * (0.5 + 0.5 * sy); const lg = ctx.createRadialGradient(x - mx * rr * 0.3, y - rr * 0.3, 0, x, y, rr); lg.addColorStop(0, `rgba(190,208,232,${0.14 * hgt})`); lg.addColorStop(0.5, `rgba(190,208,232,${0.04 * hgt})`); lg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `rgba(4,8,18,${0.22 * hgt})`; ctx.beginPath(); ctx.ellipse(x + mx * rr * 0.3, y + rr * 0.35, rr * 0.75, rr * 0.55, mx * 0.7, 0, Math.PI * 2); ctx.fill(); }
    // Pores.
    for (let i = 0; i < 2600 * k; i++) { ctx.fillStyle = `rgba(4,8,16,${0.25 + rand() * 0.4})`; ctx.fillRect(rand() * w, rand() * h, 1.2, 1.2); }
    // Creases: long low-contrast wrinkles with a lit edge.
    ctx.lineCap = 'round';
    for (let i = 0; i < 48 * k; i++) { let x = rand() * w, y = rand() * h; const n = 4 + (rand() * 5) | 0; const pts = [[x, y]]; for (let k = 0; k < n; k++) { x += (rand() - 0.5) * 90; y += (rand() - 0.5) * 60; pts.push([x, y]); } for (const [c, lw, off] of [['rgba(4,8,16,0.5)', 1.6, 0], ['rgba(180,200,225,0.22)', 0.8, 1.2]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([px, py], j) => (j ? ctx.lineTo(px + mx * off, py + off) : ctx.moveTo(px + mx * off, py + off))); ctx.stroke(); } }
    // Fine scuffs.
    for (let i = 0; i < 400 * k; i++) { const x = rand() * w, y = rand() * h, l = 4 + rand() * 22, a = rand() * Math.PI; ctx.strokeStyle = `rgba(190,205,225,${0.06 + rand() * 0.14})`; ctx.lineWidth = 0.8 + rand(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
    // Rubbed edges: worn lighter where hands and shelves touch, darker in the deep corners.
    const edge = (x0, y0, x1, y1) => { const eg = ctx.createLinearGradient(x0, y0, x1, y1); eg.addColorStop(0, 'rgba(195,205,215,0.28)'); eg.addColorStop(0.35, 'rgba(195,205,215,0.06)'); eg.addColorStop(1, 'rgba(195,205,215,0)'); ctx.fillStyle = eg; ctx.fillRect(0, 0, w, h); };
    if (edges.includes('l')) edge(0, 0, 70, 0); if (edges.includes('r')) edge(w, 0, w - 70, 0); if (edges.includes('t')) edge(0, 0, 0, 70); if (edges.includes('b')) edge(0, h, 0, h - 70);
    for (let i = 0; i < 60 * k; i++) { const side = 'lrtb'[(rand() * 4) | 0]; if (!edges.includes(side)) continue; const onX = side === 'l' || side === 'r', x = onX ? (side === 'l' ? rand() * 24 : w - rand() * 24) : rand() * w, y = onX ? rand() * h : (side === 't' ? rand() * 24 : h - rand() * 24); ctx.fillStyle = `rgba(210,218,228,${0.18 + rand() * 0.3})`; ctx.beginPath(); ctx.ellipse(x, y, 2 + rand() * 9, 1 + rand() * 3, rand() * Math.PI, 0, Math.PI * 2); ctx.fill(); }
  };
  // Blind tooling: an impressed line reads as a dark groove with a lit lower lip.
  const tooled = (ctx, x, y, w, h, r, depth = 1) => {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgba(4,8,16,${0.7 * depth})`; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke();
    ctx.strokeStyle = `rgba(185,200,225,${0.34 * depth})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.roundRect(x + 1.6, y + 1.6, w, h, r); ctx.stroke();
  };
  // Roots: cracks the gem's light has split outward from the bezel, branching and thinning; t is distance from the stone, 0 at the setting, 1 at the far tips.
  const ROOTS = (() => {
    seed = 913; const out = [], cx = 512, cy = 700;
    const grow = (x, y, a, len, lw, depth) => {
      const pts = [[x, y]], n = 6 + (rand() * 4 | 0);
      for (let i = 0; i < n; i++) {
        a += (rand() - 0.5) * 0.9; x += Math.cos(a) * len / n; y += Math.sin(a) * len / n; pts.push([x, y]);
        if (depth < 3 && i > 0 && rand() < 0.4) grow(x, y, a + (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.7), len * (0.4 + rand() * 0.3), lw * 0.55, depth + 1);
      }
      out.push({ pts, lw });
    };
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + (rand() - 0.5) * 0.5, k = Math.abs(Math.cos(a)) + Math.abs(Math.sin(a)); grow(cx + Math.cos(a) * 142 / k, cy + Math.sin(a) * 208 / k, a, 80 + rand() * 90, 4.2 + rand() * 2.0, 0); }
    return out;
  })();
  const drawRoots = (ctx, style, ox = 0, oy = 0) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const { pts, lw } of ROOTS) for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], t = Math.min(1, Math.max(0, (Math.hypot(x1 - 512, (y1 - 700) * 0.73) - 110) / 170));
      style(ctx, lw * (1 - 0.62 * t), t); ctx.beginPath(); ctx.moveTo(x0 + ox, y0 + oy); ctx.lineTo(x1 + ox, y1 + oy); ctx.stroke();
    }
  };
  // Emissive map: bloom under a hot core, both dying out toward the tips so the light reads as seeping from the stone.
  const rootGlowTex = paint(1024, 1400, (ctx, w, h) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    ctx.shadowColor = 'rgba(70,240,180,0.85)'; ctx.shadowBlur = 16;
    drawRoots(ctx, (c, lw, t) => { c.strokeStyle = `rgba(50,210,160,${0.85 * (1 - t) ** 1.5})`; c.lineWidth = lw * 1.3; });
    ctx.shadowBlur = 0;
    drawRoots(ctx, (c, lw, t) => { c.strokeStyle = `rgba(200,255,235,${(1 - t) ** 2})`; c.lineWidth = lw * 0.45; });
  });
  const leatherTex = (label) => paint(1024, 1400, (ctx, w, h) => {
    leatherSurface(ctx, w, h, 3, 'trb');
    // Blind diaper over the field, kept out of the center panel and the title area.
    stamp(ctx, (c) => { diaper(c, 150, 150, w - 300, h - 300, 64); }, false, 0.3);
    // Outer gilt fillets: a thick and a thin line, the classic pair.
    stamp(ctx, (c) => { frameOpen(c, 64, 8, 4); frameOpen(c, 80, 6, 1.6); }, true);
    // Dentelle: a leaf-and-dot roll just inside the fillets.
    stamp(ctx, (c) => { roll(c, 104, 104, w - 208, h - 208, 30, 22, true); }, true);
    // Inner blind fillet framing the field.
    stamp(ctx, (c) => { fillet(c, 134, 134, w - 268, h - 268, 4, 2.2); }, false, 0.8);
    // Corner tools: acanthus curls pointing into the field.
    // Lozenge centerpiece around the gem: a gilt diamond with fleurons at its points.
    const cx = w / 2, cy = h / 2, lx = 230, ly = 300;
    stamp(ctx, (c) => { c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy - ly); c.lineTo(cx + lx, cy); c.lineTo(cx, cy + ly); c.lineTo(cx - lx, cy); c.closePath(); c.stroke(); c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, cy - ly + 22); c.lineTo(cx + lx - 17, cy); c.lineTo(cx, cy + ly - 22); c.lineTo(cx - lx + 17, cy); c.closePath(); c.stroke(); }, true);
    stamp(ctx, (c) => { fleuron(c, cx, cy - ly - 44, 34, Math.PI); fleuron(c, cx, cy + ly + 44, 34, 0); fleuron(c, cx - lx - 44, cy, 34, Math.PI / 2); fleuron(c, cx + lx + 44, cy, 34, -Math.PI / 2); }, true);
    // Small fleurons along the lozenge edges.
    stamp(ctx, (c) => { for (let t = 0.25; t < 1; t += 0.25) { fleuron(c, cx + lx * t, cy - ly * (1 - t), 15, -Math.PI * 0.25 + Math.PI); fleuron(c, cx + lx * t, cy + ly * (1 - t), 15, Math.PI * 0.25); fleuron(c, cx - lx * t, cy - ly * (1 - t), 15, Math.PI * 0.25 + Math.PI); fleuron(c, cx - lx * t, cy + ly * (1 - t), 15, -Math.PI * 0.25); } }, true);
    // Gilt field: knock the diaper out of the lozenge interior so the gem sits on clean leather.
    ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy - ly + 8); ctx.lineTo(cx + lx - 6, cy); ctx.lineTo(cx, cy + ly - 8); ctx.lineTo(cx - lx + 6, cy); ctx.closePath(); ctx.clip(); leatherSurface(ctx, w, h, 3, 'trb'); ctx.restore();
    if (label) {
      drawRoots(ctx, (c, lw) => { c.strokeStyle = 'rgba(2,5,10,0.42)'; c.lineWidth = lw * 1.7; });
      drawRoots(ctx, (c, lw) => { c.strokeStyle = 'rgba(1,3,7,0.82)'; c.lineWidth = lw; });
      drawRoots(ctx, (c, lw) => { c.strokeStyle = 'rgba(0,0,0,0.75)'; c.lineWidth = lw * 0.38; });
      drawRoots(ctx, (c, lw) => { c.strokeStyle = 'rgba(180,200,225,0.2)'; c.lineWidth = lw * 0.5; }, 1.4, 1.8);
      ctx.textAlign = 'center'; spaced(ctx, 10);
      // Gilt lettering: a pressed shadow, then foil with slight wear.
      ctx.font = font(58, 700, HEAD); fitFont(ctx, data.name.toUpperCase(), 760, 58, HEAD);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(data.name.toUpperCase(), w / 2 + 3, h - 186);
      ctx.fillStyle = '#d9b662'; ctx.fillText(data.name.toUpperCase(), w / 2, h - 190);
      ctx.fillStyle = 'rgba(255,240,200,0.55)'; ctx.fillText(data.name.toUpperCase(), w / 2 - 1, h - 191);
      ctx.font = font(28, 500, HEAD); spaced(ctx, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText('SELECTED WORK · MMXXVI', w / 2 + 2, h - 130);
      ctx.fillStyle = 'rgba(217,182,98,0.9)'; ctx.fillText('SELECTED WORK · MMXXVI', w / 2, h - 132);
      spaced(ctx, 0);
      // Foil wear: knock small chips out of the gilt.
      seed = 77; ctx.globalCompositeOperation = 'destination-over'; ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 90; i++) { const x = w / 2 - 240 + rand() * 480, y = h - 230 + rand() * 120; ctx.fillStyle = 'rgba(40,50,70,0.5)'; ctx.fillRect(x, y, 1 + rand() * 2.5, 1 + rand() * 2); }
    }
  });
  const coverBase = leatherTex(false);
  // Spine covering: the covers' hide at the same scale, flanges copied from the cover, tooled panels between the shoulders.
  const spineTex = paint(SW, SH, (ctx, w, h) => {
    stampMX = -1;
    // Base tone is the cover's spine-side column, so the copied flanges fade into the same dye; grain shading mirrored to keep its light upper-left on screen.
    leatherSurface(ctx, w, h, 3, 'tb', (c) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#4f6078'); g.addColorStop(0.768, '#37475f'); g.addColorStop(1, 'rgb(49,63,86)'); return g; }, true);
    blendFromCover(ctx, coverBase.image);
    for (const [y0, dir] of [[0, 1], [h, -1]]) {
      const Y = (d) => y0 + dir * d;
      stamp(ctx, (c) => { hline(c, Y(64), 4, SXL, SXR); hline(c, Y(80), 1.6, SXL, SXR); }, true);
      stamp(ctx, (c) => { for (const x of SLEAF) leaf(c, x, Y(104)); }, true);
      stamp(ctx, (c) => { hline(c, Y(134), 2.2, SXL, SXR); }, false, 0.8);
    }
    // Raised bands: lit crest, shadow under, a tooled line each side.
    for (const y of SBANDS) {
      const bg = ctx.createLinearGradient(0, y - SBH / 2, 0, y + SBH / 2); bg.addColorStop(0, 'rgba(0,0,0,0.35)'); bg.addColorStop(0.3, 'rgba(210,225,245,0.28)'); bg.addColorStop(0.6, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = bg; ctx.fillRect(SXL, y - SBH / 2, SXR - SXL, SBH);
      for (const yy of [y - SBH / 2 - 8, y + SBH / 2 + 8]) { ctx.strokeStyle = 'rgba(4,8,16,0.7)'; hline(ctx, yy, 3, SXL + 6, SXR - 6); ctx.strokeStyle = 'rgba(185,200,225,0.3)'; hline(ctx, yy + 1.6, 1.2, SXL + 6, SXR - 6); }
      stamp(ctx, (c) => { hline(c, y - SBH / 2 - 4, 2, SXL + 8, SXR - 8); hline(c, y + SBH / 2 + 4, 2, SXL + 8, SXR - 8); bandDots(c, y); }, true);
    }
    // Panels between the bands: gilt frame, fleurons and corner tools; the second panel is the title piece.
    for (const p of SPANELS) {
      const { x, y, w: cw, h: ch } = p;
      if (p.title) {
        ctx.fillStyle = 'rgba(70,40,30,0.75)'; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 6); ctx.fill();
        const lg = ctx.createLinearGradient(x, 0, x + cw, 0); lg.addColorStop(0, 'rgba(0,0,0,0.3)'); lg.addColorStop(0.5, 'rgba(255,220,190,0.16)'); lg.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 6); ctx.fill();
        seed = 44; for (let k = 0; k < 1400; k++) { ctx.fillStyle = `rgba(20,8,4,${0.1 + rand() * 0.25})`; ctx.fillRect(x + rand() * cw, y + rand() * ch, 1.5, 1.5); }
        stamp(ctx, (c) => { fillet(c, x, y, cw, ch, 6, 3); fillet(c, x + 10, y + 10, cw - 20, ch - 20, 4, 1.4); }, true);
        continue;
      }
      stamp(ctx, (c) => { fillet(c, x, y, cw, ch, 6, 2.6); }, true);
      stamp(ctx, (c) => { for (const t of p.tools) tool(c, t); }, true);
    }
    stampMX = 1;
  });
  const flatTex = (a, b) => paint(64, 64, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
  const leavesInto = (ctx, w, h, vertical) => {
    seed = 31; ctx.fillStyle = '#dcc89b'; ctx.fillRect(0, 0, w, h);
    const n = vertical ? w : h;
    for (let i = 0; i < n; i += 1) {
      const l = 196 + (rand() * 44) | 0, dark = rand() < 0.07;
      ctx.fillStyle = dark ? 'rgba(95,70,35,0.55)' : `rgb(${l},${l - 18},${l - 58})`;
      if (vertical) ctx.fillRect(i, 0, 1, h); else ctx.fillRect(0, i, w, 1);
    }
    const g = vertical ? ctx.createLinearGradient(0, 0, 0, h) : ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(90,60,25,0.42)'); g.addColorStop(0.18, 'rgba(90,60,25,0)'); g.addColorStop(0.82, 'rgba(90,60,25,0)'); g.addColorStop(1, 'rgba(90,60,25,0.42)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { const x = rand() * w, y = rand() * h, r = 14 + rand() * 40, gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, 'rgba(110,75,30,0.28)'); gg.addColorStop(1, 'rgba(110,75,30,0)'); ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
  };
  const edgeTex = paint(512, 256, (ctx, w, h) => leavesInto(ctx, w, h, false));
  const edgeTexV = paint(256, 512, (ctx, w, h) => leavesInto(ctx, w, h, true));
  const foreTex = paint(512, 512, (ctx, w, h) => {
    leavesInto(ctx, w, h, false);
    SECT.forEach((c, i) => { ctx.fillStyle = c; ctx.globalAlpha = 0.55; ctx.fillRect(i * w / SECT.length + 6, 0, w / SECT.length - 12, h); });
    ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(40,25,10,0.22)'; for (let y = 0; y < h; y += 2) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
    const bow = ctx.createLinearGradient(0, 0, 0, h); bow.addColorStop(0, 'rgba(60,40,15,0.35)'); bow.addColorStop(0.5, 'rgba(255,245,220,0.12)'); bow.addColorStop(1, 'rgba(60,40,15,0.35)'); ctx.fillStyle = bow; ctx.fillRect(0, 0, w, h);
  });
  const glowTex = paint(128, 128, (ctx) => { const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(120,255,200,0.9)'); g.addColorStop(0.35, 'rgba(40,200,150,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); });

  const mat = (opts) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0.05, envMapIntensity: 0.9 }, opts));
  const LN = () => ({ normalMap: leatherNormal, normalScale: new THREE.Vector2(1.15, 1.15), roughnessMap: leatherRough, roughness: 1, envMapIntensity: 0.55 });
  leatherNormal.repeat.set(1.4, 2); leatherRough.repeat.set(1.4, 2);
  const BN = () => ({ normalMap: bronzeNormal, normalScale: new THREE.Vector2(0.8, 0.8), roughnessMap: bronzeRough, roughness: 0.78, envMapIntensity: 1.6 });
  const brassTex = paint(512, 512, (ctx, w, h) => {
    // Base alloy with warm and cool pooling, as cast bronze mottles.
    ctx.fillStyle = '#b89862'; ctx.fillRect(0, 0, w, h); seed = 19;
    for (let i = 0; i < 60; i++) { const x = rand() * w, y = rand() * h, r = 30 + rand() * 110, gg = ctx.createRadialGradient(x, y, 0, x, y, r); const k = rand(); gg.addColorStop(0, k > 0.5 ? 'rgba(225,200,140,0.28)' : 'rgba(110,82,40,0.3)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    // Verdigris in the low spots: green-blue bloom with a chalky core.
    for (let i = 0; i < 22; i++) { const x = rand() * w, y = rand() * h, r = 6 + rand() * 22, gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, 'rgba(120,185,160,0.5)'); gg.addColorStop(0.5, 'rgba(70,135,118,0.3)'); gg.addColorStop(1, 'rgba(40,90,80,0)'); ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    // Pitting: many small dark pits, each with a bright rim toward the light.
    for (let i = 0; i < 420; i++) { const x = rand() * w, y = rand() * h, r = 0.8 + rand() * 2.2; ctx.fillStyle = `rgba(30,20,8,${0.5 + rand() * 0.4})`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(240,215,150,0.35)'; ctx.beginPath(); ctx.arc(x - r * 0.6, y - r * 0.6, r * 0.5, 0, Math.PI * 2); ctx.fill(); }
    // Polished high spots: bright streaks where it has been handled.
    ctx.lineCap = 'round'; for (let i = 0; i < 160; i++) { const x = rand() * w, y = rand() * h, l = 6 + rand() * 40, a = rand() * Math.PI; ctx.strokeStyle = `rgba(250,228,170,${0.1 + rand() * 0.25})`; ctx.lineWidth = 0.8 + rand() * 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
    // Dark grime in a fine web.
    ctx.strokeStyle = 'rgba(25,15,5,0.25)'; ctx.lineWidth = 0.7; for (let i = 0; i < 120; i++) { let x = rand() * w, y = rand() * h; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rand() - 0.5) * 30; y += (rand() - 0.5) * 30; ctx.lineTo(x, y); } ctx.stroke(); }
    // Engraved vine: recess holds grime and verdigris, the cut edge catches light.
    ctx.strokeStyle = 'rgba(30,45,38,0.85)'; ctx.fillStyle = 'rgba(30,45,38,0.85)'; vine(ctx, w, h, 128);
    ctx.save(); ctx.translate(-1.2, -1.2); ctx.strokeStyle = 'rgba(255,236,180,0.5)'; ctx.fillStyle = 'rgba(255,236,180,0.5)'; vine(ctx, w, h, 128); ctx.restore();
  });
  const strapTex = paint(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#4a3326'; ctx.fillRect(0, 0, w, h); seed = 23;
    for (let i = 0; i < 40; i++) { const x = rand() * w, y = rand() * h, r = 15 + rand() * 60, g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rand() > 0.5 ? 'rgba(20,10,4,0.4)' : 'rgba(150,110,75,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    for (let i = 0; i < 5000; i++) { const x = rand() * w, y = rand() * h, r = 1.5 + rand() * 3; ctx.fillStyle = `rgba(165,125,85,${0.05 + rand() * 0.1})`; ctx.beginPath(); ctx.arc(x - 1, y - 1, r * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `rgba(12,6,2,${0.15 + rand() * 0.2})`; ctx.beginPath(); ctx.arc(x + 1, y + 1, r * 0.55, 0, Math.PI * 2); ctx.fill(); }
    // Burnished edges: v = 0 and 0.5 are the two strap edges.
    const eg = ctx.createLinearGradient(0, 0, 0, h); for (const [s, a] of [[0, 0.6], [0.1, 0], [0.4, 0], [0.5, 0.6], [0.6, 0], [0.9, 0], [1, 0.6]]) eg.addColorStop(s, `rgba(10,5,2,${a})`); ctx.fillStyle = eg; ctx.fillRect(0, 0, w, h);
    // Creases where the strap bends over the fore-edge, kept when it hangs open.
    for (const u of [0.24, 0.74]) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(w * u, 0); ctx.lineTo(w * u, h); ctx.stroke(); ctx.strokeStyle = 'rgba(170,130,90,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * u + 4, 0); ctx.lineTo(w * u + 4, h); ctx.stroke(); }
  });
  // Board edge: turned-in leather, fine grain, a burnished crease at each turn and a worn highlight along the middle.
  const sideTex = paint(2048, 256, (ctx, w, h) => {
    seed = 5;
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2f3d55'); g.addColorStop(0.5, '#415270'); g.addColorStop(1, '#2f3d55'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) { const x = rand() * w, y = rand() * h, r = 1.5 + rand() * 3; ctx.fillStyle = `rgba(175,195,220,${0.05 + rand() * 0.1})`; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `rgba(6,10,20,${0.12 + rand() * 0.2})`; ctx.beginPath(); ctx.arc(x + r * 0.3, y + r * 0.3, r * 0.5, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(4,8,16,${0.25 + rand() * 0.35})`; ctx.fillRect(rand() * w, rand() * h, 1, 1); }
    // Scuffs along the direction of handling.
    ctx.lineCap = 'round'; for (let i = 0; i < 700; i++) { const x = rand() * w, y = rand() * h, l = 6 + rand() * 30; ctx.strokeStyle = `rgba(195,208,228,${0.06 + rand() * 0.14})`; ctx.lineWidth = 0.8 + rand(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y + (rand() - 0.5) * 4); ctx.stroke(); }
    // Burnished creases where the leather turns over the board, and a worn band along the middle.
    for (const yy of [10, h - 10]) { ctx.strokeStyle = 'rgba(4,8,16,0.55)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); ctx.strokeStyle = 'rgba(190,205,228,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, yy + (yy < h / 2 ? 4 : -4)); ctx.lineTo(w, yy + (yy < h / 2 ? 4 : -4)); ctx.stroke(); }
    const mid = ctx.createLinearGradient(0, 0, 0, h); mid.addColorStop(0.35, 'rgba(205,215,230,0)'); mid.addColorStop(0.5, 'rgba(205,215,230,0.22)'); mid.addColorStop(0.65, 'rgba(205,215,230,0)'); ctx.fillStyle = mid; ctx.fillRect(0, 0, w, h);
  });
  sideTex.wrapS = THREE.RepeatWrapping; sideTex.wrapT = THREE.ClampToEdgeWrapping;
  // Spine head and tail faces: the board edges' fine dark turned-in leather, drawn at the cap's pixel scale.
  const capTex = paint(1024, 1024, (ctx, w, h) => {
    seed = 9;
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#2f3d55'); g.addColorStop(0.5, '#415270'); g.addColorStop(1, '#2f3d55'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40000; i++) { const x = rand() * w, y = rand() * h, r = 1 + rand() * 2.2; ctx.fillStyle = `rgba(175,195,220,${0.05 + rand() * 0.1})`; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `rgba(6,10,20,${0.12 + rand() * 0.2})`; ctx.beginPath(); ctx.arc(x + r * 0.3, y + r * 0.3, r * 0.5, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 14000; i++) { ctx.fillStyle = `rgba(4,8,16,${0.25 + rand() * 0.35})`; ctx.fillRect(rand() * w, rand() * h, 1, 1); }
    ctx.lineCap = 'round'; for (let i = 0; i < 500; i++) { const x = rand() * w, y = rand() * h, l = 4 + rand() * 20; ctx.strokeStyle = `rgba(195,208,228,${0.06 + rand() * 0.14})`; ctx.lineWidth = 0.8 + rand(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y + (rand() - 0.5) * 3); ctx.stroke(); }
  });
  const sideHeight = heightCanvas(1024, 128, (ctx, w, h) => { ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); seed = 61; for (let i = 0; i < 9000; i++) { const x = rand() * w, y = rand() * h, r = 1.5 + rand() * 3.5, g = ctx.createRadialGradient(x, y, 0, x, y, r); const l = 150 + rand() * 40; g.addColorStop(0, `rgb(${l},${l},${l})`); g.addColorStop(0.7, 'rgb(122,122,122)'); g.addColorStop(1, 'rgba(128,128,128,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); } for (const yy of [8, h - 8]) { ctx.strokeStyle = 'rgb(70,70,70)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); } });
  const sideNormal = heightToNormal(sideHeight, 2.0); sideNormal.wrapS = THREE.RepeatWrapping; sideNormal.wrapT = THREE.ClampToEdgeWrapping;
  const leatherSide = mat({ map: sideTex, normalMap: sideNormal, normalScale: new THREE.Vector2(1.0, 1.0), roughness: 0.92, envMapIntensity: 0.5 });
  const agedTex = brassTex.clone(); agedTex.wrapS = agedTex.wrapT = THREE.RepeatWrapping; agedTex.repeat.set(3, 3); agedTex.needsUpdate = true;
  const gold = new THREE.MeshPhysicalMaterial(Object.assign({ map: agedTex, color: 0xdcc094, metalness: 1.0, clearcoat: 0.25, clearcoatRoughness: 0.35 }, BN()));
  gold.normalMap.repeat.set(3, 3); gold.roughnessMap.repeat.set(3, 3);
  const bone = gold;
  const strap = new THREE.MeshPhysicalMaterial(Object.assign({ map: strapTex, clearcoat: 0.3, clearcoatRoughness: 0.5 }, LN(), { envMapIntensity: 0.7 }));
  const thread = new THREE.MeshPhysicalMaterial({ color: 0xd9c08c, roughness: 0.6, clearcoat: 0.2, clearcoatRoughness: 0.5, envMapIntensity: 0.6 });
  // Strap frame at arc-length fraction t of a sample list: p, tangent T, width W, outward N.
  const strapFrame = (S, t, o) => { const s = t * S[S.length - 1].s; let i = o.i && o.i < S.length && S[o.i - 1].s <= s ? o.i : 1; while (i < S.length - 1 && S[i].s < s) i++; o.i = i; const a = S[i - 1], b = S[i], f = Math.min(1, Math.max(0, (s - a.s) / ((b.s - a.s) || 1))); o.p.lerpVectors(a.p, b.p, f); o.T.lerpVectors(a.T, b.T, f).normalize(); o.W.lerpVectors(a.W, b.W, f).normalize(); o.N.crossVectors(o.T, o.W); return o; };
  const frame = () => ({ p: new THREE.Vector3(), T: new THREE.Vector3(), W: new THREE.Vector3(), N: new THREE.Vector3() });
  // Running stitch: one thread along the strap at yOff that dips under the leather between stitches, so only the dashes show.
  class Stitch extends THREE.Curve {
    constructor(S, yOff, out, stitches, tEnd = 1) { super(); Object.assign(this, { S, yOff, out, stitches, tEnd }); this.F = frame(); }
    getPoint(t, target = new THREE.Vector3()) {
      const F = strapFrame(this.S, t * this.tEnd, this.F), th = t * this.stitches * Math.PI * 2;
      return target.copy(F.p).addScaledVector(F.W, this.yOff).addScaledVector(F.N, this.out + 0.0022 * Math.sin(th));
    }
  }
  const edgeN = heightToNormal(heightCanvas(256, 256, (ctx, w, h) => { ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); seed = 52; for (let y = 0; y < h; y += 1) { const l = 112 + (rand() * 32) | 0; ctx.fillStyle = `rgb(${l},${l},${l})`; ctx.fillRect(0, y, w, 1); } }), 1.4);
  const pageEdge = mat({ map: edgeTexV, roughness: 0.97, envMapIntensity: 0.2, normalMap: edgeN, normalScale: new THREE.Vector2(0.6, 0.6) });
  const pageEdgeH = mat({ map: edgeTex, roughness: 0.97, envMapIntensity: 0.2, normalMap: edgeN, normalScale: new THREE.Vector2(0.6, 0.6) });
  const foreEdge = mat({ map: foreTex, roughness: 0.97, envMapIntensity: 0.2, normalMap: edgeN, normalScale: new THREE.Vector2(0.6, 0.6) });

  // ---------- scene ----------
  const scene = new THREE.Scene();
  const envScene = new THREE.Scene();
  const envTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const ctx = c.getContext('2d'); const g = ctx.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#f6fbf9'); g.addColorStop(0.5, '#cfdcd7'); g.addColorStop(0.62, '#5f6c68'); g.addColorStop(1, '#1d2321'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 256); const sp = ctx.createRadialGradient(150, 70, 4, 150, 70, 70); sp.addColorStop(0, 'rgba(255,245,220,1)'); sp.addColorStop(0.3, 'rgba(255,240,210,0.6)'); sp.addColorStop(1, 'rgba(255,240,210,0)'); ctx.fillStyle = sp; ctx.fillRect(0, 0, 512, 256);
    // Softbox windows: crisp bright rectangles that read as highlights on metal.
    for (const [x, y, w2, h2, a] of [[60, 40, 110, 70, 1], [300, 30, 80, 50, 0.8], [430, 120, 60, 40, 0.6]]) { ctx.fillStyle = `rgba(255,250,240,${a})`; ctx.fillRect(x, y, w2, h2); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + w2 / 2 - 2, y, 4, h2); ctx.fillRect(x, y + h2 / 2 - 2, w2, 4); } const sp2 = ctx.createRadialGradient(400, 110, 4, 400, 110, 60); sp2.addColorStop(0, 'rgba(190,240,225,0.9)'); sp2.addColorStop(1, 'rgba(190,240,225,0)'); ctx.fillStyle = sp2; ctx.fillRect(0, 0, 512, 256); const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding; return t; })();
  const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromEquirectangular(envTex).texture; scene.environment = envMap; pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  scene.add(new THREE.HemisphereLight(0xe6f3ef, 0x3b2a1c, 0.9));
  // Key is a spot light: a point source, so the cast shadow grows as the book lifts and tightens as it settles.
  // Key sits up and slightly left, matching the sheen on the cover; the shadow therefore falls back and to the right.
  // Far and steep (66 deg) so the cast shadow pools under the book at near 1:1 instead of stretching off to the side.
  const key = new THREE.SpotLight(0xffe9c8, 190, 24, Math.PI / 8, 0.5, 1.6); key.position.set(-1.24, 8.54, 3.67); key.target.position.set(0.1, -0.6, -0.2); scene.add(key.target); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0002; key.shadow.normalBias = 0.015;
  key.shadow.camera.near = 4; key.shadow.camera.far = 16; scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ee, 0.45); fill.position.set(3, 1, 3); scene.add(fill);
  const rimLight = new THREE.DirectionalLight(0xbdf5e3, 1.1); rimLight.position.set(1.5, 2, -4); scene.add(rimLight);
  const gemLight = new THREE.PointLight(0x3fe0b0, 6, 2.5, 2); scene.add(gemLight);
  // A soft ground plane just to receive the book's shadow.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.34, color: new THREE.Color(0x0e1a17) }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.9; ground.receiveShadow = true; scene.add(ground);
  // Contact shadow: a soft dark pool directly under the book that reads even where the cast shadow is faint.
  const aoTex = paint(256, 256, (ctx) => { const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128); g.addColorStop(0, 'rgba(10,20,18,0.55)'); g.addColorStop(0.5, 'rgba(10,20,18,0.22)'); g.addColorStop(1, 'rgba(10,20,18,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256); });
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = -0.895; scene.add(contact);
  // Floor = lowest of the boards, the hanging straps and the ribbons' full reach, so whatever hangs lowest touches it.
  const _bb = new THREE.Box3(), _body = new THREE.Box3();
  let BOARDS = [], HANGERS = [];
  function bookFloor() {
    _body.makeEmpty(); for (const o of BOARDS) { _bb.setFromObject(o); _body.union(_bb); }
    let m = _body.min.y; for (const o of HANGERS) { _bb.setFromObject(o); m = Math.min(m, _bb.min.y); }
    for (const r of ribbons) m = Math.min(m, r.P[(RIBPIN - 1) * 3 + 1] - RIBHANG);
    return m;
  }
  let floorRef = null;

  const rig = new THREE.Group(); scene.add(rig);
  const book = new THREE.Group(); rig.add(book);

  // Rounded, beveled slabs read as worn leather boards rather than hard boxes.
  function roundedRect(w, h, r, square) {
    // square: 'left' leaves the two left corners sharp (the spine side of a board), as on a real binding.
    const x = -w / 2, y = -h / 2, sh = new THREE.Shape(), sl = square === 'left';
    sh.moveTo(sl ? x : x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r); sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    if (sl) { sh.lineTo(x, y + h); sh.lineTo(x, y); } else { sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r); sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y); }
    return sh;
  }
  function slab(w, h, d, r, bev, square) {
    const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * bev, h - 2 * bev, Math.max(0.002, r - bev), square), { depth: Math.max(0.001, d - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8 });
    g.translate(0, 0, bev);
    g.computeVertexNormals();
    const pos = g.attributes.position, nrm = g.attributes.normal, uv = g.attributes.uv, perim = 2 * (w + h), dTot = d;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), nz = Math.abs(nrm.getZ(i));
      if (nz > 0.6) { uv.setXY(i, (x + w / 2) / w, (y + h / 2) / h); continue; }
      // Side wall: unwrap by angle around the slab so the texture runs continuously along the edge.
      const ang = Math.atan2(y / h, x / w), t = (ang + Math.PI) / (2 * Math.PI);
      uv.setXY(i, t * perim * 2.2, Math.min(1, Math.max(0, z / dTot)));
    }
    uv.needsUpdate = true; return g;
  }
  // Back cover and page blocks
  const backGeo = slab(CW, CH, CT, 0.075, 0.021, 'left'); backGeo.translate(CW / 2 - 0.012, 0, 0);
  const CN = () => Object.assign(LN(), { normalMap: coverNormal, normalScale: new THREE.Vector2(1.25, 1.25), roughnessMap: coverRough });
  const backCover = new THREE.Mesh(backGeo, [mat(Object.assign({ map: coverBase }, CN())), leatherSide]);
  backCover.castShadow = true; backCover.receiveShadow = true; book.add(backCover);
  // Block per side: fore-edge bulge away from the spine, and the top rolled down into the gutter (the bottom stays glued flat).
  const blockGeometry = (sp) => {
    const g = new THREE.BoxGeometry(W - 0.012, H - 0.012, 1, 64, 1, 6), pos = g.attributes.position, hw = (W - 0.012) / 2;
    for (let i = 0; i < pos.count; i++) { let x = pos.getX(i); const z = pos.getZ(i); if (x * -sp > 0.3) x -= sp * -0.012 * (1 - Math.pow(Math.abs(z) * 2, 2)); else if (x * sp > 0.3) x += sp * 0.006; pos.setX(i, x); pos.setZ(i, z - gutter(hw + x * -sp + 0.006) * (z + 0.5)); }
    g.computeVertexNormals(); return g;
  };
  const blockGeo = blockGeometry(-1), blockGeoL = blockGeometry(1);
  const finisTex = makeFace('finis', false);
  const blockR = new THREE.Mesh(blockGeo, [foreEdge, pageEdge, pageEdgeH, pageEdgeH, new THREE.MeshStandardMaterial({ map: finisTex, roughness: 0.95, normalMap: paperNormal, normalScale: new THREE.Vector2(0.5, 0.5), envMapIntensity: 0.25 }), pageEdge]);
  // Left block's top is always under a flipped sheet or, during the first flip, under nothing: a visible face there
  // paints edge stripes over the inside cover, so it is left invisible.
  const blockL = new THREE.Mesh(blockGeoL, [pageEdge, foreEdge, pageEdgeH, pageEdgeH, new THREE.MeshStandardMaterial({ visible: false }), pageEdge]);
  blockR.castShadow = true; blockR.receiveShadow = true; blockL.castShadow = true; blockL.receiveShadow = true;
  book.add(blockR, blockL);
  BOARDS = [backCover, blockR, blockL];

  // Front cover on a hinge at the spine
  const hinge = new THREE.Group(); book.add(hinge);
  const coverGeo = slab(CW, CH, CT, 0.075, 0.021, 'left'); coverGeo.translate(CW / 2, 0, 0);
  const exTex = makeFace('exlibris', false);
  { const c = coverHeight.getContext('2d'); c.save(); drawRoots(c, (cc, lw) => { cc.strokeStyle = 'rgb(70,70,70)'; cc.lineWidth = lw * 1.8; }); drawRoots(c, (cc, lw) => { cc.strokeStyle = 'rgb(18,18,18)'; cc.lineWidth = lw * 1.05; }); c.restore(); coverNormalF = heightToNormal(coverHeight, 3.4); coverNormalF.wrapS = coverNormalF.wrapT = THREE.ClampToEdgeWrapping; }
  const cover = new THREE.Mesh(coverGeo, [mat(Object.assign({ map: leatherTex(true), emissive: 0x3fe0b0, emissiveMap: rootGlowTex, emissiveIntensity: 0 }, CN(), { normalMap: coverNormalF })), leatherSide]);
  const coverSkin = cover.material[0];
  cover.castShadow = true; cover.receiveShadow = true; hinge.add(cover); BOARDS.push(cover);
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(CW - 0.05, CH - 0.05), new THREE.MeshStandardMaterial({ map: exTex, roughness: 0.94, normalMap: paperNormal, normalScale: new THREE.Vector2(0.7, 0.7), envMapIntensity: 0.3 }));
  inside.receiveShadow = true;
  inside.rotation.y = Math.PI; inside.position.set(CW / 2, 0, -0.0015); hinge.add(inside);
  const deco = new THREE.Group(); deco.position.set(-XE, 0, CT); hinge.add(deco);
  deco.add = ((orig) => function (o) { o.castShadow = true; return orig.call(this, o); })(deco.add);
  // Back cover hardware: the same frame mirrored through the board, so edge rods run on both faces.
  const decoBack = new THREE.Group(); decoBack.scale.z = -1; decoBack.add = deco.add; backCover.add(decoBack);
  let decoTarget = deco;
  const addBox = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); deco.add(b); return b; };
  const rod = (len, x, y, horiz) => {
    // Edge guard: a half-round bronze channel with a beaded lip, seated into the leather (a dark recess under it) and ending in rounded tips.
    const sh = new THREE.Shape(); sh.moveTo(-0.02, -0.003); sh.lineTo(-0.02, 0.002); sh.quadraticCurveTo(-0.02, 0.013, 0, 0.0145); sh.quadraticCurveTo(0.02, 0.013, 0.02, 0.002); sh.lineTo(0.02, -0.003); sh.lineTo(-0.02, -0.003);
    const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 10 }); g.translate(0, 0, -len / 2); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, gold); m.position.set(x, y, 0.004); if (horiz) m.rotation.z = Math.PI / 2; decoTarget.add(m);
    // Recess: a thin dark strip beneath the guard so it reads as set into the board.
    const rc = new THREE.Mesh(new THREE.PlaneGeometry(horiz ? len + 0.012 : 0.052, horiz ? 0.052 : len + 0.012), new THREE.MeshBasicMaterial({ color: 0x0a0e16, transparent: true, opacity: 0.55, depthWrite: false })); rc.position.set(x, y, 0.0015); decoTarget.add(rc);
    for (let k = -2; k <= 2; k++) { const t = k / 2.6 * len / 2; rivet(horiz ? x + t : x, horiz ? y : y + t, 0.0175, 0.0085); }
  };
  // A domed rivet with a shoulder: the detail that sells cast hardware.
  const rivet = (x, y, z, r = 0.011) => { const g = new THREE.Group(); const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold); dome.rotation.x = Math.PI / 2; g.add(dome); const sh = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.25, r * 1.35, r * 0.35, 14), gold); sh.rotation.x = Math.PI / 2; sh.position.z = -r * 0.15; g.add(sh); g.position.set(x, y, z); decoTarget.add(g); return g; };
  // Corner caps: three cast faces (front, edge, back) wrapping the board corner, with a scalloped inner edge.
  const cornerCap = (sy) => {
    const Lg = 0.17, Wd = 0.058, R0 = 0.075;
    const face = new THREE.Shape();
    // Outer edge follows the board's own rounded corner.
    face.moveTo(-Lg, 0); face.lineTo(-R0, 0); face.absarc(-R0, -R0, R0, Math.PI / 2, 0, true); face.lineTo(0, -Lg);
    face.quadraticCurveTo(-Wd * 0.55, -Lg - 0.012, -Wd, -Lg + 0.01);
    for (let k = 0; k < 3; k++) { const t0 = -Lg + 0.01 + k * ((Lg - Wd - 0.02) / 3), t1 = t0 + (Lg - Wd - 0.02) / 3; face.quadraticCurveTo(-Wd - 0.012, (t0 + t1) / 2, -Wd, t1); }
    face.quadraticCurveTo(-Wd, -Wd, -Wd - 0.01, -Wd);
    for (let k = 0; k < 3; k++) { const t0 = -Wd - 0.01 - k * ((Lg - Wd - 0.02) / 3), t1 = t0 - (Lg - Wd - 0.02) / 3; face.quadraticCurveTo((t0 + t1) / 2, -Wd - 0.012, t1, -Wd); }
    face.quadraticCurveTo(-Lg - 0.012, -Wd * 0.55, -Lg, 0);
    const fg = new THREE.ExtrudeGeometry(face, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 5, curveSegments: 10 });
    const front = new THREE.Mesh(fg, gold); front.scale.y = sy; front.position.set(CW - 0.004, sy * (CH / 2 - 0.004), 0.0); deco.add(front);
    const back = new THREE.Mesh(fg, gold); back.scale.set(1, sy, -1); back.position.set(CW - 0.004, sy * (CH / 2 - 0.004), -CT); deco.add(back);
    // A rounded bead that wraps the board's edge thickness, following the cap's outline.
    const beadPath = new THREE.CurvePath();
    beadPath.add(new THREE.LineCurve3(new THREE.Vector3(-Lg, 0, 0), new THREE.Vector3(-R0, 0, 0)));
    beadPath.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-R0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -R0, 0)));
    beadPath.add(new THREE.LineCurve3(new THREE.Vector3(0, -R0, 0), new THREE.Vector3(0, -Lg, 0)));
    const bead = new THREE.Mesh(new THREE.TubeGeometry(beadPath, 24, 0.0085, 8, false), gold); bead.scale.y = sy; bead.position.set(CW - 0.004 + 0.004, sy * (CH / 2 - 0.004 + 0.004), -CT / 2); deco.add(bead);
    rivet(CW - 0.004 - 0.1, sy * (CH / 2 - 0.004 - 0.03), 0.016); rivet(CW - 0.004 - 0.03, sy * (CH / 2 - 0.004 - 0.1), 0.016);
  };
  cornerCap(1); cornerCap(-1);
  // Edge rods start under the spine band's end (x = 0.06) and run to the corner caps; the band carries on round the spine.
  const RODY = CH / 2 - 0.05, RODX0 = 0.06, RODX1 = 0.994;
  for (const g of [deco, decoBack]) { decoTarget = g; rod(RODX1 - RODX0, (RODX0 + RODX1) / 2, RODY, true); rod(RODX1 - RODX0, (RODX0 + RODX1) / 2, -RODY, true); }
  decoTarget = deco; rod(CH * 0.84, CW - 0.065, 0, false);
  // Clasp: a strap riveted to the back cover comes over the fore-edge and lies on the front cover, where its hook drops onto a
  // catch pin. Built in decoBack's frame (z out of the back face; the front face sits at z = -D0 while closed).
  // Centreline is a turtle walk: runs, face bends about the width axis, twists about the tangent. q = 0 fastened, 1 hanging free.
  const D0 = 2 * CT + PT, STRAP_A = 0.0462, STRAP_B = 0.0099, STRAP_K = 12, STRAP_DS = 0.004;
  function strapWalk(ops, p0, T0, W0) {
    const S = [], p = p0.clone(), T = T0.clone(), W = W0.clone(), q = new THREE.Quaternion(); let s = 0;
    const push = () => S.push({ p: p.clone(), T: T.clone(), W: W.clone(), s });
    push();
    for (const op of ops) {
      if (op.run > 0) { const n = Math.max(1, Math.ceil(op.run / STRAP_DS)), d = op.run / n; for (let i = 0; i < n; i++) { p.addScaledVector(T, d); s += d; push(); } }
      else if (op.bend) { const L = Math.abs(op.bend) * op.r, n = Math.max(2, Math.ceil(L / STRAP_DS)), da = op.bend / n; q.setFromAxisAngle(W, da / 2); for (let i = 0; i < n; i++) { T.applyQuaternion(q); p.addScaledVector(T, 2 * op.r * Math.sin(Math.abs(da) / 2)); T.applyQuaternion(q); s += L / n; push(); } }
      else if (op.len > 0) { const n = Math.max(2, Math.ceil(op.len / STRAP_DS)), da = (op.twist || 0) / n, d = op.len / n; for (let i = 0; i < n; i++) { W.applyAxisAngle(T, da); p.addScaledVector(T, d); s += d; push(); } }
    }
    return S;
  }
  // Flat strap skin: an elliptical section (STRAP_A across, STRAP_B thick) swept along the samples; u runs root to hook.
  function strapGeometry(S) {
    const n = S.length, K = STRAP_K, L = S[n - 1].s, pos = new Float32Array(n * (K + 1) * 3), nrm = new Float32Array(n * (K + 1) * 3), uv = new Float32Array(n * (K + 1) * 2), idx = [], N = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const { p, T, W, s } = S[i]; N.crossVectors(T, W);
      for (let j = 0; j <= K; j++) {
        const ph = j / K * Math.PI * 2, c = Math.cos(ph), sn = Math.sin(ph), k = i * (K + 1) + j;
        pos[k * 3] = p.x + W.x * STRAP_A * c + N.x * STRAP_B * sn; pos[k * 3 + 1] = p.y + W.y * STRAP_A * c + N.y * STRAP_B * sn; pos[k * 3 + 2] = p.z + W.z * STRAP_A * c + N.z * STRAP_B * sn;
        const nx = W.x * c / STRAP_A + N.x * sn / STRAP_B, ny = W.y * c / STRAP_A + N.y * sn / STRAP_B, nz = W.z * c / STRAP_A + N.z * sn / STRAP_B, nl = Math.hypot(nx, ny, nz);
        nrm[k * 3] = nx / nl; nrm[k * 3 + 1] = ny / nl; nrm[k * 3 + 2] = nz / nl;
        uv[k * 2] = s / L; uv[k * 2 + 1] = j / K;
        if (i < n - 1 && j < K) { const a = k, b = k + K + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    g.computeBoundingBox(); g.computeBoundingSphere(); return g;
  }
  const clasps = [];
  const clasp = (sy) => {
    const y = sy * 0.36, edgeX = CW - 0.012, RB = 0.018, X0 = edgeX - 0.2, XE2 = edgeX + 0.006;
    const L1 = XE2 - RB - X0, L2F = D0 + 0.024 - 2 * RB, LTOT = 2 * L1 + Math.PI * RB + L2F;
    const strapMesh = new THREE.Mesh(new THREE.BufferGeometry(), strap); decoBack.add(strapMesh); HANGERS.push(strapMesh);
    const seams = [1, -1].map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), thread); decoBack.add(m); return m; });
    // Hook rides the strap's end frame (x along, y across, z out): tongue plate riveted to the strap, a bar, a downturned tip.
    const hookG = new THREE.Group(); hookG.matrixAutoUpdate = false; decoBack.add(hookG);
    const tongue = new THREE.Mesh(slab(0.095, 0.052, 0.009, 0.012, 0.003), gold); tongue.position.set(0.035, 0, 0.008); hookG.add(tongue);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.064, 10), gold); bar.rotation.z = Math.PI / 2; bar.position.set(-0.005, 0, 0.015); hookG.add(bar);
    const tip = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.0055, 8, 12, Math.PI), gold); tip.rotation.y = -Math.PI / 2; tip.position.set(0.082, 0, 0.002); hookG.add(tip);
    decoTarget = hookG; rivet(0.015, 0.016, 0.014, 0.0065); rivet(0.015, -0.016, 0.014, 0.0065);
    hookG.traverse((o) => { o.castShadow = true; });
    // Anchor plate on the back cover under the strap's fixed end.
    decoTarget = decoBack;
    const anchor = new THREE.Mesh(slab(0.062, 0.084, 0.008, 0.014, 0.003), gold); anchor.position.set(X0 - 0.008, y, 0.004); decoBack.add(anchor);
    rivet(X0 + 0.012, y + 0.016, 0.024, 0.0065); rivet(X0 + 0.012, y - 0.016, 0.024, 0.0065);
    // Catch plate with a raised pin on the front cover, where the hook drops.
    decoTarget = deco;
    const plate = new THREE.Mesh(slab(0.062, 0.084, 0.008, 0.014, 0.003), gold); plate.position.set(edgeX - 0.3, y, 0.004); deco.add(plate);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0085, 0.02, 10), gold); pin.rotation.x = Math.PI / 2; pin.position.set(edgeX - 0.283, y, 0.014); deco.add(pin);
    rivet(edgeX - 0.322, y + 0.027, 0.011, 0.0075); rivet(edgeX - 0.322, y - 0.027, 0.011, 0.0075);
    const F = frame(); let key = '';
    // Released, the strap is a weighted hinge about the fore-edge: psi = 0 points at the reader, pi/2 straight out, 3pi/2
    // folded flat on the back cover (hard stop). The crease's set drives it back; real gravity adds a bias as the rig tilts.
    const PSI_MAX = 1.5 * Math.PI, KSET = 55, GRAVS = 30, LF = 0.55, GL = new THREE.Vector3(), _inv = new THREE.Matrix4();
    let psi = 0, psiV = 0, live = false, lastQ = 0, hold = PSI_MAX;
    const hinge = (dt) => {
      const h = Math.min(dt, 1 / 30);
      GL.set(0, -1, 0).transformDirection(_inv.copy(decoBack.matrixWorld).invert());
      const acc = KSET * Math.sin((PSI_MAX - psi) / PSI_MAX * Math.PI / 2) + GRAVS / LF * (GL.x * Math.cos(psi) + GL.z * Math.sin(psi));
      psiV = (psiV + acc * h) * (1 - 1.6 * h); psi += psiV * h;
      if (psi > PSI_MAX) { psi = PSI_MAX; if (psiV > 0) psiV = -psiV * 0.3; }
      if (psi < 0) { psi = 0; if (psiV < 0) psiV = 0; }
    };
    const update = (q, dt) => {
      // q < 0.3: the bend at the front face unfolds (hook pops off the pin, strap flicks out straight). Above: opening runs
      // the hinge; closing sweeps the strap back over the fore-edge from wherever it rests, then the hook seats.
      let L2 = L2F, TH = Math.PI / 2 * (1 - smooth(q / 0.3)), B1 = Math.PI / 2, R1 = RB;
      if (q >= 0.3) {
        if (q < lastQ) { if (live) { hold = psi; live = false; } psi = hold * smooth((q - 0.3) / 0.7); }
        else { if (!live) { live = true; psiV = 0; } hinge(dt); }
        B1 = Math.PI / 2 - psi; R1 = RB + (0.015 - RB) * smooth((psi - Math.PI) / (Math.PI / 2)); L2 = 0;
      } else live = false;
      lastQ = q;
      const k = [L2.toFixed(3), TH.toFixed(2), B1.toFixed(2), R1.toFixed(3)].join('/'); if (k === key) return; key = k;
      const ops = [{ run: L1 }, { bend: B1, r: R1 }, { run: L2 }, { bend: TH, r: RB }];
      ops.push({ run: LTOT - (L1 + Math.abs(B1) * R1 + L2 + Math.abs(TH) * RB) });
      const S = strapWalk(ops, new THREE.Vector3(X0, y, 0.012), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
      strapMesh.geometry.dispose(); strapMesh.geometry = strapGeometry(S);
      seams.forEach((m, i) => { m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new Stitch(S, (i ? -1 : 1) * 0.031, 0.0073, 34, 1 - 0.017 / LTOT), 320, 0.0009, 5, false); });
      strapFrame(S, 1, F); hookG.matrix.makeBasis(F.T, F.W, F.N).setPosition(F.p);
    };
    update(0, 0); clasps.push({ update });
  };
  clasp(1); clasp(-1);
  const ring = new THREE.Shape(); ring.moveTo(0, 0.2); ring.lineTo(0.135, 0); ring.lineTo(0, -0.2); ring.lineTo(-0.135, 0); ring.lineTo(0, 0.2);
  const hole = new THREE.Path(); hole.moveTo(0, 0.15); hole.lineTo(-0.095, 0); hole.lineTo(0, -0.15); hole.lineTo(0.095, 0); hole.lineTo(0, 0.15); ring.holes.push(hole);
  const ringMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 3 }), gold);
  const gemX = CW / 2 - 0.012, gemY = 0; ringMesh.position.set(gemX, gemY, 0); deco.add(ringMesh);
  const gemMat = new THREE.MeshPhysicalMaterial({ flatShading: true, color: 0x1d9c74, emissive: 0x03301f, emissiveIntensity: 0.35, roughness: 0.04, metalness: 0, transmission: 0.35, thickness: 0.08, ior: 1.58, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.3, transparent: true, opacity: 1 });
  // Table-cut lozenge: four identical sloping faces meeting at a ridge, on a diamond base.
  // Lozenge brilliant: a ring of 8 girdle points (lozenge outline), an 8-point crown ring, a flat table, and a pavilion
  // that closes to a culet below the girdle. Every face is a flat triangle, so each one catches light separately.
  const gemGeo = (() => {
    const g = new THREE.BufferGeometry(), hw = 0.082, hh = 0.126;
    const ring = (sx, sy, z) => { const r = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const c = Math.cos(a), sn = Math.sin(a); const k = Math.abs(c) + Math.abs(sn) || 1; r.push([hw * sx * c / k, hh * sy * sn / k, z]); } return r; };
    const girdle = ring(1, 1, 0.02), crown = ring(0.62, 0.62, 0.052), table = ring(0.3, 0.3, 0.066), culet = [[0, 0, -0.03]];
    const P = [...girdle, ...crown, ...table, ...culet], G = 0, C = 8, T = 16, K = 24, tri = [];
    for (let i = 0; i < 8; i++) { const j = (i + 1) % 8;
      tri.push([G + i, G + j, C + i]); tri.push([G + j, C + j, C + i]);          // girdle -> crown break facets
      tri.push([C + i, C + j, T + i]); tri.push([C + j, T + j, T + i]);          // crown -> table star facets
      tri.push([G + j, G + i, K]);                                                 // pavilion mains to the culet
    }
    tri.push([T, T + 1, T + 2], [T, T + 2, T + 3], [T, T + 3, T + 4], [T, T + 4, T + 5], [T, T + 5, T + 6], [T, T + 6, T + 7]); // the table
    const v = []; for (const [a, b, c] of tri) for (const i of [a, b, c]) v.push(...P[i]);
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  })();
  const gem = new THREE.Mesh(gemGeo, gemMat); gem.position.set(gemX, gemY, 0.012); deco.add(gem);
  // Bezel: a lozenge collar hugging the girdle (same 8-point outline), with a rolled lip and four small prongs.
  const bezelShape = (() => { const sh = new THREE.Shape(), pts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), k = Math.abs(c) + Math.abs(sn) || 1; pts.push([0.102 * c / k, 0.152 * sn / k]); } sh.moveTo(...pts[0]); pts.slice(1).forEach((q) => sh.lineTo(...q)); sh.closePath(); const hole = new THREE.Path(); const ip = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), k = Math.abs(c) + Math.abs(sn) || 1; ip.push([0.08 * c / k, 0.123 * sn / k]); } hole.moveTo(...ip[0]); ip.slice(1).forEach((q) => hole.lineTo(...q)); hole.closePath(); sh.holes.push(hole); return sh; })();
  const bezel = new THREE.Mesh(new THREE.ExtrudeGeometry(bezelShape, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 4, curveSegments: 4 }), gold); bezel.position.set(gemX, gemY, 0.004); deco.add(bezel);
  for (const [px, py] of [[0, 0.142], [0.093, 0], [0, -0.142], [-0.093, 0]]) { const prong = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), gold); prong.scale.z = 0.7; prong.position.set(gemX + px, gemY + py, 0.03); deco.add(prong); }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.set(0.34, 0.34, 1); glow.position.set(gemX, gemY, -0.002); deco.add(glow);

  // ---------- spine ----------
  // One covering surface: a flange on each cover face, the rounded back between, bands and headcaps as ridges of it.
  const spine = new THREE.Group(); book.add(spine);
  // Shell uv spans 0.54 units in u but 1.11 in v; three's derivative tangent frame scales the v tilt by that ratio, so y is boosted to match the cover's 1.25.
  const spineLeather = mat(Object.assign({ map: spineTex, side: THREE.DoubleSide }, LN(), { normalMap: spineNormal, normalScale: new THREE.Vector2(1.25, 1.25 * CH / SL), roughnessMap: spineRough }));
  const capLeather = mat({ map: capTex, side: THREE.DoubleSide, normalMap: leatherNormal, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.92, envMapIntensity: 0.5 });
  // Indexed grid; fill(fn) sets positions (and uv when fn returns five values) from fn(u, v), then recomputes normals.
  function grid(nu, nv) {
    const g = new THREE.BufferGeometry(), n = (nu + 1) * (nv + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i; uv[k * 2] = i / nu; uv[k * 2 + 1] = j / nv; }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, c = a + nu + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    g.fill = (fn) => {
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i, p = fn(i / nu, j / nv); pos[k * 3] = p[0]; pos[k * 3 + 1] = p[1]; pos[k * 3 + 2] = p[2]; if (p.length > 3) { uv[k * 2] = p[3]; uv[k * 2 + 1] = p[4]; } }
      g.attributes.position.needsUpdate = true; g.attributes.uv.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
    };
    return g;
  }
  // Covering profile in the x–z plane: front flange, half-ellipse back, rear flange; flanges keep a fixed map share (UF).
  function profile(zT, zB, frontF) {
    const zc = (zT + zB) / 2, b = (zT - zB) / 2, pts = [[XE + SF * frontF, zT], [XE, zT]];
    for (let k = 1; k < 64; k++) { const t = k / 64 * Math.PI; pts.push([XE - SA * Math.sin(t), zc + b * Math.cos(t)]); }
    pts.push([XE, zB], [XE + SF, zB]);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1], lf = cum[1], la = cum[cum.length - 2];
    const sOf = (u) => u < UF ? u / UF * lf : u > 1 - UF ? la + (u - 1 + UF) / UF * (L - la) : lf + (u - UF) / (1 - 2 * UF) * (la - lf);
    const at = (u) => {
      const sv = sOf(u); let i = 1; while (i < cum.length - 1 && cum[i] < sv) i++;
      const [x0, z0] = pts[i - 1], [x1, z1] = pts[i], seg = cum[i] - cum[i - 1] || 1, t = (sv - cum[i - 1]) / seg, tx = (x1 - x0) / seg, tz = (z1 - z0) / seg;
      return { x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, nx: tz, nz: -tx };
    };
    const atS = (sv) => { if (sv >= 0 && sv <= L) return at(lf > 0 && sv < lf ? sv / lf * UF : sv > la ? 1 - UF + (sv - la) / (L - la) * UF : UF + (sv - lf) / (la - lf) * (1 - 2 * UF)); const q = at(sv < 0 ? 0 : 1), d = sv < 0 ? sv : sv - L; return { x: q.x - q.nz * d, z: q.z + q.nx * d, nx: q.nx, nz: q.nz }; };
    return { at, atS, zc, b, L };
  }
  const BANDV = [0.18, 0.4, 0.6, 0.82].map((f) => 1 - f), BH = 0.012, HC = 0.008, EPS_S = 0.0006;
  // Ridges: raised bands and head/tail caps, dying out over the shoulder before the flange.
  const ridge = (u, v) => {
    const y = v * CH, d = Math.min(y, CH - y); let r = 0;
    for (const bv of BANDV) { const dd = Math.abs(v - bv) * CH; if (dd < 0.034) r += BH * (0.5 + 0.5 * Math.cos(Math.PI * dd / 0.034)); }
    if (d < 0.03) r += HC * (1 - smooth(d / 0.03)) * (0.6 + 0.4 * Math.sin(Math.min(1, d / 0.01) * Math.PI / 2));
    return r * smooth((u - UF) / 0.07) * smooth((1 - UF - u) / 0.07);
  };
  const shellGeo = grid(96, 180);
  const shell = new THREE.Mesh(shellGeo, spineLeather); shell.castShadow = true; shell.receiveShadow = true; spine.add(shell);
  const capGeos = [1, -1].map((sy) => { const g = grid(64, 1); const m = new THREE.Mesh(g, capLeather); m.castShadow = true; spine.add(m); return { g, sy }; });
  // Head and tail bands: the edge rods' flat gilt profile swept from one cover face round the spine to the other.
  const COLY = CH / 2 - 0.05, COLEXT = 0.05;
  const bandCS = (() => {
    const pts = [[-0.02, 0.001], [0.02, 0.001], [0.02, 0.007]];
    for (let i = 1; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push([0.016 + 0.004 * Math.cos(a), 0.007 + 0.004 * Math.sin(a)]); }
    for (let i = 1; i <= 6; i++) { const a = Math.PI / 2 + i / 6 * Math.PI / 2; pts.push([-0.016 + 0.004 * Math.cos(a), 0.007 + 0.004 * Math.sin(a)]); }
    pts.push([-0.02, 0.001]);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1];
    return { L, at: (v) => { const sv = v * L; let i = 1; while (i < cum.length - 1 && cum[i] < sv) i++; const t = (sv - cum[i - 1]) / (cum[i] - cum[i - 1]); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; } };
  })();
  const recessMat = new THREE.MeshBasicMaterial({ color: 0x0a0e16, transparent: true, opacity: 0.55, depthWrite: false });
  // The band's share on the front cover lives in the cover's frame, so it swings with the board instead of poking out of the joint.
  const bandOnCover = (sy) => {
    const sh = new THREE.Shape(); for (let i = 0; i <= 40; i++) { const [cx, cy] = bandCS.at(i / 40); i ? sh.lineTo(cy, cx) : sh.moveTo(cy, cx); } sh.closePath();
    const len = SF + COLEXT + 0.004, g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); g.rotateY(-Math.PI / 2); g.translate(XE - 0.004 + len, sy * COLY, 0.0012);
    deco.add(new THREE.Mesh(g, gold));
    const rc = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.052), recessMat); rc.position.set(XE - 0.004 + len / 2, sy * COLY, 0.0015); deco.add(rc);
  };
  bandOnCover(1); bandOnCover(-1);
  const collars = [1, -1].map((sy) => { const g = grid(120, 24); const m = new THREE.Mesh(g, gold); m.castShadow = true; spine.add(m); const rg = grid(120, 1); spine.add(new THREE.Mesh(rg, recessMat)); return { g, rg, sy }; });
  // Wide spine: title set across in two lines, mirrored in x because u runs from the front cover toward the back.
  const spineTitle = paint(512, 272, (ctx, w, h) => { ctx.clearRect(0, 0, w, h); ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = font(96, 700, HEAD); spaced(ctx, 8);
    const words = data.name.toUpperCase().split(' '), longest = words.reduce((a, b) => (b.length > a.length ? b : a), '');
    fitFont(ctx, longest, 440, 96, HEAD);
    for (const [t, y] of [[words[0], h / 2 - 46], [words.slice(1).join(' '), h / 2 + 46]]) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(t, w / 2 + 2, y + 3); ctx.fillStyle = '#caa75a'; ctx.fillText(t, w / 2, y); ctx.fillStyle = 'rgba(255,242,205,0.5)'; ctx.fillText(t, w / 2 - 1, y - 1); }
    ctx.restore(); });
  // Title piece: a patch of the same surface over the second panel, just proud of the leather.
  const LU0 = UF + (1 - 2 * UF) * 0.12, LU1 = 1 - LU0, LV0 = 1 - SCOMPS[1][1] / SH, LV1 = 1 - SCOMPS[1][0] / SH;
  const labelGeo = grid(40, 8);
  const spineLabel = new THREE.Mesh(labelGeo, new THREE.MeshStandardMaterial({ map: spineTitle, transparent: true, roughness: 0.6, metalness: 0.5, envMapIntensity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
  spine.add(spineLabel);
  let spineKey = '';
  // Rebuild the covering for the live block depth; the front flange shortens as the cover swings away.
  function updateSpine(zT, zB, co) {
    const key = zT.toFixed(4) + '/' + zB.toFixed(4) + '/' + co.toFixed(3); if (key === spineKey) return; spineKey = key;
    const pr = profile(zT, zB, 1 - co), P = pr.at;
    const on = (u, v, lift) => { const p = P(u), r = EPS_S + ridge(u, v) + lift; return [p.x + p.nx * r, -CH / 2 + v * CH, p.z + p.nz * r]; };
    shellGeo.fill((u, v) => on(u, v, 0));
    labelGeo.fill((u, v) => on(LU0 + u * (LU1 - LU0), LV0 + v * (LV1 - LV0), 0.0012));
    for (const { g, sy } of capGeos) g.fill((u, v) => {
      if (v < 0.5) return [XE, sy * CH / 2, pr.zc, 0.2 + SA * 0.944, 0.3 + pr.b * 0.944];
      const pu = sy > 0 ? 1 - UF - u * (1 - 2 * UF) : UF + u * (1 - 2 * UF), q = on(pu, sy > 0 ? 1 : 0, 0);
      return [q[0], sy * CH / 2, q[2], 0.2 + (q[0] - XE + SA) * 0.944, 0.3 + (q[2] - pr.zc + pr.b) * 0.944];
    });
    const s0 = 0, s1 = pr.L + COLEXT;
    for (const { g, rg, sy } of collars) {
      // Ends taper to a point over 8 mm so the sweep is closed: no hollow profile shows at the shoulder once the cover swings away.
      g.fill((u, v) => { const sv = s0 + u * (s1 - s0), p = pr.atS(sv), [cx, cy] = bandCS.at(v), k = smooth(Math.min(sv - s0, s1 - sv) / 0.008), r = EPS_S + cy * k; return [p.x + p.nx * r, sy * COLY - cx * k, p.z + p.nz * r, sv, v * bandCS.L]; });
      rg.fill((u, v) => { const sv = s0 + u * (s1 - s0), p = pr.atS(sv), r = EPS_S + 0.0003; return [p.x + p.nx * r, sy * COLY + (v - 0.5) * 0.052, p.z + p.nz * r]; });
    }
  }

  // ---------- sheets ----------
  const SHEETS = [['contents', 'about'], ['bezl', 'bezlNotes'], ['kbui', 'kbuiNotes'], ['studies', 'studyNotes'], ['contact', 'colophon']];
  const N = SHEETS.length;
  SHEETS.forEach(([f, b]) => { PARTNER[f] = b; PARTNER[b] = f; });
  // A chapter starts at a sheet and owns every sheet up to the next chapter; its ribbon is tucked at its first sheet.
  const CHAPTERS = [{ label: 'Contents', color: SECT[0], sheet: 0 }, { label: 'Bezl', color: SECT[1], sheet: 1 }, { label: 'kbui', color: SECT[2], sheet: 2 }, { label: 'Studies', color: SECT[4], sheet: 3 }, { label: 'Contact', color: '#e6d9b8', sheet: 4 }];
  const chapterOf = (st) => { let c = 0; for (let i = 0; i < CHAPTERS.length; i++) if (st - 1 >= CHAPTERS[i].sheet) c = i; return st === 0 ? -1 : c; };
  const tabTex = (labelText, color, flip) => paint(160, 256, (ctx, w, h) => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, w, h); seed = 11 + labelText.length;
    for (let i = 0; i < 14; i++) { const x = rand() * w, y = rand() * h, r = 10 + rand() * 40, gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rand() > 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(255,230,190,0.1)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    speckle(ctx, w, h, 500, '#000', 0.35);
    const eg = ctx.createLinearGradient(w, 0, w - 40, 0); eg.addColorStop(0, 'rgba(0,0,0,0.45)'); eg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = eg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(225,200,150,0.55)'; ctx.setLineDash([7, 6]); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(40, 14); ctx.lineTo(w - 24, 14); ctx.quadraticCurveTo(w - 12, 14, w - 12, 30); ctx.lineTo(w - 12, h - 30); ctx.quadraticCurveTo(w - 12, h - 14, w - 24, h - 14); ctx.lineTo(40, h - 14); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.translate(w * 0.6, h / 2); ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.font = font(30, 700, HEAD); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; spaced(ctx, 2); ctx.fillText(labelText.toUpperCase(), 1, 2);
    ctx.fillStyle = '#f0d590'; ctx.fillText(labelText.toUpperCase(), 0, 0); ctx.restore();
    ctx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 50; i++) { ctx.fillStyle = `rgba(0,0,0,${rand() * 0.35})`; ctx.fillRect(w * 0.45 + rand() * w * 0.3, rand() * h, 2, 2); }
    ctx.globalCompositeOperation = 'source-over';
  });
  const flipTex = (t) => { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; return t; };
  // Brocade ribbon bookmarks: one per chapter, tucked under its page, tail hanging below the book.
  const RIBW = 0.1, RIBL = 0.4, RIBSEG = 24, RIBWS = 6, RIBNP = RIBSEG + 1, RIBLS = RIBL / RIBSEG, RIBPIN = 3, RIBR = 0.0045, RIBHANG = (RIBNP - RIBPIN) * RIBLS;
  // Rows run root (y = 0.04, inside the page) to tip; one sim particle per row, the top RIBPIN rows ride the page.
  const ribbonGeo = new THREE.PlaneGeometry(RIBW, RIBL, RIBWS, RIBSEG); ribbonGeo.translate(0, -RIBL / 2 + 0.04, 0);
  const pointTip = (ctx, w, h) => { ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.moveTo(0, h - 120); ctx.lineTo(w / 2, h); ctx.lineTo(0, h); ctx.fill(); ctx.beginPath(); ctx.moveTo(w, h - 120); ctx.lineTo(w / 2, h); ctx.lineTo(w, h); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; };
  // Face: gold satin ground, gold floats, the chapter colour in the small flowers, the piping, the binding and the lettering.
  const ribbonTex = (color, labelText) => paint(RTW, RTH, (ctx, w, h) => {
    // Shot ground: gold warp over a weft in the chapter colour, so the field already belongs to its band.
    const ground = '#' + new THREE.Color('#d6b45e').lerp(new THREE.Color(color), 0.34).getHexString();
    brocade(ctx, w, h, (c, k) => { c.fillStyle = c.strokeStyle = k === 'ground' ? ground : k === 'gold' ? '#f3d47c' : color; return true; });
    // Woven edge: a fine dark thread outlines every float so gold reads on gold.
    ctx.outline = true; brocade(ctx, w, h, (c, k) => { if (k !== 'gold') return false; c.fillStyle = 'rgba(0,0,0,0)'; c.strokeStyle = 'rgba(100,66,14,0.55)'; c.lineWidth = 2; return true; }); ctx.outline = false;
    weave(ctx, w, h, 0.11, 0.06, 7);
    seed = 9 + labelText.length; for (let i = 0; i < 10; i++) { const x = rand() * w, y = rand() * h, r = 40 + rand() * 100, gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, 'rgba(90,60,10,0.07)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(9, 0, 2, h); ctx.fillRect(w - 11, 0, 2, h);
    // Name band: a plain satin panel in the chapter colour, gold-bordered, so the lettering sits on a quiet field, not on the brocade.
    const text = labelText.toUpperCase(); ctx.font = font(112, 700, HEAD); spaced(ctx, 9); const tl = Math.max(...CHAPTERS.map((c) => ctx.measureText(c.label.toUpperCase()).width)), y0 = 400, y1 = y0 + tl + 76;
    ctx.fillStyle = color; ctx.fillRect(14, y0, w - 28, y1 - y0); ctx.save(); ctx.beginPath(); ctx.rect(14, y0, w - 28, y1 - y0); ctx.clip(); weave(ctx, w, h, 0.12, 0.06, 4); ctx.restore();
    ctx.strokeStyle = '#f3d47c'; ctx.lineWidth = 4; ctx.strokeRect(16, y0 + 2, w - 32, y1 - y0 - 4); ctx.strokeStyle = 'rgba(100,66,14,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(24, y0 + 10, w - 48, y1 - y0 - 20);
    // Embroidered label, read top to bottom along the band: pale gold thread with a dark outline.
    ctx.save(); ctx.translate(w / 2, (y0 + y1) / 2); ctx.rotate(Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const light = new THREE.Color(color).getHSL({}).l > 0.6;
    ctx.strokeStyle = light ? 'rgba(255,248,230,0.85)' : 'rgba(28,16,6,0.9)'; ctx.lineWidth = 12; ctx.strokeText(text, 0, 0);
    ctx.fillStyle = light ? '#5a4320' : '#f8e6ae'; ctx.fillText(text, 0, 0); ctx.restore(); spaced(ctx, 0);
    // Bound point: a band of the chapter colour whipped with gold cord, then the tip cut to a point.
    ctx.fillStyle = color; ctx.fillRect(0, h - 160, w, 40); ctx.strokeStyle = '#e2c268'; ctx.lineWidth = 3; for (let y = h - 156; y < h - 122; y += 7) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    pointTip(ctx, w, h);
  });
  // Reverse: plain satin, labelled so a ribbon is still readable once its page is turned past.
  const ribbonBackTex = (color, labelText) => paint(RTW, RTH, (ctx, w, h) => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, w, h); weave(ctx, w, h, 0.13, 0.07, 8); ctx.fillStyle = '#c8a44e'; ctx.fillRect(0, 0, 7, h); ctx.fillRect(w - 7, 0, 7, h);
    const text = labelText.toUpperCase(); ctx.font = font(112, 700, HEAD); spaced(ctx, 9);
    const tl = Math.max(...CHAPTERS.map((c) => ctx.measureText(c.label.toUpperCase()).width)), y0 = 400, y1 = y0 + tl + 76;
    // Seen from behind the map is mirrored, so the label is pre-mirrored to read the right way round.
    ctx.save(); ctx.translate(w / 2, (y0 + y1) / 2); ctx.scale(-1, 1); ctx.rotate(Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const light = new THREE.Color(color).getHSL({}).l > 0.6;
    ctx.strokeStyle = light ? 'rgba(255,248,230,0.7)' : 'rgba(10,6,2,0.55)'; ctx.lineWidth = 10; ctx.strokeText(text, 0, 0);
    ctx.fillStyle = light ? '#3d2c14' : '#ffffff'; ctx.fillText(text, 0, 0); ctx.restore(); spaced(ctx, 0);
    pointTip(ctx, w, h);
  });
  // Face is metallic thread (GGX from the key light); the reverse is silk with a sheen lobe (r128 swaps it in for the direct specular).
  const brocadeMat = (map) => new THREE.MeshPhysicalMaterial({ map, roughness: 1, roughnessMap: silkRough, metalness: 1, metalnessMap: silkRough, normalMap: silkNormal, normalScale: new THREE.Vector2(0.9, 0.9), side: THREE.FrontSide, alphaTest: 0.5, envMapIntensity: 1.3 });
  const satinMat = (map, sheen) => { const m = new THREE.MeshPhysicalMaterial({ map, roughness: 0.6, metalness: 0, normalMap: silkNormal, normalScale: new THREE.Vector2(0.6, -0.6), side: THREE.BackSide, alphaTest: 0.5, envMapIntensity: 0.3 }); m.sheen = sheen; return m; };
  const TABW = 0.085, TABH = 0.19, TUCK = 0.035;
  function tabGeometry() {
    const sh = new THREE.Shape(), r = 0.03, x0 = -TUCK, x1 = TABW, y0 = -TABH / 2, y1 = TABH / 2;
    sh.moveTo(x0, y0); sh.lineTo(x1 - r, y0); sh.quadraticCurveTo(x1, y0, x1, y0 + r); sh.lineTo(x1, y1 - r); sh.quadraticCurveTo(x1, y1, x1 - r, y1); sh.lineTo(x0, y1); sh.lineTo(x0, y0);
    const g = new THREE.ShapeGeometry(sh, 8), pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - x0) / (x1 - x0), (pos.getY(i) - y0) / (y1 - y0));
    uv.needsUpdate = true; return g;
  }
  const sheets = [];
  const pickables = [];
  SHEETS.forEach(([front, back], i) => {
    const geo = new THREE.PlaneGeometry(W, H, SEG, 1); geo.translate(W / 2, 0, 0);
    const pos = geo.attributes.position, base = Float32Array.from(pos.array);
    const fm = new THREE.MeshStandardMaterial({ map: makeFace(front, false), roughness: 0.95, side: THREE.FrontSide, alphaTest: 0.5, normalMap: paperNormal, normalScale: new THREE.Vector2(0.8, 0.8), envMapIntensity: 0.25 });
    const bm = new THREE.MeshStandardMaterial({ map: makeFace(back, true), roughness: 0.95, side: THREE.BackSide, alphaTest: 0.5, normalMap: paperNormal, normalScale: new THREE.Vector2(0.8, -0.8), envMapIntensity: 0.25 });
    const fMesh = new THREE.Mesh(geo, fm), bMesh = new THREE.Mesh(geo, bm);
    fMesh.castShadow = true; fMesh.receiveShadow = true; bMesh.receiveShadow = true;
    book.add(fMesh, bMesh);
    const s = { i, geo, pos, base, t: 0, target: 0, pending: null, startAt: 0, dir: 1 };
    sheets.push(s);
    pickables.push({ mesh: fMesh, face: front, flip: false }, { mesh: bMesh, face: back, flip: true });
  });
  const ribbons = CHAPTERS.map((ch, i) => {
    const rgeo = ribbonGeo.clone(); rgeo.computeBoundingBox();
    const sheen = new THREE.Color(ch.color).lerp(new THREE.Color(0xfff2d8), 0.5).multiplyScalar(0.6);
    const front = new THREE.Mesh(rgeo, brocadeMat(ribbonTex(ch.color, ch.label))), back = new THREE.Mesh(rgeo, satinMat(ribbonBackTex(ch.color, ch.label), sheen));
    front.receiveShadow = back.receiveShadow = true; front.castShadow = true;
    const group = new THREE.Group(); group.add(front, back); book.add(group);
    pickables.push({ mesh: front, tab: i, label: ch.label }, { mesh: back, tab: i, label: ch.label });
    return { i, ch, group, rgeo, ribX: 0.1 + i * 0.155, P: new Float32Array(RIBNP * 3), Pp: new Float32Array(RIBNP * 3), S: new Float32Array(RIBNP * 3), tw: new Float32Array(RIBNP), twp: new Float32Array(RIBNP), hover: 0, init: false, phase: i * 1.7 };
  });
  pickables.push({ mesh: cover, cover: true }, { mesh: blockR, face: 'finis', flip: false, block: true });
  const coverState = { t: 0, target: 0, pending: null, startAt: 0 }, claspState = { t: 0, target: 0, pending: null, startAt: 0, dur: 0.65 };

  const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const EPS = 0.004, CURL = 1.45, DUR = 0.95;
  function shape(s, leftT, rightT) {
    const pe = ease(s.t), gd = (1 - pe) * rightT + pe * leftT;
    const k = -s.dir * CURL * Math.sin(Math.PI * pe) / W;
    const a = Math.PI * pe - k * W / 2;
    const z0 = (rightT - PT + (N - s.i) * EPS) * (1 - pe) + (leftT - PT + (s.i + 1) * EPS) * pe;
    const arr = s.pos.array, b = s.base, sa = Math.sin(a), ca = Math.cos(a);
    for (let v = 0; v < arr.length; v += 3) {
      const x0 = b[v]; let x, z;
      if (Math.abs(k) < 1e-4) { x = x0 * ca; z = x0 * sa; } else { x = (Math.sin(a + k * x0) - sa) / k; z = (ca - Math.cos(a + k * x0)) / k; }
      arr[v] = x; arr[v + 1] = b[v + 1]; arr[v + 2] = z + z0 - gutter(x0) * gd;
    }
    s.pos.needsUpdate = true; s.geo.computeVertexNormals(); s.geo.computeBoundingSphere();
    s.edge = { a, k, sa, ca, z0 };
  }

  // Ribbons ride their chapter's first sheet. Closed: they poke out of the fore-edge of the block.
  // Each tail is a Verlet strand simulated in world space: gravity stays down when the book tilts, and the book's own motion drags the cloth.
  const GRAV = 11, WIND = reduce ? 0 : 1;
  const _m = new THREE.Matrix4(), _mi = new THREE.Matrix4(), _v = new THREE.Vector3(), _T = new THREE.Vector3(), _S = new THREE.Vector3(), _Nn = new THREE.Vector3();
  // Inextensible links swept root-to-tip then tip-to-root so a hanging chain settles fast; a stiff second-neighbour link keeps brocade from folding sharp.
  function relax(P, Pp, iters, floorY) {
    for (let it = 0; it < iters; it++) {
      for (let n = 1; n < RIBNP; n++) {
        const k = it & 1 ? RIBNP - n : n, a = (k - 1) * 3, b = k * 3, dx = P[b] - P[a], dy = P[b + 1] - P[a + 1], dz = P[b + 2] - P[a + 2], d = Math.hypot(dx, dy, dz);
        if (d < 1e-9) continue; const c = (d - RIBLS) / d;
        if (k - 1 < RIBPIN) { P[b] -= dx * c; P[b + 1] -= dy * c; P[b + 2] -= dz * c; }
        else { P[a] += dx * c * 0.5; P[a + 1] += dy * c * 0.5; P[a + 2] += dz * c * 0.5; P[b] -= dx * c * 0.5; P[b + 1] -= dy * c * 0.5; P[b + 2] -= dz * c * 0.5; }
      }
      for (let k = 2; k < RIBNP; k++) {
        const a = (k - 2) * 3, b = k * 3, dx = P[b] - P[a], dy = P[b + 1] - P[a + 1], dz = P[b + 2] - P[a + 2], d = Math.hypot(dx, dy, dz), rest = 2 * RIBLS;
        if (d >= rest || d < 1e-9) continue; const c = (d - rest) / d * 0.45;
        if (k - 2 < RIBPIN) { P[b] -= dx * c; P[b + 1] -= dy * c; P[b + 2] -= dz * c; }
        else { P[a] += dx * c * 0.5; P[a + 1] += dy * c * 0.5; P[a + 2] += dz * c * 0.5; P[b] -= dx * c * 0.5; P[b + 1] -= dy * c * 0.5; P[b + 2] -= dz * c * 0.5; }
      }
      for (let k = RIBPIN; k < RIBNP; k++) { const o = k * 3; if (P[o + 1] < floorY) { P[o + 1] = floorY; Pp[o] += (P[o] - Pp[o]) * 0.5; Pp[o + 2] += (P[o + 2] - Pp[o + 2]) * 0.5; } }
    }
  }
  function ribbonStep(r, h, t, floorY) {
    const P = r.P, Pp = r.Pp, tw = r.tw, twp = r.twp, ph = r.phase, hv = r.hover, free = 1 - hv;
    // Wind: a gust envelope on a slowly veering heading, plus a ripple that travels down the tail.
    const gust = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.33 + ph)) * (0.5 + 0.5 * Math.sin(t * 0.71 + ph * 1.3 + 1));
    const head = 0.5 + 0.9 * Math.sin(t * 0.17 + ph * 0.5), wx = Math.cos(head), wz = Math.sin(head) * 0.7;
    const WA = WIND * 1.6 * free * gust, damp = 0.982 - 0.03 * hv;
    // Hover: a spring toward a pose swung 22 degrees out toward the reader, so the tail cannot run away.
    const q = (RIBPIN - 1) * 3, rx0 = P[q], ry0 = P[q + 1], rz0 = P[q + 2];
    for (let k = RIBPIN; k < RIBNP; k++) {
      const o = k * 3, dn = (k - RIBPIN + 1) / (RIBNP - RIBPIN);
      const rip = 1 + 0.35 * Math.sin(dn * 7.5 - t * 6 + ph), flap = Math.sin(dn * 3.1 + t * 2.3 + ph * 0.7) * dn;
      const dl = (k - RIBPIN + 1) * RIBLS, hk = 60 * hv;
      const ax = WA * wx * rip + hk * (rx0 - P[o]), ay = -GRAV + WA * 0.5 * flap + hk * (ry0 - 0.93 * dl - P[o + 1]), az = WA * (wz * rip + 0.6 * Math.sin(dn * 6 - t * 7 + ph) * dn) + hk * (rz0 + 0.37 * dl - P[o + 2]);
      const x = P[o], y = P[o + 1], z = P[o + 2];
      P[o] += (x - Pp[o]) * damp + ax * h * h; P[o + 1] += (y - Pp[o + 1]) * damp + ay * h * h; P[o + 2] += (z - Pp[o + 2]) * damp + az * h * h;
      Pp[o] = x; Pp[o + 1] = y; Pp[o + 2] = z;
    }
    relax(P, Pp, 12, floorY);
    // Torsion: neighbours drag each other, crosswind and sideways motion twist the tail, hover squares it to the reader.
    for (let k = RIBPIN; k < RIBNP; k++) {
      const o = k * 3, dn = (k - RIBPIN + 1) / (RIBNP - RIBPIN), vx = (P[o] - Pp[o]) / h;
      const lap = tw[k - 1] - 2 * tw[k] + (k + 1 < RIBNP ? tw[k + 1] : tw[k]);
      const drive = WIND * free * gust * (Math.sin(t * 1.7 + dn * 5 + ph) * 0.8 + Math.sin(t * 3.9 + dn * 9 - ph) * 0.4) * dn * 1.1 + vx * 1.2 * dn;
      const v = (tw[k] - twp[k]) * 0.95; twp[k] = tw[k];
      tw[k] = Math.max(-0.6, Math.min(0.6, tw[k] + v + (500 * lap - 8 * (1 + 8 * hv) * tw[k] + drive) * h * h));
    }
  }
  // Rows collide as capsules across the width (radius half the cloth), so strips stack instead of passing through.
  function collideRibbons() {
    const hw = RIBW / 2, reach = (RIBW + 2 * RIBR) ** 2, minD = 2 * RIBR;
    for (let a = 0; a < ribbons.length; a++) for (let b = a + 1; b < ribbons.length; b++) {
      const PA = ribbons[a].P, SA = ribbons[a].S, PB = ribbons[b].P, SB = ribbons[b].S;
      for (let k = 1; k < RIBNP; k++) {
        const o = k * 3, ax = PA[o], ay = PA[o + 1], az = PA[o + 2];
        for (let l = 1; l < RIBNP; l++) {
          const q = l * 3, bx = PB[q], by = PB[q + 1], bz = PB[q + 2];
          if ((bx - ax) ** 2 + (by - ay) ** 2 + (bz - az) ** 2 > reach) continue;
          // Closest points of the two width segments.
          const d1x = SA[o] * RIBW, d1y = SA[o + 1] * RIBW, d1z = SA[o + 2] * RIBW, d2x = SB[q] * RIBW, d2y = SB[q + 1] * RIBW, d2z = SB[q + 2] * RIBW;
          const p1x = ax - SA[o] * hw, p1y = ay - SA[o + 1] * hw, p1z = az - SA[o + 2] * hw, p2x = bx - SB[q] * hw, p2y = by - SB[q + 1] * hw, p2z = bz - SB[q + 2] * hw;
          const rx = p1x - p2x, ry = p1y - p2y, rz = p1z - p2z, A = RIBW * RIBW, E = A, F = d2x * rx + d2y * ry + d2z * rz, C = d1x * rx + d1y * ry + d1z * rz, Bq = d1x * d2x + d1y * d2y + d1z * d2z, den = A * E - Bq * Bq;
          let s = den > 1e-9 ? Math.max(0, Math.min(1, (Bq * F - C * E) / den)) : 0, t = (Bq * s + F) / E;
          if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -C / A)); } else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (Bq - C) / A)); }
          let nx = p1x + d1x * s - p2x - d2x * t, ny = p1y + d1y * s - p2y - d2y * t, nz = p1z + d1z * s - p2z - d2z * t, d = Math.hypot(nx, ny, nz);
          if (d >= minD) continue;
          if (d < 1e-6) { nx = 0; ny = 0; nz = 1; d = 1; }
          const wa = k < RIBPIN ? 0 : 1, wb = l < RIBPIN ? 0 : 1, tot = wa + wb; if (!tot) continue;
          const push = (minD - d) / d / tot;
          PA[o] += nx * push * wa; PA[o + 1] += ny * push * wa; PA[o + 2] += nz * push * wa;
          PB[q] -= nx * push * wb; PB[q + 1] -= ny * push * wb; PB[q + 2] -= nz * push * wb;
        }
      }
    }
  }
  function updateRibbons(co, rightT, dt) {
    // A zero-length frame would divide the torsion drive by zero and poison the strand with NaN.
    const floorY = ground.position.y + 0.004, h = Math.min(Math.max(dt, 1e-4), 1 / 30) / 2;
    for (const r of ribbons) {
      const s = sheets[r.ch.sheet], e = s.edge || { a: 0, k: 0, sa: 0, ca: 1, z0: 0 };
      const rx = r.ribX, rang = e.a + e.k * rx; let px, pz;
      if (Math.abs(e.k) < 1e-4) { px = rx * e.ca; pz = rx * e.sa; } else { px = (Math.sin(rang) - e.sa) / e.k; pz = (e.ca - Math.cos(rang)) / e.k; }
      // When closed, the sheet sits inside the block; place the ribbon at the block's depth so it hangs from the fore-edge.
      const closedZ = -rightT * (0.25 + r.i * 0.12);
      r.group.position.set(px, -H / 2 + 0.02, (pz + e.z0 - 0.0018) * co + closedZ * (1 - co)); r.group.rotation.y = -rang * co;
      r.group.updateWorldMatrix(true, false); r.m = r.m || new THREE.Matrix4(); r.m.copy(r.group.matrixWorld);
      r.hover += ((hoverRibbon === r.i ? 1 : 0) - r.hover) * Math.min(1, dt * 6);
      const P = r.P, Pp = r.Pp, S = r.S, el = r.m.elements;
      for (let k = 0; k < RIBPIN; k++) { const o = k * 3; _v.set(0, 0.04 - k * RIBLS, 0).applyMatrix4(r.m); P[o] = Pp[o] = _v.x; P[o + 1] = Pp[o + 1] = _v.y; P[o + 2] = Pp[o + 2] = _v.z; }
      // Hang straight through the intro swing; the strand only goes live once the rig has settled.
      if (!r.init || clock < 1.5) {
        const q = (RIBPIN - 1) * 3; _S.set(el[0], el[1], el[2]).normalize();
        for (let k = RIBPIN; k < RIBNP; k++) { const o = k * 3; P[o] = Pp[o] = P[q]; P[o + 1] = Pp[o + 1] = P[q + 1] - (k - RIBPIN + 1) * RIBLS; P[o + 2] = Pp[o + 2] = P[q + 2]; }
        for (let k = 0; k < RIBNP; k++) { const o = k * 3; S[o] = _S.x; S[o + 1] = _S.y; S[o + 2] = _S.z; }
        r.init = true;
      }
    }
    for (let sub = 0; sub < 2; sub++) {
      for (const r of ribbons) ribbonStep(r, h, clock - h * (1 - sub), floorY);
      collideRibbons();
      for (const r of ribbons) relax(r.P, r.Pp, 2, floorY);
    }
    // Skin: each row is a strip across the strand, turned by its twist and gently cupped; the width axis is kept for the next collision pass.
    for (const r of ribbons) {
      const P = r.P, S = r.S, pos = r.rgeo.attributes.position.array, tw = r.tw, el = r.m.elements; _mi.copy(r.m).invert();
      for (let k = 0; k < RIBNP; k++) {
        const o = k * 3, a = Math.max(0, k - 1) * 3, b = Math.min(RIBNP - 1, k + 1) * 3, dn = Math.max(0, k - RIBPIN + 1) / (RIBNP - RIBPIN);
        _T.set(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]).normalize();
        _S.set(el[0], el[1], el[2]).normalize(); _S.addScaledVector(_T, -_S.dot(_T)).normalize();
        _Nn.crossVectors(_T, _S);
        const c = Math.cos(tw[k]), sn = Math.sin(tw[k]);
        const sx = _S.x * c + _Nn.x * sn, sy = _S.y * c + _Nn.y * sn, sz = _S.z * c + _Nn.z * sn;
        const nx = _Nn.x * c - _S.x * sn, ny = _Nn.y * c - _S.y * sn, nz = _Nn.z * c - _S.z * sn;
        S[o] = sx; S[o + 1] = sy; S[o + 2] = sz;
        const cup = (0.0015 + 0.005 * dn) * (1 - 0.6 * r.hover);
        for (let j = 0; j <= RIBWS; j++) {
          const x0 = (j / RIBWS - 0.5) * RIBW, u = x0 / (RIBW / 2), bulge = cup * (1 - u * u), vi = (k * (RIBWS + 1) + j) * 3;
          _v.set(P[o] + sx * x0 + nx * bulge, P[o + 1] + sy * x0 + ny * bulge, P[o + 2] + sz * x0 + nz * bulge).applyMatrix4(_mi);
          pos[vi] = _v.x; pos[vi + 1] = _v.y; pos[vi + 2] = _v.z;
        }
      }
      r.rgeo.attributes.position.needsUpdate = true; r.rgeo.computeVertexNormals(); r.rgeo.computeBoundingSphere();
    }
  }

  // ---------- navigation ----------
  // state 0 = closed; 1 = cover open; 1 + k = k sheets turned.
  const SPREADS = ['The closed tome', 'Ex libris and contents', `About and chapter one, ${D.bezl.title}`, `${D.bezl.title} notes and chapter two, ${D.kbui.title}`, `${D.kbui.title} notes and the work studies`, 'Why these studies, and contact', 'Colophon and the last page'];
  let current = 0, focus = 'right', ribbonHinted = false;
  const portrait = () => camera.aspect < 0.85;
  function goTo(target, fromFocus) {
    target = Math.max(0, Math.min(N + 1, target));
    if (target === current) return;
    const now = performance.now(), step = reduce ? 0 : 150; let d = 0;
    const want = (st) => ({ cover: st >= 1 ? 1 : 0, flipped: Math.max(0, st - 1) });
    const from = want(current), to = want(target);
    if (target > current) {
      // Clasps unhook first; the cover starts swinging once the straps have dropped clear of its fore-edge.
      if (from.cover !== to.cover) { claspState.pending = 1; claspState.startAt = now; d += step * 2.6; coverState.pending = 1; coverState.startAt = now + d; d += step * 2; }
      for (let i = from.flipped; i < to.flipped; i++) { sheets[i].pending = 1; sheets[i].startAt = now + d; d += step; }
    } else {
      for (let i = from.flipped - 1; i >= to.flipped; i--) { sheets[i].pending = 0; sheets[i].startAt = now + d; d += step; }
      if (from.cover !== to.cover) { coverState.pending = 0; coverState.startAt = now + d; claspState.pending = 0; claspState.startAt = now + d + DUR * 600; }
    }
    if (!fromFocus) focus = target > current ? 'left' : 'right';
    if (target <= 1) focus = 'right';
    current = target;
    live.textContent = SPREADS[current];
    if (current >= 1 && !ribbonHinted) { ribbonHinted = true; hint.textContent = 'Pull a colored ribbon to jump to a chapter'; hint.classList.remove('gone'); setTimeout(() => hint.classList.add('gone'), 4500); }
    else hint.classList.add('gone');
  }
  // Site places (see place.ts) to spreads, and the face being read back to its place.
  const PLACE_AT = { contents: [1, 'right'], about: [2, 'left'], bezl: [2, 'right'], kbui: [3, 'right'], studies: [4, 'right'], contact: [5, 'right'] };
  const FACE_PLACE = { contents: 'contents', about: 'about', bezl: 'bezl', bezlNotes: 'bezl', kbui: 'kbui', kbuiNotes: 'kbui', studies: 'studies', studyNotes: 'studies', contact: 'contact', colophon: 'contact' };
  function placeNow() {
    if (current === 0) return null;
    if (current === 1) return 'contents';
    const left = SHEETS[current - 2][1], right = SHEETS[current - 1] && SHEETS[current - 1][0];
    return FACE_PLACE[(portrait() && focus === 'left') || !right ? left : right] || null;
  }
  function turnTo(place) { const at = PLACE_AT[place]; if (!at) return; focus = at[1]; goTo(at[0], true); }
  function next() { if (portrait() && current >= 1 && focus === 'left') { focus = 'right'; return; } goTo(current + 1); }
  function prev() { if (portrait() && current >= 1 && focus === 'right') { focus = 'left'; return; } goTo(current - 1); }

  addEventListener('keydown', (e) => {
    if (!awake) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(N + 1);
    else if (e.key === 'l' || e.key === 'L' || e.key === 'Escape') openList();
  }, sig);

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables.map((p) => p.mesh), false);
    if (!hits.length) return null;
    const tabHit = hits.find((q) => q.distance - hits[0].distance < 0.06 && pickables.some((pp) => pp.mesh === q.object && pp.tab !== undefined));
    const h = tabHit || hits[0], p = pickables.find((q) => q.mesh === h.object);
    if (p && p.block && !(h.face && h.face.normal.z > 0.5)) return null;
    if (!p) return null;
    if (p.tab !== undefined) return { tab: p.tab };
    if (p.cover) return { cover: true, uv: h.uv, face: h.face };
    if (!h.uv) return null;
    const tx = (p.flip ? 1 - h.uv.x : h.uv.x) * TW, ty = (1 - h.uv.y) * TH;
    const spot = (faceHs[p.face] || []).find((s) => tx >= s.x && tx <= s.x + s.w && ty >= s.y && ty <= s.y + s.h);
    return { face: p.face, tx, ty, spot };
  }
  function insideCoverSpot(hit) { return hit && hit.cover && hit.face && hit.face.normal && hit.face.normal.z < 0; }

  let down = null, dragSpot = null, mx = 0, my = 0;
  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId);
    const hit = pick(e);
    down = { x: e.clientX, y: e.clientY, hit };
    if (hit && hit.spot && hit.spot.drag) { dragSpot = { face: hit.face, spot: hit.spot }; hit.spot.drag(hit.tx, hit.ty); }
  });
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
    if (dragSpot) {
      const hit = pick(e);
      if (hit && hit.face === dragSpot.face) { const s = (faceHs[hit.face] || []).find((q) => q.drag); if (s) s.drag(hit.tx, hit.ty); }
      return;
    }
    if (e.pointerType === 'mouse') {
      const hit = pick(e);
      stage.style.cursor = hit && (hit.tab !== undefined || hit.spot || (hit.cover && current === 0)) ? 'pointer' : (current === 0 ? 'default' : 'grab');
      if (hit && hit.tab !== undefined) hoverCover = false;
      hoverCover = !!(hit && hit.cover && current === 0);
      hoverRibbon = hit && hit.tab !== undefined ? hit.tab : -1;
      if (hoverRibbon >= 0) { tip.hidden = false; tip.textContent = CHAPTERS[hoverRibbon].label; tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY - 34 + 'px'; } else tip.hidden = true;
    }
  });
  let hoverCover = false, hoverRibbon = -1;
  stage.addEventListener('pointerup', (e) => {
    const tr = stage.getBoundingClientRect();
    lastTap = { x: ((e.clientX - tr.left) / tr.width) * 2 - 1, y: -((e.clientY - tr.top) / tr.height) * 2 + 1, at: performance.now() };
    if (dragSpot) { dragSpot = null; down = null; return; }
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y, hit = down.hit; down = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); return; }
    if (hit && hit.tab !== undefined) { goTo(CHAPTERS[hit.tab].sheet + 1); return; }
    if (hit && hit.spot && hit.spot.act) { hit.spot.act(); return; }
    if (current === 0) { if (hit && hit.cover) goTo(1); return; }
    const r = stage.getBoundingClientRect();
    if (portrait()) { (e.clientX - r.left > r.width / 2) ? next() : prev(); }
    else { (e.clientX - r.left > r.width / 2) ? goTo(current + 1) : goTo(current - 1); }
  });

  // ---------- motes ----------
  const motes = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 0.03, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0x9ff5d6 }));
  const MC = 90, mp = new Float32Array(MC * 3);
  for (let i = 0; i < MC; i++) { mp[i * 3] = (Math.random() - 0.5) * 4; mp[i * 3 + 1] = (Math.random() - 0.5) * 3; mp[i * 3 + 2] = (Math.random() - 0.5) * 1.5; }
  motes.geometry.setAttribute('position', new THREE.BufferAttribute(mp, 3)); scene.add(motes);

  // ---------- camera fit ----------
  let camZ = 6, camX = 0, camY = 0, inset = 0;
  // Frames the book in the band below the toggle; y lifts the camera so the book centres in that band.
  function fitTarget() {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), A = camera.aspect;
    const band = 1 - inset;
    const fit = (w, h) => Math.max(w / (2 * tan * A), h / (2 * tan * band));
    const at = (z, x) => ({ z, x, y: inset * tan * z });
    if (current === 0) return at(fit(CW * 1.45, CH * 1.42), 0);
    if (portrait()) return at(fit(W + 0.1, H + 0.46), focus === 'left' ? -W / 2 : W / 2);
    return at(fit(2 * W + 0.16, H + 0.46), 0);
  }
  function resize() {
    const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    inset = Math.min(0.3, Math.max(0, insetTop()) / h);
    const f = fitTarget(); camZ = f.z; camX = f.x;
  }
  addEventListener('resize', resize, sig);

  // ---------- sleep ----------
  // Hidden, the camera dollies into the page last touched, then the loop stops; show() reverses it.
  let awake = true, started = false, running = false, doze = 0, dozeTo = 0, aimX = 0, aimY = 0, lastTap = null;
  const DOZE = 0.6;
  function sleep() {
    if (!awake) return;
    awake = false; dozeTo = 1; tip.hidden = true;
    const tap = lastTap && performance.now() - lastTap.at < 1500 ? lastTap : { x: 0, y: 0 };
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camZ;
    aimX = tap.x * halfH * camera.aspect * 0.7; aimY = tap.y * halfH * 0.7;
  }
  function wake(place) {
    awake = true; dozeTo = 0;
    if (place) turnTo(place);
    if (started && !running && alive) { running = true; last = performance.now(); resize(); raf = requestAnimationFrame(loop); }
  }

  // ---------- loop ----------
  let last = performance.now(), openO = 0, clock = 0;
  function step(s, now, dt) {
    if (s.pending !== null && now >= s.startAt) { if (s.dir !== undefined) s.dir = s.pending > s.t ? 1 : -1; s.target = s.pending; s.pending = null; }
    if (s.t !== s.target) { if (reduce) s.t = s.target; else { const d = dt / (s.dur || DUR); s.t = s.target > s.t ? Math.min(s.target, s.t + d) : Math.max(s.target, s.t - d); } }
  }
  function loop(now) {
    const dt = Math.min(0.25, (now - last) / 1000); last = now; clock += dt;
    step(coverState, now, dt); step(claspState, now, dt); sheets.forEach((s) => step(s, now, dt));
    const co = ease(coverState.t), cq = ease(claspState.t);
    const flippedFrac = sheets.reduce((a, s) => a + ease(s.t), 0) / N;
    const leftT = PT * flippedFrac * co, rightT = PT * (1 - flippedFrac * co) + 0.0001;
    // Open, both stacks sit at one height (half the block each side) so no page rises or sinks as leaves cross; closed, the full block is on the right.
    // The left half forms under the landing cover; grown any earlier it floats past the spine as a sliver.
    const HB = PT * (1 - co) + PT / 2 * co, LB = PT / 2 * co * smooth((co - 0.8) / 0.2);
    blockR.scale.z = HB; blockR.position.set(W / 2, 0, -PT + HB / 2);
    blockL.visible = LB > 0.002; blockL.scale.z = Math.max(LB, 0.0001); blockL.position.set(-W / 2, 0, -PT + LB / 2);
    backCover.position.set(0, 0, -PT - CT);
    hinge.rotation.y = -Math.PI * co; hinge.position.set(XE, 0, -PT * co);
    const spanTop = CT * (1 - co) - PT * co, spanBot = -PT - CT;
    spine.visible = co < 0.98; spineLabel.visible = co < 0.5;
    if (spine.visible) updateSpine(spanTop, spanBot, co);
    sheets.forEach((s) => shape(s, LB, HB));
    openO += (co - openO) * Math.min(1, dt * 6);
    // Closed: float and tilt like a held relic. Open: settle flat toward the reader.
    const bob = reduce ? 0 : (Math.sin(clock * 1.1) * 0.5 + 0.5) * 0.11 * (1 - openO) - 0.035 * (1 - openO);
    book.position.set(-CW / 2 * (1 - openO), bob, 0);
    // Ground and contact pool track the book's actual lowest point, so the shadow touches the book instead of floating beneath it.
    rig.updateMatrixWorld(true);
    for (const c of clasps) c.update(cq, dt);
    updateRibbons(co, rightT, dt);
    // The floor is fixed at the book's lowest point when it is at the bottom of its bob, so the hover is a real lift:
    // the spot light's cast shadow then spreads and softens as the book rises, and the contact pool fades with height.
    const bobMin = reduce ? 0 : -0.035 * (1 - openO);
    const curFloor = bookFloor();
    const restFloor = curFloor - (bob - bobMin);
    if (floorRef === null || Math.abs(restFloor - floorRef) > 0.05) floorRef = restFloor; else floorRef += (restFloor - floorRef) * Math.min(1, dt * 2);
    ground.position.y = floorRef - 0.003;
    const lift = Math.max(0, curFloor - floorRef);
    // Contact pool sized to the boards' footprint, fading as the book lifts off its rest height.
    _body.getCenter(contact.position); contact.position.y = ground.position.y + 0.002;
    const foot = _body.getSize(_v), spread = 1 + lift * 4;
    contact.scale.set((foot.x * 0.9 + 0.3) * spread, (foot.z * 0.9 + 0.3) * spread, 1);
    contact.material.opacity = Math.max(0.1, 0.5 - lift * 5);
    const tx = (-0.16 + (reduce ? 0 : my * 0.05)) * (1 - openO) + (-0.22 + (reduce ? 0 : my * 0.05)) * openO;
    const ty = (0.38 + (reduce ? 0 : mx * 0.15)) * (1 - openO) + (reduce ? 0 : mx * 0.06) * openO;
    const tz = -0.26 * (1 - openO);
    rig.rotation.x += (tx - rig.rotation.x) * Math.min(1, dt * 4);
    rig.rotation.y += (ty - rig.rotation.y) * Math.min(1, dt * 4);
    rig.rotation.z += (tz - rig.rotation.z) * Math.min(1, dt * 4);
    const breath = (ph) => smooth(0.5 - 0.5 * Math.cos(ph));
    const pulse = reduce ? 0.85 : 0.6 + 0.4 * breath(clock * 0.9);
    const boost = hoverCover ? 1.35 : 1;
    glow.material.opacity = 0.08 * pulse * boost; gemMat.emissiveIntensity = 0.34 * pulse * boost;
    glow.getWorldPosition(gemLight.position); gemLight.intensity = 0.32 * pulse * boost * (1 - co * 0.6);
    const seep = reduce ? 0.45 : 0.18 + 0.82 * breath(clock * 0.9 - 0.75);
    coverSkin.emissiveIntensity = 0.5 * seep * boost * (1 - co * 0.6);
    // Gem: a slow rock so facets take turns catching the key light.
    if (!reduce) { gem.rotation.x = Math.sin(clock * 0.61) * 0.03; gem.rotation.y = Math.sin(clock * 0.47 + 1.3) * 0.03; }
    if (!reduce) { for (let i = 0; i < MC; i++) { mp[i * 3 + 1] += dt * 0.05; if (mp[i * 3 + 1] > 1.6) mp[i * 3 + 1] = -1.6; } motes.geometry.attributes.position.needsUpdate = true; }
    const f = fitTarget(); camZ += (f.z - camZ) * Math.min(1, dt * 3); camX += (f.x - camX) * Math.min(1, dt * 3);
    camY += ((current === 0 ? -0.16 : -0.2) + f.y - camY) * Math.min(1, dt * 3);
    doze = reduce ? dozeTo : dozeTo > doze ? Math.min(dozeTo, doze + dt / DOZE) : Math.max(dozeTo, doze - dt / DOZE);
    const dz = ease(doze), z = camZ * (1 - 0.62 * dz), lx = camX + aimX * dz, ly = camY + aimY * dz;
    // Camera looks down a little so the floor reads as a plane the shadow lies on.
    const pitch = THREE.MathUtils.degToRad((10 * (1 - openO) + 6 * openO) * (1 - dz));
    camera.position.set(lx, ly + z * Math.tan(pitch), z); camera.lookAt(lx, ly, 0);
    renderer.render(scene, camera);
    if (alive && (awake || doze < 1)) raf = requestAnimationFrame(loop); else running = false;
  }

  const fontsReady = Promise.all([document.fonts.load('700 60px "Cinzel"'), document.fonts.load('500 20px "Cinzel"'), document.fonts.load('400 30px "EB Garamond"'), document.fonts.load('italic 400 30px "EB Garamond"'), document.fonts.load('600 30px "EB Garamond"')]).catch(() => {});
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => {
    Object.keys(faceTex).forEach(redraw); Object.keys(faceTex).forEach(redraw);
    if (!alive) return;
    started = running = true; resize(); raf = requestAnimationFrame(loop);
  });

  return {
    show: wake,
    hide: sleep,
    place: placeNow,
    destroy() {
      alive = false; ac.abort(); cancelAnimationFrame(raf);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        for (const m of [].concat(o.material || [])) { for (const v of Object.values(m)) if (v && v.isTexture) v.dispose(); m.dispose(); }
      });
      renderer.dispose(); host.replaceChildren();
    },
  };
}
