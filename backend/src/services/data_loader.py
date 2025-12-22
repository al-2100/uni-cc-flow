import json
from sqlalchemy.orm import Session
from src.models import tables

def seed_database(db: Session, json_path: str = "data.json"):
    """Lógica para cargar la malla curricular inicial si la DB está vacía"""
    # Verificar si ya existen cursos
    if db.query(tables.Course).first():
        return

    print("--- SERVICIO: Poblando Base de Datos desde JSON ---")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            courses_data = json.load(f)
        
        # 1. Insertar Cursos
        for c_data in courses_data:
            course = tables.Course(
                id=c_data['id'],
                name=c_data['name'],
                cycle=c_data['cycle'],
                credits=c_data['credits']
            )
            db.merge(course)
        db.commit()

        # 2. Insertar Prerrequisitos
        for c_data in courses_data:
            for req_id in c_data['prerequisites']:
                if db.query(tables.Course).filter_by(id=req_id).first():
                    prereq = tables.Prerequisite(
                        course_id=c_data['id'], 
                        requirement_id=req_id
                    )
                    db.merge(prereq)
        db.commit()
        print("--- SERVICIO: Carga completada con éxito ---")
    except Exception as e:
        print(f"Error cargando datos: {e}")