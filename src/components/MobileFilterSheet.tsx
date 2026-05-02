import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SortOption, NsfwFilter } from '@/types/reddit';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, Filter, Calendar, X, Plus, ChevronDown } from 'lucide-react';
import VotesFilter from './VotesFilter';
import SubredditPicker from './SubredditPicker';

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

export default function MobileFilterSheet() {
  const {
    filters, updateFilter, resetFilters, yearBounds,
    userTags, createTag,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [subPickerOpen, setSubPickerOpen] = useState(false);

  const activeCount =
    filters.subreddits.length +
    (filters.minVotes > 0 ? 1 : 0) +
    (filters.nsfwFilter !== 'hide' ? 1 : 0) +
    filters.tags.length +
    ((filters.yearRange[0] !== yearBounds[0] || filters.yearRange[1] !== yearBounds[1]) ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 px-2 relative md:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[88vh] max-h-[88vh] overflow-hidden p-0 rounded-t-2xl flex flex-col gap-0"
      >
        <SheetHeader className="shrink-0 bg-background border-b border-border px-4 py-3">
          <SheetTitle className="text-sm flex items-center justify-between pr-8">
            <span>Filters</span>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetFilters}>
                <X className="h-3 w-3 mr-1" /> Reset
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div
          className="flex-1 overflow-y-auto p-4 space-y-5"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        >
          <Section label="Sort by">
            <Select value={filters.sort} onValueChange={(v) => updateFilter('sort', v as SortOption)}>
              <SelectTrigger className="h-10 text-sm bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sortLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-sm">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Section label="NSFW content">
            <Select value={filters.nsfwFilter} onValueChange={(v) => updateFilter('nsfwFilter', v as NsfwFilter)}>
              <SelectTrigger className="h-10 text-sm bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(nsfwLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-sm">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Section label="Subreddits">
            <Button
              variant="outline"
              className="w-full h-10 text-sm justify-between gap-2"
              onClick={() => setSubPickerOpen(v => !v)}
            >
              <span className="flex items-center gap-2 truncate">
                <Filter className="h-4 w-4 shrink-0" />
                {filters.subreddits.length === 0 ? 'All subreddits' : `${filters.subreddits.length} selected`}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${subPickerOpen ? 'rotate-180' : ''}`} />
            </Button>

            {subPickerOpen && (
              <div className="mt-2 rounded-md border border-border bg-secondary/30 p-2">
                <SubredditPicker variant="full" />
              </div>
            )}
          </Section>

          {yearBounds[0] > 0 && (
            <Section label={`Year: ${filters.yearRange[0]} – ${filters.yearRange[1]}`}>
              <div className="flex items-center gap-3 px-1">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <Slider
                  min={yearBounds[0]}
                  max={yearBounds[1]}
                  step={1}
                  value={[filters.yearRange[0], filters.yearRange[1]]}
                  onValueChange={(val) => updateFilter('yearRange', [val[0], val[1]] as [number, number])}
                  className="flex-1"
                />
              </div>
            </Section>
          )}

          <Section label="Minimum votes">
            <VotesFilter variant="full" />
          </Section>

          <Section label="Tags">
            {userTags.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {userTags.tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      const next = filters.tags.includes(tag)
                        ? filters.tags.filter(t => t !== tag)
                        : [...filters.tags, tag];
                      updateFilter('tags', next);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      filters.tags.includes(tag)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-tag-bg text-tag-text'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New tag…"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTag.trim()) { createTag(newTag.trim()); setNewTag(''); }
                }}
                className="flex-1 h-10 bg-secondary border border-border rounded text-sm px-3 text-foreground"
              />
              {newTag.trim() && (
                <Button size="sm" className="h-10" onClick={() => { createTag(newTag.trim()); setNewTag(''); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</div>
      {children}
    </div>
  );
}
