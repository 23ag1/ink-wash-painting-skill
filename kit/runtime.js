// Ink-wash kit runtime: the WebGL2 mechanics only — programs with #include, textures, render targets, a draw
// call, ping-pong, read-back. It makes no decision about how a painting looks: no passes, no order, no defaults.
//
//   const rt = await createRuntime(canvas);
//   const p = await rt.program('shaders/paint.frag');          // '#include "kit/wash.glsl"' etc. resolved
//   const t = rt.texture(w, h, { type: 'rgba16f' });
//   rt.draw(p, { to: rt.target([t]), size: [w, h], tex: { uSrc: other }, u: { uStep: 1.6 } });
//
// Strict uniforms: draw() throws if a uniform the shader uses was not given. GL would silently use 0, and a
// forgotten parameter would quietly become a "default look".

const VERT = '#version 300 es\nin vec2 aPos;\nvoid main() { gl_Position = vec4(aPos, 0., 1.); }';
const HEADER = '#version 300 es\nprecision highp float;\n';
const KIT_BASE = new URL('.', import.meta.url);

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cannot load ${url}: HTTP ${res.status}`);
  return res.text();
}

// '#include "kit/x.glsl"' → <kit>/glsl/x.glsl; '#include "kit/passes/y.frag"' → <kit>/passes/y.frag;
// any other path is relative to the including file. Each file is included once.
function resolveInclude(path, from) {
  if (path.startsWith('kit/')) {
    const rest = path.slice(4);
    return new URL(rest.includes('/') ? rest : `glsl/${rest}`, KIT_BASE).href;
  }
  return new URL(path, from).href;
}

async function expand(url, seen) {
  if (seen.has(url)) return '';
  seen.add(url);
  const lines = (await fetchText(url)).split('\n');
  const out = [];
  for (const line of lines) {
    const m = /^\s*#include\s+"([^"]+)"/.exec(line);
    out.push(m ? await expand(resolveInclude(m[1], url), seen) : line);
  }
  return out.join('\n');
}

const TYPES = {
  rgba8: ['RGBA8', 'RGBA', 'UNSIGNED_BYTE'],
  rgba16f: ['RGBA16F', 'RGBA', 'HALF_FLOAT'],
  rgba32f: ['RGBA32F', 'RGBA', 'FLOAT'],
};

export async function createRuntime(canvas, glOptions = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, ...glOptions });
  if (!gl) throw new Error('WebGL2 is not available');
  // float render targets: needed for diffusion (many tiny increments) and float read-back
  const float = !!gl.getExtension('EXT_color_buffer_float');

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const compile = (type, src, name) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`${name}: ${gl.getShaderInfoLog(s)}`);
    return s;
  };

  // fragment shader from a URL (relative to the page), with includes expanded
  async function program(url) {
    const href = new URL(url, document.baseURI).href;
    const src = HEADER + await expand(href, new Set());
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT, 'vertex'));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, src, url));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`${url}: ${gl.getProgramInfoLog(p)}`);
    const uniforms = new Map();
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      const name = info.name.replace(/\[0\]$/, '');
      uniforms.set(name, { loc: gl.getUniformLocation(p, info.name), type: info.type, size: info.size });
    }
    return { p, url, uniforms };
  }

  function texture(w, h, { type = 'rgba8', source = null, data = null } = {}) {
    if (type !== 'rgba8' && !float) throw new Error(`${type} targets need EXT_color_buffer_float`);
    const [internal, format, kind] = TYPES[type].map(k => gl[k]);
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    const filter = type === 'rgba32f' ? gl.NEAREST : gl.LINEAR;
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, filter], [gl.TEXTURE_MAG_FILTER, filter],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    if (source) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, format, kind, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, kind, data);   // data: a typed array (e.g. a skeleton)
    }
    return t;
  }

  // a canvas (or image) as a straight-alpha texture, y flipped to GL convention
  const fromCanvas = c => texture(c.width, c.height, { source: c });

  function target(textures) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    textures.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    gl.drawBuffers(textures.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer incomplete');
    return fb;
  }

  function setUniform({ loc, type, size }, v, name) {
    const a = typeof v === 'number' ? [v] : Array.from(v);
    switch (type) {
      case gl.FLOAT: return size > 1 ? gl.uniform1fv(loc, a) : gl.uniform1f(loc, a[0]);
      case gl.FLOAT_VEC2: return gl.uniform2fv(loc, a);
      case gl.FLOAT_VEC3: return gl.uniform3fv(loc, a);
      case gl.FLOAT_VEC4: return gl.uniform4fv(loc, a);
      case gl.INT: case gl.BOOL: return size > 1 ? gl.uniform1iv(loc, a) : gl.uniform1i(loc, a[0]);
      default: throw new Error(`uniform ${name}: unsupported type 0x${type.toString(16)}`);
    }
  }

  // One full-screen pass. `to` = framebuffer from target() or null (the canvas). `uRes` is set automatically.
  function draw(prog, { to = null, size, tex = {}, u = {} }) {
    const [w, h] = size;
    gl.bindFramebuffer(gl.FRAMEBUFFER, to);
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog.p);
    const given = new Set(['uRes']);
    let unit = 0;
    for (const [name, t] of Object.entries(tex)) {
      const info = prog.uniforms.get(name);
      if (!info) continue;                       // optimised away by the compiler
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.uniform1i(info.loc, unit++);
      given.add(name);
    }
    if (prog.uniforms.has('uRes')) gl.uniform2f(prog.uniforms.get('uRes').loc, w, h);
    for (const [name, v] of Object.entries(u)) {
      const info = prog.uniforms.get(name.replace(/\[0\]$/, ''));
      if (!info) continue;
      setUniform(info, v, name);
      given.add(name.replace(/\[0\]$/, ''));
    }
    const missing = [...prog.uniforms.keys()].filter(n => !given.has(n));
    if (missing.length) throw new Error(`${prog.url}: uniforms not set: ${missing.join(', ')}`);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Run `prog` n times, feeding its output back in as `srcName`. Returns the texture holding the result.
  function pingpong(prog, src, n, { size, type, srcName = 'uSrc', tex = {}, u = {} }) {
    const bufs = [texture(size[0], size[1], { type }), texture(size[0], size[1], { type })];
    const fbs = bufs.map(t => target([t]));
    let cur = src;
    for (let i = 0; i < n; i++) {
      draw(prog, { to: fbs[i % 2], size, tex: { ...tex, [srcName]: cur }, u });
      cur = bufs[i % 2];
    }
    return cur;
  }

  // Read a framebuffer back: Uint8Array (rgba8) or Float32Array (float targets), rows bottom-up.
  function read(fb, w, h, { float: asFloat = false } = {}) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const px = asFloat ? new Float32Array(w * h * 4) : new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, asFloat ? gl.FLOAT : gl.UNSIGNED_BYTE, px);
    return px;
  }

  return { gl, float, program, texture, fromCanvas, target, draw, pingpong, read };
}
