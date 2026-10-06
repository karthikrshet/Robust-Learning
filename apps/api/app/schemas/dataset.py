from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, ConfigDict

class ColumnStatSchema(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    std: Optional[float] = None
    median: Optional[float] = None

class ColumnInfoSchema(BaseModel):
    name: str
    dtype: str
    is_numeric: bool
    missing_count: int
    missing_percentage: float
    unique_values: int
    sample_values: List[Any]
    stats: Optional[ColumnStatSchema] = None
    top_categories: Optional[Dict[str, int]] = None

class ClassDistributionItem(BaseModel):
    class_name: str
    count: int
    percentage: float

class TargetInfoSchema(BaseModel):
    target_column: str
    num_classes: int
    classes: List[str]
    distribution: List[ClassDistributionItem]
    is_binary: bool
    imbalance_ratio: Optional[float] = None

class DatasetInspectionSchema(BaseModel):
    row_count: int
    column_count: int
    feature_count: int
    duplicate_rows: int
    total_missing_values: int
    numeric_features: List[str]
    categorical_features: List[str]
    columns: List[ColumnInfoSchema]
    target_info: Optional[TargetInfoSchema] = None

class DatasetResponseSchema(BaseModel):
    id: str
    name: str
    filename: str
    file_size: int
    file_hash: str
    row_count: int
    column_count: int
    target_column: Optional[str] = None
    inspection_data: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BenchmarkLoadRequest(BaseModel):
    benchmark_key: str = Field(..., description="Key of the benchmark dataset, e.g. 'breast_cancer' or 'wine_quality'")
