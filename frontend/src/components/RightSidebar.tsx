import React, { useEffect, useState } from 'react';
import { TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { backendApi } from '../lib/api';
import { backendAuthorToUser } from '../lib/backendAdapters';
import type { User } from '../types';

export const RightSidebar: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadAuthors = async () => {
      try {
        const authors = await backendApi.getAuthors();
        if (isMounted) setUsers(authors.map(backendAuthorToUser).slice(0, 5));
      } catch {
        if (isMounted) setUsers([]);
      }
    };

    loadAuthors();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <aside className="hidden h-full w-72 flex-col overflow-y-auto border-l border-[var(--color-app-border-clean)] bg-white p-5 xl:flex">
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[var(--color-app-action)]" />
          <h3 className="text-sm font-semibold text-[var(--color-app-ink)]">
            Top Verifiers
          </h3>
        </div>
        <div className="space-y-4">
          {users.length > 0 ? users.map((user, idx) => (
            <Link to={`/app/u/${user.username}`} key={user.id} className="group flex cursor-pointer items-center gap-3">
              <div className="w-6 text-sm font-semibold text-[var(--color-app-faint)] transition-colors group-hover:text-[var(--color-app-action)]">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-[8px] grayscale transition-all group-hover:grayscale-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[var(--color-app-ink)] group-hover:text-[var(--color-app-action)]">
                  @{user.username}
                </span>
                <span className="text-xs text-[var(--color-app-muted)]">
                  {user.trustScore} points • {user.isVerified ? 'Verified' : 'Active'}
                </span>
              </div>
            </Link>
          )) : (
            <div className="text-sm leading-6 text-[var(--color-app-muted)]">
              No backend authors available yet.
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[var(--color-app-border-clean)] pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-[var(--color-app-action)]" />
          <h3 className="text-sm font-semibold text-[var(--color-app-ink)]">
            The Truth Score
          </h3>
        </div>
        <p className="mb-4 text-sm leading-6 text-[var(--color-app-muted)]">
          Scores are derived from community voting. Upvotes increase author trust; downvotes flag disputes. High scores grant "Verified Truth" status.
        </p>
        <Link to="/app/trust" className="hex-button-secondary inline-flex min-h-10 items-center justify-center px-3 py-2 text-sm font-medium">
          View Mechanics
        </Link>
      </section>
    </aside>
  );
};
