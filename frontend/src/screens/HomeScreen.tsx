import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Layers, Plus } from 'lucide-react';
import { PostFeed } from '../components/PostFeed';
import { useAuth } from '../context/AuthContext';
import { usePageMotion } from '../hooks/usePageMotion';
import { isVietnamese, useAppLanguage } from '../lib/useAppLanguage';

export const HomeScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();
  const { isAuthenticated, user } = useAuth();
  const isVi = isVietnamese(useAppLanguage());

  return (
    <div ref={pageRef} className="min-h-full">
      {isAuthenticated && user && (
        <div className="max-w-[640px] mx-auto px-4 pt-8 pb-2">
          <div className="mb-2">
            <p className="text-sm text-app-muted">{isVi ? 'Chào mừng trở lại' : 'Welcome back'}</p>
            <h1 className="text-2xl font-serif font-bold text-app-heading mt-0.5">{user.name || user.email}</h1>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Link
              to="/app/highlights"
              className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2.5 text-xs font-semibold text-app-muted hover:border-app-action hover:text-app-action transition-colors"
            >
              <Bookmark className="h-4 w-4" />
              {isVi ? 'Đã lưu' : 'Saved'}
            </Link>
            <Link
              to="/app/topics"
              className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2.5 text-xs font-semibold text-app-muted hover:border-app-action hover:text-app-action transition-colors"
            >
              <Layers className="h-4 w-4" />
              {isVi ? 'Cộng đồng' : 'Communities'}
            </Link>
            <Link
              to="/app/submit"
              className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2.5 text-xs font-semibold text-app-muted hover:border-app-action hover:text-app-action transition-colors"
            >
              <Plus className="h-4 w-4" />
              {isVi ? 'Đăng bài' : 'Submit'}
            </Link>
          </div>
        </div>
      )}
      {!isAuthenticated && (
        <div className="relative overflow-hidden bg-app-surface border-b border-app-border">
          <div
            className="absolute inset-0 opacity-40"
            style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(15,81,50,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(15,81,50,0.04) 0%, transparent 50%)' }}
          />
          <div className="bg-noise absolute inset-0 opacity-[0.04]" />
          <div className="relative max-w-[640px] mx-auto px-4 py-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-app-heading leading-tight">
              {isVi ? 'Trung tâm tin tức' : 'Intelligence Hub'}
            </h1>
            <p className="text-sm text-app-muted mt-2 max-w-md leading-relaxed">
              {isVi
                ? 'Phân tích chọn lọc và thảo luận cộng đồng. Tham gia trao đổi hoặc đọc các tin mới nhất.'
                : 'Curated analysis and community discussion from the frontlines. Join the conversation or browse the latest intelligence.'}
            </p>
            <div className="flex flex-wrap gap-3 mt-5 justify-center sm:justify-start">
              <Link
                to="/login"
                className="bg-app-action text-app-on-action px-5 py-2.5 rounded-full text-xs font-bold hover:brightness-110 active:scale-[0.97] transition-all"
              >
                {isVi ? 'Đăng nhập' : 'Sign in'}
              </Link>
              <Link
                to="/register"
                className="border border-app-border text-app-text px-5 py-2.5 rounded-full text-xs font-bold hover:bg-app-surface-alt active:scale-[0.97] transition-all"
              >
                {isVi ? 'Tạo tài khoản' : 'Create account'}
              </Link>
            </div>
          </div>
        </div>
      )}
      <PostFeed />
    </div>
  );
};

export default HomeScreen;
