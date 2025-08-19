from fastapi import FastAPI, HTTPException, Depends, status, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
import os
from dotenv import load_dotenv
import google.generativeai as genai
import uvicorn
from datetime import datetime, timezone
import uuid
import logging
import json
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
supabase: Optional[Client] = None

if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
    logger.info("Supabase client initialized")
else:
    logger.warning("Supabase credentials not found. Database features will be disabled.")

# Initialize FastAPI app
app = FastAPI(
    title="Job Connect Hub API",
    description="Backend API for Job Connect Hub with Google Gemini integration",
    version="1.0.0"
)

# Security
security = HTTPBearer(auto_error=False)

# Add exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# Add middleware for trusted hosts (security)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.vercel.app", "*.netlify.app"]
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Gemini client
gemini_client = None
if os.getenv("GOOGLE_API_KEY"):
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    gemini_client = genai.GenerativeModel('gemini-2.5-flash')

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    model: str = "gemini-2.5-flash"
    max_tokens: Optional[int] = 150

class ChatResponse(BaseModel):
    response: str
    model: str

class HealthResponse(BaseModel):
    status: str
    message: str

class JobPostCreate(BaseModel):
    job_title: str
    job_description: str
    job_salary: int
    job_type: str
    
    @validator('job_title')
    def validate_title(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Job title must be at least 3 characters')
        return v.strip()
    
    @validator('job_description')
    def validate_description(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Job description must be at least 10 characters')
        return v.strip()
    
    @validator('job_salary')
    def validate_salary(cls, v):
        if v < 0:
            raise ValueError('Salary must be positive')
        return v
    
    @validator('job_type')
    def validate_job_type(cls, v):
        allowed_types = ['full-time', 'part-time', 'contract', 'internship', 'freelance', 'temporary', 'volunteer', 'other']
        if v.lower() not in allowed_types:
            raise ValueError(f'Job type must be one of: {", ".join(allowed_types)}')
        return v.lower()

class JobPostResponse(BaseModel):
    job_post_id: str
    job_title: str
    job_description: str
    job_salary: int
    job_type: str
    created_at: str
    user_id: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    user_type: str  # 'jobseeker' or 'employer'
    fname: Optional[str] = None
    lname: Optional[str] = None
    company: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    user_type: str
    fname: Optional[str] = None
    lname: Optional[str] = None
    company: Optional[str] = None
    created_at: str

class ResumeEnhanceRequest(BaseModel):
    resume_text: str
    job_description: str

class ResumeEnhanceResponse(BaseModel):
    enhanced_resume: str
    suggestions: List[str]
    match_percentage: float

class JobApplicationCreate(BaseModel):
    job_post_id: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    
    @validator('cover_letter')
    def validate_cover_letter(cls, v):
        if v and len(v.strip()) < 10:
            raise ValueError('Cover letter must be at least 10 characters')
        return v.strip() if v else None

class JobApplicationResponse(BaseModel):
    application_id: str
    job_post_id: str
    applicant_id: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    status: str  # 'pending', 'reviewed', 'accepted', 'rejected'
    applied_at: str

class ResumeUploadResponse(BaseModel):
    resume_id: str
    filename: str
    file_url: str
    upload_date: str
    file_size: int

class ResumeListResponse(BaseModel):
    resume_id: str
    filename: str
    file_url: str
    upload_date: str
    file_size: int

# Helper functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extract user from JWT token (optional for now)"""
    if not credentials:
        return None
    # For now, we'll just return a mock user ID
    # In production, decode JWT and get real user
    return "mock-user-id"

def check_supabase_connection():
    """Check if Supabase is available"""
    if not supabase:
        raise HTTPException(
            status_code=500,
            detail="Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables."
        )
    return supabase

# Routes
@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint to check API health"""
    return HealthResponse(
        status="healthy",
        message="Job Connect Hub API is running!"
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="API is operational"
    )


@app.post("/chat", response_model=ChatResponse)
async def chat_with_llm(request: ChatRequest):
    """Chat endpoint for LLM interactions"""
    if not gemini_client:
        raise HTTPException(
            status_code=500,
            detail="Google API key not configured. Please set GOOGLE_API_KEY "
                   "environment variable."
        )

    try:
        # Create a prompt with system context
        prompt = f"""You are a helpful assistant for job searching and career advice.
        Please provide helpful, professional advice for career-related questions.

        User question: {request.message}"""

        response = gemini_client.generate_content(prompt)

        return ChatResponse(
            response=response.text,
            model=request.model
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with Google Gemini: {str(e)}"
        )


@app.get("/models")
async def get_available_models():
    """Get available LLM models"""
    if not gemini_client:
        return {"models": [], "error": "Google API key not configured"}

    try:
        # List available Gemini models
        models = genai.list_models()
        gemini_models = [
            model.name for model in models if 'gemini' in model.name.lower()
        ]
        return {"models": gemini_models}
    except Exception as e:
        return {
            "models": ["gemini-2.5-flash", "gemini-pro", "gemini-pro-vision"],
            "error": str(e)
        }

# Job Posts Endpoints
@app.get("/jobs", response_model=List[JobPostResponse])
async def get_job_posts():
    """Get all job posts"""
    db = check_supabase_connection()
    
    try:
        result = db.table('job_posts').select('*').order('created_at', desc=True).execute()
        
        job_posts = []
        for job in result.data:
            job_posts.append(JobPostResponse(
                job_post_id=str(job['job_post_id']),
                job_title=job['job_title'],
                job_description=job['job_description'],
                job_salary=job['job_salary'],
                job_type=job['job_type'],
                created_at=job['created_at'],
                user_id=job.get('user_id')
            ))
        
        return job_posts
        
    except Exception as e:
        logger.error(f"Error fetching job posts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching job posts: {str(e)}")

@app.post("/jobs", response_model=JobPostResponse)
async def create_job_post(job_data: JobPostCreate, current_user: Optional[str] = Depends(get_current_user)):
    """Create a new job post"""
    db = check_supabase_connection()
    
    try:
        # Generate a UUID for the job post
        job_post_id = str(uuid.uuid4())
        
        job_post = {
            'job_post_id': job_post_id,
            'job_title': job_data.job_title,
            'job_description': job_data.job_description,
            'job_salary': job_data.job_salary,
            'job_type': job_data.job_type,
            'user_id': current_user,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        result = db.table('job_posts').insert(job_post).execute()
        
        if result.data:
            created_job = result.data[0]
            return JobPostResponse(
                job_post_id=str(created_job['job_post_id']),
                job_title=created_job['job_title'],
                job_description=created_job['job_description'],
                job_salary=created_job['job_salary'],
                job_type=created_job['job_type'],
                created_at=created_job['created_at'],
                user_id=created_job.get('user_id')
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create job post")
            
    except Exception as e:
        logger.error(f"Error creating job post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating job post: {str(e)}")

@app.delete("/jobs/{job_id}")
async def delete_job_post(job_id: str, current_user: Optional[str] = Depends(get_current_user)):
    """Delete a job post"""
    db = check_supabase_connection()
    
    try:
        # First check if the job exists and user owns it (if authentication is enabled)
        result = db.table('job_posts').delete().eq('job_post_id', job_id).execute()
        
        if result.data:
            return {"message": "Job post deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Job post not found")
            
    except Exception as e:
        logger.error(f"Error deleting job post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting job post: {str(e)}")

@app.get("/jobs/search")
async def search_job_posts(q: Optional[str] = None, job_type: Optional[str] = None, min_salary: Optional[int] = None):
    """Search job posts with filters"""
    db = check_supabase_connection()
    
    try:
        query = db.table('job_posts').select('*')
        
        # Add filters
        if q:
            query = query.or_(f'job_title.ilike.%{q}%,job_description.ilike.%{q}%')
        if job_type:
            query = query.eq('job_type', job_type)
        if min_salary:
            query = query.gte('job_salary', min_salary)
            
        result = query.order('created_at', desc=True).execute()
        
        job_posts = []
        for job in result.data:
            job_posts.append(JobPostResponse(
                job_post_id=str(job['job_post_id']),
                job_title=job['job_title'],
                job_description=job['job_description'],
                job_salary=job['job_salary'],
                job_type=job['job_type'],
                created_at=job['created_at'],
                user_id=job.get('user_id')
            ))
        
        return job_posts
        
    except Exception as e:
        logger.error(f"Error searching job posts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching job posts: {str(e)}")

@app.get("/stats")
async def get_platform_stats():
    """Get platform statistics"""
    db = check_supabase_connection()
    
    try:
        # Get job post count
        job_count_result = db.table('job_posts').select('job_post_id', count='exact').execute()
        job_count = job_count_result.count if job_count_result.count else 0
        
        # Get job types distribution
        job_types_result = db.table('job_posts').select('job_type').execute()
        job_types = {}
        if job_types_result.data:
            for job in job_types_result.data:
                job_type = job['job_type']
                job_types[job_type] = job_types.get(job_type, 0) + 1
        
        return {
            "total_jobs": job_count,
            "job_types_distribution": job_types,
            "api_version": "1.0.0",
            "status": "operational"
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return {
            "total_jobs": 0,
            "job_types_distribution": {},
            "api_version": "1.0.0",
            "status": "error",
            "error": str(e)
        }

# Job Applications Endpoints
@app.post("/applications", response_model=JobApplicationResponse)
async def apply_to_job(application_data: JobApplicationCreate, current_user: Optional[str] = Depends(get_current_user)):
    """Apply to a job posting"""
    db = check_supabase_connection()
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to apply")
    
    try:
        # Check if job post exists
        job_check = db.table('job_posts').select('job_post_id').eq('job_post_id', application_data.job_post_id).execute()
        if not job_check.data:
            raise HTTPException(status_code=404, detail="Job post not found")
        
        # Check if user already applied
        existing_application = db.table('job_applications').select('application_id').eq('job_post_id', application_data.job_post_id).eq('applicant_id', current_user).execute()
        if existing_application.data:
            raise HTTPException(status_code=400, detail="You have already applied to this job")
        
        # Create application
        application_id = str(uuid.uuid4())
        application = {
            'application_id': application_id,
            'job_post_id': application_data.job_post_id,
            'applicant_id': current_user,
            'cover_letter': application_data.cover_letter,
            'resume_url': application_data.resume_url,
            'status': 'pending',
            'applied_at': datetime.now(timezone.utc).isoformat()
        }
        
        result = db.table('job_applications').insert(application).execute()
        
        if result.data:
            created_application = result.data[0]
            return JobApplicationResponse(**created_application)
        else:
            raise HTTPException(status_code=500, detail="Failed to submit application")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error submitting application: {str(e)}")

@app.get("/applications", response_model=List[JobApplicationResponse])
async def get_user_applications(current_user: Optional[str] = Depends(get_current_user)):
    """Get current user's job applications"""
    db = check_supabase_connection()
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        result = db.table('job_applications').select('*').eq('applicant_id', current_user).order('applied_at', desc=True).execute()
        
        applications = []
        for app in result.data:
            applications.append(JobApplicationResponse(**app))
        
        return applications
        
    except Exception as e:
        logger.error(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching applications: {str(e)}")

@app.get("/jobs/{job_id}/applications", response_model=List[JobApplicationResponse])
async def get_job_applications(job_id: str, current_user: Optional[str] = Depends(get_current_user)):
    """Get applications for a specific job (employer only)"""
    db = check_supabase_connection()
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Verify job exists and user owns it (basic check)
        job_check = db.table('job_posts').select('user_id').eq('job_post_id', job_id).execute()
        if not job_check.data:
            raise HTTPException(status_code=404, detail="Job post not found")
        
        result = db.table('job_applications').select('*').eq('job_post_id', job_id).order('applied_at', desc=True).execute()
        
        applications = []
        for app in result.data:
            applications.append(JobApplicationResponse(**app))
        
        return applications
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job applications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching job applications: {str(e)}")

@app.patch("/applications/{application_id}/status")
async def update_application_status(application_id: str, status: str, current_user: Optional[str] = Depends(get_current_user)):
    """Update application status (employer only)"""
    db = check_supabase_connection()
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if status not in ['pending', 'reviewed', 'accepted', 'rejected']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    try:
        result = db.table('job_applications').update({'status': status}).eq('application_id', application_id).execute()
        
        if result.data:
            return {"message": f"Application status updated to {status}"}
        else:
            raise HTTPException(status_code=404, detail="Application not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating application status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating application status: {str(e)}")

# Resume Management Endpoints
@app.post("/resumes/upload", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...), current_user: Optional[str] = Depends(get_current_user)):
    """Upload a resume file"""
    db = check_supabase_connection()
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Validate file type
    allowed_types = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF, DOC, DOCX, and TXT files are allowed")
    
    # Validate file size (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")
    
    try:
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
        unique_filename = f"{current_user}_{uuid.uuid4()}.{file_extension}"
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Supabase Storage
        try:
            storage_response = db.storage.from_('resumes').upload(unique_filename, file_content)
            if storage_response.get('error'):
                raise Exception(f"Storage upload failed: {storage_response['error']}")
            
            # Get public URL
            file_url = db.storage.from_('resumes').get_public_url(unique_filename)
            
        except Exception as storage_error:
            # Fallback: save metadata without file for demo purposes
            logger.warning(f"Storage upload failed: {storage_error}. Using mock URL.")
            file_url = f"https://mock-storage.example.com/resumes/{unique_filename}"
        
        # Save metadata to database
        resume_id = str(uuid.uuid4())
        resume_record = {
            'resume_id': resume_id,
            'user_id': current_user,
            'filename': file.filename,
            'file_url': file_url,
            'file_size': len(file_content),
            'upload_date': datetime.now(timezone.utc).isoformat()
        }
        
        result = db.table('resumes').insert(resume_record).execute()
        
        if result.data:
            return ResumeUploadResponse(
                resume_id=resume_id,
                filename=file.filename,
                file_url=file_url,
                upload_date=resume_record['upload_date'],
                file_size=len(file_content)
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to save resume metadata")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading resume: {str(e)}")

@app.get("/resumes", response_model=List[ResumeListResponse])
async def get_user_resumes(current_user: Optional[str] = Depends(get_current_user)):
    """Get user's uploaded resumes"""
    db = check_supabase_connection()
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        result = db.table('resumes').select('*').eq('user_id', current_user).order('upload_date', desc=True).execute()
        
        resumes = []
        for resume in result.data:
            resumes.append(ResumeListResponse(
                resume_id=resume['resume_id'],
                filename=resume['filename'],
                file_url=resume['file_url'],
                upload_date=resume['upload_date'],
                file_size=resume['file_size']
            ))
        
        return resumes
        
    except Exception as e:
        logger.error(f"Error fetching resumes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching resumes: {str(e)}")

@app.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str, current_user: Optional[str] = Depends(get_current_user)):
    """Delete a resume"""
    db = check_supabase_connection()
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Verify resume belongs to user
        resume_check = db.table('resumes').select('file_url').eq('resume_id', resume_id).eq('user_id', current_user).execute()
        if not resume_check.data:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Delete from storage (best effort)
        try:
            filename = resume_check.data[0]['file_url'].split('/')[-1]
            db.storage.from_('resumes').remove([filename])
        except Exception as storage_error:
            logger.warning(f"Failed to delete file from storage: {storage_error}")
        
        # Delete from database
        result = db.table('resumes').delete().eq('resume_id', resume_id).eq('user_id', current_user).execute()
        
        if result.data:
            return {"message": "Resume deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Resume not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting resume: {str(e)}")

# Authentication Endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    db = check_supabase_connection()
    
    try:
        # Use Supabase auth
        result = db.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "user_type": user_data.user_type,
                    "fname": user_data.fname,
                    "lname": user_data.lname,
                    "company": user_data.company
                }
            }
        })
        
        if result.user:
            return UserResponse(
                id=result.user.id,
                email=result.user.email,
                user_type=user_data.user_type,
                fname=user_data.fname,
                lname=user_data.lname,
                company=user_data.company,
                created_at=datetime.now(timezone.utc).isoformat()
            )
        else:
            raise HTTPException(status_code=400, detail="Registration failed")
            
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@app.post("/auth/login")
async def login_user(email: str, password: str):
    """Login user"""
    db = check_supabase_connection()
    
    try:
        result = db.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if result.user and result.session:
            return {
                "access_token": result.session.access_token,
                "token_type": "bearer",
                "user": {
                    "id": result.user.id,
                    "email": result.user.email,
                    "user_type": result.user.user_metadata.get("user_type")
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/auth/profile", response_model=UserResponse)
async def get_user_profile(current_user: str = Depends(get_current_user)):
    """Get current user profile"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # In a real implementation, you'd fetch from database
    # For now, return mock data
    return UserResponse(
        id=current_user,
        email="user@example.com",
        user_type="jobseeker",
        fname="John",
        lname="Doe",
        created_at=datetime.now(timezone.utc).isoformat()
    )

# Resume Enhancement Endpoint
@app.post("/resume/enhance", response_model=ResumeEnhanceResponse)
async def enhance_resume(request: ResumeEnhanceRequest):
    """Enhance resume using Google Gemini"""
    if not gemini_client:
        raise HTTPException(
            status_code=500,
            detail="Google API key not configured. Please set GOOGLE_API_KEY environment variable."
        )
    
    try:
        prompt = f"""You are an expert resume enhancement AI. Analyze the following resume against the job description and provide improvements.

RESUME:
{request.resume_text}

JOB DESCRIPTION:
{request.job_description}

Please provide:
1. An enhanced version of the resume with better formatting, stronger action verbs, and quantified achievements
2. Specific suggestions for improvement
3. A match percentage (0-100) indicating how well the resume matches the job requirements

Respond in JSON format:
{{
    "enhanced_resume": "improved resume text here",
    "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
    "match_percentage": 75
}}"""

        response = gemini_client.generate_content(prompt)
        
        # Try to parse the JSON response
        import json
        try:
            result = json.loads(response.text)
            return ResumeEnhanceResponse(
                enhanced_resume=result.get("enhanced_resume", request.resume_text),
                suggestions=result.get("suggestions", ["Resume looks good!"]),
                match_percentage=result.get("match_percentage", 0.0)
            )
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return ResumeEnhanceResponse(
                enhanced_resume=response.text,
                suggestions=["Consider using stronger action verbs", "Add quantified achievements", "Tailor skills to job requirements"],
                match_percentage=75.0
            )
            
    except Exception as e:
        logger.error(f"Error enhancing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error enhancing resume: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
