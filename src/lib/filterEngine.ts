import { SavedItem, FilterState, isPost, isComment } from '@/types/reddit';

export function filterAndSort(items: SavedItem[], filters: FilterState, tagAssignments: Record<string, string[]>): SavedItem[] {
  let result = [...items];

  // Tab filter
  if (filters.tab === 'posts') result = result.filter(isPost);
  if (filters.tab === 'comments') result = result.filter(isComment);

  // Search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(item => {
      if (isPost(item)) {
        return item.title.toLowerCase().includes(q) || item.author.toLowerCase().includes(q) || item.selftext.toLowerCase().includes(q);
      }
      return (item as any).body?.toLowerCase().includes(q) || item.author.toLowerCase().includes(q) || (item as any).link_title?.toLowerCase().includes(q);
    });
  }

  // Subreddit filter
  if (filters.subreddits.length > 0) {
    result = result.filter(item => filters.subreddits.includes(item.subreddit));
  }

  // Date range
  if (filters.dateRange[0]) {
    result = result.filter(item => (item.saved_at || item.created_utc) >= filters.dateRange[0]!);
  }
  if (filters.dateRange[1]) {
    result = result.filter(item => (item.saved_at || item.created_utc) <= filters.dateRange[1]!);
  }

  // Min votes
  if (filters.minVotes > 0) {
    result = result.filter(item => item.score >= filters.minVotes);
  }

  // NSFW
  if (filters.nsfwFilter === 'hide') result = result.filter(item => !item.over_18);
  if (filters.nsfwFilter === 'only') result = result.filter(item => item.over_18);

  // Tag filter
  if (filters.tags.length > 0) {
    result = result.filter(item => {
      const itemTags = tagAssignments[item.id] || [];
      return filters.tags.some(t => itemTags.includes(t));
    });
  }

  // Sort
  result.sort((a, b) => {
    switch (filters.sort) {
      case 'saved_newest': return (b.saved_at || b.created_utc) - (a.saved_at || a.created_utc);
      case 'saved_oldest': return (a.saved_at || a.created_utc) - (b.saved_at || b.created_utc);
      case 'created_newest': return b.created_utc - a.created_utc;
      case 'created_oldest': return a.created_utc - b.created_utc;
      case 'votes_high': return b.score - a.score;
      case 'votes_low': return a.score - b.score;
      default: return 0;
    }
  });

  return result;
}

export function getSubredditCounts(items: SavedItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  items.forEach(item => {
    counts[item.subreddit] = (counts[item.subreddit] || 0) + 1;
  });
  return counts;
}

export function getTopSubreddits(items: SavedItem[], count: number = 5): [string, number][] {
  const counts = getSubredditCounts(items);
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, count);
}
