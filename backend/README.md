# Tennis Vision AI Backend Scaffold

This directory contains the FastAPI-based service that coordinates data collection,
training orchestration, and live monitoring workflows described in the technical
specification.

## Getting started locally (without Docker)

1. Create a Python 3.10+ virtual environment.
2. Install dependencies:
   ```bash
   pip install -e .
   ```
3. Create a `.env` file (see `.env.example`) with PostgreSQL credentials and any
   feature store overrides.
4. Launch the API:
   ```bash
   uvicorn app.main:app --reload
   ```

The stubbed services return mock data so the API contract can be exercised even
before the heavy CV/ML pipeline is implemented.
