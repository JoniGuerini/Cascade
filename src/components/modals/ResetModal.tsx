import { useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { state as gameState, setResetting } from '../../game/state';
import { fmt, formatElapsed } from '../../game/format';
import { D0 } from '../../game/constants';
import { SAVE_KEY } from '../../game/constants';

export function ResetModal() {
  const { state, dispatch } = useUI();
  const open = state.activeModal === 'reset';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'set-modal', modal: null });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dispatch]);

  if (!open) return null;
  const totalGens = gameState.gens.reduce((a, b) => a.add(b), D0);
  const timeStr = formatElapsed(Math.floor((Date.now() - gameState.startTime) / 1000));

  const close = () => dispatch({ type: 'set-modal', modal: null });
  const confirm = () => {
    setResetting(true);
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem('cascade-freemode-locked');
      localStorage.removeItem('cascade-autobuy');
      localStorage.removeItem('cascade-fullauto');
      localStorage.removeItem('cascade-equalizer');
      localStorage.removeItem('cascade-gen-cap');
      localStorage.setItem('cascade-needs-setup', '1');
    } catch (_) {}
    location.reload();
  };

  return (
    <div className="modal-backdrop" id="modal" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal-card reset-card">
        <div className="modal-icon reset-icon">
          <i className="ti ti-alert-triangle" />
        </div>
        <h3>Reset progress?</h3>
        <p className="modal-intro">All progress from this run will be permanently lost.</p>
        <div className="reset-stats-grid">
          <div className="reset-stat">
            <div className="reset-stat-value">{fmt(gameState.energy)}</div>
            <div className="reset-stat-label">Energy</div>
          </div>
          <div className="reset-stat">
            <div className="reset-stat-value">{fmt(totalGens)}</div>
            <div className="reset-stat-label">Generators</div>
          </div>
          <div className="reset-stat">
            <div className="reset-stat-value">{timeStr}</div>
            <div className="reset-stat-label">Play time</div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-modal cancel" onClick={close}>Cancel</button>
          <button className="btn-modal danger" onClick={confirm}>Reset everything</button>
        </div>
      </div>
    </div>
  );
}
