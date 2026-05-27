/**
 * EMS 시뮬레이터 전역 상태 (Zustand)
 *
 * 파이프라인: 스위치 조작 → TP → PF → CA → UI 갱신
 */

import { create } from 'zustand';
import type {
  NetworkState,
  PowerFlowResult,
  ContingencyResult,
  Alarm,
  AlarmSeverity,
} from '../types/network';
import { initialNetworkState } from '../data/ieee5bus';
import { runTopologyProcessor } from '../algorithms/topologyProcessor';
import { runPowerFlow } from '../algorithms/powerFlow';
import { runContingencyAnalysis } from '../algorithms/contingencyAnalysis';

let alarmCounter = 0;
function makeAlarm(
  severity: AlarmSeverity,
  source: string,
  message: string
): Alarm {
  return {
    id: `ALM-${String(++alarmCounter).padStart(5, '0')}`,
    timestamp: new Date(),
    severity,
    source,
    message,
  };
}

interface EMSStore {
  // ── 네트워크 상태 ──────────────────────────────────────────────────────────
  network: NetworkState;

  // ── EMS 계산 결과 ──────────────────────────────────────────────────────────
  pfResult: PowerFlowResult | null;
  caResults: ContingencyResult[];

  // ── 알람 로그 ──────────────────────────────────────────────────────────────
  alarms: Alarm[];

  // ── UI 상태 ────────────────────────────────────────────────────────────────
  scadaRunning: boolean;
  caRunning: boolean;
  selectedCBId: string | null;
  activePanel: 'alarms' | 'bus' | 'branch' | 'ca';

  // ── 액션 ───────────────────────────────────────────────────────────────────
  /** CB 개폐 조작 → TP → PF 재계산 */
  toggleCB: (cbId: string) => void;

  /** 수동으로 TP → PF 재계산 */
  recalculate: () => void;

  /** N-1 상정사고 해석 실행 */
  runCA: () => void;

  /** SCADA 주기 갱신 시뮬레이션 On/Off */
  toggleScada: () => void;

  /** SCADA 한 사이클 갱신 (내부용) */
  scadaTick: () => void;

  /** 알람 추가 */
  addAlarm: (alarm: Alarm) => void;

  /** 알람 전체 삭제 */
  clearAlarms: () => void;

  /** UI 패널 선택 */
  setActivePanel: (panel: EMSStore['activePanel']) => void;
}

/** TP → PF 파이프라인 실행 */
function runPipeline(network: NetworkState): {
  pfResult: PowerFlowResult;
  newAlarms: Alarm[];
} {
  const model = runTopologyProcessor(network);
  const pfResult = runPowerFlow(model);
  const newAlarms: Alarm[] = [];

  if (!pfResult.converged) {
    newAlarms.push(
      makeAlarm('WARNING', 'PF', '조류계산이 수렴하지 않았습니다.')
    );
  }

  // 과부하 알람
  for (const br of pfResult.branches) {
    if (!br.isEnergized) continue;
    if (br.loading > 100) {
      newAlarms.push(
        makeAlarm(
          'CRITICAL', 'PF',
          `선로 ${br.branchId} 과부하: ${br.loading.toFixed(1)}% (정격의 100% 초과)`
        )
      );
    } else if (br.loading > 90) {
      newAlarms.push(
        makeAlarm(
          'WARNING', 'PF',
          `선로 ${br.branchId} 부하율 주의: ${br.loading.toFixed(1)}%`
        )
      );
    }
  }

  // 전압 위반 알람
  for (const bus of pfResult.buses) {
    if (!bus.isEnergized) {
      newAlarms.push(
        makeAlarm('CRITICAL', 'TP', `버스 ${bus.substationIds.join('/')} 사선(Dead Bus) 감지`)
      );
    } else if (bus.vPu < 0.95) {
      newAlarms.push(
        makeAlarm('WARNING', 'PF', `버스 ${bus.substationIds.join('/')} 저전압: ${bus.vPu.toFixed(4)} pu`)
      );
    } else if (bus.vPu > 1.05) {
      newAlarms.push(
        makeAlarm('WARNING', 'PF', `버스 ${bus.substationIds.join('/')} 과전압: ${bus.vPu.toFixed(4)} pu`)
      );
    }
  }

  return { pfResult, newAlarms };
}

