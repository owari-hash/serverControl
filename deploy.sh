#!/bin/bash

# Next.js Project Manager Deployment Script with PM2

echo "🚀 Starting Next.js Project Manager Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p /home/projects
mkdir -p logs

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Stop existing process if running
echo "🛑 Stopping existing process..."
pm2 delete nextjs-project-manager 2>/dev/null || true

# Start with PM2
echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "🔧 Setting up PM2 startup..."
pm2 startup | tail -n 1 | bash

# Display status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment complete!"
echo "🌐 API is running on: http://$(curl -s ifconfig.me):3001"
echo "📋 PM2 Commands:"
echo "  pm2 status          - Check status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart all apps"
echo "  pm2 stop all        - Stop all apps"
echo "  pm2 monit           - Monitor dashboard"
