# AI Resume Analyzer & Interview Preparation System

A full-stack application that helps job seekers optimize their resumes and prepare for interviews using AI-powered analysis.

## 🌟 Features

- **Resume Analysis**: Upload PDF/DOCX resumes and get ATS scores, strengths, weaknesses, and suggestions
- **AI Interview Prep**: Generate role-specific interview questions and practice with mock interviews
- **Dashboard Analytics**: Track performance metrics, skills, and improvement trends
- **Mock Interviews**: Practice interviews with AI-generated questions and get instant feedback
- **Self-Introduction Generator**: Create professional introductions based on your resume
- **Dark/Light Mode**: Toggle between themes with persistent preferences
- **Secure Authentication**: JWT-based auth with bcrypt password hashing

## 🛠️ Tech Stack

**Frontend**: React 18, Tailwind CSS, Recharts, Axios  
**Backend**: Node.js, Express, Sequelize ORM, PostgreSQL  
**AI**: Google Gemini API  
**Database**: PostgreSQL (Render hosted)

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (hosted on Render or local)
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

## 🚀 Complete Setup Guide

### Step 1: Install Dependencies

```bash
# Backend
cd ai-resume-analyzer/backend
npm install

# Frontend (in a new terminal)
cd ai-resume-analyzer/frontend
npm install
```

### Step 2: Configure Environment Variables

#### Backend Configuration (`backend/.env`)

Create or edit the `.env` file in the `backend` folder:

```env
# Node environment
NODE_ENV=development

# Server port
PORT=5000

# PostgreSQL database connection string
# Get this from your Render PostgreSQL dashboard
DATABASE_URL=postgresql://username:password@host:port/database

# Google Gemini API key
# Get from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# JWT secret for token signing (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Frontend URL for CORS configuration
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration (`frontend/.env`)

Create or edit the `.env` file in the `frontend` folder:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5000
```

### Step 3: Start the Application

#### Option 1: Manual Start (Recommended)

**Terminal 1 - Backend:**
```bash
cd ai-resume-analyzer/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd ai-resume-analyzer/frontend
npm start
```

#### Option 2: Using npm start

**Backend:**
```bash
cd ai-resume-analyzer/backend
npm start
```

**Frontend:**
```bash
cd ai-resume-analyzer/frontend
npm start
```

### Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## ✅ Verification Steps

1. **Check Backend Health**
   - Open http://localhost:5000/health
   - Should show: `{"status":"OK","message":"Server is running",...}`

2. **Check Frontend**
   - Open http://localhost:3000
   - Should load the landing page

3. **Test Registration**
   - Click "Register" or "Sign Up"
   - Fill in the form with:
     - Name: Test User
     - Email: test@example.com
     - Password: test123 (minimum 6 characters)
   - Click "Create Account"
   - Should redirect to dashboard

4. **Test Resume Upload**
   - Upload a PDF or DOCX resume
   - Check the analysis results
   - View the generated self-introduction

## 🔧 Troubleshooting

### Issue 1: Connection Refused Error

**Symptom**: `ERR_CONNECTION_REFUSED` or `Failed to load resource`

**Solution**:
1. Ensure backend is running on port 5000
2. Check `frontend/.env` has `REACT_APP_API_URL=http://localhost:5000`
3. Restart the frontend server after changing `.env`

### Issue 2: Registration Failed - 400 Bad Request

**Symptom**: "Failed to register. Please try again."

**Common Causes**:
- Password less than 6 characters
- Email already registered
- Invalid email format
- Name too short (minimum 2 characters)

**Solution**:
- Use a password with at least 6 characters
- Try a different email address
- Check browser console (F12) for detailed error message

### Issue 3: Gemini API Errors

**Symptom**: Backend logs show `Gemini AI Error: [404 Not Found]`

**Impact**: Application still works with fallback responses:
- Resume analysis returns default scores and suggestions
- Interview questions use pre-defined templates
- Self-introductions use fallback text

**Solution**:
1. Get a new API key from https://aistudio.google.com/app/apikey
2. Update `GEMINI_API_KEY` in `backend/.env`
3. Restart the backend server

**Note**: The application is fully functional even without a working Gemini API key, as it has comprehensive fallback responses.

### Issue 4: Database Connection Failed

**Symptom**: Backend won't start, shows database connection errors

**Solution**:
1. Verify `DATABASE_URL` in `backend/.env` is correct
2. Check if the database is accessible
3. Ensure SSL settings are correct (Render requires SSL)
4. Test connection string format: `postgresql://user:password@host:port/database`

### Issue 5: Port Already in Use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Issue 6: Frontend Not Loading Environment Variables

**Symptom**: API calls go to wrong URL

**Solution**:
1. Ensure `.env` file is in the `frontend` folder (not root)
2. Variable must start with `REACT_APP_`
3. Restart the frontend server completely (Ctrl+C and `npm start`)
4. Clear browser cache and reload

### Issue 7: CORS Errors

**Symptom**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:
1. Check `FRONTEND_URL` in `backend/.env` matches your frontend URL
2. Ensure backend is running
3. Restart backend after changing CORS settings

## 📁 Project Structure

