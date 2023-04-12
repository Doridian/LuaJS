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
s/^AR= *ar/ARR=$(AR)/; t

# Remove -lreadline from MYLIBS
s/^(MYLIBS=.*)-lreadline$/\1/; t

# Remove -DLUA_USE_READLINE from MYCFLAGS, add -flto
s~^(MYCFLAGS=.*)-DLUA_USE_LINUX -DLUA_USE_READLINE$~\1 -flto -DLUA_CPATH_DEFAULT="\\"/lua/modules/?.so\\"" -DLUA_PATH_DEFAULT="\\"/lua/modules/?.lua;/lua/modules/?/init.lua\\""~; t

# Replace O2 with O3
s/-O2/-O3/g; t

# Remove CWARNGCC from CWARNS
s/^(CWARNS=.*)\$\(CWARNGCC\)$/\1/; t
' "$PATCH_FILE" > "$PATCH_FILE_TARGET"
