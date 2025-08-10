/* 
===========================================
네이버 가계부 V2 대시보드 JavaScript
===========================================
*/

document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});

function initDashboard() {
    // 사이드바 토글 이벤트
    initSidebarToggle();
    
    // 웰컴 메시지 애니메이션
    initWelcomeAnimation();
    
    // 차트 애니메이션
    initChartAnimation();
    
    // 카드 호버 효과
    initCardInteractions();
    
    // 빠른 액션 버튼 이벤트
    initQuickActions();
}

// 사이드바 토글 기능
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
        
        // ESC 키로 사이드바 닫기
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                backdrop.classList.remove('open');
            }
        });
    }
}

// 웰컴 메시지 애니메이션
function initWelcomeAnimation() {
    const welcomeMessage = document.querySelector('.welcome-message');
    
    if (welcomeMessage) {
        // 타이핑 효과 (선택적)
        const welcomeTitle = welcomeMessage.querySelector('.welcome-title');
        if (welcomeTitle) {
            welcomeTitle.style.opacity = '0';
            welcomeTitle.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                welcomeTitle.style.transition = 'all 0.6s ease-out';
                welcomeTitle.style.opacity = '1';
                welcomeTitle.style.transform = 'translateY(0)';
            }, 200);
        }
    }
}

// 차트 애니메이션
function initChartAnimation() {
    const chartBars = document.querySelectorAll('.bar');
    
    if (chartBars.length > 0) {
        // Intersection Observer로 차트가 보일 때 애니메이션 시작
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const chart = entry.target;
                    const bars = chart.querySelectorAll('.bar');
                    
                    bars.forEach((bar, index) => {
                        setTimeout(() => {
                            bar.style.animation = `barGrow 1s ease-out both`;
                        }, index * 100);
                    });
                    
                    observer.unobserve(chart);
                }
            });
        }, { threshold: 0.3 });
        
        const chartContainer = document.querySelector('.simple-chart');
        if (chartContainer) {
            observer.observe(chartContainer);
        }
    }
}

// 카드 인터랙션
function initCardInteractions() {
    const clickableCards = document.querySelectorAll('.card-clickable, .chat-item');
    
    clickableCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 클릭 애니메이션
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // 클릭 처리 로직 추가 가능
            console.log('Card clicked:', this);
        });
        
        // 터치 디바이스에서 호버 효과 개선
        card.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        });
        
        card.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('touch-active');
            }, 150);
        });
    });
}

// 빠른 액션 버튼 이벤트
function initQuickActions() {
    const actionButtons = document.querySelectorAll('.action-button');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const actionText = this.querySelector('.action-text').textContent;
            
            // 액션에 따른 처리
            switch(actionText) {
                case '채팅으로 입력':
                    navigateToChat();
                    break;
                case '엑셀 업로드':
                    navigateToExcelUpload();
                    break;
                case '수동 입력':
                    openManualInput();
                    break;
                case '영수증 촬영':
                    openReceiptCapture();
                    break;
                default:
                    console.log('Unknown action:', actionText);
            }
        });
    });
    
    // FAB 버튼
    const fabButton = document.querySelector('.fab');
    if (fabButton) {
        fabButton.addEventListener('click', function() {
            navigateToChat();
        });
    }
}

// 네비게이션 함수들
function navigateToChat() {
    // 페이지 전환 애니메이션
    document.body.style.opacity = '0.8';
    setTimeout(() => {
        window.location.href = 'chat.html';
    }, 150);
}

function navigateToExcelUpload() {
    document.body.style.opacity = '0.8';
    setTimeout(() => {
        window.location.href = 'excel-upload.html';
    }, 150);
}

function openManualInput() {
    // 수동 입력 모달 열기
    showToast('수동 입력 기능은 준비 중입니다.', 'info');
}

function openReceiptCapture() {
    // 영수증 촬영 기능 열기
    showToast('영수증 촬영 기능은 준비 중입니다.', 'info');
}

// 유틸리티 함수들
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
    
    // 3초 후 자동 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
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

// 반응형 차트 크기 조정
function handleResize() {
    const chart = document.querySelector('.simple-chart');
    if (chart) {
        // 차트 크기 재계산 로직 추가 가능
        console.log('Chart resized');
    }
}

// 리사이즈 이벤트 디바운싱
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 250);
});

// 다크모드 감지 및 처리
function handleDarkModeChange(e) {
    const isDarkMode = e.matches;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    // 차트 색상 업데이트 등 필요시 추가 처리
    console.log('Dark mode:', isDarkMode);
}

// 다크모드 미디어 쿼리 리스너
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkModeQuery.addListener(handleDarkModeChange);
handleDarkModeChange(darkModeQuery); // 초기 설정

// 접근성 개선: 키보드 네비게이션
document.addEventListener('keydown', function(e) {
    // Tab 키 네비게이션 개선
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});

// 성능 최적화: 스크롤 이벤트 디바운싱
let scrollTimeout;
window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
        // 스크롤 기반 애니메이션 처리
        handleScrollAnimations();
    }, 16); // 60fps
});

function handleScrollAnimations() {
    // 스크롤 위치에 따른 요소 애니메이션 처리
    const elements = document.querySelectorAll('[data-scroll-animation]');
    
    elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible && !element.classList.contains('animated')) {
            element.classList.add('animated');
        }
    });
}