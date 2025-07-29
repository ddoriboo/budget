// API 연결 테스트 스크립트
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ExpenseService } from '../modules/expense/expense.service';
import { CategoryService } from '../modules/category/category.service';

async function testAPI() {
  console.log('🚀 API 연결 테스트 시작...');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // 서비스 인스턴스 가져오기
    const expenseService = app.get(ExpenseService);
    const categoryService = app.get(CategoryService);
    
    console.log('✅ NestJS 애플리케이션 컨텍스트 생성 성공');
    
    // 1. 기본 카테고리 시드 데이터 초기화 테스트
    console.log('\n📁 기본 카테고리 초기화 테스트...');
    await categoryService.initializeDefaultCategories();
    console.log('✅ 기본 카테고리 초기화 완료');
    
    // 2. 시스템 카테고리 조회 테스트
    console.log('\n📋 시스템 카테고리 조회 테스트...');
    const systemCategories = await categoryService.getSystemCategories();
    console.log(`✅ 시스템 카테고리 ${systemCategories.length}개 조회 완료`);
    systemCategories.slice(0, 3).forEach(category => {
      console.log(`   - ${category.name} (${category.icon})`);
    });
    
    // 3. 테스트 사용자 지출 생성
    console.log('\n💰 테스트 지출 생성...');
    const testUserId = 'test-user-id';
    const testExpense = await expenseService.create({
      amount: 15000,
      place: '스타벅스',
      memo: 'API 테스트 아메리카노',
      expenseDate: new Date().toISOString().split('T')[0],
      confidenceScore: 1.0,
      metadata: {
        test: true,
        source: 'api-test-script'
      }
    }, testUserId);
    
    console.log(`✅ 테스트 지출 생성 완료: ID ${testExpense.id}`);
    
    // 4. 지출 목록 조회 테스트
    console.log('\n📊 지출 목록 조회 테스트...');
    const expensesList = await expenseService.findAll({}, testUserId);
    console.log(`✅ 지출 목록 조회 완료: 총 ${expensesList.total}개`);
    
    // 5. 월별 통계 테스트
    console.log('\n📈 월별 통계 조회 테스트...');
    const now = new Date();
    const stats = await expenseService.getMonthlyStats(
      testUserId, 
      now.getFullYear(), 
      now.getMonth() + 1
    );
    console.log(`✅ 월별 통계 조회 완료: 총액 ${stats.totalAmount}원, ${stats.totalExpenses}건`);
    
    // 6. 최근 지출 조회 테스트
    console.log('\n📝 최근 지출 조회 테스트...');
    const recentExpenses = await expenseService.getRecentExpenses(testUserId, 5);
    console.log(`✅ 최근 지출 ${recentExpenses.length}건 조회 완료`);
    
    console.log('\n🎉 모든 API 테스트 완료!');
    
    await app.close();
    
  } catch (error) {
    console.error('❌ API 테스트 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  testAPI().catch(console.error);
}

export { testAPI };