/* 
===========================================
네이버 가계부 V2 엑셀 업로드 JavaScript
===========================================
*/

let currentStep = 1;
let uploadedFile = null;
let mappingData = null;
let verificationData = null;

document.addEventListener('DOMContentLoaded', function() {
    initExcelUpload();
});

function initExcelUpload() {
    // 기본 초기화
    initSidebarToggle();
    initFileUpload();
    initStepNavigation();
    
    // 첫 번째 단계 표시
    showStep(1);
}

// 사이드바 토글 (공통 기능)
function initSidebarToggle() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    
    if (sidebarToggle && sidebar && backdrop) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            backdrop.classList.toggle('open');
        });
        
        backdrop.addEventListener('click', function() {
            sidebar.classList.remove('open');
            backdrop.classList.remove('open');
        });
    }
}

// 파일 업로드 초기화
function initFileUpload() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    
    if (dropzone && fileInput) {
        // 드래그 앤 드롭 이벤트
        dropzone.addEventListener('dragover', handleDragOver);
        dropzone.addEventListener('dragleave', handleDragLeave);
        dropzone.addEventListener('drop', handleFileDrop);
        dropzone.addEventListener('click', () => fileInput.click());
        
        // 파일 선택 이벤트
        fileInput.addEventListener('change', handleFileSelect);
    }
}

// 드래그 오버 처리
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    this.classList.add('dragover');
}

// 드래그 리브 처리
function handleDragLeave(e) {
    e.preventDefault();
    this.classList.remove('dragover');
}

// 파일 드롭 처리
function handleFileDrop(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// 파일 선택 처리
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// 파일 처리
function processFile(file) {
    // 파일 유효성 검사
    if (!validateFile(file)) {
        return;
    }
    
    uploadedFile = file;
    
    // 업로드 시뮬레이션
    showUploadProgress();
    
    setTimeout(() => {
        // 분석 시뮬레이션
        simulateFileAnalysis(file);
    }, 2000);
}

// 파일 유효성 검사
function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ];
    
    if (file.size > maxSize) {
        showToast('파일 크기가 10MB를 초과합니다.', 'error');
        return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
        showToast('지원하지 않는 파일 형식입니다.', 'error');
        return false;
    }
    
    return true;
}

// 업로드 진행률 표시
function showUploadProgress() {
    const dropzone = document.getElementById('dropzone');
    
    if (dropzone) {
        dropzone.innerHTML = `
            <div class="upload-progress">
                <div class="upload-icon">📤</div>
                <div class="upload-text">
                    <div class="upload-filename">${uploadedFile.name}</div>
                    <div class="upload-status">업로드 중...</div>
                </div>
                <div class="progress">
                    <div class="progress-bar upload-progress-bar" style="width: 0%"></div>
                </div>
            </div>
        `;
        
        // 진행률 애니메이션
        const progressBar = dropzone.querySelector('.upload-progress-bar');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // 분석 상태로 변경
                setTimeout(() => {
                    const statusText = dropzone.querySelector('.upload-status');
                    if (statusText) {
                        statusText.textContent = 'AI가 파일을 분석하고 있어요...';
                    }
                }, 500);
            }
            
            progressBar.style.width = progress + '%';
        }, 200);
    }
}

// 파일 분석 시뮬레이션
function simulateFileAnalysis(file) {
    // 분석 결과 시뮬레이션
    mappingData = {
        fileName: file.name,
        totalRows: 156,
        columns: [
            { excel: 'A', name: '거래일자', field: 'date', mapped: true },
            { excel: 'B', name: '사용처', field: 'place', mapped: true },
            { excel: 'C', name: '금액', field: 'amount', mapped: true },
            { excel: 'D', name: '구분', field: 'category', mapped: true },
            { excel: 'E', name: '메모', field: 'memo', mapped: true }
        ],
        sampleData: [
            {
                date: '2025-07-15',
                place: 'GS25 강남점',
                amount: 3500,
                category: '생활용품',
                memo: '물티슈 구입'
            },
            {
                date: '2025-07-16',
                place: '스타벅스',
                amount: 4500,
                category: '카페/음료',
                memo: '아메리카노'
            },
            {
                date: '2025-07-17',
                place: '이마트',
                amount: 45600,
                category: '식비',
                memo: '주간 장보기'
            }
        ]
    };
    
    showToast('파일 분석이 완료되었습니다!', 'success');
    goToStep(2);
}

