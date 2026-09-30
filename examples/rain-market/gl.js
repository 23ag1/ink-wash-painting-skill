// WebGL2 plumbing for this painting: compile, half-float targets, the once-only passes
// (scene → fibre diffusion → watercolor/ink) and the per-frame pass (steam + rain).

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0., 1.); }`;

async function loadText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cannot load ${url}: ${res.status}`);
  return res.text();
}

function compile(gl, type, src, name) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(`${name}: ${gl.getShaderInfoLog(sh)}`);
  return sh;
}

async function program(gl, common, file) {
  const body = await loadText(`shaders/${file}`);
  const src = `#version 300 es\nprecision highp float;\n${common}\n${body}`;
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT, 'vert'));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, src, file));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`${file}: ${gl.getProgramInfoLog(p)}`);
  return p;
}

function texture(gl, w, h, internal, format, type) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
    [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  return t;
}

function canvasTexture(gl, canvas) {
  const t = texture(gl, 1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  return t;
}

function target(gl, textures) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  textures.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
  gl.drawBuffers(textures.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer incomplete');
  return fb;
}

function draw(gl, prog, fb, w, h, textures, uniforms = {}) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.viewport(0, 0, w, h);
  gl.useProgram(prog);
  Object.entries(textures).forEach(([name, tex], i) => {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(prog, name), i);
  });
  gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), w, h);
  for (const [name, v] of Object.entries(uniforms)) {
    const loc = gl.getUniformLocation(prog, name);
    if (typeof v === 'number') gl.uniform1f(loc, v);
    else if (v.length === 2) gl.uniform2fv(loc, v);
    else gl.uniform3fv(loc, v);            // vec3 arrays (steam sources) are passed flat
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// layers: { wash, wet, ink, depth } canvases at device resolution
export async function paint(canvas, layers, { steam = [], diffusionSteps = 36 } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL2 is not available');
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float is not available');
  const W = canvas.width, H = canvas.height;

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const common = await loadText('shaders/common.glsl');
  const [pScene, pDiffuse, pPaint, pFinal] = await Promise.all(
    ['scene.frag', 'diffuse.frag', 'paint.frag', 'final.frag'].map(f => program(gl, common, f)));

  const tex = Object.fromEntries(Object.entries(layers).map(([k, c]) => [k, canvasTexture(gl, c)]));
  const half = () => texture(gl, W, H, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
  const colA = half(), colB = half(), wet = half();
  const painted = texture(gl, W, H, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);

  draw(gl, pScene, target(gl, [colA, wet]), W, H, { uWash: tex.wash, uWetC: tex.wet, uDepth: tex.depth });

  const fbA = target(gl, [colA]), fbB = target(gl, [colB]);
  let src = colA, dst = colB, fbDst = fbB;
  const step = W / 640 * .8;
  for (let i = 0; i < diffusionSteps; i++) {
    draw(gl, pDiffuse, fbDst, W, H, { uSrc: src, uWet: wet }, { uStep: step });
    [src, dst] = [dst, src];
    fbDst = fbDst === fbA ? fbB : fbA;
  }
  draw(gl, pPaint, target(gl, [painted]), W, H,
    { uScene: colA, uDiffused: src, uWet: wet, uLines: tex.ink, uDepth: tex.depth });

  const steamFlat = new Float32Array(24);
  steam.slice(0, 8).forEach((s, i) => steamFlat.set(s, i * 3));
  const t0 = performance.now();
  const frame = now => {
    draw(gl, pFinal, null, W, H, { uPainted: painted, uDepth: tex.depth },
      { uTime: (now - t0) / 1000, 'uSteam[0]': steamFlat, uSteamN: Math.min(8, steam.length) });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
