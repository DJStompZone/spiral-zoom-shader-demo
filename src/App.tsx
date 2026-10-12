import { useEffect, useRef, useState } from 'react';
import { shaderToySource } from './shader';

const vertexSource = `attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const colors = [
  { name: 'Coral', hex: '#ff506e' },
  { name: 'Amber', hex: '#ffa340' },
  { name: 'Citron', hex: '#e8e059' },
  { name: 'Mint', hex: '#42deae' },
  { name: 'Blue', hex: '#4daeff' },
  { name: 'Violet', hex: '#b86eff' },
];

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function ShaderCanvas({ playing }: { playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    const fragmentSource = `precision mediump float;\nuniform vec3 iResolution;\nuniform float iTime;\n${shaderToySource}\nvoid main() { mainImage(gl_FragColor, gl_FragCoord.xy); }`;
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader linking failed:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, 'iResolution');
    const time = gl.getUniformLocation(program, 'iTime');
    let frame = 0;
    let elapsed = 0;
    let lastFrame = performance.now();
    let lastDraw = 0;

    const resize = () => {
      // Lower internal resolution keeps the raymarch responsive on laptops.
      const scale = Math.min(window.devicePixelRatio || 1, 1) * 0.8;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const render = (now: number) => {
      const delta = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      if (playingRef.current && !document.hidden) elapsed += delta;
      if (playingRef.current && now - lastDraw >= 32 && !document.hidden) {
        gl.uniform3f(resolution, canvas.width, canvas.height, 1);
        gl.uniform1f(time, elapsed);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        lastDraw = now;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <canvas ref={canvasRef} className="shader-canvas" aria-label="Animated multicolored Voronoi shader" role="img" />;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

export default function App() {
  const [playing, setPlaying] = useState(true);
  const [copied, setCopied] = useState(false);

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(shaderToySource);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main>
      <section className="hero" id="top">
        <ShaderCanvas playing={playing} />
        <div className="hero-shade" />
        <header className="site-header">
          <a className="wordmark" href="#top" aria-label="Chroma home"><span className="mark" /> CHROMA<span className="wordmark-light"> / LAB</span></a>
          <span className="header-note">A SHADER STUDY <span>NO. 001</span></span>
        </header>

        <div className="hero-content">
          <p className="eyebrow"><span className="eyebrow-line" /> AN EXPERIMENT IN LIGHT</p>
          <h1>Color looks<br /><em>better</em> in motion.</h1>
          <p className="hero-description">A familiar pattern, reimagined with six unexpected hues. Watch the colors find their own way through the noise.</p>
          <a className="primary-link" href="#source">Explore the shader <ArrowIcon /></a>
        </div>

        <div className="hero-bottom">
          <span>GENERATIVE COLOR / WEBGL</span>
          <button className="motion-control" type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause animation' : 'Play animation'}>
            <span className={playing ? 'pause-symbol' : 'play-symbol'} />
            {playing ? 'PAUSE MOTION' : 'PLAY MOTION'}
          </button>
        </div>
      </section>

      <section className="palette-section" aria-labelledby="palette-title">
        <div className="section-kicker"><span>01 / THE PALETTE</span><span>SIX COLORS. NO GRADIENT.</span></div>
        <div className="palette-intro">
          <h2 id="palette-title">A spectrum with<br /><em>personality.</em></h2>
          <p>Instead of blending through a standard rainbow, each cell picks one color from a hand-selected palette. The result is a little less predictable, and a lot more alive.</p>
        </div>
        <div className="color-ribbon" aria-label="The six shader colors">
          {colors.map((color, index) => (
            <div className="color-swatch" key={color.name} style={{ backgroundColor: color.hex }}>
              <span>{String(index + 1).padStart(2, '0')} / {color.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="source-section" id="source" aria-labelledby="source-title">
        <div className="source-header">
          <div>
            <p className="section-label">02 / THE SOURCE</p>
            <h2 id="source-title">Take the color<br /><em>with you.</em></h2>
          </div>
          <p>The original structure, now with a distinct color assigned to every Voronoi cell. Copy the GLSL and paste it straight into a ShaderToy image pass.</p>
        </div>
        <div className="code-window">
          <div className="code-toolbar">
            <span><span className="code-dot" /> MULTICOLOR_VORONOI.GLSL</span>
            <button type="button" onClick={copySource} aria-live="polite">{copied ? 'COPIED TO CLIPBOARD' : 'COPY GLSL'} <span aria-hidden="true">{copied ? 'OK' : '↗'}</span></button>
          </div>
          <pre><code>{shaderToySource}</code></pre>
        </div>
        <footer className="footer"><a href="#top">CHROMA / LAB <span>↑</span></a><span>MADE TO MOVE. MADE TO SHARE.</span></footer>
      </section>
    </main>
  );
}
