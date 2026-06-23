import React from 'react';
import { Link } from 'react-router-dom';

// Verified Unsplash photo — open blank notebook, clean and empty
const NOTFOUND_IMG = 'https://images.unsplash.com/photo-1586339949216-35c2747cc36d?auto=format&fit=crop&w=800&q=80';

export const NotFoundScreen: React.FC = () => (
  <main className="grid min-h-[100dvh] place-items-center bg-app-bg px-6 text-center">
    <div className="flex flex-col items-center gap-6">
      {/* Editorial illustration image */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-app-border shadow-subtle opacity-80">
        <img
          src={NOTFOUND_IMG}
          alt="An open, empty notebook — nothing to see here"
          className="w-full h-full object-cover object-center grayscale"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-app-bg/60 to-transparent" />
      </div>

      <div>
        <p className="font-mono text-[80px] font-semibold leading-none tabular-nums text-app-action">404</p>
        <h1 className="mt-3 text-lg font-semibold text-app-heading">Page not found</h1>
        <p className="mt-2 text-sm text-app-muted max-w-sm mx-auto leading-relaxed">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="bg-app-action text-app-on-action px-5 py-2.5 rounded-full text-xs font-bold hover:brightness-110 transition-all"
        >
          Go home
        </Link>
        <Link
          to="/app"
          className="border border-app-border text-app-text px-5 py-2.5 rounded-full text-xs font-bold hover:bg-app-surface-alt transition-all"
        >
          Browse posts
        </Link>
        <Link
          to="/app/browse"
          className="border border-app-border text-app-text px-5 py-2.5 rounded-full text-xs font-bold hover:bg-app-surface-alt transition-all"
        >
          Search
        </Link>
      </div>
    </div>
  </main>
);

export default NotFoundScreen;
