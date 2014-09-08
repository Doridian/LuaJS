# Makefile for building LuaJS
# See ../doc/readme.html for installation and customization instructions.

# == CHANGE THE SETTINGS BELOW TO SUIT YOUR ENVIRONMENT =======================

LUA_SRC=../lua/src

#CC= gcc
CFLAGS= -O2 -I$(LUA_SRC) -Wall -DLUA_COMPAT_ALL $(SYSCFLAGS) $(MYCFLAGS)
#LDFLAGS= $(SYSLDFLAGS) $(MYLDFLAGS)
LIBS= $(SYSLIBS) $(MYLIBS)

#AR= ar rcu
AR_ARGS=rcu
#RANLIB= ranlib
#RM= rm -f

SYSCFLAGS=
SYSLDFLAGS=
SYSLIBS=

MYCFLAGS=
MYLDFLAGS=
MYLIBS=
MYOBJS=

# == END OF USER SETTINGS -- NO NEED TO CHANGE ANYTHING BELOW THIS LINE =======

LUA_A=	$(LUA_SRC)/liblua.a

LIB_O= jsvar.o jslua_basetypes.o jslua_eval.o jsvar.o jsvar_object.o jsvar_array.o jsvar_function.o

BINARY_T=main.js
BINARY_O=main.o
BINARY_ARGS=-O2 -s EXPORTED_FUNCTIONS="[\
'_main',\
'_jslua_execute',\
'_jslua_get_stack_size',\
'_jslua_pop_string',\
'_jslua_pop_number',\
'_jslua_empty_stack',\
'_jslua_new_state',\
'_jslua_delete_state',\
'_jslua_toref',\
'_jslua_push_ref',\
'_jslua_unref',\
'_jslua_push_number',\
'_jslua_push_string',\
'_jslua_call',\
'_jslua_push_jsvar',\
'___jslua_set_fp',\
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
'_lua_tonumber',\
'_lua_settop',\
'_lua_gettop',\
'_lua_tonumberx',\
'_lua_rawset',\
'_lua_rawseti',\
'_jslua_pop_jsvar',\
]" -s TOTAL_MEMORY=134217728 -s RESERVED_FUNCTION_POINTERS=16

ALL_O= $(LIB_O) $(BINARY_O)
ALL_T= $(BINARY_T)

# Targets start here.
default: all

all:	$(ALL_T)

o:	$(ALL_O)

$(BINARY_T): $(ALL_O)
	$(CC) -o $@ $(LDFLAGS) $(LIB_O) $(BINARY_O) $(LUA_A) $(LIBS) $(BINARY_ARGS)

clean:
	$(RM) $(ALL_T) $(ALL_O)

depend:
	@$(CC) $(CFLAGS) -MM l*.c

echo:
	@echo "CC= $(CC)"
	@echo "CFLAGS= $(CFLAGS)"
	@echo "LDFLAGS= $(SYSLDFLAGS)"
	@echo "LIBS= $(LIBS)"
	@echo "AR= $(AR)"
	@echo "RANLIB= $(RANLIB)"
	@echo "RM= $(RM)"
