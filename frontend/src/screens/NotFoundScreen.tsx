import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundScreen: React.FC = () => (
  <main className="grid min-h-[100dvh] place-items-center bg-app-bg px-6 text-center">
    <div>
      <p className="font-mono text-[96px] font-semibold leading-none tabular-nums text-app-action">404</p>
      <h1 className="mt-4 text-lg font-normal text-app-heading">Page not found</h1>
      <Link
        to="/"
        className="mt-6 inline-flex font-mono text-[12px] uppercase tracking-wider text-app-action hover:underline"
      >
        Back to home
      </Link>
    </div>
  </main>
);

export default NotFoundScreen;
