/* 
===========================================
머니챗(MoneyChat) 채팅 인터페이스 JavaScript
===========================================
*/

let currentTransaction = null;
let isProcessing = false;

document.addEventListener('DOMContentLoaded', function() {
    initChat();
});

function initChat() {
    // 기본 초기화
    initSidebarToggle();
    initChatInput();
    initSuggestions();
    initScrollToBottom();
    
    // 채팅 영역 포커스
    focusChatInput();
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

// 채팅 입력 초기화
function initChatInput() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (chatInput && sendBtn) {
        // 입력 이벤트
        chatInput.addEventListener('input', function() {
            handleInputChange();
            autoResizeTextarea(this);
        });
        
        // 엔터 키 전송 (Shift+Enter는 줄바꿈)
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isProcessing && this.value.trim()) {
                    sendMessage();
                }
            }
        });
        
        // 전송 버튼 클릭
        sendBtn.addEventListener('click', sendMessage);
    }
}

// 입력 변경 처리
function handleInputChange() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (chatInput && sendBtn) {
        const hasText = chatInput.value.trim().length > 0;
        sendBtn.disabled = !hasText || isProcessing;
        
        // 버튼 스타일 업데이트
        if (hasText && !isProcessing) {
            sendBtn.classList.add('active');
        } else {
            sendBtn.classList.remove('active');
        }
    }
}

// 텍스트 영역 자동 크기 조정
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    const maxHeight = 120; // CSS의 max-height와 동일
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = newHeight + 'px';
}

// 메시지 전송
function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message || isProcessing) return;
    
    // 사용자 메시지 추가
    addUserMessage(message);
    
    // 입력창 초기화
    chatInput.value = '';
    chatInput.style.height = 'auto';
    handleInputChange();
    
    // AI 처리 시작
    processMessage(message);
}

// 사용자 메시지 추가
function addUserMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const timestamp = getCurrentTimestamp();
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message user';
    messageElement.innerHTML = `
        <div class="chat-message-content">
            <div class="chat-bubble">${escapeHtml(message)}</div>
            <div class="chat-avatar user">👤</div>
        </div>
        <div class="chat-timestamp">${timestamp}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

// AI 메시지 추가
function addAIMessage(content, isTyping = false) {
    const chatMessages = document.getElementById('chatMessages');
    const timestamp = getCurrentTimestamp();
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message ai';
    messageElement.innerHTML = `
        <div class="chat-message-content">
            <div class="chat-avatar ai">🤖</div>
            <div class="chat-bubble">
                ${isTyping ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : content}
            </div>
        </div>
        <div class="chat-timestamp">${timestamp}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    
    return messageElement;
}

// 메시지 처리 (AI 시뮬레이션)
async function processMessage(message) {
    if (isProcessing) return;
    
    isProcessing = true;
    showInputStatus('AI가 분석하고 있어요...');
    
    // 타이핑 인디케이터 표시
    const typingMessage = addAIMessage('', true);
    
    try {
        // 메시지 분석 시뮬레이션
        const result = await analyzeMessage(message);
        
        // 타이핑 인디케이터 제거
        typingMessage.remove();
        
        if (result.success) {
            // 확인 카드와 함께 AI 응답 추가
            addConfirmationMessage(result.data);
        } else {
            // 에러 메시지 추가
            addAIMessage(`죄송해요, 입력을 이해하지 못했어요. 다시 한 번 알려주시겠어요?<br><br>예: "오늘 점심 15,000원"`);
        }
    } catch (error) {
        console.error('Message processing error:', error);
        typingMessage.remove();
        addAIMessage('처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    }
    
    isProcessing = false;
    hideInputStatus();
    handleInputChange();
}

// 메시지 분석 (AI 시뮬레이션)
function analyzeMessage(message) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // 간단한 패턴 매칭으로 분석 시뮬레이션
            const amountMatch = message.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*원?/);
            const placeMatch = message.match(/(스벅|스타벅스|카페|마트|편의점|GS25|CU|세븐일레븐)/i);
            const dateMatch = message.match(/(오늘|어제|그제|이번주|지난주)/);
            
            if (amountMatch) {
                const amount = parseInt(amountMatch[1].replace(/,/g, ''));
                const place = placeMatch ? placeMatch[1] : '미분류';
                const date = dateMatch ? getDateFromText(dateMatch[1]) : new Date().toISOString().split('T')[0];
                const category = getCategoryFromPlace(place);
                
                resolve({
                    success: true,
                    data: {
                        date: date,
                        place: place,
                        category: category,
                        amount: amount,
                        memo: extractMemo(message)
                    }
                });
            } else {
                resolve({ success: false });
            }
        }, 1500 + Math.random() * 1000); // 1.5-2.5초 랜덤 지연
    });
}

