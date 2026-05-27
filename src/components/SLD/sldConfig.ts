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
// 레이아웃:
//   상단 행 (busY≈140): SS1 좌측 · SS2 우측
//   하단 행 (busY≈470): SS3 좌측(SS1 동일 열) · SS4 중앙
//   우측 중앙 (busY≈305): SS5
// ─────────────────────────────────────────────────────────────────────────────

export const SUBSTATION_CFGS: SubstationCfg[] = [
  // ── SS1 (Bus 1, Slack) ── 상단 좌측
  {
    id: 'SS1', cx: 195, cy: 140, w: 155, h: 85,
    busY: 140, busX1: 118, busX2: 273,
    bays: [
      { cbId: 'CB_SS1_G1',  dsId: 'DS_SS1_G1',  cbPos: {x:150,y:160}, dsPos: {x:150,y:172}, exitPos: {x:150,y:198}, dir:'S', label:'G1',  type:'gen'  },
      { cbId: 'CB_SS1_L12', dsId: 'DS_SS1_L12', cbPos: {x:260,y:128}, dsPos: {x:271,y:128}, exitPos: {x:290,y:128}, dir:'E', label:'L12', type:'line' },
      { cbId: 'CB_SS1_L13', dsId: 'DS_SS1_L13', cbPos: {x:222,y:160}, dsPos: {x:222,y:172}, exitPos: {x:222,y:198}, dir:'S', label:'L13', type:'line' },
    ],
  },
  // ── SS2 (Bus 2, Load Hub) ── 상단 우측
  {
    id: 'SS2', cx: 650, cy: 140, w: 220, h: 85,
    busY: 140, busX1: 540, busX2: 760,
    bays: [
      { cbId: 'CB_SS2_LD2',  dsId: 'DS_SS2_LD2', cbPos: {x:590,y:160}, dsPos: {x:590,y:172}, exitPos: {x:590,y:198}, dir:'S', label:'LD2', type:'load' },
      { cbId: 'CB_SS2_L12',  dsId: 'DS_SS2_L12', cbPos: {x:553,y:128}, dsPos: {x:542,y:128}, exitPos: {x:524,y:128}, dir:'W', label:'L12', type:'line' },
      { cbId: 'CB_SS2_L23',  dsId: 'DS_SS2_L23', cbPos: {x:630,y:160}, dsPos: {x:630,y:172}, exitPos: {x:630,y:198}, dir:'S', label:'L23', type:'line' },
      { cbId: 'CB_SS2_L24',  dsId: 'DS_SS2_L24', cbPos: {x:668,y:160}, dsPos: {x:668,y:172}, exitPos: {x:668,y:198}, dir:'S', label:'L24', type:'line' },
      { cbId: 'CB_SS2_L25',  dsId: 'DS_SS2_L25', cbPos: {x:747,y:128}, dsPos: {x:758,y:128}, exitPos: {x:777,y:128}, dir:'E', label:'L25', type:'line' },
    ],
  },
  // ── SS3 (Bus 3, PV Gen) ── 하단 좌측 (SS1과 동일 열)
  {
    id: 'SS3', cx: 195, cy: 470, w: 165, h: 85,
    busY: 470, busX1: 113, busX2: 278,
    bays: [
      { cbId: 'CB_SS3_G3',  dsId: 'DS_SS3_G3',  cbPos: {x:148,y:490}, dsPos: {x:148,y:502}, exitPos: {x:148,y:527}, dir:'S', label:'G3',  type:'gen'  },
      { cbId: 'CB_SS3_L13', dsId: 'DS_SS3_L13', cbPos: {x:185,y:452}, dsPos: {x:185,y:440}, exitPos: {x:185,y:420}, dir:'N', label:'L13', type:'line' },
      { cbId: 'CB_SS3_L23', dsId: 'DS_SS3_L23', cbPos: {x:222,y:452}, dsPos: {x:222,y:440}, exitPos: {x:222,y:420}, dir:'N', label:'L23', type:'line' },
      { cbId: 'CB_SS3_L34', dsId: 'DS_SS3_L34', cbPos: {x:265,y:460}, dsPos: {x:276,y:460}, exitPos: {x:296,y:460}, dir:'E', label:'L34', type:'line' },
    ],
  },
  // ── SS4 (Bus 4, Load) ── 하단 중앙
  {
    id: 'SS4', cx: 510, cy: 470, w: 160, h: 85,
    busY: 470, busX1: 430, busX2: 590,
    bays: [
      { cbId: 'CB_SS4_LD4',  dsId: 'DS_SS4_LD4', cbPos: {x:480,y:490}, dsPos: {x:480,y:502}, exitPos: {x:480,y:527}, dir:'S', label:'LD4', type:'load' },
      { cbId: 'CB_SS4_L24',  dsId: 'DS_SS4_L24', cbPos: {x:512,y:452}, dsPos: {x:512,y:440}, exitPos: {x:512,y:420}, dir:'N', label:'L24', type:'line' },
      { cbId: 'CB_SS4_L34',  dsId: 'DS_SS4_L34', cbPos: {x:443,y:460}, dsPos: {x:432,y:460}, exitPos: {x:413,y:460}, dir:'W', label:'L34', type:'line' },
      { cbId: 'CB_SS4_L45',  dsId: 'DS_SS4_L45', cbPos: {x:577,y:460}, dsPos: {x:588,y:460}, exitPos: {x:608,y:460}, dir:'E', label:'L45', type:'line' },
    ],
  },
  // ── SS5 (Bus 5, Load) ── 우측 중앙
  {
    id: 'SS5', cx: 870, cy: 305, w: 145, h: 85,
    busY: 305, busX1: 798, busX2: 943,
    bays: [
      { cbId: 'CB_SS5_LD5',  dsId: 'DS_SS5_LD5', cbPos: {x:920,y:325}, dsPos: {x:920,y:337}, exitPos: {x:920,y:362}, dir:'S', label:'LD5', type:'load' },
      { cbId: 'CB_SS5_L25',  dsId: 'DS_SS5_L25', cbPos: {x:830,y:287}, dsPos: {x:830,y:275}, exitPos: {x:830,y:255}, dir:'N', label:'L25', type:'line' },
      { cbId: 'CB_SS5_L45',  dsId: 'DS_SS5_L45', cbPos: {x:811,y:295}, dsPos: {x:800,y:295}, exitPos: {x:782,y:295}, dir:'W', label:'L45', type:'line' },
    ],
  },
];

