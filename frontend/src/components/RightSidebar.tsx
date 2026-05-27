import React, { useEffect, useState } from 'react';
import { Award, BookOpen, TrendingUp } from 'lucide-react';
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
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-app-ink)]">
            Newsroom Voices
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
                  {user.trustScore} trust / {user.isVerified ? 'verified' : 'active'}
                </span>
              </div>
            </Link>
          )) : (
            <div className="text-sm leading-6 text-[var(--color-app-muted)]">
              No authors available yet. Published stories will fill this rail.
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[var(--color-app-border-clean)] pt-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-[var(--color-app-action)]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-app-ink)]">
            Reader Mode
          </h3>
        </div>
        <p className="mb-4 text-sm leading-6 text-[var(--color-app-muted)]">
          Open any report to save progress, highlight passages, and move comments into a discussion panel.
        </p>
        <Link to="/app/highlights" className="hex-button-secondary inline-flex min-h-10 items-center justify-center px-3 py-2 text-sm font-medium">
          View Highlights
        </Link>
      </section>

      <section className="mt-8 border-t border-[var(--color-app-border-clean)] pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-[var(--color-app-action)]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-app-ink)]">
            Community Signal
          </h3>
        </div>
        <p className="mb-4 text-sm leading-6 text-[var(--color-app-muted)]">
          Voting ranks discussion around reporting. The reader stays first; the crowd layer explains what is being challenged.
        </p>
        <Link to="/app/trust" className="hex-button-secondary inline-flex min-h-10 items-center justify-center px-3 py-2 text-sm font-medium">
          View Mechanics
        </Link>
      </section>
    </aside>
  );
};
