from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database import engine, get_db
from src.models import tables
from src.routers import api
from src.routers import auth
from src.services import data_loader

# Crear tablas en DB al iniciar
tables.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ACECOM Visualizador Malla")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar Routers
app.include_router(api.router)
app.include_router(auth.router)

# Ejecutar el servicio de carga de datos al iniciar
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    data_loader.seed_database(db)