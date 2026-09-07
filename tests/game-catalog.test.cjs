const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSearch, matchesSearch } = require('../assets/js/games/catalog-core.js');

test('game search matches Chinese, case-insensitive English, full-width input and hyphenated aliases', () => {
    assert.equal(matchesSearch('Snake 贪吃蛇 反应 Reflexes', ' 贪吃蛇 '), true);
    assert.equal(matchesSearch('Snake 贪吃蛇 反应 Reflexes', 'ＳＮＡＫＥ'), true);
    assert.equal(matchesSearch('2048 数字 合并', '２０４８'), true);
    assert.equal(matchesSearch('tic-tac-toe 井字棋 computer', 'TIC TAC TOE'), true);
    assert.equal(normalizeSearch('  clear_lines  PUZZLE '), 'clear lines puzzle');
});

test('game search requires every keyword and resets to all games for an empty query', () => {
    assert.equal(matchesSearch('memory cards matching fruit', 'fruit memory'), true);
    assert.equal(matchesSearch('memory cards matching fruit', 'fruit snake'), false);
    assert.equal(matchesSearch('关灯 解谜 逻辑', '关灯 解谜'), true);
    assert.equal(matchesSearch('anything', '　 '), true);
    assert.equal(matchesSearch('', null), true);
});

test('game search treats markup and regex-looking input as literal text', () => {
    for (const query of ['<img src=x onerror=alert(1)>', '.*', '(a+)+$', '[', '"']) assert.equal(matchesSearch('Snake 贪吃蛇', query), false);
    assert.equal(matchesSearch('A [puzzle]', '[puzzle]'), true);
});
