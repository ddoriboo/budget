import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';
import * as echarts from 'echarts';

// 예산 게이지 차트
export const BudgetGaugeChart = ({ percentage, amount, total }: { percentage: number; amount: number; total: number }) => {
  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'],
        radius: '100%',
        min: 0,
        max: 100,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.8, '#10B981'],
              [0.9, '#F59E0B'],
              [1, '#EF4444']
            ]
          }
        },
        pointer: {
          icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
          length: '75%',
          width: 16,
          offsetCenter: [0, '5%']
        },
        axisTick: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: 'auto',
            width: 5
          }
        },
        axisLabel: {
          color: '#464646',
          fontSize: 14,
          distance: -60,
          formatter: function (value: number) {
            return value + '%';
          }
        },
        title: {
          offsetCenter: [0, '-20%'],
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        },
        detail: {
          fontSize: 24,
          offsetCenter: [0, '0%'],
          valueAnimation: true,
          formatter: function (value: number) {
            return value.toFixed(1) + '%';
          },
          color: 'inherit'
        },
        data: [
          {
            value: percentage > 100 ? 100 : percentage,
            name: '예산 사용률',
            title: {
              offsetCenter: [0, '-20%']
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="relative">
      <ReactECharts option={option} style={{ height: '200px' }} />
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm text-gray-600">
          {amount.toLocaleString()}원 / {total.toLocaleString()}원
        </p>
      </div>
    </div>
  );
};

// 카테고리별 도넛 차트 - 컨테이너 최적화
export const CategoryDonutChart = ({ data }: { data: Array<{ name: string; value: number; color: string }> }) => {
  const totalAmount = data.reduce((sum, item) => sum + item.value, 0);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        const percentage = params.percent;
        const value = params.value;
        const formattedValue = value >= 10000 ? `${(value / 10000).toFixed(1)}만원` : `${value.toLocaleString()}원`;
        return `<strong>${params.name}</strong><br/>
                금액: ${formattedValue}<br/>
                비율: ${percentage}%`;
      },
      textStyle: {
        fontSize: 14
      }
    },
    legend: {
      type: 'scroll',
      top: '75%',
      left: 'center',
      selectedMode: false,
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 15,
      textStyle: {
        fontSize: 14,
        fontWeight: 500,
        color: '#374151'
      },
      formatter: function(name: string) {
        const item = data.find(d => d.name === name);
        if (item) {
          const formattedValue = item.value >= 10000 ? `${(item.value / 10000).toFixed(0)}만` : `${Math.floor(item.value / 1000)}k`;
          return `${name} ${formattedValue}`;
        }
        return name;
      }
    },
    series: [
      {
        name: '카테고리별 지출',
        type: 'pie',
        radius: ['40%', '65%'], // 크기 조정으로 컨테이너에 맞춤
        center: ['50%', '35%'], // 중심 위치 조정
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            color: '#1F2937',
            formatter: function(params: any) {
              const formattedValue = params.value >= 10000 ? `${(params.value / 10000).toFixed(1)}만원` : `${params.value.toLocaleString()}원`;
              return `${params.name}\n${formattedValue}`;
            },
            lineHeight: 18
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          scale: true,
          scaleSize: 3
        },
        labelLine: {
          show: false
        },
        data: data.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: item.color },
              { offset: 0.7, color: adjustColor(item.color, -15) },
              { offset: 1, color: adjustColor(item.color, -25) }
            ])
          }
        }))
      },
      // 중앙 총합 표시
      {
        type: 'pie',
        radius: ['0%', '35%'],
        center: ['50%', '35%'],
        silent: true,
        label: {
          show: true,
          position: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1F2937',
          formatter: function() {
            if (totalAmount === 0) return '지출 없음';
            const formattedTotal = totalAmount >= 10000 ? `${(totalAmount / 10000).toFixed(1)}만원` : `${totalAmount.toLocaleString()}원`;
            return `총 지출\n${formattedTotal}`;
          },
          lineHeight: 22
        },
        data: [{ value: 1, itemStyle: { color: 'transparent' } }]
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '100%', minHeight: '320px' }} />;
};

