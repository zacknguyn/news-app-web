export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const AUTH_TOKEN_KEY = 'portal_token';
const AUTH_USER_KEY = 'portal_agent';

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
};

export type PaginatedResponse<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type BackendUserDTO = {
  id: number;
  name: string;
  email: string;
  role?: string;
  avatar?: string | null;
  bio?: string | null;
  createdAt?: string | null;
  status?: string | null;
  profileHeadline?: string | null;
  profileBio?: string | null;
  profileAccent?: string | null;
  profileTags?: string[] | null;
  unlockedBadges?: string[] | null;
  selectedBadge?: string | null;
  subscriptionPlan?: string | null;
  billingCadence?: string | null;
  subscriptionStatus?: string | null;
  entitlements?: string[] | null;
};

export type BackendTrustFactor = {
  label: string;
  score: number;
  max: number;
};

export type BackendTrustResponse = {
  totalScore: number;
  maxScore: number;
  factors: BackendTrustFactor[];
};

export type BackendSearchResultDTO = {
  entityType: string;
  id: number;
  title: string;
  subtitle: string;
  url: string;
  status: string;
};

export type BackendAuthResponse = {
  token: string;
  type: string;
  user: BackendUserDTO;
};

export type BackendTopicDTO = {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  avatar?: string | null;
  banner?: string | null;
  rules?: string | null;
  ownerId?: number | null;
  ownerName?: string | null;
  memberCount?: number | null;
  postCount?: number | null;
  joined?: boolean | null;
  createdAt?: string | null;
};

export type BackendPostDTO = {
  id: number;
  title: string;
  content: string;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  score: number;
  commentCount?: number | null;
  userVote?: number | null;
  savedByMe?: boolean | null;
  userId: number;
  authorName: string;
  topicId: number;
  topicName: string;
  articleId?: number | null;
  aiSummary?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type BackendCommentDTO = {
  id: number;
  articleId?: number | null;
  postId?: number | null;
  userId: number;
  userName: string;
  userAvatar?: string | null;
  content: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean | null;
  parentId?: number | null;
  replies?: BackendCommentDTO[];
};

export type BackendArticleDTO = {
  id: number;
  title: string;
  subtitle?: string | null;
  content: string;
  aiSummary?: string | null;
  slug: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  readTime?: number | null;
  views?: number | null;
  commentsCount?: number | null;
  isFeatured?: boolean;
  isEditorsPick?: boolean;
  userId?: number | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  categories?: Array<{ id: number; name: string; slug?: string | null }>;
  tags?: Array<{ id: number; name: string; slug?: string | null }>;
};

export type BackendAuthorDTO = {
  id: number;
  name: string;
  slug: string;
  bio?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  articleCount?: number | null;
};

export type BackendCategoryDTO = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  articleCount?: number | null;
};

export type BackendTagDTO = {
  id: number;
  name: string;
  slug: string;
  articleCount?: number | null;
};

export type BackendSavedArticleDTO = {
  id: number;
  article: BackendArticleDTO;
  savedAt: string;
};

export type BackendSavedPostDTO = {
  id: number;
  post: BackendPostDTO;
  savedAt: string;
};

export type BackendStripeCheckoutSessionDTO = {
  sessionId: string;
  url: string;
};

export type BackendStripePortalSessionDTO = {
  url: string;
};

export type BackendCredentialRequestDTO = {
  id: number;
  name: string;
  email: string;
  reportingFocus?: string | null;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  user?: BackendUserDTO | null;
};

