#pragma once

void luajs_jsvar_init(lua_State *L);

void luajs_getmetatable(lua_State *L, int type);

void luajs_pushvar(lua_State *L, int varptr, int type);
int luajs_popvar(lua_State *L, int pos);

int luajs_jsvar__is_javascript(lua_State *L);
int luajs_jsvar__gc(lua_State *L);
int luajs_jsvar__eq(lua_State *L);
int luajs_jsvar_jstype(lua_State *L);
