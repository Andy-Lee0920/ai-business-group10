param(
  [string]$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [string]$BashPath = 'C:\Program Files\Git\bin\bash.exe'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $BashPath)) {
  throw "Git Bash not found at $BashPath"
}

$script = Join-Path $Repo 'scripts\hw6\run-full-hermes-git-review.sh'
if (-not (Test-Path -LiteralPath $script)) {
  throw "Script not found: $script"
}

function ConvertTo-GitBashPath {
  param([string]$Path)

  $fullPath = (Resolve-Path -LiteralPath $Path).Path
  if ($fullPath -match '^([A-Za-z]):\\(.*)$') {
    $drive = $matches[1].ToLowerInvariant()
    $rest = $matches[2] -replace '\\', '/'
    return "/$drive/$rest"
  }

  return ($fullPath -replace '\\', '/')
}

$bashRepo = ConvertTo-GitBashPath -Path $Repo
$bashScript = ConvertTo-GitBashPath -Path $script
$env:FEVIO_REPO = $Repo
& $BashPath -lc "cd '$bashRepo' && '$bashScript'"

if ($LASTEXITCODE -ne 0) {
  throw "Daily Hermes git history review failed with exit code $LASTEXITCODE"
}
