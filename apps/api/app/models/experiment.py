import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from apps.api.app.db.session import Base

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    status = Column(String(50), default="QUEUED", nullable=False, index=True)
    # QUEUED, PREPROCESSING, TRAINING_BASELINE, DETECTING_NOISE, TRAINING_ROBUST, EVALUATING, GENERATING_REPORT, COMPLETED, FAILED

    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)
    current_step_name = Column(String(255), default="Queued")

    config_data = Column(JSON, nullable=False)
    results_data = Column(JSON, nullable=True)
    report_pdf_path = Column(String(512), nullable=True)
    error_message = Column(String(1024), nullable=True)
    duration_seconds = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    dataset = relationship("Dataset", back_populates="experiments")
