# 🚀 Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] All code is committed and pushed to GitHub
- [ ] Environment variables are properly configured
- [ ] Dependencies are up to date
- [ ] Build process works locally
- [ ] All tests pass (if any)

### ✅ Environment Files
- [ ] `.env.example` files created for both frontend and backend
- [ ] Production environment variables are ready
- [ ] MongoDB connection string is available
- [ ] JWT secret is generated

### ✅ Database Setup
- [ ] MongoDB Atlas cluster is created
- [ ] Database user is created with proper permissions
- [ ] Network access is configured (0.0.0.0/0 for Vercel)
- [ ] Connection string is tested

## GitHub Deployment Commands

```bash
# 1. Initialize Git (if not done)
git init
git remote add origin https://github.com/guptaabhishek2265/Jungle_safari.git

# 2. Add and commit all files
git add .
git commit -m "Initial commit: Jungle Safari Inventory Management System"

# 3. Push to GitHub
git branch -M main
git push -u origin main
```

## Vercel Deployment Steps

### Option 1: Using Vercel CLI (Recommended)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy Backend
```bash
cd backend
vercel --prod
```

**Set these environment variables in Vercel dashboard:**
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `NODE_ENV`: production
- `PORT`: 5000

#### Step 4: Deploy Frontend
```bash
cd ../frontend
```

**Update `.env.production` with your backend URL:**
```
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

```bash
vercel --prod
```

### Option 2: Using GitHub Integration

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Create two separate projects:**
   - One for backend (root directory: `backend`)
   - One for frontend (root directory: `frontend`)

#### Backend Project Settings:
- **Framework Preset**: Other
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Output Directory**: (leave empty)
- **Install Command**: `npm install`

#### Frontend Project Settings:
- **Framework Preset**: Create React App
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

## Environment Variables Configuration

### Backend Environment Variables (Vercel Dashboard)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=production
PORT=5000
```

### Frontend Environment Variables (Vercel Dashboard)
```
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

## Post-Deployment Verification

### ✅ Backend Verification
- [ ] Backend URL is accessible
- [ ] API endpoints respond correctly
- [ ] Database connection is working
- [ ] CORS is properly configured

Test backend:
```bash
curl https://your-backend-url.vercel.app/api/auth/me
```

### ✅ Frontend Verification
- [ ] Frontend loads without errors
- [ ] API calls work from frontend
- [ ] Authentication flow works
- [ ] All pages load correctly

### ✅ Full Application Test
- [ ] User registration works
- [ ] User login works
- [ ] Create product functionality works
- [ ] Inventory management works
- [ ] Real-time updates work (if applicable)

## Troubleshooting Common Issues

### 🔧 CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**: Update CORS configuration in `backend/server.js`:
```javascript
const allowedOrigins = [
  "http://localhost:3000",
  "https://your-frontend-url.vercel.app"
];
```

### 🔧 Environment Variables Not Working
**Problem**: App can't access environment variables
**Solution**: 
1. Check Vercel dashboard settings
2. Redeploy after adding variables
3. Ensure variable names are correct

### 🔧 Database Connection Issues
**Problem**: Can't connect to MongoDB
**Solution**:
1. Check MongoDB Atlas network access
2. Verify connection string format
3. Ensure database user permissions

### 🔧 Build Failures
**Problem**: Deployment fails during build
**Solution**:
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in package.json
3. Test build locally first

## Quick Deployment Commands

### Using the provided scripts:

**Windows:**
```cmd
deploy.bat "Your commit message"
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh "Your commit message"
```

### Manual deployment:
```bash
# Deploy to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# Deploy backend to Vercel
cd backend && vercel --prod

# Deploy frontend to Vercel
cd ../frontend && vercel --prod
```

## Final URLs

After successful deployment, you should have:

- **GitHub Repository**: https://github.com/guptaabhishek2265/Jungle_safari
- **Backend API**: https://your-backend.vercel.app
- **Frontend App**: https://your-frontend.vercel.app

## Security Checklist

- [ ] JWT secret is strong and unique
- [ ] Database credentials are secure
- [ ] CORS is properly configured
- [ ] Environment variables are not exposed in frontend
- [ ] Admin user credentials are changed from defaults

---

**🎉 Congratulations! Your Jungle Safari Inventory Management System is now live!**