param(
  [string]$TaskName = 'Fevio Daily Hermes Git History Review',
  [string]$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [string]$At = '09:00'
)

$ErrorActionPreference = 'Stop'

$runner = Join-Path $Repo 'scripts\hw6\run-full-hermes-git-review.ps1'
if (-not (Test-Path -LiteralPath $runner)) {
  throw "Runner not found: $runner"
}

$action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`" -Repo `"$Repo`""

$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description 'Runs the Fevio Docker + Hermes daily git history review loop and opens a PR.' `
  -Force | Out-Null

Write-Host "Registered '$TaskName' to run daily at $At local time."
