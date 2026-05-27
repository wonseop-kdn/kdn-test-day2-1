
import { useEMSStore } from '../../store/networkStore';
import type { Alarm } from '../../types/network';

function severityColor(s: Alarm['severity']): string {
  if (s === 'CRITICAL') return '#ef4444';
  if (s === 'WARNING')  return '#f59e0b';
  return '#22d3ee';
}

function severityBg(s: Alarm['severity']): string {
  if (s === 'CRITICAL') return 'rgba(239,68,68,0.08)';
  if (s === 'WARNING')  return 'rgba(245,158,11,0.08)';
  return 'transparent';
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('ko-KR', { hour12: false });
}

export default function AlarmPanel() {
  const { alarms, clearAlarms } = useEMSStore();

  return (
    <div className="panel">
      <div className="panel-header">
        <span>EVENT SUMMARY</span>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span className="badge badge-info">{alarms.length}</span>
          <button className="btn-sm" onClick={clearAlarms}>CLEAR</button>
        </div>
      </div>
      <div className="panel-body alarm-list">
        {alarms.length === 0 && (
          <div className="empty-state">알람 없음</div>
        )}
        {alarms.map(alarm => (
          <div
            key={alarm.id}
            className="alarm-row"
            style={{ background: severityBg(alarm.severity) }}
          >
            <div className="alarm-left">
              <span
                className="alarm-dot"
                style={{ background: severityColor(alarm.severity) }}
              />
              <span className="alarm-time">{formatTime(alarm.timestamp)}</span>
              <span
                className="alarm-severity"
                style={{ color: severityColor(alarm.severity) }}
              >
                [{alarm.severity.padEnd(8)}]
              </span>
            </div>
            <div className="alarm-msg">
              <span className="alarm-source">{alarm.source}</span>
              {alarm.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
