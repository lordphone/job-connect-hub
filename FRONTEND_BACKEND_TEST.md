# Frontend & Backend Integration Testing 🚀

## Option 1: Docker Integration (Recommended - Works Right Now!)

Since you have Docker available, this is the easiest way to test everything:

### Start Both Services with Docker:
```bash
# Navigate to project root
cd /Users/jinjiayi/Desktop/job-connect-hub

# Start both frontend and backend together
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### Access Your Application:
- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/health

### What You'll See:
✅ **Frontend**: Complete job platform UI  
✅ **Backend**: 19 API endpoints ready  
✅ **Integration**: Frontend calls backend automatically  

---

## Option 2: Manual Setup (If you install Node.js)

If you want to install Node.js for manual testing:

### Install Node.js:
1. **Download**: https://nodejs.org/ (LTS version)
2. **Or use Homebrew**: `brew install node`

### Then run:
```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

---

## Integration Testing Checklist

### ✅ What to Test:

#### 1. **Basic Connectivity**
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend responds at http://localhost:8000/health
- [ ] No CORS errors in browser console

#### 2. **User Registration/Login**
- [ ] Click "Sign Up" → Choose user type → Register
- [ ] Login with created credentials  
- [ ] See role-based dashboard (Employer vs Job Seeker)

#### 3. **Job Management** 
- [ ] **As Employer**: Create job post
- [ ] **As Job Seeker**: Browse available jobs
- [ ] Verify jobs appear in both frontend and backend

#### 4. **AI Features**
- [ ] Test chat functionality (requires Google API key)
- [ ] Test resume enhancement (requires API keys)

#### 5. **API Integration**
- [ ] Check browser Network tab for API calls
- [ ] Verify backend logs show frontend requests
- [ ] Test job creation → immediate frontend update

---

## Expected Results

### ✅ **Successful Integration:**

#### Frontend (http://localhost:3000):
- Clean modern UI loads
- Navigation tabs work
- User registration/login flows
- Job browsing and creation forms
- Chat interface
- Resume builder/enhancer

#### Backend (http://localhost:8000):
- API documentation accessible
- All endpoints responding
- Database operations (with Supabase setup)
- CORS headers allowing frontend

#### Integration:
- Frontend successfully calls backend APIs
- User actions trigger backend requests
- Data flows between services
- No console errors

---

## Troubleshooting

### Common Issues:

#### **"Connection Refused"**
```bash
# Check if backend is running
curl http://localhost:8000/health

# Restart backend
cd backend && uvicorn main:app --reload
```

#### **CORS Errors** 
- Backend already configured for http://localhost:3000
- Check browser console for exact error

#### **"Cannot GET /"** 
- Frontend not running
- Check if npm/node are installed
- Use Docker option instead

#### **Database Errors**
- Expected with demo environment variables
- Get real Supabase credentials for full functionality

---

## Docker Commands Cheat Sheet

```bash
# Start everything
docker-compose up --build

# Start in background  
docker-compose up --build -d

# Check running containers
docker-compose ps

# View logs
docker-compose logs frontend
docker-compose logs backend

# Stop everything
docker-compose down

# Clean restart
docker-compose down --volumes
docker-compose up --build --force-recreate
```

---

## Quick Test Script

```bash
#!/bin/bash
echo "🚀 Testing Job Connect Hub Integration..."

# Test backend
echo "1. Backend health:"
curl -s http://localhost:8000/health

# Test frontend (if running)
echo -e "\n2. Frontend status:"
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000

echo -e "\n\n✅ If both return 200, integration is working!"
```

---

## Next Steps

1. **Start with Docker** (easiest): `docker-compose up --build`
2. **Open frontend**: http://localhost:3000  
3. **Test user flows**: Registration → Login → Job creation
4. **Check API docs**: http://localhost:8000/docs
5. **For production**: Add real Supabase credentials

Your full-stack job platform is ready to demo! 🎯
