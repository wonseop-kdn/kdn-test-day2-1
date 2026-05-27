/**
 * Contingency Analysis (CA) – N-1 상정사고 해석
 *
 * 단일 선로 또는 발전기 탈락(N-1) 조건에서 순차적으로 PF를 수행하여
 * 과부하 선로(>100%) 및 전압 위반 모선을 탐지합니다.
 */

import type {
  NetworkState,
  ContingencyResult,
  Violation,
} from '../types/network';
import { runTopologyProcessor } from './topologyProcessor';
import { runPowerFlow } from './powerFlow';

const V_HIGH_PU = 1.05;
const V_LOW_PU = 0.95;
const OVERLOAD_WARN = 90;   // %
const OVERLOAD_CRIT = 100;  // %

export function runContingencyAnalysis(state: NetworkState): ContingencyResult[] {
  const results: ContingencyResult[] = [];

  // ── N-1 선로 탈락 ───────────────────────────────────────────────────────────
  for (const branch of state.branches) {
    // 해당 선로 양측 CB를 모두 Open 처리한 가상 상태 생성
    const contingencyState: NetworkState = {
      ...state,
      substations: state.substations.map(ss => ({
        ...ss,
        switches: ss.switches.map(sw => {
          // 해당 branch의 terminal 노드에 연결된 CB 탐지
          const isLineCB =
            (sw.type === 'CB' &&
             sw.substationId === branch.fromSubstationId &&
             (sw.nodeFrom === branch.nodeFromId || sw.nodeTo === branch.nodeFromId)) ||
            (sw.type === 'CB' &&
             sw.substationId === branch.toSubstationId &&
             (sw.nodeFrom === branch.nodeToId || sw.nodeTo === branch.nodeToId));
          return isLineCB ? { ...sw, status: 'Open' as const } : sw;
        }),
      })),
    };

    const model = runTopologyProcessor(contingencyState);
    const pfResult = runPowerFlow(model);
    const violations: Violation[] = [];

    // 선로 과부하 검사
    for (const br of pfResult.branches) {
      if (!br.isEnergized) continue;
      if (br.loading >= OVERLOAD_CRIT) {
        violations.push({
          type: 'OVERLOAD',
          elementId: br.branchId,
          elementName: `Line ${br.branchId}`,
          value: br.loading,
          limit: OVERLOAD_CRIT,
          severity: 'CRITICAL',
        });
      } else if (br.loading >= OVERLOAD_WARN) {
        violations.push({
          type: 'OVERLOAD',
          elementId: br.branchId,
          elementName: `Line ${br.branchId}`,
          value: br.loading,
          limit: OVERLOAD_WARN,
          severity: 'WARNING',
        });
      }
    }

    // 버스 전압 위반 검사
    for (const bus of pfResult.buses) {
      if (!bus.isEnergized) {
        violations.push({
          type: 'ISLAND',
          elementId: `bus_${bus.busId}`,
          elementName: `Bus ${bus.substationIds.join('/')}`,
          value: 0,
          limit: V_LOW_PU,
          severity: 'CRITICAL',
        });
        continue;
      }
      if (bus.vPu > V_HIGH_PU) {
        violations.push({
          type: 'VOLTAGE_HIGH',
          elementId: `bus_${bus.busId}`,
          elementName: `Bus ${bus.substationIds.join('/')}`,
          value: bus.vPu,
          limit: V_HIGH_PU,
          severity: 'WARNING',
        });
      } else if (bus.vPu < V_LOW_PU) {
        violations.push({
          type: 'VOLTAGE_LOW',
          elementId: `bus_${bus.busId}`,
          elementName: `Bus ${bus.substationIds.join('/')}`,
          value: bus.vPu,
          limit: V_LOW_PU,
          severity: pfResult.converged ? 'WARNING' : 'CRITICAL',
        });
      }
    }

    results.push({
      contingencyId: `TRIP_${branch.id}`,
      contingencyName: `${branch.name} 탈락`,
      converged: pfResult.converged,
      violations,
    });
  }

  // ── N-1 발전기 탈락 ─────────────────────────────────────────────────────────
  for (const gen of state.generators) {
    if (gen.busType === 'Slack') continue; // Slack 발전기는 필수
    const contingencyState: NetworkState = {
      ...state,
      generators: state.generators.map(g =>
        g.id === gen.id ? { ...g, status: 'Inactive' as const } : g
      ),
      // 해당 발전기 CB도 Open
      substations: state.substations.map(ss => ({
        ...ss,
        switches: ss.switches.map(sw => {
          const isGenCB =
            (sw.nodeFrom === gen.nodeId || sw.nodeTo === gen.nodeId) &&
            sw.type === 'CB';
          return isGenCB ? { ...sw, status: 'Open' as const } : sw;
        }),
      })),
    };

    const model = runTopologyProcessor(contingencyState);
    const pfResult = runPowerFlow(model);
    const violations: Violation[] = [];

    for (const br of pfResult.branches) {
      if (!br.isEnergized) continue;
      if (br.loading >= OVERLOAD_CRIT) {
        violations.push({
          type: 'OVERLOAD',
          elementId: br.branchId,
          elementName: `Line ${br.branchId}`,
          value: br.loading,
          limit: OVERLOAD_CRIT,
          severity: 'CRITICAL',
        });
      } else if (br.loading >= OVERLOAD_WARN) {
        violations.push({
          type: 'OVERLOAD',
          elementId: br.branchId,
          elementName: `Line ${br.branchId}`,
          value: br.loading,
          limit: OVERLOAD_WARN,
          severity: 'WARNING',
        });
      }
    }

    for (const bus of pfResult.buses) {
      if (!bus.isEnergized) {
        violations.push({
          type: 'ISLAND',
          elementId: `bus_${bus.busId}`,
          elementName: `Bus ${bus.substationIds.join('/')}`,
          value: 0,
          limit: V_LOW_PU,
          severity: 'CRITICAL',
        });
      } else if (bus.vPu < V_LOW_PU) {
        violations.push({
          type: 'VOLTAGE_LOW',
          elementId: `bus_${bus.busId}`,
          elementName: `Bus ${bus.substationIds.join('/')}`,
          value: bus.vPu,
          limit: V_LOW_PU,
          severity: 'WARNING',
        });
      }
    }

    results.push({
      contingencyId: `TRIP_GEN_${gen.id}`,
      contingencyName: `${gen.name} 탈락`,
      converged: pfResult.converged,
      violations,
    });
  }

  return results;
}
