// API Configuration and service functions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API Response types based on your backend structure
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  token: string;
  type: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    favoriteTopics?: string[];
    createdAt: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Global logout function reference (will be set by AuthContext)
let globalLogout: (() => void) | null = null;

export const setGlobalLogout = (logoutFn: () => void) => {
  globalLogout = logoutFn;
};

// Base API function with error handling and token injection
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = tokenStorage.getToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      // Inject Authorization header if token exists
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      console.warn('Authentication failed - redirecting to login');
      // Clear stored auth data
      tokenStorage.removeToken();
      localStorage.removeItem('userData');
      // Trigger global logout if available
      if (globalLogout) {
        globalLogout();
      }
      // Re-throw with specific auth error
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Authentication API functions
export const authAPI = {
  login: (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Verify current token is valid
  verifyToken: (): Promise<ApiResponse<{ user: any }>> =>
    apiRequest<{ user: any }>('/auth/verify'),

  // Get current user profile
  getProfile: (): Promise<ApiResponse<any>> =>
    apiRequest<any>('/auth/profile'),
};

// News/General API functions (for authenticated requests)
export const newsAPI = {
  getNews: (): Promise<ApiResponse<any>> =>
    apiRequest<any>('/news'),

  getUserPreferences: (): Promise<ApiResponse<any>> =>
    apiRequest<any>('/user/preferences'),
};

// Token storage utilities
export const tokenStorage = {
  setToken: (token: string) => localStorage.setItem('authToken', token),
  getToken: () => localStorage.getItem('authToken'),
  removeToken: () => localStorage.removeItem('authToken'),
};
