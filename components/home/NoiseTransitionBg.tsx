'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { composeSlide, type ComposeFonts, type StageSlide } from './composeSlide';
import s from './home.module.css';

interface Props {
  slides: StageSlide[];
  /** Vị trí cuộn liên tục tính theo số bước (0 = hero, 5 = bước cuối). Đọc qua ref để không render lại React mỗi khung hình. */
  positionRef: MutableRefObject<number>;
  /** Báo bước đang hiển thị (đã làm mượt) để màn hình điện thoại đổi đồng bộ với ảnh nền */
  onStepChange: (step: number) => void;
}

/** Trong mỗi đoạn cuộn: giữ khung ở đầu đoạn, chuyển trong khoảng HOLD..END */
const HOLD = 0.12;
const END = 0.95;
/** Hệ số làm mượt theo quán tính (càng nhỏ càng trễ, càng mượt) */
const SMOOTH = 0.09;
/** Giới hạn độ phân giải texture để tiết kiệm bộ nhớ GPU */
const MAX_TEX = 3200;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Kiểu pixel của lamalama.com, theo cách site Align làm (Align Website Claude 2026/site/js/main.js):
// không phóng to khối, mà là các CHẤM 2px cố định. Thứ tự lật theo một trường noise mượt dạng mây
// (2 tầng, 170px và 55px) trộn với thiên hướng từ đáy lên; trong dải chuyển, mỗi chấm tự lật theo
// ma trận Bayer 8x8 so với gradient, nên mép là dải chấm dither thưa -> dày qua 64 nấc.
// Không có noise trôi: chỉ chuyển động khi cuộn. Trong lúc chuyển cả khung mờ dần.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uRes;
uniform float uP;
uniform float uSeed;
uniform float uDpr;

