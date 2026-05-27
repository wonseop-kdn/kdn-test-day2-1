/**
 * IEEE 5-Bus System - Node-Breaker 상세 모델
 *
 * 원본: Bergen & Vittal "Power Systems Analysis" 5-Bus 벤치마크
 * 확장: 각 Bus → Substation (내부 Node + CB + DS 구성)
 * Base: 100 MVA, 345 kV
 *
 * 내부 배선 패턴 (Single-Busbar Scheme):
 *   [Equipment Terminal] ──[DS]──[CB]──[BusBar Node]
 */

import type {
  NetworkState,
  Substation,
  Branch,
  Generator,
  Load,
} from '../types/network';

// ─── 변전소 정의 ─────────────────────────────────────────────────────────────

const substations: Substation[] = [
  // ══════════════════════════════════════════════
  // SS1 – 154kV 기준모선 (Slack Bus / Generator G1)
  // 연결: G1(gen), L12(→SS2), L13(→SS3)
  // ══════════════════════════════════════════════
  {
    id: 'SS1',
    name: '북부변전소 (Bus 1)',
    shortName: 'SS1',
    busId: 1,
    voltageKV: 345,
    x: 220,
    y: 155,
    nodes: [
      { id: 'SS1_BUS',    substationId: 'SS1', name: 'Bus-1A',  isBusbar: true },
      { id: 'SS1_G1_T',   substationId: 'SS1', name: 'G1 Term', isBusbar: false },
      { id: 'SS1_L12_T',  substationId: 'SS1', name: 'L12 Term',isBusbar: false },
      { id: 'SS1_L13_T',  substationId: 'SS1', name: 'L13 Term',isBusbar: false },
    ],
    switches: [
      // G1 bay: G1_T ─[DS_G1]─[CB_G1]─ BUS
      { id: 'DS_SS1_G1',  substationId: 'SS1', name: 'DS-G1',  nodeFrom: 'SS1_G1_T',  nodeTo: 'SS1_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS1_G1',  substationId: 'SS1', name: 'CB-G1',  nodeFrom: 'SS1_G1_T',  nodeTo: 'SS1_BUS', type: 'CB', status: 'Closed', isControllable: true },
      // L12 bay: BUS ─[CB_L12]─[DS_L12]─ L12_T
      { id: 'DS_SS1_L12', substationId: 'SS1', name: 'DS-12',  nodeFrom: 'SS1_L12_T', nodeTo: 'SS1_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS1_L12', substationId: 'SS1', name: 'CB-12',  nodeFrom: 'SS1_L12_T', nodeTo: 'SS1_BUS', type: 'CB', status: 'Closed', isControllable: true },
      // L13 bay: BUS ─[CB_L13]─[DS_L13]─ L13_T
      { id: 'DS_SS1_L13', substationId: 'SS1', name: 'DS-13',  nodeFrom: 'SS1_L13_T', nodeTo: 'SS1_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS1_L13', substationId: 'SS1', name: 'CB-13',  nodeFrom: 'SS1_L13_T', nodeTo: 'SS1_BUS', type: 'CB', status: 'Closed', isControllable: true },
    ],
  },

  // ══════════════════════════════════════════════
  // SS2 – 중앙허브 변전소 (Load Bus 2)
  // 연결: LD2(load), L12(←SS1), L23(↔SS3), L24(→SS4), L25(→SS5)
  // ══════════════════════════════════════════════
  {
    id: 'SS2',
    name: '중앙변전소 (Bus 2)',
    shortName: 'SS2',
    busId: 2,
    voltageKV: 345,
    x: 670,
    y: 155,
    nodes: [
      { id: 'SS2_BUS',    substationId: 'SS2', name: 'Bus-2A',   isBusbar: true },
      { id: 'SS2_LD2_T',  substationId: 'SS2', name: 'LD2 Term', isBusbar: false },
      { id: 'SS2_L12_T',  substationId: 'SS2', name: 'L12 Term', isBusbar: false },
      { id: 'SS2_L23_T',  substationId: 'SS2', name: 'L23 Term', isBusbar: false },
      { id: 'SS2_L24_T',  substationId: 'SS2', name: 'L24 Term', isBusbar: false },
      { id: 'SS2_L25_T',  substationId: 'SS2', name: 'L25 Term', isBusbar: false },
    ],
    switches: [
      { id: 'DS_SS2_LD2',  substationId: 'SS2', name: 'DS-LD2', nodeFrom: 'SS2_LD2_T', nodeTo: 'SS2_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS2_LD2',  substationId: 'SS2', name: 'CB-LD2', nodeFrom: 'SS2_LD2_T', nodeTo: 'SS2_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS2_L12',  substationId: 'SS2', name: 'DS-12',  nodeFrom: 'SS2_L12_T', nodeTo: 'SS2_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS2_L12',  substationId: 'SS2', name: 'CB-12',  nodeFrom: 'SS2_L12_T', nodeTo: 'SS2_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS2_L23',  substationId: 'SS2', name: 'DS-23',  nodeFrom: 'SS2_L23_T', nodeTo: 'SS2_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS2_L23',  substationId: 'SS2', name: 'CB-23',  nodeFrom: 'SS2_L23_T', nodeTo: 'SS2_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS2_L24',  substationId: 'SS2', name: 'DS-24',  nodeFrom: 'SS2_L24_T', nodeTo: 'SS2_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS2_L24',  substationId: 'SS2', name: 'CB-24',  nodeFrom: 'SS2_L24_T', nodeTo: 'SS2_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS2_L25',  substationId: 'SS2', name: 'DS-25',  nodeFrom: 'SS2_L25_T', nodeTo: 'SS2_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS2_L25',  substationId: 'SS2', name: 'CB-25',  nodeFrom: 'SS2_L25_T', nodeTo: 'SS2_BUS', type: 'CB', status: 'Closed', isControllable: true },
    ],
  },

  // ══════════════════════════════════════════════
  // SS3 – 남서변전소 (PV Bus / Generator G3)
  // 연결: G3(gen), L13(←SS1), L23(←SS2), L34(→SS4)
  // ══════════════════════════════════════════════
  {
    id: 'SS3',
    name: '남서변전소 (Bus 3)',
    shortName: 'SS3',
    busId: 3,
    voltageKV: 345,
    x: 220,
    y: 490,
    nodes: [
      { id: 'SS3_BUS',   substationId: 'SS3', name: 'Bus-3A',  isBusbar: true },
      { id: 'SS3_G3_T',  substationId: 'SS3', name: 'G3 Term', isBusbar: false },
      { id: 'SS3_L13_T', substationId: 'SS3', name: 'L13 Term',isBusbar: false },
      { id: 'SS3_L23_T', substationId: 'SS3', name: 'L23 Term',isBusbar: false },
      { id: 'SS3_L34_T', substationId: 'SS3', name: 'L34 Term',isBusbar: false },
    ],
    switches: [
      { id: 'DS_SS3_G3',  substationId: 'SS3', name: 'DS-G3', nodeFrom: 'SS3_G3_T',  nodeTo: 'SS3_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS3_G3',  substationId: 'SS3', name: 'CB-G3', nodeFrom: 'SS3_G3_T',  nodeTo: 'SS3_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS3_L13', substationId: 'SS3', name: 'DS-13', nodeFrom: 'SS3_L13_T', nodeTo: 'SS3_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS3_L13', substationId: 'SS3', name: 'CB-13', nodeFrom: 'SS3_L13_T', nodeTo: 'SS3_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS3_L23', substationId: 'SS3', name: 'DS-23', nodeFrom: 'SS3_L23_T', nodeTo: 'SS3_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS3_L23', substationId: 'SS3', name: 'CB-23', nodeFrom: 'SS3_L23_T', nodeTo: 'SS3_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS3_L34', substationId: 'SS3', name: 'DS-34', nodeFrom: 'SS3_L34_T', nodeTo: 'SS3_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS3_L34', substationId: 'SS3', name: 'CB-34', nodeFrom: 'SS3_L34_T', nodeTo: 'SS3_BUS', type: 'CB', status: 'Closed', isControllable: true },
    ],
  },

  // ══════════════════════════════════════════════
  // SS4 – 동남변전소 (Load Bus 4)
  // 연결: LD4(load), L24(←SS2), L34(←SS3), L45(→SS5)
  // ══════════════════════════════════════════════
  {
    id: 'SS4',
    name: '동남변전소 (Bus 4)',
    shortName: 'SS4',
    busId: 4,
    voltageKV: 345,
    x: 500,
    y: 490,
    nodes: [
      { id: 'SS4_BUS',   substationId: 'SS4', name: 'Bus-4A',   isBusbar: true },
      { id: 'SS4_LD4_T', substationId: 'SS4', name: 'LD4 Term', isBusbar: false },
      { id: 'SS4_L24_T', substationId: 'SS4', name: 'L24 Term', isBusbar: false },
      { id: 'SS4_L34_T', substationId: 'SS4', name: 'L34 Term', isBusbar: false },
      { id: 'SS4_L45_T', substationId: 'SS4', name: 'L45 Term', isBusbar: false },
    ],
    switches: [
      { id: 'DS_SS4_LD4',  substationId: 'SS4', name: 'DS-LD4', nodeFrom: 'SS4_LD4_T', nodeTo: 'SS4_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS4_LD4',  substationId: 'SS4', name: 'CB-LD4', nodeFrom: 'SS4_LD4_T', nodeTo: 'SS4_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS4_L24',  substationId: 'SS4', name: 'DS-24',  nodeFrom: 'SS4_L24_T', nodeTo: 'SS4_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS4_L24',  substationId: 'SS4', name: 'CB-24',  nodeFrom: 'SS4_L24_T', nodeTo: 'SS4_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS4_L34',  substationId: 'SS4', name: 'DS-34',  nodeFrom: 'SS4_L34_T', nodeTo: 'SS4_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS4_L34',  substationId: 'SS4', name: 'CB-34',  nodeFrom: 'SS4_L34_T', nodeTo: 'SS4_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS4_L45',  substationId: 'SS4', name: 'DS-45',  nodeFrom: 'SS4_L45_T', nodeTo: 'SS4_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS4_L45',  substationId: 'SS4', name: 'CB-45',  nodeFrom: 'SS4_L45_T', nodeTo: 'SS4_BUS', type: 'CB', status: 'Closed', isControllable: true },
    ],
  },

  // ══════════════════════════════════════════════
  // SS5 – 동부변전소 (Load Bus 5)
  // 연결: LD5(load), L25(←SS2), L45(←SS4)
  // ══════════════════════════════════════════════
  {
    id: 'SS5',
    name: '동부변전소 (Bus 5)',
    shortName: 'SS5',
    busId: 5,
    voltageKV: 345,
    x: 820,
    y: 330,
    nodes: [
      { id: 'SS5_BUS',   substationId: 'SS5', name: 'Bus-5A',   isBusbar: true },
      { id: 'SS5_LD5_T', substationId: 'SS5', name: 'LD5 Term', isBusbar: false },
      { id: 'SS5_L25_T', substationId: 'SS5', name: 'L25 Term', isBusbar: false },
      { id: 'SS5_L45_T', substationId: 'SS5', name: 'L45 Term', isBusbar: false },
    ],
    switches: [
      { id: 'DS_SS5_LD5',  substationId: 'SS5', name: 'DS-LD5', nodeFrom: 'SS5_LD5_T', nodeTo: 'SS5_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS5_LD5',  substationId: 'SS5', name: 'CB-LD5', nodeFrom: 'SS5_LD5_T', nodeTo: 'SS5_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS5_L25',  substationId: 'SS5', name: 'DS-25',  nodeFrom: 'SS5_L25_T', nodeTo: 'SS5_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS5_L25',  substationId: 'SS5', name: 'CB-25',  nodeFrom: 'SS5_L25_T', nodeTo: 'SS5_BUS', type: 'CB', status: 'Closed', isControllable: true },
      { id: 'DS_SS5_L45',  substationId: 'SS5', name: 'DS-45',  nodeFrom: 'SS5_L45_T', nodeTo: 'SS5_BUS', type: 'DS', status: 'Closed', isControllable: false },
      { id: 'CB_SS5_L45',  substationId: 'SS5', name: 'CB-45',  nodeFrom: 'SS5_L45_T', nodeTo: 'SS5_BUS', type: 'CB', status: 'Closed', isControllable: true },
    ],
  },
];

