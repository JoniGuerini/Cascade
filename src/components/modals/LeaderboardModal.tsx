import { useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from '../../context/UIContext';
import { SORTED_LB, YOU_NAME, YOU_RANK, YOU_DATA, LB_PAGE_SIZE, rankClass, rankPrefix } from '../../game/leaderboard';
import { fmtTier, formatElapsed } from '../../game/format';

type Tab = 'all-time' | 'month' | 'week';

export function LeaderboardModal() {
  const { state, dispatch } = useUI();
  const open = state.activeModal === 'leaderboard';
  const [tab, setTab] = useState<Tab>('all-time');
  const [page, setPage] = useState(() => YOU_RANK > 0 ? Math.ceil(YOU_RANK / LB_PAGE_SIZE) : 1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setPage(YOU_RANK > 0 ? Math.ceil(YOU_RANK / LB_PAGE_SIZE) : 1);
    setTab('all-time');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'set-modal', modal: null });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dispatch]);

  const totalPages = Math.ceil(SORTED_LB.length / LB_PAGE_SIZE);
  const pageRows = useMemo(() => {
    const start = (page - 1) * LB_PAGE_SIZE;
    const end = Math.min(SORTED_LB.length, start + LB_PAGE_SIZE);
    return { start, slice: SORTED_LB.slice(start, end) };
  }, [page]);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = 0; }, [page]);

  if (!open) return null;

  const pageNumbers = (() => {
    const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    if (page <= 3) [2, 3, 4].forEach(p => pages.add(p));
    if (page >= totalPages - 2) [totalPages - 1, totalPages - 2, totalPages - 3].forEach(p => pages.add(p));
    return [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  })();

  const close = () => dispatch({ type: 'set-modal', modal: null });
  const jumpToMe = () => {
    if (!YOU_RANK) return;
    setPage(Math.ceil(YOU_RANK / LB_PAGE_SIZE));
    setTimeout(() => {
      const row = document.querySelector(`.lb-row[data-rank="${YOU_RANK}"]`);
      if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="modal-backdrop leaderboard-backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal-card leaderboard-card">
        <div className="leaderboard-head">
          <div className="leaderboard-head-icon"><i className="ti ti-trophy" /></div>
          <div className="leaderboard-head-text">
            <h3>Global Leaderboard</h3>
            <p className="leaderboard-sub">
              <span>{SORTED_LB.length.toLocaleString('en-US')} players</span>
              <span className="lb-meta-dot">·</span>
              <span>updated just now</span>
            </p>
          </div>
          <button className="icon-btn small lb-close-btn" aria-label="Close" onClick={close}>
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="leaderboard-tabs">
          {(['all-time', 'month', 'week'] as Tab[]).map(t => (
            <button
              key={t}
              className={'lb-tab' + (tab === t ? ' selected' : '')}
              onClick={() => { setTab(t); setPage(1); }}
            >{t === 'all-time' ? 'All time' : t === 'month' ? 'Last 30 days' : 'This week'}</button>
          ))}
        </div>
        {YOU_DATA && (
          <div className="leaderboard-yourank">
            <div className="lb-yourank-label">Your rank</div>
            <div className="lb-yourank-row">
              <div className="lb-yourank-rank">#{YOU_RANK}</div>
              <div className="lb-yourank-info">
                <div className="lb-yourank-name">{YOU_DATA.name}</div>
                <div className="lb-yourank-meta">
                  Tier <span>{fmtTier(YOU_DATA.tier)}</span> · <span>{formatElapsed(YOU_DATA.seconds)}</span>
                </div>
              </div>
              <button className="btn-modal cancel lb-jump" onClick={jumpToMe}>Jump to me</button>
            </div>
          </div>
        )}
        <div className="leaderboard-list-head">
          <div>#</div>
          <div>Player</div>
          <div>Country</div>
          <div>Tier</div>
          <div>Time</div>
        </div>
        <div className="leaderboard-list" ref={listRef}>
          {pageRows.slice.map((row, i) => {
            const rank = pageRows.start + i + 1;
            const initials = row.name.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase();
            const isYou = row.name === YOU_NAME;
            return (
              <div key={rank} className={'lb-row' + (isYou ? ' you' : '')} data-rank={rank}>
                <div className={'lb-rank ' + rankClass(rank)}>{rankPrefix(rank)}</div>
                <div className="lb-player">
                  <div className="lb-avatar">{initials}</div>
                  <div className="lb-name">{row.name}{isYou && <span className="lb-you-tag">you</span>}</div>
                </div>
                <div className="lb-country">{row.country}</div>
                <div className="lb-tier">Tier {fmtTier(row.tier)}</div>
                <div className="lb-time">{formatElapsed(row.seconds)}</div>
              </div>
            );
          })}
        </div>
        <div className="leaderboard-pagination">
          <button className="lb-page-btn" disabled={page === 1} aria-label="Previous" onClick={() => setPage(p => Math.max(1, p - 1))}>
            <i className="ti ti-chevron-left" />
          </button>
          {pageNumbers.map((p, i) => {
            const prev = pageNumbers[i - 1];
            const showEllipsis = prev != null && p > prev + 1;
            return (
              <span key={p} style={{ display: 'contents' }}>
                {showEllipsis && <span className="lb-page-ellipsis">…</span>}
                <button className={'lb-page-btn' + (p === page ? ' selected' : '')} onClick={() => setPage(p)}>{p}</button>
              </span>
            );
          })}
          <button className="lb-page-btn" disabled={page === totalPages} aria-label="Next" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
