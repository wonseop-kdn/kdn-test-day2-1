// ─── Node-Breaker 데이터 모델 타입 정의 ─────────────────────────────────────

export type SwitchStatus = 'Open' | 'Closed';
export type BusType = 'Slack' | 'PV' | 'PQ';
export type SwitchType = 'CB' | 'DS';
export type AlarmSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

/** 변전소 내부 물리 노드 */
export interface NetworkNode {
  id: string;
  substationId: string;
  name: string;
  isBusbar: boolean;
}

/** 차단기(CB) 또는 단로기(DS) */
export interface Switch {
  id: string;
  substationId: string;
  name: string;
  nodeFrom: string;
  nodeTo: string;
  type: SwitchType;
  status: SwitchStatus;
  isControllable: boolean; // CB=true, DS=false (일반적으로 고정)
}

/** 변전소 (Bus 확장) - Node-Breaker 상세 모델 */
export interface Substation {
  id: string;
  name: string;
  shortName: string;
  busId: number;        // 원본 IEEE 버스 번호
  voltageKV: number;
  x: number;            // SLD 위치 x (픽셀)
  y: number;            // SLD 위치 y (픽셀)
  nodes: NetworkNode[];
  switches: Switch[];
}

/** 선로 / 변압기 (Node-Breaker: Terminal Node 간 연결) */
export interface Branch {
  id: string;
  name: string;
  nodeFromId: string;        // from-변전소 측 Terminal 노드 ID
  nodeToId: string;          // to-변전소 측 Terminal 노드 ID
  fromSubstationId: string;
  toSubstationId: string;
  r: number;                  // 직렬 저항 [pu]
  x: number;                  // 직렬 리액턴스 [pu]
  b: number;                  // 전체 병렬 어드미턴스 [pu]
  ratingMVA: number;
  type: 'Line' | 'Transformer';
}

/** 발전기 */
export interface Generator {
  id: string;
  name: string;
  nodeId: string;             // 연결된 Terminal 노드 ID
  substationId: string;
  busType: BusType;
  pMW: number;                // 유효전력 출력
  qMvar: number;              // 무효전력 출력 (초기값)
  vPu: number;                // 전압 설정치 (PV/Slack)
  pMaxMW: number;
  pMinMW: number;
  qMaxMvar: number;
  qMinMvar: number;
  status: 'Active' | 'Inactive';
}

/** 부하 */
export interface Load {
  id: string;
  name: string;
  nodeId: string;
  substationId: string;
  pMW: number;
  qMvar: number;
  status: 'Active' | 'Inactive';
}

/** 전체 Network State */
export interface NetworkState {
  substations: Substation[];
  branches: Branch[];
  generators: Generator[];
  loads: Load[];
}

// ─── Bus-Branch 축약 모델 (TP 출력 / PF 입력) ────────────────────────────────

export interface BusModel {
  id: number;
  type: BusType;
  vPu: number;
  thetaRad: number;
  substationIds: string[];
  isEnergized: boolean;
}

export interface BranchModel {
  id: string;
  fromBus: number;
  toBus: number;
  r: number;
  x: number;
  b: number;
  ratingMVA: number;
  originalBranchId: string;
}

export interface GenModel {
  id: string;
  bus: number;
  pMW: number;
  qMvar: number;
  vPu: number;
  busType: BusType;
  qMaxMvar: number;
  qMinMvar: number;
}

export interface LoadModel {
  id: string;
  bus: number;
  pMW: number;
  qMvar: number;
}

export interface BusBranchModel {
  buses: BusModel[];
  branches: BranchModel[];
  generators: GenModel[];
  loads: LoadModel[];
  /** 노드 ID → 버스 ID 매핑 */
  nodeTobus: Map<string, number>;
}

// ─── PF / CA 결과 타입 ────────────────────────────────────────────────────────

export interface BusResult {
  busId: number;
  substationIds: string[];
  vPu: number;
  thetaDeg: number;
  pGenMW: number;
  qGenMvar: number;
  pLoadMW: number;
  qLoadMvar: number;
  isEnergized: boolean;
}

export interface BranchResult {
  branchId: string;
  fromBusId: number;
  toBusId: number;
  pFromMW: number;
  qFromMvar: number;
  pToMW: number;
  qToMvar: number;
  loading: number;           // % of rating
  isEnergized: boolean;
  isOverloaded: boolean;
}

export interface PowerFlowResult {
  converged: boolean;
  iterations: number;
  buses: BusResult[];
  branches: BranchResult[];
  totalGenMW: number;
  totalLoadMW: number;
  totalLossMW: number;
}

export interface Violation {
  type: 'OVERLOAD' | 'VOLTAGE_HIGH' | 'VOLTAGE_LOW' | 'ISLAND';
  elementId: string;
  elementName: string;
  value: number;
  limit: number;
  severity: AlarmSeverity;
}

export interface ContingencyResult {
  contingencyId: string;
  contingencyName: string;
  converged: boolean;
  violations: Violation[];
}

export interface Alarm {
  id: string;
  timestamp: Date;
  severity: AlarmSeverity;
  message: string;
  source: string;
}
