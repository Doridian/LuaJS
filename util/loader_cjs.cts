import type { LuaState } from '../dist/luajs.cjs';

class LuaJS {
    public async newState(): Promise<LuaState> {
        await loadPromise;
        return (Module as LuaJS).newState();
    }
}

const Module = {};
const loadPromise = (async () => {
    const { default : moduleCtor } = await import('../dist/luajs.mjs');
    await moduleCtor(Module);
})();

const luaJS = new LuaJS();
export { luaJS as LuaJS };
export type { LuaTable, LuaFunction, LuaState } from '../dist/luajs.cjs';
