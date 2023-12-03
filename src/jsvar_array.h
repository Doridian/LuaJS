#pragma once

void luajs_jsarray_init(lua_State *L);

int luajs_jsarray__index(lua_State *L);
int luajs_jsarray__newindex(lua_State *L);
int luajs_jsarray__len(lua_State *L);
int luajs_jsarray__next(lua_State *L);
int luajs_jsarray__pairs(lua_State *L);
int luajs_jsarray_toTable(lua_State *L);
