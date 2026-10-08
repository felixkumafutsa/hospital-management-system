param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string] $ServerAddress
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$tlsRoot = Join-Path $repoRoot 'deploy\tls'
$nginxDirectory = Join-Path $tlsRoot 'nginx'
$clientDirectory = Join-Path $tlsRoot 'client'
$caDirectory = Join-Path $tlsRoot 'ca-private'
if (Test-Path -LiteralPath $tlsRoot) {
    throw "TLS directory already exists at $tlsRoot. Move it aside before creating a new local certificate authority."
}
if ($ServerAddress -notmatch '^[A-Za-z0-9.-]+$') {
    throw 'ServerAddress must be an IPv4 address or DNS name containing only letters, numbers, dots, and hyphens.'
}

$null = New-Item -ItemType Directory -Path $tlsRoot
New-Item -ItemType Directory -Path $nginxDirectory, $clientDirectory, $caDirectory | Out-Null
$mountPath = $tlsRoot.Replace('\', '/')
$isIpAddress = $null -ne ($ServerAddress -as [System.Net.IPAddress])
$subjectAltName = if ($isIpAddress) { "IP:$ServerAddress" } else { "DNS:$ServerAddress" }
$serverExtensions = Join-Path $tlsRoot 'server.ext'
@"
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=$subjectAltName
"@ | Set-Content -LiteralPath $serverExtensions -Encoding ASCII

try {
    & docker run --rm --mount "type=bind,source=$mountPath,target=/tls" alpine/openssl genrsa -out /tls/ca-private/ca.key.pem 4096
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the local certificate authority key.' }

    & docker run --rm --mount "type=bind,source=$mountPath,target=/tls" alpine/openssl req -x509 -new -sha256 -days 3650 -key /tls/ca-private/ca.key.pem -out /tls/client/betterlife-local-ca.crt -subj "/CN=BetterLife Local Clinic CA" -addext 'basicConstraints=critical,CA:TRUE' -addext 'keyUsage=critical,keyCertSign,cRLSign'
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the local certificate authority certificate.' }

    & docker run --rm --mount "type=bind,source=$mountPath,target=/tls" alpine/openssl req -new -newkey rsa:3072 -nodes -keyout /tls/nginx/privkey.pem -out /tls/server.csr -subj "/CN=$ServerAddress"
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the HTTPS server key and request.' }

    & docker run --rm --mount "type=bind,source=$mountPath,target=/tls" alpine/openssl x509 -req -sha256 -days 397 -in /tls/server.csr -CA /tls/client/betterlife-local-ca.crt -CAkey /tls/ca-private/ca.key.pem -CAcreateserial -extfile /tls/server.ext -out /tls/nginx/fullchain.pem
    if ($LASTEXITCODE -ne 0) { throw 'Could not sign the HTTPS server certificate.' }

    & docker run --rm --entrypoint sh --mount "type=bind,source=$mountPath,target=/tls" alpine/openssl -c 'chown 101:101 /tls/nginx/privkey.pem && chmod 0400 /tls/nginx/privkey.pem && chmod 0444 /tls/nginx/fullchain.pem'
    if ($LASTEXITCODE -ne 0) { throw 'Could not set certificate permissions for the unprivileged Nginx container.' }
}
catch {
    Remove-Item -LiteralPath $tlsRoot -Recurse -Force
    throw
}

Remove-Item -LiteralPath $serverExtensions, (Join-Path $tlsRoot 'server.csr'), (Join-Path $tlsRoot 'client\betterlife-local-ca.srl') -Force -ErrorAction SilentlyContinue
Write-Output "Created the HTTPS certificate for $ServerAddress. Trust deploy/tls/client/betterlife-local-ca.crt on each client laptop; keep deploy/tls/ca-private/ca.key.pem private."
