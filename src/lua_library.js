mergeInto(LibraryManager.library, {
	luaRemoveVarPtr: function(varPtr) {
		Module.__luaRemoveVarPtr(varPtr);
	},
	luaCallFunctionPointer: function(funcPtr, state, stack_size, convertArgs) {
		Module.__luaCallFunctionPointer(funcPtr, state, stack_size, convertArgs);
	},
});

