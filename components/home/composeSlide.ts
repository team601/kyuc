// Vẽ một "khung" của đoạn sticky: ảnh nền + vùng mờ phía có chữ + chữ, vào một canvas 2D.
// Chữ được vẽ chung vào ảnh để hiệu ứng chuyển cảnh (dâng lên, vỡ pixel, mờ) phủ lên cả chữ.

export interface StageSlide {
  kind: 'hero' | 'step';
  src: string;
  /** object-position kiểu CSS, ví dụ "70% 40%" */
  focus: string;
  /** độ mờ toàn ảnh (px), dùng cho nền hero */
  blur?: number;
  side: 'left' | 'right' | 'center';
  tone: 'light' | 'dark';
  pill?: string;
  eyebrow?: string;
  title: string;
  body?: string;
  note?: string;
}

export interface ComposeFonts {
  display: string;
  body: string;
}

const COLORS = {
  dark: { title: '#3A2A24', body: '#4A3830', accent: '#C93D2A', shadow: 'rgba(255, 248, 240, 0.7)' },
  light: { title: '#FFF8F0', body: 'rgba(255, 248, 240, 0.92)', accent: '#FFC9BC', shadow: 'rgba(40, 24, 18, 0.6)' },
};

function focusOf(focus: string): [number, number] {
  const [x = '50%', y = '50%'] = focus.split(/\s+/);
  return [parseFloat(x) / 100, parseFloat(y) / 100];
}

