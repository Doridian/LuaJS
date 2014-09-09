#!/bin/sh -e

PATCH_FILE=lua/src/Makefile
PATCH_FILE_BACKUP=$PATCH_FILE~

if [ -e "$PATCH_FILE_BACKUP" ]; then
	set -x
        rm -f "$PATCH_FILE"
        mv "$PATCH_FILE_BACKUP" "$PATCH_FILE"
	set +x
fi

PATCH_FILE_H=lua/src/luaconf.h
PATCH_FILE_H_BACKUP=$PATCH_FILE_H~

if [ "x$1" = "xclean" ]; then
	if [ -e "$PATCH_FILE_H_BACKUP" ]; then
		set -x
	        rm -f "$PATCH_FILE_H"
	        mv "$PATCH_FILE_H_BACKUP" "$PATCH_FILE_H"
		set +x
	fi

	exit 0
fi

set -x
sed -ri~ '
# Replace AR with ARR
s/\$\(AR\)/$(ARR)/g; t

# Remove some variables
s/^(CC|LDFLAGS|RANLIB|RM)=/#\0/; t

# Replace AR assignment
s/^AR=.*$/ARR=$(AR) rcu/; t

# Remove -lm from LIBS
s/^(LIBS=.*)-lm$/\1/; t
' "$PATCH_FILE"

if [ ! -e "$PATCH_FILE_H_BACKUP" ]; then
	cp "$PATCH_FILE_H" "$PATCH_FILE_H_BACKUP"
	cd lua && patch -Nf -i ../emscripten_luaconf.patch -p1 && cd ..
fi
