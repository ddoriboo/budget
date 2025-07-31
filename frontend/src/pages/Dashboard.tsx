import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { expenseStore } from '@/store/expenseStore';
import { StatsCardSkeleton, ChartSkeleton, RecentChatSkeleton } from '@/components/Skeletons/ChartSkeleton';
import { motion } from 'framer-motion';
import { getCategoryInfo, getCategoryDisplay, getChartColors } from '@/utils/categoryUtils';
import { 
  BudgetGaugeChart, 
  CategoryDonutChart, 
  MonthlyTrendChart, 
  BudgetComparisonChart,
  DailySpendingHeatmap,
  MoneyFlowCard,
  BudgetProgressBar,
  SmartBudgetTracker,
  InsightsCard
} from '@/components/Charts/EChartsComponents';
import { MobileOptimizedChart } from '@/components/Charts/MobileOptimizedChart';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    totalIncome: 0,
    categoryStats: {} as Record<string, number>,
    recentExpenses: [] as any[],
    budgetSummary: null as any,
  });
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [budgetComparisonData, setBudgetComparisonData] = useState<any[]>([]);
  const [budgetProgressData, setBudgetProgressData] = useState<any[]>([]);
  const [dailySpendingData, setDailySpendingData] = useState<[string, number][]>([]);
  const [insightData, setInsightData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartsLoading, setIsChartsLoading] = useState(true);

  // 월별 트렌드 데이터 생성
  const generateMonthlyData = async () => {
    const expenses = await expenseStore.getExpenses();
    const monthlyStats: Record<string, { month: string; expense: number; income: number }> = {};
    
    // 최근 6개월 데이터 초기화
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      const monthName = date.toLocaleDateString('ko-KR', { month: 'short' });
      monthlyStats[monthKey] = { month: monthName, expense: 0, income: 0 };
    }

    // 실제 데이터 집계
    expenses.forEach(expense => {
      const monthKey = expense.date.slice(0, 7);
      if (monthlyStats[monthKey]) {
        if (expense.type === 'income') {
          monthlyStats[monthKey].income += expense.amount;
        } else {
          monthlyStats[monthKey].expense += expense.amount;
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
      .map(([name, value]) => { 
        const info = getCategoryInfo(name);
        return {
          name: getCategoryDisplay(name), 
          value,
          color: info.color
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // 상위 8개 카테고리만
  };

  // 예산 비교 데이터 생성
  const generateBudgetComparisonData = () => {
    const comparison = expenseStore.getCategoryBudgetComparison();
    return comparison
      .filter(item => item.amount > 0)
      .map(item => ({
        category: getCategoryDisplay(item.categoryName),
        budget: item.amount,
        actual: item.actualSpent
      }))
      .slice(0, 6); // 상위 6개만
  };

  // 일별 지출 히트맵 데이터 생성
  const generateDailySpendingData = async () => {
    const expenses = await expenseStore.getExpenses();
    const dailyStats: Record<string, number> = {};
    
    expenses
      .filter(e => e.type === 'expense')
      .forEach(expense => {
        const date = expense.date;
        dailyStats[date] = (dailyStats[date] || 0) + expense.amount;
      });

    return Object.entries(dailyStats).map(([date, amount]) => [date, amount] as [string, number]);
  };

  // 더미 예산 데이터 초기화 (테스트용)
  const initializeDummyBudgets = () => {
    const existingBudgets = expenseStore.getBudgets();
    if (existingBudgets.length === 0) {
      // 더미 예산 데이터 생성
      const dummyBudgets = [
        { categoryName: '식비', amount: 500000 },
        { categoryName: '교통', amount: 150000 },
        { categoryName: '쇼핑', amount: 300000 },
        { categoryName: '문화/여가', amount: 200000 },
        { categoryName: '주거/통신', amount: 400000 },
        { categoryName: '건강/의료', amount: 100000 },
      ];
      
      const today = new Date().toISOString().split('T')[0];
      dummyBudgets.forEach(budget => {
        expenseStore.createBudget({
          categoryName: budget.categoryName,
          amount: budget.amount,
          periodType: 'monthly',
          startDate: today,
        });
      });
    }
  };

  // 예산 프로그레스 바 데이터 생성 (개선)
  const generateBudgetProgressData = () => {
    // 더미 데이터 초기화
    initializeDummyBudgets();
    
    const comparison = expenseStore.getCategoryBudgetComparison();
    const expenses = expenseStore.getExpensesSync();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // 이번 달 지출이 있는 카테고리들 추출
    const thisMonthExpenses = expenses.filter(e => 
      e.date.startsWith(currentMonth) && e.type === 'expense'
    );
    
    const categoriesWithSpending = [...new Set(thisMonthExpenses.map(e => e.category))];
    
    // 예산이 있거나 지출이 있는 카테고리들 포함
    const allRelevantCategories = new Set([
      ...comparison.map(item => item.categoryName),
      ...categoriesWithSpending
    ]);
    
    const result = Array.from(allRelevantCategories).map(categoryName => {
      const budgetItem = comparison.find(item => item.categoryName === categoryName);
      const actualSpent = thisMonthExpenses
        .filter(e => e.category === categoryName)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const categoryInfo = getCategoryInfo(categoryName);
      
      return {
        category: getCategoryDisplay(categoryName),
        budget: budgetItem?.amount || 0,
        actual: actualSpent,
        color: categoryInfo.color
      };
    })
    .filter(item => item.budget > 0 || item.actual > 0) // 예산이나 지출이 있는 것만
    .sort((a, b) => b.actual - a.actual) // 실제 지출 기준 정렬
    .slice(0, 8);
    
    return result;
  };

  // 인사이트 데이터 생성
  const generateInsightData = async () => {
    const expenses = await expenseStore.getExpenses();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthKey = lastMonth.toISOString().slice(0, 7);
    
    const thisMonthExpenses = expenses.filter(e => 
      e.date.startsWith(currentMonth) && e.type === 'expense'
    );
    const lastMonthExpenses = expenses.filter(e => 
      e.date.startsWith(lastMonthKey) && e.type === 'expense'
    );
    
    // 카테고리별 지출 계산
    const categoryStats = thisMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)[0];
    
    const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalLastMonth = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const averageDaily = totalThisMonth / new Date().getDate();
    const monthComparison = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0;
    
    return {
      topCategory: topCategory ? getCategoryDisplay(topCategory[0]) : '없음',
      topAmount: topCategory ? topCategory[1] : 0,
      totalExpenses: totalThisMonth,
      averageDaily,
      lastMonthComparison: monthComparison
    };
  };

  // 남은 일수 계산
  const getDaysLeftInMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
  };

  useEffect(() => {
    // 통계 데이터 로드
    const loadData = async () => {
      try {
        setIsLoading(true);
        setIsChartsLoading(true);
        
        const expenseStats = await expenseStore.getExpenseStats();
        const budgetSummary = expenseStore.getBudgetSummary();
        
        setStats({
          ...expenseStats,
          budgetSummary
        });
        setIsLoading(false);

        // 차트 데이터 생성 (약간의 지연으로 순차적 로딩 효과)
        setTimeout(async () => {
          const monthlyData = await generateMonthlyData();
          const categoryData = await generateCategoryData();
          const budgetData = generateBudgetComparisonData();
          const budgetProgressData = generateBudgetProgressData();
          const dailyData = await generateDailySpendingData();
          const insightData = await generateInsightData();
          
          setMonthlyData(monthlyData);
          setCategoryData(categoryData);
          setBudgetComparisonData(budgetData);
          setBudgetProgressData(budgetProgressData);
          setDailySpendingData(dailyData);
          setInsightData(insightData);
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
              ? `${getCategoryDisplay(lastAiMessage.data.category, lastAiMessage.data.subcategory)}, ${lastAiMessage.data.amount.toLocaleString()}원`
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
      {/* 메인 KPI 대시보드 */}
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-xl mb-6"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <MoneyFlowCard
            income={stats.totalIncome}
            expense={stats.totalAmount}
            budget={stats.budgetSummary?.totalBudget || 0}
            budgetUsed={stats.budgetSummary?.totalSpent || 0}
            daysLeft={getDaysLeftInMonth()}
          />
        </motion.div>
      )}


      {/* 주요 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* 월별 지출 트렌드 */}
        <MobileOptimizedChart
          title="📈 월별 수입 vs 지출 트렌드"
          isLoading={isChartsLoading}
          height="h-80"
        >
          {monthlyData.length > 0 ? (
            <MonthlyTrendChart data={monthlyData} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p className="text-4xl mb-3">📈</p>
                <p className="text-base font-medium">월별 데이터가 없습니다</p>
                <p className="text-sm mt-2 text-gray-400">지출을 입력하여 트렌드를 확인해보세요!</p>
              </motion.div>
            </div>
          )}
        </MobileOptimizedChart>

        {/* 카테고리별 지출 */}
        <MobileOptimizedChart
          title="🍕 이번 달 카테고리별 지출"
          isLoading={isChartsLoading}
          height="h-80"
        >
          {categoryData.length > 0 ? (
            <CategoryDonutChart data={categoryData} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p className="text-4xl mb-3">🍕</p>
                <p className="text-base font-medium">지출 데이터가 없습니다</p>
                <p className="text-sm mt-2 text-gray-400">채팅으로 지출을 입력해보세요!</p>
              </motion.div>
            </div>
          )}
        </MobileOptimizedChart>
      </div>


      {/* Smart Budget Tracker */}
      {budgetProgressData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6"
        >
          <SmartBudgetTracker budgetData={budgetProgressData} />
        </motion.div>
      )}

      {/* 인사이트 & 빠른 액션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* 인사이트 카드 */}
        {insightData && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <InsightsCard {...insightData} />
          </motion.div>
        )}

        {/* 빠른 액션 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900">🚀 빠른 액션</h3>
          <div className="space-y-3">
            <Link
              to="/chat"
              className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all group border border-blue-200"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-lg">💬</span>
              </div>
              <div>
                <div className="font-medium text-gray-900 group-hover:text-blue-700">대화로 입력하기</div>
                <div className="text-sm text-gray-500">"어제 스벅에서 5천원 썼어"</div>
              </div>
            </Link>

            <Link
              to="/excel"
              className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-lg transition-all group border border-green-200"
            >
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-lg">📊</span>
              </div>
              <div>
                <div className="font-medium text-gray-900 group-hover:text-green-700">엑셀 업로드</div>
                <div className="text-sm text-gray-500">카드사 내역 한 번에 등록</div>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 최근 대화 내역 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900">💬 최근 대화 내역</h3>
        <div className="space-y-3">
          {isLoading ? (
            <RecentChatSkeleton />
          ) : recentChats.length > 0 ? (
            recentChats.map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:from-gray-100 hover:to-blue-100 transition-all cursor-pointer border border-gray-200 hover:border-blue-200"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1">{item.time}</div>
                  <div className="text-gray-900 font-medium text-sm mb-1 truncate">"{item.message}"</div>
                  <div className="text-sm text-blue-600 font-medium">→ {item.result}</div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center py-8 text-gray-500"
            >
              <p className="text-3xl mb-3">💬</p>
              <p className="font-medium">아직 대화 내역이 없습니다</p>
              <p className="text-sm mt-2 text-gray-400">채팅으로 첫 가계부를 입력해보세요!</p>
            </motion.div>
          )}
        </div>
        <div className="mt-6 text-center">
          <Link 
            to="/chat" 
            className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            모든 대화 보기 →
          </Link>
        </div>
      </motion.div>
    </div>
  );
};