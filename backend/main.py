from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
import google.generativeai as genai
import uvicorn
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

# Initialize Supabase client (optional - only needed if backend requires Supabase access)
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

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





if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
