# Active Users API Documentation

## Overview
This API provides endpoints to track and retrieve information about active users in the CForge application. These endpoints are restricted to owners only and require a secret key for access.

## Authentication
All active users endpoints require the `OWNER_SECRET_KEY` environment variable to be set and provided in requests.

### Environment Setup
Add the following to your `.env` file:
```
OWNER_SECRET_KEY=your_super_secret_key_here
```

### Providing the Secret Key
You can provide the secret key in two ways:

1. **Header (Recommended)**:
   ```
   x-secret-key: your_super_secret_key_here
   ```

2. **Query Parameter**:
   ```
   ?secretKey=your_super_secret_key_here
   ```

## Endpoints

### 1. Get Active Users

**Endpoint**: `GET /api/users/active`

**Description**: Retrieves a list of users who were active within a specified time period.

**Query Parameters**:
- `days` (optional): Number of days to look back (default: 7)

**Example Requests**:
```bash
# Get users active in last 7 days (using header)
curl -H "x-secret-key: your_super_secret_key_here" \
     http://localhost:5000/api/users/active

# Get users active in last 30 days (using query param)
curl "http://localhost:5000/api/users/active?days=30&secretKey=your_super_secret_key_here"
```

**Response**:
```json
{
  "message": "Active users fetched successfully",
  "count": 15,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "lastActiveAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "username": "jane_smith",
      "email": "jane@example.com",
      "lastActiveAt": "2024-01-14T15:45:00.000Z"
    }
  ]
}
```

### 2. Get Active Users Count

**Endpoint**: `GET /api/users/active/count`

**Description**: Returns the count of users who were active in the last 7 days.

**Example Requests**:
```bash
# Using header
curl -H "x-secret-key: your_super_secret_key_here" \
     http://localhost:5000/api/users/active/count

# Using query parameter
curl "http://localhost:5000/api/users/active/count?secretKey=your_super_secret_key_here"
```

**Response**:
```json
{
  "message": "Active users count fetched successfully",
  "count": 15
}
```

## Error Responses

### Missing Secret Key
**Status**: `401 Unauthorized`
```json
{
  "message": "Access denied: Secret key required. Provide it via 'x-secret-key' header or 'secretKey' query parameter"
}
```

### Invalid Secret Key
**Status**: `403 Forbidden`
```json
{
  "message": "Access denied: Invalid secret key"
}
```

### Server Configuration Error
**Status**: `500 Internal Server Error`
```json
{
  "message": "Server configuration error: OWNER_SECRET_KEY not set"
}
```

## Activity Tracking

### How It Works
- User activity is automatically tracked when users make authenticated requests
- The `lastActiveAt` field is updated only if more than 1 hour has passed since the last update
- Updates happen asynchronously to avoid blocking requests

### Activity Definition
A user is considered "active" if they have made any authenticated request to the API within the specified time period.

## Security Notes

1. **Keep the secret key secure**: Never expose the `OWNER_SECRET_KEY` in client-side code or public repositories
2. **Use HTTPS in production**: Always use HTTPS when making requests with the secret key
3. **Rotate keys regularly**: Consider rotating the secret key periodically for enhanced security
4. **Limit access**: Only provide the secret key to authorized personnel who need access to user analytics

## Testing

You can test the endpoints using the provided test script:
```bash
cd backend
node scripts/testActiveUsers.js
```

This script will test both direct function calls and API endpoints with various scenarios including invalid keys.