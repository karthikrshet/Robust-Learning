from typing import Dict, Any, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import (
    StandardScaler,
    RobustScaler,
    MinMaxScaler,
    OneHotEncoder,
    LabelEncoder
)

class PreprocessingConfig:
    def __init__(
        self,
        target_column: str,
        imputation_numeric: str = "median",      # 'mean', 'median', 'constant'
        imputation_categorical: str = "most_frequent", # 'most_frequent', 'constant'
        scaler: str = "standard",                # 'standard', 'robust', 'minmax', 'none'
        handle_duplicates: str = "keep",         # 'remove', 'keep'
        constant_numeric_value: float = 0.0,
        constant_categorical_value: str = "missing"
    ):
        self.target_column = target_column
        self.imputation_numeric = imputation_numeric
        self.imputation_categorical = imputation_categorical
        self.scaler = scaler
        self.handle_duplicates = handle_duplicates
        self.constant_numeric_value = constant_numeric_value
        self.constant_categorical_value = constant_categorical_value

    def to_dict(self) -> Dict[str, Any]:
        return {
            "target_column": self.target_column,
            "imputation_numeric": self.imputation_numeric,
            "imputation_categorical": self.imputation_categorical,
            "scaler": self.scaler,
            "handle_duplicates": self.handle_duplicates,
            "constant_numeric_value": self.constant_numeric_value,
            "constant_categorical_value": self.constant_categorical_value
        }

class TabularPreprocessor:
    """
    Production-grade tabular preprocessor with explicit column transformations,
    label encoding, feature tracking, and row-index tracking for reproducible research.
    """
    def __init__(self, config: PreprocessingConfig):
        self.config = config
        self.column_transformer: Optional[ColumnTransformer] = None
        self.label_encoder = LabelEncoder()
        self.numeric_cols: List[str] = []
        self.categorical_cols: List[str] = []
        self.feature_names_out: List[str] = []
        self.class_names: List[str] = []
        self.class_to_idx: Dict[str, int] = {}
        self.idx_to_class: Dict[int, str] = {}
        self.duplicate_count: int = 0

    def fit_transform(
        self, df: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame, List[str]]:
        """
        Fits the preprocessor and transforms the data.
        Returns:
            X: np.ndarray preprocessed feature matrix
            y: np.ndarray integer class labels
            clean_df: pd.DataFrame data with duplicates handled and indices preserved
            feature_names: List[str] names of preprocessed features
        """
        data = df.copy()

        # Handle duplicates if requested
        init_len = len(data)
        if self.config.handle_duplicates == "remove":
            data = data.drop_duplicates().reset_index(drop=True)
            self.duplicate_count = init_len - len(data)
        else:
            self.duplicate_count = 0

        # Validate target
        if self.config.target_column not in data.columns:
            raise ValueError(f"Target column '{self.config.target_column}' not found.")

        # Drop rows where target is missing
        data = data.dropna(subset=[self.config.target_column]).reset_index(drop=True)

        target_series = data[self.config.target_column].astype(str)
        y = self.label_encoder.fit_transform(target_series)
        self.class_names = [str(c) for c in self.label_encoder.classes_]
        self.class_to_idx = {c: int(i) for i, c in enumerate(self.class_names)}
        self.idx_to_class = {int(i): c for i, c in enumerate(self.class_names)}

        feature_df = data.drop(columns=[self.config.target_column])

        # Segregate numeric vs categorical
        self.numeric_cols = []
        self.categorical_cols = []
        for col in feature_df.columns:
            if pd.api.types.is_numeric_dtype(feature_df[col]) and feature_df[col].nunique() > 2:
                self.numeric_cols.append(col)
            else:
                self.categorical_cols.append(col)

        transformers = []

        # Numerical pipeline
        if self.numeric_cols:
            num_steps = []
            if self.config.imputation_numeric == "constant":
                num_steps.append(("imputer", SimpleImputer(strategy="constant", fill_value=self.config.constant_numeric_value)))
            else:
                num_steps.append(("imputer", SimpleImputer(strategy=self.config.imputation_numeric)))

            if self.config.scaler == "standard":
                num_steps.append(("scaler", StandardScaler()))
            elif self.config.scaler == "robust":
                num_steps.append(("scaler", RobustScaler()))
            elif self.config.scaler == "minmax":
                num_steps.append(("scaler", MinMaxScaler()))

            transformers.append(("num", Pipeline(num_steps), self.numeric_cols))

        # Categorical pipeline
        if self.categorical_cols:
            cat_steps = []
            if self.config.imputation_categorical == "constant":
                cat_steps.append(("imputer", SimpleImputer(strategy="constant", fill_value=self.config.constant_categorical_value)))
            else:
                cat_steps.append(("imputer", SimpleImputer(strategy="most_frequent")))

            cat_steps.append(("encoder", OneHotEncoder(sparse_output=False, handle_unknown="ignore")))
            transformers.append(("cat", Pipeline(cat_steps), self.categorical_cols))

        self.column_transformer = ColumnTransformer(transformers=transformers, remainder="drop")
        X = self.column_transformer.fit_transform(feature_df)

        # Generate feature names
        self.feature_names_out = self._get_feature_names()

        return X, y, data, self.feature_names_out

    def transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """Transforms unseen data using the fitted pipeline."""
        if self.column_transformer is None:
            raise RuntimeError("Preprocessor has not been fitted yet.")

        data = df.copy()
        y = None
        if self.config.target_column in data.columns:
            valid_mask = data[self.config.target_column].notna()
            data = data[valid_mask].reset_index(drop=True)
            y = self.label_encoder.transform(data[self.config.target_column].astype(str))

        feature_df = data.drop(columns=[self.config.target_column], errors="ignore")
        X = self.column_transformer.transform(feature_df)
        return X, y

    def _get_feature_names(self) -> List[str]:
        names = []
        if self.column_transformer is None:
            return names

        for name, pipe, cols in self.column_transformer.transformers_:
            if name == "num":
                names.extend(cols)
            elif name == "cat":
                try:
                    encoder = pipe.named_steps["encoder"]
                    encoded_names = encoder.get_feature_names_out(cols)
                    names.extend(list(encoded_names))
                except Exception:
                    names.extend(cols)
        return names
