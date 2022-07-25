#ifndef _JSVAR_FUNCTION_H_INCLUDED

void luajs_jsfunction_init(lua_State *L);
int luajs_jsfunction__call(lua_State *L);
int luajs_jsfunction_new(lua_State *L);

#define _JSVAR_FUNCTION_H_INCLUDED
#endif
