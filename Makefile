default: all

all:	patch
	cd lua && make
	cd src && make

clean:
	cd lua && make clean
	cd src && make clean
	sh -e ./patch_lua_makefile.sh clean

install: all
	cd  src && make install

patch:
	sh -e ./patch_lua_makefile.sh
