#!/bin/bash

# CForge Backend Setup Script
# This script sets up the enhanced CForge backend with all dependencies and services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

print_status "🚀 Starting CForge Backend Enhanced Setup..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the root directory (cforge/)"
    exit 1
fi

# Check Node.js version
print_status "Checking Node.js version..."
if check_command node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE="16.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
        print_success "Node.js version $NODE_VERSION is compatible"
    else
        print_error "Node.js version $NODE_VERSION is too old. Please install Node.js >= 16.0.0"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js >= 16.0.0"
    exit 1
fi

# Check npm version
print_status "Checking npm version..."
if check_command npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm version $NPM_VERSION found"
else
    print_error "npm is not installed. Please install npm"
    exit 1
fi

# Check if MongoDB is accessible
print_status "Checking MongoDB connection..."
if [ -n "$MONGODB_URI" ]; then
    print_success "MongoDB URI found in environment"
else
    print_warning "MONGODB_URI not set. Make sure to configure it in .env file"
fi

# Check if Redis is accessible (optional)
print_status "Checking Redis availability..."
if check_command redis-cli; then
    if redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is running and accessible"
    else
        print_warning "Redis is installed but not running. Enhanced caching features will be disabled"
    fi
elif [ -n "$REDIS_URL" ]; then
    print_success "Redis URL found in environment (external Redis)"
else
    print_warning "Redis not found. Enhanced caching features will be disabled"
fi

# Create necessary directories
print_status "Creating required directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backend/temp
print_success "Directories created"

# Install dependencies
print_status "Installing npm dependencies..."
npm install

# Check if all critical dependencies are installed
print_status "Verifying critical dependencies..."
CRITICAL_DEPS=("express" "mongoose" "redis" "express-rate-limit" "p-limit" "winston")
for dep in "${CRITICAL_DEPS[@]}"; do
    if npm list "$dep" >/dev/null 2>&1; then
        print_success "$dep installed"
    else
        print_error "$dep not found in node_modules"
        exit 1
    fi
done

# Check .env file
print_status "Checking environment configuration..."
if [ -f ".env" ]; then
    print_success ".env file found"
    
    # Check for required environment variables
    REQUIRED_VARS=("MONGODB_URI" "JWT_SECRET" "ENCRYPTION_KEY" "FRONTEND_URL")
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env; then
            print_success "$var configured"
        else
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        print_warning "Missing required environment variables: ${MISSING_VARS[*]}"
        print_status "Please add these to your .env file"
    fi
    
    # Check for enhanced feature variables
    ENHANCED_VARS=("LEETCODE_CACHE_TTL" "PLATFORM_CONCURRENCY_LIMIT" "AUTH_RATE_LIMIT_MAX")
    MISSING_ENHANCED=()
    
    for var in "${ENHANCED_VARS[@]}"; do
        if ! grep -q "^$var=" .env; then
            MISSING_ENHANCED+=("$var")
        fi
    done
    
    if [ ${#MISSING_ENHANCED[@]} -gt 0 ]; then
        print_warning "Enhanced feature variables not configured: ${MISSING_ENHANCED[*]}"
        print_status "Adding default enhanced configuration..."
        
        cat >> .env << 'EOF'

# Enhanced Platform Service Configuration (Auto-added by setup script)
LEETCODE_CACHE_TTL=1800
GITHUB_CACHE_TTL=1800
CODEFORCES_CACHE_TTL=1800
DEFAULT_CACHE_TTL=900

# Concurrency Limits
PLATFORM_CONCURRENCY_LIMIT=5
DATABASE_CONCURRENCY_LIMIT=10
GENERAL_CONCURRENCY_LIMIT=8
EXTERNAL_CONCURRENCY_LIMIT=3

# Batch Processing
PLATFORM_BATCH_SIZE=10
ROOM_BATCH_SIZE=5
BULK_BATCH_SIZE=10

# Rate Limiting Configuration
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
DISABLE_RATE_LIMITING=false
EOF
        print_success "Enhanced configuration added to .env"
    fi
else
    print_warning ".env file not found. Creating sample .env file..."
    cat > .env << 'EOF'
# Environment
NODE_ENV=development

# Port
PORT=5000

# MongoDB Connection (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/

# Redis Connection (Optional but recommended)
REDIS_URL=redis://localhost:6379

# JWT and Encryption (REQUIRED)
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_32_char_encryption_key_here

# Frontend URL (REQUIRED)
FRONTEND_URL=http://localhost:5173

# Enhanced Platform Service Configuration
LEETCODE_CACHE_TTL=1800
GITHUB_CACHE_TTL=1800
CODEFORCES_CACHE_TTL=1800
DEFAULT_CACHE_TTL=900

# Concurrency Limits
PLATFORM_CONCURRENCY_LIMIT=5
DATABASE_CONCURRENCY_LIMIT=10
GENERAL_CONCURRENCY_LIMIT=8
EXTERNAL_CONCURRENCY_LIMIT=3

# Batch Processing
PLATFORM_BATCH_SIZE=10
ROOM_BATCH_SIZE=5
BULK_BATCH_SIZE=10

# Rate Limiting Configuration
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
DISABLE_RATE_LIMITING=false

# Owner access for analytics
OWNER_SECRET_KEY=your_super_secret_key_here

# Optional: GitHub and OAuth
GITHUB_TOKEN=
GOOGLE_CLIENT_ID=
EOF
    print_warning "Sample .env file created. Please update it with your actual values!"
fi

# Set permissions
print_status "Setting file permissions..."
chmod +x scripts/*.sh 2>/dev/null || true
chmod 755 logs/
print_success "Permissions set"

# Test basic functionality
print_status "Running basic functionality test..."
if npm run test >/dev/null 2>&1; then
    print_success "Basic tests passed"
else
    print_warning "Tests not available or failed. This is normal if tests aren't set up yet"
fi

# Display setup summary
echo ""
echo "================================================================"
print_success "🎉 CForge Backend Enhanced Setup Complete!"
echo "================================================================"
echo ""
print_status "📋 Setup Summary:"
echo "   ✅ Node.js and npm verified"
echo "   ✅ Dependencies installed"
echo "   ✅ Directories created"
echo "   ✅ Environment configuration checked"
echo ""

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    print_status "🚀 Ready to start! Run:"
        echo "   npm run dev     # Development mode"
        echo "   npm start       # Production mode"
else
    print_warning "⚠️  Please configure missing environment variables before starting"
fi

echo ""
print_status "📖 Available commands:"
echo "   npm run dev              # Start development server"
echo "   npm start                # Start production server"
echo "   npm test                 # Run tests"
echo "   npm run lint             # Run linter"
echo ""

print_status "🔍 Health check endpoints (after starting):"
echo "   GET /api/health          # Basic health check"
echo "   GET /api/health/detailed # Detailed service status"
echo "   GET /api/health/ready    # Kubernetes readiness probe"
echo ""

print_status "📚 Documentation:"
echo "   📄 ENHANCED_FEATURES.md  # Complete feature documentation"
echo "   📄 backend/logs/         # Application logs directory"
echo ""

if ! check_command redis-cli && [ -z "$REDIS_URL" ]; then
    echo "================================================================"
    print_warning "🔧 Optional Redis Setup:"
    echo "For enhanced caching and rate limiting performance:"
    echo ""
    echo "macOS:   brew install redis && brew services start redis"
    echo "Ubuntu:  sudo apt-get install redis-server"
    echo "Docker:  docker run -d -p 6379:6379 redis:alpine"
    echo ""
    echo "Or configure external Redis with REDIS_URL in .env"
    echo "================================================================"
fi

print_success "Setup completed successfully! 🎉"