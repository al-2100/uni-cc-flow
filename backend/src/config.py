import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY no está definida.")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./malla_academica.db")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está definida.")