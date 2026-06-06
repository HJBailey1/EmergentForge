#!/usr/bin/env bash
PORT=${1:-8000}
echo "Starting local server on http://localhost:$PORT"
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  python -m http.server "$PORT"
elif command -v npx >/dev/null 2>&1; then
  npx serve -s . -l "$PORT"
else
  echo "No python or npx found. Install one to use this script."
fi
