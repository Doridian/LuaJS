#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define lua_c

#include "lua.h"
#include "lauxlib.h"
#include "lualib.h"

#include <emscripten.h> 

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

#define TYPE_JSUNKNOWN		0
#define	TYPE_JSFUNCTION		1
#define TYPE_JSARRAY		2
#define TYPE_JSOBJECT		3

typedef struct TypedPointerData {
	int type;
	int ptr;
} TypedPointerData;

#define GET_LIB_GLOBAL(LIB, NAME) {\
	lua_getglobal(L, LIB); \
	lua_pushstring(L, NAME); \
	lua_rawget(L, -2); \
}
	
#define GET_LIB_GLOBAL_END() \
	lua_pop(L, 1);

static void jslua_get_metatable(lua_State *L, int type) {
	switch(type) {
		case TYPE_JSFUNCTION:
			GET_LIB_GLOBAL("js", "__mt_js_function")
			break;
		case TYPE_JSOBJECT:
			GET_LIB_GLOBAL("js", "__mt_js_object")
			break;
		case TYPE_JSARRAY:
			GET_LIB_GLOBAL("js", "__mt_js_array")
			break;
		default:
			GET_LIB_GLOBAL("js", "__mt_js_unknown")
			break;
	}	
}

void jslua_push_jsvar(lua_State *L, int varptr, int type) {
	TypedPointerData *data = (TypedPointerData*)lua_newuserdata(L, sizeof(TypedPointerData));
	data->ptr = varptr;
	data->type = type;
	
	jslua_get_metatable(L, type);
	
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

#define PEEK_TypedPointerData(INDEX) \
	if(!lua_isuserdata(L, INDEX)) { \
		lua_pushstring(L, "Invalid self"); \
		lua_error(L); \
	} \
	TypedPointerData *data = (TypedPointerData*)lua_touserdata(L, INDEX);

#define GET_TypedPointerData() \
	PEEK_TypedPointerData(1); \
	lua_remove(L, 1);
	
int jslua_pop_jsvar(lua_State *L, int pos) {
	PEEK_TypedPointerData(pos);
	return data->ptr;
}

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

static int luajs_jsvar__gc(lua_State *L) {
	GET_TypedPointerData();
	luaRemoveVarPtr(data->ptr);
	return 0;
}

static int luajs_jsobject__index(lua_State *L) {
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
		$2 = Pointer_stringify($2);
		var val = __luajs_get_var_by_ref($1);
		__luajs_push_var($0, val[$2]);
		return 1;
	}, L, data->ptr, val);
}

static int luajs_jsobject__newindex(lua_State *L) {
	int refIdx = luaL_ref(L, LUA_REGISTRYINDEX);
	
	const char *val = lua_tostring(L, -1);
	lua_pop(L, 1);
	
	GET_TypedPointerData();
	
	lua_rawgeti(L, LUA_REGISTRYINDEX, refIdx);
	int ret = EM_ASM_INT({
		$2 = Pointer_stringify($2);
		__luajs_get_var_by_ref($1)[$2] = __luajs_decode_single($0, -1, true);
		return 0;
	}, L, data->ptr, val);
	lua_pop(L, 1);
	luaL_unref(L, LUA_REGISTRYINDEX, refIdx);
	
	return ret;
}

static int luajs_jsarray__index(lua_State *L) {
	if(!lua_isnumber(L, -1))
		return luajs_jsobject__index(L);
	
	int num = lua_tonumber(L, -1);
	lua_pop(L, 1);

	GET_TypedPointerData();
	
	return EM_ASM_INT({
		var val = __luajs_get_var_by_ref($1);
		__luajs_push_var($0, val[$2]);
		return 1;
	}, L, data->ptr, num);
}

static int luajs_jsarray__newindex(lua_State *L) {
	if(!lua_isnumber(L, -2))
		return luajs_jsobject__newindex(L);
	
	int refIdx = luaL_ref(L, LUA_REGISTRYINDEX);
	
	int val = lua_tonumber(L, -1);
	lua_pop(L, 1);
	
	GET_TypedPointerData();
	
	lua_rawgeti(L, LUA_REGISTRYINDEX, refIdx);
	int ret = EM_ASM_INT({
		__luajs_get_var_by_ref($1)[$2] = __luajs_decode_single($0, -1, true);
		return 0;
	}, L, data->ptr, val);
	lua_pop(L, 1);
	luaL_unref(L, LUA_REGISTRYINDEX, refIdx);
	
	return ret;
}

static int luajs_jsarray__len(lua_State *L) {
	GET_TypedPointerData();
	
	int len = EM_ASM_INT({
		return __luajs_get_var_by_ref($0).length;
	}, data->ptr);
	
	lua_pushnumber(L, len);
	return 1;
}

static int luajs_jsobject_toTable(lua_State *L) {
	GET_TypedPointerData();
	
	lua_newtable(L);
	
	EM_ASM_INT({
		var obj = __luajs_get_var_by_ref($1);
		
		for(var idx in obj) {
			if(!obj.hasOwnProperty(idx))
				continue;
			if(typeof idx == "number") {
				__luajs_push_var($0, array[idx]);
				__luajs_luaNative.rawseti($0, -2, idx);
			} else {
				__luajs_push_var($0, idx);
				__luajs_push_var($0, obj[idx]);
				__luajs_luaNative.rawset($0, -3);
			}
		}
		
		return 0;
	}, L, data->ptr);
	
	return 1;
}

