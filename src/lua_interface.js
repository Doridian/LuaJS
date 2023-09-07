(function () {
    let _GLOBAL;
    if (typeof window !== 'undefined') {
        _GLOBAL = window;
    } else if (global) {
        _GLOBAL = global;
    }

    const primitiveTypes = new Set(["number", "boolean", ""]);

    const specialCFuncs = {
        ['PRIMITIVE;PRIMITIVE,string']: (func, prim, strJS, ...args) => {
            const strC = stringToNewUTF8(strJS);
            try {
                return func(prim, strC, ...args);
            } finally {
                _free(strC);
            }
        },
        ['string;']: (func, ...args) => {
            return UTF8ToString(func(...args));
        },
    };

    function _formatCType(typ) {
        if (primitiveTypes.has(typ)) {
            return 'PRIMITIVE';
        }
        return typ;
    }

    function importFromC(arr) {
        const target = {};

        for (const val of arr) {
            const name = val[0];
            const returnType = val[1];
            const argTypes = val[2];

            const cfunc = _GLOBAL[`_${name}`];

            let onlyPrimitives = primitiveTypes.has(returnType);
            let lastNonPrimitive = -1;

            let i = -1;
            for (const argType of argTypes) {
                i++;
                if (primitiveTypes.has(argType)) {
                    continue;
                }

                onlyPrimitives = false;
                lastNonPrimitive = i;
            }

            if (onlyPrimitives) {
                target[name] = cfunc;
                continue;
            }

            const searchString = `${_formatCType(returnType)};${argTypes.slice(0, lastNonPrimitive + 1).map(_formatCType).join(',')}`;
            const cfuncWrapped = specialCFuncs[searchString];
            if (!cfuncWrapped) {
                throw new Error(`Unknown complex type C handler for ${searchString}`);
            }
            target[name] = cfuncWrapped.bind(undefined, cfunc);
        }

        return target;
    }

    const eventEmitter = new EventTarget();

    let luaNative = undefined;

    const luaStateTable = {};

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

    let luaLastRefIdx = -1;
    const luaPassedVars = new Map();
    const luaPassedVarsMap = new Map();

    (() => {
        const globTbl = [_GLOBAL, 9999, -1];
        luaPassedVars.set(-1, globTbl);
        luaPassedVarsMap.set(_GLOBAL, globTbl);
    })();

    function getVarByRef(index) {
        return luaPassedVars.get(index)[0];
    }

    function luaGetVarPtr(varObj) {
        const ptr = luaPassedVarsMap.get(varObj);
        if (ptr) {
            ptr[1]++;
            return ptr[2];
        }

        const idx = ++luaLastRefIdx;
        const tbl = [varObj, 1, idx];
        luaPassedVars.set(idx, tbl);
        luaPassedVarsMap.set(varObj, tbl);
        return idx;
    }

    Module.__luaRemoveVarPtr = function luaRemoveVarPtr(varPtr) {
        const ptr = luaPassedVars.get(varPtr);

        if (ptr[1] > 1) {
            ptr[1]--;
            return;
        }

        luaPassedVars.delete(varPtr);
        luaPassedVarsMap.delete(ptr[2]);
    };

    function decodeSingle(state, pos, convertArgs) {
        switch (luaNative.lua_type(state, pos)) {
            case luaTypes.nil:
                return undefined;
            case luaTypes.number:
                return luaNative.js_tonumber(state, pos);
            case luaTypes.string:
                return luaNative.js_tostring(state, pos);
            case luaTypes.table:
                const tbl = new LuaTable(state, luaNative.jslua_toref(state, pos));
                if (convertArgs) {
                    const ret = tbl.toObject(true, true);
                    tbl.unref();
                    return ret;
                }
                return tbl;
            case luaTypes.userdata:
                return getVarByRef(luaNative.jslua_popvar(state, pos));
            case luaTypes.function:
                const ret = new LuaFunction(state, luaNative.jslua_toref(state, pos));
                if (convertArgs) {
                    return ret.getClosure();
                }
                return ret;
            default:
                if (convertArgs) {
                    return undefined;
                }
                return new LuaReference(state, luaNative.jslua_toref(state, pos));
        }
    }

    function decodeStack(state, stackSize, convertArgs) {
        const ret = [];
        for (let i = 0; i < stackSize; i++) {
            ret.unshift(decodeSingle(state, -1, convertArgs));
            luaNative.js_drop(state, 1);
        }
        return ret;
    }

    function pushVar(state, arg, ref) {
        if (arg === null || arg === undefined) {
            luaNative.lua_pushnil(state);
            return;
        }

        switch (typeof arg) {
            case "boolean":
                luaNative.lua_pushboolean(state, arg ? 1 : 0);
                break;
            case "number":
                luaNative.lua_pushnumber(state, arg);
                break;
            case "string":
                luaNative.lua_pushstring(state, arg);
                break;
            case "function":
                luaNative.jslua_pushvar(state, luaGetVarPtr(arg, ref), luaJSDataTypes.function);
                break;
            default:
                if (arg instanceof LuaReference) {
                    arg.push(state);
                } else if (arg instanceof Array) {
                    luaNative.jslua_pushvar(state, luaGetVarPtr(arg, ref), luaJSDataTypes.array);
                } else {
                    luaNative.jslua_pushvar(state, luaGetVarPtr(arg, ref), luaJSDataTypes.object);
                }
                break;
        }
    }

    function luaCallFunction(func, state, stackSize, convertArgs, callWithNew) {
        let variables, variablesRaw, funcThis;

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
            return;
        }

        pushVar(state, func.apply(funcThis, variables));
    }

    Module.__luaCallFunctionPointer = function luaCallFunctionPointer(funcPtr, state, stackSize, convertArgs, callWithNew) {
        return luaCallFunction(getVarByRef(funcPtr), state, stackSize, convertArgs, callWithNew);
    };

    function initializeCFuncs() {
        luaNative = importFromC([
            ["jslua_execute", "number", ["number", "string"]],
            ["jslua_call", "number", ["number", "number"]],
            ["jslua_new_state", "number", []],
            ["jslua_delete_state", "", ["number"]],
            ["jslua_pushvar", "", ["number", "number", "number"]],
            ["jslua_popvar", "", ["number", "number"]],
            ["jslua_toref", "number", ["number", "number"]],
            ["jslua_pushref", "", ["number", "number"]],
            ["jslua_unref", "", ["number", "number"]],

            ["lua_settop", "", ["number", "number"]],
            ["lua_gettop", "number", ["number"]],
            ["lua_type", "number", ["number", "number"]],
            ["lua_pushstring", "", ["number", "string"]],
            ["lua_pushnumber", "", ["number", "number"]],
            ["lua_pushboolean", "", ["number", "boolean"]],
            ["lua_gettable", "", ["number", "number"]],
            ["lua_settable", "", ["number", "number"]],
            ["lua_createtable", "", ["number"]],
            ["lua_pushvalue", "", ["number", "number"]],
            ["lua_pushnil", "", ["number"]],
            ["lua_next", "", ["number", "number"]],
            ["lua_tolstring", "string", ["number", "number", "number"]],
            ["lua_tonumberx", "number", ["number", "number", "number"]],
            ["lua_getmetatable", "number", ["number", "number"]],
            ["lua_setmetatable", "number", ["number", "number"]],
            ["lua_rawseti", "", ["number", "number"]],
            ["lua_rawset", "", ["number", "number"]],
        ]);

        _GLOBAL.LuaJS.__luaNative = luaNative;

        luaNative.js_drop = function js_drop(state, n) {
            luaNative.lua_settop(state, -n - 1);
        };

        luaNative.js_pop_ref = function js_pop_ref(state) {
            const ref = luaNative.jslua_toref(state, -1);
            luaNative.js_drop(state, 1);
            return ref;
        };

        luaNative.js_tostring = function js_tostring(state, i) {
            return luaNative.lua_tolstring(state, i, 0);
        };

        luaNative.js_tonumber = function js_tonumber(state, i) {
            return luaNative.lua_tonumberx(state, i, 0);
        };

        eventEmitter.dispatchEvent(new Event("ready"));
    }

    function luaUnref(objectRef) {
        const index = objectRef.index;
        const state = objectRef.state;
        objectRef.state = undefined;
        objectRef.index = undefined;
        if (state === undefined || index === undefined) {
            return;
        }

        const oldRef = luaStateTable[state].refArray[index];
        if (!oldRef) {
            return;
        }
        if (oldRef !== objectRef) {
            return;
        }

        luaNative.jslua_unref(state, index);
        delete luaStateTable[state].refArray[index];
    }

    const luaRefFinalizer = new FinalizationRegistry(luaUnref);

    class LuaError extends Error {

    }

    class LuaReference {
        constructor(state, index) {
            this.refObj = {
                state,
                index,
            };
            this.state = state;

            const oldRef = luaStateTable[state].refArray[index];
            if (oldRef) {
                luaUnref(oldRef);
            }
            luaStateTable[state].refArray[index] = this.refObj;

            luaRefFinalizer.register(this, this.refObj, this);
        }

        unref() {
            luaUnref(this.refObj);
            luaRefFinalizer.unregister(this);
        }

        push(state) {
            if (state && state != this.refObj.state) {
                throw new Error("Wrong Lua state");
            }
            luaNative.jslua_pushref(this.refObj.state, this.refObj.index);
        }

        getmetatable() {
            this.push();
            luaNative.lua_getmetatable(this.refObj.state, -1);
            const ret = decodeSingle(this.refObj.state, -1);
            luaNative.js_drop(this.refObj.state, 1);
            return ret;
        }

        setmetatable() {
            this.push();
            luaNative.lua_setmetatable(this.refObj.state, -1);
            luaNative.js_drop(this.refObj.state, 1);
        }
    }

    class LuaFunction  extends LuaReference {
        getClosure() {
            return LuaFunction.prototype.call.bind(this);
        }

        call(...args) {
            this.push(this.state);

            for (let i = 0; i < args.length; i++) {
                try {
                    pushVar(this.state, args[i])
                } catch (e) {
                    for (; i >= 0; i--) {
                        luaNative.js_drop(this.state, 1);
                    }
                    throw e;
                }
            }

            const stack = luaNative.jslua_call(this.state, args.length);
            const ret = decodeStack(this.state, Math.abs(stack));
            if (stack < 0) {
                throw new LuaError(ret[0]);
            }

            return ret;
        }
    }

    class LuaTable extends LuaReference {
        set(key, value) {
            this.push();
            pushVar(this.state, key);
            pushVar(this.state, value);
            luaNative.lua_settable(this.state, -3);
            luaNative.js_drop(this.state, 1);

        }

        get(key) {
            this.push();
            pushVar(this.state, key);
            luaNative.lua_gettable(this.state, -2);
            const ret = decodeSingle(this.state, -1);
            luaNative.js_drop(this.state, 2);
            return ret;
        }

        toObject(recurse, unrefAll, maxDepth) {
            this.push();
            luaNative.lua_pushnil(this.state);
            const ret = {};
            while (luaNative.lua_next(this.state, -2)) {
                luaNative.lua_pushvalue(this.state, -2);
                const key = luaNative.js_tostring(this.state, -1);
                const value = decodeSingle(this.state, -2);
                ret[key] = value;
                luaNative.js_drop(this.state, 2);
            }
            luaNative.js_drop(this.state, 1);

            if (!maxDepth) {
                maxDepth = 10;
            }

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
        constructor() {
            this.state = luaNative.jslua_new_state();
            this.refArray = {};
            luaStateTable[this.state] = this;

            this.run("dofile('/lua/init.lua')");
        }

        getTop() {
            return luaNative.lua_gettop(this.state);
        }

        unrefAll() {
            for (const ref of this.refArray) {
                luaUnref(ref);
            }
            this.refArray = {};
        }

        close() {
            this.unrefAll();
            luaNative.jslua_delete_state(this.state);
            delete luaStateTable[this.state];
            this.state = undefined;
        }

        run(code) {
            const stack = luaNative.jslua_execute(this.state, code);
            const ret = decodeStack(this.state, Math.abs(stack));
            if (stack < 0) {
                throw new LuaError(ret[0]);
            }
            return ret;
        }

        getGlobalTable() {
            return new LuaTable(this.state, luaConstants.LUA_RIDX_GLOBALS);
        }

        createTable() {
            luaNative.lua_createtable(this.state, 0, 0);
            return new LuaTable(this.state, luaNative.js_pop_ref(this.state));
        }

        async __runNode(node) {
            let code = node.textContent;
            if (node.src) {
                const res = await fetch(node.src);
                code = await res.text();
            }
            this.run(code);
        }

        async __tryRunNode(node) {
            try {
                await this.__runNode(node);
            } catch (e) {
                console.error("Error loading Lua script node", node, e);
            }
        }

        async loadDocumentScripts(doc) {
            const xPathResult = document.evaluate('//script[@type="text/lua"]', doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            const scriptPromises = [];

            let node;
            while (node = xPathResult.iterateNext()) {
                await this.__tryRunNode(node);
            }
        }

        listenForScripts(doc) {
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

        async enableLuaScriptTags(doc) {
            this.listenForScripts(doc);
            await this.loadDocumentScripts(doc);
        }
    }

    _GLOBAL.LuaJS = {
        State: LuaState,
        Function: LuaFunction,
        Table: LuaTable,
        Reference: LuaReference,

        addEventListener: eventEmitter.addEventListener.bind(eventEmitter),
        removeEventListener: eventEmitter.removeEventListener.bind(eventEmitter),

        __luaNative: luaNative,
        __pushVar: pushVar,
        __getVarByRef: getVarByRef,
        __decodeSingle: decodeSingle,
        __onready: initializeCFuncs,
    };
})();
