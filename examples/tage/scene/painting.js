// 踏歌 — after Ma Yuan's "Singing and Dancing" (踏歌图). The whole picture, far → near.
// Brief: 神 = a festive morning: towering rock sentinels, a palace lost in mist, farmers dancing home on the
// paddy ridge. Vertical scroll (立轴), 高远 above the mist band, 平远 below it. Host: the axe-cut slabs upper
// left; guests: the pine grove and the far pinnacles right; void: the mist band and the sky upper right, ≈45%.
// Darkest: the near boulders and the willow; palest: far pinnacles and mist. Only colour: the seal.
import { slabPeak, farPinnacle } from './peaks.js';
import { boulder, massRock, facetRock } from './rocks.js';
import { pine, willow, bareTree, pollardWillow } from './trees.js';
import { palace, ground, figure, poem, reeds } from './details.js';
import { poly, glaze, occlude, dissolve } from './layers.js';
import { rng } from '../../../kit/brush/brush.js';
import { blob } from '../../../kit/brush/ink.js';
import { hairyStroke } from '../../../kit/brush/hairy.js';

// study mode: one rock, large and alone, to compare with the master's at the same size
export const STUDY_ROCK = {
  outline: [[70, 540], [190, 452], [330, 440], [446, 482], [526, 574], [546, 712], [508, 830], [300, 866], [96, 856], [56, 712], [70, 540]],
  faces: [
    { poly: [[70, 540], [190, 452], [330, 440], [446, 482], [400, 528], [262, 552], [140, 584]], tone: .08, dir: .25, chop: [60, 16] },
    { poly: [[70, 540], [140, 584], [262, 552], [306, 706], [292, 866], [96, 856], [56, 712]], tone: .9, dir: 1.3, chop: [70, 34] },
    { poly: [[262, 552], [400, 528], [446, 482], [526, 574], [546, 712], [508, 830], [292, 866], [306, 706]], tone: .55, dir: 1.05, chop: [64, 30] },
  ],
  breaks: [[[140, 584], [262, 552], [400, 528], [446, 482]], [[262, 552], [290, 640], [306, 706], [298, 800]]],
  depth: .1, seed: 77, base: 866,
};
export function paintStudy(c) { facetRock(c, STUDY_ROCK, false); }

