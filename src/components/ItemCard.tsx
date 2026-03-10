import { useState } from 'react';
import { SavedItem, isPost, isComment, RedditPost, RedditComment } from '@/types/reddit';
import { useApp } from '@/context/AppContext';
import { useBulkSelect } from '@/context/BulkSelectContext';
import { ExternalLink, ChevronDown, ChevronUp, ArrowUp, Clock, Trash2, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import ContentPreview from '@/components/ContentPreview';
import { formatDistanceToNow } from 'date-fns';

function formatTime(timestamp: number) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
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

function TagMenu({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { userTags, tagItem } = useApp();
  if (userTags.tags.length === 0) return null;
  return (
    <div className="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded shadow-lg z-50 animate-fade-in">
      {userTags.tags.map(tag => (
        <button
          key={tag}
          onClick={() => { tagItem(itemId, tag); onClose(); }}
          className="block w-full text-left px-3 py-1.5 text-xs hover:bg-secondary text-foreground whitespace-nowrap"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

function ItemTags({ itemId }: { itemId: string }) {
  const { userTags, untagItem } = useApp();
  const itemTags = userTags.assignments[itemId] || [];
  if (itemTags.length === 0) return null;
  return (
    <div className="flex gap-1 mb-2 flex-wrap">
      {itemTags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-tag-bg text-tag-text text-[10px]">
          {tag}
          <button onClick={() => untagItem(itemId, tag)} className="hover:text-foreground">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
    </div>
  );
}

function PostCard({ item }: { item: RedditPost }) {
  const [expanded, setExpanded] = useState(false);
  const { unsaveItem } = useApp();
  const [showTagMenu, setShowTagMenu] = useState(false);
  const hasImage = !!item.media;
  const hasText = item.body && item.body.length > 0;

  return (
    <article className="group border border-border rounded-md bg-card hover:border-primary/30 transition-colors animate-fade-in">
      <div className="p-3 flex gap-2">
        <ItemCheckbox itemId={item.id} />
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5 flex-wrap">
            <span className="font-medium text-primary">r/{item.subreddit}</span>
            <span>·</span>
            <span>u/{item.author}</span>
            <span>·</span>
            <span className="font-mono flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {formatTime(item.timestamp)}
            </span>
            {item.flairs.map(flair => (
              <span key={flair} className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]">
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

          {/* Title with hover preview */}
          <HoverCard openDelay={400} closeDelay={100}>
            <HoverCardTrigger asChild>
              <h3 className="text-sm font-medium text-foreground leading-snug mb-2 group-hover:text-primary transition-colors cursor-default">
                {item.title}
              </h3>
            </HoverCardTrigger>
            <HoverCardContent side="right" className="p-0 w-auto hidden sm:block">
              <ContentPreview item={item} />
            </HoverCardContent>
          </HoverCard>

          {/* Inline image */}
          {hasImage && expanded && (
            <div className="mb-2 rounded overflow-hidden bg-secondary">
              <img src={item.media!} alt={item.title} className="max-h-96 w-auto mx-auto" loading="lazy" />
            </div>
          )}

          {/* Inline text */}
          {hasText && expanded && (
            <div className="mb-2 p-3 bg-secondary rounded text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin">
              {item.body}
            </div>
          )}

          <ItemTags itemId={item.id} />

          {/* Actions row */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-0.5 font-mono">
              <ArrowUp className="h-3 w-3" />
              {item.votes.toLocaleString()}
            </span>

            {(hasImage || hasText) && (
              <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? 'Collapse' : 'Expand'}
              </button>
            )}

            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-foreground transition-colors">
              <ExternalLink className="h-3 w-3" /> Open
            </a>

            <div className="relative">
              <button onClick={() => setShowTagMenu(!showTagMenu)} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                <Tag className="h-3 w-3" /> Tag
              </button>
              {showTagMenu && <TagMenu itemId={item.id} onClose={() => setShowTagMenu(false)} />}
            </div>

            <button onClick={() => unsaveItem(item.id)} className="flex items-center gap-0.5 hover:text-destructive transition-colors ml-auto sm:opacity-0 sm:group-hover:opacity-100">
              <Trash2 className="h-3 w-3" /> <span className="hidden sm:inline">Unsave</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CommentCard({ item }: { item: RedditComment }) {
  const [expanded, setExpanded] = useState(false);
  const { unsaveItem } = useApp();
  const [showTagMenu, setShowTagMenu] = useState(false);
  const isLong = item.comment_text.length > 200;

  return (
    <article className="group border border-border rounded-md bg-card hover:border-primary/30 transition-colors animate-fade-in">
      <div className="p-3 flex gap-2">
        <ItemCheckbox itemId={item.id} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5 flex-wrap">
            <span className="font-medium text-primary">r/{item.post_subreddit}</span>
            <span>·</span>
            <span>u/{item.author}</span>
            <span>·</span>
            <span className="font-mono flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {formatTime(item.timestamp)}
            </span>
            {item.nsfw && (
              <span className="px-1.5 py-0.5 rounded bg-nsfw text-destructive-foreground text-[10px] font-bold uppercase">NSFW</span>
            )}
          </div>

          {/* Parent post reference with hover preview */}
          <HoverCard openDelay={400} closeDelay={100}>
            <HoverCardTrigger asChild>
              <p className="text-[11px] text-muted-foreground mb-1.5 truncate cursor-default">
                Re: <span className="text-secondary-foreground">{item.post_title}</span>
              </p>
            </HoverCardTrigger>
            <HoverCardContent side="right" className="p-0 w-auto hidden sm:block">
              <ContentPreview item={item} />
            </HoverCardContent>
          </HoverCard>

          {/* Comment body */}
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

          <ItemTags itemId={item.id} />

          <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-0.5 font-mono">
              <ArrowUp className="h-3 w-3" />
              {item.votes.toLocaleString()}
            </span>
            <a href={item.comment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-foreground transition-colors">
              <ExternalLink className="h-3 w-3" /> Open
            </a>
            <div className="relative">
              <button onClick={() => setShowTagMenu(!showTagMenu)} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                <Tag className="h-3 w-3" /> Tag
              </button>
              {showTagMenu && <TagMenu itemId={item.id} onClose={() => setShowTagMenu(false)} />}
            </div>
            <button onClick={() => unsaveItem(item.id)} className="flex items-center gap-0.5 hover:text-destructive transition-colors ml-auto sm:opacity-0 sm:group-hover:opacity-100">
              <Trash2 className="h-3 w-3" /> <span className="hidden sm:inline">Unsave</span>
            </button>
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
