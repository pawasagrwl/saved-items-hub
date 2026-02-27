import { UserTags } from '@/types/reddit';

const TAGS_KEY = 'reddit_saved_viewer_tags';

export function loadTags(): UserTags {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { tags: [], assignments: {} };
}

export function saveTags(data: UserTags): void {
  localStorage.setItem(TAGS_KEY, JSON.stringify(data));
}

export function addTag(name: string): UserTags {
  const data = loadTags();
  if (!data.tags.includes(name)) {
    data.tags.push(name);
    saveTags(data);
  }
  return data;
}

export function removeTag(name: string): UserTags {
  const data = loadTags();
  data.tags = data.tags.filter(t => t !== name);
  Object.keys(data.assignments).forEach(id => {
    data.assignments[id] = data.assignments[id].filter(t => t !== name);
    if (data.assignments[id].length === 0) delete data.assignments[id];
  });
  saveTags(data);
  return data;
}

export function assignTag(itemId: string, tag: string): UserTags {
  const data = loadTags();
  if (!data.assignments[itemId]) data.assignments[itemId] = [];
  if (!data.assignments[itemId].includes(tag)) {
    data.assignments[itemId].push(tag);
    saveTags(data);
  }
  return data;
}

export function unassignTag(itemId: string, tag: string): UserTags {
  const data = loadTags();
  if (data.assignments[itemId]) {
    data.assignments[itemId] = data.assignments[itemId].filter(t => t !== tag);
    if (data.assignments[itemId].length === 0) delete data.assignments[itemId];
    saveTags(data);
  }
  return data;
}
