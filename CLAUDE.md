# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MoneyChat (머니챗) is an LLM-based conversational expense tracking web service that transforms traditional expense recording into natural conversations. Built with React/TypeScript frontend, NestJS backend, and Python NLP service using OpenAI GPT-4.

## Essential Commands

### Development
```bash
# Start all services via Docker Compose
docker-compose up -d

# Frontend development (React + Vite)
cd frontend
npm install
npm run dev         # Starts Vite dev server

# Backend development (NestJS)
cd backend
npm install
npm run start:dev   # Starts NestJS with watch mode

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
- **State Management**: Zustand stores in `/frontend/src/store/`
- **API Integration**: 
  - `/frontend/src/services/apiClient.ts` - Axios client with auth interceptors
  - `/frontend/src/services/openai.ts` - OpenAI integration for chat processing
  - `/frontend/src/services/chatApi.ts` - Chat-specific API calls
- **Key Pages**: Dashboard, Chat, Expenses, ExcelUpload, Reports, Settings
- **Component Structure**: Layout components wrap pages with sidebar navigation

### Backend (NestJS)
- **Module Architecture**: Each feature in `/backend/src/modules/`
  - auth: JWT authentication
  - chat: WebSocket + REST endpoints
  - expense: CRUD operations
  - excel: File upload processing
  - category: Hierarchical categories
- **Database**: PostgreSQL with TypeORM entities in `/backend/src/entities/`
- **Guards & Interceptors**: JWT auth guard, error handling, logging

### NLP Service (Python FastAPI)
- **Main Entry**: `/nlp-service/main.py`
- **OpenAI Integration**: Processes natural language to structured expense data
- **Redis Caching**: Results cached to optimize API calls

### Database Schema
- **users**: User accounts with JWT auth
- **expenses**: Income/expense records with categories
- **categories**: Hierarchical structure (parent-child relationships)
- **chat_sessions**: Conversation history
- **excel_uploads**: Upload tracking and processing status

## Critical Implementation Details

### OpenAI Integration
The frontend directly communicates with OpenAI API for chat processing (`/frontend/src/services/openai.ts`). Key features:
- Natural language to structured expense data conversion
- Date/time awareness with multiple format support
- Transaction validation and confidence scoring
- Batch processing for multiple transactions in one message

### Authentication Flow
- JWT tokens stored in localStorage
- Auth interceptor in apiClient automatically attaches tokens
- Protected routes check auth state via `useAuth` hook

### Real-time Features
- Socket.io for chat interface
- WebSocket gateways in backend for real-time updates

### File Upload Processing
- Excel files uploaded to backend
- Processed through NLP service for column mapping
- Interactive validation via chat interface

## Environment Variables Required
- `OPENAI_API_KEY`: For GPT-4 API access
- `DATABASE_URL`: PostgreSQL connection
- `JWT_SECRET`: Token signing
- `REDIS_URL`: Caching layer
- `MINIO_*`: File storage credentials

## Common Development Tasks

### Adding New API Endpoints
1. Create DTO in `/backend/src/dto/`
2. Add controller method with appropriate decorators
3. Implement service logic
4. Update frontend API service

### Modifying Chat Processing
1. Update prompt in `/frontend/src/services/openai.ts`
2. Adjust response parsing logic
3. Test with various input formats

### Database Migrations
- Entities auto-sync in development
- For production: Generate migrations via TypeORM CLI

## Railway Deployment Notes
- Backend runs on Railway with Nixpacks builder
- Frontend built as static files, served via CDN
- Health check endpoint: `/api/health`
- Auto-restart policy with 3 retries on failure