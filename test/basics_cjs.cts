import test from 'node:test';
import assert from 'node:assert';

import { LuaJS, LuaFunction, LuaTable } from '../util/loader_cjs.cjs';

function convertBack(ret: unknown[]): [string, unknown] {
    return [ret[0] as string, (ret[1] as LuaTable).toObject(true, true)];
}

test('Can run basic Lua code (CommonJS)', async () => {
    const L = await LuaJS.newState();
    const ret = await L.run('return 1 + 2, "hello"');
    assert.deepEqual(ret, [3, 'hello']);
});

test('Can pass JS types to Lua correctly (CommonJS)', async () => {
    const L = await LuaJS.newState();

    const ret = await L.run('return function(a) return type(a), a end');
    const retConvert = await L.run('return function(a) a = a:toTable(true, 10); return type(a), a end');
    const func = (ret[0] as LuaFunction).getClosure();
    const funcConvert = (retConvert[0] as LuaFunction).getClosure();

    assert.deepEqual(await func('hello world'), ['string', 'hello world']);
    assert.deepEqual(await func(13), ['number', 13]);
    assert.deepEqual(await func([1,2,3]), ['userdata', [1,2,3]]);

    // Some fairly simply objects
    assert.deepEqual(convertBack(await funcConvert([1,2,true,undefined,null,,3])), ['table', [1,2,true,,,,3]]);
    assert.deepEqual(convertBack(await funcConvert({'a': 1, 'b': '2', 'c': true, 'd': undefined, 'e': null})), ['table', {'a': 1, 'b': '2', 'c': true}]);

    // Some more nested things
    assert.deepEqual(convertBack(await funcConvert({'a': 1, 'b': [4,{'x':5,'y':[6,9,42]},6], 'c': true})), ['table', {'a': 1, 'b': [4,{'x':5,'y':[6,9,42]},6], 'c': true}]);
});

test('allows awaiting JS promises (CommonJS)', async () => {
    const L = await LuaJS.newState();
    await L.run('return js.await');
});
