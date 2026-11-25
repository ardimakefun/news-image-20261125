// news-image-20261125 — "THE WORLD": front page summing up Wednesday 25 November 2026.
// Draws a 1024x1024 newspaper front page with a hand-written PNG encoder
// (node:zlib deflate + a CRC32 written in this file) and an embedded 5x7
// bitmap font. No network, no clock, no unseeded randomness: every run
// writes byte-identical output.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- PNG encoder
const CRC_TABLE: number[] = (() => {
  const t: number[] = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(w: number, h: number, rgb: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0; // filter: none
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (1 + w * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------- 5x7 bitmap font
// Each glyph: 7 rows of 5 bits, '1' = ink, '0' = empty. Uppercase + digits +
// punctuation only; all text is uppercased before drawing.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
};

// ------------------------------------------------------------------- canvas
type RGB = [number, number, number];
const INK: RGB = [17, 17, 17];
const PAPER: RGB = [253, 251, 245];
const RED: RGB = [176, 30, 30];
const NAVY: RGB = [20, 48, 74];
const SEA: RGB = [28, 68, 102];
const SKY: RGB = [191, 217, 232];
const SUN: RGB = [240, 180, 60];
const WHITE: RGB = [255, 255, 255];
const GREY: RGB = [90, 90, 90];
const LIGHT: RGB = [232, 228, 216];
const GREEN: RGB = [34, 130, 60];

class Canvas {
  data = new Uint8Array(W * H * 3);
  constructor() {
    this.fill(PAPER);
  }
  fill(c: RGB): void {
    for (let i = 0; i < W * H; i++) {
      this.data[i * 3] = c[0];
      this.data[i * 3 + 1] = c[1];
      this.data[i * 3 + 2] = c[2];
    }
  }
  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c);
  }
  hline(x: number, y: number, w: number, c: RGB): void {
    for (let xx = x; xx < x + w; xx++) this.px(xx, y, c);
  }
  vline(x: number, y: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) this.px(x, yy, c);
  }
  // Bresenham line.
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.px(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB): void {
    for (let yy = -r; yy <= r; yy++)
      for (let xx = -r; xx <= r; xx++)
        if (xx * xx + yy * yy <= r * r) this.px(cx + xx, cy + yy, c);
  }
  // Filled triangle (scanline).
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      const edges: [number, number, number, number][] = [
        [x0, y0, x1, y1],
        [x1, y1, x2, y2],
        [x2, y2, x0, y0],
      ];
      for (const [ax, ay, bx, by] of edges) {
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(Math.round(ax + ((y - ay) * (bx - ax)) / (by - ay)));
        }
      }
      if (xs.length >= 2) {
        const lo = Math.min(...xs);
        const hi = Math.max(...xs);
        for (let x = lo; x <= hi; x++) this.px(x, y, c);
      }
    }
  }
  // Hollow rect outline, 1px.
  frame(x: number, y: number, w: number, h: number, c: RGB): void {
    this.hline(x, y, w, c);
    this.hline(x, y + h - 1, w, c);
    this.vline(x, y, h, c);
    this.vline(x + w - 1, y, h, c);
  }
}

// --------------------------------------------------------------------- text
function textWidth(s: string, scale: number): number {
  const t = s.toUpperCase();
  if (t.length === 0) return 0;
  return t.length * 6 * scale - scale;
}

