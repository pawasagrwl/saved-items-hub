import { SavedItem, isPost, isComment } from '@/types/reddit';

export function exportToJSON(items: SavedItem[], tagAssignments: Record<string, string[]>): void {
  const data = {
    exported_at: new Date().toISOString(),
    total_items: items.length,
    items: items.map(item => ({
      ...item,
      tags: tagAssignments[item.id] || [],
    })),
  };
  downloadFile(JSON.stringify(data, null, 2), 'reddit-saved-items.json', 'application/json');
}

export function exportToCSV(items: SavedItem[], tagAssignments: Record<string, string[]>): void {
  const headers = ['type', 'id', 'subreddit', 'author', 'title_or_body', 'score', 'over_18', 'created_utc', 'saved_at', 'permalink', 'tags'];
  const rows = items.map(item => {
    const content = isPost(item) ? item.title : isComment(item) ? item.body.substring(0, 200) : '';
    return [
      item.kind === 't3' ? 'post' : 'comment',
      item.id,
      item.subreddit,
      item.author,
      `"${content.replace(/"/g, '""')}"`,
      item.score,
      item.over_18,
      new Date(item.created_utc * 1000).toISOString(),
      item.saved_at ? new Date(item.saved_at * 1000).toISOString() : '',
      `https://reddit.com${item.permalink}`,
      (tagAssignments[item.id] || []).join(';'),
    ].join(',');
  });
  downloadFile([headers.join(','), ...rows].join('\n'), 'reddit-saved-items.csv', 'text/csv');
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
