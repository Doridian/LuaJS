#!/bin/sh -e

PATCH_FILE=lua/src/Makefile
PATCH_FILE_BACKUP=$PATCH_FILE~

if [ -e "$PATCH_FILE_BACKUP" ]; then
        rm -f "$PATCH_FILE"
        mv "$PATCH_FILE_BACKUP" "$PATCH_FILE"
fi

if [ "x$1" = "xclean" ]; then
	exit 0
fi

sed -ri~ '
# Replace AR with ARR
s/\$\(AR\)/$(ARR)/g; t

# Remove some variables
s/^(CC|LDFLAGS|RANLIB|RM)=/#\0/; t

# Replace AR assignment
s/^AR=.*$/ARR=$(AR) rcu/; t

# Remove -lm from LIBS
s/^(LIBS=.*)-lm$/\1/; t
' $PATCH_FILE
