#include "definitions.h"

int* luajs_alloc_int() {
  int* ptr = malloc(sizeof(int));
  return ptr;
}

double luajs_read_int(int* ptr) {
  return *ptr;
}

size_t* luajs_alloc_size_t() {
  size_t* ptr = malloc(sizeof(size_t));
  return ptr;
}

double luajs_read_size_t(size_t* ptr) {
  return *ptr;
}
