const STORAGE_KEY = 'news-app-reader-settings';

export type ReaderSettings = {
  size: 'regular' | 'large';
  lineHeight: 'relaxed' | 'open';
  family: 'serif' | 'sans';
  theme: 'light' | 'paper' | 'night';
};

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  size: 'regular',
  lineHeight: 'relaxed',
  family: 'serif',
  theme: 'light',
};

export const readReaderSettings = (): ReaderSettings => {
  if (typeof window === 'undefined') return DEFAULT_READER_SETTINGS;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_READER_SETTINGS, ...JSON.parse(saved) } : DEFAULT_READER_SETTINGS;
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
};

export const saveReaderSettings = (settings: ReaderSettings) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
