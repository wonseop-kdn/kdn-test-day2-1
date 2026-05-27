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
    id: 'SS1', cx: 210, cy: 140, w: 162, h: 90,
    busY: 140, busX1: 148, busX2: 278,
    bays: [
      { cbId: 'CB_SS1_G1',  dsId: 'DS_SS1_G1',  cbPos: {x:165,y:162}, dsPos: {x:165,y:151}, exitPos: {x:165,y:185}, dir:'S', label:'G1',  type:'gen'  },
      { cbId: 'CB_SS1_L12', dsId: 'DS_SS1_L12', cbPos: {x:268,y:130}, dsPos: {x:256,y:130}, exitPos: {x:290,y:130}, dir:'E', label:'L12', type:'line' },
      { cbId: 'CB_SS1_L13', dsId: 'DS_SS1_L13', cbPos: {x:248,y:162}, dsPos: {x:248,y:151}, exitPos: {x:248,y:185}, dir:'S', label:'L13', type:'line' },
    ],
  },
  // ── SS2 (Bus 2, Load Hub) ──
  {
    id: 'SS2', cx: 668, cy: 140, w: 200, h: 90,
    busY: 140, busX1: 576, busX2: 760,
    bays: [
      { cbId: 'CB_SS2_LD2',  dsId: 'DS_SS2_LD2', cbPos: {x:612,y:162}, dsPos: {x:612,y:151}, exitPos: {x:612,y:185}, dir:'S', label:'LD2', type:'load' },
      { cbId: 'CB_SS2_L12',  dsId: 'DS_SS2_L12', cbPos: {x:590,y:130}, dsPos: {x:602,y:130}, exitPos: {x:568,y:130}, dir:'W', label:'L12', type:'line' },
      { cbId: 'CB_SS2_L23',  dsId: 'DS_SS2_L23', cbPos: {x:642,y:162}, dsPos: {x:642,y:151}, exitPos: {x:642,y:185}, dir:'S', label:'L23', type:'line' },
      { cbId: 'CB_SS2_L24',  dsId: 'DS_SS2_L24', cbPos: {x:676,y:162}, dsPos: {x:676,y:151}, exitPos: {x:676,y:185}, dir:'S', label:'L24', type:'line' },
      { cbId: 'CB_SS2_L25',  dsId: 'DS_SS2_L25', cbPos: {x:748,y:130}, dsPos: {x:736,y:130}, exitPos: {x:768,y:130}, dir:'E', label:'L25', type:'line' },
    ],
  },
  // ── SS3 (Bus 3, PV Gen) ──
  {
    id: 'SS3', cx: 210, cy: 473, w: 162, h: 90,
    busY: 473, busX1: 148, busX2: 278,
    bays: [
      { cbId: 'CB_SS3_G3',  dsId: 'DS_SS3_G3',  cbPos: {x:165,y:490}, dsPos: {x:165,y:500}, exitPos: {x:165,y:518}, dir:'S', label:'G3',  type:'gen'  },
      { cbId: 'CB_SS3_L13', dsId: 'DS_SS3_L13', cbPos: {x:205,y:456}, dsPos: {x:205,y:446}, exitPos: {x:205,y:428}, dir:'N', label:'L13', type:'line' },
      { cbId: 'CB_SS3_L23', dsId: 'DS_SS3_L23', cbPos: {x:243,y:456}, dsPos: {x:243,y:446}, exitPos: {x:243,y:428}, dir:'N', label:'L23', type:'line' },
      { cbId: 'CB_SS3_L34', dsId: 'DS_SS3_L34', cbPos: {x:268,y:463}, dsPos: {x:256,y:463}, exitPos: {x:290,y:463}, dir:'E', label:'L34', type:'line' },
    ],
  },
  // ── SS4 (Bus 4, Load) ──
  {
    id: 'SS4', cx: 503, cy: 473, w: 166, h: 90,
    busY: 473, busX1: 428, busX2: 580,
    bays: [
      { cbId: 'CB_SS4_LD4',  dsId: 'DS_SS4_LD4', cbPos: {x:472,y:490}, dsPos: {x:472,y:500}, exitPos: {x:472,y:518}, dir:'S', label:'LD4', type:'load' },
      { cbId: 'CB_SS4_L24',  dsId: 'DS_SS4_L24', cbPos: {x:508,y:456}, dsPos: {x:508,y:446}, exitPos: {x:508,y:428}, dir:'N', label:'L24', type:'line' },
      { cbId: 'CB_SS4_L34',  dsId: 'DS_SS4_L34', cbPos: {x:447,y:463}, dsPos: {x:459,y:463}, exitPos: {x:420,y:463}, dir:'W', label:'L34', type:'line' },
      { cbId: 'CB_SS4_L45',  dsId: 'DS_SS4_L45', cbPos: {x:568,y:485}, dsPos: {x:556,y:485}, exitPos: {x:586,y:485}, dir:'E', label:'L45', type:'line' },
    ],
  },
  // ── SS5 (Bus 5, Load) ──
  {
    id: 'SS5', cx: 828, cy: 313, w: 150, h: 90,
    busY: 313, busX1: 761, busX2: 895,
    bays: [
      { cbId: 'CB_SS5_LD5',  dsId: 'DS_SS5_LD5', cbPos: {x:875,y:330}, dsPos: {x:875,y:340}, exitPos: {x:875,y:358}, dir:'S', label:'LD5', type:'load' },
      { cbId: 'CB_SS5_L25',  dsId: 'DS_SS5_L25', cbPos: {x:808,y:296}, dsPos: {x:808,y:286}, exitPos: {x:808,y:268}, dir:'N', label:'L25', type:'line' },
      { cbId: 'CB_SS5_L45',  dsId: 'DS_SS5_L45', cbPos: {x:771,y:323}, dsPos: {x:783,y:323}, exitPos: {x:753,y:323}, dir:'W', label:'L45', type:'line' },
    ],
  },
];

// 선로 SVG 경로 (CB exitPos 사이를 잇는 직선/절선)
export const LINE_CFGS: LineCfg[] = [
  {
    branchId: 'L12',
    d: 'M 290,130 L 568,130',
    labelPos: { x: 429, y: 120 },
  },
  {
    branchId: 'L13',
    d: 'M 248,185 L 205,428',
    labelPos: { x: 218, y: 307 },
  },
  {
    branchId: 'L23',
    d: 'M 642,185 L 243,428',
    labelPos: { x: 442, y: 295 },
  },
  {
    branchId: 'L24',
    d: 'M 676,185 L 508,428',
    labelPos: { x: 602, y: 295 },
  },
  {
    branchId: 'L25',
    d: 'M 768,130 L 808,268',
    labelPos: { x: 800, y: 198 },
  },
  {
    branchId: 'L34',
    d: 'M 290,463 L 420,463',
    labelPos: { x: 355, y: 452 },
  },
  {
    branchId: 'L45',
    d: 'M 586,485 L 753,323',
    labelPos: { x: 680, y: 410 },
  },
];
