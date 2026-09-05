const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const scriptRoot = path.join(projectRoot, 'static', 'post', 'openclaw-uninstall');
const scripts = [
    'CleanupOpenClawForWindows.ps1',
    'CleanupOpenClawForLinux.sh',
    'CleanupOpenClawForMacOS.sh',
];
const articles = [
    path.join(projectRoot, 'content', 'zh-cn', 'post', 'openclaw-uninstall', 'index.md'),
    path.join(projectRoot, 'content', 'en', 'post', 'openclaw-uninstall', 'index.md'),
];
const errors = [];

function fencedCode(source) {
    return Array.from(source.matchAll(/```[^\n]*\r?\n([\s\S]*?)```/g), (match) => match[1]).join('\n');
}

function relative(filePath) {
    return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function commandExists(command, args) {
    const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
    return !result.error && result.status === 0;
}

function runPowerShellParser(filePath) {
    if (!commandExists('pwsh', ['-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.ToString()'])) {
        console.log('PowerShell parser unavailable; static PowerShell safety checks still ran');
        return;
    }
    const command = [
        '$tokens = $null',
        '$parseErrors = $null',
        '[System.Management.Automation.Language.Parser]::ParseFile($env:CODEGLIMPSE_SCRIPT_PATH, [ref]$tokens, [ref]$parseErrors) | Out-Null',
        'if ($parseErrors.Count) { $parseErrors | ForEach-Object { Write-Error $_.Message }; exit 1 }',
    ].join('; ');
    const result = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', command], {
        encoding: 'utf8',
        env: { ...process.env, CODEGLIMPSE_SCRIPT_PATH: filePath },
        windowsHide: true,
    });
    if (result.status !== 0) {
        errors.push(`${relative(filePath)}: PowerShell parser failed: ${(result.stderr || result.stdout).trim()}`);
    }
}

function runBashParser(filePath) {
    if (process.platform === 'win32' || !commandExists('bash', ['--version'])) {
        console.log(`${relative(filePath)}: Bash parser unavailable on this host; CI will run bash -n`);
        return;
    }
    const result = spawnSync('bash', ['-n', filePath], { encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) {
        errors.push(`${relative(filePath)}: bash -n failed: ${(result.stderr || result.stdout).trim()}`);
    }
}

const articleSources = articles.map((filePath) => ({
    filePath,
    source: fs.readFileSync(filePath, 'utf8'),
}));

for (const name of scripts) {
    const filePath = path.join(scriptRoot, name);
    if (!fs.existsSync(filePath)) {
        errors.push(`${relative(filePath)}: distributed cleanup script is missing`);
        continue;
    }

    const source = fs.readFileSync(filePath, 'utf8');
    const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    for (const article of articleSources) {
        if (!article.source.includes(hash)) {
            errors.push(`${relative(article.filePath)}: missing current SHA-256 for ${name} (${hash})`);
        }
    }

    for (const [pattern, message] of [
        [/Stop-Process\s+-Name\s+["']?node/i, 'must not stop every Node.js process'],
        [/pgrep\s+(?:-[^\s]+\s+)*["']?node/i, 'must not enumerate every Node.js process by name'],
        [/docker\s+(?:rmi|image\s+rm)\s+-f/i, 'must not force-remove Docker images'],
        [/docker\s+images[^\n]*\*openclaw\*/i, 'must not use wildcard Docker image deletion'],
        [/\brm\s+-rf\b/i, 'must not recursively force-delete paths'],
        [/(?:\birm\b|\biwr\b|\bcurl\b)[^\n|]*\|\s*(?:iex|bash|sh)\b/i, 'must not contain download-and-execute pipelines'],
    ]) {
        if (pattern.test(source)) errors.push(`${relative(filePath)}: ${message}`);
    }

    const required = name.endsWith('.ps1')
        ? ['[CmdletBinding(SupportsShouldProcess = $true)]', '[switch]$Apply', 'Confirm-Removal', 'Get-CimInstance Win32_Process', 'OpenClaw node process']
        : ['--apply', 'REMOVE OPENCLAW', 'Dry-run complete', 'OpenClaw node process'];
    for (const marker of required) {
        if (!source.includes(marker)) errors.push(`${relative(filePath)}: missing safety marker ${marker}`);
    }

    if (name.endsWith('.ps1')) runPowerShellParser(filePath);
    else runBashParser(filePath);
}

for (const article of articleSources) {
    if (/(?:\b(?:irm|iwr)\b[^\n|]*\|\s*iex\b|\bcurl\b[^\n|]*\|\s*(?:ba)?sh\b)/i.test(fencedCode(article.source))) {
        errors.push(`${relative(article.filePath)}: article still recommends a download-and-execute pipeline`);
    }
    for (const marker of ['dry-run', 'SHA-256', 'REMOVE OPENCLAW']) {
        if (!article.source.includes(marker)) errors.push(`${relative(article.filePath)}: missing safe execution guidance ${marker}`);
    }
}

if (errors.length) {
    console.error(`Distributed script check failed: ${errors.length} issue(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log('Distributed script check passed: syntax where available, scoped targets, dry-run, confirmation, and article hashes verified');
