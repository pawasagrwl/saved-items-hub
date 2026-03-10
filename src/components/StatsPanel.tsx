import { useApp } from '@/context/AppContext';
import { useMemo, useState } from 'react';
import { X, BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTopSubreddits } from '@/lib/filterEngine';

export default function StatsPanel({ onClose }: { onClose: () => void }) {
  const { allItems } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'activity'>('overview');

  const stats = useMemo(() => {
    const posts = allItems.filter(i => i.kind === 'post');
    const comments = allItems.filter(i => i.kind === 'comment');
    const topSubs = getTopSubreddits(allItems, 10);
    const totalScore = allItems.reduce((sum, i) => sum + i.votes, 0);
    const avgScore = allItems.length > 0 ? Math.round(totalScore / allItems.length) : 0;

    // Monthly trends
    const monthlyData: Record<string, { posts: number; comments: number }> = {};
    allItems.forEach(item => {
      const date = new Date(item.timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { posts: 0, comments: 0 };
      if (item.kind === 'post') monthlyData[key].posts++;
      else monthlyData[key].comments++;
    });
    const months = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);

    // Activity heatmap (day of week × hour)
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    allItems.forEach(item => {
      const date = new Date(item.timestamp);
      heatmap[date.getDay()][date.getHours()]++;
    });
    const maxHeat = Math.max(...heatmap.flat(), 1);

    return { posts, comments, topSubs, avgScore, totalScore, months, heatmap, maxHeat };
  }, [allItems]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxMonthly = Math.max(...stats.months.map(([, d]) => d.posts + d.comments), 1);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Statistics Dashboard</h2>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex border-b border-border">
          {([
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'activity', label: 'Activity', icon: Calendar },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)] scrollbar-thin">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Saved', value: allItems.length },
                  { label: 'Posts', value: stats.posts.length },
                  { label: 'Comments', value: stats.comments.length },
                  { label: 'Avg Score', value: stats.avgScore },
                ].map(card => (
                  <div key={card.label} className="bg-secondary rounded-md p-3 text-center">
                    <div className="text-xl font-bold font-mono text-foreground">{card.value.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{card.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-xs font-medium text-foreground mb-2">Post / Comment Ratio</h3>
                <div className="flex h-6 rounded overflow-hidden">
                  <div
                    className="bg-primary flex items-center justify-center text-[10px] font-mono text-primary-foreground transition-all"
                    style={{ width: `${(stats.posts.length / Math.max(allItems.length, 1)) * 100}%` }}
                  >
                    {Math.round((stats.posts.length / Math.max(allItems.length, 1)) * 100)}%
                  </div>
                  <div
                    className="bg-accent-violet flex items-center justify-center text-[10px] font-mono text-foreground transition-all"
                    style={{ width: `${(stats.comments.length / Math.max(allItems.length, 1)) * 100}%` }}
                  >
                    {Math.round((stats.comments.length / Math.max(allItems.length, 1)) * 100)}%
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-primary inline-block" /> Posts
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-accent-violet inline-block" /> Comments
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-foreground mb-2">Top 10 Subreddits</h3>
                <div className="space-y-1.5">
                  {stats.topSubs.map(([sub, count], i) => (
                    <div key={sub} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-xs text-foreground w-32 truncate">r/{sub}</span>
                      <div className="flex-1 h-4 bg-secondary rounded overflow-hidden">
                        <div className="h-full bg-primary/70 rounded transition-all" style={{ width: `${(count / stats.topSubs[0][1]) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-foreground">Saving Trends (Last 12 Months)</h3>
              <div className="flex items-end gap-1 h-48">
                {stats.months.map(([month, data]) => {
                  const total = data.posts + data.comments;
                  const postH = (data.posts / maxMonthly) * 100;
                  const commentH = (data.comments / maxMonthly) * 100;
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-0.5 group" title={`${month}: ${total} items`}>
                      <span className="text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{total}</span>
                      <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                        <div className="bg-primary/70 rounded-t transition-all" style={{ height: `${postH}%`, minHeight: data.posts > 0 ? 2 : 0 }} />
                        <div className="bg-accent-violet/70 rounded-b transition-all" style={{ height: `${commentH}%`, minHeight: data.comments > 0 ? 2 : 0 }} />
                      </div>
                      <span className="text-[8px] font-mono text-muted-foreground rotate-[-45deg] origin-top-left mt-1 whitespace-nowrap">{month.slice(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 justify-center">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/70 inline-block" /> Posts</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent-violet/70 inline-block" /> Comments</span>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-foreground">Activity Heatmap (Day × Hour)</h3>
              <div className="overflow-x-auto">
                <div className="inline-block">
                  <div className="flex ml-10 mb-1">
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="w-4 text-center text-[7px] font-mono text-muted-foreground">{h % 6 === 0 ? h : ''}</div>
                    ))}
                  </div>
                  {stats.heatmap.map((row, dayIdx) => (
                    <div key={dayIdx} className="flex items-center gap-1">
                      <span className="w-8 text-[10px] text-muted-foreground text-right">{dayLabels[dayIdx]}</span>
                      <div className="flex gap-px">
                        {row.map((val, hourIdx) => {
                          const intensity = val / stats.maxHeat;
                          return (
                            <div
                              key={hourIdx}
                              className="w-4 h-4 rounded-sm transition-colors"
                              style={{
                                backgroundColor: val === 0
                                  ? 'hsl(var(--secondary))'
                                  : `hsl(175, 70%, ${50 - intensity * 25}%, ${0.3 + intensity * 0.7})`,
                              }}
                              title={`${dayLabels[dayIdx]} ${hourIdx}:00 — ${val} items`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 mt-2 ml-10">
                    <span className="text-[9px] text-muted-foreground">Less</span>
                    {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm" style={{
                        backgroundColor: level === 0 ? 'hsl(var(--secondary))' : `hsl(175, 70%, ${50 - level * 25}%, ${0.3 + level * 0.7})`,
                      }} />
                    ))}
                    <span className="text-[9px] text-muted-foreground">More</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
