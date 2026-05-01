import { useState } from 'react';
import { SavedItem, isPost, isComment, RedditPost, RedditComment } from '@/types/reddit';
import { useApp } from '@/context/AppContext';
import { useBulkSelect } from '@/context/BulkSelectContext';
import { ExternalLink, ChevronDown, ChevronUp, ArrowUp, Image as ImageIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import ContentPreview from '@/components/ContentPreview';
import MediaRenderer from '@/components/MediaRenderer';
import { resolveMediaType } from '@/lib/mediaDetect';

/** Short relative time like Infinity: "5m", "2h", "3d", "4w", "6mo", "2y". */
function shortTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  const y = Math.floor(d / 365);
  return `${y}y`;
}

function ItemCheckbox({ itemId }: { itemId: string }) {
  const { isActive, isSelected, toggleItem } = useBulkSelect();
  if (!isActive) return null;
  return (
    <Checkbox
      checked={isSelected(itemId)}
      onCheckedChange={() => toggleItem(itemId)}
      className="shrink-0 mt-0.5"
    />
  );
}

/** Infinity-style header row: icon + r/sub / u/author    time (right) */
function CardHeader({ subreddit, author, timestamp }: { subreddit: string; author: string; timestamp: number }) {
  const { subredditIcons } = useApp();
  const icon = subredditIcons[subreddit];
  return (
    <div className="flex items-center gap-2 mb-2 min-w-0">
      <a
        href={`https://www.reddit.com/r/${subreddit}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
        onClick={e => e.stopPropagation()}
        aria-label={`Open r/${subreddit}`}
      >
        {icon ? (
          <img src={icon} alt="" className="h-7 w-7 rounded-full object-cover bg-secondary" loading="lazy" />
        ) : (
          <span className="h-7 w-7 rounded-full bg-primary/15 inline-flex items-center justify-center text-[11px] font-bold uppercase text-primary">
            {subreddit.charAt(0)}
          </span>
        )}
      </a>
      <div className="flex flex-col min-w-0 leading-tight flex-1">
        <a
          href={`https://www.reddit.com/r/${subreddit}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-[13px] font-semibold text-red-500 truncate hover:underline w-fit max-w-full"
        >
          r/{subreddit}
        </a>
        <span className="text-[11px] text-blue-400 truncate">u/{author}</span>
      </div>
      <span className="text-[11px] text-muted-foreground font-mono shrink-0 ml-2">
        {shortTime(timestamp)}
      </span>
    </div>
  );
}

function PostFlairs({ item }: { item: RedditPost }) {
  const mediaType = resolveMediaType(item);
  const isGallery = mediaType === 'gallery';
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {isGallery && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-medium">
          <ImageIcon className="h-2.5 w-2.5" /> Gallery
        </span>
      )}
      {item.flairs.map(flair => (
        <span key={flair} className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-medium">
          {flair}
        </span>
      ))}
      {item.nsfw && (
        <span className="px-1.5 py-0.5 rounded bg-nsfw text-destructive-foreground text-[10px] font-bold uppercase">
          NSFW
        </span>
      )}
      {item.archived && (
        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">
          Archived
        </span>
      )}
    </div>
  );
}

function PostCard({ item }: { item: RedditPost }) {
  const [expanded, setExpanded] = useState(false);
  const mediaType = resolveMediaType(item);
  const hasMedia = mediaType !== 'text' && mediaType !== 'link' && !!item.media;
  const hasLinkCard = mediaType === 'link' && !!item.media;
  const hasText = item.body && item.body.length > 0;
  const canExpand = hasMedia || hasText || hasLinkCard;

  return (
    <article className="group relative border border-border rounded-md bg-card hover:border-primary/30 transition-colors animate-fade-in">
      <div className="p-3 flex gap-2">
        <ItemCheckbox itemId={item.id} />
        <div className="flex-1 min-w-0">
          <CardHeader subreddit={item.subreddit} author={item.author} timestamp={item.timestamp} />

          <PostFlairs item={item} />

          <HoverCard openDelay={400} closeDelay={100}>
            <HoverCardTrigger asChild>
              <h3
                className="text-sm font-medium text-foreground leading-snug mb-2 group-hover:text-primary transition-colors cursor-pointer"
                onClick={() => canExpand && setExpanded(!expanded)}
              >
                {item.title}
              </h3>
            </HoverCardTrigger>
            <HoverCardContent side="right" className="p-0 w-auto hidden md:block">
              <ContentPreview item={item} />
            </HoverCardContent>
          </HoverCard>

          {!expanded && hasMedia && (item.thumbnail || item.preview_image) && (
            <button
              onClick={() => setExpanded(true)}
              className="mb-2 block w-full rounded overflow-hidden border border-border bg-secondary hover:border-primary/40 transition-colors"
            >
              <img
                src={item.preview_image || item.thumbnail!}
                alt=""
                loading="lazy"
                className={`max-h-60 w-full object-cover ${item.nsfw ? 'blur-md' : ''}`}
              />
            </button>
          )}

          {expanded && (hasMedia || hasLinkCard) && <MediaRenderer post={item} expanded={true} />}

          {hasText && expanded && (
            <div className="mb-2 p-3 bg-secondary rounded text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin">
              {item.body}
            </div>
          )}

          {/* Bottom row: Open (left) · votes · expand */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>

            <span className="flex items-center gap-0.5 font-mono ml-auto">
              <ArrowUp className="h-3 w-3" />
              {item.votes.toLocaleString()}
            </span>

            {canExpand && (
              <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? 'Less' : 'More'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function CommentCard({ item }: { item: RedditComment }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = item.comment_text.length > 200;

  return (
    <article className="group relative border border-border rounded-md bg-card hover:border-primary/30 transition-colors animate-fade-in">
      <div className="p-3 flex gap-2">
        <ItemCheckbox itemId={item.id} />
        <div className="flex-1 min-w-0">
          <CardHeader subreddit={item.post_subreddit} author={item.author} timestamp={item.timestamp} />

          <HoverCard openDelay={400} closeDelay={100}>
            <HoverCardTrigger asChild>
              <p className="text-[11px] text-muted-foreground mb-1.5 truncate cursor-default">
                Re: <span className="text-secondary-foreground">{item.post_title}</span>
              </p>
            </HoverCardTrigger>
            <HoverCardContent side="right" className="p-0 w-auto hidden md:block">
              <ContentPreview item={item} />
            </HoverCardContent>
          </HoverCard>

          <div className="text-sm text-foreground leading-relaxed mb-2">
            {isLong && !expanded ? (
              <>
                {item.comment_text.substring(0, 200)}…
                <button onClick={() => setExpanded(true)} className="text-primary text-xs ml-1 hover:underline">more</button>
              </>
            ) : (
              <span className="whitespace-pre-wrap">{item.comment_text}</span>
            )}
            {expanded && isLong && (
              <button onClick={() => setExpanded(false)} className="text-primary text-xs ml-1 hover:underline block mt-1">less</button>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <a
              href={item.comment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
            <span className="flex items-center gap-0.5 font-mono ml-auto">
              <ArrowUp className="h-3 w-3" />
              {item.votes.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ItemCard({ item }: { item: SavedItem }) {
  if (isPost(item)) return <PostCard item={item} />;
  if (isComment(item)) return <CommentCard item={item as RedditComment} />;
  return null;
}
