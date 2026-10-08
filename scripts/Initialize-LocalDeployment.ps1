Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot '.env'
if (Test-Path -LiteralPath $envPath) {
    throw "An .env file already exists at $envPath. Keep it and edit it manually if you intend to replace its settings."
}

function New-HexSecret([int] $ByteCount) {
    $bytes = New-Object byte[] $ByteCount
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
    }
    finally {
        $generator.Dispose()
    }
    return [System.BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
}

$databasePassword = New-HexSecret 32
$jwtPrivateKey = New-HexSecret 48
$content = @"
POSTGRES_DB=betterlife
POSTGRES_USER=betterlife_app
POSTGRES_PASSWORD=$databasePassword
DATABASE_URL=postgresql://betterlife_app:$databasePassword@db:5432/betterlife?schema=public
JWT_PRIVATE_KEY=$jwtPrivateKey
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
NODE_ENV=production
PORT=4000
HTTPS_PORT=443
LOG_LEVEL=info
CORS_ORIGIN=
"@

Set-Content -LiteralPath $envPath -Value $content -Encoding ASCII
Write-Output "Created a private deployment .env file at $envPath. Its generated secrets were not displayed."
