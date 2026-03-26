# Deployment Guide

## 🚀 GitHub Deployment

### Step 1: Initialize Git Repository

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Jungle Safari Inventory Management System"

# Add remote origin
git remote add origin https://github.com/guptaabhishek2265/Jungle_safari.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Subsequent Updates

```bash
# Add changes
git add .

# Commit with descriptive message
git commit -m "Your commit message here"

# Push to GitHub
git push origin main
```

## 🌐 Vercel Deployment

### Prerequisites

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

### Method 1: Separate Frontend and Backend Deployment (Recommended)

#### Deploy Backend First

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Deploy backend**:
```bash
vercel --prod
```

3. **Set environment variables in Vercel dashboard**:
   - Go to your Vercel dashboard
   - Select your backend project
   - Go to Settings > Environment Variables
   - Add the following variables:
     ```
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     NODE_ENV=production
     PORT=5000
     ```

4. **Note the backend URL** (e.g., `https://your-backend.vercel.app`)

#### Deploy Frontend

1. **Navigate to frontend directory**:
```bash
cd ../frontend
```

2. **Update environment variables**:
   - Create/update `.env.production`:
     ```
     REACT_APP_API_URL=https://your-backend.vercel.app/api
     ```

3. **Deploy frontend**:
```bash
vercel --prod
```

4. **Set environment variables in Vercel dashboard**:
   - Go to your frontend project settings
   - Add environment variable:
     ```
     REACT_APP_API_URL=https://your-backend.vercel.app/api
     ```

### Method 2: GitHub Integration (Automatic Deployment)

1. **Connect GitHub to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Choose "Other" framework preset

2. **Configure Build Settings**:
   
   **For Backend Project**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Output Directory: (leave empty)
   - Install Command: `npm install`

   **For Frontend Project**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Set Environment Variables** (as described above)

4. **Deploy**: Vercel will automatically deploy on every push to main branch

### Method 3: Manual Deployment Commands

From the root directory:

```bash
# Deploy backend
npm run deploy:backend

# Deploy frontend (after updating REACT_APP_API_URL)
npm run deploy:frontend

# Or deploy both (make sure to update frontend env first)
npm run deploy:all
```

## 🔧 Environment Variables Setup

### Backend Environment Variables

Create these in your Vercel backend project:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
PORT=5000
```

### Frontend Environment Variables

Create these in your Vercel frontend project:

```
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

## 🗄️ Database Setup

### MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account

2. **Create Cluster**:
   - Create a new cluster (free tier is sufficient)
   - Choose a cloud provider and region

3. **Create Database User**:
   - Go to Database Access
   - Add a new database user
   - Choose password authentication
   - Note the username and password

4. **Configure Network Access**:
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0` (allow access from anywhere)
   - Or add specific Vercel IP ranges

5. **Get Connection String**:
   - Go to Clusters
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## 🚀 Post-Deployment Steps

### 1. Create Admin User

After backend deployment, create an admin user:

```bash
# If you have access to the server
node scripts/createAdminUser.js

# Or create manually through API
curl -X POST https://your-backend-url.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@junglesafari.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. Test the Application

1. **Visit your frontend URL**
2. **Try logging in with admin credentials**
3. **Test creating products**
4. **Verify real-time updates work**

### 3. Update CORS Settings

Make sure your backend allows requests from your frontend domain:

In `backend/server.js`, update the CORS configuration:

```javascript
const allowedOrigins = [
  "http://localhost:3000",
  "https://your-frontend-url.vercel.app"
];
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check CORS configuration in backend
   - Ensure frontend URL is in allowed origins

2. **Environment Variables Not Working**:
   - Verify variables are set in Vercel dashboard
   - Redeploy after adding variables

3. **Database Connection Issues**:
   - Check MongoDB Atlas network access
   - Verify connection string format
   - Ensure database user has proper permissions

4. **Build Failures**:
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

### Debugging Commands

```bash
# Check Vercel deployment logs
vercel logs

# Check environment variables
vercel env ls

# Pull environment variables locally
vercel env pull
```

## 📱 Custom Domain (Optional)

1. **Purchase a domain** (e.g., from Namecheap, GoDaddy)

2. **Add domain in Vercel**:
   - Go to project settings
   - Click "Domains"
   - Add your custom domain

3. **Configure DNS**:
   - Add CNAME record pointing to Vercel
   - Follow Vercel's DNS configuration guide

## 🔄 Continuous Deployment

Once connected to GitHub:

1. **Automatic deployments** on every push to main branch
2. **Preview deployments** for pull requests
3. **Rollback capability** through Vercel dashboard

## 📊 Monitoring

- **Vercel Analytics**: Monitor performance and usage
- **Error Tracking**: Check function logs for errors
- **Uptime Monitoring**: Use services like UptimeRobot

---

**Your application should now be live! 🎉**

Frontend: `https://your-frontend.vercel.app`
Backend: `https://your-backend.vercel.app`