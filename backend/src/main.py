from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Dict
import json
from datetime import datetime, timedelta, timezone

from . import models, schemas, database

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
        
    db_project = models.Project(**project.model_dump(), created_by=creator_id)
    db_project.members.append(user)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/projects/{user_id}", response_model=List[schemas.Project])
def get_user_projects(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.projects

@app.post("/projects/{project_id}/members", response_model=schemas.Project)
def add_project_member(project_id: int, member_data: schemas.ProjectMemberAdd, db: Session = Depends(database.get_db)):
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
        
    return project

@app.get("/projects/{project_id}/messages", response_model=List[schemas.Message])
def get_project_messages(project_id: int, db: Session = Depends(database.get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    messages = db.query(models.Message).filter(
        models.Message.project_id == project_id,
        models.Message.is_destroyed == False
    ).all()
    return messages

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
        
    db_message = models.Message(
        sender_id=sender_id,
        project_id=project_id,
        content=message.content
    )
    
    if message.self_destruct_seconds:
        db_message.self_destruct_time = datetime.now(timezone.utc) + timedelta(seconds=message.self_destruct_seconds)
        
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@app.post("/messages/{message_id}/destroy")
def destroy_message(message_id: int, db: Session = Depends(database.get_db)):
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    message.is_destroyed = True
    db.commit()
    return {"status": "success"}
