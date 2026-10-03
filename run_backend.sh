#!/usr/bin/env bash
# Starts the FastAPI backend on http://127.0.0.1:8000  (run from the project root)
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
