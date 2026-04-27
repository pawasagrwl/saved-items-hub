// Matches the Python script's JSON output structure
import { inferMediaTypeFromUrl, extractDomain } from '@/lib/mediaDetect';

export interface SavedDataFile {
  last_fetched_on: string;
  last_fetch_duration: number;
  counts: {
    subreddits: Record<string, { posts: number; comments: number; icon: string }>;
    votes: Record<string, { posts: number; comments: number }>;
    dates: Record<string, { posts: number; comments: number }>;
  };
  content: {
    posts: RawPost[];
    comments: RawComment[];
  };
}

export type MediaType = 'image' | 'gif' | 'video' | 'gallery' | 'youtube' | 'link' | 'text';

export interface RawPost {
  title: string;
  author: string;
  url: string;
  subreddit: string;
  body: string;
  media: string | null;
  media_type?: MediaType;
  gallery?: string[];
  thumbnail?: string | null;
  preview_image?: string | null;
  domain?: string;
  datetime: string;
  votes: number;
  nsfw: boolean;
  flairs: string[];
  archived: boolean;
}

export interface RawComment {
  post_title: string;
  post_subreddit: string;
  post_url: string;
  comment_url: string;
  comment_text: string;
  author: string;
  datetime: string;
  votes: number;
  nsfw: boolean;
  archived: boolean;
}

// Internal normalized types with generated IDs
export interface RedditPost {
  kind: 'post';
  id: string;
  title: string;
  author: string;
  url: string;
  subreddit: string;
  body: string;
  media: string | null;
  media_type: MediaType;
  gallery: string[];
  thumbnail: string | null;
  preview_image: string | null;
  domain: string;
  datetime: string;
  timestamp: number; // parsed epoch ms
  votes: number;
  nsfw: boolean;
  flairs: string[];
  archived: boolean;
}

export interface RedditComment {
  kind: 'comment';
  id: string;
  post_title: string;
  post_subreddit: string;
  post_url: string;
  comment_url: string;
  comment_text: string;
  author: string;
  datetime: string;
  timestamp: number;
  votes: number;
  nsfw: boolean;
  archived: boolean;
}

export type SavedItem = RedditPost | RedditComment;

export function isPost(item: SavedItem): item is RedditPost {
  return item.kind === 'post';
}

export function isComment(item: SavedItem): item is RedditComment {
  return item.kind === 'comment';
}

// Helper to get subreddit from any item
export function getSubreddit(item: SavedItem): string {
  return isPost(item) ? item.subreddit : item.post_subreddit;
}

// Parse datetime like "2026-02-03 15:37:15 IST"
export function parseDatetime(dt: string): number {
  // Remove timezone abbreviation and parse
  const cleaned = dt.replace(/\s+[A-Z]{2,4}$/, '');
  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? Date.now() : date.getTime();
}

// Convert raw JSON to internal types
export function normalizeData(data: SavedDataFile): SavedItem[] {
  const items: SavedItem[] = [];

  data.content.posts.forEach((post, i) => {
    const inferredType = post.media_type || inferMediaTypeFromUrl(post.media, post.body);
    items.push({
      kind: 'post',
      id: `post_${i}_${simpleHash(post.url)}`,
      title: post.title,
      author: post.author,
      url: post.url,
      subreddit: post.subreddit,
      body: post.body,
      media: post.media || null,
      media_type: inferredType,
      gallery: post.gallery || [],
      thumbnail: post.thumbnail || null,
      preview_image: post.preview_image || null,
      domain: post.domain || extractDomain(post.media || post.url),
      datetime: post.datetime,
      timestamp: parseDatetime(post.datetime),
      votes: post.votes,
      nsfw: post.nsfw,
      flairs: post.flairs || [],
      archived: post.archived,
    });
  });

  data.content.comments.forEach((comment, i) => {
    items.push({
      kind: 'comment',
      id: `comment_${i}_${simpleHash(comment.comment_url)}`,
      post_title: comment.post_title,
      post_subreddit: comment.post_subreddit,
      post_url: comment.post_url,
      comment_url: comment.comment_url,
      comment_text: comment.comment_text,
      author: comment.author,
      datetime: comment.datetime,
      timestamp: parseDatetime(comment.datetime),
      votes: comment.votes,
      nsfw: comment.nsfw,
      archived: comment.archived,
    });
  });

  // Sort by timestamp descending (newest first)
  items.sort((a, b) => b.timestamp - a.timestamp);
  return items;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export interface TagAssignment {
  [itemId: string]: string[];
}

export interface UserTags {
  tags: string[];
  assignments: TagAssignment;
}

export type SortOption = 'newest' | 'oldest' | 'votes_high' | 'votes_low';
export type NsfwFilter = 'all' | 'hide' | 'only';
export type ViewTab = 'all' | 'posts' | 'comments';

export interface FilterState {
  search: string;
  subreddits: string[];
  yearRange: [number, number]; // min year, max year
  minVotes: number;
  nsfwFilter: NsfwFilter;
  sort: SortOption;
  tab: ViewTab;
  tags: string[];
}

export interface FetchMetadata {
  lastFetchedOn: string;
  lastFetchDuration: number;
  subredditIcons: Record<string, string>;
}
