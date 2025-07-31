// Chat Orchestrator - LLM Intent 기반 라우팅

import { analyzeUserIntent, UserIntent, IntentAnalysisResult } from './intentAnalysis';
import { analyzeExpenseMessage } from './openai';
import { analyzeBudgetRequest, BudgetStore, Budget } from './budgetService';

export interface OrchestrationResult {
  success: boolean;
  intent: UserIntent;
  data?: any;
  response: string;
  actionType?: string;
  clarificationNeeded?: boolean;
  clarificationMessage?: string;
}

export const orchestrateChat = async (
  message: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
): Promise<OrchestrationResult> => {
  
  try {
    // Step 1: Intent Analysis
    console.log('🎯 Intent 분석 중...', message);
    const intentResult: IntentAnalysisResult = await analyzeUserIntent(message, conversationHistory);
    
    console.log('🎯 Intent 분석 결과:', intentResult);

    // Step 2: Route to appropriate LLM based on intent
    switch (intentResult.intent) {
      
      case UserIntent.EXPENSE_INCOME:
        return await handleExpenseIncome(message, conversationHistory, intentResult);
      
      case UserIntent.BUDGET_SETTING:
        return await handleBudgetSetting(message, intentResult);
      
      case UserIntent.GOAL_SETTING:
        return await handleGoalSetting(message, intentResult);
      
      case UserIntent.ANALYSIS_REQUEST:
        return await handleAnalysisRequest(message, intentResult);
      
      case UserIntent.GENERAL_INQUIRY:
        return await handleGeneralInquiry(message, intentResult);
      
      case UserIntent.ACCOUNT_MANAGEMENT:
        return await handleAccountManagement(message, intentResult);
      
      default:
        console.log('⚠️ 알 수 없는 Intent:', intentResult.intent, 'typeof:', typeof intentResult.intent);
        console.log('🔍 전체 intentResult:', intentResult);
        return {
          success: false,
          intent: intentResult.intent,
          response: '죄송해요, 요청을 이해하지 못했습니다. 다시 말씀해주시겠어요?',
          clarificationNeeded: true
        };
    }
    
  } catch (error) {
    console.error('Chat Orchestration Error:', error);
    return {
      success: false,
      intent: UserIntent.GENERAL_INQUIRY,
      response: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      clarificationNeeded: false
    };
  }
};

// 수입/지출 처리 (기존 로직)
const handleExpenseIncome = async (
  message: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>,
  intentResult: IntentAnalysisResult
): Promise<OrchestrationResult> => {
  
  console.log('💰 수입/지출 처리 중...');
  
  const expenseResult = await analyzeExpenseMessage(message, conversationHistory);
  
  console.log('💰 수입/지출 분석 결과:', expenseResult);
  
  if (expenseResult.success && expenseResult.expenses.length > 0) {
    // 예산에 반영 (지출인 경우)
    expenseResult.expenses.forEach(expense => {
      if (expense.type === 'expense') {
        BudgetStore.updateSpentAmount(expense.category, expense.amount);
      }
    });

    return {
      success: true,
      intent: UserIntent.EXPENSE_INCOME,
      data: expenseResult,
      response: expenseResult.expenses.length === 1 
        ? `"${message}"를 분석했어요! 혹시 이 내용이 맞나요?`
        : `"${message}"를 분석했어요! 총 ${expenseResult.expenses.length}건의 거래를 찾았어요. 맞나요?`,
      actionType: 'expense_confirmation'
    };
  }
  
  console.log('❌ 수입/지출 분석 실패:', {
    success: expenseResult.success,
    expenses: expenseResult.expenses,
    clarification_needed: expenseResult.clarification_needed,
    clarification_message: expenseResult.clarification_message
  });

  return {
    success: false,
    intent: UserIntent.EXPENSE_INCOME,
    response: expenseResult.clarification_message || '지출 내역을 정확히 이해하지 못했어요. 좀 더 구체적으로 말씀해주세요.',
    clarificationNeeded: true
  };
};

