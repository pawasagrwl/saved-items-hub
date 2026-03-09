import { SavedItem, isPost, isComment, RedditPost, RedditComment } from '@/types/reddit';
import { ArrowUp, MessageSquare } from 'lucide-react';

function PostPreview({ item }: { item: RedditPost }) {
  const hasImage = item.post_hint === 'image' || item.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className="max-w-xs p-3 space-y-2">
      <p className="text-[11px] text-primary font-medium">r/{item.subreddit}</p>
      <p className="text-xs text-foreground font-medium leading-snug">{item.title}</p>

      {hasImage && (
        <img src={item.url} alt="" className="w-full max-h-40 object-cover rounded" loading="lazy" />
      )}

      {item.selftext && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-4">
          {item.selftext}
        </p>
      )}

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5 font-mono">
          <ArrowUp className="h-2.5 w-2.5" /> {item.score.toLocaleString()}
        </span>
        <span className="flex items-center gap-0.5 font-mono">
          <MessageSquare className="h-2.5 w-2.5" /> {item.num_comments.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function CommentPreview({ item }: { item: RedditComment }) {
  return (
    <div className="max-w-xs p-3 space-y-2">
      <p className="text-[11px] text-primary font-medium">r/{item.subreddit}</p>
      <p className="text-[10px] text-muted-foreground truncate">Re: {item.link_title}</p>
      <p className="text-xs text-foreground leading-relaxed line-clamp-6 whitespace-pre-wrap">
        {item.body}
      </p>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5 font-mono">
          <ArrowUp className="h-2.5 w-2.5" /> {item.score.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function ContentPreview({ item }: { item: SavedItem }) {
  if (isPost(item)) return <PostPreview item={item} />;
  if (isComment(item)) return <CommentPreview item={item as RedditComment} />;
  return null;
}