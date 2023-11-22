#include "definitions.h"

#include "jslua_async.h"
#include "jsvar_function.h"

int jslua_yield_done(lua_State *L, int status, lua_KContext ctx) {
  lua_pushnil(L);
  return 1;
}

int jslua_coroutine(lua_State *L) {
    lua_pushcfunction(L, jslua_yield_done);
}
