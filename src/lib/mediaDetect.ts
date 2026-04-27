import type { MediaType, RedditPost } from '@/types/reddit';

const IMAGE_EXT = /\.(jpe?g|png|webp|bmp)(\?.*)?$/i;
const GIF_EXT = /\.(gif|gifv)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

export function extractDomain(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function inferMediaTypeFromUrl(url: string | null | undefined, body?: string): MediaType {
  if (!url) return body && body.length > 0 ? 'text' : 'link';
  const lower = url.toLowerCase();
  const domain = extractDomain(url);

  if (lower.includes('reddit.com/gallery/')) return 'gallery';
  if (domain === 'v.redd.it' || VIDEO_EXT.test(lower)) return 'video';
  if (domain === 'youtube.com' || domain === 'm.youtube.com' || domain === 'youtu.be') return 'youtube';
  if (GIF_EXT.test(lower)) return 'gif';
  if (IMAGE_EXT.test(lower) || domain === 'i.redd.it' || domain === 'i.imgur.com') return 'image';
  // Reddit-internal post links → treat as text/self
  if (lower.includes('reddit.com/r/') && lower.includes('/comments/')) return 'text';
  return 'link';
}

/**
 * Final media type used by the renderer — falls back from declared to inferred.
 */
export function resolveMediaType(post: RedditPost): MediaType {
  if (post.media_type && post.media_type !== 'link') return post.media_type;
  return inferMediaTypeFromUrl(post.media, post.body);
}

/**
 * Extract a YouTube video ID from common URL formats.
 */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const m = u.pathname.match(/\/(embed|shorts|v)\/([^/?]+)/);
    if (m) return m[2];
  } catch {}
  return null;
}

/**
 * Get a static favicon URL (Google's S2 service — image-only, no JS request from us).
 */
export function faviconUrl(domain: string): string {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
}
