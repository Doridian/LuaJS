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

typedef int boolean;
#define TRUE 1
#define FALSE 0

typedef char* (*LUA_CFP)(int funcPtr, lua_State *L, int stack_size, boolean convertArgs);
typedef char* (*LUA_RVP)(int varPtr);

LUA_CFP luaCallFunctionPointer;
LUA_RVP luaRemoveVarPtr;

void __jslua_set_fp(LUA_CFP cfp, LUA_RVP rfp) {
	luaCallFunctionPointer = cfp;
	luaRemoveVarPtr = rfp;
}

void jslua_pop_top(lua_State *L) {
	lua_pop(L, 1);
}

#define	TYPE_JSFUNCTION	1
#define TYPE_JSARRAY	2
#define TYPE_JSOBJECT	3

struct TypedPointerData {
	int type;
	int ptr;
};

#define GET_LIB_GLOBAL(LIB, NAME) {\
	lua_getglobal(L, LIB); \
	lua_pushstring(L, NAME); \
	lua_rawget(L, -2); \
}
	
#define GET_LIB_GLOBAL_END() \
	lua_pop(L, 1);

void jslua_push_jsvar(lua_State *L, int varptr, int type) {
	struct TypedPointerData *data = (struct TypedPointerData*)lua_newuserdata(L, sizeof(struct TypedPointerData));
	data->ptr = varptr;
	data->type = type;
	
	if(type == TYPE_JSFUNCTION)
		GET_LIB_GLOBAL("js", "__mt_js_function")
	else
		GET_LIB_GLOBAL("js", "__mt_js_object")
	
	lua_setmetatable(L, -3);
	GET_LIB_GLOBAL_END();
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
	return EM_ASM_INT({
		__luajs_push_var($0, eval(Pointer_stringify($1)));
		return 1;
	}, L, str);
}

#define GET_TypedPointerData() \
	struct TypedPointerData *data = (struct TypedPointerData*)lua_touserdata(L, 1); \
	lua_remove(L, 1);

static int luajs_call(lua_State *L) {
	GET_TypedPointerData();
	
	if(data->type != TYPE_JSFUNCTION) {
		lua_pushstring(L, "Invalid type");
		lua_error(L);
		return 1;
	}
	
	luaCallFunctionPointer(data->ptr, L, lua_gettop(L), TRUE);
	return 1;
}

static int luajs_jsobject__gc(lua_State *L) {
	GET_TypedPointerData();
	luaRemoveVarPtr(data->ptr);
	return 0;
}

static int luajs_jsobject__index(lua_State *L) {
	const char *str = lua_tostring(L, -1);
	lua_pop(L, 1);
	GET_TypedPointerData();
	return EM_ASM_INT({
		var val = __luajs_get_var_by_ref($1);
		__luajs_push_var($0, val[Pointer_stringify($2)], val);
		return 1;
	}, L, data->ptr, str);
}

static int luajs_jsobject__newindex(lua_State *L) {
	int refIdx = luaL_ref(L, LUA_REGISTRYINDEX);
	
	const char *str = lua_tostring(L, -1);
	lua_pop(L, 1);
	GET_TypedPointerData();
	
	lua_rawgeti(L, LUA_REGISTRYINDEX, refIdx);
	int ret = EM_ASM_INT({
		__luajs_get_var_by_ref($1)[Pointer_stringify($2)] = __luajs_decode_single($0, -1, true);
		return 0;
	}, L, data->ptr, str);
	lua_pop(L, 1);
	luaL_unref(L, LUA_REGISTRYINDEX, refIdx);
	
	return ret;
}

lua_State* jslua_new_state() {
	lua_State* L = luaL_newstate();  /* create state */
	lua_gc(L, LUA_GCSTOP, 0);  /* stop collector during initialization */
	luaL_openlibs(L);  /* open libraries */
	lua_gc(L, LUA_GCRESTART, 0);
	
	//Load CJSON
	luaopen_cjson(L);
	lua_setglobal(L, "json");
	
	//Load myself
	lua_newtable(L);
	
	lua_pushstring(L, "eval");
	lua_pushcfunction(L, luajs_eval);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "call");
	lua_pushcfunction(L, luajs_call);
	lua_rawset(L, -3);
	
	//Create metatables (object)
	lua_pushstring(L, "__mt_js_object");
	lua_newtable(L);
	
	lua_pushstring(L, "__gc");
	lua_pushcfunction(L, luajs_jsobject__gc);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__index");
	lua_pushcfunction(L, luajs_jsobject__index);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__newindex");
	lua_pushcfunction(L, luajs_jsobject__newindex);
	lua_rawset(L, -3);
	
	lua_rawset(L, -3);
	//END: Create metatables
	
	//Create metatables (function)
	lua_pushstring(L, "__mt_js_function");
	lua_newtable(L);
	
	lua_pushstring(L, "__gc");
	lua_pushcfunction(L, luajs_jsobject__gc);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__call");
	lua_pushcfunction(L, luajs_call);
	lua_rawset(L, -3);
	
	lua_rawset(L, -3);
	//END: Create metatables
	
	lua_setglobal(L, "js");
	//END: Load myself
	
	lua_getglobal(L, "js");
	
	lua_pushstring(L, "global");
	jslua_push_jsvar(L, -1, TYPE_JSOBJECT);
	lua_rawset(L, -3);
	
	lua_pop(L, 1);
	
	return L;
}

void jslua_delete_state(lua_State* L) {
	lua_close(L);
}

int main() {
  emscripten_exit_with_live_runtime();
  return 0;
}
