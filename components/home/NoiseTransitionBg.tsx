'use client';

import { useEffect, useRef, useState } from 'react';
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
  index: number;
}

const DURATION = 1400;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Chuyển ảnh bằng mặt nạ noise mượt (fbm): ảnh mới loang ra theo mảng hữu cơ, mép mềm.
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
void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  float n = fbm(vec2(uv.x * aspect, uv.y) * 2.1 + uSeed);
  float p = uP * 1.3 - 0.15;
  float mask = 1.0 - smoothstep(p - 0.12, p + 0.12, n);
  float edge = 1.0 - abs(mask * 2.0 - 1.0);
  vec2 warp = (vec2(fbm(uv * 3.0 + uSeed + 7.0), fbm(uv * 3.0 + uSeed + 3.0)) - 0.5) * edge * 0.045;
  vec3 a = tex(uA, cover(uv + warp, uSizeA, uFocusA), uSizeA, uBlurA);
  vec3 b = tex(uB, cover(uv - warp, uSizeB, uFocusB), uSizeB, uBlurB);
  vec3 col = mix(a, b, mask);
  col += vec3(0.91, 0.31, 0.23) * edge * 0.10;
  gl_FragColor = vec4(col, 1.0);
}
`;

function parseFocus(focus: string): [number, number] {
  const [x = '50%', y = '50%'] = focus.split(/\s+/);
  // trục y của texture đã lật, nên đảo lại focus dọc
  return [parseFloat(x) / 100, 1 - parseFloat(y) / 100];
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function NoiseTransitionBg({ slides, index }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);
  const indexRef = useRef(index);
  const apiRef = useRef<{ go: (i: number) => void } | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (reduce || !canvas || !gl) {
      setFallback(true);
      return;
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
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    let from = indexRef.current;
    let to = indexRef.current;
    let start = 0;
    let raf = 0;
    let seed = Math.random() * 10;

    const draw = (p: number) => {
      gl.uniform2f(u('uRes'), canvas.width, canvas.height);
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
      gl.uniform1f(u('uSeed'), seed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      draw(ease(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        from = to;
        raf = 0;
      }
    };

    const go = (i: number) => {
      if (i === to) return;
      // đang chuyển dở thì lấy ảnh đích hiện tại làm điểm xuất phát mới
      from = raf ? to : from;
      if (raf) cancelAnimationFrame(raf);
      to = i;
      seed = Math.random() * 10;
      start = performance.now();
      raf = requestAnimationFrame(tick);
    };
    apiRef.current = { go };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (!raf) draw(from === to ? 0 : 1);
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
        if (!raf) draw(0);
      };
      img.src = slide.src;
    });
    resize();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      apiRef.current = null;
      textures.forEach(t => gl.deleteTexture(t));
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
    // slides cố định trong suốt vòng đời trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    indexRef.current = index;
    apiRef.current?.go(index);
  }, [index]);

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
              opacity: i === index ? 1 : 0,
              filter: slide.blur ? `blur(${slide.blur}px)` : undefined,
            }}
          />
        ))}
      </div>
    );
  }

  return <canvas ref={canvasRef} className={s.bgCanvas} aria-hidden="true" />;
}