function drawText(cv: Canvas, x: number, y: number, scale: number, c: RGB, s: string, bold = false): void {
  const t = s.toUpperCase();
  let cx = x;
  for (const ch of t) {
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") {
          cv.rect(cx + col * scale, y + r * scale, scale, scale, c);
          if (bold) cv.rect(cx + col * scale + 1, y + r * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(cv: Canvas, cx: number, y: number, scale: number, c: RGB, s: string, bold = false): void {
  drawText(cv, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c, s, bold);
}

// Greedy word wrap to maxWidth pixels at the given scale.
function wrap(s: string, scale: number, maxWidth: number): string[] {
  const words = s.toUpperCase().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur === "" ? w : cur + " " + w;
    if (textWidth(next, scale) <= maxWidth || cur === "") cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

function drawPara(cv: Canvas, x: number, y: number, scale: number, c: RGB, s: string, maxWidth: number, lineGap = 4): number {
  const lines = wrap(s, scale, maxWidth);
  for (let i = 0; i < lines.length; i++) {
    drawText(cv, x, y + i * (7 * scale + lineGap), scale, c, lines[i]);
  }
  return y + lines.length * (7 * scale + lineGap);
}

// ------------------------------------------------------- verification badges
// Chunk C1: one small "BADGE - SOURCE" line per story. Badge word is drawn
// in its colour on a light pill; the source follows on the same line.
// Compact advance (11px/char at scale 2 instead of 12) so the longest line
// ("CONFIRMED - MULTIPLE OUTLETS", 28 chars = 307px) fits the 304px strip
// columns and the 309px lead columns without touching the next column.
const BADGE_COLORS: Record<string, RGB> = {
  OFFICIAL: GREEN,
  CONFIRMED: NAVY,
  REPORTED: RED,
};

function badgeTextWidth(s: string): number {
  return s.length * 11 - 1;
}

function drawBadge(cv: Canvas, x: number, y: number, badge: string, source: string): void {
  const s = badge + " - " + source;
  const w = badgeTextWidth(s);
  cv.rect(x - 4, y - 1, w + 8, 16, LIGHT);
  cv.frame(x - 4, y - 1, w + 8, 16, BADGE_COLORS[badge]);
  const t = s.toUpperCase();
  let cx = x;
  const c = BADGE_COLORS[badge];
  for (const ch of t) {
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") cv.rect(cx + col * 2, y + r * 2, 2, 2, c);
      }
    }
    cx += 11;
  }
}

// ------------------------------------------------------- pictograms (48x48)
// Each icon is drawn in a 48x48 box at (x, y) in ink + one accent colour.
function iconSatellite(cv: Canvas, x: number, y: number): void {
  cv.rect(x + 20, y + 18, 10, 12, INK); // body
  cv.rect(x + 4, y + 20, 14, 8, NAVY); // left panel
  cv.rect(x + 32, y + 20, 14, 8, NAVY); // right panel
  cv.line(x + 25, y + 18, x + 34, y + 8, INK); // antenna
  cv.circle(x + 36, y + 7, 3, RED);
  cv.circle(x + 8, y + 40, 2, INK);
  cv.circle(x + 16, y + 43, 2, INK);
  cv.circle(x + 40, y + 40, 2, INK);
}

function iconCourt(cv: Canvas, x: number, y: number): void {
  cv.tri(x + 4, y + 16, x + 24, y + 4, x + 44, y + 16, INK); // roof
  cv.rect(x + 8, y + 20, 4, 18, INK);
  cv.rect(x + 22, y + 20, 4, 18, INK);
  cv.rect(x + 36, y + 20, 4, 18, INK);
  cv.rect(x + 4, y + 40, 40, 4, INK); // base
}

function iconWindows(cv: Canvas, x: number, y: number): void {
  cv.rect(x + 6, y + 6, 16, 16, RED);
  cv.rect(x + 26, y + 6, 16, 16, [34, 130, 60]);
  cv.rect(x + 6, y + 26, 16, 16, NAVY);
  cv.rect(x + 26, y + 26, 16, 16, SUN);
}

function iconRocket(cv: Canvas, x: number, y: number): void {
  cv.rect(x + 20, y + 8, 8, 22, INK); // body
  cv.tri(x + 20, y + 8, x + 28, y + 8, x + 24, y + 0, RED); // nose
  cv.tri(x + 20, y + 30, x + 14, y + 38, x + 20, y + 36, INK); // fin
  cv.tri(x + 28, y + 30, x + 34, y + 38, x + 28, y + 36, INK); // fin
  cv.tri(x + 21, y + 32, x + 27, y + 32, x + 24, y + 44, SUN); // flame
  cv.circle(x + 36, y + 8, 2, INK);
  cv.circle(x + 10, y + 40, 2, INK);
}

function iconBurst(cv: Canvas, x: number, y: number): void {
  const cx = x + 24;
  const cy = y + 24;
  const dirs: [number, number][] = [
    [0, -20], [14, -14], [20, 0], [14, 14], [0, 20], [-14, 14], [-20, 0], [-14, -14],
  ];
  for (const [dx, dy] of dirs) cv.line(cx, cy, cx + dx, cy + dy, RED);
  cv.circle(cx, cy, 7, INK);
  cv.circle(cx, cy, 3, SUN);
}

function iconTanker(cv: Canvas, x: number, y: number): void {
  // Hull + tanks, mines floating in the water below.
  cv.rect(x + 4, y + 10, 40, 8, INK);
  cv.tri(x + 4, y + 18, x + 44, y + 18, x + 38, y + 28, INK);
  cv.rect(x + 10, y + 4, 8, 6, RED);
  cv.rect(x + 22, y + 4, 8, 6, RED);
  cv.rect(x + 32, y + 4, 4, 6, INK);
  cv.hline(x + 2, y + 34, 44, NAVY);
  cv.hline(x + 6, y + 40, 36, NAVY);
  cv.circle(x + 12, y + 34, 3, INK);
  cv.circle(x + 36, y + 40, 3, INK);
}

function iconMusic(cv: Canvas, x: number, y: number): void {
  // Quaver (eighth note): head + stem + red flag.
  cv.circle(x + 17, y + 36, 6, INK); // note head
  cv.rect(x + 21, y + 10, 4, 27, INK); // stem
  cv.tri(x + 25, y + 10, x + 40, y + 17, x + 25, y + 21, RED); // flag
  cv.circle(x + 38, y + 38, 2, INK);
  cv.circle(x + 8, y + 12, 2, INK);
}

// -------------------------------------------- lead illustration: ship + drones
function drawLeadArt(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const seaY = y + Math.floor(h * 0.58);
  cv.rect(x, y, w, seaY - y, SKY); // sky
  cv.rect(x, seaY, w, y + h - seaY, SEA); // sea
  // Waves, drawn before the ship so the hull covers them (at h=100 the
  // ship fills most of the sea; only the open-sea slivers show waves).
  for (let i = 0; i < 2; i++) {
    const wy = seaY + 14 + i * 18;
    for (let wx = x + 12; wx < x + w - 12; wx += 36) {
      cv.hline(wx, wy, 20, WHITE);
    }
  }
  // Sun + clouds.
  cv.circle(x + w - 52, y + 34, 20, SUN);
  cv.rect(x + 24, y + 26, 84, 14, WHITE);
  cv.rect(x + 44, y + 16, 54, 12, WHITE);
  cv.rect(x + w - 190, y + 50, 70, 12, WHITE);
  // Drones: three quadcopters flying high in the sky, above the containers
  // (which start at y+24), with a bolder dotted approach line.
  const drones: [number, number][] = [
    [x + 78, y + 12],
    [x + 150, y + 11],
    [x + 215, y + 16],
  ];
  for (let i = 0; i < drones.length; i++) {
    const [dx, dy] = drones[i];
    cv.rect(dx - 10, dy - 4, 21, 9, INK);
    cv.circle(dx - 15, dy - 7, 4, INK);
    cv.circle(dx + 15, dy - 7, 4, INK);
    cv.circle(dx - 15, dy + 7, 4, INK);
    cv.circle(dx + 15, dy + 7, 4, INK);
    if (i > 0) {
      const [px, py] = drones[i - 1];
      for (let t = 1; t < 12; t++) {
        const qx = Math.round(px + ((dx - px) * t) / 12);
        const qy = Math.round(py + ((dy - py) * t) / 12);
        cv.rect(qx, qy, 2, 2, INK);
      }
    }
  }
  // Cargo ship on the sea, ~1.3x the v1 size (all offsets from the bow
  // origin sx, scaled by 1.3; hull baseline hullY unchanged).
  const sx = x + 8; // hull (286 wide) must fit a 309-wide lead column
  const hullY = seaY + 34;
  cv.rect(sx, hullY - 34, 286, 34, [30, 30, 30]); // hull
  cv.tri(sx, hullY, sx + 286, hullY, sx + 257, hullY + 8, [30, 30, 30]);
  cv.rect(sx, hullY - 34, 286, 5, RED); // deck stripe
  cv.rect(sx + 18, hullY - 68, 39, 34, [200, 60, 50]); // containers
  cv.rect(sx + 62, hullY - 68, 39, 34, [60, 120, 70]);
  cv.rect(sx + 107, hullY - 68, 39, 34, [210, 170, 60]);
  cv.rect(sx + 151, hullY - 68, 39, 34, [70, 110, 160]);
  cv.rect(sx + 234, hullY - 75, 44, 41, WHITE); // bridge
  cv.rect(sx + 242, hullY - 68, 29, 10, NAVY);
  cv.vline(sx + 255, hullY - 88, 24, INK); // mast
  cv.rect(sx + 255, hullY - 88, 23, 13, RED); // flag
  // Caption inside the sea (white on the dark hull below the waterline).
  drawText(cv, x + 14, y + h - 26, 2, WHITE, "GULF OF FINLAND", true);
}

// --------------------------------------- lead scene: satellite over Earth
// Original geometric scene: dark sky, stars, Earth arc below, one satellite
// with solar panels on a diagonal orbit line.
function drawLeadArtSatellite(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, NAVY); // night sky
  // Stars (fixed positions, no randomness).
  const stars: [number, number, number][] = [
    [18, 14, 2], [52, 30, 2], [96, 12, 2], [140, 26, 2], [186, 10, 2],
    [228, 28, 2], [268, 14, 2], [296, 40, 2], [30, 58, 2], [120, 52, 2],
    [210, 56, 2], [70, 84, 2], [250, 84, 2], [160, 70, 2],
  ];
  for (const [sx, sy, r] of stars) cv.circle(x + sx, y + sy, r, WHITE);
  cv.circle(x + 272, y + 88, 10, WHITE); // moon
  cv.circle(x + 272, y + 88, 7, LIGHT);
  // Orbit line (diagonal, behind the satellite; kept inside the frame).
  // It runs above the "EARTH ORBIT" caption (y+74..88): the old line
  // (y+96 -> y+34) sliced through the caption's letters. This one passes
  // through the satellite centre (x+128, y+52) and stays >=4px above the
  // caption's top edge across its whole width.
  cv.line(x + 8, y + 70, x + w - 8, y + 30, WHITE);
  // Earth arc: big circle rising ~57px from the bottom edge (the part
  // below the frame is clipped by the PAPER rect below).
  cv.circle(x + 150, y + h + 28, 85, SEA);
  cv.circle(x + 104, y + h + 2, 20, GREEN); // land
  cv.circle(x + 196, y + h + 6, 16, GREEN); // land
  cv.rect(x + 176, y + h - 36, 56, 6, WHITE); // cloud band
  // Clip: the Earth circle must not spill below the art frame into the
  // headline area (the circle is centred below the frame by design).
  cv.rect(x, y + h, w, 180, PAPER);
  // Satellite: body + two panels + dish, centred on the orbit line.
  const bx = x + 128;
  const by = y + 52;
  cv.rect(bx - 52, by - 4, 34, 12, [70, 110, 160]); // left panel
  cv.rect(bx + 30, by - 4, 34, 12, [70, 110, 160]); // right panel
  cv.rect(bx - 52, by - 4, 34, 2, WHITE);
  cv.rect(bx + 30, by - 4, 34, 2, WHITE);
  cv.rect(bx - 14, by - 10, 40, 24, WHITE); // body
  cv.rect(bx - 14, by - 10, 40, 4, RED);
  cv.rect(bx + 2, by + 2, 8, 8, NAVY); // lens
  cv.line(bx + 26, by - 10, bx + 44, by - 26, WHITE); // antenna
  cv.circle(bx + 46, by - 28, 4, RED);
  drawText(cv, x + 12, y + h - 26, 2, WHITE, "EARTH ORBIT", true);
}

// --------------------------------------- lead scene: rocket + space station
// Original geometric scene: daylight sky, rocket climbing with flame and
// smoke, a small modular station at top right.
function drawLeadArtRocket(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, SKY); // sky
  cv.circle(x + w - 40, y + 26, 16, SUN);
  cv.rect(x + 16, y + 18, 56, 10, WHITE); // clouds
  cv.rect(x + 30, y + 10, 34, 8, WHITE);
  // Space station, top right: core + two modules + solar panels.
  const sx = x + w - 118;
  const sy = y + 42;
  cv.rect(sx, sy, 44, 14, WHITE);
  cv.rect(sx + 48, sy + 2, 26, 10, WHITE);
  cv.rect(sx - 30, sy + 2, 26, 10, WHITE);
  cv.rect(sx - 58, sy - 6, 26, 26, NAVY); // left panel
  cv.rect(sx + 78, sy - 6, 26, 26, NAVY); // right panel
  cv.rect(sx + 18, sy - 8, 8, 8, RED); // docking node
  // Rocket, centre-left, climbing (ry lowered for the 100px frame; the
  // flame is shortened so its tip ends exactly at the frame bottom).
  const rx = x + 96;
  const ry = y + 14;
  cv.tri(rx, ry + 62, rx + 12, ry + 62, rx + 6, ry + 80, SUN); // flame
  cv.tri(rx + 4, ry + 62, rx + 8, ry + 62, rx + 6, ry + 76, RED);
  cv.rect(rx - 6, ry + 18, 24, 46, WHITE); // body
  cv.rect(rx - 6, ry + 18, 24, 5, RED); // band
  cv.tri(rx - 6, ry + 18, rx + 18, ry + 18, rx + 6, ry, RED); // nose
  cv.circle(rx + 6, ry + 34, 5, NAVY); // window
  cv.tri(rx - 6, ry + 50, rx - 18, ry + 70, rx - 6, ry + 64, RED); // fin
  cv.tri(rx + 18, ry + 50, rx + 30, ry + 70, rx + 18, ry + 64, RED); // fin
  // Ground strip (before the smoke, so the puffs sit on it).
  cv.rect(x, y + h - 10, w, 10, GREEN);
  // Smoke puffs flanking the base of the flame, on the ground strip.
  cv.circle(rx - 10, y + h - 4, 8, WHITE);
  cv.circle(rx + 22, y + h - 3, 9, WHITE);
  // Caption sits right of the rocket (x+128): at x+12 the flame/fin
  // covered the final G, reading "TIANGON". Clear sky here, below the
  // station and clear of the smoke puffs (right puff ends at x+127).
  drawText(cv, x + 128, y + h - 26, 2, INK, "TIANGONG", true);
}

