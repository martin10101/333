# Cloud Workstation Bootstrap Checklist

1. Provision a VM with at least 8 vCPU, 32 GB RAM, and an NVIDIA GPU (L4/RTX 4090).
2. Install system dependencies:
   ```bash
   sudo apt update && sudo apt install -y python3.10 python3.10-venv ffmpeg libgl1
   ```
3. Clone the repository and create a virtual environment:
   ```bash
   git clone <your-fork-url> tennis-vision-ai
   cd tennis-vision-ai
   python3.10 -m venv .venv
   source .venv/bin/activate
   ```
4. Install backend requirements:
   ```bash
   pip install -e .[ml]
   ```
5. Copy configuration templates:
   ```bash
   cp backend/.env.example .env
   cp configs/pipelines/broadcast.yaml configs/pipelines/local.yaml
   ```
6. Start the API service:
   ```bash
   uvicorn app.main:app --reload
   ```

Follow the technical specification for setting up auxiliary services like
PostgreSQL, Redis, and feature storage buckets as you progress through Phase 1.
