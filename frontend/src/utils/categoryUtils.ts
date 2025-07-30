// 카테고리별 이모지 및 색상 매핑

export interface CategoryInfo {
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}

export const CATEGORY_MAP: Record<string, CategoryInfo> = {
  // 지출 카테고리
  '식비': {
    emoji: '🍽️',
    color: '#FF6B35',
    bgColor: '#FFF3F0',
    description: '음식 및 식당 관련 비용'
  },
  '교통': {
    emoji: '🚗',
    color: '#4ECDC4',
    bgColor: '#F0FDFC',
    description: '교통비, 주유비, 주차비'
  },
  '쇼핑': {
    emoji: '🛍️',
    color: '#FECA57',
    bgColor: '#FFFBF0',
    description: '의류, 생필품, 온라인 쇼핑'
  },
  '문화/여가': {
    emoji: '🎬',
    color: '#45B7D1',
    bgColor: '#F0F9FF',
    description: '영화, 도서, 여행, 게임'
  },
  '주거/통신': {
    emoji: '🏠',
    color: '#96CEB4',
    bgColor: '#F0FDF4',
    description: '관리비, 인터넷, 휴대폰'
  },
  '건강/의료': {
    emoji: '💊',
    color: '#FF9FF3',
    bgColor: '#FDF2FF',
    description: '병원, 약국, 건강식품'
  },
  '교육': {
    emoji: '📚',
    color: '#54A0FF',
    bgColor: '#F0F7FF',
    description: '학비, 교재, 온라인 강의'
  },
  '경조사': {
    emoji: '🎁',
    color: '#FF9F43',
    bgColor: '#FFF8F0',
    description: '결혼식, 장례식, 선물'
  },
  '기타': {
    emoji: '📦',
    color: '#8B8B8B',
    bgColor: '#F8F8F8',
    description: '기타 지출'
  },
  
  // 수입 카테고리
  '급여': {
    emoji: '💰',
    color: '#03C75A',
    bgColor: '#F0FDF4',
    description: '월급, 보너스, 성과급'
  },
  '부수입': {
    emoji: '💸',
    color: '#00D2FF',
    bgColor: '#F0FDFF',
    description: '프리랜싱, 아르바이트'
  },
  '기타수입': {
    emoji: '🎯',
    color: '#10AC84',
    bgColor: '#F0FDF9',
    description: '용돈, 선물, 환급'
  }
};

// 하위 카테고리별 이모지
export const SUBCATEGORY_MAP: Record<string, string> = {
  // 식비 하위
  '카페': '☕',
  '레스토랑': '🍽️',
  '마트/편의점': '🏪',
  '배달음식': '🚚',
  '점심': '🍱',
  '저녁': '🍽️',
  '간식': '🍪',
  '음료': '🥤',
  
  // 교통 하위
  '지하철/버스': '🚇',
  '대중교통': '🚌',
  '택시': '🚕',
  '주유비': '⛽',
  '주차비': '🅿️',
  
  // 쇼핑 하위
  '의류': '👕',
  '생필품': '🧴',
  '화장품': '💄',
  '전자제품': '📱',
  '생활용품': '🏠',
  
  // 문화/여가 하위
  '영화': '🎬',
  '도서': '📚',
  '여행': '✈️',
  '게임': '🎮',
  '스포츠': '⚽',
  
  // 주거/통신 하위
  '관리비': '🏢',
  '인터넷': '🌐',
  '휴대폰': '📱',
  '전기요금': '💡',
  '가스요금': '🔥',
  
  // 건강/의료 하위
  '병원': '🏥',
  '약국': '⚕️',
  '건강식품': '💊',
  '헬스장': '💪'
};

// 카테고리 정보 가져오기
export const getCategoryInfo = (category: string): CategoryInfo => {
  return CATEGORY_MAP[category] || CATEGORY_MAP['기타'];
};

// 하위 카테고리 이모지 가져오기
export const getSubcategoryEmoji = (subcategory: string): string => {
  return SUBCATEGORY_MAP[subcategory] || '📄';
};

// 카테고리와 하위 카테고리를 합친 표시명
export const getCategoryDisplay = (category: string, subcategory?: string): string => {
  const categoryInfo = getCategoryInfo(category);
  const subcategoryEmoji = subcategory ? getSubcategoryEmoji(subcategory) : '';
  
  if (subcategory && subcategory !== category) {
    return `${categoryInfo.emoji} ${category} > ${subcategoryEmoji} ${subcategory}`;
  }
  
  return `${categoryInfo.emoji} ${category}`;
};

// 전체 카테고리 목록 (선택 UI용)
export const getAllCategories = () => {
  return Object.entries(CATEGORY_MAP).map(([name, info]) => ({
    name,
    ...info
  }));
};

// 차트용 색상 배열
export const getChartColors = () => {
  return Object.values(CATEGORY_MAP).map(info => info.color);
};