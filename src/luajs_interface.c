#include "definitions.h"
#include "luajs_interface.h"

EM_JS(void, xluaRemoveVarPtr, (int varPtr), {
    Module.__luaRemoveVarPtr(varPtr);
});

void luaRemoveVarPtr(int varPtr) {
    xluaRemoveVarPtr(varPtr);
}

EM_JS(int, xluaCallFunctionPointer, (int func_ptr, lua_State *L, int stack_size, int convert_args, int call_with_new), {
    return Module.__luaCallFunctionPointer(func_ptr, L, stack_size, convert_args, call_with_new);
});

int luaCallFunctionPointer(int func_ptr, lua_State *L, int stack_size, int convert_args, int call_with_new) {
    return xluaCallFunctionPointer(func_ptr, L, stack_size, convert_args, call_with_new);
}
