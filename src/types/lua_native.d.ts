interface LuaNativeFromC {
    lua_type(state: EmscriptenPointer, pos: number): number;
    jslua_toref(state: EmscriptenPointer, pos: number): number;
    jslua_popvar(state: EmscriptenPointer, pos: number): number;
    lua_pushnil(state: EmscriptenPointer): void;
    lua_pushboolean(state: EmscriptenPointer, arg1: number): void;
    lua_pushnumber(state: EmscriptenPointer, arg: number): void;
    lua_pushlstring(state: EmscriptenPointer, argPtr: EmscriptenPointer, argLen: number): void;
    jslua_pushvar(state: EmscriptenPointer, arg1: any, func: number): void;
    lua_settop(state: EmscriptenPointer, arg1: number): void;
    lua_tolstring(state: EmscriptenPointer, i: number, lenC: number): number;
    lua_tonumberx(state: EmscriptenPointer, i: any, isNumberC: number): number;
    jslua_unref(state: EmscriptenPointer, index: any): void;
    jslua_get_state_global(state: EmscriptenPointer): number;
    jslua_pushref(state: EmscriptenPointer, index: number): void;
    lua_getmetatable(state: EmscriptenPointer, arg1: number): number;
    lua_setmetatable(state: EmscriptenPointer, arg1: number): number;
    jslua_call(state: EmscriptenPointer, length: number): number;
    lua_settable(state: EmscriptenPointer, arg1: number): void;
    lua_gettable(state: EmscriptenPointer, arg1: number): void;
    lua_next(state: EmscriptenPointer, arg1: number): number;
    lua_pushvalue(state: EmscriptenPointer, arg1: number): void;
    jslua_new_state(): EmscriptenPointer;
    lua_gettop(state: EmscriptenPointer): number;
    jslua_delete_state(state: EmscriptenPointer): void;
    jslua_execute(state: EmscriptenPointer, codeC: number, codeLen: number, blockNameC: any): any;
    lua_createtable(state: EmscriptenPointer, arg1: number, arg2: number): void;
    lua_rawset(state: EmscriptenPointer, arg1: number): void;
    lua_rawseti(state: EmscriptenPointer, arg1: number): void;
}

interface LuaNative extends LuaNativeFromC {
    js_tonumber(state: EmscriptenPointer, pos: number): number;
    js_tostring(state: EmscriptenPointer, pos: number): string;
    js_drop(state: EmscriptenPointer, arg1: number): void;
    js_pop_ref(state: EmscriptenPointer): number;
}

type EmscriptenLuaNative = {
    [k in keyof LuaNativeFromC as `_${k}`]: LuaNativeFromC[k];
};

interface JSLuaConstructor {
    new (...params: unknown): unknown;
}
type JSLuaFunction = Function & JSLuaConstructor;
