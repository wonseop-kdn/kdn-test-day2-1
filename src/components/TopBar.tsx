import { useEffect, useRef } from 'react';
import { useEMSStore } from '../store/networkStore';

export default function TopBar() {
  const {
    pfResult,
    scadaRunning,
    toggleScada,
    scadaTick,
    recalculate,
    network,
  } = useEMSStore();

  const scadaTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (scadaRunning) {
      scadaTimer.current = setInterval(scadaTick, 3000);
    } else {
      if (scadaTimer.current) clearInterval(scadaTimer.current);
    }
    return () => { if (scadaTimer.current) clearInterval(scadaTimer.current); };
  }, [scadaRunning, scadaTick]);

  const totalCBs = network.substations.flatMap(ss => ss.switches.filter(sw => sw.type === 'CB')).length;
  const openCBs  = network.substations.flatMap(ss => ss.switches.filter(sw => sw.type === 'CB' && sw.status === 'Open')).length;

  return (
    <header className="topbar">
      {/* 로고 / 제목 */}
      <div className="topbar-title">
        <span className="title-badge">EMS</span>
        <span className="title-text">DTS Simulator</span>
        <span className="title-sub">IEEE 5-Bus Node-Breaker</span>
      </div>

      {/* 계통 요약 */}
      <div className="topbar-stats">
        {pfResult && (
          <>
            <StatItem label="발전" value={`${pfResult.totalGenMW.toFixed(1)} MW`} color="#4ade80" />
            <Divider />
            <StatItem label="부하" value={`${pfResult.totalLoadMW.toFixed(1)} MW`} color="#fbbf24" />
            <Divider />
            <StatItem label="손실" value={`${pfResult.totalLossMW.toFixed(2)} MW`} color="#94a3b8" />
            <Divider />
            <StatItem
              label="PF"
              value={pfResult.converged ? `수렴 (${pfResult.iterations}회)` : '미수렴'}
              color={pfResult.converged ? '#22d3ee' : '#ef4444'}
            />
          </>
        )}
        <Divider />
        <StatItem label="CB 개방" value={`${openCBs}/${totalCBs}`} color={openCBs > 0 ? '#f59e0b' : '#22d3ee'} />
      </div>

      {/* 컨트롤 버튼 */}
      <div className="topbar-controls">
        <button className="btn-control" onClick={recalculate} title="조류계산 재실행">
          ⚡ RECALC
        </button>
        <button
          className={`btn-control ${scadaRunning ? 'btn-active' : ''}`}
          onClick={toggleScada}
          title="SCADA 주기 갱신 시뮬레이션"
        >
          {scadaRunning ? '⏹ SCADA OFF' : '▶ SCADA ON'}
        </button>
        <div className={`status-led ${pfResult?.converged ? 'led-green' : 'led-red'}`} />
      </div>
    </header>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="stat-item">
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={{ color }}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="stat-divider" />;
}
