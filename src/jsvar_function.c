#include "definitions.h"
#include "jsvar.h"
#include "jsvar_definitions.h"
#include "jsvar_object.h"

#include "jsvar_function.h"

void luajs_jsfunction_init(lua_State *L) {
  lua_pushstring(L, "__mt_js_function");
  lua_newtable(L);

  luaL_Reg reg_function[] = {{"__index", luajs_jsobject__index},
                             {"__newindex", luajs_jsobject__newindex},
                             {"toTable", luajs_jsobject_toTable},

                             {"new", luajs_jsfunction_new},
                             {"__call", luajs_jsfunction__call},

                             {"__is_javascript", luajs_jsvar__is_javascript},
                             {"__gc", luajs_jsvar__gc},
                             {"__eq", luajs_jsvar__eq},
                             {"jstype", luajs_jsvar_jstype},

                             {NULL, NULL}};
  luaL_setfuncs(L, reg_function, 0);

  lua_rawset(L, -3);
}

static int luajs_jsfunction__call_int(lua_State *L, boolean call_with_new) {
  GET_SelfTypedPointerData();

  if (data->type != TYPE_JSFUNCTION) {
    lua_pushstring(L, "Invalid type");
    lua_error(L);
    return 1;
  }

  luaCallFunctionPointer(data->ptr, L, lua_gettop(L), TRUE, call_with_new);
  return 1;
}

int luajs_jsfunction__call(lua_State *L) {
  return luajs_jsfunction__call_int(L, FALSE);
}

int luajs_jsfunction_new(lua_State *L) {
  return luajs_jsfunction__call_int(L, TRUE);
}
