default: all

all:	patch
	cd lua && make generic
	cd src && make

clean:
	cd lua && make clean
	cd src && make clean
	sh -e ./patch_lua_makefile.sh clean

patch:
	sh -e ./patch_lua_makefile.sh
