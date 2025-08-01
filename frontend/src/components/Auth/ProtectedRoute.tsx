import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean; // false면 게스트 모드도 허용
}

export const ProtectedRoute = ({ children, requireAuth = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isGuestMode, isLoading } = useAuth();
  const location = useLocation();

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인/회원가입 페이지는 항상 접근 가능
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // 로그인/회원가입 페이지가 아닌 경우에만 인증 체크
  if (!isAuthPage) {
    // 인증이 필요한 페이지인데 로그인되지 않은 경우
    if (requireAuth && !isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 게스트 모드도 허용하지 않는 페이지인데 게스트인 경우
    if (requireAuth && isGuestMode) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // 아무 인증도 없는 경우 (게스트도 아닌 경우) 로그인 페이지로
    if (!isAuthenticated && !isGuestMode) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};