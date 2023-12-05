#include "definitions.h"

int main() {
  EM_ASM({
    Module.__onready();
    delete Module.__onready;
  });
  emscripten_exit_with_live_runtime();
  return 0;
}