// 확인 메시지 추가
function addConfirmationMessage(data) {
    currentTransaction = data;
    
    const content = `
        다음 내용으로 저장할게요:
        <div class="confirmation-card">
            <div class="confirmation-details">
                <div class="confirmation-item">
                    <span class="confirmation-icon">📅</span>
                    <span class="confirmation-label">날짜:</span>
                    <span class="confirmation-value">${formatDate(data.date)}</span>
                </div>
                <div class="confirmation-item">
                    <span class="confirmation-icon">📍</span>
                    <span class="confirmation-label">장소:</span>
                    <span class="confirmation-value">${data.place}</span>
                </div>
                <div class="confirmation-item">
                    <span class="confirmation-icon">🏷️</span>
                    <span class="confirmation-label">카테고리:</span>
                    <span class="confirmation-value">${data.category}</span>
                </div>
                <div class="confirmation-item">
                    <span class="confirmation-icon">💰</span>
                    <span class="confirmation-label">금액:</span>
                    <span class="confirmation-value text-expense">${formatAmount(data.amount)}원</span>
                </div>
                <div class="confirmation-item">
                    <span class="confirmation-icon">📝</span>
                    <span class="confirmation-label">메모:</span>
                    <span class="confirmation-value">${data.memo || '-'}</span>
                </div>
            </div>
            <div class="confirmation-actions">
                <button class="btn btn-sm btn-secondary" onclick="editTransaction()">수정</button>
                <button class="btn btn-sm btn-ghost" onclick="cancelTransaction()">취소</button>
                <button class="btn btn-sm btn-primary" onclick="confirmTransaction()">확인</button>
            </div>
        </div>
    `;
    
    addAIMessage(content);
}

// 거래 확인
function confirmTransaction() {
    if (!currentTransaction) return;
    
    // 성공 메시지 표시
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.style.display = 'block';
        scrollToBottom();
    } else {
        addAIMessage(`
            <div class="success-message">
                ✅ 완료! ${formatAmount(currentTransaction.amount)}원 지출이 저장되었어요.<br>
                다른 지출도 있다면 언제든 알려주세요!
            </div>
        `);
    }
    
    // 현재 거래 초기화
    currentTransaction = null;
    
    // 입력창 포커스
    setTimeout(() => {
        focusChatInput();
    }, 500);
}

// 거래 취소
function cancelTransaction() {
    if (!currentTransaction) return;
    
    addAIMessage('취소되었어요. 다른 지출을 알려주세요!');
    currentTransaction = null;
    focusChatInput();
}

// 거래 수정
function editTransaction() {
    if (!currentTransaction) return;
    
    const modal = document.getElementById('editModal');
    if (modal) {
        // 모달에 현재 데이터 설정
        document.getElementById('editDate').value = currentTransaction.date;
        document.getElementById('editPlace').value = currentTransaction.place;
        document.getElementById('editCategory').value = getCategoryCode(currentTransaction.category);
        document.getElementById('editAmount').value = currentTransaction.amount;
        document.getElementById('editMemo').value = currentTransaction.memo || '';
        
        modal.style.display = 'flex';
        document.getElementById('editDate').focus();
    }
}

