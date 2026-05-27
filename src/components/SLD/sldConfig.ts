/** SVG 좌표 설정 – IEEE 5-Bus 단선도 레이아웃 */

export interface BayCfg {
  cbId: string;
  dsId: string;
  cbPos: { x: number; y: number };
  dsPos: { x: number; y: number };
  exitPos: { x: number; y: number };
  dir: 'N' | 'S' | 'E' | 'W';
  label: string;
  type: 'gen' | 'load' | 'line';
}

export interface SubstationCfg {
  id: string;
  cx: number; cy: number;
  w: number; h: number;
  busY: number; busX1: number; busX2: number;
  bays: BayCfg[];
}

export interface LineCfg {
  branchId: string;
  d: string;              // SVG path
  labelPos: { x: number; y: number };
}

// ─────────────────────────────────────────────────────────────────────────────

export const SUBSTATION_CFGS: SubstationCfg[] = [
  // ── SS1 (Bus 1, Slack) ──
  {
    id: 'SS1', cx: 195, cy: 135, w: 162, h: 90,
    busY: 135, busX1: 114, busX2: 276,
    bays: [
      { cbId: 'CB_SS1_G1',  dsId: 'DS_SS1_G1',  cbPos: {x:150,y:157}, dsPos: {x:150,y:146}, exitPos: {x:150,y:180}, dir:'S', label:'G1',  type:'gen'  },
      { cbId: 'CB_SS1_L12', dsId: 'DS_SS1_L12', cbPos: {x:264,y:125}, dsPos: {x:252,y:125}, exitPos: {x:286,y:125}, dir:'E', label:'L12', type:'line' },
      { cbId: 'CB_SS1_L13', dsId: 'DS_SS1_L13', cbPos: {x:235,y:157}, dsPos: {x:235,y:146}, exitPos: {x:235,y:180}, dir:'S', label:'L13', type:'line' },
    ],
  },
  // ── SS2 (Bus 2, Load Hub) ──
  {
    id: 'SS2', cx: 668, cy: 130, w: 210, h: 90,
    busY: 130, busX1: 563, busX2: 773,
    bays: [
      { cbId: 'CB_SS2_LD2',  dsId: 'DS_SS2_LD2', cbPos: {x:612,y:152}, dsPos: {x:612,y:141}, exitPos: {x:612,y:175}, dir:'S', label:'LD2', type:'load' },
      { cbId: 'CB_SS2_L12',  dsId: 'DS_SS2_L12', cbPos: {x:583,y:120}, dsPos: {x:595,y:120}, exitPos: {x:561,y:120}, dir:'W', label:'L12', type:'line' },
      { cbId: 'CB_SS2_L23',  dsId: 'DS_SS2_L23', cbPos: {x:642,y:152}, dsPos: {x:642,y:141}, exitPos: {x:642,y:175}, dir:'S', label:'L23', type:'line' },
      { cbId: 'CB_SS2_L24',  dsId: 'DS_SS2_L24', cbPos: {x:676,y:152}, dsPos: {x:676,y:141}, exitPos: {x:676,y:175}, dir:'S', label:'L24', type:'line' },
      { cbId: 'CB_SS2_L25',  dsId: 'DS_SS2_L25', cbPos: {x:761,y:120}, dsPos: {x:749,y:120}, exitPos: {x:781,y:120}, dir:'E', label:'L25', type:'line' },
    ],
  },
  // ── SS3 (Bus 3, PV Gen) ──
  {
    id: 'SS3', cx: 195, cy: 480, w: 162, h: 95,
    busY: 480, busX1: 114, busX2: 276,
    bays: [
      { cbId: 'CB_SS3_G3',  dsId: 'DS_SS3_G3',  cbPos: {x:150,y:497}, dsPos: {x:150,y:507}, exitPos: {x:150,y:525}, dir:'S', label:'G3',  type:'gen'  },
      { cbId: 'CB_SS3_L13', dsId: 'DS_SS3_L13', cbPos: {x:190,y:463}, dsPos: {x:190,y:453}, exitPos: {x:190,y:435}, dir:'N', label:'L13', type:'line' },
      { cbId: 'CB_SS3_L23', dsId: 'DS_SS3_L23', cbPos: {x:228,y:463}, dsPos: {x:228,y:453}, exitPos: {x:228,y:435}, dir:'N', label:'L23', type:'line' },
      { cbId: 'CB_SS3_L34', dsId: 'DS_SS3_L34', cbPos: {x:264,y:470}, dsPos: {x:252,y:470}, exitPos: {x:286,y:470}, dir:'E', label:'L34', type:'line' },
    ],
  },
  // ── SS4 (Bus 4, Load) ──
  {
    id: 'SS4', cx: 510, cy: 480, w: 166, h: 90,
    busY: 480, busX1: 427, busX2: 593,
    bays: [
      { cbId: 'CB_SS4_LD4',  dsId: 'DS_SS4_LD4', cbPos: {x:479,y:497}, dsPos: {x:479,y:507}, exitPos: {x:479,y:525}, dir:'S', label:'LD4', type:'load' },
      { cbId: 'CB_SS4_L24',  dsId: 'DS_SS4_L24', cbPos: {x:515,y:463}, dsPos: {x:515,y:453}, exitPos: {x:515,y:435}, dir:'N', label:'L24', type:'line' },
      { cbId: 'CB_SS4_L34',  dsId: 'DS_SS4_L34', cbPos: {x:447,y:470}, dsPos: {x:459,y:470}, exitPos: {x:420,y:470}, dir:'W', label:'L34', type:'line' },
      { cbId: 'CB_SS4_L45',  dsId: 'DS_SS4_L45', cbPos: {x:581,y:490}, dsPos: {x:569,y:490}, exitPos: {x:599,y:490}, dir:'E', label:'L45', type:'line' },
    ],
  },
  // ── SS5 (Bus 5, Load) ──
  {
    id: 'SS5', cx: 835, cy: 310, w: 150, h: 90,
    busY: 310, busX1: 760, busX2: 910,
    bays: [
      { cbId: 'CB_SS5_LD5',  dsId: 'DS_SS5_LD5', cbPos: {x:882,y:327}, dsPos: {x:882,y:337}, exitPos: {x:882,y:355}, dir:'S', label:'LD5', type:'load' },
      { cbId: 'CB_SS5_L25',  dsId: 'DS_SS5_L25', cbPos: {x:800,y:293}, dsPos: {x:800,y:283}, exitPos: {x:800,y:265}, dir:'N', label:'L25', type:'line' },
      { cbId: 'CB_SS5_L45',  dsId: 'DS_SS5_L45', cbPos: {x:772,y:320}, dsPos: {x:784,y:320}, exitPos: {x:754,y:320}, dir:'W', label:'L45', type:'line' },
    ],
  },
];

// 선로 SVG 경로 (CB exitPos 사이를 잇는 직선/절선)
export const LINE_CFGS: LineCfg[] = [
  {
    branchId: 'L12',
    d: 'M 286,125 L 561,120',
    labelPos: { x: 424, y: 112 },
  },
  {
    branchId: 'L13',
    d: 'M 235,180 L 190,435',
    labelPos: { x: 155, y: 310 },
  },
  {
    branchId: 'L23',
    d: 'M 642,175 L 228,435',
    labelPos: { x: 400, y: 270 },
  },
  {
    branchId: 'L24',
    d: 'M 676,175 L 515,435',
    labelPos: { x: 640, y: 270 },
  },
  {
    branchId: 'L25',
    d: 'M 781,120 L 800,265',
    labelPos: { x: 808, y: 192 },
  },
  {
    branchId: 'L34',
    d: 'M 286,470 L 420,470',
    labelPos: { x: 355, y: 440 },
  },
  {
    branchId: 'L45',
    d: 'M 599,490 L 754,320',
    labelPos: { x: 688, y: 412 },
  },
];
