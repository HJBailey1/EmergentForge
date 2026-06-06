#!/usr/bin/env bash
OUT=${1:-emergent-choirforge.zip}
echo "Packaging demo into $OUT"
if command -v zip >/dev/null 2>&1; then
  zip -r "$OUT" . -x '*.git*' -x "$OUT"
  echo "Created $OUT"
else
  echo "zip is not installed. Install zip or use PowerShell on Windows: ./package.ps1"
fi