// 수정 모달 닫기
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 수정 저장
function saveEdit() {
    const editedData = {
        date: document.getElementById('editDate').value,
        place: document.getElementById('editPlace').value,
        category: getCategoryName(document.getElementById('editCategory').value),
        amount: parseInt(document.getElementById('editAmount').value),
        memo: document.getElementById('editMemo').value
    };
    
    currentTransaction = editedData;
    closeEditModal();
    
    addAIMessage(`수정되었어요! 새로운 내용으로 저장할까요?`);
    
    // 새 확인 카드 추가
    setTimeout(() => {
        addConfirmationMessage(editedData);
    }, 500);
}

// 빠른 제안 초기화
function initSuggestions() {
    const suggestions = document.querySelectorAll('.suggestion-btn');
    
    suggestions.forEach(btn => {
        btn.addEventListener('click', function() {
            const suggestion = this.textContent.trim();
            insertSuggestion(suggestion.replace(/^[🍽️🚇☕🛒]\s*/, ''));
        });
    });
}

// 제안 삽입
function insertSuggestion(text) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        const currentValue = chatInput.value;
        const newValue = currentValue ? `${currentValue} ${text}` : text;
        chatInput.value = newValue;
        chatInput.focus();
        handleInputChange();
        autoResizeTextarea(chatInput);
    }
}

// 스크롤 초기화
function initScrollToBottom() {
    scrollToBottom();
}

// 하단으로 스크롤
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }
}

// 채팅 입력창 포커스
function focusChatInput() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput && window.innerWidth > 768) { // 모바일이 아닌 경우만
        setTimeout(() => {
            chatInput.focus();
        }, 100);
    }
}

// 입력 상태 표시
function showInputStatus(message) {
    const inputStatus = document.getElementById('inputStatus');
    if (inputStatus) {
        inputStatus.querySelector('.status-text').textContent = message;
        inputStatus.style.display = 'flex';
    }
}

// 입력 상태 숨기기
function hideInputStatus() {
    const inputStatus = document.getElementById('inputStatus');
    if (inputStatus) {
        inputStatus.style.display = 'none';
    }
}

// 첨부파일 처리
function handleAttachment() {
    showToast('첨부파일 기능은 준비 중입니다.', 'info');
}

// 음성 입력 처리
function handleVoiceInput() {
    showToast('음성 입력 기능은 준비 중입니다.', 'info');
}

// 유틸리티 함수들
function getCurrentTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return '어제';
    } else {
        return date.toLocaleDateString('ko-KR');
    }
}

function formatAmount(amount) {
    return amount.toLocaleString('ko-KR');
}

function getDateFromText(text) {
    const today = new Date();
    switch(text) {
        case '오늘':
            return today.toISOString().split('T')[0];
        case '어제':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString().split('T')[0];
        case '그제':
            const dayBeforeYesterday = new Date(today);
            dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
            return dayBeforeYesterday.toISOString().split('T')[0];
        default:
            return today.toISOString().split('T')[0];
    }
}

function getCategoryFromPlace(place) {
    const categories = {
        '스벅': '카페/음료',
        '스타벅스': '카페/음료',
        '카페': '카페/음료',
        '마트': '식비',
        '편의점': '생활용품',
        'GS25': '생활용품',
        'CU': '생활용품',
        '세븐일레븐': '생활용품'
    };
    
    return categories[place] || '기타';
}

function getCategoryCode(categoryName) {
    const codes = {
        '카페/음료': 'cafe',
        '식비': 'food',
        '교통비': 'transport',
        '쇼핑': 'shopping',
        '생활용품': 'daily',
        '기타': 'etc'
    };
    
    return codes[categoryName] || 'etc';
}

function getCategoryName(code) {
    const names = {
        'cafe': '카페/음료',
        'food': '식비',
        'transport': '교통비',
        'shopping': '쇼핑',
        'daily': '생활용품',
        'etc': '기타'
    };
    
    return names[code] || '기타';
}

function extractMemo(message) {
    // 간단한 메모 추출 로직
    const cleanMessage = message.replace(/\d+(?:,\d{3})*(?:\.\d+)?\s*원?/g, '').trim();
    return cleanMessage.length > 0 ? cleanMessage : null;
}

// 토스트 메시지 (dashboard.js와 동일)
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