// --------------------------------------- world map band (Chunk C2)
// Original geometric world map: continents as unions of green discs on a
// light-blue ocean, drawn from scratch (no copied map). Band-relative
// coordinates: x 0..960 (lon -180..+180), y 0..120 (lat ~75N..-55S).
// Numbered pins (white ring + red disc + white number) mark only the
// stories with a clear land location; NATO space defence (orbit) and GTA 6
// (no event location) get no pin. Every pin centre sits on green land and
// no two pin centres are closer than 33px (pin radius 16 incl. ring;
// closest pair 1-13, 33.0px). Pins 1 and 6 were nudged a few px within
// their countries (Finland, Iran) so the bigger pins still clear each other.
const MAP_LAND: [number, number, number][] = [
  // North America (+ Central America isthmus)
  [140, 25, 14], [170, 32, 26], [220, 28, 30], [270, 32, 28], [310, 38, 20],
  [190, 50, 22], [240, 52, 24], [285, 55, 18], [150, 45, 16], [320, 55, 12],
  [280, 78, 9],
  // South America
  [250, 85, 20], [265, 105, 16], [245, 120, 10],
  // Europe (+ Iceland, Greenland)
  [465, 8, 5], [490, 22, 18], [515, 28, 16], [540, 18, 14], [555, 16, 12],
  [500, 40, 12], [555, 30, 12], [575, 32, 10], [330, 8, 12],
  // Africa
  [490, 65, 22], [510, 85, 20], [495, 105, 14], [520, 60, 14], [470, 75, 12],
  // Asia
  [600, 30, 20], [640, 32, 22], [680, 30, 20], [720, 28, 22], [760, 32, 22],
  [800, 30, 20], [840, 35, 18], [620, 45, 16], [660, 48, 16], [700, 50, 18],
  [740, 45, 16], [780, 45, 14], [820, 50, 14], [860, 55, 10], [580, 45, 12],
  [680, 58, 16], [690, 70, 12], [825, 38, 14],
  // Australia + SE Asia islands + Japan
  [820, 100, 16], [845, 105, 14], [800, 100, 10], [790, 75, 8], [810, 80, 7],
  [865, 40, 6],
];
// [story number, rel x, rel y] — locations from the verified brief only.
const MAP_PINS: [number, number, number][] = [
  [1, 552, 17], // ship strike: Gulf of Finland / Finland-Ukraine
  [3, 747, 34], // Shenzhou-24: China (launch site)
  [4, 283, 34], // Huawei: US court, east coast
  [5, 155, 28], // Microsoft: US west coast
  [6, 606, 32], // Ahmadi: Iran (north-west)
  [7, 638, 52], // Hormuz: Oman coast by the Strait of Hormuz
  [8, 219, 36], // Thanksgiving: central US
  [10, 675, 56], // cricket: India
  [11, 485, 26], // Sarkozy: France
  [12, 819, 38], // South Korea
  [13, 571, 44], // Gaza
];

