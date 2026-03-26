# GECRAI 1.2 - SaaS Platform for Electrical Engineering

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-Proprietary-green.svg)]()
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)]()
[![Node](https://img.shields.io/badge/node-18+-green.svg)]()

## 🚀 Overview

GECRAI 1.2 is a complete rewrite of the GECRAI electrical engineering calculation platform, designed as a modern SaaS (Software as a Service) application with:

- **FastAPI Backend** - High-performance async Python API
- **React Frontend** - Modern TypeScript web application
- **PostgreSQL Database** - Multi-tenant data storage
- **Redis Cache** - Session management and caching
- **Docker Deployment** - Containerized for easy deployment

## 🏗️ Architecture

```
GECRAI_1.2/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   ├── core/              # Core utilities (security, config)
│   │   ├── db/                # Database session and models
│   │   ├── models/            # SQLAlchemy models
│   │   └── main.py            # Application entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── store/             # State management (Zustand)
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml         # Development environment
└── README.md
```

## 🛠️ Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Using Docker (Recommended)

```bash
# Clone the repository
cd GECRAI_1.2

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/docs

### Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/gecrai"
export REDIS_URL="redis://localhost:6379/0"
export SECRET_KEY="your-secret-key"

# Run development server
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
echo "VITE_API_URL=http://localhost:8000" > .env

# Run development server
npm run dev
```

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/login` | POST | Login with credentials |
| `/api/v1/projects` | GET, POST | List/create projects |
| `/api/v1/calculations/voltage-drop` | POST | Calculate voltage drop |
| `/api/v1/calculations/conductor-sizing` | POST | Size conductors |

## 🔐 Authentication

GECRAI 1.2 uses JWT (JSON Web Tokens) for authentication:

1. Register or login to receive access and refresh tokens
2. Include the access token in the `Authorization` header: `Bearer <token>`
3. Refresh tokens when expired using `/api/v1/auth/refresh`

## 🏢 Multi-Tenancy

The platform supports multi-tenant architecture:

- **Organizations** - Each customer has their own organization
- **Users** - Users belong to organizations with roles (owner, admin, member, viewer)
- **Projects** - Projects are scoped to organizations
- **Calculations** - All data is tenant-isolated

## 💳 Subscription Plans

| Plan | Users | Projects | Calculations/month | Price |
|------|-------|----------|-------------------|-------|
| Free | 1 | 3 | 100 | $0 |
| Starter | 3 | 10 | 500 | $29/mo |
| Pro | 10 | 50 | 2000 | $99/mo |
| Enterprise | Unlimited | Unlimited | Unlimited | Custom |

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 📦 Production Deployment

### Using Docker Compose

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables (Production)

```bash
# Backend
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-very-secure-secret-key
DEBUG=false
ENVIRONMENT=production

# Stripe (for subscriptions)
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Frontend
VITE_API_URL=https://api.gecrai.com
```

## 🔄 Migration from GECRAI 1.1

See [AUDIT_REPORT.md](./AUDIT_REPORT.md) for detailed migration guide.

Key changes:
1. Desktop app → Web application
2. SQLite → PostgreSQL
3. Tkinter → React
4. Hardware-bound licensing → JWT authentication
5. Single user → Multi-tenant

## 📝 Development Roadmap

### Phase 1 (Current) - Core Platform
- [x] Backend API structure
- [x] Authentication system
- [x] Project management
- [x] Basic calculations (voltage drop, conductor sizing)
- [ ] PDF report generation
- [ ] AI assistant integration

### Phase 2 - Enhanced Features
- [ ] Advanced calculations (short circuit, arc flash)
- [ ] Real-time collaboration
- [ ] File attachments
- [ ] Email notifications

### Phase 3 - Enterprise
- [ ] SSO integration
- [ ] API access for third-party tools
- [ ] Advanced analytics
- [ ] Custom branding

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Copyright © 2024-2026 GProA. All rights reserved.

This software is proprietary. A license is required for commercial use.

## 🆘 Support

- **Documentation**: [docs.gecrai.com](https://docs.gecrai.com)
- **Email**: soporte@gproa.com
- **Issues**: [GitHub Issues](https://github.com/gproa/GECRAI/issues)

---

**GECRAI 1.2** - *SaaS Platform for Electrical Engineering Calculations*  
*Developed by GProA*
