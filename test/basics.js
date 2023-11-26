'use strict';

const test = require('node:test');
const assert = require('node:assert');

const LuaJS = require('../util/loader.js');

function convertBack(ret) {
    return [ret[0], ret[1].toObject()];
}

test('Can run basic Lua code', async () => {
    const L = await LuaJS.newState();
    const ret = await L.run('return 1 + 2, "hello"');
    assert.deepEqual(ret, [3, 'hello']);
});

test('Can pass JS types to Lua correctly', async () => {
    const L = await LuaJS.newState();

    const ret = await L.run('return function(a) return type(a), a end');
    const retConvert = await L.run('return function(a) a = a:toTable(true, 10); return type(a), a end');
    const func = ret[0].getClosure();
    const funcConvert = retConvert[0].getClosure();

    assert.deepEqual(await func('hello world'), ['string', 'hello world']);
    assert.deepEqual(await func(13), ['number', 13]);
    assert.deepEqual(await func([1,2,3]), ['userdata', [1,2,3]]);

    assert.deepEqual(convertBack(await funcConvert([1,2,3])), ['table', { '1': 1, '2': 2, '3': 3 }]);
    // TODO: Fix this!
    // assert.deepEqual(convertBack(await funcConvert({'a': 1, 'b': '2', 'c': true})), ['table', {'a': 1, 'b': '2', 'c': true}]);
});
