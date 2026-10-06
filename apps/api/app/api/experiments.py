import io
import json
import csv
import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from apps.api.app.db.session import get_db
from apps.api.app.services.experiment_service import ExperimentService
from apps.api.app.schemas.experiment import (
    ExperimentCreateSchema,
    ExperimentResponseSchema,
    ExperimentStatusResponse
)

router = APIRouter(prefix="/experiments", tags=["Experiments"])

@router.post("", response_model=ExperimentResponseSchema)
def create_experiment(
    payload: ExperimentCreateSchema,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Creates a new experiment and immediately begins background pipeline execution."""
    exp = ExperimentService.create_experiment(db, payload)
    background_tasks.add_task(ExperimentService.execute_experiment_task, exp.id)
    return exp

@router.get("", response_model=List[ExperimentResponseSchema])
def list_experiments(db: Session = Depends(get_db)):
    """Lists all historical and running experiments."""
    return ExperimentService.list_experiments(db)

@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Returns real operational dashboard counters and recent experiments."""
    return ExperimentService.get_dashboard_stats(db)

@router.get("/{experiment_id}", response_model=ExperimentResponseSchema)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Retrieves full experiment configuration and computed results."""
    return ExperimentService.get_experiment(db, experiment_id)

@router.get("/{experiment_id}/status", response_model=ExperimentStatusResponse)
def get_experiment_status(experiment_id: str, db: Session = Depends(get_db)):
    """Polls real-time step execution status and progress."""
    exp = ExperimentService.get_experiment(db, experiment_id)
    return ExperimentStatusResponse(
        id=exp.id,
        name=exp.name,
        status=exp.status,
        current_step=exp.current_step,
        total_steps=exp.total_steps,
        current_step_name=exp.current_step_name,
        duration_seconds=exp.duration_seconds,
        error_message=exp.error_message
    )

@router.post("/{experiment_id}/run", response_model=ExperimentStatusResponse)
def run_experiment(
    experiment_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Triggers execution for an existing queued or failed experiment."""
    exp = ExperimentService.get_experiment(db, experiment_id)
    background_tasks.add_task(ExperimentService.execute_experiment_task, exp.id)
    return ExperimentStatusResponse(
        id=exp.id,
        name=exp.name,
        status="QUEUED",
        current_step=0,
        total_steps=exp.total_steps or 10,
        current_step_name="Queued for execution"
    )

@router.get("/{experiment_id}/metrics")
def get_metrics(experiment_id: str, db: Session = Depends(get_db)):
    """Retrieves computed model evaluation metrics."""
    exp = ExperimentService.get_experiment(db, experiment_id)
    if not exp.results_data:
        raise HTTPException(status_code=400, detail="Experiment results are not yet available.")
    return {
        "model_results": exp.results_data.get("model_results", []),
        "aggregated_metrics": exp.results_data.get("aggregated_metrics"),
        "findings": exp.results_data.get("findings", [])
    }

@router.get("/{experiment_id}/noise-analysis")
def get_noise_analysis(experiment_id: str, db: Session = Depends(get_db)):
    """Retrieves noise level progression runs and degradation curves."""
    exp = ExperimentService.get_experiment(db, experiment_id)
    if not exp.results_data:
        raise HTTPException(status_code=400, detail="Experiment results are not yet available.")
    return {
        "noise_runs": exp.results_data.get("noise_runs", []),
        "findings": exp.results_data.get("findings", [])
    }

@router.get("/{experiment_id}/suspicious-labels")
def get_suspicious_labels(
    experiment_id: str,
    filter_status: Optional[str] = Query(None, description="All, Potential Issue, or Likely Consistent"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieves diagnosed training samples with suspiciousness scores."""
    exp = ExperimentService.get_experiment(db, experiment_id)
    if not exp.results_data:
        raise HTTPException(status_code=400, detail="Experiment results are not yet available.")

    all_samples = exp.results_data.get("suspicious_samples", [])
    if filter_status and filter_status != "All":
        filtered = [s for s in all_samples if s.get("status") == filter_status]
    else:
        filtered = all_samples

    total_count = len(filtered)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_samples = filtered[start_idx:end_idx]

    return {
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "suspicious_count": sum(1 for s in all_samples if s.get("is_suspicious")),
        "samples": paginated_samples
    }

@router.get("/{experiment_id}/report")
def download_pdf_report(experiment_id: str, db: Session = Depends(get_db)):
    """Downloads the formal publication-ready academic PDF experiment report."""
    exp = ExperimentService.get_experiment(db, experiment_id)
    if not exp.report_pdf_path or not os.path.exists(exp.report_pdf_path):
        raise HTTPException(status_code=404, detail="PDF report not found or experiment not completed.")

    return FileResponse(
        exp.report_pdf_path,
        media_type="application/pdf",
        filename=f"robust_learning_report_{exp.id[:8]}.pdf"
    )

@router.get("/{experiment_id}/export/{export_type}")
def export_results(
    experiment_id: str,
    export_type: str,
    db: Session = Depends(get_db)
):
    """Exports actual experiment artifacts in CSV or JSON format."""
    exp = ExperimentService.get_experiment(db, experiment_id)
    if not exp.results_data:
        raise HTTPException(status_code=400, detail="Experiment results not ready for export.")

    res = exp.results_data

    if export_type == "config.json":
        json_str = json.dumps(exp.config_data, indent=2)
        return StreamingResponse(
            io.StringIO(json_str),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=config_{exp.id[:8]}.json"}
        )

    elif export_type == "metrics.csv":
        models = res.get("model_results", [])
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["model_id", "display_name", "model_type", "noise_level", "noise_percent", "accuracy", "precision", "recall", "f1", "training_duration_sec"])
        for m in models:
            writer.writerow([
                m.get("model_id"),
                m.get("display_name"),
                m.get("model_type"),
                m.get("noise_level"),
                m.get("noise_percent"),
                m.get("accuracy"),
                m.get("precision"),
                m.get("recall"),
                m.get("f1"),
                m.get("training_duration_sec")
            ])
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=metrics_{exp.id[:8]}.csv"}
        )

    elif export_type == "suspicious_labels.csv":
        samples = res.get("suspicious_samples", [])
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["sample_id", "observed_label", "predicted_label", "confidence", "observed_probability", "issue_score", "status"])
        for s in samples:
            writer.writerow([
                s.get("sample_id"),
                s.get("observed_label_name"),
                s.get("predicted_label_name"),
                s.get("confidence"),
                s.get("observed_probability"),
                s.get("issue_score"),
                s.get("status")
            ])
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=suspicious_labels_{exp.id[:8]}.csv"}
        )

    raise HTTPException(status_code=400, detail=f"Unsupported export type '{export_type}'.")
