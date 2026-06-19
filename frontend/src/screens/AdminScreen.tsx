import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useAuth } from '../context/AuthContext';
import { backendApi } from '../lib/api';
import { readAppPreferences, subscribeAppPreferences } from '../lib/appPreferences';
import { Alert } from '../components/ui/Alert';
import { HelperTip } from '../components/ui/Tooltip';
import { SearchInput } from '../components/ui/SearchInput';
import type { BackendAdCampaignDTO, BackendCredentialRequestDTO, BackendSearchResultDTO, BackendUserDTO } from '../lib/api';

type AdminSection =
  | 'overview'
  | 'analytics'
  | 'requests'
  | 'users'
  | 'ads'
  | 'categories'
  | 'tags'
  | 'authors'
  | 'billing'
  | 'reports'
  | 'topics'
  | 'audit';
type InspectorState =
  | { type: 'request'; data: BackendCredentialRequestDTO }
  | { type: 'user'; data: BackendUserDTO }
  | { type: 'ad'; data: BackendAdCampaignDTO }
  | { type: 'category'; data: BackendCategoryDTO }
  | { type: 'tag'; data: BackendTagDTO }
  | { type: 'author'; data: BackendAuthorDTO }
  | null;
type TrendMetric = 'users' | 'requests' | 'combined';
type AnalyticsMetric = 'users' | 'requests' | 'ads' | 'paidSubscribers' | 'restrictedUsers';
type AnalyticsChartType = 'area' | 'line' | 'bar' | 'donut' | 'kpi' | 'table';
type AnalyticsRange = 'all' | '7d' | '30d' | '90d';
type AnalyticsWidgetConfig = {
  id: string;
  title: string;
  metric: AnalyticsMetric;
  chartType: AnalyticsChartType;
  range: AnalyticsRange;
};

const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
const USER_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED'];
const USER_ROLES = ['USER', 'PARTNER', 'ADMIN'];
const AD_STATUSES = ['DRAFT', 'SUBMITTED', 'NEEDS_CHANGES', 'APPROVED', 'SCHEDULED', 'LIVE', 'ENDED', 'REJECTED'];
const TREND_METRICS: Array<{ value: TrendMetric; label: string; description: string }> = [
  {
    value: 'users',
    label: 'New users',
    description: 'Accounts created by day in the loaded user page.',
  },
  {
    value: 'requests',
    label: 'Credential requests',
    description: 'Reporter access requests created by day in the loaded request page.',
  },
  {
    value: 'combined',
    label: 'Combined activity',
    description: 'New users plus credential requests by day.',
  },
];
const ANALYTICS_STORAGE_KEY = 'tourane_admin_analytics_widgets';
const ANALYTICS_METRICS: Array<{ value: AnalyticsMetric; label: string; description: string }> = [
  {
    value: 'users',
    label: 'Users',
    description: 'Current accounts in the loaded user page. Time charts use account creation dates.',
  },
  {
    value: 'requests',
    label: 'Credential requests',
    description: 'Reporter access requests in the loaded request page. Time charts use request creation dates.',
  },
  {
    value: 'ads',
    label: 'Ad proposals',
    description: 'Partner ad proposals in the loaded ads page. Time charts use submitted or created dates.',
  },
  {
    value: 'paidSubscribers',
    label: 'Paid subscribers',
    description: 'Current paid-plan accounts in the loaded user page. Time charts use account creation dates.',
  },
  {
    value: 'restrictedUsers',
    label: 'Restricted users',
    description: 'Current suspended or rejected accounts in the loaded user page. Time charts use creation dates.',
  },
];
const ANALYTICS_CHART_TYPES: AnalyticsChartType[] = ['area', 'line', 'bar', 'donut', 'kpi', 'table'];
const ANALYTICS_RANGES: Array<{ value: AnalyticsRange; label: string }> = [
  { value: 'all', label: 'All loaded' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];
const DEFAULT_ANALYTICS_WIDGETS: AnalyticsWidgetConfig[] = [
  { id: 'users-area', title: 'Users', metric: 'users', chartType: 'area', range: '30d' },
  { id: 'requests-bar', title: 'Credential requests', metric: 'requests', chartType: 'bar', range: '30d' },
  { id: 'ads-donut', title: 'Ad proposal mix', metric: 'ads', chartType: 'donut', range: 'all' },
  { id: 'subscribers-kpi', title: 'Paid subscribers', metric: 'paidSubscribers', chartType: 'kpi', range: 'all' },
];

const adminNavGroups: Array<{
  label: string;
  items: Array<{ id: AdminSection; label: string; count?: (input: AdminCounts) => number }>;
}> = [
  {
    label: 'Command',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'categories', label: 'Categories' },
      { id: 'tags', label: 'Tags' },
      { id: 'authors', label: 'Authors' },
      { id: 'topics', label: 'Topics' },
    ],
  },
  {
    label: 'Access',
    items: [
      { id: 'requests', label: 'Credential Requests', count: (counts) => counts.pendingRequests },
      { id: 'users', label: 'Users', count: (counts) => counts.suspendedUsers },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: 'ads', label: 'Ad Proposals', count: (counts) => counts.submittedAds },
      { id: 'billing', label: 'Billing', count: (counts) => counts.paidSubscribers },
      { id: 'reports', label: 'Reports' },
    ],
  },
  { label: 'System', items: [{ id: 'audit', label: 'Audit Log' }] },
];

type AdminCounts = {
  pendingRequests: number;
  loadedUsers: number;
  paidSubscribers: number;
  suspendedUsers: number;
  submittedAds: number;
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : 'Unknown');

const chartPalette = [
  'var(--color-app-action)',
  'var(--color-app-heading)',
  'var(--color-app-muted)',
  'var(--color-app-border-strong, var(--color-app-border))',
];

const formatChartLabel = (value: string) => value.replaceAll('_', ' ');

const getDayBucket = (value?: string | null) => {
  if (!value) return { key: 'Unknown', label: 'Unknown', timestamp: Number.MAX_SAFE_INTEGER };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { key: 'Unknown', label: 'Unknown', timestamp: Number.MAX_SAFE_INTEGER };
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return {
    key: String(dayStart),
    label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    timestamp: dayStart,
  };
};

const buildTrendData = (requests: BackendCredentialRequestDTO[], users: BackendUserDTO[]) => {
  const buckets = new Map<string, { label: string; timestamp: number; requests: number; users: number }>();
  const ensureBucket = (bucket: ReturnType<typeof getDayBucket>) => {
    if (!buckets.has(bucket.key)) {
      buckets.set(bucket.key, { label: bucket.label, timestamp: bucket.timestamp, requests: 0, users: 0 });
    }
    return buckets.get(bucket.key)!;
  };

  requests.forEach((request) => {
    ensureBucket(getDayBucket(request.createdAt)).requests += 1;
  });
  users.forEach((account) => {
    ensureBucket(getDayBucket(account.createdAt)).users += 1;
  });

  return Array.from(buckets.values())
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(-10)
    .map(({ label, requests: requestCount, users: userCount }) => ({
      label,
      requests: requestCount,
      users: userCount,
      combined: requestCount + userCount,
    }));
};

const readAnalyticsWidgets = (): AnalyticsWidgetConfig[] => {
  if (typeof window === 'undefined') return DEFAULT_ANALYTICS_WIDGETS;
  const stored = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
  if (!stored) return DEFAULT_ANALYTICS_WIDGETS;

  try {
    const parsed = JSON.parse(stored) as AnalyticsWidgetConfig[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ANALYTICS_WIDGETS;
  } catch {
    return DEFAULT_ANALYTICS_WIDGETS;
  }
};

const saveAnalyticsWidgets = (widgets: AnalyticsWidgetConfig[]) => {
  window.localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(widgets));
};

const metricLabel = (metric: AnalyticsMetric) =>
  ANALYTICS_METRICS.find((item) => item.value === metric)?.label || formatChartLabel(metric);

const metricDescription = (metric: AnalyticsMetric) =>
  ANALYTICS_METRICS.find((item) => item.value === metric)?.description || 'Loaded admin records.';

