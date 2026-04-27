import { useApp } from '@/context/AppContext';
import { useMemo, useState } from 'react';
import { X, BarChart3, PieChart, TrendingUp, Calendar, Image as ImageIcon, Users, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTopSubreddits } from '@/lib/filterEngine';
import { isPost, RedditPost } from '@/types/reddit';
import { resolveMediaType } from '@/lib/mediaDetect';

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','if','then','else','for','of','on','in','to','at','by','with','from','as','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','can','i','you','he','she','it','we','they','my','your','his','her','its','our','their','this','that','these','those','what','which','who','whom','whose','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','not','only','own','same','so','than','too','very','just','about','after','before','over','under','out','up','down','off','one','two','three','vs','via','use','using','get','got','new','old','like','don','t','s','m','re','ve','ll','d','am','also','need','want','really','still'
]);

export default function StatsPanel({ onClose }: { onClose: () => void }) {
  const { allItems } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'activity' | 'media' | 'people'>('overview');

  const stats = useMemo(() => {
    const posts = allItems.filter(i => i.kind === 'post') as RedditPost[];
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

    // Weekday breakdown
    const weekdays = Array(7).fill(0);
    allItems.forEach(item => weekdays[new Date(item.timestamp).getDay()]++);
    const maxWeekday = Math.max(...weekdays, 1);

    // Media type breakdown (posts only)
    const mediaCounts: Record<string, number> = { image: 0, gif: 0, gallery: 0, video: 0, youtube: 0, link: 0, text: 0 };
    posts.forEach(p => {
      const t = resolveMediaType(p);
      mediaCounts[t] = (mediaCounts[t] || 0) + 1;
    });
    const mediaTotal = posts.length || 1;

    // Top authors
    const authorCounts: Record<string, number> = {};
    allItems.forEach(item => {
      const a = item.author || '[deleted]';
      authorCounts[a] = (authorCounts[a] || 0) + 1;
    });
    const topAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Word cloud from titles + comment text
    const wordCounts: Record<string, number> = {};
    allItems.forEach(item => {
      const text = isPost(item) ? item.title : item.comment_text;
      text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).forEach(w => {
        if (w.length < 3 || STOP_WORDS.has(w)) return;
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    });
    const topWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 40);
    const maxWord = topWords[0]?.[1] || 1;

    // Vote distribution buckets
    const voteBuckets = [
      { label: '<0', min: -Infinity, max: 0, count: 0 },
      { label: '0–10', min: 0, max: 11, count: 0 },
      { label: '10–100', min: 11, max: 101, count: 0 },
      { label: '100–1k', min: 101, max: 1001, count: 0 },
      { label: '1k–10k', min: 1001, max: 10001, count: 0 },
      { label: '10k+', min: 10001, max: Infinity, count: 0 },
    ];
    allItems.forEach(item => {
      const b = voteBuckets.find(b => item.votes >= b.min && item.votes < b.max);
      if (b) b.count++;
    });
    const maxVoteBucket = Math.max(...voteBuckets.map(b => b.count), 1);

    return { posts, comments, topSubs, avgScore, totalScore, months, heatmap, maxHeat,
             weekdays, maxWeekday, mediaCounts, mediaTotal, topAuthors, topWords, maxWord,
             voteBuckets, maxVoteBucket };
  }, [allItems]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxMonthly = Math.max(...stats.months.map(([, d]) => d.posts + d.comments), 1);

  const mediaColors: Record<string, string> = {
    image: 'bg-primary/70',
    gif: 'bg-accent-amber/70',
    gallery: 'bg-accent-violet/70',
    video: 'bg-accent-rose/70',
    youtube: 'bg-destructive/70',
    link: 'bg-secondary',
    text: 'bg-muted',
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-card border border-border sm:rounded-lg shadow-2xl w-full sm:max-w-3xl h-full sm:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Statistics</h2>
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex border-b border-border overflow-x-auto scrollbar-thin shrink-0">
          {([
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'activity', label: 'Activity', icon: Calendar },
            { id: 'media', label: 'Media', icon: ImageIcon },
            { id: 'people', label: 'People', icon: Users },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
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

        <div className="p-4 overflow-y-auto flex-1 scrollbar-thin">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: allItems.length },
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
                  <div className="bg-primary flex items-center justify-center text-[10px] font-mono text-primary-foreground transition-all"
                    style={{ width: `${(stats.posts.length / Math.max(allItems.length, 1)) * 100}%` }}>
                    {Math.round((stats.posts.length / Math.max(allItems.length, 1)) * 100)}%
                  </div>
                  <div className="bg-accent-violet flex items-center justify-center text-[10px] font-mono text-foreground transition-all"
                    style={{ width: `${(stats.comments.length / Math.max(allItems.length, 1)) * 100}%` }}>
                    {Math.round((stats.comments.length / Math.max(allItems.length, 1)) * 100)}%
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-foreground mb-2">Top 10 Subreddits</h3>
                <div className="space-y-1.5">
                  {stats.topSubs.map(([sub, count], i) => (
                    <div key={sub} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-xs text-foreground w-24 sm:w-32 truncate">r/{sub}</span>
                      <div className="flex-1 h-4 bg-secondary rounded overflow-hidden">
                        <div className="h-full bg-primary/70 rounded transition-all" style={{ width: `${(count / stats.topSubs[0][1]) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-foreground mb-2">Vote Distribution</h3>
                <div className="space-y-1.5">
                  {stats.voteBuckets.map(b => (
                    <div key={b.label} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-14">{b.label}</span>
                      <div className="flex-1 h-3 bg-secondary rounded overflow-hidden">
                        <div className="h-full bg-accent-amber/70 rounded transition-all" style={{ width: `${(b.count / stats.maxVoteBucket) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{b.count}</span>
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

              <div>
                <h3 className="text-xs font-medium text-foreground mb-2 mt-4">By Day of Week</h3>
                <div className="space-y-1.5">
                  {stats.weekdays.map((count, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-8">{dayLabels[i]}</span>
                      <div className="flex-1 h-4 bg-secondary rounded overflow-hidden">
                        <div className="h-full bg-primary/70 rounded transition-all" style={{ width: `${(count / stats.maxWeekday) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{count}</span>
                    </div>
                  ))}
                </div>
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
                </div>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-foreground">Media Type Breakdown (posts)</h3>
              <div className="flex h-6 rounded overflow-hidden">
                {Object.entries(stats.mediaCounts).filter(([, c]) => c > 0).map(([type, count]) => (
                  <div
                    key={type}
                    className={`${mediaColors[type] || 'bg-muted'} flex items-center justify-center text-[10px] font-mono text-foreground transition-all`}
                    style={{ width: `${(count / stats.mediaTotal) * 100}%` }}
                    title={`${type}: ${count}`}
                  >
                    {(count / stats.mediaTotal) * 100 > 8 ? type : ''}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(stats.mediaCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <span className={`w-3 h-3 rounded-sm ${mediaColors[type] || 'bg-muted'}`} />
                    <span className="text-foreground capitalize">{type}</span>
                    <span className="ml-auto font-mono text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Top 10 Authors
                </h3>
                <div className="space-y-1.5">
                  {stats.topAuthors.map(([author, count], i) => (
                    <div key={author} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-xs text-foreground w-32 sm:w-44 truncate">u/{author}</span>
                      <div className="flex-1 h-4 bg-secondary rounded overflow-hidden">
                        <div className="h-full bg-accent-violet/70 rounded transition-all"
                          style={{ width: `${(count / stats.topAuthors[0][1]) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" /> Common Words
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {stats.topWords.map(([word, count]) => {
                    const scale = 0.7 + (count / stats.maxWord) * 1.0;
                    const opacity = 0.5 + (count / stats.maxWord) * 0.5;
                    return (
                      <span
                        key={word}
                        className="px-2 py-0.5 rounded bg-primary/10 text-primary"
                        style={{ fontSize: `${scale}rem`, opacity }}
                        title={`${count} occurrences`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
