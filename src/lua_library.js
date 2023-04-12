mergeInto(LibraryManager.library, {
    luaRemoveVarPtr: function (varPtr) {
        Module.__luaRemoveVarPtr(varPtr);
    },
    luaCallFunctionPointer: function (funcPtr, state, stackSize, convertArgs, callWithNew) {
        Module.__luaCallFunctionPointer(funcPtr, state, stackSize, convertArgs, callWithNew);
    },
});

