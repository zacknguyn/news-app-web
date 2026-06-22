const STORAGE_KEY = 'tourane-recently-viewed';
const MAX_ITEMS = 20;

export type RecentItem = {
  type: 'post';
  id: string;
  title: string;
  channelName: string;
  channelId: string;
  viewedAt: number;
};

function read(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: RecentItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addRecentPost(id: string, title: string, channelName: string, channelId: string) {
  const items = read();
  const filtered = items.filter((item) => item.id !== id);
  const entry: RecentItem = { type: 'post', id, title, channelName, channelId, viewedAt: Date.now() };
  write([entry, ...filtered].slice(0, MAX_ITEMS));
}

export function getRecentPosts(): RecentItem[] {
  return read().filter((item) => item.type === 'post');
}

export function clearRecentPosts() {
  write([]);
}
