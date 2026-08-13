const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const files = {
    deploy: path.join(projectRoot, '.github', 'workflows', 'deploy.yml'),
    updateTheme: path.join(projectRoot, '.github', 'workflows', 'update-theme.yml'),
    dockerfile: path.join(projectRoot, '.devcontainer', 'Dockerfile'),
    devcontainer: path.join(projectRoot, '.devcontainer', 'devcontainer.json')
};
const errors = [];

function read(filePath) {
    if (!fs.existsSync(filePath)) {
        errors.push(`missing version configuration: ${path.relative(projectRoot, filePath)}`);
        return '';
    }
    return fs.readFileSync(filePath, 'utf8');
}

function match(text, pattern, label) {
    const result = text.match(pattern);
    if (!result) {
        errors.push(`missing ${label}`);
        return null;
    }
    return result[1];
}

const deployText = read(files.deploy);
const updateThemeText = read(files.updateTheme);
const dockerfileText = read(files.dockerfile);
const devcontainerText = read(files.devcontainer);

const deployVersions = {
    go: match(deployText, /^\s*GO_VERSION:\s*["']([^"']+)["']/m, 'deploy GO_VERSION'),
    hugo: match(deployText, /^\s*HUGO_VERSION:\s*["']([^"']+)["']/m, 'deploy HUGO_VERSION'),
    node: match(deployText, /^\s*NODE_VERSION:\s*["']([^"']+)["']/m, 'deploy NODE_VERSION')
};

const updateThemeVersions = {
    go: match(updateThemeText, /^\s*GO_VERSION:\s*["']([^"']+)["']/m, 'update-theme GO_VERSION'),
    hugo: match(updateThemeText, /^\s*HUGO_VERSION:\s*["']([^"']+)["']/m, 'update-theme HUGO_VERSION'),
    node: match(updateThemeText, /^\s*NODE_VERSION:\s*["']([^"']+)["']/m, 'update-theme NODE_VERSION')
};

const dockerVersions = {
    nodeMajor: match(dockerfileText, /^\s*ARG NODE_MAJOR_VERSION=([^\s\r\n]+)/m, 'Dockerfile NODE_MAJOR_VERSION'),
    hugo: match(dockerfileText, /^\s*ARG VERSION=([^\s\r\n]+)/m, 'Dockerfile Hugo VERSION')
};

const devcontainerVersions = {
    nodeMajor: match(devcontainerText, /"NODE_MAJOR_VERSION"\s*:\s*"([^"]+)"/, 'devcontainer NODE_MAJOR_VERSION'),
    hugo: match(devcontainerText, /"VERSION"\s*:\s*"([^"]+)"/, 'devcontainer Hugo VERSION'),
    go: match(devcontainerText, /"version"\s*:\s*"([^"]+)"/, 'devcontainer Go version')
};

function compare(label, actual, expected) {
    if (actual !== null && expected !== null && actual !== expected) {
        errors.push(`${label}: expected ${expected}, found ${actual}`);
    }
}

compare('update-theme GO_VERSION', updateThemeVersions.go, deployVersions.go);
compare('update-theme HUGO_VERSION', updateThemeVersions.hugo, deployVersions.hugo);
compare('update-theme NODE_VERSION', updateThemeVersions.node, deployVersions.node);
compare('Dockerfile Hugo VERSION', dockerVersions.hugo, deployVersions.hugo);
compare('devcontainer Hugo VERSION', devcontainerVersions.hugo, deployVersions.hugo);
compare('devcontainer Go version', devcontainerVersions.go, deployVersions.go);

const nodeMajor = deployVersions.node?.split('.')[0] ?? null;
compare('Dockerfile NODE_MAJOR_VERSION', dockerVersions.nodeMajor, nodeMajor);
compare('devcontainer NODE_MAJOR_VERSION', devcontainerVersions.nodeMajor, nodeMajor);

if (errors.length > 0) {
    console.error(`Version consistency check failed: ${errors.length} issue(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Version consistency check passed: Go ${deployVersions.go}, Hugo ${deployVersions.hugo}, Node.js ${deployVersions.node}`);
