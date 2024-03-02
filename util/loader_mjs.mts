import { default as moduleCtor, LuaJS } from '../dist/luajs.mjs';

const Module = {};
await moduleCtor(Module);
const LuaJSInstance = Module as LuaJS;
export { LuaJSInstance as LuaJS };
export type { LuaTable, LuaFunction, LuaState } from '../dist/luajs.mjs';
