const path = require('node:path');

function relativePath(value, allowEmpty = false) {
    return typeof value === 'string' && (allowEmpty && value === ''
        || Boolean(value) && !value.startsWith('/') && !/[\\:?#]/.test(value)
        && !value.split('/').some(part => part === '..' || part === '.')
        && path.posix.normalize(value) === value);
}

function validateDemoRegistry(entries) {
    if (!Array.isArray(entries) || entries.length === 0) throw new Error('Demo registry must contain at least one demo');
    const seen = { id: new Set(), source: new Set(), path: new Set(), preview: new Set() };
    for (const demo of entries) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(demo.id || '')) throw new Error('Invalid demo id');
        if (!relativePath(demo.source) || !relativePath(demo.path) || !demo.path.endsWith('/')) throw new Error(`Invalid demo paths: ${demo.id}`);
        if (!relativePath(demo.preview?.image) || !demo.preview.image.endsWith('.jpg')
            || !Number.isInteger(demo.preview.width) || demo.preview.width < 320
            || !Number.isInteger(demo.preview.height) || demo.preview.height < 240) throw new Error(`Invalid demo preview: ${demo.id}`);
        for (const [key, value] of Object.entries({ id: demo.id, source: demo.source, path: demo.path, preview: demo.preview.image })) {
            if (seen[key].has(value)) throw new Error(`Duplicate demo ${key}: ${value}`);
            seen[key].add(value);
        }
        for (const language of ['zh-cn', 'en']) {
            const copy = demo.copy?.[language];
            if (!copy || ['title', 'label', 'description', 'previewAlt'].some(key => !copy[key]?.trim())
                || !Array.isArray(copy.features) || copy.features.length === 0 || copy.features.some(value => !value?.trim())) {
                throw new Error(`Missing ${language} demo copy: ${demo.id}`);
            }
        }
        for (const key of ['pages', 'assets', 'navigation']) {
            if (!Array.isArray(demo.checks?.[key]) || !demo.checks[key].length
                || demo.checks[key].some(value => !relativePath(value, key === 'pages'))) throw new Error(`Invalid demo ${key}: ${demo.id}`);
        }
        if (!demo.checks.pages.includes('') || demo.checks.pages.some(route => route !== '' && !route.endsWith('/'))
            || !demo.checks.assets.some(asset => asset.endsWith('.css'))
            || !demo.checks.navigation.every(route => demo.checks.pages.includes(route))
            || !Array.isArray(demo.checks.requiredText) || !demo.checks.requiredText.length) {
            throw new Error(`Missing demo homepage checks: ${demo.id}`);
        }
    }
    return entries;
}

const DEMO_REGISTRY = validateDemoRegistry(require('../data/demos.json'));
module.exports = { DEMO_REGISTRY, validateDemoRegistry };
