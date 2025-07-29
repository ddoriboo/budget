import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  DocumentArrowUpIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

interface UploadStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export const ExcelUpload = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps: UploadStep[] = [
    { id: 1, title: '파일 업로드', description: '엑셀 파일을 업로드하세요', completed: false },
    { id: 2, title: '컬럼 매핑', description: 'AI가 자동으로 컬럼을 분석합니다', completed: false },
    { id: 3, title: '데이터 검증', description: '대화형으로 데이터를 확인합니다', completed: false },
    { id: 4, title: '완료', description: '가계부에 데이터가 추가됩니다', completed: false },
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
        setCurrentStep(2);
        processFile(acceptedFiles[0]);
      }
    },
  });

  const processFile = async (file: File) => {
    setIsProcessing(true);
    
    // 시뮬레이션된 파일 처리
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCurrentStep(3);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">엑셀 파일 업로드</h1>
        <p className="text-gray-600 mt-2">
          카드사나 은행에서 다운로드한 거래 내역을 업로드하면, AI가 자동으로 분석하여 가계부에 등록해드립니다.
        </p>
      </div>

      {/* 진행 단계 */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep > step.id 
                  ? 'bg-primary border-primary text-white' 
                  : currentStep === step.id
                  ? 'border-primary text-primary bg-primary-50'
                  : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-px mx-4 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 단계별 콘텐츠 */}
      {currentStep === 1 && (
        <div className="card p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <DocumentArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg text-primary font-medium">파일을 여기에 놓으세요</p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  엑셀 파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-gray-500 mb-4">
                  .xlsx, .xls 형식의 파일을 지원합니다 (최대 10MB)
                </p>
                <button className="btn-primary">파일 선택</button>
              </>
            )}
          </div>
          
          <div className="mt-6 text-sm text-gray-600">
            <h3 className="font-medium mb-2">💡 지원하는 파일 형식:</h3>
            <ul className="space-y-1 ml-4">
              <li>• 신한카드, 삼성카드, 현대카드 등 모든 카드사 거래내역</li>
              <li>• 국민은행, 우리은행 등 모든 은행 거래내역</li>
              <li>• 사용자 정의 엑셀 파일 (날짜, 내용, 금액 컬럼 포함)</li>
            </ul>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">컬럼 매핑 중...</h2>
          {isProcessing ? (
            <div className="text-center py-8">
              <ArrowPathIcon className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-600">AI가 파일을 분석하고 있습니다...</p>
              <p className="text-sm text-gray-500 mt-2">
                {uploadedFile?.name} ({(uploadedFile?.size || 0 / 1024).toFixed(1)}KB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">컬럼 매핑 완료!</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  총 156개 행이 발견되었으며, 자동 매핑 신뢰도는 96%입니다.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">A</div>
                  <div className="text-sm text-gray-600">거래일자</div>
                  <div className="text-xs text-primary mt-1">→ 날짜</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">C</div>
                  <div className="text-sm text-gray-600">사용처</div>
                  <div className="text-xs text-primary mt-1">→ 내용</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">D</div>
                  <div className="text-sm text-gray-600">결제금액</div>
                  <div className="text-xs text-primary mt-1">→ 금액</div>
                </div>
              </div>

              <button 
                onClick={() => setCurrentStep(3)}
                className="btn-primary w-full"
              >
                데이터 검증 시작
              </button>
            </div>
          )}
        </div>
      )}

      {currentStep === 3 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">대화형 데이터 검증</h2>
          <p className="text-gray-600 mb-6">
            각 거래 내역을 하나씩 확인해보세요. AI가 자동으로 카테고리를 분류했습니다.
          </p>

          <div className="space-y-4">
            {[
              { date: '2024-07-28', place: '스타벅스 강남점', amount: -4500, category: '식비 > 카페', confidence: 98 },
              { date: '2024-07-28', place: '지하철공사', amount: -1370, category: '교통 > 지하철', confidence: 95 },
              { date: '2024-07-27', place: '롯데마트 본점', amount: -23400, category: '식비 > 마트', confidence: 89 },
            ].map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">{item.date}</div>
                    <div className="font-medium">{item.place}</div>
                    <div className={`font-bold ${item.amount < 0 ? 'text-red-600' : 'text-primary'}`}>
                      {item.amount.toLocaleString()}원
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    신뢰도 {item.confidence}%
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-600">카테고리: </span>
                    <span className="text-primary font-medium">{item.category}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-secondary btn-sm">수정</button>
                    <button className="btn-primary btn-sm">확인</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button className="btn-secondary">모두 확인</button>
            <button 
              onClick={() => setCurrentStep(4)}
              className="btn-primary"
            >
              3개 항목 확인 완료
            </button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="card p-8 text-center">
          <CheckCircleIcon className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">업로드 완료!</h2>
          <p className="text-gray-600 mb-6">
            총 156개의 거래 내역이 성공적으로 가계부에 추가되었습니다.
          </p>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">153</div>
              <div className="text-sm text-green-700">성공</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <div className="text-sm text-yellow-700">수정됨</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">0</div>
              <div className="text-sm text-red-700">실패</div>
            </div>
          </div>

          <div className="flex space-x-4 justify-center">
            <button 
              onClick={() => setCurrentStep(1)}
              className="btn-secondary"
            >
              다른 파일 업로드
            </button>
            <button className="btn-primary">대시보드로 이동</button>
          </div>
        </div>
      )}
    </div>
  );
};