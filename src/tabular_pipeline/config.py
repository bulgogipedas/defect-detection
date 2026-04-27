from dataclasses import dataclass


@dataclass
class PipelineConfig:
    target_col: str = "target"
    test_size: float = 0.2
    random_state: int = 42
    outlier_iqr_factor: float = 1.5
