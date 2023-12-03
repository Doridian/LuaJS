#pragma once

void luajs_jsobject_init(lua_State *L);

int luajs_jsobject__index(lua_State *L);
int luajs_jsobject__newindex(lua_State *L);
int luajs_jsobject_toTable(lua_State *L);
