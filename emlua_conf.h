#undef LUA_USE_READLINE
#undef LUA_USE_ULONGJMP

#define _longjmp longjmp
#define _setjmp setjmp

#define random rand
#define srandom srand
