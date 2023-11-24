interface LuaNative {
    lua_type(state: EmscriptenPointer, pos: number): number;
    js_tonumber(state: EmscriptenPointer, pos: number): number;
    js_tostring(state: EmscriptenPointer, pos: number): string;
    jslua_toref(state: EmscriptenPointer, pos: number): number;
    jslua_popvar(state: EmscriptenPointer, pos: number): number;
    js_drop(state: EmscriptenPointer, arg1: number): void;
    lua_pushnil(state: EmscriptenPointer): void;
    lua_pushboolean(state: EmscriptenPointer, arg1: number): void;
    lua_pushnumber(state: EmscriptenPointer, arg: number): void;
    lua_pushlstring(state: EmscriptenPointer, argPtr: EmscriptenPointer, argLen: number): void;
    jslua_pushvar(state: EmscriptenPointer, arg1: any, func: number): void;
    lua_settop(state: EmscriptenPointer, arg1: number): void;
    js_pop_ref(state: EmscriptenPointer): number;
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

declare var global: unknown;

(function () {
    let _GLOBAL;
    if (typeof window !== 'undefined') {
        _GLOBAL = window;
    } else if (global) {
        _GLOBAL = global;
    }

    function mustMalloc(size: number): EmscriptenPointer {
        const ptr = Module._malloc(size);
        if (!ptr) {
            throw new Error('Out of memory');
        }
        return ptr;
    }

    function importFromC(arr: [keyof LuaNative, string, string[], opts?: { async: boolean }][]): LuaNative {
        const target: Partial<LuaNative> = {};

        for (const val of arr) {
            const name = val[0];
            const returnType = val[1];
            const argTypes = val[2];
            const options = val[3];

            if (options) {
                target[name] = Module.cwrap(name, returnType, argTypes, options);
                continue;
            }

            const cfunc = (Module as unknown as any)[`_${name}`];
            if (!cfunc) {
                throw new Error(`Unknown C function ${name}`);
            }

            target[name] = cfunc;
        }

        return target as LuaNative;
    }

    let readyResolve: (() => void) | undefined = undefined;
    const readyPromise = new Promise<void>((resolve) => {
        readyResolve = resolve;
    });

    let luaNative: LuaNative | undefined = undefined;

    const luaStateTable: Record<number, LuaState> = {};

    const luaTypes = {
        nil: 0,
        bool: 1,
        boolean: 1,
        lightuserdata: 2,
        number: 3,
        string: 4,
        table: 5,
        function: 6,
        userdata: 7,
        thread: 8,
        coroutine: 8
    };

    const luaJSDataTypes = {
        unknown: 0,
        function: 1,
        array: 2,
        object: 3,
        symbol: 4,
    };

    const luaConstants = {
        LUA_REGISTRYINDEX: -10000,
        LUA_ENVIRONINDEX: -10001,
        LUA_GLOBALSINDEX: -10002,
        LUA_RIDX_GLOBALS: 2
    };

    type LuaTableRef =[unknown, number, number]

    let luaLastRefIdx = -1;
    const luaPassedVars = new Map<number, LuaTableRef>();
    const luaPassedVarsMap = new Map<unknown, LuaTableRef>();

    (() => {
        const globTbl: LuaTableRef = [_GLOBAL, 9999, -1];
        luaPassedVars.set(-1, globTbl);
        luaPassedVarsMap.set(_GLOBAL, globTbl);
    })();

    function getVarByRef(index: number) {
        return luaPassedVars.get(index)![0];
    }

    function luaGetVarPtr(varObj: unknown) {
        const ptr = luaPassedVarsMap.get(varObj);
        if (ptr) {
            ptr[1]++;
            return ptr[2];
        }

        const idx = ++luaLastRefIdx;
        const tbl: LuaTableRef = [varObj, 1, idx];
        luaPassedVars.set(idx, tbl);
        luaPassedVarsMap.set(varObj, tbl);
        return idx;
    }

    Module.__luaRemoveVarPtr = function luaRemoveVarPtr(varPtr: EmscriptenPointer) {
        const ptr = luaPassedVars.get(varPtr)!;

        if (ptr[1] > 1) {
            ptr[1]--;
            return;
        }

        luaPassedVars.delete(varPtr);
        luaPassedVarsMap.delete(ptr[2]);
    };

    function decodeSingle(state: EmscriptenPointer, pos: number, convertArgs = false): unknown {
        switch (luaNative!.lua_type(state, pos)) {
            case luaTypes.nil:
                return undefined;
            case luaTypes.number:
                return luaNative!.js_tonumber(state, pos);
            case luaTypes.string:
                return luaNative!.js_tostring(state, pos);
            case luaTypes.table:
                const tbl = new LuaTable(state, luaNative!.jslua_toref(state, pos));
                if (convertArgs) {
                    const ret = tbl.toObject(true, true);
                    tbl.unref();
                    return ret;
                }
                return tbl;
            case luaTypes.userdata:
                return getVarByRef(luaNative!.jslua_popvar(state, pos));
            case luaTypes.function:
                const ret = new LuaFunction(state, luaNative!.jslua_toref(state, pos));
                if (convertArgs) {
                    return ret.getClosure();
                }
                return ret;
            default:
                if (convertArgs) {
                    return undefined;
                }
                return new LuaReference(state, luaNative!.jslua_toref(state, pos));
        }
    }

    function decodeStack(state: EmscriptenPointer, stackSize: number , convertArgs = false) {
        const ret = [];
        for (let i = 0; i < stackSize; i++) {
            ret.unshift(decodeSingle(state, -1, convertArgs));
            luaNative!.js_drop(state, 1);
        }
        return ret;
    }

    function pushVar(state: EmscriptenPointer, arg: unknown) {
        if (arg === null || arg === undefined) {
            luaNative!.lua_pushnil(state);
            return;
        }

        switch (typeof arg) {
            case "boolean":
                luaNative!.lua_pushboolean(state, arg ? 1 : 0);
                break;
            case "number":
                luaNative!.lua_pushnumber(state, arg);
                break;
            case "string":
                const argLen = lengthBytesUTF8(arg);
                const argC = mustMalloc(argLen + 1);
                try {
                    stringToUTF8(arg, argC, argLen + 1);
                    luaNative!.lua_pushlstring(state, argC, argLen);
                } finally {
                    Module._free(argC);
                }
                break;
            case "function":
                luaNative!.jslua_pushvar(state, luaGetVarPtr(arg), luaJSDataTypes.function);
                break;
            default:
                if (arg instanceof LuaReference) {
                    arg.push(state);
                } else if (arg instanceof Array) {
                    luaNative!.jslua_pushvar(state, luaGetVarPtr(arg), luaJSDataTypes.array);
                } else {
                    luaNative!.jslua_pushvar(state, luaGetVarPtr(arg), luaJSDataTypes.object);
                }
                break;
        }
    }

    Module.__luaCallFunctionPointer = function luaCallFunctionPointer(funcPtr: EmscriptenPointer, state: EmscriptenPointer, stackSize: number, convertArgs: boolean, callWithNew: boolean) {
        const func = getVarByRef(funcPtr) as Function;
        let variables: unknown[];
        let variablesRaw: unknown[];
        let funcThis: unknown | undefined;

        if (stackSize > 0) {
            variablesRaw = decodeStack(state, stackSize, convertArgs);
            funcThis = variablesRaw[0];
            variables = variablesRaw.slice(1);
        } else {
            funcThis = undefined;
            variables = [];
            variablesRaw = [];
        }

        try {
            if (callWithNew) {
                pushVar(state, new (func as unknown as any)(...variablesRaw));
                return 1;
            }

            pushVar(state, func.apply(funcThis, variables));
            return 1;
        } catch (e) {
            pushVar(state, e);
            return 0;
        }
    };

    function initializeCFuncs() {
        luaNative = importFromC([
            ["jslua_call", "number", ["number", "number"]],
            ["jslua_delete_state", "", ["number"]],
            ["jslua_execute", "number", ["number", "number", "number", "number"], { async: true }],
            ["jslua_get_state_global", "number", ["number"]],
            ["jslua_new_state", "number", []],
            ["jslua_popvar", "", ["number", "number"]],
            ["jslua_pushref", "", ["number", "number"]],
            ["jslua_pushvar", "", ["number", "number", "number"]],
            ["jslua_toref", "number", ["number", "number"]],
            ["jslua_unref", "", ["number", "number"]],

            ["lua_createtable", "", ["number"]],
            ["lua_getmetatable", "number", ["number", "number"]],
            ["lua_gettable", "", ["number", "number"]],
            ["lua_gettop", "number", ["number"]],
            ["lua_next", "number", ["number", "number"]],
            ["lua_pushboolean", "", ["number", "boolean"]],
            ["lua_pushlstring", "", ["number", "number", "number"]],
            ["lua_pushnil", "", ["number"]],
            ["lua_pushnumber", "", ["number", "number"]],
            ["lua_pushvalue", "", ["number", "number"]],
            ["lua_rawset", "", ["number", "number"]],
            ["lua_rawseti", "", ["number", "number"]],
            ["lua_setmetatable", "number", ["number", "number"]],
            ["lua_settable", "", ["number", "number"]],
            ["lua_settop", "", ["number", "number"]],
            ["lua_tolstring", "number", ["number", "number", "number"]],
            ["lua_tonumberx", "number", ["number", "number", "number"]],
            ["lua_type", "number", ["number", "number"]],
        ]);

        const INT_SIZE = Module._jslua_init_sizeof_int();
        const SIZE_T_SIZE = Module._jslua_init_sizeof_size_t();
        const size_mapper = (numval: number, prefix: string) => `${prefix}${numval * 8}`;
        const INT_GETVALUE_TYPE = size_mapper(INT_SIZE, 'i');
        const SIZE_T_GETVALUE_TYPE = size_mapper(SIZE_T_SIZE, 'i'); // should change to "u", but not supported

        Module.__luaNative = luaNative;

        luaNative!.js_drop = function js_drop(state: EmscriptenPointer, n: number) {
            luaNative!.lua_settop(state, -n - 1);
        };

        luaNative!.js_pop_ref = function js_pop_ref(state: number) {
            const ref = luaNative!.jslua_toref(state, -1);
            luaNative!.js_drop(state, 1);
            return ref;
        };

        luaNative!.js_tostring = function js_tostring(state: number, i: number): string {
            const lenC = mustMalloc(SIZE_T_SIZE);
            try {
                const strC = luaNative!.lua_tolstring(state, i, lenC);
                const strLen = getValue(lenC, SIZE_T_GETVALUE_TYPE);
                const strJS = UTF8ToString(strC, strLen);
                return strJS;
            } finally {
                Module._free(lenC);
            }
        };

        luaNative!.js_tonumber = function js_tonumber(state, i) {
            const isNumberC = mustMalloc(INT_SIZE);
            try {
                const num = luaNative!.lua_tonumberx(state, i, isNumberC);
                const isNumber = getValue(isNumberC, INT_GETVALUE_TYPE);
                if (!isNumber) {
                    throw new Error("Not a number");
                }
                return num;
            } finally {
                Module._free(isNumberC);
            }
        };

        readyResolve!();
    }

    function luaUnref(objectRef: RefObject) {
        const index = objectRef.index;
        const state = objectRef.state;
        const stateGlobal = objectRef.stateGlobal;
        objectRef.state = undefined;
        objectRef.stateGlobal = undefined;
        objectRef.index = undefined;
        if (state === undefined || index === undefined || stateGlobal === undefined) {
            return;
        }

        const oldRef = luaStateTable[stateGlobal]!.refArray[index];
        if (!oldRef) {
            return;
        }
        if (oldRef !== objectRef) {
            return;
        }

        luaNative!.jslua_unref(state, index);
        delete luaStateTable[stateGlobal]!.refArray[index];
    }

    const luaRefFinalizer = new FinalizationRegistry(luaUnref);

    class LuaError extends Error {

    }

    interface RefObject {
        state: number | undefined;
        stateGlobal: number | undefined;
        index: number | undefined;
    }

    class LuaReference {
        protected refObj: RefObject
        stateGlobal: number;
        constructor(protected state: number, index: number) {
            const stateGlobal = luaNative!.jslua_get_state_global(state);
            this.refObj = {
                state,
                stateGlobal,
                index,
            };
            this.stateGlobal = stateGlobal;

            const oldRef = luaStateTable[stateGlobal]!.refArray[index];
            if (oldRef) {
                luaUnref(oldRef);
            }
            luaStateTable[stateGlobal]!.refArray[index] = this.refObj;

            luaRefFinalizer.register(this, this.refObj, this);
        }

        unref() {
            luaUnref(this.refObj);
            luaRefFinalizer.unregister(this);
        }

        push(state?: number) {
            if (state && state !== this.refObj.state) {
                throw new Error("Wrong Lua state");
            }
            luaNative!.jslua_pushref(this.refObj.state!, this.refObj.index!);
        }

        getmetatable() {
            this.push();
            luaNative!.lua_getmetatable(this.refObj.state!, -1);
            const ret = decodeSingle(this.refObj.state!, -1);
            luaNative!.js_drop(this.refObj.state!, 1);
            return ret;
        }

        setmetatable() {
            this.push();
            luaNative!.lua_setmetatable(this.refObj.state!, -1);
            luaNative!.js_drop(this.refObj.state!, 1);
        }
    }

    class LuaFunction  extends LuaReference {
        getClosure() {
            return LuaFunction.prototype.call.bind(this);
        }

        call(...args: unknown[]) {
            this.push(this.state);

            for (let i = 0; i < args.length; i++) {
                try {
                    pushVar(this.state, args[i]);
                } catch (e) {
                    for (; i >= 0; i--) {
                        luaNative!.js_drop(this.state, 1);
                    }
                    throw e;
                }
            }

            const stack = luaNative!.jslua_call(this.state, args.length);
            const ret = decodeStack(this.state, Math.abs(stack));
            if (stack < 0) {
                throw new LuaError(ret[0] as string);
            }

            return ret;
        }
    }

    class LuaTable extends LuaReference {
        set(key: unknown, value:unknown) {
            this.push();
            pushVar(this.state, key);
            pushVar(this.state, value);
            luaNative!.lua_settable(this.state, -3);
            luaNative!.js_drop(this.state, 1);

        }

        get(key: unknown) {
            this.push();
            pushVar(this.state, key);
            luaNative!.lua_gettable(this.state, -2);
            const ret = decodeSingle(this.state, -1);
            luaNative!.js_drop(this.state, 2);
            return ret;
        }

        toObject(recurse: boolean, unrefAll: boolean, maxDepth: number = 10) {
            this.push();
            luaNative!.lua_pushnil(this.state);
            const ret: Record<string, unknown> = {};
            while (luaNative!.lua_next(this.state, -2)) {
                luaNative!.lua_pushvalue(this.state, -2);
                const key = luaNative!.js_tostring(this.state, -1);
                const value = decodeSingle(this.state, -2);
                ret[key] = value;
                luaNative!.js_drop(this.state, 2);
            }
            luaNative!.js_drop(this.state, 1);


            if (recurse) {
                maxDepth--;

                for (const idx of Object.keys(ret)) {
                    const val = ret[idx];
                    if (val instanceof LuaTable && maxDepth > 0) {
                        ret[idx] = val.toObject(true, unrefAll, maxDepth);
                        val.unref();
                    } else if (unrefAll && val instanceof LuaReference) {
                        val.unref();
                        delete ret[idx];
                    }
                }
            }

            return ret;
        }
    }

    class LuaState {
        private state: number | undefined;
        private stateGlobal: number | undefined;

        public refArray: Record<number, RefObject>;
        public readyPromise: Promise<void>;
        constructor() {
            this.state = luaNative!.jslua_new_state();
            this.stateGlobal = luaNative!.jslua_get_state_global(this.state);
            this.refArray = {};
            luaStateTable[this.stateGlobal] = this;

            this.readyPromise = this.__run("dofile('/lua/init.lua')", '/lua/init.lua').then(() => undefined);
        }

        getTop() {
            return luaNative!.lua_gettop(this.state!);
        }

        unrefAll() {
            for (const ref of Object.values(this.refArray)) {
                luaUnref(ref);
            }
            this.refArray = {};
        }

        close() {
            this.unrefAll();
            luaNative!.jslua_delete_state(this.state!);
            delete luaStateTable[this.stateGlobal!];

            this.state = undefined;
            this.stateGlobal = undefined;
        }

        async run(code: string, blockName?: string) {
            await this.readyPromise;
            return await this.__run(code, blockName);
        }

        async __run(code: string, blockName?: string) {
            const codeLen = lengthBytesUTF8(code);
            const codeC = mustMalloc(codeLen + 1);
            const blockNameC = stringToNewUTF8(blockName || 'input');
            let stack;
            try {
                stringToUTF8(code, codeC, codeLen + 1);
                stack = await luaNative!.jslua_execute(this.state!, codeC, codeLen, blockNameC);
            } finally {
                Module._free(codeC);
                Module._free(blockNameC);
            }
            const ret = decodeStack(this.state!, Math.abs(stack));
            if (stack < 0) {
                throw new LuaError(ret[0] as string);
            }
            return ret;
        }

        getGlobalTable() {
            return new LuaTable(this.state!, luaConstants.LUA_RIDX_GLOBALS);
        }

        createTable() {
            luaNative!.lua_createtable(this.state!, 0, 0);
            return new LuaTable(this.state!, luaNative!.js_pop_ref(this.state!));
        }

        async __runNode(node: HTMLScriptElement) {
            let code = node.textContent ?? '';
            if (node.src) {
                const res = await fetch(node.src);
                code = await res.text();
            }
            await this.run(code, node.src || document.location.href);
        }

        async __tryRunNode(node: HTMLScriptElement) {
            try {
                await this.__runNode(node);
            } catch (e) {
                console.error("Error loading Lua script node", node, e);
            }
        }

        async loadDocumentScripts(doc: Document) {
            const xPathResult = document.evaluate('//script[@type="text/lua"]', doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

            let node;
            while (node = xPathResult.iterateNext()) {
                await this.__tryRunNode(node as HTMLScriptElement);
            }
        }

        listenForScripts(doc: Document) {
            const observer = new MutationObserver(async (mutations) => {
                for (const mutation of mutations)  {
                    if (mutation.type !== "childList") {
                        continue;
                    }

                    for (const node of mutation.addedNodes) {
                        if (!(node instanceof HTMLScriptElement)) {
                            continue;
                        }

                        if (!node.type) {
                            continue;
                        }

                        if (node.type.toLowerCase() !== "text/lua") {
                            continue;
                        }

                        await this.__tryRunNode(node);
                    }
                }
            });

            observer.observe(doc, {
                childList: true,
                subtree: true
            });
        }

        async enableLuaScriptTags(doc: Document) {
            this.listenForScripts(doc);
            await this.loadDocumentScripts(doc);
        }
    }

    Module.State = LuaState;
    Module.Function = LuaFunction;
    Module.Table = LuaTable;
    Module.Reference = LuaReference;
    Module.ready = readyPromise;
    Module.newState = async () => {
        await readyPromise;
        const L = new LuaState();
        await L.readyPromise;
        return L;
    }

    Module.__luaNative = luaNative!;
    Module.__pushVar = pushVar;
    Module.__getVarByRef = getVarByRef;
    Module.__decodeSingle = decodeSingle;
    Module.__onready = initializeCFuncs;
})();