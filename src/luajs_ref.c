#include "definitions.h"

#include "luajs_ref.h"

int luajs_toref(lua_State *L, int index) {
  lua_pushvalue(L, index);
  return luaL_ref(L, LUA_REGISTRYINDEX);
}

int luajs_noref() {
  return LUA_NOREF;
}

void luajs_pushref(lua_State *L, int index) {
  lua_rawgeti(L, LUA_REGISTRYINDEX, index);
}

void luajs_unref(lua_State *L, int index) {
  return luaL_unref(L, LUA_REGISTRYINDEX, index);
}