export type BackendAdCampaignDTO = {
  id: number;
  partnerId?: number | null;
  partnerName?: string | null;
  partnerEmail?: string | null;
  brandName: string;
  headline: string;
  body: string;
  landingUrl: string;
  imageUrl?: string | null;
  placement?: string | null;
  targetAudience?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  budgetNote?: string | null;
  status: string;
  reviewNote?: string | null;
  reviewedById?: number | null;
  reviewedByName?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type BackendVoteResponseDTO = {
  postId: number;
  score: number;
  userVote: number | null;
};

export type BackendReaderHighlightDTO = {
  id: number;
  postId?: number | null;
  postTitle?: string | null;
  articleId?: number | null;
  articleTitle?: string | null;
  channelName?: string | null;
  text: string;
  startOffset?: number | null;
  endOffset?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type BackendReadingProgressDTO = {
  id: number;
  postId: number;
  title: string;
  articleId?: number | null;
  channelName?: string | null;
  progress: number;
  scrollY: number;
  updatedAt: string;
};

export type BackendMediaDTO = {
  id: number;
  url: string;
  objectKey: string;
  storageProvider: string;
  originalFilename?: string | null;
  contentType: string;
  sizeBytes: number;
  altText?: string | null;
  createdAt: string;
};

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  timeoutMs?: number;
};

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthSession = <TUser>(token: string, user: TUser) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const getStoredUser = <TUser>() => {
  const storedUser = localStorage.getItem(AUTH_USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as TUser;
  } catch {
    clearAuthSession();
    return null;
  }
};

const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { skipAuth, headers, body, timeoutMs = 10000, signal, ...requestOptions } = options;
  const token = getAuthToken();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  signal?.addEventListener('abort', () => controller.abort(), { once: true });

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...requestOptions,
      body,
      signal: controller.signal,
      headers: {
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Backend request timed out. Check that the API server is running on localhost:8080.');
    }
    throw new Error('Backend is not reachable. Check that the API server is running on localhost:8080.');
  } finally {
    window.clearTimeout(timeout);
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  if (payload && 'data' in payload) {
    return payload.data;
  }

  return payload as T;
};

