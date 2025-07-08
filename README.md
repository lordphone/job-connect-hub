# Job Connect Hub

**Internal Startup Project** - A modern job platform connecting job seekers with employers.

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python 3.11)
- **Tools**: GitHub Projects, Issues, Pull Requests

## Our Architecture in a Nutshell

To keep things simple, here's how our project is organized:

- **The Frontend (Next.js & Supabase) handles all user-related tasks:**
  - User signup, login, and password management.
  - Storing user data securely in Supabase.
  - It's the part of the app that users see and interact with.

- **The Backend (FastAPI) handles all AI and heavy-lifting tasks:**
  - All communication with Large Language Models (LLMs) for resume analysis.
  - Any future AI features or complex data processing.
  - **Important:** The backend is the only place we store secret API keys (like for Google AI). This keeps them safe.

## Quick Start

### Prerequisites
- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **Python** (v3.11+) - [Download](https://python.org/)
- **Git** - [Download](https://git-scm.com/)

### Installation
```bash
# 1. Clone the repo
git clone https://github.com/yourusername/job-connect-hub.git
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

Afterwards, you can access (default):
Frontend: http://localhost:3000 | Backend: http://localhost:8000

```

### Environment Variables

#### Backend Environment Variables
Configure `backend/.env` with your API keys:
```env
# Copy from backend/.env.example and fill in your values

# Optional for now but required for Supabase features (resume upload, email auth)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: For advanced features only (not required for basic development)
GOOGLE_API_KEY=your_google_api_key_here
```

#### Frontend Environment Variables
Configure `frontend/.env.local` with public configuration:
```env
# Copy from frontend/.env.example and fill in your values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development
```

> **Note**: Environment files (`.env`, `.env.local`) are gitignored and contain sensitive information. Never commit them to the repository.

## API Documentation

### Authentication: A Supabase-First Approach

In this project, we use a modern authentication strategy where our **Next.js frontend communicates directly with Supabase** for user login and signup. Our FastAPI backend does **not** handle user credentials.

Here is the standard authentication flow:

1.  **Frontend Handles Auth:** The user signs up or logs in through the UI on our Next.js application. The frontend uses the official Supabase client library (`@supabase/supabase-js`) to manage this process.
2.  **Supabase Issues a Token:** Upon successful login, Supabase sends a JWT (JSON Web Token) back to the frontend. This token is stored securely in the browser.
3.  **Frontend Calls the Backend:** When the frontend needs to make a request to our FastAPI backend (e.g., to fetch user-specific data), it includes this JWT in the `Authorization` header.
    - **Header Format:** `Authorization: Bearer <the_jwt_token_from_supabase>`
4.  **Backend Verifies the Token:** The FastAPI backend receives the request, extracts the token, and uses Supabase's keys to verify that the token is valid and not tampered with. If valid, it processes the request.

This approach is secure, efficient, and leverages the best features of both Supabase and FastAPI.

### Live API Docs for Backend Endpoints

While auth is handled by Supabase, our backend has other endpoints. For a full, interactive list of what's available:

**Once the backend is running, go to:**
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

### Example: Accessing a Protected Backend Route

Here’s how you would access an endpoint that requires a user to be logged in.

#### Get Current User Info
- **Endpoint:** `GET /users/me`
- **Authentication:** **Required**. You must provide the Supabase JWT in the `Authorization` header.
- **Purpose:** Fetches information about the currently logged-in user from our database. The backend uses the ID from the verified JWT to look up the user.
- **Success Response (`200 OK`):**
  ```json
  {
    "email": "user@example.com",
    "role": "Job Seeker"
  }
  ```
- **Error Response (`401 Unauthorized`):** If the token is missing, invalid, or expired.
  ```json
  { "detail": "Not authenticated" }
  ```

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

- **Stuck on anything?** Don't be afraid to text in the wechat group chat! or dm me (lordphone) personally

## Learning Resources

#### For Frontend (React/Next.js):
- [React Documentation](https://react.dev/)
- [Next.js Learn Course](https://nextjs.org/learn)
- [Tailwind CSS Docs](https://tailwindcss.com/)

#### For Backend (Python/FastAPI):
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Python Crash Course](https://www.python.org/about/gettingstarted/)
