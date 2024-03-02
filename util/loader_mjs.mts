import { default as moduleCtor } from '../dist/luajs.mjs';

const LuaJS = await moduleCtor();
export { LuaJS };
export type { LuaTable, LuaFunction, LuaState } from '../dist/luajs.mjs';
