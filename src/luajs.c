#include "definitions.h"

#include "jslua_eval.h"

#include "jsvar.h"
#include "jsvar_object.h"
#include "jsvar_function.h"
#include "jsvar_array.h"

int luajs_eval(lua_State *L) {
	const char *str = lua_tostring(L, -1);
	lua_pop(L, 1);
	return EM_ASM_INT({
		LuaJS.__push_var($0, eval(Pointer_stringify($1)));
		return 1;
	}, L, str);
}

lua_State* jslua_new_state() {
	lua_State* L = luaL_newstate();  /* create state */
	lua_gc(L, LUA_GCSTOP, 0);  /* stop collector during initialization */
	luaL_openlibs(L);  /* open libraries */
	lua_gc(L, LUA_GCRESTART, 0);
	
	//Load myself
	lua_newtable(L);
	
	luaL_Reg reg_jsmain[] = {
		{"eval", luajs_eval},
		{NULL, NULL}
	};
	luaL_setfuncs(L, reg_jsmain, 0);
	
	luajs_jsarray_init(L);
	luajs_jsobject_init(L);
	luajs_jsfunction_init(L);
	luajs_jsvar_init(L);
	
	lua_setglobal(L, "js");
	//END: Load myself
	
	//Load js.global
	lua_getglobal(L, "js");
	
	lua_pushstring(L, "global");
	jslua_push_jsvar(L, -1, TYPE_JSOBJECT);
	lua_rawset(L, -3);
	
	lua_pop(L, 1);
	//END: Load js.global
	
	return L;
}

void jslua_delete_state(lua_State* L) {
	lua_close(L);
}

int main() {
	EM_ASM({
		LuaJS.__onready();
		delete LuaJS.__onready;
	});
	emscripten_exit_with_live_runtime();
	return 0;
}
