# Makefile for building LuaJS

LUA_SRC=../lua

CFLAGS=-O2 -flto -I$(LUA_SRC) -Wall $(SYSCFLAGS) $(MYCFLAGS)
LDFLAGS=-O2 -flto

LIBS= $(SYSLIBS) $(MYLIBS)

MKDIR=mkdir -p

INSTALL=install -p -m 0644
INSTALL_DEST=../dist

LUA_A= $(LUA_SRC)/liblua.a

LIB_O= luajs_allochelpers.o luajs_interface.o jsvar.o luajs_async.o luajs_ref.o luajs_state.o luajs_eval.o jsvar_object.o jsvar_array.o jsvar_function.o

BINARY_T=luajs.mjs
BINARY_O=luajs.o
BINARY_ARGS=-s EXPORTED_FUNCTIONS="[\
'_main',\
'_malloc',\
'_free',\
'_luajs_alloc_int',\
'_luajs_alloc_size_t',\
'_luajs_call',\
'_luajs_delete_state',\
'_luajs_execute',\
'_luajs_get_state_global',\
'_luajs_new_state',\
'_luajs_noref',\
'_luajs_popvar',\
'_luajs_pushref',\
'_luajs_pushvar',\
'_luajs_read_int',\
'_luajs_read_size_t',\
'_luajs_toref',\
'_luajs_unref',\
'_lua_createtable',\
'_lua_getmetatable',\
'_lua_gettable',\
'_lua_gettop',\
'_lua_next',\
'_lua_pushboolean',\
'_lua_pushnil',\
'_lua_pushnumber',\
'_lua_pushlstring',\
'_lua_pushvalue',\
'_lua_rawset',\
'_lua_rawseti',\
'_lua_setmetatable',\
'_lua_settable',\
'_lua_settop',\
'_lua_toboolean',\
'_lua_tolstring',\
'_lua_tonumberx',\
'_lua_type'\
]" -s EXPORTED_RUNTIME_METHODS=cwrap,stringToNewUTF8,lengthBytesUTF8,stringToUTF8,UTF8ToString \
-s WASM -s TOTAL_MEMORY=134217728 -s ASYNCIFY -s ALLOW_TABLE_GROWTH \
-s MAIN_MODULE\
-s MODULARIZE -s EXPORT_ES6 -s USE_ES6_IMPORT_META -s EXPORT_NAME=LuaJS \
--pre-js lua_interface.js --embed-file "../fsroot/@/"

BINARY_FILES=luajs.wasm $(BINARY_T)

ALL_O= $(LIB_O) $(BINARY_O)
ALL_T= $(BINARY_T)

# Targets start here.
default: all

all: $(ALL_T)

o: $(ALL_O)

$(BINARY_T): $(LUA_A) lua_interface.js $(ALL_O)
	$(CC)  -o $@ $(LDFLAGS) $(LIB_O) $(BINARY_O) $(LUA_A) $(LIBS) $(BINARY_ARGS)

clean:
	$(RM) $(ALL_T) $(ALL_O) $(BINARY_FILES) luajs.js

install: $(BINARY_T)
	$(MKDIR) $(INSTALL_DEST)
	$(INSTALL) $(BINARY_FILES) $(INSTALL_DEST)
