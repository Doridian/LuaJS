#ifndef _JSVAR_DEFINITIONS_H_INCLUDED

#define PEEK_TypedPointerData(INDEX, VAR)                                      \
  if (!lua_isuserdata(L, INDEX)) {                                             \
    lua_pushstring(L, "Invalid JS userdata");                                  \
    lua_error(L);                                                              \
  }                                                                            \
  TypedPointerData *VAR = (TypedPointerData *)lua_touserdata(L, INDEX);

#define GET_TypedPointerData(INDEX, VAR)                                       \
  PEEK_TypedPointerData(INDEX, VAR);                                           \
  lua_remove(L, INDEX);

#define PEEK_SelfTypedPointerData(INDEX) PEEK_TypedPointerData(INDEX, data)

#define GET_SelfTypedPointerData() GET_TypedPointerData(1, data)

#define _JSVAR_DEFINITIONS_H_INCLUDED
#endif
