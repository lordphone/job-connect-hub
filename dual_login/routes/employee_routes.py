# routes/employee_routes.py
from fastapi import APIRouter, Request, Depends, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from ..database import supabase, SUPABASE_BUCKET, SUPABASE_URL
from ..auth import get_current_user
from ..models import EmployeeCreate, EmployeeUpdate
from ..forms import as_form
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="./dual_login/templates")

@router.get("/", response_class=HTMLResponse)
async def read_employees(request: Request):
    return templates.TemplateResponse("base.html", {"request": request})

@router.get("/user_homepage", response_class=HTMLResponse)
async def read_employees(request: Request):
    return templates.TemplateResponse("user_dashboard.html", {"request": request})

@router.get("/employer_homepage", response_class=HTMLResponse)
async def employer_home(request: Request):
    return templates.TemplateResponse("employer_homepage.html", {"request": request})
