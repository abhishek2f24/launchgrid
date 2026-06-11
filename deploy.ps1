# LaunchGrid — Vercel Deploy Script
# Run from the launchgrid folder: .\deploy.ps1
# Requires: Node.js installed. Installs Vercel CLI automatically.

Set-StrictMode -Off
$ErrorActionPreference = "Continue"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LaunchGrid — Production Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Ensure Vercel CLI ─────────────────────────────────────────────────────
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}
$v = vercel --version 2>&1
Write-Host "Vercel CLI: $v" -ForegroundColor Green

# ── 2. Login check ───────────────────────────────────────────────────────────
$whoami = vercel whoami 2>&1
if ($whoami -match "Error") {
    Write-Host ""
    Write-Host "Not logged in. Opening Vercel login..." -ForegroundColor Yellow
    vercel login
} else {
    Write-Host "Logged in as: $whoami" -ForegroundColor Green
}

# ── 3. Link project (if not already linked) ──────────────────────────────────
if (-not (Test-Path ".vercel\project.json")) {
    Write-Host ""
    Write-Host "Linking project to Vercel..." -ForegroundColor Yellow
    vercel link --yes
} else {
    Write-Host "Project already linked." -ForegroundColor Green
}

# ── 4. Set environment variables ─────────────────────────────────────────────
Write-Host ""
Write-Host "Setting environment variables..." -ForegroundColor Yellow

# Helper: set env var on production only if not already set
function Set-VercelEnv($name, $value) {
    $existing = vercel env ls production 2>&1 | Select-String $name
    if ($existing) {
        Write-Host "  [skip] $name already set" -ForegroundColor Gray
    } else {
        $value | vercel env add $name production
        Write-Host "  [ok]   $name" -ForegroundColor Green
    }
}

# Critical new vars
Set-VercelEnv "ENCRYPTION_KEY"   "a9116c10aafefba3becc1a27e796a01251ae64b4b19785ae16e12ef64aad3915"
Set-VercelEnv "CRON_SECRET"      "10a1b8e5b5c8a827572cd8562a0a9b5ad734da9266abc23e"

# Core Supabase
Set-VercelEnv "NEXT_PUBLIC_SUPABASE_URL"         "https://pxbyhxjjepjuchalaola.supabase.co"
Set-VercelEnv "NEXT_PUBLIC_SUPABASE_ANON_KEY"    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4YnloeGpqZXBqdWNoYWxhb2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NDUyMDQsImV4cCI6MjA5NjMyMTIwNH0.emx4O5RyHGCWc4B-_jyFNgR2LOCHmo2lUNd9fu3SVbo"
Set-VercelEnv "SUPABASE_SERVICE_ROLE_KEY"        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4YnloeGpqZXBqdWNoYWxhb2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc0NTIwNCwiZXhwIjoyMDk2MzIxMjA0fQ.OvztMJ4MeOU0qxOhWee5xe18YSzZdNKl8Inv7Gt8WjA"
Set-VercelEnv "SUPABASE_JWT_SECRET"              "+0gsKx9HrFc1tOmCwQ+bUf0XP0uhmvp9aPQ+vpWzV7IIEr5DrDqrWaWAxM3b7Z0tvcn+4MWnNHq2jbN4+JhefQ=="

# Postgres (direct)
Set-VercelEnv "POSTGRES_URL"                     "postgres://postgres.pxbyhxjjepjuchalaola:oOsPvLg5FJKzC5Sb@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
Set-VercelEnv "POSTGRES_URL_NON_POOLING"         "postgres://postgres.pxbyhxjjepjuchalaola:oOsPvLg5FJKzC5Sb@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
Set-VercelEnv "POSTGRES_PRISMA_URL"              "postgres://postgres.pxbyhxjjepjuchalaola:oOsPvLg5FJKzC5Sb@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
Set-VercelEnv "POSTGRES_USER"                    "postgres"
Set-VercelEnv "POSTGRES_PASSWORD"                "oOsPvLg5FJKzC5Sb"
Set-VercelEnv "POSTGRES_HOST"                    "db.pxbyhxjjepjuchalaola.supabase.co"
Set-VercelEnv "POSTGRES_DATABASE"                "postgres"

# Razorpay
Set-VercelEnv "RAZORPAY_KEY_ID"                  "rzp_live_SySjXALrPy5qFv"
Set-VercelEnv "RAZORPAY_KEY_SECRET"              "TQP2xED0nYIOltT2h0f66hfO"
Set-VercelEnv "NEXT_PUBLIC_RAZORPAY_KEY_ID"      "rzp_live_SySjXALrPy5qFv"
Set-VercelEnv "RAZORPAY_WEBHOOK_SECRET"          "whsec_local_testing_secret"

# Email
Set-VercelEnv "RESEND_API_KEY"                   "re_XwVzLNxh_6AQ925F5CpZC1y4B2n7SfLse"
Set-VercelEnv "FROM_EMAIL"                       "help@launchgrid.in"
Set-VercelEnv "ADMIN_EMAIL"                      "abhishek2f24@gmail.com"
Set-VercelEnv "SUPPORT_EMAIL"                    "support@launchgrid.in"

# App
Set-VercelEnv "NEXT_PUBLIC_APP_URL"              "https://launchgrid.in"
Set-VercelEnv "NEXT_PUBLIC_WHATSAPP_NUMBER"      "919506212886"

Write-Host ""
Write-Host "All env vars set." -ForegroundColor Green

# ── 5. Deploy to production ───────────────────────────────────────────────────
Write-Host ""
Write-Host "Deploying to production..." -ForegroundColor Yellow
vercel deploy --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Deploy successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. Run DB migrations in Supabase SQL editor:" -ForegroundColor White
    Write-Host "     https://supabase.com/dashboard/project/pxbyhxjjepjuchalaola/sql/new" -ForegroundColor Gray
    Write-Host "     - supabase/migrations/0016_cod_enabled.sql" -ForegroundColor Gray
    Write-Host "     - supabase/migrations/0017_trial_email_columns.sql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Set RAZORPAY_WEBHOOK_SECRET to your real Razorpay webhook secret" -ForegroundColor White
    Write-Host "     (replace 'whsec_local_testing_secret' in Vercel env vars)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Add uptime monitor at: https://betteruptime.com" -ForegroundColor White
    Write-Host "     Monitor URL: https://launchgrid.in" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Deploy failed - check errors above." -ForegroundColor Red
}
