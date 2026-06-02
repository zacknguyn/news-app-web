const STORAGE_KEY = 'news-app-reader-settings';
export const READER_SETTINGS_EVENT = 'news-app-reader-settings-change';

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
  window.dispatchEvent(new CustomEvent<ReaderSettings>(READER_SETTINGS_EVENT, { detail: settings }));
};

export const subscribeReaderSettings = (callback: (settings: ReaderSettings) => void) => {
  if (typeof window === 'undefined') return () => undefined;

  const handleChange = (event: Event) => {
    callback(event instanceof CustomEvent && event.detail ? (event.detail as ReaderSettings) : readReaderSettings());
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback(readReaderSettings());
  };

  window.addEventListener(READER_SETTINGS_EVENT, handleChange);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(READER_SETTINGS_EVENT, handleChange);
    window.removeEventListener('storage', handleStorage);
  };
};
