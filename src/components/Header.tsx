import { useApp } from '@/context/AppContext';
import { Search, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import MobileFilterSheet from '@/components/MobileFilterSheet';
import { useState } from 'react';
import StatsPanel from '@/components/StatsPanel';

export default function Header() {
  const { filters, updateFilter, isMockMode } = useApp();
  const [showStats, setShowStats] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Mobile: centered title bar */}
        <div className="md:hidden flex items-center justify-center px-3 h-12 border-b border-border/50">
          <h1 className="text-sm font-semibold tracking-tight truncate text-center">
            <span className="text-gradient">Reddit</span>
            <span className="text-foreground"> Saved Items</span>
            <span className="text-muted-foreground"> Viewer</span>
          </h1>
        </div>

        {/* Mobile: stats + search + filter + theme row */}
        <div className="md:hidden flex items-center gap-2 px-3 h-12">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setShowStats(true)}
            title="Statistics"
            aria-label="Statistics"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search…"
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-md pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
          <MobileFilterSheet />
          <ThemeToggle />
        </div>

        {/* Desktop row */}
        <div className="hidden md:flex items-center gap-3 px-4 h-14">
          <h1 className="text-sm font-semibold tracking-tight shrink-0">
            <span className="text-gradient">Reddit</span>
            <span className="text-foreground"> Saved Items</span>
            <span className="text-muted-foreground"> Viewer</span>
          </h1>

          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search…"
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-md pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setShowStats(true)}
              title="Statistics"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>

            <ThemeToggle />

            {isMockMode && (
              <span className="px-1.5 py-0.5 rounded bg-accent-amber/10 text-accent-amber font-mono text-[10px] uppercase tracking-wider">
                Mock
              </span>
            )}
          </div>
        </div>
      </header>
      {showStats && <StatsPanel onClose={() => setShowStats(false)} />}
    </>
  );
}