// 단계 네비게이션 초기화
function initStepNavigation() {
    // 단계별 네비게이션 이벤트는 개별 함수에서 처리
}

// 단계 이동
function goToStep(step) {
    if (step < 1 || step > 4) return;
    
    // 이전 단계 비활성화
    const prevStep = document.querySelector(`.step[data-step="${currentStep}"]`);
    if (prevStep) {
        prevStep.classList.remove('active');
        if (step > currentStep) {
            prevStep.classList.add('completed');
        }
    }
    
    // 현재 단계 활성화
    const nextStep = document.querySelector(`.step[data-step="${step}"]`);
    if (nextStep) {
        nextStep.classList.add('active');
    }
    
    currentStep = step;
    showStep(step);
}

// 단계별 화면 표시
function showStep(step) {
    // 모든 섹션 숨기기
    const sections = ['uploadSection', 'mappingSection', 'verificationSection', 'completionSection'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = 'none';
        }
    });
    
    // 해당 단계 섹션 표시
    const sectionIds = {
        1: 'uploadSection',
        2: 'mappingSection',
        3: 'verificationSection',
        4: 'completionSection'
    };
    
    const targetSection = document.getElementById(sectionIds[step]);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // 단계별 초기화
        if (step === 2) {
            initMappingSection();
        } else if (step === 3) {
            initVerificationSection();
        } else if (step === 4) {
            initCompletionSection();
        }
    }
}

// 매핑 섹션 초기화
function initMappingSection() {
    // 매핑 데이터가 있는 경우에만 처리
    if (!mappingData) return;
    
    // 파일 정보 업데이트
    const fileName = document.querySelector('.file-name');
    const fileStats = document.querySelector('.file-stats');
    
    if (fileName) fileName.textContent = mappingData.fileName;
    if (fileStats) fileStats.textContent = `총 ${mappingData.totalRows}개 행 발견`;
    
    // 샘플 데이터 업데이트 (이미 HTML에 하드코딩되어 있음)
}

// 컬럼 재매핑
function remapColumns() {
    showToast('컬럼 재매핑 기능은 준비 중입니다.', 'info');
}

// 검증 섹션 초기화
function initVerificationSection() {
    if (!mappingData) return;
    
    // 검증 데이터 초기화
    verificationData = {
        currentIndex: 41, // 0부터 시작하므로 42번째 항목
        totalItems: mappingData.totalRows,
        items: generateVerificationItems()
    };
    
    updateVerificationProgress();
    showCurrentVerificationItem();
}

// 검증 항목 생성
function generateVerificationItems() {
    const items = [];
    const sampleItems = [
        {
            date: '2025-07-15',
            place: 'GS25 강남점',
            amount: 3500,
            category: '생활용품',
            memo: '물티슈 구입',
            aiRecommended: true
        },
        {
            date: '2025-07-16',
            place: '스타벅스',
            amount: 4500,
            category: '카페/음료',
            memo: '아메리카노',
            aiRecommended: false
        }
    ];
    
    // 실제로는 매핑된 데이터를 기반으로 생성
    return sampleItems;
}

// 검증 진행률 업데이트
function updateVerificationProgress() {
    if (!verificationData) return;
    
    const currentItem = document.querySelector('.current-item');
    const totalItems = document.querySelector('.total-items');
    const progressPercentage = document.querySelector('.progress-percentage');
    const progressBar = document.querySelector('.progress-bar');
    
    const current = verificationData.currentIndex + 1;
    const total = verificationData.totalItems;
    const percentage = Math.round((current / total) * 100);
    
    if (currentItem) currentItem.textContent = current;
    if (totalItems) totalItems.textContent = total;
    if (progressPercentage) progressPercentage.textContent = `(${percentage}%)`;
    if (progressBar) progressBar.style.width = `${percentage}%`;
}

// 현재 검증 항목 표시
function showCurrentVerificationItem() {
    if (!verificationData || verificationData.currentIndex >= verificationData.items.length) {
        // 검증 완료
        goToStep(4);
        return;
    }
    
    const item = verificationData.items[verificationData.currentIndex];
    
    // 검증 카드 업데이트 (현재는 HTML에 하드코딩되어 있음)
    updateVerificationCard(item);
}

