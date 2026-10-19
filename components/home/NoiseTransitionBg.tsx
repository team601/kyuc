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
const MAX_TEX = 2200;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Khung mới dâng từ dưới lên theo mặt nạ noise. Trong lúc chuyển: cả khung mờ dần, vùng ranh giới vỡ khối pixel
// theo lưới cố định (cỡ khối luỹ thừa 2 nên các khối luôn thẳng hàng), mép có dither và vệt quét mảnh.
const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uRes;
uniform float uP;
uniform float uSeed;
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
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

float fieldAt(vec2 uv) {
  float aspect = uRes.x / uRes.y;
  float n = fbm(vec2(uv.x * aspect, uv.y) * 2.1 + vec2(0.0, -uP * 0.35) + uSeed);
  return uv.y * 0.7 + (n - 0.5) * 0.5 + 0.25;
}
vec3 blurred(sampler2D t, vec2 uv, float radius) {
  if (radius < 0.75) return texture2D(t, uv).rgb;
  vec2 px = radius / uRes;
  vec3 c = vec3(0.0);
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      c += texture2D(t, uv + vec2(float(x), float(y)) * px * 0.5).rgb;
    }
  }
  return c / 25.0;
}
void main() {
  float p = uP * 1.34 - 0.08;
  float intensity = sin(3.14159 * uP);

  // chọn cỡ khối trên lưới thô 32px: cả ô thô dùng chung một cỡ, nên khối con luôn khớp lưới
  float coarse = 32.0 * uDpr;
  vec2 cellC = floor(gl_FragCoord.xy / coarse);
  vec2 uvC = (cellC + 0.5) * coarse / uRes;
  float wide = 1.0 - smoothstep(p - 0.3, p + 0.3, fieldAt(uvC));
  float band = 1.0 - abs(wide * 2.0 - 1.0);
  float level = floor(clamp(band * intensity * 1.15, 0.0, 1.0) * 5.0);
  float block = exp2(level) * uDpr;
  block = min(block, coarse);

  vec2 cell = floor(gl_FragCoord.xy / block);
  vec2 uvq = (cell + 0.5) * block / uRes;

  float soft = 1.0 - smoothstep(p - 0.11, p + 0.11, fieldAt(uvq));
  float dithered = step(bayer4(cell), soft);
  float mask = mix(soft, dithered, step(1.5 * uDpr, block));

  // cả khung mờ dần khi đang chuyển, rồi nét lại
  float radius = intensity * 14.0 * uDpr;
  vec3 a = blurred(uA, uvq, radius);
  vec3 b = blurred(uB, uvq, radius);
  vec3 col = mix(a, b, mask);

  float scan = step(0.5, fract(gl_FragCoord.y / (3.0 * uDpr)));
  col += vec3(0.91, 0.31, 0.23) * band * intensity * 0.08;
  col *= 1.0 - band * intensity * 0.05 * scan;
  gl_FragColor = vec4(col, 1.0);
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
