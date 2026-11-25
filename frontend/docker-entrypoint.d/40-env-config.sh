#!/bin/sh
set -eu

RAW_VER="${VITE_APP_VERSION:-${APP_VERSION:-}}"
# Strip carriage returns, surrounding whitespace, and optional wrapping single/double quotes
VER=$(printf '%s' "$RAW_VER" | tr -d '\r' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//; s/^"//; s/"$//; s/^'\''//; s/'\''$//; s/^[[:space:]]*//; s/[[:space:]]*$//')
VER_ESCAPED=$(printf '%s' "$VER" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat <<EOF > /usr/share/nginx/html/env-config.js
window.__APP_ENV__ = {
  VITE_APP_VERSION: "${VER_ESCAPED}",
  APP_VERSION: "${VER_ESCAPED}"
};
EOF

echo "[40-env-config] Wrote /usr/share/nginx/html/env-config.js (VITE_APP_VERSION=${VER:-<empty>})"
