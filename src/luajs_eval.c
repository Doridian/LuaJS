#include "definitions.h"

#include "luajs_eval.h"

int luajs_call(lua_State *L, int argcount) {
  int stack = lua_gettop(L) - (argcount + 1);

  int errindex = -argcount - 2;

  lua_getglobal(L, "debug");
  lua_getfield(L, -1, "traceback");
  lua_remove(L, -2);
  lua_insert(L, errindex);

  int had_error = lua_pcall(L, argcount, LUA_MULTRET, errindex);
  lua_remove(L, 1);
  int stack_len = lua_gettop(L) - stack;

  if (had_error) {
    return -stack_len;
  }
  return stack_len;
}

int luajs_execute(lua_State *L, char *str, size_t len, char *name) {
  luaL_loadbuffer(L, str, len, name);
  if (lua_isstring(L, -1)) {
    return -1;
  }

  return luajs_call(L, 0);
}

int luajs_js_eval(lua_State *L) {
  const char *str = lua_tostring(L, -1);
  lua_pop(L, 1);
  EM_ASM({ Module.__pushVar($0, eval(Module.UTF8ToString($1))); }, L, str);
  return 1;
}