const float BAND = 0.2;
const float DOT = 2.0;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
// làm mờ mịn: 32 mẫu xếp theo xoắn ốc góc vàng, không bị vệt ô như box blur thưa
vec3 blurred(sampler2D t, vec2 uv, float radius) {
  if (radius < 0.75) return texture2D(t, uv).rgb;
  vec3 c = vec3(0.0);
  for (int i = 0; i < 32; i++) {
    float fi = float(i);
    float r = sqrt((fi + 0.5) / 32.0) * radius;
    float a = fi * 2.39996;
    c += texture2D(t, uv + vec2(cos(a), sin(a)) * r / uRes).rgb;
  }
  return c / 32.0;
}
void main() {

  // lưới chấm 2px (theo px CSS), gốc ở đáy màn hình
  float dotPx = DOT * uDpr;
  vec2 cell = floor(gl_FragCoord.xy / dotPx);
  vec2 css = (cell + 0.5) * DOT;            // tâm chấm, tính bằng px CSS
  vec2 cssRes = uRes / uDpr;

  // trường thứ tự: 0.42 * từ đáy lên + 0.58 * mây (2 tầng), như Align
  float u = css.y / cssRes.y;
  float n = 0.65 * noise(css / 170.0 + vec2(3.1, 7.7) + uSeed)
          + 0.35 * noise(css / 55.0 + vec2(11.3, 1.9) + uSeed);
  float val = 0.42 * u + 0.58 * n;
  float t = (1.0 - BAND) * val;

  float g = (uP - t) / BAND;
  float mask = (g >= 1.0 || (g > 0.0 && g > bayer8(cell))) ? 1.0 : 0.0;

  // khung đang rời đi: chỉ mờ mịn dần theo mức cuộn (chấm 2px chỉ dùng làm mặt nạ lật sang khung mới)
  vec3 a = blurred(uA, vUv, uP * 14.0 * uDpr);
  // khung đang hiện ra: luôn nét
  vec3 b = texture2D(uB, vUv).rgb;
  gl_FragColor = vec4(mix(a, b, mask), 1.0);
}
`;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Từ vị trí liên tục -> cặp khung đang chuyển và tiến độ 0..1 */
export function segment(pos: number, count: number) {
  const max = count - 1;
  const clamped = Math.min(max, Math.max(0, pos));
  const from = Math.min(max - 1, Math.floor(clamped));
  const p = clamped >= max ? 1 : smoothstep(HOLD, END, clamped - from);
  return { from, to: from + 1, p, step: p > 0.5 ? from + 1 : from };
}

function readFonts(): ComposeFonts {
  const cs = getComputedStyle(document.body);
  return {
    display: cs.getPropertyValue('--font-display').trim() || 'Georgia, serif',
    body: cs.getPropertyValue('--font-body').trim() || 'system-ui, sans-serif',
  };
}

export function NoiseTransitionBg({ slides, positionRef, onStepChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onStepRef = useRef(onStepChange);
  const slidesRef = useRef(slides);
  const recomposeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onStepRef.current = onStepChange;
  }, [onStepChange]);

  // đổi ngôn ngữ -> vẽ lại chữ trong các khung
  useEffect(() => {
    slidesRef.current = slides;
    recomposeRef.current?.();
  }, [slides]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = reduce ? null : canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    const count = slidesRef.current.length;

    let lastStep = -1;
    const reportStep = (step: number) => {
      if (step !== lastStep) {
        lastStep = step;
        onStepRef.current(step);
      }
    };

    // ─── ảnh nguồn ───
    const images: (HTMLImageElement | null)[] = slidesRef.current.map(() => null);
    const scratch = document.createElement('canvas');
    let scale = 1;
    let disposed = false;

    // ─── WebGL ───
    let textures: WebGLTexture[] = [];
    let prog: WebGLProgram | null = null;
    let buf: WebGLBuffer | null = null;
    const u = (name: string) => (gl && prog ? gl.getUniformLocation(prog, name) : null);

    if (gl) {
      const compile = (type: number, src: string) => {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        return sh;
      };
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) prog = null;
    }
    const useGl = !!(gl && prog);
    const ctx2d = useGl ? null : canvas.getContext('2d');

    if (useGl && gl && prog) {
      gl.useProgram(prog);
      buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1i(u('uA'), 0);
      gl.uniform1i(u('uB'), 1);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      textures = slidesRef.current.map(() => {
        const t = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([242, 237, 230, 255]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
      });
    }

    let shown = positionRef.current;
    let dirty = true;
    let raf = 0;
    let fonts = readFonts();

    const composeAll = () => {
      if (disposed) return;
      fonts = readFonts();
      scratch.width = canvas.width;
      scratch.height = canvas.height;
      if (!useGl || !gl) {
        dirty = true;
        return;
      }
      slidesRef.current.forEach((slide, i) => {
        composeSlide(scratch, slide, images[i], scale, fonts);
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
      });
      dirty = true;
    };
    recomposeRef.current = composeAll;

    const draw = () => {
      const { from, to, p, step } = segment(shown, count);
      if (useGl && gl) {
        gl.uniform2f(u('uRes'), canvas.width, canvas.height);
        gl.uniform1f(u('uDpr'), scale);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[from]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures[to]);
        gl.uniform1f(u('uP'), p);
        gl.uniform1f(u('uSeed'), from * 3.7 + 1.3);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      } else if (ctx2d) {
        // không có WebGL / giảm chuyển động: đổi khung tức thì
        composeSlide(canvas, slidesRef.current[step], images[step], scale, fonts);
      }
      reportStep(step);
    };

    // vòng lặp: bám theo vị trí cuộn với quán tính, chỉ vẽ khi có thay đổi
    const loop = () => {
      const target = positionRef.current;
      const diff = target - shown;
      if (reduce) {
        if (shown !== target) {
          shown = target;
          dirty = true;
        }
      } else if (Math.abs(diff) > 0.0004) {
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

    let resizeTimer = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      scale = Math.min(dpr, MAX_TEX / Math.max(cw, ch, 1));
      canvas.width = Math.round(cw * scale);
      canvas.height = Math.round(ch * scale);
      if (useGl && gl) gl.viewport(0, 0, canvas.width, canvas.height);
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(composeAll, 80);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    slidesRef.current.forEach((slide, i) => {
      if (!slide.src) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (disposed) return;
        images[i] = img;
        composeAll();
      };
      img.src = slide.src;
    });
    // vẽ lại chữ khi font web đã tải xong
    document.fonts?.ready.then(() => composeAll());
    resize();
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      recomposeRef.current = null;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      if (gl) {
        textures.forEach(t => gl.deleteTexture(t));
        if (prog) gl.deleteProgram(prog);
        if (buf) gl.deleteBuffer(buf);
      }
    };
    // khung hình và ảnh cố định trong suốt vòng đời trang; chữ cập nhật qua slidesRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={s.bgCanvas} aria-hidden="true" />;
}
