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
  const headers = ['type', 'id', 'subreddit', 'author', 'title_or_body', 'votes', 'nsfw', 'datetime', 'url', 'tags'];
  const rows = items.map(item => {
    const content = isPost(item) ? item.title : isComment(item) ? item.comment_text.substring(0, 200) : '';
    const sub = isPost(item) ? item.subreddit : isComment(item) ? item.post_subreddit : '';
    const url = isPost(item) ? item.url : isComment(item) ? item.comment_url : '';
    return [
      item.kind,
      item.id,
      sub,
      item.author,
      `"${content.replace(/"/g, '""')}"`,
      item.votes,
      item.nsfw,
      item.datetime,
      url,
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
