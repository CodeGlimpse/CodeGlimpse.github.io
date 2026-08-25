const test = require('node:test');
const assert = require('node:assert/strict');
globalThis.crypto = require('node:crypto').webcrypto;
const md5Tool = require('../assets/js/tools/md5-core.js');
const shaTool = require('../assets/js/tools/sha-core.js');

test('generates the standard MD5 digest for UTF-8 text', () => {
    assert.equal(md5Tool.hash(''), 'd41d8cd98f00b204e9800998ecf8427e');
    assert.equal(md5Tool.hash('你好'), '7eca689f0d3389d9dea66ae112e5cfd7');
});

test('generates SHA digests using the selected algorithm', async () => {
    assert.equal(
        await shaTool.digest('abc', 'SHA-256'),
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
    assert.equal(
        await shaTool.digest('abc', 'SHA-512'),
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
        '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
    );
});

test('hashes empty input deterministically', async () => {
    assert.equal(await shaTool.digest('', 'SHA-256'), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});
