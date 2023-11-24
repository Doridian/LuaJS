#ifndef _LUAJS_INTERFACE_H_INCLUDED

#include "definitions.h"

int luaCallFunctionPointer(int funcPtr, lua_State *L, int stack_size, int convertArgs, int call_with_new);
void luaRemoveVarPtr(int varPtr);

#define _LUAJS_INTERFACE_H_INCLUDED
#endif
