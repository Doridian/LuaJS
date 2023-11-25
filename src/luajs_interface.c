#include "definitions.h"
#include "luajs_interface.h"

EM_JS(void, luaRemoveVarPtr, (int varPtr), {
    Module.__luaRemoveVarPtr(varPtr);
});

EM_JS(int, luaCallFunctionPointer, (int func_ptr, lua_State *L, int stack_size, int convert_args, int call_with_new), {
    return Module.__luaCallFunctionPointer(func_ptr, L, stack_size, convert_args, call_with_new);
});
