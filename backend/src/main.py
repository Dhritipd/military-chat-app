from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, select, insert, update
from typing import List, Dict
import json
from datetime import datetime, timedelta, timezone
import os
import random
import shutil
import string

from .stego.ack_manager import ACKHidingManager

from . import models, schemas, database

def auto_assign_sensitivity(timer_seconds, recipient_type):
    if timer_seconds is not None and timer_seconds <= 60:
        base = "high"
    elif timer_seconds is not None and timer_seconds <= 300:
        base = "medium"
    else:
        base = "low"
        
    if recipient_type == "commander":
        if base == "low": return "medium"
        if base == "medium": return "high"
        
    return base

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/users/", response_model=schemas.User)
def create_or_get_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        return db_user
    new_user = models.User(username=user.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.post("/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, creator_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == creator_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    stego_key = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    db_project = models.Project(**project.model_dump(), created_by=creator_id, stego_key=stego_key)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    stmt = models.project_members.insert().values(
        user_id=creator_id,
        project_id=db_project.id,
        role="commander"
    )
    db.execute(stmt)
    db.commit()
    db.refresh(db_project)
    
    return schemas.Project(
        id=db_project.id, name=db_project.name, description=db_project.description,
        created_by=db_project.created_by, created_at=db_project.created_at,
        is_active=db_project.is_active, user_role="commander", member_count=1, members=None,
        stego_key=db_project.stego_key
    )

@app.get("/projects/{user_id}", response_model=List[schemas.Project])
def get_user_projects(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    response = []
    for p in user.projects:
        stmt = select(models.project_members.c.role).where(
            models.project_members.c.user_id == user_id,
            models.project_members.c.project_id == p.id
        )
        role = db.execute(stmt).scalar()
        
        proj_dict = {
            "id": p.id, "name": p.name, "description": p.description,
            "created_by": p.created_by, "created_at": p.created_at,
            "is_active": p.is_active, "user_role": role, "members": None,
            "stego_key": p.stego_key
        }
        if role == "commander":
            proj_dict["member_count"] = len(p.members)
            
        response.append(schemas.Project(**proj_dict))
    return response

@app.post("/projects/{project_id}/members", response_model=schemas.Project)
def add_project_member(project_id: int, member_data: schemas.ProjectMemberAdd, user_id: int, db: Session = Depends(database.get_db)):
    stmt = select(models.project_members.c.role).where(
        models.project_members.c.user_id == user_id,
        models.project_members.c.project_id == project_id
    )
    role = db.execute(stmt).scalar()
    if role != "commander":
        raise HTTPException(status_code=403, detail="Only commanders can add members")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    user = db.query(models.User).filter(models.User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user not in project.members:
        project.members.append(user)
        db.commit()
        db.refresh(project)
        
    return schemas.Project(
        id=project.id, name=project.name, description=project.description,
        created_by=project.created_by, created_at=project.created_at,
        is_active=project.is_active, user_role="commander", 
        member_count=len(project.members), members=None, stego_key=project.stego_key
    )

@app.get("/projects/{project_id}/members", response_model=List[schemas.User])
def get_project_members(project_id: int, user_id: int, db: Session = Depends(database.get_db)):
    stmt = select(models.project_members.c.role).where(
        models.project_members.c.user_id == user_id,
        models.project_members.c.project_id == project_id
    )
    role = db.execute(stmt).scalar()
    if role != "commander":
        raise HTTPException(status_code=403, detail="Only commanders can view members")
        
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.members

@app.get("/projects/{project_id}/messages", response_model=List[schemas.Message])
def get_project_messages(project_id: int, user_id: int, db: Session = Depends(database.get_db)):
    stmt = select(models.project_members.c.role).where(
        models.project_members.c.user_id == user_id,
        models.project_members.c.project_id == project_id
    )
    role = db.execute(stmt).scalar()

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    messages = db.query(models.Message).filter(
        models.Message.project_id == project_id,
        models.Message.is_destroyed == False
    ).all()
    
    res = []
    for m in messages:
        m_dict = {
            "id": m.id, "sender_id": m.sender_id, "project_id": m.project_id,
            "content": m.content, "timestamp": m.timestamp,
            "self_destruct_time": m.self_destruct_time, "is_destroyed": m.is_destroyed,
            "sensitivity": m.sensitivity,
            "recipient_type": m.recipient_type
        }
        
        # Filter for commander-only messages
        if m.recipient_type == "commander" and role != "commander" and m.sender_id != user_id:
            continue
            
        if role == "commander" or m.sender_id == user_id:
            m_dict["sender"] = m.sender
        else:
            m_dict["sender"] = schemas.User(id=0, username="Operator")
        res.append(schemas.Message(**m_dict))
    return res

@app.post("/projects/{project_id}/messages", response_model=schemas.Message)
def send_project_message(project_id: int, sender_id: int, message: schemas.MessageCreate, db: Session = Depends(database.get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    user = db.query(models.User).filter(models.User.id == sender_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user not in project.members:
        raise HTTPException(status_code=403, detail="User is not a member of this project")
        
    sensitivity = auto_assign_sensitivity(message.self_destruct_seconds, message.recipient_type)
        
    db_message = models.Message(
        sender_id=sender_id,
        project_id=project_id,
        content=message.content,
        sensitivity=sensitivity,
        recipient_type=message.recipient_type
    )
    
    if message.self_destruct_seconds:
        db_message.self_destruct_time = datetime.now(timezone.utc) + timedelta(seconds=message.self_destruct_seconds)
        
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@app.post("/messages/{message_id}/destroy")
def destroy_message(message_id: int, method: str = Form(...), project_id: int = Form(...), file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        extracted_id = ACKHidingManager.extract_ack(temp_file_path, method, project.stego_key)
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=400, detail=f"Invalid stego image: {str(e)}")
        
    if os.path.exists(temp_file_path):
        os.remove(temp_file_path)
        
    if extracted_id != message_id:
        raise HTTPException(status_code=400, detail="Message ID mismatch in stego image")
        
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    message.is_destroyed = True
    db.commit()
    return {"status": "success"}

@app.get("/stego/cover-image")
def get_cover_image(project_id: int = 0):
    covers_dir = os.path.join(os.path.dirname(__file__), "stego", "covers")
    if not os.path.exists(covers_dir) or not os.path.isdir(covers_dir):
        raise HTTPException(status_code=404, detail="Covers directory not found")
    
    images = sorted([f for f in os.listdir(covers_dir) if f.endswith(('.png', '.jpg', '.jpeg'))])
    if not images:
        raise HTTPException(status_code=404, detail="No cover images available")
        
    random.seed(project_id)
    selected_image = random.choice(images)
    random.seed()
    image_path = os.path.join(covers_dir, selected_image)
    return FileResponse(image_path)

@app.get("/messages/{message_id}/sensitivity")
def get_message_sensitivity(message_id: int, db: Session = Depends(database.get_db)):
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"sensitivity": message.sensitivity}

