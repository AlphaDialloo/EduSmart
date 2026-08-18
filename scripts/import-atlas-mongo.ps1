$ErrorActionPreference = "Stop"

$mongoUri = (Get-Clipboard -Raw).Trim()

if (-not $mongoUri.StartsWith("mongodb+srv://")) {
    throw "Le presse-papiers ne contient pas une URI MongoDB Atlas valide."
}

$exportName = "edusmart-atlas-$([Guid]::NewGuid().ToString('N'))"
$exportDirectory = Join-Path ([IO.Path]::GetTempPath()) $exportName
$containerDirectory = "/tmp/$exportName"

New-Item -ItemType Directory -Path $exportDirectory | Out-Null

try {
    docker exec edusmart_mongo mongodump --db edusmart_courses --archive="$containerDirectory-courses.archive"
    if ($LASTEXITCODE -ne 0) { throw "L'exportation des cours a échoué." }

    docker exec edusmart_mongo mongodump --db edusmart_interactions --archive="$containerDirectory-interactions.archive"
    if ($LASTEXITCODE -ne 0) { throw "L'exportation du forum a échoué." }

    docker cp "edusmart_mongo:$containerDirectory-courses.archive" (Join-Path $exportDirectory "courses.archive")
    if ($LASTEXITCODE -ne 0) { throw "La copie de l'archive des cours a échoué." }

    docker cp "edusmart_mongo:$containerDirectory-interactions.archive" (Join-Path $exportDirectory "interactions.archive")
    if ($LASTEXITCODE -ne 0) { throw "La copie de l'archive du forum a échoué." }

    $mount = "type=bind,source=$exportDirectory,target=/backup,readonly"
    docker run --rm --mount $mount mongo:7 mongorestore --uri="$mongoUri" --archive=/backup/courses.archive --nsFrom="edusmart_courses.*" --nsTo="edusmart.*"
    if ($LASTEXITCODE -ne 0) { throw "L'importation des cours dans Atlas a échoué." }

    docker run --rm --mount $mount mongo:7 mongorestore --uri="$mongoUri" --archive=/backup/interactions.archive --nsFrom="edusmart_interactions.*" --nsTo="edusmart.*"
    if ($LASTEXITCODE -ne 0) { throw "L'importation du forum dans Atlas a échoué." }

    Write-Host "Cours et interactions importés dans MongoDB Atlas." -ForegroundColor Green
}
finally {
    Set-Clipboard -Value "URI MongoDB effacee"
    $mongoUri = $null

    $resolvedTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    $resolvedExport = [IO.Path]::GetFullPath($exportDirectory)
    if ($resolvedExport.StartsWith($resolvedTemp) -and (Test-Path -LiteralPath $resolvedExport)) {
        Remove-Item -LiteralPath $resolvedExport -Recurse -Force
    }
}