// 월별 트렌드 차트 - Gradient Stacked Area Chart
export const MonthlyTrendChart = ({ data }: { data: Array<{ month: string; expense: number; income: number }> }) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params: any) {
        let result = `${params[0].name}<br/>`;
        params.forEach((param: any) => {
          const value = param.value;
          const formattedValue = value >= 10000 ? `${(value / 10000).toFixed(1)}만원` : `${value.toLocaleString()}원`;
          result += `${param.marker} ${param.seriesName}: ${formattedValue}<br/>`;
        });
        // 순자산 변화 계산
        const netChange = params.find((p: any) => p.seriesName === '수입')?.value - params.find((p: any) => p.seriesName === '지출')?.value;
        const netChangeFormatted = netChange >= 0 ? `+${(netChange / 10000).toFixed(1)}만원` : `${(netChange / 10000).toFixed(1)}만원`;
        result += `<hr style="margin: 4px 0;"/><strong>순자산 변화: ${netChangeFormatted}</strong>`;
        return result;
      }
    },
    legend: {
      data: ['수입', '지출', '순자산'],
      top: 10,
      textStyle: {
        fontSize: 14,
        fontWeight: 500
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.month),
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisLabel: {
        color: '#6B7280',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: function(value: number) {
          return value >= 10000 ? `${(value / 10000).toFixed(0)}만` : `${value}`;
        },
        color: '#6B7280',
        fontSize: 11
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '수입',
        type: 'line',
        stack: 'total',
        smooth: true,
        data: data.map(d => d.income),
        showSymbol: false,
        lineStyle: {
          width: 0
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.8)' },
            { offset: 0.5, color: 'rgba(16, 185, 129, 0.4)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '지출',
        type: 'line',
        stack: 'total',
        smooth: true,
        data: data.map(d => -d.expense), // 음수로 표시해서 스택 효과
        showSymbol: false,
        lineStyle: {
          width: 0
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.8)' },
            { offset: 0.5, color: 'rgba(239, 68, 68, 0.4)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.1)' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: '순자산',
        type: 'line',
        smooth: true,
        data: data.map(d => d.income - d.expense),
        lineStyle: {
          width: 3,
          color: '#6366F1'
        },
        itemStyle: {
          color: '#6366F1'
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderColor: '#6366F1',
            borderWidth: 2,
            shadowColor: '#6366F1',
            shadowBlur: 10
          }
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '320px' }} />;
};

// 예산 vs 실제 지출 비교 차트
export const BudgetComparisonChart = ({ data }: { data: Array<{ category: string; budget: number; actual: number }> }) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        const category = params[0].name;
        const budget = params[0].value;
        const actual = params[1].value;
        const percentage = ((actual / budget) * 100).toFixed(1);
        return `${category}<br/>
                예산: ${budget.toLocaleString()}원<br/>
                실제: ${actual.toLocaleString()}원<br/>
                사용률: ${percentage}%`;
      }
    },
    legend: {
      data: ['예산', '실제 지출'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: function(value: number) {
          return (value / 10000) + '만';
        }
      }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.category)
    },
    series: [
      {
        name: '예산',
        type: 'bar',
        data: data.map(d => d.budget),
        itemStyle: {
          color: '#E5E7EB',
          borderRadius: [0, 4, 4, 0]
        }
      },
      {
        name: '실제 지출',
        type: 'bar',
        data: data.map(d => d.actual),
        itemStyle: {
          color: function(params: any) {
            const budget = data[params.dataIndex].budget;
            const actual = data[params.dataIndex].actual;
            const ratio = actual / budget;
            if (ratio > 1) return '#EF4444';
            if (ratio > 0.8) return '#F59E0B';
            return '#10B981';
          },
          borderRadius: [0, 4, 4, 0]
        },
        z: 10
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
};

// 일별 지출 히트맵
export const DailySpendingHeatmap = ({ data }: { data: Array<[string, number]> }) => {
  const year = new Date().getFullYear();
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const option = {
    tooltip: {
      position: 'top',
      formatter: function(params: any) {
        return `${params.data[0]}: ${params.data[1].toLocaleString()}원`;
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...data.map(d => d[1])),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      inRange: {
        color: ['#F3F4F6', '#FEE2E2', '#FBBF24', '#F59E0B', '#DC2626', '#991B1B']
      }
    },
    calendar: {
      range: year,
      left: 30,
      right: 30,
      cellSize: ['auto', 13],
      yearLabel: { show: false },
      monthLabel: {
        nameMap: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
      },
      dayLabel: {
        firstDay: 1,
        nameMap: ['일', '월', '화', '수', '목', '금', '토']
      }
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '200px' }} />;
};

// 통합 Money Flow Card - 핀테크 스타일
export const MoneyFlowCard = ({ 
  income, 
  expense, 
  budget, 
  budgetUsed, 
  daysLeft,
  chatSummary 
}: { 
  income: number; 
  expense: number; 
  budget: number; 
  budgetUsed: number; 
  daysLeft: number;
  chatSummary?: {
    recentActivity: string;
    spendingPattern: string;
    keyInsights: string[];
    recommendations: string[];
    totalTransactions: number;
    timeframe: string;
  } | null;
}) => {
  const remainingBudget = budget - budgetUsed;
  const budgetUtilization = budget > 0 ? (budgetUsed / budget) * 100 : 0;
  const netWorth = income - expense;
  const dailyAverage = remainingBudget > 0 && daysLeft > 0 ? remainingBudget / daysLeft : 0;
  
  // 시간 경과 vs 지출 경과 비교 (페이스 체크)
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysPassed = daysInMonth - daysLeft;
  const timeProgress = (daysPassed / daysInMonth) * 100;
  const spendingProgress = budgetUtilization;
  const paceRatio = spendingProgress / timeProgress;
  
  // 월말 예측
  const projectedSpending = budget > 0 ? (budgetUsed / daysPassed) * daysInMonth : expense * (daysInMonth / daysPassed);
  const projectedOverrun = projectedSpending - budget;

  const getFlowStatus = () => {
    if (paceRatio > 1.2) return { status: '위험', color: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
    if (paceRatio > 1.0) return { status: '주의', color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
    return { status: '양호', color: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
  };

  const flowStatus = getFlowStatus();

  const formatAmount = (amount: number) => {
    return amount >= 10000 ? `${(amount / 10000).toFixed(1)}만` : Math.floor(amount).toLocaleString();
  };

  return (
    <div className={`card p-6 lg:p-8 ${flowStatus.bg} ${flowStatus.border} border-2`}>
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">💰 이번 달 머니 플로우</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${flowStatus.bg} ${flowStatus.text} border ${flowStatus.border}`}>
          🚦 {flowStatus.status}
        </div>
      </div>

      {/* Money Flow 시각화 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. 수입 */}
        <div className="text-center p-4 bg-white rounded-lg border-2 border-green-200">
          <div className="text-2xl mb-2">💰</div>
          <div className="text-sm text-gray-600 mb-1">수입</div>
          <div className="text-lg font-bold text-green-600">+{formatAmount(income)}원</div>
        </div>

        {/* 2. 예산 */}
        <div className="text-center p-4 bg-white rounded-lg border-2 border-blue-200">
          <div className="text-2xl mb-2">🎯</div>
          <div className="text-sm text-gray-600 mb-1">예산</div>
          <div className="text-lg font-bold text-blue-600">{formatAmount(budget)}원</div>
          <div className="text-xs text-gray-500 mt-1">{budgetUtilization.toFixed(0)}% 사용</div>
        </div>

        {/* 3. 지출 */}
        <div className="text-center p-4 bg-white rounded-lg border-2 border-red-200">
          <div className="text-2xl mb-2">💸</div>
          <div className="text-sm text-gray-600 mb-1">지출</div>
          <div className="text-lg font-bold text-red-600">-{formatAmount(expense)}원</div>
        </div>

        {/* 4. 잔여 */}
        <div className="text-center p-4 bg-white rounded-lg border-2 border-purple-200">
          <div className="text-2xl mb-2">💎</div>
          <div className="text-sm text-gray-600 mb-1">잔여</div>
          <div className={`text-lg font-bold ${netWorth >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            {netWorth >= 0 ? '+' : ''}{formatAmount(netWorth)}원
          </div>
        </div>
      </div>

      {/* 상세 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI 활동 요약 */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">🤖</span>
            AI 활동 요약
          </h3>
          {chatSummary ? (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-800 leading-relaxed">
                  {chatSummary.recentActivity}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-purple-700 font-medium mb-1">지출 패턴</p>
                <p className="text-sm text-purple-800 leading-relaxed">
                  {chatSummary.spendingPattern}
                </p>
              </div>
              {chatSummary.keyInsights.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-2">핵심 인사이트</p>
                  <div className="space-y-1">
                    {chatSummary.keyInsights.slice(0, 2).map((insight, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-xs text-gray-700 leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-sm font-medium">분석할 활동이 없어요</p>
              <p className="text-xs mt-1 text-gray-400">채팅으로 가계부를 시작해보세요!</p>
            </div>
          )}
        </div>

        {/* 월말 예측 */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-900 mb-3">🔮 월말 예측</h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">예상 총 지출</div>
            <div className={`text-lg font-bold ${projectedOverrun > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(projectedSpending)}원
            </div>
            {projectedOverrun > 0 ? (
              <div className="text-sm text-red-600">
                ⚠️ {formatAmount(projectedOverrun)}원 초과 예상
              </div>
            ) : (
              <div className="text-sm text-green-600">
                ✅ 예산 내 달성 가능
              </div>
            )}
          </div>
        </div>

        {/* 액션 인사이트 */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-900 mb-3">💡 추천 액션</h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">일평균 권장 지출</div>
            <div className={`text-lg font-bold ${dailyAverage > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              {dailyAverage > 0 
                ? `${formatAmount(dailyAverage)}원/일`
                : '예산 조정 필요'
              }
            </div>
            <div className="text-xs">
              {projectedOverrun > 0 
                ? `📉 ${Math.ceil((projectedOverrun / daysLeft) / 1000)}천원/일 절약하면 예산 달성`
                : `🎯 현재 페이스 유지하면 ${formatAmount(budget - projectedSpending)}원 절약`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 예산 프로그레스 바 차트
export const BudgetProgressBar = ({ data }: { data: Array<{ category: string; budget: number; actual: number; color: string }> }) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        const dataIndex = params[0].dataIndex;
        const item = data[dataIndex];
        const percentage = item.budget > 0 ? ((item.actual / item.budget) * 100).toFixed(1) : '0.0';
        return `
          <strong>${item.category}</strong><br/>
          예산: ${item.budget.toLocaleString()}원<br/>
          사용: ${item.actual.toLocaleString()}원<br/>
          사용률: ${percentage}%
        `;
      }
    },
    grid: {
      left: '15%',
      right: '10%',
      top: '5%',
      bottom: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: function(value: any) {
        return Math.max(value.max * 1.1, 100); // 최소 표시 범위 보장
      },
      axisLabel: {
        formatter: function(value: number) {
          return value >= 10000 ? `${(value / 10000).toFixed(0)}만` : `${value}`;
        },
        fontSize: 11,
        color: '#6B7280'
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6',
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.category),
      axisLabel: {
        fontSize: 12,
        color: '#374151',
        width: 80,
        overflow: 'truncate'
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      }
    },
    series: [
      {
        name: '예산',
        type: 'bar',
        data: data.map(d => d.budget),
        itemStyle: {
          color: '#E5E7EB',
          borderRadius: [0, 6, 6, 0]
        },
        barWidth: 20,
        z: 1
      },
      {
        name: '실제 사용',
        type: 'bar',
        data: data.map((d, index) => ({
          value: d.actual,
          itemStyle: {
            color: function() {
              const ratio = d.actual / d.budget;
              if (ratio > 1) return '#EF4444';
              if (ratio > 0.8) return '#F59E0B';
              return d.color || '#10B981';
            }()
          }
        })),
        itemStyle: {
          borderRadius: [0, 6, 6, 0]
        },
        barWidth: 20,
        z: 2
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
};

// Smart Budget Tracker - 카테고리 우선순위 매트릭스
export const SmartBudgetTracker = ({ 
  budgetData 
}: { 
  budgetData: Array<{ category: string; budget: number; actual: number; color: string }>;
}) => {
  // 카테고리별 위험도 및 절약 잠재력 계산
  const categoryAnalysis = budgetData.map(item => {
    const utilizationRate = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
    const overrun = Math.max(0, item.actual - item.budget);
    const savingPotential = item.actual * 0.15; // 15% 절약 가능성 가정
    
    let riskLevel: 'safe' | 'warning' | 'danger' = 'safe';
    if (utilizationRate > 100) riskLevel = 'danger';
    else if (utilizationRate > 80) riskLevel = 'warning';

    return {
      ...item,
      utilizationRate,
      overrun,
      savingPotential,
      riskLevel,
      priority: (overrun + savingPotential) // 우선순위 점수
    };
  }).sort((a, b) => b.priority - a.priority);

  const formatAmount = (amount: number) => {
    return amount >= 10000 ? `${(amount / 10000).toFixed(1)}만` : Math.floor(amount).toLocaleString();
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'danger': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🔴' };
      case 'warning': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '🟡' };
      default: return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '🟢' };
    }
  };

  const totalSavingPotential = categoryAnalysis.reduce((sum, item) => sum + item.savingPotential, 0);
  const dangerCategories = categoryAnalysis.filter(item => item.riskLevel === 'danger');
  const warningCategories = categoryAnalysis.filter(item => item.riskLevel === 'warning');

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🎯 스마트 예산 트래커</h3>
        <div className="text-sm text-gray-500">
          절약 잠재력: <span className="font-bold text-green-600">{formatAmount(totalSavingPotential)}원</span>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-lg font-bold text-red-600">{dangerCategories.length}</div>
          <div className="text-sm text-red-700">위험</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-lg font-bold text-orange-600">{warningCategories.length}</div>
          <div className="text-sm text-orange-700">주의</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-lg font-bold text-green-600">{categoryAnalysis.length - dangerCategories.length - warningCategories.length}</div>
          <div className="text-sm text-green-700">양호</div>
        </div>
      </div>

      {/* 카테고리별 상세 분석 */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">카테고리별 위험도 분석</h4>
        {categoryAnalysis.slice(0, 6).map((item, index) => {
          const riskColor = getRiskColor(item.riskLevel);
          return (
            <div key={item.category} className={`p-4 rounded-lg border ${riskColor.bg} ${riskColor.border}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{riskColor.icon}</span>
                  <span className="font-medium text-gray-900">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${riskColor.text}`}>
                    {item.utilizationRate.toFixed(0)}% 사용
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatAmount(item.actual)}원 / {formatAmount(item.budget)}원
                  </div>
                </div>
              </div>
              
              {/* 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${item.riskLevel === 'danger' ? 'bg-red-500' : item.riskLevel === 'warning' ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(item.utilizationRate, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-sm">
                {item.overrun > 0 ? (
                  <span className="text-red-600">
                    ⚠️ {formatAmount(item.overrun)}원 초과
                  </span>
                ) : (
                  <span className="text-green-600">
                    ✅ {formatAmount(item.budget - item.actual)}원 남음
                  </span>
                )}
                <span className="text-blue-600">
                  💡 {formatAmount(item.savingPotential)}원 절약 가능
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 액션 추천 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">💡 이번 주 액션 플랜</h4>
        <div className="space-y-2">
          {categoryAnalysis.slice(0, 3).map((item, index) => (
            <div key={item.category} className="flex items-start space-x-2">
              <span className="font-bold text-blue-700">{index + 1}.</span>
              <div className="text-sm text-blue-800">
                <strong>{item.category}</strong>에서 
                {item.overrun > 0 
                  ? ` ${formatAmount(item.overrun)}원 줄이고`
                  : ` ${formatAmount(item.savingPotential)}원 절약하면`
                } 
                <strong> 월 {formatAmount(item.overrun + item.savingPotential)}원</strong> 개선 가능
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 기존 인사이트 카드 (간소화)
export const InsightsCard = ({ 
  topCategory, 
  topAmount, 
  totalExpenses, 
  averageDaily,
  lastMonthComparison 
}: { 
  topCategory: string; 
  topAmount: number; 
  totalExpenses: number; 
  averageDaily: number;
  lastMonthComparison: number;
}) => {
  const isIncreased = lastMonthComparison > 0;
  
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">📊 이번 달 트렌드</h3>
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🏆 최대 지출</h4>
          <p className="text-blue-700">
            <strong>{topCategory}</strong> {topAmount >= 10000 ? `${(topAmount / 10000).toFixed(1)}만원` : `${topAmount.toLocaleString()}원`}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            전체의 {((topAmount / totalExpenses) * 100).toFixed(1)}% 차지
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">📈 지출 패턴</h4>
          <p className="text-gray-700">
            일평균 <strong>{averageDaily >= 10000 ? `${(averageDaily / 10000).toFixed(1)}만원` : `${Math.floor(averageDaily).toLocaleString()}원`}</strong>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            전월 대비 {isIncreased ? '🔺' : '🔻'} {Math.abs(lastMonthComparison).toFixed(1)}% {isIncreased ? '증가' : '감소'}
          </p>
        </div>
      </div>
    </div>
  );
};

// AI 대화내역 요약 카드
export const ChatSummaryCard = ({ 
  summaryData 
}: { 
  summaryData: {
    recentActivity: string;
    spendingPattern: string;
    keyInsights: string[];
    recommendations: string[];
    totalTransactions: number;
    timeframe: string;
  } | null;
}) => {
  if (!summaryData) {
    return (
      <div className="bg-white rounded-lg p-6 border">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🤖</span>
          <h3 className="font-semibold text-gray-900">AI 활동 요약</h3>
        </div>
        <div className="text-center py-6 text-gray-500">
          <p className="text-3xl mb-3">💬</p>
          <p className="font-medium">분석할 활동이 없어요</p>
          <p className="text-sm mt-2 text-gray-400">채팅으로 가계부를 시작해보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🤖</span>
          <h3 className="font-semibold text-gray-900">AI 활동 요약</h3>
        </div>
        <div className="text-sm text-gray-500">
          {summaryData.timeframe} • {summaryData.totalTransactions}건
        </div>
      </div>

      {/* 최근 활동 요약 */}
      <div className="mb-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
            <span className="mr-2">📊</span>
            최근 활동
          </h4>
          <p className="text-blue-800 text-sm leading-relaxed">
            {summaryData.recentActivity}
          </p>
        </div>
      </div>

      {/* 지출 패턴 */}
      <div className="mb-4">
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-medium text-purple-900 mb-2 flex items-center">
            <span className="mr-2">🎯</span>
            지출 패턴
          </h4>
          <p className="text-purple-800 text-sm leading-relaxed">
            {summaryData.spendingPattern}
          </p>
        </div>
      </div>

      {/* 핵심 인사이트 */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          핵심 인사이트
        </h4>
        <div className="space-y-2">
          {summaryData.keyInsights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 추천사항 */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <span className="mr-2">🚀</span>
          추천사항
        </h4>
        <div className="space-y-2">
          {summaryData.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 색상 조정 헬퍼 함수
function adjustColor(color: string, amount: number): string {
  const clamp = (num: number) => Math.min(255, Math.max(0, num));
  
  // hex to rgb
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // adjust
  const newR = clamp(r + amount);
  const newG = clamp(g + amount);
  const newB = clamp(b + amount);
  
  // rgb to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}