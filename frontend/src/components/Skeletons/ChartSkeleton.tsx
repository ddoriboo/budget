import React from 'react';

interface ChartSkeletonProps {
  height?: string;
  title?: boolean;
  legend?: boolean;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ 
  height = "320px", 
  title = true, 
  legend = false 
}) => (
  <div className="animate-pulse">
    {title && (
      <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
    )}
    <div 
      style={{ height }} 
      className="bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden"
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
      
      {/* Chart placeholder icon */}
      <div className="text-gray-300">
        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
        </svg>
      </div>
    </div>
    
    {legend && (
      <div className="mt-4 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    )}
  </div>
);

export const StatsCardSkeleton: React.FC = () => (
  <div className="card p-4 sm:p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-32 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
      </div>
    </div>
    <div className="mt-4">
      <div className="bg-gray-200 rounded-full h-2 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
      </div>
    </div>
  </div>
);

export const ExpenseListSkeleton: React.FC = () => (
  <div className="card overflow-hidden">
    {/* Desktop skeleton */}
    <div className="hidden lg:block">
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-7 gap-4 px-6 py-3">
          {['날짜', '장소', '카테고리', '금액', '메모', '신뢰도', '액션'].map((header, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded w-16"></div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid grid-cols-7 gap-4 px-6 py-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2"></div>
              <div className="h-3 bg-gray-200 rounded w-8"></div>
            </div>
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Mobile skeleton */}
    <div className="lg:hidden space-y-3 p-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4 animate-pulse">
          <div className="flex justify-between items-start mb-2">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-5 bg-gray-200 rounded-full w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const RecentChatSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
);