import requests
import json
from datetime import datetime

# Test the live metrics endpoint
def test_live_metrics():
    response = requests.get("http://localhost:8000/api/live-metrics")
    print("Live Metrics Response:")
    print(json.dumps(response.json(), indent=2))
    
def test_recent_decisions():
    response = requests.get("http://localhost:8000/api/recent-decisions?limit=5")
    print("\nRecent Decisions Response:")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    test_live_metrics()
    test_recent_decisions() 