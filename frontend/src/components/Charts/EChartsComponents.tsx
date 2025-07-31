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

// 카테고리별 도넛 차트
export const CategoryDonutChart = ({ data }: { data: Array<{ name: string; value: number; color: string }> }) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}원 ({d}%)'
    },
    legend: {
      top: '5%',
      left: 'center',
      selectedMode: false
    },
    series: [
      {
        name: '카테고리별 지출',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            formatter: '{b}\\n{c}원'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
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
              { offset: 1, color: adjustColor(item.color, -20) }
            ])
          }
        }))
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
};

// 월별 트렌드 차트
export const MonthlyTrendChart = ({ data }: { data: Array<{ month: string; expense: number; income: number }> }) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    legend: {
      data: ['지출', '수입'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: data.map(d => d.month),
        axisPointer: {
          type: 'shadow'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '금액 (원)',
        axisLabel: {
          formatter: function(value: number) {
            return (value / 10000) + '만';
          }
        }
      }
    ],
    series: [
      {
        name: '지출',
        type: 'line',
        smooth: true,
        data: data.map(d => d.expense),
        itemStyle: {
          color: '#EF4444'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.1)' }
          ])
        }
      },
      {
        name: '수입',
        type: 'line',
        smooth: true,
        data: data.map(d => d.income),
        itemStyle: {
          color: '#10B981'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
          ])
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
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