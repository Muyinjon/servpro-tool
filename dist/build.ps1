# ServPro Helper — production zip builder
# Run from the dist\ folder or the repo root.
# Output: dist\servpro-helper-v<version>.zip

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Locate the repo root (one level up from this script's directory)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = Split-Path -Parent $scriptDir
$distDir   = $scriptDir

# Read version from manifest.json
$manifestPath = Join-Path $repoRoot "manifest.json"
$manifest     = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version      = $manifest.version

$zipName = "servpro-helper-v$version.zip"
$zipPath = Join-Path $distDir $zipName

# Staging folder (temp, cleaned up after)
$staging = Join-Path $distDir "staging"

Write-Host "Building ServPro Helper v$version ..." -ForegroundColor Cyan

# Clean any previous staging run
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

# Production files — cross-referenced against manifest.json
$productionFiles = @(
    # Root
    "manifest.json",
    "popup.html",
    "options.html",
    "fnol.html",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "icon-48.png",
    "icon-128.png",

    # Libraries
    "src\lib\settings.js",
    "src\lib\tenantRegistry.js",
    "src\lib\googleFormTeamAllen.js",
    "src\lib\selectors.js",
    "src\lib\workcenterFields.js",
    "src\lib\alacrityFields.js",
    "src\lib\kendoHelpers.js",
    "src\lib\payloadPlainText.js",
    "src\lib\fnolNotes.js",
    "src\lib\buttonHints.js",

    # UI
    "src\ui\theme.css",
    "src\ui\theme.js",
    "src\ui\helperPanel.js",
    "src\ui\panel.js",
    "src\ui\importPayloadPanel.js",
    "src\ui\popup.css",
    "src\ui\popup.js",
    "src\ui\options.css",
    "src\ui\options.js",
    "src\ui\fnol.css",
    "src\ui\fnol.js",

    # Content scripts
    "src\content\teamallenssmFill.js",
    "src\content\workcenterScraper.js",
    "src\content\alacrityScraper.js",
    "src\content\topPage.js",
    "src\content\docsFrame.js"
)

$missing = @()
foreach ($rel in $productionFiles) {
    $src  = Join-Path $repoRoot $rel
    $dest = Join-Path $staging  $rel

    if (-not (Test-Path $src)) {
        $missing += $rel
        continue
    }

    $destDir = Split-Path -Parent $dest
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir | Out-Null
    }
    Copy-Item $src $dest
}

if ($missing.Count -gt 0) {
    Write-Host "ERROR: Missing source files:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Remove-Item $staging -Recurse -Force
    exit 1
}

# Remove previous zip with the same name if it exists
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Create zip from staging contents (not the staging folder itself)
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath

# Clean up staging
Remove-Item $staging -Recurse -Force

$zipSize = (Get-Item $zipPath).Length
Write-Host "Done: $zipName ($([Math]::Round($zipSize/1KB, 1)) KB)" -ForegroundColor Green
