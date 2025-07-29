import { DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';

export const DEFAULT_CATEGORIES = [
  // 수입 카테고리
  {
    name: '급여',
    color: '#4CAF50',
    icon: '💰',
    isSystem: true,
    isIncome: true,
  },
  {
    name: '용돈',
    color: '#8BC34A',
    icon: '💵',
    isSystem: true,
    isIncome: true,
  },
  {
    name: '투자수익',
    color: '#2196F3',
    icon: '📈',
    isSystem: true,
    isIncome: true,
  },
  
  // 지출 카테고리 - 필수 생활비
  {
    name: '식비',
    color: '#FF9800',
    icon: '🍽️',
    isSystem: true,
    isIncome: false,
    children: [
      { name: '외식', color: '#FF9800', icon: '🍽️' },
      { name: '배달음식', color: '#FF9800', icon: '🚚' },
      { name: '장보기', color: '#FF9800', icon: '🛒' },
      { name: '카페·음료', color: '#FF9800', icon: '☕' },
    ],
  },
  {
    name: '교통비',
    color: '#607D8B',
    icon: '🚗',
    isSystem: true,
    isIncome: false,
    children: [
      { name: '대중교통', color: '#607D8B', icon: '🚌' },
      { name: '택시', color: '#607D8B', icon: '🚕' },
      { name: '주유비', color: '#607D8B', icon: '⛽' },
      { name: '주차비', color: '#607D8B', icon: '🅿️' },
    ],
  },
  {
    name: '생활용품',
    color: '#9C27B0',
    icon: '🧴',
    isSystem: true,
    isIncome: false,
    children: [
      { name: '일용품', color: '#9C27B0', icon: '🧴' },
      { name: '화장품', color: '#9C27B0', icon: '💄' },
      { name: '의약품', color: '#9C27B0', icon: '💊' },
    ],
  },
  
  // 고정비
  {
    name: '주거비',
    color: '#795548',
    icon: '🏠',
    isSystem: true,
    isIncome: false,
    children: [
      { name: '월세·관리비', color: '#795548', icon: '🏠' },
      { name: '통신비', color: '#795548', icon: '📱' },
      { name: '전기요금', color: '#795548', icon: '⚡' },
      { name: '가스요금', color: '#795548', icon: '🔥' },
      { name: '수도요금', color: '#795548', icon: '💧' },
    ],
  },
  {
    name: '금융',
    color: '#F44336',
    icon: '🏦',
    isSystem: true,
    isIncome: false,
    children: [
      { name: '대출이자', color: '#F44336', icon: '🏦' },
      { name: '보험료', color: '#F44336', icon: '🛡️' },
      { name: '적금·투자', color: '#F44336', icon: '💎' },
    ],
  },
  
  // 여가·문화
  {
    name: '쇼핑',
    color: '#E91E63',
    icon: '🛍️',
    isSystem: true,
    isIncome: false,
    children: [
      { name: '의류', color: '#E91E63', icon: '👕' },
      { name: '신발·가방', color: '#E91E63', icon: '👜' },
      { name: '액세서리', color: '#E91E63', icon: '💍' },
    ],
  },
  {
    name: '문화·여가',
    color: '#3F51B5',
    icon: '🎯',
    isSystem: true,
    isIncome: false,
    children: [
      { name: '영화·공연', color: '#3F51B5', icon: '🎬' },
      { name: '운동', color: '#3F51B5', icon: '⚽' },
      { name: '여행', color: '#3F51B5', icon: '✈️' },
      { name: '취미', color: '#3F51B5', icon: '🎯' },
    ],
  },
  
  // 기타
  {
    name: '기타',
    color: '#9E9E9E',
    icon: '📦',
    isSystem: true,
    isIncome: false,
  },
];

export async function seedDefaultCategories(dataSource: DataSource): Promise<void> {
  const categoryRepository = dataSource.getRepository(Category);
  
  // 시스템 카테고리가 이미 존재하는지 확인
  const existingSystemCategories = await categoryRepository.count({
    where: { isSystem: true }
  });
  
  if (existingSystemCategories > 0) {
    console.log('기본 카테고리가 이미 존재합니다.');
    return;
  }
  
  console.log('기본 카테고리 생성 중...');
  
  for (const categoryData of DEFAULT_CATEGORIES) {
    const { children, ...parentData } = categoryData as any;
    
    // 부모 카테고리 생성
    const parentCategory = categoryRepository.create({
      ...parentData,
      userId: null, // 시스템 카테고리는 userId가 null
    });
    
    const savedParent = await categoryRepository.save(parentCategory) as unknown as Category;
    console.log(`카테고리 생성: ${savedParent.name}`);
    
    // 자식 카테고리 생성
    if (children && children.length > 0) {
      for (const childData of children) {
        const childCategory = categoryRepository.create({
          ...childData,
          userId: null,
          parentId: savedParent.id,
          isSystem: true,
          isIncome: parentData.isIncome,
        });
        
        const savedChild = await categoryRepository.save(childCategory) as unknown as Category;
        console.log(`  └─ 하위 카테고리 생성: ${savedChild.name}`);
      }
    }
  }
  
  console.log('기본 카테고리 생성 완료!');
}