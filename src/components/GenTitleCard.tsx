import { useUI } from '../context/UIContext';
import { stressTest, resetFullAutoQueue } from '../game/autopilot';

const AMOUNTS: { label: string; pct: number }[] = [
  { label: '1%', pct: 1 },
  { label: '10%', pct: 10 },
  { label: '50%', pct: 50 },
  { label: 'Max', pct: 100 },
];

interface Props {
  onScrollTop: () => void;
  onScrollBottom: () => void;
}

export function GenTitleCard({ onScrollTop, onScrollBottom }: Props) {
  const { state, dispatch } = useUI();
  return (
    <div className="card gen-title-card fade-in" style={{ animationDelay: '.08s' }}>
      <div className="gen-title-info">
        <div className="tier-badge" id="max-tier-text">—</div>
        <div>
          <h2>Generators</h2>
          <p>Each tier produces the previous one — buy one to unlock the next</p>
        </div>
      </div>
      <div className="gen-title-actions">
        <div className="amount-segment" id="amount-segment">
          {AMOUNTS.map(a => (
            <button
              key={a.pct}
              className={'seg-btn' + (state.buyAmountPct === a.pct ? ' selected' : '')}
              data-amt={a.pct}
              onClick={() => dispatch({ type: 'set-buy-amount', pct: a.pct })}
            >{a.label}</button>
          ))}
        </div>
        <button
          className={'icon-btn small' + (state.autoBuy ? ' active' : '')}
          aria-label="Auto-buy"
          title="Auto-buy: keeps unlocking the next generator (uses the selected % amount)"
          onClick={() => dispatch({ type: 'toggle-autobuy' })}
        ><i className="ti ti-bolt" /></button>
        <button
          className={'icon-btn small' + (state.fullAuto ? ' active' : '')}
          aria-label="Full autopilot"
          title="Full autopilot: buys generators (next + existing) AND every affordable upgrade (gen, sparks, coins). Uses the selected % amount."
          onClick={() => {
            if (!state.fullAuto) resetFullAutoQueue();
            dispatch({ type: 'toggle-fullauto' });
          }}
        ><i className="ti ti-robot" /></button>
        <button
          className={'icon-btn small' + (state.equalizer ? ' active' : '')}
          aria-label="Equalizer"
          title="Equalizer: buys gen upgrades bottom-up keeping every generator at the same upgrade level."
          onClick={() => dispatch({ type: 'toggle-equalizer' })}
        ><i className="ti ti-equal" /></button>
        <button
          className="icon-btn small"
          aria-label="Stress test"
          title="Stress test: grants 1 unit of the next 1,000 generators. Click again to keep extending. For testing only."
          onClick={() => stressTest(1000)}
        ><i className="ti ti-flask" /></button>
        <label className="gen-cap" title="Stop the autopilot from unlocking generators beyond this tier. Leave empty for no cap.">
          <i className="ti ti-arrow-bar-to-up" />
          <input
            type="number"
            placeholder="∞"
            min={1}
            inputMode="numeric"
            defaultValue={state.genCap > 0 ? state.genCap : ''}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              dispatch({ type: 'set-gen-cap', cap: (isFinite(v) && v >= 1) ? v : 0 });
            }}
          />
        </label>
        <button className="icon-btn small" aria-label="Scroll to top" onClick={onScrollTop}>
          <i className="ti ti-arrow-bar-to-up" />
        </button>
        <button className="icon-btn small" aria-label="Scroll to bottom" onClick={onScrollBottom}>
          <i className="ti ti-arrow-bar-to-down" />
        </button>
      </div>
    </div>
  );
}
