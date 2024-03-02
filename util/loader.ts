import moduleCtor from '../dist/luajs.mjs';

const Module = {};
await moduleCtor(Module);
export default Module;
