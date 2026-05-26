import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { backendApi } from '../lib/api';
import { Alert } from '../components/ui/Alert';
import type { BackendCredentialRequestDTO, BackendUserDTO } from '../lib/api';

const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
const USER_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED'];
const USER_ROLES = ['USER', 'ADMIN'];

const statusClassName = (status?: string | null) => {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'PENDING':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'SUSPENDED':
    case 'REJECTED':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-[var(--color-app-border)] bg-[var(--color-app-surface-lift)] text-[var(--color-app-muted)]';
  }
};

const StatusBadge = ({ status }: { status?: string | null }) => (
  <span className={`inline-flex min-h-6 items-center border px-2 text-[10px] font-semibold uppercase ${statusClassName(status)}`}>
    {status || 'Unknown'}
  </span>
);

export const AdminScreen: React.FC = () => {
  const { user } = useAuth();
  const [requestStatus, setRequestStatus] = useState('PENDING');
  const [userStatus, setUserStatus] = useState('');
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState<BackendCredentialRequestDTO[]>([]);
  const [users, setUsers] = useState<BackendUserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const pendingCount = useMemo(() => requests.filter(request => request.status === 'PENDING').length, [requests]);

  const loadAdminData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [requestPage, userPage] = await Promise.all([
        backendApi.getAdminCredentialRequests(requestStatus, 0, 30),
        backendApi.getAdminUsers({ search, status: userStatus, page: 0, size: 30 }),
      ]);
      setRequests(requestPage.content || []);
      setUsers(userPage.content || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Admin data could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, requestStatus, userStatus]);

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  const runMutation = async (action: () => Promise<unknown>, successMessage: string) => {
    setIsMutating(true);
    setError('');
    try {
      await action();
      toast.success(successMessage);
      await loadAdminData();
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Admin action failed.');
    } finally {
      setIsMutating(false);
    }
  };

  const rejectRequest = async (request: BackendCredentialRequestDTO) => {
    const rejectionReason = window.prompt(`Reject access for ${request.email}? Add a short reason.`);
    if (rejectionReason === null) return;
    await runMutation(
      () => backendApi.rejectCredentialRequest(request.id, rejectionReason.trim() || 'Request rejected by admin.'),
      'Credential request rejected.'
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 text-[var(--color-app-ink)] sm:px-6 lg:px-10">
      <header className="pb-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-app-muted)]">
              <ShieldCheck className="h-4 w-4 text-[var(--color-app-action)]" />
              Admin workspace
            </p>
            <h1 className="font-serif text-3xl font-bold leading-tight text-[var(--color-app-ink)]">
              Access control
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-app-muted)]">
              Review requests, activate accounts, and keep roles accurate.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAdminData}
            disabled={isLoading || isMutating}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[3px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-3 text-sm font-semibold text-[var(--color-app-ink)] transition-colors hover:border-[var(--color-eggplant-gray)] hover:bg-[var(--color-app-surface-lift)] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <Alert tone="error">
          {error}
        </Alert>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="hex-card p-6">
          <p className="text-sm text-[var(--color-app-muted)]">Pending requests</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-app-ink)]">{pendingCount}</p>
        </div>
        <div className="hex-card p-6">
          <p className="text-sm text-[var(--color-app-muted)]">Loaded users</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-app-ink)]">{users.length}</p>
        </div>
        <div className="hex-card p-6">
          <p className="text-sm text-[var(--color-app-muted)]">Workspace</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-app-ink)]">Live</p>
        </div>
      </section>

      <section className="hex-card p-6 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[var(--color-app-border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-app-ink)]">Credential requests</h2>
            <p className="mt-1 text-sm text-[var(--color-app-muted)]">Approve or reject new access requests.</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface-lift)] p-1">
            {['', ...REQUEST_STATUSES].map(status => (
              <button
                key={status || 'ALL'}
                type="button"
                onClick={() => setRequestStatus(status)}
                className={`min-h-9 rounded-[3px] px-3 text-sm font-semibold transition-colors ${requestStatus === status ? 'bg-[var(--color-app-surface)] text-[var(--color-app-ink)] shadow-[var(--shadow-hex-focus)]' : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-ink)]'}`}
              >
                {status || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[var(--color-app-border-clean)]">
          {isLoading ? (
            <div className="py-6 text-sm font-semibold text-[var(--color-app-muted)]">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="py-6 text-sm font-semibold text-[var(--color-app-muted)]">No credential requests match this filter.</div>
          ) : requests.map(request => (
            <article key={request.id} className="grid gap-4 py-4 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-[var(--color-app-ink)]">{request.name}</h3>
                  <StatusBadge status={request.status} />
                </div>
                <p className="mt-1 text-sm text-[var(--color-app-muted)]">{request.email}</p>
                {request.createdAt && (
                  <p className="mt-1 text-[11px] font-mono text-[var(--color-app-faint)]">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              <p className="text-sm leading-6 text-[var(--color-app-muted)] lg:max-w-xl">
                {request.reportingFocus || request.rejectionReason || 'No reporting focus supplied.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isMutating || request.status !== 'PENDING'}
                  onClick={() => runMutation(() => backendApi.approveCredentialRequest(request.id), 'Credential request approved.')}
                  className="inline-flex min-h-10 items-center gap-2 rounded-[3px] bg-[var(--color-obsidian-ink)] px-3 text-sm font-semibold text-[var(--color-canvas-white)] transition-colors hover:bg-[var(--color-eggplant-gray)] disabled:opacity-40"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
                <button
                  type="button"
                  disabled={isMutating || request.status !== 'PENDING'}
                  onClick={() => rejectRequest(request)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-[3px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-3 text-sm font-semibold text-[var(--color-app-ink)] transition-colors hover:border-[var(--color-eggplant-gray)] hover:bg-[var(--color-app-surface-lift)] disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="hex-card p-6 sm:p-7">
        <div className="flex flex-col gap-3 border-b border-[var(--color-app-border)] pb-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-app-ink)]">Users</h2>
            <p className="mt-1 text-sm text-[var(--color-app-muted)]">Search, activate, suspend, or change roles.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-app-faint)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') loadAdminData();
                }}
                placeholder="Search users"
                className="min-h-10 w-full rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] pl-9 pr-3 text-sm text-[var(--color-app-ink)] outline-none transition-colors placeholder:text-[var(--color-app-faint)] focus:border-[var(--color-app-action)] focus:shadow-[var(--shadow-hex-focus)] sm:w-64"
              />
            </label>
            <select
              value={userStatus}
              onChange={(event) => setUserStatus(event.target.value)}
              className="min-h-10 rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-3 text-sm font-semibold text-[var(--color-app-muted)] outline-none focus:border-[var(--color-app-action)]"
            >
              <option value="">All users</option>
              {USER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <button
              type="button"
              onClick={loadAdminData}
              className="inline-flex min-h-10 items-center justify-center rounded-[3px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-4 text-sm font-semibold text-[var(--color-app-ink)] hover:border-[var(--color-eggplant-gray)] hover:bg-[var(--color-app-surface-lift)]"
            >
              Search
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full border-collapse text-left">
            <thead className="text-xs font-semibold text-[var(--color-app-muted)]">
              <tr>
                <th className="py-3 pr-4">User</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
                <th className="py-3 pl-4">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-app-border-clean)]">
              {isLoading ? (
                <tr><td colSpan={5} className="py-6 text-sm font-semibold text-[var(--color-app-muted)]">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-sm font-semibold text-[var(--color-app-muted)]">No users match this filter.</td></tr>
              ) : users.map(account => (
                <tr key={account.id} className="align-middle">
                  <td className="py-3 pr-4">
                    <div className="font-bold text-[var(--color-app-ink)]">{account.name}</div>
                    <div className="text-sm text-[var(--color-app-muted)]">{account.email}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={account.status} /></td>
                  <td className="px-4 py-3 text-sm font-bold text-[var(--color-app-muted)]">{account.role || 'USER'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-app-muted)]">
                    {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={account.status || 'ACTIVE'}
                        disabled={isMutating}
                        onChange={(event) => runMutation(
                          () => backendApi.updateAdminUserStatus(account.id, event.target.value),
                          'User status updated.'
                        )}
                        className="min-h-9 rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-2 text-sm font-semibold text-[var(--color-app-ink)] outline-none focus:border-[var(--color-app-action)]"
                      >
                        {USER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <select
                        value={account.role || 'USER'}
                        disabled={isMutating}
                        onChange={(event) => runMutation(
                          () => backendApi.updateAdminUserRole(account.id, event.target.value),
                          'User role updated.'
                        )}
                        className="min-h-9 rounded-[6px] border border-[var(--color-app-border)] bg-[var(--color-app-surface)] px-2 text-sm font-semibold text-[var(--color-app-ink)] outline-none focus:border-[var(--color-app-action)]"
                      >
                        {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