const rangeStart = (range: AnalyticsRange) => {
  if (range === 'all') return null;
  const days = Number(range.replace('d', ''));
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const inRange = (value: string | null | undefined, range: AnalyticsRange) => {
  const start = rangeStart(range);
  if (start == null) return true;
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp >= start;
};

const normalized = (value?: string | null) => (value || '').toUpperCase();

const userStatus = (account: BackendUserDTO) => normalized(account.status || 'ACTIVE');

const requestStatusValue = (request: BackendCredentialRequestDTO) => normalized(request.status);

const adStatusValue = (campaign: BackendAdCampaignDTO) => normalized(campaign.status);

const userPlan = (account: BackendUserDTO) => normalized(account.subscriptionPlan || 'FREE');

const campaignDate = (campaign: BackendAdCampaignDTO) => campaign.submittedAt || campaign.createdAt;

const buildAnalyticsSeries = (
  widget: AnalyticsWidgetConfig,
  requests: BackendCredentialRequestDTO[],
  users: BackendUserDTO[],
  ads: BackendAdCampaignDTO[],
) => {
  const buckets = new Map<string, { label: string; timestamp: number; value: number }>();
  const add = (value?: string | null) => {
    const bucket = getDayBucket(value);
    if (bucket.key === 'Unknown') return;
    if (!buckets.has(bucket.key)) {
      buckets.set(bucket.key, { label: bucket.label, timestamp: bucket.timestamp, value: 0 });
    }
    buckets.get(bucket.key)!.value += 1;
  };

  if (widget.metric === 'users') {
    users.filter((account) => inRange(account.createdAt, widget.range)).forEach((account) => add(account.createdAt));
  }
  if (widget.metric === 'requests') {
    requests.filter((request) => inRange(request.createdAt, widget.range)).forEach((request) => add(request.createdAt));
  }
  if (widget.metric === 'ads') {
    ads
      .filter((campaign) => inRange(campaignDate(campaign), widget.range))
      .forEach((campaign) => add(campaignDate(campaign)));
  }
  if (widget.metric === 'paidSubscribers') {
    users
      .filter((account) => userPlan(account) !== 'FREE')
      .filter((account) => inRange(account.createdAt, widget.range))
      .forEach((account) => add(account.createdAt));
  }
  if (widget.metric === 'restrictedUsers') {
    users
      .filter((account) => ['SUSPENDED', 'REJECTED'].includes(userStatus(account)))
      .filter((account) => inRange(account.createdAt, widget.range))
      .forEach((account) => add(account.createdAt));
  }

  return Array.from(buckets.values()).sort((left, right) => left.timestamp - right.timestamp);
};

const buildAnalyticsBreakdown = (
  widget: AnalyticsWidgetConfig,
  requests: BackendCredentialRequestDTO[],
  users: BackendUserDTO[],
  ads: BackendAdCampaignDTO[],
) => {
  if (widget.metric === 'users') {
    return USER_STATUSES.map((status) => ({
      label: formatChartLabel(status),
      value: users.filter((account) => userStatus(account) === status).length,
    }));
  }
  if (widget.metric === 'requests') {
    return REQUEST_STATUSES.map((status) => ({
      label: formatChartLabel(status),
      value: requests.filter((request) => requestStatusValue(request) === status).length,
    }));
  }
  if (widget.metric === 'ads') {
    return AD_STATUSES.map((status) => ({
      label: formatChartLabel(status),
      value: ads.filter((campaign) => adStatusValue(campaign) === status).length,
    })).filter((item) => item.value > 0);
  }
  if (widget.metric === 'paidSubscribers') {
    return ['READER_PLUS', 'BACKER', 'NEWSROOM_PRO'].map((plan) => ({
      label: formatChartLabel(plan),
      value: users.filter((account) => userPlan(account) === plan).length,
    }));
  }
  return USER_STATUSES.map((status) => ({
    label: formatChartLabel(status),
    value: users
      .filter((account) => ['SUSPENDED', 'REJECTED'].includes(userStatus(account)))
      .filter((account) => userStatus(account) === status).length,
  })).filter((item) => item.value > 0);
};

const buildAnalyticsTotal = (
  widget: AnalyticsWidgetConfig,
  requests: BackendCredentialRequestDTO[],
  users: BackendUserDTO[],
  ads: BackendAdCampaignDTO[],
) => {
  if (widget.chartType === 'area' || widget.chartType === 'line' || widget.chartType === 'bar') {
    return buildAnalyticsSeries(widget, requests, users, ads).reduce((sum, item) => sum + item.value, 0);
  }
  if (widget.metric === 'users') return users.length;
  if (widget.metric === 'requests') return requests.length;
  if (widget.metric === 'ads') return ads.length;
  if (widget.metric === 'paidSubscribers') return users.filter((account) => userPlan(account) !== 'FREE').length;
  return users.filter((account) => ['SUSPENDED', 'REJECTED'].includes(userStatus(account))).length;
};

const csvEscape = (value: unknown) => {
  if (value == null) return '';
  const text = Array.isArray(value) ? value.join('|') : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const exportCsv = <TData,>(filename: string, rows: TData[]) => {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0] as Record<string, unknown>);
  const csv = [
    keys.join(','),
    ...rows.map((row) => keys.map((key) => csvEscape((row as Record<string, unknown>)[key])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const statusClassName = (status?: string | null) => {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'LIVE':
      return 'text-[var(--color-state-success)]';
    case 'PENDING':
    case 'SUBMITTED':
    case 'NEEDS_CHANGES':
    case 'SCHEDULED':
    case 'PAST_DUE':
      return 'text-[var(--color-state-warning)]';
    case 'SUSPENDED':
    case 'REJECTED':
    case 'CANCELED':
    case 'ENDED':
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
  const [preferences, setPreferences] = useState(() => readAppPreferences());
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [requestStatus, setRequestStatus] = useState('PENDING');
  const [userStatus, setUserStatus] = useState('');
  const [adStatus, setAdStatus] = useState('SUBMITTED');
  const [search, setSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [requests, setRequests] = useState<BackendCredentialRequestDTO[]>([]);
  const [users, setUsers] = useState<BackendUserDTO[]>([]);
  const [ads, setAds] = useState<BackendAdCampaignDTO[]>([]);
  const [categories, setCategories] = useState<BackendCategoryDTO[]>([]);
  const [tags, setTags] = useState<BackendTagDTO[]>([]);
  const [authors, setAuthors] = useState<BackendAuthorDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');
  const [inspector, setInspector] = useState<InspectorState>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<BackendCredentialRequestDTO[]>([]);
  const [selectedAds, setSelectedAds] = useState<BackendAdCampaignDTO[]>([]);
  const [analyticsWidgets, setAnalyticsWidgets] = useState<AnalyticsWidgetConfig[]>(() => readAnalyticsWidgets());
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<BackendSearchResultDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'ADMIN';
  const resolvedTheme = preferences.theme === 'system' ? systemTheme : preferences.theme;

  useEffect(() => subscribeAppPreferences(setPreferences), []);

  useEffect(() => {
    saveAnalyticsWidgets(analyticsWidgets);
  }, [analyticsWidgets]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const counts = useMemo<AdminCounts>(
    () => ({
      pendingRequests: requests.filter((request) => request.status === 'PENDING').length,
      loadedUsers: users.length,
      paidSubscribers: users.filter((account) => account.subscriptionPlan && account.subscriptionPlan !== 'FREE')
        .length,
      suspendedUsers: users.filter((account) => ['SUSPENDED', 'REJECTED'].includes(account.status || '')).length,
      submittedAds: ads.filter((campaign) => campaign.status === 'SUBMITTED').length,
    }),
    [ads, requests, users],
  );

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [requestPage, userPage, adPage, catPage, tagPage, authorPage] = await Promise.all([
        backendApi.getAdminCredentialRequests(requestStatus, 0, 40),
        backendApi.getAdminUsers({ search, status: userStatus, page: 0, size: 40 }),
        backendApi.getAdminAdCampaigns(adStatus, 0, 40),
        backendApi.getAdminCategories(categorySearch, 0, 40),
        backendApi.getAdminTags(tagSearch, 0, 40),
        backendApi.getAdminAuthors(authorSearch, 0, 40),
      ]);
      setRequests(requestPage.content || []);
      setUsers(userPage.content || []);
      setAds(adPage.content || []);
      setCategories(catPage.content || []);
      setTags(tagPage.content || []);
      setAuthors(authorPage.content || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Admin data could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [adStatus, requestStatus, search, userStatus, categorySearch, tagSearch, authorSearch]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  const requestColumns = useMemo<ColumnDef<BackendCredentialRequestDTO>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all credential requests"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 accent-[var(--color-app-action)]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select request from ${row.original.email}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 accent-[var(--color-app-action)]"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: 'Request',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => {
              setInspector({ type: 'request', data: row.original });
              setRejectionReason('');
            }}
            className="text-left"
          >
            <span className="block font-semibold text-app-heading">{row.original.name}</span>
            <span className="mt-1 block font-mono text-[11px] text-app-muted">{row.original.email}</span>
          </button>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'reportingFocus',
        header: 'Focus',
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm leading-6 text-app-muted">
            {row.original.reportingFocus || row.original.rejectionReason || 'No reporting focus supplied.'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Requested',
        cell: ({ row }) => (
          <span className="font-mono text-[12px] text-app-muted">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => {
              setInspector({ type: 'request', data: row.original });
              setRejectionReason('');
            }}
            className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
          >
            Inspect
          </button>
        ),
      },
    ],
    [],
  );

  const userColumns = useMemo<ColumnDef<BackendUserDTO>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all users"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 accent-[var(--color-app-action)]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.email}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 accent-[var(--color-app-action)]"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspector({ type: 'user', data: row.original })}
            className="text-left"
          >
            <span className="block font-semibold text-app-heading">{row.original.name}</span>
            <span className="mt-1 block font-mono text-[11px] text-app-muted">{row.original.email}</span>
          </button>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <span className="font-mono text-[12px] font-semibold text-app-muted">{row.original.role || 'USER'}</span>
        ),
      },
      {
        accessorKey: 'subscriptionPlan',
        header: 'Subscription',
        cell: ({ row }) => (
          <span className="font-mono text-[12px] text-app-muted">
            {row.original.subscriptionPlan || 'FREE'} · {row.original.billingCadence || 'MONTHLY'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="font-mono text-[12px] text-app-muted">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspector({ type: 'user', data: row.original })}
            className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
          >
            Inspect
          </button>
        ),
      },
    ],
    [],
  );

  const adColumns = useMemo<ColumnDef<BackendAdCampaignDTO>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all ad proposals"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 accent-[var(--color-app-action)]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.brandName}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 accent-[var(--color-app-action)]"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'brandName',
        header: 'Campaign',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => {
              setInspector({ type: 'ad', data: row.original });
              setRejectionReason(row.original.reviewNote || '');
            }}
            className="text-left"
          >
            <span className="block font-semibold text-app-heading">{row.original.brandName}</span>
            <span className="mt-1 block font-mono text-[11px] text-app-muted">{row.original.headline}</span>
          </button>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'partnerEmail',
        header: 'Partner',
        cell: ({ row }) => (
          <span className="font-mono text-[12px] text-app-muted">
            {row.original.partnerName || 'Partner'} · {row.original.partnerEmail || 'No email'}
          </span>
        ),
      },
      {
        accessorKey: 'placement',
        header: 'Placement',
        cell: ({ row }) => <span className="text-sm text-app-muted">{row.original.placement || 'Unassigned'}</span>,
      },
      {
        accessorKey: 'submittedAt',
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="font-mono text-[12px] text-app-muted">{formatDate(row.original.submittedAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => {
              setInspector({ type: 'ad', data: row.original });
              setRejectionReason(row.original.reviewNote || '');
            }}
            className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
          >
            Review
          </button>
        ),
      },
    ],
    [],
  );

  const categoryColumns = useMemo<ColumnDef<BackendCategoryDTO>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspector({ type: 'category', data: row.original })}
            className="text-left"
          >
            <span className="block font-semibold text-app-heading">{row.original.name}</span>
            <span className="mt-1 block font-mono text-[11px] text-app-muted">{row.original.slug}</span>
          </button>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md text-sm leading-6 text-app-muted">
            {row.original.description || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'articleCount',
        header: 'Articles',
        cell: ({ row }) => (
          <span className="font-mono text-[13px] tabular-nums text-app-muted">
            {(row.original.articleCount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspector({ type: 'category', data: row.original })}
            className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
          >
            Edit
          </button>
        ),
      },
    ],
    [],
  );

  const tagColumns = useMemo<ColumnDef<BackendTagDTO>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspector({ type: 'tag', data: row.original })}
            className="text-left"
          >
            <span className="block font-semibold text-app-heading">{row.original.name}</span>
            <span className="mt-1 block font-mono text-[11px] text-app-muted">{row.original.slug}</span>
          </button>
        ),
      },
      {
        accessorKey: 'articleCount',
        header: 'Articles',
        cell: ({ row }) => (
          <span className="font-mono text-[13px] tabular-nums text-app-muted">
            {(row.original.articleCount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspector({ type: 'tag', data: row.original })}
            className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
          >
            Edit
          </button>
        ),
      },
    ],
    [],
  );

  const authorColumns = useMemo<ColumnDef<BackendAuthorDTO>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspector({ type: 'author', data: row.original })}
            className="text-left"
          >
            <span className="block font-semibold text-app-heading">{row.original.name}</span>
            <span className="mt-1 block font-mono text-[11px] text-app-muted">{row.original.slug}</span>
          </button>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="font-mono text-[12px] text-app-muted">{row.original.email || '—'}</span>
        ),
      },
      {
        accessorKey: 'articleCount',
        header: 'Articles',
        cell: ({ row }) => (
          <span className="font-mono text-[13px] tabular-nums text-app-muted">
            {(row.original.articleCount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspector({ type: 'author', data: row.original })}
            className="font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
          >
            Edit
          </button>
        ),
      },
    ],
    [],
  );

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
      setInspector(null);
      setRejectionReason('');
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Admin action failed.');
    } finally {
      setIsMutating(false);
    }
  };

  const approveRequest = (request: BackendCredentialRequestDTO) =>
    runMutation(() => backendApi.approveCredentialRequest(request.id), 'Credential request approved.');

  const rejectRequest = (request: BackendCredentialRequestDTO) =>
    runMutation(
      () => backendApi.rejectCredentialRequest(request.id, rejectionReason.trim() || 'Request rejected by admin.'),
      'Credential request rejected.',
    );

  const batchApprove = () => {
    if (selectedRequests.length === 0) return;
    runMutation(
      () => Promise.all(selectedRequests.map((r) => backendApi.approveCredentialRequest(r.id))).then(() => undefined),
      `${selectedRequests.length} requests approved.`,
    );
  };

  const batchReject = () => {
    if (selectedRequests.length === 0) return;
    const reason = rejectionReason.trim() || 'Batch rejected by admin.';
    runMutation(
      () => Promise.all(selectedRequests.map((r) => backendApi.rejectCredentialRequest(r.id, reason))).then(() => undefined),
      `${selectedRequests.length} requests rejected.`,
    );
  };

  const updateUserStatus = (account: BackendUserDTO, status: string) =>
    runMutation(() => backendApi.updateAdminUserStatus(account.id, status), 'User status updated.');

  const updateUserRole = (account: BackendUserDTO, role: string) =>
    runMutation(() => backendApi.updateAdminUserRole(account.id, role), 'User role updated.');

  const approveAdCampaign = (campaign: BackendAdCampaignDTO) =>
    runMutation(
      () => backendApi.approveAdminAdCampaign(campaign.id, rejectionReason.trim() || undefined),
      'Ad proposal approved.',
    );

  const rejectAdCampaign = (campaign: BackendAdCampaignDTO) =>
    runMutation(
      () => backendApi.rejectAdminAdCampaign(campaign.id, rejectionReason.trim() || 'Ad proposal rejected by admin.'),
      'Ad proposal rejected.',
    );

  const handleGlobalSearch = async () => {
    const q = globalSearchQuery.trim();
    if (!q) { setGlobalSearchResults([]); return; }
    setIsSearching(true);
    try {
      const results = await backendApi.searchAdmin(q);
      setGlobalSearchResults(results);
    } catch {
      setGlobalSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteUser = (account: BackendUserDTO) => {
    if (!window.confirm(`Delete user ${account.email}? This cannot be undone.`)) return;
    runMutation(() => backendApi.deleteAdminUser(account.id), 'User deleted.');
  };

  const [editForm, setEditForm] = useState<{
    category?: Partial<BackendCategoryDTO>;
    tag?: Partial<BackendTagDTO>;
    author?: Partial<BackendAuthorDTO>;
  }>({});

  const handleCreateCategory = () => {
    const empty = { name: '', slug: '', description: '' };
    setEditForm({ category: empty });
    setInspector({ type: 'category', data: empty as BackendCategoryDTO });
  };

  const handleSaveCategory = async () => {
    const form = editForm.category;
    if (!form) return;
    const isNew = !('id' in form) || !form.id;
    await runMutation(
      isNew
        ? () => backendApi.createAdminCategory({ name: form.name || '', slug: form.slug, description: form.description })
        : () => backendApi.updateAdminCategory(form.id!, { name: form.name, slug: form.slug, description: form.description }),
      isNew ? 'Category created.' : 'Category updated.',
    );
    setEditForm((prev) => ({ ...prev, category: undefined }));
  };

  const handleDeleteCategory = (id: number) =>
    runMutation(() => backendApi.deleteAdminCategory(id), 'Category deleted.');

  const handleCreateTag = () => {
    const empty = { name: '', slug: '' };
    setEditForm({ tag: empty });
    setInspector({ type: 'tag', data: empty as BackendTagDTO });
  };

  const handleSaveTag = async () => {
    const form = editForm.tag;
    if (!form) return;
    const isNew = !('id' in form) || !form.id;
    await runMutation(
      isNew
        ? () => backendApi.createAdminTag({ name: form.name || '', slug: form.slug })
        : () => backendApi.updateAdminTag(form.id!, { name: form.name, slug: form.slug }),
      isNew ? 'Tag created.' : 'Tag updated.',
    );
    setEditForm((prev) => ({ ...prev, tag: undefined }));
  };

  const handleDeleteTag = (id: number) =>
    runMutation(() => backendApi.deleteAdminTag(id), 'Tag deleted.');

  const handleCreateAuthor = () => {
    const empty = { name: '', slug: '', bio: '', avatarUrl: '', email: '', facebookUrl: '', twitterUrl: '' };
    setEditForm({ author: empty });
    setInspector({ type: 'author', data: empty as BackendAuthorDTO });
  };

  const handleSaveAuthor = async () => {
    const form = editForm.author;
    if (!form) return;
    const isNew = !('id' in form) || !form.id;
    await runMutation(
      isNew
        ? () => backendApi.createAdminAuthor({ name: form.name || '', slug: form.slug, bio: form.bio, avatarUrl: form.avatarUrl, email: form.email, facebookUrl: form.facebookUrl, twitterUrl: form.twitterUrl })
        : () => backendApi.updateAdminAuthor(form.id!, { name: form.name, slug: form.slug, bio: form.bio, avatarUrl: form.avatarUrl, email: form.email, facebookUrl: form.facebookUrl, twitterUrl: form.twitterUrl }),
      isNew ? 'Author created.' : 'Author updated.',
    );
    setEditForm((prev) => ({ ...prev, author: undefined }));
  };

  const handleDeleteAuthor = (id: number) =>
    runMutation(() => backendApi.deleteAdminAuthor(id), 'Author deleted.');

  const addAnalyticsWidget = () => {
    setAnalyticsWidgets((current) => [
      ...current,
      {
        id: `widget-${Date.now()}`,
        title: 'New widget',
        metric: 'users',
        chartType: 'area',
        range: '30d',
      },
    ]);
  };

  const updateAnalyticsWidget = (id: string, patch: Partial<AnalyticsWidgetConfig>) => {
    setAnalyticsWidgets((current) =>
      current.map((widget) => {
        if (widget.id !== id) return widget;
        const next = { ...widget, ...patch };
        if (patch.metric && !patch.title) {
          next.title = metricLabel(patch.metric);
        }
        return next;
      }),
    );
  };

  const removeAnalyticsWidget = (id: string) => {
    setAnalyticsWidgets((current) => current.filter((widget) => widget.id !== id));
  };

  const resetAnalyticsWidgets = () => setAnalyticsWidgets(DEFAULT_ANALYTICS_WIDGETS);

  return (
    <div
      className="app-shell min-h-svh w-full bg-app-bg text-app-text selection:bg-[var(--color-brand-red-faint)] selection:text-app-heading"
      data-app-theme={resolvedTheme}
      data-app-density={preferences.density}
      data-app-motion={preferences.motion}
      data-trust-alerts={preferences.trustAlerts ? 'on' : 'off'}
    >
      <a href="#admin-main" className="skip-to-content">
        Skip to admin content
      </a>
      <AdminTopBar onRefresh={loadAdminData} isLoading={isLoading || isMutating} />
      <div className="grid min-h-[calc(100svh-57px)] gap-0 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <AdminSidebar activeSection={activeSection} counts={counts} onChange={setActiveSection} />

        <main id="admin-main" tabIndex={-1} className="min-w-0 border-l border-app-border">
          <header className="border-b border-app-border px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <AdminBreadcrumb section={activeSection} />
                <h1 className="text-2xl font-semibold leading-tight text-app-heading">{sectionTitle(activeSection)}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
                  Review access, control accounts, and keep subscription operations visible.
                </p>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">Isolated admin console</p>
            </div>
            <div className="border-t border-app-border" />
            <div className="flex items-center gap-3 border-b border-app-border px-5 py-3">
              <input
                ref={searchInputRef}
                type="search"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGlobalSearch(); }}
                placeholder="Search users, articles, posts..."
                className="h-9 flex-1 border border-app-border bg-app-bg px-3 text-sm text-app-text outline-none focus:border-app-action"
              />
              <button
                type="button"
                disabled={isSearching || !globalSearchQuery.trim()}
                onClick={handleGlobalSearch}
                className="h-9 border border-app-border px-3 font-mono text-[11px] uppercase tracking-wider text-app-heading hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              {globalSearchResults.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setGlobalSearchQuery(''); setGlobalSearchResults([]); searchInputRef.current?.focus(); }}
                  className="font-mono text-[11px] text-app-muted hover:text-app-action"
                >
                  Clear
                </button>
              )}
            </div>
            {globalSearchResults.length > 0 && (
              <div className="border-b border-app-border">
                {globalSearchResults.map((result) => (
                  <Link
                    key={`${result.entityType}-${result.id}`}
                    to={result.url}
                    className="flex items-center gap-4 border-b border-app-border px-5 py-3 text-sm hover:bg-app-surface last:border-b-0"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">{result.entityType}</span>
                    <span className="flex-1 font-semibold text-app-heading">{result.title}</span>
                    {result.subtitle && <span className="hidden text-app-muted md:block">{result.subtitle}</span>}
                    <span className="font-mono text-[10px] uppercase tracking-wider text-app-muted">{result.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </header>

          {error && (
            <div className="px-5 pt-5">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          <div className="grid xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="min-w-0">
              <MetricStrip counts={counts} />
              <AdminNoticeStrip counts={counts} onGoToSection={setActiveSection} />
              {activeSection === 'overview' && (
                <OverviewPanel
                  requests={requests}
                  users={users}
                  isLoading={isLoading}
                  onOpenRequest={(request) => {
                    setInspector({ type: 'request', data: request });
                    setRejectionReason('');
                  }}
                  onOpenUser={(account) => setInspector({ type: 'user', data: account })}
                  onGoToSection={setActiveSection}
                />
              )}
              {activeSection === 'analytics' && (
                <AnalyticsPanel
                  widgets={analyticsWidgets}
                  requests={requests}
                  users={users}
                  ads={ads}
                  onAddWidget={addAnalyticsWidget}
                  onResetWidgets={resetAnalyticsWidgets}
                  onUpdateWidget={updateAnalyticsWidget}
                  onRemoveWidget={removeAnalyticsWidget}
                />
              )}
              {activeSection === 'requests' && (
                <div>
                  <RequestToolbar requestStatus={requestStatus} onStatusChange={setRequestStatus} />
                  <BulkActionBar
                    count={selectedRequests.length}
                    isMutating={isMutating}
                    actions={[
                      { label: 'Batch approve', onClick: batchApprove },
                      { label: 'Batch reject', onClick: batchReject, variant: 'danger' },
                    ]}
                  />
                  <AdminDataTable
                    data={requests}
                    columns={requestColumns}
                    isLoading={isLoading}
                    emptyText="No credential requests match this filter. Try a different status tab above."
                    exportName="credential-requests"
                    onSelectionChange={setSelectedRequests}
                  />
                </div>
              )}
              {activeSection === 'users' && (
                <div>
                  <UserToolbar
                    search={search}
                    userStatus={userStatus}
                    onSearchChange={setSearch}
                    onStatusChange={setUserStatus}
                    onSubmit={loadAdminData}
                  />
                  <AdminDataTable
                    data={users}
                    columns={userColumns}
                    isLoading={isLoading}
                    emptyText="No users match this filter. Try adjusting the search or status filter above."
                    exportName="users"
                  />
                </div>
              )}
              {activeSection === 'ads' && (
                <div>
                  <AdToolbar adStatus={adStatus} onStatusChange={setAdStatus} />
                  <AdminDataTable
                    data={ads}
                    columns={adColumns}
                    isLoading={isLoading}
                    emptyText="No ad proposals match this filter. Try a different status tab above."
                    exportName="ad-proposals"
                  />
                </div>
              )}
              {activeSection === 'categories' && (
                <div>
                  <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-app-heading">Categories</h2>
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="h-9 border border-app-action bg-app-action px-3 font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover"
                    >
                      Create category
                    </button>
                  </div>
                  <CategoryToolbar
                    search={categorySearch}
                    onSearchChange={setCategorySearch}
                    onSubmit={loadAdminData}
                  />
                  <AdminDataTable
                    data={categories}
                    columns={categoryColumns}
                    isLoading={isLoading}
                    emptyText="No categories match this filter. Try a different search term."
                    exportName="categories"
                  />
                </div>
              )}
              {activeSection === 'tags' && (
                <div>
                  <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-app-heading">Tags</h2>
                    <button
                      type="button"
                      onClick={handleCreateTag}
                      className="h-9 border border-app-action bg-app-action px-3 font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover"
                    >
                      Create tag
                    </button>
                  </div>
                  <TagToolbar
                    search={tagSearch}
                    onSearchChange={setTagSearch}
                    onSubmit={loadAdminData}
                  />
                  <AdminDataTable
                    data={tags}
                    columns={tagColumns}
                    isLoading={isLoading}
                    emptyText="No tags match this filter. Try a different search term."
                    exportName="tags"
                  />
                </div>
              )}
              {activeSection === 'authors' && (
                <div>
                  <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-app-heading">Authors</h2>
                    <button
                      type="button"
                      onClick={handleCreateAuthor}
                      className="h-9 border border-app-action bg-app-action px-3 font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover"
                    >
                      Create author
                    </button>
                  </div>
                  <AuthorToolbar
                    search={authorSearch}
                    onSearchChange={setAuthorSearch}
                    onSubmit={loadAdminData}
                  />
                  <AdminDataTable
                    data={authors}
                    columns={authorColumns}
                    isLoading={isLoading}
                    emptyText="No authors match this filter. Try a different search term."
                    exportName="authors"
                  />
                </div>
              )}
              {activeSection === 'billing' && (
                <PlaceholderPanel
                  title="Billing operations"
                  copy="Stripe IDs, webhook health, failed payments, and manual recovery actions will live here. Subscription state is already visible in the user table."
                />
              )}
              {activeSection === 'reports' && (
                <PlaceholderPanel
                  title="Reports queue"
                  copy="Flagged posts, flagged comments, and moderation outcomes need backend endpoints before this surface can become active."
                />
              )}
              {activeSection === 'topics' && (
                <PlaceholderPanel
                  title="Topic governance"
                  copy="Topic ownership, join velocity, and stale community review can slot into this section once the admin topic endpoints exist."
                />
              )}
              {activeSection === 'audit' && (
                <PlaceholderPanel
                  title="Audit log"
                  copy="Every approval, rejection, role change, suspension, and billing repair should write to an append-only audit trail."
                />
              )}
            </section>

            <AdminInspector
              inspector={inspector}
              isMutating={isMutating}
              rejectionReason={rejectionReason}
              editForm={editForm}
              onRejectionReasonChange={setRejectionReason}
              onEditFormChange={setEditForm}
              onClose={() => {
                setInspector(null);
                setRejectionReason('');
              }}
              onApprove={approveRequest}
              onReject={rejectRequest}
              onUpdateUserStatus={updateUserStatus}
              onUpdateUserRole={updateUserRole}
              onApproveAd={approveAdCampaign}
              onRejectAd={rejectAdCampaign}
              onDeleteUser={handleDeleteUser}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
              onSaveTag={handleSaveTag}
              onDeleteTag={handleDeleteTag}
              onSaveAuthor={handleSaveAuthor}
              onDeleteAuthor={handleDeleteAuthor}
            />
          </div>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            borderRadius: '0',
            borderColor: 'var(--color-app-border)',
            background: 'var(--color-app-surface)',
            color: 'var(--color-app-ink)',
            boxShadow: 'var(--shadow-modal)',
          },
        }}
      />
    </div>
  );
};

const AdminTopBar: React.FC<{ onRefresh: () => void; isLoading: boolean }> = ({ onRefresh, isLoading }) => (
  <header className="sticky top-0 z-40 border-b-2 border-app-heading bg-app-bg">
    <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-4 lg:px-6">
      <div className="min-w-0">
        <Link to="/admin" className="inline-flex items-baseline gap-3">
          <span className="text-base font-semibold tracking-[-0.01em] text-app-heading">Tourane Admin</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-app-muted sm:inline">
            Operations console
          </span>
        </Link>
      </div>
      <Link to="/app" className="font-mono text-[11px] uppercase tracking-wider text-app-muted hover:text-app-action">
        Reader app
      </Link>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="inline-flex h-9 items-center gap-2 border border-app-border px-3 font-mono text-[11px] uppercase tracking-wider text-app-heading hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Sync
      </button>
    </div>
  </header>
);

const AdminBreadcrumb: React.FC<{ section: AdminSection }> = ({ section }) => (
  <nav
    aria-label="Admin breadcrumb"
    className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider"
  >
    <span className="text-app-muted">Admin</span>
    <span className="text-app-muted">/</span>
    <span className="text-app-muted">{sectionGroupLabel(section)}</span>
    <span className="text-app-muted">/</span>
    <span className="text-app-action">{sectionTitle(section)}</span>
  </nav>
);

const AdminSidebar: React.FC<{
  activeSection: AdminSection;
  counts: AdminCounts;
  onChange: (section: AdminSection) => void;
}> = ({ activeSection, counts, onChange }) => (
  <aside className="border-b border-app-border pb-4 lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:border-b-0 lg:pb-0">
    <div className="border-b border-app-border px-4 py-4">
      <p className="mono-label text-app-muted">Admin</p>
      <p className="mt-2 text-sm font-semibold text-app-heading">Control desk</p>
    </div>
    <nav className="py-3" aria-label="Admin sections">
      {adminNavGroups.map((group) => (
        <div key={group.label} className="pb-4">
          <p className="px-4 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-app-muted">{group.label}</p>
          {group.items.map((item) => {
            const count = item.count?.(counts);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`grid w-full grid-cols-[4px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-app-surface ${
                  activeSection === item.id ? 'font-semibold text-app-heading' : 'text-app-muted'
                }`}
              >
                <span className={`h-full min-h-5 ${activeSection === item.id ? 'bg-app-action' : 'bg-transparent'}`} />
                <span>{item.label}</span>
                {typeof count === 'number' && count > 0 && (
                  <span className="border border-app-border px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-app-action">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  </aside>
);

const MetricStrip: React.FC<{ counts: AdminCounts }> = ({ counts }) => (
  <section className="grid border-b border-app-border sm:grid-cols-4">
    <Metric label="Pending requests" value={counts.pendingRequests} />
    <Metric label="Loaded users" value={counts.loadedUsers} />
    <Metric label="Paid subscribers" value={counts.paidSubscribers} />
    <Metric label="Restricted users" value={counts.suspendedUsers} />
  </section>
);

const Metric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="border-b border-r border-app-border px-4 py-4 last:border-r-0 sm:border-b-0">
    <div className="flex items-center gap-1.5">
      <p className="mono-label text-app-muted">{label}</p>
      <HelperTip label={metricHelperCopy(label)} side="bottom" />
    </div>
    <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-app-heading">{value}</p>
  </div>
);

const AdminNoticeStrip: React.FC<{ counts: AdminCounts; onGoToSection: (section: AdminSection) => void }> = ({
  counts,
  onGoToSection,
}) => (
  <section className="grid border-b border-app-border xl:grid-cols-3">
    <AdminNotice
      label="Access queue"
      value={counts.pendingRequests}
      copy="Credential requests waiting for manual review."
      action="Review"
      onAction={() => onGoToSection('requests')}
    />
    <AdminNotice
      label="Subscriber base"
      value={counts.paidSubscribers}
      copy="Paid accounts visible in the loaded user page."
      action="Billing"
      onAction={() => onGoToSection('billing')}
    />
    <AdminNotice
      label="Restricted accounts"
      value={counts.suspendedUsers}
      copy="Suspended or rejected users that may need follow-up."
      action="Inspect"
      onAction={() => onGoToSection('users')}
    />
  </section>
);

const AdminNotice: React.FC<{
  label: string;
  value: number;
  copy: string;
  action: string;
  onAction: () => void;
}> = ({ label, value, copy, action, onAction }) => (
  <article className="border-b border-r border-app-border px-5 py-4 last:border-r-0 xl:border-b-0">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="mono-label text-app-muted">{label}</p>
        <p className="mt-2 text-sm leading-6 text-app-muted">{copy}</p>
      </div>
      <span
        className={`border px-2 py-1 font-mono text-[11px] tabular-nums ${
          value > 0 ? 'border-app-action text-app-action' : 'border-app-border text-app-muted'
        }`}
      >
        {value}
      </span>
    </div>
    <button
      type="button"
      onClick={onAction}
      className="mt-4 font-mono text-[11px] uppercase tracking-wider text-app-action hover:underline"
    >
      {action}
    </button>
  </article>
);

const AnalyticsPanel: React.FC<{
  widgets: AnalyticsWidgetConfig[];
  requests: BackendCredentialRequestDTO[];
  users: BackendUserDTO[];
  ads: BackendAdCampaignDTO[];
  onAddWidget: () => void;
  onResetWidgets: () => void;
  onUpdateWidget: (id: string, patch: Partial<AnalyticsWidgetConfig>) => void;
  onRemoveWidget: (id: string) => void;
}> = ({ widgets, requests, users, ads, onAddWidget, onResetWidgets, onUpdateWidget, onRemoveWidget }) => (
  <section>
    <div className="flex flex-col gap-3 border-b border-app-border px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-app-heading">Custom analytics</h2>
          <HelperTip
            label="Widgets are configurable views over the records currently loaded into this admin screen. They are not yet full historical backend analytics."
            side="right"
          />
        </div>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-app-muted">
          Build the admin view you want by choosing metrics, chart types, and ranges. These widgets use loaded admin
          records until dedicated backend metrics are added.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onResetWidgets}
          className="h-9 border border-app-border px-3 font-mono text-[11px] uppercase tracking-wider text-app-muted hover:border-app-action hover:text-app-action"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onAddWidget}
          className="h-9 border border-app-action bg-app-action px-3 font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover"
        >
          Add widget
        </button>
      </div>
    </div>

    {widgets.length === 0 ? (
      <div className="px-5 py-10">
        <EmptyLine text="No analytics widgets. Add one to start building a view." />
      </div>
    ) : (
      <div className="grid xl:grid-cols-2">
        {widgets.map((widget) => (
          <AnalyticsWidget
            key={widget.id}
            widget={widget}
            requests={requests}
            users={users}
            ads={ads}
            onUpdate={(patch) => onUpdateWidget(widget.id, patch)}
            onRemove={() => onRemoveWidget(widget.id)}
          />
        ))}
      </div>
    )}
  </section>
);

const AnalyticsWidget: React.FC<{
  widget: AnalyticsWidgetConfig;
  requests: BackendCredentialRequestDTO[];
  users: BackendUserDTO[];
  ads: BackendAdCampaignDTO[];
  onUpdate: (patch: Partial<AnalyticsWidgetConfig>) => void;
  onRemove: () => void;
}> = ({ widget, requests, users, ads, onUpdate, onRemove }) => {
  const series = buildAnalyticsSeries(widget, requests, users, ads);
  const breakdown = buildAnalyticsBreakdown(widget, requests, users, ads);
  const total = buildAnalyticsTotal(widget, requests, users, ads);

  return (
    <article className="border-b border-r border-app-border px-5 py-5">
      <div className="mb-4 grid gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <input
              aria-label="Widget title"
              value={widget.title}
              onChange={(event) => onUpdate({ title: event.target.value })}
              className="w-full bg-transparent text-base font-semibold text-app-heading outline-none focus:text-app-action"
            />
            <p className="mt-1 text-sm leading-6 text-app-muted">{metricDescription(widget.metric)}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="font-mono text-[11px] uppercase tracking-wider text-app-muted hover:text-app-action"
          >
            Remove
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <WidgetSelect
            label="Metric"
            helper="Choose which loaded backend records this widget should count."
            value={widget.metric}
            onChange={(value) => onUpdate({ metric: value as AnalyticsMetric })}
          >
            {ANALYTICS_METRICS.map((metric) => (
              <option key={metric.value} value={metric.value}>
                {metric.label}
              </option>
            ))}
          </WidgetSelect>
          <WidgetSelect
            label="View"
            helper="Switch the same data between time charts, segment charts, a KPI number, or a table."
            value={widget.chartType}
            onChange={(value) => onUpdate({ chartType: value as AnalyticsChartType })}
          >
            {ANALYTICS_CHART_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatChartLabel(type)}
              </option>
            ))}
          </WidgetSelect>
          <WidgetSelect
            label="Range"
            helper="Date range only affects area, line, and bar charts. Donut, KPI, and table views show current loaded state."
            value={widget.range}
            onChange={(value) => onUpdate({ range: value as AnalyticsRange })}
          >
            {ANALYTICS_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </WidgetSelect>
        </div>
        {['donut', 'kpi', 'table'].includes(widget.chartType) && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-app-muted">
            Current-state view: counts all loaded records. Range applies to area, line, and bar time charts.
          </p>
        )}
      </div>
      <AnalyticsWidgetBody
        widget={widget}
        series={series}
        breakdown={breakdown}
        total={total}
        currentStateView={['donut', 'kpi', 'table'].includes(widget.chartType)}
      />
    </article>
  );
};

const WidgetSelect: React.FC<{
  label: string;
  helper?: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}> = ({ label, helper, value, onChange, children }) => (
  <div className="grid gap-1">
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-app-muted">
      {label}
      {helper && <HelperTip label={helper} side="top" />}
    </span>
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 border border-app-border bg-app-bg px-2 font-mono text-[11px] uppercase tracking-wider text-app-heading outline-none focus:border-app-action"
    >
      {children}
    </select>
  </div>
);

const AnalyticsWidgetBody: React.FC<{
  widget: AnalyticsWidgetConfig;
  series: Array<{ label: string; value: number }>;
  breakdown: Array<{ label: string; value: number }>;
  total: number;
  currentStateView: boolean;
}> = ({ widget, series, breakdown, total, currentStateView }) => {
  if (widget.chartType === 'kpi') {
    return (
      <div className="grid min-h-56 place-items-center border border-app-border">
        <div className="text-center">
          <p className="font-mono text-5xl font-semibold tabular-nums text-app-heading">{total}</p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-app-muted">
            {metricLabel(widget.metric)}
          </p>
          <p className="mt-2 max-w-56 text-sm leading-6 text-app-muted">
            {currentStateView ? 'Current loaded records.' : 'Dated records in selected range.'}
          </p>
        </div>
      </div>
    );
  }

  if (widget.chartType === 'table') {
    return (
      <AnalyticsTable
        rows={breakdown.length > 0 ? breakdown : series}
        label={breakdown.length > 0 ? 'Segment' : 'Date'}
      />
    );
  }

  if (widget.chartType === 'donut') {
    return breakdown.length === 0 ? (
      <div className="min-h-56 border border-app-border p-4">
        <EmptyLine text="No records in this range." />
      </div>
    ) : (
      <div className="grid min-h-56 grid-cols-[minmax(0,1fr)_10rem] items-center gap-4">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={breakdown} dataKey="value" nameKey="label" innerRadius={54} outerRadius={82} paddingAngle={2}>
              {breakdown.map((entry, index) => (
                <Cell key={entry.label} fill={chartPalette[index % chartPalette.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <ChartLegend data={breakdown} />
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="min-h-56 border border-app-border p-4">
        <EmptyLine text="No dated records in this range." />
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        {widget.chartType === 'bar' ? (
          <BarChart data={series} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-app-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-app-muted)', fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-app-muted)', fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" name={metricLabel(widget.metric)} fill="var(--color-app-action)" radius={0} />
          </BarChart>
        ) : widget.chartType === 'line' ? (
          <LineChart data={series} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-app-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-app-muted)', fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-app-muted)', fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              name={metricLabel(widget.metric)}
              stroke="var(--color-app-action)"
              strokeWidth={2}
            />
          </LineChart>
        ) : (
          <AreaChart data={series} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-app-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-app-muted)', fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-app-muted)', fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              name={metricLabel(widget.metric)}
              stroke="var(--color-app-action)"
              fill="var(--color-brand-red-faint)"
              strokeWidth={2}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const AnalyticsTable: React.FC<{ rows: Array<{ label: string; value: number }>; label: string }> = ({
  rows,
  label,
}) => (
  <div className="max-h-64 overflow-y-auto border border-app-border">
    {rows.length === 0 ? (
      <div className="p-4">
        <EmptyLine text="No rows in this range." />
      </div>
    ) : (
      <table className="w-full text-left">
        <thead className="border-b border-app-border font-mono text-[10px] uppercase tracking-wider text-app-muted">
          <tr>
            <th className="px-3 py-2">{label}</th>
            <th className="px-3 py-2 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-app-border last:border-b-0">
              <td className="px-3 py-2 font-mono text-[12px] text-app-muted">{row.label}</td>
              <td className="px-3 py-2 text-right font-mono text-[12px] tabular-nums text-app-heading">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const OverviewPanel: React.FC<{
  requests: BackendCredentialRequestDTO[];
  users: BackendUserDTO[];
  isLoading: boolean;
  onOpenRequest: (request: BackendCredentialRequestDTO) => void;
  onOpenUser: (account: BackendUserDTO) => void;
  onGoToSection: (section: AdminSection) => void;
}> = ({ requests, users, isLoading, onOpenRequest, onOpenUser, onGoToSection }) => {
  const priorityRequests = requests.filter((request) => request.status === 'PENDING').slice(0, 5);
  const priorityUsers = users
    .filter((account) => ['PENDING', 'SUSPENDED', 'REJECTED'].includes(account.status || ''))
    .slice(0, 5);

  return (
    <>
      <AdminCharts requests={requests} users={users} />
      <div className="grid border-b border-app-border xl:grid-cols-2">
        <QueuePanel title="Credential queue" action="Open requests" onAction={() => onGoToSection('requests')}>
          {isLoading ? (
            <LoadingLine label="Loading requests" />
          ) : priorityRequests.length === 0 ? (
            <EmptyLine text="No pending credential requests." />
          ) : (
            priorityRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => onOpenRequest(request)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-app-border py-3 text-left last:border-b-0"
              >
                <span>
                  <span className="block truncate text-sm font-semibold text-app-heading">{request.name}</span>
                  <span className="mt-1 block truncate font-mono text-[11px] text-app-muted">{request.email}</span>
                </span>
                <StatusBadge status={request.status} />
              </button>
            ))
          )}
        </QueuePanel>
        <QueuePanel title="Account exceptions" action="Open users" onAction={() => onGoToSection('users')}>
          {isLoading ? (
            <LoadingLine label="Loading users" />
          ) : priorityUsers.length === 0 ? (
            <EmptyLine text="No restricted or pending users in the loaded page." />
          ) : (
            priorityUsers.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => onOpenUser(account)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-app-border py-3 text-left last:border-b-0"
              >
                <span>
                  <span className="block truncate text-sm font-semibold text-app-heading">{account.name}</span>
                  <span className="mt-1 block truncate font-mono text-[11px] text-app-muted">{account.email}</span>
                </span>
                <StatusBadge status={account.status} />
              </button>
            ))
          )}
        </QueuePanel>
      </div>
    </>
  );
};

const AdminCharts: React.FC<{
  requests: BackendCredentialRequestDTO[];
  users: BackendUserDTO[];
}> = ({ requests, users }) => {
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('users');
  const trendData = buildTrendData(requests, users);
  const requestData = REQUEST_STATUSES.map((status) => ({
    label: formatChartLabel(status),
    value: requests.filter((request) => request.status === status).length,
  }));
  const userStatusData = USER_STATUSES.map((status) => ({
    label: formatChartLabel(status),
    value: users.filter((account) => account.status === status).length,
  }));
  const subscriptionData = ['FREE', 'READER_PLUS', 'BACKER', 'NEWSROOM_PRO'].map((plan) => ({
    label: formatChartLabel(plan),
    value: users.filter((account) => (account.subscriptionPlan || 'FREE') === plan).length,
  }));

  return (
    <section className="grid border-b border-app-border xl:grid-cols-4">
      <TrendChartPanel data={trendData} metric={trendMetric} onMetricChange={setTrendMetric} />
      <DonutChartPanel title="Subscriptions" data={subscriptionData} />
      <BarChartPanel title="Credential funnel" data={requestData} />
      <BarChartPanel title="User status" data={userStatusData} />
    </section>
  );
};

const ChartShell: React.FC<{
  title: string;
  helper?: string;
  total?: number;
  className?: string;
  children: React.ReactNode;
}> = ({ title, helper, total, className = '', children }) => (
  <section className={`border-b border-r border-app-border px-5 py-5 last:border-r-0 xl:border-b-0 ${className}`}>
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <h2 className="mono-label text-app-muted">{title}</h2>
        {helper && <HelperTip label={helper} side="bottom" />}
      </div>
      {typeof total === 'number' && <span className="font-mono text-[11px] tabular-nums text-app-muted">{total}</span>}
    </div>
    {children}
  </section>
);

const TrendChartPanel: React.FC<{
  data: Array<{ label: string; requests: number; users: number; combined: number }>;
  metric: TrendMetric;
  onMetricChange: (metric: TrendMetric) => void;
}> = ({ data, metric, onMetricChange }) => {
  const selectedMetric = TREND_METRICS.find((item) => item.value === metric) || TREND_METRICS[0];
  const total = data.reduce((sum, item) => sum + item[metric], 0);

  return (
    <ChartShell
      title={selectedMetric.label}
      helper={selectedMetric.description}
      className="xl:col-span-2"
      total={total}
    >
      <div className="mb-4 grid gap-3 border-b border-app-border pb-4">
        <p className="text-sm leading-6 text-app-muted">{selectedMetric.description}</p>
        <div className="flex flex-wrap gap-2">
          {TREND_METRICS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onMetricChange(item.value)}
              className={`h-8 border px-3 font-mono text-[10px] uppercase tracking-wider ${
                metric === item.value
                  ? 'border-app-action bg-app-action text-app-on-action'
                  : 'border-app-border text-app-muted hover:border-app-action hover:text-app-action'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-56">
        {data.length === 0 ? (
          <EmptyLine text="No dated records in the loaded admin page." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-app-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--color-app-muted)', fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--color-app-muted)', fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey={metric}
                name={selectedMetric.label}
                stroke="var(--color-app-action)"
                fill="var(--color-brand-red-faint)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartShell>
  );
};

const DonutChartPanel: React.FC<{ title: string; data: Array<{ label: string; value: number }> }> = ({
  title,
  data,
}) => (
  <ChartShell
    title={title}
    helper="Breaks loaded users into subscription plans. This shows the current loaded page, not lifetime revenue."
    total={data.reduce((sum, item) => sum + item.value, 0)}
  >
    <div className="grid min-h-64 grid-rows-[1fr_auto] gap-4">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={48} outerRadius={74} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={chartPalette[index % chartPalette.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <ChartLegend data={data} />
    </div>
  </ChartShell>
);

const BarChartPanel: React.FC<{ title: string; data: Array<{ label: string; value: number }> }> = ({ title, data }) => (
  <ChartShell
    title={title}
    helper={
      title === 'Credential funnel'
        ? 'Counts credential requests by review status in the loaded request page.'
        : 'Counts users by account status in the loaded user page.'
    }
    total={data.reduce((sum, item) => sum + item.value, 0)}
  >
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 24, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-app-border)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-app-muted)', fontSize: 10 }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" fill="var(--color-app-action)" radius={0} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartShell>
);

const ChartLegend: React.FC<{ data: Array<{ label: string; value: number }> }> = ({ data }) => (
  <div className="grid gap-2">
    {data.map((item, index) => (
      <div key={item.label} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <span className="h-2 w-2" style={{ background: chartPalette[index % chartPalette.length] }} />
        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-app-muted">{item.label}</span>
        <span className="font-mono text-[11px] tabular-nums text-app-heading">{item.value}</span>
      </div>
    ))}
  </div>
);

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="border border-app-border bg-app-bg px-3 py-2 shadow-[var(--shadow-modal)]">
      {label && <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-app-muted">{label}</p>}
      {payload.map((item) => (
        <p key={`${item.name}-${item.value}`} className="font-mono text-[11px] text-app-heading">
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
};

const QueuePanel: React.FC<{
  title: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}> = ({ title, action, onAction, children }) => (
  <section className="border-r border-app-border px-5 py-5 last:border-r-0">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="mono-label text-app-muted">{title}</h2>
      <button
        type="button"
        onClick={onAction}
        className="font-mono text-[11px] uppercase tracking-wider text-app-action"
      >
        {action}
      </button>
    </div>
    <div>{children}</div>
  </section>
);

const RequestToolbar: React.FC<{
  requestStatus: string;
  onStatusChange: (status: string) => void;
}> = ({ requestStatus, onStatusChange }) => (
  <div className="flex flex-col gap-3 border-b border-app-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-app-heading">Credential requests</h2>
        <HelperTip label="Credential requests are separate review records. Approving one can activate or grant access to the related user account." />
      </div>
      <p className="mt-1 text-sm text-app-muted">Approve, reject, and inspect access requests.</p>
    </div>
    <div className="flex flex-wrap gap-3">
      {['', ...REQUEST_STATUSES].map((status) => (
        <button
          key={status || 'ALL'}
          type="button"
          onClick={() => onStatusChange(status)}
          className={`min-h-9 border-b-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${
            requestStatus === status
              ? 'border-app-action text-app-action'
              : 'border-transparent text-app-muted hover:text-app-heading'
          }`}
        >
          {status || 'All'}
        </button>
      ))}
    </div>
  </div>
);

const UserToolbar: React.FC<{
  search: string;
  userStatus: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSubmit: () => void;
}> = ({ search, userStatus, onSearchChange, onStatusChange, onSubmit }) => (
  <div className="flex flex-col gap-3 border-b border-app-border px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-app-heading">Users</h2>
        <HelperTip label="User status controls what the account can do. Pending/rejected/suspended users can read, but active-account actions are blocked by the backend." />
      </div>
      <p className="mt-1 text-sm text-app-muted">Search, suspend, activate, and change roles.</p>
    </div>
    <div className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="admin-user-search" className="sr-only">
        Search users
      </label>
      <SearchInput
        id="admin-user-search"
        size="sm"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onClear={() => onSearchChange('')}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit();
        }}
        placeholder="Search users"
        containerClassName="sm:w-64"
      />
      <select
        aria-label="Filter users by status"
        value={userStatus}
        onChange={(event) => onStatusChange(event.target.value)}
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
        onClick={onSubmit}
        className="inline-flex min-h-10 items-center justify-center border border-app-action bg-app-action px-4 font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover"
      >
        Search
      </button>
    </div>
  </div>
);

const AdToolbar: React.FC<{
  adStatus: string;
  onStatusChange: (status: string) => void;
}> = ({ adStatus, onStatusChange }) => (
  <div className="flex flex-col gap-3 border-b border-app-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-app-heading">Ad proposals</h2>
        <HelperTip label="Partners draft and submit campaigns here. Admin approval moves acceptable proposals forward; rejection should include a review note." />
      </div>
      <p className="mt-1 text-sm text-app-muted">Review partner-submitted sponsored placements before they go live.</p>
    </div>
    <div className="flex flex-wrap gap-3">
      {['', ...AD_STATUSES].map((status) => (
        <button
          key={status || 'ALL'}
          type="button"
          onClick={() => onStatusChange(status)}
          className={`min-h-9 border-b-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${
            adStatus === status
              ? 'border-app-action text-app-action'
              : 'border-transparent text-app-muted hover:text-app-heading'
          }`}
        >
          {status ? formatChartLabel(status) : 'All'}
        </button>
      ))}
    </div>
  </div>
);

const AdminDataTable = <TData,>({
  data,
  columns,
  isLoading,
  emptyText,
  exportName,
  onSelectionChange,
}: {
  data: TData[];
  columns: ColumnDef<TData>[];
  isLoading: boolean;
  emptyText: string;
  exportName: string;
  onSelectionChange?: (selected: TData[]) => void;
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  // TanStack Table intentionally returns imperative table functions; React Compiler flags it as non-memoizable.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, columnVisibility },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const exportRows = selectedRows.length > 0 ? selectedRows : table.getSortedRowModel().rows.map((row) => row.original);

  useEffect(() => { onSelectionChange?.(selectedRows); }, [selectedRows, onSelectionChange]);
  const visibleColumns = table
    .getAllLeafColumns()
    .filter((column) => column.id !== 'select' && column.id !== 'actions' && column.getCanHide());

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-app-border px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="font-mono text-[11px] uppercase tracking-wider text-app-muted">
          {selectedRows.length > 0 ? `${selectedRows.length} selected` : `${data.length} rows loaded`}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={exportRows.length === 0}
            onClick={() => exportCsv(exportName, exportRows)}
            className="h-9 border border-app-border px-3 font-mono text-[11px] uppercase tracking-wider text-app-heading hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
          >
            Export {selectedRows.length > 0 ? 'selected' : 'view'}
          </button>
          <HelperTip
            label="Export uses selected rows when rows are checked. If nothing is selected, it exports the current sorted table view."
            side="left"
          />
          <div className="flex flex-wrap border border-app-border">
            {visibleColumns.map((column) => (
              <label
                key={column.id}
                className="inline-flex h-9 items-center gap-2 border-r border-app-border px-3 font-mono text-[10px] uppercase tracking-wider text-app-muted last:border-r-0"
              >
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                  className="h-3.5 w-3.5 accent-[var(--color-app-action)]"
                />
                {column.id}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="border-b-2 border-app-heading font-mono text-[11px] uppercase tracking-wider text-app-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="h-9 px-4">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                        className="text-left hover:text-app-heading disabled:hover:text-app-muted"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && ' ↑'}
                        {header.column.getIsSorted() === 'desc' && ' ↓'}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className="px-4 py-6">
                  <LoadingLine label="Loading table" />
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className="px-4 py-6">
                  <EmptyLine text={emptyText} />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-app-border align-middle hover:bg-app-surface">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-app-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-app-muted">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-9 border border-app-border px-3 font-mono text-[11px] uppercase tracking-wider text-app-muted hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-9 border border-app-border px-3 font-mono text-[11px] uppercase tracking-wider text-app-muted hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminInspector: React.FC<{
  inspector: InspectorState;
  isMutating: boolean;
  rejectionReason: string;
  editForm: Record<string, Partial<BackendCategoryDTO> | Partial<BackendTagDTO> | Partial<BackendAuthorDTO> | undefined>;
  onRejectionReasonChange: (value: string) => void;
  onEditFormChange: (form: Record<string, Partial<BackendCategoryDTO> | Partial<BackendTagDTO> | Partial<BackendAuthorDTO> | undefined>) => void;
  onClose: () => void;
  onApprove: (request: BackendCredentialRequestDTO) => void;
  onReject: (request: BackendCredentialRequestDTO) => void;
  onUpdateUserStatus: (account: BackendUserDTO, status: string) => void;
  onUpdateUserRole: (account: BackendUserDTO, role: string) => void;
  onApproveAd: (campaign: BackendAdCampaignDTO) => void;
  onRejectAd: (campaign: BackendAdCampaignDTO) => void;
  onDeleteUser: (account: BackendUserDTO) => void;
  onSaveCategory: () => void;
  onDeleteCategory: (id: number) => void;
  onSaveTag: () => void;
  onDeleteTag: (id: number) => void;
  onSaveAuthor: () => void;
  onDeleteAuthor: (id: number) => void;
}> = ({
  inspector,
  isMutating,
  rejectionReason,
  editForm,
  onRejectionReasonChange,
  onEditFormChange,
  onClose,
  onApprove,
  onReject,
  onUpdateUserStatus,
  onUpdateUserRole,
  onApproveAd,
  onRejectAd,
  onDeleteUser,
  onSaveCategory,
  onDeleteCategory,
  onSaveTag,
  onDeleteTag,
  onSaveAuthor,
  onDeleteAuthor,
}) => {
  const typeLabel = !inspector ? 'No row selected'
    : inspector.type === 'request' ? 'Credential request'
    : inspector.type === 'ad' ? 'Ad proposal'
    : inspector.type === 'category' ? 'Category'
    : inspector.type === 'tag' ? 'Tag'
    : inspector.type === 'author' ? 'Author'
    : 'User account';

  return (
  <aside className="xl:sticky xl:top-14 xl:h-[calc(100dvh-3.5rem)] xl:overflow-y-auto border-t border-app-border bg-app-bg xl:border-l xl:border-t-0">
    <div className="flex items-center justify-between gap-3 border-b border-app-border px-5 py-4">
      <div>
        <p className="mono-label text-app-muted">Inspector</p>
        <p className="mt-1 text-sm font-semibold text-app-heading">{typeLabel}</p>
      </div>
      {inspector && (
        <button type="button" onClick={onClose} className="font-mono text-[18px] text-app-muted hover:text-app-action">
          x
        </button>
      )}
    </div>

    {!inspector ? (
      <div className="px-5 py-6">
        <EmptyLine text="Select a row to inspect details and run actions." />
      </div>
    ) : inspector.type === 'request' ? (
      <RequestInspector
        request={inspector.data}
        isMutating={isMutating}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={onRejectionReasonChange}
        onApprove={onApprove}
        onReject={onReject}
      />
    ) : inspector.type === 'ad' ? (
      <AdInspector
        campaign={inspector.data}
        isMutating={isMutating}
        reviewNote={rejectionReason}
        onReviewNoteChange={onRejectionReasonChange}
        onApprove={onApproveAd}
        onReject={onRejectAd}
      />
    ) : inspector.type === 'category' ? (
      <CategoryInspector
        category={inspector.data}
        isMutating={isMutating}
        form={editForm.category as Partial<BackendCategoryDTO> | undefined}
        onFormChange={(patch) => onEditFormChange({ ...editForm, category: { ...editForm.category, ...patch } as Partial<BackendCategoryDTO> })}
        onSave={onSaveCategory}
        onDelete={inspector.data.id ? () => onDeleteCategory(inspector.data!.id) : undefined}
      />
    ) : inspector.type === 'tag' ? (
      <TagInspector
        tag={inspector.data}
        isMutating={isMutating}
        form={editForm.tag as Partial<BackendTagDTO> | undefined}
        onFormChange={(patch) => onEditFormChange({ ...editForm, tag: { ...editForm.tag, ...patch } as Partial<BackendTagDTO> })}
        onSave={onSaveTag}
        onDelete={inspector.data.id ? () => onDeleteTag(inspector.data!.id) : undefined}
      />
    ) : inspector.type === 'author' ? (
      <AuthorInspector
        author={inspector.data}
        isMutating={isMutating}
        form={editForm.author as Partial<BackendAuthorDTO> | undefined}
        onFormChange={(patch) => onEditFormChange({ ...editForm, author: { ...editForm.author, ...patch } as Partial<BackendAuthorDTO> })}
        onSave={onSaveAuthor}
        onDelete={inspector.data.id ? () => onDeleteAuthor(inspector.data!.id) : undefined}
      />
    ) : (
      <UserInspector
        account={inspector.data}
        isMutating={isMutating}
        onUpdateStatus={onUpdateUserStatus}
        onUpdateRole={onUpdateUserRole}
        onDelete={onDeleteUser}
      />
    )}
  </aside>
  );
};

const RequestInspector: React.FC<{
  request: BackendCredentialRequestDTO;
  isMutating: boolean;
  rejectionReason: string;
  onRejectionReasonChange: (value: string) => void;
  onApprove: (request: BackendCredentialRequestDTO) => void;
  onReject: (request: BackendCredentialRequestDTO) => void;
}> = ({ request, isMutating, rejectionReason, onRejectionReasonChange, onApprove, onReject }) => (
  <div className="px-5 py-5">
    <InspectorField label="Name" value={request.name} />
    <InspectorField label="Email" value={request.email} />
    <InspectorField label="Status" value={<StatusBadge status={request.status} />} />
    <InspectorField
      label="Requested"
      value={request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Unknown'}
    />
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Focus</p>
      <p className="mt-2 text-sm leading-6 text-app-text">
        {request.reportingFocus || request.rejectionReason || 'No reporting focus supplied.'}
      </p>
    </div>
    <div className="py-4">
      <label htmlFor={`reject-${request.id}`} className="mono-label text-app-muted">
        Rejection reason
      </label>
      <textarea
        id={`reject-${request.id}`}
        value={rejectionReason}
        onChange={(event) => onRejectionReasonChange(event.target.value)}
        className="mt-2 min-h-24 w-full resize-y border border-app-border bg-app-bg p-3 text-sm text-app-text outline-none focus:border-app-action focus:shadow-[var(--shadow-focus)]"
        placeholder="Short note for the request log"
      />
    </div>
    <div className="grid gap-2 border-t border-app-border pt-4">
      <button
        type="button"
        disabled={isMutating || request.status !== 'PENDING'}
        onClick={() => onApprove(request)}
        className="h-10 border border-app-action bg-app-action font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover disabled:cursor-not-allowed disabled:opacity-45"
      >
        Approve request
      </button>
      <button
        type="button"
        disabled={isMutating || request.status !== 'PENDING'}
        onClick={() => onReject(request)}
        className="h-10 border border-app-border font-mono text-[11px] uppercase tracking-wider text-app-muted hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
      >
        Reject request
      </button>
    </div>
  </div>
);

const AdInspector: React.FC<{
  campaign: BackendAdCampaignDTO;
  isMutating: boolean;
  reviewNote: string;
  onReviewNoteChange: (value: string) => void;
  onApprove: (campaign: BackendAdCampaignDTO) => void;
  onReject: (campaign: BackendAdCampaignDTO) => void;
}> = ({ campaign, isMutating, reviewNote, onReviewNoteChange, onApprove, onReject }) => (
  <div className="px-5 py-5">
    <InspectorField label="Brand" value={campaign.brandName} />
    <InspectorField label="Headline" value={campaign.headline} />
    <InspectorField label="Status" value={<StatusBadge status={campaign.status} />} />
    <InspectorField
      label="Partner"
      value={`${campaign.partnerName || 'Partner'} · ${campaign.partnerEmail || 'No email'}`}
    />
    <InspectorField label="Landing URL" value={campaign.landingUrl} />
    <InspectorField label="Placement" value={campaign.placement || 'Unassigned'} />
    <InspectorField label="Targeting" value={campaign.targetAudience || 'General audience'} />
    <InspectorField label="Schedule" value={`${formatDate(campaign.startsAt)} -> ${formatDate(campaign.endsAt)}`} />
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Ad copy</p>
      <p className="mt-2 text-sm leading-6 text-app-text">{campaign.body}</p>
    </div>
    {campaign.imageUrl && (
      <div className="border-b border-app-border py-4">
        <p className="mono-label text-app-muted">Creative</p>
        <img
          src={campaign.imageUrl}
          alt=""
          className="mt-3 aspect-video w-full border border-app-border object-cover"
        />
      </div>
    )}
    <div className="py-4">
      <label htmlFor={`ad-review-${campaign.id}`} className="mono-label text-app-muted">
        Review note
      </label>
      <textarea
        id={`ad-review-${campaign.id}`}
        value={reviewNote}
        onChange={(event) => onReviewNoteChange(event.target.value)}
        className="mt-2 min-h-24 w-full resize-y border border-app-border bg-app-bg p-3 text-sm text-app-text outline-none focus:border-app-action focus:shadow-[var(--shadow-focus)]"
        placeholder="Decision note for the partner"
      />
    </div>
    <div className="grid gap-2 border-t border-app-border pt-4">
      <button
        type="button"
        disabled={isMutating || !['SUBMITTED', 'NEEDS_CHANGES'].includes(campaign.status)}
        onClick={() => onApprove(campaign)}
        className="h-10 border border-app-action bg-app-action font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover disabled:cursor-not-allowed disabled:opacity-45"
      >
        Approve ad
      </button>
      <button
        type="button"
        disabled={isMutating || !['SUBMITTED', 'NEEDS_CHANGES'].includes(campaign.status)}
        onClick={() => onReject(campaign)}
        className="h-10 border border-app-border font-mono text-[11px] uppercase tracking-wider text-app-muted hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
      >
        Reject ad
      </button>
    </div>
  </div>
);

const UserInspector: React.FC<{
  account: BackendUserDTO;
  isMutating: boolean;
  onUpdateStatus: (account: BackendUserDTO, status: string) => void;
  onUpdateRole: (account: BackendUserDTO, role: string) => void;
  onDelete?: (account: BackendUserDTO) => void;
}> = ({ account: initialAccount, isMutating, onUpdateStatus, onUpdateRole, onDelete }) => {
  const [detailedAccount, setDetailedAccount] = useState<BackendUserDTO>(initialAccount);

  useEffect(() => {
    let isMounted = true;
    backendApi.getAdminUser(initialAccount.id).then((user) => {
      if (isMounted) setDetailedAccount(user);
    }).catch(() => undefined);
    return () => { isMounted = false; };
  }, [initialAccount.id]);

  const account = detailedAccount;

  return (
    <div className="px-5 py-5">
      <InspectorField label="Name" value={account.name} />
      <InspectorField label="Email" value={account.email} />
      {account.profileHeadline && <InspectorField label="Headline" value={account.profileHeadline} />}
      {account.profileBio && <InspectorField label="Bio" value={account.profileBio} />}
      <InspectorField label="Status" value={<StatusBadge status={account.status} />} />
      <InspectorField label="Role" value={account.role || 'USER'} />
      {account.profileTags && account.profileTags.length > 0 && (
        <InspectorField label="Tags" value={account.profileTags.join(', ')} />
      )}
      {account.unlockedBadges && account.unlockedBadges.length > 0 && (
        <InspectorField label="Badges" value={`${account.unlockedBadges.join(', ')}${account.selectedBadge ? ` (selected: ${account.selectedBadge})` : ''}`} />
      )}
      <InspectorField
        label="Subscription"
        value={`${account.subscriptionPlan || 'FREE'} · ${account.billingCadence || 'MONTHLY'}`}
      />
      <InspectorField label="Billing status" value={account.subscriptionStatus || 'ACTIVE'} />
      {account.entitlements && account.entitlements.length > 0 && (
        <InspectorField label="Entitlements" value={account.entitlements.join(', ')} />
      )}
      <InspectorField label="Joined" value={formatDate(account.createdAt)} />
      <div className="grid gap-4 border-t border-app-border pt-4">
        <label className="grid gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="mono-label text-app-muted">Set status</span>
            <HelperTip label="ACTIVE can use interactive features. PENDING, SUSPENDED, and REJECTED are blocked from backend mutations." />
          </span>
          <select
            value={account.status || 'ACTIVE'}
            disabled={isMutating}
            onChange={(event) => onUpdateStatus(account, event.target.value)}
            className="h-10 border border-app-border bg-app-bg px-3 font-mono text-[11px] uppercase tracking-wider text-app-heading outline-none focus:border-app-action"
          >
            {USER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="mono-label text-app-muted">Set role</span>
            <HelperTip label="Role controls authorization level. Status still gates whether the account can perform write actions." />
          </span>
          <select
            value={account.role || 'USER'}
            disabled={isMutating}
            onChange={(event) => onUpdateRole(account, event.target.value)}
            className="h-10 border border-app-border bg-app-bg px-3 font-mono text-[11px] uppercase tracking-wider text-app-heading outline-none focus:border-app-action"
          >
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={isMutating}
          onClick={() => onDelete?.(account)}
          className="h-10 border border-app-border font-mono text-[11px] uppercase tracking-wider text-app-muted hover:border-red-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Delete user
        </button>
      </div>
    </div>
  );
};

const CategoryInspector: React.FC<{
  category: BackendCategoryDTO;
  isMutating: boolean;
  form?: Partial<BackendCategoryDTO>;
  onFormChange: (patch: Partial<BackendCategoryDTO>) => void;
  onSave: () => void;
  onDelete?: () => void;
}> = ({ category, isMutating, form, onFormChange, onSave, onDelete }) => (
  <div className="px-5 py-5">
    <InspectorField label="ID" value={category.id || 'New'} />
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Name</p>
      <input
        value={form?.name ?? category.name ?? ''}
        onChange={(e) => onFormChange({ name: e.target.value })}
        className="mt-2 w-full border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Slug</p>
      <input
        value={form?.slug ?? category.slug ?? ''}
        onChange={(e) => onFormChange({ slug: e.target.value })}
        className="mt-2 w-full border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Description</p>
      <textarea
        value={form?.description ?? category.description ?? ''}
        onChange={(e) => onFormChange({ description: e.target.value })}
        className="mt-2 min-h-20 w-full resize-y border border-app-border bg-app-bg p-3 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    {category.articleCount != null && (
      <InspectorField label="Articles" value={(category.articleCount).toLocaleString()} />
    )}
    <div className="grid gap-2 border-t border-app-border pt-4">
      <button
        type="button"
        disabled={isMutating || !form?.name?.trim()}
        onClick={onSave}
        className="h-10 border border-app-action bg-app-action font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover disabled:cursor-not-allowed disabled:opacity-45"
      >
        {category.id ? 'Update category' : 'Create category'}
      </button>
      {onDelete && (
        <button
          type="button"
          disabled={isMutating}
          onClick={onDelete}
          className="h-10 border border-app-border font-mono text-[11px] uppercase tracking-wider text-app-muted hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
        >
          Delete category
        </button>
      )}
    </div>
  </div>
);

const TagInspector: React.FC<{
  tag: BackendTagDTO;
  isMutating: boolean;
  form?: Partial<BackendTagDTO>;
  onFormChange: (patch: Partial<BackendTagDTO>) => void;
  onSave: () => void;
  onDelete?: () => void;
}> = ({ tag, isMutating, form, onFormChange, onSave, onDelete }) => (
  <div className="px-5 py-5">
    <InspectorField label="ID" value={tag.id || 'New'} />
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Name</p>
      <input
        value={form?.name ?? tag.name ?? ''}
        onChange={(e) => onFormChange({ name: e.target.value })}
        className="mt-2 w-full border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Slug</p>
      <input
        value={form?.slug ?? tag.slug ?? ''}
        onChange={(e) => onFormChange({ slug: e.target.value })}
        className="mt-2 w-full border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    {tag.articleCount != null && (
      <InspectorField label="Articles" value={(tag.articleCount).toLocaleString()} />
    )}
    <div className="grid gap-2 border-t border-app-border pt-4">
      <button
        type="button"
        disabled={isMutating || !form?.name?.trim()}
        onClick={onSave}
        className="h-10 border border-app-action bg-app-action font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover disabled:cursor-not-allowed disabled:opacity-45"
      >
        {tag.id ? 'Update tag' : 'Create tag'}
      </button>
      {onDelete && (
        <button
          type="button"
          disabled={isMutating}
          onClick={onDelete}
          className="h-10 border border-app-border font-mono text-[11px] uppercase tracking-wider text-app-muted hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
        >
          Delete tag
        </button>
      )}
    </div>
  </div>
);

const AuthorInspector: React.FC<{
  author: BackendAuthorDTO;
  isMutating: boolean;
  form?: Partial<BackendAuthorDTO>;
  onFormChange: (patch: Partial<BackendAuthorDTO>) => void;
  onSave: () => void;
  onDelete?: () => void;
}> = ({ author, isMutating, form, onFormChange, onSave, onDelete }) => (
  <div className="px-5 py-5">
    <InspectorField label="ID" value={author.id || 'New'} />
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Name</p>
      <input
        value={form?.name ?? author.name ?? ''}
        onChange={(e) => onFormChange({ name: e.target.value })}
        className="mt-2 w-full border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Slug</p>
      <input
        value={form?.slug ?? author.slug ?? ''}
        onChange={(e) => onFormChange({ slug: e.target.value })}
        className="mt-2 w-full border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Email</p>
      <input
        value={form?.email ?? author.email ?? ''}
        onChange={(e) => onFormChange({ email: e.target.value })}
        className="mt-2 w-full border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Bio</p>
      <textarea
        value={form?.bio ?? author.bio ?? ''}
        onChange={(e) => onFormChange({ bio: e.target.value })}
        className="mt-2 min-h-20 w-full resize-y border border-app-border bg-app-bg p-3 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Avatar URL</p>
      <input
        value={form?.avatarUrl ?? author.avatarUrl ?? ''}
        onChange={(e) => onFormChange({ avatarUrl: e.target.value })}
        className="mt-2 w-full border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Facebook URL</p>
      <input
        value={form?.facebookUrl ?? author.facebookUrl ?? ''}
        onChange={(e) => onFormChange({ facebookUrl: e.target.value })}
        className="mt-2 w-full border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    <div className="border-b border-app-border py-4">
      <p className="mono-label text-app-muted">Twitter URL</p>
      <input
        value={form?.twitterUrl ?? author.twitterUrl ?? ''}
        onChange={(e) => onFormChange({ twitterUrl: e.target.value })}
        className="mt-2 w-full border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-action"
      />
    </div>
    {author.articleCount != null && (
      <InspectorField label="Articles" value={(author.articleCount).toLocaleString()} />
    )}
    <div className="grid gap-2 border-t border-app-border pt-4">
      <button
        type="button"
        disabled={isMutating || !form?.name?.trim()}
        onClick={onSave}
        className="h-10 border border-app-action bg-app-action font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover disabled:cursor-not-allowed disabled:opacity-45"
      >
        {author.id ? 'Update author' : 'Create author'}
      </button>
      {onDelete && (
        <button
          type="button"
          disabled={isMutating}
          onClick={onDelete}
          className="h-10 border border-app-border font-mono text-[11px] uppercase tracking-wider text-app-muted hover:border-app-action hover:text-app-action disabled:cursor-not-allowed disabled:opacity-45"
        >
          Delete author
        </button>
      )}
    </div>
  </div>
);

const CategoryToolbar: React.FC<{
  search: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
}> = ({ search, onSearchChange, onSubmit }) => (
  <div className="flex items-center gap-3 border-b border-app-border px-5 py-3">
    <SearchInput
      placeholder="Search categories..."
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
    />
    <button
      type="button"
      onClick={onSubmit}
      className="h-9 border border-app-border px-3 font-mono text-[11px] uppercase tracking-wider text-app-heading hover:border-app-action hover:text-app-action"
    >
      Search
    </button>
  </div>
);

const TagToolbar: React.FC<{
  search: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
}> = ({ search, onSearchChange, onSubmit }) => (
  <div className="flex items-center gap-3 border-b border-app-border px-5 py-3">
    <SearchInput
      placeholder="Search tags..."
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
    />
    <button
      type="button"
      onClick={onSubmit}
      className="h-9 border border-app-border px-3 font-mono text-[11px] uppercase tracking-wider text-app-heading hover:border-app-action hover:text-app-action"
    >
      Search
    </button>
  </div>
);

const AuthorToolbar: React.FC<{
  search: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
}> = ({ search, onSearchChange, onSubmit }) => (
  <div className="flex items-center gap-3 border-b border-app-border px-5 py-3">
    <SearchInput
      placeholder="Search authors..."
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
    />
    <button
      type="button"
      onClick={onSubmit}
      className="h-9 border border-app-border px-3 font-mono text-[11px] uppercase tracking-wider text-app-heading hover:border-app-action hover:text-app-action"
    >
      Search
    </button>
  </div>
);

const BulkActionBar: React.FC<{
  count: number;
  actions: Array<{ label: string; onClick: () => void; variant?: 'action' | 'danger' }>;
  isMutating: boolean;
}> = ({ count, actions, isMutating }) => {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 border-b border-app-border bg-app-surface px-5 py-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-app-muted">{count} selected</span>
      <div className="flex gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={isMutating}
            onClick={action.onClick}
            className={`h-8 px-3 font-mono text-[10px] uppercase tracking-wider ${
              action.variant === 'danger'
                ? 'border border-app-border text-app-muted hover:border-red-500 hover:text-red-500'
                : 'border border-app-action text-app-action hover:bg-app-action hover:text-app-on-action'
            } disabled:cursor-not-allowed disabled:opacity-45`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const InspectorField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="border-b border-app-border py-4">
    <p className="mono-label text-app-muted">{label}</p>
    <div className="mt-2 text-sm font-semibold text-app-heading">{value}</div>
  </div>
);

const PlaceholderPanel: React.FC<{ title: string; copy: string }> = ({ title, copy }) => (
  <section className="px-5 py-10">
    <p className="mono-label text-app-action">Planned surface</p>
    <h2 className="mt-3 text-xl font-semibold text-app-heading">{title}</h2>
    <p className="mt-3 max-w-[62ch] text-sm leading-6 text-app-muted">{copy}</p>
  </section>
);

const LoadingLine: React.FC<{ label: string }> = ({ label }) => (
  <span className="swiss-loading">
    <span>.</span> {label}
  </span>
);

const EmptyLine: React.FC<{ text: string }> = ({ text }) => <p className="text-sm italic text-app-muted">{text}</p>;

const metricHelperCopy = (label: string) => {
  switch (label) {
    case 'Pending requests':
      return 'Credential requests waiting for admin approval or rejection in the loaded request page.';
    case 'Loaded users':
      return 'Users fetched into this dashboard page. This is not necessarily the total database count.';
    case 'Paid subscribers':
      return 'Loaded users whose subscription plan is not free.';
    case 'Restricted users':
      return 'Loaded users marked suspended or rejected. These accounts are blocked from interactive backend actions.';
    default:
      return 'Dashboard count based on the records currently loaded into this admin view.';
  }
};

const sectionTitle = (section: AdminSection) => {
  switch (section) {
    case 'overview':
      return 'Overview';
    case 'analytics':
      return 'Analytics';
    case 'requests':
      return 'Credential Requests';
    case 'users':
      return 'Users';
    case 'ads':
      return 'Ad Proposals';
    case 'billing':
      return 'Billing';
    case 'categories':
      return 'Categories';
    case 'tags':
      return 'Tags';
    case 'authors':
      return 'Authors';
    case 'reports':
      return 'Reports';
    case 'topics':
      return 'Topics';
    case 'audit':
      return 'Audit Log';
  }
};

const sectionGroupLabel = (section: AdminSection) => {
  for (const group of adminNavGroups) {
    if (group.items.some((item) => item.id === section)) {
      return group.label;
    }
  }
  return 'Command';
};

export default AdminScreen;
