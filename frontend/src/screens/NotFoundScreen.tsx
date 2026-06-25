import React from 'react';
import { Link } from 'react-router-dom';
import { isVietnamese, useAppLanguage } from '../lib/useAppLanguage';

// Verified Unsplash photo — open blank notebook, clean and empty
const NOTFOUND_IMG = 'https://images.unsplash.com/photo-1586339949216-35c2747cc36d?auto=format&fit=crop&w=800&q=80';

export const NotFoundScreen: React.FC = () => {
  const isVi = isVietnamese(useAppLanguage());
  const copy = isVi
    ? {
        alt: 'Một cuốn sổ mở trống',
        title: 'Không tìm thấy trang',
        body: 'Trang bạn đang tìm không tồn tại hoặc đã được chuyển đi.',
        home: 'Về trang chủ',
        browse: 'Xem bài viết',
        search: 'Tìm kiếm',
      }
    : {
        alt: 'An open, empty notebook',
        title: 'Page not found',
        body: 'The page you’re looking for doesn’t exist or has been moved.',
        home: 'Go home',
        browse: 'Browse posts',
        search: 'Search',
      };

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-app-bg px-6 text-center">
      <div className="flex flex-col items-center gap-6">
      {/* Editorial illustration image */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-app-border shadow-subtle opacity-80">
        <img
          src={NOTFOUND_IMG}
          alt={copy.alt}
          className="w-full h-full object-cover object-center grayscale"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-app-bg/60 to-transparent" />
      </div>

      <div>
        <p className="font-mono text-[80px] font-semibold leading-none tabular-nums text-app-action">404</p>
        <h1 className="mt-3 text-lg font-semibold text-app-heading">{copy.title}</h1>
        <p className="mt-2 text-sm text-app-muted max-w-sm mx-auto leading-relaxed">
          {copy.body}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="bg-app-action text-app-on-action px-5 py-2.5 rounded-full text-xs font-bold hover:brightness-110 transition-all"
        >
          {copy.home}
        </Link>
        <Link
          to="/app"
          className="border border-app-border text-app-text px-5 py-2.5 rounded-full text-xs font-bold hover:bg-app-surface-alt transition-all"
        >
          {copy.browse}
        </Link>
        <Link
          to="/app/browse"
          className="border border-app-border text-app-text px-5 py-2.5 rounded-full text-xs font-bold hover:bg-app-surface-alt transition-all"
        >
          {copy.search}
        </Link>
      </div>
      </div>
    </main>
  );
};

export default NotFoundScreen;
