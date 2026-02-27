import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { SavedItem, FilterState, UserTags, AuthState } from '@/types/reddit';
import { generateMockData } from '@/data/mockData';
import { loadTags, saveTags, addTag, removeTag, assignTag, unassignTag } from '@/lib/tagStorage';
import { filterAndSort } from '@/lib/filterEngine';

interface AppContextType {
  // Auth
  auth: AuthState;
  login: () => void;
  logout: () => void;
  isMockMode: boolean;

  // Data
  allItems: SavedItem[];
  filteredItems: SavedItem[];
  isLoading: boolean;
  postCount: number;
  commentCount: number;

  // Filters
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;

  // Tags
  userTags: UserTags;
  createTag: (name: string) => void;
  deleteTag: (name: string) => void;
  tagItem: (itemId: string, tag: string) => void;
  untagItem: (itemId: string, tag: string) => void;

  // Actions
  unsaveItem: (itemId: string) => void;
  availableSubreddits: string[];
}

const defaultFilters: FilterState = {
  search: '',
  subreddits: [],
  dateRange: [null, null],
  minVotes: 0,
  nsfwFilter: 'hide',
  sort: 'saved_newest',
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
  const [auth, setAuth] = useState<AuthState>({ accessToken: null, username: null, isAuthenticated: false, expiresAt: null });
  const [allItems, setAllItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [userTags, setUserTags] = useState<UserTags>(loadTags());
  const [isMockMode, setIsMockMode] = useState(true);

  // Check for OAuth callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const expiresIn = params.get('expires_in');
      if (token) {
        setAuth({
          accessToken: token,
          username: null,
          isAuthenticated: true,
          expiresAt: Date.now() + (parseInt(expiresIn || '3600') * 1000),
        });
        setIsMockMode(false);
        window.history.replaceState(null, '', window.location.pathname);
        // Fetch username and items would go here with real API
      }
    }
  }, []);

  // Load mock data on mount
  useEffect(() => {
    if (isMockMode) {
      setIsLoading(true);
      setTimeout(() => {
        setAllItems(generateMockData(200));
        setAuth({ accessToken: 'mock', username: 'demo_user', isAuthenticated: true, expiresAt: null });
        setIsLoading(false);
      }, 800);
    }
  }, [isMockMode]);

  const login = useCallback(() => {
    const clientId = localStorage.getItem('reddit_client_id');
    if (!clientId) {
      // Stay in mock mode
      setIsMockMode(true);
      return;
    }
    const redirectUri = window.location.origin + window.location.pathname;
    const state = Math.random().toString(36).substring(7);
    const url = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=token&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=history+read+save&duration=temporary`;
    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    setAuth({ accessToken: null, username: null, isAuthenticated: false, expiresAt: null });
    setAllItems([]);
    setIsMockMode(true);
  }, []);

  const availableSubreddits = useMemo(() => {
    const subs = new Set(allItems.map(i => i.subreddit));
    return Array.from(subs).sort();
  }, [allItems]);

  const filteredItems = useMemo(() =>
    filterAndSort(allItems, filters, userTags.assignments),
    [allItems, filters, userTags.assignments]
  );

  const postCount = useMemo(() => filteredItems.filter(i => i.kind === 't3').length, [filteredItems]);
  const commentCount = useMemo(() => filteredItems.filter(i => i.kind === 't1').length, [filteredItems]);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => setFilters(defaultFilters), []);

  const createTag = useCallback((name: string) => setUserTags(addTag(name)), []);
  const deleteTag = useCallback((name: string) => setUserTags(removeTag(name)), []);
  const tagItem = useCallback((itemId: string, tag: string) => setUserTags(assignTag(itemId, tag)), []);
  const untagItem = useCallback((itemId: string, tag: string) => setUserTags(unassignTag(itemId, tag)), []);

  const unsaveItem = useCallback((itemId: string) => {
    setAllItems(prev => prev.filter(i => i.id !== itemId));
    // In real mode, would call Reddit API to unsave
  }, []);

  return (
    <AppContext.Provider value={{
      auth, login, logout, isMockMode,
      allItems, filteredItems, isLoading, postCount, commentCount,
      filters, setFilters, updateFilter, resetFilters,
      userTags, createTag, deleteTag, tagItem, untagItem,
      unsaveItem, availableSubreddits,
    }}>
      {children}
    </AppContext.Provider>
  );
}
