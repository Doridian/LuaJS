#include "definitions.h"
#include "jsvar_definitions.h"
#include "jsvar_object.h"
#include "jsvar.h"

#include "jsvar_array.h"

void luajs_jsarray_init(lua_State *L) {
	lua_pushstring(L, "__mt_js_array");
	lua_newtable(L);

	luaL_Reg reg_array[] = {
		{"__gc", luajs_jsvar__gc},
		{"__index", luajs_jsarray__index},
		{"__newindex", luajs_jsarray__newindex},
		{"__len", luajs_jsarray__len},
		{"__pairs", luajs_jsarray__ipairs},
		{"__ipairs", luajs_jsarray__ipairs},
		{"toTable", luajs_jsobject_toTable},
		{"__isJavascript", luajs_jsvar__isJavascript},
		{NULL, NULL}
	};
	luaL_setfuncs(L, reg_array, 0);
	
	lua_rawset(L, -3);	
}

int luajs_jsarray__index(lua_State *L) {
	if(!lua_isnumber(L, -1))
		return luajs_jsobject__index(L);
	
	int num = lua_tonumber(L, -1);
	lua_pop(L, 1);

	GET_TypedPointerData();
	
	return EM_ASM_INT({
		var val = LuaJS.__getVarByRef($1);
		LuaJS.__pushVar($0, val[$2]);
		return 1;
	}, L, data->ptr, num);
}

int luajs_jsarray__newindex(lua_State *L) {
	if(!lua_isnumber(L, -2))
		return luajs_jsobject__newindex(L);
	
	int refIdx = luaL_ref(L, LUA_REGISTRYINDEX);
	
	int val = lua_tonumber(L, -1);
	lua_pop(L, 1);
	
	GET_TypedPointerData();
	
	lua_rawgeti(L, LUA_REGISTRYINDEX, refIdx);
	int ret = EM_ASM_INT({
		LuaJS.__getVarByRef($1)[$2] = LuaJS.__decodeSingle($0, -1, true);
		return 0;
	}, L, data->ptr, val);
	lua_pop(L, 1);
	luaL_unref(L, LUA_REGISTRYINDEX, refIdx);
	
	return ret;
}

int luajs_jsarray__len(lua_State *L) {
	GET_TypedPointerData();
	
	int len = EM_ASM_INT({
		return LuaJS.__getVarByRef($0).length;
	}, data->ptr);
	
	lua_pushnumber(L, len);
	return 1;
}

int luajs_jsarray__inext(lua_State *L) {
	PEEK_TypedPointerData(lua_upvalueindex(1));
	
	int num = lua_tonumber(L, -1);
	
	int res = EM_ASM_INT({
		var val = LuaJS.__getVarByRef($1);
		if($2 >= val.length)
			return 0;
		LuaJS.__pushVar($0, val[$2]);
		return $2 + 1;
	}, L, data->ptr, num);
	
	lua_pushnumber(L, res);
	lua_replace(L, -3);
	
	if(res)
		return 2;
		
	lua_pushnil(L);
	return 1;
}

int luajs_jsarray__ipairs(lua_State *L) {
	lua_pushcclosure(L, luajs_jsarray__inext, 1);
	return 1;
}
