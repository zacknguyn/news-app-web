import React, { useEffect, useState } from 'react';
import { Palette, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { readAppPreferences, saveAppPreferences, subscribeAppPreferences } from '../lib/appPreferences';

export const SettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customization' | 'notifications' | 'privacy'>('customization');

  const [preferences, setPreferences] = useState(() => readAppPreferences());
  const theme = preferences.theme === 'dark' ? 'dark' : 'light';
  const [autoAi, setAutoAi] = useState(true);
  const isVi = preferences.language === 'vi';
  const copy = {
    title: isVi ? 'Cài đặt tài khoản' : 'Account Settings',
    subtitle: isVi
      ? 'Thiết lập ngôn ngữ, giao diện đọc và các tuỳ chọn AI.'
      : 'Configure your publication settings, visual preferences, and AI ledger defaults.',
    customization: isVi ? 'Tuỳ chỉnh' : 'Customization',
    notifications: isVi ? 'Thông báo' : 'Notifications',
    privacy: isVi ? 'Quyền riêng tư & AI' : 'Privacy & Models',
    language: isVi ? 'Ngôn ngữ' : 'Language',
    aiSummaryLanguage: isVi ? 'Tóm tắt AI sẽ dùng ngôn ngữ này.' : 'AI summaries follow this language setting.',
    brandingTheme: isVi ? 'Giao diện' : 'Branding Theme',
    light: isVi ? 'Sáng' : 'Light Ink',
    dark: isVi ? 'Tối' : 'Obsidian Slate',
    typography: isVi ? 'Cỡ chữ cơ bản' : 'Base Typography Scale',
    typographyHint: isVi ? 'Điều chỉnh cỡ chữ trong trang đọc bài.' : 'Scale details inside dispatch ledgers',
    width: isVi ? 'Độ rộng khung đọc' : 'Workspace Layout Width',
    widthHint: isVi ? 'Điều chỉnh độ rộng phần feed.' : 'Configure feed wrapper constraints',
    standard: isVi ? 'Chuẩn (720px)' : 'Standard (720px)',
    wide: isVi ? 'Rộng' : 'Wide Ledger',
    notificationSettings: isVi ? 'Cài đặt thông báo' : 'Notification Dispatch Settings',
    dailyBrief: isVi ? 'Thông báo bản tin AI hằng ngày' : 'Daily AI Brief Notifications',
    dailyBriefHint: isVi ? 'Nhận tóm tắt buổi sáng theo danh sách theo dõi.' : 'Get morning summaries of customized watchlist reports',
    trustAlerts: isVi ? 'Cảnh báo độ tin cậy' : 'Reliability & Trust Score Alerts',
    trustAlertsHint: isVi ? 'Nhận thông báo khi cộng đồng cập nhật trạng thái bài viết.' : 'Get alerted when community vetting adjusts your post status',
    mentions: isVi ? 'Nhắc tên & phản hồi' : 'Mentions & Replies Dispatches',
    mentionsHint: isVi ? 'Nhận thông báo khi có bình luận, trích dẫn hoặc phản hồi.' : 'Receive push alerts for comments and quotes',
    aiPrivacy: isVi ? 'AI & quyền kiểm soát nội dung' : 'AI & Content Sovereignty',
    autoSummary: isVi ? 'Tự tạo tóm tắt AI' : 'Auto-generate AI Copilot Summaries',
    autoSummaryHint: isVi ? 'Cho phép AI đánh giá và rút ý chính khi mở bài.' : 'Let LLMs evaluate and extract insights upon opening dispatches',
    dataRetention: isVi ? 'Lưu trữ dữ liệu & mã hoá' : 'Data Retention & Encryption',
    dataRetentionHint: isVi
      ? 'Tiến độ đọc và ghi chú được lưu ở trình duyệt hoặc backend theo từng tính năng. Bạn có thể xoá dữ liệu local bất cứ lúc nào.'
      : 'All reading progress lists and highlight notebooks are stored using sandbox local key databases. You can clear your client footprint at any time.',
    wipe: isVi ? 'Xoá dữ liệu nghiên cứu local' : 'Wipe local research storage',
  };

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  const toggleTheme = (mode: 'light' | 'dark') => {
    const next = { ...preferences, theme: mode };
    setPreferences(next);
    saveAppPreferences(next);
    toast.success(isVi ? `Đã chuyển giao diện sang ${mode === 'dark' ? 'tối' : 'sáng'}.` : "Theme updated to " + mode + " mode.");
  };

  const toggleLanguage = (language: 'en' | 'vi') => {
    const next = { ...preferences, language };
    setPreferences(next);
    saveAppPreferences(next);
    toast.success(language === 'vi' ? 'Đã chuyển ngôn ngữ sang tiếng Việt.' : 'Language switched to English.');
  };

  const updateReaderFontSize = (readerFontSize: number) => {
    const next = { ...preferences, readerFontSize };
    setPreferences(next);
    saveAppPreferences(next);
  };

  const updateLayoutWidth = (layoutWidth: 'standard' | 'wide') => {
    const next = { ...preferences, layoutWidth };
    setPreferences(next);
    saveAppPreferences(next);
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-heading pb-24">
      {/* Settings Screen Container */}
      <div className="max-w-5xl mx-auto px-6 pt-8">

        {/* Screen Title */}
        <div className="mb-10">
          <h1 className="font-sans text-3xl font-extrabold tracking-tight text-app-heading">{copy.title}</h1>
          <p className="text-app-muted text-sm mt-1">
            {copy.subtitle}
          </p>
        </div>

        {/* Workspace Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">

          {/* Left Navigation Tabs */}
          <aside>
            <nav className="space-y-1.5 sticky top-20">
              <button
                type="button"
                onClick={() => setActiveTab('customization')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'customization'
                    ? 'bg-app-action-soft text-app-action'
                    : 'text-app-muted hover:bg-app-surface-alt'
                }`}
              >
                <Palette className="h-4 w-4" />
                <span>{copy.customization}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-app-action-soft text-app-action'
                    : 'text-app-muted hover:bg-app-surface-alt'
                }`}
              >
                <Bell className="h-4 w-4" />
                <span>{copy.notifications}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-app-action-soft text-app-action'
                    : 'text-app-muted hover:bg-app-surface-alt'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>{copy.privacy}</span>
              </button>
            </nav>
          </aside>

          {/* Right Area: Dynamic tab content */}
          <main className="bg-app-surface border border-app-border rounded-2xl p-6 md:p-8 shadow-sm">

            {activeTab === 'customization' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Language selection */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-app-faint mb-4">{copy.language}</h4>
                  <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-app-border bg-app-surface-alt p-1">
                    <button
                      type="button"
                      onClick={() => toggleLanguage('en')}
                      aria-pressed={preferences.language === 'en'}
                      className={`h-10 rounded-lg text-xs font-bold transition-all ${
                        preferences.language === 'en'
                          ? 'bg-app-action text-app-on-action shadow-sm'
                          : 'text-app-muted hover:text-app-action'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLanguage('vi')}
                      aria-pressed={preferences.language === 'vi'}
                      className={`h-10 rounded-lg text-xs font-bold transition-all ${
                        preferences.language === 'vi'
                          ? 'bg-app-action text-app-on-action shadow-sm'
                          : 'text-app-muted hover:text-app-action'
                      }`}
                    >
                      Tiếng Việt
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-app-faint">
                    {copy.aiSummaryLanguage}
                  </p>
                </div>

                {/* Theme mode selection */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-app-faint mb-4">{copy.brandingTheme}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => toggleTheme('light')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        theme === 'light'
                          ? 'border-app-action bg-app-action-faint shadow-sm'
                          : 'border-transparent bg-app-surface-alt hover:border-app-border'
                      }`}
                    >
                      <div className="w-full h-20 rounded-lg bg-app-surface border border-app-border flex items-center justify-center">
                        <span className="text-4xl">☀</span>
                      </div>
                      <span className={`text-xs font-bold ${theme === 'light' ? 'text-app-action' : 'text-app-muted'}`}>{copy.light}</span>
                    </button>

                    <button
                      onClick={() => toggleTheme('dark')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-app-action bg-app-action-faint shadow-sm'
                          : 'border-transparent bg-zinc-950 hover:border-app-border'
                      }`}
                    >
                      <div className="w-full h-20 rounded-lg bg-zinc-900 border border-app-border flex items-center justify-center">
                        <span className="text-4xl text-app-on-action">🌙</span>
                      </div>
                      <span className={`text-xs font-bold ${theme === 'dark' ? 'text-app-action' : 'text-app-muted'}`}>{copy.dark}</span>
                    </button>
                  </div>
                </div>

                {/* Font range scale slider */}
                <div className="py-6 border-t border-b border-app-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-app-heading">{copy.typography}</h5>
                    <p className="text-[10px] text-app-faint font-semibold mt-0.5">{copy.typographyHint}</p>
                  </div>
                  <div className="w-full sm:w-60 flex items-center gap-3">
                    <span className="text-[10px] font-bold text-app-faint">12px</span>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={preferences.readerFontSize}
                      onChange={(e) => updateReaderFontSize(Number(e.target.value))}
                      aria-label="Font size"
                      className="w-full accent-[var(--color-app-action)] h-1 rounded-lg bg-outline-variant/30 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-app-heading">{preferences.readerFontSize}px</span>
                  </div>
                </div>

                {/* Workspace container width selector */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-app-heading">{copy.width}</h5>
                    <p className="text-[10px] text-app-faint font-semibold mt-0.5">{copy.widthHint}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateLayoutWidth('standard')}
                      className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                        preferences.layoutWidth === 'standard'
                          ? 'bg-app-action-soft border-app-action text-app-action'
                          : 'bg-app-surface border-app-border text-app-muted'
                      }`}
                    >
                      {copy.standard}
                    </button>
                    <button
                      onClick={() => updateLayoutWidth('wide')}
                      className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                        preferences.layoutWidth === 'wide'
                          ? 'bg-app-action-soft border-app-action text-app-action'
                          : 'bg-app-surface border-app-border text-app-muted'
                      }`}
                    >
                      {copy.wide}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fadeIn">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-app-faint">{copy.notificationSettings}</h4>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-3 bg-app-surface-alt rounded-xl cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-1 rounded text-app-action focus:ring-primary/20" />
                    <div>
                      <span className="block text-xs font-bold text-app-heading">{copy.dailyBrief}</span>
                      <span className="text-[10px] text-app-faint font-semibold">{copy.dailyBriefHint}</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-app-surface-alt rounded-xl cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-1 rounded text-app-action focus:ring-primary/20" />
                    <div>
                      <span className="block text-xs font-bold text-app-heading">{copy.trustAlerts}</span>
                      <span className="text-[10px] text-app-faint font-semibold">{copy.trustAlertsHint}</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-app-surface-alt rounded-xl cursor-pointer">
                    <input type="checkbox" className="mt-1 rounded text-app-action focus:ring-primary/20" />
                    <div>
                      <span className="block text-xs font-bold text-app-heading">{copy.mentions}</span>
                      <span className="text-[10px] text-app-faint font-semibold">{copy.mentionsHint}</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-fadeIn">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-app-faint">{copy.aiPrivacy}</h4>

                <div className="space-y-6">
                  {/* AI toggle checkbox */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-app-surface-alt rounded-xl">
                    <div>
                      <h5 className="text-xs font-bold text-app-heading">{copy.autoSummary}</h5>
                      <p className="text-[10px] text-app-faint font-semibold mt-0.5">{copy.autoSummaryHint}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAi}
                        onChange={(e) => setAutoAi(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-app-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-app-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-action" />
                    </label>
                  </div>

                  <div className="p-4 rounded-xl border border-app-border text-xs text-app-muted leading-relaxed">
                    <span className="font-bold text-app-heading block mb-1">{copy.dataRetention}</span>
                    {copy.dataRetentionHint}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      toast.success('Local browser logs and notebooks purged.');
                    }}
                    className="w-full text-center py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                  >
                    {copy.wipe}
                  </button>
                </div>
              </div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
};

export default SettingsScreen;
