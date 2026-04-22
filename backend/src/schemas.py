from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_by: int
    created_at: datetime
    is_active: bool
    members: List[User] = []

    class Config:
        from_attributes = True

class ProjectMemberAdd(BaseModel):
    user_id: int

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    self_destruct_seconds: Optional[int] = None

class Message(MessageBase):
    id: int
    sender_id: int
    project_id: int
    timestamp: datetime
    self_destruct_time: Optional[datetime] = None
    is_destroyed: bool = False
    sender: User

    class Config:
        from_attributes = True
