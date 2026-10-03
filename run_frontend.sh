#!/usr/bin/env bash
# Installs deps (first run) and starts the React UI on http://localhost:5173
cd "$(dirname "$0")/frontend" && npm install && npm run dev
