const loadPromise = (async () => {
    const { default : moduleCtor } = await import('../dist/luajs.mjs');
    return await moduleCtor();
})();

const LuaJS = {
    newState: async () => {
        const Module = await loadPromise;
        return Module.newState();
    }
};
export { LuaJS };
export type { LuaTable, LuaFunction, LuaState } from '../dist/luajs.cjs';
