import { useCallback } from 'react';
import { useEMSStore } from '../../store/networkStore';
import { SUBSTATION_CFGS, LINE_CFGS, type SubstationCfg, type BayCfg } from './sldConfig';
import type { PowerFlowResult, BranchResult, BusResult } from '../../types/network';

// ─── 색상 헬퍼 ────────────────────────────────────────────────────────────────

function lineColor(br: BranchResult | undefined): string {
  if (!br || !br.isEnergized) return '#374151';
  if (br.isOverloaded)  return '#ef4444';
  if (br.loading > 90)  return '#f97316';
  if (br.loading > 70)  return '#eab308';
  return '#22d3ee';
}

function busbarColor(energized: boolean): string {
  return energized ? '#22d3ee' : '#374151';
}

function loadingStroke(br: BranchResult | undefined): number {
  if (!br || !br.isEnergized) return 1.5;
  if (br.loading > 90) return 3.5;
  return 2.5;
}

// ─── CB 기호 ─────────────────────────────────────────────────────────────────

interface CBSymbolProps {
  id: string;
  x: number; y: number;
  closed: boolean;
  controllable: boolean;
  onToggle: (id: string) => void;
}

function CBSymbol({ id, x, y, closed, controllable, onToggle }: CBSymbolProps) {
  const size = 11;
  const half = size / 2;
  const color = closed ? '#22c55e' : '#ef4444';
  const cursor = controllable ? 'pointer' : 'default';

  return (
    <g
      onClick={controllable ? () => onToggle(id) : undefined}
      style={{ cursor }}
      className="cb-symbol"
    >
      {/* 호버 영역 확장 (클릭 편의) */}
      {controllable && (
        <rect x={x - 12} y={y - 12} width={24} height={24} fill="transparent" stroke="none" />
      )}

      {/* CB 박스 */}
      <rect
        x={x - half} y={y - half}
        width={size} height={size}
        fill={closed ? color : '#0a1628'}
        stroke={color}
        strokeWidth={1.8}
        rx={1.5}
      />

      {/* 투입(Closed): 수평 바 */}
      {closed && (
        <line
          x1={x - half + 2} y1={y}
          x2={x + half - 2} y2={y}
          stroke="#0f172a" strokeWidth={2}
        />
      )}

      {/* 개방(Open): 빨간 X 표시 */}
      {!closed && (
        <g opacity={0.9}>
          <line x1={x - half + 2} y1={y - half + 2} x2={x + half - 2} y2={y + half - 2}
            stroke="#ef4444" strokeWidth={1.8} />
          <line x1={x + half - 2} y1={y - half + 2} x2={x - half + 2} y2={y + half - 2}
            stroke="#ef4444" strokeWidth={1.8} />
        </g>
      )}
    </g>
  );
}

// ─── DS 기호 ─────────────────────────────────────────────────────────────────

function DSSymbol({ x, y }: { x: number; y: number }) {
  return (
    <g className="ds-symbol" opacity={0.6}>
      <line x1={x - 5} y1={y - 3} x2={x + 5} y2={y + 3} stroke="#94a3b8" strokeWidth={1} />
      <line x1={x - 5} y1={y + 3} x2={x + 5} y2={y - 3} stroke="#94a3b8" strokeWidth={1} />
    </g>
  );
}

// ─── 변전소 렌더링 ────────────────────────────────────────────────────────────

interface SubstationProps {
  cfg: SubstationCfg;
  pfResult: PowerFlowResult | null;
  getSwitchStatus: (id: string) => 'Open' | 'Closed';
  onToggleCB: (id: string) => void;
}

