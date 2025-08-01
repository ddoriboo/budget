import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, MagnifyingGlassIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, isGuestMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    // 로그아웃 후 로그인 페이지로 이동
    navigate('/login');
  };

  const handleLoginClick = () => {
    setShowUserMenu(false);
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (isGuestMode) return '게스트';
    return user?.name || '사용자';
  };

  const getUserStatus = () => {
    if (isGuestMode) return '게스트 모드';
    return '프리미엄 사용자';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* 검색바 */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="지출 내역 검색..."
              className="input-enhanced w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
            />
          </div>
        </div>

        {/* 모바일 로고/제목 */}
        <div className="sm:hidden">
          <h1 className="text-lg font-bold text-gray-900">머니챗</h1>
        </div>

        {/* 우측 액션 버튼들 */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* 모바일 검색 버튼 */}
          <button className="touch-button sm:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 active:bg-gray-200 min-w-[44px] min-h-[44px]">
            <MagnifyingGlassIcon className="w-6 h-6" />
          </button>
          
          <button className="touch-button p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 active:bg-gray-200 min-w-[44px] min-h-[44px]">
            <BellIcon className="w-6 h-6" />
          </button>
          
          <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
          
          {/* 사용자 메뉴 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 touch-button p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 min-h-[44px]"
            >
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{getUserDisplayName()}</div>
                  <div className="text-xs text-gray-500">{getUserStatus()}</div>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${isGuestMode ? 'bg-gray-400' : 'bg-primary'} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-sm font-medium">
                    {isGuestMode ? '게' : getInitials(getUserDisplayName())}
                  </span>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
              </div>
            </button>

            {/* 드롭다운 메뉴 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">{getUserDisplayName()}</div>
                  <div className="text-sm text-gray-500">{user?.email || 'guest@local'}</div>
                  {isGuestMode && (
                    <div className="text-xs text-orange-600 mt-1">
                      게스트 모드 - 데이터는 로컬에만 저장됩니다
                    </div>
                  )}
                </div>
                
                <div className="py-1">
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UserIcon className="w-4 h-4 mr-3" />
                    프로필
                  </button>
                  
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-3" />
                    설정
                  </button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  {isGuestMode ? (
                    <button
                      onClick={handleLoginClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      로그인하여 데이터 동기화
                    </button>
                  ) : (
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      로그아웃
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 클릭 외부 영역 감지를 위한 오버레이 */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};