function drawWorldMap(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, SKY); // ocean
  for (const [cx, cy, r] of MAP_LAND) cv.circle(x + cx, y + cy, r, GREEN);
  cv.frame(x, y, w, h, INK);
  // Label chip, bottom left over the empty South Pacific (no pin there).
  cv.rect(x + 32, y + 92, 218, 26, PAPER);
  cv.frame(x + 32, y + 92, 218, 26, INK);
  drawText(cv, x + 40, y + 98, 2, INK, "WHERE IT HAPPENED", true);
  // Pins: white ring (2px), red disc, white number (scale 1, centred).
  for (const [n, px, py] of MAP_PINS) {
    const cx = x + px;
    const cy = y + py;
    cv.circle(cx, cy, 16, WHITE);
    cv.circle(cx, cy, 14, RED);
    const s = String(n);
    drawText(cv, cx - Math.floor(textWidth(s, 1) / 2), cy - 3, 1, WHITE, s, true);
  }
}

// ------------------------------------------------------------------ layout
interface Story {
  icon: (cv: Canvas, x: number, y: number) => void;
  head: string;
  body: string;
  badge: string;
  source: string;
}

const SECONDARY: Story[] = [
  {
    icon: iconCourt,
    head: "HUAWEI CONVICTED IN US COURT",
    body: "GUILTY ON IRAN BUSINESS AND TRADE-SECRET THEFT CHARGES IN A US CRIMINAL TRIAL.",
    badge: "OFFICIAL",
    source: "REUTERS",
  },
  {
    icon: iconWindows,
    head: "MICROSOFT DECLARES 'CODE RED'",
    body: "AFTER A HISTORIC OUTAGE; A LEAKED INTERNAL MEMO REVEALS THE CRISIS RESPONSE.",
    badge: "REPORTED",
    source: "THE HINDU",
  },
  {
    icon: iconMusic,
    head: "SINGER FLOGGED 74 LASHES AFTER YOUTUBE CONCERT",
    body: "IRAN SENTENCES SINGER PARASTOO AHMADI TO 74 LASHES FOR PERFORMING IN AN ONLINE CONCERT.",
    badge: "CONFIRMED",
    source: "MULTIPLE OUTLETS",
  },
  {
    icon: iconTanker,
    head: "IRAN REJECTS US TALKS; MINES HIT TANKERS",
    body: "THREE TANKERS HIT BY MINES IN HORMUZ; RIYADH ATTACKED; HOUTHI THREAT TO SAUDI PORTS.",
    badge: "CONFIRMED",
    source: "MULTIPLE OUTLETS",
  },
];

