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

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: HomeIcon },
  { name: '대화하기', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: '지출 내역', href: '/expenses', icon: ChartBarIcon },
  { name: '엑셀 업로드', href: '/excel', icon: DocumentArrowUpIcon },
  { name: '설정', href: '/settings', icon: Cog6ToothIcon },
];

export const Sidebar = () => {
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalExpenses: 0,
    monthlyIncome: 0, // 사용자 설정 가능한 값으로 변경 예정
  });

  useEffect(() => {
    const updateStats = () => {
      const expenseStats = expenseStore.getExpenseStats();
      setStats(prev => ({
        ...prev,
        totalAmount: expenseStats.totalAmount,
        totalExpenses: expenseStats.totalExpenses,
      }));
    };

    updateStats();
    
    // localStorage 변경 감지 (다른 탭에서 데이터 변경 시)
    const handleStorageChange = () => updateStats();
    window.addEventListener('storage', handleStorageChange);
    
    // 컴포넌트 내에서 변경 감지를 위한 폴링 (개선 여지 있음)
    const interval = setInterval(updateStats, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const balance = stats.monthlyIncome - stats.totalAmount;

  return (
    <div className="w-80 bg-gray-600 text-white flex flex-col">
      {/* 로고 */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-primary-400">머니챗</h1>
        <p className="text-gray-300 text-sm mt-1">대화형 가계부</p>
      </div>

      {/* 자산 현황 요약 */}
      <div className="p-6 border-b border-gray-700">
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-300">이번 달 지출</div>
            <div className="text-2xl font-bold text-red-400">₩{stats.totalAmount.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.totalExpenses}건의 지출</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-300">이번 달 수입</div>
            <div className="text-2xl font-bold text-primary-400">₩{stats.monthlyIncome.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">고정 수입</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-300">잔액</div>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-primary-400' : 'text-red-400'}`}>
              ₩{balance.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {balance >= 0 ? '여유 자금' : '적자 상태'}
            </div>
          </div>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 하단 정보 */}
      <div className="p-6 border-t border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">김</span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium">김머니</div>
            <div className="text-xs text-gray-400">kim@example.com</div>
          </div>
        </div>
      </div>
    </div>
  );
};