// ─── 선로 정의 (100 MVA, 345 kV 기준) ────────────────────────────────────────
// 파라미터 출처: Bergen & Vittal "Power Systems Analysis" 5-Bus 시스템

const branches: Branch[] = [
  {
    id: 'L12', name: 'Line 1-2',
    nodeFromId: 'SS1_L12_T', nodeToId: 'SS2_L12_T',
    fromSubstationId: 'SS1', toSubstationId: 'SS2',
    r: 0.02,   x: 0.06,   b: 0.030, ratingMVA: 400, type: 'Line',
  },
  {
    id: 'L13', name: 'Line 1-3',
    nodeFromId: 'SS1_L13_T', nodeToId: 'SS3_L13_T',
    fromSubstationId: 'SS1', toSubstationId: 'SS3',
    r: 0.08,   x: 0.24,   b: 0.025, ratingMVA: 400, type: 'Line',
  },
  {
    id: 'L23', name: 'Line 2-3',
    nodeFromId: 'SS2_L23_T', nodeToId: 'SS3_L23_T',
    fromSubstationId: 'SS2', toSubstationId: 'SS3',
    r: 0.06,   x: 0.18,   b: 0.020, ratingMVA: 400, type: 'Line',
  },
  {
    id: 'L24', name: 'Line 2-4',
    nodeFromId: 'SS2_L24_T', nodeToId: 'SS4_L24_T',
    fromSubstationId: 'SS2', toSubstationId: 'SS4',
    r: 0.06,   x: 0.18,   b: 0.020, ratingMVA: 400, type: 'Line',
  },
  {
    id: 'L25', name: 'Line 2-5',
    nodeFromId: 'SS2_L25_T', nodeToId: 'SS5_L25_T',
    fromSubstationId: 'SS2', toSubstationId: 'SS5',
    r: 0.04,   x: 0.12,   b: 0.015, ratingMVA: 300, type: 'Line',
  },
  {
    id: 'L34', name: 'Line 3-4',
    nodeFromId: 'SS3_L34_T', nodeToId: 'SS4_L34_T',
    fromSubstationId: 'SS3', toSubstationId: 'SS4',
    r: 0.01,   x: 0.03,   b: 0.010, ratingMVA: 400, type: 'Line',
  },
  {
    id: 'L45', name: 'Line 4-5',
    nodeFromId: 'SS4_L45_T', nodeToId: 'SS5_L45_T',
    fromSubstationId: 'SS4', toSubstationId: 'SS5',
    r: 0.08,   x: 0.24,   b: 0.025, ratingMVA: 300, type: 'Line',
  },
];

