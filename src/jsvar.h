#ifndef _JSVAR_H_INCLUDED

void luajs_jsvar_init(lua_State *L);

void jslua_getmetatable(lua_State *L, int type);

void jslua_pushvar(lua_State *L, int varptr, int type);
int jslua_popvar(lua_State *L, int pos);

int luajs_jsvar__is_javascript(lua_State *L);
int luajs_jsvar__gc(lua_State *L);
int luajs_jsvar_jstype(lua_State *L);

#define _JSVAR_H_INCLUDED
#endif
