from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "model_status" in body
    assert "configured_mode" in body["model_status"]