function SubstationSVG({ cfg, pfResult, getSwitchStatus, onToggleCB }: SubstationProps) {
  const busResult: BusResult | undefined = pfResult?.buses.find(b =>
    b.substationIds.includes(cfg.id)
  );
  const energized = busResult?.isEnergized ?? false;
  const busFill = energized ? '#0f1f35' : '#111827';
  const busStroke = energized ? '#1e4d7a' : '#1f2937';
  const glowFilter = energized ? 'url(#glowBlue)' : 'none';

  return (
    <g className="substation">
      {/* 변전소 박스 */}
      <rect
        x={cfg.cx - cfg.w / 2} y={cfg.cy - cfg.h / 2}
        width={cfg.w} height={cfg.h}
        fill={busFill} stroke={busStroke} strokeWidth={1.5}
        rx={4}
        filter={glowFilter}
      />

      {/* 변전소 ID 라벨 (상단) */}
      <text
        x={cfg.cx} y={cfg.cy - cfg.h / 2 + 13}
        textAnchor="middle"
        fontSize={11} fontWeight="600"
        fill={energized ? '#93c5fd' : '#6b7280'}
        fontFamily="monospace"
      >
        {cfg.id}
      </text>

      {/* 전압 / 각도 표시 */}
      {energized && busResult && (
        <>
          <text
            x={cfg.cx} y={cfg.cy - cfg.h / 2 + 26}
            textAnchor="middle" fontSize={10}
            fill="#67e8f9" fontFamily="monospace"
          >
            {busResult.vPu.toFixed(4)} pu
          </text>
          <text
            x={cfg.cx} y={cfg.cy - cfg.h / 2 + 38}
            textAnchor="middle" fontSize={9}
            fill="#94a3b8" fontFamily="monospace"
          >
            {busResult.thetaDeg >= 0 ? '+' : ''}{busResult.thetaDeg.toFixed(2)}°
          </text>
        </>
      )}
      {!energized && (
        <g>
          {/* 대각선 X (사선 표시) */}
          <line x1={cfg.cx - cfg.w/2 + 8} y1={cfg.cy - cfg.h/2 + 8}
                x2={cfg.cx + cfg.w/2 - 8} y2={cfg.cy + cfg.h/2 - 8}
                stroke="#374151" strokeWidth={1.5} opacity={0.5} />
          <line x1={cfg.cx + cfg.w/2 - 8} y1={cfg.cy - cfg.h/2 + 8}
                x2={cfg.cx - cfg.w/2 + 8} y2={cfg.cy + cfg.h/2 - 8}
                stroke="#374151" strokeWidth={1.5} opacity={0.5} />
          <text x={cfg.cx} y={cfg.cy + 5}
            textAnchor="middle" fontSize={12} fontWeight="700"
            fill="#4b5563" fontFamily="monospace" letterSpacing={1}>
            DEAD
          </text>
        </g>
      )}

      {/* 모선(Busbar) */}
      <line
        x1={cfg.busX1} y1={cfg.busY}
        x2={cfg.busX2} y2={cfg.busY}
        stroke={busbarColor(energized)} strokeWidth={4}
        strokeLinecap="round"
      />

      {/* 베이(Bay) 렌더링 */}
      {cfg.bays.map(bay => (
        <BaySVG
          key={bay.cbId}
          bay={bay}
          busY={cfg.busY}
          busX1={cfg.busX1}
          busX2={cfg.busX2}
          energized={energized}
          closed={getSwitchStatus(bay.cbId) === 'Closed'}
          onToggleCB={onToggleCB}
        />
      ))}
    </g>
  );
}

// ─── 베이 렌더링 ──────────────────────────────────────────────────────────────

interface BayProps {
  bay: BayCfg;
  busY: number; busX1: number; busX2: number;
  energized: boolean;
  closed: boolean;
  onToggleCB: (id: string) => void;
}

