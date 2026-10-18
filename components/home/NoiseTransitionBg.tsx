'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import s from './home.module.css';

export interface BgSlide {
  src: string;
  /** object-position kiểu CSS, ví dụ "70% 40%" */
  focus: string;
  /** độ mờ (px) áp lên ảnh, dùng cho nền hero */
  blur?: number;
  alt: string;
}

interface Props {
  slides: BgSlide[];
  /** Vị trí cuộn liên tục tính theo số bước (0 = hero, 5 = bước cuối). Đọc qua ref để không render lại React mỗi khung hình. */
  positionRef: MutableRefObject<number>;
  /** Báo bước đang hiển thị (đã làm mượt) để chữ và màn hình điện thoại đổi đồng bộ với ảnh nền */
  onStepChange: (step: number) => void;
}

/** Trong mỗi đoạn cuộn: giữ ảnh ở đầu đoạn, chuyển trong khoảng HOLD..END */
const HOLD = 0.12;
const END = 0.95;
/** Hệ số làm mượt theo quán tính (càng nhỏ càng trễ, càng mượt) */
const SMOOTH = 0.09;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Ảnh mới dâng từ dưới lên theo mặt nạ noise; ở vùng ranh giới ảnh vỡ thành khối pixel + dither (kiểu Lama Lama).
const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uRes;
uniform vec2 uSizeA;
uniform vec2 uSizeB;
uniform vec2 uFocusA;
uniform vec2 uFocusB;
uniform float uBlurA;
uniform float uBlurB;
uniform float uP;
uniform float uSeed;
uniform float uTime;
uniform float uDpr;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}
// ma trận Bayer 4x4 cho dither có trật tự
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
vec2 cover(vec2 uv, vec2 size, vec2 focus) {
  float rs = uRes.x / uRes.y; float ri = size.x / size.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return uv * scale + (1.0 - scale) * focus;
}
vec3 tex(sampler2D t, vec2 uv, vec2 size, float blur) {
  if (blur < 0.5) return texture2D(t, uv).rgb;
  vec2 px = blur / size;
  vec3 c = vec3(0.0);
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      c += texture2D(t, uv + vec2(float(x), float(y)) * px * 0.5).rgb;
    }
  }
  return c / 25.0;
}
float fieldAt(vec2 uv) {
  float aspect = uRes.x / uRes.y;
  float n = fbm(vec2(uv.x * aspect, uv.y) * 2.1 + vec2(0.0, -uTime * 0.35) + uSeed);
  return uv.y * 0.7 + (n - 0.5) * 0.5 + 0.25;
}
void main() {
  vec2 uv = vUv;
  float p = uP * 1.34 - 0.08;
  float intensity = sin(3.14159 * uP);

  // dải ranh giới rộng (để quyết định độ vỡ pixel)
  float wide = 1.0 - smoothstep(p - 0.32, p + 0.32, fieldAt(uv));
  float band = 1.0 - abs(wide * 2.0 - 1.0);

  // kích thước khối pixel: to nhất ở giữa quá trình và sát ranh giới
  float block = max(1.0, floor((2.0 + 30.0 * band * band) * intensity) * uDpr);
  vec2 cell = floor(uv * uRes / block);
  vec2 uvq = (cell + 0.5) * block / uRes;

  float f = fieldAt(uvq);
  float soft = 1.0 - smoothstep(p - 0.11, p + 0.11, f);
  // dither theo lưới khối: mép ranh giới thành răng cưa pixel
  float mask = step(bayer4(cell), soft);
  mask = mix(soft, mask, smoothstep(0.02, 0.2, intensity));

  vec3 a = tex(uA, cover(uvq, uSizeA, uFocusA), uSizeA, uBlurA);
  vec3 b = tex(uB, cover(uvq, uSizeB, uFocusB), uSizeB, uBlurB);
  vec3 col = mix(a, b, mask);

  // vệt quét ngang mảnh ở ranh giới, ánh coral nhẹ
  float scan = step(0.5, fract(gl_FragCoord.y / (3.0 * uDpr)));
  col += vec3(0.91, 0.31, 0.23) * band * intensity * 0.10;
  col *= 1.0 - band * intensity * 0.06 * scan;
  gl_FragColor = vec4(col, 1.0);
}
`;

function parseFocus(focus: string): [number, number] {
  const [x = '50%', y = '50%'] = focus.split(/\s+/);
  // trục y của texture đã lật, nên đảo lại focus dọc
  return [parseFloat(x) / 100, 1 - parseFloat(y) / 100];
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Từ vị trí liên tục -> cặp ảnh đang chuyển và tiến độ 0..1 */
export function segment(pos: number, count: number) {
  const max = count - 1;
  const clamped = Math.min(max, Math.max(0, pos));
  const from = Math.min(max - 1, Math.floor(clamped));
  const p = clamped >= max ? 1 : smoothstep(HOLD, END, clamped - from);
  return { from, to: from + 1, p, step: p > 0.5 ? from + 1 : from };
}

export function NoiseTransitionBg({ slides, positionRef, onStepChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);
  const [fallbackStep, setFallbackStep] = useState(0);
  const onStepRef = useRef(onStepChange);
  useEffect(() => {
    onStepRef.current = onStepChange;
  }, [onStepChange]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { antialias: false, premultipliedAlpha: false });

    let lastStep = -1;
    const reportStep = (step: number) => {
      if (step !== lastStep) {
        lastStep = step;
        onStepRef.current(step);
      }
    };

    if (reduce || !canvas || !gl) {
      setFallback(true);
      let raf = 0;
      const loop = () => {
        const st = Math.round(Math.min(slides.length - 1, Math.max(0, positionRef.current)));
        setFallbackStep(st);
        reportStep(st);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFallback(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    gl.uniform1i(u('uA'), 0);
    gl.uniform1i(u('uB'), 1);

    const textures = slides.map(() => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([242, 237, 230, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    });
    const sizes: [number, number][] = slides.map(() => [1, 1]);
    const seeds = slides.map((_, i) => i * 3.7 + 1.3);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    let dpr = 1;
    let shown = positionRef.current;
    let dirty = true;
    let raf = 0;

    const draw = () => {
      const { from, to, p, step } = segment(shown, slides.length);
      gl.uniform2f(u('uRes'), canvas.width, canvas.height);
      gl.uniform1f(u('uDpr'), dpr);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[from]);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[to]);
      gl.uniform2f(u('uSizeA'), sizes[from][0], sizes[from][1]);
      gl.uniform2f(u('uSizeB'), sizes[to][0], sizes[to][1]);
      gl.uniform2fv(u('uFocusA'), parseFocus(slides[from].focus));
      gl.uniform2fv(u('uFocusB'), parseFocus(slides[to].focus));
      gl.uniform1f(u('uBlurA'), slides[from].blur ?? 0);
      gl.uniform1f(u('uBlurB'), slides[to].blur ?? 0);
      gl.uniform1f(u('uP'), p);
      gl.uniform1f(u('uSeed'), seeds[from]);
      gl.uniform1f(u('uTime'), p);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      reportStep(step);
    };

    // vòng lặp: bám theo vị trí cuộn với quán tính, chỉ vẽ khi có thay đổi
    const loop = () => {
      const target = positionRef.current;
      const diff = target - shown;
      if (Math.abs(diff) > 0.0004) {
        shown += diff * SMOOTH;
        dirty = true;
      } else if (shown !== target) {
        shown = target;
        dirty = true;
      }
      if (dirty) {
        draw();
        dirty = false;
      }
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let disposed = false;
    slides.forEach((slide, i) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        // ảnh tải xong sau khi effect đã dọn (StrictMode chạy effect 2 lần) thì bỏ qua
        if (disposed) return;
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        sizes[i] = [img.naturalWidth, img.naturalHeight];
        dirty = true;
      };
      img.src = slide.src;
    });
    resize();
    raf = requestAnimationFrame(loop);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      textures.forEach(t => gl.deleteTexture(t));
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
    // slides cố định trong suốt vòng đời trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fallback) {
    return (
      <div className={s.bgLayers} aria-hidden="true">
        {slides.map((slide, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.src}
            src={slide.src}
            alt=""
            className={s.bgImg}
            style={{
              objectPosition: slide.focus,
              opacity: i === fallbackStep ? 1 : 0,
              filter: slide.blur ? `blur(${slide.blur}px)` : undefined,
            }}
          />
        ))}
      </div>
    );
  }

  return <canvas ref={canvasRef} className={s.bgCanvas} aria-hidden="true" />;
}
