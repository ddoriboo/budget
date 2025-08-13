# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Naver Budget V2 (네이버 가계부 V2) is an LLM-based conversational expense tracking web service that transforms traditional expense recording into natural conversations. Built with React/TypeScript frontend, NestJS backend, and Python NLP service using OpenAI GPT-4o-mini.

## Essential Commands

### Development
```bash
# Start all services via Docker Compose
docker-compose up -d

# Frontend development (React + Vite)
cd frontend
npm install
npm run dev         # Starts Vite dev server on port 3000

# Backend development (NestJS)
cd backend
npm install
npm run start:dev   # Starts NestJS with watch mode on port 4000

# NLP service development (Python FastAPI)
cd nlp-service
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Build & Testing
```bash
# Frontend
cd frontend
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint check
npm test          # Run Vitest tests

# Backend
cd backend
npm run build     # NestJS build
npm run test:api  # Test API endpoints

# Full system
docker-compose build
```

### Production Deployment (Railway)
```bash
# Backend deployment via Railway
cd backend && npm run start:prod

# Frontend is served as static files
cd frontend && npm run build && npm start
```

## Architecture & Key Components

### Frontend (React + TypeScript)
- **State Management**: Hybrid Zustand stores in `/frontend/src/store/` with API-first approach and localStorage fallback
- **API Integration**: 
  - `/frontend/src/services/apiClient.ts` - Axios client with auth interceptors and fallback handling
  - `/frontend/src/services/openai.ts` - Direct OpenAI GPT-4o-mini integration for chat processing
  - `/frontend/src/services/chatApi.ts` - Chat-specific API calls with WebSocket support
  - `/frontend/src/services/chatOrchestrator.ts` - LLM intent-based routing system
  - `/frontend/src/services/intentAnalysis.ts` - Conversation intent detection
- **Key Pages**: Dashboard, Chat, Expenses, ExcelUpload, Reports, Settings, BudgetPlanning
- **Component Structure**: Layout components wrap pages with sidebar navigation
- **Styling**: Tailwind CSS with custom Naver design system colors

### Backend (NestJS)
- **Module Architecture**: Each feature in `/backend/src/modules/`
  - auth: JWT authentication with Passport
  - chat: WebSocket + REST endpoints
  - expense: CRUD operations with confidence scoring
  - excel: File upload processing with MinIO
  - category: Hierarchical categories (parent-child)
  - health: Health check endpoint for Railway
- **Database**: PostgreSQL with TypeORM entities in `/backend/src/entities/`
- **Guards & Interceptors**: JWT auth guard, error handling, logging
- **Scripts**: API testing scripts in `/backend/src/scripts/`

### NLP Service (Python FastAPI)
- **Main Entry**: `/nlp-service/main.py`
- **OpenAI Integration**: GPT-4o-mini for cost-efficient natural language processing
- **Redis Caching**: Results cached to optimize API calls
- **Excel Processing**: Automatic column mapping and data extraction

### Database Schema
- **users**: User accounts with JWT auth (UUID primary keys)
- **expenses**: Income/expense records with categories and confidence scores
- **categories**: Hierarchical structure with parent-child relationships
- **chat_sessions**: Conversation history with message tracking
- **excel_uploads**: Upload tracking and processing status with JSONB metadata

## Critical Implementation Details

### OpenAI Integration
The frontend directly communicates with OpenAI API for chat processing (`/frontend/src/services/openai.ts`). Key features:
- Natural language to structured expense data conversion with GPT-4o-mini
- Date/time awareness with multiple format support and relative date parsing
- Transaction validation and confidence scoring (0-1 scale)
- Batch processing for multiple transactions in one message
- Intent analysis for routing to appropriate handlers (expense, budget, report)
- Comprehensive system prompts with Korean language support

### Hybrid Storage Architecture
- **API-first approach**: Attempts server communication first
- **localStorage fallback**: Full functionality when offline or server unavailable
- **Seamless sync**: Automatic data reconciliation when connection restored
- **Store implementation**: See `/frontend/src/store/expenseStore.ts`

### Authentication Flow
- JWT tokens stored in localStorage with 30-day expiration
- Auth interceptor in apiClient automatically attaches tokens
- Protected routes check auth state via `useAuth` hook
- Refresh mechanism for expired tokens

### Real-time Features
- Socket.io for chat interface with typing indicators
- WebSocket gateways in backend for real-time updates
- Connection management with automatic reconnection

### File Upload Processing
- Excel files uploaded to backend via multipart/form-data
- Stored in MinIO object storage
- Processed through NLP service for intelligent column mapping
- Interactive validation via chat interface with confidence scores

## Environment Variables Required
- `OPENAI_API_KEY`: For GPT-4o-mini API access
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Token signing secret
- `JWT_EXPIRES_IN`: Token expiration (default: 30d)
- `REDIS_URL`: Redis connection for caching
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`: File storage
- `FRONTEND_URL`: For CORS configuration
- `NODE_ENV`: development | production

## Common Development Tasks

### Adding New API Endpoints
1. Create DTO in `/backend/src/dto/` with class-validator decorators
2. Add controller method with appropriate decorators (@Get, @Post, etc.)
3. Implement service logic with TypeORM repository
4. Update frontend API service in `/frontend/src/services/`
5. Add TypeScript types in `/frontend/src/types/`

### Modifying Chat Processing
1. Update system prompt in `/frontend/src/services/openai.ts`
2. Adjust intent analysis in `/frontend/src/services/intentAnalysis.ts`
3. Update orchestrator routing in `/frontend/src/services/chatOrchestrator.ts`
4. Test with various Korean and English input formats
5. Verify confidence scoring accuracy

### Database Migrations
- Entities auto-sync in development mode
- For production: Generate migrations via TypeORM CLI
- Seeding scripts available in `/backend/src/scripts/`

### Working with Hybrid Storage
1. Check `/frontend/src/store/expenseStore.ts` for implementation
2. API methods attempt server first, then fallback to localStorage
3. Data sync happens automatically on connection restore
4. Test offline mode by stopping backend service

## Railway Deployment Notes
- Backend runs on Railway with Nixpacks builder
- Frontend built as static files, served via CDN
- Health check endpoint: `/api/health` (required for Railway)
- Auto-restart policy with 3 retries on failure
- Connection pooling optimized for Railway limits (10 connections in production)
- Environment variables managed through Railway dashboard

## Testing Strategy
- **API Testing**: Scripts in `/backend/src/scripts/test-*.ts`
- **Frontend Testing**: Vitest configuration (when implemented)
- **Manual Testing**: Use chat interface with various transaction formats
- **Load Testing**: Consider connection pooling limits on Railway