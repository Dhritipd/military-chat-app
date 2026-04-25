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
    stego_key: Optional[str] = None
    members: Optional[List[User]] = None
    member_count: Optional[int] = None
    user_role: Optional[str] = None

    class Config:
        from_attributes = True

class ProjectMemberAdd(BaseModel):
    user_id: int

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    self_destruct_seconds: Optional[int] = None
    recipient_type: str = "project"

class Message(MessageBase):
    id: int
    sender_id: int
    project_id: int
    timestamp: datetime
    self_destruct_time: Optional[datetime] = None
    is_destroyed: bool = False
    sensitivity: str = "low"
    recipient_type: str = "project"
    sender: User

    class Config:
        from_attributes = True