// ─── 발전기 정의 ─────────────────────────────────────────────────────────────

const generators: Generator[] = [
  {
    id: 'G1', name: 'Generator G1 (Slack)',
    nodeId: 'SS1_G1_T', substationId: 'SS1',
    busType: 'Slack',
    pMW: 0,       // Slack이므로 PF가 결정
    qMvar: 0,
    vPu: 1.06,    // 전압 설정치
    pMaxMW: 300, pMinMW: 0,
    qMaxMvar: 150, qMinMvar: -100,
    status: 'Active',
  },
  {
    id: 'G3', name: 'Generator G3 (PV)',
    nodeId: 'SS3_G3_T', substationId: 'SS3',
    busType: 'PV',
    pMW: 40.0,    // 유효전력 출력 [MW]
    qMvar: 0,
    vPu: 1.0,     // 전압 설정치
    pMaxMW: 100, pMinMW: 0,
    qMaxMvar: 60, qMinMvar: -40,
    status: 'Active',
  },
];

// ─── 부하 정의 ───────────────────────────────────────────────────────────────

const loads: Load[] = [
  {
    id: 'LD2', name: 'Load at Bus 2',
    nodeId: 'SS2_LD2_T', substationId: 'SS2',
    pMW: 20.0, qMvar: 10.0, status: 'Active',
  },
  {
    id: 'LD4', name: 'Load at Bus 4',
    nodeId: 'SS4_LD4_T', substationId: 'SS4',
    pMW: 40.0, qMvar: 5.0, status: 'Active',
  },
  {
    id: 'LD5', name: 'Load at Bus 5',
    nodeId: 'SS5_LD5_T', substationId: 'SS5',
    pMW: 60.0, qMvar: 10.0, status: 'Active',
  },
];

// ─── 초기 Network State 내보내기 ──────────────────────────────────────────────

export const initialNetworkState: NetworkState = {
  substations,
  branches,
  generators,
  loads,
};

/** 모든 CB ID 목록 (UI에서 토글 가능한 스위치) */
export const getAllCBIds = (state: NetworkState): string[] =>
  state.substations.flatMap(ss =>
    ss.switches.filter(sw => sw.type === 'CB').map(sw => sw.id)
  );
