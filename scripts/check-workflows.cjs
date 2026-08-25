const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const workflowRoot = path.join(projectRoot, '.github', 'workflows');
const errors = [];

for (const entry of fs.readdirSync(workflowRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(ya?ml)$/i.test(entry.name)) continue;
    const filePath = path.join(workflowRoot, entry.name);
    const relativeFile = path.relative(projectRoot, filePath).split(path.sep).join('/');
    const source = fs.readFileSync(filePath, 'utf8');

    for (const match of source.matchAll(/^\s*uses:\s*([^\s#]+)@([^\s#]+)/gm)) {
        if (!/^[0-9a-f]{40}$/i.test(match[2])) {
            errors.push(`${relativeFile}: action ${match[1]} must use a full commit SHA`);
        }
    }

    if (/pull_request_target\s*:/i.test(source)) {
        errors.push(`${relativeFile}: pull_request_target is not permitted`);
    }
}

const deploy = fs.readFileSync(path.join(workflowRoot, 'deploy.yml'), 'utf8');
if (!/^permissions:\s*\r?\n\s+contents:\s+read/m.test(deploy)) {
    errors.push('.github/workflows/deploy.yml: default contents permission must be read');
}
if (!/permissions:\s*\r?\n\s+contents:\s+write/m.test(deploy)) {
    errors.push('.github/workflows/deploy.yml: deploy job must explicitly request contents write');
}

if (errors.length > 0) {
    console.error(`Workflow security check failed: ${errors.length} issue(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log('Workflow security check passed: actions are SHA-pinned and permissions are explicit');