static int luajs_jsarray__inext(lua_State *L) {
	PEEK_TypedPointerData(lua_upvalueindex(1));
	
	int num = lua_tonumber(L, -1);
	
	int res = EM_ASM_INT({
		var val = __luajs_get_var_by_ref($1);
		if($2 >= val.length)
			return 0;
		__luajs_push_var($0, val[$2]);
		return $2 + 1;
	}, L, data->ptr, num);
	
	lua_pushnumber(L, res);
	lua_replace(L, -3);
	
	if(res)
		return 2;
		
	lua_pushnil(L);
	return 1;
}

static int luajs_jsarray__ipairs(lua_State *L) {
	lua_pushcclosure(L, luajs_jsarray__inext, 1);
	return 1;
}

lua_State* jslua_new_state() {
	lua_State* L = luaL_newstate();  /* create state */
	lua_gc(L, LUA_GCSTOP, 0);  /* stop collector during initialization */
	luaL_openlibs(L);  /* open libraries */
	lua_gc(L, LUA_GCRESTART, 0);
	
	//Load myself
	lua_newtable(L);
	
	lua_pushstring(L, "eval");
	lua_pushcfunction(L, luajs_eval);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "call");
	lua_pushcfunction(L, luajs_call);
	lua_rawset(L, -3);
	
	//Create metatables (array)
	lua_pushstring(L, "__mt_js_array");
	lua_newtable(L);
	
	lua_pushstring(L, "__gc");
	lua_pushcfunction(L, luajs_jsvar__gc);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__index");
	lua_pushcfunction(L, luajs_jsarray__index);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__newindex");
	lua_pushcfunction(L, luajs_jsarray__newindex);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__len");
	lua_pushcfunction(L, luajs_jsarray__len);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__pairs");
	lua_pushcfunction(L, luajs_jsarray__ipairs);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__ipairs");
	lua_pushcfunction(L, luajs_jsarray__ipairs);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__isJavascript");
	lua_pushboolean(L, TRUE);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "toTable");
	lua_pushcfunction(L, luajs_jsobject_toTable);
	lua_rawset(L, -3);
	
	lua_rawset(L, -3);
	//END: Create metatables
	
	//Create metatables (object)
	lua_pushstring(L, "__mt_js_object");
	lua_newtable(L);
	
	lua_pushstring(L, "__gc");
	lua_pushcfunction(L, luajs_jsvar__gc);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__index");
	lua_pushcfunction(L, luajs_jsobject__index);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__newindex");
	lua_pushcfunction(L, luajs_jsobject__newindex);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "toTable");
	lua_pushcfunction(L, luajs_jsobject_toTable);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__isJavascript");
	lua_pushboolean(L, TRUE);
	lua_rawset(L, -3);
	
	lua_rawset(L, -3);
	//END: Create metatables
	
	//Create metatables (function)
	lua_pushstring(L, "__mt_js_function");
	lua_newtable(L);
	
	lua_pushstring(L, "__gc");
	lua_pushcfunction(L, luajs_jsvar__gc);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__index");
	lua_pushcfunction(L, luajs_jsobject__index);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__newindex");
	lua_pushcfunction(L, luajs_jsobject__newindex);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__call");
	lua_pushcfunction(L, luajs_call);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__isJavascript");
	lua_pushboolean(L, TRUE);
	lua_rawset(L, -3);
	
	lua_rawset(L, -3);
	//END: Create metatables
	
	//Create metatables (unknown)
	lua_pushstring(L, "__mt_js_unknown");
	lua_newtable(L);
	
	lua_pushstring(L, "__gc");
	lua_pushcfunction(L, luajs_jsvar__gc);
	lua_rawset(L, -3);
	
	lua_pushstring(L, "__isJavascript");
	lua_pushboolean(L, TRUE);
	lua_rawset(L, -3);
	
	lua_rawset(L, -3);
	//END: Create metatables
	
	lua_setglobal(L, "js");
	//END: Load myself
	
	//Load js.global
	lua_getglobal(L, "js");
	
	lua_pushstring(L, "global");
	jslua_push_jsvar(L, -1, TYPE_JSOBJECT);
	lua_rawset(L, -3);
	
	lua_pop(L, 1);
	//END: Load js.global
	
	jslua_execute(L, " \
		local function __jsmt_addrecurse(tbl)												\
			local tbl_toTable = tbl.toTable													\
			 function tbl:toTable(recursive, maxDepth)										\
				local ret = tbl_toTable(self)												\
				if not recursive then return ret end										\
				maxDepth = (maxDepth or 10) - 1												\
				if maxDepth <= 0 then return nil end										\
				local k,v																	\
				for k,v in next, ret do														\
					if v and type(v) == 'userdata' and v.__isJavascript and v.toTable then	\
						ret[k] = v:toTable(true, maxDepth)									\
					end																		\
				end																			\
				return ret																	\
			 end																			\
		end																					\
		function js.__mt_js_object:__pairs()												\
			local _tbl = self																\
			local _arr = js.global.Object.keys(_tbl)										\
			local _arrInv = {}																\
			for k, v in ipairs(_arr) do														\
				_arrInv[v] = k																\
			end																				\
			local _next = ipairs(_arr)														\
			return function(_, lastIdx)														\
				local nextIdx, nextValue = _next(_arrInv[lastIdx])							\
				if nextIdx then																\
					return nextValue, _tbl[nextValue]										\
				end																			\
				return nil																	\
			end																				\
		end																					\
		__jsmt_addrecurse(js.__mt_js_object)												\
		__jsmt_addrecurse(js.__mt_js_array)													\
	");
	
	return L;
}

void jslua_delete_state(lua_State* L) {
	lua_close(L);
}

int main() {
  emscripten_exit_with_live_runtime();
  return 0;
}
