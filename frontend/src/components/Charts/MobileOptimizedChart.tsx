import React, { useState } from 'react';
import { ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileOptimizedChartProps {
  children: React.ReactElement;
  title: string;
  isLoading?: boolean;
  className?: string;
  height?: string;
}

export const MobileOptimizedChart: React.FC<MobileOptimizedChartProps> = ({
  children,
  title,
  isLoading = false,
  className = "",
  height = "h-64 sm:h-80"
}) => {
  if (isLoading) {
    return (
      <div className={`card p-4 sm:p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className={`${height} bg-gray-100 rounded-lg flex items-center justify-center`}>
            <div className="text-gray-300">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`card p-4 sm:p-6 ${className}`}
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{title}</h2>
      <div className={height}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

interface MobileTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const MobileTooltip: React.FC<MobileTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-white p-2 sm:p-3 rounded-lg shadow-lg border text-xs sm:text-sm max-w-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: ₩{entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

interface SwipeableChartTabsProps {
  tabs: Array<{
    label: string;
    component: React.ReactNode;
  }>;
}

export const SwipeableChartTabs: React.FC<SwipeableChartTabsProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <div className="touch-pan-x">
      <div className="flex overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-hide">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex-shrink-0 px-4 py-2 mr-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === index
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {tabs[activeTab].component}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Mobile-specific chart configurations
export const mobileChartConfig = {
  margin: { top: 5, right: 5, left: 5, bottom: 5 },
  fontSize: 10,
  tickFontSize: 10,
  legendFontSize: 10,
};

// Enhanced chart wrapper for mobile with better touch handling
export const TouchOptimizedChartContainer: React.FC<{
  children: React.ReactNode;
  title: string;
}> = ({ children, title }) => (
  <div className="card overflow-hidden">
    <div className="p-4 sm:p-6 pb-2 sm:pb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="px-2 sm:px-6 pb-4 sm:pb-6">
      <div className="h-64 sm:h-80 -mx-2 sm:mx-0">
        {children}
      </div>
    </div>
  </div>
);