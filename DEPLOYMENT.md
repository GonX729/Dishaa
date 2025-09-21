# Disha AI Career Builder - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a MongoDB Atlas cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account and cluster
2. Create a database user with read/write permissions
3. Whitelist your IP addresses (or use 0.0.0.0/0 for all IPs)
4. Get your connection string (should look like): 
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add NODE_ENV
   ```

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings (should auto-detect)

3. **Set Environment Variables in Vercel Dashboard**:
   - Go to Project Settings → Environment Variables
   - Add the following variables:

## Required Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas connection string |
| `JWT_SECRET` | `your-secret-key` | JWT secret for authentication |
| `NODE_ENV` | `production` | Node environment |

## Project Structure for Vercel

```
project-root/
├── vercel.json          # Vercel configuration
├── package.json         # Root package.json with build script
├── frontend/            # React application
│   ├── package.json
│   ├── src/
│   └── build/          # Generated after build
├── api/                # Serverless functions
│   ├── index.js        # Main API handler
│   ├── package.json    # API dependencies
│   ├── lib/           # Shared utilities
│   └── routes/        # API routes
└── backend/           # Original Express server (not deployed)
```

## Build Configuration

The project is configured to:
1. Build the React frontend to `frontend/build/`
2. Deploy API routes as serverless functions
3. Serve frontend static files
4. Route API calls to `/api/*`

## Important Notes

### File Uploads
- Vercel serverless functions don't support traditional file uploads
- For resume uploads, you'll need to integrate with:
  - **Cloudinary** (recommended for images/documents)
  - **AWS S3** 
  - **Vercel Blob Storage**
  - **Uploadcare**

### Database Connection
- Uses connection pooling for serverless functions
- Implements connection caching to avoid cold starts

### CORS Configuration
- Configured to allow all origins in production
- You may want to restrict this to your domain

## Testing Your Deployment

1. **Frontend**: Visit your Vercel URL
2. **API Health Check**: Visit `https://your-app.vercel.app/api/health`
3. **Test Registration/Login**: Use the frontend forms

## Troubleshooting

### Common Issues:

1. **Module not found errors**: Ensure all dependencies are in `api/package.json`
2. **Database connection issues**: Check MongoDB Atlas whitelist and connection string
3. **CORS errors**: Verify CORS configuration in `api/index.js`
4. **File upload failures**: Implement cloud storage integration

### Logs:
- View function logs in Vercel Dashboard → Functions tab
- Check browser console for frontend errors

## Post-Deployment Tasks

1. **Set up custom domain** (optional)
2. **Configure file upload service**
3. **Set up monitoring and analytics**
4. **Implement backup strategies for MongoDB**

## Local Development

To run locally after deployment setup:

```bash
# Install dependencies
npm install
cd frontend && npm install
cd ../api && npm install

# Start frontend
cd frontend && npm start

# Start backend (original Express server)
cd backend && npm run dev
```

## Support

For deployment issues:
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- MongoDB Atlas documentation: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)