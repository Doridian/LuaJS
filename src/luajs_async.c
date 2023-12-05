#include "definitions.h"

#include "luajs_async.h"
#include "jsvar_definitions.h"


EM_ASYNC_JS(int, luajs_js_await_int, (lua_State *state, int ref), {
  const val = Module.__getVarByRef(ref);
  try {
    const result = await val;
    Module.__pushVar(state, result);
  } catch (e) {
    Module.__pushVar(state, e);
    return 0;
  }
  return 1;
});

int luajs_js_await(lua_State *L) {
  GET_SelfTypedPointerData();
  if (!luajs_js_await_int(L, data->ptr)) {
    lua_error(L);
  }
  return 1;
}
