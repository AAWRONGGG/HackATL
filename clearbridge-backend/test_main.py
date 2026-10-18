from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


def test_translate_uses_cache(monkeypatch):
    calls = []

    def fake_openai(texts, language):
        calls.append(texts)
        return [f"[{language}] {t}" for t in texts]

    monkeypatch.setattr(main, "ask_openai", fake_openai)
    main._cache.clear()

    r = client.post("/translate", json={"language": "es", "texts": ["Dashboard", "Dashboard", " "]})
    assert r.json() == {"translations": ["[Spanish] Dashboard", "[Spanish] Dashboard", " "]}
    client.post("/translate", json={"language": "es", "texts": ["Dashboard"]})
    assert calls == [["Dashboard"]]  # second request answered from the cache


def test_rejects_bad_requests():
    assert client.post("/translate", json={"language": "xx", "texts": ["Hi"]}).status_code == 422
    assert client.post("/translate", json={"language": "es", "texts": ["a"] * 101}).status_code == 422


def test_cors_allows_frontend():
    r = client.options("/translate", headers={"Origin": "http://localhost:4000", "Access-Control-Request-Method": "POST"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:4000"
