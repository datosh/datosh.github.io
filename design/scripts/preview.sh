#!/usr/bin/env bash
# Serve the design folder so the component previews load fonts and images: ./design/scripts/preview.sh
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Open http://localhost:8099/components/  (each folder has a preview.html)"
python3 -m http.server 8099
