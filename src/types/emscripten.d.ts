type EmscriptenPointer = number;
interface EmscriptenModule {
    cwrap(name: string, returnType: string, argTypes: string[], options: { async: boolean; }): Todo;
    __pushVar: (state: number, arg: any) => void;
    __onready: () => void;
    _free(strC: EmscriptenPointer): unknown;
    _malloc(size: number): EmscriptenPointer;
}

interface LibraryManager {
    library: object;
}

var Module: EmscriptenModule;
var LibraryManager: LibraryManager;

function lengthBytesUTF8(str: string): number;
function stringToUTF8(str: string, ptr: EmscriptenPointer, maxBytes: number): void;
function UTF8ToString(ptr: EmscriptenPointer, maxBytes?: number): string;
function getValue(ptr: EmscriptenPointer, size: string, noSafe?: boolean): number;
function stringToNewUTF8(str: string): EmscriptenPointer;
function mergeInto(obj: object, other: object, options?: { noOverride?: boolean }): object; 
// extensions
interface EmscriptenModule {
    __luaRemoveVarPtr: (varPtr: number) => void;
    __luaCallFunctionPointer: (funcPtr: number, state: number, stackSize: number, convertArgs: boolean, callWithNew: boolean) => 1 | 0;
    _jslua_init_sizeof_int(): number;
    _jslua_init_sizeof_size_t(): number;
    __decodeSingle: (state: number, pos: number, convertArgs?: boolean) => unknown;
    __getVarByRef: (index: number) => any;
    newState: () => Promise<LuaState>;

    __luaNative: LuaNative;
    State: typeof LuaState;
    Function: typeof LuaFunction;
    Table: typeof LuaTable;
    Reference: typeof LuaReference;
    ready: Promise<unknown>;

}
