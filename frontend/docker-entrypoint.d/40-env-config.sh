#!/bin/sh
set -eu

VER="${VITE_APP_VERSION:-}"
# Strip optional wrapping single/double quotes and surrounding whitespace
VER=$(printf '%s' "$VER" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//; s/^"//; s/"$//; s/^'\''//; s/'\''$//')
VER_ESCAPED=$(printf '%s' "$VER" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat <<EOF > /usr/share/nginx/html/env-config.js
window.__APP_ENV__ = {
  VITE_APP_VERSION: "${VER_ESCAPED}"
};
EOF