function BaySVG({ bay, busY, energized, closed, onToggleCB }: BayProps) {
  // ① 버스바쪽 배선: 버스가 활선이면 cyan
  const busWireColor = energized ? '#22d3ee' : '#374151';
  // ② 터미널쪽 배선: 버스 활선 + CB 투입이어야 cyan, 아니면 회색 점선
  const termWireColor = (energized && closed) ? '#22d3ee' : '#2d3748';
  const termDash = (!energized || !closed) ? '5 4' : undefined;

  const { cbPos, dsPos, exitPos, cbId, dsId, dir, label, type } = bay;
  const isHorizontal = dir === 'E' || dir === 'W';

  // CB 위치에서 버스바 방향으로의 연결점 (CB 심볼 크기 반영)
  const half = 6;
  const busConnectX = (dir === 'E') ? cbPos.x - half :
                      (dir === 'W') ? cbPos.x + half : cbPos.x;
  const busConnectY = (dir === 'N') ? cbPos.y + half :
                      (dir === 'S') ? cbPos.y - half : cbPos.y;
  // CB에서 터미널 방향
  const termStartX = (dir === 'E') ? cbPos.x + half :
                     (dir === 'W') ? cbPos.x - half : cbPos.x;
  const termStartY = (dir === 'N') ? cbPos.y - half :
                     (dir === 'S') ? cbPos.y + half : cbPos.y;

  // 구간 ①: busbar → CB
  const busWireD = isHorizontal
    ? `M ${busConnectX},${busY} L ${busConnectX},${busConnectY}`
    : `M ${cbPos.x},${busY} L ${cbPos.x},${busConnectY}`;
  // 구간 ②: CB → DS → exit
  const termWireD = isHorizontal
    ? `M ${termStartX},${termStartY} L ${dsPos.x},${dsPos.y} L ${exitPos.x},${exitPos.y}`
    : `M ${termStartX},${termStartY} L ${exitPos.x},${exitPos.y}`;

  // 장비 레이블
  const labelX = type === 'gen' ? exitPos.x - 22 :
                 type === 'load' ? exitPos.x - 22 :
                 (dir === 'E') ? exitPos.x + 6 :
                 (dir === 'W') ? exitPos.x - 6 : exitPos.x;
  const labelY = type === 'gen' ? exitPos.y + 14 :
                 type === 'load' ? exitPos.y + 14 :
                 (dir === 'N') ? exitPos.y - 6 :
                 (dir === 'S') ? exitPos.y + 14 :
                 exitPos.y + 4;
  const labelAnchor = (dir === 'E') ? 'start' : (dir === 'W') ? 'end' : 'middle';

  const genSymbol = type === 'gen' && (
    <g opacity={energized ? 1 : 0.35}>
      <circle cx={exitPos.x} cy={exitPos.y + 9} r={8}
        fill={energized ? 'rgba(74,222,128,0.1)' : 'none'} stroke="#4ade80" strokeWidth={1.5} />
      <text x={exitPos.x} y={exitPos.y + 13}
        textAnchor="middle" fontSize={9} fontWeight="700" fill="#4ade80">G</text>
    </g>
  );
  const loadSymbol = type === 'load' && (
    <polygon
      points={`${exitPos.x},${exitPos.y + 2} ${exitPos.x - 7},${exitPos.y + 14} ${exitPos.x + 7},${exitPos.y + 14}`}
      fill="#fbbf24" opacity={energized ? 0.85 : 0.25}
    />
  );

  return (
    <g>
      {/* ① 버스바 → CB 구간 (활선 색상) */}
      <path d={busWireD} stroke={busWireColor} strokeWidth={1.8} fill="none" strokeLinecap="round" />

      {/* ② CB → 터미널 구간 (단선 시 회색 점선) */}
      <path
        d={termWireD}
        stroke={termWireColor}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={termDash}
      />

      {/* DS 기호 */}
      <DSSymbol x={dsPos.x} y={dsPos.y} />

      {/* CB 기호 */}
      <CBSymbol
        id={cbId}
        x={cbPos.x} y={cbPos.y}
        closed={closed}
        controllable={true}
        onToggle={onToggleCB}
      />

      {/* 장비 기호 */}
      {genSymbol}
      {loadSymbol}

      {/* 장비 라벨 */}
      <text
        x={labelX} y={labelY + (type !== 'line' ? 15 : 0)}
        textAnchor={labelAnchor}
        fontSize={10} fill="#64748b" fontFamily="monospace"
      >
        {label}
      </text>

      <title>{`${cbId} / ${dsId} – Click CB to toggle`}</title>
    </g>
  );
}

// ─── 선로 렌더링 ──────────────────────────────────────────────────────────────

interface LineProps {
  branchId: string;
  d: string;
  labelPos: { x: number; y: number };
  pfResult: PowerFlowResult | null;
}

/** SVG path에서 두 끝점을 파싱하여 t(0~1) 지점의 좌표 반환 */
function pathMidpoint(d: string, t = 0.5): { x: number; y: number; angle: number } {
  const m = d.match(/M\s*([\d.]+),([\d.]+)\s*L\s*([\d.]+),([\d.]+)/);
  if (!m) return { x: 0, y: 0, angle: 0 };
  const x1 = parseFloat(m[1]), y1 = parseFloat(m[2]);
  const x2 = parseFloat(m[3]), y2 = parseFloat(m[4]);
  return {
    x: x1 + (x2 - x1) * t,
    y: y1 + (y2 - y1) * t,
    angle: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI,
  };
}

