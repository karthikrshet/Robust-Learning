import pytest
import numpy as np
import pandas as pd
from ml.preprocessing.loader import DatasetLoader, DatasetValidationError
from ml.preprocessing.pipeline import TabularPreprocessor, PreprocessingConfig
from ml.preprocessing.splitter import DataSplitter

def test_dataset_loader_csv_and_inspection():
    csv_data = "age,salary,department,purchased\n25,50000,Sales,No\n30,60000,Engineering,Yes\n35,,Engineering,Yes\n40,80000,HR,No\n25,50000,Sales,No\n".encode("utf-8")
    df, meta = DatasetLoader.load_from_bytes(csv_data, "test.csv")

    assert df.shape[0] == 5
    assert df.shape[1] == 4
    assert meta["file_size"] == len(csv_data)
    assert meta["row_count"] == 5

    inspection = DatasetLoader.inspect_dataset(df, target_column="purchased")
    assert inspection["duplicate_rows"] == 1
    assert inspection["total_missing_values"] == 1
    assert inspection["target_info"]["num_classes"] == 2
    assert "Yes" in inspection["target_info"]["classes"]
    assert "No" in inspection["target_info"]["classes"]

def test_target_validation_rejects_single_class():
    df = pd.DataFrame({"x": [1, 2, 3], "target": ["A", "A", "A"]})
    with pytest.raises(DatasetValidationError, match="requires at least 2 distinct classes"):
        DatasetLoader.validate_and_inspect_target(df, "target")

def test_target_validation_rejects_continuous():
    np.random.seed(42)
    df = pd.DataFrame({"x": range(50), "target": np.random.randn(50)})
    with pytest.raises(DatasetValidationError, match="continuous numerical variable"):
        DatasetLoader.validate_and_inspect_target(df, "target")

def test_tabular_preprocessor_pipeline():
    df = pd.DataFrame({
        "num1": [10.0, 20.0, np.nan, 40.0, 10.0],
        "cat1": ["A", "B", "B", "A", "A"],
        "label": ["Cat", "Dog", "Dog", "Cat", "Cat"]
    })
    cfg = PreprocessingConfig(
        target_column="label",
        imputation_numeric="median",
        imputation_categorical="most_frequent",
        scaler="standard",
        handle_duplicates="remove"
    )
    preprocessor = TabularPreprocessor(cfg)
    X, y, clean_df, feature_names = preprocessor.fit_transform(df)

    assert preprocessor.duplicate_count == 1
    assert len(clean_df) == 4
    assert len(X) == 4
    assert len(y) == 4
    assert np.isnan(X).sum() == 0  # Imputation succeeded
    assert len(preprocessor.class_names) == 2

def test_data_splitter_stratification():
    X = np.random.randn(100, 4)
    y = np.array([0] * 50 + [1] * 50)
    splitter = DataSplitter(train_ratio=0.70, val_ratio=0.15, test_ratio=0.15, random_seed=42)
    res = splitter.split(X, y)

    assert res["train_count"] == 70
    assert res["val_count"] == 15
    assert res["test_count"] == 15
    # Class balance check in test set (should be ~50/50)
    assert np.sum(res["y_test"] == 0) in [7, 8]
