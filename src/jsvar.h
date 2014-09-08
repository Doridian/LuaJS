#ifndef _JSVAR_H_INCLUDED

void luajs_jsvar_init(lua_State *L);

void jslua_get_metatable(lua_State *L, int type);

void jslua_push_jsvar(lua_State *L, int varptr, int type);
int jslua_pop_jsvar(lua_State *L, int pos);

int luajs_jsvar__isJavascript(lua_State *L);
int luajs_jsvar__gc(lua_State *L);

#define _JSVAR_H_INCLUDED
#endif
