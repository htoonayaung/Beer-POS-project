$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $projectRoot "backend\beer-pos-api")

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

npm run db:generate
npm run db:push
npm start

