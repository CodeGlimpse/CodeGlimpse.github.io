const test = require('node:test');
const assert = require('node:assert/strict');

const jwt = require('../assets/js/tools/jwt-core.js');

function segment(value) {
    return Buffer.from(JSON.stringify(value), 'utf8')
        .toString('base64url');
}

test('decodes JWT header, payload, and temporal claims', () => {
    const token = `${segment({ alg: 'HS256', typ: 'JWT' })}.${segment({ sub: '42', iat: 100, nbf: 150, exp: 200 })}.signature`;
    const result = jwt.decode(token, 175000);

    assert.equal(result.header.alg, 'HS256');
    assert.equal(result.payload.sub, '42');
    assert.deepEqual(result.claims, { expiresAt: 200, issuedAt: 100, notBefore: 150 });
    assert.deepEqual(result.status, { expired: false, notActive: false });
    assert.equal(result.signature, 'signature');
});

test('reports expired and not-yet-active JWTs', () => {
    const expired = `${segment({ alg: 'none' })}.${segment({ exp: 10 })}.`;
    assert.equal(jwt.decode(expired, 10000).status.expired, true);

    const pending = `${segment({ alg: 'none' })}.${segment({ nbf: 20 })}.`;
    assert.equal(jwt.decode(pending, 10000).status.notActive, true);
});

test('rejects malformed JWTs and non-object payloads', () => {
    assert.throws(() => jwt.decode('not-a-token'), /three dot-separated segments/);
    assert.throws(() => jwt.decode(`${segment({ alg: 'none' })}.${segment(['invalid'])}.`), /payload must be a JSON object/);
});
