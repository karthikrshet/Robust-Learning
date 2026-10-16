from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from apps.api.app.db.session import get_db
from apps.api.app.models.experiment import Experiment

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.get("/compare")
def compare_experiments(
    experiment_ids: List[str] = Query(..., description="List of experiment IDs to compare"),
    db: Session = Depends(get_db)
):
    """Compares metrics and degradation curves across multiple experiments."""
    experiments = db.query(Experiment).filter(Experiment.id.in_(experiment_ids)).all()
    comparison_data = []

    for exp in experiments:
        if exp.status == "COMPLETED" and exp.results_data:
            res = exp.results_data
            comparison_data.append({
                "experiment_id": exp.id,
                "experiment_name": exp.name,
                "dataset_name": exp.dataset.name if exp.dataset else "Dataset",
                "config": exp.config_data,
                "model_results": res.get("model_results", []),
                "findings": res.get("findings", [])
            })

    return {
        "compared_count": len(comparison_data),
        "experiments": comparison_data
    }

@router.get("/methodology")
def get_methodology_guide():
    """Returns grounded methodology explanations and technical documentation."""
    return {
        "title": "Robust Learning Under Label Noise: Theoretical & Algorithmic Foundation",
        "sections": [
            {
                "heading": "1. The Label Noise Problem",
                "content": (
                    "In real-world supervised classification, human annotation errors, sensor flaws, and imperfect heuristics "
                    "introduce label noise. Standard deep and statistical classifiers have high expressive capacity and tend "
                    "to memorize corrupted labels, distorting decision boundaries and drastically harming generalization on unseen data."
                )
            },
            {
                "heading": "2. Controlled Noise Injection",
                "content": (
                    "To evaluate noise tolerance reproducibly, controlled label corruption is applied strictly to training partitions. "
                    "Validation and test sets remain pristine ground-truth references. Symmetric noise randomly permutes labels uniformly, "
                    "while asymmetric noise introduces class-conditional pair flips reflecting domain-specific confusion."
                )
            },
            {
                "heading": "3. Confident Learning & Label Issue Detection",
                "content": (
                    "Instead of naively treating all training errors as label noise, Confident Learning estimates the joint distribution "
                    "P(observed_label, true_label) using out-of-sample predicted probabilities via cross-validation. "
                    "A sample is flagged as suspicious when the model's confidence in an alternate class significantly exceeds its self-confidence "
                    "in the assigned label: margin = P(y_pred | x) - P(y_obs | x)."
                )
            },
            {
                "heading": "4. Robust Learning Paradigms",
                "content": (
                    "This platform implements two primary noise-resistant paradigms: "
                    "(1) Robust Sample Weighting: assigns down-weighting factors w_i = clip(1.0 - issue_score_i, min_w, 1.0) so questionable "
                    "samples have diminished influence during empirical risk minimization. "
                    "(2) Trimmed Selective Training: excludes samples whose suspiciousness exceeds a disciplined threshold, "
                    "purifying the training manifold."
                )
            },
            {
                "heading": "5. Empirical Evaluation & Objective Findings",
                "content": (
                    "Every metric (Accuracy, Precision, Recall, F1-Score, Confusion Matrix) is computed directly from true test labels and model predictions. "
                    "The platform never fabricates results or guarantees robust superiority; findings honestly reflect whether robust learning "
                    "outperformed or matched conventional baselines under given data geometry and noise levels."
                )
            }
        ]
    }
