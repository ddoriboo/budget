import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 임시 목업 사용자
  const mockUser = {
    id: '1',
    name: '김머니',
    email: 'kim@example.com',
  };

  const login = async (email: string, password: string) => {
    // 임시 로그인 구현
    console.log('Login attempt:', { email, password });
  };

  const logout = () => {
    // 임시 로그아웃 구현
    console.log('Logout');
  };

  return (
    <AuthContext.Provider value={{
      user: mockUser,
      login,
      logout,
      isLoading: false,
    }}>
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