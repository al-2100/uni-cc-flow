from pydantic import BaseModel, EmailStr
from typing import List, Optional

# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Sync
class ProgressItem(BaseModel):
    course_id: str
    status: str

class SyncRequest(BaseModel):
    progress: List[ProgressItem]

class ProgressResponse(BaseModel):
    course_id: str
    status: str

class SyncResponse(BaseModel):
    status: str
    message: str