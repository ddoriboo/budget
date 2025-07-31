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

// 카테고리별 도넛 차트 - 확대 및 개선
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
      top: '85%',
      left: 'center',
      selectedMode: false,
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 20,
      textStyle: {
        fontSize: 16,
        fontWeight: 500,
        color: '#374151'
      },
      formatter: function(name: string) {
        const item = data.find(d => d.name === name);
        if (item) {
          const formattedValue = item.value >= 10000 ? `${(item.value / 10000).toFixed(1)}만` : `${item.value.toLocaleString()}`;
          return `${name} (${formattedValue}원)`;
        }
        return name;
      }
    },
    series: [
      {
        name: '카테고리별 지출',
        type: 'pie',
        radius: ['45%', '75%'], // 크기 확대 (기존 40%-70% → 45%-75%)
        center: ['50%', '40%'], // 중심을 위로 이동해서 legend 공간 확보
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1F2937',
            formatter: function(params: any) {
              const formattedValue = params.value >= 10000 ? `${(params.value / 10000).toFixed(1)}만원` : `${params.value.toLocaleString()}원`;
              return `${params.name}\n${formattedValue}\n${params.percent}%`;
            },
            lineHeight: 20
          },
          itemStyle: {
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          scale: true,
          scaleSize: 5
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
              { offset: 1, color: adjustColor(item.color, -30) }
            ])
          }
        }))
      },
      // 중앙 총합 표시용 숨겨진 시리즈
      {
        type: 'pie',
        radius: ['0%', '40%'],
        center: ['50%', '40%'],
        silent: true,
        label: {
          show: true,
          position: 'center',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1F2937',
          formatter: function() {
            const formattedTotal = totalAmount >= 10000 ? `${(totalAmount / 10000).toFixed(1)}만원` : `${totalAmount.toLocaleString()}원`;
            return `총 지출\n${formattedTotal}`;
          },
          lineHeight: 30
        },
        data: [{ value: 1, itemStyle: { color: 'transparent' } }]
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '420px' }} />; // 높이 증가
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

// 메인 KPI 통합 카드
export const MainKPICard = ({ 
  income, 
  expense, 
  budget, 
  budgetUsed, 
  daysLeft 
}: { 
  income: number; 
  expense: number; 
  budget: number; 
  budgetUsed: number; 
  daysLeft: number; 
}) => {
  const remainingBudget = budget - budgetUsed;
  const dailyAverage = remainingBudget > 0 && daysLeft > 0 ? remainingBudget / daysLeft : 0;
  const budgetUtilization = budget > 0 ? (budgetUsed / budget) * 100 : 0;
  const netWorth = income - expense;

  const getStatusColor = () => {
    if (budgetUtilization > 100) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', accent: '#EF4444' };
    if (budgetUtilization > 80) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', accent: '#F59E0B' };
    return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', accent: '#10B981' };
  };

  const statusColor = getStatusColor();

  return (
    <div className={`card p-6 lg:p-8 ${statusColor.bg} ${statusColor.border} border-2`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 수입/지출/순자산 */}
        <div className="space-y-4">
          <div className="text-center lg:text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">이번 달 현황</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">💰 수입</span>
                <span className="text-lg font-bold text-green-600">
                  +{income >= 10000 ? `${(income / 10000).toFixed(1)}만` : income.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">💸 지출</span>
                <span className="text-lg font-bold text-red-600">
                  -{expense >= 10000 ? `${(expense / 10000).toFixed(1)}만` : expense.toLocaleString()}원
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">💎 순자산</span>
                  <span className={`text-xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netWorth >= 0 ? '+' : ''}{netWorth >= 10000 ? `${(netWorth / 10000).toFixed(1)}만` : netWorth.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 중앙: 예산 사용률 */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={statusColor.accent}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(budgetUtilization / 100) * 339.292} 339.292`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${statusColor.text}`}>
                {budgetUtilization.toFixed(0)}%
              </span>
              <span className="text-xs text-gray-500">예산 사용률</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {budget >= 10000 ? `${(budgetUsed / 10000).toFixed(1)}만` : budgetUsed.toLocaleString()}원 / {budget >= 10000 ? `${(budget / 10000).toFixed(1)}만` : budget.toLocaleString()}원
          </p>
        </div>

        {/* 우측: 남은 예산 & 일평균 */}
        <div className="space-y-4">
          <div className="text-center lg:text-right">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">예산 분석</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">🎯 남은 예산</p>
                <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {remainingBudget >= 0 ? '' : '-'}{Math.abs(remainingBudget) >= 10000 ? `${(Math.abs(remainingBudget) / 10000).toFixed(1)}만` : Math.abs(remainingBudget).toLocaleString()}원
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">📅 남은 일수</p>
                <p className="text-lg font-semibold text-gray-900">{daysLeft}일</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500">일평균 사용 가능</p>
                <p className={`text-lg font-bold ${dailyAverage > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                  {dailyAverage > 0 
                    ? `${dailyAverage >= 10000 ? `${(dailyAverage / 10000).toFixed(1)}만` : Math.floor(dailyAverage).toLocaleString()}원/일`
                    : '예산 초과'
                  }
                </p>
              </div>
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

// 인사이트 카드 컴포넌트
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
      <h3 className="text-lg font-semibold mb-4 text-gray-900">💡 이번 달 인사이트</h3>
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🏆 최대 지출 카테고리</h4>
          <p className="text-blue-700">
            <strong>{topCategory}</strong>에서 <strong>{topAmount >= 10000 ? `${(topAmount / 10000).toFixed(1)}만원` : `${topAmount.toLocaleString()}원`}</strong> 사용
          </p>
          <p className="text-sm text-blue-600 mt-1">
            전체 지출의 {((topAmount / totalExpenses) * 100).toFixed(1)}%를 차지
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">📊 지출 패턴</h4>
          <p className="text-green-700">
            일평균 <strong>{averageDaily >= 10000 ? `${(averageDaily / 10000).toFixed(1)}만원` : `${Math.floor(averageDaily).toLocaleString()}원`}</strong> 지출
          </p>
          <p className="text-sm text-green-600 mt-1">
            지난달 대비 {isIncreased ? '🔺' : '🔻'} {Math.abs(lastMonthComparison).toFixed(1)}% {isIncreased ? '증가' : '감소'}
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">💰 절약 팁</h4>
          <p className="text-yellow-700 text-sm">
            {topCategory} 지출을 10% 줄이면 월 {Math.floor(topAmount * 0.1).toLocaleString()}원 절약 가능!
          </p>
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