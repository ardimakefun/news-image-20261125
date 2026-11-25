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

// -------------------------------------------- lead illustration: ship + drones
function drawLeadArt(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const seaY = y + Math.floor(h * 0.58);
  cv.rect(x, y, w, seaY - y, SKY); // sky
  cv.rect(x, seaY, w, y + h - seaY, SEA); // sea
  // Sun + clouds.
  cv.circle(x + w - 52, y + 34, 20, SUN);
  cv.rect(x + 24, y + 26, 84, 14, WHITE);
  cv.rect(x + 44, y + 16, 54, 12, WHITE);
  cv.rect(x + w - 190, y + 64, 70, 12, WHITE);
  // Drones: three small quadcopters with a dashed approach line.
  const drones: [number, number][] = [
    [x + 90, y + 78],
    [x + 150, y + 56],
    [x + 210, y + 88],
  ];
  for (let i = 0; i < drones.length; i++) {
    const [dx, dy] = drones[i];
    cv.rect(dx - 7, dy - 3, 14, 6, INK);
    cv.circle(dx - 10, dy - 5, 3, INK);
    cv.circle(dx + 10, dy - 5, 3, INK);
    cv.circle(dx - 10, dy + 5, 3, INK);
    cv.circle(dx + 10, dy + 5, 3, INK);
    if (i > 0) {
      const [px, py] = drones[i - 1];
      for (let t = 1; t < 8; t++) {
        cv.px(Math.round(px + ((dx - px) * t) / 8), Math.round(py + ((dy - py) * t) / 8), INK);
      }
    }
  }
  // Cargo ship on the sea.
  const hullY = seaY + 34;
  cv.rect(x + 52, hullY - 26, 220, 26, [30, 30, 30]); // hull
  cv.tri(x + 52, hullY, x + 272, hullY, x + 250, hullY + 22, [30, 30, 30]);
  cv.rect(x + 52, hullY - 26, 220, 4, RED); // deck stripe
  cv.rect(x + 66, hullY - 52, 30, 26, [200, 60, 50]); // containers
  cv.rect(x + 100, hullY - 52, 30, 26, [60, 120, 70]);
  cv.rect(x + 134, hullY - 52, 30, 26, [210, 170, 60]);
  cv.rect(x + 168, hullY - 52, 30, 26, [70, 110, 160]);
  cv.rect(x + 232, hullY - 58, 34, 32, WHITE); // bridge
  cv.rect(x + 238, hullY - 52, 22, 8, NAVY);
  cv.vline(x + 248, hullY - 76, 18, INK); // mast
  cv.rect(x + 248, hullY - 76, 18, 10, RED); // flag
  // Waves.
  for (let i = 0; i < 5; i++) {
    const wy = seaY + 14 + i * 18;
    for (let wx = x + 12; wx < x + w - 12; wx += 36) {
      cv.hline(wx, wy, 20, WHITE);
    }
  }
  // Caption inside the sea.
  drawText(cv, x + 14, y + h - 26, 2, WHITE, "GULF OF FINLAND", true);
}

// ------------------------------------------------------------------ layout
interface Story {
  icon: (cv: Canvas, x: number, y: number) => void;
  head: string;
  body: string;
}

const SECONDARY: Story[] = [
  {
    icon: iconSatellite,
    head: "NATO VOWS SPACE DEFENCE",
    body: "NATO PLEDGES TO DEFEND SPACE AFTER A REPORT THAT RUSSIA PLANS A NUCLEAR-ARMED SATELLITE LAUNCH, POSSIBLY IN DECEMBER.",
  },
  {
    icon: iconCourt,
    head: "HUAWEI CONVICTED IN US COURT",
    body: "GUILTY ON IRAN BUSINESS AND TRADE-SECRET THEFT CHARGES IN A US CRIMINAL TRIAL.",
  },
  {
    icon: iconWindows,
    head: "MICROSOFT DECLARES 'CODE RED'",
    body: "AFTER A HISTORIC OUTAGE; A LEAKED INTERNAL MEMO REVEALS THE CRISIS RESPONSE.",
  },
  {
    icon: iconRocket,
    head: "SHENZHOU-24 LAUNCHES TO TIANGONG",
    body: "CHINA LAUNCHES A CREW TO ITS SPACE STATION, CARRYING THE FIRST PAKISTANI ASTRONAUT, THE FIRST FOREIGNER ABOARD.",
  },
  {
    icon: iconBurst,
    head: "ISRAELI STRIKE KILLS HAMAS OFFICIAL",
    body: "AN ISRAELI AIRSTRIKE IN GAZA KILLS A HAMAS OFFICIAL AS THE CONFLICT CONTINUES.",
  },
  {
    icon: iconTanker,
    head: "IRAN REJECTS US TALKS; MINES HIT TANKERS",
    body: "THREE TANKERS HIT BY MINES IN HORMUZ; RIYADH ATTACKED; HOUTHI THREAT TO SAUDI PORTS.",
  },
];

