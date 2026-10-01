const path = require('node:path');

function relativePath(value, allowEmpty = false) {
    return typeof value === 'string' && (allowEmpty && value === ''
        || Boolean(value) && !value.startsWith('/') && !/[\\:?#%\x00-\x1f]/.test(value)
        && !value.split('/').some(part => part === '..' || part === '.')
        && path.posix.normalize(value) === value);
}

function validateDemoRegistry(entries) {
    if (!Array.isArray(entries) || entries.length === 0) throw new Error('Demo registry must contain at least one demo');
    const seen = { id: new Set(), source: new Set(), path: new Set(), preview: new Set() };
    for (const demo of entries) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(demo.id || '')) throw new Error('Invalid demo id');
        if (!relativePath(demo.source)) throw new Error(`Invalid demo paths: ${demo.id}`);
        for (const [key, value] of Object.entries({ id: demo.id, source: demo.source })) {
            if (seen[key].has(value)) throw new Error(`Duplicate demo ${key}: ${value}`);
            seen[key].add(value);
        }
        for (const language of ['zh-cn', 'en']) {
            const copy = demo.copy?.[language];
            if (!copy || ['title', 'label', 'description'].some(key => !copy[key]?.trim())
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
        if (!Array.isArray(demo.templates) || !demo.templates.length) throw new Error(`Missing templates: ${demo.id}`);
        const templateIds = new Set();
        for (const template of demo.templates) {
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(template.id || '') || templateIds.has(template.id)) throw new Error(`Invalid or duplicate template id: ${demo.id}`);
            templateIds.add(template.id);
            if (!relativePath(template.path) || !template.path.endsWith('/')) throw new Error(`Invalid demo paths: ${demo.id}`);
            if (!relativePath(template.preview?.image) || !template.preview.image.endsWith('.jpg')
                || !Number.isInteger(template.preview.width) || template.preview.width < 320
                || !Number.isInteger(template.preview.height) || template.preview.height < 240) throw new Error(`Invalid demo preview: ${demo.id}`);
            for (const [key, value] of Object.entries({ path: template.path, preview: template.preview.image })) {
                if (seen[key].has(value)) throw new Error(`Duplicate demo ${key}: ${value}`);
                seen[key].add(value);
            }
            if (!Array.isArray(template.assets) || template.assets.some(asset => !relativePath(asset))) throw new Error(`Invalid template assets: ${demo.id}`);
            for (const language of ['zh-cn', 'en']) {
                const copy = template.copy?.[language];
                if (!copy || ['name', 'description', 'previewAlt'].some(key => typeof copy[key] !== 'string' || !copy[key].trim())
                    || !Array.isArray(copy.features) || !copy.features.length || copy.features.some(value => typeof value !== 'string' || !value.trim())) throw new Error(`Missing ${language} template copy: ${demo.id}`);
            }
        }
        if (!templateIds.has(demo.defaultTemplate)) throw new Error(`Missing default template: ${demo.id}`);
    }
    const paths = [...seen.path].sort();
    for (let index = 1; index < paths.length; index++) {
        if (paths[index].startsWith(paths[index - 1])) throw new Error(`Overlapping demo destinations: ${paths[index - 1]} and ${paths[index]}`);
    }
    return entries;
}

function expandDemoRegistry(cases) {
    return validateDemoRegistry(cases).flatMap(demo => demo.templates.map(template => ({
        id: template.id === demo.defaultTemplate ? demo.id : `${demo.id}-${template.id}`,
        caseId: demo.id, templateId: template.id, source: demo.source,
        path: template.path, preview: template.preview, brand: demo.brand,
        copy: Object.fromEntries(['zh-cn', 'en'].map(language => [language, {
            ...demo.copy[language], ...template.copy[language],
            title: `${demo.copy[language].title} · ${template.copy[language].name}`,
        }])),
        checks: { ...demo.checks, assets: [...new Set([...demo.checks.assets, ...template.assets])] },
        siblings: demo.templates.map(item => ({ id: item.id, path: item.path, label: item.copy['zh-cn'].name })),
    })));
}

function templateLinks(demo, baseURL) {
    return demo.siblings.map(item => ({ id: item.id, label: item.label, url: new URL(item.path, baseURL).pathname }));
}

const DEMO_CASES = validateDemoRegistry(require('../data/demos.json'));
const DEMO_REGISTRY = expandDemoRegistry(DEMO_CASES);
if (require.main === module) process.stdout.write(JSON.stringify(DEMO_REGISTRY));
module.exports = { DEMO_CASES, DEMO_REGISTRY, validateDemoRegistry, expandDemoRegistry, templateLinks };
