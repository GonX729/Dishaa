# Disha AI Deployment Script for Windows
Write-Host "🚀 Starting Disha AI deployment to Vercel..." -ForegroundColor Green

# Check if vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Check if user is logged in to Vercel
try {
    vercel whoami | Out-Null
    Write-Host "✅ Logged in to Vercel" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please login to Vercel..." -ForegroundColor Yellow
    vercel login
}

# Build frontend
Write-Host "📦 Building frontend..." -ForegroundColor Blue
Set-Location frontend
npm install
npm run build
Set-Location ..

# Install API dependencies
Write-Host "📦 Installing API dependencies..." -ForegroundColor Blue
Set-Location api
npm install
Set-Location ..

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Blue
vercel --prod

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "📋 Don't forget to set environment variables:" -ForegroundColor Yellow
Write-Host "   - MONGODB_URI" -ForegroundColor White
Write-Host "   - JWT_SECRET" -ForegroundColor White
Write-Host "   - NODE_ENV=production" -ForegroundColor White