const STRIP: { kick: string; head: string; body: string }[] = [
  {
    kick: "USA",
    head: "TRUMP PARDONS TURKEYS 'FREEDOM' AND 'FEATHERS'",
    body: "ALSO: MEDAL OF FREEDOM FOR GIULIANI.",
  },
  {
    kick: "GAMES",
    head: "GTA 6: 39 MILLION PS5 PLAYERS IN 4 DAYS",
    body: "BIGGEST SONY LAUNCH IN 30 YEARS.",
  },
  {
    kick: "SPORT",
    head: "SURYAVANSHI, 15, SMASHES RECORD 204*",
    body: "204 OFF 53 BALLS, A WORLD RECORD.",
  },
];

function drawHeadline(cv: Canvas, x: number, y: number, scale: number, s: string, maxWidth: number): number {
  const lines = wrap(s, scale, maxWidth);
  for (let i = 0; i < lines.length; i++) {
    drawText(cv, x, y + i * (7 * scale + 4), scale, INK, lines[i], true);
  }
  return y + lines.length * (7 * scale + 4);
}

function main(): void {
  const cv = new Canvas();

  // Masthead.
  drawTextCentered(cv, W / 2, 26, 11, INK, "THE WORLD", true);
  drawTextCentered(cv, W / 2, 114, 3, INK, "WEDNESDAY, 25 NOVEMBER 2026", true);
  cv.rect(32, 142, W - 64, 5, RED);
  cv.rect(32, 151, W - 64, 2, INK);

  // Lead story.
  const leadY = 164;
  const leadH = 272;
  drawLeadArt(cv, 32, leadY, 438, leadH);
  cv.frame(32, leadY, 438, leadH, INK);
  const tx = 492;
  drawText(cv, tx, leadY + 4, 2, RED, "LEAD STORY - UKRAINE WAR", true);
  drawText(cv, tx, leadY + 30, 4, INK, "UKRAINE HITS", true);
  drawText(cv, tx, leadY + 62, 4, INK, "RUSSIAN SHIP", true);
  cv.rect(tx, leadY + 102, 500, 2, INK);
  drawPara(
    cv,
    tx,
    leadY + 116,
    2,
    INK,
    "PRESIDENT ZELENSKIY CONFIRMS UKRAINE WAS BEHIND SATURDAY'S DRONE STRIKE ON A RUSSIAN CARGO SHIP IN THE GULF OF FINLAND. NORWAY, A KYIV ALLY, URGES CAUTION.",
    500,
    5
  );
  cv.rect(tx, leadY + 232, 500, 2, LIGHT);
  drawText(cv, tx, leadY + 242, 2, GREY, "KYIV ALSO CLAIMS WARSHIP SUNK OFF LIBYA.");

  // Secondary stories: 2 columns x 3 rows.
  drawText(cv, 32, 450, 2, INK, "MORE WORLD NEWS", true);
  cv.rect(32, 470, W - 64, 2, INK);
  const cellW = 468;
  const cellH = 100;
  for (let i = 0; i < SECONDARY.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 32 + col * (cellW + 24);
    const y = 482 + row * (cellH + 8);
    const st = SECONDARY[i];
    cv.rect(x, y + 2, 48, 48, LIGHT);
    cv.frame(x, y + 2, 48, 48, INK);
    st.icon(cv, x, y + 2);
    const hx = x + 62;
    const hy = drawHeadline(cv, hx, y, 2, st.head, cellW - 62);
    drawPara(cv, hx, hy + 2, 2, INK, st.body, cellW - 62, 4);
    if (row < 2) cv.rect(x, y + cellH - 2, cellW, 1, LIGHT);
  }

  // Bottom strip: lighter stories.
  drawText(cv, 32, 810, 2, RED, "ALSO TODAY", true);
  cv.rect(32, 830, W - 64, 2, INK);
  const stripW = 304;
  for (let i = 0; i < STRIP.length; i++) {
    const x = 32 + i * (stripW + 16);
    const y = 842;
    drawText(cv, x, y, 2, RED, STRIP[i].kick, true);
    const hy = drawHeadline(cv, x, y + 20, 2, STRIP[i].head, stripW);
    drawPara(cv, x, hy + 2, 2, INK, STRIP[i].body, stripW, 4);
    if (i < 2) cv.vline(x + stripW + 8, y, 94, LIGHT);
  }

  // Ticker + footer.
  cv.rect(32, 944, W - 64, 2, INK);
  drawText(cv, 32, 954, 2, INK, "ALSO: SARKOZY TO TRIAL - SOUTH KOREA MINISTER RESIGNS - O'HARE RADAR DELAYS", true);
  drawTextCentered(cv, W / 2, 980, 2, GREY, "ALL STORIES FIRST REPORTED ON WEDNESDAY, 25 NOVEMBER 2026");

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), encodePNG(W, H, cv.data));
}

main();
