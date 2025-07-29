import { PlusIcon, ChatBubbleLeftRightIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* 웰컴 섹션 */}
      <div className="gradient-primary rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">안녕하세요, 김머니님! 👋</h1>
        <p className="text-primary-100 text-lg">
          오늘도 머니챗과 함께 스마트한 가계부 관리를 시작해보세요.
        </p>
      </div>

      {/* 이번 달 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">이번 달 지출</p>
              <p className="text-2xl font-bold text-red-500">₩1,234,567</p>
              <p className="text-sm text-gray-500 mt-1">예산 대비 67%</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-2xl">📉</span>
            </div>
          </div>
          <div className="mt-4 bg-gray-100 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: '67%' }}></div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">이번 달 수입</p>
              <p className="text-2xl font-bold text-primary">₩3,000,000</p>
              <p className="text-sm text-gray-500 mt-1">지난 달 대비 +5%</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-primary text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">잔액</p>
              <p className="text-2xl font-bold text-primary">₩1,765,433</p>
              <p className="text-sm text-gray-500 mt-1">목표까지 234,567원</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 버튼들 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">빠른 액션</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/chat"
            className="flex items-center p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors group"
          >
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-primary mr-3" />
            <div>
              <div className="font-medium text-gray-900 group-hover:text-primary">대화로 입력하기</div>
              <div className="text-sm text-gray-500">"어제 스벅에서 5천원 썼어"</div>
            </div>
          </Link>

          <Link
            to="/excel"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors group"
          >
            <DocumentArrowUpIcon className="w-8 h-8 text-gray-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">엑셀 업로드</div>
              <div className="text-sm text-gray-500">카드사 내역 한 번에 등록</div>
            </div>
          </Link>

          <button className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors group">
            <PlusIcon className="w-8 h-8 text-gray-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">직접 입력</div>
              <div className="text-sm text-gray-500">전통적인 폼 입력</div>
            </div>
          </button>
        </div>
      </div>

      {/* 최근 대화 내역 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">최근 대화 내역</h2>
        <div className="space-y-4">
          {[
            { time: '2시간 전', message: '점심으로 김치찌개 8천원 먹었어', result: '식비 > 한식, 8,000원' },
            { time: '어제', message: '지하철비 2천원', result: '교통 > 지하철, 2,000원' },
            { time: '3일 전', message: '스타벅스에서 아메리카노 4500원', result: '식비 > 카페, 4,500원' },
          ].map((item, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">{item.time}</div>
                <div className="text-gray-900 mt-1">"{item.message}"</div>
                <div className="text-sm text-primary mt-1">→ {item.result}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link to="/chat" className="text-primary hover:text-primary-600 text-sm font-medium">
            모든 대화 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
};