#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define lua_c

#include "lua.h"
#include "lauxlib.h"
#include "lualib.h"

#include <emscripten.h> 

void jslua_pop_top(lua_State *L) {
	lua_pop(L, 1);
}

void jslua_empty_stack(lua_State *L) {
	lua_settop(L, 0);
}

enum DataType {
	TYPE_JSFUNCTION
};

struct TypedPointerData {
	int type;
	void *ptr;
};

void jslua_push_function(lua_State *L, void *funcpointer) {
	struct TypedPointerData *a = (struct TypedPointerData *)lua_newuserdata(L, sizeof(struct TypedPointerData));
	a->ptr = funcpointer;
	a->type = TYPE_JSFUNCTION;
}

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

lua_State* jslua_new_state() {
	lua_State* L = luaL_newstate();  /* create state */
	lua_gc(L, LUA_GCSTOP, 0);  /* stop collector during initialization */
	luaL_openlibs(L);  /* open libraries */
	lua_gc(L, LUA_GCRESTART, 0);
	return L;
}

void jslua_delete_state(lua_State* L) {
	lua_close(L);
}

int main() {
  emscripten_exit_with_live_runtime();
  return 0;
}
