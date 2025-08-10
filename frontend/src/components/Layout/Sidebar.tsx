import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentArrowUpIcon,
  ChartBarIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';
import { expenseStore } from '@/store/expenseStore';
import { useAuth } from '@/hooks/useAuth';

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: HomeIcon },
  { name: '대화하기', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: '지출 내역', href: '/expenses', icon: ChartBarIcon },
  { name: '엑셀 업로드', href: '/excel', icon: DocumentArrowUpIcon },
  { name: '설정', href: '/settings', icon: Cog6ToothIcon },
];

export const Sidebar = () => {
  const { user, isGuestMode } = useAuth();
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalExpenses: 0,
    monthlyIncome: 0,
  });

  useEffect(() => {
    const updateStats = async () => {
      const expenseStats = await expenseStore.getExpenseStats();
      setStats({
        totalAmount: expenseStats.totalAmount,
        totalExpenses: expenseStats.totalExpenses,
        monthlyIncome: expenseStats.totalIncome || 0,
      });
    };

    updateStats();
    
    // ExpenseStore 변경 이벤트 리스너 등록
    expenseStore.addChangeListener(updateStats);
    
    // localStorage 변경 감지 (다른 탭에서 데이터 변경 시)
    const handleStorageChange = () => updateStats();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      expenseStore.removeChangeListener(updateStats);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const balance = stats.monthlyIncome - stats.totalAmount;

  return (
    <div className="w-64 lg:w-80 bg-gray-600 text-white flex flex-col h-screen overflow-hidden">
      {/* 로고 */}
      <div className="p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-xl lg:text-2xl font-bold text-primary-400">네이버 가계부 V2</h1>
        <p className="text-gray-300 text-xs lg:text-sm mt-1">대화형 가계부</p>
      </div>

      {/* 자산 현황 요약 */}
      <div className="p-3 lg:p-6 border-b border-gray-700 flex-shrink-0">
        <div className="space-y-3 lg:space-y-4">
          <div className="bg-gray-700 rounded-lg p-3 lg:p-4">
            <div className="text-xs lg:text-sm text-gray-300">이번 달 지출</div>
            <div className="text-lg lg:text-2xl font-bold text-red-400">₩{stats.totalAmount.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.totalExpenses}건의 지출</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 lg:p-4">
            <div className="text-xs lg:text-sm text-gray-300">이번 달 수입</div>
            <div className="text-lg lg:text-2xl font-bold text-primary-400">₩{stats.monthlyIncome.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">고정 수입</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 lg:p-4">
            <div className="text-xs lg:text-sm text-gray-300">잔액</div>
            <div className={`text-lg lg:text-2xl font-bold ${balance >= 0 ? 'text-primary-400' : 'text-red-400'}`}>
              ₩{balance.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {balance >= 0 ? '여유 자금' : '적자 상태'}
            </div>
          </div>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 p-3 lg:p-6 overflow-y-auto">
        <ul className="space-y-1 lg:space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 flex-shrink-0" />
                <span className="text-sm lg:text-base truncate">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 하단 정보 */}
      <div className="p-3 lg:p-6 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center min-w-0">
          <div className={`w-8 h-8 ${isGuestMode ? 'bg-gray-400' : 'bg-primary'} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-sm font-medium">
              {isGuestMode ? '게' : (user?.name || '사용자').charAt(0)}
            </span>
          </div>
          <div className="ml-2 lg:ml-3 min-w-0 flex-1">
            <div className="text-sm font-medium truncate">
              {isGuestMode ? '게스트 사용자' : (user?.name || '사용자')}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {user?.email || 'guest@local'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};