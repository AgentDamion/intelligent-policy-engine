from fastapi import FastAPI
from api.live_metrics import router as metrics_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="aicomplyr.io API", description="Live Governance Proof API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the metrics router
app.include_router(metrics_router, prefix="/api", tags=["metrics"])

@app.get("/")
async def root():
    return {"message": "aicomplyr.io API - Live Governance Proof", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "aicomplyr-api"} 