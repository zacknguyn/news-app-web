const STORAGE_KEY = 'tourane-app-preferences';
export const APP_PREFERENCES_EVENT = 'tourane-app-preferences-change';

export type AppPreferences = {
  theme: 'system' | 'light' | 'dark';
  density: 'comfortable' | 'compact';
  motion: 'system' | 'reduced';
  trustAlerts: boolean;
  newsletter: 'daily' | 'weekly' | 'none';
  subscriptionPlan: 'reader' | 'supporter' | 'newsroom';
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  theme: 'system',
  density: 'comfortable',
  motion: 'system',
  trustAlerts: true,
  newsletter: 'weekly',
  subscriptionPlan: 'reader',
};

export const readAppPreferences = (): AppPreferences => {
  if (typeof window === 'undefined') return DEFAULT_APP_PREFERENCES;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_APP_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_APP_PREFERENCES;
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
};

export const saveAppPreferences = (preferences: AppPreferences) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent<AppPreferences>(APP_PREFERENCES_EVENT, { detail: preferences }));
};

export const subscribeAppPreferences = (callback: (preferences: AppPreferences) => void) => {
  if (typeof window === 'undefined') return () => undefined;

  const handleChange = (event: Event) => {
    callback(event instanceof CustomEvent && event.detail ? (event.detail as AppPreferences) : readAppPreferences());
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback(readAppPreferences());
  };

  window.addEventListener(APP_PREFERENCES_EVENT, handleChange);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(APP_PREFERENCES_EVENT, handleChange);
    window.removeEventListener('storage', handleStorage);
  };
};
