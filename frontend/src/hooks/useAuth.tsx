import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { authService, User, LoginRequest, RegisterRequest } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'profileImage' | 'settings'>>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  enableGuestMode: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuestMode: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기화 - 토큰 검증 및 사용자 정보 복원
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      if (authService.isAuthenticated()) {
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
          
          // 토큰 유효성 검증 (게스트 모드가 아닐 때만)
          if (!authService.isGuestMode()) {
            try {
              const verifiedUser = await authService.verifyToken();
              if (verifiedUser) {
                setUser(verifiedUser);
              } else {
                setUser(null);
              }
            } catch (error) {
              console.error('Token verification failed:', error);
              setUser(null);
            }
          }
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('🔐 로그인 시도:', credentials.email);
      
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        setUser(response.data.user);
        toast.success(response.message || '로그인되었습니다.');
        console.log('✅ 로그인 성공:', response.data.user);
        return true;
      }
      console.log('❌ 로그인 실패:', response);
      toast.error(response.message || '로그인에 실패했습니다.');
      return false;
    } catch (error: any) {
      console.error('❌ 로그인 에러:', error);
      
      // 오프라인 모드 에러 처리
      if (error.message?.includes('오프라인 모드')) {
        toast.error('현재 오프라인 모드입니다. 게스트 모드를 사용해주세요.');
      } else {
        toast.error(error.message || '로그인 중 오류가 발생했습니다.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      if (response.success && response.data) {
        setUser(response.data.user);
        toast.success(response.message || '회원가입이 완료되었습니다.');
        return true;
      }
      toast.error(response.message || '회원가입에 실패했습니다.');
      return false;
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(error.message || '회원가입 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('🚪 로그아웃 시도');
      await authService.logout();
      setUser(null);
      console.log('✅ 로그아웃 성공');
      toast.success('로그아웃되었습니다.');
    } catch (error) {
      console.error('❌ 로그아웃 에러:', error);
      // 로그아웃은 실패해도 로컬 상태는 정리
      setUser(null);
      toast.success('로그아웃되었습니다.'); // 사용자에게는 성공으로 표시
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'profileImage' | 'settings'>>): Promise<boolean> => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      if (updatedUser) {
        setUser(updatedUser);
        toast.success('프로필이 업데이트되었습니다.');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast.error(error.message || '프로필 업데이트에 실패했습니다.');
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('비밀번호가 변경되었습니다.');
      return true;
    } catch (error: any) {
      console.error('Password change failed:', error);
      toast.error(error.message || '비밀번호 변경에 실패했습니다.');
      return false;
    }
  };

  const enableGuestMode = (): void => {
    authService.enableGuestMode();
    const guestUser = authService.getUser();
    setUser(guestUser);
    toast.success('게스트 모드로 시작합니다.');
  };

  const refreshAuth = async (): Promise<void> => {
    if (authService.isGuestMode()) return;
    
    try {
      const verifiedUser = await authService.verifyToken();
      if (verifiedUser) {
        setUser(verifiedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setUser(null);
    }
  };

  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    enableGuestMode,
    isLoading,
    isAuthenticated: !!user,
    isGuestMode: authService.isGuestMode(),
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};