import { useUI } from '../context/UIContext';
import { PalettePopover } from './PalettePopover';

export function Header() {
  const { state, dispatch } = useUI();
  const themeIcon = state.theme === 'dark' ? 'ti-moon' : 'ti-sun';
  return (
    <div className="card controls-card fade-in">
      <div className="logo">
        <div className="logo-mark">C</div>
        <span>Cascade</span>
      </div>
      <div className="controls-center">
        <div className="center-group">
          <button
            id="freemode-toggle"
            className={'icon-btn' + (state.freeMode ? ' active' : '')}
            aria-label="Easy mode active"
            style={state.freeMode ? {} : { display: 'none' }}
            disabled={state.freeModeLocked}
            onClick={() => dispatch({ type: 'toggle-free-mode' })}
            title={state.freeMode ? 'Easy mode active' : ''}
          >
            <i className="ti ti-bolt" />
          </button>
          <div className="palette-wrap">
            <button
              id="palette-toggle"
              className="icon-btn"
              aria-label="Choose accent color"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'set-palette-open', open: !state.paletteOpen });
              }}
            >
              <i className="ti ti-palette" />
            </button>
            <PalettePopover />
          </div>
          <button
            id="theme-toggle"
            className="icon-btn"
            aria-label="Toggle theme"
            onClick={() => {
              const next = state.theme === 'dark' ? 'light' : 'dark';
              dispatch({ type: 'set-theme', theme: next });
              // Swap black/white accent when theme changes (keep contrast)
              if (next === 'dark' && state.accent === 'black') dispatch({ type: 'set-accent', accent: 'white' });
              else if (next === 'light' && state.accent === 'white') dispatch({ type: 'set-accent', accent: 'black' });
            }}
          >
            <i id="theme-icon" className={'ti ' + themeIcon} />
          </button>
        </div>
      </div>
      <div className="controls-right">
        <span className="play-time">
          <i className="ti ti-activity" />
          <span id="fps-text">— fps</span>
        </span>
        <span className="play-time" id="cpu-ind" hidden title="System pressure (Compute Pressure API)">
          <i className="ti ti-cpu" />
          <span id="cpu-text">—</span>
        </span>
        <span className="play-time">
          <i className="ti ti-clock" />
          <span id="elapsed-text">0s</span>
        </span>
        <span className="play-time has-tip" id="save-ind" data-tip="">
          <i id="save-icon" className="ti ti-cloud-check" />
          <span id="save-text">saved</span>
        </span>
        <button
          className="hero-btn"
          aria-label="Leaderboard"
          onClick={() => dispatch({ type: 'set-modal', modal: 'leaderboard' })}
        >
          <i className="ti ti-trophy" />
          <span>Leaderboard</span>
        </button>
        <button
          className="hero-btn"
          aria-label="Reset progress"
          onClick={() => dispatch({ type: 'set-modal', modal: 'reset' })}
        >
          <i className="ti ti-refresh" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
