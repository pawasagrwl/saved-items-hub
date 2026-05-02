import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { SavedItem, FilterState, UserTags, FetchMetadata, SavedDataFile, normalizeData, getSubreddit } from '@/types/reddit';
import { generateMockData } from '@/data/mockData';
import { loadTags, saveTags, addTag, removeTag, assignTag, unassignTag } from '@/lib/tagStorage';
import { filterAndSort, getSubredditBreakdown, SubredditCounts } from '@/lib/filterEngine';

interface AppContextType {
  // Metadata
  fetchMetadata: FetchMetadata | null;

  // Data
  allItems: SavedItem[];
  filteredItems: SavedItem[];
  isLoading: boolean;
  postCount: number;
  commentCount: number;
  isMockMode: boolean;

  // Filters
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  yearBounds: [number, number];

  // Tags
  userTags: UserTags;
  createTag: (name: string) => void;
  deleteTag: (name: string) => void;
  tagItem: (itemId: string, tag: string) => void;
  untagItem: (itemId: string, tag: string) => void;

  // Actions
  unsaveItem: (itemId: string) => void;
  loadFromJSON: (data: SavedDataFile) => void;
  availableSubreddits: string[];
  subredditBreakdown: SubredditCounts[];
  subredditIcons: Record<string, string>;
}

const defaultFilters: FilterState = {
  search: '',
  subreddits: [],
  yearRange: [0, 0],
  minVotes: 0,
  nsfwFilter: 'hide',
  sort: 'newest',
  tab: 'all',
  tags: [],
};

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [allItems, setAllItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [userTags, setUserTags] = useState<UserTags>(loadTags());
  const [isMockMode, setIsMockMode] = useState(true);
  const [fetchMetadata, setFetchMetadata] = useState<FetchMetadata | null>(null);
  const [subredditIcons, setSubredditIcons] = useState<Record<string, string>>({});

  // Try to load saved_items.json from public folder on mount
  useEffect(() => {
    setIsLoading(true);
    fetch(`${import.meta.env.BASE_URL}saved_items.json`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data: SavedDataFile) => {
        loadDataFile(data);
        setIsMockMode(false);
        setIsLoading(false);
      })
      .catch(() => {
        // Fall back to mock data
        const mockData = generateMockData(200);
        loadDataFile(mockData);
        setIsMockMode(true);
        setIsLoading(false);
      });
  }, []);

  const loadDataFile = useCallback((data: SavedDataFile) => {
    const items = normalizeData(data);
    setAllItems(items);
    setFetchMetadata({
      lastFetchedOn: data.last_fetched_on,
      lastFetchDuration: data.last_fetch_duration,
      subredditIcons: Object.fromEntries(
        Object.entries(data.counts?.subreddits || {}).map(([k, v]) => [k, v.icon || ''])
      ),
    });
    setSubredditIcons(
      Object.fromEntries(
        Object.entries(data.counts?.subreddits || {}).map(([k, v]) => [k, v.icon || ''])
      )
    );

    // Set year bounds
    if (items.length > 0) {
      const years = items.map(i => new Date(i.timestamp).getFullYear());
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      setFilters(prev => ({ ...prev, yearRange: [minYear, maxYear] }));
    }
  }, []);

  const loadFromJSON = useCallback((data: SavedDataFile) => {
    loadDataFile(data);
    setIsMockMode(false);
  }, [loadDataFile]);

  const yearBounds = useMemo((): [number, number] => {
    if (allItems.length === 0) return [2020, 2026];
    const years = allItems.map(i => new Date(i.timestamp).getFullYear());
    return [Math.min(...years), Math.max(...years)];
  }, [allItems]);

  const availableSubreddits = useMemo(() => {
    const subs = new Set(allItems.map(i => getSubreddit(i)));
    return Array.from(subs).sort();
  }, [allItems]);

  const subredditBreakdown = useMemo(() => getSubredditBreakdown(allItems), [allItems]);

  const filteredItems = useMemo(() =>
    filterAndSort(allItems, filters, userTags.assignments),
    [allItems, filters, userTags.assignments]
  );

  const postCount = useMemo(() => filteredItems.filter(i => i.kind === 'post').length, [filteredItems]);
  const commentCount = useMemo(() => filteredItems.filter(i => i.kind === 'comment').length, [filteredItems]);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...defaultFilters, yearRange: yearBounds });
  }, [yearBounds]);

  const createTag = useCallback((name: string) => setUserTags(addTag(name)), []);
  const deleteTag = useCallback((name: string) => setUserTags(removeTag(name)), []);
  const tagItem = useCallback((itemId: string, tag: string) => setUserTags(assignTag(itemId, tag)), []);
  const untagItem = useCallback((itemId: string, tag: string) => setUserTags(unassignTag(itemId, tag)), []);

  const unsaveItem = useCallback((itemId: string) => {
    setAllItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  return (
    <AppContext.Provider value={{
      fetchMetadata, allItems, filteredItems, isLoading, postCount, commentCount, isMockMode,
      filters, setFilters, updateFilter, resetFilters, yearBounds,
      userTags, createTag, deleteTag, tagItem, untagItem,
      unsaveItem, loadFromJSON, availableSubreddits, subredditBreakdown, subredditIcons,
    }}>
      {children}
    </AppContext.Provider>
  );
}
