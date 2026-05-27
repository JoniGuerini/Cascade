import { useEffect, useRef } from 'react';
import { UIProvider, useUI } from './context/UIContext';
import { Header } from './components/Header';
import { Resources } from './components/Resources';
import { GenTitleCard } from './components/GenTitleCard';
import { ColHeaders, GeneratorList } from './components/GeneratorList';
import { UpgradePopover } from './components/UpgradePopover';
import { SetupModal } from './components/modals/SetupModal';
import { ResetModal } from './components/modals/ResetModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { initGame } from './game/game';
import { runtime } from './game/runtime';

function GameRoot() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const { dispatch } = useUI();

  useEffect(() => {
    if (!scrollRef.current || !rowsRef.current) return;
    // Open the upgrade popover when a generator row's upgrade pill is clicked.
    runtime.openUpgradePopover = (ctx, anchor) => {
      const rect = anchor.getBoundingClientRect();
      dispatch({ type: 'set-upgrade-popover', popover: { ctx, anchorRect: rect } });
    };
    initGame({
      scrollEl: scrollRef.current,
      rowsContainer: rowsRef.current,
      maxTierEl: document.getElementById('max-tier-text'),
      fpsEl: document.getElementById('fps-text'),
    });
  }, [dispatch]);

  return (
    <>
      <div className="app">
        <Header />
        <Resources />
        <GenTitleCard
          onScrollTop={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          onScrollBottom={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
        />
        <ColHeaders />
        <GeneratorList scrollRef={scrollRef} rowsRef={rowsRef} />
      </div>
      <UpgradePopover />
      <SetupModal />
      <ResetModal />
      <LeaderboardModal />
    </>
  );
}

export default function App() {
  return (
    <UIProvider>
      <GameRoot />
    </UIProvider>
  );
}
