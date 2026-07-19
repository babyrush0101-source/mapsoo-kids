param(
    [Parameter(Mandatory = $true)]
    [string]$DescriptorPath,

    [Parameter(Mandatory = $true)]
    [string]$ExtractedRoot,

    [string]$GodotConsole = $env:GODOT_BIN,

    [string]$GodotProject = ''
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($GodotProject)) {
    $GodotProject = Join-Path $scriptRoot '..\godot'
}
$requiredPackIds = @('sunny-meadow', 'dustwind-outpost', 'frostwatch-vale')

function Resolve-RequiredFile([string]$Path, [string]$Label) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "$Label is missing: $Path"
    }
    return (Resolve-Path -LiteralPath $Path).Path
}

function Read-NonNegativeInteger($Value, [string]$Label) {
    if ($null -eq $Value -or $Value -isnot [ValueType]) {
        throw "$Label must be a non-negative integer."
    }
    $number = [int64]$Value
    if ($number -lt 0 -or [double]$Value -ne [double]$number) {
        throw "$Label must be a non-negative integer."
    }
    return $number
}

$descriptorPathResolved = Resolve-RequiredFile $DescriptorPath 'Exact-pack descriptor'
$godotConsoleResolved = Resolve-RequiredFile $GodotConsole 'Godot console executable'
$godotProjectResolved = (Resolve-Path -LiteralPath $GodotProject).Path
$extractedRootResolved = (Resolve-Path -LiteralPath $ExtractedRoot).Path
$descriptor = Get-Content -LiteralPath $descriptorPathResolved -Raw | ConvertFrom-Json

if ($descriptor.schemaVersion -ne 1) {
    throw 'Exact-pack descriptor schemaVersion must be 1.'
}
$packs = @($descriptor.packs)
if ($packs.Count -ne $requiredPackIds.Count) {
    throw "Exact-pack descriptor must contain exactly $($requiredPackIds.Count) packs."
}
$actualIds = @($packs | ForEach-Object { [string]$_.id })
if (@($actualIds | Sort-Object -Unique).Count -ne $actualIds.Count) {
    throw 'Exact-pack descriptor contains duplicate pack IDs.'
}
foreach ($requiredId in $requiredPackIds) {
    if ($actualIds -notcontains $requiredId) {
        throw "Exact-pack descriptor is missing required pack ID: $requiredId"
    }
}

foreach ($pack in $packs) {
    $packId = [string]$pack.id
    $schemaVersion = [string]$pack.schemaVersion
    $archiveRoot = [string]$pack.archiveRoot
    if ($packId -notmatch '^[a-z0-9]+(?:-[a-z0-9]+)*$') {
        throw "Invalid exact-pack ID: $packId"
    }
    if ($schemaVersion -notmatch '^\d+\.\d+\.\d+$') {
        throw "Invalid schemaVersion for ${packId}: $schemaVersion"
    }
    if ([string]::IsNullOrWhiteSpace($archiveRoot) -or [IO.Path]::IsPathRooted($archiveRoot) -or $archiveRoot -match '[\\/]' -or $archiveRoot -in @('.', '..')) {
        throw "Invalid archiveRoot for ${packId}: $archiveRoot"
    }
    $cells = Read-NonNegativeInteger $pack.cellCount "$packId cellCount"
    $props = Read-NonNegativeInteger $pack.propCount "$packId propCount"
    $places = Read-NonNegativeInteger $pack.placeCount "$packId placeCount"
    $structures = Read-NonNegativeInteger $pack.structureCount "$packId structureCount"

    $manifestCandidate = Join-Path (Join-Path $extractedRootResolved $archiveRoot) 'mapsoo.manifest.json'
    $manifestPath = Resolve-RequiredFile $manifestCandidate "$packId manifest"
    $rootPrefix = $extractedRootResolved + [IO.Path]::DirectorySeparatorChar
    if (-not $manifestPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to run a manifest outside ExtractedRoot: $manifestPath"
    }

    $arguments = @(
        '--headless',
        '--path', $godotProjectResolved,
        '--script', 'res://tests/import_pack_cli.gd',
        '--',
        "--manifest=$manifestPath",
        "--expected-pack-id=$packId",
        "--expected-schema=$schemaVersion",
        "--expected-cells=$cells",
        "--expected-props=$props",
        "--expected-places=$places",
        "--expected-structures=$structures",
        '--check-conflict=true'
    )
    $output = @(& $godotConsoleResolved @arguments 2>&1)
    $exitCode = $LASTEXITCODE
    $lines = @($output | ForEach-Object { $_.ToString() })
    $lines | ForEach-Object { Write-Host $_ }
    if ($exitCode -ne 0 -or $lines -match '^(?:SCRIPT )?ERROR:') {
        throw "Exact-pack Godot import failed for $packId."
    }
    $expectedSentinel = "MAPSOO_PACK_CLI_OK pack_id=$packId schema=$schemaVersion cells=$cells props=$props places=$places structures=$structures first=created second=unchanged conflict=preserved"
    if ($lines -notcontains $expectedSentinel) {
        throw "Exact-pack sentinel is missing for $packId. Expected: $expectedSentinel"
    }
}

Write-Host "MAPSOO_EXACT_PACK_SET_OK packs=$($requiredPackIds.Count) ids=$($requiredPackIds -join ',') conflict=preserved"
