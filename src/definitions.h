#ifndef _DEFINITIONS_H_INCLUDED

#include <string.h>

#define lua_c

#include "lauxlib.h"
#include "lua.h"
#include "lualib.h"

#include <emscripten.h>

#define TYPE_JSUNKNOWN 0
#define TYPE_JSFUNCTION 1
#define TYPE_JSARRAY 2
#define TYPE_JSOBJECT 3

typedef struct TypedPointerData {
  int type;
  int ptr;
} TypedPointerData;

#define _DEFINITIONS_H_INCLUDED
#endif
