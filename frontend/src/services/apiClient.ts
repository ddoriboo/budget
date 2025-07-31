// API 클라이언트 설정 및 공통 기능

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken(): void {
    // 개발 환경에서는 임시 토큰 사용 (JWT 인증 우회)
    if (import.meta.env.MODE === 'development') {
      this.token = 'dev-bypass-token';
    } else {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      // 타임아웃 설정 (3초로 단축)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      // 백엔드 연결 실패는 예상된 상황이므로 warn으로 변경
      if (url.includes('localhost:4000')) {
        console.warn('백엔드 서버가 실행되지 않았습니다. LocalStorage 모드로 작동합니다.');
      } else {
        console.error('API Request failed:', error);
      }
      
      let errorMessage = 'Network error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // GET 요청
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.makeRequest<T>(url.pathname + url.search);
  }

  // POST 요청
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH 요청
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // 토큰 설정
  setToken(token: string): void {
    this.token = token;
    if (import.meta.env.MODE !== 'development') {
      localStorage.setItem('auth_token', token);
    }
  }

  // 토큰 제거
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }
}

export const apiClient = new ApiClient();