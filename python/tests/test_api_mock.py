import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.core.inference import Phi4MiniEngine

# Mock the engine for testing without the heavy model
class MockPhi4MiniEngine:
    def generate(self, prompt: str, max_tokens: int = 512) -> str:
        # Return a valid JSON string compliant with the schema
        return '''
        {
          "sentiment_score": 0.85,
          "themes": ["clarity", "engagement"],
          "strengths": ["Clear explanations", "Interactive polls"],
          "improvements": ["More time for questions"],
          "summary": "Students appreciated the clear explanations and interactive polls. However, some requested more time for questions at the end.",
          "confidence": "high"
        }
        '''
        
@pytest.fixture
def client():
    # Inject mock engine
    app.state.engine = MockPhi4MiniEngine()
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["model_loaded"] == True

def test_analyze_endpoint_valid(client):
    payload = {
        "session_id": "test_123",
        "feedback": ["Great class!", "Loved the examples.", "A bit fast."],
        "poll_stats": {"understanding": [4, 5, 5]}
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "test_123"
    assert data["sentiment_score"] == 0.85
    assert "clarity" in data["themes"]
    assert data["processing_time_ms"] >= 0

def test_analyze_endpoint_invalid_payload(client):
    # Missing session_id
    payload = {
        "feedback": ["Great class!"]
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422

def test_analyze_endpoint_empty_feedback(client):
    # Empty feedback list
    payload = {
        "session_id": "test_123",
        "feedback": [] 
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422
