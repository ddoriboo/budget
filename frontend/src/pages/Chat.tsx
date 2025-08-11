import { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { analyzeExpenseMessage } from '@/services/openai';
import { expenseStore, ChatSession } from '@/store/expenseStore';
import { getCategoryDisplay } from '@/utils/categoryUtils';
import { orchestrateChat, OrchestrationResult } from '@/services/chatOrchestrator';
import { UserIntent } from '@/services/intentAnalysis';
import { renderSimpleMarkdown } from '@/utils/markdownUtils';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
}

export const Chat = () => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때마다 스크롤을 하단으로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트 초기화 시 현재 세션 로드 또는 새 세션 생성
  useEffect(() => {
    let session = expenseStore.getCurrentSession();
    if (!session) {
      session = expenseStore.createNewSession();
    }
    setCurrentSession(session);
    setMessages(session.messages);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const currentInput = inputValue;
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    // 세션에 사용자 메시지 추가
    expenseStore.addMessageToSession(currentSession.id, userMessage);

    try {
      // 거래 데이터 포함 메시지를 필터링하는 함수
      const filterTransactionMessages = (messages: Message[]) => {
        return messages.filter(msg => {
          // 사용자 메시지는 항상 포함
          if (msg.type === 'user') return true;
          
          // AI 메시지 중에서 거래 관련 데이터가 포함된 것들 제외
          if (msg.data?.multipleTransactions) return false; // 복수 거래 확인 메시지
          if (msg.data?.actionType === 'expense_confirmation') return false; // 단일 거래 확인 메시지
          
          // 확인/저장 관련 키워드가 포함된 메시지 제외
          const content = msg.content.toLowerCase();
          const transactionKeywords = [
            '저장되었습니다', '가계부에 저장', '내역이 저장', 
            '거래 1', '거래 2', '거래 3', '거래 4', '거래 5',
            '총 -', '총 +', '+원', '-원',
            '날짜:', '장소:', '카테고리:', '금액:', '메모:'
          ];
          
          const hasTransactionKeywords = transactionKeywords.some(keyword => 
            content.includes(keyword)
          );
          
          if (hasTransactionKeywords) return false;
          
          return true; // 일반적인 대화 메시지는 포함
        });
      };
      
      // 대화 컨텍스트 구성 (거래 데이터 제외하고 최근 10개 메시지만)
      const filteredMessages = filterTransactionMessages(updatedMessages);
      const conversationHistory = filteredMessages
        .slice(-10)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      
      console.log('🧹 필터링된 대화 이력:', {
        전체메시지: updatedMessages.length,
        필터링후: filteredMessages.length,
        컨텍스트: conversationHistory.length
      });

      // LLM Orchestration을 통한 분석
      const orchestrationResult: OrchestrationResult = await orchestrateChat(currentInput, conversationHistory);
      
      console.log('Orchestration 결과 상세:', {
        success: orchestrationResult.success,
        intent: orchestrationResult.intent,
        actionType: orchestrationResult.actionType,
        data: orchestrationResult.data
      });

      if (orchestrationResult.success) {
        // Intent에 따른 처리
        if (orchestrationResult.intent === UserIntent.EXPENSE_INCOME && orchestrationResult.data?.expenses) {
          // 기존 수입/지출 처리 로직
          const analysisResult = orchestrationResult.data;
        // 여러 개의 거래가 있는 경우 모두 표시
        if (analysisResult.expenses.length === 1) {
          // 단일 거래 처리 (기존 로직)
          const expense = analysisResult.expenses[0];
          const isIncome = expense.type === 'income';
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: isIncome 
              ? `"${currentInput}"를 분석했어요! 수입 내역이 맞나요?`
              : `"${currentInput}"를 분석했어요! 혹시 이 내용이 맞나요?`,
            timestamp: new Date(),
            data: {
              amount: expense.amount,
              category: expense.category,
              subcategory: expense.subcategory,
              place: expense.place,
              date: expense.date,
              confidence: expense.confidence,
              memo: expense.memo,
              type: expense.type
            }
          };
          
          const finalMessages = [...updatedMessages, aiResponse];
          setMessages(finalMessages);
          
          // 세션에 AI 응답 추가
          expenseStore.addMessageToSession(currentSession.id, aiResponse);
        } else {
          // 복수 거래 처리
          const expenseCount = analysisResult.expenses.filter((e: any) => e.type === 'expense').length;
          const incomeCount = analysisResult.expenses.filter((e: any) => e.type === 'income').length;
          
          let summaryText = `"${currentInput}"를 분석했어요! `;
          if (expenseCount > 0 && incomeCount > 0) {
            summaryText += `총 ${expenseCount}건의 지출과 ${incomeCount}건의 수입을 찾았어요. 맞나요?`;
          } else if (expenseCount > 0) {
            summaryText += `총 ${expenseCount}건의 지출 내역을 찾았어요. 맞나요?`;
          } else {
            summaryText += `총 ${incomeCount}건의 수입 내역을 찾았어요. 맞나요?`;
          }
          
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: summaryText,
            timestamp: new Date(),
            data: {
              multipleTransactions: true,
              transactions: analysisResult.expenses
            }
          };
          
          const finalMessages = [...updatedMessages, aiResponse];
          setMessages(finalMessages);
          
          // 세션에 AI 응답 추가
          expenseStore.addMessageToSession(currentSession.id, aiResponse);
        }
        } else {
          // 다른 Intent들 (예산 설정, 분석 요청 등)
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: orchestrationResult.response,
            timestamp: new Date(),
            data: orchestrationResult.data
          };
          
          const finalMessages = [...updatedMessages, aiResponse];
          setMessages(finalMessages);
          
          // 세션에 AI 응답 추가
          expenseStore.addMessageToSession(currentSession.id, aiResponse);
        }
        
      } else if (orchestrationResult.clarificationNeeded) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: orchestrationResult.clarificationMessage || orchestrationResult.response,
          timestamp: new Date(),
        };
        
        const finalMessages = [...updatedMessages, aiResponse];
        setMessages(finalMessages);
        
        // 세션에 AI 응답 추가
        expenseStore.addMessageToSession(currentSession.id, aiResponse);
        
      } else {
        throw new Error('분석 결과가 없습니다.');
      }
    } catch (error) {
      console.error('분석 오류:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '죄송해요, 지금 일시적으로 분석이 어려워요. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      };
      
      const finalMessages = [...updatedMessages, errorResponse];
      setMessages(finalMessages);
      
      // 세션에 에러 응답 추가
      expenseStore.addMessageToSession(currentSession.id, errorResponse);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConfirmExpense = async (_messageId: string, data: any) => {
    if (!currentSession) return;
    
    if (data.multipleTransactions && data.transactions) {
      // 복수 거래 저장
      const savedExpenses = await Promise.all(
        data.transactions.map(async (transaction: any) => {
          return await expenseStore.addExpense({
            date: transaction.date,
            amount: transaction.amount,
            category: transaction.category,
            subcategory: transaction.subcategory,
            place: transaction.place,
            memo: transaction.memo,
            confidence: transaction.confidence,
            type: transaction.type || 'expense',
          });
        })
      );
      
      // 요약 메시지 생성
      const expenseCount = data.transactions.filter((t: any) => t.type === 'expense').length;
      const incomeCount = data.transactions.filter((t: any) => t.type === 'income').length;
      const totalExpense = data.transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalIncome = data.transactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      let summaryContent = `✅ 모든 내역이 가계부에 저장되었습니다!\n\n`;
      if (expenseCount > 0) {
        summaryContent += `지출: ${expenseCount}건, 총 -${totalExpense.toLocaleString()}원\n`;
      }
      if (incomeCount > 0) {
        summaryContent += `수입: ${incomeCount}건, 총 +${totalIncome.toLocaleString()}원\n`;
      }
      
      summaryContent += '\n저장된 내역:\n';
      data.transactions.forEach((t: any) => {
        summaryContent += `• ${t.place} | ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}원\n`;
      });
      
      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: summaryContent,
        timestamp: new Date(),
      };
      
      const updatedMessages = [...messages, confirmMessage];
      setMessages(updatedMessages);
      
      // 세션에 확인 메시지 추가
      expenseStore.addMessageToSession(currentSession.id, confirmMessage);
      
      // 성공 토스트
      toast.success(`${data.transactions.length}건의 내역이 저장되었습니다!`, {
        icon: '✅',
        duration: 3000,
      });
      
      console.log('저장된 데이터:', savedExpenses);
    } else {
      // 단일 거래 저장 (기존 로직)
      const savedExpense = await expenseStore.addExpense({
        date: data.date,
        amount: data.amount,
        category: data.category,
        subcategory: data.subcategory,
        place: data.place,
        memo: data.memo,
        confidence: data.confidence,
        type: data.type || 'expense',
      });
      
      // 지출/수입 확인 처리
      const isIncome = data.type === 'income';
      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: isIncome 
          ? `✅ 수입 내역이 가계부에 저장되었습니다!\n\n${data.date} | ${data.place} | ${data.category} > ${data.subcategory} | +${data.amount.toLocaleString()}원`
          : `✅ 지출 내역이 가계부에 저장되었습니다!\n\n${data.date} | ${data.place} | ${data.category} > ${data.subcategory} | -${data.amount.toLocaleString()}원`,
        timestamp: new Date(),
      };
      
      const updatedMessages = [...messages, confirmMessage];
      setMessages(updatedMessages);
      
      // 세션에 확인 메시지 추가
      expenseStore.addMessageToSession(currentSession.id, confirmMessage);
      
      // 성공 토스트
      toast.success('가계부에 저장되었습니다!', {
        icon: '✅',
        duration: 3000,
      });
      
      console.log('저장된 데이터:', savedExpense);
    }
  };

  const handleEditExpense = (_messageId: string, _data: any) => {
    if (!currentSession) return;
    
    // 지출 수정 처리
    const editMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `어떤 부분을 수정하시겠어요? 예: "금액을 8천원으로 바꿔줘", "카테고리를 교통으로 바꿔줘"`,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, editMessage];
    setMessages(updatedMessages);
    
    // 세션에 수정 요청 메시지 추가
    expenseStore.addMessageToSession(currentSession.id, editMessage);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm">
      {/* 채팅 헤더 */}
      <div className="border-b border-gray-200 p-3 sm:p-4">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">대화형 가계부</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">자유롭게 지출 내역을 말씀해주세요</p>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md ${
              message.type === 'user' 
                ? 'chat-bubble-user' 
                : 'chat-bubble-ai'
            }`}>
              <div className="text-sm">{renderSimpleMarkdown(message.content)}</div>
              
              {/* AI 응답에 데이터가 있을 경우 확인 카드 표시 */}
              {message.type === 'ai' && message.data && (message.data.amount || message.data.multipleTransactions) && (
                <div className="mt-3">
                  {message.data.multipleTransactions ? (
                    // 복수 거래 표시
                    <>
                      <div className="space-y-2">
                        {message.data.transactions.map((transaction: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                            <div className="text-xs text-gray-600 mb-2">거래 {index + 1}</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">날짜:</span>
                                <span className="font-medium">{transaction.date}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">장소:</span>
                                <span className="font-medium">{transaction.place}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">카테고리:</span>
                                <span className="font-medium">{getCategoryDisplay(transaction.category, transaction.subcategory)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">금액:</span>
                                <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                  {transaction.type === 'income' ? '+' : '-'}{transaction.amount?.toLocaleString() || '0'}원
                                </span>
                              </div>
                              {transaction.memo && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">메모:</span>
                                  <span className="font-medium">{transaction.memo}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                        <button 
                          onClick={() => handleConfirmExpense(message.id, message.data)}
                          className="btn-primary touch-button flex-1 min-h-[44px] text-sm sm:text-base"
                        >
                          모두 확인
                        </button>
                        <button 
                          onClick={() => handleEditExpense(message.id, message.data)}
                          className="btn-secondary touch-button flex-1 min-h-[44px] text-sm sm:text-base"
                        >
                          수정
                        </button>
                      </div>
                    </>
                  ) : (
                    // 단일 거래 표시 (기존 코드)
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="text-xs text-gray-600 mb-2">분석 결과</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">날짜:</span>
                          <span className="font-medium">{message.data.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">장소:</span>
                          <span className="font-medium">{message.data.place}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">카테고리:</span>
                          <span className="font-medium">{getCategoryDisplay(message.data.category, message.data.subcategory)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">금액:</span>
                          <span className={`font-medium ${message.data.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.data.type === 'income' ? '+' : '-'}{message.data.amount?.toLocaleString() || '0'}원
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">신뢰도:</span>
                          <span className="font-medium text-primary">{((message.data.confidence || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                        <button 
                          onClick={() => handleConfirmExpense(message.id, message.data)}
                          className="btn-primary touch-button flex-1 min-h-[44px] text-sm sm:text-base"
                        >
                          확인
                        </button>
                        <button 
                          onClick={() => handleEditExpense(message.id, message.data)}
                          className="btn-secondary touch-button flex-1 min-h-[44px] text-sm sm:text-base"
                        >
                          수정
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-xs opacity-70 mt-2">
                {new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai">
              <div className="loading-dots">
                <div style={{ '--i': 0 } as any}></div>
                <div style={{ '--i': 1 } as any}></div>
                <div style={{ '--i': 2 } as any}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* 자동 스크롤을 위한 참조 div */}
        <div ref={messagesEndRef} />
      </div>

      {/* 빠른 제안 버튼들 */}
      <div className="border-t border-gray-100 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            '스타벅스 아메리카노 5천원',
            '점심 삼겹살 2만원',
            '영화 1만5천원',
            '월급 300만원 들어왔어'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              className="touch-button px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-xs sm:text-sm text-gray-700 transition-colors min-h-[40px] sm:min-h-[44px]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 p-3 sm:p-4 bg-white">
        <div className="flex space-x-2 sm:space-x-3">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="예: 스타벅스 아메리카노 5천원"
              className="touch-input w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[52px] sm:min-h-[48px] text-base"
              rows={1}
              style={{
                fontSize: '16px', // iOS Safari zoom 방지
                lineHeight: '1.4'
              }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn-primary touch-button disabled:opacity-50 disabled:cursor-not-allowed min-w-[52px] min-h-[52px] sm:min-w-[48px] sm:min-h-[48px] flex items-center justify-center flex-shrink-0"
          >
            <PaperAirplaneIcon className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};