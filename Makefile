default: none

none:
	@echo "   LuaJS"
	@echo ""
	@echo "   COMMANDS:"
	@echo "   make patch        - patches the Lua Makefile"
	@echo "   make install      - Installs Lua"
	@echo "   make clean        - cleans the lua builds"
	@echo "   make build        - builds lua from the source you downloaded, guesses the platform."
	@echo ""

build: patch
	cd lua && make -f ../tmp/lua/makefile liblua.a
	cd src && make

clean:
	cd lua && make clean
	cd src && make clean
	sh -e ./patch_lua_makefile.sh clean
	rm -rf ./tmp

install: build
	cd src && make install

patch:
	sh -e ./patch_lua_makefile.sh