export function paintScene(c, notan) {
  // far pinnacles right, in the sky above the mist
  farPinnacle(c, { left: [[478, 470], [476, 360], [480, 270], [492, 212]], right: [[530, 470], [526, 350], [512, 262], [498, 205]], depth: .9, seed: 5, base: [330, 450] }, notan);
  farPinnacle(c, { left: [[448, 470], [450, 330], [458, 262]], right: [[474, 470], [472, 320], [464, 258]], depth: .92, seed: 6, base: [320, 430] }, notan);
  farPinnacle(c, { left: [[522, 480], [528, 380], [536, 318]], right: [[560, 480], [552, 370], [542, 312]], depth: .93, seed: 7, base: [380, 470] }, notan);

  // the host group, back to front: a pale cliff cropped by the left edge, a pale slab behind, the two great slabs
  slabPeak(c, { left: [[-10, 700], [-8, 400], [0, 260], [14, 215]], right: [[72, 700], [70, 470], [62, 330], [40, 228], [20, 212]], shadow: 'right', depth: .62, tone: .25, size: .9, seed: 11, base: [520, 690] }, notan);
  slabPeak(c, { left: [[40, 660], [44, 420], [52, 260], [62, 180]], right: [[118, 660], [112, 430], [96, 270], [76, 176]], shadow: 'right', depth: .55, tone: .25, size: .8, seed: 12, base: [480, 650] }, notan);
  slabPeak(c, { left: [[78, 680], [76, 520], [84, 360], [94, 230], [104, 128], [110, 98]], right: [[192, 680], [186, 500], [172, 340], [152, 210], [134, 116], [122, 96]], shadow: 'right', depth: .45, tone: .6, size: 1.2, seed: 13, base: [520, 680] }, notan);
  slabPeak(c, { left: [[160, 650], [158, 470], [164, 340], [170, 262]], right: [[262, 650], [256, 480], [244, 350], [226, 258], [198, 246]], shadow: 'right', depth: .42, tone: .5, size: 1, seed: 14, base: [480, 640] }, notan);
  // pines on the second slab's top
  for (const [x, y, h, lean, s] of [[178, 268, 62, .05, 41], [196, 262, 78, -.04, 42], [216, 266, 58, .1, 43], [114, 104, 34, .08, 44], [60, 190, 30, -.1, 45]]) pine(c, { x, y, h, lean, depth: .42, tone: .75, bare: .3, seed: s }, notan);

  // the palace roofs in the mist, behind the grove
  palace(c, [[520, 410, 84, 30, .66], [462, 436, 58, 22, .7], [578, 444, 50, 18, .74]], notan);

  // the grove rising out of the mist band: tall pines in front of the palace, smaller ones to the left
  const grove = [[352, 600, 150, .06, 51, .58], [398, 590, 190, -.03, 52, .55], [440, 600, 160, .08, 53, .56], [470, 610, 120, -.05, 54, .6],
    [300, 610, 110, .05, 55, .62], [262, 616, 86, -.06, 56, .66], [228, 620, 70, .04, 57, .68], [330, 612, 92, -.02, 58, .64], [420, 606, 120, .02, 59, .6], [372, 606, 100, -.07, 60, .62], [500, 616, 90, .05, 61, .64]];
  for (const [x, y, h, lean, s, d] of grove) pine(c, { x, y, h, lean, depth: d, tone: 1.35 - d, bare: .35, seed: s }, notan);
  if (!notan) {
    // the grove rises OUT of the mist: its lower part melts away along an uneven line (each tree a little
    // different), and a faint, soft tone lingers under the crowns — a light fade, not a ground
    const r = rng(35);
    const wave = Array.from({ length: 22 }, (_, i) => [190 + i * 20, 560 + r() * 26]);
    c.l.save(); c.l.globalCompositeOperation = 'destination-out'; c.l.filter = `blur(${10 * c.S}px)`;
    c.l.fillStyle = '#000'; c.l.fill(poly([...wave, [610, 660], [190, 660]])); c.l.restore();
    c.d.save(); c.d.filter = `blur(${16 * c.S}px)`; c.d.fillStyle = 'rgb(150,150,150)';
    c.d.fill(poly([...wave.map(([x, y]) => [x, y - 10]), [610, 618], [190, 618]])); c.d.restore();
    c.w.save(); c.w.globalCompositeOperation = 'multiply'; c.w.filter = `blur(${10 * c.S}px)`;
    const gr = c.w.createLinearGradient(0, 556, 0, 622); gr.addColorStop(0, 'rgba(120,122,104,.22)'); gr.addColorStop(1, 'rgba(160,160,140,0)');
    c.w.fillStyle = gr; c.w.fill(poly([...wave.map(([x, y]) => [x, y - 14]), [610, 622], [190, 622]])); c.w.restore();
  }

  // near ground: the boulders bottom left, a bare tree on them, the path, the willow, the dancers
  ground(c, [[0, 962], [60, 958], [120, 950], [190, 962], [250, 978], [300, 994], [360, 1012], [420, 1022], [470, 1026], [560, 1018], [640, 1012]], [[0, 1004], [70, 998], [140, 994], [200, 1006], [262, 1022], [310, 1044], [362, 1062], [420, 1072], [480, 1078], [560, 1070], [640, 1064]], notan);
  // the near rocks: two great rounded boulders with a dark cleft between them, sunk in their ground shadow
  facetRock(c, {
    outline: [[0, 690], [60, 676], [160, 688], [244, 738], [290, 822], [282, 910], [180, 934], [0, 944], [0, 690]],
    faces: [
      { poly: [[0, 690], [60, 676], [160, 688], [244, 738], [196, 752], [104, 736], [0, 748]], tone: .2, dir: .35, chop: [50, 18] },
      { poly: [[0, 748], [104, 736], [196, 752], [244, 738], [290, 822], [282, 910], [180, 934], [0, 944]], tone: .85, dir: 1.3, chop: [70, 30] },
    ],
    breaks: [[[0, 748], [104, 736], [196, 752], [244, 738]], [[150, 744], [166, 820], [160, 930]]], depth: .12, seed: 69, base: 938,
  }, notan);
  facetRock(c, {
    outline: [[214, 874], [262, 846], [312, 850], [344, 882], [350, 920], [326, 948], [250, 952], [220, 926], [214, 874]],
    faces: [
      { poly: [[214, 874], [262, 846], [312, 850], [344, 882], [300, 880], [250, 888]], tone: .2, dir: .3, chop: [36, 14] },
      { poly: [[214, 874], [250, 888], [300, 880], [344, 882], [350, 920], [326, 948], [250, 952], [220, 926]], tone: .7, dir: 1.4, chop: [50, 24] },
    ],
    breaks: [[[214, 874], [250, 888], [300, 880], [344, 882]]], depth: .1, seed: 72, base: 950,
  }, notan);
  bareTree(c, { x: 90, y: 696, ang: -1.75, len: 80, seed: 81 }, notan);
  bareTree(c, { x: 168, y: 728, ang: -1.2, len: 64, seed: 82 }, notan);
  reeds(c, [[470, 1000, 22], [500, 992, 14], [40, 950, 16]], notan);
  pollardWillow(c, {
    // after Ma Yuan: the trunk leans in from the right edge with a crook, forks at a knot into two stems that
    // leave the frame upward, and one long branch arches out over the path
    trunk: [[672, 968], [644, 930], [614, 884], [592, 834], [574, 792], [564, 772]], trunkW: [48, 28],
    stems: [
      { axis: [[568, 800], [554, 750], [545, 700], [546, 640], [540, 570], [535, 480], [532, 400]], w: [18, 3] },
      { axis: [[572, 800], [567, 750], [574, 700], [580, 650], [589, 590], [596, 530]], w: [18, 2.5] },
    ],
    branches: [[544, 758, Math.PI + .38, 250, 5.5], [550, 772, Math.PI + .12, 150, 3.6]],
    seed: 91,
  }, notan);
  if (!notan) {
    figure(c, 300, 1006, 1.6, { lean: .3, arms: [[12, -14], [-9, 4]], kick: .4 }, 101);
    figure(c, 352, 1024, 1.55, { lean: -.25, arms: [[-12, -12], [8, 2]], kick: 1 }, 102);
    figure(c, 408, 1036, 1.6, { lean: .15, arms: [[11, -8], [-10, -6]], kick: .2 }, 103);
    figure(c, 462, 1040, 1.5, { lean: .4, arms: [[-6, 6]], kick: .1, staff: true }, 104);
    figure(c, 46, 978, 1.4, { lean: .5, arms: [[-6, 6]], kick: .2, staff: true }, 105);
    poem(c, [
      { text: '宿雨清畿甸', x: 604, y: 46 }, { text: '朝阳丽帝城', x: 566, y: 46 },
      { text: '丰年人乐业', x: 528, y: 46 }, { text: '垅上踏歌行', x: 490, y: 46 },
    ], { x: 176, y: 70, size: 30, chars: ['踏', '歌', '马', '远'] });
  }
}
