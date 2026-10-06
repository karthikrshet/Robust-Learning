from typing import Dict, Any, Tuple, Optional
import numpy as np
from sklearn.model_selection import train_test_split

class DataSplitter:
    """
    Reproducible train/validation/test splitting with stratification for classification.
    Safely handles class frequencies and preserves sample index tracking.
    """
    def __init__(
        self,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        random_seed: int = 42,
        stratify: bool = True
    ):
        total = round(train_ratio + val_ratio + test_ratio, 4)
        if total != 1.0:
            raise ValueError(f"Split ratios must sum to 1.0, got {total}")
        if train_ratio <= 0.0 or test_ratio <= 0.0:
            raise ValueError("Train and Test ratios must be strictly positive.")

        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = test_ratio
        self.random_seed = random_seed
        self.stratify = stratify

    def split(
        self,
        X: np.ndarray,
        y: np.ndarray,
        sample_indices: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Splits features X and labels y into Train, Validation, and Test sets.
        Uses exact sample counts to avoid floating point rounding issues.
        """
        n_samples = len(y)
        if sample_indices is None:
            sample_indices = np.arange(n_samples)

        # Exact sample count allocation
        n_test = int(np.round(n_samples * self.test_ratio))
        n_val = int(np.round(n_samples * self.val_ratio)) if self.val_ratio > 0.0 else 0
        n_train = n_samples - n_test - n_val

        # Check if stratification is viable (each class must have >= 2 samples)
        unique_classes, counts = np.unique(y, return_counts=True)
        strat = y if (self.stratify and np.all(counts >= 2)) else None

        if n_val > 0:
            # First split off the test set
            X_temp, X_test, y_temp, y_test, idx_temp, idx_test = train_test_split(
                X, y, sample_indices,
                test_size=n_test,
                random_state=self.random_seed,
                stratify=strat
            )

            temp_strat = None
            if self.stratify:
                _, temp_counts = np.unique(y_temp, return_counts=True)
                if np.all(temp_counts >= 2):
                    temp_strat = y_temp

            X_train, X_val, y_train, y_val, idx_train, idx_val = train_test_split(
                X_temp, y_temp, idx_temp,
                test_size=n_val,
                random_state=self.random_seed,
                stratify=temp_strat
            )
        else:
            # Only train and test
            X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
                X, y, sample_indices,
                test_size=n_test,
                random_state=self.random_seed,
                stratify=strat
            )
            X_val, y_val, idx_val = np.empty((0, X.shape[1])), np.empty(0, dtype=int), np.empty(0, dtype=int)

        return {
            "X_train": X_train,
            "y_train": y_train,
            "idx_train": idx_train,
            "X_val": X_val,
            "y_val": y_val,
            "idx_val": idx_val,
            "X_test": X_test,
            "y_test": y_test,
            "idx_test": idx_test,
            "train_count": len(y_train),
            "val_count": len(y_val),
            "test_count": len(y_test),
            "stratified": strat is not None
        }
