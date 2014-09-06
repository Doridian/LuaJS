#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define lua_c

#include "lua.h"
#include "lauxlib.h"
#include "lualib.h"

#include <emscripten.h> 

int json_decode(lua_State *l);
int json_encode(lua_State *l);
int luaopen_cjson(lua_State *l);

typedef char* (*LUA_CFP)(void* funcPtr, lua_State *L, int stack_size);

LUA_CFP luaCallFunctionPointer;

void __jslua_set_cfp(LUA_CFP fp) {
	luaCallFunctionPointer = fp;
}

void jslua_pop_top(lua_State *L) {
	lua_pop(L, 1);
}

enum DataType {
	TYPE_JSFUNCTION,
	TYPE_JSARRAY,
	TYPE_JSOBJECT
};

struct TypedPointerData {
	int type;
	void *ptr;
};

void jslua_push_function(lua_State *L, void *funcpointer) {
	struct TypedPointerData *data = (struct TypedPointerData*)lua_newuserdata(L, sizeof(struct TypedPointerData));
	data->ptr = funcpointer;
	data->type = TYPE_JSFUNCTION;
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

static int luajs_eval(lua_State *L) {
	const char *str = lua_tostring(L, -1);
	lua_pop(L, 1);
	char *ret = (char*)EM_ASM_INT({
		var code = Pointer_stringify($0);
		var retJS = JSON.stringify(eval(code));
		if(!retJS)
			retJS = "";
		ret = Runtime.stackAlloc(retJS.length + 1);
		writeStringToMemory(retJS, ret);
		return ret;
	}, str);
	lua_pushstring(L, ret);
	return 1;
}

#define GET_LIB_GLOBAL(LIB, NAME) \
	lua_getglobal(L, LIB); \
	lua_pushstring(L, NAME); \
	lua_rawget(L, -2);
	
#define GET_LIB_GLOBAL_END() \
	lua_pop(L, 2);

static int luajs_call(lua_State *L) {
	struct TypedPointerData *data = (struct TypedPointerData*)lua_touserdata(L, 1);
	lua_remove(L, 1);
	
	if(data->type != TYPE_JSFUNCTION) {
		lua_pushstring(L, "Invalid type");
		lua_error(L);
		return 1;
	}
	
	char* jsonRes = luaCallFunctionPointer(data->ptr, L, lua_gettop(L));
	
	GET_LIB_GLOBAL("json", "decode");
	lua_pushstring(L, jsonRes);
	lua_call(L, 1, 1);
	lua_remove(L, 1);
	return 1;
}

lua_State* jslua_new_state() {
	lua_State* L = luaL_newstate();  /* create state */
	lua_gc(L, LUA_GCSTOP, 0);  /* stop collector during initialization */
	luaL_openlibs(L);  /* open libraries */
	lua_gc(L, LUA_GCRESTART, 0);
	
	luaopen_cjson(L);
	lua_setglobal(L, "json");
	
	lua_newtable(L);
	
	lua_pushstring(L, "eval");
	lua_pushcfunction(L, luajs_eval);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "call");
	lua_pushcfunction(L, luajs_call);
	lua_rawset(L, -3);
	
	lua_setglobal(L, "js");
	
	return L;
}

void jslua_delete_state(lua_State* L) {
	lua_close(L);
}

int main() {
  emscripten_exit_with_live_runtime();
  return 0;
}
