const normalizeLabelKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u00c0-\u1ef9]/g, '');

const normalizeAsciiKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

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

const enLabelMap: Record<string, string> = {
  'bàibáo': 'Articles',
  chung: 'General',
  'chínhtrị': 'Politics',
  'côngnghệ': 'Technology',
  'giảitrí': 'Entertainment',
  'gócbímật': 'Secret Corner',
  'kinhdoanh': 'Business',
  'sứckhỏe': 'Health',
  'thểthao': 'Sports',
  'tinnộibộviệtnam': 'Vietnam Insider News',
  'tinthếgiới': 'World News',
  'tintức': 'News',
  'thảoluậnvềailậptrìnhvàthiếtbịsố': 'Discuss AI, programming, and digital devices',
  'thảoluậnvềdoanhnghiệpthịtrườngstartupvàquảntrị': 'Discuss business, markets, startups, and management',
  'thảoluậnvềytếdinhdưỡngthểchấtvàlốisốnglànhmạnh': 'Discuss medicine, nutrition, fitness, and healthy living',
  'khônggianthảoluậnkínđáochocáccâuchuyệnvàpháthiệnthúvị': 'A discreet discussion space for unusual stories and interesting discoveries',
  'cộngđồngchiasẻgócnhìnvàtintứcnổibậtvềviệtnam': 'A community for perspectives and notable news about Vietnam',
  'gócnhìnvềchínhsáchxãhộivàcácvấnđềthờisự': 'Perspectives on policy, society, and current affairs',
  'phimảnhâmnhạcvàshowtruyềnhình': 'Movies, music, and television shows',
  'tintứcbóngđátennisvàcácgiảiđấulớn': 'Football, tennis, and major tournament news',
  'tintứcquốctếđịachínhtrịvàcácsựkiệnnổibậttoàncầu': 'International news, geopolitics, and major global events',
};

const enAsciiLabelMap: Record<string, string> = {
  'congdongchiasegocnhinvatintucnoibatvevietnam': 'A community for perspectives and notable news about Vietnam',
};

export const localizeLabel = (value: string | undefined | null, language: 'en' | 'vi' | string) => {
  if (!value) return '';
  const normalized = normalizeLabelKey(value);
  if (language === 'vi') return viLabelMap[normalized] || value;
  if (language === 'en') return enLabelMap[normalized] || enAsciiLabelMap[normalizeAsciiKey(value)] || value;
  return value;
};
