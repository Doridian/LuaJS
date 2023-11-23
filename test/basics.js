'use strict';

const test = require('node:test');
const assert = require('node:assert');

const LuaJS = require('../util/loader.js');

test('Can run basic Lua code', async () => {
    const L = await LuaJS.newState();
    const ret = await L.run('return 1 + 2, "hello"');
    assert.strictEqual(ret.length, 2);
    assert.strictEqual(ret[0], 3);
    assert.strictEqual(ret[1], 'hello');
});
