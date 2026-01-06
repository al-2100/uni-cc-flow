from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models import tables
from src.schemas import dtos
from src.auth import get_current_user

router = APIRouter()

# ==================== USER INFO ====================
@router.get("/me")
def get_me(current_user: tables.User = Depends(get_current_user)):
    """Obtener datos del usuario autenticado"""
    return {"id": str(current_user.id), "email": current_user.email}

# ==================== GRAPH ENDPOINTS ====================

@router.get("/graph")
def get_graph(db: Session = Depends(get_db)):
    """Endpoint para obtener la estructura del grafo (Nodos y Aristas)"""
    courses = db.query(tables.Course).all()
    nodes = []
    edges = []
    
    # Lógica de posicionamiento simple para el grafo
    y_counters = {i: 0 for i in range(1, 12)}

    for c in courses:
        # Obtener lista de prerrequisitos con id y nombre
        prerequisites = [{"id": req.id, "name": req.name} for req in c.requirements]
        
        nodes.append({
            "id": c.id,
            "data": { 
                "label": f"{c.id}\n{c.name}", 
                "name": c.name,
                "credits": c.credits, 
                "cycle": c.cycle,
                "prerequisites": prerequisites
            },
            "position": { "x": c.cycle * 250, "y": y_counters.get(c.cycle, 0) * 150 },
            "type": "default"
        })
        y_counters[c.cycle] = y_counters.get(c.cycle, 0) + 1

        for req in c.requirements:
            edges.append({
                "id": f"e{req.id}-{c.id}",
                "source": req.id,
                "target": c.id,
                "animated": True
            })

    return {"nodes": nodes, "edges": edges}

# ==================== PROGRESS ENDPOINTS ====================

@router.post("/sync-progress", response_model=dtos.SyncResponse)
def sync_progress(payload: dtos.SyncRequest, current_user: tables.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Endpoint para sincronizar el progreso (REQUIERE AUTH)"""
    for item in payload.progress:
        prog = db.query(tables.StudentProgress).filter_by(
            user_id=current_user.id, 
            course_id=item.course_id
        ).first()

        if prog:
            prog.status = item.status
        else:
            prog = tables.StudentProgress(
                user_id=current_user.id, 
                course_id=item.course_id, 
                status=item.status
            )
            db.add(prog)
    
    db.commit()
    return {"status": "success", "message": "Progreso sincronizado correctamente"}

@router.get("/progress", response_model=List[dtos.ProgressResponse])
def get_my_progress(current_user: tables.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Recupera el progreso del usuario autenticado"""
    progress_records = db.query(tables.StudentProgress).filter_by(user_id=current_user.id).all()
    return [
        dtos.ProgressResponse(course_id=p.course_id, status=p.status) 
        for p in progress_records
    ]