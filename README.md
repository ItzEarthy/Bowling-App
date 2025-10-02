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
# Frontend: http://localhost:8031
# Backend API: http://localhost:8032
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
VITE_API_BASE_URL=http://localhost:5000/api
```

### Deployment / Cloudflare tunnel notes

- Frontend should talk to the backend using a configurable base URL. Set `VITE_API_BASE_URL` in the frontend environment to an absolute URL (including scheme) when you proxy or tunnel the app (for example: `https://api.example.com/api`). If omitted, the frontend will use a same-origin `/api` path which is usually the correct choice when serving frontend and backend under the same host or through a reverse-proxy/tunnel.

- Backend CORS can be configured with `CORS_ORIGINS` (comma-separated) or `CORS_ORIGIN`. Example:

```bash
CORS_ORIGINS=https://bowl.example.com,https://dashboard.example.com
# or allow any origin (careful in production):
CORS_ORIGINS=*
```

### Debugging a 403 on /manifest.json or other static assets

If you see browser errors like "Failed to load resource: the server responded with a status of 403" for `/manifest.json` or requests timing out through your Cloudflare tunnel, try the following checks:

1. Check the container logs for the frontend and any proxy (Cloudflared, Traefik, nginx) to see why the request was rejected.

2. From your local machine or inside the host/container, curl the manifest with the Host header matching your public hostname to reproduce the request as the browser does:

```powershell
# replace bowl.example.com with your tunnel hostname
curl -v -H "Host: bowl.example.com" https://bowl.example.com/manifest.json
```

3. If curl returns 403 but the file exists in the container's `frontend/dist` or `public` folder, verify your reverse-proxy is forwarding the request to the correct service and not blocking static files by path.

4. Confirm that any security middleware (CSP, auth middleware, custom route guards) isn't intercepting requests for the manifest or static assets. In this repo, `backend/src/app.js` configures helmet's CSP — ensure your proxy and hostnames are covered by CSP if you host assets elsewhere.

5. Browser caching and service worker interference: unregister the service worker from the Application tab in DevTools and reload (or open an incognito window) to ensure old service worker behavior isn't causing 403s.

6. Timeouts (Axios): if frontend requests to the API time out (ECONNABORTED), make sure the frontend is calling the correct base URL (see `VITE_API_BASE_URL`) and that Cloudflare tunnel or reverse-proxy routes requests to the backend port. Prefer using same-origin `/api` path and let the proxy handle routing.

7. If you're using Cloudflare Access or other auth on the tunnel, ensure that public static assets are allowed or that the tunnel is configured to bypass access checks for those paths.

8. Useful quick checks:

```powershell
# Check that frontend container serves index.html
curl -v https://bowl.example.com/

# Check manifest (includes Host header if needed)
curl -v -H "Host: bowl.example.com" https://bowl.example.com/manifest.json

# Check backend health endpoint (adjust hostname/path if proxied)
curl -v https://bowl.example.com/api/health
```

If you want, share the Cloudflare tunnel/reverse-proxy configuration (without secrets) and I can suggest specific tweaks.

### Portainer / Docker Compose example (environment variables)

If you're running the services via Portainer or Docker Compose and exposing them through a Cloudflare tunnel, set environment variables on the containers (or in your compose file). Example `docker-compose.override.yml` snippet:

```yaml
services:
	frontend:
		environment:
			- VITE_API_BASE_URL=https://bowl.soearthy.org/api   # optional: only if API is on different host
		labels:
			- traefik.http.routers.frontend.rule=Host(`bowl.soearthy.org`)

	backend:
		environment:
			- PORT=5000
			- CORS_ORIGINS=https://bowl.soearthy.org
			- CSP_EXTRA_ORIGINS=https://bowl.soearthy.org
		labels:
			- traefik.http.routers.backend.rule=Host(`api.bowl.soearthy.org`) || PathPrefix(`/api`)
```

Adjust labels and hostnames to match your proxy/tunnel configuration. In many Cloudflare tunnel setups you can route both frontend and `/api` to the same hostname (recommended) and leave `VITE_API_BASE_URL` unset so the frontend uses same-origin `/api`.

### CSP-specific troubleshooting (service worker / sw.js issues)

- Confirm the service worker file exists at `/sw.js` in your deployed frontend build directory (often `dist/sw.js` or `public/sw.js` depending on bundler config).
- If the browser logs "Refused to create a worker ... violates Content Security Policy", inspect response headers for the page and for `sw.js`. Look for `Content-Security-Policy` and verify `worker-src` or `script-src` includes `'self'` or the host serving `sw.js`.
- We added `CSP_EXTRA_ORIGINS` to `backend/src/app.js` so you can include the public origin(s) there. Example: `CSP_EXTRA_ORIGINS=https://bowl.soearthy.org`.
- If you're terminating HTTPS at Cloudflare and proxying internally via HTTP, CSP should still be based on public origin; ensure your proxy does not rewrite or strip CSP headers unexpectedly.
- For a quick local test, open DevTools → Application → Service Workers and unregister any previous service worker, then reload. Old service workers can interfere with new builds and manifest fetches.

If you'd like, I can generate a small checklist specific to your Portainer deployment and Cloudflare tunnel settings — paste your non-secret tunnel/ingress rules and I will tailor it.

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