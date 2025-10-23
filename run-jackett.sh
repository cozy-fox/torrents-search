#!/bin/bash

# Jackett Docker Deployment Script
# This script will build and run the Jackett project using Docker

set -e  # Exit on any error

echo "🚀 Starting Jackett Docker Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

print_status "Docker and Docker Compose are installed ✓"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p config downloads
print_success "Directories created ✓"

# Stop existing containers if running
print_status "Stopping any existing Jackett containers..."
docker-compose down 2>/dev/null || true
print_success "Existing containers stopped ✓"

# Build the Docker image
print_status "Building Jackett Docker image..."
docker-compose build --no-cache
print_success "Docker image built successfully ✓"

# Start the services
print_status "Starting Jackett services..."
docker-compose up -d
print_success "Jackett services started ✓"

# Wait for the service to be ready
print_status "Waiting for Jackett to be ready..."
sleep 10

# Check if the service is running
if docker-compose ps | grep -q "Up"; then
    print_success "🎉 Jackett is now running!"
    echo ""
    echo "📋 Access Information:"
    echo "   🌐 Web Interface: http://localhost:9117"
    echo "   📁 Config Directory: ./config"
    echo "   📁 Downloads Directory: ./downloads"
    echo ""
    echo "🔧 Management Commands:"
    echo "   Stop:    docker-compose down"
    echo "   Restart: docker-compose restart"
    echo "   Logs:    docker-compose logs -f"
    echo "   Status:  docker-compose ps"
    echo ""
    print_success "Deployment completed successfully! 🚀"
else
    print_error "Failed to start Jackett. Check the logs with: docker-compose logs"
    exit 1
fi
