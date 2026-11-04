from fastapi import FastAPI
from app.database import Base, engine
from app import models
from app.routes import auth_routes, project_routes, survival_routes
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Akshaya Vana API",
    description="Environmental Project Tracker",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Connect authentication routes
app.include_router(auth_routes.router)

# Connect project routes
app.include_router(project_routes.router)
app.include_router(survival_routes.router)

Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"message": "Welcome to Akshaya Vana!"}


@app.get("/health")
def health_check():
    return {"status": "Healthy"}

@app.get("/health/db")
def database_health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))

    return {
        "database": "Connected",
        "status": "Healthy"
    }