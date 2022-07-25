#include "definitions.h"
#include "jsvar_definitions.h"
#include "jsvar.h"
#include "jsvar_object.h"

#include "jsvar_function.h"

void luajs_jsfunction_init(lua_State *L) {
	lua_pushstring(L, "__mt_js_function");
	lua_newtable(L);
	
	luaL_Reg reg_function[] = {
		{"__gc", luajs_jsvar__gc},
		{"__index", luajs_jsobject__index},
		{"__newindex", luajs_jsobject__newindex},
		{"__call", luajs_jsfunction__call},
		{"toTable", luajs_jsobject_toTable},
		{"__is_javascript", luajs_jsvar__is_javascript},
		{"__eq", luajs_jsvar__eq},
		{"jstype", luajs_jsvar_jstype},
		{NULL, NULL}
	};
	luaL_setfuncs(L, reg_function, 0);
	
	lua_rawset(L, -3);
}

int luajs_jsfunction__call(lua_State *L) {
	GET_SelfTypedPointerData();
	
	if(data->type != TYPE_JSFUNCTION) {
		lua_pushstring(L, "Invalid type");
		lua_error(L);
		return 1;
	}
	
	luaCallFunctionPointer(data->ptr, L, lua_gettop(L), TRUE);
	return 1;
}
