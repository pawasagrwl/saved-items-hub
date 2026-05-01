import { useApp } from '@/context/AppContext';
import { ArrowUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

const PRESETS = [0, 10, 50, 100, 500, 1000, 5000];
const MAX = 10000;

interface Props {
  /** "compact" = pill button (toolbar); "full" = full-width row (mobile sheet) */
  variant?: 'compact' | 'full';
}

function formatVotes(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return n.toString();
}

export default function VotesFilter({ variant = 'compact' }: Props) {
  const { filters, updateFilter } = useApp();
  const value = filters.minVotes;

  const trigger =
    variant === 'compact' ? (
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0">
        <ArrowUp className="h-3 w-3" />
        {value === 0 ? 'Any votes' : `≥ ${formatVotes(value)}`}
      </Button>
    ) : (
      <Button variant="outline" className="w-full h-10 text-sm gap-2 justify-between">
        <span className="flex items-center gap-2">
          <ArrowUp className="h-4 w-4" />
          Min votes
        </span>
        <span className="font-mono text-muted-foreground">
          {value === 0 ? 'Any' : `≥ ${formatVotes(value)}`}
        </span>
      </Button>
    );

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side={variant === 'full' ? 'top' : 'bottom'}
        align={variant === 'full' ? 'center' : 'start'}
        className="w-72 p-3"
      >
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Minimum votes
          </span>
          <span className="font-mono text-base text-foreground">
            {value === 0 ? 'Any' : `≥ ${formatVotes(value)}`}
          </span>
        </div>

        <Slider
          min={0}
          max={MAX}
          step={value < 100 ? 5 : value < 1000 ? 25 : 100}
          value={[Math.min(value, MAX)]}
          onValueChange={(v) => updateFilter('minVotes', v[0])}
          className="mb-3"
        />

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => updateFilter('minVotes', p)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                value === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
              }`}
            >
              {p === 0 ? 'Any' : `≥ ${formatVotes(p)}`}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