const STRIP: { kick: string; head: string; body: string; badge: string; source: string }[] = [
  {
    kick: "USA",
    head: "TRUMP PARDONS TURKEYS 'FREEDOM' AND 'FEATHERS'",
    body: "ALSO: MEDAL OF FREEDOM FOR GIULIANI.",
    badge: "OFFICIAL",
    source: "MULTIPLE OUTLETS",
  },
  {
    kick: "GAMES",
    head: "GTA 6: 39 MILLION PS5 PLAYERS IN 4 DAYS",
    body: "BIGGEST SONY LAUNCH IN 30 YEARS.",
    badge: "CONFIRMED",
    source: "MULTIPLE OUTLETS",
  },
  {
    kick: "SPORT",
    head: "SURYAVANSHI, 15, SMASHES RECORD 204*",
    body: "204 OFF 53 BALLS, A WORLD RECORD.",
    badge: "CONFIRMED",
    source: "MULTIPLE OUTLETS",
  },
];

// Numbers strip: 6 big numbers, each from a story already on this page.
// 74 = Ahmadi lashes (secondary); 39M = GTA 6 PS5 players in 4 days (strip);
// 204* = Suryavanshi runs (strip); 53 = balls for that 204* (strip);
// 3 = tankers hit by mines in Hormuz (secondary, "THREE TANKERS");
// 2027 = year of the Sarkozy trial, 1 Apr 2027 (ticker).
const NUMBERS: { num: string; label: string }[] = [
  { num: "74", label: "LASHES" },
  { num: "39M", label: "GTA 6 PLAYERS" },
  { num: "204*", label: "RUNS, AGE 15" },
  { num: "53", label: "BALLS" },
  { num: "3", label: "TANKERS HIT" },
  { num: "2027", label: "SARKOZY TRIAL" },
];

