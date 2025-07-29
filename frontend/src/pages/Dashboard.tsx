import { PlusIcon, ChatBubbleLeftRightIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { expenseStore } from '@/store/expenseStore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    totalIncome: 0,
    categoryStats: {} as Record<string, number>,
    recentExpenses: [] as any[],
  });
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // 차트 색상
  const COLORS = ['#03C75A', '#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#FF0080', '#8884D8'];

  // 월별 트렌드 데이터 생성
  const generateMonthlyData = () => {
    const expenses = expenseStore.getExpenses();
    const monthlyStats: Record<string, { month: string; 지출: number; 수입: number }> = {};
    
    // 최근 6개월 데이터 초기화
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      const monthName = date.toLocaleDateString('ko-KR', { month: 'short' });
      monthlyStats[monthKey] = { month: monthName, 지출: 0, 수입: 0 };
    }

    // 실제 데이터 집계
    expenses.forEach(expense => {
      const monthKey = expense.date.slice(0, 7);
      if (monthlyStats[monthKey]) {
        if (expense.type === 'income') {
          monthlyStats[monthKey].수입 += expense.amount;
        } else {
          monthlyStats[monthKey].지출 += expense.amount;
        }
      }
    });

    return Object.values(monthlyStats);
  };

  // 카테고리별 파이차트 데이터 생성
  const generateCategoryData = () => {
    const expenses = expenseStore.getExpenses();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthExpenses = expenses.filter(e => 
      e.date.startsWith(currentMonth) && e.type !== 'income'
    );

    const categoryStats = thisMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7); // 상위 7개 카테고리만
  };

  useEffect(() => {
    // 통계 데이터 로드
    const expenseStats = expenseStore.getExpenseStats();
    setStats(expenseStats);

    // 차트 데이터 생성
    setMonthlyData(generateMonthlyData());
    setCategoryData(generateCategoryData());

    // 최근 대화 내역 로드
    const chatSessions = expenseStore.getChatSessions();
    const recentChatData = chatSessions.slice(0, 3).map(session => {
      const lastUserMessage = session.messages
        .slice()
        .reverse()
        .find(msg => msg.type === 'user');
      
      const lastAiMessage = session.messages
        .slice()
        .reverse()
        .find(msg => msg.type === 'ai' && msg.data);

      return {
        time: new Date(session.lastMessageAt).toLocaleString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        message: lastUserMessage?.content || '대화 없음',
        result: lastAiMessage?.data 
          ? `${lastAiMessage.data.category} > ${lastAiMessage.data.subcategory}, ${lastAiMessage.data.amount.toLocaleString()}원`
          : '분석 결과 없음'
      };
    });
    setRecentChats(recentChatData);
  }, []);

  return (
    <div className="mobile-container mobile-spacing">
      {/* 웰컴 섹션 */}
      <div className="gradient-primary rounded-xl p-4 sm:p-6 lg:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">안녕하세요, 김머니님! 👋</h1>
        <p className="text-primary-100 text-base sm:text-lg">
          오늘도 머니챗과 함께 스마트한 가계부 관리를 시작해보세요.
        </p>
      </div>

      {/* 이번 달 요약 카드들 */}
      <div className="mobile-grid gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">이번 달 지출</p>
              <p className="text-2xl font-bold text-red-500">₩{stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">{stats.totalExpenses}건의 지출</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-2xl">📉</span>
            </div>
          </div>
          <div className="mt-4 bg-gray-100 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: '67%' }}></div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">이번 달 수입</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">₩{stats.totalIncome.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">수입 기록</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-primary text-xl sm:text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">잔액</p>
              <p className={`text-2xl font-bold ${stats.totalIncome - stats.totalAmount >= 0 ? 'text-primary' : 'text-red-500'}`}>
                ₩{(stats.totalIncome - stats.totalAmount).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.totalIncome - stats.totalAmount >= 0 ? '흑자' : '적자'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 버튼들 */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">빠른 액션</h2>
        <div className="mobile-grid gap-3 sm:gap-4">
          <Link
            to="/chat"
            className="touch-button flex items-center p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary hover:bg-primary-50 active:bg-primary-100 transition-colors group min-h-[60px]"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary mr-3 flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium text-gray-900 group-hover:text-primary text-sm sm:text-base">대화로 입력하기</div>
              <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">"어제 스벅에서 5천원 썼어"</div>
            </div>
          </Link>

          <Link
            to="/excel"
            className="touch-button flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors group min-h-[60px]"
          >
            <DocumentArrowUpIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 mr-3 flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium text-gray-900 text-sm sm:text-base">엑셀 업로드</div>
              <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">카드사 내역 한 번에 등록</div>
            </div>
          </Link>

          <button className="touch-button flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors group min-h-[60px]">
            <PlusIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 mr-3 flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium text-gray-900 text-sm sm:text-base">직접 입력</div>
              <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">전통적인 폼 입력</div>
            </div>
          </button>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 월별 지출 트렌드 */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">월별 지출 트렌드</h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#666"
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `₩${value.toLocaleString()}`, 
                    name
                  ]}
                  labelStyle={{ color: '#666' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="지출" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#dc2626' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="수입" 
                  stroke="#03C75A" 
                  strokeWidth={3}
                  dot={{ fill: '#03C75A', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#03C75A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 카테고리별 지출 */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">이번 달 카테고리별 지출</h2>
          <div className="h-64 sm:h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`₩${value.toLocaleString()}`, '금액']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">📊</p>
                  <p className="text-sm">이번 달 지출 데이터가 없습니다</p>
                  <p className="text-xs mt-1">채팅으로 지출을 입력해보세요!</p>
                </div>
              </div>
            )}
          </div>
          
          {/* 범례 */}
          {categoryData.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-sm">
                  <div 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="truncate">{entry.name}</span>
                  <span className="ml-auto text-gray-600 font-medium">
                    ₩{entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 최근 대화 내역 */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">최근 대화 내역</h2>
        <div className="space-y-4">
          {recentChats.length > 0 ? recentChats.map((item, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">{item.time}</div>
                <div className="text-gray-900 mt-1">"{item.message}"</div>
                <div className="text-sm text-primary mt-1">→ {item.result}</div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <p>아직 대화 내역이 없습니다.</p>
              <p className="text-sm mt-1">채팅으로 첫 가계부를 입력해보세요!</p>
            </div>
          )}
        </div>
        <div className="mt-4 text-center">
          <Link to="/chat" className="text-primary hover:text-primary-600 text-sm font-medium">
            모든 대화 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
};