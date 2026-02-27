import { useState } from 'react';
import { SavedItem, isPost, isComment, RedditPost, RedditComment } from '@/types/reddit';
import { useApp } from '@/context/AppContext';
import { ExternalLink, ChevronDown, ChevronUp, ArrowUp, MessageSquare, Clock, Trash2, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

function formatTime(utc: number) {
  return formatDistanceToNow(new Date(utc * 1000), { addSuffix: true });
}

function PostCard({ item }: { item: RedditPost }) {
  const [expanded, setExpanded] = useState(false);
  const { unsaveItem, userTags, tagItem, untagItem } = useApp();
  const [showTagMenu, setShowTagMenu] = useState(false);
  const itemTags = userTags.assignments[item.id] || [];
  const hasImage = item.post_hint === 'image' || item.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const hasText = item.selftext && item.selftext.length > 0;

  return (
    <article className="group border border-border rounded-md bg-card hover:border-primary/30 transition-colors animate-fade-in">
      <div className="p-3">
        {/* Meta row */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5 flex-wrap">
          <span className="font-medium text-primary">r/{item.subreddit}</span>
          <span>·</span>
          <span>u/{item.author}</span>
          <span>·</span>
          <span className="font-mono flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {formatTime(item.created_utc)}
          </span>
          {item.link_flair_text && (
            <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]">
              {item.link_flair_text}
            </span>
          )}
          {item.over_18 && (
            <span className="px-1.5 py-0.5 rounded bg-nsfw text-destructive-foreground text-[10px] font-bold uppercase">
              NSFW
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {/* Inline image */}
        {hasImage && expanded && (
          <div className="mb-2 rounded overflow-hidden bg-secondary">
            <img src={item.url} alt={item.title} className="max-h-96 w-auto mx-auto" loading="lazy" />
          </div>
        )}

        {/* Inline text */}
        {hasText && expanded && (
          <div className="mb-2 p-3 bg-secondary rounded text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin">
            {item.selftext}
          </div>
        )}

        {/* Tags */}
        {itemTags.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {itemTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-tag-bg text-tag-text text-[10px]">
                {tag}
                <button onClick={() => untagItem(item.id, tag)} className="hover:text-foreground">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-0.5 font-mono">
            <ArrowUp className="h-3 w-3" />
            {item.score.toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5 font-mono">
            <MessageSquare className="h-3 w-3" />
            {item.num_comments.toLocaleString()}
          </span>

          {(hasImage || hasText) && (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          )}

          <a href={`https://reddit.com${item.permalink}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-foreground transition-colors">
            <ExternalLink className="h-3 w-3" /> Open
          </a>

          <div className="relative">
            <button onClick={() => setShowTagMenu(!showTagMenu)} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
              <Tag className="h-3 w-3" /> Tag
            </button>
            {showTagMenu && userTags.tags.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded shadow-lg z-50 animate-fade-in">
                {userTags.tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => { tagItem(item.id, tag); setShowTagMenu(false); }}
                    className="block w-full text-left px-3 py-1.5 text-xs hover:bg-secondary text-foreground whitespace-nowrap"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => unsaveItem(item.id)} className="flex items-center gap-0.5 hover:text-destructive transition-colors ml-auto opacity-0 group-hover:opacity-100">
            <Trash2 className="h-3 w-3" /> Unsave
          </button>
        </div>
      </div>
    </article>
  );
}

function CommentCard({ item }: { item: RedditComment }) {
  const [expanded, setExpanded] = useState(false);
  const { unsaveItem, userTags, tagItem, untagItem } = useApp();
  const [showTagMenu, setShowTagMenu] = useState(false);
  const itemTags = userTags.assignments[item.id] || [];
  const isLong = item.body.length > 200;

  return (
    <article className="group border border-border rounded-md bg-card hover:border-primary/30 transition-colors animate-fade-in">
      <div className="p-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5 flex-wrap">
          <span className="font-medium text-primary">r/{item.subreddit}</span>
          <span>·</span>
          <span>u/{item.author}</span>
          <span>·</span>
          <span className="font-mono flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {formatTime(item.created_utc)}
          </span>
          {item.over_18 && (
            <span className="px-1.5 py-0.5 rounded bg-nsfw text-destructive-foreground text-[10px] font-bold uppercase">NSFW</span>
          )}
        </div>

        {/* Parent post reference */}
        <p className="text-[11px] text-muted-foreground mb-1.5 truncate">
          Re: <span className="text-secondary-foreground">{item.link_title}</span>
        </p>

        {/* Comment body */}
        <div className="text-sm text-foreground leading-relaxed mb-2">
          {isLong && !expanded ? (
            <>
              {item.body.substring(0, 200)}…
              <button onClick={() => setExpanded(true)} className="text-primary text-xs ml-1 hover:underline">more</button>
            </>
          ) : (
            <span className="whitespace-pre-wrap">{item.body}</span>
          )}
          {expanded && isLong && (
            <button onClick={() => setExpanded(false)} className="text-primary text-xs ml-1 hover:underline block mt-1">less</button>
          )}
        </div>

        {/* Tags */}
        {itemTags.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {itemTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-tag-bg text-tag-text text-[10px]">
                {tag}
                <button onClick={() => untagItem(item.id, tag)} className="hover:text-foreground"><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-0.5 font-mono">
            <ArrowUp className="h-3 w-3" />
            {item.score.toLocaleString()}
          </span>
          <a href={`https://reddit.com${item.permalink}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-foreground transition-colors">
            <ExternalLink className="h-3 w-3" /> Open
          </a>
          <div className="relative">
            <button onClick={() => setShowTagMenu(!showTagMenu)} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
              <Tag className="h-3 w-3" /> Tag
            </button>
            {showTagMenu && userTags.tags.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded shadow-lg z-50 animate-fade-in">
                {userTags.tags.map(tag => (
                  <button key={tag} onClick={() => { tagItem(item.id, tag); setShowTagMenu(false); }}
                    className="block w-full text-left px-3 py-1.5 text-xs hover:bg-secondary text-foreground whitespace-nowrap">{tag}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => unsaveItem(item.id)} className="flex items-center gap-0.5 hover:text-destructive transition-colors ml-auto opacity-0 group-hover:opacity-100">
            <Trash2 className="h-3 w-3" /> Unsave
          </button>
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
