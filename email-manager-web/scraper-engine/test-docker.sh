#!/bin/bash

# Test Docker build for Render.com compatibility
echo "🐳 Testing Docker build for Render.com deployment..."

# Build the image
echo "Building Docker image..."
docker build -t email-scraper-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    
    # Test running the container
    echo "Testing container startup..."
    docker run -d --name test-scraper -p 3001:3001 -e PORT=3001 email-scraper-test
    
    # Wait for startup
    sleep 5
    
    # Test health endpoint
    echo "Testing health endpoint..."
    curl -f http://localhost:3001/health
    
    if [ $? -eq 0 ]; then
        echo "✅ Container is running and healthy!"
    else
        echo "❌ Container health check failed"
        docker logs test-scraper
    fi
    
    # Cleanup
    docker stop test-scraper
    docker rm test-scraper
    docker rmi email-scraper-test
    
else
    echo "❌ Docker build failed!"
    exit 1
fi 