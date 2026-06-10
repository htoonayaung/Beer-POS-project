$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $projectRoot "frontend")
npm run dev

