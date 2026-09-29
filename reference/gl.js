// WebGL2 pipeline, all but the last pass rendered once:
// ridge readback (mountain ridges to JS for the brush strokes) -> objects drawn -> scene (+ wetness map) -> ink diffusion along paper fibres (N iterations) -> watercolor filter -> per-frame water pass.
const HEADER = '#version 300 es\nprecision highp float;\n';
const VERT = HEADER + 'in vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

async function loadText(name) {
  const res = await fetch(`./shaders/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.text();
}

function program(gl, fragSrc, name) {
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`${name}: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.bindAttribLocation(p, 0, 'a');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`${name}: ${gl.getProgramInfoLog(p)}`);
  return { p, u: n => gl.getUniformLocation(p, n) };
}

function texture(gl, w, h, source, float = false) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (source) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  } else if (float) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }
  return tex;
}

// Render target with one or more colour attachments
function target(gl, w, h, count = 1, float = false) {
  const texs = Array.from({ length: count }, () => texture(gl, w, h, null, float));
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  texs.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
  gl.drawBuffers(texs.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer incomplete');
  return { tex: texs[0], texs, fb };
}

function bindTex(gl, prog, name, tex, unit) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(prog.u(name), unit);
}

const DIFFUSION_STEPS = 36;

// Ridge lines of every range, sampled every RIDGE_STEP design units: [{ y: Float32Array, h: Float32Array }]
const RIDGE_STEP = 2, RIDGE_SAMPLES = 1280 / RIDGE_STEP + 1;
function readRidges(gl, prog, layerCount) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, RIDGE_SAMPLES, layerCount, 0, gl.RGBA, gl.FLOAT, null);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
  gl.viewport(0, 0, RIDGE_SAMPLES, layerCount);
  gl.useProgram(prog.p);
  gl.uniform1f(prog.u('uStep'), RIDGE_STEP);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  const px = new Float32Array(RIDGE_SAMPLES * layerCount * 4);
  gl.readPixels(0, 0, RIDGE_SAMPLES, layerCount, gl.RGBA, gl.FLOAT, px);
  return Array.from({ length: layerCount }, (_, li) => ({
    step: RIDGE_STEP,
    y: Float32Array.from({ length: RIDGE_SAMPLES }, (_, i) => px[(li * RIDGE_SAMPLES + i) * 4]),
    h: Float32Array.from({ length: RIDGE_SAMPLES }, (_, i) => px[(li * RIDGE_SAMPLES + i) * 4 + 1]),
  }));
}

// build(ridges) draws the object layers once the ridge lines are known and returns { wash, lines } canvases
export async function createPainting(canvas, { width, height, layers, masses, moon, water = true, build }) {
  const moonU = moon ? [moon.x, moon.y, moon.r] : [0, 0, 0];
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) throw new Error('WebGL2 недоступен');
  // half-float targets keep the many small diffusion increments from being lost to 8-bit rounding
  const float = !!gl.getExtension('EXT_color_buffer_float');
  const [common, terrain, ridgeSrc, sceneSrc, diffuseSrc, paintSrc, finalSrc] = await Promise.all(
    ['common.glsl', 'terrain.glsl', 'ridge.frag', 'scene.frag', 'diffuse.frag', 'paint.frag', 'final.frag'].map(loadText));
  const ridge = program(gl, HEADER + common + terrain + ridgeSrc, 'ridge');
  const scene = program(gl, HEADER + common + terrain + sceneSrc, 'scene');
  const diffuse = program(gl, HEADER + common + diffuseSrc, 'diffuse');
  const paint = program(gl, HEADER + common + paintSrc, 'paint');
  const fin = program(gl, HEADER + common + finalSrc, 'final');

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.useProgram(ridge.p);
  gl.uniform4fv(ridge.u('uLayer'), layers.flat());
  gl.uniform4fv(ridge.u('uMass'), masses.flat());
  const ridges = float ? readRidges(gl, ridge, layers.length) : null;
  const { wash: objects, lines } = build(ridges);

  canvas.width = width; canvas.height = height;
  gl.viewport(0, 0, width, height);
  const objTex = texture(gl, width, height, objects);
  const lineTex = texture(gl, width, height, lines);
  const sceneT = target(gl, width, height, 2);                 // [colour + crest ink, wetness]
  const ping = [target(gl, width, height, 1, float), target(gl, width, height, 1, float)];
  const b = target(gl, width, height);

  gl.useProgram(scene.p);
  gl.uniform2f(scene.u('uRes'), width, height);
  gl.uniform4fv(scene.u('uLayer'), layers.flat());
  gl.uniform4fv(scene.u('uMass'), masses.flat());
  bindTex(gl, scene, 'uObjects', objTex, 0);
  gl.uniform3fv(scene.u('uMoon'), moonU);
  gl.uniform1f(scene.u('uWaterOn'), water ? 1 : 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, sceneT.fb);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // ink creeping through wet paper, preferring the fibre direction
  gl.useProgram(diffuse.p);
  gl.uniform2f(diffuse.u('uRes'), width, height);
  gl.uniform1f(diffuse.u('uStep'), width / 1280 * .8);
  bindTex(gl, diffuse, 'uWet', sceneT.texs[1], 1);
  let src = sceneT.texs[0];
  for (let i = 0; i < DIFFUSION_STEPS; i++) {
    const dst = ping[i % 2];
    bindTex(gl, diffuse, 'uSrc', src, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    src = dst.tex;
  }

  gl.useProgram(paint.p);
  gl.uniform2f(paint.u('uRes'), width, height);
  bindTex(gl, paint, 'uScene', sceneT.texs[0], 0);
  bindTex(gl, paint, 'uLines', lineTex, 1);
  bindTex(gl, paint, 'uObjects', objTex, 2);
  bindTex(gl, paint, 'uDiffused', src, 3);
  bindTex(gl, paint, 'uWet', sceneT.texs[1], 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(fin.p);
  gl.uniform2f(fin.u('uRes'), width, height);
  bindTex(gl, fin, 'uPaint', b.tex, 0);
  gl.uniform3fv(fin.u('uMoon'), moonU);
  gl.uniform1f(fin.u('uWaterOn'), water ? 1 : 0);
  const uTime = fin.u('uTime');
  return t => { gl.uniform1f(uTime, t); gl.drawArrays(gl.TRIANGLES, 0, 3); };
}
