#include "definitions.h"

#include "jslua_eval.h"

#include "jsvar.h"
#include "jsvar_object.h"
#include "jsvar_function.h"
#include "jsvar_array.h"

void __jslua_set_fp(LUA_CFP cfp, LUA_RVP rfp) {
	luaCallFunctionPointer = cfp;
	luaRemoveVarPtr = rfp;
}

int luajs_eval(lua_State *L) {
	const char *str = lua_tostring(L, -1);
	lua_pop(L, 1);
	return EM_ASM_INT({
		__luajs_push_var($0, eval(Pointer_stringify($1)));
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
	
	jslua_execute(L, " \
		local function __jsmt_addrecurse(tbl)																		\
			local tbl_toTable = tbl.toTable																			\
			 function tbl:toTable(recursive, maxDepth)																\
				local ret = tbl_toTable(self)																		\
				if not recursive then return ret end																\
				maxDepth = (maxDepth or 10) - 1																		\
				if maxDepth <= 0 then return nil end																\
				local k,v																							\
				for k,v in next, ret do																				\
					if v and type(v) == 'userdata' and v.__isJavascript and v:__isJavascript() and v.toTable then	\
						ret[k] = v:toTable(true, maxDepth)															\
					end																								\
				end																									\
				return ret																							\
			 end																									\
		end																											\
		function js.__mt_js_object:__pairs()																		\
			local _tbl = self																						\
			local _arr = js.global.Object:keys(_tbl)																\
			local _arrInv = {}																						\
			for k, v in ipairs(_arr) do																				\
				_arrInv[v] = k																						\
			end																										\
			local _next = ipairs(_arr)																				\
			return function(_, lastIdx)																				\
				local nextIdx, nextValue = _next(_arrInv[lastIdx])													\
				if nextIdx then																						\
					return nextValue, _tbl[nextValue]																\
				end																									\
				return nil																							\
			end																										\
		end																											\
		__jsmt_addrecurse(js.__mt_js_object)																		\
		__jsmt_addrecurse(js.__mt_js_array)																			\
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
