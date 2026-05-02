import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ArrowDown, ArrowUp, ArrowUpDown, X } from 'lucide-react';

export type SubSortKey = 'posts' | 'comments' | 'total' | 'alpha';
export type SortDir = 'asc' | 'desc';

const SORT_LABELS: Record<SubSortKey, string> = {
  total: 'Most overall',
  posts: 'Most posts',
  comments: 'Most comments',
  alpha: 'Alphabetical',
};

interface Props {
  /** Compact = horizontal layout for desktop popover; full = stacked for mobile sheet */
  variant?: 'compact' | 'full';
  className?: string;
}

export default function SubredditPicker({ variant = 'full', className = '' }: Props) {
  const { filters, updateFilter, subredditBreakdown } = useApp();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SubSortKey>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const filtered = subredditBreakdown.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
    const dir = sortDir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      if (sortKey === 'alpha') {
        return a.name.localeCompare(b.name) * dir;
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return a.name.localeCompare(b.name);
      return (av - bv) * dir;
    });
    return filtered;
  }, [subredditBreakdown, search, sortKey, sortDir]);

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 mb-2">
        <input
          type="text"
          placeholder="Search subreddits…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 h-9 bg-secondary border border-border rounded-md text-sm px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus={variant === 'compact'}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-2 shrink-0" title="Sort">
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[110]">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SubSortKey)}>
              {(Object.keys(SORT_LABELS) as SubSortKey[]).map(k => (
                <DropdownMenuRadioItem key={k} value={k} className="text-xs">
                  {SORT_LABELS[k]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}
              className="text-xs gap-2"
            >
              {sortDir === 'desc' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
              Direction: {sortDir === 'desc' ? 'Descending' : 'Ascending'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filters.subreddits.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {filters.subreddits.map(sub => (
            <span key={sub} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs">
              r/{sub}
              <button
                onClick={() => updateFilter('subreddits', filters.subreddits.filter(s => s !== sub))}
                aria-label={`Remove r/${sub}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2" onClick={() => updateFilter('subreddits', [])}>
            Clear
          </Button>
        </div>
      )}

      <div className={`${variant === 'compact' ? 'max-h-72' : 'max-h-72'} overflow-y-auto scrollbar-thin space-y-0.5 -mr-1 pr-1`}>
        {sorted.length === 0 && (
          <div className="text-xs text-muted-foreground p-2 text-center">No matches</div>
        )}
        {sorted.map(sub => {
          const checked = filters.subreddits.includes(sub.name);
          return (
            <label
              key={sub.name}
              className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm hover:bg-secondary cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  const next = checked
                    ? filters.subreddits.filter(s => s !== sub.name)
                    : [...filters.subreddits, sub.name];
                  updateFilter('subreddits', next);
                }}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-foreground flex-1 truncate">
                r/{sub.name}{' '}
                <span className="text-muted-foreground font-mono text-[11px]">
                  ({sub.posts}P, {sub.comments}C)
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
