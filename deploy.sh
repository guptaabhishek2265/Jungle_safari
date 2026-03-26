#!/bin/bash

# Jungle Safari Inventory Management System - Deployment Script

echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git remote add origin https://github.com/guptaabhishek2265/Jungle_safari.git
fi

# Add all files and commit
echo "📝 Adding files to Git..."
git add .

# Get commit message from user or use default
if [ -z "$1" ]; then
    COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MSG="$1"
fi

echo "💾 Committing changes: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "✅ Successfully deployed to GitHub!"
echo "🌐 Repository: https://github.com/guptaabhishek2265/Jungle_safari"

# Optional: Deploy to Vercel if vercel CLI is available
if command -v vercel &> /dev/null; then
    echo ""
    read -p "🤔 Do you want to deploy to Vercel now? (y/n): " deploy_vercel
    
    if [ "$deploy_vercel" = "y" ] || [ "$deploy_vercel" = "Y" ]; then
        echo "🚀 Deploying backend to Vercel..."
        cd backend
        vercel --prod
        
        echo "🚀 Deploying frontend to Vercel..."
        cd ../frontend
        vercel --prod
        
        echo "✅ Vercel deployment completed!"
    fi
else
    echo "💡 Install Vercel CLI to deploy: npm install -g vercel"
fi

echo ""
echo "🎉 Deployment process completed!"
echo "📖 Check DEPLOYMENT.md for detailed deployment instructions"