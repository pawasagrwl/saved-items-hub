import { Github } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const GITHUB_URL = 'https://github.com/pawasagrwl/saved-items-hub';

function formatLastUpdated(iso?: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  });
}

export default function Footer() {
  const { fetchMetadata } = useApp();
  return (
    <footer
      className="sticky bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-3 items-center gap-2 px-3 sm:px-4 h-9 text-[11px] text-muted-foreground">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors justify-self-start truncate"
          aria-label="GitHub"
        >
          <Github className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
        <div className="text-center truncate font-mono text-[10px] sm:text-[11px]">
          <span className="hidden sm:inline">Last updated: </span>
          <span className="sm:hidden">Updated </span>
          {formatLastUpdated(fetchMetadata?.lastFetchedOn)}
        </div>
        <div className="justify-self-end truncate text-[10px] sm:text-[11px]">
          © Pawas Aggarwal
        </div>
      </div>
    </footer>
  );
}
