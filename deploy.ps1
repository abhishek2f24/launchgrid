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

# ── Secrets ──────────────────────────────────────────────────────────────────
# Values live in .env.deploy.local (git-ignored), NEVER in this file. The
# credentials that used to be hardcoded here were committed to a public
# repository and must be treated as compromised; rotate them before deploying.
$secretsFile = Join-Path $dir ".env.deploy.local"
if (-not (Test-Path $secretsFile)) {
    Write-Host "Missing .env.deploy.local - copy .env.deploy.local.example and fill it in." -ForegroundColor Red
    exit 1
}
$Secrets = @{}
Get-Content $secretsFile | ForEach-Object {
    if ($_ -match '^\s*([A-Z_0-9]+)\s*=\s*(.*)$') { $Secrets[$Matches[1]] = $Matches[2].Trim() }
}
function Get-Secret($name) {
    if (-not $Secrets.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($Secrets[$name])) {
        Write-Host "  [fail] $name is not set in .env.deploy.local" -ForegroundColor Red
        exit 1
    }
    return $Secrets[$name]
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
Set-VercelEnv "ENCRYPTION_KEY"                    (Get-Secret "ENCRYPTION_KEY")
Set-VercelEnv "CRON_SECRET"                       (Get-Secret "CRON_SECRET")

# Core Supabase
Set-VercelEnv "NEXT_PUBLIC_SUPABASE_URL"          (Get-Secret "NEXT_PUBLIC_SUPABASE_URL")
Set-VercelEnv "NEXT_PUBLIC_SUPABASE_ANON_KEY"     (Get-Secret "NEXT_PUBLIC_SUPABASE_ANON_KEY")
Set-VercelEnv "SUPABASE_SERVICE_ROLE_KEY"         (Get-Secret "SUPABASE_SERVICE_ROLE_KEY")
Set-VercelEnv "SUPABASE_JWT_SECRET"               (Get-Secret "SUPABASE_JWT_SECRET")

# Postgres (direct)
Set-VercelEnv "POSTGRES_URL"                      (Get-Secret "POSTGRES_URL")
Set-VercelEnv "POSTGRES_URL_NON_POOLING"          (Get-Secret "POSTGRES_URL_NON_POOLING")
Set-VercelEnv "POSTGRES_PRISMA_URL"               (Get-Secret "POSTGRES_PRISMA_URL")
Set-VercelEnv "POSTGRES_USER"                     (Get-Secret "POSTGRES_USER")
Set-VercelEnv "POSTGRES_PASSWORD"                 (Get-Secret "POSTGRES_PASSWORD")
Set-VercelEnv "POSTGRES_HOST"                     (Get-Secret "POSTGRES_HOST")
Set-VercelEnv "POSTGRES_DATABASE"                 (Get-Secret "POSTGRES_DATABASE")

# Razorpay
Set-VercelEnv "RAZORPAY_KEY_ID"                   (Get-Secret "RAZORPAY_KEY_ID")
Set-VercelEnv "RAZORPAY_KEY_SECRET"               (Get-Secret "RAZORPAY_KEY_SECRET")
Set-VercelEnv "NEXT_PUBLIC_RAZORPAY_KEY_ID"       (Get-Secret "NEXT_PUBLIC_RAZORPAY_KEY_ID")
Set-VercelEnv "RAZORPAY_WEBHOOK_SECRET"           (Get-Secret "RAZORPAY_WEBHOOK_SECRET")

# Email
Set-VercelEnv "RESEND_API_KEY"                    (Get-Secret "RESEND_API_KEY")
Set-VercelEnv "FROM_EMAIL"                        (Get-Secret "FROM_EMAIL")
Set-VercelEnv "ADMIN_EMAIL"                       (Get-Secret "ADMIN_EMAIL")
Set-VercelEnv "SUPPORT_EMAIL"                     (Get-Secret "SUPPORT_EMAIL")

# App
Set-VercelEnv "NEXT_PUBLIC_APP_URL"               (Get-Secret "NEXT_PUBLIC_APP_URL")
Set-VercelEnv "NEXT_PUBLIC_WHATSAPP_NUMBER"       (Get-Secret "NEXT_PUBLIC_WHATSAPP_NUMBER")

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