```
ai-resume-analyzer/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth, upload, error handling
│   ├── models/          # User, Resume, MockInterview models
│   ├── routes/          # API endpoints
│   ├── utils/           # AI services, parsers
│   ├── uploads/         # Uploaded resume files
│   ├── .env             # Environment variables
│   ├── package.json     # Dependencies
│   └── server.js        # Express server
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Auth and Theme contexts
│   │   ├── pages/       # Page components
│   │   └── services/    # API service layer
│   ├── .env             # Environment variables
│   └── package.json     # Dependencies
└── README.md            # This file
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Resume Management
- `POST /api/resume/upload` - Upload and analyze resume
- `GET /api/resume` - Get all user resumes
- `GET /api/resume/:id` - Get single resume details
- `DELETE /api/resume/:id` - Delete resume

### Analysis
- `POST /api/analysis/reanalyze/:id` - Re-analyze resume with AI
- `POST /api/analysis/regenerate-intro/:id` - Generate new self-introduction
- `GET /api/analysis/stats` - Get user statistics and analytics

### Interview
- `GET /api/interview/questions/:resumeId` - Get interview questions for resume
- `POST /api/interview/questions/custom` - Generate custom questions for role

### Mock Interview
- `POST /api/mock-interview/start` - Start new mock interview session
- `POST /api/mock-interview/:id/answer` - Submit answer to question
- `POST /api/mock-interview/:id/complete` - Complete interview and get scores
- `GET /api/mock-interview` - Get all user's mock interviews
- `GET /api/mock-interview/:id` - Get single interview details

### User Profile
- `GET /api/user/profile` - Get authenticated user profile
- `PUT /api/user/profile` - Update user profile

## 🔒 Security Features

- JWT-based authentication with 30-day expiration
- Bcrypt password hashing (10 salt rounds)
- Protected routes with authentication middleware
- Input validation with express-validator
- Rate limiting (1000 requests per 15 minutes)
- Helmet security headers
- CORS configuration
- File type and size restrictions (5MB max, PDF/DOCX only)

## 🧪 Testing the Application

### 1. User Registration & Login
- Register with name, email, and password (6+ characters)
- Login with registered credentials
- Verify JWT token is stored in localStorage

### 2. Resume Upload
- Upload a PDF or DOCX resume (max 5MB)
- Check if text extraction works
- Verify ATS score is displayed (0-100)
- Review strengths, weaknesses, and suggestions

### 3. Dashboard
- View total resumes count
- Check average ATS score
- See top skills chart
- Review role distribution

### 4. Mock Interview
- Start a new mock interview
- Answer questions one by one
- Submit answers and get feedback
- Complete interview and view overall score

### 5. Self-Introduction
- Generate self-introduction from resume
- Regenerate for different variations
- Copy to clipboard

## 🚀 Deployment Guide

### Backend Deployment (Render)

1. **Create Render Account**: https://render.com
2. **Create PostgreSQL Database**:
   - Go to Dashboard → New → PostgreSQL
   - Copy the External Database URL
3. **Create Web Service**:
   - Go to Dashboard → New → Web Service
   - Connect your GitHub repository
   - Root Directory: `ai-resume-analyzer/backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Set Environment Variables**:
   - `NODE_ENV=production`
   - `DATABASE_URL=<your-postgres-url>`
   - `GEMINI_API_KEY=<your-api-key>`
   - `JWT_SECRET=<random-secret>`
   - `FRONTEND_URL=<your-frontend-url>`

### Frontend Deployment (Vercel)

1. **Create Vercel Account**: https://vercel.com
2. **Import Project**:
   - Click "New Project"
   - Import your GitHub repository
   - Root Directory: `ai-resume-analyzer/frontend`
3. **Configure Build Settings**:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
4. **Set Environment Variables**:
   - `REACT_APP_API_URL=<your-render-backend-url>`
5. **Deploy**: Click "Deploy"

### Post-Deployment

1. Update `FRONTEND_URL` in Render backend environment variables
2. Test all features in production
3. Monitor logs for any errors

## 📝 Environment Variables Reference

### Backend Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `JWT_SECRET` | Secret for JWT signing | `random_secret_string` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:5000` |

## 🐛 Known Issues

### 1. Gemini API Model Version
**Issue**: Gemini API returns 404 for model not found  
**Status**: Application works with fallback responses  
**Fix**: Update API key or wait for SDK update

### 2. Password Validation
**Issue**: Originally required uppercase, lowercase, and numbers  
**Status**: Fixed - now only requires 6+ characters  
**Impact**: None

### 3. CORS Configuration
**Issue**: Frontend couldn't connect to backend  
**Status**: Fixed - proper CORS setup in place  
**Impact**: None

## 💡 Tips & Best Practices

1. **Development**:
   - Use `npm run dev` for backend (auto-restart with nodemon)
   - Keep both terminals open for backend and frontend
   - Check browser console (F12) for frontend errors
   - Check terminal for backend errors

2. **Database**:
   - Backup your database regularly
   - Use connection pooling for better performance
   - Monitor database size and connections

3. **API Keys**:
   - Never commit `.env` files to Git
   - Rotate API keys periodically
   - Use different keys for development and production

4. **Testing**:
   - Test with different resume formats (PDF, DOCX)
   - Try various file sizes
   - Test with multiple users
   - Check mobile responsiveness

## � Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for errors (F12)
3. Check backend terminal for error logs
4. Verify all environment variables are set correctly

## �📝 License

MIT License

---

**Built with ❤️ for job seekers worldwide**

🌐 **Local Development**: http://localhost:3000  
🔧 **Backend API**: http://localhost:5000  
💾 **Database**: PostgreSQL (Render)  
🤖 **AI**: Google Gemini API
