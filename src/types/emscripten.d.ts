type EmscriptenPointer = number;
interface EmscriptenModule {
    cwrap<K extends keyof LuaNativeFromC>(name: K, returnType: string, argTypes: string[], options: { async: boolean; }): LuaNativeFromC[K];

    _free(strC: EmscriptenPointer): unknown;
    _malloc(size: number): EmscriptenPointer;
}

function lengthBytesUTF8(str: string): number;
function stringToUTF8(str: string, ptr: EmscriptenPointer, maxBytes: number): void;
function UTF8ToString(ptr: EmscriptenPointer, maxBytes?: number): string;
function getValue(ptr: EmscriptenPointer, size: string, noSafe?: boolean): number;
function stringToNewUTF8(str: string): EmscriptenPointer;

// extensions
interface EmscriptenModule {
    __luaRemoveVarPtr: (varPtr: number) => void;
    __luaCallFunctionPointer: (funcPtr: number, state: number, stackSize: number, convertArgs: boolean, callWithNew: boolean) => 1 | 0;
    __decodeSingle: (state: number, pos: number, convertArgs?: boolean) => unknown;
    __getVarByRef: (index: number) => any;
    newState: () => Promise<LuaState>;
    __pushVar: (state: number, arg: any) => void;
    __onready: () => void;

    __luaNative: LuaNative;
    State: typeof LuaState;
    Function: typeof LuaFunction;
    Table: typeof LuaTable;
    Reference: typeof LuaReference;
    ready: Promise<unknown>;
    UNKNOWN_LUA_REFERENCE: Symbol;
}

declare var Module: EmscriptenModule & EmscriptenLuaNative;
