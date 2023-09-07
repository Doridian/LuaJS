# Makefile for building LuaJS

LUA_SRC=../lua

CFLAGS=-O3 -march=native -flto -I$(LUA_SRC) -Wall $(SYSCFLAGS) $(MYCFLAGS)
LDFLAGS=-O3 -march=native -flto

LIBS= $(SYSLIBS) $(MYLIBS)

MKDIR=mkdir -p

INSTALL=install -p -m 0644
INSTALL_DEST=../dist

LUA_A= $(LUA_SRC)/liblua.a

LIB_O= jsvar.o jslua_ref.o jslua_eval.o jsvar_object.o jsvar_array.o jsvar_function.o

BINARY_T=luajs.js
BINARY_O=luajs.o
BINARY_ARGS=-s EXPORTED_FUNCTIONS="[\
'_jslua_execute',\
'_jslua_new_state',\
'_jslua_delete_state',\
'_jslua_toref',\
'_jslua_pushref',\
'_jslua_unref',\
'_jslua_call',\
'_jslua_pushvar',\
'_jslua_popvar',\
'_lua_pushnumber',\
'_lua_pushstring',\
'_lua_gettable',\
'_lua_settable',\
'_lua_createtable',\
'_lua_pushvalue',\
'_lua_pushnil',\
'_lua_next',\
'_lua_tolstring',\
'_lua_type',\
'_lua_setmetatable',\
'_lua_getmetatable',\
'_lua_settop',\
'_lua_gettop',\
'_lua_tonumberx',\
'_lua_rawset',\
'_lua_rawseti',\
'_lua_pushboolean',\
'_main',\
'_realloc',\
'_free'\
]" -s WASM=1 -s TOTAL_MEMORY=134217728 -s ALLOW_TABLE_GROWTH --js-library lua_library.js --pre-js lua_interface.js --preload-file "../fsroot/@/"

BINARY_FILES=luajs.data luajs.wasm $(BINARY_T)

ALL_O= $(LIB_O) $(BINARY_O)
ALL_T= $(BINARY_T)

# Targets start here.
default: all

all: $(ALL_T)

o: $(ALL_O)

$(BINARY_T): $(LUA_A) lua_interface.js $(ALL_O)
	$(CC)  -o $@ $(LDFLAGS) $(LIB_O) $(BINARY_O) $(LUA_A) $(LIBS) $(BINARY_ARGS)

clean:
	$(RM) $(ALL_T) $(ALL_O) $(BINARY_FILES)

install: $(BINARY_T)
	$(MKDIR) $(INSTALL_DEST)
	$(INSTALL) $(BINARY_FILES) $(INSTALL_DEST)
