#include "definitions.h"

#include "jslua_eval.h"

int jslua_call(lua_State *L, int argcount) {
	int stack = lua_gettop(L) - (argcount + 1);
	
	int errindex = -argcount - 2;
	
	lua_getglobal(L, "debug");
	lua_getfield(L, -1, "traceback");
	lua_remove(L, -2);
	lua_insert(L, errindex);
	
	if (lua_pcall(L, argcount, LUA_MULTRET, errindex)) {
		lua_remove(L, 1);
		return -(lua_gettop(L) - stack);
	}
	lua_remove(L, 1);
	return lua_gettop(L) - stack;
}

int jslua_execute(lua_State *L, char* str) {
	luaL_loadbuffer(L, str, strlen(str), "input");
	if(lua_isstring(L, -1)) {
		return -1;
	}
	
	return jslua_call(L, 0);
}
