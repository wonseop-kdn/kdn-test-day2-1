
import { useEMSStore } from '../../store/networkStore';
import type { BusResult, BranchResult, ContingencyResult } from '../../types/network';

// ─── 버스 결과 ────────────────────────────────────────────────────────────────

function BusTable({ buses }: { buses: BusResult[] }) {
  const sorted = [...buses].sort((a, b) => a.busId - b.busId);
  return (
    <div className="panel-body">
      <table className="data-table">
        <thead>
          <tr>
            <th>모선</th>
            <th>V (pu)</th>
            <th>θ (°)</th>
            <th>PG (MW)</th>
            <th>PL (MW)</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(bus => (
            <tr key={bus.busId} className={!bus.isEnergized ? 'row-dead' : ''}>
              <td style={{ color:'#93c5fd' }}>{bus.substationIds.join('/')}</td>
              <td className={bus.vPu < 0.95 || bus.vPu > 1.05 ? 'cell-warn' : 'cell-ok'}>
                {bus.isEnergized ? bus.vPu.toFixed(4) : '—'}
              </td>
              <td style={{ color:'#94a3b8' }}>
                {bus.isEnergized ? `${bus.thetaDeg >= 0 ? '+' : ''}${bus.thetaDeg.toFixed(2)}` : '—'}
              </td>
              <td style={{ color:'#4ade80' }}>
                {bus.isEnergized ? bus.pGenMW.toFixed(1) : '—'}
              </td>
              <td style={{ color:'#fbbf24' }}>
                {bus.isEnergized ? bus.pLoadMW.toFixed(1) : '—'}
              </td>
              <td>
                <span className={bus.isEnergized ? 'badge badge-ok' : 'badge badge-dead'}>
                  {bus.isEnergized ? 'LIVE' : 'DEAD'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 선로 결과 ────────────────────────────────────────────────────────────────

function BranchTable({ branches }: { branches: BranchResult[] }) {
  const sorted = [...branches].sort((a, b) => a.branchId.localeCompare(b.branchId));
  return (
    <div className="panel-body">
      <table className="data-table">
        <thead>
          <tr>
            <th>선로</th>
            <th>P_from (MW)</th>
            <th>Q_from (Mvar)</th>
            <th>P_to (MW)</th>
            <th>부하율 (%)</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(br => (
            <tr key={br.branchId} className={!br.isEnergized ? 'row-dead' : ''}>
              <td style={{ color:'#93c5fd' }}>{br.branchId}</td>
              <td style={{ color:'#22d3ee' }}>
                {br.isEnergized ? `${br.pFromMW >= 0 ? '+' : ''}${br.pFromMW.toFixed(1)}` : '—'}
              </td>
              <td style={{ color:'#94a3b8' }}>
                {br.isEnergized ? `${br.qFromMvar >= 0 ? '+' : ''}${br.qFromMvar.toFixed(1)}` : '—'}
              </td>
              <td style={{ color:'#22d3ee' }}>
                {br.isEnergized ? `${br.pToMW >= 0 ? '+' : ''}${br.pToMW.toFixed(1)}` : '—'}
              </td>
              <td className={br.isOverloaded ? 'cell-crit' : br.loading > 90 ? 'cell-warn' : 'cell-ok'}>
                {br.isEnergized ? br.loading.toFixed(1) : '—'}
              </td>
              <td>
                {br.isEnergized
                  ? <span className={br.isOverloaded ? 'badge badge-crit' : 'badge badge-ok'}>
                      {br.isOverloaded ? 'OVERLOAD' : 'NORMAL'}
                    </span>
                  : <span className="badge badge-dead">OPEN</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 상정사고 해석 결과 ───────────────────────────────────────────────────────

function CATable({ results }: { results: ContingencyResult[] }) {
  if (results.length === 0) {
    return (
      <div className="panel-body">
        <div className="empty-state">
          상정사고 해석 미실행<br />
          <span style={{ fontSize: 11, color:'#475569' }}>오른쪽 CA RUN 버튼으로 N-1 해석을 시작하세요</span>
        </div>
      </div>
    );
  }

  const sorted = [...results].sort((a, b) => b.violations.length - a.violations.length);

  return (
    <div className="panel-body">
      <table className="data-table">
        <thead>
          <tr>
            <th>상정사고</th>
            <th>수렴</th>
            <th>위반 건수</th>
            <th>위반 내용</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(ca => (
            <tr key={ca.contingencyId}
              className={ca.violations.length > 0 ? 'row-warn' : ''}>
              <td style={{ color:'#93c5fd', fontSize:10 }}>{ca.contingencyName}</td>
              <td>
                <span className={ca.converged ? 'badge badge-ok' : 'badge badge-dead'}>
                  {ca.converged ? 'OK' : 'FAIL'}
                </span>
              </td>
              <td>
                <span className={
                  ca.violations.length === 0 ? 'badge badge-ok' :
                  ca.violations.some(v => v.severity === 'CRITICAL') ? 'badge badge-crit' :
                  'badge badge-warn'
                }>
                  {ca.violations.length}
                </span>
              </td>
              <td style={{ fontSize: 9, color:'#94a3b8' }}>
                {ca.violations.slice(0, 2).map((v, i) => (
                  <span key={i}
                    style={{ color: v.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>
                    {v.elementName} ({v.value.toFixed(1)})
                    {i < 1 && ca.violations.length > 1 ? ' ' : ''}
                  </span>
                ))}
                {ca.violations.length > 2 && (
                  <span style={{ color:'#64748b' }}> +{ca.violations.length - 2}건</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 통합 결과 패널 ───────────────────────────────────────────────────────────

export default function ResultsPanel() {
  const { pfResult, caResults, activePanel, setActivePanel, caRunning, runCA } = useEMSStore();

  const tabs: { key: typeof activePanel; label: string }[] = [
    { key: 'alarms', label: 'ALARMS' },
    { key: 'bus',    label: 'BUS' },
    { key: 'branch', label: 'LINE' },
    { key: 'ca',     label: 'CA' },
  ];

  return (
    <div className="panel results-panel">
      <div className="panel-header" style={{ padding: '6px 8px' }}>
        <div className="tab-bar">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`tab-btn ${activePanel === t.key ? 'tab-active' : ''}`}
              onClick={() => setActivePanel(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activePanel === 'ca' && (
          <button
            className="btn-sm btn-accent"
            onClick={runCA}
            disabled={caRunning}
          >
            {caRunning ? '계산중...' : 'CA RUN'}
          </button>
        )}
      </div>

      {activePanel === 'bus' && pfResult && (
        <BusTable buses={pfResult.buses} />
      )}
      {activePanel === 'bus' && !pfResult && (
        <div className="panel-body"><div className="empty-state">결과 없음</div></div>
      )}

      {activePanel === 'branch' && pfResult && (
        <BranchTable branches={pfResult.branches} />
      )}
      {activePanel === 'branch' && !pfResult && (
        <div className="panel-body"><div className="empty-state">결과 없음</div></div>
      )}

      {activePanel === 'ca' && (
        <CATable results={caResults} />
      )}
    </div>
  );
}
