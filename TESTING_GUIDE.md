# Testing Guide - Job Connect Hub

## Quick Health Checks

### 1. Docker Setup Test
```bash
# Test if Docker config is valid
docker-compose config

# Start the services
docker-compose up --build

# Check if both services are running
docker-compose ps
```

### 2. Backend API Test
Once running, visit these URLs:

**API Documentation (Interactive):**
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

**Health Check:**
- http://localhost:8000/ 
- http://localhost:8000/health

### 3. Frontend Test
**Main Application:**
- http://localhost:3000

## Step-by-Step Manual Testing

### Test 1: Basic Services
```bash
# Terminal 1: Start services
docker-compose up --build

# Terminal 2: Test backend
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","message":"API is operational"}

# Test frontend (open browser)
open http://localhost:3000
```

### Test 2: API Endpoints with curl

#### Jobs API:
```bash
# Get all jobs
curl http://localhost:8000/jobs

# Create a job post
curl -X POST http://localhost:8000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Senior Developer",
    "job_description": "Amazing opportunity for a senior developer",
    "job_salary": 100000,
    "job_type": "full-time"
  }'

# Search jobs
curl "http://localhost:8000/jobs/search?q=developer&min_salary=80000"
```

#### Authentication API:
```bash
# Register a user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "user_type": "jobseeker",
    "fname": "Test",
    "lname": "User"
  }'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

#### Chat API:
```bash
# Test chat (requires GOOGLE_API_KEY)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about software engineering careers",
    "model": "gemini-2.5-flash"
  }'
```

### Test 3: Frontend Features

1. **Open http://localhost:3000**
2. **Test Registration:**
   - Click "Sign Up"
   - Choose "Job Seeker" or "Employer"
   - Fill in details
   - Verify account creation

3. **Test Login:**
   - Click "Login" 
   - Use created credentials
   - Verify role-based dashboard appears

4. **Test Job Posts:**
   - As Employer: Create a job post
   - As Job Seeker: Browse jobs
   - Verify data persistence

5. **Test Chat:**
   - Go to Chat tab
   - Send a message
   - Verify AI response (requires API key)

## Environment Setup Testing

### Required Environment Variables
Create these files with real values:

**backend/.env:**
```bash
GOOGLE_API_KEY=your_actual_google_api_key
SUPABASE_URL=your_actual_supabase_url
SUPABASE_ANON_KEY=your_actual_supabase_key
JWT_SECRET_KEY=any_random_string_here
ENVIRONMENT=development
```

**frontend/.env.local:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key_optional
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Database Setup Test
In your Supabase dashboard, create these tables:

```sql
-- Test if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('job_posts', 'job_applications', 'resumes');
```

## Automated Testing Scripts

### Quick Test Script
```bash
#!/bin/bash
echo "🚀 Testing Job Connect Hub..."

# Test 1: Health Check
echo "1. Testing backend health..."
response=$(curl -s http://localhost:8000/health)
if [[ $response == *"healthy"* ]]; then
  echo "✅ Backend is healthy"
else
  echo "❌ Backend health check failed"
fi

# Test 2: Frontend availability
echo "2. Testing frontend..."
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ $frontend_status -eq 200 ]; then
  echo "✅ Frontend is accessible"
else
  echo "❌ Frontend not accessible"
fi

# Test 3: API Documentation
echo "3. Testing API docs..."
docs_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs)
if [ $docs_status -eq 200 ]; then
  echo "✅ API documentation is available"
else
  echo "❌ API docs not accessible"
fi

echo "🎉 Basic tests completed!"
```

## Troubleshooting Common Issues

### Issue 1: "Port already in use"
```bash
# Kill processes on ports
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9

# Or use different ports
docker-compose down
docker-compose up --build
```

### Issue 2: "Supabase connection failed"
- Verify your Supabase URL and keys are correct
- Check if your Supabase project is active
- Ensure tables exist in your database

### Issue 3: "Google API key not configured"
- Get a Google AI Studio API key
- Add it to your .env file
- Restart the backend service

### Issue 4: Docker build fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose down --volumes
docker-compose up --build --force-recreate
```

## Production Readiness Checklist

### ✅ Development Complete
- [ ] All endpoints working
- [ ] Frontend/backend communication
- [ ] Database operations functional
- [ ] Authentication working
- [ ] File uploads working
- [ ] AI features working (with API keys)

### 🚀 Demo Ready
- [ ] Environment variables configured
- [ ] Docker containers starting successfully
- [ ] All user flows working end-to-end
- [ ] Error handling graceful
- [ ] API documentation accessible

### 📝 Documentation Ready
- [ ] Setup instructions clear
- [ ] API endpoints documented
- [ ] Environment requirements listed
- [ ] Testing procedures defined

## Expected Results

When everything works correctly, you should see:

1. **Backend logs:** No errors, successful database connections
2. **Frontend:** Loads without console errors
3. **API calls:** Return proper JSON responses
4. **Database:** Tables populated with test data
5. **Authentication:** Users can register/login
6. **File uploads:** Resume uploads work (if storage configured)
7. **AI features:** Chat and resume enhancement work (with API keys)

Your project demonstrates a **complete full-stack job platform** with all the features you claimed in your resume! 🎯
