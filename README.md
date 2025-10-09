# 🎳 Pin Stats#  Pin Stats



A modern Progressive Web App for tracking bowling scores, analyzing performance, and improving your game.A modern Progressive Web App for tracking bowling scores and analyzing performance.



![Pin Stats Screenshot](frontend/public/PinStats.png)## Quick Start



## ✨ Features\\\ash

docker-compose up -d

- **📱 Progressive Web App** - Install on mobile devices, works offline\\\

- **🎯 Multiple Entry Methods** - Pin-by-pin, frame-by-frame, or final score entry

- **📊 Performance Analytics** - Track strikes, spares, averages, and trendsAccess: http://localhost:8031

- **🏆 Achievement System** - Unlock achievements as you improve

- **👥 Social Features** - Add friends and compare performance## Development

- **🎳 Ball Arsenal Management** - Track your bowling ball collection

- **💾 Auto-Save** - Never lose progress, even if your phone dies mid-game\\\ash

- **🔄 Automatic Updates** - Always get the latest features seamlessly# Backend

cd backend && npm install && npm run dev

## 🚀 Quick Start

# Frontend

### Using Docker (Recommended)cd frontend && npm install && npm run dev

\\\

```bash

git clone https://github.com/ItzEarthy/Bowling-App.git## Tech Stack

cd Bowling-App

docker-compose up -d- Backend: Node.js, Express, SQLite

```- Frontend: React, Vite, Tailwind CSS

- Deploy: Docker, nginx

Access at: **http://localhost:8031**

### Manual Setup

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, SQLite, JWT Authentication
- **Frontend**: React 18, Vite, Tailwind CSS, Zustand
- **PWA**: Service Workers, Web App Manifest, Offline Support
- **Deployment**: Docker, nginx, Multi-stage builds

## 📋 API Documentation

The app includes a full REST API for:
- User authentication and management
- Game creation and scoring
- Statistics and analytics
- Social features (friends, sharing)
- Ball arsenal management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📝 Changelog


### v2.2.0 - 2025-10-09
**🛡️ Critical PWA Authentication & Session Bug Fix**
- **Fixed**: Users can now always log in after session expiration—no more lockouts or uninstall required!
- **Fixed**: Service worker no longer caches authentication errors (401/403)
- **Fixed**: Token validation now happens before setting authenticated state
- **Fixed**: All caches are cleared on logout, login, and auth errors
- **Added**: Centralized cache management utility for robust state cleanup
- **Added**: Custom service worker extensions for cache clearing
- **Improved**: Logging and diagnostics for authentication and cache events
- **Docs**: Added detailed bug analysis, troubleshooting, and deployment guides

### v2.1.0 - 2025-10-03
**🔄 Enhanced Session Management & Auto-Save**
- **Added**: Comprehensive auto-save system - never lose game progress
- **Added**: Automatic token refresh to prevent 403 session timeouts
- **Added**: Game state restoration after app suspension/phone shutdown
- **Added**: Smart lifecycle management for mobile devices
- **Improved**: Service worker update handling with better error recovery
- **Fixed**: PWA updates now apply automatically without reinstalling
- **Fixed**: Persistent sessions now last 30 days vs previous 7 days

### v2.0.0 - 2025-09-15
**🎯 Major UI/UX Overhaul**
- **Added**: Pin-by-pin scoring with interactive pin selection
- **Added**: Multiple data entry methods (pin-by-pin, frame-by-frame, final score)
- **Added**: Progressive Web App capabilities with offline support
- **Added**: Achievement system with unlockable badges
- **Added**: Social features - add friends and compare stats
- **Redesigned**: Complete UI overhaul with modern design system
- **Improved**: Mobile-first responsive design
- **Enhanced**: Performance analytics and trend visualization

### v1.5.0 - 2025-08-20
**📊 Analytics & Statistics**
- **Added**: Comprehensive statistics dashboard
- **Added**: Trend analysis and performance tracking
- **Added**: Ball arsenal management system
- **Added**: Goal setting and progress tracking
- **Improved**: Game log with filtering and search
- **Enhanced**: Data visualization with charts and graphs

### v1.2.0 - 2025-07-10
**🔐 Authentication & Security**
- **Added**: User registration and authentication system
- **Added**: JWT-based session management
- **Added**: Admin panel for user management
- **Added**: Role-based access control
- **Improved**: API security with input validation
- **Enhanced**: Database migrations and backup system

### v1.0.0 - 2025-06-01
**🎳 Initial Release**
- **Added**: Basic bowling score tracking
- **Added**: Frame-by-frame score entry
- **Added**: Game history and storage
- **Added**: Docker deployment setup
- **Added**: REST API foundation
- **Created**: Initial React frontend with Tailwind CSS

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ItzEarthy/Bowling-App/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ItzEarthy/Bowling-App/discussions)

---

<div align="center">
  <p>Made with ❤️ for the bowling community</p>
  <p>© 2025 ItzEarthy. All rights reserved.</p>
</div>