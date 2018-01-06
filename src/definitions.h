#ifndef _DEFINITIONS_H_INCLUDED

#include <string.h>

#define lua_c

#include "lua.h"
#include "lauxlib.h"
#include "lualib.h"

#include <emscripten.h>

typedef int boolean;
#define TRUE 1
#define FALSE 0

#define TYPE_JSUNKNOWN		0
#define TYPE_JSFUNCTION		1
#define TYPE_JSARRAY		2
#define TYPE_JSOBJECT		3

typedef struct TypedPointerData {
	int type;
	int ptr;
} TypedPointerData;

extern char* luaCallFunctionPointer(int funcPtr, lua_State *L, int stack_size, boolean convertArgs);
extern char* luaRemoveVarPtr(int varPtr);

#define _DEFINITIONS_H_INCLUDED
#endif
