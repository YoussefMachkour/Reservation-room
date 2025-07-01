# 🏢 Room Reservation System

A modern, full-stack room and office reservation system built with **React** frontend and **Go** backend.

## 🚀 Features

### 🎯 Core Features
- **User Authentication** - JWT-based secure authentication
- **Space Management** - Create and manage different types of spaces
- **Reservation System** - Book spaces with conflict detection
- **Role-based Access Control** - Admin, Manager, and User roles
- **Real-time Notifications** - Email and in-app notifications
- **Recurring Bookings** - Support for daily, weekly, monthly patterns
- **Dark/Light Theme** - Toggle between themes
- **Responsive Design** - Works on desktop and mobile

### 📊 Advanced Features
- **Analytics Dashboard** - Usage statistics and reports
- **Approval Workflow** - Manager approval for restricted spaces
- **Conflict Resolution** - Smart conflict detection and suggestions
- **Multi-tenant Support** - Support for multiple organizations
- **API Documentation** - Swagger/OpenAPI documentation
- **File Upload** - Support for space photos and documents

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Context API** - State management

### Backend
- **Go 1.21** - High-performance backend
- **Gin** - HTTP web framework
- **GORM** - ORM for database operations
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **JWT** - Authentication tokens

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Makefile** - Development automation
- **Air** - Hot reload for Go development

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Go 1.21+** (for local development)
- **Node.js 18+** (for frontend development)
- **PostgreSQL 15+** (if running locally)

### 🐳 Using Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/room-reservation-system.git
cd room-reservation-system
```

2. **Start all services**
```bash
make docker-up
```

3. **Initialize the database**
```bash
make migrate
make seed
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Database Admin: http://localhost:8081 (Adminer)
- Email Testing: http://localhost:8025 (MailHog)

### 🔧 Local Development

1. **Backend Setup**
```bash
# Install dependencies
make install-deps

# Start database services only
make db-up

# Run database migrations
make migrate

# Seed with sample data
make seed

# Start the API server
make run
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

## 📁 Project Structure

```
room-reservation-system/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/            # HTTP handlers
│   │   ├── middleware/          # Custom middleware
│   │   └── routes/              # Route definitions
│   ├── config/                  # Configuration management
│   ├── database/                # Database connection & migrations
│   ├── models/                  # Data models
│   ├── services/                # Business logic
│   └── utils/                   # Utility functions
├── frontend/                    # React frontend application
├── scripts/                     # Database scripts and utilities
├── docs/                        # API documentation
├── docker-compose.yml           # Docker services configuration
├── Dockerfile                   # Backend container definition
├── Makefile                     # Development automation
└── README.md                    # Project documentation
```

## 🔑 Default Credentials

After running `make seed`, you can use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cohub.com | password123 |
| Manager | manager@cohub.com | password123 |
| User | user@cohub.com | password123 |

## 📚 API Documentation

### Authentication Endpoints
```http
POST /api/v1/auth/login          # User login
POST /api/v1/auth/register       # User registration
POST /api/v1/auth/logout         # User logout
POST /api/v1/auth/refresh        # Refresh token
GET  /api/v1/auth/profile        # Get user profile
```

### Space Management
```http
GET    /api/v1/spaces            # List spaces
POST   /api/v1/spaces            # Create space
GET    /api/v1/spaces/{id}       # Get space details
PUT    /api/v1/spaces/{id}       # Update space
DELETE /api/v1/spaces/{id}       # Delete space
GET    /api/v1/spaces/{id}/availability # Check availability
```

### Reservations
```http
GET    /api/v1/reservations      # List user reservations
POST   /api/v1/reservations      # Create reservation
GET    /api/v1/reservations/{id} # Get reservation details
PUT    /api/v1/reservations/{id} # Update reservation
DELETE /api/v1/reservations/{id} # Cancel reservation
```

### Admin Operations
```http
GET    /api/v1/admin/users       # List all users
POST   /api/v1/admin/users       # Create user
PUT    /api/v1/admin/users/{id}  # Update user
DELETE /api/v1/admin/users/{id}  # Delete user
GET    /api/v1/admin/stats       # System statistics
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Run benchmarks
make benchmark

# Run linting
make lint
```

## 🔧 Development Commands

```bash
# Database operations
make migrate        # Run migrations
make migrate-down   # Rollback migrations
make seed          # Seed database
make reset-db      # Reset database completely

# Development
make run           # Start API server
make run-dev       # Start with hot reload
make build         # Build binary
make format        # Format code

# Docker operations
make docker-up     # Start all services
make docker-down   # Stop all services
make docker-logs   # View logs
make docker-clean  # Clean up containers

# Utilities
make health        # Check service health
make db-shell      # Connect to database
make redis-cli     # Connect to Redis
```

## 🌍 Environment Variables

Key environment variables (see `.env` file):

```bash
# Application
ENVIRONMENT=development
PORT=8080

# Database
DATABASE_URL=postgres://admin:password123@localhost:5432/room_reservation

# Security
JWT_SECRET=your-super-secret-key

# External Services
SMTP_HOST=localhost
SMTP_PORT=1025
REDIS_URL=redis://localhost:6379
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Password hashing** using bcrypt
- **Rate limiting** to prevent abuse
- **CORS protection** for API endpoints
- **Input validation** and sanitization
- **SQL injection protection** via ORM
- **HTTPS enforcement** in production

## 📈 Performance Optimizations

- **Database indexing** for fast queries
- **Redis caching** for frequently accessed data
- **Connection pooling** for database connections
- **Gzip compression** for API responses
- **Lazy loading** for frontend components
- **Pagination** for large datasets

## 🚀 Deployment

### Docker Production
```bash
# Build production image
make build-prod

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
```bash
# Build for production
CGO_ENABLED=0 GOOS=linux go build -o bin/app cmd/server/main.go

# Set environment variables
export ENVIRONMENT=production
export DATABASE_URL=your-production-db-url

# Run migrations
./bin/app -migrate

# Start application
./bin/app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow Go best practices and conventions
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Database Connection Issues**
```bash
# Check if PostgreSQL is running
make health

# Reset database
make reset-db
```

**Frontend Build Issues**
```bash
# Clear cache and reinstall
rm -rf frontend/node_modules frontend/package-lock.json
cd frontend && npm install
```

**Port Already in Use**
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

### Getting Help
- Check the [Issues](https://github.com/your-repo/room-reservation-system/issues) page
- Read the [Wiki](https://github.com/your-repo/room-reservation-system/wiki) for detailed documentation
- Join our [Discord](https://discord.gg/your-server) community

## 🗺️ Roadmap

- [ ] **Mobile App** (React Native)
- [ ] **Calendar Integration** (Google Calendar, Outlook)
- [ ] **Video Conferencing** integration
- [ ] **IoT Integration** (smart locks, sensors)
- [ ] **Advanced Analytics** with charts
- [ ] **Multi-language Support**
- [ ] **API Rate Limiting Dashboard**
- [ ] **Webhook System** for integrations

## 👥 Team

- **Backend Development** - [Your Name](https://github.com/yourusername)
- **Frontend Development** - [Your Name](https://github.com/yourusername)
- **DevOps** - [Your Name](https://github.com/yourusername)

---

⭐ **Star this repository if you find it helpful!**

Built with ❤️ using Go and React