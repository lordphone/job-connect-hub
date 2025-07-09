# routes/auth_routes.py
from fastapi import APIRouter, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from ..database import supabase, supabase_employer
from fastapi.templating import Jinja2Templates
from starlette.responses import Response

router = APIRouter()
templates = Jinja2Templates(directory="./dual_login/templates")

@router.get("/signup", response_class=HTMLResponse)
async def signup_form(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@router.get("/employer", response_class=HTMLResponse)
async def employer_form(request: Request):
    return templates.TemplateResponse("employer_signup.html", {"request": request})

@router.post("/signup")
async def signup(email: str = Form(...), password: str = Form(...)):
    try:
        auth_response = supabase.auth.sign_up({
            'email': email,
            'password': password
        })
        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")
        return RedirectResponse("/login", status_code=303)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/employer")
async def signup(email: str = Form(...), password: str = Form(...)):
    try:
        print("test")
        auth_response = supabase_employer.auth.sign_up({
            'email': email,
            'password': password
        })
        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")
        return RedirectResponse("/login_employer", status_code=303)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/login", response_class=HTMLResponse)
async def login_form(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/login_employer", response_class=HTMLResponse)
async def login_form(request: Request):
    return templates.TemplateResponse("login_employer.html", {"request": request})

@router.post("/login")
async def login(response: Response, email: str = Form(...), password: str = Form(...)):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            'email': email,
            'password': password
        })
        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Login failed")
        # Set token in cookies
        access_token = auth_response.session.access_token
        response = RedirectResponse("/user_homepage", status_code=303)
        response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/login_employer")
async def login(response: Response, email: str = Form(...), password: str = Form(...)):
    try:
        auth_response = supabase_employer.auth.sign_in_with_password({
            'email': email,
            'password': password
        })
        print("hello")
        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Login failed")
        # Set token in cookies
        access_token = auth_response.session.access_token
        response = RedirectResponse("/employer_homepage", status_code=303)
        response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/logout")
async def logout(response: Response):
    response = RedirectResponse("/login", status_code=303)
    response.delete_cookie(key="access_token")
    return response