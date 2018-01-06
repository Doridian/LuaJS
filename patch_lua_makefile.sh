#!/bin/sh

set -xe

PATCH_FILE=lua/makefile
PATCH_FILE_BACKUP=$PATCH_FILE~

PATCH_FILE_H=lua/luaconf.h
PATCH_FILE_H_BACKUP=$PATCH_FILE_H~

if [ "x$1" = "xclean" ]; then
	if [ -e "$PATCH_FILE_H_BACKUP" ]; then
		rm -f "$PATCH_FILE_H"
		mv "$PATCH_FILE_H_BACKUP" "$PATCH_FILE_H"
	fi

	if [ -e "$PATCH_FILE_BACKUP" ]; then
		rm -f "$PATCH_FILE"
		mv "$PATCH_FILE_BACKUP" "$PATCH_FILE"
	fi

	exit 0
fi

if [ ! -e "$PATCH_FILE_BACKUP" ]; then
	sed -ri~ '
	# Replace AR with ARR
	s/\$\(AR\)/$(ARR)/g; t

	# Remove some variables
	s/^(CC|RANLIB|RM)=/#\0/; t
	#s/^(CC|LDFLAGS|RANLIB|RM)=/#\0/; t

	# Replace AR assignment
	s/^AR=.*$/ARR=$(AR) rcu/; t

	# Remove -lm from LIBS
	s/^(LIBS=.*)-lm$/\1/; t

	# Remove -lreadline from MYLIBS
	s/^(MYLIBS=.*)-lreadline$/\1/; t
	' "$PATCH_FILE"
fi

if [ ! -e "$PATCH_FILE_H_BACKUP" ]; then
	mv "$PATCH_FILE_H" "$PATCH_FILE_H_BACKUP"
	sed -r '
		# We are in the zone => branch
		/[[:space:]]*\*+[[:space:]]*[Ll]ocal configuration/,+10 b localconfig

		# If there is emlua_conf elsewhere, something is fishy => exit with error
		/emlua_conf/ q 1

		# next line
		b

		:localconfig

		# If there is something else with emlua_conf here, something is fishy => exit with error
		/emlua_conf/ q 1

		s!#endif!#include "../emlua_conf.h"\n\n\0!
	' "$PATCH_FILE_H_BACKUP" > "$PATCH_FILE_H"
fi
