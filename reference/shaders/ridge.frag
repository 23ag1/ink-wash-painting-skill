// Ridge readback: one texel per (x sample, layer) -> ridge screen y and ridge height, read back to JS so the
// brush-stroke pass (contours, texture strokes, moss dots) can paint exactly on the shader's mountains.
uniform float uStep;   // design units between x samples
out vec4 fragColor;

void main() {
  int li = int(gl_FragCoord.y);
  float x = floor(gl_FragCoord.x) * uStep;
  vec2 w = ridgeWarp(li, x);
  fragColor = vec4(ridgeY(li, x), ridgeH(li, x + w.x), 0., 1.);
}
