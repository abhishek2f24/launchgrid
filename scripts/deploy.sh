#!/usr/bin/env bash
# LaunchGrid — Full deploy script
# Run from: cd ~/Desktop/ghd/personal/launchgrid && bash scripts/deploy.sh

set -e
echo "=== LaunchGrid Deploy ==="

# 1. Install Vercel CLI if needed
if ! command -v vercel &>/dev/null; then
  echo "[1/5] Installing Vercel CLI..."
  npm install -g vercel
else
  echo "[1/5] Vercel CLI already installed"
fi

# 2. Check Vercel login
echo "[2/5] Checking Vercel login..."
vercel whoami || vercel login

# 3. Link project (first time only)
if [ ! -f .vercel/project.json ]; then
  echo "[3/5] Linking Vercel project..."
  vercel link
else
  echo "[3/5] Already linked to Vercel project"
fi

# 4. Set required env vars (will prompt if already set)
echo "[4/5] Setting environment variables..."
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Generated ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo "(Save this somewhere safe — it encrypts all Razorpay secrets in the DB)"

vercel env add ENCRYPTION_KEY production <<< "$ENCRYPTION_KEY" 2>/dev/null || echo "  ENCRYPTION_KEY already set — skip"

CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")
echo "Generated CRON_SECRET: $CRON_SECRET"
vercel env add CRON_SECRET production <<< "$CRON_SECRET" 2>/dev/null || echo "  CRON_SECRET already set — skip"

# 5. Deploy to production
echo "[5/5] Deploying to production..."
vercel --prod

echo ""
echo "=== Deploy complete ==="
echo "Next steps:"
echo "  1. Run Supabase migrations (scripts/migrate.sh)"
echo "  2. Set RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel dashboard if not already set"
echo "  3. Set up uptime monitoring at betteruptime.com"
