import { useApp } from '@/context/AppContext';
import { SavedDataFile } from '@/types/reddit';
import { Search, Download, BarChart3, Upload } from 'lucide-react';
import { exportToJSON, exportToCSV } from '@/lib/exportData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import MobileFilterSheet from '@/components/MobileFilterSheet';
import { useRef, useState } from 'react';
import StatsPanel from '@/components/StatsPanel';

interface Props {
  selectedCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
}

export default function Header({ selectedCollectionId, onSelectCollection }: Props) {
  const { filters, updateFilter, allItems, userTags, isMockMode, loadFromJSON } = useApp();
  const [showStats, setShowStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as SavedDataFile;
        if (data.content?.posts && data.content?.comments) {
          loadFromJSON(data);
        }
      } catch (err) {
        console.error('Invalid JSON file', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Mobile: dedicated title bar */}
        <div className="md:hidden flex items-center justify-between px-3 h-12 border-b border-border/50">
          <h1 className="text-sm font-semibold tracking-tight truncate">
            <span className="text-gradient">Reddit</span>
            <span className="text-foreground"> Saved Items</span>
            <span className="text-muted-foreground"> Viewer</span>
          </h1>
          <ThemeToggle />
        </div>

        {/* Mobile: search + filter row */}
        <div className="md:hidden flex items-center gap-2 px-3 h-12">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search…"
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-md pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
          <MobileFilterSheet
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={onSelectCollection}
          />
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

          {/* Desktop: full toolbar */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              title="Load saved_items.json"
            >
              <Upload className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setShowStats(true)}
              title="Statistics"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportToJSON(allItems, userTags.assignments)}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToCSV(allItems, userTags.assignments)}>
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
