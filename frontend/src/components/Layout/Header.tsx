import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const Header = () => {
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
          
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">김머니</div>
              <div className="text-xs text-gray-500">프리미엄 사용자</div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center touch-button active:scale-95">
              <span className="text-white text-sm font-medium">김</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};