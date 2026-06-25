import { useEffect, useState } from 'react';
import { readAppPreferences, subscribeAppPreferences } from './appPreferences';

export const useAppLanguage = () => {
  const [language, setLanguage] = useState(() => readAppPreferences().language);

  useEffect(
    () => subscribeAppPreferences((preferences) => setLanguage(preferences.language)),
    [],
  );

  return language;
};

export const isVietnamese = (language: string) => language === 'vi';
