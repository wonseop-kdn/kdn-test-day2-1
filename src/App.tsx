
import TopBar from './components/TopBar';
import SingleLineDiagram from './components/SLD/SingleLineDiagram';
import AlarmPanel from './components/panels/AlarmPanel';
import ResultsPanel from './components/panels/ResultsPanel';
import { useEMSStore } from './store/networkStore';

export default function App() {
  const { activePanel } = useEMSStore();

  return (
    <div className="app-shell">
      <TopBar />

      <div className="main-layout">
        {/* 단선도 영역 */}
        <div className="sld-area">
          <SingleLineDiagram />
        </div>

        {/* 사이드 패널 */}
        <div className="side-panel">
          {/* 알람 패널 (항상 상단) */}
          <AlarmPanel />

          {/* 결과 탭 패널 */}
          <ResultsPanel />
        </div>
      </div>

      {/* 하단 상태표시줄 */}
      <footer className="statusbar">
        <span>KDN EMS DTS Prototype – IEEE 5-Bus Node-Breaker Simulator</span>
        <span style={{ color: '#374151' }}>|</span>
        <span>CB 클릭으로 개폐 조작 → TP→PF 자동 재계산</span>
        <span style={{ color: '#374151' }}>|</span>
        <span style={{ color: activePanel === 'alarms' ? '#22d3ee' : '#475569' }}>
          {new Date().toLocaleDateString('ko-KR')}
        </span>
      </footer>
    </div>
  );
}
