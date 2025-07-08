# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from .auth import auth_middleware
from .routes import employee_routes, auth_routes
app = FastAPI()


# Mount the static files directory
app.mount("/static", StaticFiles(directory="./employee_repo/static"), name="static")

# Set up templates
templates = Jinja2Templates(directory="./employee_repo/templates")

# Add middleware
app.middleware("http")(auth_middleware)

# Include routers
app.include_router(employee_routes.router)
app.include_router(auth_routes.router)