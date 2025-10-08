#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://129.212.191.6:1337/}"

echo "Consultando headers de: $URL" >&2
curl -sS -I "$URL"
