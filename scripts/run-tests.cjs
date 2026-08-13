const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', 'tests');

function collectTestFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectTestFiles(entryPath);
        return entry.isFile() && entry.name.endsWith('.test.cjs') ? [entryPath] : [];
    });
}

const files = collectTestFiles(root).sort();
if (files.length === 0) {
    console.error(`No test files found under ${root}`);
    process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status ?? 1);
