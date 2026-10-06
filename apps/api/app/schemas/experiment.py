from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, ConfigDict

class PreprocessingInputSchema(BaseModel):
    imputation_numeric: str = Field("median", description="mean, median, or constant")
    imputation_categorical: str = Field("most_frequent", description="most_frequent or constant")
    scaler: str = Field("standard", description="standard, robust, minmax, or none")
    handle_duplicates: str = Field("keep", description="remove or keep")

class SplitInputSchema(BaseModel):
    train_ratio: float = Field(0.70, ge=0.1, le=0.9)
    val_ratio: float = Field(0.15, ge=0.0, le=0.5)
    test_ratio: float = Field(0.15, ge=0.05, le=0.5)

class ExperimentCreateSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    dataset_id: str
    target_column: str
    preprocessing: PreprocessingInputSchema = Field(default_factory=PreprocessingInputSchema)
    split: SplitInputSchema = Field(default_factory=SplitInputSchema)
    noise_levels: List[float] = Field(default_factory=lambda: [0.0, 0.10, 0.20, 0.30])
    noise_strategy: str = Field("symmetric", description="symmetric or asymmetric")
    random_seeds: List[int] = Field(default_factory=lambda: [42])
    selected_models: List[str] = Field(
        default_factory=lambda: [
            "baseline_logistic_regression",
            "baseline_random_forest",
            "robust_weighted_random_forest",
            "robust_trimmed_random_forest"
        ]
    )
    detection_threshold: float = Field(0.50, ge=0.1, le=0.95)

class ExperimentStatusResponse(BaseModel):
    id: str
    name: str
    status: str
    current_step: int
    total_steps: int
    current_step_name: str
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None

class ExperimentResponseSchema(BaseModel):
    id: str
    name: str
    dataset_id: str
    status: str
    current_step: int
    total_steps: int
    current_step_name: str
    config_data: Dict[str, Any]
    results_data: Optional[Dict[str, Any]] = None
    report_pdf_path: Optional[str] = None
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
