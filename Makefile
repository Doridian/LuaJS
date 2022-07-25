default: all

all: patch
	cd lua && make -f ../tmp/lua.makefile liblua.a
	cd src && make

clean: patch
	cd lua && make -f ../tmp/lua.makefile clean
	cd src && make clean
	sh -e ./patch_lua_makefile.sh clean

install: all
	cd src && make install

patch:
	sh -e ./patch_lua_makefile.sh
