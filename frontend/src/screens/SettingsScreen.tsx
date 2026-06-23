import React, { useEffect, useState } from 'react';
import { Palette, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { readAppPreferences, saveAppPreferences, subscribeAppPreferences } from '../lib/appPreferences';

export const SettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customization' | 'notifications' | 'privacy'>('customization');

  const [preferences, setPreferences] = useState(() => readAppPreferences());
  const theme = preferences.theme === 'dark' ? 'dark' : 'light';
  const [fontSize, setFontSize] = useState(16);
  const [containerWidth, setContainerWidth] = useState<'standard' | 'wide'>('standard');
  const [autoAi, setAutoAi] = useState(true);

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  const toggleTheme = (mode: 'light' | 'dark') => {
    const next = { ...preferences, theme: mode };
    setPreferences(next);
    saveAppPreferences(next);
    toast.success("Theme updated to " + mode + " mode.");
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-heading pb-24">
      {/* Settings Screen Container */}
      <div className="max-w-5xl mx-auto px-6 pt-8">

        {/* Screen Title */}
        <div className="mb-10">
          <h1 className="font-sans text-3xl font-extrabold tracking-tight text-app-heading">Account Settings</h1>
          <p className="text-app-muted text-sm mt-1">
            Configure your publication settings, visual preferences, and AI ledger defaults.
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
                <span>Customization</span>
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
                <span>Notifications</span>
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
                <span>Privacy & Models</span>
              </button>
            </nav>
          </aside>

          {/* Right Area: Dynamic tab content */}
          <main className="bg-app-surface border border-app-border rounded-2xl p-6 md:p-8 shadow-sm">

            {activeTab === 'customization' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Theme mode selection */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-app-faint mb-4">Branding Theme</h4>
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
                      <span className={`text-xs font-bold ${theme === 'light' ? 'text-app-action' : 'text-app-muted'}`}>Light Ink</span>
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
                      <span className={`text-xs font-bold ${theme === 'dark' ? 'text-app-action' : 'text-app-muted'}`}>Obsidian Slate</span>
                    </button>
                  </div>
                </div>

                {/* Font range scale slider */}
                <div className="py-6 border-t border-b border-app-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-app-heading">Base Typography Scale</h5>
                    <p className="text-[10px] text-app-faint font-semibold mt-0.5">Scale details inside dispatch ledgers</p>
                  </div>
                  <div className="w-full sm:w-60 flex items-center gap-3">
                    <span className="text-[10px] font-bold text-app-faint">12px</span>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      aria-label="Font size"
                      className="w-full accent-[var(--color-app-action)] h-1 rounded-lg bg-outline-variant/30 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-app-heading">{fontSize}px</span>
                  </div>
                </div>

                {/* Workspace container width selector */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-app-heading">Workspace Layout Width</h5>
                    <p className="text-[10px] text-app-faint font-semibold mt-0.5">Configure feed wrapper constraints</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContainerWidth('standard')}
                      className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                        containerWidth === 'standard'
                          ? 'bg-app-action-soft border-app-action text-app-action'
                          : 'bg-app-surface border-app-border text-app-muted'
                      }`}
                    >
                      Standard (720px)
                    </button>
                    <button
                      onClick={() => setContainerWidth('wide')}
                      className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                        containerWidth === 'wide'
                          ? 'bg-app-action-soft border-app-action text-app-action'
                          : 'bg-app-surface border-app-border text-app-muted'
                      }`}
                    >
                      Wide Ledger
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fadeIn">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-app-faint">Notification Dispatch Settings</h4>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-3 bg-app-surface-alt rounded-xl cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-1 rounded text-app-action focus:ring-primary/20" />
                    <div>
                      <span className="block text-xs font-bold text-app-heading">Daily AI Brief Notifications</span>
                      <span className="text-[10px] text-app-faint font-semibold">Get morning summaries of customized watchlist reports</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-app-surface-alt rounded-xl cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-1 rounded text-app-action focus:ring-primary/20" />
                    <div>
                      <span className="block text-xs font-bold text-app-heading">Reliability & Trust Score Alerts</span>
                      <span className="text-[10px] text-app-faint font-semibold">Get alerted when community vetting adjusts your post status</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-app-surface-alt rounded-xl cursor-pointer">
                    <input type="checkbox" className="mt-1 rounded text-app-action focus:ring-primary/20" />
                    <div>
                      <span className="block text-xs font-bold text-app-heading">Mentions & Replies Dispatches</span>
                      <span className="text-[10px] text-app-faint font-semibold">Receive push alerts for comments and quotes</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-fadeIn">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-app-faint">AI & Content Sovereignty</h4>

                <div className="space-y-6">
                  {/* AI toggle checkbox */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-app-surface-alt rounded-xl">
                    <div>
                      <h5 className="text-xs font-bold text-app-heading">Auto-generate AI Copilot Summaries</h5>
                      <p className="text-[10px] text-app-faint font-semibold mt-0.5">Let LLMs evaluate and extract insights upon opening dispatches</p>
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
                    <span className="font-bold text-app-heading block mb-1">Data Retention & Encryption</span>
                    All reading progress lists and highlight notebooks are stored using sandbox local key databases. You can clear your client footprint at any time.
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      toast.success('Local browser logs and notebooks purged.');
                    }}
                    className="w-full text-center py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                  >
                    Wipe local research storage
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
