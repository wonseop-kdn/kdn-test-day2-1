/**
 * Power Flow – Newton-Raphson 조류계산
 *
 * 입력: BusBranchModel (Topology Processor 출력)
 * 출력: PowerFlowResult (버스 전압, 선로 조류, 수렴 여부)
 *
 * 수식 (100 MVA 기준):
 *   P_i = Σ_j |Vi||Vj|(G_ij cos θ_ij + B_ij sin θ_ij)
 *   Q_i = Σ_j |Vi||Vj|(G_ij sin θ_ij - B_ij cos θ_ij)
 *
 * 야코비안 (θ 단위: rad, |V| 보정 변수: Δ|V|/|V|):
 *   [ΔP]   [H  N] [Δθ       ]
 *   [ΔQ] = [J  L] [Δ|V|/|V|]
 */

import type {
  BusBranchModel,
  BusModel,
  BranchModel,
  PowerFlowResult,
  BusResult,
  BranchResult,
} from '../types/network';

const BASE_MVA = 100.0;
const MAX_ITER = 50;
const TOLERANCE = 1e-6;

// ─── 복소 어드미턴스 행렬 (Y-bus) 구성 ──────────────────────────────────────

interface YEntry { g: number; b: number }

function buildYbus(buses: BusModel[], branches: BranchModel[]): YEntry[][] {
  const n = buses.length;
  const Y: YEntry[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => ({ g: 0, b: 0 }))
  );

  // 버스 ID → 인덱스 매핑
  const busIdx = new Map<number, number>();
  buses.forEach((b, i) => busIdx.set(b.id, i));

  for (const br of branches) {
    const i = busIdx.get(br.fromBus)!;
    const j = busIdx.get(br.toBus)!;
    if (i === undefined || j === undefined) continue;

    const denom = br.r * br.r + br.x * br.x;
    const g = br.r / denom;
    const b = -br.x / denom;
    const bsh = br.b / 2; // 병렬 어드미턴스 (shunt capacitance)

    // 대각 원소
    Y[i][i].g += g;
    Y[i][i].b += b + bsh;
    Y[j][j].g += g;
    Y[j][j].b += b + bsh;

    // 비대각 원소
    Y[i][j].g -= g;
    Y[i][j].b -= b;
    Y[j][i].g -= g;
    Y[j][i].b -= b;
  }

  return Y;
}

// ─── 버스 전력 주입 계산 ─────────────────────────────────────────────────────

function calcPowerInjections(
  V: number[], theta: number[], Y: YEntry[][], n: number
): { P: number[]; Q: number[] } {
  const P = new Array(n).fill(0);
  const Q = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const tij = theta[i] - theta[j];
      P[i] += V[i] * V[j] * (Y[i][j].g * Math.cos(tij) + Y[i][j].b * Math.sin(tij));
      Q[i] += V[i] * V[j] * (Y[i][j].g * Math.sin(tij) - Y[i][j].b * Math.cos(tij));
    }
  }
  return { P, Q };
}

// ─── 야코비안 구성 ────────────────────────────────────────────────────────────
// 변수 순서: [Δθ (non-slack buses), Δ|V|/|V| (PQ buses only)]
// 방정식 순서: [ΔP (non-slack), ΔQ (PQ only)]

