// Authentication Service

export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
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

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

// 디버깅을 위한 환경 변수 로그
console.log('🔧 AuthService 환경 설정:', {
  API_BASE_URL,
  OFFLINE_MODE,
  VITE_OFFLINE_MODE: import.meta.env.VITE_OFFLINE_MODE
});

class AuthService {
  private tokenKey = 'moneychat_token';
  private userKey = 'moneychat_user';

  // 토큰 관리
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    console.log('🗑️ 로그아웃: 토큰과 사용자 정보 제거');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    
    // 추가로 관련된 모든 데이터 확실히 제거
    const keysToRemove = [this.tokenKey, this.userKey];
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove ${key}:`, error);
      }
    });
  }

  // 사용자 정보 관리
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // API 요청 헬퍼
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 오프라인 모드일 때는 API 요청하지 않음
    if (OFFLINE_MODE) {
      console.log('⚠️ 오프라인 모드로 API 요청 차단:', endpoint);
      throw new Error('오프라인 모드입니다. 게스트 모드를 사용해주세요.');
    }

    const token = this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      console.log(`✅ API Response: ${response.status}`, data);

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status}`, data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  // 회원가입
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }

    return response;
  }

  // 로그인
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }

    return response;
  }

  // 로그아웃
  async logout(): Promise<void> {
    // 오프라인 모드이거나 게스트 모드일 때는 API 요청 건너뛰기
    if (!OFFLINE_MODE && !this.isGuestMode()) {
      try {
        await this.makeRequest('/api/auth/logout', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Logout API failed:', error);
      }
    }
    
    // 항상 로컬 토큰과 사용자 정보 제거
    this.removeToken();
  }

  // 토큰 검증
  async verifyToken(): Promise<User | null> {
    try {
      const response = await this.makeRequest<ApiResponse<User>>('/api/auth/verify');
      if (response.success && response.data) {
        this.setUser(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Token verification failed:', error);
      this.removeToken();
      return null;
    }
  }

  // 프로필 조회
  async getProfile(): Promise<User | null> {
    try {
      const response = await this.makeRequest<ApiResponse<User>>('/api/auth/profile');
      if (response.success && response.data) {
        this.setUser(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Get profile failed:', error);
      return null;
    }
  }

  // 프로필 업데이트
  async updateProfile(updates: Partial<Pick<User, 'name' | 'profileImage' | 'settings'>>): Promise<User | null> {
    try {
      const response = await this.makeRequest<ApiResponse<User>>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (response.success && response.data) {
        this.setUser(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  }

  // 비밀번호 변경
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.makeRequest('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  }

  // 토큰 갱신
  async refreshToken(): Promise<string | null> {
    try {
      const response = await this.makeRequest<ApiResponse<{ token: string }>>('/api/auth/refresh', {
        method: 'POST',
      });

      if (response.success && response.data) {
        this.setToken(response.data.token);
        return response.data.token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.removeToken();
      return null;
    }
  }

  // 로그인 상태 확인
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // 오프라인 모드 지원을 위한 게스트 모드
  enableGuestMode(): void {
    const guestUser: User = {
      id: 'guest',
      email: 'guest@local',
      name: '게스트 사용자',
      settings: {
        currency: 'KRW',
        dateFormat: 'YYYY-MM-DD',
        theme: 'light',
        notifications: {
          email: false,
          push: false,
          budgetAlerts: true,
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.setUser(guestUser);
    this.setToken('guest_token');
  }

  isGuestMode(): boolean {
    const user = this.getUser();
    return user?.id === 'guest';
  }
}

export const authService = new AuthService();