// 검증 카드 업데이트
function updateVerificationCard(item) {
    const detailValues = document.querySelectorAll('.detail-value');
    
    if (detailValues.length >= 5) {
        detailValues[0].textContent = formatDate(item.date);
        detailValues[1].textContent = item.place;
        detailValues[2].textContent = formatAmount(item.amount) + '원';
        detailValues[2].className = 'detail-value text-expense';
        
        const categoryText = item.category + (item.aiRecommended ? ' (AI 추천)' : '');
        detailValues[3].innerHTML = categoryText;
        
        detailValues[4].textContent = item.memo || '-';
    }
}

// 검증 액션 함수들
function confirmItem() {
    if (!verificationData) return;
    
    showToast('항목이 확인되었습니다.', 'success');
    nextVerificationItem();
}

function editItem() {
    showToast('항목 수정 기능은 준비 중입니다.', 'info');
}

function deleteItem() {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        showToast('항목이 삭제되었습니다.', 'info');
        nextVerificationItem();
    }
}

function skipItem() {
    showToast('항목을 건너뛰었습니다.', 'info');
    nextVerificationItem();
}

// 다음 검증 항목으로 이동
function nextVerificationItem() {
    if (!verificationData) return;
    
    verificationData.currentIndex++;
    updateVerificationProgress();
    
    setTimeout(() => {
        showCurrentVerificationItem();
    }, 500);
}

// 일괄 액션 적용
function applyBulkAction(type) {
    let message = '';
    
    switch(type) {
        case 'gs25':
            message = 'GS25 관련 항목들이 일괄 처리되었습니다.';
            break;
        case 'amount':
            message = '3,500원 이하 항목들이 일괄 확인되었습니다.';
            break;
        default:
            message = '일괄 처리가 완료되었습니다.';
    }
    
    showToast(message, 'success');
    
    // 시뮬레이션: 여러 항목 건너뛰기
    if (verificationData) {
        verificationData.currentIndex += 10;
        updateVerificationProgress();
        showCurrentVerificationItem();
    }
}

// 남은 항목 모두 확인
function confirmAllRemaining() {
    if (confirm('남은 모든 항목을 확인하시겠습니까?')) {
        showToast('모든 항목이 확인되었습니다!', 'success');
        
        setTimeout(() => {
            goToStep(4);
        }, 1000);
    }
}

// 완료 섹션 초기화
function initCompletionSection() {
    // 완료 통계 업데이트 (현재는 HTML에 하드코딩되어 있음)
    updateCompletionStats();
}

// 완료 통계 업데이트
function updateCompletionStats() {
    // 실제 처리 결과를 기반으로 통계 업데이트
    console.log('Completion stats updated');
}

// 대시보드로 이동
function goToDashboard() {
    showPageTransition();
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 300);
}

// 채팅으로 이동
function goToChat() {
    showPageTransition();
    setTimeout(() => {
        window.location.href = 'chat.html';
    }, 300);
}

// 파일 입력 트리거
function triggerFileInput() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.click();
    }
}

// 페이지 전환 효과
function showPageTransition() {
    document.body.style.opacity = '0.8';
    document.body.style.transform = 'scale(0.98)';
}

// 유틸리티 함수들
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatAmount(amount) {
    return amount.toLocaleString('ko-KR');
}

// 토스트 메시지
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">${getToastIcon(type)}</div>
            <div class="toast-message">
                <div class="toast-title">${getToastTitle(type)}</div>
                <div class="toast-description">${message}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function getToastIcon(type) {
    const icons = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

function getToastTitle(type) {
    const titles = {
        success: '성공',
        warning: '주의',
        error: '오류',
        info: '알림'
    };
    return titles[type] || titles.info;
}

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // ESC 키로 단계 뒤로 가기
    if (e.key === 'Escape' && currentStep > 1) {
        goToStep(currentStep - 1);
    }
    
    // 검증 단계에서 키보드 단축키
    if (currentStep === 3) {
        switch(e.key) {
            case '1':
                confirmItem();
                break;
            case '2':
                editItem();
                break;
            case '3':
                deleteItem();
                break;
            case '4':
                skipItem();
                break;
        }
    }
});

// 반응형 처리
window.addEventListener('resize', function() {
    // 드래그 앤 드롭 영역 크기 조정 등
    handleResize();
});

function handleResize() {
    // 반응형 처리 로직
    const dropzone = document.getElementById('dropzone');
    if (dropzone && window.innerWidth < 768) {
        // 모바일에서 드래그 앤 드롭 영역 조정
        dropzone.style.padding = 'var(--spacing-xl)';
    }
}