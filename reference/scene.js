// The whole painting described in one place. Change the picture here; the engine modules only draw.
// Design space: 1280 × 720, y down. The waterline is fixed at y = 540 (WATER in shaders/common.glsl).
// Deterministic: every element takes a seed; the same SCENE always paints the same picture.

export const SCENE = {
  // Moon: untouched paper with a wash around it (烘云托月), a glitter path on the water below. null = no moon.
  moon: { x: 860, y: 190, r: 60 },

  // River below the waterline (y 540): reflections, glints, drifting mist on the water. false = land continues down.
  water: true,

  // Mountain ranges, far -> near: [baseY, depth 1 (far) .. 0 (near), seed, unused]. The last one is the low bank
  // at the water (base > 540). Only ranges with depth < .7 carry brushwork (contour, texture strokes, moss).
  layers: [
    [468, 1.0, 1.3, 0],
    [484, .82, 2.7, 0],
    [498, .64, 4.1, 0],
    [510, .46, 5.9, 0],
    [522, .3, 7.3, 0],
    [534, .15, 8.8, 0],
    [556, 0, 10.1, 0],
  ],
  // Four mountain masses per range: [centerX, height, halfWidthLeft, halfWidthRight]; [0,0,1,1] = unused slot.
  // Host massif (主峰) on the left behind the pavilion, a quieter guest group (宾) on the right, the centre open (开).
  masses: [
    [520, 110, 220, 240], [720, 92, 150, 170], [900, 70, 140, 160], [1090, 120, 200, 180],
    [400, 150, 200, 220], [1130, 165, 180, 170], [0, 0, 1, 1], [0, 0, 1, 1],
    [225, 215, 200, 230], [990, 105, 130, 140], [0, 0, 1, 1], [0, 0, 1, 1],
    [60, 140, 170, 170], [470, 72, 120, 130], [0, 0, 1, 1], [0, 0, 1, 1],
    [340, 95, 70, 80], [1235, 95, 100, 110], [0, 0, 1, 1], [0, 0, 1, 1],
    [30, 60, 140, 160], [640, 22, 150, 150], [1190, 50, 200, 160], [0, 0, 1, 1],
    [250, 20, 200, 190], [900, 12, 80, 90], [1130, 14, 150, 160], [0, 0, 1, 1],
  ],

  // Three-tier waterside pavilion (house.js), drawn in its own coords around its deck and scaled. null = none.
  pavilion: { anchor: [266, 541], scale: 1.35 },
  // River banks beside the pavilion (shore.js): top edge points + waterline y. [] = none.
  banks: [
    { top: [[-12, 526], [22, 524], [58, 529], [96, 531], [128, 535], [150, 541]], water: 548 },
    { top: [[440, 541], [462, 536], [492, 533], [524, 535], [556, 540], [590, 545]], water: 549 },
  ],
  // Trees standing on the banks (flora.js). kind: 'pine' | 'broadleaf'.
  trees: [
    { kind: 'pine', x: 92, y: 548, s: 1.05, seed: 7 },
    { kind: 'broadleaf', x: 128, y: 548, s: .8, seed: 9 },
    { kind: 'broadleaf', x: 492, y: 544, s: 1.1, seed: 6 },
    { kind: 'broadleaf', x: 34, y: 546, s: .85, seed: 4 },
  ],
  // Reed clumps at the shoreline: [x0, x1, y].
  reeds: [[512, 566, 546], [1010, 1070, 548]],

  // Lone fisherman's sampan (boat.js), drawn around x ≈ 580-780 and shifted by dx. Put it in the moon path. null = none.
  boat: { dx: 210 },

  // Plum branch (plum.js) entering from an edge: origin, heading, length; blossoms keep inside `bounds`
  // (x/y ranges) and out of the title box `avoid` = [xMin, yMin]. A second shoot grows from `shoot`. null = none.
  plum: {
    seed: 11, from: [1292, 44], angle: Math.PI - .32, length: 330, width: 9,
    shoot: { from: [1250, 58], angle: Math.PI + .75, length: 120 },
    bounds: { x: [800, 1280], y: [-10, 290] }, avoid: [1115, 205],
  },

  // Far plane (distance.js): rows of distant trees [x0, x1, y], a pagoda on a ridge, a distant sail, ripples.
  distance: {
    treeRows: [[372, 470, 537], [560, 640, 538], [700, 760, 537], [960, 1040, 536]],
    pagoda: { layer: 2, x: 990 },                // stands on the crest of that range near x
    sail: [606, 552],
    ripples: [[150, 420, 560, 4], [170, 400, 572, 3], [300, 520, 600, 2], [620, 760, 640, 2], [980, 1100, 590, 2], [1000, 1160, 612, 2]],
  },

  // Near ground: reed shallow in the lower-left corner (foreground.js). false = none.
  foreground: true,

  // Title: vertical brush calligraphy + one seal. The only writing on the painting. null = none.
  title: { text: '月满中秋', x: 1180, y: 262, size: 96, step: 90, seal: { x: 1110, y: 482, size: 30, chars: ['中', '秋', '月', '圆'] } },

  // Light animation (the painting itself is static): geese crossing, petals falling from the plum branch.
  geese: true,
  petals: true,
};
