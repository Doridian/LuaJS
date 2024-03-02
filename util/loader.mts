import { default as moduleCtor, LuaJS } from '../dist/luajs.mjs';

const Module = {};
await moduleCtor(Module);
const LuaJSInstance = Module as LuaJS;
export { LuaJSInstance as LuaJS };

