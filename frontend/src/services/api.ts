// API Configuration and service functions
const API_BASE_URL = 'https://newsapp-api-80wt.onrender.com/api/v1';

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

// Base API function with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
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
};

// Token storage utilities
export const tokenStorage = {
  setToken: (token: string) => localStorage.setItem('authToken', token),
  getToken: () => localStorage.getItem('authToken'),
  removeToken: () => localStorage.removeItem('authToken'),
};