import numpy as np
from ml.noise.injector import LabelNoiseInjector

def test_noise_injector_exact_ratio_and_immutability():
    y = np.array([0] * 50 + [1] * 50)
    y_copy = y.copy()

    injector = LabelNoiseInjector(noise_ratio=0.20, strategy="symmetric", random_seed=42)
    res = injector.inject_noise(y, num_classes=2)

    # Original array should remain untouched
    np.testing.assert_array_equal(y, y_copy)

    # Exactly 20 samples corrupted
    assert len(res.corrupted_indices) == 20
    assert res.actual_noise_ratio == 0.20

    # Corrupted labels must differ from original
    for orig, curr in zip(res.original_labels, res.corrupted_labels):
        assert orig != curr

def test_noise_injector_deterministic_reproducibility():
    y = np.random.randint(0, 3, size=90)

    inj1 = LabelNoiseInjector(noise_ratio=0.30, strategy="asymmetric", random_seed=123)
    res1 = inj1.inject_noise(y, num_classes=3)

    inj2 = LabelNoiseInjector(noise_ratio=0.30, strategy="asymmetric", random_seed=123)
    res2 = inj2.inject_noise(y, num_classes=3)

    np.testing.assert_array_equal(res1.corrupted_indices, res2.corrupted_indices)
    np.testing.assert_array_equal(res1.y_noisy, res2.y_noisy)

def test_zero_noise_injection():
    y = np.array([0, 1, 0, 1])
    injector = LabelNoiseInjector(noise_ratio=0.0)
    res = injector.inject_noise(y, num_classes=2)

    assert len(res.corrupted_indices) == 0
    np.testing.assert_array_equal(res.y_clean, res.y_noisy)
