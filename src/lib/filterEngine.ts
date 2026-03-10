import { SavedItem, FilterState, isPost, isComment, getSubreddit } from '@/types/reddit';

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
        return item.title.toLowerCase().includes(q) || item.author.toLowerCase().includes(q) || item.body.toLowerCase().includes(q);
      }
      if (isComment(item)) {
        return item.comment_text.toLowerCase().includes(q) || item.author.toLowerCase().includes(q) || item.post_title.toLowerCase().includes(q);
      }
      return false;
    });
  }

  // Subreddit filter
  if (filters.subreddits.length > 0) {
    result = result.filter(item => filters.subreddits.includes(getSubreddit(item)));
  }

  // Year range
  if (filters.yearRange[0] > 0 && filters.yearRange[1] > 0) {
    const minTs = new Date(filters.yearRange[0], 0, 1).getTime();
    const maxTs = new Date(filters.yearRange[1] + 1, 0, 1).getTime(); // end of max year
    result = result.filter(item => item.timestamp >= minTs && item.timestamp < maxTs);
  }

  // Min votes
  if (filters.minVotes > 0) {
    result = result.filter(item => item.votes >= filters.minVotes);
  }

  // NSFW
  if (filters.nsfwFilter === 'hide') result = result.filter(item => !item.nsfw);
  if (filters.nsfwFilter === 'only') result = result.filter(item => item.nsfw);

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
      case 'newest': return b.timestamp - a.timestamp;
      case 'oldest': return a.timestamp - b.timestamp;
      case 'votes_high': return b.votes - a.votes;
      case 'votes_low': return a.votes - b.votes;
      default: return 0;
    }
  });

  return result;
}

export function getSubredditCounts(items: SavedItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  items.forEach(item => {
    const sub = getSubreddit(item);
    counts[sub] = (counts[sub] || 0) + 1;
  });
  return counts;
}

export function getTopSubreddits(items: SavedItem[], count: number = 5): [string, number][] {
  const counts = getSubredditCounts(items);
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, count);
}
