# Makefile for building LuaJS

# == CHANGE THE SETTINGS BELOW TO SUIT YOUR ENVIRONMENT =======================

LUA_SRC=../lua

CFLAGS= -O2 -I$(LUA_SRC) -Wall -DLUA_COMPAT_ALL $(SYSCFLAGS) $(MYCFLAGS)
LIBS= $(SYSLIBS) $(MYLIBS)

AR_ARGS=rcu

SYSCFLAGS=
SYSLDFLAGS=
SYSLIBS=

MYCFLAGS=
MYLDFLAGS=
MYLIBS=
MYOBJS=

MKDIR=mkdir -p

INSTALL=install -p -m 0644 
INSTALL_DEST=../dist

# == END OF USER SETTINGS -- NO NEED TO CHANGE ANYTHING BELOW THIS LINE =======

LUA_A=	$(LUA_SRC)/liblua.a

LIB_O= jsvar.o jslua_ref.o jslua_eval.o jsvar_object.o jsvar_array.o jsvar_function.o

BINARY_T=luajs.js
BINARY_O=luajs.o
BINARY_ARGS=-O2 -s EXPORTED_RUNTIME_METHODS="[\
'cwrap',\
'ccall'\
]"\
-s EXPORTED_FUNCTIONS="[\
'_main',\
'_jslua_execute',\
'_jslua_new_state',\
'_jslua_delete_state',\
'_jslua_toref',\
'_jslua_pushref',\
'_jslua_unref',\
'_lua_pushnumber',\
'_lua_pushstring',\
'_jslua_call',\
'_jslua_pushvar',\
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
'_jslua_popvar',\
'_lua_pushboolean'\
]" -s TOTAL_MEMORY=134217728 -s RESERVED_FUNCTION_POINTERS=16 --js-library lua_library.js --pre-js lua_interface.js --preload-file "../fsroot/@/"

BINARY_FILES=luajs.data luajs.wasm $(BINARY_T)

ALL_O= $(LIB_O) $(BINARY_O)
ALL_T= $(BINARY_T)

# Targets start here.
default: all

all:	$(ALL_T)

o:	$(ALL_O)

$(BINARY_T): $(LUA_A) lua_interface.js $(ALL_O)
	$(CC) -s WASM=1 -o $@ $(LDFLAGS) $(LIB_O) $(BINARY_O) $(LUA_A) $(LIBS) $(BINARY_ARGS)

clean:
	$(RM) $(ALL_T) $(ALL_O) $(BINARY_FILES)

depend:
	@$(CC) $(CFLAGS) -MM l*.c

install: $(BINARY_T)
	$(MKDIR) $(INSTALL_DEST)
	$(INSTALL) $(BINARY_FILES) $(INSTALL_DEST)

echo:
	@echo "CC= $(CC)"
	@echo "CFLAGS= $(CFLAGS)"
	@echo "LDFLAGS= $(SYSLDFLAGS)"
	@echo "LIBS= $(LIBS)"
	@echo "AR= $(AR)"
	@echo "RANLIB= $(RANLIB)"
	@echo "RM= $(RM)"
