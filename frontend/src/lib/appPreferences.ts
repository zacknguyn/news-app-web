const STORAGE_KEY = 'tourane-app-preferences';
export const APP_PREFERENCES_EVENT = 'tourane-app-preferences-change';

export type AppPreferences = {
  language: 'en' | 'vi';
  theme: 'system' | 'light' | 'dark';
  readerFontSize: number;
  layoutWidth: 'standard' | 'wide';
  density: 'comfortable' | 'compact';
  motion: 'system' | 'reduced';
  trustAlerts: boolean;
  newsletter: 'daily' | 'weekly' | 'none';
  subscriptionPlan: 'free' | 'reader-plus';
  billingCadence: 'monthly' | 'annual';
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  language: 'en',
  theme: 'system',
  readerFontSize: 16,
  layoutWidth: 'standard',
  density: 'comfortable',
  motion: 'system',
  trustAlerts: true,
  newsletter: 'weekly',
  subscriptionPlan: 'free',
  billingCadence: 'monthly',
};

const normalizeAppPreferences = (preferences: Partial<AppPreferences>): AppPreferences => {
  const next = { ...DEFAULT_APP_PREFERENCES, ...preferences } as AppPreferences;
  const legacyPlanMap: Record<string, AppPreferences['subscriptionPlan']> = {
    reader: 'reader-plus',
    supporter: 'reader-plus',
    newsroom: 'reader-plus',
    backer: 'reader-plus',
    'newsroom-pro': 'reader-plus',
  };
  const validPlans: AppPreferences['subscriptionPlan'][] = ['free', 'reader-plus'];
  const plan = legacyPlanMap[String(next.subscriptionPlan)] || next.subscriptionPlan;

  return {
    ...next,
    language: next.language === 'vi' ? 'vi' : 'en',
    readerFontSize: Math.min(24, Math.max(12, Number(next.readerFontSize) || DEFAULT_APP_PREFERENCES.readerFontSize)),
    layoutWidth: next.layoutWidth === 'wide' ? 'wide' : 'standard',
    subscriptionPlan: validPlans.includes(plan) ? plan : DEFAULT_APP_PREFERENCES.subscriptionPlan,
    billingCadence: next.billingCadence === 'annual' ? 'annual' : 'monthly',
  };
};

export const readAppPreferences = (): AppPreferences => {
  if (typeof window === 'undefined') return DEFAULT_APP_PREFERENCES;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeAppPreferences(JSON.parse(saved) as Partial<AppPreferences>) : DEFAULT_APP_PREFERENCES;
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
