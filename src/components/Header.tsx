import { useApp } from '@/context/AppContext';
import { Search, Download, LogOut, Bookmark } from 'lucide-react';
import { exportToJSON, exportToCSV } from '@/lib/exportData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { auth, filters, updateFilter, allItems, userTags, logout, isMockMode } = useApp();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 h-14">
        <div className="flex items-center gap-2 shrink-0">
          <Bookmark className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold tracking-tight hidden sm:block">
            <span className="text-gradient">Saved</span>
            <span className="text-muted-foreground ml-1">Viewer</span>
          </h1>
        </div>

        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search titles, comments, authors…"
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-md pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isMockMode && (
              <span className="px-1.5 py-0.5 rounded bg-accent-amber/10 text-accent-amber font-mono text-[10px] uppercase tracking-wider">
                Mock
              </span>
            )}
            <span className="hidden sm:inline font-mono">{auth.username}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="h-8 px-2 text-muted-foreground hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
