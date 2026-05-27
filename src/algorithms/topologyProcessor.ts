/**
 * Topology Processor (TP)
 *
 * Node-Breaker 상세 모델을 분석하여 Bus-Branch 축약 모델로 변환합니다.
 *
 * 알고리즘:
 *  1. Union-Find 로 닫힌(Closed) 스위치로 연결된 노드들을 그룹화
 *  2. 각 그룹 = 하나의 전기적 버스 (Node Consolidation)
 *  3. 발전기·부하를 해당 버스에 배정
 *  4. Branch(선로)가 연결하는 두 Terminal 노드의 컴포넌트를 확인 → 유효 선로 도출
 *  5. Slack 버스에서 BFS 로 연결된 버스를 파악하여 고립 계통(Island) 탐지
 */

import type {
  NetworkState,
  BusBranchModel,
  BusModel,
  BranchModel,
  GenModel,
  LoadModel,
  BusType,
} from '../types/network';

// ─── Union-Find ───────────────────────────────────────────────────────────────

class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  add(id: string) {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    }
  }

  find(id: string): string {
    const p = this.parent.get(id);
    if (!p) return id;
    if (p !== id) {
      // 경로 압축
      const root = this.find(p);
      this.parent.set(id, root);
      return root;
    }
    return id;
  }

  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const rankA = this.rank.get(ra) ?? 0;
    const rankB = this.rank.get(rb) ?? 0;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }

  /** 컴포넌트 루트 → 소속 노드 목록 맵 반환 */
  getComponents(): Map<string, string[]> {
    const comps = new Map<string, string[]>();
    for (const id of this.parent.keys()) {
      const root = this.find(id);
      if (!comps.has(root)) comps.set(root, []);
      comps.get(root)!.push(id);
    }
    return comps;
  }
}

// ─── 메인 TP 함수 ─────────────────────────────────────────────────────────────

/**
 * Node-Breaker 상태를 분석하여 Bus-Branch 모델을 생성합니다.
 */
