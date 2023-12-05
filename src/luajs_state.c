#include "definitions.h"
#include "luajs_eval.h"
#include "luajs_async.h"

#include "jsvar.h"
#include "jsvar_array.h"
#include "jsvar_object.h"
#include "jsvar_function.h"

#include <lstate.h>

lua_State *luajs_new_state() {
  lua_State *L = luaL_newstate(); /* create state */
  lua_gc(L, LUA_GCSTOP, 0);       /* stop collector during initialization */
  luaL_openlibs(L);               /* open libraries */
  lua_gc(L, LUA_GCRESTART, 0);

  // Load myself
  lua_newtable(L);

  luaL_Reg reg_jsmain[] = {
    {"eval", luajs_js_eval},
    {"await", luajs_js_await},
    {NULL, NULL},
  };
  luaL_setfuncs(L, reg_jsmain, 0);

  luajs_jsarray_init(L);
  luajs_jsobject_init(L);
  luajs_jsfunction_init(L);
  luajs_jsvar_init(L);

  lua_setglobal(L, "js");
  // END: Load myself

  // Load js.global
  lua_getglobal(L, "js");

  lua_pushstring(L, "global");
  luajs_pushvar(L, -1, TYPE_JSOBJECT);
  lua_rawset(L, -3);

  lua_pop(L, 1);
  // END: Load js.global

  return L;
}

global_State *luajs_get_state_global(lua_State *L) {
    return G(L);
}

void luajs_delete_state(lua_State *L) {
    lua_close(L);
}
