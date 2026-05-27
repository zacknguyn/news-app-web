const STORAGE_KEY = 'tourane-app-preferences';

export type AppPreferences = {
  density: 'comfortable' | 'compact';
  motion: 'system' | 'reduced';
  trustAlerts: boolean;
  newsletter: 'daily' | 'weekly' | 'none';
  subscriptionPlan: 'reader' | 'supporter' | 'newsroom';
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
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
};
