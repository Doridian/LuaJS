#include "definitions.h"
#include "jsvar_definitions.h"
#include "jsvar.h"

#include "jsvar_object.h"

void luajs_jsobject_init(lua_State *L) {
	lua_pushstring(L, "__mt_js_object");
	lua_newtable(L);
	
	luaL_Reg reg_object[] = {
		{"__gc", luajs_jsvar__gc},
		{"__index", luajs_jsobject__index},
		{"__newindex", luajs_jsobject__newindex},
		{"toTable", luajs_jsobject_toTable},
		{"__isJavascript", luajs_jsvar__isJavascript},
		{NULL, NULL}
	};
	luaL_setfuncs(L, reg_object, 0);
	
	lua_rawset(L, -3);
}

int luajs_jsobject__index(lua_State *L) {
	const char *val = lua_tostring(L, -1);
	lua_pop(L, 1);
	
	GET_TypedPointerData();
	
	jslua_get_metatable(L, data->type);
	lua_pushstring(L, val);
	
	lua_rawget(L, -2);
	lua_remove(L, 1);
	lua_remove(L, 1);
	
	if(lua_isnil(L, -1))
		lua_pop(L, 1);
	else
		return 1;
	
	return EM_ASM_INT({
		const str = UTF8ToString($2);
		const val = LuaJS.__getVarByRef($1);
		LuaJS.__pushVar($0, val[str]);
		return 1;
	}, L, data->ptr, val);
}

int luajs_jsobject__newindex(lua_State *L) {
	int refIdx = luaL_ref(L, LUA_REGISTRYINDEX);
	
	const char *val = lua_tostring(L, -1);
	lua_pop(L, 1);
	
	GET_TypedPointerData();
	
	lua_rawgeti(L, LUA_REGISTRYINDEX, refIdx);
	int ret = EM_ASM_INT({
		const str = UTF8ToString($2);
		LuaJS.__getVarByRef($1)[str] = LuaJS.__decodeSingle($0, -1, true);
		return 0;
	}, L, data->ptr, val);
	lua_pop(L, 1);
	luaL_unref(L, LUA_REGISTRYINDEX, refIdx);
	
	return ret;
}

int luajs_jsobject_toTable(lua_State *L) {
	GET_TypedPointerData();
	
	lua_newtable(L);
	
	EM_ASM_INT({
		const obj = LuaJS.__getVarByRef($1);
		
		for(const idx in obj) {
			if(!obj.hasOwnProperty(idx)) {
				continue;
			}

			if(typeof idx == "number") {
				LuaJS.__pushVar($0, array[idx]);
				LuaJS.__luaNative.rawseti($0, -2, idx);
			} else {
				LuaJS.__pushVar($0, idx);
				LuaJS.__pushVar($0, obj[idx]);
				LuaJS.__luaNative.rawset($0, -3);
			}
		}
		
		return 0;
	}, L, data->ptr);
	
	return 1;
}
