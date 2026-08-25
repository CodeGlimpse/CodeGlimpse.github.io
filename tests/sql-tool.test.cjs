const test = require('node:test');
const assert = require('node:assert/strict');
const sql = require('../assets/js/tools/sql-core.js');

test('formats SQL clauses and logical conditions', () => {
    const output = sql.formatSql('select id,name from users where active=true and role=\'admin\' order by id;');
    assert.match(output, /SELECT id, name/);
    assert.match(output, /\nFROM users/);
    assert.match(output, /\nWHERE active = true/);
    assert.match(output, /\nAND role = 'admin'/);
});

test('minifies SQL without changing quoted text', () => {
    assert.equal(sql.minifySql('SELECT  name  FROM users WHERE label = \'hello world\';'), 'SELECT name FROM users WHERE label = \'hello world\';');
});
