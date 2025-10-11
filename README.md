# Tennis Vision AI

An autonomous computer-vision and machine-learning platform that analyses tennis
broadcasts to detect fatigue signatures and provide real-time performance alerts.

## Repository layout

- `docs/` – technical specification and future documentation.
- `backend/` – FastAPI scaffold for orchestration and monitoring services.
- `configs/` – YAML configuration presets for CV and learning pipelines.
- `frontend/` – placeholder for the dashboard implementation.
- `scripts/` – operational runbooks and setup instructions.

## Quickstart

1. Create a Python 3.10+ virtual environment.
2. Install dependencies with extras for development:
   ```bash
   pip install -e .[dev]
   ```
3. Copy environment defaults:
   ```bash
   cp backend/.env.example .env
   ```
4. Run the API locally:
   ```bash
   uvicorn app.main:app --reload
   ```

Use the technical specification in `docs/Tennis_Vision_AI_Specification.md` to
continue building out the computer-vision pipeline, autonomous agents, and UI.

## Using the referenced open-source projects

The specification already lists every third-party repository that underpins the
planned implementation. Clone shallow copies into `third_party/` with:

```bash
./scripts/bootstrap_third_party_repos.sh
```

The script mirrors the exact URLs from the spec so you have local snapshots for
experimentation. Review `scripts/THIRD_PARTY_RESOURCES.md` for a quick summary
of what each project contributes before importing code or assets.
