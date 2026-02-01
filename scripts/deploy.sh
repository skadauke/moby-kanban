#!/bin/bash
# Deploy moby-kanban to Vercel with env sync
# Usage: ./scripts/deploy.sh [--prod]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SECRETS_FILE="$HOME/.config/moby/secrets.json"

cd "$PROJECT_DIR"

# Get Vercel token
VERCEL_TOKEN=$(jq -r '.credentials.vercel_token.value' "$SECRETS_FILE")
if [ -z "$VERCEL_TOKEN" ] || [ "$VERCEL_TOKEN" = "null" ]; then
  echo "❌ No Vercel token found in secrets.json"
  exit 1
fi

echo "🔄 Generating .env from secrets.json..."
node "$PROJECT_DIR/../tools/generate-env.mjs" moby-kanban

echo "📤 Syncing environment variables to Vercel..."

# Define which vars to sync (skip local-only ones)
# Format: LOCAL_NAME:VERCEL_NAME:ENVIRONMENT
# If VERCEL_NAME is same, just use LOCAL_NAME
SYNC_VARS=(
  "TURSO_DATABASE_URL:production"
  "TURSO_AUTH_TOKEN:production"
  "NEXT_PUBLIC_SUPABASE_URL:production"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY:production"
  "SUPABASE_SERVICE_ROLE_KEY:production"
  "GITHUB_CLIENT_ID:production"
  "GITHUB_CLIENT_SECRET:production"
  "ALLOWED_GITHUB_USERS:production"
  "AUTH_SECRET:production"
)

# Read .env and sync
while IFS= read -r line; do
  # Skip comments and empty lines
  [[ "$line" =~ ^#.*$ ]] && continue
  [[ -z "$line" ]] && continue
  
  # Parse KEY=VALUE
  KEY="${line%%=*}"
  VALUE="${line#*=}"
  # Remove surrounding quotes if present
  VALUE="${VALUE#\"}"
  VALUE="${VALUE%\"}"
  
  # Check if this var should be synced
  for sync in "${SYNC_VARS[@]}"; do
    VAR_NAME="${sync%%:*}"
    ENV="${sync##*:}"
    
    if [ "$KEY" = "$VAR_NAME" ]; then
      echo "  → $KEY"
      printf '%s' "$VALUE" | vercel env add "$KEY" "$ENV" --token "$VERCEL_TOKEN" --force 2>/dev/null || true
    fi
  done
done < .env

# Handle NEXTAUTH_URL specially (different value for production)
echo "  → NEXTAUTH_URL (production URL)"
printf '%s' "https://moby-kanban.vercel.app" | vercel env add NEXTAUTH_URL production --token "$VERCEL_TOKEN" --force 2>/dev/null || true

echo "🚀 Deploying to Vercel..."
if [ "$1" = "--prod" ]; then
  vercel --prod --token "$VERCEL_TOKEN"
else
  vercel --token "$VERCEL_TOKEN"
fi

echo "✅ Deploy complete!"
