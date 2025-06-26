# Backend Test Suite Guide

This test suite is designed for robust, isolated testing of the backend user controller using **Jest** and **Supertest**. It features direct controller imports, a custom Express app, and comprehensive mocking for all dependencies.

---

## Key Features

### 1. Direct Controller Import

- Imports controller methods directly for precise, isolated testing.

### 2. Custom Test Express App

- Sets up a dedicated Express app for tests.
- Includes custom authentication middleware for JWT validation.
- Explicitly defines all user-related routes for clarity.

### 3. Jest & Supertest Integration

- Uses **Jest** as the test runner and assertion library.
- Uses **Supertest** for HTTP request simulation against the Express app.
- Supports running all or specific controller tests via environment variables.

### 4. Enhanced Mocking

- Mocks all database and service dependencies (Mongoose models, helper functions, stats services, etc.).
- Allows simulation of both success and error scenarios for each dependency.

### 5. Comprehensive Error Handling

- Tests for all major error cases: missing/invalid tokens, validation errors, not found, and server errors.
- Custom error messages and status codes are validated.

### 6. Flexible Test Selection

- Run all tests or a specific controller's tests using the `TEST_METHOD` environment variable.

---

## Usage

### Run All Tests

```bash
npm test
```

### Run Specific Controller Tests

```bash
TEST_METHOD=setupLeetCode npm test
```

### Run with Custom JWT Secret

```bash
TEST_JWT=your-secret-key TEST_METHOD=setupLeetCode npm test
```

---

## CI/CD Integration Example

Add this to your CI pipeline (e.g., `.gitlab-ci.yml` or GitHub Actions):

```yaml
# Example for GitLab CI
test:
  stage: test
  script:
    - npm install
    - npm test
  variables:
    TEST_JWT: $CI_TEST_JWT_SECRET
    NODE_ENV: test
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
```

---

## Highlights from `userController.test.js`

- **Direct controller import** for isolated logic testing
- **Custom Express app** with JWT auth middleware
- **Supertest** for endpoint simulation
- **Jest** for mocking and assertions
- **Comprehensive coverage**: user details, search, platform setup (LeetCode, GitHub, Codeforces), active users, and authorization
- **Clear error handling**: covers all major error and edge cases

---

For more details, see the test file: `backend/tests/userController.test.js`.
