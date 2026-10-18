# ClearBridge backend

A small FastAPI server. Right now it does one thing: translates page text for the frontend's Language setting, using OpenAI.

## Run it

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then paste your OPENAI_API_KEY into .env
uvicorn main:app --reload --port 8000
```

Check http://localhost:8000/health. `openai_key_set` should be `true`.

If your frontend runs on a different address, add it to `CORS_ORIGINS` in `.env`.

## Endpoints

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/health` | | `{status, openai_key_set, model}` |
| POST | `/translate` | `{"language": "es", "texts": ["Dashboard", ...]}` | `{"translations": ["Panel", ...]}` |

Languages: `es`, `vi`, `ko`, `zh`, `fr`, `pt`.

## Adding a feature

Add a new route in `main.py`:

```python
@app.get("/my-feature")
def my_feature():
    return {"hello": "world"}
```

Call it from the frontend with `fetch("http://localhost:8000/my-feature")`.

## Tests

```bash
python -m pytest -q
```
