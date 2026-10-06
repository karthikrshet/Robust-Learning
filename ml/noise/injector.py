from typing import Dict, Any, List, Optional, Tuple, Literal
import numpy as np

NoiseStrategy = Literal["symmetric", "asymmetric"]

class NoiseInjectionResult:
    def __init__(
        self,
        y_clean: np.ndarray,
        y_noisy: np.ndarray,
        corrupted_indices: np.ndarray,
        original_labels: np.ndarray,
        corrupted_labels: np.ndarray,
        target_noise_ratio: float,
        actual_noise_ratio: float,
        strategy: str,
        seed: int,
        sample_ids: Optional[np.ndarray] = None
    ):
        self.y_clean = y_clean
        self.y_noisy = y_noisy
        self.corrupted_indices = corrupted_indices
        self.original_labels = original_labels
        self.corrupted_labels = corrupted_labels
        self.target_noise_ratio = target_noise_ratio
        self.actual_noise_ratio = actual_noise_ratio
        self.strategy = strategy
        self.seed = seed
        self.sample_ids = sample_ids

    def to_dict(self) -> Dict[str, Any]:
        records = []
        for i, idx in enumerate(self.corrupted_indices):
            sample_id = int(self.sample_ids[idx]) if self.sample_ids is not None else int(idx)
            records.append({
                "index": int(idx),
                "sample_id": sample_id,
                "original_label": int(self.original_labels[i]),
                "corrupted_label": int(self.corrupted_labels[i])
            })

        return {
            "target_noise_ratio": float(self.target_noise_ratio),
            "actual_noise_ratio": float(self.actual_noise_ratio),
            "corrupted_count": int(len(self.corrupted_indices)),
            "total_samples": int(len(self.y_clean)),
            "strategy": self.strategy,
            "seed": self.seed,
            "corrupted_samples_sample": records[:100]  # First 100 corrupted records for inspection
        }

class LabelNoiseInjector:
    """
    Controlled label corruption engine for training sets.
    Applies synthetic label noise deterministically while tracking
    exact corrupted samples, ensuring validation and test sets remain clean.
    """
    def __init__(
        self,
        noise_ratio: float = 0.20,
        strategy: NoiseStrategy = "symmetric",
        random_seed: int = 42
    ):
        if not (0.0 <= noise_ratio <= 1.0):
            raise ValueError(f"Noise ratio must be between 0.0 and 1.0, got {noise_ratio}")
        self.noise_ratio = noise_ratio
        self.strategy = strategy
        self.random_seed = random_seed

    def inject_noise(
        self,
        y_train: np.ndarray,
        num_classes: int,
        sample_ids: Optional[np.ndarray] = None
    ) -> NoiseInjectionResult:
        """
        Injects controlled label noise into y_train.
        Returns a NoiseInjectionResult preserving complete provenance.
        """
        n_samples = len(y_train)
        if self.noise_ratio == 0.0 or n_samples == 0:
            return NoiseInjectionResult(
                y_clean=y_train.copy(),
                y_noisy=y_train.copy(),
                corrupted_indices=np.empty(0, dtype=int),
                original_labels=np.empty(0, dtype=int),
                corrupted_labels=np.empty(0, dtype=int),
                target_noise_ratio=0.0,
                actual_noise_ratio=0.0,
                strategy=self.strategy,
                seed=self.random_seed,
                sample_ids=sample_ids
            )

        rng = np.random.RandomState(self.random_seed)
        n_corrupted = int(np.round(n_samples * self.noise_ratio))
        n_corrupted = max(0, min(n_samples, n_corrupted))

        corrupted_indices = rng.choice(n_samples, size=n_corrupted, replace=False)
        corrupted_indices.sort()

        y_noisy = y_train.copy()
        orig_labels = y_train[corrupted_indices].copy()
        new_labels = np.empty(n_corrupted, dtype=int)

        all_classes = np.arange(num_classes)

        for i, idx in enumerate(corrupted_indices):
            current_label = y_train[idx]

            if self.strategy == "symmetric":
                # Uniformly pick any other valid class
                other_classes = all_classes[all_classes != current_label]
                if len(other_classes) > 0:
                    chosen_class = rng.choice(other_classes)
                else:
                    chosen_class = current_label
            elif self.strategy == "asymmetric":
                # Pair-flip: class k -> (k + 1) mod K
                chosen_class = (current_label + 1) % num_classes
            else:
                raise ValueError(f"Unknown noise strategy '{self.strategy}'")

            y_noisy[idx] = chosen_class
            new_labels[i] = chosen_class

        actual_noise_ratio = round(len(corrupted_indices) / n_samples, 4) if n_samples > 0 else 0.0

        return NoiseInjectionResult(
            y_clean=y_train.copy(),
            y_noisy=y_noisy,
            corrupted_indices=corrupted_indices,
            original_labels=orig_labels,
            corrupted_labels=new_labels,
            target_noise_ratio=self.noise_ratio,
            actual_noise_ratio=actual_noise_ratio,
            strategy=self.strategy,
            seed=self.random_seed,
            sample_ids=sample_ids
        )
