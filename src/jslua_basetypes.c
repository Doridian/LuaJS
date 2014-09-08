#include "definitions.h"

#include "jslua_basetypes.h"

const char* jslua_pop_string(lua_State *L) {
	const char *str = lua_tostring(L, -1);
	lua_pop(L, 1);
	return str;
}

void jslua_push_string(lua_State *L, char *str) {
	lua_pushstring(L, str);
}

double jslua_pop_number(lua_State *L) {
	double num = lua_tonumber(L, -1);
	lua_pop(L, 1);
	return num;
}

void jslua_push_number(lua_State *L, double num) {
	lua_pushnumber(L, num);
}

int jslua_toref(lua_State *L, int index) {
	lua_pushvalue(L, index);
	return luaL_ref(L, LUA_REGISTRYINDEX);
}

void jslua_push_ref(lua_State *L, int index) {
	lua_rawgeti(L, LUA_REGISTRYINDEX, index);
}

void jslua_unref(lua_State *L, int index) {
	return luaL_unref(L, LUA_REGISTRYINDEX, index);
}