function buildJacobian(
  V: number[], theta: number[], Y: YEntry[][], P: number[], Q: number[],
  nonSlackIdx: number[], pqIdx: number[]
): number[][] {
  const nNS = nonSlackIdx.length;
  const nPQ = pqIdx.length;
  const size = nNS + nPQ;
  const J: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));

  // 인덱스 빠른 조회
  const pqSet = new Set(pqIdx);

  // H 블록: ∂P/∂θ  (행: non-slack, 열: non-slack)
  for (let ri = 0; ri < nNS; ri++) {
    const i = nonSlackIdx[ri];
    for (let ci = 0; ci < nNS; ci++) {
      const j = nonSlackIdx[ci];
      const tij = theta[i] - theta[j];
      if (i !== j) {
        J[ri][ci] = V[i] * V[j] * (Y[i][j].g * Math.sin(tij) - Y[i][j].b * Math.cos(tij));
      } else {
        J[ri][ci] = -Q[i] - Y[i][i].b * V[i] * V[i];
      }
    }
  }

  // N 블록: ∂P/∂|V|·|V|  (행: non-slack, 열: PQ)
  for (let ri = 0; ri < nNS; ri++) {
    const i = nonSlackIdx[ri];
    for (let ci = 0; ci < nPQ; ci++) {
      const j = pqIdx[ci];
      const tij = theta[i] - theta[j];
      if (i !== j) {
        J[ri][nNS + ci] = V[i] * V[j] * (Y[i][j].g * Math.cos(tij) + Y[i][j].b * Math.sin(tij));
      } else {
        J[ri][nNS + ci] = P[i] + Y[i][i].g * V[i] * V[i];
      }
    }
  }

  // J 블록: ∂Q/∂θ  (행: PQ, 열: non-slack)
  for (let ri = 0; ri < nPQ; ri++) {
    const i = pqIdx[ri];
    for (let ci = 0; ci < nNS; ci++) {
      const j = nonSlackIdx[ci];
      const tij = theta[i] - theta[j];
      if (i !== j) {
        J[nNS + ri][ci] = -V[i] * V[j] * (Y[i][j].g * Math.cos(tij) + Y[i][j].b * Math.sin(tij));
      } else {
        J[nNS + ri][ci] = P[i] - Y[i][i].g * V[i] * V[i];
      }
    }
  }

  // L 블록: ∂Q/∂|V|·|V|  (행: PQ, 열: PQ)
  for (let ri = 0; ri < nPQ; ri++) {
    const i = pqIdx[ri];
    for (let ci = 0; ci < nPQ; ci++) {
      const j = pqIdx[ci];
      const tij = theta[i] - theta[j];
      if (i !== j) {
        J[nNS + ri][nNS + ci] = V[i] * V[j] * (Y[i][j].g * Math.sin(tij) - Y[i][j].b * Math.cos(tij));
      } else {
        J[nNS + ri][nNS + ci] = Q[i] - Y[i][i].b * V[i] * V[i];
      }
    }
  }

  void pqSet; // suppress unused warning
  return J;
}

// ─── 가우스 소거법 (부분 피벗팅) ─────────────────────────────────────────────

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  // 증강 행렬 복사
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // 부분 피벗 선택
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > maxVal) {
        maxVal = Math.abs(M[row][col]);
        maxRow = row;
      }
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / pivot;
      for (let k = col; k <= n; k++) {
        M[row][k] -= factor * M[col][k];
      }
    }
  }

  // 후진 대입
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = Math.abs(M[i][i]) > 1e-12 ? sum / M[i][i] : 0;
  }
  return x;
}

// ─── 선로 조류 계산 ───────────────────────────────────────────────────────────

function calcLineFlows(
  branches: BranchModel[], buses: BusModel[],
  V: number[], theta: number[], busIdxMap: Map<number, number>
): BranchResult[] {
  return branches.map(br => {
    const i = busIdxMap.get(br.fromBus)!;
    const j = busIdxMap.get(br.toBus)!;
    const busFrom = buses[i];
    const busTo = buses[j];

    const denom = br.r * br.r + br.x * br.x;
    const g = br.r / denom;
    const b = -br.x / denom;
    const bsh = br.b / 2;

    const tij = theta[i] - theta[j];

    // From-end power
    const pFrom = V[i] * V[i] * g - V[i] * V[j] * (g * Math.cos(tij) + b * Math.sin(tij));
    const qFrom = -V[i] * V[i] * (b + bsh) - V[i] * V[j] * (g * Math.sin(tij) - b * Math.cos(tij));

    // To-end power
    const tji = -tij;
    const pTo = V[j] * V[j] * g - V[i] * V[j] * (g * Math.cos(tji) + b * Math.sin(tji));
    const qTo = -V[j] * V[j] * (b + bsh) - V[i] * V[j] * (g * Math.sin(tji) - b * Math.cos(tji));

    const pFromMW = pFrom * BASE_MVA;
    const qFromMvar = qFrom * BASE_MVA;
    const pToMW = pTo * BASE_MVA;
    const qToMvar = qTo * BASE_MVA;

    const apparentMVA = Math.sqrt(pFromMW ** 2 + qFromMvar ** 2);
    const loading = (apparentMVA / br.ratingMVA) * 100;

    return {
      branchId: br.originalBranchId,
      fromBusId: br.fromBus,
      toBusId: br.toBus,
      pFromMW,
      qFromMvar,
      pToMW,
      qToMvar,
      loading,
      isEnergized: busFrom.isEnergized && busTo.isEnergized,
      isOverloaded: loading > 100,
    };
  });
}