function LineSVG({ branchId, d, labelPos, pfResult }: LineProps) {
  const br = pfResult?.branches.find(b => b.branchId === branchId);
  const color = lineColor(br);
  const sw = loadingStroke(br);
  const isEnergized = br?.isEnergized ?? false;

  const pFrom = br?.pFromMW;
  const loading = br?.loading;
  const showFlow = isEnergized && pFrom !== undefined;

  // 방향 화살표: 선로 중간 50% 지점
  const mid = pathMidpoint(d, 0.5);
  // pFrom > 0 이면 from→to 방향, < 0 이면 to→from
  const arrowAngle = (pFrom !== undefined && pFrom < 0) ? mid.angle + 180 : mid.angle;

  return (
    <g className="line-element">
      {/* 활선 배경 글로우 */}
      {isEnergized && (
        <path d={d} stroke={color} strokeWidth={sw + 5} fill="none" opacity={0.12} />
      )}

      {/* 메인 선로 (비활선: 점선) */}
      <path
        d={d}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={isEnergized ? undefined : '10 6'}
      />

      {/* 전력 흐름 방향 화살표 (활선일 때만) */}
      {showFlow && Math.abs(pFrom!) > 0.5 && (
        <g transform={`translate(${mid.x},${mid.y}) rotate(${arrowAngle})`}>
          <polygon
            points="-6,-4 6,0 -6,4"
            fill={color}
            opacity={0.85}
          />
        </g>
      )}

      {/* 조류 정보 라벨 */}
      {showFlow && (
        <g>
          <rect
            x={labelPos.x - 32} y={labelPos.y - 10}
            width={64} height={24}
            fill="#070d1a" stroke={color} strokeWidth={0.8}
            rx={3} opacity={0.95}
          />
          <text
            x={labelPos.x} y={labelPos.y + 2}
            textAnchor="middle" fontSize={10}
            fill={color} fontFamily="monospace" fontWeight="700"
          >
            {pFrom! >= 0 ? '+' : ''}{pFrom!.toFixed(1)} MW
          </text>
          <text
            x={labelPos.x} y={labelPos.y + 12}
            textAnchor="middle" fontSize={9}
            fill={loading! > 90 ? '#ef4444' : loading! > 70 ? '#f59e0b' : '#64748b'}
            fontFamily="monospace"
          >
            {loading!.toFixed(1)}%
          </text>
        </g>
      )}

      {/* 비활선 라벨 */}
      {!isEnergized && (
        <text
          x={labelPos.x} y={labelPos.y}
          textAnchor="middle" fontSize={9}
          fill="#374151" fontFamily="monospace"
        >
          OPEN
        </text>
      )}
    </g>
  );
}

// ─── 메인 SLD 컴포넌트 ────────────────────────────────────────────────────────

export default function SingleLineDiagram() {
  const { network, pfResult, toggleCB } = useEMSStore();

  const getSwitchStatus = useCallback(
    (swId: string): 'Open' | 'Closed' => {
      for (const ss of network.substations) {
        const sw = ss.switches.find(s => s.id === swId);
        if (sw) return sw.status;
      }
      return 'Open';
    },
    [network]
  );

  return (
    <div className="sld-container">
      <svg
        viewBox="0 0 1050 600"
        width="100%"
        style={{ background: '#070d1a', borderRadius: 8 }}
      >
        <defs>
          {/* 블루 발광 필터 */}
          <filter id="glowBlue" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* 배경 그리드 */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f1f30" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* 배경 */}
        <rect width="1050" height="600" fill="url(#grid)" />

        {/* 제목 */}
        <text x={525} y={22} textAnchor="middle"
          fontSize={13} fill="#475569" fontFamily="monospace" fontWeight="600">
          IEEE 5-BUS SYSTEM – NODE-BREAKER MODEL  |  345kV  |  BASE 100 MVA
        </text>

        {/* ── 선로 (변전소 뒤에 그려야 가려짐) ── */}
        {LINE_CFGS.map(lc => (
          <LineSVG
            key={lc.branchId}
            branchId={lc.branchId}
            d={lc.d}
            labelPos={lc.labelPos}
            pfResult={pfResult}
          />
        ))}

        {/* ── 변전소 ── */}
        {SUBSTATION_CFGS.map(cfg => (
          <SubstationSVG
            key={cfg.id}
            cfg={cfg}
            pfResult={pfResult}
            getSwitchStatus={getSwitchStatus}
            onToggleCB={toggleCB}
          />
        ))}

        {/* 범례 */}
        <g transform="translate(20, 548)">
          {[
            { color:'#22d3ee', label:'활선 (<70%)' },
            { color:'#eab308', label:'주의 (70-90%)' },
            { color:'#f97316', label:'경고 (>90%)' },
            { color:'#ef4444', label:'과부하 (>100%)' },
            { color:'#374151', label:'사선' },
          ].map((item, i) => (
            <g key={i} transform={`translate(${i * 140}, 0)`}>
              <line x1={0} y1={4} x2={20} y2={4}
                stroke={item.color} strokeWidth={2.5} />
              <text x={25} y={8} fontSize={9} fill="#94a3b8" fontFamily="monospace">
                {item.label}
              </text>
            </g>
          ))}
          <g transform="translate(700,0)">
            <rect x={0} y={-4} width={10} height={10} fill="#22c55e" />
            <text x={15} y={8} fontSize={9} fill="#94a3b8" fontFamily="monospace">CB 투입</text>
          </g>
          <g transform="translate(775,0)">
            <rect x={0} y={-4} width={10} height={10} fill="transparent" stroke="#ef4444" strokeWidth={1.5} />
            <text x={15} y={8} fontSize={9} fill="#94a3b8" fontFamily="monospace">CB 개방</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
