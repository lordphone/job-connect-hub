# models.py
from pydantic import BaseModel, EmailStr, Field, field_validator
from .forms import as_form

@as_form
class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    salary: float

    @field_validator('salary')
    def salary_must_be_positive(cls, v):
        if v < 0:
            raise ValueError('Salary must be positive')
        return v

@as_form
class EmployeeCreate(EmployeeBase):
    pass

@as_form
class EmployeeUpdate(EmployeeBase):
    pass