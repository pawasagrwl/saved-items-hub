import { useApp } from '@/context/AppContext';
import { getTopSubreddits } from '@/lib/filterEngine';
import { BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

export default function InsightsPanel() {
  const { allItems } = useApp();

  const topSubs = useMemo(() => getTopSubreddits(allItems, 5), [allItems]);
  const totalPosts = allItems.filter(i => i.kind === 't3').length;
  const totalComments = allItems.filter(i => i.kind === 't1').length;
  const maxCount = topSubs.length > 0 ? topSubs[0][1] : 1;

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Insights</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-secondary rounded p-2 text-center">
          <div className="text-lg font-bold font-mono text-foreground">{allItems.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Total</div>
        </div>
        <div className="bg-secondary rounded p-2 text-center">
          <div className="text-lg font-bold font-mono text-foreground">{totalPosts}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Posts</div>
        </div>
      </div>

      <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Top Subreddits</h3>
      <div className="space-y-1.5">
        {topSubs.map(([sub, count]) => (
          <div key={sub}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-foreground">r/{sub}</span>
              <span className="font-mono text-muted-foreground">{count}</span>
            </div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
