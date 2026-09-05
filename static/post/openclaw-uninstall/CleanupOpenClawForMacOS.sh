#!/usr/bin/env bash
# Safe OpenClaw cleanup for macOS. Dry-run is the default.

set -u

APPLY=false
ASSUME_YES=false
SILENT=false
HAD_ERROR=false
TARGET_PACKAGES=(openclaw openclaw-cn)
LOG_DIR="${HOME}/Library/Logs/openclaw-cleanup"
if ! mkdir -p "$LOG_DIR" 2>/dev/null; then
    LOG_DIR="$(mktemp -d "${TMPDIR:-/tmp}/openclaw-cleanup.XXXXXX")" || exit 1
fi
LOG_FILE="$LOG_DIR/Cleanup_$(date +'%Y%m%d_%H%M%S').log"

usage() {
    printf '%s\n' \
        'Usage: CleanupOpenClawForMacOS.sh [--apply] [--yes] [--silent]' \
        '  default   Inventory only; makes no changes.' \
        '  --apply   Request the listed OpenClaw removals.' \
        '  --yes     Skip the typed confirmation (controlled automation only).'
}

while (($#)); do
    case "$1" in
        --apply) APPLY=true ;;
        --yes) ASSUME_YES=true ;;
        -s|--silent) SILENT=true ;;
        -h|--help) usage; exit 0 ;;
        *) printf 'Unknown option: %s\n' "$1" >&2; usage >&2; exit 2 ;;
    esac
    shift
done

write_log() {
    local message="$1"
    local level="${2:-Info}"
    local line="[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message"
    printf '%s\n' "$line" >> "$LOG_FILE"
    if [[ "$SILENT" == false ]]; then printf '%s\n' "$line"; fi
}

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
PACKAGE_MANAGER=""
if command -v pnpm >/dev/null 2>&1; then
    PACKAGE_MANAGER=pnpm
elif command -v npm >/dev/null 2>&1; then
    PACKAGE_MANAGER=npm
fi

FOUND_PACKAGES=()
if [[ -n "$PACKAGE_MANAGER" ]]; then
    for package in "${TARGET_PACKAGES[@]}"; do
        output="$($PACKAGE_MANAGER list -g "$package" --depth=0 --json 2>/dev/null || true)"
        if grep -Eq "\"${package}\"[[:space:]]*:|\"name\"[[:space:]]*:[[:space:]]*\"${package}\"" <<< "$output"; then
            FOUND_PACKAGES+=("$package")
        fi
    done
fi

NODE_PIDS=()
while read -r pid command arguments; do
    [[ "$command" =~ ^node(js)?$ ]] || continue
    if [[ "$arguments" =~ (^|[[:space:]/])openclaw(-cn)?([[:space:]/.:_-]|$) ]]; then
        NODE_PIDS+=("$pid")
    fi
done < <(ps -axo pid=,comm=,args= 2>/dev/null || true)

CONTAINER_IDS=()
CONTAINER_NAMES=()
IMAGE_IDS=()
IMAGE_NAMES=()
if command -v docker >/dev/null 2>&1; then
    while IFS='|' read -r id name image; do
        [[ -n "$id" ]] || continue
        if [[ "$name" =~ ^openclaw(-cn)?([-_.].*)?$ || "$image" =~ (^|/)openclaw(-cn)?([:@._-].*)?$ ]]; then
            CONTAINER_IDS+=("$id")
            CONTAINER_NAMES+=("$name")
        fi
    done < <(docker ps -a --filter 'name=openclaw' --format '{{.ID}}|{{.Names}}|{{.Image}}' 2>/dev/null || true)

    while IFS='|' read -r reference id; do
        [[ -n "$id" ]] || continue
        if [[ "$reference" =~ (^|/)openclaw(-cn)?([:@._-].*)?$ ]]; then
            IMAGE_IDS+=("$id")
            IMAGE_NAMES+=("$reference")
        fi
    done < <(docker images --format '{{.Repository}}:{{.Tag}}|{{.ID}}' 2>/dev/null || true)
fi

join_or_none() {
    if (($#)); then printf '%s' "$*"; else printf 'none'; fi
}

write_log "OpenClaw cleanup started in $([[ "$APPLY" == true ]] && printf apply || printf dry-run) mode."
write_log "Package manager: ${PACKAGE_MANAGER:-none}"
write_log "Packages: $(join_or_none "${FOUND_PACKAGES[@]}")"
write_log "OpenClaw node process IDs: $(join_or_none "${NODE_PIDS[@]}")"
write_log "Docker containers: $(join_or_none "${CONTAINER_NAMES[@]}")"
write_log "Docker images: $(join_or_none "${IMAGE_NAMES[@]}")"

if [[ "$APPLY" == false ]]; then
    write_log 'Dry-run complete. No process, package, container, image, file, profile, or system setting was changed.' Success
    write_log 'Review the plan, then rerun with --apply. Add --yes only for controlled automation.'
    exit 0
fi

if [[ "$ASSUME_YES" == false ]]; then
    if [[ ! -t 0 ]]; then
        write_log 'Refusing non-interactive removal without --yes.' Error
        exit 2
    fi
    read -r -p 'Type REMOVE OPENCLAW to apply the listed changes: ' confirmation
    if [[ "$confirmation" != 'REMOVE OPENCLAW' ]]; then
        write_log 'Removal was not confirmed; no changes were made.' Warning
        exit 2
    fi
fi

for pid in "${NODE_PIDS[@]}"; do
    if kill -TERM "$pid" 2>/dev/null; then
        write_log "Stopped OpenClaw node process $pid." Success
    else
        HAD_ERROR=true
        write_log "Could not stop OpenClaw node process $pid." Error
    fi
done

for package in "${FOUND_PACKAGES[@]}"; do
    if "$PACKAGE_MANAGER" uninstall -g "$package" >/dev/null 2>&1; then
        write_log "Uninstalled package $package." Success
    else
        HAD_ERROR=true
        write_log "Package removal failed for $package." Error
    fi
done

for index in "${!CONTAINER_IDS[@]}"; do
    if docker stop "${CONTAINER_IDS[$index]}" >/dev/null 2>&1 && docker rm "${CONTAINER_IDS[$index]}" >/dev/null 2>&1; then
        write_log "Removed Docker container ${CONTAINER_NAMES[$index]}." Success
    else
        HAD_ERROR=true
        write_log "Docker container removal failed for ${CONTAINER_NAMES[$index]}." Error
    fi
done

for index in "${!IMAGE_IDS[@]}"; do
    if docker image rm "${IMAGE_IDS[$index]}" >/dev/null 2>&1; then
        write_log "Removed Docker image ${IMAGE_NAMES[$index]}." Success
    else
        HAD_ERROR=true
        write_log "Docker image removal failed for ${IMAGE_NAMES[$index]}." Error
    fi
done

write_log "Cleanup completed. Log: $LOG_FILE" "$([[ "$HAD_ERROR" == true ]] && printf Warning || printf Success)"
if [[ "$HAD_ERROR" == true ]]; then exit 1; fi
exit 0