export const backendApi = {
  login: (email: string, password: string) =>
    apiRequest<BackendAuthResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    }),

  register: (input: {
    name: string;
    email: string;
    password: string;
    reportingFocus?: string;
    recaptchaToken?: string;
  }) =>
    apiRequest<BackendCredentialRequestDTO>('/credential-requests', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(input),
    }),

  getTopics: () => apiRequest<BackendTopicDTO[]>('/topics'),

  getMyTopics: () => apiRequest<BackendTopicDTO[]>('/topics/mine'),

  getTopicBySlug: (slug: string) => apiRequest<BackendTopicDTO>(`/topics/slug/${encodeURIComponent(slug)}`),

  createTopic: (input: { name: string; description?: string; avatar?: string; banner?: string; rules?: string }) =>
    apiRequest<BackendTopicDTO>('/topics', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  joinTopic: (id: string | number) =>
    apiRequest<BackendTopicDTO>(`/topics/${id}/join`, {
      method: 'POST',
    }),

  leaveTopic: (id: string | number) =>
    apiRequest<BackendTopicDTO>(`/topics/${id}/join`, {
      method: 'DELETE',
    }),

  getAdminCredentialRequests: (status = '', page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendCredentialRequestDTO>>(
      `/admin/credential-requests?status=${encodeURIComponent(status)}&page=${page}&size=${size}`,
    ),

  approveCredentialRequest: (id: number) =>
    apiRequest<BackendCredentialRequestDTO>(`/admin/credential-requests/${id}/approve`, {
      method: 'POST',
    }),

  rejectCredentialRequest: (id: number, rejectionReason: string) =>
    apiRequest<BackendCredentialRequestDTO>(`/admin/credential-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    }),

  getAdminUsers: (input: { search?: string; role?: string; status?: string; page?: number; size?: number } = {}) => {
    const params = new URLSearchParams({
      search: input.search || '',
      page: String(input.page || 0),
      size: String(input.size || 20),
    });
    if (input.role) params.set('role', input.role);
    if (input.status) params.set('status', input.status);
    return apiRequest<PaginatedResponse<BackendUserDTO>>(`/admin/users?${params.toString()}`);
  },

  getAdminUser: (id: number) =>
    apiRequest<BackendUserDTO>(`/admin/users/${id}`),

  updateAdminUserStatus: (id: number, status: string) =>
    apiRequest<BackendUserDTO>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateAdminUserRole: (id: number, role: string) =>
    apiRequest<BackendUserDTO>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  deleteAdminUser: (id: number) =>
    apiRequest<void>(`/admin/users/${id}`, { method: 'DELETE' }),

  searchAdmin: (q: string) =>
    apiRequest<BackendSearchResultDTO[]>(`/admin/search?q=${encodeURIComponent(q)}`),

  getAdminAdCampaigns: (status = '', page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendAdCampaignDTO>>(
      `/admin/ads?status=${encodeURIComponent(status)}&page=${page}&size=${size}`,
    ),

  approveAdminAdCampaign: (id: number, reviewNote?: string) =>
    apiRequest<BackendAdCampaignDTO>(`/admin/ads/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewNote }),
    }),

  rejectAdminAdCampaign: (id: number, reviewNote?: string) =>
    apiRequest<BackendAdCampaignDTO>(`/admin/ads/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewNote }),
    }),

  getAdminCategories: (search = '', page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendCategoryDTO>>(
      `/admin/categories?search=${encodeURIComponent(search)}&page=${page}&size=${size}`,
    ),

  createAdminCategory: (input: { name: string; slug?: string; description?: string }) =>
    apiRequest<BackendCategoryDTO>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateAdminCategory: (id: number, input: { name?: string; slug?: string; description?: string }) =>
    apiRequest<BackendCategoryDTO>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  deleteAdminCategory: (id: number) =>
    apiRequest<void>(`/admin/categories/${id}`, {
      method: 'DELETE',
    }),

  getAdminTags: (search = '', page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendTagDTO>>(
      `/admin/tags?search=${encodeURIComponent(search)}&page=${page}&size=${size}`,
    ),

  createAdminTag: (input: { name: string; slug?: string }) =>
    apiRequest<BackendTagDTO>('/admin/tags', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateAdminTag: (id: number, input: { name?: string; slug?: string }) =>
    apiRequest<BackendTagDTO>(`/admin/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  deleteAdminTag: (id: number) =>
    apiRequest<void>(`/admin/tags/${id}`, {
      method: 'DELETE',
    }),

  getAdminAuthors: (search = '', page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendAuthorDTO>>(
      `/admin/authors?search=${encodeURIComponent(search)}&page=${page}&size=${size}`,
    ),

  createAdminAuthor: (input: { name: string; slug?: string; bio?: string; avatarUrl?: string; email?: string; facebookUrl?: string; twitterUrl?: string }) =>
    apiRequest<BackendAuthorDTO>('/admin/authors', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateAdminAuthor: (id: number, input: { name?: string; slug?: string; bio?: string; avatarUrl?: string; email?: string; facebookUrl?: string; twitterUrl?: string }) =>
    apiRequest<BackendAuthorDTO>(`/admin/authors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  deleteAdminAuthor: (id: number) =>
    apiRequest<void>(`/admin/authors/${id}`, {
      method: 'DELETE',
    }),

  getPartnerAdCampaigns: (page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendAdCampaignDTO>>(`/partner/ads?page=${page}&size=${size}`),

  createPartnerAdCampaign: (input: Partial<BackendAdCampaignDTO>) =>
    apiRequest<BackendAdCampaignDTO>('/partner/ads', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updatePartnerAdCampaign: (id: number, input: Partial<BackendAdCampaignDTO>) =>
    apiRequest<BackendAdCampaignDTO>(`/partner/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  submitPartnerAdCampaign: (id: number) =>
    apiRequest<BackendAdCampaignDTO>(`/partner/ads/${id}/submit`, {
      method: 'PATCH',
    }),

  getCurrentUser: () => apiRequest<BackendUserDTO>('/users/me'),

  getMyTrust: () => apiRequest<BackendTrustResponse>('/users/me/trust'),

  getUserProfile: (id: string | number) => apiRequest<BackendUserDTO>(`/users/${id}`),

  getMySubscription: () => apiRequest<BackendUserDTO>('/users/me/subscription'),

  updateMySubscription: (input: { plan?: string; billingCadence?: string }) =>
    apiRequest<BackendUserDTO>('/users/me/subscription', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  createSubscriptionCheckout: (input: { plan: string; billingCadence: string }) =>
    apiRequest<BackendStripeCheckoutSessionDTO>('/users/me/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  createSubscriptionPortalSession: () =>
    apiRequest<BackendStripePortalSessionDTO>('/users/me/subscription/portal', {
      method: 'POST',
    }),

  completeSubscriptionCheckout: (sessionId: string) =>
    apiRequest<BackendUserDTO>(`/users/me/subscription/checkout/complete?sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'POST',
    }),

  updateMyProfileCustomization: (input: {
    profileHeadline?: string;
    profileBio?: string;
    profileAccent?: string;
    profileTags?: string[];
    selectedBadge?: string;
  }) =>
    apiRequest<BackendUserDTO>('/users/me/profile-customization', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  updateCurrentUser: (input: { name?: string; email?: string; avatar?: string; password?: string }) =>
    apiRequest<BackendUserDTO>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  getSavedArticles: () => apiRequest<BackendSavedArticleDTO[]>('/users/me/saved-articles'),

  saveArticle: (articleId: number) =>
    apiRequest<BackendSavedArticleDTO>(`/users/me/saved-articles/${articleId}`, {
      method: 'POST',
    }),

  unsaveArticle: (articleId: number) =>
    apiRequest<void>(`/users/me/saved-articles/${articleId}`, {
      method: 'DELETE',
    }),

  getSavedPosts: () => apiRequest<BackendSavedPostDTO[]>('/users/me/saved-posts'),

  savePost: (postId: string | number) =>
    apiRequest<BackendSavedPostDTO>(`/users/me/saved-posts/${postId}`, {
      method: 'POST',
    }),

  unsavePost: (postId: string | number) =>
    apiRequest<void>(`/users/me/saved-posts/${postId}`, {
      method: 'DELETE',
    }),

  getReaderHighlights: () => apiRequest<BackendReaderHighlightDTO[]>('/users/me/highlights'),

  getReaderHighlightsByPost: (postId: string | number) =>
    apiRequest<BackendReaderHighlightDTO[]>(`/users/me/highlights/post/${postId}`),

  getReaderHighlightsByArticle: (articleId: string | number) =>
    apiRequest<BackendReaderHighlightDTO[]>(`/users/me/highlights/article/${articleId}`),

  createReaderHighlight: (input: {
    postId?: number;
    articleId?: number;
    text: string;
    startOffset?: number;
    endOffset?: number;
    note?: string;
  }) =>
    apiRequest<BackendReaderHighlightDTO>('/users/me/highlights', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateReaderHighlight: (id: string | number, input: { note?: string }) =>
    apiRequest<BackendReaderHighlightDTO>(`/users/me/highlights/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  deleteReaderHighlight: (id: string | number) =>
    apiRequest<void>(`/users/me/highlights/${id}`, {
      method: 'DELETE',
    }),

  getReadingProgress: () => apiRequest<BackendReadingProgressDTO[]>('/users/me/reading-progress'),

  saveReadingProgress: (input: { postId: number; articleId?: number; progress: number; scrollY: number }) =>
    apiRequest<BackendReadingProgressDTO>('/users/me/reading-progress', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  clearReadingProgress: (postId: string | number) =>
    apiRequest<void>(`/users/me/reading-progress/${postId}`, {
      method: 'DELETE',
    }),

  getMedia: () => apiRequest<BackendMediaDTO[]>('/media'),

  uploadMedia: (file: File, altText?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('altText', altText);

    return apiRequest<BackendMediaDTO>('/media', {
      method: 'POST',
      body: formData,
    });
  },

  getAuthors: () => apiRequest<BackendAuthorDTO[]>('/authors', { skipAuth: true }),

  getAuthorBySlug: (slug: string) => apiRequest<BackendAuthorDTO>(`/authors/${slug}`, { skipAuth: true }),

  getCategories: () => apiRequest<BackendCategoryDTO[]>('/categories', { skipAuth: true }),

  getTags: (keyword?: string) =>
    apiRequest<BackendTagDTO[]>(`/tags${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`, { skipAuth: true }),

  getHotPosts: (page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendPostDTO>>(`/posts/hot?page=${page}&size=${size}`),

  getPostsByTopic: (topicId: number, page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendPostDTO>>(`/posts/topic/${topicId}?page=${page}&size=${size}`),

  searchPosts: (keyword: string, page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendPostDTO>>(`/posts/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`),

  getPost: (postId: string) => apiRequest<BackendPostDTO>(`/posts/${postId}`),

  createPost: (input: {
    title: string;
    content: string;
    topicId: number;
    articleId?: number;
    sourceUrl?: string;
    imageUrl?: string;
  }) =>
    apiRequest<BackendPostDTO>('/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deletePost: (postId: string | number) =>
    apiRequest<void>(`/posts/${postId}`, {
      method: 'DELETE',
    }),

  votePost: (postId: string, type: 1 | -1) =>
    apiRequest<BackendVoteResponseDTO>(`/posts/${postId}/vote?type=${type}`, {
      method: 'POST',
    }),

  summarizePost: (postId: number, maxPoints?: number, language?: string, force?: boolean) =>
    apiRequest<BackendPostDTO>(`/posts/${postId}/summary?language=${language ?? 'vi'}&force=${force ?? false}${maxPoints != null ? `&maxPoints=${maxPoints}` : ''}`, {
      method: 'POST',
      timeoutMs: 120000,
    }),

  getArticle: (articleId: number) => apiRequest<BackendArticleDTO>(`/articles/${articleId}`, { skipAuth: true }),

  getArticles: (page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(`/articles?page=${page}&size=${size}`, { skipAuth: true }),

  getAllArticles: (page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(`/articles/all?page=${page}&size=${size}`),

  getLatestArticles: (limit = 20) =>
    apiRequest<BackendArticleDTO[]>(`/articles/latest?limit=${limit}`, { skipAuth: true }),

  getTrendingArticles: (limit = 10) =>
    apiRequest<BackendArticleDTO[]>(`/articles/trending?limit=${limit}`, { skipAuth: true }),

  getFeaturedArticles: () => apiRequest<BackendArticleDTO[]>('/articles/featured', { skipAuth: true }),

  getEditorsPicks: () => apiRequest<BackendArticleDTO[]>('/articles/editors-picks', { skipAuth: true }),

  getArticlesByCategory: (slug: string, page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(`/articles/by-category/${slug}?page=${page}&size=${size}`, {
      skipAuth: true,
    }),

  getArticlesByTag: (slug: string, page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(`/articles/by-tag/${slug}?page=${page}&size=${size}`, {
      skipAuth: true,
    }),

  getArticlesByUser: (userId: number, page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(`/articles/by-user/${userId}?page=${page}&size=${size}`, {
      skipAuth: true,
    }),

  searchArticles: (keyword: string, page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(
      `/articles/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`,
      { skipAuth: true },
    ),

  getRecommendedArticles: () =>
    apiRequest<BackendArticleDTO[]>('/articles/recommended'),

  incrementArticleViews: (articleId: number) =>
    apiRequest<void>(`/articles/${articleId}/view`, {
      method: 'POST',
      skipAuth: true,
    }),

  summarizeArticle: (articleId: number) =>
    apiRequest<BackendArticleDTO>(`/articles/${articleId}/summary`, {
      method: 'POST',
      timeoutMs: 120000,
    }),

  getCommentsByArticle: (articleId: number, page = 0, size = 100) =>
    apiRequest<PaginatedResponse<BackendCommentDTO>>(`/comments/article/${articleId}?page=${page}&size=${size}`),

  createArticleComment: (articleId: number, input: { content: string; parentId?: number }) =>
    apiRequest<BackendCommentDTO>(`/comments/article/${articleId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getCommentsByPost: (postId: string, page = 0, size = 100) =>
    apiRequest<PaginatedResponse<BackendCommentDTO>>(`/comments/post/${postId}?page=${page}&size=${size}`),

  createPostComment: (postId: string, input: { content: string; parentId?: number }) =>
    apiRequest<BackendCommentDTO>(`/comments/post/${postId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  likeComment: (commentId: string) =>
    apiRequest<BackendCommentDTO>(`/comments/${commentId}/like`, {
      method: 'POST',
    }),

  unlikeComment: (commentId: string) =>
    apiRequest<BackendCommentDTO>(`/comments/${commentId}/like`, {
      method: 'DELETE',
    }),

  deleteComment: (commentId: string) =>
    apiRequest<void>(`/comments/${commentId}`, {
      method: 'DELETE',
    }),
};
