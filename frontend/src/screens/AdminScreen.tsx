import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { backendApi } from '../lib/api';
import { Alert } from '../components/ui/Alert';
import { SearchInput } from '../components/ui/SearchInput';
import type { BackendCredentialRequestDTO, BackendUserDTO } from '../lib/api';

const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
const USER_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED'];
const USER_ROLES = ['USER', 'ADMIN'];

const statusClassName = (status?: string | null) => {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
      return 'text-[var(--color-state-success)]';
    case 'PENDING':
      return 'text-[var(--color-state-warning)]';
    case 'SUSPENDED':
    case 'REJECTED':
      return 'text-[var(--color-state-error)]';
    default:
      return 'text-app-muted';
  }
};

const StatusBadge = ({ status }: { status?: string | null }) => (
  <span
    className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider ${statusClassName(status)}`}
  >
    <span className="h-1.5 w-1.5 bg-current [clip-path:circle(50%)]" aria-hidden="true" />
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
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const pendingCount = useMemo(() => requests.filter((request) => request.status === 'PENDING').length, [requests]);

  const loadAdminData = useCallback(async () => {
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
  }, [requestStatus, search, userStatus]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

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
    await runMutation(
      () => backendApi.rejectCredentialRequest(request.id, rejectionReason.trim() || 'Request rejected by admin.'),
      'Credential request rejected.',
    );
    setRejectingRequestId(null);
    setRejectionReason('');
  };

  return (
    <div className="app-page flex flex-col gap-0 text-[var(--color-app-ink)]">
      <header className="border-b border-app-border py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mono-label mb-2 text-app-muted">Operations</p>
            <h1 className="text-2xl font-semibold leading-tight text-app-heading">Users</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-app-muted)]">
              Review requests, activate accounts, and keep roles accurate.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAdminData}
            disabled={isLoading || isMutating}
            className="inline-flex min-h-10 items-center justify-center gap-2 border border-app-border bg-app-bg px-3 font-mono text-[11px] uppercase tracking-wider text-app-heading transition-colors hover:border-app-action hover:text-app-action disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {error && <Alert tone="error">{error}</Alert>}

      <section className="grid border-b border-app-border sm:grid-cols-3">
        <div className="border-r border-app-border px-4 py-4 last:border-r-0">
          <p className="mono-label text-app-muted">Pending requests</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-app-heading">{pendingCount}</p>
        </div>
        <div className="border-r border-app-border px-4 py-4 last:border-r-0">
          <p className="mono-label text-app-muted">Loaded users</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-app-heading">{users.length}</p>
        </div>
        <div className="px-4 py-4">
          <p className="mono-label text-app-muted">Workspace</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-app-heading">Live</p>
        </div>
      </section>

      <section className="border-b border-app-border">
        <div className="flex flex-col gap-3 border-b border-[var(--color-app-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-app-ink)]">Credential requests</h2>
            <p className="mt-1 text-sm text-[var(--color-app-muted)]">Approve or reject new access requests.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {['', ...REQUEST_STATUSES].map((status) => (
              <button
                key={status || 'ALL'}
                type="button"
                onClick={() => setRequestStatus(status)}
                className={`min-h-9 border-b-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${requestStatus === status ? 'border-app-action text-app-action' : 'border-transparent text-app-muted hover:text-app-heading'}`}
              >
                {status || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="px-4 py-6">
              <span className="swiss-loading">
                <span>.</span> Loading requests
              </span>
            </div>
          ) : requests.length === 0 ? (
            <div className="px-4 py-6 text-sm italic text-[var(--color-app-muted)]">
              No credential requests match this filter.
            </div>
          ) : (
            requests.map((request) => (
              <article
                key={request.id}
                className="grid gap-4 border-b border-app-border px-4 py-4 last:border-b-0 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[var(--color-app-ink)]">{request.name}</h3>
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
                    onClick={() =>
                      runMutation(() => backendApi.approveCredentialRequest(request.id), 'Credential request approved.')
                    }
                    className="inline-flex min-h-10 items-center px-3 font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={isMutating || request.status !== 'PENDING'}
                    onClick={() => {
                      setRejectingRequestId(request.id);
                      setRejectionReason('');
                    }}
                    className="inline-flex min-h-10 items-center px-3 font-mono text-[11px] uppercase tracking-wider text-app-muted hover:text-app-action hover:underline disabled:opacity-40"
                  >
                    Reject
                  </button>
                  {rejectingRequestId === request.id && (
                    <div className="w-full min-w-[18rem] border border-app-border p-3">
                      <label htmlFor={`reject-${request.id}`} className="mono-label text-app-muted">
                        Rejection reason
                      </label>
                      <textarea
                        id={`reject-${request.id}`}
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        className="mt-2 min-h-20 w-full resize-y border border-app-border bg-app-bg p-2 text-sm text-app-text outline-none focus:border-app-action focus:shadow-[var(--shadow-focus)]"
                        placeholder="Short note for the request log"
                      />
                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => rejectRequest(request)}
                          className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
                        >
                          Confirm reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingRequestId(null)}
                          className="font-mono text-[11px] uppercase tracking-wider text-app-muted hover:text-app-heading"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="border-b border-app-border">
        <div className="flex flex-col gap-3 border-b border-[var(--color-app-border)] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-app-ink)]">Users</h2>
            <p className="mt-1 text-sm text-[var(--color-app-muted)]">Search, activate, suspend, or change roles.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="admin-user-search" className="sr-only">
              Search users
            </label>
            <SearchInput
              id="admin-user-search"
              size="sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch('')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') loadAdminData();
              }}
              placeholder="Search users"
              containerClassName="sm:w-64"
            />
            <select
              aria-label="Filter users by status"
              value={userStatus}
              onChange={(event) => setUserStatus(event.target.value)}
              className="h-9 border border-app-border bg-app-bg px-3 font-mono text-[11px] uppercase tracking-wider text-app-muted outline-none focus:border-app-action focus:shadow-[var(--shadow-focus)]"
            >
              <option value="">All users</option>
              {USER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadAdminData}
              className="inline-flex min-h-10 items-center justify-center border border-app-action bg-app-action px-4 font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover"
            >
              Search
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full border-collapse text-left">
            <thead className="border-b-2 border-app-heading font-mono text-[11px] uppercase tracking-wider text-[var(--color-app-muted)]">
              <tr>
                <th className="h-8 px-4">User</th>
                <th className="h-8 px-4">Status</th>
                <th className="h-8 px-4">Role</th>
                <th className="h-8 px-4">Created</th>
                <th className="h-8 px-4">Controls</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6">
                    <span className="swiss-loading">
                      <span>.</span> Loading users
                    </span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm italic text-[var(--color-app-muted)]">
                    No users match this filter.
                  </td>
                </tr>
              ) : (
                users.map((account) => (
                  <tr key={account.id} className="h-9 border-b border-app-border align-middle hover:bg-app-surface">
                    <td className="px-4 py-2">
                      <div className="font-semibold text-[var(--color-app-ink)]">{account.name}</div>
                      <div className="font-mono text-[11px] text-[var(--color-app-muted)]">{account.email}</div>
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={account.status} />
                    </td>
                    <td className="px-4 py-2 font-mono text-[12px] font-semibold text-[var(--color-app-muted)]">
                      {account.role || 'USER'}
                    </td>
                    <td className="px-4 py-2 font-mono text-[12px] text-[var(--color-app-muted)]">
                      {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <select
                          aria-label={`Set status for ${account.name}`}
                          value={account.status || 'ACTIVE'}
                          disabled={isMutating}
                          onChange={(event) =>
                            runMutation(
                              () => backendApi.updateAdminUserStatus(account.id, event.target.value),
                              'User status updated.',
                            )
                          }
                          className="min-h-9 border border-app-border bg-app-bg px-2 font-mono text-[11px] uppercase tracking-wider text-app-heading outline-none focus:border-app-action"
                        >
                          {USER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label={`Set role for ${account.name}`}
                          value={account.role || 'USER'}
                          disabled={isMutating}
                          onChange={(event) =>
                            runMutation(
                              () => backendApi.updateAdminUserRole(account.id, event.target.value),
                              'User role updated.',
                            )
                          }
                          className="min-h-9 border border-app-border bg-app-bg px-2 font-mono text-[11px] uppercase tracking-wider text-app-heading outline-none focus:border-app-action"
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
