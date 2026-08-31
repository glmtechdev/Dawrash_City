<#
Generate git rm --cached commands for tracked files that match .gitignore.
Writes commands to `untrack-candidates.sh` for review before running.

Usage: Run from repo root in PowerShell:
  .\scripts\generate-untrack-commands.ps1
#>
$out = "untrack-candidates.sh"
"# Generated untrack commands - review before running" | Out-File $out -Encoding utf8
"# Run the commands in this file to remove files from the index but keep them locally" | Out-File $out -Append -Encoding utf8

Write-Output "Scanning tracked files for .gitignore matches..."
$tracked = git ls-files
foreach ($f in $tracked) {
  git check-ignore -q -- $f
  if ($LASTEXITCODE -eq 0) {
    "git rm --cached -- \"$f\"" | Out-File $out -Append -Encoding utf8
  }
}
$count = (Get-Content $out | Measure-Object -Line).Lines
Write-Output "Wrote $count lines to $out"
Write-Output "Review the file and run: bash $out"
