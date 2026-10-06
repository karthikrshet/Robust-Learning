import os
import uuid
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import HTTPException

from apps.api.app.models.experiment import Experiment
from apps.api.app.models.dataset import Dataset
from apps.api.app.schemas.experiment import ExperimentCreateSchema
from apps.api.app.core.config import settings
from apps.api.app.db.session import SessionLocal

from ml.preprocessing.pipeline import PreprocessingConfig
from ml.experiments.runner import ExperimentRunner, ExperimentConfig
from reports.generator import ExperimentReportGenerator

class ExperimentService:
    @staticmethod
    def create_experiment(db: Session, schema: ExperimentCreateSchema) -> Experiment:
        # Validate dataset exists
        dataset = db.query(Dataset).filter(Dataset.id == schema.dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found.")

        exp_id = str(uuid.uuid4())
        config_data = schema.model_dump()

        experiment = Experiment(
            id=exp_id,
            name=schema.name,
            dataset_id=schema.dataset_id,
            status="QUEUED",
            current_step=0,
            total_steps=10,
            current_step_name="Queued for execution",
            config_data=config_data,
            results_data=None,
            report_pdf_path=None,
            error_message=None,
            duration_seconds=None
        )
        db.add(experiment)
        db.commit()
        db.refresh(experiment)
        return experiment

    @staticmethod
    def execute_experiment_task(experiment_id: str):
        """
        Executes the experiment in background/sync worker.
        Safely opens independent DB session to update status at each step.
        """
        db: Session = SessionLocal()
        try:
            exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
            if not exp:
                return

            dataset = db.query(Dataset).filter(Dataset.id == exp.dataset_id).first()
            if not dataset or not os.path.exists(dataset.file_path):
                exp.status = "FAILED"
                exp.error_message = "Dataset file could not be found on storage."
                db.commit()
                return

            # Read dataset
            ext = os.path.splitext(dataset.filename)[1].lower()
            if ext in [".csv", ".txt"]:
                raw_df = pd.read_csv(dataset.file_path, low_memory=False)
            elif ext in [".xlsx", ".xls"]:
                raw_df = pd.read_excel(dataset.file_path)
            else:
                raw_df = pd.read_parquet(dataset.file_path)

            cfg_dict = exp.config_data
            prep_dict = cfg_dict.get("preprocessing", {})
            split_dict = cfg_dict.get("split", {})

            prep_cfg = PreprocessingConfig(
                target_column=cfg_dict["target_column"],
                imputation_numeric=prep_dict.get("imputation_numeric", "median"),
                imputation_categorical=prep_dict.get("imputation_categorical", "most_frequent"),
                scaler=prep_dict.get("scaler", "standard"),
                handle_duplicates=prep_dict.get("handle_duplicates", "keep")
            )

            exp_cfg = ExperimentConfig(
                target_column=cfg_dict["target_column"],
                preprocessing_config=prep_cfg,
                train_ratio=split_dict.get("train_ratio", 0.70),
                val_ratio=split_dict.get("val_ratio", 0.15),
                test_ratio=split_dict.get("test_ratio", 0.15),
                noise_levels=cfg_dict.get("noise_levels", [0.0, 0.10, 0.20, 0.30]),
                noise_strategy=cfg_dict.get("noise_strategy", "symmetric"),
                random_seeds=cfg_dict.get("random_seeds", [42]),
                selected_models=cfg_dict.get("selected_models", [
                    "baseline_logistic_regression",
                    "baseline_random_forest",
                    "robust_weighted_random_forest",
                    "robust_trimmed_random_forest"
                ]),
                detection_threshold=cfg_dict.get("detection_threshold", 0.50)
            )

            def progress_callback(step_name: str, step_idx: int, total_steps: int):
                # Update status in db
                try:
                    exp.current_step = step_idx
                    exp.total_steps = total_steps
                    exp.current_step_name = step_name

                    # Map step to status code
                    lower = step_name.lower()
                    if "preprocessing" in lower:
                        exp.status = "PREPROCESSING"
                    elif "split" in lower or "noise" in lower and "detect" not in lower:
                        exp.status = "INJECTING_NOISE"
                    elif "detect" in lower or "suspicious" in lower:
                        exp.status = "DETECTING_NOISE"
                    elif "training" in lower:
                        exp.status = "TRAINING_MODELS"
                    elif "evaluat" in lower or "synthesiz" in lower:
                        exp.status = "EVALUATING"

                    db.commit()
                except Exception:
                    db.rollback()

            runner = ExperimentRunner(exp_cfg)
            results = runner.run(raw_df, progress_callback=progress_callback)

            # Generate PDF Report
            exp.status = "GENERATING_REPORT"
            exp.current_step_name = "Generating formal PDF report"
            db.commit()

            pdf_filename = f"report_{exp.id}.pdf"
            pdf_path = os.path.join(settings.REPORT_DIR, pdf_filename)
            report_data = {
                "experiment_id": exp.id,
                "dataset_info": results["dataset_info"],
                "split_info": results["split_info"],
                "config": results["config"],
                "model_results": results["model_results"],
                "suspicious_samples": results["suspicious_samples"],
                "findings": results["findings"]
            }
            ExperimentReportGenerator.generate_pdf(report_data, pdf_path)

            # Complete
            exp.status = "COMPLETED"
            exp.current_step_name = "Experiment completed successfully"
            exp.results_data = results
            exp.report_pdf_path = pdf_path
            exp.duration_seconds = results["total_duration_sec"]
            exp.completed_at = datetime.utcnow()
            db.commit()

        except Exception as e:
            try:
                exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
                if exp:
                    exp.status = "FAILED"
                    exp.current_step_name = "Failed"
                    exp.error_message = str(e)
                    exp.completed_at = datetime.utcnow()
                    db.commit()
            except Exception:
                db.rollback()
        finally:
            db.close()

    @staticmethod
    def get_experiment(db: Session, experiment_id: str) -> Experiment:
        exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Experiment not found.")
        return exp

    @staticmethod
    def list_experiments(db: Session) -> List[Experiment]:
        return db.query(Experiment).order_by(Experiment.created_at.desc()).all()

    @staticmethod
    def get_dashboard_stats(db: Session) -> Dict[str, Any]:
        """Calculates real operational counts from PostgreSQL/SQLite."""
        dataset_count = db.query(Dataset).count()
        experiments = db.query(Experiment).all()
        experiment_count = len(experiments)

        total_models_trained = 0
        total_suspicious_detected = 0

        for exp in experiments:
            if exp.status == "COMPLETED" and exp.results_data:
                res = exp.results_data
                model_results = res.get("model_results", [])
                total_models_trained += len(model_results)

                suspicious = res.get("suspicious_samples", [])
                total_suspicious_detected += sum(1 for s in suspicious if s.get("is_suspicious"))

        recent_exps = (
            db.query(Experiment)
            .order_by(Experiment.created_at.desc())
            .limit(5)
            .all()
        )

        return {
            "datasets_count": dataset_count,
            "experiments_count": experiment_count,
            "models_trained_count": total_models_trained,
            "suspicious_labels_detected": total_suspicious_detected,
            "recent_experiments": [
                {
                    "id": e.id,
                    "name": e.name,
                    "status": e.status,
                    "dataset_name": e.dataset.name if e.dataset else "Dataset",
                    "duration_seconds": e.duration_seconds,
                    "created_at": e.created_at.isoformat() if e.created_at else None
                }
                for e in recent_exps
            ]
        }