// Three leads (Chunk B): the ship lead stays, NATO space defence and
// Shenzhou-24 are promoted from secondary. Headlines + summaries reuse
// text already on the page (verbatim excerpts, no new facts).
interface Lead {
  art: (cv: Canvas, x: number, y: number, w: number, h: number) => void;
  head: string;
  body: string;
  badge: string;
  source: string;
}
const LEADS: Lead[] = [
  {
    art: drawLeadArt,
    head: "ZELENSKIY: WE HIT RUSSIAN SHIP",
    body: "UKRAINE WAS BEHIND SATURDAY'S DRONE STRIKE ON A RUSSIAN CARGO SHIP IN THE GULF OF FINLAND.",
    badge: "OFFICIAL",
    source: "REUTERS",
  },
  {
    art: drawLeadArtSatellite,
    head: "NATO VOWS SPACE DEFENCE",
    body: "NATO PLEDGES TO DEFEND SPACE AFTER A REPORT THAT RUSSIA PLANS A NUCLEAR-ARMED SATELLITE LAUNCH.",
    badge: "OFFICIAL",
    source: "WH NEWS",
  },
  {
    art: drawLeadArtRocket,
    head: "SHENZHOU-24 LAUNCHES TO TIANGONG",
    body: "CHINA LAUNCHES A CREW TO ITS SPACE STATION, CARRYING THE FIRST PAKISTANI ASTRONAUT.",
    badge: "OFFICIAL",
    source: "MULTIPLE OUTLETS",
  },
];

