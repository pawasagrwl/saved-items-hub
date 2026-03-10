import { useApp } from '@/context/AppContext';
import { useBulkSelect } from '@/context/BulkSelectContext';
import { SortOption, NsfwFilter, ViewTab } from '@/types/reddit';
import { ArrowUpDown, Filter, Tag, X, Plus, Calendar } from 'lucide-react';
import BulkActions from '@/components/BulkActions';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const sortLabels: Record<SortOption, string> = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  votes_high: 'Votes (High)',
  votes_low: 'Votes (Low)',
};

const nsfwLabels: Record<NsfwFilter, string> = {
  all: 'Show All',
  hide: 'Hide NSFW',
  only: 'Only NSFW',
};

export default function FilterBar() {
  const { filters, updateFilter, resetFilters, availableSubreddits, postCount, commentCount, filteredItems, userTags, createTag, yearBounds } = useApp();
  const [subSearch, setSubSearch] = useState('');
  const [newTag, setNewTag] = useState('');
  const [subModalOpen, setSubModalOpen] = useState(false);

  const tabs: { value: ViewTab; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: filteredItems.length },
    { value: 'posts', label: 'Posts', count: postCount },
    { value: 'comments', label: 'Comments', count: commentCount },
  ];

  const filteredSubs = availableSubreddits.filter(s => s.toLowerCase().includes(subSearch.toLowerCase()));
  const hasActiveFilters = filters.subreddits.length > 0 || filters.minVotes > 0 || filters.nsfwFilter !== 'hide' || filters.tags.length > 0 ||
    (filters.yearRange[0] !== yearBounds[0] || filters.yearRange[1] !== yearBounds[1]);

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

        {/* Subreddit filter - modal button */}
        <Dialog open={subModalOpen} onOpenChange={setSubModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 shrink-0">
              <Filter className="h-3 w-3" />
              Subreddits
              {filters.subreddits.length > 0 && (
                <span className="ml-1 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono">
                  {filters.subreddits.length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Filter by Subreddit</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search subreddits…"
                value={subSearch}
                onChange={e => setSubSearch(e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-md text-sm px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              {filters.subreddits.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.subreddits.map(sub => (
                    <span key={sub} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 text-primary text-xs">
                      r/{sub}
                      <button onClick={() => updateFilter('subreddits', filters.subreddits.filter(s => s !== sub))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateFilter('subreddits', [])}>
                    Clear all
                  </Button>
                </div>
              )}
              <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-0.5">
                {filteredSubs.map(sub => (
                  <label key={sub} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm hover:bg-secondary cursor-pointer">
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
                {filteredSubs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No subreddits match</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Year range slider */}
        {yearBounds[0] > 0 && yearBounds[1] > 0 && (
          <div className="flex items-center gap-2 shrink-0 min-w-[180px]">
            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-mono text-muted-foreground">{filters.yearRange[0]}</span>
            <Slider
              min={yearBounds[0]}
              max={yearBounds[1]}
              step={1}
              value={[filters.yearRange[0], filters.yearRange[1]]}
              onValueChange={(val) => updateFilter('yearRange', [val[0], val[1]] as [number, number])}
              className="w-24 sm:w-32"
            />
            <span className="text-[10px] font-mono text-muted-foreground">{filters.yearRange[1]}</span>
          </div>
        )}

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

        <div className="hidden lg:block">
          <BulkActions />
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
