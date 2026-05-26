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
  userId: number;
  authorName: string;
  topicId: number;
  topicName: string;
  articleId?: number | null;
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
        ...(body ? { 'Content-Type': 'application/json' } : {}),
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

  register: (input: { name: string; email: string; password: string; reportingFocus?: string }) =>
    apiRequest<BackendCredentialRequestDTO>('/credential-requests', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(input),
    }),

  getTopics: () => apiRequest<BackendTopicDTO[]>('/topics', { skipAuth: true }),

  getAdminCredentialRequests: (status = '', page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendCredentialRequestDTO>>(
      `/admin/credential-requests?status=${encodeURIComponent(status)}&page=${page}&size=${size}`
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

  getCurrentUser: () => apiRequest<BackendUserDTO>('/users/me'),

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

  getAuthors: () => apiRequest<BackendAuthorDTO[]>('/authors', { skipAuth: true }),

  getAuthorBySlug: (slug: string) => apiRequest<BackendAuthorDTO>(`/authors/${slug}`, { skipAuth: true }),

  getCategories: () => apiRequest<BackendCategoryDTO[]>('/categories', { skipAuth: true }),

  getTags: (keyword?: string) => apiRequest<BackendTagDTO[]>(`/tags${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`, { skipAuth: true }),

  getHotPosts: (page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendPostDTO>>(`/posts/hot?page=${page}&size=${size}`),

  getPostsByTopic: (topicId: number, page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendPostDTO>>(`/posts/topic/${topicId}?page=${page}&size=${size}`),

  getPost: (postId: string) => apiRequest<BackendPostDTO>(`/posts/${postId}`),

  createPost: (input: { title: string; content: string; topicId: number; articleId?: number; sourceUrl?: string; imageUrl?: string }) =>
    apiRequest<BackendPostDTO>('/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  votePost: (postId: string, type: 1 | -1) =>
    apiRequest<BackendVoteResponseDTO>(`/posts/${postId}/vote?type=${type}`, {
      method: 'POST',
    }),

  getArticle: (articleId: number) => apiRequest<BackendArticleDTO>(`/articles/${articleId}`, { skipAuth: true }),

  getArticles: (page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(`/articles?page=${page}&size=${size}`, { skipAuth: true }),

  getAllArticles: (page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(`/articles/all?page=${page}&size=${size}`),

  getLatestArticles: (limit = 20) => apiRequest<BackendArticleDTO[]>(`/articles/latest?limit=${limit}`, { skipAuth: true }),

  getTrendingArticles: (limit = 10) => apiRequest<BackendArticleDTO[]>(`/articles/trending?limit=${limit}`, { skipAuth: true }),

  getFeaturedArticles: () => apiRequest<BackendArticleDTO[]>('/articles/featured', { skipAuth: true }),

  getEditorsPicks: () => apiRequest<BackendArticleDTO[]>('/articles/editors-picks', { skipAuth: true }),

  getArticlesByCategory: (slug: string, page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(`/articles/by-category/${slug}?page=${page}&size=${size}`, { skipAuth: true }),

  getArticlesByUser: (userId: number, page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(`/articles/by-user/${userId}?page=${page}&size=${size}`, { skipAuth: true }),

  searchArticles: (keyword: string, page = 0, size = 20) =>
    apiRequest<PaginatedResponse<BackendArticleDTO>>(`/articles/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`, { skipAuth: true }),

  incrementArticleViews: (articleId: number) =>
    apiRequest<void>(`/articles/${articleId}/view`, {
      method: 'POST',
      skipAuth: true,
    }),

  getCommentsByArticle: (articleId: number, page = 0, size = 100) =>
    apiRequest<PaginatedResponse<BackendCommentDTO>>(`/comments/article/${articleId}?page=${page}&size=${size}`, { skipAuth: true }),

  createArticleComment: (articleId: number, input: { content: string; parentId?: number }) =>
    apiRequest<BackendCommentDTO>(`/comments/article/${articleId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getCommentsByPost: (postId: string, page = 0, size = 100) =>
    apiRequest<PaginatedResponse<BackendCommentDTO>>(`/comments/post/${postId}?page=${page}&size=${size}`, { skipAuth: true }),

  createPostComment: (postId: string, input: { content: string; parentId?: number }) =>
    apiRequest<BackendCommentDTO>(`/comments/post/${postId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  likeComment: (commentId: string) =>
    apiRequest<BackendCommentDTO>(`/comments/${commentId}/like`, {
      method: 'POST',
    }),
};
