# Job Connect Hub

**Internal Startup Project** - A modern job platform connecting job seekers with employers.

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Supabase
- **Backend**: FastAPI (Python 3.11)
- **Database & Auth**: Supabase (PostgreSQL + Authentication)
- **Tools**: GitHub Projects, Issues, Pull Requests

## Our Architecture in a Nutshell

To keep things simple, here's how our project is organized:

- **Frontend (Next.js) connects directly to Supabase for all data operations:**
  - User signup, login, and password management
  - User profiles and account settings
  - **Resume uploads and storage** (files stored in Supabase Storage)
  - **Job postings** (employers create/edit jobs directly in Supabase)
  - **Job applications** (job seekers apply directly through Supabase)
  - User sessions and authentication tokens
  - **All CRUD operations** (Create, Read, Update, Delete)

- **Frontend connects to FastAPI only for AI processing:**
  - AI analysis of uploaded resumes
  - AI-powered job matching recommendations  
  - Career chat assistance with LLMs

- **FastAPI (Backend) handles AI processing only:**
  - Receives data from frontend, processes with AI, returns results
  - No data storage - just AI computation
  - Verifies user tokens from Supabase for security 

## Quick Start

### Prerequisites
- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **Python** (v3.11+) - [Download](https://python.org/)
- **Git** - [Download](https://git-scm.com/)

### Installation
```bash
# 1. Clone the repo
git clone https://github.com/lordphone/job-connect-hub.git
cd job-connect-hub

# 2. Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# 3. Frontend setup
cd ../frontend
npm install
cp .env.example .env.local

# 4. Start development servers
# Terminal 1 (Backend):
cd backend && python main.py

# Terminal 2 (Frontend):
cd frontend && npm run dev

Afterwards, you can access our webapp at:
Frontend: http://localhost:3000 | Backend: http://localhost:8000

```

### Environment Variables

#### Frontend Environment Variables (Required for authentication)
Create and configure `frontend/.env.local` with Supabase connection:
```env
# Copy from frontend/.env.example and fill in your values

# Required: Supabase connection for user authentication & database
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Required: FastAPI connection for AI features  
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development
```

#### Backend Environment Variables (Optional for current development)
Create and configure `backend/.env` with your API keys:
```env
# Copy from backend/.env.example and fill in your values

# Required: For verifying user tokens from Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: For future real AI features (not needed yet - endpoints return mock data)
GOOGLE_API_KEY=your_google_api_key_here
```

> **Note**: Environment files (`.env`, `.env.local`) are gitignored and contain sensitive information. Never commit them to the repository.

## API Documentation

### Authentication: A Supabase-First Approach

In this project, we use a modern authentication strategy where our **Next.js frontend communicates directly with Supabase** for user login and signup. Our FastAPI backend does **not** handle user credentials.

Here is the standard authentication flow:

1. **Frontend Handles Auth:** The user signs up or logs in through the UI on our Next.js application. The frontend uses the official Supabase client library (`@supabase/supabase-js`) to manage this process.
2. **Supabase Issues a Token:** Upon successful login, Supabase sends a JWT (JSON Web Token) back to the frontend. This token is stored securely in the browser.
3. **Frontend Calls the Backend:** When the frontend needs AI features, it includes this JWT in the `Authorization` header when calling FastAPI endpoints.
   - **Header Format:** `Authorization: Bearer <the_jwt_token_from_supabase>`
4. **Backend Verifies the Token:** The FastAPI backend verifies the token with Supabase, then returns structured mock data (will be real AI responses later).

This approach is secure, efficient, and leverages the best features of both Supabase and FastAPI.

### How to work with mock API data and parallel development

**Scenario**: You're a backend developer working on a new AI resume analysis feature. The frontend team hasn't built the upload UI yet, but you need to develop and test your API endpoint.

#### Example: Building a Resume Analysis API

**Step 1: Create your endpoint with mock data**
```python
# In backend/main.py
@app.post("/api/analyze-resume")
async def analyze_resume(file: UploadFile = File(...)):
    # For now, return structured mock data instead of calling real AI (this will be replaced by the aieditor.dev functions)
    mock_analysis = {
        "skills_detected": ["Python", "JavaScript", "React", "FastAPI"],
        "experience_level": "Mid-level (3-5 years)",
        "suggested_improvements": [
            "Add more specific project outcomes",
            "Include relevant certifications",
            "Quantify your achievements with numbers"
        ],
        "match_score": 85,
        "strengths": ["Strong technical skills", "Diverse project experience"]
    }
    return {"status": "success", "analysis": mock_analysis}
```

**Step 2: Test independently with curl**
```bash
# Test your endpoint directly without frontend
curl -X POST "http://localhost:8000/api/analyze-resume" \
     -H "Authorization: Bearer fake_token_for_testing" \
     -F "file=@sample_resume.pdf"
```

**Step 3: Use a tool like Postman**
- Create a POST request to `http://localhost:8000/api/analyze-resume`
- Add Authorization header: `Bearer fake_token_for_testing`
- In Body tab, select "form-data" and add a file field named "file"
- Upload any PDF file to test

**Step 4: Validate your mock data structure**
```python
# Ensure your mock data matches what frontend expects
expected_response = {
    "status": "success",
    "analysis": {
        "skills_detected": ["str", "str", "..."],
        "experience_level": "str",
        "suggested_improvements": ["str", "str", "..."],
        "match_score": "int (0-100)",
        "strengths": ["str", "str", "..."]
    }
}
```

**Benefits of this approach:**
- Backend development can proceed independently
- API contracts are defined early
- Frontend team knows exactly what data structure to expect

## Development Guide

### Finding Your First Task

1. **Go to the [Projects Tab](../../projects) or [Issues Tab](../../issues) in our GitHub repository**
2. **Look for the "Job Connect Hub Development" board**
3. **Find a task in the "To Do" column with relevant labels**

### Task Assignment Process

1. **Click on the task card** you want to work on
2. **Read the description** and acceptance criteria carefully
3. **Ask questions** dm me on wechat or write a comment if anything is unclear
4. **Assign yourself** to the task (or ask a senior to assign you)
5. **Move the task** to "In Progress" column

### Development Workflow

#### Step 1: Create Your Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/issue-123-task-description
```

#### Step 2: Make Your Changes
- Work on your assigned task
- Follow the existing code style
- Test your changes locally
- Make small, focused commits

#### Step 3: Submit Your Work
```bash
git add .
git commit -m "Add: brief description of what you built"
git push origin feature/issue-123-task-description
```

#### Step 4: Create Pull Request
1. **Go to GitHub** and create a Pull Request
2. **Link your PR** to the issue (use "Closes #123" in description)
3. **Request review** from a senior team member
4. **Move your task** to "In Review" column

### Pull Request Guidelines

#### Good PR Description Template:
```markdown
## What this PR does
Brief description of your changes

## Related Issue
Closes #123

## Screenshots (if UI changes)
[Add screenshots here]
```

#### Before Submitting:
- Code follows existing patterns
- No console errors
- Functions work as described in the task
- Clean, readable code with comments

### CI/CD Integration

After submitting your Pull Request, it must pass all Continuous Integration (CI) tests before it can be merged.

#### Automated Checks:
- **Code Quality**: Linting and formatting checks
- **Type Safety**: TypeScript compilation (frontend)
- **Build Tests**: Ensure project builds successfully
- **Unit Tests**: Automated test suite execution

#### If CI Fails:
1. **Check the "Checks" tab** in your PR for detailed error messages
2. **Fix the issues** in your local branch
3. **Push the fixes** - CI will automatically re-run
4. **Don't merge** until all checks pass ✅

#### Common CI Issues:
- **Linting errors**: Run `npm run lint` (frontend) or check Python formatting
- **TypeScript errors**: Fix type issues before pushing
- **Build failures**: Ensure all imports and dependencies are correct
- **Test failures**: Make sure your changes don't break existing functionality

### Code Review Process

1. **Engineer team lead will review the request** asap
2. **Address feedback** if requested
3. **Make changes** and push new commits
4. **PR gets approved** and merged
5. **Task moves** to "Done" (or moved manually)

## Project Structure

```
job-connect-hub/
├── frontend/                 # Next.js frontend
│   ├── src/app/             # App router pages
│   │   ├── page.tsx         # Main tabbed interface
│   │   └── resume-builder/  # Resume builder page
│   ├── .env.example         # Environment template
│   ├── .env.local          # Local environment variables (gitignored)
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── main.py              # API endpoints
│   ├── requirements.txt     # Python dependencies
│   ├── env.example          # Environment template
│   └── .env                 # Environment variables (gitignored)
└── README.md               # This guide
```

## Getting Help

**Stuck on anything?** Don't be afraid to text in the wechat group chat! or dm me (lordphone) personally

## Learning Resources

### Frontend (React/Next.js)
- [React Documentation](https://react.dev/)
- [Next.js Learn Course](https://nextjs.org/learn)
- [Tailwind CSS Docs](https://tailwindcss.com/)

### Backend (Python/FastAPI)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Python Crash Course](https://www.python.org/about/gettingstarted/)
