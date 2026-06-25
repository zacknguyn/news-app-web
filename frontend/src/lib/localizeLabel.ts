const viLabelMap: Record<string, string> = {
  articles: 'Bài báo',
  business: 'Kinh doanh',
  general: 'Chung',
  news: 'Tin tức',
  politics: 'Chính trị',
  sport: 'Thể thao',
  sports: 'Thể thao',
  technology: 'Công nghệ',
  tech: 'Công nghệ',
  vietnaminsiders: 'Tin Việt Nam',
  vietnam: 'Việt Nam',
  world: 'Thế giới',
};

export const localizeLabel = (value: string | undefined | null, language: 'en' | 'vi' | string) => {
  if (!value || language !== 'vi') return value || '';
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return viLabelMap[normalized] || value;
};