// ─── 메인 Newton-Raphson 함수 ─────────────────────────────────────────────────

export function runPowerFlow(model: BusBranchModel): PowerFlowResult {
  const { buses, branches, generators, loads } = model;

  // 에너지 공급된 버스만 처리
  const activeBuses = buses.filter(b => b.isEnergized);
  const n = activeBuses.length;

  if (n === 0) {
    return {
      converged: false, iterations: 0,
      buses: [], branches: [], totalGenMW: 0, totalLoadMW: 0, totalLossMW: 0,
    };
  }

  // 버스 ID → 로컬 인덱스 매핑
  const busIdxMap = new Map<number, number>();
  activeBuses.forEach((b, i) => busIdxMap.set(b.id, i));

  // 유효 선로 (두 끝 버스 모두 활성)
  const activeBranches = branches.filter(
    br => busIdxMap.has(br.fromBus) && busIdxMap.has(br.toBus)
  );

  // Y-bus 구성
  const Y = buildYbus(activeBuses, activeBranches);

  // 버스별 명세 전력 계산 (pu)
  const Pspec = new Array(n).fill(0);
  const Qspec = new Array(n).fill(0);
  for (const gen of generators) {
    const idx = busIdxMap.get(gen.bus);
    if (idx === undefined) continue;
    Pspec[idx] += gen.pMW / BASE_MVA;
    Qspec[idx] += gen.qMvar / BASE_MVA;
  }
  for (const load of loads) {
    const idx = busIdxMap.get(load.bus);
    if (idx === undefined) continue;
    Pspec[idx] -= load.pMW / BASE_MVA;
    Qspec[idx] -= load.qMvar / BASE_MVA;
  }

  // 초기 전압 (Flat Start, PV/Slack 버스는 설정치 사용)
  const V = activeBuses.map(b => b.vPu);
  const theta = activeBuses.map(() => 0.0);

  // Slack 버스 인덱스
  const slackIdx = activeBuses.findIndex(b => b.type === 'Slack');
  if (slackIdx < 0) {
    // Slack 버스 없음 – 수렴 불가
    return buildDegenerateResult(activeBuses, activeBranches, busIdxMap, V, theta);
  }

  // 변수 인덱스 분류
  const nonSlackIdx = activeBuses
    .map((b, i) => (b.type !== 'Slack' ? i : -1))
    .filter(i => i >= 0);
  const pqIdx = activeBuses
    .map((b, i) => (b.type === 'PQ' ? i : -1))
    .filter(i => i >= 0);

  let converged = false;
  let iterations = 0;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    iterations++;
    const { P, Q } = calcPowerInjections(V, theta, Y, n);

    // 불일치량 (mismatch) 계산
    const dP = nonSlackIdx.map(i => Pspec[i] - P[i]);
    const dQ = pqIdx.map(i => Qspec[i] - Q[i]);
    const mismatch = [...dP, ...dQ];

    const maxMismatch = Math.max(...mismatch.map(Math.abs));
    if (maxMismatch < TOLERANCE) {
      converged = true;
      break;
    }

    // 야코비안 풀기
    const Jac = buildJacobian(V, theta, Y, P, Q, nonSlackIdx, pqIdx);
    const dx = gaussianElimination(Jac, mismatch);

    // 전압 갱신
    const nNS = nonSlackIdx.length;
    for (let k = 0; k < nNS; k++) {
      theta[nonSlackIdx[k]] += dx[k];
    }
    for (let k = 0; k < pqIdx.length; k++) {
      V[pqIdx[k]] *= (1 + dx[nNS + k]);
    }
  }

  // Slack 버스 전력 역산
  const { P: Pfinal, Q: Qfinal } = calcPowerInjections(V, theta, Y, n);

  // 결과 조립
  const busResults: BusResult[] = buses.map(bus => {
    const idx = busIdxMap.get(bus.id);
    const vResult = idx !== undefined ? V[idx] : 1.0;
    const tResult = idx !== undefined ? (theta[idx] * 180) / Math.PI : 0;
    const pCalc = idx !== undefined ? Pfinal[idx] * BASE_MVA : 0;
    const qCalc = idx !== undefined ? Qfinal[idx] * BASE_MVA : 0;

    const genAtBus = generators.filter(g => g.bus === bus.id);
    const loadAtBus = loads.filter(l => l.bus === bus.id);
    const pLoad = loadAtBus.reduce((s, l) => s + l.pMW, 0);
    const qLoad = loadAtBus.reduce((s, l) => s + l.qMvar, 0);

    let pGen: number;
    let qGen: number;
    if (bus.type === 'Slack') {
      pGen = pCalc + pLoad;
      qGen = qCalc + qLoad;
    } else {
      pGen = genAtBus.reduce((s, g) => s + g.pMW, 0);
      qGen = pCalc + pLoad; // PV/PQ: Q는 계산치
    }

    return {
      busId: bus.id,
      substationIds: bus.substationIds,
      vPu: vResult,
      thetaDeg: tResult,
      pGenMW: bus.type === 'Slack' ? pGen : pGen,
      qGenMvar: qGen,
      pLoadMW: pLoad,
      qLoadMvar: qLoad,
      isEnergized: bus.isEnergized,
    };
  });

  const branchResults = calcLineFlows(activeBranches, activeBuses, V, theta, busIdxMap);

  // 비활성 버스·선로 추가 (사선 처리)
  const inactiveBuses = buses.filter(b => !b.isEnergized);
  for (const bus of inactiveBuses) {
    busResults.push({
      busId: bus.id,
      substationIds: bus.substationIds,
      vPu: 0,
      thetaDeg: 0,
      pGenMW: 0,
      qGenMvar: 0,
      pLoadMW: 0,
      qLoadMvar: 0,
      isEnergized: false,
    });
  }

  const inactiveBranches = branches.filter(
    br => !busIdxMap.has(br.fromBus) || !busIdxMap.has(br.toBus)
  );
  for (const br of inactiveBranches) {
    branchResults.push({
      branchId: br.originalBranchId,
      fromBusId: br.fromBus,
      toBusId: br.toBus,
      pFromMW: 0, qFromMvar: 0, pToMW: 0, qToMvar: 0,
      loading: 0,
      isEnergized: false,
      isOverloaded: false,
    });
  }

  const totalGenMW = busResults.reduce((s, b) => s + (b.isEnergized ? b.pGenMW : 0), 0);
  const totalLoadMW = busResults.reduce((s, b) => s + (b.isEnergized ? b.pLoadMW : 0), 0);
  const totalLossMW = totalGenMW - totalLoadMW;

  return {
    converged,
    iterations,
    buses: busResults,
    branches: branchResults,
    totalGenMW,
    totalLoadMW,
    totalLossMW,
  };
}

function buildDegenerateResult(
  activeBuses: BusModel[],
  activeBranches: BranchModel[],
  busIdxMap: Map<number, number>,
  V: number[], theta: number[]
): PowerFlowResult {
  const branchResults = calcLineFlows(activeBranches, activeBuses, V, theta, busIdxMap);
  return {
    converged: false, iterations: 0,
    buses: activeBuses.map(b => ({
      busId: b.id, substationIds: b.substationIds,
      vPu: 0, thetaDeg: 0,
      pGenMW: 0, qGenMvar: 0, pLoadMW: 0, qLoadMvar: 0,
      isEnergized: false,
    })),
    branches: branchResults,
    totalGenMW: 0, totalLoadMW: 0, totalLossMW: 0,
  };
}
