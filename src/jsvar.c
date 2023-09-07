#include "definitions.h"
#include "jsvar_definitions.h"

#include "jsvar.h"

#define GET_LIB_GLOBAL(LIB, NAME)                                              \
  {                                                                            \
    lua_getglobal(L, LIB);                                                     \
    lua_pushstring(L, NAME);                                                   \
    lua_rawget(L, -2);                                                         \
  }

void luajs_jsvar_init(lua_State *L) {
  lua_pushstring(L, "__mt_js_unknown");
  lua_newtable(L);

  luaL_Reg reg_unknown[] = {{"__is_javascript", luajs_jsvar__is_javascript},
                            {"__gc", luajs_jsvar__gc},
                            {"__eq", luajs_jsvar__eq},
                            {"jstype", luajs_jsvar_jstype},

                            {NULL, NULL}};
  luaL_setfuncs(L, reg_unknown, 0);

  lua_rawset(L, -3);
}

void jslua_getmetatable(lua_State *L, int type) {
  switch (type) {
  case TYPE_JSFUNCTION:
    GET_LIB_GLOBAL("js", "__mt_js_function")
    break;
  case TYPE_JSOBJECT:
    GET_LIB_GLOBAL("js", "__mt_js_object")
    break;
  case TYPE_JSARRAY:
    GET_LIB_GLOBAL("js", "__mt_js_array")
    break;
  default:
    GET_LIB_GLOBAL("js", "__mt_js_unknown")
    break;
  }
}

void jslua_pushvar(lua_State *L, int varptr, int type) {
  TypedPointerData *data =
      (TypedPointerData *)lua_newuserdata(L, sizeof(TypedPointerData));
  data->ptr = varptr;
  data->type = type;

  jslua_getmetatable(L, type);

  lua_setmetatable(L, -3);

  lua_pop(L, 1);
}

int jslua_popvar(lua_State *L, int pos) {
  PEEK_SelfTypedPointerData(pos);
  return data->ptr;
}

int luajs_jsvar__is_javascript(lua_State *L) {
  int isJS = lua_isuserdata(L, -1);
  lua_pop(L, 1);
  lua_pushboolean(L, isJS);
  return 1;
}

int luajs_jsvar__eq(lua_State *L) {
  GET_SelfTypedPointerData();
  GET_TypedPointerData(-1, other);

  lua_pushboolean(L, data->ptr == other->ptr);

  return 1;
}

int luajs_jsvar__gc(lua_State *L) {
  GET_SelfTypedPointerData();
  luaRemoveVarPtr(data->ptr);
  return 0;
}

int luajs_jsvar_jstype(lua_State *L) {
  GET_SelfTypedPointerData();
  EM_ASM(
      {
        const val = Module.__getVarByRef($1);
        Module.__pushVar($0, typeof val);
      },
      L, data->ptr);
  return 1;
}
