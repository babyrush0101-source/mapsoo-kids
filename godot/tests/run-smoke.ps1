param(
    [string]$GodotConsole = $env:GODOT_BIN,
    [switch]$KeepGenerated
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$godotRoot = Join-Path $repoRoot "godot"
$generatedRoot = Join-Path $godotRoot "tests\.generated"
$importsRoot = Join-Path $godotRoot "mapsoo_imports"

if ([string]::IsNullOrWhiteSpace($GodotConsole)) {
    foreach ($commandName in @("godot4", "godot")) {
        $command = Get-Command $commandName -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($command) {
            $GodotConsole = $command.Source
            break
        }
    }
}

if ([string]::IsNullOrWhiteSpace($GodotConsole) -or -not (Test-Path -LiteralPath $GodotConsole -PathType Leaf)) {
    throw "Godot console executable not found. Pass -GodotConsole, set GODOT_BIN, or add godot4/godot to PATH."
}

$GodotConsole = (Resolve-Path -LiteralPath $GodotConsole).Path

if (-not (Test-Path -LiteralPath (Join-Path $godotRoot "addons\mapsoo_importer\mapsoo_pack_importer.gd") -PathType Leaf)) {
    throw "Mapsoo importer addon is missing. Expected godot/addons/mapsoo_importer/mapsoo_pack_importer.gd"
}

function Remove-TestDirectory([string]$Target) {
    if (-not (Test-Path -LiteralPath $Target)) { return }
    $resolvedTarget = (Resolve-Path -LiteralPath $Target).Path
    $resolvedGodot = (Resolve-Path -LiteralPath $godotRoot).Path
    if (-not $resolvedTarget.StartsWith($resolvedGodot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to delete test data outside godot/: $resolvedTarget"
    }
    Remove-Item -LiteralPath $resolvedTarget -Recurse -Force
}

function Invoke-Godot([string]$Label, [string[]]$Arguments) {
    $output = & $GodotConsole @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    $output | ForEach-Object { Write-Host $_.ToString() }
    if ($exitCode -ne 0) {
        throw "$Label failed with exit code $exitCode"
    }
    if (($output | ForEach-Object { $_.ToString() }) -match "(?m)^(?:SCRIPT )?ERROR:") {
        throw "$Label emitted a Godot engine error"
    }
}

try {
    Remove-TestDirectory $generatedRoot
    Remove-TestDirectory $importsRoot
    Invoke-Godot "Fixture generation" @("--headless", "--path", $godotRoot, "--script", "res://tests/generate_fixture.gd")

    # A separate editor pass imports the freshly generated PNGs before the importer loads them.
    Invoke-Godot "Godot resource import" @("--headless", "--editor", "--path", $godotRoot, "--import")

    Invoke-Godot "Importer smoke test" @("--headless", "--path", $godotRoot, "--script", "res://tests/import_smoke.gd")
}
finally {
    if (-not $KeepGenerated) {
        Remove-TestDirectory $generatedRoot
        Remove-TestDirectory $importsRoot
    }
}
