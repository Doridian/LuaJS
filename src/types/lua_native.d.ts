interface LuaNativeFromC {
    luajs_alloc_int(): EmscriptenPointer;
    luajs_alloc_size_t(): EmscriptenPointer;
    luajs_call(state: EmscriptenPointer, length: number): number;
    luajs_delete_state(state: EmscriptenPointer): void;
    luajs_execute(state: EmscriptenPointer, codeC: number, codeLen: number, blockNameC: any): unknown;
    luajs_get_state_global(state: EmscriptenPointer): number;
    luajs_new_state(): EmscriptenPointer;
    luajs_noref(): number;
    luajs_popvar(state: EmscriptenPointer, pos: number): number;
    luajs_pushref(state: EmscriptenPointer, index: number): void;
    luajs_pushvar(state: EmscriptenPointer, arg1: any, func: number): void;
    luajs_read_int(ptr: EmscriptenPointer): number;
    luajs_read_size_t(ptr: EmscriptenPointer): number;
    luajs_toref(state: EmscriptenPointer, pos: number): number;
    luajs_unref(state: EmscriptenPointer, index: any): void;
    lua_createtable(state: EmscriptenPointer, arg1: number, arg2: number): void;
    lua_getmetatable(state: EmscriptenPointer, arg1: number): number;
    lua_gettable(state: EmscriptenPointer, arg1: number): void;
    lua_gettop(state: EmscriptenPointer): number;
    lua_next(state: EmscriptenPointer, arg1: number): number;
    lua_pushboolean(state: EmscriptenPointer, arg1: number): void;
    lua_pushlstring(state: EmscriptenPointer, argPtr: EmscriptenPointer, argLen: number): void;
    lua_pushnil(state: EmscriptenPointer): void;
    lua_pushnumber(state: EmscriptenPointer, arg: number): void;
    lua_pushvalue(state: EmscriptenPointer, arg1: number): void;
    lua_rawset(state: EmscriptenPointer, arg1: number): void;
    lua_rawseti(state: EmscriptenPointer, arg1: number): void;
    lua_setmetatable(state: EmscriptenPointer, arg1: number): number;
    lua_settable(state: EmscriptenPointer, arg1: number): void;
    lua_settop(state: EmscriptenPointer, arg1: number): void;
    lua_toboolean(state: EmscriptenPointer, arg1: number): number;
    lua_tolstring(state: EmscriptenPointer, i: number, lenC: number): number;
    lua_tonumberx(state: EmscriptenPointer, i: any, isNumberC: number): number;
    lua_type(state: EmscriptenPointer, pos: number): number;
}

interface LuaNative extends LuaNativeFromC {
    js_tonumber(state: EmscriptenPointer, pos: number): number;
    js_tostring(state: EmscriptenPointer, pos: number): string;
    js_drop(state: EmscriptenPointer, arg1: number): void;
    js_pop_ref(state: EmscriptenPointer): number;

    LUA_NOREF: number;
}

type EmscriptenLuaNative = {
    [k in keyof LuaNativeFromC as `_${k}`]: LuaNativeFromC[k];
};

interface luajsConstructor {
    new (...params: unknown): unknown;
}
type luajsFunction = Function & luajsConstructor;
