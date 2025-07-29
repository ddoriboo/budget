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
import { StatsCardSkeleton, ChartSkeleton, RecentChatSkeleton } from '@/components/Skeletons/ChartSkeleton';
import { MobileOptimizedChart, MobileTooltip } from '@/components/Charts/MobileOptimizedChart';
import { motion } from 'framer-motion';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isChartsLoading, setIsChartsLoading] = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  // 차트 색상
  const COLORS = ['#03C75A', '#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#FF0080', '#8884D8'];

  // 월별 트렌드 데이터 생성
  const generateMonthlyData = async () => {
    const expenses = await expenseStore.getExpenses();
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
  const generateCategoryData = async () => {
    const expenses = await expenseStore.getExpenses();
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
    const loadData = async () => {
      try {
        setIsLoading(true);
        setIsChartsLoading(true);
        
        const expenseStats = await expenseStore.getExpenseStats();
        setStats(expenseStats);
        setIsLoading(false);

        // 차트 데이터 생성 (약간의 지연으로 순차적 로딩 효과)
        setTimeout(async () => {
          const monthlyData = await generateMonthlyData();
          const categoryData = await generateCategoryData();
          setMonthlyData(monthlyData);
          setCategoryData(categoryData);
          setIsChartsLoading(false);
        }, 300);

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
      } catch (error) {
        console.error('Dashboard 데이터 로딩 실패:', error);
        setIsLoading(false);
        setIsChartsLoading(false);
      }
    };

    loadData();
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
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-4 sm:p-6"
            >
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
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: Math.min((stats.totalAmount / (stats.totalIncome || stats.totalAmount)) * 100, 100) + '%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-red-500 h-2 rounded-full"
                ></motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card p-4 sm:p-6"
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card p-4 sm:p-6"
            >
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
            </motion.div>
          </>
        )}
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
        <MobileOptimizedChart
          title="월별 지출 트렌드"
          isLoading={isChartsLoading}
        >
          <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#666"
              fontSize={window.innerWidth < 640 ? 10 : 12}
              tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
            />
            <YAxis 
              stroke="#666"
              fontSize={window.innerWidth < 640 ? 10 : 12}
              tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
              tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
            />
            <Tooltip content={<MobileTooltip />} />
            <Line 
              type="monotone" 
              dataKey="지출" 
              stroke="#dc2626" 
              strokeWidth={window.innerWidth < 640 ? 2 : 3}
              dot={{ fill: '#dc2626', strokeWidth: 2, r: window.innerWidth < 640 ? 3 : 4 }}
              activeDot={{ r: window.innerWidth < 640 ? 5 : 6, fill: '#dc2626' }}
              animationDuration={1000}
            />
            <Line 
              type="monotone" 
              dataKey="수입" 
              stroke="#03C75A" 
              strokeWidth={window.innerWidth < 640 ? 2 : 3}
              dot={{ fill: '#03C75A', strokeWidth: 2, r: window.innerWidth < 640 ? 3 : 4 }}
              activeDot={{ r: window.innerWidth < 640 ? 5 : 6, fill: '#03C75A' }}
              animationDuration={1000}
              animationDelay={200}
            />
          </LineChart>
        </MobileOptimizedChart>

        {/* 카테고리별 지출 */}
        <MobileOptimizedChart
          title="이번 달 카테고리별 지출"
          isLoading={isChartsLoading}
          className="relative"
        >
          {categoryData.length > 0 ? (
            <>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 640 ? 30 : 40}
                  outerRadius={window.innerWidth < 640 ? 60 : 80}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={800}
                  onMouseEnter={(_, index) => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke={hoveredSegment === index ? '#fff' : 'none'}
                      strokeWidth={hoveredSegment === index ? 2 : 0}
                      style={{
                        filter: hoveredSegment === index ? 'brightness(1.1)' : 'none',
                        transform: hoveredSegment === index ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<MobileTooltip />} />
              </PieChart>
              
              {/* 범례 */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-0 left-0 right-0 p-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-3">
                  {categoryData.map((entry, index) => (
                    <motion.div 
                      key={entry.name} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      className="flex items-center text-sm cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors"
                      onMouseEnter={() => setHoveredSegment(index)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="truncate">{entry.name}</span>
                      <span className="ml-auto text-gray-600 font-medium">
                        ₩{entry.value.toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p className="text-lg mb-2">📊</p>
                <p className="text-sm">이번 달 지출 데이터가 없습니다</p>
                <p className="text-xs mt-1">채팅으로 지출을 입력해보세요!</p>
              </motion.div>
            </div>
          )}
        </MobileOptimizedChart>
      </div>

      {/* 최근 대화 내역 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="card p-4 sm:p-6"
      >
        <h2 className="text-lg font-semibold mb-4">최근 대화 내역</h2>
        <div className="space-y-4">
          {isLoading ? (
            <RecentChatSkeleton />
          ) : recentChats.length > 0 ? (
            recentChats.map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">{item.time}</div>
                  <div className="text-gray-900 mt-1">"{item.message}"</div>
                  <div className="text-sm text-primary mt-1">→ {item.result}</div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="text-center py-8 text-gray-500"
            >
              <p>아직 대화 내역이 없습니다.</p>
              <p className="text-sm mt-1">채팅으로 첫 가계부를 입력해보세요!</p>
            </motion.div>
          )}
        </div>
        <div className="mt-4 text-center">
          <Link to="/chat" className="text-primary hover:text-primary-600 text-sm font-medium hover:underline transition-all">
            모든 대화 보기 →
          </Link>
        </div>
      </motion.div>
    </div>
  );
};