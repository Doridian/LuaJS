#include "definitions.h"

#include "jslua_async.h"
#include "jsvar_definitions.h"


EM_ASYNC_JS(void, jslua_await_int, (lua_State *state, int ref), {
  const val = Module.__getVarByRef(ref);
  const result = await val;
  Module.__pushVar(state, result);
});

int luajs_await(lua_State *L) {
  GET_SelfTypedPointerData();
  jslua_await_int(L, data->ptr);
  return 1;
}
