#ifndef _JSVAR_DEFINITIONS_H_INCLUDED

#define PEEK_TypedPointerData(INDEX) \
	if(!lua_isuserdata(L, INDEX)) { \
		lua_pushstring(L, "Invalid self"); \
		lua_error(L); \
	} \
	TypedPointerData *data = (TypedPointerData*)lua_touserdata(L, INDEX);

#define GET_TypedPointerData() \
	PEEK_TypedPointerData(1); \
	lua_remove(L, 1);

#define _JSVAR_DEFINITIONS_H_INCLUDED
#endif
