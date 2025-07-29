import { useState, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { analyzeExpenseMessage } from '@/services/openai';
import { expenseStore, ChatSession } from '@/store/expenseStore';

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
      // 대화 컨텍스트 구성 (최근 10개 메시지만)
      const conversationHistory = updatedMessages
        .slice(-10)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      // 실제 OpenAI API 호출 (컨텍스트 포함)
      const analysisResult = await analyzeExpenseMessage(currentInput, conversationHistory);

      if (analysisResult.success && analysisResult.expenses.length > 0) {
        const expense = analysisResult.expenses[0]; // 첫 번째 지출 항목 사용

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `"${currentInput}"를 분석했어요! 혹시 이 내용이 맞나요?`,
          timestamp: new Date(),
          data: {
            amount: expense.amount,
            category: expense.category,
            subcategory: expense.subcategory,
            place: expense.place,
            date: expense.date,
            confidence: expense.confidence,
            memo: expense.memo
          }
        };
        
        const finalMessages = [...updatedMessages, aiResponse];
        setMessages(finalMessages);
        
        // 세션에 AI 응답 추가
        expenseStore.addMessageToSession(currentSession.id, aiResponse);
        
      } else if (analysisResult.clarification_needed) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: analysisResult.clarification_message || '죄송해요, 입력하신 내용을 정확히 이해하지 못했어요. 좀 더 구체적으로 말씀해주시겠어요?',
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

  const handleConfirmExpense = (_messageId: string, data: any) => {
    if (!currentSession) return;
    
    // 실제 데이터 저장
    const savedExpense = expenseStore.addExpense({
      date: data.date,
      amount: data.amount,
      category: data.category,
      subcategory: data.subcategory,
      place: data.place,
      memo: data.memo,
      confidence: data.confidence,
    });
    
    // 지출 확인 처리
    const confirmMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `✅ 지출 내역이 가계부에 저장되었습니다!\n\n${data.date} | ${data.place} | ${data.category} > ${data.subcategory} | ${data.amount.toLocaleString()}원`,
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
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900">대화형 가계부</h1>
        <p className="text-sm text-gray-500 mt-1">자유롭게 지출 내역을 말씀해주세요</p>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${
              message.type === 'user' 
                ? 'chat-bubble-user' 
                : 'chat-bubble-ai'
            }`}>
              <p className="text-sm">{message.content}</p>
              
              {/* AI 응답에 데이터가 있을 경우 확인 카드 표시 */}
              {message.type === 'ai' && message.data && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
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
                      <span className="font-medium">{message.data.category} {'>'} {message.data.subcategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">금액:</span>
                      <span className="font-medium text-red-600">-{message.data.amount.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">신뢰도:</span>
                      <span className="font-medium text-primary">{(message.data.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button 
                      onClick={() => handleConfirmExpense(message.id, message.data)}
                      className="btn-primary btn-sm flex-1"
                    >
                      확인
                    </button>
                    <button 
                      onClick={() => handleEditExpense(message.id, message.data)}
                      className="btn-secondary btn-sm flex-1"
                    >
                      수정
                    </button>
                  </div>
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
      </div>

      {/* 빠른 제안 버튼들 */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {['어제 스타벅스에서 아메리카노 5천원 마셨어', '점심으로 삼겹살 2만원 먹었어', '지하철비 1370원 결제했어', '이마트에서 생필품 3만원 샀어'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="자유롭게 말씀해주세요. 예: 어제 스타벅스에서 아메리카노 5천원 마셨어"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn-primary touch-target disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};