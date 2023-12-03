#include "definitions.h"
#include "jsvar.h"
#include "jsvar_definitions.h"

#include "jsvar_object.h"

void luajs_jsobject_init(lua_State *L) {
  lua_pushstring(L, "__mt_js_object");
  lua_newtable(L);

  luaL_Reg reg_object[] = {{"__index", luajs_jsobject__index},
                           {"__newindex", luajs_jsobject__newindex},
                           {"toTable", luajs_jsobject_toTable},

                           {"__is_javascript", luajs_jsvar__is_javascript},
                           {"__gc", luajs_jsvar__gc},
                           {"__eq", luajs_jsvar__eq},
                           {"jstype", luajs_jsvar_jstype},

                           {NULL, NULL}};
  luaL_setfuncs(L, reg_object, 0);

  lua_rawset(L, -3);
}

static int luajs_jsobject__index_nonstring(lua_State *L) {
  GET_SelfTypedPointerData();

  EM_ASM(
    {
      const idx = Module.__decodeSingle($0, -1, true);
      const val = Module.__getVarByRef($1);
      Module.__pushVar($0, val[idx]);
    },
    L, data->ptr);
  return 1;
}

int luajs_jsobject__index(lua_State *L) {
  if (!lua_isstring(L, -1)) {
    return luajs_jsobject__index_nonstring(L);
  }

  const char *idx = lua_tostring(L, -1);
  lua_pop(L, 1);

  GET_SelfTypedPointerData();

  jslua_getmetatable(L, data->type);
  lua_pushstring(L, idx);

  lua_rawget(L, -2);
  lua_remove(L, 1);
  lua_remove(L, 1);

  if (!lua_isnil(L, -1)) {
    return 1;
  }

  lua_pop(L, 1);

  EM_ASM(
    {
      const str = UTF8ToString($2);
      const val = Module.__getVarByRef($1);
      Module.__pushVar($0, val[str]);
    },
    L, data->ptr, idx);
  return 1;
}

int luajs_jsobject__newindex(lua_State *L) {
  int refIdx = luaL_ref(L, LUA_REGISTRYINDEX);

  GET_SelfTypedPointerData();

  lua_rawgeti(L, LUA_REGISTRYINDEX, refIdx);
  EM_ASM(
    {
      const idx = Module.__decodeSingle($0, -2, true);
      const val = Module.__decodeSingle($0, -1, true);
      Module.__getVarByRef($1)[idx] = val;
    },
    L, data->ptr);
  lua_pop(L, 1);
  luaL_unref(L, LUA_REGISTRYINDEX, refIdx);

  return 0;
}

int luajs_jsobject_toTable(lua_State *L) {
  GET_SelfTypedPointerData();

  lua_newtable(L);

  EM_ASM(
    {
      const obj = Module.__getVarByRef($1);

      for (const idx in obj) {
        if (!obj.hasOwnProperty(idx)) {
          continue;
        }

        Module.__pushVar($0, idx);
        Module.__pushVar($0, obj[idx]);
        Module.__luaNative.lua_rawseti($0, -3);
        Module.__luaNative.js_drop($0, 1);
      }
    },
    L, data->ptr);

  return 1;
}
