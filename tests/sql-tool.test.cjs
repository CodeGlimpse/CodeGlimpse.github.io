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

test('retains placeholders, quoted identifiers, Unicode names, and operators', () => {
    const input = 'select 名称 from [user table] where id = ? and code = :code and tag = $1 and owner = @owner;';
    const formatted = sql.formatSql(input);
    assert.match(formatted, /SELECT 名称/);
    assert.match(formatted, /FROM \[user table\]/);
    for (const condition of ['id = ?', 'code = :code', 'tag = $1', 'owner = @owner']) {
        assert.ok(formatted.includes(condition), condition);
    }
    assert.equal(sql.minifySql('SELECT value::text, 1e-3, data->>\'name\' FROM t;'),
        'SELECT value :: text, 1e-3, data ->> \'name\' FROM t;');
});

test('preserves line-comment boundaries and whitespace inside SQL literals', () => {
    assert.equal(sql.minifySql('SELECT id FROM users -- note\nWHERE id = 1;'),
        'SELECT id FROM users -- note\nWHERE id = 1;');
    assert.equal(sql.minifySql("SELECT 'a , b  .' AS label;"), "SELECT 'a , b  .' AS label;");
    assert.equal(sql.minifySql("SELECT N'a  b', $tag$a\n\n\n b$tag$;"),
        "SELECT N'a  b', $tag$a\n\n\n b$tag$;");
    assert.ok(sql.formatSql("SELECT 'a\n\n\nb';").includes("'a\n\n\nb'"));
    assert.ok(sql.formatSql('SELECT /* outer /* inner */ still comment */ 1;')
        .includes('/* outer /* inner */ still comment */'));
    assert.equal(sql.minifySql('SELECT 1+/*a  b*/2;'), 'SELECT 1 + /*a  b*/ 2;');
});

test('rejects incomplete or unsupported SQL instead of discarding characters', () => {
    for (const input of ["SELECT 'unfinished", 'SELECT /* unfinished', 'SELECT $tag$unfinished', 'SELECT 1 \\ 2']) {
        assert.throws(() => sql.formatSql(input), SyntaxError);
        assert.throws(() => sql.minifySql(input), SyntaxError);
    }
});
