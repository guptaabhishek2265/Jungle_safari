@echo off
REM Jungle Safari Inventory Management System - Deployment Script for Windows

echo 🚀 Starting deployment process...

REM Check if git is initialized
if not exist ".git" (
    echo 📁 Initializing Git repository...
    git init
    git remote add origin https://github.com/guptaabhishek2265/Jungle_safari.git
)

REM Add all files and commit
echo 📝 Adding files to Git...
git add .

REM Get commit message from user or use default
if "%~1"=="" (
    set COMMIT_MSG=Update: %date% %time%
) else (
    set COMMIT_MSG=%~1
)

echo 💾 Committing changes: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"

REM Push to GitHub
echo 📤 Pushing to GitHub...
git branch -M main
git push -u origin main

echo ✅ Successfully deployed to GitHub!
echo 🌐 Repository: https://github.com/guptaabhishek2265/Jungle_safari

REM Optional: Deploy to Vercel if vercel CLI is available
where vercel >nul 2>nul
if %errorlevel% == 0 (
    echo.
    set /p deploy_vercel="🤔 Do you want to deploy to Vercel now? (y/n): "
    
    if /i "%deploy_vercel%"=="y" (
        echo 🚀 Deploying backend to Vercel...
        cd backend
        vercel --prod
        
        echo 🚀 Deploying frontend to Vercel...
        cd ../frontend
        vercel --prod
        
        echo ✅ Vercel deployment completed!
        cd ..
    )
) else (
    echo 💡 Install Vercel CLI to deploy: npm install -g vercel
)

echo.
echo 🎉 Deployment process completed!
echo 📖 Check DEPLOYMENT.md for detailed deployment instructions

pause