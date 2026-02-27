export interface RedditPost {
  kind: 't3';
  id: string;
  name: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  author: string;
  title: string;
  selftext: string;
  selftext_html: string | null;
  url: string;
  permalink: string;
  thumbnail: string;
  preview?: {
    images: Array<{
      source: { url: string; width: number; height: number };
      resolutions: Array<{ url: string; width: number; height: number }>;
    }>;
  };
  is_video: boolean;
  media?: {
    reddit_video?: { fallback_url: string; width: number; height: number };
  };
  post_hint?: string;
  link_flair_text: string | null;
  link_flair_background_color: string;
  score: number;
  num_comments: number;
  over_18: boolean;
  created_utc: number;
  saved: boolean;
  // Computed
  saved_at?: number;
}

export interface RedditComment {
  kind: 't1';
  id: string;
  name: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  author: string;
  body: string;
  body_html: string;
  link_title: string;
  link_permalink: string;
  link_author: string;
  permalink: string;
  score: number;
  over_18: boolean;
  created_utc: number;
  saved: boolean;
  saved_at?: number;
}

export type SavedItem = RedditPost | RedditComment;

export function isPost(item: SavedItem): item is RedditPost {
  return item.kind === 't3';
}

export function isComment(item: SavedItem): item is RedditComment {
  return item.kind === 't1';
}

export interface TagAssignment {
  [itemId: string]: string[];
}

export interface UserTags {
  tags: string[];
  assignments: TagAssignment;
}

export type SortOption = 'saved_newest' | 'saved_oldest' | 'created_newest' | 'created_oldest' | 'votes_high' | 'votes_low';
export type NsfwFilter = 'all' | 'hide' | 'only';
export type ViewTab = 'all' | 'posts' | 'comments';

export interface FilterState {
  search: string;
  subreddits: string[];
  dateRange: [number | null, number | null];
  minVotes: number;
  nsfwFilter: NsfwFilter;
  sort: SortOption;
  tab: ViewTab;
  tags: string[];
}

export interface AuthState {
  accessToken: string | null;
  username: string | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
}
