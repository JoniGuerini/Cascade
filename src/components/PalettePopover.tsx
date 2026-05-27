import { useEffect, useRef } from 'react';
import { useUI } from '../context/UIContext';
import { ACCENT_THEMES } from '../game/constants';

const COLOR_KEYS = ['salmon','red','maroon','amber','yellow','brown','olive','lime','teal','blue','indigo','purple','magenta','pink'];
const NEUTRAL_KEYS = ['slate','black','white'];

export function PalettePopover() {
  const { state, dispatch } = useUI();
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.paletteOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const btn = document.getElementById('palette-toggle');
      if (popRef.current?.contains(target)) return;
      if (btn?.contains(target)) return;
      dispatch({ type: 'set-palette-open', open: false });
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [state.paletteOpen, dispatch]);

  return (
    <div ref={popRef} className="palette-popover" id="palette-popover" hidden={!state.paletteOpen}>
      <div className="palette-section">
        <div className="palette-label">Colors</div>
        <div className="palette-grid">
          {COLOR_KEYS.map(k => (
            <button
              key={k}
              type="button"
              className="swatch"
              data-accent={k}
              style={{ ['--c' as any]: ACCENT_THEMES[k].light }}
              onClick={() => dispatch({ type: 'set-accent', accent: k })}
            />
          ))}
        </div>
      </div>
      <div className="palette-section">
        <div className="palette-label">Neutrals</div>
        <div className="palette-grid">
          {NEUTRAL_KEYS.map(k => (
            <button
              key={k}
              type="button"
              className="swatch"
              data-accent={k}
              style={{ ['--c' as any]: ACCENT_THEMES[k].light }}
              onClick={() => dispatch({ type: 'set-accent', accent: k })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
