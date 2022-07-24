#ifndef _JSLUA_REF_INCLUDED

int jslua_toref(lua_State *L, int index);
void jslua_pushref(lua_State *L, int index);
void jslua_unref(lua_State *L, int index);

#define _JSLUA_REF_INCLUDED
#endif
