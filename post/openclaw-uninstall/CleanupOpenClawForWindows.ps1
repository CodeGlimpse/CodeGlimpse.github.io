<#
OpenClaw Cleanup Script v6
Function: Detect and uninstall openclaw packages on employee computers

Execution flow:
1. Check if Node.js exists → exit if not found
2. Check package manager (npm/pnpm)
3. Check if openclaw packages exist → exit if not found
4. Stop all node processes → exit with error if failed
5. Uninstall openclaw packages → exit with success
#>

param(
    [switch]$Silent  # Silent mode
)

# Set console encoding only if running in an interactive session
if ($Host.UI.RawUI) {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    [Console]::InputEncoding = [System.Text.Encoding]::UTF8
}

$ErrorActionPreference = "Continue"

# Log directory
$logDir = "C:\OpenClawCleanup"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$logFile = "$logDir\Cleanup_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Output function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "Info"
    )
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logLine = "[$timestamp] [$Level] $Message"
    
    # Write to log file
    Add-Content -Path $logFile -Value $logLine -Encoding UTF8
    
    # Console output
    if (-not $Silent) {
        switch ($Level) {
            "Success" { Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
            "Error"   { Write-Host "[ERROR] $Message" -ForegroundColor Red }
            "Info"    { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
            default   { Write-Host "[$Level] $Message" }
        }
    }
}

Write-Log "========== OpenClaw Cleanup Script Started ==========" "Info"

# Function to find Node.js in user profiles
function Find-NodePath {
    Write-Log "Searching for Node.js in all user profiles..." "Info"
    # Get all user profiles from C:\Users, ignore common non-user dirs
    $userDirs = Get-ChildItem -Path (Join-Path $env:SystemDrive 'Users') -Directory -Exclude 'Public', 'Default', 'All Users' -ErrorAction SilentlyContinue
    foreach ($userDir in $userDirs) {
        # Use parentheses to ensure each Join-Path is evaluated independently
        $nodePaths = @(
            (Join-Path $userDir.FullName 'AppData\Roaming\npm'),
            (Join-Path $userDir.FullName 'AppData\Local\Programs\nodejs')
        )
        foreach ($path in $nodePaths) {
            $nodeExe = Join-Path $path 'node.exe'
            if (Test-Path $nodeExe) {
                Write-Log "Found node.exe for user $($userDir.Name) at: $path" "Success"
                return $path
            }
        }
    }
    Write-Log "Node.js not found in any user profile." "Info"
    return $null
}

# ============================================
# Step 1-5: Local Node.js Package Cleanup
# ============================================
function Cleanup-LocalNodePackages {
    Write-Log "Starting local Node.js package cleanup..." "Info"

    # --- Check for Node.js ---
    Write-Log "Checking Node.js..." "Info"
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        $userNodePath = Find-NodePath
        if ($userNodePath) {
            Write-Log "Adding user Node.js path to environment: $userNodePath" "Info"
            $env:PATH = "$userNodePath;" + $env:PATH
            $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        }
    }

    if (-not $nodeCmd) {
        Write-Log "Node.js not found, skipping local package cleanup." "Info"
        return # Exit function, not script
    }
    $nodeVersion = node --version 2>&1
    Write-Log "Node.js detected, version: $nodeVersion" "Success"

    # --- Check for package manager ---
    Write-Log "Checking package manager..." "Info"
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    $pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
    $packageManager = $null
    if ($npmCmd) { $packageManager = "npm" }
    if ($pnpmCmd) { $packageManager = "pnpm" } # pnpm takes precedence

    if (-not $packageManager) {
        Write-Log "Neither npm nor pnpm found, skipping local package cleanup." "Info"
        return # Exit function, not script
    }
    Write-Log "Using package manager: $packageManager" "Success"

    # --- Check for openclaw packages ---
    Write-Log "Checking openclaw packages..." "Info"
    $targetPackages = @("openclaw", "openclaw-cn")
    $foundPackages = @()
    foreach ($pkg in $targetPackages) {
        $result = & $packageManager list -g $pkg --depth=0 2>&1 | Out-String
        if ($result -match "$pkg@\d+" -or ($packageManager -eq "pnpm" -and $result -notmatch "No packages found")) {
            $foundPackages += $pkg
            Write-Log "Package found: $pkg" "Success"
        }
    }

    if ($foundPackages.Count -eq 0) {
        Write-Log "No openclaw packages detected locally." "Info"
        return # Exit function, not script
    }

    # --- Stop node processes ---
    Write-Log "Stopping all node processes..." "Info"
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        if (Get-Process -Name "node" -ErrorAction SilentlyContinue) {
            Write-Log "Warning: Some node processes could not be stopped." "Error"
        } else {
            Write-Log "All node processes stopped." "Success"
        }
    }

    # --- Uninstall packages ---
    Write-Log "Uninstalling openclaw packages..." "Info"
    foreach ($pkg in $foundPackages) {
        & $packageManager uninstall -g $pkg 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Uninstalled: $pkg" "Success"
        } else {
            Write-Log "Failed to uninstall: $pkg" "Error"
        }
    }
}


# ============================================
# Step 6: Docker Cleanup for openclaw
# ============================================
function Cleanup-Docker {
    Write-Log "Checking for Dockerized openclaw..." "Info"

    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $dockerCmd) {
        Write-Log "Docker not found, skipping Docker cleanup." "Info"
        return
    }

    # Set Docker environment to target default pipe
    $env:DOCKER_HOST = "npipe://./pipe/docker_engine"

    Write-Log "Searching for openclaw containers and images via $env:DOCKER_HOST..." "Info"
    # Find and stop/remove containers
    $containers = & docker ps -a -q --filter "name=openclaw" 2>$null
    if ($containers) {
        & docker stop $containers 2>&1 | Out-Null
        & docker rm $containers 2>&1 | Out-Null
        Write-Log "Stopped and removed openclaw containers." "Success"
    }

    # Find and remove images
    $images = & docker images -q "*openclaw*" 2>$null
    if ($images) {
        & docker rmi -f $images 2>&1 | Out-Null
        Write-Log "Removed openclaw images." "Success"
    }
    
    $env:DOCKER_HOST = $null # Reset
}


# ============================================
# Main Execution
# ============================================

# Run local package cleanup first
Cleanup-LocalNodePackages

# Always run Docker cleanup
Cleanup-Docker

Write-Log "========== Cleanup Completed ==========" "Success"
exit 0