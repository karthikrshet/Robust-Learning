from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.services.experiment_service import ExperimentService

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_benchmark_and_preview_workflow():
    # Load benchmark dataset
    resp = client.post("/api/datasets/benchmark", json={"benchmark_key": "wine_quality"})
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    dataset_id = data["id"]
    assert data["row_count"] == 178
    assert data["target_column"] == "cultivar"

    # Preview
    prev_resp = client.get(f"/api/datasets/{dataset_id}/preview?limit=10")
    assert prev_resp.status_code == 200
    prev_data = prev_resp.json()
    assert len(prev_data["rows"]) == 10
    assert "cultivar" in prev_data["columns"]

    # Target inspection
    target_resp = client.get(f"/api/datasets/{dataset_id}/target/cultivar")
    assert target_resp.status_code == 200
    target_data = target_resp.json()
    assert target_data["num_classes"] == 3

def test_experiment_creation_and_execution():
    # Load breast cancer benchmark for fast binary testing
    load_resp = client.post("/api/datasets/benchmark", json={"benchmark_key": "breast_cancer"})
    assert load_resp.status_code == 200
    dataset_id = load_resp.json()["id"]

    exp_payload = {
        "name": "Integration Test Noise Experiment",
        "dataset_id": dataset_id,
        "target_column": "diagnosis",
        "noise_levels": [0.0, 0.20],
        "noise_strategy": "symmetric",
        "random_seeds": [42],
        "selected_models": [
            "baseline_logistic_regression",
            "robust_weighted_logistic_regression"
        ],
        "detection_threshold": 0.50
    }

    create_resp = client.post("/api/experiments", json=exp_payload)
    assert create_resp.status_code == 200
    exp_id = create_resp.json()["id"]

    # Run experiment synchronously for testing
    ExperimentService.execute_experiment_task(exp_id)

    # Verify status
    status_resp = client.get(f"/api/experiments/{exp_id}/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "COMPLETED"

    # Verify results
    exp_resp = client.get(f"/api/experiments/{exp_id}")
    assert exp_resp.status_code == 200
    exp_data = exp_resp.json()
    assert exp_data["results_data"] is not None

    model_results = exp_data["results_data"]["model_results"]
    assert len(model_results) == 4  # 2 models * 2 noise levels

    # Verify metrics endpoint
    metrics_resp = client.get(f"/api/experiments/{exp_id}/metrics")
    assert metrics_resp.status_code == 200
    assert len(metrics_resp.json()["model_results"]) == 4

    # Verify suspicious labels endpoint
    susp_resp = client.get(f"/api/experiments/{exp_id}/suspicious-labels")
    assert susp_resp.status_code == 200
    assert "samples" in susp_resp.json()

    # Verify PDF report endpoint
    report_resp = client.get(f"/api/experiments/{exp_id}/report")
    assert report_resp.status_code == 200
    assert report_resp.headers["content-type"] == "application/pdf"

    # Verify CSV export endpoint
    export_resp = client.get(f"/api/experiments/{exp_id}/export/metrics.csv")
    assert export_resp.status_code == 200
    assert "model_id" in export_resp.text
