#ifndef _luajs_REF_INCLUDED

int luajs_toref(lua_State *L, int index);
void luajs_pushref(lua_State *L, int index);
void luajs_unref(lua_State *L, int index);

#define _luajs_REF_INCLUDED
#endif
