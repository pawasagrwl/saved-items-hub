import { useApp } from '@/context/AppContext';
import { SortOption, NsfwFilter, ViewTab } from '@/types/reddit';
import { ArrowUpDown, Filter, Tag, X, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const sortLabels: Record<SortOption, string> = {
  saved_newest: 'Saved (Newest)',
  saved_oldest: 'Saved (Oldest)',
  created_newest: 'Created (Newest)',
  created_oldest: 'Created (Oldest)',
  votes_high: 'Votes (High)',
  votes_low: 'Votes (Low)',
};

const nsfwLabels: Record<NsfwFilter, string> = {
  all: 'Show All',
  hide: 'Hide NSFW',
  only: 'Only NSFW',
};

export default function FilterBar() {
  const { filters, updateFilter, resetFilters, availableSubreddits, postCount, commentCount, filteredItems, userTags, createTag } = useApp();
  const [showSubFilter, setShowSubFilter] = useState(false);
  const [subSearch, setSubSearch] = useState('');
  const [newTag, setNewTag] = useState('');

  const tabs: { value: ViewTab; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: filteredItems.length },
    { value: 'posts', label: 'Posts', count: postCount },
    { value: 'comments', label: 'Comments', count: commentCount },
  ];

  const filteredSubs = availableSubreddits.filter(s => s.toLowerCase().includes(subSearch.toLowerCase()));
  const hasActiveFilters = filters.subreddits.length > 0 || filters.minVotes > 0 || filters.nsfwFilter !== 'hide' || filters.tags.length > 0;

  return (
    <div className="border-b border-border bg-card/50">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-2">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => updateFilter('tab', tab.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
              filters.tab === tab.value
                ? 'bg-secondary text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-thin flex-nowrap sm:flex-wrap">
        <Select value={filters.sort} onValueChange={(v) => updateFilter('sort', v as SortOption)}>
          <SelectTrigger className="w-[140px] sm:w-[160px] h-8 text-xs bg-secondary border-border shrink-0">
            <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortLabels).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.nsfwFilter} onValueChange={(v) => updateFilter('nsfwFilter', v as NsfwFilter)}>
          <SelectTrigger className="w-[110px] sm:w-[120px] h-8 text-xs bg-secondary border-border shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(nsfwLabels).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => setShowSubFilter(!showSubFilter)}
          >
            <Filter className="h-3 w-3" />
            Subreddits
            {filters.subreddits.length > 0 && (
              <span className="ml-1 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono">
                {filters.subreddits.length}
              </span>
            )}
          </Button>

          {showSubFilter && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-md shadow-xl z-50 animate-fade-in">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Filter subreddits…"
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                  className="w-full h-7 bg-secondary border border-border rounded text-xs px-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto scrollbar-thin px-1 pb-1">
                {filteredSubs.map(sub => (
                  <label key={sub} className="flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.subreddits.includes(sub)}
                      onChange={() => {
                        const next = filters.subreddits.includes(sub)
                          ? filters.subreddits.filter(s => s !== sub)
                          : [...filters.subreddits, sub];
                        updateFilter('subreddits', next);
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-foreground">r/{sub}</span>
                  </label>
                ))}
              </div>
              <div className="border-t border-border p-1">
                <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => { updateFilter('subreddits', []); setShowSubFilter(false); }}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Min votes:</span>
          <input
            type="number"
            min={0}
            value={filters.minVotes}
            onChange={e => updateFilter('minVotes', parseInt(e.target.value) || 0)}
            className="w-16 h-8 bg-secondary border border-border rounded text-xs px-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Tag filter */}
        {userTags.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {userTags.tags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  const next = filters.tags.includes(tag)
                    ? filters.tags.filter(t => t !== tag)
                    : [...filters.tags, tag];
                  updateFilter('tags', next);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  filters.tags.includes(tag)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-tag-bg text-tag-text hover:bg-primary/20'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Add tag inline */}
        <div className="flex items-center gap-1 ml-auto">
          <input
            type="text"
            placeholder="New tag…"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newTag.trim()) {
                createTag(newTag.trim());
                setNewTag('');
              }
            }}
            className="w-20 h-7 bg-secondary border border-border rounded text-[10px] px-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:w-32 transition-all"
          />
          {newTag.trim() && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { createTag(newTag.trim()); setNewTag(''); }}>
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground gap-1" onClick={resetFilters}>
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
