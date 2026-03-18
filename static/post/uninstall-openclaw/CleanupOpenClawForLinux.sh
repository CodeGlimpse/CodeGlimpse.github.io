#!/usr/bin/env bash
#
# OpenClaw Cleanup Script (Linux version)
# Function: Detect and uninstall openclaw packages on Linux
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
# Logging Setup (Must be defined first)
# ============================================
LOG_DIR="/tmp/openclaw-cleanup"

mkdir -p "$LOG_DIR" 2>/dev/null
LOG_FILE="$LOG_DIR/Cleanup_$(date +'%Y%m%d_%H%M%S').log"

write_log() {
    local message="$1"
    local level="${2:-Info}"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    local log_line="[$timestamp] [$level] $message"
    echo "$log_line" >> "$LOG_FILE"
    if [ "$SILENT" = false ]; then
        case "$level" in
            "Success")  echo -e "\e[32m[SUCCESS] $message\e[0m" ;;
            "Error")    echo -e "\e[31m[ERROR] $message\e[0m" ;;
            "Info")     echo -e "\e[36m[INFO] $message\e[0m" ;;
            *)          echo "[$level] $message" ;;
        esac
    fi
}

write_log "========== OpenClaw Cleanup Script (Linux) Started ==========" "Info"

# ============================================
# Environment Setup: Ensure Node.js is in PATH
# ============================================
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

write_log "Searching for Node.js in user directories..." "Info"
for user_home in /home/*; do
    if [ -d "$user_home/.nvm" ]; then
        export NVM_DIR="$user_home/.nvm"
        if [ -s "$NVM_DIR/nvm.sh" ]; then
            \. "$NVM_DIR/nvm.sh"
            write_log "Sourced NVM for user $(basename "$user_home")" "Success"
        fi
    fi
done

if [ -d "$HOME/.nvm" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi


# ============================================
# Step 1-5: Local Node.js Package Cleanup
# ============================================
cleanup_local_node_packages() {
    write_log "Starting local Node.js package cleanup..." "Info"

    # --- Check for Node.js ---
    if ! command -v node &> /dev/null; then
        write_log "Node.js not found, skipping local package cleanup." "Info"
        return # Exit function, not script
    fi
    write_log "Node.js detected, version: $(node --version)" "Success"

    # --- Check for package manager ---
    package_manager=""
    if command -v pnpm &> /dev/null; then package_manager="pnpm"; 
    elif command -v npm &> /dev/null; then package_manager="npm"; fi

    if [ -z "$package_manager" ]; then
        write_log "Neither npm nor pnpm found, skipping local package cleanup." "Info"
        return # Exit function, not script
    fi
    write_log "Using package manager: $package_manager" "Success"

    # --- Check for openclaw packages ---
    target_packages=("openclaw" "openclaw-cn")
    found_packages=()
    for pkg in "${target_packages[@]}"; do
        if [ "$package_manager" = "npm" ] && npm list -g "$pkg" --depth=0 2>&1 | grep -qE "$pkg@[0-9]"; then
            found_packages+=("$pkg")
        elif [ "$package_manager" = "pnpm" ] && ! pnpm list -g "$pkg" --depth=0 2>&1 | grep -q "No packages found"; then
            found_packages+=("$pkg")
        fi
    done

    if [ ${#found_packages[@]} -eq 0 ]; then
        write_log "No openclaw packages detected locally." "Info"
        return # Exit function, not script
    fi
    write_log "Found packages to uninstall: ${found_packages[*]}" "Info"

    # --- Stop node processes ---
    write_log "Stopping node processes..." "Info"
    local node_pids=$(pgrep -x node)
    if [ -n "$node_pids" ]; then
        for pid in $node_pids; do kill -TERM "$pid" 2>/dev/null; done
        sleep 2
        for pid in $(pgrep -x node); do kill -9 "$pid" 2>/dev/null; done
    fi

    # --- Uninstall packages ---
    SUDO=""
    if [ "$EUID" -ne 0 ] && [ ! -w "$(npm root -g 2>/dev/null)" ]; then SUDO="sudo"; fi
    for pkg in "${found_packages[@]}"; do
        write_log "Uninstalling $pkg..." "Info"
        if $SUDO "$package_manager" uninstall -g "$pkg" &>/dev/null; then
            write_log "Successfully uninstalled: $pkg" "Success"
        else
            write_log "Failed to uninstall: $pkg" "Error"
        fi
    done
}


# ============================================
# Docker Cleanup Function (Multi-User & Rootless Aware)
# ============================================
cleanup_docker() {
    write_log "Starting comprehensive Docker cleanup..." "Info"

    if ! command -v docker &> /dev/null; then
        write_log "Docker command not found, skipping." "Info"
        return
    fi

    # 1. Collect all potential Docker Sockets (System-wide + Rootless)
    local sockets=()
    [ -S "/var/run/docker.sock" ] && sockets+=("/var/run/docker.sock")
    
    # Search for rootless docker sockets
    for user_sock in /run/user/*/docker.sock; do
        [ -S "$user_sock" ] && sockets+=("$user_sock")
    done

    if [ ${#sockets[@]} -eq 0 ]; then
        write_log "No active Docker sockets found." "Info"
        return
    fi

    for sock in "${sockets[@]}"; do
        write_log "Cleaning Docker instance at $sock..." "Info"
        export DOCKER_HOST="unix://$sock"
        
        # Find and remove containers
        local containers=$(docker ps -a -q --filter "name=openclaw" 2>/dev/null)
        if [ -n "$containers" ]; then
            docker stop $containers &>/dev/null
            docker rm $containers &>/dev/null
            write_log "Removed containers at $sock" "Success"
        fi

        # Find and remove images
        local images=$(docker images -q "*openclaw*" 2>/dev/null)
        if [ -n "$images" ]; then
            docker rmi -f $images &>/dev/null
            write_log "Removed images at $sock" "Success"
        fi
        
        unset DOCKER_HOST
    done
}


# ============================================
# Main Execution
# ============================================
cleanup_local_node_packages
cleanup_docker

write_log "========== Cleanup Completed ==========" "Success"
exit 0