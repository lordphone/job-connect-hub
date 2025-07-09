from fastapi import FastAPI, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from dotenv import load_dotenv
import google.generativeai as genai
import uvicorn
import jwt
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Job Connect Hub API",
    description="Backend API for Job Connect Hub with Google Gemini integration",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Gemini client
gemini_client = None
if os.getenv("GOOGLE_API_KEY"):
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    gemini_client = genai.GenerativeModel('gemini-2.5-flash')

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')
SUPABASE_URL_EMPLOYER = os.getenv('SUPABASE_URL_EMPLOYER')
SUPABASE_KEY_EMPLOYER = os.getenv('SUPABASE_KEY_EMPLOYER')

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

if SUPABASE_URL_EMPLOYER and SUPABASE_KEY_EMPLOYER:
    supabase_employer: Client = create_client(SUPABASE_URL_EMPLOYER, SUPABASE_KEY_EMPLOYER)
else:
    supabase_employer = None

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


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    user_type: str  # "jobseeker" or "employer"


class SignupResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    user_type: str  # "jobseeker" or "employer"


class LoginResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None


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


# Authentication Routes
@app.get("/auth/test")
async def test_auth():
    """Test endpoint to verify authentication routes are accessible"""
    return {
        "message": "Auth routes are working", 
        "jobseeker_supabase_configured": supabase is not None,
        "employer_supabase_configured": supabase_employer is not None
    }


@app.post("/auth/signup", response_model=SignupResponse)
async def signup(request: SignupRequest):
    """Sign up endpoint for job seekers and employers"""
    
    # Determine which Supabase connection to use based on user type
    if request.user_type == "employer":
        if not supabase_employer:
            return SignupResponse(
                success=False,
                message="Employer Supabase not configured. Please set SUPABASE_URL_EMPLOYER and SUPABASE_KEY_EMPLOYER environment variables."
            )
        supabase_client = supabase_employer
    elif request.user_type == "jobseeker":
        if not supabase:
            return SignupResponse(
                success=False,
                message="Job Seeker Supabase not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables."
            )
        supabase_client = supabase
    else:
        return SignupResponse(
            success=False,
            message="Invalid user type. Must be 'jobseeker' or 'employer'"
        )
    
    try:
        auth_response = supabase_client.auth.sign_up({
            'email': request.email,
            'password': request.password
        })
        
        if auth_response.user is None:
            return SignupResponse(
                success=False,
                message="Signup failed"
            )
        
        return SignupResponse(
            success=True,
            message=f"{request.user_type.title()} registered successfully",
            user_id=auth_response.user.id
        )
    except Exception as e:
        return SignupResponse(
            success=False,
            message=f"Signup error: {str(e)}"
        )


@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login endpoint for job seekers and employers"""
    
    # Determine which Supabase connection to use based on user type
    if request.user_type == "employer":
        if not supabase_employer:
            return LoginResponse(
                success=False,
                message="Employer Supabase not configured. Please set SUPABASE_URL_EMPLOYER and SUPABASE_KEY_EMPLOYER environment variables."
            )
        supabase_client = supabase_employer
    elif request.user_type == "jobseeker":
        if not supabase:
            return LoginResponse(
                success=False,
                message="Job Seeker Supabase not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables."
            )
        supabase_client = supabase
    else:
        return LoginResponse(
            success=False,
            message="Invalid user type. Must be 'jobseeker' or 'employer'"
        )
    
    try:
        auth_response = supabase_client.auth.sign_in_with_password({
            'email': request.email,
            'password': request.password
        })
        
        if auth_response.user is None:
            return LoginResponse(
                success=False,
                message="Login failed"
            )
        
        return LoginResponse(
            success=True,
            message=f"{request.user_type.title()} login successful",
            access_token=auth_response.session.access_token
        )
    except Exception as e:
        return LoginResponse(
            success=False,
            message=f"Login error: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
