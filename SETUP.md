# Job Connect Hub Setup Guide

## Environment Variables Setup

### Backend (.env file)
Create `/backend/.env` with these variables:

```bash
# Google AI API Key for Gemini integration
GOOGLE_API_KEY=your_google_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Secret (generate a secure random string)
JWT_SECRET_KEY=your_jwt_secret_key_here

# Environment
ENVIRONMENT=development
```

### Frontend (.env.local file)
Create `/frontend/.env.local` with these variables:

```bash
# Supabase Configuration (same as backend)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API Key for resume enhancement (optional)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Quick Setup Commands

### Option 1: Docker Compose (Recommended)
```bash
# 1. Clone and navigate
git clone <repo-url>
cd job-connect-hub

# 2. Create environment files (fill with your actual values)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Start with Docker
docker-compose up --build

# Access at:
# Frontend: http://localhost:3000
# Backend API docs: http://localhost:8000/docs
```

### Option 2: Manual Development
```bash
# 1. Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# 2. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

## Database Schema Required

Create these tables in your Supabase project:

### `job_posts` table:
```sql
CREATE TABLE job_posts (
    job_post_id TEXT PRIMARY KEY,
    job_title TEXT NOT NULL,
    job_description TEXT NOT NULL,
    job_salary INTEGER NOT NULL,
    job_type TEXT NOT NULL,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `job_applications` table:
```sql
CREATE TABLE job_applications (
    application_id TEXT PRIMARY KEY,
    job_post_id TEXT REFERENCES job_posts(job_post_id),
    applicant_id TEXT NOT NULL,
    cover_letter TEXT,
    resume_url TEXT,
    status TEXT DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `resumes` table:
```sql
CREATE TABLE resumes (
    resume_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supabase Storage Bucket:
Create a storage bucket named `resumes` for file uploads.

## API Features Available

### ✅ Job Management
- `GET /jobs` - List all jobs
- `POST /jobs` - Create job post
- `DELETE /jobs/{id}` - Delete job
- `GET /jobs/search` - Search with filters

### ✅ Applications 
- `POST /applications` - Apply to job
- `GET /applications` - User's applications
- `GET /jobs/{id}/applications` - Job's applications
- `PATCH /applications/{id}/status` - Update status

### ✅ Resume Management
- `POST /resumes/upload` - Upload resume file
- `GET /resumes` - List user resumes
- `DELETE /resumes/{id}` - Delete resume

### ✅ Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get profile

### ✅ AI Features
- `POST /chat` - Chat with AI assistant
- `POST /resume/enhance` - Enhance resume with AI

### ✅ Analytics
- `GET /stats` - Platform statistics

## Troubleshooting

### Docker Issues
```bash
# If containers fail to start
docker-compose down
docker-compose up --build --force-recreate

# Check logs
docker-compose logs backend
docker-compose logs frontend
```

### Database Connection Issues
1. Verify Supabase credentials
2. Check if tables exist
3. Ensure RLS policies allow operations

### API Testing
Visit `http://localhost:8000/docs` for interactive API documentation.

## Development Workflow Optimization

### Hot Reload Setup ✅
- Backend: `--reload` flag enables hot reload
- Frontend: Next.js built-in hot reload
- Docker: Volume mounts preserve hot reload

### Environment Isolation ✅
- Separate dev/prod configurations
- Docker containers isolate dependencies
- Environment variables for configuration

This setup reduces local setup time and ensures reproducible builds across environments! 🚀
