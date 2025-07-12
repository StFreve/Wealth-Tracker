# Development Environment Setup Guide

## 🎯 Quick Start

Your wealth tracker application is now ready for development! Follow these steps to get everything running.

## ✅ Dependencies Installed

All dependencies have been installed for:
- **Root**: Monorepo management tools
- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Backend**: NestJS + TypeORM + PostgreSQL

## 🚀 Starting the Application

### Option 1: Start Everything at Once (Recommended)
```bash
npm run dev
```
This will start both frontend and backend concurrently.

### Option 2: Start Services Individually

**Frontend Only:**
```bash
npm run dev:frontend
# Opens at http://localhost:5173
```

**Backend Only:**
```bash
npm run dev:backend  
# Runs at http://localhost:3001
```

## 🗄️ Database Setup

### With Docker (Recommended)
1. **Install Docker Desktop** from https://docker.com/products/docker-desktop
2. **Start Docker Desktop**
3. **Run the services:**
   ```bash
   docker-compose up -d
   ```
   This starts:
   - PostgreSQL (port 5432)
   - Redis (port 6379)

### Without Docker (Alternative)
Install PostgreSQL and Redis locally:

**PostgreSQL:**
- Download from https://postgresql.org/download
- Create database: `wealth_tracker`
- User: `postgres` / Password: `postgres`

**Redis:**
- Windows: Use Docker or WSL
- Update backend config if using different credentials

## 🔧 Environment Configuration

The backend uses these default settings (configured in `backend/src/config/configuration.ts`):

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=wealth_tracker

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## 🌐 Accessing the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api (Swagger)

## 📱 Features Available

### ✅ Implemented
- **Authentication**: Login/Register with JWT
- **Multilingual**: English/Russian support
- **Dark/Light Themes**: System, dark, light modes
- **Responsive Design**: Mobile-ready UI
- **Asset Management**: All asset types supported
- **Dashboard**: Portfolio overview
- **Analytics**: Performance tracking
- **Widgets**: Shareable public widgets

### 🔄 Database Schema
All entities are ready:
- Users (with preferences, authentication)
- Assets (stocks, deposits, precious metals, recurring income)
- Transactions (asset operations)
- Portfolio (snapshots, analytics)
- Widgets (public sharing)

## 🛠️ Development Commands

```bash
# Install all dependencies
npm run install:all

# Development
npm run dev                 # Start both frontend & backend
npm run dev:frontend       # Frontend only
npm run dev:backend        # Backend only

# Building
npm run build              # Build both
npm run build:frontend     # Frontend only  
npm run build:backend      # Backend only

# Testing
npm run test               # Run all tests
npm run test:frontend      # Frontend tests
npm run test:backend       # Backend tests
```

## 📂 Project Structure

```
wealth-tracker/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── contexts/      # React contexts (Auth, Theme)
│   │   ├── i18n/          # Internationalization
│   │   └── lib/           # Utilities
├── backend/                # NestJS API
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # User management
│   │   ├── assets/        # Asset management
│   │   ├── portfolio/     # Portfolio analytics
│   │   ├── widgets/       # Public widgets
│   │   └── database/      # Database configuration
└── docker-compose.yml     # Development services
```

## 🔐 Authentication Flow

1. **Register**: Create account with email/password
2. **Login**: Get JWT token
3. **Protected Routes**: Token required for API access
4. **Profile Management**: Update preferences, change password

## 🌍 Internationalization

- **Languages**: English (en), Russian (ru)
- **Switch Language**: In Settings page
- **Add Language**: Add new JSON file in `frontend/src/i18n/locales/`

## 🎨 Theming

- **Themes**: Light, Dark, System
- **Switch Theme**: Header theme toggle
- **Customize**: Edit `frontend/tailwind.config.js`

## ⚡ Next Steps

1. **Start the database** (Docker Compose or local)
2. **Run `npm run dev`** to start development
3. **Open http://localhost:5173** 
4. **Register a new account** and start adding assets!

## 🐛 Troubleshooting

**Port conflicts:**
- Frontend: Change port in `frontend/vite.config.ts`
- Backend: Change PORT in backend config

**Database connection:**
- Ensure PostgreSQL is running
- Check connection settings in `backend/src/config/configuration.ts`

**Dependencies:**
- Run `npm run install:all` to reinstall all dependencies

**Linter errors:**
- These are expected in code-only mode
- Install dependencies to resolve them

## 📚 Additional Resources

- **NestJS Docs**: https://nestjs.com
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **TailwindCSS**: https://tailwindcss.com
- **TypeORM**: https://typeorm.io

Happy coding! 🚀 