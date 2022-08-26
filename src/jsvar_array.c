#include "definitions.h"
#include "jsvar.h"
#include "jsvar_definitions.h"
#include "jsvar_object.h"

#include "jsvar_array.h"

void luajs_jsarray_init(lua_State *L) {
  lua_pushstring(L, "__mt_js_array");
  lua_newtable(L);

  luaL_Reg reg_array[] = {{"__index", luajs_jsarray__index},
                          {"__newindex", luajs_jsarray__newindex},
                          {"__len", luajs_jsarray__len},
                          {"__next", luajs_jsarray__next},
                          {"__inext", luajs_jsarray__next},
                          {"__pairs", luajs_jsarray__pairs},
                          {"__ipairs", luajs_jsarray__pairs},
                          {"toTable", luajs_jsarray_toTable},

                          {"__is_javascript", luajs_jsvar__is_javascript},
                          {"__gc", luajs_jsvar__gc},
                          {"__eq", luajs_jsvar__eq},
                          {"jstype", luajs_jsvar_jstype},

                          {NULL, NULL}};
  luaL_setfuncs(L, reg_array, 0);

  lua_rawset(L, -3);
}

int luajs_jsarray__index(lua_State *L) {
  if (!lua_isnumber(L, -1)) {
    return luajs_jsobject__index(L);
  }

  int num = lua_tonumber(L, -1) - 1;
  lua_pop(L, 1);

  GET_SelfTypedPointerData();

  EM_ASM(
      {
        const val = LuaJS.__getVarByRef($1);
        LuaJS.__pushVar($0, val[$2]);
      },
      L, data->ptr, num);
  return 1;
}

int luajs_jsarray__newindex(lua_State *L) {
  if (!lua_isnumber(L, -2)) {
    return luajs_jsobject__newindex(L);
  }

  int refIdx = luaL_ref(L, LUA_REGISTRYINDEX);

  int val = lua_tonumber(L, -1) - 1;
  lua_pop(L, 1);

  GET_SelfTypedPointerData();

  lua_rawgeti(L, LUA_REGISTRYINDEX, refIdx);
  EM_ASM({ LuaJS.__getVarByRef($1)[$2] = LuaJS.__decodeSingle($0, -1, true); },
         L, data->ptr, val);
  lua_pop(L, 1);
  luaL_unref(L, LUA_REGISTRYINDEX, refIdx);

  return 0;
}

int luajs_jsarray__len(lua_State *L) {
  GET_SelfTypedPointerData();

  int len = EM_ASM_INT({ return LuaJS.__getVarByRef($0).length; }, data->ptr);

  lua_pushnumber(L, len);
  return 1;
}

int luajs_jsarray__next(lua_State *L) {
  PEEK_SelfTypedPointerData(-2);

  int num =
      lua_tonumber(L, -1); // Lua begins at 1, therefor we do not do math here!

  lua_pushnil(
      L); // Push it to the stack so we can replace it later with the number

  int res = EM_ASM_INT(
      {
        const val = LuaJS.__getVarByRef($1);
        if ($2 >= val.length) {
          return -1;
        }
        LuaJS.__pushVar($0, val[$2]);
        return $2 + 1;
      },
      L, data->ptr, num);

  if (res < 0) {
    lua_pop(L, -1);
    return 0;
  }

  lua_pushnumber(L, res);
  lua_replace(L, -3); // Replace prepared nil with number
  return 2;
}

int luajs_jsarray__pairs(lua_State *L) {
  lua_pushcclosure(L, luajs_jsarray__next, 0);
  lua_pushvalue(L, -2);
  return 2;
}

int luajs_jsarray_toTable(lua_State *L) {
  GET_SelfTypedPointerData();

  lua_newtable(L);

  EM_ASM(
      {
        const arr = LuaJS.__getVarByRef($1);

        for (let i = 0; i < arr.length; i++) {
          LuaJS.__pushVar($0, arr[i]);
          LuaJS.__luaNative.lua_rawseti($0, -2, i + 1);
        }
      },
      L, data->ptr);

  return 1;
}
