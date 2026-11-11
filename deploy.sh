#!/usr/bin/env bash

# ==============================================================================
# Amazing Ads - Calendar Printing Billing Software
# Automated Production Deployment Script for VPS
# Domain: amazingads.gemshine.tech
# ==============================================================================

set -e # Exit immediately on error

echo "================================================================="
echo "  🚀 Starting Deployment: Amazing Ads Billing Software"
echo "  🌐 Domain: amazingads.gemshine.tech"
echo "  ⏰ Time: $(date)"
echo "================================================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 1. Check prerequisites
echo ""
echo "📦 Step 1: Checking system requirements..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v pm2 >/dev/null 2>&1 || { 
  echo "⚠️ PM2 not found. Installing PM2 globally..."
  sudo npm install -g pm2
}

echo "✅ Node version: $(node -v)"
echo "✅ NPM version: $(npm -v)"
echo "✅ PM2 version: $(pm2 -v)"

# 2. Check MongoDB Service
echo ""
echo "🗄️ Step 2: Checking MongoDB Status..."
if command -v mongod >/dev/null 2>&1; then
  if systemctl is-active --quiet mongod; then
    echo "✅ MongoDB service is active and running."
  else
    echo "⚠️ MongoDB service is stopped. Attempting to start..."
    sudo systemctl start mongod || echo "⚠️ Could not start mongod automatically. Please verify MongoDB status."
  fi
else
  echo "⚠️ MongoDB not detected locally. If using MongoDB Atlas or remote server, ensure MONGODB_URI in server/.env is valid."
fi

# 3. Setup Server Environment
echo ""
echo "⚙️ Step 3: Checking Server Environment..."
mkdir -p "$PROJECT_DIR/logs"

if [ ! -f "$PROJECT_DIR/server/.env" ]; then
  if [ -f "$PROJECT_DIR/server/.env.production.example" ]; then
    echo "📝 Creating server/.env from template..."
    cp "$PROJECT_DIR/server/.env.production.example" "$PROJECT_DIR/server/.env"
    echo "⚠️ server/.env created. Please verify database credentials inside server/.env."
  else
    echo "❌ server/.env missing! Please create server/.env before continuing."
    exit 1
  fi
fi

# 4. Backend Dependencies & Compilation
echo ""
echo "🔨 Step 4: Building Backend Application..."
cd "$PROJECT_DIR/server"
npm install
npm run build
cd "$PROJECT_DIR"
echo "✅ Backend build finished successfully."

# 5. Start / Reload with PM2
echo ""
echo "🔄 Step 5: Reloading Backend with PM2..."
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save
echo "✅ PM2 processes running:"
pm2 status amazingads-backend

# 6. Frontend Build
echo ""
echo "🎨 Step 6: Building Frontend Application..."
npm install
npm run build
echo "✅ Frontend production build generated in ./dist"

# 7. Nginx Setup & Reload
echo ""
echo "🌐 Step 7: Configuring Nginx..."
NGINX_CONF_SRC="$PROJECT_DIR/nginx/amazingads.gemshine.tech.conf"
NGINX_AVAILABLE="/etc/nginx/sites-available/amazingads.gemshine.tech"
NGINX_ENABLED="/etc/nginx/sites-enabled/amazingads.gemshine.tech"

if [ -f "$NGINX_CONF_SRC" ]; then
  if [ -d "/etc/nginx/sites-available" ]; then
    echo "📋 Linking Nginx configuration file..."
    sudo cp "$NGINX_CONF_SRC" "$NGINX_AVAILABLE"
    sudo ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
    
    echo "🧪 Testing Nginx configuration syntax..."
    sudo nginx -t
    
    echo "🔄 Reloading Nginx service..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully."
  else
    echo "⚠️ /etc/nginx/sites-available directory not found. Please configure Nginx manually using nginx/amazingads.gemshine.tech.conf."
  fi
fi

# 8. API Health Verification
echo ""
echo "🩺 Step 8: Verifying Backend Health..."
sleep 2
HEALTH_URL="http://127.0.0.1:5027/api/health"
HEALTH_CHECK=$(curl -s "$HEALTH_URL" || echo "offline")

if [[ "$HEALTH_CHECK" =~ "online" ]]; then
  echo "✅ Backend Health Check Passed: 200 OK (Port 5027 active)"
else
  echo "⚠️ Backend health check failed on $HEALTH_URL. Checking PM2 logs..."
  pm2 logs amazingads-backend --lines 20 --nostream
fi

echo ""
echo "================================================================="
echo "  🎉 Deployment Complete Successfully!"
echo "  🌐 Frontend URL: https://amazingads.gemshine.tech"
echo "  📡 Backend API:  http://127.0.0.1:5027/api"
echo "  📊 Check Logs:   pm2 logs amazingads-backend"
echo "================================================================="

