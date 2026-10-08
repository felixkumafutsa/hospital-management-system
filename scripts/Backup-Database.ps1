param(
    [string] $BackupName = (Get-Date -Format 'yyyyMMdd-HHmmss')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($BackupName -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$') {
    throw 'BackupName may contain only letters, numbers, dots, underscores, and hyphens.'
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$backupPath = Join-Path $repoRoot "backups\betterlife-$BackupName.dump"
$existingBackup = Join-Path $repoRoot 'backups'
New-Item -ItemType Directory -Path $existingBackup -Force | Out-Null
if (Test-Path -LiteralPath $backupPath) {
    throw "A backup already exists at $backupPath. Choose another BackupName."
}

Push-Location $repoRoot
try {
    & docker compose run --rm backup pg_dump --format=custom --no-owner --file="/backups/betterlife-$BackupName.dump"
    if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed; the backup was not verified.' }

    if (!(Test-Path -LiteralPath $backupPath) -or (Get-Item -LiteralPath $backupPath).Length -eq 0) {
        throw "The database dump is missing or empty: $backupPath"
    }

    & docker compose run --rm backup pg_restore --list "/backups/betterlife-$BackupName.dump"
    if ($LASTEXITCODE -ne 0) { throw 'pg_restore could not read the dump archive.' }
}
finally {
    Pop-Location
}

Write-Output "Verified database backup: $backupPath"
