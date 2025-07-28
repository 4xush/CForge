# CForge: LeetCode Tracker & Competitive Programming Leaderboards 🚀

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.0.0-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)
![Redis](https://img.shields.io/badge/Redis-v6+-red.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-v5+-green.svg)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-blueviolet.svg)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[Features](#✨-key-features)• [Quick Start](#🚀-getting-started) • [Documentation](#📚-api-documentation) • [Tech Stack](#🛠-technology-stack) • [Contributing](#🤝-contributing)
<img src="frontend/public/preview/preview.png" alt="CForge Preview" style="border: 2px solid #666; border-radius: 8px;" />

</div>

CForge is a powerful full-stack platform focused on competitive programming progress tracking and peer-based learning. It features an advanced LeetCode Problem Tracker with smart review reminders and room-based leaderboards that aggregate statistics from multiple platforms (LeetCode, Codeforces, GitHub). Built with performance and community in mind, it enables users to create rooms, compare coding progress with peers, and maintain consistent practice through structured reviews. With progressive web app (PWA) capabilities, real-time communication, and comprehensive analytics, CForge helps competitive programmers and interview candidates enhance their skills through healthy competition and systematic problem review.

## ✨ Key Features

### Multi-Platform Integration

- LeetCode statistics and contest ratings
- Codeforces performance metrics
- GitHub contribution analytics
- Automated platform username verification

### Community & Collaboration

- Room-Based Communities: Create private/public rooms for peer groups
- Interactive Chat: Discuss problems, share resources, and collaborate
- Peer Mentorship: Connect with higher-ranked members for guidance
- Contest Tracking: Stay updated on LeetCode and Codeforces contests
- 7-day invitation links for seamless member onboarding

### Progressive Web App (PWA)

- Install as a native-like app on mobile and desktop devices
- Offline access to previously loaded content
- Faster loading times after initial setup
- Push notifications for reminders and platform updates
- Automatic background updates
- Full-screen app-like experience without browser UI

### Problem Tracker & Smart Reminders

- LeetCode Problem Tracker with automatic synchronization
- Mark important problems for prioritized review
- Set spaced repetition reminders for optimal retention
- Customizable notification preferences
- Browser and service worker notifications
- Visual statistics of solved problems by difficulty

### Advanced Analytics

- Progress Tracking: Unified dashboard showing growth across platforms
- Performance Insights: Topic-wise problem analysis and solving patterns
- Activity Heatmaps: Visual representation of coding activity
- Comparative Analytics: Benchmarking against peer performance
- Custom level progression based on weighted problem counts

### Technical Excellence

#### Advanced Caching System

- Redis-powered caching layer
- Optimized data retrieval
- Configurable cache invalidation
- Reduced API load
- Offline cache for PWA functionality

#### Intelligent Rate Limiting

- Platform-specific rate limits
- Redis-based rate limiting storage
- Configurable limits per endpoint
- Development mode bypass options
- Graceful degradation with informative feedback

#### Real-Time Features

- WebSocket-based live room chat updates
- Persistent message delivery with reconnection handling
- Push notifications through service workers
- Offline message queuing

#### Additional Features

- Public Profiles: Share your coding journey and stats
- Health Monitoring: System status and performance insights
- Fair Usage Protection: Rate limiting prevents abuse
- Optimized Performance: Caching improves response times for frequently accessed data
- Comprehensive Help & FAQ system with integrated support

## 🛠 Technology Stack

### Backend Architecture

- **Core**: Node.js + Express
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for performance optimization
- **Real-time**: WebSocket implementation
- **Security**: JWT, bcrypt, and crypto
- **Performance**:
  - Redis-based rate limiting
  - Concurrent processing
  - Batch operations
  - Smart caching strategies
- **Monitoring**: Winston logging system

### Frontend Technology

- **Framework**: React.js with Vite
- **State Management**: Context API with custom hooks
- **Styling**: TailwindCSS with responsive design
- **Real-time**: WebSocket client with reconnection handling
- **UI/UX**: Modern responsive design with dark mode
- **Data Viz**: Custom chart components and heatmaps
- **PWA**: Full Progressive Web App support with offline capabilities

### Frontend Architecture

- **Core Framework**:
  - React 18.3.1 with React DOM
  - Vite as the build tool
  - Next.js 13.4.19 integration
- **UI Components & Styling**:
  - TailwindCSS with PostCSS and Autoprefixer
  - Material UI (MUI) for rich UI elements
  - Radix UI primitives for enhanced accessibility
  - Framer Motion for smooth animations and transitions
  - Lucide React for consistent, modern iconography
- **Data Management & Communication**:
  - Socket.io-client for real-time features with reconnection
  - Axios for HTTP requests with interceptors
  - Custom hook patterns for shared logic
- **PWA & Offline Features**:
  - Vite PWA plugin for Progressive Web App configuration
  - Service Worker for offline content caching
  - Push notification system with browser and service worker support
  - Workbox-powered caching strategies for different resource types
- **Visualization & Charts**:
  - Recharts for flexible data visualization
  - Custom heatmap components for activity tracking
  - React Particles for interactive backgrounds
- **Authentication & Security**:
  - @react-oauth/google for Google Sign-In
  - JWT handling with jwt-decode
  - Secure storage mechanisms
- **User Experience**:
  - React Hot Toast for elegant notifications
  - Date-fns for comprehensive date handling
  - Responsive design with Tailwind breakpoints
  - Offline status indicators
  - Custom reminder scheduling system
- **Performance Optimizations**:
  - React.lazy and Suspense for code splitting
  - Vite's build optimization
  - Service Worker for offline capabilities
  - Optimized asset caching strategies
  - Lazy-loading for images and components

## 🚀 Getting Started

### System Requirements

- Node.js 18.0.0 or newer
- MongoDB 5.0 or newer
- Redis 6.0 or newer
- npm 8.0.0 or newer

### Installation Steps

1. **Clone and Setup**

   ```bash
   # Clone the repository
   git clone https://github.com/4xush/CForge.git
   cd cforge

   # Install dependencies
   npm install
   cd frontend && npm install
   ```

2. **Configure Environment**

   ```bash
   # Copy example environment files
   cp .env.example .env
   cd frontend && cp .env.example .env.local
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the `backend` directory with the following variables:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Connection
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_URI_BACKUP=your_mongodb_connection_string_backup # Optional backup

   # JWT Authentication
   JWT_SECRET=your_jwt_secret_key

   # Message Encryption
   CRYPTO_SECRET=your_32_character_secret_key

   # External APIs
   GITHUB_TOKEN=your_github_personal_access_token
   GOOGLE_CLIENT_ID=your_google_client_id

   # Frontend URL for CORS
   FRONTEND_URL=http://localhost:5173

   # --- New Enhanced Features Configuration ---
   # Caching TTLs (in seconds)
   LEETCODE_CACHE_TTL=1800
   GITHUB_CACHE_TTL=1800
   CODEFORCES_CACHE_TTL=1800
   DEFAULT_CACHE_TTL=900

   # Concurrency Limits
   PLATFORM_CONCURRENCY_LIMIT=5
   DATABASE_CONCURRENCY_LIMIT=10
   GENERAL_CONCURRENCY_LIMIT=8
   EXTERNAL_CONCURRENCY_LIMIT=3

   # Batch Processing Sizes
   PLATFORM_BATCH_SIZE=10
   ROOM_BATCH_SIZE=5
   BULK_BATCH_SIZE=10

   # Rate Limiting Configuration (window in ms, max requests)
   AUTH_RATE_LIMIT_WINDOW=900000
   AUTH_RATE_LIMIT_MAX=5
   PLATFORM_REFRESH_WINDOW=600000
   PLATFORM_REFRESH_MAX=1
   ROOM_OPERATIONS_WINDOW=300000
   ROOM_OPERATIONS_MAX=10
   MESSAGING_RATE_WINDOW=60000
   MESSAGING_RATE_MAX=30
   API_RATE_LIMIT_WINDOW=900000
   API_RATE_LIMIT_MAX=100

   # Development settings
   DISABLE_RATE_LIMITING=false # Set to true to disable rate limits in dev
   ```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/login`: Login with email and password
- `POST /api/auth/google`: Authenticate with Google
  - _Now with enhanced rate limiting and brute-force protection._

### User Endpoints

- `GET /api/users/profile`: Get current user profile
- `POST /api/users/setup-platforms`: Set up coding platform usernames
- **`PUT /api/users/platform/refresh/`**: Refresh platform statistics for the authenticated user.
  - Rate limited (e.g., 1 req / 10 min per user).
  - Supports `?force=true` & `?noCache=true`.
- Various update endpoints for user settings

### Room Endpoints

- `POST /api/rooms/create`: Create a new room
- `GET /api/rooms`: Get all rooms for current user
- `GET /api/rooms/search`: Search public rooms
- `GET /api/rooms/:roomId`: Get room details
- `POST /api/rooms/:roomId/join`: Request to join a room
- `DELETE /api/rooms/:roomId/leave`: Leave a room
- **`POST /api/rooms/:roomId/bulk-refresh`**: Bulk refresh platform data for specified users in a room.
- **`POST /api/rooms/:roomId/update-{platform}-stats`**: (e.g., `update-leetcode-stats`) Enhanced room platform updates.
  - Rate limited (e.g., 1 req / 2 hours per room).
  - Supports `?force=true`.

### Admin Room Endpoints

- `PUT /api/rooms/admin/:roomId`: Update room details
- `POST /api/rooms/admin/:roomId/admins/add`: Add a room admin
- `POST /api/rooms/admin/:roomId/kick`: Kick a user from room
- `POST /api/rooms/admin/:roomId/invite`: Generate room invite

### Message Endpoints

- `POST /api/rooms/:roomId/messages`: Send a message
- `GET /api/rooms/:roomId/messages`: Get room messages
- `PUT /api/rooms/messages/:messageId`: Edit a message
- `DELETE /api/rooms/messages/:messageId`: Delete a message
  - _Now with enhanced rate limiting._

### Problem Tracker Endpoints (New)

- `GET /api/problem-tracker/dashboard`: Get problem tracker dashboard with stats
- `GET /api/problem-tracker/problems`: Get tracked problems with filtering and pagination
- `POST /api/problem-tracker/sync`: Sync recent problems from LeetCode
- `PUT /api/problem-tracker/problems/:id`: Update problem properties (importance, notes)
- `POST /api/problem-tracker/problems/:id/reminder`: Create review reminder
- `PUT /api/problem-tracker/reminders/:id/complete`: Mark reminder as completed
- `PUT /api/problem-tracker/reminders/:id/skip`: Skip/snooze reminder for later review
- `GET /api/problem-tracker/reminders/pending`: Get all pending reminders

### Public Endpoints

- `GET /api/u/:username`: Get public user profile
- `GET /api/u/hmap/:username`: Get platform heatmaps
- `GET /api/u/lc-stats/:username`: Get LeetCode question stats

### Cache Management Endpoints

- `DELETE /api/users/platform/cache?platform=<platformName>`: Invalidate user's cache for a specific platform.
- `GET /api/users/platform/stats`: Get platform service statistics (cache hits/misses, etc.).

### Health Check Endpoints

- `GET /api/health`: Basic health check.
- `GET /api/health/ping`: Simple ping.
- `GET /api/health/detailed`: Detailed service health (requires auth).
- `GET /api/health/cache`, `/api/health/database`, `/api/health/services`: Service-specific checks (requires auth).
- `GET /api/health/ready`: Kubernetes readiness probe.
- `GET /api/health/live`: Kubernetes liveness probe.
- `POST /api/health/restart/:serviceName`: Admin endpoint to restart a service (requires secret key).

## Architecture & Security Highlights

### Backend Architecture

The backend architecture follows an MVC-like pattern with a strong focus on separation of concerns. Recent enhancements have significantly bolstered its capabilities:

- **Security**: Includes JWT authentication, password hashing, message encryption, CORS, Helmet, and comprehensive multi-tier rate limiting and brute force protection. Input sanitization practices are in place.
- **Performance**: Leverages Redis for intelligent caching, `p-limit` for managing concurrency in external API calls and database operations, and batch processing for bulk tasks.
- **Reliability**: Implements retry logic with exponential backoff for transient API failures, graceful degradation if Redis or cache is unavailable, and robust error handling.
- **Scalability**: The design is job-queue ready (e.g., BullMQ) for handling background tasks and supports horizontal scaling.

### Frontend Architecture

The frontend architecture emphasizes component reusability, responsive design, and progressive enhancement:

- **PWA Implementation**: Service worker registration with workbox for advanced caching strategies, providing offline capability and app-like experience.
- **Notification System**: Dual-path implementation for notifications that works in both standard browser and PWA contexts, using service worker registration for PWA environments.
- **Context Management**: Custom hooks with React Context API for efficient state management across the application.
- **Performance**: Code splitting, lazy loading, and optimized asset delivery for faster initial page loads and improved UX.
- **Offline Support**: Strategic caching of assets and previously visited content for limited offline functionality, with clear online/offline status indicators.

## Troubleshooting Common Issues

### API and Performance Issues

- **Rate Limit Errors (429 Too Many Requests)**: Check client-side request frequency or adjust rate limit ENV variables if necessary.
- **Cache Issues**: Use `DELETE /api/users/platform/cache` to invalidate cache. Check Redis connectivity if issues persist.
- **Performance Monitoring**: Utilize `GET /api/health/detailed` and `GET /api/users/platform/stats` for insights.
- **Logs**: Detailed logs are available in `backend/logs/` (e.g., `platform-controller-combined.log`, `redis-combined.log`).

### PWA and Notification Issues

- **PWA Installation Problems**: Clear site data and reinstall the PWA. Ensure the device supports PWA features.
- **Notification Not Working**: For PWA users, notification permissions must be granted and service workers must be active. Check browser settings if notifications don't appear.
- **Offline Content Not Available**: The app caches previously visited pages and data. Content not previously loaded won't be available offline.
- **Service Worker Updates**: If new features aren't appearing, try closing all tabs of the app and reopening to allow service worker updates.
- **Mobile-Specific Issues**: For iOS users, PWA notifications have limitations due to platform restrictions.

## 🚀 Deployment

### Production Setup

1. Build the application

   ```bash
   npm run build
   ```

2. Configure production environment

   ```env
   NODE_ENV=production
   MONGODB_URI=your_production_mongodb_uri
   REDIS_URL=your_production_redis_url
   ```

3. Start the server
   ```bash
   npm start
   ```

### PWA Configuration for Production

1. Ensure proper PWA manifest settings in `vite.config.js`:

   ```javascript
   VitePWA({
     registerType: "autoUpdate",
     manifest: {
       name: "CForge",
       short_name: "CForge",
       theme_color: "#6b46c1",
       icons: [
         // Icon configurations
       ],
       // Other PWA settings
     },
     workbox: {
       // Caching strategies
       navigateFallback: "/index.html",
       // Workbox configurations
     },
   });
   ```

2. Configure Service Worker for Push Notifications:

   - Ensure `sw-push.js` is properly set up for notification handling
   - Test notification delivery across browsers and devices
   - Implement proper error handling for different environments

3. Test PWA Installation Flow:
   - Verify install prompts appear on supported devices
   - Test home screen launch behavior
   - Validate offline functionality works as expected

### Health Monitoring

- `/api/health`: Basic health check
- `/api/health/detailed`: Detailed system status
- `/api/health/cache`: Cache system status
- `/api/health/redis`: Redis connection status
- `/api/health/services`: Check all microservices status

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Follow our development standards

   - **Backend**:
     - Use Winston for logging
     - Implement proper error handling
     - Add appropriate rate limiting
     - Include health checks
     - Add tests for new features
   - **Frontend**:
     - Follow component structure patterns
     - Test on both PWA and regular browser environments
     - Ensure mobile responsiveness
     - Verify offline functionality when applicable
     - Document new features in Help & FAQ section

4. Commit your changes
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. Push to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
6. Open a Pull Request

## 📱 Mobile & PWA Features

CForge is fully installable as a Progressive Web App on both mobile and desktop devices:

### Installation

- **Android**: Use Chrome or compatible browser > tap menu > "Install App"
- **iOS**: Use Safari > tap share icon > "Add to Home Screen"
- **Desktop**: Click install icon in address bar of compatible browsers

### Features

- Full offline access to previously visited content
- Push notifications for reminders and updates
- App-like experience with full-screen mode
- Faster loading after initial setup
- Automatic background updates

### Browser Support

- Chrome (Android, Desktop): Full support
- Edge: Full support
- Safari (iOS, macOS): Installation supported, notifications have limitations
- Firefox: Partial PWA support
- Samsung Internet: Full support

## Acknowledgments

- LeetCode API Team
- Codeforces API
- GitHub API

Built by Ayush : )
