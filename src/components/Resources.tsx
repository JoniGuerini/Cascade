import { useUI } from '../context/UIContext';

export function Resources() {
  const { dispatch } = useUI();
  const openPopover = (type: 'sparks' | 'coins', e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch({ type: 'set-upgrade-popover', popover: { ctx: { type }, anchorRect: rect } });
  };
  return (
    <div className="card resources-card fade-in" style={{ animationDelay: '.04s' }}>
      <div className="resource">
        <h1>
          <svg className="res-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" shapeRendering="geometricPrecision">
            <path d="M10 1 L3 9 L7 9 L6 15 L13 7 L9 7 Z" />
          </svg>
          Energy
        </h1>
        <p className="big" id="energy">1</p>
        <p className="rate"><span className="num" id="rate">+0</span> per second</p>
      </div>
      <div className="resource">
        <div className="resource-head">
          <h1>
            <svg className="res-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" shapeRendering="geometricPrecision">
              <path d="M8 1 L10 6 L15 8 L10 10 L8 15 L6 10 L1 8 L6 6 Z" />
            </svg>
            Sparks
          </h1>
          <button
            type="button"
            id="sparks-upgrade-pill"
            className="upgrade-pill"
            title="Upgrade sparks production"
            onClick={(e) => openPopover('sparks', e)}
          >+0</button>
        </div>
        <p className="big" id="sparks">1</p>
        <p className="rate"><span className="num" id="spark-rate">+0</span> per second</p>
      </div>
      <div className="resource">
        <div className="resource-head">
          <h1>
            <svg className="res-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" shapeRendering="geometricPrecision">
              <circle cx="8" cy="8" r="6" />
            </svg>
            Coins
          </h1>
          <button
            type="button"
            id="coins-upgrade-pill"
            className="upgrade-pill"
            title="Upgrade coins per milestone"
            onClick={(e) => openPopover('coins', e)}
          >+0</button>
        </div>
        <p className="big" id="coins">0</p>
        <p className="rate-hint">milestone rewards</p>
      </div>
    </div>
  );
}
