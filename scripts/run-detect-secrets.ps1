<#
Run a basic `detect-secrets` scan. This script will:
 - Check for Python `detect-secrets` installed; if missing, suggest installing
 - Run baseline scan and output `detect-secrets-report.json`

Usage: Run from repo root in PowerShell:
  .\scripts\run-detect-secrets.ps1
#>
if (-not (Get-Command detect-secrets -ErrorAction SilentlyContinue)) {
  Write-Output "detect-secrets not found. Install with: pip install detect-secrets"
  exit 1
}

Write-Output "Running detect-secrets scan (this may take a moment)..."
$report = "detect-secrets-report.json"
detect-secrets scan --all-files --baseline $report
Write-Output "Wrote $report"