export const useEMSStore = create<EMSStore>((set, get) => {
  // 초기 계산
  const { pfResult: initPF, newAlarms: initAlarms } = runPipeline(initialNetworkState);
  initAlarms.unshift(makeAlarm('INFO', 'SYSTEM', 'EMS 시뮬레이터 초기화 완료'));

  return {
    network: initialNetworkState,
    pfResult: initPF,
    caResults: [],
    alarms: initAlarms,
    scadaRunning: false,
    caRunning: false,
    selectedCBId: null,
    activePanel: 'alarms',

    toggleCB: (cbId: string) => {
      const { network } = get();
      const updatedNetwork: NetworkState = {
        ...network,
        substations: network.substations.map(ss => ({
          ...ss,
          switches: ss.switches.map(sw => {
            if (sw.id !== cbId) return sw;
            const newStatus = sw.status === 'Closed' ? 'Open' : 'Closed';
            return { ...sw, status: newStatus };
          }),
        })),
      };

      const sw = network.substations
        .flatMap(ss => ss.switches)
        .find(s => s.id === cbId);
      const newStatus = sw?.status === 'Closed' ? 'Open' : 'Closed';
      const opAlarm = makeAlarm(
        'INFO', 'SCADA',
        `${sw?.name ?? cbId} → ${newStatus === 'Closed' ? '투입(Close)' : '개방(Open)'}`
      );

      const { pfResult, newAlarms } = runPipeline(updatedNetwork);

      set(state => ({
        network: updatedNetwork,
        pfResult,
        alarms: [opAlarm, ...newAlarms, ...state.alarms].slice(0, 200),
        caResults: [], // CA 결과 초기화 (재계산 필요)
      }));
    },

    recalculate: () => {
      const { network } = get();
      const { pfResult, newAlarms } = runPipeline(network);
      const infoAlarm = makeAlarm('INFO', 'PF', '조류계산 수동 재실행 완료');
      set(state => ({
        pfResult,
        alarms: [infoAlarm, ...newAlarms, ...state.alarms].slice(0, 200),
      }));
    },

    runCA: () => {
      set({ caRunning: true });
      const { network } = get();

      // 약간의 지연으로 UI 반응성 확보
      setTimeout(() => {
        const caResults = runContingencyAnalysis(network);
        const totalViolations = caResults.reduce(
          (s, r) => s + r.violations.length, 0
        );
        const caAlarm = makeAlarm(
          totalViolations > 0 ? 'WARNING' : 'INFO',
          'CA',
          `N-1 상정사고 ${caResults.length}건 해석 완료 – 위반 ${totalViolations}건`
        );
        set(state => ({
          caResults,
          caRunning: false,
          alarms: [caAlarm, ...state.alarms].slice(0, 200),
          activePanel: 'ca',
        }));
      }, 50);
    },

    toggleScada: () => {
      set(state => ({ scadaRunning: !state.scadaRunning }));
    },

    scadaTick: () => {
      const { network } = get();
      // 부하 ±3% 랜덤 변동 (SCADA 실시간 취득 모의)
      const updatedNetwork: NetworkState = {
        ...network,
        loads: network.loads.map(load => ({
          ...load,
          pMW: load.pMW * (1 + (Math.random() - 0.5) * 0.06),
          qMvar: load.qMvar * (1 + (Math.random() - 0.5) * 0.06),
        })),
      };
      const { pfResult } = runPipeline(updatedNetwork);
      set({ network: updatedNetwork, pfResult });
    },

    addAlarm: (alarm: Alarm) => {
      set(state => ({ alarms: [alarm, ...state.alarms].slice(0, 200) }));
    },

    clearAlarms: () => set({ alarms: [] }),

    setActivePanel: (panel) => set({ activePanel: panel }),
  };
});
