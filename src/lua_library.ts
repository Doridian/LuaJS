mergeInto(LibraryManager.library, {
    luaRemoveVarPtr: function (varPtr: EmscriptenPointer) {
        Module.__luaRemoveVarPtr(varPtr);
    },
    luaCallFunctionPointer: function (funcPtr: EmscriptenPointer, state: EmscriptenPointer, stackSize: number, convertArgs: boolean, callWithNew: boolean) {
        return Module.__luaCallFunctionPointer(funcPtr, state, stackSize, convertArgs, callWithNew);
    },
});
