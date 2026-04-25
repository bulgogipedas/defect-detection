import mlflow
from ultralytics import YOLO


def _get_device_str() -> str:
    import torch

    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "0"
    return "cpu"


def train_yolov8(
    data_yaml: str,
    epochs: int = 50,
    imgsz: int = 640,
    batch: int = 8,
) -> YOLO:
    device = _get_device_str()
    mlflow.set_experiment("defect-yolov8")

    with mlflow.start_run():
        model = YOLO("yolov8n.pt")
        results = model.train(
            data=data_yaml,
            epochs=epochs,
            imgsz=imgsz,
            device=device,
            batch=batch,
            workers=2,
            project="mlflow/yolov8",
            name="defect_nano",
        )

        rd = getattr(results, "results_dict", {}) or {}
        m_ap50 = rd.get("metrics/mAP50(B)", rd.get("mAP50", 0.0))
        m_ap50_95 = rd.get("metrics/mAP50-95(B)", rd.get("mAP50-95", 0.0))

        mlflow.log_params(
            {
                "model": "yolov8n",
                "epochs": epochs,
                "imgsz": imgsz,
                "device": device,
            }
        )
        mlflow.log_metrics(
            {
                "mAP50": float(m_ap50),
                "mAP50-95": float(m_ap50_95),
            }
        )

    return model