// Ticker stories (Chunk C1): each on its own footer line with its badge.
const TICKER: { head: string; badge: string; source: string }[] = [
  { head: "SARKOZY TO TRIAL", badge: "OFFICIAL", source: "REUTERS" },
  { head: "SOUTH KOREA MINISTER RESIGNS", badge: "OFFICIAL", source: "MULTIPLE OUTLETS" },
  { head: "ISRAELI STRIKE IN GAZA", badge: "REPORTED", source: "DAILY DEBRIEF" },
];

function drawHeadline(cv: Canvas, x: number, y: number, scale: number, s: string, maxWidth: number, gap = 4): number {
  const lines = wrap(s, scale, maxWidth);
  for (let i = 0; i < lines.length; i++) {
    drawText(cv, x, y + i * (7 * scale + gap), scale, INK, lines[i], true);
  }
  return y + lines.length * (7 * scale + gap);
}

function main(): void {
  const cv = new Canvas();

  // Masthead. 13 stories on the page (3 leads + 4 secondary + 3 strip + 3 ticker)
  // across 10 fields: war, space, court, tech, human rights, energy, culture,
  // politics, games, sport. The two counts flank the dateline.
  // Chunk C1: title at scale 9 (was 10) to free room for the badge lines
  // and the 3-line ticker + legend in the footer.
  // Chunk C2: title scale 7, dateline scale 2, rules up — the page is full
  // and the world-map band below needs the room; nothing is dropped.
  drawTextCentered(cv, W / 2, 12, 7, INK, "THE WORLD", true);
  drawText(cv, 32, 66, 2, INK, "13 STORIES", true);
  drawText(cv, 992 - textWidth("10 FIELDS", 2), 66, 2, INK, "10 FIELDS", true);
  drawTextCentered(cv, W / 2, 66, 2, INK, "WEDNESDAY, 25 NOVEMBER 2026", true);
  cv.rect(32, 86, W - 64, 5, RED);
  cv.rect(32, 94, W - 64, 2, INK);

  // Three leads in one row (Chunk B): 3 columns, each art on top, then
  // headline, then a short summary, then the verification badge (Chunk C1).
  // Chunk C2: art 100 tall (was 150; the three scenes are re-fitted above),
  // gaps tightened to 1-2px. Column width 309, gap 16. Art 102-202,
  // headlines 208-274 (3 lines max), summaries dynamic (4-5 lines),
  // badges right after each summary; worst badge bottom is 352.
  const leadY = 102;
  const leadH = 100;
  const leadW = 309;
  for (let i = 0; i < LEADS.length; i++) {
    const x = 32 + i * (leadW + 16);
    const ld = LEADS[i];
    ld.art(cv, x, leadY, leadW, leadH);
    cv.frame(x, leadY, leadW, leadH, INK);
    const hy = drawHeadline(cv, x, leadY + 106, 3, ld.head, leadW, 1);
    const by = drawPara(cv, x, hy + 2, 2, INK, ld.body, leadW, 1);
    drawBadge(cv, x, by + 1, ld.badge, ld.source);
  }

  // Secondary stories: 2 columns x 2 rows (4 stories left after the two
  // promotions). Chunk C2: rows at 386/490 (pitch 104), headline gap 2,
  // body lineGap 1, badge 1px after the body; row-0 divider kept at y+92.
  // Row 1 (Ahmadi, 4-line body) badge bottom is 599.
  drawText(cv, 32, 358, 2, INK, "MORE WORLD NEWS", true);
  cv.rect(32, 378, W - 64, 2, INK);
  const cellW = 468;
  const cellH = 100;
  for (let i = 0; i < SECONDARY.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 32 + col * (cellW + 24);
    const y = 386 + row * 104;
    const st = SECONDARY[i];
    cv.rect(x, y + 2, 48, 48, LIGHT);
    cv.frame(x, y + 2, 48, 48, INK);
    st.icon(cv, x, y + 2);
    const hx = x + 62;
    const hy = drawHeadline(cv, hx, y, 2, st.head, cellW - 62, 2);
    const by = drawPara(cv, hx, hy + 2, 2, INK, st.body, cellW - 62, 1);
    drawBadge(cv, hx, by + 1, st.badge, st.source);
    if (row < 1) cv.rect(x, y + 92, cellW, 1, LIGHT);
  }

  // World map band (Chunk C2): original geometric map + numbered pins,
  // 608-728 (120 tall). Label chip inside, bottom left over the empty
  // South Pacific. Pins only for stories with a clear land location.
  drawWorldMap(cv, 32, 608, W - 64, 120);

  // Numbers strip: 6 big numbers (see NUMBERS above for sources).
  // Chunk C1: scale 3 (was 4) to free room for the footer badge lines.
  cv.rect(32, 736, W - 64, 2, INK);
  for (let i = 0; i < NUMBERS.length; i++) {
    const x = 32 + i * 160;
    drawTextCentered(cv, x + 80, 744, 3, RED, NUMBERS[i].num, true);
    drawTextCentered(cv, x + 80, 769, 2, INK, NUMBERS[i].label, true);
  }

  // Region strip: story count per region; the chips sum to the 13 in the
  // masthead. EUROPE 3 (lead ship, NATO space, Sarkozy) - ASIA 3 (Shenzhou,
  // cricket, South Korea) - MIDDLE EAST 3 (Ahmadi, Hormuz, Gaza) -
  // AMERICAS 4 (Huawei US court, Microsoft, Thanksgiving, GTA 6).
  const chipW = 184;
  const chipGap = 8;
  const chipY = 788;
  const chipH = 22;
  const chips: { label: string; bg: RGB; fg: RGB }[] = [
    { label: "REGIONS", bg: INK, fg: WHITE },
    { label: "EUROPE 3", bg: NAVY, fg: WHITE },
    { label: "ASIA 3", bg: GREEN, fg: WHITE },
    { label: "MIDDLE EAST 3", bg: RED, fg: WHITE },
    { label: "AMERICAS 4", bg: SUN, fg: INK },
  ];
  for (let i = 0; i < chips.length; i++) {
    const x = 36 + i * (chipW + chipGap);
    cv.rect(x, chipY, chipW, chipH, chips[i].bg);
    drawTextCentered(cv, x + chipW / 2, chipY + 4, 2, chips[i].fg, chips[i].label, true);
  }

  // Bottom strip: lighter stories, badge after each body.
  // Chunk C2: kick 846, headline 861-891 (2 lines, gap 1), body 892-922,
  // badge 923-937; column dividers shortened to 96 so they stop above the
  // ticker rule.
  drawText(cv, 32, 818, 2, RED, "ALSO TODAY", true);
  cv.rect(32, 838, W - 64, 2, INK);
  const stripW = 304;
  for (let i = 0; i < STRIP.length; i++) {
    const x = 32 + i * (stripW + 16);
    const y = 846;
    drawText(cv, x, y, 2, RED, STRIP[i].kick, true);
    const hy = drawHeadline(cv, x, y + 15, 2, STRIP[i].head, stripW, 1);
    const by = drawPara(cv, x, hy + 1, 2, INK, STRIP[i].body, stripW, 1);
    drawBadge(cv, x, by + 1, STRIP[i].badge, STRIP[i].source);
    if (i < 2) cv.vline(x + stripW + 8, y, 96, LIGHT);
  }

  // Ticker + footer (Chunk C1): each ticker story on its own line with its
  // badge, then DATE CHECK, then the badge legend (scale 1, centred).
  // Chunk C2: ticker rule 944; ticker lines 950/966/982 (pitch 16);
  // DATE CHECK 998; legend 1015-1022 (2px bottom margin).
  // Critic round 1: whole footer block lifted 3px (rule 941, ticker
  // 947/963/979, DATE CHECK 995, legend 1011-1018) so the legend ends
  // 6px above the bottom edge instead of 2px. All internal gaps kept:
  // rule-to-badge 3px, ticker-to-DATE CHECK 2px, DATE CHECK-to-legend 2px.
  // (A literal +1px font size is not possible here: the bitmap font only
  // scales in whole steps, and DATE CHECK at scale 3 would be 1041px wide
  // on a 960px text width; the lift + margin is the achievable form.)
  // The old "all stories first reported 25 Nov" line is gone: two lead facts
  // are NOT 25 Nov events, so the footer says so honestly. Drone strike on
  // the Russian ship: Saturday 21 Nov, confirmed by Zelenskiy 25 Nov.
  // Libya warship claim: Monday 23 Nov.
  cv.rect(32, 941, W - 64, 2, INK);
  for (let i = 0; i < TICKER.length; i++) {
    const y = 947 + i * 16;
    const tk = TICKER[i];
    drawText(cv, 32, y, 2, INK, tk.head + " -", true);
    drawBadge(cv, 32 + textWidth(tk.head + " - ", 2) + 8, y, tk.badge, tk.source);
  }
  drawText(cv, 32, 995, 2, RED, "DATE CHECK:", true);
  drawText(cv, 32 + textWidth("DATE CHECK: ", 2), 995, 2, INK, "SHIP STRIKE SAT 21 NOV - LIBYA CLAIM MON 23 NOV", true);
  drawTextCentered(cv, W / 2, 1011, 1, GREY, "OFFICIAL = ON THE RECORD - CONFIRMED = 2+ OUTLETS - REPORTED = ONE OUTLET");

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), encodePNG(W, H, cv.data));
}

main();
