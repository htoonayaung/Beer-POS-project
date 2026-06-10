#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required. Install Node.js 20 or newer first."
  exit 1
fi

NODE_VERSION="$(node -p "process.versions.node")"
IFS=. read -r NODE_MAJOR NODE_MINOR _ <<< "$NODE_VERSION"
if ! { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 19 ]; } &&
   ! { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -ge 12 ]; } &&
   [ "$NODE_MAJOR" -lt 23 ]; then
  echo "Node.js 20.19+ or 22.12+ is required. Current version: $(node --version)"
  exit 1
fi

echo "Installing frontend dependencies..."
cd "$PROJECT_ROOT/frontend"
npm ci
npm run build

echo "Installing backend dependencies..."
cd "$PROJECT_ROOT/backend/beer-pos-api"
npm ci

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created backend .env from .env.example."
fi

npm run db:generate
npm run db:push

echo
echo "Linux installation completed."
echo "Review backend/beer-pos-api/.env before production use."
