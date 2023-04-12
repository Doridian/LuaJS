default: all

all: patch
    cd lua && make -f ../tmp/lua/makefile liblua.a
    cd src && make

clean:
    cd lua && make clean
    cd src && make clean
    sh -e ./patch_lua_makefile.sh clean
    rm -rf ./tmp

install: all
    cd src && make install

patch:
    sh -e ./patch_lua_makefile.sh
