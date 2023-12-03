#pragma once

#include "definitions.h"

int luaCallFunctionPointer(int funcPtr, lua_State *L, int stack_size, int convertArgs, int call_with_new);
void luaRemoveVarPtr(int varPtr);
