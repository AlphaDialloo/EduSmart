$ErrorActionPreference = "Stop"

$sqlFile = (Resolve-Path (Join-Path $PSScriptRoot "..\database\postgres\init.sql")).Path
$databaseUrl = (Get-Clipboard -Raw).Trim()

if (-not $databaseUrl.StartsWith("postgresql://")) {
    throw "Le presse-papiers ne contient pas une External Database URL PostgreSQL valide."
}

try {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $dockerOutput = @(docker run --rm --mount "type=bind,source=$sqlFile,target=/tmp/init.sql,readonly" postgres:16 psql $databaseUrl -v ON_ERROR_STOP=1 -f /tmp/init.sql 2>&1)
    $dockerExitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    $dockerOutput | ForEach-Object { Write-Host $_ }

    if ($dockerExitCode -ne 0) {
        throw "L'importation PostgreSQL a échoué (code Docker $dockerExitCode)."
    }

    Write-Host "Base EduSmart initialisée avec succès." -ForegroundColor Green
}
finally {
    Set-Clipboard -Value "URL PostgreSQL effacee"
    $databaseUrl = $null
}
