interface Props {
  scrollRef: React.RefObject<HTMLDivElement>;
  rowsRef: React.RefObject<HTMLDivElement>;
}

export function ColHeaders() {
  return (
    <div className="card col-headers fade-in" style={{ animationDelay: '.12s' }}>
      <div>Tier</div>
      <div>Lv</div>
      <div>Owned</div>
      <div>Rate</div>
      <div>Milestones</div>
      <div className="cost-header"><span>Cost</span></div>
      <div></div>
      <div></div>
    </div>
  );
}

export function GeneratorList({ scrollRef, rowsRef }: Props) {
  return (
    <div className="gen-list fade-in" id="gen-scroll" ref={scrollRef} style={{ animationDelay: '.16s' }}>
      <div id="gen-rows" ref={rowsRef}></div>
    </div>
  );
}
