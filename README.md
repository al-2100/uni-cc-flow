# UNI-CC-FLOW

Visualizador interactivo de la malla curricular de Ciencia de la Computacion de la Universidad Nacional de Ingenieria (UNI).

## Descripcion

Aplicacion web que permite a los estudiantes:

- Visualizar la malla curricular como un grafo interactivo
- Marcar cursos como aprobados o pendientes
- Sincronizar su progreso en la nube (requiere cuenta)
- Trabajar en modo invitado con almacenamiento local

## Tecnologias

**Backend:**
- Python 3.10+
- FastAPI
- SQLAlchemy
- JWT para autenticacion

**Frontend:**
- React 19.x (>= 19.2.0)
- Vite 7.x (>= 7.2.4)
- ReactFlow 11.x (>= 11.11.4)
- Axios 1.13.x (>= 1.13.2)

## Requisitos

- Python 3.10 o superior
- Node.js 18 o superior
- npm

## Configuracion

### 1. Backend

Crear el archivo `backend/.env`:

```env
SECRET_KEY=tu_clave_secreta_muy_larga_y_segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite:///./malla_academica.db
```

> Genera una clave secreta segura con: `openssl rand -hex 32`

### 2. Frontend

Crear el archivo `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## Instalacion

### Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Ejecucion

### Iniciar Backend (puerto 8000)

```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn src.main:app --reload
```

### Iniciar Frontend (puerto 5173)

```bash
cd frontend
npm run dev
```

Abrir http://localhost:5173 en el navegador.

## Estructura del Proyecto

```
uni-cc-flow/
├── backend/
│   ├── src/
│   │   ├── main.py          # Punto de entrada FastAPI
│   │   ├── auth.py          # Autenticacion JWT
│   │   ├── config.py        # Configuracion desde .env
│   │   ├── database.py      # Conexion SQLAlchemy
│   │   ├── models/          # Modelos de base de datos
│   │   ├── routers/         # Endpoints API
│   │   ├── schemas/         # DTOs Pydantic
│   │   └── services/        # Logica de negocio
│   ├── data.json            # Datos de cursos y prerequisitos
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Componente principal
│   │   ├── api/             # Cliente HTTP
│   │   ├── components/      # Componentes
│   │   └── hooks/           # Custom hooks
│   ├── package.json
│   └── .env
│
└── README.md
```

## API Endpoints

| Metodo | Ruta           | Descripcion                    | Auth |
|--------|----------------|--------------------------------|------|
| GET    | /graph         | Obtener malla curricular       | No   |
| POST   | /register      | Crear cuenta                   | No   |
| POST   | /login         | Iniciar sesion                 | No   |
| GET    | /me            | Obtener usuario actual         | Si   |
| GET    | /progress      | Obtener progreso del usuario   | Si   |
| POST   | /sync-progress | Sincronizar progreso           | Si   |

## Uso

1. Al abrir la aplicacion, se muestra la malla curricular
2. Hacer clic en un curso para marcarlo como aprobado/pendiente
3. Los cambios se guardan localmente de forma automatica
4. Para sincronizar, iniciar sesion y presionar "Guardar en Nube"