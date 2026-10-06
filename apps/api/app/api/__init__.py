from fastapi import APIRouter
from apps.api.app.api.datasets import router as datasets_router
from apps.api.app.api.experiments import router as experiments_router
from apps.api.app.api.analysis import router as analysis_router

api_router = APIRouter()
api_router.include_router(datasets_router)
api_router.include_router(experiments_router)
api_router.include_router(analysis_router)
