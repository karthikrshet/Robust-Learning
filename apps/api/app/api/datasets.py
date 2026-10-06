from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session

from apps.api.app.db.session import get_db
from apps.api.app.services.dataset_service import DatasetService
from apps.api.app.schemas.dataset import (
    DatasetResponseSchema,
    BenchmarkLoadRequest
)

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/upload", response_model=DatasetResponseSchema)
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Uploads a CSV, XLSX, or Parquet dataset, validates schema, and computes statistics."""
    contents = await file.read()
    filename = file.filename or "uploaded_dataset.csv"
    dataset = DatasetService.upload_dataset(db, contents, filename, dataset_name=name)
    return dataset

@router.post("/benchmark", response_model=DatasetResponseSchema)
def load_benchmark(
    request: BenchmarkLoadRequest,
    db: Session = Depends(get_db)
):
    """Loads a real-world public benchmark classification dataset (e.g., Breast Cancer, Wine)."""
    dataset = DatasetService.load_benchmark(db, request.benchmark_key)
    return dataset

@router.get("", response_model=List[DatasetResponseSchema])
def list_datasets(db: Session = Depends(get_db)):
    """Retrieves all registered datasets."""
    return DatasetService.list_datasets(db)

@router.get("/{dataset_id}", response_model=DatasetResponseSchema)
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    """Retrieves full metadata and exploratory statistics for a dataset."""
    return DatasetService.get_dataset(db, dataset_id)

@router.get("/{dataset_id}/preview")
def get_preview(
    dataset_id: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieves real row-level data preview for inspection."""
    return DatasetService.get_preview(db, dataset_id, limit=limit)

@router.get("/{dataset_id}/target/{target_column}")
def inspect_target(
    dataset_id: str,
    target_column: str,
    db: Session = Depends(get_db)
):
    """Validates target column for classification and computes real class distribution."""
    return DatasetService.inspect_target(db, dataset_id, target_column)

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    """Deletes a dataset and associated storage files."""
    DatasetService.delete_dataset(db, dataset_id)
    return {"message": "Dataset deleted successfully", "id": dataset_id}
