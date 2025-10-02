# 🎳 Pin Stats

A modern, responsive Progressive Web App (PWA) for tracking bowling scores, analyzing performance, and connecting with friends. Built with React, Node.js, and SQLite - completely self-contained with no external dependencies.

## ✨ Features

### 🎯 Core Functionality
- **Score Tracking**: Comprehensive bowling score calculation with strikes, spares, and 10th frame logic
- **Game Management**: Create, track, and review games with detailed frame-by-frame breakdowns
- **Equipment Arsenal**: Manage your bowling ball collection with full CRUD operations
- **Performance Analytics**: View detailed statistics including averages, high scores, and percentages

### 👥 Social Features
- **Friends System**: Connect with other bowlers and compare statistics
- **User Profiles**: Customizable profiles with bowling achievements
- **Game History**: Complete game log with filtering and search

### 📱 Modern Experience
- **Progressive Web App**: Install on any device for native app experience
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Clean Retro Theme**: Beautiful, modern design with nostalgic bowling alley vibes
- **Offline Support**: Service worker caching for improved performance

### 🔒 Security & Privacy
- **JWT Authentication**: Secure user authentication with password hashing
- **Input Validation**: Comprehensive validation using Zod schemas
- **Self-Contained**: No external services - your data stays private

## 🏗️ Architecture

### Backend
- **Framework**: Node.js with Express
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod schemas for all API endpoints
- **API Design**: RESTful API with comprehensive error handling

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom Clean Retro theme
- **State Management**: Zustand for simple, powerful state management
- **Routing**: React Router for SPA navigation
- **Icons**: Lucide React for beautiful, consistent icons
- **PWA**: Vite PWA plugin with service worker and manifest

### Infrastructure
- **Containerization**: Docker Compose for easy deployment
- **Database Persistence**: Named volumes for SQLite data persistence
- **Development**: Hot reloading for both frontend and backend
- **Production**: Optimized builds with proper caching

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Production Deployment
```bash
# Clone the repository
git clone <repository-url>
cd bowling-app

# Start with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Local Development
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev
```

## 📊 Database Schema

### Users
- **id**: Primary key
- **username**: Unique username (3-20 characters)
- **display_name**: Public display name
- **email**: Unique email address
- **hashed_password**: Bcrypt hashed password
- **created_at**: Account creation timestamp

### Balls (Bowling Equipment)
- **id**: Primary key
- **user_id**: Foreign key to users
- **name**: Ball name
- **brand**: Manufacturer
- **weight**: Weight in pounds (6-16)
- **created_at**: Addition timestamp

### Games
- **id**: Primary key
- **user_id**: Foreign key to users
- **ball_id**: Foreign key to balls (optional)
- **location**: Bowling alley location (optional)
- **score**: Final game score
- **is_complete**: Game completion status
- **created_at**: Game start timestamp

### Frames
- **id**: Primary key
- **game_id**: Foreign key to games
- **frame_number**: Frame number (1-10)
- **throws_data**: JSON array of pin counts
- **cumulative_score**: Running total score
- **is_complete**: Frame completion status

### Friends
- **id**: Primary key
- **requester_id**: User who sent request
- **receiver_id**: User who received request
- **status**: 'pending', 'accepted', or 'declined'
- **created_at**: Request timestamp
- **updated_at**: Last status change

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `GET /api/users/search` - Search users by username

### Games
- `POST /api/games` - Create new game
- `GET /api/games` - Get user's games (paginated)
- `GET /api/games/:id` - Get specific game details
- `POST /api/games/:id/frames` - Submit frame throws

### Bowling Balls
- `GET /api/balls` - Get user's bowling balls
- `POST /api/balls` - Add new bowling ball
- `GET /api/balls/:id` - Get specific ball
- `PUT /api/balls/:id` - Update ball details
- `DELETE /api/balls/:id` - Delete ball

### Friends
- `GET /api/friends` - Get friends list
- `GET /api/friends/requests` - Get pending requests
- `POST /api/friends/requests` - Send friend request
- `PUT /api/friends/requests/:id` - Accept/decline request

## 🎨 Design System

### Colors
- **Cream**: `#FDFBF5` (main background)
- **Teal**: `#14B8A6` (primary accent)
- **Coral**: `#F97316` (secondary accent)
- **Charcoal**: `#262626` (text)

### Typography
- **Headings**: Poppins (rounded, friendly)
- **Body**: Inter (clean, readable)

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Multiple variants with hover states
- **Inputs**: Clean forms with validation states
- **Layout**: Responsive grid with mobile-first approach

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DB_PATH=/app/data/bowling.db
PORT=5000
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api
```

### Docker Environment
The Docker Compose configuration handles environment variables automatically for development. For production, update the `docker-compose.yml` with your specific values.

## 📱 PWA Features

### Installation
- Automatic install prompts on supported browsers
- Add to home screen functionality
- Standalone app experience

### Offline Support
- Service worker caches static assets
- API response caching for better performance
- Graceful offline degradation

### Performance
- Optimized bundle sizes
- Lazy loading for routes
- Image optimization

## 🧪 Development

### Project Structure
```
bowling-app/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & validation
│   │   ├── services/       # Business logic
│   │   ├── db/            # Database setup
│   │   ├── app.js         # Express app
│   │   └── server.js      # Entry point
│   ├── data/              # SQLite database
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand stores
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # API client
│   │   └── App.jsx        # Main app
│   ├── public/            # Static assets
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

### Code Style
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Comments**: Comprehensive JSDoc comments
- **Validation**: Input validation on both client and server

## 🚢 Deployment

### Docker Production
```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Scaling
- Frontend and backend are stateless and can be scaled horizontally
- SQLite database is suitable for single-instance deployments
- For multi-instance deployments, consider migrating to PostgreSQL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎳 Bowling Scoring Rules

This app implements official ten-pin bowling scoring rules:

### Basic Scoring
- **Strike**: All 10 pins knocked down with first ball (score: 10 + next 2 throws)
- **Spare**: All 10 pins knocked down with two balls (score: 10 + next 1 throw)  
- **Open Frame**: Less than 10 pins knocked down (score: total pins knocked down)

### 10th Frame Special Rules
- If you roll a strike or spare in the 10th frame, you get to roll extra balls
- Strike in 10th: Roll 2 more balls
- Spare in 10th: Roll 1 more ball
- No strike/spare in 10th: Game ends after 2 balls

### Perfect Game
- A perfect game scores 300 points (12 strikes in a row)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Made with ❤️ for the bowling community**