/** Vẽ ảnh kiểu object-fit: cover, có thể tràn lề `bleed` px để mép ảnh mờ không bị trong suốt */
function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, w: number, h: number, focus: string, bleed = 0) {
  const [fx, fy] = focusOf(focus);
  const W = w + bleed * 2;
  const H = h + bleed * 2;
  const s = Math.max(W / img.width, H / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, -bleed + (W - dw) * fx, -bleed + (H - dh) * fy, dw, dh);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface Block {
  font: string;
  color: string;
  size: number;
  lineHeight: number;
  lines: string[];
  spacing?: number;
  gapAfter: number;
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  // letterSpacing có trên Chrome/Safari mới; trình duyệt cũ bỏ qua
  (ctx as unknown as { letterSpacing?: string }).letterSpacing = `${px}px`;
}

export function composeSlide(
  canvas: HTMLCanvasElement,
  slide: StageSlide,
  img: (CanvasImageSource & { width: number; height: number }) | null,
  scale: number,
  fonts: ComposeFonts,
) {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  const cssW = w / scale;
  const cssH = h / scale;
  const mobile = cssW < 900;
  const k = scale;

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#F2EDE6';
  ctx.fillRect(0, 0, w, h);

  if (img) {
    if (slide.blur) {
      ctx.filter = `blur(${slide.blur * k}px)`;
      drawCover(ctx, img, w, h, slide.focus, 40 * k);
      ctx.filter = 'none';
    } else {
      drawCover(ctx, img, w, h, slide.focus);
    }
  }

  // ─── bố cục chữ ───
  const tone = mobile && slide.kind === 'step' ? COLORS.light : COLORS[slide.tone];
  const blocks: Block[] = [];
  let boxX = 0;
  let boxW = 0;
  let align: CanvasTextAlign = 'left';

  if (slide.kind === 'hero') {
    // phủ tối nhẹ ở nửa trên (chỗ đặt tiêu đề) để chữ trắng nổi, không làm mờ ảnh
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.62);
    g.addColorStop(0, 'rgba(40, 24, 18, 0.5)');
    g.addColorStop(1, 'rgba(40, 24, 18, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    align = 'center';
    boxW = Math.min(1000, cssW - 48);
    boxX = (cssW - boxW) / 2;
    const titleSize = Math.min(84, Math.max(40, cssW * 0.056));
    ctx.font = `400 ${titleSize * k}px ${fonts.display}`;
    const titleLines = wrap(ctx, slide.title, Math.min(boxW, titleSize * 13) * k);
    ctx.font = `300 ${19 * k}px ${fonts.body}`;
    const subLines = slide.body ? wrap(ctx, slide.body, Math.min(boxW, 19 * 32) * k) : [];
    blocks.push({ font: `400 ${titleSize}px ${fonts.display}`, color: '#FFFFFF', size: titleSize, lineHeight: 1.08, lines: titleLines, gapAfter: 16 });
    if (subLines.length) blocks.push({ font: `300 19px ${fonts.body}`, color: '#FFFFFF', size: 19, lineHeight: 1.5, lines: subLines, gapAfter: 0 });
  } else {
    if (mobile) {
      boxX = 16;
      boxW = cssW - 32;
      // bóng tối nhẹ ở đáy để chữ sáng đọc được khi đè lên người trong ảnh
      const g = ctx.createLinearGradient(0, h, 0, h * 0.5);
      g.addColorStop(0, 'rgba(40, 24, 18, 0.62)');
      g.addColorStop(1, 'rgba(40, 24, 18, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    } else {
      boxW = Math.min(420, cssW / 2 - 230);
      const margin = Math.max(24, cssW / 2 - 640);
      boxX = slide.side === 'left' ? margin : cssW - margin - boxW;

      // làm mờ nền phía có chữ, mép mờ tan dần vào giữa
      if (img) {
        const tmp = document.createElement('canvas');
        tmp.width = w;
        tmp.height = h;
        const t = tmp.getContext('2d')!;
        t.filter = `blur(${22 * k}px)`;
        drawCover(t, img, w, h, slide.focus, 60 * k);
        t.filter = 'none';
        t.globalCompositeOperation = 'destination-in';
        const edge = slide.side === 'left' ? (boxX + boxW + 60) * k : (boxX - 60) * k;
        const fade = 260 * k;
        const g = slide.side === 'left'
          ? t.createLinearGradient(edge, 0, edge + fade, 0)
          : t.createLinearGradient(edge, 0, edge - fade, 0);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        t.fillStyle = g;
        t.fillRect(0, 0, w, h);
        ctx.drawImage(tmp, 0, 0);
      }
    }
    const titleSize = mobile ? 24 : Math.min(46, Math.max(30, cssW * 0.032));
    const bodySize = mobile ? 15 : 18;
    if (slide.eyebrow) {
      blocks.push({ font: `500 14px ${fonts.body}`, color: tone.accent, size: 14, lineHeight: 1.4, lines: [slide.eyebrow.toUpperCase()], spacing: 1.7, gapAfter: mobile ? 8 : 14 });
    }
    ctx.font = `400 ${titleSize * k}px ${fonts.display}`;
    blocks.push({ font: `400 ${titleSize}px ${fonts.display}`, color: tone.title, size: titleSize, lineHeight: 1.1, lines: wrap(ctx, slide.title, boxW * k), gapAfter: mobile ? 8 : 14 });
    if (slide.body) {
      ctx.font = `300 ${bodySize * k}px ${fonts.body}`;
      blocks.push({ font: `300 ${bodySize}px ${fonts.body}`, color: tone.body, size: bodySize, lineHeight: 1.65, lines: wrap(ctx, slide.body, boxW * k), gapAfter: slide.note ? 8 : 0 });
    }
    if (slide.note) {
      blocks.push({ font: `500 ${bodySize}px ${fonts.body}`, color: tone.accent, size: bodySize, lineHeight: 1.5, lines: [slide.note], gapAfter: 0 });
    }
  }

  // ─── vẽ chữ ───
  const total = blocks.reduce((sum, b) => sum + b.lines.length * b.size * b.lineHeight + b.gapAfter, 0);
  let y: number;
  if (slide.kind === 'hero') {
    y = cssH * (mobile ? 0.12 : 0.15);
    if (slide.pill) {
      ctx.font = `400 ${14 * k}px ${fonts.body}`;
      const pw = ctx.measureText(slide.pill).width / k + 32;
      const ph = 34;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.roundRect((cssW - pw) / 2 * k, y * k, pw * k, ph * k, (ph / 2) * k);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slide.pill, (cssW / 2) * k, (y + ph / 2 + 1) * k);
      y += ph + 18;
    }
  } else {
    y = mobile ? cssH - 24 - total : cssH / 2 - total / 2;
  }

  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = slide.kind === 'hero' ? 'rgba(58, 42, 36, 0.4)' : tone.shadow;
  ctx.shadowBlur = 20 * k;
  const x = align === 'center' ? cssW / 2 : boxX;
  for (const b of blocks) {
    ctx.font = b.font.replace(/(\d+(\.\d+)?)px/, (_, n) => `${parseFloat(n) * k}px`);
    ctx.fillStyle = b.color;
    setSpacing(ctx, (b.spacing ?? 0) * k);
    const lh = b.size * b.lineHeight;
    for (const line of b.lines) {
      // đặt baseline cách đỉnh dòng khoảng 0.8 cỡ chữ
      ctx.fillText(line, x * k, (y + (lh - b.size) / 2 + b.size * 0.82) * k);
      y += lh;
    }
    y += b.gapAfter;
  }
  setSpacing(ctx, 0);
  ctx.restore();
}
