import { useState } from 'react';
import { useUI } from '../../context/UIContext';
import { state as gameState, setInSetup } from '../../game/state';

export function SetupModal() {
  const { state, dispatch } = useUI();
  const [mode, setMode] = useState<'normal' | 'easy' | null>(null);
  if (state.activeModal !== 'setup') return null;

  const start = () => {
    if (!mode) return;
    const freeMode = mode === 'easy';
    localStorage.setItem('cascade-freemode', freeMode ? '1' : '0');
    localStorage.setItem('cascade-freemode-locked', '1');
    localStorage.removeItem('cascade-needs-setup');
    gameState.startTime = Date.now();
    gameState.lastSave = Date.now();
    setInSetup(false);
    if (freeMode) {
      if (!state.freeMode) dispatch({ type: 'toggle-free-mode' });
    } else if (state.freeMode) {
      dispatch({ type: 'toggle-free-mode' });
    }
    dispatch({ type: 'lock-free-mode', value: true });
    dispatch({ type: 'mark-setup-done' });
  };

  return (
    <div className="modal-backdrop" id="setup-modal">
      <div className="modal-card setup-card">
        <div className="modal-icon setup-icon">
          <i className="ti ti-sparkles" />
        </div>
        <h3>Customize your run</h3>
        <p className="modal-intro">Pick a game mode — your choice is final for this run.</p>
        <div className="mode-grid">
          <button
            type="button"
            className={'mode-card' + (mode === 'normal' ? ' selected' : '')}
            onClick={() => setMode('normal')}
          >
            <div className="mode-name">Normal</div>
            <div className="mode-desc">Buying a generator consumes units of the previous tier. The full cascade challenge.</div>
          </button>
          <button
            type="button"
            className={'mode-card' + (mode === 'easy' ? ' selected' : '')}
            onClick={() => setMode('easy')}
          >
            <div className="mode-name">Easy</div>
            <div className="mode-desc">Skip the previous-tier requirement. Energy alone unlocks any tier.</div>
          </button>
        </div>
        <div className="modal-actions">
          <button className="btn-modal accent" disabled={!mode} onClick={start}>Start playing</button>
        </div>
      </div>
    </div>
  );
}
