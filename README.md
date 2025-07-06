# Job Connect Hub 🚀

**Internal Startup Project** - A modern job platform connecting job seekers with employers, powered by AI career assistance.

## 👥 Team Development Guide

Welcome to our engineering team! This guide will help you get started contributing to Job Connect Hub using GitHub's project management tools.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python 3.11) + Google Gemini AI
- **Tools**: GitHub Projects, Issues, Pull Requests

### 1. 📋 Finding Your First Task

1. **Go to the [Projects Tab](../../projects)** in our GitHub repository
2. **Look for the "Job Connect Hub Development" board**
3. **Find a task in the "🆕 To Do" column**

### 2. 🎯 Task Assignment Process

1. **Click on the task card** you want to work on
2. **Read the description** and acceptance criteria carefully
3. **Ask questions** dm me on wechat or write a comment if anything is unclear
4. **Assign yourself** to the task (or ask a senior to assign you)
5. **Move the task** to "🔄 In Progress" column

### 3. 💻 Development Setup

#### Prerequisites
- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **Python** (v3.11+) - [Download](https://python.org/)
- **Git** - [Download](https://git-scm.com/)

#### Quick Setup
```bash
# 1. Clone the repo
git clone https://github.com/yourusername/job-connect-hub.git
cd job-connect-hub

# 2. Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env

# 3. Frontend setup
cd ../frontend
npm install

# 4. Start development servers
# Terminal 1 (Backend):
cd backend && python main.py

# Terminal 2 (Frontend):
cd frontend && npm run dev
```

### 4. 🔄 Development Workflow

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

### 5. 📝 Pull Request Guidelines

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
- ✅ Code follows existing patterns
- ✅ No console errors
- ✅ Functions work as described in the task
- ✅ Clean, readable code with comments

### 6. 🔍 Code Review Process

1. **Engineer team lead will review the request** asap
2. **Address feedback** if requested
3. **Make changes** and push new commits
4. **PR gets approved** and merged
5. **Task automatically moves** to "✅ Done"

### 7. 🆘 Getting Help

- **Stuck on a anything?** Dont be afraid to text in the wechat group chat! or dm me (lordphone) personally

### 8. 📚 Learning Resources

#### For Frontend (React/Next.js):
- [React Documentation](https://react.dev/)
- [Next.js Learn Course](https://nextjs.org/learn)
- [Tailwind CSS Docs](https://tailwindcss.com/)

#### For Backend (Python/FastAPI):
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Python Crash Course](https://www.python.org/about/gettingstarted/)

## 🔧 Optional: AI Features Setup

API keys are optional for basic development. For AI chat features:
1. Get a [Google AI Studio API key](https://makersuite.google.com/app/apikey)
2. Add to `backend/.env`: `GOOGLE_API_KEY=your_key_here`

## 📁 Project Structure

```
job-connect-hub/
├── frontend/                 # Next.js frontend
│   ├── src/app/             # App router pages
│   │   ├── page.tsx         # Main tabbed interface
│   │   └── resume-builder/  # Resume builder page
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── main.py              # API endpoints
│   ├── requirements.txt     # Python dependencies
│   └── env.example          # Environment template
└── README.md               # This guide
```

## 🚀 Advanced Setup (For Seniors)

Need to set up the full development environment? Here's the complete setup:

```bash
# Backend with virtual environment
cd backend
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env

# Frontend
cd ../frontend
npm install

# Start both servers
# Terminal 1: cd backend && python main.py
# Terminal 2: cd frontend && npm run dev
```

**URLs:** Frontend: http://localhost:3000 | Backend: http://localhost:8000

---

*This README focuses on GitHub Projects workflow for team development. For detailed technical documentation, refer to the code comments and API documentation at `/docs` endpoints.*

**Happy coding! 🎉**

If you found this project helpful, please give it a ⭐ star on GitHub!