## Project Overview

C-Forge is a collaborative platform designed for programmers to create rooms, share information, and track their progress across various coding platforms (LeetCode, GitHub, and Codeforces). The application provides features such as user authentication, room management, messaging, and platform statistics integration.

## Architecture Analysis

### Backend Architecture

The backend is built with:

- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **External APIs**: Integration with LeetCode, GitHub, and Codeforces APIs
- **Security**: Helmet for HTTP headers, CORS protection, and message encryption

The architecture follows an MVC-like pattern:

- Models: Define database schemas
- Controllers: Handle request/response logic
- Routes: Define API endpoints
- Services: Encapsulate external API interactions
- Utils: Provide helper functions

### Code Structure Evaluation

**Strengths:**

- Well-organized folder structure with clear separation of concerns
- Consistent error handling patterns
- Modular code with reusable components
- Security measures implemented (authentication, encryption)
- Good use of middleware for authentication

**Areas for Improvement:**

- Some controllers are too large (e.g., `authController.js`, `adminRoomController.js`)
- Inconsistent use of async/await error handling (some use try/catch, others don't)
- Duplicate code in platform service modules
- Missing centralized logging system

## Security Analysis

**Implemented Security Measures:**

- JWT authentication for protected routes
- Password hashing with bcrypt
- Message encryption for chat functionality
- CORS configuration
- HTTP security headers with helmet

**Security Concerns:**

1. Token refresh mechanism is missing
2. No rate limiting for authentication endpoints
3. Potential MongoDB injection vulnerabilities in some queries
4. Hard-coded timeout values in API requests
5. Possible exposure of sensitive error details to clients

## API Design Evaluation

The API follows RESTful conventions with appropriate HTTP methods:

- GET for retrieving data
- POST for creating resources
- PUT for updating resources
- DELETE for removing resources

**Strengths:**

- Logical endpoint naming
- Proper use of HTTP status codes
- Consistent response formats
- Protected routes with middleware

**Improvement Opportunities:**

- Add API versioning (e.g., `/api/v1/...`)
- Implement pagination consistently across all list endpoints
- Add more comprehensive query parameter validation
- Consider implementing GraphQL for complex data requirements

## Database Schema Analysis

The project uses three main collections:

- User: Stores user information and platform stats
- Room: Manages room details, members, and permissions
- Message: Stores encrypted communications

**Schema Design Evaluation:**

- Good use of references between collections
- Proper indexing for performance optimization
- Appropriate data validation
- Well-thought-out nested objects for platform data

**Potential Improvements:**

- Consider using transactions for operations that modify multiple documents
- Add more granular indexing for specific query patterns
- Add TTL index for temporary data like join requests
- Consider schema versioning strategy for future updates

## Critical Updates Required

1. **Security Fixes:**

   - Implement rate limiting on authentication routes
   - Add input sanitization for MongoDB queries
   - Remove sensitive error details from production responses
   - Add token refresh mechanism
   - Strengthen password validation requirements

2. **Performance Optimizations:**

   - Add caching for platform API responses
   - Optimize MongoDB queries with proper projection
   - Implement connection pooling
   - Add database query timeouts

3. **Code Quality Improvements:**

   - Refactor large controllers into smaller, focused modules
   - Standardize error handling patterns
   - Add comprehensive JSDoc comments
   - Create centralized logging system
   - Implement more thorough input validation

4. **Feature Enhancements:**
   - Implement websocket connections for real-time messaging
   - Add pagination for all list endpoints
   - Implement more robust platform API error handling
   - Add user account verification via email

## README.md

# C-Forge

C-Forge is a collaborative platform for programmers to track progress across coding platforms, create community rooms, and share knowledge.

## Features

- **User Authentication**: Secure login/signup with JWT and Google OAuth
- **Platform Integration**: Connect and track stats from LeetCode, GitHub, and Codeforces
- **Community Rooms**: Create, join, and manage collaborative spaces
- **Secure Messaging**: End-to-end encrypted room messaging
- **Leaderboards**: Compare progress with room members
- **Public Profiles**: Share your coding journey and stats

## Tech Stack

### Backend

- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Bcrypt for password hashing
- Crypto for message encryption

### Frontend (not included in this analysis)

- React.js
- React Router
- Redux for state management
- Axios for API calls
- TailwindCSS for styling

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string
MONGODB_URI=your_mongodb_connection_string_backup

# JWT Authentication
JWT_SECRET=your_jwt_secret_key

# Message Encryption
CRYPTO_SECRET=your_32_character_secret_key

# External APIs
GITHUB_TOKEN=your_github_personal_access_token
GOOGLE_CLIENT_ID=your_google_client_id

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/cforge.git
cd cforge
```

2. Install backend dependencies

```bash
cd backend
npm install
```

3. Start the development server

```bash
npm run dev
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/login`: Login with email and password
- `POST /api/auth/google`: Authenticate with Google

### User Endpoints

- `GET /api/users/profile`: Get current user profile
- `POST /api/users/setup-platforms`: Set up coding platform usernames
- `PUT /api/users/platform/refresh`: Refresh platform statistics
- Various update endpoints for user settings

### Room Endpoints

- `POST /api/rooms/create`: Create a new room
- `GET /api/rooms`: Get all rooms for current user
- `GET /api/rooms/search`: Search public rooms
- `GET /api/rooms/:roomId`: Get room details
- `POST /api/rooms/:roomId/join`: Request to join a room
- `DELETE /api/rooms/:roomId/leave`: Leave a room

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

### Public Endpoints

- `GET /api/u/:username`: Get public user profile
- `GET /api/u/hmap/:username`: Get platform heatmaps
- `GET /api/u/lc-stats/:username`: Get LeetCode question stats

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Configure proper security settings and CORS restrictions
3. Use a process manager like PM2 to run the server
4. Set up NGINX as a reverse proxy with SSL

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- LeetCode, GitHub and Codeforces for their APIs
- The amazing open-source community for their tools and librariesProject overview -Cross-Platform Leaderboard
  Integrate leaderboards that aggregate performance across multiple platforms like LeetCode, Codeforces, HackerRank, etc.,
  Allowing users to see their overall coding rank across platforms.
  This would provide a unified view of their competitive programming skills.
