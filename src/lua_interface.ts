declare var global: unknown;

(function () {
    let _GLOBAL;
    if (typeof window !== 'undefined') {
        _GLOBAL = window;
    } else if (global) {
        _GLOBAL = global;
    }

    const UNKNOWN_LUA_REFERENCE = Symbol("UNKNOWN_LUA_REFERENCE");

    function mustMalloc(size: number): EmscriptenPointer {
        const ptr = Module._malloc(size);
        if (!ptr) {
            throw new Error('Out of memory');
        }
        return ptr;
    }

    function importFromC<K  extends keyof LuaNativeFromC>(arr: [name: K, returnType: string, string[], opts?: { async: boolean }][]): LuaNative {
        const target: Partial<LuaNative> = {};

        for (const [name, returnType, argTypes, options] of arr) {
            if (options) {
                target[name] = Module.cwrap(name, returnType, argTypes, options);
                continue;
            }

            const cfunc = Module[`_${name}`];
            if (!cfunc) {
                throw new Error(`Unknown C function ${name}`);
            }

            target[name] = cfunc as LuaNativeFromC[K];
        }

        return target as LuaNative;
    }

    let readyResolve: (() => void) | undefined = undefined;
    const readyPromise = new Promise<void>((resolve) => {
        readyResolve = resolve;
    });

    let luaNative: LuaNative | undefined = undefined;

    const luaStateTable: Record<number, LuaState> = {};

    const enum LuaTypes {
        nil = 0,
        bool = 1,
        boolean = 1,
        lightuserdata = 2,
        number = 3,
        string = 4,
        table = 5,
        function = 6,
        userdata = 7,
        thread = 8,
        coroutine = 8
    };

    const enum LuaJSDataTypes {
        unknown = 0,
        function = 1,
        array = 2,
        object = 3,
        symbol = 4,
    };

    type LuaTableRef = [unknown, number, number];

    const LUA_RIDX_GLOBALS = 2;

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
        luaPassedVarsMap.delete(ptr[0]);
    };

    function decodeSingle(state: EmscriptenPointer, pos: number, convertArgs = false): unknown {
        switch (luaNative!.lua_type(state, pos)) {
            case LuaTypes.nil:
                return undefined;
            case LuaTypes.boolean:
                return luaNative!.lua_toboolean(state, pos) !== 0;
            case LuaTypes.number:
                return luaNative!.js_tonumber(state, pos);
            case LuaTypes.string:
                return luaNative!.js_tostring(state, pos);
            case LuaTypes.table:
                const tbl = new LuaTable(state, luaNative!.luajs_toref(state, pos));
                if (convertArgs) {
                    const ret = tbl.toObject(true, true);
                    tbl.unref();
                    return ret;
                }
                return tbl;
            case LuaTypes.userdata:
                return getVarByRef(luaNative!.luajs_popvar(state, pos));
            case LuaTypes.function:
                const ret = new LuaFunction(state, luaNative!.luajs_toref(state, pos));
                if (convertArgs) {
                    return ret.getClosure();
                }
                return ret;
            default:
                if (convertArgs) {
                    return undefined;
                }
                return new LuaReference(state, luaNative!.luajs_toref(state, pos));
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
                const argLen = Module.lengthBytesUTF8(arg);
                const argC = mustMalloc(argLen + 1);
                try {
                    Module.stringToUTF8(arg, argC, argLen + 1);
                    luaNative!.lua_pushlstring(state, argC, argLen);
                } finally {
                    Module._free(argC);
                }
                break;
            case "function":
                luaNative!.luajs_pushvar(state, luaGetVarPtr(arg), LuaJSDataTypes.function);
                break;
            default:
                if (arg instanceof LuaReference) {
                    arg.push(state);
                } else if (arg instanceof Array) {
                    luaNative!.luajs_pushvar(state, luaGetVarPtr(arg), LuaJSDataTypes.array);
                } else {
                    luaNative!.luajs_pushvar(state, luaGetVarPtr(arg), LuaJSDataTypes.object);
                }
                break;
        }
    }

    Module.__luaCallFunctionPointer = function luaCallFunctionPointer(funcPtr: EmscriptenPointer, state: EmscriptenPointer, stackSize: number, convertArgs: boolean, callWithNew: boolean) {
        try {
            const func = getVarByRef(funcPtr) as luajsFunction;
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

            if (callWithNew) {
                pushVar(state, new func(...variablesRaw));
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
            ["luajs_alloc_int", "number", []],
            ["luajs_alloc_size_t", "number", []],
            ["luajs_call", "number", ["number", "number"], { async: true }],
            ["luajs_delete_state", "", ["number"]],
            ["luajs_execute", "number", ["number", "number", "number", "number"], { async: true }],
            ["luajs_get_state_global", "number", ["number"]],
            ["luajs_new_state", "number", []],
            ["luajs_noref", "number", []],
            ["luajs_popvar", "", ["number", "number"]],
            ["luajs_pushref", "", ["number", "number"]],
            ["luajs_pushvar", "", ["number", "number", "number"]],
            ["luajs_read_int", "number", ["number"]],
            ["luajs_read_size_t", "number", ["number"]],
            ["luajs_toref", "number", ["number", "number"]],
            ["luajs_unref", "", ["number", "number"]],

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
            ["lua_toboolean", "number", ["number", "number"]],
            ["lua_tonumberx", "number", ["number", "number", "number"]],
            ["lua_type", "number", ["number", "number"]],
        ]);
        Module.__luaNative = luaNative;

        luaNative.js_drop = function js_drop(state: EmscriptenPointer, n: number) {
            luaNative!.lua_settop(state, -n - 1);
        };

        luaNative.js_pop_ref = function js_pop_ref(state: number) {
            const ref = luaNative!.luajs_toref(state, -1);
            luaNative!.js_drop(state, 1);
            return ref;
        };

        luaNative.js_tostring = function js_tostring(state: number, i: number): string {
            const lenC = luaNative!.luajs_alloc_size_t();
            try {
                const strC = luaNative!.lua_tolstring(state, i, lenC);
                const strLen = luaNative!.luajs_read_size_t(lenC);
                const strJS = Module.UTF8ToString(strC, strLen);
                return strJS;
            } finally {
                Module._free(lenC);
            }
        };

        luaNative.js_tonumber = function js_tonumber(state, i) {
            const isNumberC = luaNative!.luajs_alloc_int();
            try {
                const num = luaNative!.lua_tonumberx(state, i, isNumberC);
                const isNumber = luaNative!.luajs_read_int(isNumberC);
                if (!isNumber) {
                    throw new Error("Not a number");
                }
                return num;
            } finally {
                Module._free(isNumberC);
            }
        };

        luaNative.LUA_NOREF = luaNative.luajs_noref();

        readyResolve!();
    }

    function luaUnref(objectRef: RefObject) {
        if (objectRef.index == luaNative!.LUA_NOREF) {
            return;
        }
        objectRef.index = luaNative!.LUA_NOREF;

        const index = objectRef.index;
        const state = objectRef.state;
        const stateGlobal = objectRef.stateGlobal;

        const oldRef = luaStateTable[stateGlobal]!.refArray[index];
        if (!oldRef) {
            return;
        }
        if (oldRef !== objectRef) {
            return;
        }

        luaNative!.luajs_unref(state, index);
        delete luaStateTable[stateGlobal]!.refArray[index];
    }

    const luaRefFinalizer = new FinalizationRegistry(luaUnref);

    class LuaError extends Error {

    }

    interface RefObject {
        state: number;
        stateGlobal: number;
        index: number;
    }

    class LuaReference {
        protected refObj: RefObject;
        stateGlobal: number;

        constructor(protected state: number, index: number) {
            const stateGlobal = luaNative!.luajs_get_state_global(state);
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
            if (this.refObj.index === luaNative!.LUA_NOREF) {
                throw new Error("Reference already released");
            }
            if (state && state !== this.refObj.state) {
                throw new Error("Wrong Lua state");
            }
            luaNative!.luajs_pushref(this.refObj.state, this.refObj.index);
        }

        getmetatable() {
            this.push();
            luaNative!.lua_getmetatable(this.refObj.state, -1);
            const ret = decodeSingle(this.refObj.state, -1);
            luaNative!.js_drop(this.refObj.state, 1);
            return ret;
        }

        setmetatable() {
            this.push();
            luaNative!.lua_setmetatable(this.refObj.state, -1);
            luaNative!.js_drop(this.refObj.state, 1);
        }
    }

    class LuaFunction  extends LuaReference {
        getClosure(): (...args: unknown[]) => Promise<unknown[]> {
            return LuaFunction.prototype.call.bind(this);
        }

        async call(...args: unknown[]) {
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

            const stack = await luaNative!.luajs_call(this.state, args.length);
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

            let isArray = true;
            const retObj: Record<string, unknown> = {};
            const retArray: unknown[] = [];

            while (luaNative!.lua_next(this.state, -2)) {
                luaNative!.lua_pushvalue(this.state, -2);

                let value = decodeSingle(this.state, -2);

                if (recurse && maxDepth > 0 && value instanceof LuaTable) {
                    const newValue = value.toObject(true, unrefAll, maxDepth - 1);
                    value.unref();
                    value = newValue;
                }

                if (unrefAll && value instanceof LuaReference) {
                    value.unref();
                    value = UNKNOWN_LUA_REFERENCE;
                }

                if (isArray) {
                    const keyNumeric = luaNative!.lua_tonumberx(this.state, -1, 0);
                    if (keyNumeric > 0) {
                        retArray[keyNumeric - 1] = value;
                        luaNative!.js_drop(this.state, 2);
                        continue;
                    } else {
                        isArray = false;
                    }
                }

                const key = luaNative!.js_tostring(this.state, -1);
                retObj[key] = value;
                luaNative!.js_drop(this.state, 2);
            }

            luaNative!.js_drop(this.state, 1);

            if (isArray) {
                return retArray;
            }

            return retObj;
        }
    }

    class LuaState {
        private state: number | undefined;
        private stateGlobal: number | undefined;

        public refArray: Record<number, RefObject> = {};

        async open() {
            if (this.state) {
                throw new Error("Lua state already open");
            }

            this.state = luaNative!.luajs_new_state();
            this.stateGlobal = luaNative!.luajs_get_state_global(this.state);
            luaStateTable[this.stateGlobal] = this;

            await this.run("dofile('/lua/init.lua')", '/lua/init.lua');
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
            luaNative!.luajs_delete_state(this.state!);
            delete luaStateTable[this.stateGlobal!];

            this.state = undefined;
            this.stateGlobal = undefined;
        }

        async run(code: string, blockName?: string) {
            const codeLen = Module.lengthBytesUTF8(code);
            const codeC = mustMalloc(codeLen + 1);
            const blockNameC = Module.stringToNewUTF8(blockName || 'input');
            let stack: number | undefined;
            try {
                Module.stringToUTF8(code, codeC, codeLen + 1);
                stack = await luaNative!.luajs_execute(this.state!, codeC, codeLen, blockNameC) as number;
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
            return new LuaTable(this.state!, LUA_RIDX_GLOBALS);
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
            const nodesToLoad = [...doc.querySelectorAll('script[type="text/lua"]') as NodeListOf<HTMLScriptElement>];

            for (const node of nodesToLoad) {
                await this.__tryRunNode(node);
            }
        }

        listenForScripts(doc: Document) {
            const observer = new MutationObserver(async (mutations) => {
                const nodesToLoad: HTMLScriptElement[] = [];
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

                        nodesToLoad.push(node);
                    }
                }

                for (const node of nodesToLoad) {
                    await this.__tryRunNode(node);
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
    Module.newState = async () => {
        await readyPromise;
        const L = new LuaState();
        await L.open();
        return L;
    }

    Module.UNKNOWN_LUA_REFERENCE = UNKNOWN_LUA_REFERENCE;

    Module.__luaNative = luaNative!;
    Module.__pushVar = pushVar;
    Module.__getVarByRef = getVarByRef;
    Module.__decodeSingle = decodeSingle;
    Module.__onready = initializeCFuncs;
})();
