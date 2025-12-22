import uuid
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database import Base

# Generador de UUID para SQLite
def generate_uuid():
    return str(uuid.uuid4())

class Prerequisite(Base):
    __tablename__ = "prerequisites"
    course_id = Column(String, ForeignKey("courses.id"), primary_key=True)
    requirement_id = Column(String, ForeignKey("courses.id"), primary_key=True)

class Course(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    cycle = Column(Integer)
    credits = Column(Integer)
    is_mandatory = Column(Boolean, default=True)
    requirements = relationship("Course", secondary="prerequisites", 
                                primaryjoin=id==Prerequisite.course_id,
                                secondaryjoin=id==Prerequisite.requirement_id, backref="required_for")

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid, index=True) 
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    progress = relationship("StudentProgress", back_populates="user")

class StudentProgress(Base):
    __tablename__ = "student_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id")) 
    course_id = Column(String, ForeignKey("courses.id"))
    status = Column(String)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="progress")
    course = relationship("Course")