// 예산 설정 처리
const handleBudgetSetting = async (
  message: string,
  intentResult: IntentAnalysisResult
): Promise<OrchestrationResult> => {
  
  console.log('📊 예산 설정 처리 중...');
  
  const currentBudgets = BudgetStore.getBudgets();
  const budgetResult = await analyzeBudgetRequest(message, currentBudgets);
  
  if (budgetResult.success && budgetResult.budgets) {
    let responseMessage = '';
    
    switch (budgetResult.action) {
      case 'create':
        budgetResult.budgets.forEach(budgetData => {
          BudgetStore.createBudget(budgetData as Omit<Budget, 'id' | 'spent' | 'createdAt' | 'updatedAt'>);
        });
        responseMessage = `✅ ${budgetResult.budgets[0].categoryName} 예산을 월 ${budgetResult.budgets[0].amount?.toLocaleString()}원으로 설정했어요!`;
        break;
        
      case 'update':
        budgetResult.budgets.forEach(budgetData => {
          BudgetStore.updateBudget(budgetData.categoryName!, budgetData);
        });
        responseMessage = `✅ ${budgetResult.budgets[0].categoryName} 예산을 ${budgetResult.budgets[0].amount?.toLocaleString()}원으로 수정했어요!`;
        break;
        
      case 'delete':
        budgetResult.budgets.forEach(budgetData => {
          BudgetStore.deleteBudget(budgetData.categoryName!);
        });
        responseMessage = `✅ ${budgetResult.budgets[0].categoryName} 예산을 삭제했어요!`;
        break;
        
      case 'query':
        const budgetStatus = BudgetStore.getBudgetStatus();
        if (budgetStatus.length === 0) {
          responseMessage = '📊 아직 설정된 예산이 없어요. "식비 예산 30만원으로 설정해줘"와 같이 말씀해주세요!';
        } else {
          responseMessage = '📊 **현재 예산 현황**\n\n' + 
            budgetStatus.map(budget => 
              `**${budget.categoryName}**: ${budget.amount.toLocaleString()}원\n` +
              `└ 사용: ${budget.spent.toLocaleString()}원 (${budget.percentage.toFixed(1)}%)\n` +
              `└ 남은 금액: ${budget.remaining.toLocaleString()}원 ${budget.status === 'exceeded' ? '⚠️ 초과!' : budget.status === 'warning' ? '⚠️ 주의' : '✅'}`
            ).join('\n\n');
        }
        break;
    }
    
    return {
      success: true,
      intent: UserIntent.BUDGET_SETTING,
      data: budgetResult,
      response: responseMessage,
      actionType: budgetResult.action
    };
  }
  
  return {
    success: false,
    intent: UserIntent.BUDGET_SETTING,
    response: budgetResult.clarificationMessage || '예산 설정을 정확히 이해하지 못했어요. 예: "식비 예산 30만원으로 설정해줘"',
    clarificationNeeded: true
  };
};

// 목표 설정 처리 (향후 구현)
const handleGoalSetting = async (
  message: string,
  intentResult: IntentAnalysisResult
): Promise<OrchestrationResult> => {
  
  return {
    success: true,
    intent: UserIntent.GOAL_SETTING,
    response: '🎯 목표 설정 기능은 곧 출시될 예정이에요! 현재는 예산 설정을 이용해보세요.\n\n예: "식비 예산 30만원으로 설정해줘"',
    actionType: 'coming_soon'
  };
};

// 분석 요청 처리
const handleAnalysisRequest = async (
  message: string,
  intentResult: IntentAnalysisResult
): Promise<OrchestrationResult> => {
  
  // 간단한 현황 분석 제공
  const budgetStatus = BudgetStore.getBudgetStatus();
  
  if (budgetStatus.length === 0) {
    return {
      success: true,
      intent: UserIntent.ANALYSIS_REQUEST,
      response: '📊 현재 설정된 예산이 없어서 분석할 데이터가 부족해요.\n\n먼저 예산을 설정해보시겠어요? 예: "식비 예산 30만원으로 설정해줘"',
      actionType: 'no_data'
    };
  }
  
  const totalBudget = budgetStatus.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetStatus.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgetStatus.filter(b => b.status === 'exceeded').length;
  
  const analysisResponse = `📊 **이번 달 분석 결과**\n\n` +
    `💰 **전체 예산**: ${totalBudget.toLocaleString()}원\n` +
    `💸 **현재 지출**: ${totalSpent.toLocaleString()}원 (${((totalSpent/totalBudget)*100).toFixed(1)}%)\n` +
    `💵 **남은 예산**: ${(totalBudget-totalSpent).toLocaleString()}원\n\n` +
    `⚠️ **초과 카테고리**: ${overBudgetCount}개\n\n` +
    `**카테고리별 현황**:\n` +
    budgetStatus.map(budget => 
      `• ${budget.categoryName}: ${budget.percentage.toFixed(1)}% ${budget.status === 'exceeded' ? '🔴' : budget.status === 'warning' ? '🟡' : '🟢'}`
    ).join('\n');
  
  return {
    success: true,
    intent: UserIntent.ANALYSIS_REQUEST,
    response: analysisResponse,
    actionType: 'analysis_provided',
    data: { budgetStatus, totalBudget, totalSpent }
  };
};

// 일반 문의 처리
const handleGeneralInquiry = async (
  message: string,
  intentResult: IntentAnalysisResult
): Promise<OrchestrationResult> => {
  
  const helpResponse = `💬 **머니챗 사용법**\n\n` +
    `🎯 **할 수 있는 것들**:\n` +
    `• 지출/수입 기록: "어제 스벅에서 5천원 썼어"\n` +
    `• 예산 설정: "식비 예산 30만원으로 설정해줘"\n` +
    `• 예산 현황: "예산 현황 알려줘"\n` +
    `• 분석 요청: "이번 달 지출 분석해줘"\n\n` +
    `✨ 자연스럽게 대화하듯 말씀해주세요!`;
  
  return {
    success: true,
    intent: UserIntent.GENERAL_INQUIRY,
    response: helpResponse,
    actionType: 'help_provided'
  };
};

// 계정 관리 처리 (향후 구현)
const handleAccountManagement = async (
  message: string,
  intentResult: IntentAnalysisResult
): Promise<OrchestrationResult> => {
  
  return {
    success: true,
    intent: UserIntent.ACCOUNT_MANAGEMENT,
    response: '⚙️ 계정 관리 기능은 설정 페이지에서 이용하실 수 있어요!\n\n우측 상단의 설정 메뉴를 확인해보세요.',
    actionType: 'redirect_to_settings'
  };
};