// 선로 SVG 경로 (bay exitPos 사이를 잇는 선)
export const LINE_CFGS: LineCfg[] = [
  {
    branchId: 'L12',
    d: 'M 290,128 L 524,128',   // 수평 (SS1→SS2)
    labelPos: { x: 407, y: 114 },
  },
  {
    branchId: 'L13',
    d: 'M 222,198 L 185,420',   // 거의 수직 (SS1→SS3)
    labelPos: { x: 168, y: 312 },
  },
  {
    branchId: 'L23',
    d: 'M 630,198 L 222,420',   // 대각 (SS2→SS3)
    labelPos: { x: 393, y: 276 },
  },
  {
    branchId: 'L24',
    d: 'M 668,198 L 512,420',   // 대각 (SS2→SS4)
    labelPos: { x: 627, y: 276 },
  },
  {
    branchId: 'L25',
    d: 'M 777,128 L 830,255',   // 단거리 대각 (SS2→SS5)
    labelPos: { x: 833, y: 188 },
  },
  {
    branchId: 'L34',
    d: 'M 296,460 L 413,460',   // 수평 (SS3→SS4)
    labelPos: { x: 355, y: 447 },
  },
  {
    branchId: 'L45',
    d: 'M 608,460 L 782,295',   // 대각 (SS4→SS5)
    labelPos: { x: 712, y: 390 },
  },
];
