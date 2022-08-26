#ifndef _JSLUA_EVAL_H_INCLUDED

int jslua_call(lua_State *L, int argcount);
int jslua_execute(lua_State *L, char *str);
int jslua_eval(lua_State *L);

#define _JSLUA_EVAL_H_INCLUDED
#endif
