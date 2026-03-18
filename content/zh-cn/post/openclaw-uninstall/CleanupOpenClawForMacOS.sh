#!/usr/bin/env bash
#
# OpenClaw Cleanup Script v6
# Function: Detect and uninstall openclaw packages on employee computers
#
# Execution flow:
# 1. Check if Node.js exists → exit if not found
# 2. Check package manager (npm/pnpm)
# 3. Check if openclaw packages exist → exit if not found
# 4. Stop all node processes → exit with error if failed
# 5. Uninstall openclaw packages → exit with success
#

# Silent mode flag
SILENT=false
if [[ "$1" == "-s" ]] || [[ "$1" == "--silent" ]]; then
    SILENT=true
fi

# Set UTF-8 encoding
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# ============================================
# Environment Setup: Ensure Node.js is in PATH
# ============================================
# 1. Add common macOS installation paths
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:$PATH"

# 2. If node is still not found, try to locate it from the console user's environment
if ! command -v node &> /dev/null; then
    CONSOLE_USER=$(stat -f%Su /dev/console)
    if [ -n "$CONSOLE_USER" ] && [ "$CONSOLE_USER" != "root" ]; then
        # Try to get node path from user's login shell
        USER_NODE=$(sudo -u "$CONSOLE_USER" -i which node 2>/dev/null)
        if [ -n "$USER_NODE" ]; then
            USER_NODE_DIR=$(dirname "$USER_NODE")
            export PATH="$USER_NODE_DIR:$PATH"
        fi
    fi
fi

# Log directory - prefer ~/Library/Logs
LOG_DIR="$HOME/Library/Logs/openclaw-cleanup"
if ! mkdir -p "$LOG_DIR" 2>/dev/null; then
    # Fallback to temp directory
    LOG_DIR=$(mktemp -d)
fi
LOG_FILE="$LOG_DIR/Cleanup_$(date +'%Y%m%d_%H%M%S').log"

# Output function
write_log() {
    local message="$1"
    local level="${2:-Info}"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    local log_line="[$timestamp] [$level] $message"
    
    # write to log file
    echo "$log_line" >> "$LOG_FILE"
    
    # Console output (only when not silent)
    if [ "$SILENT" = false ]; then
        case "$level" in
            "Success")  echo "[SUCCESS] $message" ;;
            "Error")    echo "[ERROR] $message" ;;
            "Info")     echo "[INFO] $message" ;;
            *)          echo "[$level] $message" ;;
        esac
    fi
}

write_log "========== OpenClaw Cleanup Script Started ==========" "Info"

# ============================================
# Local Node.js Package Cleanup Function
# ============================================
cleanup_local_node_packages() {
    write_log "Starting local Node.js package cleanup..." "Info"

    if ! command -v node &> /dev/null; then
        write_log "Node.js not found, skipping local package cleanup." "Info"
        return
    fi

    local package_manager=""
    if command -v pnpm &> /dev/null; then package_manager="pnpm"
    elif command -v npm &> /dev/null; then package_manager="npm"
    fi

    if [ -z "$package_manager" ]; then
        write_log "No package manager found, skipping local package cleanup." "Info"
        return
    fi

    local target_packages=("openclaw" "openclaw-cn")
    local found_packages=()
    for pkg in "${target_packages[@]}"; do
        if $package_manager list -g "$pkg" --depth=0 2>&1 | grep -qE "$pkg@[0-9]"; then
            found_packages+=("$pkg")
        fi
    done

    if [ ${#found_packages[@]} -eq 0 ]; then
        write_log "No openclaw packages detected locally." "Info"
        return
    fi

    write_log "Stopping node processes..." "Info"
    local node_pids=$(pgrep -x node)
    if [ -n "$node_pids" ]; then
        for pid in $node_pids; do kill -TERM "$pid" 2>/dev/null; done
        sleep 2
        for pid in $(pgrep -x node); do kill -9 "$pid" 2>/dev/null; done
    fi

    for pkg in "${found_packages[@]}"; do
        write_log "Uninstalling $pkg..." "Info"
        if $package_manager uninstall -g "$pkg" &>/dev/null; then
            write_log "Successfully uninstalled $pkg" "Success"
        else
            write_log "Failed to uninstall $pkg" "Error"
        fi
    done
}


# ============================================
# Step 6: Docker Cleanup for openclaw
# ============================================
cleanup_docker() {
    write_log "Checking for Dockerized openclaw..." "Info"

    if ! command -v docker &> /dev/null; then
        write_log "Docker not found, skipping Docker cleanup." "Info"
        return
    fi

    write_log "Docker found. Searching for openclaw containers and images..." "Success"

    # On macOS, Docker Desktop usually runs without sudo
    # Find and stop/remove containers
    containers=$(docker ps -a -q --filter "name=openclaw")
    if [ -n "$containers" ]; then
        write_log "Found openclaw containers. Stopping and removing them..." "Info"
        docker stop $containers &>/dev/null
        docker rm $containers &>/dev/null
        write_log "Stopped and removed openclaw containers." "Success"
    else
        write_log "No openclaw containers found." "Info"
    fi

    # Find and remove images
    images=$(docker images -q "*openclaw*")
    if [ -n "$images" ]; then
        write_log "Found openclaw images. Removing them..." "Info"
        docker rmi -f $images &>/dev/null
        write_log "Removed openclaw images." "Success"
    else
        write_log "No openclaw images found." "Info"
    fi
}

# ============================================
# Main Execution
# ============================================

# Run local package cleanup first
cleanup_local_node_packages

# Always run Docker cleanup
cleanup_docker

write_log "========== Cleanup Completed ==========" "Success"
exit 0
