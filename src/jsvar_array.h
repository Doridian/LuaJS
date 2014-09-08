#ifndef _JSVAR_ARRAY_H_INCLUDED

void luajs_jsarray_init(lua_State *L);

int luajs_jsarray__index(lua_State *L);
int luajs_jsarray__newindex(lua_State *L);
int luajs_jsarray__len(lua_State *L);
int luajs_jsarray__inext(lua_State *L);
int luajs_jsarray__ipairs(lua_State *L);

#define _JSVAR_ARRAY_H_INCLUDED
#endif
