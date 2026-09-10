<#
.SYNOPSIS
Safely inventories or removes OpenClaw installations for the current Windows environment.

.DESCRIPTION
The default mode is read-only. Pass -Apply to request changes. Interactive use
requires typing REMOVE OPENCLAW; automation must add -Yes explicitly. The
script stops only node.exe processes whose command line identifies OpenClaw,
and it uses only the current Docker context.
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch]$Apply,
    [switch]$Yes,
    [switch]$Silent
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'
$script:HadError = $false
$targetPackages = @('openclaw', 'openclaw-cn')
$logDirectory = Join-Path ([IO.Path]::GetTempPath()) 'openclaw-cleanup'
New-Item -ItemType Directory -LiteralPath $logDirectory -Force | Out-Null
$logFile = Join-Path $logDirectory ("Cleanup_{0}.log" -f (Get-Date -Format 'yyyyMMdd_HHmmss'))

function Write-CleanupLog {
    param([string]$Message, [ValidateSet('Info', 'Success', 'Warning', 'Error')][string]$Level = 'Info')
    $line = '[{0}] [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Add-Content -LiteralPath $logFile -Value $line -Encoding UTF8
    if (-not $Silent) { Write-Host $line }
}

function Get-PackageManager {
    foreach ($name in @('pnpm.cmd', 'pnpm', 'npm.cmd', 'npm')) {
        $command = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($command) { return $command.Source }
    }
    return $null
}

function Get-InstalledOpenClawPackages {
    param([string]$PackageManager)
    if (-not $PackageManager) { return @() }
    $found = @()
    foreach ($package in $targetPackages) {
        $output = & $PackageManager list -g $package --depth=0 --json 2>$null | Out-String
        if ($LASTEXITCODE -eq 0 -and $output -match ('"{0}"\s*:' -f [regex]::Escape($package))) {
            $found += $package
        }
    }
    return $found
}

function Get-OpenClawNodeProcesses {
    $pattern = '(?i)(?:^|[\\/\s])openclaw(?:-cn)?(?:[\\/\s.:_-]|$)'
    return @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine -match $pattern })
}

function Get-OpenClawDockerTargets {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        return @{ Containers = @(); Images = @() }
    }

    $containers = @()
    foreach ($line in @(& docker ps -a --filter 'name=openclaw' --format '{{.ID}}|{{.Names}}|{{.Image}}' 2>$null)) {
        $parts = $line -split '\|', 3
        if ($parts.Count -ne 3) { continue }
        if ($parts[1] -match '(?i)^openclaw(?:-cn)?(?:[-_.].*)?$' -or
            $parts[2] -match '(?i)(?:^|/)openclaw(?:-cn)?(?:[:@._-].*)?$') {
            $containers += [PSCustomObject]@{ Id = $parts[0]; Name = $parts[1]; Image = $parts[2] }
        }
    }

    $images = @()
    foreach ($line in @(& docker images --format '{{.Repository}}:{{.Tag}}|{{.ID}}' 2>$null)) {
        $parts = $line -split '\|', 2
        if ($parts.Count -eq 2 -and $parts[0] -match '(?i)(?:^|/)openclaw(?:-cn)?(?:[:@._-].*)?$') {
            $images += [PSCustomObject]@{ Reference = $parts[0]; Id = $parts[1] }
        }
    }
    return @{ Containers = $containers; Images = $images }
}

function Confirm-Removal {
    if (-not $Apply) { return $false }
    if ($Yes) { return $true }
    if (-not [Environment]::UserInteractive) {
        Write-CleanupLog 'Refusing non-interactive removal without -Yes.' 'Error'
        return $false
    }
    $answer = Read-Host 'Type REMOVE OPENCLAW to apply the listed changes'
    return $answer -ceq 'REMOVE OPENCLAW'
}

Write-CleanupLog ('OpenClaw cleanup started in {0} mode.' -f $(if ($Apply) { 'apply' } else { 'dry-run' }))
$packageManager = Get-PackageManager
$packages = @(Get-InstalledOpenClawPackages -PackageManager $packageManager)
$processes = @(Get-OpenClawNodeProcesses)
$dockerTargets = Get-OpenClawDockerTargets

Write-CleanupLog ('Packages: {0}' -f $(if ($packages.Count) { $packages -join ', ' } else { 'none' }))
Write-CleanupLog ('OpenClaw node process IDs: {0}' -f $(if ($processes.Count) { ($processes.ProcessId -join ', ') } else { 'none' }))
Write-CleanupLog ('Docker containers: {0}' -f $(if ($dockerTargets.Containers.Count) { ($dockerTargets.Containers.Name -join ', ') } else { 'none' }))
Write-CleanupLog ('Docker images: {0}' -f $(if ($dockerTargets.Images.Count) { ($dockerTargets.Images.Reference -join ', ') } else { 'none' }))

if (-not $Apply) {
    Write-CleanupLog 'Dry-run complete. No process, package, container, image, file, profile, or registry value was changed.' 'Success'
    Write-CleanupLog 'Review the plan, then rerun with -Apply. Add -Yes only for controlled automation.' 'Info'
    exit 0
}

if (-not (Confirm-Removal)) {
    Write-CleanupLog 'Removal was not confirmed; no changes were made.' 'Warning'
    exit 2
}

foreach ($process in $processes) {
    if ($PSCmdlet.ShouldProcess("OpenClaw node process $($process.ProcessId)", 'Stop')) {
        try {
            Stop-Process -Id $process.ProcessId -ErrorAction Stop
            Write-CleanupLog "Stopped OpenClaw node process $($process.ProcessId)." 'Success'
        } catch {
            $script:HadError = $true
            Write-CleanupLog "Could not stop process $($process.ProcessId): $($_.Exception.Message)" 'Error'
        }
    }
}

foreach ($package in $packages) {
    if ($PSCmdlet.ShouldProcess("global package $package", "Uninstall with $packageManager")) {
        & $packageManager uninstall -g $package
        if ($LASTEXITCODE -eq 0) {
            Write-CleanupLog "Uninstalled package $package." 'Success'
        } else {
            $script:HadError = $true
            Write-CleanupLog "Package removal failed for $package." 'Error'
        }
    }
}

foreach ($container in $dockerTargets.Containers) {
    if ($PSCmdlet.ShouldProcess("Docker container $($container.Name)", 'Stop and remove')) {
        & docker stop $container.Id | Out-Null
        & docker rm $container.Id | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-CleanupLog "Removed Docker container $($container.Name)." 'Success'
        } else {
            $script:HadError = $true
            Write-CleanupLog "Docker container removal failed for $($container.Name)." 'Error'
        }
    }
}

foreach ($image in $dockerTargets.Images) {
    if ($PSCmdlet.ShouldProcess("Docker image $($image.Reference)", 'Remove')) {
        & docker image rm $image.Id | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-CleanupLog "Removed Docker image $($image.Reference)." 'Success'
        } else {
            $script:HadError = $true
            Write-CleanupLog "Docker image removal failed for $($image.Reference)." 'Error'
        }
    }
}

Write-CleanupLog ('Cleanup completed. Log: {0}' -f $logFile) $(if ($script:HadError) { 'Warning' } else { 'Success' })
exit $(if ($script:HadError) { 1 } else { 0 })
