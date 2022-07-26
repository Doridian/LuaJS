#!/bin/sh

set -e

sed=sed
which gsed >/dev/null 2>/dev/null && sed=gsed

PATCH_FILE=lua/makefile
PATCH_FILE_TARGET=tmp/lua/makefile

mkdir -p tmp/lua

if [ "x$1" = "xclean" ]; then
	rm -f "$PATCH_FILE_TARGET"
	exit 0
fi

$sed -r '
# Replace AR with ARR
s/\$\(AR\)/$(ARR)/g; t

# Remove some variables
s/^(CC|RANLIB|RM)=/#\0/; t

# Replace AR assignment
s/^AR=.*$/ARR=$(AR) rcu/; t

# Remove -lm from LIBS
s/^(LIBS=.*)-lm$/\1/; t

# Remove -lreadline from MYLIBS
s/^(MYLIBS=.*)-lreadline$/\1/; t

# Remove -DLUA_USE_READLINE from MYCFLAGS
s/^(MYCFLAGS=.*)-DLUA_USE_READLINE$/\1/; t

# Remove CWARNGCC from CWARNS
s/^(CWARNS=.*)\$\(CWARNGCC\)$/\1/; t
' "$PATCH_FILE" > "$PATCH_FILE_TARGET"
