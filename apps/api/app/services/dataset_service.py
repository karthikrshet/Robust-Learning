import os
import uuid
import pandas as pd
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile

from apps.api.app.models.dataset import Dataset
from apps.api.app.core.config import settings
from ml.preprocessing.loader import DatasetLoader, DatasetValidationError
from ml.utils.benchmarks import get_benchmark_dataset, BENCHMARK_REGISTRY

class DatasetService:
    @staticmethod
    def upload_dataset(db: Session, file_bytes: bytes, filename: str, dataset_name: Optional[str] = None) -> Dataset:
        # Load and validate dataset
        try:
            df, meta = DatasetLoader.load_from_bytes(file_bytes, filename)
            inspection = DatasetLoader.inspect_dataset(df)
        except DatasetValidationError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process dataset file: {str(e)}")

        dataset_id = str(uuid.uuid4())
        clean_name = dataset_name or os.path.splitext(filename)[0].replace("_", " ").title()

        # Save to filesystem
        storage_filename = f"{dataset_id}_{filename}"
        file_path = os.path.join(settings.DATASET_DIR, storage_filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        dataset = Dataset(
            id=dataset_id,
            name=clean_name,
            filename=filename,
            file_path=file_path,
            file_size=meta["file_size"],
            file_hash=meta["file_hash"],
            row_count=meta["row_count"],
            column_count=meta["column_count"],
            target_column=None,
            inspection_data=inspection
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset

    @staticmethod
    def load_benchmark(db: Session, benchmark_key: str) -> Dataset:
        if benchmark_key not in BENCHMARK_REGISTRY:
            raise HTTPException(
                status_code=404,
                detail=f"Benchmark '{benchmark_key}' not found. Available: {list(BENCHMARK_REGISTRY.keys())}"
            )

        df, meta = get_benchmark_dataset(benchmark_key)
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        filename = f"{benchmark_key}.csv"
        dataset_name = meta["name"]

        # Check if already loaded
        file_hash = DatasetLoader.compute_hash(csv_bytes)
        existing = db.query(Dataset).filter(Dataset.file_hash == file_hash).first()
        if existing:
            return existing

        dataset_id = str(uuid.uuid4())
        file_path = os.path.join(settings.DATASET_DIR, f"{dataset_id}_{filename}")
        with open(file_path, "wb") as f:
            f.write(csv_bytes)

        inspection = DatasetLoader.inspect_dataset(df, target_column=meta["target_column"])

        dataset = Dataset(
            id=dataset_id,
            name=dataset_name,
            filename=filename,
            file_path=file_path,
            file_size=len(csv_bytes),
            file_hash=file_hash,
            row_count=len(df),
            column_count=len(df.columns),
            target_column=meta["target_column"],
            inspection_data=inspection
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset

    @staticmethod
    def list_datasets(db: Session) -> List[Dataset]:
        return db.query(Dataset).order_by(Dataset.created_at.desc()).all()

    @staticmethod
    def get_dataset(db: Session, dataset_id: str) -> Dataset:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found.")
        return dataset

    @staticmethod
    def get_preview(db: Session, dataset_id: str, limit: int = 50) -> Dict[str, Any]:
        dataset = DatasetService.get_dataset(db, dataset_id)
        if not os.path.exists(dataset.file_path):
            raise HTTPException(status_code=404, detail="Dataset file missing on storage.")

        ext = os.path.splitext(dataset.filename)[1].lower()
        if ext in [".csv", ".txt"]:
            df = pd.read_csv(dataset.file_path, nrows=limit, low_memory=False)
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(dataset.file_path, nrows=limit)
        elif ext == ".parquet":
            df = pd.read_parquet(dataset.file_path).head(limit)
        else:
            raise HTTPException(status_code=400, detail="Unsupported dataset file format.")

        return {
            "columns": list(df.columns),
            "rows": df.fillna("").to_dict(orient="records"),
            "total_rows": dataset.row_count,
            "preview_count": len(df)
        }

    @staticmethod
    def inspect_target(db: Session, dataset_id: str, target_column: str) -> Dict[str, Any]:
        dataset = DatasetService.get_dataset(db, dataset_id)
        if not os.path.exists(dataset.file_path):
            raise HTTPException(status_code=404, detail="Dataset file missing on storage.")

        ext = os.path.splitext(dataset.filename)[1].lower()
        if ext in [".csv", ".txt"]:
            df = pd.read_csv(dataset.file_path, low_memory=False)
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(dataset.file_path)
        else:
            df = pd.read_parquet(dataset.file_path)

        try:
            target_info = DatasetLoader.validate_and_inspect_target(df, target_column)
        except DatasetValidationError as e:
            raise HTTPException(status_code=400, detail=str(e))

        return target_info

    @staticmethod
    def delete_dataset(db: Session, dataset_id: str) -> bool:
        dataset = DatasetService.get_dataset(db, dataset_id)
        if os.path.exists(dataset.file_path):
            try:
                os.remove(dataset.file_path)
            except Exception:
                pass
        db.delete(dataset)
        db.commit()
        return True