export function runTopologyProcessor(state: NetworkState): BusBranchModel {
  const uf = new UnionFind();

  // 1. 모든 물리 노드를 UF에 등록
  for (const ss of state.substations) {
    for (const node of ss.nodes) {
      uf.add(node.id);
    }
  }

  // 2. 닫힌(Closed) 스위치(CB/DS)로 연결된 노드들을 Union
  for (const ss of state.substations) {
    for (const sw of ss.switches) {
      if (sw.status === 'Closed') {
        uf.union(sw.nodeFrom, sw.nodeTo);
      }
    }
  }

  // 3. 컴포넌트 → 버스 번호 매핑 (루트 노드 ID → 버스 번호)
  const components = uf.getComponents();
  const rootToBusId = new Map<string, number>();
  const nodeTobus = new Map<string, number>();
  let busCounter = 1;

  for (const [root, nodes] of components) {
    const busId = busCounter++;
    rootToBusId.set(root, busId);
    for (const nodeId of nodes) {
      nodeTobus.set(nodeId, busId);
    }
  }

  // 4. 각 버스의 타입 결정 (Slack > PV > PQ 우선순위)
  const busTypeMap = new Map<number, BusType>();
  const busVoltageMap = new Map<number, number>(); // setpoint voltage
  const busSubstationIds = new Map<number, string[]>();

  // 버스에 소속된 변전소 수집
  for (const ss of state.substations) {
    const busbars = ss.nodes.filter(n => n.isBusbar);
    for (const busbar of busbars) {
      const busId = nodeTobus.get(busbar.id);
      if (busId === undefined) continue;
      if (!busSubstationIds.has(busId)) busSubstationIds.set(busId, []);
      const arr = busSubstationIds.get(busId)!;
      if (!arr.includes(ss.id)) arr.push(ss.id);
    }
  }

  // 모든 버스를 PQ로 초기화
  for (const [, busId] of rootToBusId) {
    busTypeMap.set(busId, 'PQ');
    busVoltageMap.set(busId, 1.0);
  }

  // 발전기 연결 반영 (Slack > PV)
  const activeGens = state.generators.filter(g => g.status === 'Active');
  for (const gen of activeGens) {
    const busId = nodeTobus.get(gen.nodeId);
    if (busId === undefined) continue;
    const current = busTypeMap.get(busId) ?? 'PQ';
    if (gen.busType === 'Slack') {
      busTypeMap.set(busId, 'Slack');
      busVoltageMap.set(busId, gen.vPu);
    } else if (gen.busType === 'PV' && current === 'PQ') {
      busTypeMap.set(busId, 'PV');
      busVoltageMap.set(busId, gen.vPu);
    }
  }

  // 5. BusModel 배열 생성
  const buses: BusModel[] = [];
  for (const busId of rootToBusId.values()) {
    buses.push({
      id: busId,
      type: busTypeMap.get(busId) ?? 'PQ',
      vPu: busVoltageMap.get(busId) ?? 1.0,
      thetaRad: 0,
      substationIds: busSubstationIds.get(busId) ?? [],
      isEnergized: true, // Island 탐지 후 업데이트
    });
  }

  // 6. Branch → BranchModel 변환 (두 Terminal 노드가 다른 버스일 때만 유효)
  const branchModels: BranchModel[] = [];
  for (const branch of state.branches) {
    const fromBus = nodeTobus.get(branch.nodeFromId);
    const toBus = nodeTobus.get(branch.nodeToId);
    if (fromBus === undefined || toBus === undefined) continue;
    if (fromBus === toBus) continue; // 내부 단락 (루프) 무시

    // CB가 열려 있으면 단자 노드가 모선과 분리 → substationIds = []
    // 고립된 단자를 포함하는 Branch는 전기적 개방 상태이므로 제외
    const fromConnected = (busSubstationIds.get(fromBus)?.length ?? 0) > 0;
    const toConnected = (busSubstationIds.get(toBus)?.length ?? 0) > 0;
    if (!fromConnected || !toConnected) continue;

    branchModels.push({
      id: `${branch.id}_bm`,
      fromBus,
      toBus,
      r: branch.r,
      x: branch.x,
      b: branch.b,
      ratingMVA: branch.ratingMVA,
      originalBranchId: branch.id,
    });
  }

  // 7. 발전기 모델
  const genModels: GenModel[] = [];
  for (const gen of activeGens) {
    const busId = nodeTobus.get(gen.nodeId);
    if (busId === undefined) continue;
    genModels.push({
      id: gen.id,
      bus: busId,
      pMW: gen.pMW,
      qMvar: gen.qMvar,
      vPu: gen.vPu,
      busType: gen.busType,
      qMaxMvar: gen.qMaxMvar,
      qMinMvar: gen.qMinMvar,
    });
  }

  // 8. 부하 모델
  const loadModels: LoadModel[] = [];
  for (const load of state.loads) {
    if (load.status !== 'Active') continue;
    const busId = nodeTobus.get(load.nodeId);
    if (busId === undefined) continue;
    loadModels.push({
      id: load.id,
      bus: busId,
      pMW: load.pMW,
      qMvar: load.qMvar,
    });
  }

  // 9. Island(고립 계통) 탐지: Slack 버스에서 BFS
  const slackBus = buses.find(b => b.type === 'Slack');
  if (slackBus) {
    const reachable = new Set<number>();
    const queue = [slackBus.id];
    reachable.add(slackBus.id);

    // 인접 버스 맵 구성
    const adjacency = new Map<number, Set<number>>();
    for (const bm of branchModels) {
      if (!adjacency.has(bm.fromBus)) adjacency.set(bm.fromBus, new Set());
      if (!adjacency.has(bm.toBus)) adjacency.set(bm.toBus, new Set());
      adjacency.get(bm.fromBus)!.add(bm.toBus);
      adjacency.get(bm.toBus)!.add(bm.fromBus);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = adjacency.get(current) ?? new Set();
      for (const neighbor of neighbors) {
        if (!reachable.has(neighbor)) {
          reachable.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    for (const bus of buses) {
      bus.isEnergized = reachable.has(bus.id);
    }
  }

  return {
    buses,
    branches: branchModels,
    generators: genModels,
    loads: loadModels,
    nodeTobus,
  };
}

/** 특정 Branch가 에너지 공급 상태인지 확인 (두 끝 버스 모두 활성) */
export function isBranchEnergized(
  model: BusBranchModel,
  branchId: string
): boolean {
  const bm = model.branches.find(b => b.originalBranchId === branchId);
  if (!bm) return false;
  const busFrom = model.buses.find(b => b.id === bm.fromBus);
  const busTo = model.buses.find(b => b.id === bm.toBus);
  return !!(busFrom?.isEnergized && busTo?.isEnergized);
}
