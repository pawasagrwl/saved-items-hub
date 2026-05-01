import { useState, useMemo } from 'react';
import { RedditPost } from '@/types/reddit';
import { resolveMediaType, youtubeId, faviconUrl, extractDomain } from '@/lib/mediaDetect';
import { ExternalLink, Play, EyeOff, Image as ImageIcon } from 'lucide-react';
import Lightbox from './Lightbox';

interface MediaRendererProps {
  post: RedditPost;
  /** When true, render full media inline. When false, render only a compact thumbnail strip / nothing. */
  expanded: boolean;
}

export default function MediaRenderer({ post, expanded }: MediaRendererProps) {
  const type = useMemo(() => resolveMediaType(post), [post]);
  const [revealed, setRevealed] = useState(!post.nsfw);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [ytLoaded, setYtLoaded] = useState(false);

  if (!expanded) return null;

  // Text-only / no media → nothing extra to render
  if (type === 'text' || !post.media) return null;

  const blurClass = post.nsfw && !revealed ? 'blur-2xl pointer-events-none' : '';

  const NsfwOverlay = () =>
    post.nsfw && !revealed ? (
      <button
        onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/30 text-white"
      >
        <EyeOff className="h-6 w-6" />
        <span className="text-xs font-medium">NSFW — tap to reveal</span>
      </button>
    ) : null;

  // ─── IMAGE ────────────────────────────────────────────────
  if (type === 'image' || type === 'gif') {
    const src = post.media!;
    return (
      <>
        <div className="relative mb-2 rounded overflow-hidden bg-secondary cursor-zoom-in" onClick={() => revealed && setLightboxIndex(0)}>
          <NsfwOverlay />
          <img
            src={src}
            alt={post.title}
            loading="lazy"
            decoding="async"
            className={`max-h-[28rem] w-full object-contain bg-black/20 ${blurClass}`}
          />
        </div>
        {lightboxIndex !== null && <Lightbox images={[src]} onClose={() => setLightboxIndex(null)} />}
      </>
    );
  }

  // ─── GALLERY ─────────────────────────────────────────────
  if (type === 'gallery' && post.gallery.length > 0) {
    return (
      <GalleryViewer
        images={post.gallery}
        nsfw={post.nsfw}
        revealed={revealed}
        blurClass={blurClass}
        NsfwOverlay={NsfwOverlay}
        onOpenLightbox={(i) => setLightboxIndex(i)}
        lightboxIndex={lightboxIndex}
        onCloseLightbox={() => setLightboxIndex(null)}
      />
    );
  }

  // ─── VIDEO ───────────────────────────────────────────────
  if (type === 'video') {
    // v.redd.it can't be embedded directly without DASH; show poster + open link.
    const isVReddit = (post.media || '').includes('v.redd.it');
    const posterImg = post.preview_image || post.thumbnail || '';

    if (isVReddit) {
      return (
        <a
          href={post.media!}
          target="_blank"
          rel="noopener noreferrer"
          className="relative mb-2 rounded overflow-hidden bg-secondary block group"
        >
          <NsfwOverlay />
          {posterImg ? (
            <img src={posterImg} alt="" className={`max-h-[28rem] w-full object-contain bg-black/20 ${blurClass}`} loading="lazy" />
          ) : (
            <div className="aspect-video bg-black/40 flex items-center justify-center" />
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-14 w-14 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-primary/80 transition-colors">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-mono">
            video · open
          </div>
        </a>
      );
    }

    return (
      <div className="relative mb-2 rounded overflow-hidden bg-black">
        <NsfwOverlay />
        <video
          src={post.media!}
          controls
          muted
          playsInline
          preload="none"
          poster={posterImg || undefined}
          className={`max-h-[28rem] w-full ${blurClass}`}
        />
      </div>
    );
  }

  // ─── YOUTUBE ──────────────────────────────────────────────
  if (type === 'youtube') {
    const id = youtubeId(post.media!);
    if (!id) return <LinkCard post={post} />;
    const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    return (
      <div className="relative mb-2 rounded overflow-hidden bg-black aspect-video">
        {ytLoaded ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={post.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <button onClick={() => setYtLoaded(true)} className="relative w-full h-full group">
            <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
              <div className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">YouTube</div>
          </button>
        )}
      </div>
    );
  }

  // ─── LINK CARD ────────────────────────────────────────────
  return <LinkCard post={post} />;
}

function LinkCard({ post }: { post: RedditPost }) {
  const url = post.media || post.url;
  const domain = post.domain || extractDomain(url);
  const preview = post.preview_image || post.thumbnail;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-2 flex items-stretch gap-3 border border-border rounded-md overflow-hidden bg-secondary/50 hover:bg-secondary hover:border-primary/40 transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {preview ? (
        <img src={preview} alt="" className="h-20 w-20 sm:h-24 sm:w-24 object-cover shrink-0" loading="lazy" />
      ) : (
        <div className="h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center bg-secondary shrink-0">
          {domain ? (
            <img src={faviconUrl(domain)} alt="" className="h-8 w-8" loading="lazy" />
          ) : (
            <ExternalLink className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0 p-2 flex flex-col justify-center">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate flex items-center gap-1">
          {domain && <img src={faviconUrl(domain)} alt="" className="h-3 w-3" loading="lazy" />}
          {domain || 'Link'}
        </div>
        <div className="text-xs text-foreground truncate">{url}</div>
      </div>
    </a>
  );
}

interface GalleryViewerProps {
  images: string[];
  nsfw: boolean;
  revealed: boolean;
  blurClass: string;
  NsfwOverlay: () => JSX.Element | null;
  onOpenLightbox: (i: number) => void;
  lightboxIndex: number | null;
  onCloseLightbox: () => void;
}

function GalleryViewer({
  images, nsfw, revealed, blurClass, NsfwOverlay, onOpenLightbox, lightboxIndex, onCloseLightbox,
}: GalleryViewerProps) {
  const scrollerRef = useState<HTMLDivElement | null>(null);
  const [current, setCurrent] = useState(0);
  const ref = useMemo(() => ({ current: null as HTMLDivElement | null }), []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== current && idx >= 0 && idx < images.length) setCurrent(idx);
  };

  return (
    <>
      <div className="relative mb-2 rounded overflow-hidden bg-secondary">
        <NsfwOverlay />
        <div
          ref={(el) => { ref.current = el; }}
          onScroll={handleScroll}
          className={`flex overflow-x-auto snap-x snap-mandatory scrollbar-thin ${blurClass}`}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => revealed && onOpenLightbox(i)}
              className="shrink-0 snap-start w-full cursor-zoom-in"
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className="max-h-[28rem] w-full object-contain bg-black/20"
              />
            </button>
          ))}
        </div>
        {/* (m/n) counter — top-right like Infinity */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-semibold backdrop-blur-sm">
          {current + 1}/{images.length}
        </div>
      </div>
      {lightboxIndex !== null && (
        <Lightbox images={images} startIndex={lightboxIndex} onClose={onCloseLightbox} />
      )}
    </>
  );
}
