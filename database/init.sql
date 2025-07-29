-- 머니챗 데이터베이스 초기화 스크립트

-- UUID 확장 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    profile_image VARCHAR(500),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 카테고리 테이블
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    color VARCHAR(7) DEFAULT '#03C75A',
    icon VARCHAR(50),
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지출 내역 테이블
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    place VARCHAR(200),
    memo TEXT,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50), -- card, cash, transfer
    is_income BOOLEAN DEFAULT FALSE,
    conversation_id VARCHAR(100), -- 채팅 세션 연결
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- NLP 분석 신뢰도 (0.0-1.0)
    metadata JSONB DEFAULT '{}', -- NLP 분석 결과, 원본 텍스트 등
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 채팅 세션 테이블
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    context JSONB DEFAULT '{}',
    last_message TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 엑셀 업로드 기록 테이블
CREATE TABLE IF NOT EXISTS excel_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    total_rows INTEGER,
    processed_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing', -- processing, completed, failed
    error_log JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_conversation ON expenses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_activity ON chat_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- 기본 카테고리 삽입 함수
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    food_id UUID;
    transport_id UUID;
    culture_id UUID;
    living_id UUID;
    shopping_id UUID;
    health_id UUID;
    income_id UUID;
BEGIN
    -- 주요 카테고리 생성
    INSERT INTO categories (user_id, name, color, icon, is_system) VALUES
    (p_user_id, '식비', '#FF6B35', '🍽️', TRUE) RETURNING id INTO food_id;
    
    INSERT INTO categories (user_id, name, color, icon, is_system) VALUES
    (p_user_id, '교통', '#4ECDC4', '🚗', TRUE) RETURNING id INTO transport_id;
    
    INSERT INTO categories (user_id, name, color, icon, is_system) VALUES
    (p_user_id, '문화/여가', '#45B7D1', '🎬', TRUE) RETURNING id INTO culture_id;
    
    INSERT INTO categories (user_id, name, color, icon, is_system) VALUES
    (p_user_id, '주거/통신', '#96CEB4', '🏠', TRUE) RETURNING id INTO living_id;
    
    INSERT INTO categories (user_id, name, color, icon, is_system) VALUES
    (p_user_id, '쇼핑', '#FECA57', '🛍️', TRUE) RETURNING id INTO shopping_id;
    
    INSERT INTO categories (user_id, name, color, icon, is_system) VALUES
    (p_user_id, '건강/의료', '#FF9FF3', '💊', TRUE) RETURNING id INTO health_id;
    
    INSERT INTO categories (user_id, name, color, icon, is_system) VALUES
    (p_user_id, '수입', '#03C75A', '💰', TRUE) RETURNING id INTO income_id;
    
    -- 하위 카테고리 생성
    INSERT INTO categories (user_id, name, parent_id, color, is_system) VALUES
    (p_user_id, '카페', food_id, '#D63031', TRUE),
    (p_user_id, '레스토랑', food_id, '#E17055', TRUE),
    (p_user_id, '마트/편의점', food_id, '#FDCB6E', TRUE),
    (p_user_id, '지하철/버스', transport_id, '#0984E3', TRUE),
    (p_user_id, '택시', transport_id, '#6C5CE7', TRUE),
    (p_user_id, '주유비', transport_id, '#A29BFE', TRUE),
    (p_user_id, '영화', culture_id, '#FD79A8', TRUE),
    (p_user_id, '도서', culture_id, '#FDCB6E', TRUE),
    (p_user_id, '여행', culture_id, '#00B894', TRUE);
END;
$$ LANGUAGE plpgsql;

-- 트리거: 사용자 생성 시 기본 카테고리 자동 생성
CREATE OR REPLACE FUNCTION trigger_create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_categories(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_default_categories ON users;
CREATE TRIGGER user_default_categories
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_default_categories();

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 적용
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();