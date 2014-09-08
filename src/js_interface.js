// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    code = Pointer_stringify(code);
    if (code[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (code.indexOf('"', 1) === code.length-1) {
        code = code.substr(1, code.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + code + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + code + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;

function jsCall() {
  var args = Array.prototype.slice.call(arguments);
  return Runtime.functionPointers[args[0]].apply(null, args.slice(1));
}








//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 134217728;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 14288;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });









var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































/* memory initializer */ allocate([117,115,101,114,100,97,116,97,0,0,0,0,0,0,0,0,248,40,0,0,48,1,0,0,208,29,0,0,20,1,0,0,232,23,0,0,128,0,0,0,216,17,0,0,64,0,0,0,200,10,0,0,158,0,0,0,96,15,0,0,218,0,0,0,32,14,0,0,106,1,0,0,0,0,0,0,0,0,0,0,8,12,0,0,82,0,0,0,192,41,0,0,104,0,0,0,128,30,0,0,244,0,0,0,72,24,0,0,102,1,0,0,56,18,0,0,66,1,0,0,152,15,0,0,24,1,0,0,48,14,0,0,100,0,0,0,192,12,0,0,46,1,0,0,216,10,0,0,4,1,0,0,192,9,0,0,94,0,0,0,192,52,0,0,166,0,0,0,0,0,0,0,0,0,0,0,104,30,0,0,2,1,0,0,48,24,0,0,92,0,0,0,48,18,0,0,134,0,0,0,136,15,0,0,102,0,0,0,40,14,0,0,176,0,0,0,184,12,0,0,152,0,0,0,208,10,0,0,182,0,0,0,184,9,0,0,40,1,0,0,184,52,0,0,250,0,0,0,48,51,0,0,110,0,0,0,232,49,0,0,164,0,0,0,168,48,0,0,90,0,0,0,136,47,0,0,34,1,0,0,208,46,0,0,130,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,7,7,7,7,7,7,10,9,5,4,3,3,3,3,3,3,3,3,3,3,3,3,2,2,1,1,0,0,32,19,0,0,112,0,0,0,176,18,0,0,248,0,0,0,72,18,0,0,82,1,0,0,0,0,0,0,0,0,0,0,48,38,0,0,248,36,0,0,136,35,0,0,64,34,0,0,120,33,0,0,192,9,0,0,0,0,0,0,0,0,0,0,6,0,0,0,3,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,2,0,0,0,184,30,0,0,68,0,0,0,104,24,0,0,74,0,0,0,80,18,0,0,162,0,0,0,160,15,0,0,194,0,0,0,56,14,0,0,52,0,0,0,200,12,0,0,222,0,0,0,232,10,0,0,98,1,0,0,200,9,0,0,228,0,0,0,200,52,0,0,106,0,0,0,96,51,0,0,126,0,0,0,248,49,0,0,122,0,0,0,208,48,0,0,42,1,0,0,152,47,0,0,220,0,0,0,232,46,0,0,18,1,0,0,240,45,0,0,62,0,0,0,8,45,0,0,30,1,0,0,32,41,0,0,0,1,0,0,88,40,0,0,252,0,0,0,56,38,0,0,148,0,0,0,40,37,0,0,200,0,0,0,144,35,0,0,114,0,0,0,80,34,0,0,184,0,0,0,128,33,0,0,6,1,0,0,112,32,0,0,66,0,0,0,136,31,0,0,58,1,0,0,176,30,0,0,96,1,0,0,0,30,0,0,230,0,0,0,96,29,0,0,210,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,22,22,22,22,22,22,22,22,22,22,4,4,4,4,4,4,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,5,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,127,64,88,37,0,0,200,35,0,0,120,34,0,0,168,33,0,0,152,32,0,0,232,31,0,0,248,30,0,0,96,30,0,0,152,29,0,0,0,29,0,0,56,28,0,0,128,27,0,0,144,26,0,0,232,25,0,0,104,25,0,0,208,24,0,0,136,24,0,0,40,24,0,0,112,23,0,0,232,22,0,0,112,22,0,0,160,21,0,0,176,20,0,0,224,19,0,0,104,19,0,0,248,18,0,0,136,18,0,0,40,18,0,0,184,17,0,0,104,17,0,0,16,17,0,0,152,16,0,0,88,16,0,0,0,0,0,0,176,29,0,0,168,49,0,0,88,35,0,0,8,0,0,0,192,26,0,0,32,21,0,0,104,16,0,0,24,15,0,0,8,0,0,0,128,13,0,0,176,11,0,0,72,10,0,0,64,53,0,0,40,52,0,0,128,50,0,0,80,49,0,0,56,48,0,0,56,47,0,0,136,46,0,0,104,45,0,0,152,41,0,0,160,40,0,0,152,38,0,0,112,37,0,0,224,35,0,0,176,34,0,0,200,33,0,0,168,32,0,0,0,32,0,0,0,0,0,0,96,113,65,84,80,80,92,108,60,16,60,84,108,124,124,124,124,124,124,96,96,96,104,34,188,188,188,132,228,84,84,16,98,98,4,98,20,81,80,23,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,0,0,0,0,216,19,0,0,96,19,0,0,232,18,0,0,128,18,0,0,32,18,0,0,168,17,0,0,88,17,0,0,0,17,0,0,136,16,0,0,40,16,0,0,8,16,0,0,0,0,0,0,240,40,0,0,120,1,0,0,16,40,0,0,178,0,0,0,0,0,0,0,0,0,0,0,240,10,0,0,180,0,0,0,208,9,0,0,114,1,0,0,32,25,0,0,70,1,0,0,208,52,0,0,132,0,0,0,168,24,0,0,28,1,0,0,112,24,0,0,232,0,0,0,248,23,0,0,214,0,0,0,104,51,0,0,16,1,0,0,80,23,0,0,98,0,0,0,208,22,0,0,56,1,0,0,160,47,0,0,44,0,0,0,0,0,0,0,0,0,0,0,64,37,0,0,176,35,0,0,96,34,0,0,152,33,0,0,128,32,0,0,0,0,0,0,240,10,0,0,180,0,0,0,208,9,0,0,10,1,0,0,208,52,0,0,80,0,0,0,104,51,0,0,188,0,0,0,0,50,0,0,34,0,0,0,216,48,0,0,118,1,0,0,160,47,0,0,86,0,0,0,240,46,0,0,104,1,0,0,248,45,0,0,42,0,0,0,0,0,0,0,0,0,0,0,48,37,0,0,152,35,0,0,88,34,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,144,33,0,0,120,32,0,0,144,31,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5,96,14,0,0,14,1,0,0,8,46,0,0,116,1,0,0,152,31,0,0,72,0,0,0,176,24,0,0,138,0,0,0,200,18,0,0,84,0,0,0,176,15,0,0,72,1,0,0,104,14,0,0,50,0,0,0,224,12,0,0,168,0,0,0,248,10,0,0,170,0,0,0,216,9,0,0,76,0,0,0,216,52,0,0,64,1,0,0,120,51,0,0,242,0,0,0,32,50,0,0,36,1,0,0,224,48,0,0,140,0,0,0,168,47,0,0,96,0,0,0,248,46,0,0,112,1,0,0,0,0,0,0,0,0,0,0,168,14,0,0,174,0,0,0,64,46,0,0,38,1,0,0,224,31,0,0,192,0,0,0,200,24,0,0,32,1,0,0,240,18,0,0,190,0,0,0,192,15,0,0,240,0,0,0,0,0,0,0,0,0,0,0,200,14,0,0,108,1,0,0,128,46,0,0,54,0,0,0,248,31,0,0,94,1,0,0,224,24,0,0,48,0,0,0,0,19,0,0,142,0,0,0,200,15,0,0,74,1,0,0,152,14,0,0,206,0,0,0,16,13,0,0,234,0,0,0,40,11,0,0,62,1,0,0,0,10,0,0,144,0,0,0,248,52,0,0,78,1,0,0,176,51,0,0,204,0,0,0,0,0,0,0,0,0,0,0,24,25,0,0,118,0,0,0,40,19,0,0,80,1,0,0,232,15,0,0,254,0,0,0,160,14,0,0,246,0,0,0,24,13,0,0,12,1,0,0,48,11,0,0,50,1,0,0,8,10,0,0,22,1,0,0,0,53,0,0,88,1,0,0,184,51,0,0,88,1,0,0,88,50,0,0,58,0,0,0,8,49,0,0,36,0,0,0,224,47,0,0,226,0,0,0,8,47,0,0,26,1,0,0,48,46,0,0,8,1,0,0,64,45,0,0,238,0,0,0,64,41,0,0,100,1,0,0,112,40,0,0,76,1,0,0,104,38,0,0,68,1,0,0,72,37,0,0,44,1,0,0,184,35,0,0,172,0,0,0,104,34,0,0,120,0,0,0,160,33,0,0,40,0,0,0,144,32,0,0,186,0,0,0,0,0,0,0,0,0,0,0,103,108,111,98,97,108,0,0,76,85,65,95,67,80,65,84,72,95,53,95,50,0,0,0,112,111,115,105,116,105,111,110,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,108,101,110,0,0,0,0,0,116,105,109,101,0,0,0,0,99,111,115,0,0,0,0,0,102,108,117,115,104,0,0,0,117,112,118,97,108,117,101,105,100,0,0,0,0,0,0,0,99,111,114,111,117,116,105,110,101,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,114,101,112,108,97,99,101,0,108,111,97,100,102,105,108,101,0,0,0,0,0,0,0,0,43,45,0,0,0,0,0,0,109,97,116,104,0,0,0,0,110,0,0,0,0,0,0,0,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,32,105,110,0,0,0,0,0,117,112,118,97,108,0,0,0,115,101,108,102,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,110,111,110,45,115,117,115,112,101,110,100,101,100,32,99,111,114,111,117,116,105,110,101,0,0,0,95,67,76,73,66,83,0,0,95,95,108,101,110,0,0,0,95,69,78,86,0,0,0,0,99,112,97,116,104,0,0,0,105,110,118,97,108,105,100,32,111,114,100,101,114,32,102,117,110,99,116,105,111,110,32,102,111,114,32,115,111,114,116,105,110,103,0,0,0,0,0,0,117,110,112,97,99,107,0,0,103,115,117,98,0,0,0,0,115,101,116,108,111,99,97,108,101,0,0,0,0,0,0,0,99,111,115,104,0,0,0,0,99,108,111,115,101,0,0,0,117,112,118,97,108,117,101,106,111,105,110,0,0,0,0,0,116,111,111,32,109,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,114,101,115,117,109,101,0,0,0,0,0,0,108,115,104,105,102,116,0,0,105,112,97,105,114,115,0,0,80,112,0,0,0,0,0,0,98,105,116,51,50,0,0,0,97,116,116,101,109,112,116,32,116,111,32,37,115,32,37,115,32,39,37,115,39,32,40,97,32,37,115,32,118,97,108,117,101,41,0,0,0,0,0,0,98,97,100,32,97,114,103,117,109,101,110,116,32,35,37,100,32,40,37,115,41,0,0,0,39,102,111,114,39,32,115,116,101,112,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,0,110,111,116,32,97,0,0,0,112,114,111,116,111,0,0,0,99,97,110,110,111,116,32,117,115,101,32,39,46,46,46,39,32,111,117,116,115,105,100,101,32,97,32,118,97,114,97,114,103,32,102,117,110,99,116,105,111,110,0,0,0,0,0,0,34,93,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,101,114,114,111,114,32,104,97,110,100,108,105,110,103,0,99,108,111,99,107,0,0,0,95,95,110,101,119,105,110,100,101,120,0,0,0,0,0,0,47,117,115,114,47,108,111,99,97,108,47,115,104,97,114,101,47,108,117,97,47,53,46,50,47,63,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,115,104,97,114,101,47,108,117,97,47,53,46,50,47,63,47,105,110,105,116,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,46,108,117,97,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,47,105,110,105,116,46,108,117,97,59,46,47,63,46,108,117,97,0,0,0,0,0,0,0,108,111,99,97,108,0,0,0,103,109,97,116,99,104,0,0,114,101,110,97,109,101,0,0,99,101,105,108,0,0,0,0,112,105,0,0,0,0,0,0,95,95,105,110,100,101,120,0,103,101,116,117,112,118,97,108,117,101,0,0,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,100,101,97,100,32,99,111,114,111,117,116,105,110,101,0,0,0,0,108,114,111,116,97,116,101,0,103,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,88,120,0,0,0,0,0,0,115,116,114,105,110,103,0,0,10,9,40,46,46,46,116,97,105,108,32,99,97,108,108,115,46,46,46,41,0,0,0,0,39,102,111,114,39,32,108,105,109,105,116,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,99,111,114,114,117,112,116,101,100,0,0,0,0,0,0,0,116,104,114,101,97,100,0,0,95,73,79,95,105,110,112,117,116,0,0,0,0,0,0,0,67,32,108,101,118,101,108,115,0,0,0,0,0,0,0,0,91,115,116,114,105,110,103,32,34,0,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,108,111,97,100,32,97,32,37,115,32,99,104,117,110,107,32,40,109,111,100,101,32,105,115,32,39,37,115,39,41,0,0,0,0,0,0,0,95,95,105,110,100,101,120,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,76,85,65,95,80,65,84,72,0,0,0,0,0,0,0,0,37,115,58,37,100,58,32,37,115,0,0,0,0,0,0,0,115,111,114,116,0,0,0,0,102,111,114,109,97,116,0,0,114,101,109,111,118,101,0,0,97,116,97,110,0,0,0,0,99,97,110,110,111,116,32,99,108,111,115,101,32,115,116,97,110,100,97,114,100,32,102,105,108,101,0,0,0,0,0,0,100,101,98,117,103,0,0,0,103,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,116,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,32,116,111,32,114,101,115,117,109,101,0,0,0,0,101,120,116,114,97,99,116,0,101,114,114,111,114,0,0,0,99,114,101,97,116,101,0,0,69,101,0,0,0,0,0,0,111,115,0,0,0,0,0,0,32,105,110,32,0,0,0,0,97,114,115,104,105,102,116,0,39,102,111,114,39,32,105,110,105,116,105,97,108,32,118,97,108,117,101,32,109,117,115,116,32,98,101,32,97,32,110,117,109,98,101,114,0,0,0,0,37,115,58,32,37,115,32,112,114,101,99,111,109,112,105,108,101,100,32,99,104,117,110,107,0,0,0,0,0,0,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,46,46,46,0,0,0,0,0,116,101,120,116,0,0,0,0,95,95,103,99,0,0,0,0,76,85,65,95,80,65,84,72,95,53,95,50,0,0,0,0,114,101,109,111,118,101,0,0,97,116,116,101,109,112,116,32,116,111,32,99,111,109,112,97,114,101,32,37,115,32,119,105,116,104,32,37,115,0,0,0,102,105,110,100,0,0,0,0,95,71,0,0,0,0,0,0,103,101,116,101,110,118,0,0,97,116,97,110,50,0,0,0,70,73,76,69,42,0,0,0,103,101,116,114,101,103,105,115,116,114,121,0,0,0,0,0,121,105,101,108,100,0,0,0,98,116,101,115,116,0,0,0,97,115,115,101,114,116,105,111,110,32,102,97,105,108,101,100,33,0,0,0,0,0,0,0,100,111,102,105,108,101,0,0,46,0,0,0,0,0,0,0,37,115,0,0,0,0,0,0,105,111,0,0,0,0,0,0,105,110,99,114,101,109,101,110,116,97,108,0,0,0,0,0,37,100,58,0,0,0,0,0,37,115,10,0,0,0,0,0,103,101,110,101,114,97,116,105,111,110,97,108,0,0,0,0,103,101,116,32,108,101,110,103,116,104,32,111,102,0,0,0,116,114,117,110,99,97,116,101,100,0,0,0,0,0,0,0,60,115,116,114,105,110,103,62,0,0,0,0,0,0,0,0,116,97,98,108,101,0,0,0,61,40,100,101,98,117,103,32,99,111,109,109,97,110,100,41,0,0,0,0,0,0,0,0,105,115,114,117,110,110,105,110,103,0,0,0,0,0,0,0,60,110,97,109,101,62,0,0,37,115,32,101,120,112,101,99,116,101,100,0,0,0,0,0,102,117,110,99,116,105,111,110,32,60,37,115,58,37,100,62,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,37,37,99,39,32,116,111,32,39,108,117,97,95,112,117,115,104,102,115,116,114,105,110,103,39,0,0,0,0,0,0,99,111,110,116,10,0,0,0,115,101,116,109,97,106,111,114,105,110,99,0,0,0,0,0,60,110,117,109,98,101,114,62,0,0,0,0,0,0,0,0,39,37,99,39,0,0,0,0,98,105,110,97,114,121,0,0,109,97,105,110,32,99,104,117,110,107,0,0,0,0,0,0,105,110,105,116,0,0,0,0,108,117,97,95,100,101,98,117,103,62,32,0,0,0,0,0,115,101,116,115,116,101,112,109,117,108,0,0,0,0,0,0,60,101,111,102,62,0,0,0,102,117,110,99,116,105,111,110,32,39,37,115,39,0,0,0,95,95,109,116,95,106,115,95,97,114,114,97,121,0,0,0,97,98,115,101,110,116,0,0,105,110,118,97,108,105,100,32,109,111,100,101,0,0,0,0,115,101,116,112,97,117,115,101,0,0,0,0,0,0,0,0,58,58,0,0,0,0,0,0,112,97,116,104,0,0,0,0,46,0,0,0,0,0,0,0,95,95,105,110,100,101,120,0,112,97,99,107,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,99,111,109,112,97,114,101,32,116,119,111,32,37,115,32,118,97,108,117,101,115,0,0,0,0,0,0,0,0,114,119,97,0,0,0,0,0,101,120,116,101,114,110,97,108,32,104,111,111,107,0,0,0,115,116,101,112,0,0,0,0,126,61,0,0,0,0,0,0,100,117,109,112,0,0,0,0,101,120,105,116,0,0,0,0,102,0,0,0,0,0,0,0,115,101,101,97,108,108,0,0,97,115,105,110,0,0,0,0,99,97,110,110,111,116,32,111,112,101,110,32,102,105,108,101,32,39,37,115,39,32,40,37,115,41,0,0,0,0,0,0,102,117,110,99,0,0,0,0,99,111,117,110,116,0,0,0,60,61,0,0,0,0,0,0,115,116,100,101,114,114,0,0,37,115,32,101,120,112,101,99,116,101,100,44,32,103,111,116,32,37,115,0,0,0,0,0,115,101,97,114,99,104,112,97,116,104,0,0,0,0,0,0,119,0,0,0,0,0,0,0,103,101,116,108,111,99,97,108,0,0,0,0,0,0,0,0,97,99,116,105,118,101,108,105,110,101,115,0,0,0,0,0,99,111,108,108,101,99,116,0,119,114,97,112,0,0,0,0,62,61,0,0,0,0,0,0,98,120,111,114,0,0,0,0,99,97,110,110,111,116,32,37,115,32,37,115,58,32,37,115,0,0,0,0,0,0,0,0,108,111,97,100,108,105,98,0,99,111,108,108,101,99,116,103,97,114,98,97,103,101,0,0,39,112,111,112,101,110,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,105,115,116,97,105,108,99,97,108,108,0,0,0,0,0,0,114,101,115,116,97,114,116,0,61,61,0,0,0,0,0,0,105,110,118,97,108,105,100,32,108,111,110,103,32,115,116,114,105,110,103,32,100,101,108,105,109,105,116,101,114,0,0,0,239,187,191,0,0,0,0,0,10,9,110,111,32,102,105,101,108,100,32,112,97,99,107,97,103,101,46,112,114,101,108,111,97,100,91,39,37,115,39,93,0,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,110,97,109,101,119,104,97,116,0,0,0,0,0,0,0,0,115,116,111,112,0,0,0,0,46,46,46,0,0,0,0,0,99,111,110,116,114,111,108,32,115,116,114,117,99,116,117,114,101,32,116,111,111,32,108,111,110,103,0,0,0,0,0,0,116,97,98,108,101,0,0,0,102,117,110,99,116,105,111,110,32,111,114,32,101,120,112,114,101,115,115,105,111,110,32,116,111,111,32,99,111,109,112,108,101,120,0,0,0,0,0,0,80,65,78,73,67,58,32,117,110,112,114,111,116,101,99,116,101,100,32,101,114,114,111,114,32,105,110,32,99,97,108,108,32,116,111,32,76,117,97,32,65,80,73,32,40,37,115,41,10,0,0,0,0,0,0,0,115,116,114,105,110,103,32,115,108,105,99,101,32,116,111,111,32,108,111,110,103,0,0,0,10,9,37,115,58,0,0,0,102,105,108,101,0,0,0,0,110,97,109,101,0,0,0,0,95,95,105,112,97,105,114,115,0,0,0,0,0,0,0,0,46,46,0,0,0,0,0,0,115,116,114,105,110,103,32,108,101,110,103,116,104,32,111,118,101,114,102,108,111,119,0,0,25,147,13,10,26,10,0,0,98,97,100,32,99,111,110,118,101,114,115,105,111,110,32,110,117,109,98,101,114,45,62,105,110,116,59,32,109,117,115,116,32,114,101,99,111,109,112,105,108,101,32,76,117,97,32,119,105,116,104,32,112,114,111,112,101,114,32,115,101,116,116,105,110,103,115,0,0,0,0,0,115,116,114,105,110,103,0,0,114,0,0,0,0,0,0,0,95,80,82,69,76,79,65,68,0,0,0,0,0,0,0,0,118,97,108,117,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,99,108,111,115,101,100,32,102,105,108,101,0,0,0,0,0,105,115,118,97,114,97,114,103,0,0,0,0,0,0,0,0,114,101,97,100,101,114,32,102,117,110,99,116,105,111,110,32,109,117,115,116,32,114,101,116,117,114,110,32,97,32,115,116,114,105,110,103,0,0,0,0,119,104,105,108,101,0,0,0,108,97,98,101,108,115,47,103,111,116,111,115,0,0,0,0,118,101,114,115,105,111,110,32,109,105,115,109,97,116,99,104,58,32,97,112,112,46,32,110,101,101,100,115,32,37,102,44,32,76,117,97,32,99,111,114,101,32,112,114,111,118,105,100,101,115,32,37,102,0,0,0,10,9,110,111,32,102,105,108,101,32,39,37,115,39,0,0,117,110,97,98,108,101,32,116,111,32,100,117,109,112,32,103,105,118,101,110,32,102,117,110,99,116,105,111,110,0,0,0,115,116,97,110,100,97,114,100,32,37,115,32,102,105,108,101,32,105,115,32,99,108,111,115,101,100,0,0,0,0,0,0,37,0,0,0,0,0,0,0,110,112,97,114,97,109,115,0,116,111,111,32,109,97,110,121,32,110,101,115,116,101,100,32,102,117,110,99,116,105,111,110,115,0,0,0,0,0,0,0,117,110,116,105,108,0,0,0,109,117,108,116,105,112,108,101,32,76,117,97,32,86,77,115,32,100,101,116,101,99,116,101,100,0,0,0,0,0,0,0,63,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,32,40,119,105,100,116,104,32,111,114,32,112,114,101,99,105,115,105,111,110,32,116,111,111,32,108,111,110,103,41,0,0,0,0,116,121,112,101,0,0,0,0,110,117,112,115,0,0,0,0,61,40,108,111,97,100,41,0,116,114,117,101,0,0,0,0,116,111,111,32,109,97,110,121,32,117,112,118,97,108,117,101,115,0,0,0,0,0,0,0,99,97,108,108,0,0,0,0,39,112,97,99,107,97,103,101,46,37,115,39,32,109,117,115,116,32,98,101,32,97,32,115,116,114,105,110,103,0,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,32,40,114,101,112,101,97,116,101,100,32,102,108,97,103,115,41,0,116,109,112,102,105,108,101,0,99,117,114,114,101,110,116,108,105,110,101,0,0,0,0,0,98,116,0,0,0,0,0,0,116,104,101,110,0,0,0,0,110,97,109,101,32,99,111,110,102,108,105,99,116,32,102,111,114,32,109,111,100,117,108,101,32,39,37,115,39,0,0,0,115,101,97,114,99,104,101,114,115,0,0,0,0,0,0,0,100,121,110,97,109,105,99,32,108,105,98,114,97,114,105,101,115,32,110,111,116,32,101,110,97,98,108,101,100,59,32,99,104,101,99,107,32,121,111,117,114,32,76,117,97,32,105,110,115,116,97,108,108,97,116,105,111,110,0,0,0,0,0,0,105,110,115,101,114,116,0,0,45,43,32,35,48,0,0,0,112,111,112,101,110,0,0,0,119,104,97,116,0,0,0,0,112,101,114,102,111,114,109,32,97,114,105,116,104,109,101,116,105,99,32,111,110,0,0,0,95,95,112,97,105,114,115,0,114,101,116,117,114,110,0,0,99,104,97,114,0,0,0,0,95,76,79,65,68,69,68,0,37,115,10,0,0,0,0,0,101,120,101,99,117,116,101,0,108,117,97,111,112,101,110,95,37,115,0,0,0,0,0,0,92,37,48,51,100,0,0,0,97,99,111,115,0,0,0,0,111,117,116,112,117,116,0,0,108,97,115,116,108,105,110,101,100,101,102,105,110,101,100,0,114,101,112,101,97,116,0,0,37,115,58,32,37,112,0,0,115,116,100,111,117,116,0,0,92,37,100,0,0,0,0,0,111,112,101,110,0,0,0,0,103,101,116,105,110,102,111,0,108,105,110,101,100,101,102,105,110,101,100,0,0,0,0,0,115,116,97,116,117,115,0,0,111,114,0,0,0,0,0,0,110,105,108,0,0,0,0,0,98,111,114,0,0,0,0,0,95,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,37,37,99,39,32,116,111,32,39,102,111,114,109,97,116,39,0,0,0,0,0,0,0,97,115,115,101,114,116,0,0,105,110,112,117,116,0,0,0,115,104,111,114,116,95,115,114,99,0,0,0,0,0,0,0,39,116,111,115,116,114,105,110,103,39,32,109,117,115,116,32,114,101,116,117,114,110,32,97,32,115,116,114,105,110,103,32,116,111,32,39,112,114,105,110,116,39,0,0,0,0,0,0,110,111,116,0,0,0,0,0,102,97,108,115,101,0,0,0,95,69,78,86,0,0,0,0,46,0,0,0,0,0,0,0,110,111,116,32,97,32,110,111,110,45,110,101,103,97,116,105,118,101,32,110,117,109,98,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,0,0,0,0,0,37,115,0,0,0,0,0,0,115,111,117,114,99,101,0,0,116,97,98,108,101,32,111,114,32,115,116,114,105,110,103,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,0,0,110,105,108,0,0,0,0,0,111,112,99,111,100,101,115,0,116,114,117,101,0,0,0,0,99,111,114,111,117,116,105,110,101,0,0,0,0,0,0,0,37,46,49,52,103,0,0,0,101,114,114,111,114,32,108,111,97,100,105,110,103,32,109,111,100,117,108,101,32,39,37,115,39,32,102,114,111,109,32,102,105,108,101,32,39,37,115,39,58,10,9,37,115,0,0,0,83,108,110,116,0,0,0,0,102,105,108,101,32,105,115,32,97,108,114,101,97,100,121,32,99,108,111,115,101,100,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,0,0,105,110,100,101,120,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,108,111,99,97,108,0,0,0,108,111,111,112,32,105,110,32,115,101,116,116,97,98,108,101,0,0,0,0,0,0,0,0,95,95,116,111,115,116,114,105,110,103,0,0,0,0,0,0,110,117,109,98,101,114,0,0,10,9,110,111,32,109,111,100,117,108,101,32,39,37,115,39,32,105,110,32,102,105,108,101,32,39,37,115,39,0,0,0,110,111,116,32,97,32,110,117,109,98,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,0,0,116,111,111,32,109,97,110,121,32,111,112,116,105,111,110,115,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,107,101,121,32,116,111,32,39,110,101,120,116,39,0,0,0,102,117,110,99,116,105,111,110,32,111,114,32,108,101,118,101,108,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,99,97,110,110,111,116,32,99,104,97,110,103,101,32,97,32,112,114,111,116,101,99,116,101,100,32,109,101,116,97,116,97,98,108,101,0,0,0,0,0,105,110,0,0,0,0,0,0,111,98,106,101,99,116,32,108,101,110,103,116,104,32,105,115,32,110,111,116,32,97,32,110,117,109,98,101,114,0,0,0,98,114,101,97,107,0,0,0,47,0,0,0,0,0,0,0,110,111,32,118,97,108,117,101,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,99,111,110,118,101,114,115,105,111,110,32,115,112,101,99,105,102,105,101,114,32,39,37,37,37,115,39,0,0,0,0,0,119,114,111,110,103,32,110,117,109,98,101,114,32,111,102,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,0,37,108,102,0,0,0,0,0,37,112,0,0,0,0,0,0,62,37,115,0,0,0,0,0,95,95,109,101,116,97,116,97,98,108,101,0,0,0,0,0,105,102,0,0,0,0,0,0,114,101,97,100,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,121,105,101,108,100,32,102,114,111,109,32,111,117,116,115,105,100,101,32,97,32,99,111,114,111,117,116,105,110,101,0,0,0,0,0,0,0,76,85,65,95,78,79,69,78,86,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,117,115,101,32,111,102,32,39,37,99,39,32,105,110,32,114,101,112,108,97,99,101,109,101,110,116,32,115,116,114,105,110,103,0,0,0,0,0,0,0,105,110,116,101,114,118,97,108,32,105,115,32,101,109,112,116,121,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,102,111,114,109,97,116,0,0,102,108,110,83,116,117,0,0,110,105,108,32,111,114,32,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,0,103,111,116,111,0,0,0,0,114,101,111,112,101,110,0,0,101,118,97,108,0,0,0,0,1,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,114,101,112,108,97,99,101,109,101,110,116,32,118,97,108,117,101,32,40,97,32,37,115,41,0,0,0,0,0,0,0,0,97,65,98,66,99,100,72,73,106,109,77,112,83,85,119,87,120,88,121,89,122,37,0,0,116,97,110,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,0,0,76,117,97,32,102,117,110,99,116,105,111,110,32,101,120,112,101,99,116,101,100,0,0,0,32,12,10,13,9,11,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,114,98,0,0,0,0,0,0,110,111,32,118,97,108,117,101,0,0,0,0,0,0,0,0,108,111,97,100,101,114,115,0,59,1,59,0,0,0,0,0,109,97,120,110,0,0,0,0,115,116,114,105,110,103,47,102,117,110,99,116,105,111,110,47,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,121,100,97,121,0,0,0,0,116,97,110,104,0,0,0,0,116,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,105,110,118,97,108,105,100,32,117,112,118,97,108,117,101,32,105,110,100,101,120,0,0,0,98,97,115,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,0,99,111,110,99,97,116,101,110,97,116,101,0,0,0,0,0,102,111,114,0,0,0,0,0,98,121,116,101,0,0,0,0,117,112,118,97,108,117,101,115,0,0,0,0,0,0,0,0,100,105,102,102,116,105,109,101,0,0,0,0,0,0,0,0,59,59,0,0,0,0,0,0,94,36,42,43,63,46,40,91,37,45,0,0,0,0,0,0,119,100,97,121,0,0,0,0,115,113,114,116,0,0,0,0,97,98,115,0,0,0,0,0,110,111,116,32,97,110,32,105,110,116,101,103,101,114,32,105,110,32,112,114,111,112,101,114,32,114,97,110,103,101,0,0,62,117,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,102,97,108,115,101,0,0,0,111,112,101,110,0,0,0,0,95,73,79,95,111,117,116,112,117,116,0,0,0,0,0,0,37,115,32,101,120,112,101,99,116,101,100,32,40,116,111,32,99,108,111,115,101,32,37,115,32,97,116,32,108,105,110,101,32,37,100,41,0,0,0,0,116,97,98,108,101,32,105,110,100,101,120,32,105,115,32,110,105,108,0,0,0,0,0,0,95,80,65,67,75,65,71,69,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,112,97,116,116,101,114,110,32,99,97,112,116,117,114,101,0,42,116,0,0,0,0,0,0,115,105,110,0,0,0,0,0,101,110,100,0,0,0,0,0,103,101,116,104,111,111,107,0,102,117,108,108,32,117,115,101,114,100,97,116,97,32,101,120,112,101,99,116,101,100,44,32,103,111,116,32,108,105,103,104,116,32,117,115,101,114,100,97,116,97,0,0,0,0,0,0,118,97,108,117,101,32,101,120,112,101,99,116,101,100,0,0,114,117,110,110,105,110,103,0,101,110,100,0,0,0,0,0,114,0,0,0,0,0,0,0,98,110,111,116,0,0,0,0,95,95,99,97,108,108,0,0,40,102,111,114,32,115,116,101,112,41,0,0,0,0,0,0,63,0,0,0,0,0,0,0,95,77,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,109,105,115,115,105,110,103,32,97,114,103,117,109,101,110,116,115,32,116,111,32,39,37,37,98,39,41,0,0,95,86,69,82,83,73,79,78,0,0,0,0,0,0,0,0,37,99,0,0,0,0,0,0,115,105,110,104,0,0,0,0,99,117,114,0,0,0,0,0,116,97,105,108,32,99,97,108,108,0,0,0,0,0,0,0,120,112,99,97,108,108,0,0,101,108,115,101,105,102,0,0,64,37,115,0,0,0,0,0,95,95,99,111,110,99,97,116,0,0,0,0,0,0,0,0,40,102,111,114,32,108,105,109,105,116,41,0,0,0,0,0,39,37,115,39,0,0,0,0,123,32,95,95,108,117,97,106,115,95,112,117,115,104,95,118,97,114,40,36,48,44,32,101,118,97,108,40,80,111,105,110,116,101,114,95,115,116,114,105,110,103,105,102,121,40,36,49,41,41,41,59,32,114,101,116,117,114,110,32,49,59,32,125,0,0,0,0,0,0,0,0,39,109,111,100,117,108,101,39,32,110,111,116,32,99,97,108,108,101,100,32,102,114,111,109,32,97,32,76,117,97,32,102,117,110,99,116,105,111,110,0,110,111,116,32,101,110,111,117,103,104,32,109,101,109,111,114,121,0,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,109,105,115,115,105,110,103,32,39,93,39,41,0,110,117,109,101,114,105,99,0,114,97,110,100,111,109,115,101,101,100,0,0,0,0,0,0,115,101,116,0,0,0,0,0,99,111,117,110,116,0,0,0,116,121,112,101,0,0,0,0,101,108,115,101,0,0,0,0,99,111,110,115,116,97,110,116,115,0,0,0,0,0,0,0,61,115,116,100,105,110,0,0,95,95,108,101,0,0,0,0,112,97,99,107,97,103,101,0,40,102,111,114,32,105,110,100,101,120,41,0,0,0,0,0,40,42,118,97,114,97,114,103,41,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,116,121,112,101,0,0,0,0,102,0,0,0,0,0,0,0,109,97,108,102,111,114,109,101,100,32,112,97,116,116,101,114,110,32,40,101,110,100,115,32,119,105,116,104,32,39,37,37,39,41,0,0,0,0,0,0,10,9,46,46,46,0,0,0,109,111,110,101,116,97,114,121,0,0,0,0,0,0,0,0,114,97,110,100,111,109,0,0,108,105,110,101,0,0,0,0,108,105,110,101,0,0,0,0,116,111,115,116,114,105,110,103,0,0,0,0,0,0,0,0,100,111,0,0,0,0,0,0,108,111,111,112,32,105,110,32,103,101,116,116,97,98,108,101,0,0,0,0,0,0,0,0,98,117,102,102,101,114,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,0,0,95,95,108,116,0,0,0,0,40,102,111,114,32,99,111,110,116,114,111,108,41,0,0,0,40,42,116,101,109,112,111,114,97,114,121,41,0,0,0,0,123,32,105,102,40,36,51,41,32,36,50,32,61,32,80,111,105,110,116,101,114,95,115,116,114,105,110,103,105,102,121,40,36,50,41,59,32,118,97,114,32,118,97,108,32,61,32,95,95,108,117,97,106,115,95,103,101,116,95,118,97,114,95,98,121,95,114,101,102,40,36,49,41,59,32,95,95,108,117,97,106,115,95,112,117,115,104,95,118,97,114,40,36,48,44,32,118,97,108,91,36,50,93,44,32,118,97,108,41,59,32,114,101,116,117,114,110,32,49,59,32,125,0,0,0,0,0,0,98,111,111,108,101,97,110,0,95,78,65,77,69,0,0,0,105,110,118,97,108,105,100,32,99,97,112,116,117,114,101,32,105,110,100,101,120,32,37,37,37,100,0,0,0,0,0,0,99,116,121,112,101,0,0,0,114,97,100,0,0,0,0,0,102,117,108,108,0,0,0,0,116,97,98,108,101,32,111,118,101,114,102,108,111,119,0,0,114,101,116,117,114,110,0,0,116,111,110,117,109,98,101,114,0,0,0,0,0,0,0,0,98,114,101,97,107,0,0,0,118,97,108,117,101,32,101,120,112,101,99,116,101,100,0,0,95,95,117,110,109,0,0,0,40,102,111,114,32,115,116,97,116,101,41,0,0,0,0,0,60,103,111,116,111,32,37,115,62,32,97,116,32,108,105,110,101,32,37,100,32,106,117,109,112,115,32,105,110,116,111,32,116,104,101,32,115,99,111,112,101,32,111,102,32,108,111,99,97,108,32,39,37,115,39,0,76,117,97,0,0,0,0,0,123,32,105,102,40,36,51,41,32,36,50,32,61,32,80,111,105,110,116,101,114,95,115,116,114,105,110,103,105,102,121,40,36,50,41,59,32,95,95,108,117,97,106,115,95,103,101,116,95,118,97,114,95,98,121,95,114,101,102,40,36,49,41,91,36,50,93,32,61,32,95,95,108,117,97,106,115,95,100,101,99,111,100,101,95,115,105,110,103,108,101,40,36,48,44,32,45,49,44,32,116,114,117,101,41,59,32,114,101,116,117,114,110,32,48,59,32,125,0,0,109,111,100,117,108,101,32,39,37,115,39,32,110,111,116,32,102,111,117,110,100,58,37,115,0,0,0,0,0,0,0,0,109,105,115,115,105,110,103,32,39,91,39,32,97,102,116,101,114,32,39,37,37,102,39,32,105,110,32,112,97,116,116,101,114,110,0,0,0,0,0,0,99,111,108,108,97,116,101,0,60,37,115,62,32,97,116,32,108,105,110,101,32,37,100,32,110,111,116,32,105,110,115,105,100,101,32,97,32,108,111,111,112,0,0,0,0,0,0,0,112,111,119,0,0,0,0,0,110,111,0,0,0,0,0,0,40,110,117,108,108,41,0,0,99,97,108,108,0,0,0,0,115,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,97,110,100,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,95,95,112,111,119,0,0,0,40,102,111,114,32,103,101,110,101,114,97,116,111,114,41,0,97,116,116,101,109,112,116,32,116,111,32,121,105,101,108,100,32,97,99,114,111,115,115,32,97,32,67,45,99,97,108,108,32,98,111,117,110,100,97,114,121,0,0,0,0,0,0,0,109,97,105,110,0,0,0,0,123,32,114,101,116,117,114,110,32,95,95,108,117,97,106,115,95,103,101,116,95,118,97,114,95,98,121,95,114,101,102,40,36,48,41,46,108,101,110,103,116,104,59,32,125,0,0,0,39,112,97,99,107,97,103,101,46,115,101,97,114,99,104,101,114,115,39,32,109,117,115,116,32,98,101,32,97,32,116,97,98,108,101,0,0,0,0,0,112,97,116,116,101,114,110,32,116,111,111,32,99,111,109,112,108,101,120,0,0,0,0,0,97,108,108,0,0,0,0,0,109,111,100,102,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,117,115,101,32,97,32,99,108,111,115,101,100,32,102,105,108,101,0,0,0,0,95,95,109,111,100,101,0,0,115,101,108,101,99,116,0,0,37,115,32,110,101,97,114,32,37,115,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,32,40,37,115,41,0,0,0,0,0,95,95,109,111,100,0,0,0,39,61,39,32,111,114,32,39,105,110,39,32,101,120,112,101,99,116,101,100,0,0,0,0,61,63,0,0,0,0,0,0,123,32,118,97,114,32,111,98,106,32,61,32,95,95,108,117,97,106,115,95,103,101,116,95,118,97,114,95,98,121,95,114,101,102,40,36,49,41,59,32,102,111,114,40,118,97,114,32,105,100,120,32,105,110,32,111,98,106,41,32,123,32,105,102,40,33,111,98,106,46,104,97,115,79,119,110,80,114,111,112,101,114,116,121,40,105,100,120,41,41,32,99,111,110,116,105,110,117,101,59,32,105,102,40,116,121,112,101,111,102,32,105,100,120,32,61,61,32,34,110,117,109,98,101,114,34,41,32,123,32,95,95,108,117,97,106,115,95,112,117,115,104,95,118,97,114,40,36,48,44,32,97,114,114,97,121,91,105,100,120,93,41,59,32,95,95,108,117,97,106,115,95,108,117,97,78,97,116,105,118,101,46,114,97,119,115,101,116,105,40,36,48,44,32,45,50,44,32,105,100,120,41,59,32,125,32,101,108,115,101,32,123,32,95,95,108,117,97,106,115,95,112,117,115,104,95,118,97,114,40,36,48,44,32,105,100,120,41,59,32,95,95,108,117,97,106,115,95,112,117,115,104,95,118,97,114,40,36,48,44,32,111,98,106,91,105,100,120,93,41,59,32,95,95,108,117,97,106,115,95,108,117,97,78,97,116,105,118,101,46,114,97,119,115,101,116,40,36,48,44,32,45,51,41,59,32,125,32,125,32,114,101,116,117,114,110,32,48,59,32,125], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([105,110,112,117,116,0,0,0,114,101,113,117,105,114,101,0,117,110,102,105,110,105,115,104,101,100,32,99,97,112,116,117,114,101,0,0,0,0,0,0,102,105,101,108,100,32,39,37,115,39,32,109,105,115,115,105,110,103,32,105,110,32,100,97,116,101,32,116,97,98,108,101,0,0,0,0,0,0,0,0,109,105,110,0,0,0,0,0,37,46,49,52,103,0,0,0,107,0,0,0,0,0,0,0,114,97,119,115,101,116,0,0,37,115,58,37,100,58,32,37,115,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,111,112,116,105,111,110,32,39,37,115,39,0,0,0,0,0,95,95,100,105,118,0,0,0,108,97,98,101,108,32,39,37,115,39,32,97,108,114,101,97,100,121,32,100,101,102,105,110,101,100,32,111,110,32,108,105,110,101,32,37,100,0,0,0,67,0,0,0,0,0,0,0,95,95,103,99,0,0,0,0,73,110,118,97,108,105,100,32,115,101,108,102,0,0,0,0,109,111,100,117,108,101,0,0,99,111,110,99,97,116,0,0,105,110,118,97,108,105,100,32,99,97,112,116,117,114,101,32,105,110,100,101,120,0,0,0,105,115,100,115,116,0,0,0,109,97,120,0,0,0,0,0,102,105,108,101,32,40,37,112,41,0,0,0,0,0,0,0,95,72,75,69,89,0,0,0,114,97,119,103,101,116,0,0,99,104,117,110,107,32,104,97,115,32,116,111,111,32,109,97,110,121,32,108,105,110,101,115,0,0,0,0,0,0,0,0,97,116,116,101,109,112,116,32,116,111,32,37,115,32,97,32,37,115,32,118,97,108,117,101,0,0,0,0,0,0,0,0,95,95,105,110,100,101,120,0,101,120,105,116,0,0,0,0,95,95,109,117,108,0,0,0,117,110,101,120,112,101,99,116,101,100,32,115,121,109,98,111,108,0,0,0,0,0,0,0,61,91,67,93,0,0,0,0,100,97,116,101,0,0,0,0,32,9,9,108,111,99,97,108,32,102,117,110,99,116,105,111,110,32,95,95,106,115,109,116,95,97,100,100,114,101,99,117,114,115,101,40,116,98,108,41,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,108,111,99,97,108,32,116,98,108,95,116,111,84,97,98,108,101,32,61,32,116,98,108,46,116,111,84,97,98,108,101,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,32,102,117,110,99,116,105,111,110,32,116,98,108,58,116,111,84,97,98,108,101,40,114,101,99,117,114,115,105,118,101,44,32,109,97,120,68,101,112,116,104,41,9,9,9,9,9,9,9,9,9,9,9,9,9,9,108,111,99,97,108,32,114,101,116,32,61,32,116,98,108,95,116,111,84,97,98,108,101,40,115,101,108,102,41,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,105,102,32,110,111,116,32,114,101,99,117,114,115,105,118,101,32,116,104,101,110,32,114,101,116,117,114,110,32,114,101,116,32,101,110,100,9,9,9,9,9,9,9,9,9,9,9,9,9,9,109,97,120,68,101,112,116,104,32,61,32,40,109,97,120,68,101,112,116,104,32,111,114,32,49,48,41,32,45,32,49,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,105,102,32,109,97,120,68,101,112,116,104,32,60,61,32,48,32,116,104,101,110,32,114,101,116,117,114,110,32,110,105,108,32,101,110,100,9,9,9,9,9,9,9,9,9,9,9,9,9,9,108,111,99,97,108,32,107,44,118,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,102,111,114,32,107,44,118,32,105,110,32,110,101,120,116,44,32,114,101,116,32,100,111,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,105,102,32,118,32,97,110,100,32,116,121,112,101,40,118,41,32,61,61,32,39,117,115,101,114,100,97,116,97,39,32,97,110,100,32,118,46,95,95,105,115,74,97,118,97,115,99,114,105,112,116,32,97,110,100,32,118,46,116,111,84,97,98,108,101,32,116,104,101,110,9,9,9,9,9,9,9,114,101,116,91,107,93,32,61,32,118,58,116,111,84,97,98,108,101,40,116,114,117,101,44,32,109,97,120,68,101,112,116,104,41,9,9,9,9,9,9,9,9,9,9,9,9,9,9,101,110,100,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,101,110,100,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,114,101,116,117,114,110,32,114,101,116,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,32,101,110,100,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,101,110,100,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,95,95,106,115,109,116,95,97,100,100,114,101,99,117,114,115,101,40,106,115,46,95,95,109,116,95,106,115,95,111,98,106,101,99,116,41,9,9,9,9,9,9,9,9,9,9,9,9,9,9,95,95,106,115,109,116,95,97,100,100,114,101,99,117,114,115,101,40,106,115,46,95,95,109,116,95,106,115,95,97,114,114,97,121,41,9,9,9,9,9,9,9,9,9,9,9,9,9,9,0,0,0,0,0,0,110,97,110,0,0,0,0,0,112,114,101,108,111,97,100,0,116,111,111,32,109,97,110,121,32,99,97,112,116,117,114,101,115,0,0,0,0,0,0,0,121,101,97,114,0,0,0,0,108,111,103,0,0,0,0,0,104,117,103,101,0,0,0,0,102,105,108,101,32,40,99,108,111,115,101,100,41,0,0,0,108,101,118,101,108,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,114,97,119,108,101,110,0,0,117,110,102,105,110,105,115,104,101,100,32,108,111,110,103,32,99,111,109,109,101,110,116,0,37,115,58,32,37,115,0,0,95,95,115,117,98,0,0,0,115,116,100,105,110,0,0,0,102,117,110,99,116,105,111,110,32,97,114,103,117,109,101,110,116,115,32,101,120,112,101,99,116,101,100,0,0,0,0,0,110,78,0,0,0,0,0,0,109,101,116,97,109,101,116,104,111,100,0,0,0,0,0,0,103,108,111,98,97,108,0,0,95,80,82,69,76,79,65,68,0,0,0,0,0,0,0,0,114,101,115,117,108,116,105,110,103,32,115,116,114,105,110,103,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,109,111,110,116,104,0,0,0,108,111,103,49,48,0,0,0,95,95,116,111,115,116,114,105,110,103,0,0,0,0,0,0,103,101,116,117,115,101,114,118,97,108,117,101,0,0,0,0,110,105,108,32,111,114,32,116,97,98,108,101,32,101,120,112,101,99,116,101,100,0,0,0,114,97,119,101,113,117,97,108,0,0,0,0,0,0,0,0,114,101,115,117,109,101,0,0,117,110,102,105,110,105,115,104,101,100,32,108,111,110,103,32,115,116,114,105,110,103,0,0,116,111,111,32,109,97,110,121,32,37,115,32,40,108,105,109,105,116,32,105,115,32,37,100,41,0,0,0,0,0,0,0,98,97,110,100,0,0,0,0,95,95,97,100,100,0,0,0,116,111,111,32,109,97,110,121,32,37,115,32,40,108,105,109,105,116,32,105,115,32,37,100,41,32,105,110,32,37,115,0,102,111,114,32,105,116,101,114,97,116,111,114,0,0,0,0,106,115,0,0,0,0,0,0,108,111,97,100,101,100,0,0,117,112,112,101,114,0,0,0,76,117,97,32,53,46,50,0,100,97,121,0,0,0,0,0,108,100,101,120,112,0,0,0,95,95,103,99,0,0,0,0,116,114,97,99,101,98,97,99,107,0,0,0,0,0,0,0,112,114,105,110,116,0,0,0,104,101,120,97,100,101,99,105,109,97,108,32,100,105,103,105,116,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,37,115,58,37,100,58,32,0,95,95,101,113,0,0,0,0,102,117,110,99,116,105,111,110,32,97,116,32,108,105,110,101,32,37,100,0,0,0,0,0,99,104,97,114,40,37,100,41,0,0,0,0,0,0,0,0,95,95,109,116,95,106,115,95,117,110,107,110,111,119,110,0,63,0,0,0,0,0,0,0,95,76,79,65,68,69,68,0,115,117,98,0,0,0,0,0,104,111,117,114,0,0,0,0,102,114,101,120,112,0,0,0,119,114,105,116,101,0,0,0,115,101,116,117,112,118,97,108,117,101,0,0,0,0,0,0,116,114,121,105,110,103,32,116,111,32,97,99,99,101,115,115,32,110,111,110,45,101,120,105,115,116,101,110,116,32,98,105,116,115,0,0,0,0,0,0,112,99,97,108,108,0,0,0,100,101,99,105,109,97,108,32,101,115,99,97,112,101,32,116,111,111,32,108,97,114,103,101,0,0,0,0,0,0,0,0,99,111,110,115,116,114,117,99,116,111,114,32,116,111,111,32,108,111,110,103,0,0,0,0,110,111,32,109,101,115,115,97,103,101,0,0,0,0,0,0,83,108,0,0,0,0,0,0,95,95,108,101,110,0,0,0,95,71,0,0,0,0,0,0,109,97,105,110,32,102,117,110,99,116,105,111,110,0,0,0,95,95,99,97,108,108,0,0,109,101,116,104,111,100,0,0,99,111,110,102,105,103,0,0,105,110,118,97,108,105,100,32,118,97,108,117,101,32,40,37,115,41,32,97,116,32,105,110,100,101,120,32,37,100,32,105,110,32,116,97,98,108,101,32,102,111,114,32,39,99,111,110,99,97,116,39,0,0,0,0,114,101,118,101,114,115,101,0,115,116,97,99,107,32,116,114,97,99,101,98,97,99,107,58,0,0,0,0,0,0,0,0,109,105,110,0,0,0,0,0,102,109,111,100,0,0,0,0,115,101,116,118,98,117,102,0,115,101,116,109,101,116,97,116,97,98,108,101,0,0,0,0,119,105,100,116,104,32,109,117,115,116,32,98,101,32,112,111,115,105,116,105,118,101,0,0,112,97,105,114,115,0,0,0,105,110,118,97,108,105,100,32,101,115,99,97,112,101,32,115,101,113,117,101,110,99,101,0,105,110,100,101,120,0,0,0,98,97,100,32,97,114,103,117,109,101,110,116,32,35,37,100,32,116,111,32,39,37,115,39,32,40,37,115,41,0,0,0,95,95,109,111,100,101,0,0,98,105,110,97,114,121,32,115,116,114,105,110,103,0,0,0,105,116,101,109,115,32,105,110,32,97,32,99,111,110,115,116,114,117,99,116,111,114,0,0,95,95,109,116,95,106,115,95,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,99,111,110,115,116,97,110,116,0,0,0,0,0,0,0,0,110,105,108,0,0,0,0,0,47,10,59,10,63,10,33,10,45,10,0,0,0,0,0,0,119,114,111,110,103,32,110,117,109,98,101,114,32,111,102,32,97,114,103,117,109,101,110,116,115,32,116,111,32,39,105,110,115,101,114,116,39,0,0,0,114,101,112,0,0,0,0,0,115,101,99,0,0,0,0,0,102,108,111,111,114,0,0,0,115,101,101,107,0,0,0,0,116,97,98,108,101,32,105,110,100,101,120,32,105,115,32,78,97,78,0,0,0,0,0,0,115,101,116,108,111,99,97,108,0,0,0,0,0,0,0,0,100,101,97,100,0,0,0,0,102,105,101,108,100,32,99,97,110,110,111,116,32,98,101,32,110,101,103,97,116,105,118,101,0,0,0,0,0,0,0,0,110,101,120,116,0,0,0,0,117,110,102,105,110,105,115,104,101,100,32,115,116,114,105,110,103,0,0,0,0,0,0,0,63,0,0,0,0,0,0,0,95,95,103,99,0,0,0,0,102,117,110,99,116,105,111,110,115,0,0,0,0,0,0,0,110,111,32,118,105,115,105,98,108,101,32,108,97,98,101,108,32,39,37,115,39,32,102,111,114,32,60,103,111,116,111,62,32,97,116,32,108,105,110,101,32,37,100,0,0,0,0,0,95,95,109,116,95,106,115,95,111,98,106,101,99,116,0,0,117,112,118,97,108,117,101,0,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,63,46,115,111,59,47,117,115,114,47,108,111,99,97,108,47,108,105,98,47,108,117,97,47,53,46,50,47,108,111,97,100,97,108,108,46,115,111,59,46,47,63,46,115,111,0,0,0,0,110,0,0,0,0,0,0,0,109,97,116,99,104,0,0,0,117,110,97,98,108,101,32,116,111,32,103,101,110,101,114,97,116,101,32,97,32,117,110,105,113,117,101,32,102,105,108,101,110,97,109,101,0,0,0,0,101,120,112,0,0,0,0,0,114,101,97,100,0,0,0,0,120,88,0,0,0,0,0,0,115,101,116,104,111,111,107,0,110,111,114,109,97,108,0,0,109,101,109,111,114,121,32,97,108,108,111,99,97,116,105,111,110,32,101,114,114,111,114,58,32,98,108,111,99,107,32,116,111,111,32,98,105,103,0,0,114,115,104,105,102,116,0,0,108,111,97,100,115,116,114,105,110,103,0,0,0,0,0,0,108,101,120,105,99,97,108,32,101,108,101,109,101,110,116,32,116,111,111,32,108,111,110,103,0,0,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,95,95,103,99,32,109,101,116,97,109,101,116,104,111,100,32,40,37,115,41,0,0,0,99,97,108,108,105,110,103,32,39,37,115,39,32,111,110,32,98,97,100,32,115,101,108,102,32,40,37,115,41,0,0,0,95,95,110,101,119,105,110,100,101,120,0,0,0,0,0,0,108,111,99,97,108,32,118,97,114,105,97,98,108,101,115,0,99,97,108,108,0,0,0,0,67,32,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,0,0,0,0,0,0,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,0,116,111,84,97,98,108,101,0,102,105,101,108,100,0,0,0,76,85,65,95,67,80,65,84,72,0,0,0,0,0,0,0,116,111,111,32,109,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,117,110,112,97,99,107,0,0,0,0,0,0,108,111,119,101,114,0,0,0,116,109,112,110,97,109,101,0,100,101,103,0,0,0,0,0,108,105,110,101,115,0,0,0,115,101,116,117,115,101,114,118,97,108,117,101,0,0,0,0,115,117,115,112,101,110,100,101,100,0,0,0,0,0,0,0,114,114,111,116,97,116,101,0,108,111,97,100,0,0,0,0,109,97,108,102,111,114,109,101,100,32,110,117,109,98,101,114,0,0,0,0,0,0,0,0,100,101,98,117,103,0,0,0,109,101,116,104,111,100,0,0,105,110,99,111,109,112,97,116,105,98,108,101,0,0,0,0,95,95,105,110,100,101,120,0,60,110,97,109,101,62,32,111,114,32,39,46,46,46,39,32,101,120,112,101,99,116,101,100,0,0,0,0,0,0,0,0,99,97,110,110,111,116,32,114,101,115,117,109,101,32,100,101,97,100,32,99,111,114,111,117,116,105,110,101,0,0,0,0,95,95,105,115,74,97,118,97,115,99,114,105,112,116,0,0,116,114,97,99,101,98,97,99,107,0,0,0,0,0,0,0,100,101,98,117,103,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);



var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


   
  Module["_strlen"] = _strlen;

  function _emscripten_exit_with_live_runtime() {
      Module['noExitRuntime'] = true;
      throw 'SimulateInfiniteLoop';
    }

  function _emscripten_asm_const_int(code) {
      var args = Array.prototype.slice.call(arguments, 1);
      return Runtime.getAsmConst(code, args.length).apply(null, args) | 0;
    }

  var _llvm_va_start=undefined;

  function _llvm_va_end() {}

  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }

  
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }

  function _llvm_lifetime_start() {}

  function _llvm_lifetime_end() {}

  
  
  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
  
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
  
        if (!total) {
          // early out
          return callback(null);
        }
  
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
  
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
  
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
  
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat, node;
  
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
  
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
  
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
  
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
  
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          FS.FSNode.prototype = {};
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
  
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
  
              if (!hasByteServing) chunkSize = datalength;
  
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
  
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
  
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
  
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  
  
  
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr;
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    } 
  Module["_saveSetjmp"] = _saveSetjmp;
  
   
  Module["_testSetjmp"] = _testSetjmp;function _longjmp(env, value) {
      asm['setThrew'](env, value || 1);
      throw 'longjmp';
    }

  function _abort() {
      Module['abort']();
    }

  var _setjmp=undefined;

  
   
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i64=_memset;

  var _floor=Math_floor;

  var _llvm_pow_f64=Math_pow;

  function _strpbrk(ptr1, ptr2) {
      var curr;
      var searchSet = {};
      while (1) {
        var curr = HEAP8[((ptr2++)|0)];
        if (!curr) break;
        searchSet[curr] = 1;
      }
      while (1) {
        curr = HEAP8[(ptr1)];
        if (!curr) break;
        if (curr in searchSet) return ptr1;
        ptr1++;
      }
      return 0;
    }

  
  
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision === -1) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }

  
   
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  var _llvm_memset_p0i8_i32=_memset;

   
  Module["_memcmp"] = _memcmp;

  var _strcoll=_strcmp;

  function ___errno_location() {
      return ___errno_state;
    }

  
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }

  
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }

  
  
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }function _freopen(filename, mode, stream) {
      // FILE *freopen(const char *restrict filename, const char *restrict mode, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/freopen.html
      if (!filename) {
        var streamObj = FS.getStream(stream);
        if (!streamObj) {
          ___setErrNo(ERRNO_CODES.EBADF);
          return 0;
        }
        if (_freopen.buffer) _free(_freopen.buffer);
        filename = intArrayFromString(streamObj.path);
        filename = allocate(filename, 'i8', ALLOC_NORMAL);
      }
      _fclose(stream);
      return _fopen(filename, mode);
    }

  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      stream = FS.getStream(stream);
      return Number(stream && stream.error);
    }


  function _strstr(ptr1, ptr2) {
      var check = 0, start;
      do {
        if (!check) {
          start = ptr1;
          check = ptr2;
        }
        var curr1 = HEAP8[((ptr1++)|0)];
        var curr2 = HEAP8[((check++)|0)];
        if (curr2 == 0) return start;
        if (curr2 != curr1) {
          // rewind to one character after start, to find ez in eeez
          ptr1 = start + 1;
          check = 0;
        }
      } while (curr1);
      return 0;
    }

  
  function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }


  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      stream = FS.getStream(stream);
      return Number(stream && stream.eof);
    }

  
  
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop();
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }

  
  function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;

  function _localeconv() {
      // %struct.timeval = type { char* decimal point, other stuff... }
      // var indexes = Runtime.calculateStructAlignment({ fields: ['i32', 'i32'] });
      var me = _localeconv;
      if (!me.ret) {
        me.ret = allocate([allocate(intArrayFromString('.'), 'i8', ALLOC_NORMAL)], 'i8*', ALLOC_NORMAL); // just decimal point, for now
      }
      return me.ret;
    }

  function _memchr(ptr, chr, num) {
      chr = unSign(chr);
      for (var i = 0; i < num; i++) {
        if (HEAP8[(ptr)] == chr) return ptr;
        ptr++;
      }
      return 0;
    }

  function _strspn(pstr, pset) {
      var str = pstr, set, strcurr, setcurr;
      while (1) {
        strcurr = HEAP8[(str)];
        if (!strcurr) return str - pstr;
        set = pset;
        while (1) {
          setcurr = HEAP8[(set)];
          if (!setcurr || setcurr == strcurr) break;
          set++;
        }
        if (!setcurr) return str - pstr;
        str++;
      }
    }

  function _isalnum(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }

  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }



  function _fgets(s, n, stream) {
      // char *fgets(char *restrict s, int n, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgets.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return 0;
      if (streamObj.error || streamObj.eof) return 0;
      var byte_;
      for (var i = 0; i < n - 1 && byte_ != 10; i++) {
        byte_ = _fgetc(stream);
        if (byte_ == -1) {
          if (streamObj.error || (streamObj.eof && i == 0)) return 0;
          else if (streamObj.eof) break;
        }
        HEAP8[(((s)+(i))|0)]=byte_;
      }
      HEAP8[(((s)+(i))|0)]=0;
      return s;
    }

  function _setvbuf(stream, buf, type, size) {
      // int setvbuf(FILE *restrict stream, char *restrict buf, int type, size_t size);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/setvbuf.html
      // TODO: Implement custom buffering.
      return 0;
    }

  
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStream(stream);
      stream.eof = false;
      return 0;
    }

  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStream(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }

  function _clearerr(stream) {
      // void clearerr(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/clearerr.html
      stream = FS.getStream(stream);
      if (!stream) {
        return;
      }
      stream.eof = false;
      stream.error = false;
    }

  
  
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
  
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
  
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
  
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
  
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
  
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
  
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
  
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
  
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
  
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16);
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text);
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text);
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j];
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }
  
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }function _fscanf(stream, format, varargs) {
      // int fscanf(FILE *restrict stream, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        return -1;
      }
      var buffer = [];
      function get() {
        var c = _fgetc(stream);
        buffer.push(c);
        return c;
      };
      function unget() {
        _ungetc(buffer.pop(), stream);
      };
      return __scanString(format, get, unget, varargs);
    }


  
  function _tmpnam(s, dir, prefix) {
      // char *tmpnam(char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpnam.html
      // NOTE: The dir and prefix arguments are for internal use only.
      var folder = FS.findObject(dir || '/tmp');
      if (!folder || !folder.isFolder) {
        dir = '/tmp';
        folder = FS.findObject(dir);
        if (!folder || !folder.isFolder) return 0;
      }
      var name = prefix || 'file';
      do {
        name += String.fromCharCode(65 + Math.floor(Math.random() * 25));
      } while (name in folder.contents);
      var result = dir + '/' + name;
      if (!_tmpnam.buffer) _tmpnam.buffer = _malloc(256);
      if (!s) s = _tmpnam.buffer;
      writeAsciiToMemory(result, s);
      return s;
    }function _tmpfile() {
      // FILE *tmpfile(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpfile.html
      // TODO: Delete the created file on closing.
      if (_tmpfile.mode) {
        _tmpfile.mode = allocate(intArrayFromString('w+'), 'i8', ALLOC_NORMAL);
      }
      return _fopen(_tmpnam(0), _tmpfile.mode);
    }

  var _tan=Math_tan;

  
  function _sinh(x) {
      var p = Math.pow(Math.E, x);
      return (p - (1 / p)) / 2;
    }
  
  function _cosh(x) {
      var p = Math.pow(Math.E, x);
      return (p + (1 / p)) / 2;
    }function _tanh(x) {
      return _sinh(x) / _cosh(x);
    }

  var _sqrt=Math_sqrt;

  var _sin=Math_sin;


  function _srand(seed) {}

  function _rand() {
      return Math.floor(Math.random()*0x80000000);
    }

  function _modf(x, intpart) {
      HEAPF64[((intpart)>>3)]=Math.floor(x);
      return x - HEAPF64[((intpart)>>3)];
    }

  var _log=Math_log;

  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }

  function _frexp(x, exp_addr) {
      var sig = 0, exp_ = 0;
      if (x !== 0) {
        var sign = 1;
        if (x < 0) {
          x = -x;
          sign = -1;
        }
        var raw_exp = Math.log(x)/Math.log(2);
        exp_ = Math.ceil(raw_exp);
        if (exp_ === raw_exp) exp_ += 1;
        sig = sign*x/Math.pow(2, exp_);
      }
      HEAP32[((exp_addr)>>2)]=exp_;
      return sig;
    }

  function _fmod(x, y) {
      return x % y;
    }

  var _exp=Math_exp;

  var _cos=Math_cos;


  var _ceil=Math_ceil;

  var _atan=Math_atan;

  var _atan2=Math_atan2;

  var _asin=Math_asin;

  var _acos=Math_acos;

  var _fabs=Math_abs;


  
  
  var _tzname=allocate(8, "i32*", ALLOC_STATIC);
  
  var _daylight=allocate(1, "i32*", ALLOC_STATIC);
  
  var _timezone=allocate(1, "i32*", ALLOC_STATIC);function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
  
      HEAP32[((_timezone)>>2)]=-(new Date()).getTimezoneOffset() * 60;
  
      var winter = new Date(2000, 0, 1);
      var summer = new Date(2000, 6, 1);
      HEAP32[((_daylight)>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());
  
      var winterName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | winter.toString().match(/\(([A-Z]+)\)/)[1];
      var summerName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | summer.toString().match(/\(([A-Z]+)\)/)[1];
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      HEAP32[((_tzname)>>2)]=winterNamePtr;
      HEAP32[(((_tzname)+(4))>>2)]=summerNamePtr;
    }function _mktime(tmPtr) {
      _tzset();
      var year = HEAP32[(((tmPtr)+(20))>>2)];
      var timestamp = new Date(year >= 1900 ? year : year + 1900,
                               HEAP32[(((tmPtr)+(16))>>2)],
                               HEAP32[(((tmPtr)+(12))>>2)],
                               HEAP32[(((tmPtr)+(8))>>2)],
                               HEAP32[(((tmPtr)+(4))>>2)],
                               HEAP32[((tmPtr)>>2)],
                               0).getTime() / 1000;
      HEAP32[(((tmPtr)+(24))>>2)]=new Date(timestamp).getDay();
      var yday = Math.round((timestamp - (new Date(year, 0, 1)).getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      return timestamp;
    }

  function _setlocale(category, locale) {
      if (!_setlocale.ret) _setlocale.ret = allocate([0], 'i8', ALLOC_NORMAL);
      return _setlocale.ret;
    }

  function _rename(old_path, new_path) {
      // int rename(const char *old, const char *new);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rename.html
      old_path = Pointer_stringify(old_path);
      new_path = Pointer_stringify(new_path);
      try {
        FS.rename(old_path, new_path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = Pointer_stringify(path);
      try {
        FS.unlink(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _rmdir(path) {
      // int rmdir(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rmdir.html
      path = Pointer_stringify(path);
      try {
        FS.rmdir(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _remove(path) {
      // int remove(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/remove.html
      var ret = _unlink(path);
      if (ret == -1) ret = _rmdir(path);
      return ret;
    }

  
  
  
  
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
  
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr;
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
  
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
  
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
  
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }

  function _system(command) {
      // int system(const char *command);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/system.html
      // Can't call external programs.
      ___setErrNo(ERRNO_CODES.EAGAIN);
      return -1;
    }

  function _difftime(time1, time0) {
      return time1 - time0;
    }

  
  var ___tm_current=allocate(44, "i8", ALLOC_STATIC);
  
  
  var ___tm_timezone=allocate(intArrayFromString("GMT"), "i8", ALLOC_STATIC);function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getUTCHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getUTCDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getUTCDay();
      HEAP32[(((tmPtr)+(36))>>2)]=0;
      HEAP32[(((tmPtr)+(32))>>2)]=0;
      var start = new Date(date); // define date using UTC, start from Jan 01 00:00:00 UTC
      start.setUTCDate(1);
      start.setUTCMonth(0);
      start.setUTCHours(0);
      start.setUTCMinutes(0);
      start.setUTCSeconds(0);
      start.setUTCMilliseconds(0);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _gmtime(time) {
      return _gmtime_r(time, ___tm_current);
    }

  
  function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getDay();
  
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(36))>>2)]=start.getTimezoneOffset() * 60;
  
      var dst = Number(start.getTimezoneOffset() != date.getTimezoneOffset());
      HEAP32[(((tmPtr)+(32))>>2)]=dst;
  
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }

  
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
  
      var pattern = Pointer_stringify(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }

  function _clock() {
      if (_clock.start === undefined) _clock.start = Date.now();
      return Math.floor((Date.now() - _clock.start) * (1000000/1000));
    }

   
  Module["_tolower"] = _tolower;

  function _isalpha(chr) {
      return (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }

  function _iscntrl(chr) {
      return (0 <= chr && chr <= 0x1F) || chr === 0x7F;
    }

  function _isgraph(chr) {
      return 0x20 < chr && chr < 0x7F;
    }

  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }

  function _ispunct(chr) {
      return (chr >= 33 && chr <= 47) ||
             (chr >= 58 && chr <= 64) ||
             (chr >= 91 && chr <= 96) ||
             (chr >= 123 && chr <= 126);
    }

  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }

  function _isupper(chr) {
      return chr >= 65 && chr <= 90;
    }

  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }

  function _llvm_uadd_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return ((asm["setTempRet0"](x+y > 4294967295),(x+y)>>>0)|0);
    }

  function _strrchr(ptr, chr) {
      var ptr2 = ptr + _strlen(ptr);
      do {
        if (HEAP8[(ptr2)] == chr) return ptr2;
        ptr2--;
      } while (ptr2 >= ptr);
      return 0;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  
  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }var _copysignl=_copysign;

  var _fmodl=_fmod;






  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
___buildEnvironment(ENV);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stdin|0;var p=env._stderr|0;var q=env._stdout|0;var r=+env.NaN;var s=+env.Infinity;var t=0;var u=0;var v=0;var w=0;var x=0,y=0,z=0,A=0,B=0.0,C=0,D=0,E=0,F=0.0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=global.Math.floor;var R=global.Math.abs;var S=global.Math.sqrt;var T=global.Math.pow;var U=global.Math.cos;var V=global.Math.sin;var W=global.Math.tan;var X=global.Math.acos;var Y=global.Math.asin;var Z=global.Math.atan;var _=global.Math.atan2;var $=global.Math.exp;var aa=global.Math.log;var ba=global.Math.ceil;var ca=global.Math.imul;var da=env.abort;var ea=env.assert;var fa=env.asmPrintInt;var ga=env.asmPrintFloat;var ha=env.min;var ia=env.jsCall;var ja=env.invoke_ii;var ka=env.invoke_vi;var la=env.invoke_vii;var ma=env.invoke_iiiii;var na=env.invoke_iiii;var oa=env.invoke_v;var pa=env.invoke_iii;var qa=env._llvm_lifetime_end;var ra=env._lseek;var sa=env._rand;var ta=env.__scanString;var ua=env._fclose;var va=env._freopen;var wa=env._fflush;var xa=env._fputc;var ya=env._fwrite;var za=env._send;var Aa=env._mktime;var Ba=env._tmpnam;var Ca=env._isspace;var Da=env._localtime;var Ea=env._read;var Fa=env._ceil;var Ga=env._strstr;var Ha=env._fsync;var Ia=env._fscanf;var Ja=env._remove;var Ka=env._modf;var La=env._strcmp;var Ma=env._memchr;var Na=env._llvm_va_end;var Oa=env._tmpfile;var Pa=env._snprintf;var Qa=env._fgetc;var Ra=env._cosh;var Sa=env.__getFloat;var Ta=env._fgets;var Ua=env._close;var Va=env._strchr;var Wa=env._asin;var Xa=env._clock;var Ya=env.___setErrNo;var Za=env._emscripten_exit_with_live_runtime;var _a=env._isxdigit;var $a=env._ftell;var ab=env._exit;var bb=env._sprintf;var cb=env._strrchr;var db=env._fmod;var eb=env.__isLeapYear;var fb=env._copysign;var gb=env._ferror;var hb=env._llvm_uadd_with_overflow_i32;var ib=env._gmtime;var jb=env._localtime_r;var kb=env._sinh;var lb=env._recv;var mb=env._cos;var nb=env._putchar;var ob=env._islower;var pb=env._acos;var qb=env._isupper;var rb=env._strftime;var sb=env._strncmp;var tb=env._tzset;var ub=env._setlocale;var vb=env._toupper;var wb=env._pread;var xb=env._fopen;var yb=env._open;var zb=env._frexp;var Ab=env.__arraySum;var Bb=env._log;var Cb=env._isalnum;var Db=env._system;var Eb=env._isalpha;var Fb=env._rmdir;var Gb=env._log10;var Hb=env._fread;var Ib=env.__reallyNegative;var Jb=env.__formatString;var Kb=env._getenv;var Lb=env._llvm_pow_f64;var Mb=env._sbrk;var Nb=env._tanh;var Ob=env._localeconv;var Pb=env.___errno_location;var Qb=env._strerror;var Rb=env._llvm_lifetime_start;var Sb=env._strspn;var Tb=env._ungetc;var Ub=env._rename;var Vb=env._sysconf;var Wb=env._srand;var Xb=env._abort;var Yb=env._fprintf;var Zb=env._tan;var _b=env.___buildEnvironment;var $b=env._feof;var ac=env.__addDays;var bc=env._gmtime_r;var cc=env._ispunct;var dc=env._clearerr;var ec=env._fabs;var fc=env._floor;var gc=env._fseek;var hc=env._sqrt;var ic=env._emscripten_asm_const_int;var jc=env._sin;var kc=env._longjmp;var lc=env._atan;var mc=env._strpbrk;var nc=env._isgraph;var oc=env._unlink;var pc=env.__exit;var qc=env._pwrite;var rc=env._strerror_r;var sc=env._difftime;var tc=env._iscntrl;var uc=env._atan2;var vc=env._write;var wc=env._exp;var xc=env._time;var yc=env._setvbuf;var zc=0.0;
// EMSCRIPTEN_START_FUNCS
function Hc(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function Ic(){return i|0}function Jc(a){a=a|0;i=a}function Kc(a,b){a=a|0;b=b|0;if((t|0)==0){t=a;u=b}}function Lc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function Mc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function Nc(a){a=a|0;G=a}function Oc(a){a=a|0;H=a}function Pc(a){a=a|0;I=a}function Qc(a){a=a|0;J=a}function Rc(a){a=a|0;K=a}function Sc(a){a=a|0;L=a}function Tc(a){a=a|0;M=a}function Uc(a){a=a|0;N=a}function Vc(a){a=a|0;O=a}function Wc(a){a=a|0;P=a}function Xc(){}function Yc(a,b){a=a|0;b=b|0;c[3444]=a;c[3442]=b;return}function Zc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=Fe(a,8)|0;c[e+4>>2]=b;c[e>>2]=d;_c(a,d);se(a,-3)|0;yd(a,-2);return}function _c(a,b){a=a|0;b=b|0;if((b|0)==1){fe(a,11968);_d(a,12672)|0;ie(a,-2);return}else if((b|0)==3){fe(a,11968);_d(a,13e3)|0;ie(a,-2);return}else if((b|0)==2){fe(a,11968);_d(a,4480)|0;ie(a,-2);return}else{fe(a,11968);_d(a,12136)|0;ie(a,-2);return}}function $c(a){a=a|0;var b=0;b=Qd(a,-1,0)|0;yd(a,-2);return b|0}function ad(a,b){a=a|0;b=b|0;_d(a,b)|0;return}function bd(a){a=a|0;var b=0.0;b=+Md(a,-1,0);yd(a,-2);return+b}function cd(a,b){a=a|0;b=+b;Wd(a,b);return}function dd(a,b){a=a|0;b=b|0;Dd(a,b);return di(a,-1001e3)|0}function ed(a,b){a=a|0;b=b|0;je(a,-1001e3,b);return}function fd(a,b){a=a|0;b=b|0;ei(a,-1001e3,b);return}function gd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=xd(a)|0;d=-2-b|0;fe(a,13736);he(a,-1,13720);zd(a,-2);Ad(a,d);e=(we(a,b,-1,d,0,0)|0)==0;zd(a,1);d=b+1-c+(xd(a)|0)|0;return(e?d:-d|0)|0}function hd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;gi(a,b,jn(b|0)|0,10248,0)|0;if((Id(a,-1)|0)!=0){c=-1;return c|0}b=xd(a)|0;fe(a,13736);he(a,-1,13720);zd(a,-2);Ad(a,-2);d=(we(a,0,-1,-2,0,0)|0)==0;zd(a,1);e=(xd(a)|0)+(1-b)|0;c=d?e:-e|0;return c|0}function id(){var a=0,b=0;a=ri()|0;Ae(a,0,0)|0;zi(a);Ae(a,1,0)|0;ke(a,0,0);_d(a,7440)|0;be(a,160,0);qe(a,-3);_d(a,5896)|0;be(a,366,0);qe(a,-3);_d(a,4480)|0;ke(a,0,0);_d(a,3912)|0;be(a,236,0);qe(a,-3);_d(a,3560)|0;be(a,150,0);qe(a,-3);_d(a,3088)|0;be(a,156,0);qe(a,-3);_d(a,2696)|0;be(a,136,0);qe(a,-3);_d(a,13704)|0;ce(a,1);qe(a,-3);_d(a,13432)|0;be(a,70,0);qe(a,-3);qe(a,-3);_d(a,13e3)|0;ke(a,0,0);_d(a,3912)|0;be(a,236,0);qe(a,-3);_d(a,3560)|0;be(a,150,0);qe(a,-3);_d(a,3088)|0;be(a,156,0);qe(a,-3);_d(a,13432)|0;be(a,70,0);qe(a,-3);_d(a,13704)|0;ce(a,1);qe(a,-3);qe(a,-3);_d(a,12672)|0;ke(a,0,0);_d(a,3912)|0;be(a,236,0);qe(a,-3);_d(a,12376)|0;be(a,366,0);qe(a,-3);_d(a,13704)|0;ce(a,1);qe(a,-3);qe(a,-3);_d(a,12136)|0;ke(a,0,0);_d(a,3912)|0;be(a,236,0);qe(a,-3);_d(a,13704)|0;ce(a,1);qe(a,-3);qe(a,-3);ne(a,11968);fe(a,11968);_d(a,11696)|0;b=Fe(a,8)|0;c[b+4>>2]=-1;c[b>>2]=3;fe(a,11968);_d(a,13e3)|0;ie(a,-2);se(a,-3)|0;yd(a,-2);qe(a,-3);yd(a,-2);hd(a,10696)|0;return a|0}function jd(a){a=a|0;var b=0,c=0,d=0;b=i;c=Qd(a,-1,0)|0;yd(a,-2);d=ic(8400,a|0,c|0)|0;i=b;return d|0}function kd(a){a=a|0;var b=0,d=0,e=0;if((Jd(a,1)|0)==0){_d(a,10464)|0;Be(a)|0}b=Sd(a,1)|0;zd(a,1);if((c[b>>2]|0)==1){d=c[3444]|0;e=c[b+4>>2]|0;b=xd(a)|0;Dc[d&63](e,a,b,1)|0;return 1}else{_d(a,8696)|0;Be(a)|0;return 1}return 0}function ld(a){a=a|0;var b=0;if((Jd(a,1)|0)==0){_d(a,10464)|0;Be(a)|0}b=Sd(a,1)|0;zd(a,1);Ac[c[3442]&511](c[b+4>>2]|0)|0;return 0}function md(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;if((Hd(a,-1)|0)==0){d=1;e=Qd(a,-1,0)|0}else{d=0;e=~~+Md(a,-1,0)}yd(a,-2);if((Jd(a,1)|0)==0){_d(a,10464)|0;Be(a)|0}f=Sd(a,1)|0;zd(a,1);do{if((d|0)!=0){_c(a,c[f>>2]|0);_d(a,e)|0;ie(a,-2);zd(a,1);zd(a,1);if((Ed(a,-1)|0)==0){yd(a,-2);break}else{g=1;i=b;return g|0}}}while(0);g=ic(8920,a|0,c[f+4>>2]|0,e|0,d|0)|0;i=b;return g|0}function nd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=di(a,-1001e3)|0;if((Hd(a,-1)|0)==0){e=Qd(a,-1,0)|0;f=1}else{e=~~+Md(a,-1,0);f=0}yd(a,-2);if((Jd(a,1)|0)==0){_d(a,10464)|0;Be(a)|0}g=Sd(a,1)|0;zd(a,1);je(a,-1001e3,d);h=ic(9272,a|0,c[g+4>>2]|0,e|0,f|0)|0;yd(a,-2);ei(a,-1001e3,d);i=b;return h|0}function od(a){a=a|0;var b=0,d=0;b=i;if((Jd(a,1)|0)==0){_d(a,10464)|0;Be(a)|0}d=Sd(a,1)|0;zd(a,1);Wd(a,+(ic(9664,c[d+4>>2]|0)|0));i=b;return 1}function pd(a){a=a|0;var b=0,d=0;b=i;if((Jd(a,1)|0)==0){_d(a,10464)|0;Be(a)|0}d=Sd(a,1)|0;zd(a,1);ke(a,0,0);ic(9920,a|0,c[d+4>>2]|0)|0;i=b;return 1}function qd(a){a=a|0;Kg(a);return}function rd(){Za();return 0}function sd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+8|0;e=d|0;c[e>>2]=b;f=c[a+16>>2]|0;g=a+8|0;h=c[g>>2]|0;j=h;do{if(((c[a+24>>2]|0)-j>>4|0)>(b|0)){k=1;l=h;m=b}else{if(((j-(c[a+28>>2]|0)>>4)+5|0)>(1e6-b|0)){n=0;i=d;return n|0}o=(bf(a,46,e)|0)==0;if(o){k=o&1;l=c[g>>2]|0;m=c[e>>2]|0;break}else{n=0;i=d;return n|0}}}while(0);e=f+4|0;f=l+(m<<4)|0;if((c[e>>2]|0)>>>0>=f>>>0){n=k;i=d;return n|0}c[e>>2]=f;n=k;i=d;return n|0}function td(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;if((a|0)==(b|0)){return}e=a+8|0;a=(c[e>>2]|0)+(-d<<4)|0;c[e>>2]=a;if((d|0)<=0){return}f=b+8|0;b=0;g=a;while(1){a=c[f>>2]|0;c[f>>2]=a+16;h=g+(b<<4)|0;i=a;j=c[h+4>>2]|0;c[i>>2]=c[h>>2];c[i+4>>2]=j;c[a+8>>2]=c[g+(b<<4)+8>>2];a=b+1|0;if((a|0)>=(d|0)){break}b=a;g=c[e>>2]|0}return}function ud(a,b){a=a|0;b=b|0;var d=0;d=(c[a+12>>2]|0)+168|0;a=c[d>>2]|0;c[d>>2]=b;return a|0}function vd(a){a=a|0;var b=0;if((a|0)==0){b=920;return b|0}b=c[(c[a+12>>2]|0)+176>>2]|0;return b|0}function wd(a,b){a=a|0;b=b|0;var d=0;if((b+1000999|0)>>>0>1000999>>>0){d=b;return d|0}d=((c[a+8>>2]|0)-(c[c[a+16>>2]>>2]|0)>>4)+b|0;return d|0}function xd(a){a=a|0;return(c[a+8>>2]|0)-((c[c[a+16>>2]>>2]|0)+16)>>4|0}function yd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;if((b|0)<=-1){d=a+8|0;c[d>>2]=(c[d>>2]|0)+(b+1<<4);return}d=a+8|0;e=c[d>>2]|0;f=(c[c[a+16>>2]>>2]|0)+(b+1<<4)|0;if(e>>>0<f>>>0){b=e;do{c[d>>2]=b+16;c[b+8>>2]=0;b=c[d>>2]|0;}while(b>>>0<f>>>0)}c[d>>2]=f;return}function zd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=g+16|0;b=a+8|0;a=c[b>>2]|0;if(e>>>0<a>>>0){j=g;k=e}else{l=a;m=l-16|0;c[b>>2]=m;return}while(1){a=k;e=j;g=c[a+4>>2]|0;c[e>>2]=c[a>>2];c[e+4>>2]=g;c[j+8>>2]=c[j+24>>2];g=k+16|0;e=c[b>>2]|0;if(g>>>0<e>>>0){j=k;k=g}else{l=e;break}}m=l-16|0;c[b>>2]=m;return}function Ad(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;a=c[e>>2]|0;if(a>>>0>g>>>0){b=a;while(1){f=b-16|0;i=f;h=b;j=c[i+4>>2]|0;c[h>>2]=c[i>>2];c[h+4>>2]=j;c[b+8>>2]=c[b-16+8>>2];if(f>>>0>g>>>0){b=f}else{break}}k=c[e>>2]|0}else{k=a}a=k;e=g;b=c[a+4>>2]|0;c[e>>2]=c[a>>2];c[e+4>>2]=b;c[g+8>>2]=c[k+8>>2];return}function Bd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b+8|0;g=c[f>>2]|0;h=g-16|0;i=b+16|0;j=c[i>>2]|0;do{if((e|0)>0){k=(c[j>>2]|0)+(e<<4)|0;l=k>>>0<g>>>0?k:1224}else{if((e|0)>=-1000999){l=g+(e<<4)|0;break}if((e|0)==-1001e3){l=(c[b+12>>2]|0)+40|0;break}k=-1001e3-e|0;m=c[j>>2]|0;if((c[m+8>>2]|0)==22){l=1224;break}n=c[m>>2]|0;if((k|0)>(d[n+6|0]|0|0)){l=1224;break}l=n+16+(k-1<<4)|0}}while(0);j=h;k=l;n=c[j+4>>2]|0;c[k>>2]=c[j>>2];c[k+4>>2]=n;n=g-16+8|0;c[l+8>>2]=c[n>>2];do{if((e|0)<-1001e3){if((c[n>>2]&64|0)==0){break}l=c[h>>2]|0;if((a[l+5|0]&3)==0){break}g=c[c[c[i>>2]>>2]>>2]|0;if((a[g+5|0]&4)==0){break}Df(b,g,l)}}while(0);c[f>>2]=(c[f>>2]|0)-16;return}function Cd(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=b+16|0;h=c[g>>2]|0;do{if((e|0)>0){i=(c[h>>2]|0)+(e<<4)|0;j=i>>>0<(c[b+8>>2]|0)>>>0?i:1224}else{if((e|0)>=-1000999){j=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){j=(c[b+12>>2]|0)+40|0;break}i=-1001e3-e|0;k=c[h>>2]|0;if((c[k+8>>2]|0)==22){j=1224;break}l=c[k>>2]|0;if((i|0)>(d[l+6|0]|0|0)){j=1224;break}j=l+16+(i-1<<4)|0}}while(0);do{if((f|0)>0){e=(c[h>>2]|0)+(f<<4)|0;m=e>>>0<(c[b+8>>2]|0)>>>0?e:1224}else{if((f|0)>=-1000999){m=(c[b+8>>2]|0)+(f<<4)|0;break}if((f|0)==-1001e3){m=(c[b+12>>2]|0)+40|0;break}e=-1001e3-f|0;i=c[h>>2]|0;if((c[i+8>>2]|0)==22){m=1224;break}l=c[i>>2]|0;if((e|0)>(d[l+6|0]|0|0)){m=1224;break}m=l+16+(e-1<<4)|0}}while(0);h=j;e=m;l=c[h+4>>2]|0;c[e>>2]=c[h>>2];c[e+4>>2]=l;l=j+8|0;c[m+8>>2]=c[l>>2];if((f|0)>=-1001e3){return}if((c[l>>2]&64|0)==0){return}l=c[j>>2]|0;if((a[l+5|0]&3)==0){return}j=c[c[c[g>>2]>>2]>>2]|0;if((a[j+5|0]&4)==0){return}Df(b,j,l);return}function Dd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;a=c[e>>2]|0;b=g;f=a;i=c[b+4>>2]|0;c[f>>2]=c[b>>2];c[f+4>>2]=i;c[a+8>>2]=c[g+8>>2];c[e>>2]=(c[e>>2]|0)+16;return}function Ed(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;if(f>>>0<(c[a+8>>2]|0)>>>0){g=f;break}else{h=-1}return h|0}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;i=c[e>>2]|0;if((c[i+8>>2]|0)==22){h=-1;return h|0}j=c[i>>2]|0;if((f|0)>(d[j+6|0]|0|0)){h=-1;return h|0}else{g=j+16+(f-1<<4)|0;break}}}while(0);if((g|0)==1224){h=-1;return h|0}h=c[g+8>>2]&15;return h|0}function Fd(a,b){a=a|0;b=b|0;return c[1064+(b+1<<2)>>2]|0}function Gd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]|0;if((e|0)==22){j=1;return j|0}j=(e|0)==102|0;return j|0}function Hd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+16|0;f=e|0;g=c[a+16>>2]|0;do{if((b|0)>0){h=(c[g>>2]|0)+(b<<4)|0;j=h>>>0<(c[a+8>>2]|0)>>>0?h:1224}else{if((b|0)>=-1000999){j=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){j=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)==22){j=1224;break}l=c[k>>2]|0;if((h|0)>(d[l+6|0]|0|0)){j=1224;break}j=l+16+(h-1<<4)|0}}while(0);if((c[j+8>>2]|0)==3){m=1;i=e;return m|0}m=(mh(j,f)|0)!=0|0;i=e;return m|0}function Id(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;if(f>>>0<(c[a+8>>2]|0)>>>0){g=f;h=10}else{i=-1}}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;h=10;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;h=10;break}f=-1001e3-b|0;j=c[e>>2]|0;if((c[j+8>>2]|0)==22){i=-1;break}k=c[j>>2]|0;if((f|0)>(d[k+6|0]|0|0)){i=-1;break}g=k+16+(f-1<<4)|0;h=10}}while(0);do{if((h|0)==10){if((g|0)==1224){i=-1;break}e=c[g+8>>2]&15;if((e|0)==4){l=1}else{i=e;break}return l|0}}while(0);l=(i|0)==3|0;return l|0}function Jd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]|0;if((e|0)==71){j=1;return j|0}j=(e|0)==2|0;return j|0}function Kd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);do{if((e|0)>0){b=(c[f>>2]|0)+(e<<4)|0;k=b>>>0<(c[a+8>>2]|0)>>>0?b:1224}else{if((e|0)>=-1000999){k=(c[a+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){k=(c[a+12>>2]|0)+40|0;break}b=-1001e3-e|0;g=c[f>>2]|0;if((c[g+8>>2]|0)==22){l=0;return l|0}j=c[g>>2]|0;if((b|0)>(d[j+6|0]|0|0)){l=0;return l|0}else{k=j+16+(b-1<<4)|0;break}}}while(0);if(!((h|0)!=1224&(k|0)!=1224)){l=0;return l|0}if((c[h+8>>2]|0)!=(c[k+8>>2]|0)){l=0;return l|0}l=(sh(0,h,k)|0)!=0|0;return l|0}function Ld(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[a+16>>2]|0;do{if((b|0)>0){h=(c[g>>2]|0)+(b<<4)|0;i=h>>>0<(c[a+8>>2]|0)>>>0?h:1224}else{if((b|0)>=-1000999){i=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){i=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[g>>2]|0;if((c[j+8>>2]|0)==22){i=1224;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1224;break}i=k+16+(h-1<<4)|0}}while(0);do{if((e|0)>0){b=(c[g>>2]|0)+(e<<4)|0;l=b>>>0<(c[a+8>>2]|0)>>>0?b:1224}else{if((e|0)>=-1000999){l=(c[a+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}b=-1001e3-e|0;h=c[g>>2]|0;if((c[h+8>>2]|0)==22){m=0;return m|0}k=c[h>>2]|0;if((b|0)>(d[k+6|0]|0|0)){m=0;return m|0}else{l=k+16+(b-1<<4)|0;break}}}while(0);if(!((i|0)!=1224&(l|0)!=1224)){m=0;return m|0}if((f|0)==1){m=qh(a,i,l)|0;return m|0}else if((f|0)==2){m=rh(a,i,l)|0;return m|0}else if((f|0)==0){if((c[i+8>>2]|0)!=(c[l+8>>2]|0)){m=0;return m|0}m=(sh(a,i,l)|0)!=0|0;return m|0}else{m=0;return m|0}return 0}function Md(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0.0;f=i;i=i+16|0;g=f|0;j=c[a+16>>2]|0;do{if((b|0)>0){k=(c[j>>2]|0)+(b<<4)|0;l=k>>>0<(c[a+8>>2]|0)>>>0?k:1224}else{if((b|0)>=-1000999){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}k=-1001e3-b|0;m=c[j>>2]|0;if((c[m+8>>2]|0)==22){l=1224;break}n=c[m>>2]|0;if((k|0)>(d[n+6|0]|0|0)){l=1224;break}l=n+16+(k-1<<4)|0}}while(0);do{if((c[l+8>>2]|0)==3){o=l}else{j=mh(l,g)|0;if((j|0)!=0){o=j;break}if((e|0)==0){p=0.0;i=f;return+p}c[e>>2]=0;p=0.0;i=f;return+p}}while(0);if((e|0)!=0){c[e>>2]=1}p=+h[o>>3];i=f;return+p}function Nd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+16|0;g=f|0;j=c[a+16>>2]|0;do{if((b|0)>0){k=(c[j>>2]|0)+(b<<4)|0;l=k>>>0<(c[a+8>>2]|0)>>>0?k:1224}else{if((b|0)>=-1000999){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}k=-1001e3-b|0;m=c[j>>2]|0;if((c[m+8>>2]|0)==22){l=1224;break}n=c[m>>2]|0;if((k|0)>(d[n+6|0]|0|0)){l=1224;break}l=n+16+(k-1<<4)|0}}while(0);do{if((c[l+8>>2]|0)==3){o=l}else{j=mh(l,g)|0;if((j|0)!=0){o=j;break}if((e|0)==0){p=0;i=f;return p|0}c[e>>2]=0;p=0;i=f;return p|0}}while(0);g=~~+h[o>>3];if((e|0)==0){p=g;i=f;return p|0}c[e>>2]=1;p=g;i=f;return p|0}function Od(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+24|0;g=f|0;j=f+16|0;k=c[a+16>>2]|0;do{if((b|0)>0){l=(c[k>>2]|0)+(b<<4)|0;m=l>>>0<(c[a+8>>2]|0)>>>0?l:1224}else{if((b|0)>=-1000999){m=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){m=(c[a+12>>2]|0)+40|0;break}l=-1001e3-b|0;n=c[k>>2]|0;if((c[n+8>>2]|0)==22){m=1224;break}o=c[n>>2]|0;if((l|0)>(d[o+6|0]|0|0)){m=1224;break}m=o+16+(l-1<<4)|0}}while(0);do{if((c[m+8>>2]|0)==3){p=m}else{k=mh(m,g)|0;if((k|0)!=0){p=k;break}if((e|0)==0){q=0;i=f;return q|0}c[e>>2]=0;q=0;i=f;return q|0}}while(0);h[j>>3]=+h[p>>3]+6755399441055744.0;p=c[j>>2]|0;if((e|0)==0){q=p;i=f;return q|0}c[e>>2]=1;q=p;i=f;return q|0}function Pd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]|0;if((e|0)==0){j=0;return j|0}if((e|0)!=1){j=1;return j|0}j=(c[g>>2]|0)!=0|0;return j|0}function Qd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=a+16|0;g=c[f>>2]|0;h=(b|0)>0;do{if(h){i=(c[g>>2]|0)+(b<<4)|0;j=i>>>0<(c[a+8>>2]|0)>>>0?i:1224}else{if((b|0)>=-1000999){j=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){j=(c[a+12>>2]|0)+40|0;break}i=-1001e3-b|0;k=c[g>>2]|0;if((c[k+8>>2]|0)==22){j=1224;break}l=c[k>>2]|0;if((i|0)>(d[l+6|0]|0|0)){j=1224;break}j=l+16+(i-1<<4)|0}}while(0);do{if((c[j+8>>2]&15|0)==4){m=j}else{if((nh(a,j)|0)==0){if((e|0)==0){n=0;return n|0}c[e>>2]=0;n=0;return n|0}g=a+12|0;if((c[(c[g>>2]|0)+12>>2]|0)>0){Nf(a)}i=c[f>>2]|0;if(h){l=(c[i>>2]|0)+(b<<4)|0;m=l>>>0<(c[a+8>>2]|0)>>>0?l:1224;break}if((b|0)>=-1000999){m=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){m=(c[g>>2]|0)+40|0;break}g=-1001e3-b|0;l=c[i>>2]|0;if((c[l+8>>2]|0)==22){m=1224;break}i=c[l>>2]|0;if((g|0)>(d[i+6|0]|0|0)){m=1224;break}m=i+16+(g-1<<4)|0}}while(0);b=m;if((e|0)!=0){c[e>>2]=c[(c[b>>2]|0)+12>>2]}n=(c[b>>2]|0)+16|0;return n|0}function Rd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]&15;if((e|0)==7){j=c[(c[g>>2]|0)+16>>2]|0;return j|0}else if((e|0)==4){j=c[(c[g>>2]|0)+12>>2]|0;return j|0}else if((e|0)==5){j=dh(c[g>>2]|0)|0;return j|0}else{j=0;return j|0}return 0}function Sd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]&15;if((e|0)==7){j=(c[g>>2]|0)+24|0;return j|0}else if((e|0)==2){j=c[g>>2]|0;return j|0}else{j=0;return j|0}return 0}function Td(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);if((c[g+8>>2]|0)!=72){j=0;return j|0}j=c[g>>2]|0;return j|0}function Ud(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=c[a+16>>2]|0;f=(b|0)>0;do{if(f){g=(c[e>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[e>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);switch(c[h+8>>2]&63|0){case 5:{k=c[h>>2]|0;return k|0};case 6:{k=c[h>>2]|0;return k|0};case 38:{k=c[h>>2]|0;return k|0};case 22:{k=c[h>>2]|0;return k|0};case 8:{k=c[h>>2]|0;return k|0};case 7:case 2:{do{if(f){h=(c[e>>2]|0)+(b<<4)|0;l=h>>>0<(c[a+8>>2]|0)>>>0?h:1224}else{if((b|0)>=-1000999){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;g=c[e>>2]|0;if((c[g+8>>2]|0)==22){l=1224;break}j=c[g>>2]|0;if((h|0)>(d[j+6|0]|0|0)){l=1224;break}l=j+16+(h-1<<4)|0}}while(0);e=c[l+8>>2]&15;if((e|0)==7){k=(c[l>>2]|0)+24|0;return k|0}else if((e|0)==2){k=c[l>>2]|0;return k|0}else{k=0;return k|0}break};default:{k=0;return k|0}}return 0}function Vd(a){a=a|0;var b=0;b=a+8|0;c[(c[b>>2]|0)+8>>2]=0;c[b>>2]=(c[b>>2]|0)+16;return}function Wd(a,b){a=a|0;b=+b;var d=0;d=a+8|0;a=c[d>>2]|0;h[a>>3]=b;c[a+8>>2]=3;c[d>>2]=(c[d>>2]|0)+16;return}function Xd(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;h[a>>3]=+(b|0);c[a+8>>2]=3;c[d>>2]=(c[d>>2]|0)+16;return}function Yd(a,b){a=a|0;b=b|0;var d=0.0;if((b|0)>-1){d=+(b|0)}else{d=+(b>>>0>>>0)}b=a+8|0;a=c[b>>2]|0;h[a>>3]=d;c[a+8>>2]=3;c[b>>2]=(c[b>>2]|0)+16;return}function Zd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){Nf(a)}f=Rg(a,b,e)|0;e=a+8|0;a=c[e>>2]|0;c[a>>2]=f;c[a+8>>2]=d[f+4|0]|0|64;c[e>>2]=(c[e>>2]|0)+16;return f+16|0}function _d(a,b){a=a|0;b=b|0;var e=0,f=0;if((b|0)==0){e=a+8|0;c[(c[e>>2]|0)+8>>2]=0;c[e>>2]=(c[e>>2]|0)+16;f=0;return f|0}if((c[(c[a+12>>2]|0)+12>>2]|0)>0){Nf(a)}e=Sg(a,b)|0;b=a+8|0;a=c[b>>2]|0;c[a>>2]=e;c[a+8>>2]=d[e+4|0]|0|64;c[b>>2]=(c[b>>2]|0)+16;f=e+16|0;return f|0}function $d(a,b,d){a=a|0;b=b|0;d=d|0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){Nf(a)}return gg(a,b,d)|0}function ae(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){Nf(a)}g=f;c[g>>2]=d;c[g+4>>2]=0;g=gg(a,b,f|0)|0;i=e;return g|0}function be(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((d|0)==0){e=c[a+8>>2]|0;c[e>>2]=b;c[e+8>>2]=22;f=a+8|0;g=c[f>>2]|0;h=g+16|0;c[f>>2]=h;return}if((c[(c[a+12>>2]|0)+12>>2]|0)>0){Nf(a)}e=uf(a,d)|0;c[e+12>>2]=b;b=a+8|0;i=(c[b>>2]|0)+(-d<<4)|0;c[b>>2]=i;j=d;d=i;do{j=j-1|0;i=d+(j<<4)|0;k=e+16+(j<<4)|0;l=c[i+4>>2]|0;c[k>>2]=c[i>>2];c[k+4>>2]=l;c[e+16+(j<<4)+8>>2]=c[d+(j<<4)+8>>2];d=c[b>>2]|0}while((j|0)!=0);c[d>>2]=e;c[d+8>>2]=102;f=a+8|0;g=c[f>>2]|0;h=g+16|0;c[f>>2]=h;return}function ce(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;c[a>>2]=(b|0)!=0;c[a+8>>2]=1;c[d>>2]=(c[d>>2]|0)+16;return}function de(a,b){a=a|0;b=b|0;var d=0;d=a+8|0;a=c[d>>2]|0;c[a>>2]=b;c[a+8>>2]=2;c[d>>2]=(c[d>>2]|0)+16;return}function ee(a){a=a|0;var b=0,d=0;b=a+8|0;d=c[b>>2]|0;c[d>>2]=a;c[d+8>>2]=72;c[b>>2]=(c[b>>2]|0)+16;return(c[(c[a+12>>2]|0)+172>>2]|0)==(a|0)|0}function fe(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=ah(c[(c[a+12>>2]|0)+40>>2]|0,2)|0;f=a+8|0;g=c[f>>2]|0;c[f>>2]=g+16;h=Sg(a,b)|0;c[g>>2]=h;c[g+8>>2]=d[h+4|0]|0|64;h=(c[f>>2]|0)-16|0;oh(a,e,h,h);return}function ge(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=(c[a+8>>2]|0)-16|0;oh(a,g,e,e);return}function he(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=a+8|0;b=c[f>>2]|0;g=Sg(a,e)|0;c[b>>2]=g;c[b+8>>2]=d[g+4|0]|0|64;g=c[f>>2]|0;c[f>>2]=g+16;oh(a,h,g,g);return}function ie(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;a=ch(c[g>>2]|0,(c[e>>2]|0)-16|0)|0;g=c[e>>2]|0;e=a;b=g-16|0;f=c[e+4>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=f;c[g-16+8>>2]=c[a+8>>2];return}function je(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=ah(c[h>>2]|0,e)|0;e=a+8|0;a=c[e>>2]|0;h=f;b=a;g=c[h+4>>2]|0;c[b>>2]=c[h>>2];c[b+4>>2]=g;c[a+8>>2]=c[f+8>>2];c[e>>2]=(c[e>>2]|0)+16;return}function ke(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){Nf(a)}e=Zg(a)|0;f=a+8|0;g=c[f>>2]|0;c[g>>2]=e;c[g+8>>2]=69;c[f>>2]=(c[f>>2]|0)+16;if(!((b|0)>0|(d|0)>0)){return}Vg(a,e,b,d);return}function le(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[g+8>>2]&15;if((e|0)==7){j=c[(c[g>>2]|0)+8>>2]|0}else if((e|0)==5){j=c[(c[g>>2]|0)+8>>2]|0}else{j=c[(c[a+12>>2]|0)+252+(e<<2)>>2]|0}if((j|0)==0){k=0;return k|0}e=a+8|0;a=c[e>>2]|0;c[a>>2]=j;c[a+8>>2]=69;c[e>>2]=(c[e>>2]|0)+16;k=1;return k|0}function me(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=c[(c[g>>2]|0)+12>>2]|0;g=a+8|0;a=c[g>>2]|0;if((e|0)==0){c[a+8>>2]=0;j=c[g>>2]|0;k=j+16|0;c[g>>2]=k;return}else{c[a>>2]=e;c[a+8>>2]=69;j=c[g>>2]|0;k=j+16|0;c[g>>2]=k;return}}function ne(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=ah(c[(c[a+12>>2]|0)+40>>2]|0,2)|0;f=a+8|0;g=c[f>>2]|0;c[f>>2]=g+16;h=Sg(a,b)|0;c[g>>2]=h;c[g+8>>2]=d[h+4|0]|0|64;h=c[f>>2]|0;ph(a,e,h-16|0,h-32|0);c[f>>2]=(c[f>>2]|0)-32;return}function oe(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;b=c[e>>2]|0;ph(a,g,b-32|0,b-16|0);c[e>>2]=(c[e>>2]|0)-32;return}function pe(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=a+8|0;b=c[f>>2]|0;c[f>>2]=b+16;g=Sg(a,e)|0;c[b>>2]=g;c[b+8>>2]=d[g+4|0]|0|64;g=c[f>>2]|0;ph(a,h,g-16|0,g-32|0);c[f>>2]=(c[f>>2]|0)-32;return}function qe(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[b+16>>2]|0;do{if((e|0)>0){g=(c[f>>2]|0)+(e<<4)|0;h=g>>>0<(c[b+8>>2]|0)>>>0?g:1224}else{if((e|0)>=-1000999){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}g=-1001e3-e|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=b+8|0;e=c[f>>2]|0;g=h;h=Xg(b,c[g>>2]|0,e-32|0)|0;j=e-16|0;i=h;k=c[j+4>>2]|0;c[i>>2]=c[j>>2];c[i+4>>2]=k;c[h+8>>2]=c[e-16+8>>2];a[(c[g>>2]|0)+6|0]=0;e=c[f>>2]|0;if((c[e-16+8>>2]&64|0)==0){l=e;m=l-32|0;c[f>>2]=m;return}if((a[(c[e-16>>2]|0)+5|0]&3)==0){l=e;m=l-32|0;c[f>>2]=m;return}h=c[g>>2]|0;if((a[h+5|0]&4)==0){l=e;m=l-32|0;c[f>>2]=m;return}Ef(b,h);l=c[f>>2]|0;m=l-32|0;c[f>>2]=m;return}function re(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[b+16>>2]|0;do{if((e|0)>0){h=(c[g>>2]|0)+(e<<4)|0;i=h>>>0<(c[b+8>>2]|0)>>>0?h:1224}else{if((e|0)>=-1000999){i=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){i=(c[b+12>>2]|0)+40|0;break}h=-1001e3-e|0;j=c[g>>2]|0;if((c[j+8>>2]|0)==22){i=1224;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1224;break}i=k+16+(h-1<<4)|0}}while(0);g=i;i=b+8|0;Wg(b,c[g>>2]|0,f,(c[i>>2]|0)-16|0);f=c[i>>2]|0;if((c[f-16+8>>2]&64|0)==0){l=f;m=l-16|0;c[i>>2]=m;return}if((a[(c[f-16>>2]|0)+5|0]&3)==0){l=f;m=l-16|0;c[i>>2]=m;return}e=c[g>>2]|0;if((a[e+5|0]&4)==0){l=f;m=l-16|0;c[i>>2]=m;return}Ef(b,e);l=c[i>>2]|0;m=l-16|0;c[i>>2]=m;return}function se(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[b+16>>2]|0;do{if((e|0)>0){g=(c[f>>2]|0)+(e<<4)|0;h=g>>>0<(c[b+8>>2]|0)>>>0?g:1224}else{if((e|0)>=-1000999){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}g=-1001e3-e|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=b+8|0;e=c[f>>2]|0;if((c[e-16+8>>2]|0)==0){k=0}else{k=c[e-16>>2]|0}e=c[h+8>>2]&15;if((e|0)==5){g=h;c[(c[g>>2]|0)+8>>2]=k;if((k|0)==0){l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}do{if((a[k+5|0]&3)!=0){j=c[g>>2]|0;if((a[j+5|0]&4)==0){break}Ef(b,j)}}while(0);If(b,c[g>>2]|0,k);l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}else if((e|0)==7){g=h;h=k;c[(c[g>>2]|0)+8>>2]=h;if((k|0)==0){l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}do{if((a[k+5|0]&3)!=0){j=c[g>>2]|0;if((a[j+5|0]&4)==0){break}Df(b,j,h)}}while(0);If(b,c[g>>2]|0,k);l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}else{c[(c[b+12>>2]|0)+252+(e<<2)>>2]=k;l=c[f>>2]|0;m=l-16|0;c[f>>2]=m;return 1}return 0}function te(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=c[b+16>>2]|0;do{if((e|0)>0){g=(c[f>>2]|0)+(e<<4)|0;h=g>>>0<(c[b+8>>2]|0)>>>0?g:1224}else{if((e|0)>=-1000999){h=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){h=(c[b+12>>2]|0)+40|0;break}g=-1001e3-e|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=b+8|0;e=c[f>>2]|0;if((c[e-16+8>>2]|0)==0){c[(c[h>>2]|0)+12>>2]=0;k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}g=h;c[(c[g>>2]|0)+12>>2]=c[e-16>>2];e=c[(c[f>>2]|0)-16>>2]|0;if((a[e+5|0]&3)==0){k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}h=c[g>>2]|0;if((a[h+5|0]&4)==0){k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}Df(b,h,e);k=c[f>>2]|0;l=k-16|0;c[f>>2]=l;return}function ue(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=b+16|0;b=c[f>>2]|0;if((a[b+18|0]&8)==0){g=0;return g|0}if((e|0)==0){h=b}else{c[e>>2]=c[b+24>>2];h=c[f>>2]|0}g=d[h+37|0]|0;return g|0}function ve(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=a+8|0;i=(c[h>>2]|0)+(~d<<4)|0;do{if((g|0)==0){j=4}else{if((b[a+36>>1]|0)!=0){j=4;break}d=a+16|0;c[(c[d>>2]|0)+28>>2]=g;c[(c[d>>2]|0)+24>>2]=f;jf(a,i,e,1)}}while(0);if((j|0)==4){jf(a,i,e,0)}if((e|0)!=-1){return}e=(c[a+16>>2]|0)+4|0;a=c[h>>2]|0;if((c[e>>2]|0)>>>0>=a>>>0){return}c[e>>2]=a;return}function we(e,f,g,h,j,k){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;l=i;i=i+8|0;m=l|0;if((h|0)==0){n=0}else{o=c[e+16>>2]|0;do{if((h|0)>0){p=(c[o>>2]|0)+(h<<4)|0;q=p>>>0<(c[e+8>>2]|0)>>>0?p:1224}else{if((h|0)>=-1000999){q=(c[e+8>>2]|0)+(h<<4)|0;break}if((h|0)==-1001e3){q=(c[e+12>>2]|0)+40|0;break}p=-1001e3-h|0;r=c[o>>2]|0;if((c[r+8>>2]|0)==22){q=1224;break}s=c[r>>2]|0;if((p|0)>(d[s+6|0]|0)){q=1224;break}q=s+16+(p-1<<4)|0}}while(0);n=q-(c[e+28>>2]|0)|0}q=e+8|0;o=(c[q>>2]|0)+(~f<<4)|0;f=m|0;c[f>>2]=o;do{if((k|0)==0){t=14}else{if((b[e+36>>1]|0)!=0){t=14;break}h=c[e+16>>2]|0;c[h+28>>2]=k;c[h+24>>2]=j;c[h+20>>2]=(c[f>>2]|0)-(c[e+28>>2]|0);a[h+36|0]=a[e+41|0]|0;p=e+68|0;s=h+32|0;c[s>>2]=c[p>>2];c[p>>2]=n;r=h+18|0;a[r]=a[r]|16;jf(e,c[f>>2]|0,g,1);a[r]=a[r]&-17;c[p>>2]=c[s>>2];u=0}}while(0);if((t|0)==14){c[m+4>>2]=g;u=mf(e,36,m,o-(c[e+28>>2]|0)|0,n)|0}if((g|0)!=-1){i=l;return u|0}g=(c[e+16>>2]|0)+4|0;e=c[q>>2]|0;if((c[g>>2]|0)>>>0>=e>>>0){i=l;return u|0}c[g>>2]=e;i=l;return u|0}function xe(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;i=i+24|0;j=h|0;zh(b,j,d,e);e=nf(b,j,(f|0)==0?8216:f,g)|0;if((e|0)!=0){i=h;return e|0}g=c[(c[b+8>>2]|0)-16>>2]|0;if((a[g+6|0]|0)!=1){i=h;return e|0}f=ah(c[(c[b+12>>2]|0)+40>>2]|0,2)|0;j=g+16|0;g=c[(c[j>>2]|0)+8>>2]|0;d=f;k=g;l=c[d+4>>2]|0;c[k>>2]=c[d>>2];c[k+4>>2]=l;l=f+8|0;c[g+8>>2]=c[l>>2];if((c[l>>2]&64|0)==0){i=h;return e|0}l=c[f>>2]|0;if((a[l+5|0]&3)==0){i=h;return e|0}f=c[j>>2]|0;if((a[f+5|0]&4)==0){i=h;return e|0}Df(b,f,l);i=h;return e|0}function ye(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[a+8>>2]|0;if((c[e-16+8>>2]|0)!=70){f=1;return f|0}f=sf(a,c[(c[e-16>>2]|0)+12>>2]|0,b,d,0)|0;return f|0}function ze(a){a=a|0;return d[a+6|0]|0|0}function Ae(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;g=c[b+12>>2]|0;a:do{switch(e|0){case 2:{Of(b,0);h=0;break};case 0:{a[g+63|0]=0;h=0;break};case 4:{h=(c[g+12>>2]|0)+(c[g+8>>2]|0)&1023;break};case 3:{h=((c[g+12>>2]|0)+(c[g+8>>2]|0)|0)>>>10;break};case 5:{if((a[g+62|0]|0)==2){i=(c[g+20>>2]|0)==0|0;Mf(b);h=i;break a}i=(f<<10)-1600|0;if((a[g+63|0]|0)==0){j=i;Eg(g,j);Mf(b);k=g+61|0;l=a[k]|0;m=l<<24>>24==5;n=m&1;return n|0}j=(c[g+12>>2]|0)+i|0;Eg(g,j);Mf(b);k=g+61|0;l=a[k]|0;m=l<<24>>24==5;n=m&1;return n|0};case 8:{i=g+160|0;o=c[i>>2]|0;c[i>>2]=f;h=o;break};case 7:{o=g+164|0;i=c[o>>2]|0;c[o>>2]=f;h=i;break};case 11:{Jf(b,0);h=0;break};case 6:{i=g+156|0;o=c[i>>2]|0;c[i>>2]=f;h=o;break};case 1:{Eg(g,0);a[g+63|0]=1;h=0;break};case 9:{h=d[g+63|0]|0;break};case 10:{Jf(b,2);h=0;break};default:{h=-1}}}while(0);return h|0}function Be(a){a=a|0;Ze(a);return 0}function Ce(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;b=Ug(a,c[g>>2]|0,(c[e>>2]|0)-16|0)|0;g=c[e>>2]|0;c[e>>2]=(b|0)==0?g-16|0:g+16|0;return b|0}function De(a,b){a=a|0;b=b|0;var e=0,f=0;if((b|0)>1){if((c[(c[a+12>>2]|0)+12>>2]|0)>0){Nf(a)}th(a,b);return}else{if((b|0)!=0){return}b=a+8|0;e=c[b>>2]|0;f=Rg(a,13816,0)|0;c[e>>2]=f;c[e+8>>2]=d[f+4|0]|0|64;c[b>>2]=(c[b>>2]|0)+16;return}}function Ee(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+16>>2]|0;do{if((b|0)>0){f=(c[e>>2]|0)+(b<<4)|0;g=f>>>0<(c[a+8>>2]|0)>>>0?f:1224}else{if((b|0)>=-1000999){g=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){g=(c[a+12>>2]|0)+40|0;break}f=-1001e3-b|0;h=c[e>>2]|0;if((c[h+8>>2]|0)==22){g=1224;break}i=c[h>>2]|0;if((f|0)>(d[i+6|0]|0|0)){g=1224;break}g=i+16+(f-1<<4)|0}}while(0);e=a+8|0;uh(a,c[e>>2]|0,g);c[e>>2]=(c[e>>2]|0)+16;return}function Fe(a,b){a=a|0;b=b|0;var d=0;if((c[(c[a+12>>2]|0)+12>>2]|0)>0){Nf(a)}d=Tg(a,b,0)|0;b=a+8|0;a=c[b>>2]|0;c[a>>2]=d;c[a+8>>2]=71;c[b>>2]=(c[b>>2]|0)+16;return d+24|0}function Ge(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=c[a+16>>2]|0;do{if((b|0)>0){g=(c[f>>2]|0)+(b<<4)|0;h=g>>>0<(c[a+8>>2]|0)>>>0?g:1224}else{if((b|0)>=-1000999){h=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){h=(c[a+12>>2]|0)+40|0;break}g=-1001e3-b|0;i=c[f>>2]|0;if((c[i+8>>2]|0)==22){h=1224;break}j=c[i>>2]|0;if((g|0)>(d[j+6|0]|0|0)){h=1224;break}h=j+16+(g-1<<4)|0}}while(0);f=c[h+8>>2]&63;do{if((f|0)==6){b=c[h>>2]|0;g=c[b+12>>2]|0;if((e|0)<=0){k=0;return k|0}if((c[g+40>>2]|0)<(e|0)){k=0;return k|0}j=e-1|0;i=c[(c[b+16+(j<<2)>>2]|0)+8>>2]|0;b=c[(c[g+28>>2]|0)+(j<<3)>>2]|0;if((b|0)==0){l=i;m=13816;break}l=i;m=b+16|0}else if((f|0)==38){b=c[h>>2]|0;if((e|0)<=0){k=0;return k|0}if((d[b+6|0]|0|0)<(e|0)){k=0;return k|0}else{l=b+16+(e-1<<4)|0;m=13816;break}}else{k=0;return k|0}}while(0);e=a+8|0;a=c[e>>2]|0;h=l;f=a;b=c[h+4>>2]|0;c[f>>2]=c[h>>2];c[f+4>>2]=b;c[a+8>>2]=c[l+8>>2];c[e>>2]=(c[e>>2]|0)+16;k=m;return k|0}function He(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=c[b+16>>2]|0;do{if((e|0)>0){h=(c[g>>2]|0)+(e<<4)|0;i=h>>>0<(c[b+8>>2]|0)>>>0?h:1224}else{if((e|0)>=-1000999){i=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){i=(c[b+12>>2]|0)+40|0;break}h=-1001e3-e|0;j=c[g>>2]|0;if((c[j+8>>2]|0)==22){i=1224;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1224;break}i=k+16+(h-1<<4)|0}}while(0);g=c[i+8>>2]&63;do{if((g|0)==38){e=c[i>>2]|0;if((f|0)<=0){l=0;return l|0}if((d[e+6|0]|0|0)<(f|0)){l=0;return l|0}else{m=e+16+(f-1<<4)|0;n=e;o=13816;break}}else if((g|0)==6){e=c[i>>2]|0;h=c[e+12>>2]|0;if((f|0)<=0){l=0;return l|0}if((c[h+40>>2]|0)<(f|0)){l=0;return l|0}k=f-1|0;j=c[e+16+(k<<2)>>2]|0;e=c[j+8>>2]|0;p=j;j=c[(c[h+28>>2]|0)+(k<<3)>>2]|0;if((j|0)==0){m=e;n=p;o=13816;break}m=e;n=p;o=j+16|0}else{l=0;return l|0}}while(0);f=b+8|0;i=c[f>>2]|0;g=i-16|0;c[f>>2]=g;j=g;g=m;p=c[j+4>>2]|0;c[g>>2]=c[j>>2];c[g+4>>2]=p;c[m+8>>2]=c[i-16+8>>2];i=c[f>>2]|0;if((c[i+8>>2]&64|0)==0){l=o;return l|0}f=c[i>>2]|0;if((a[f+5|0]&3)==0){l=o;return l|0}if((a[n+5|0]&4)==0){l=o;return l|0}Df(b,n,f);l=o;return l|0}function Ie(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=c[a+16>>2]|0;g=(b|0)>0;do{if(g){h=(c[f>>2]|0)+(b<<4)|0;i=h>>>0<(c[a+8>>2]|0)>>>0?h:1224}else{if((b|0)>=-1000999){i=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){i=(c[a+12>>2]|0)+40|0;break}h=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)==22){i=1224;break}k=c[j>>2]|0;if((h|0)>(d[k+6|0]|0|0)){i=1224;break}i=k+16+(h-1<<4)|0}}while(0);h=c[i+8>>2]&63;if((h|0)==6){do{if(g){k=(c[f>>2]|0)+(b<<4)|0;l=k>>>0<(c[a+8>>2]|0)>>>0?k:1224}else{if((b|0)>=-1000999){l=(c[a+8>>2]|0)+(b<<4)|0;break}if((b|0)==-1001e3){l=(c[a+12>>2]|0)+40|0;break}k=-1001e3-b|0;j=c[f>>2]|0;if((c[j+8>>2]|0)==22){l=1224;break}m=c[j>>2]|0;if((k|0)>(d[m+6|0]|0|0)){l=1224;break}l=m+16+(k-1<<4)|0}}while(0);n=c[(c[l>>2]|0)+16+(e-1<<2)>>2]|0;return n|0}else if((h|0)==38){n=(c[i>>2]|0)+16+(e-1<<4)|0;return n|0}else{n=0;return n|0}return 0}function Je(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0;i=c[b+16>>2]|0;do{if((e|0)>0){j=(c[i>>2]|0)+(e<<4)|0;k=j>>>0<(c[b+8>>2]|0)>>>0?j:1224}else{if((e|0)>=-1000999){k=(c[b+8>>2]|0)+(e<<4)|0;break}if((e|0)==-1001e3){k=(c[b+12>>2]|0)+40|0;break}j=-1001e3-e|0;l=c[i>>2]|0;if((c[l+8>>2]|0)==22){k=1224;break}m=c[l>>2]|0;if((j|0)>(d[m+6|0]|0|0)){k=1224;break}k=m+16+(j-1<<4)|0}}while(0);e=c[k>>2]|0;k=e+16+(f-1<<2)|0;do{if((g|0)>0){f=(c[i>>2]|0)+(g<<4)|0;n=f>>>0<(c[b+8>>2]|0)>>>0?f:1224}else{if((g|0)>=-1000999){n=(c[b+8>>2]|0)+(g<<4)|0;break}if((g|0)==-1001e3){n=(c[b+12>>2]|0)+40|0;break}f=-1001e3-g|0;j=c[i>>2]|0;if((c[j+8>>2]|0)==22){n=1224;break}m=c[j>>2]|0;if((f|0)>(d[m+6|0]|0|0)){n=1224;break}n=m+16+(f-1<<4)|0}}while(0);i=(c[n>>2]|0)+16+(h-1<<2)|0;c[k>>2]=c[i>>2];k=c[i>>2]|0;if((a[k+5|0]&3)==0){return}if((a[e+5|0]&4)==0){return}Df(b,e,k);return}function Ke(a,b){a=a|0;b=b|0;df(a,c[b>>2]|0);return}function Le(a,b){a=a|0;b=b|0;jf(a,c[b>>2]|0,c[b+4>>2]|0,0);return}function Me(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=(d|0)==0|(e|0)==0;h=c[b+16>>2]|0;if((a[h+18|0]&1)!=0){c[b+20>>2]=c[h+28>>2]}c[b+52>>2]=g?0:d;c[b+44>>2]=f;c[b+48>>2]=f;a[b+40|0]=g?0:e&255;return 1}function Ne(a){a=a|0;return c[a+52>>2]|0}function Oe(a){a=a|0;return d[a+40|0]|0|0}function Pe(a){a=a|0;return c[a+44>>2]|0}function Qe(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((b|0)<0){e=0;return e|0}f=c[a+16>>2]|0;g=a+72|0;if((b|0)>0&(f|0)!=(g|0)){a=b;h=f;while(1){i=a-1|0;j=c[h+8>>2]|0;if((i|0)>0&(j|0)!=(g|0)){a=i;h=j}else{k=i;l=j;break}}}else{k=b;l=f}if((k|0)!=0|(l|0)==(g|0)){e=0;return e|0}c[d+96>>2]=l;e=1;return e|0}function Re(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+8|0;f=e|0;if((b|0)==0){g=c[a+8>>2]|0;if((c[g-16+8>>2]|0)!=70){h=0;i=e;return h|0}h=Cf(c[(c[g-16>>2]|0)+12>>2]|0,d,0)|0;i=e;return h|0}else{c[f>>2]=0;g=_e(a,c[b+96>>2]|0,d,f)|0;if((g|0)==0){h=0;i=e;return h|0}d=c[f>>2]|0;f=a+8|0;a=c[f>>2]|0;b=d;j=a;k=c[b+4>>2]|0;c[j>>2]=c[b>>2];c[j+4>>2]=k;c[a+8>>2]=c[d+8>>2];c[f>>2]=(c[f>>2]|0)+16;h=g;i=e;return h|0}return 0}function Se(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+8|0;f=e|0;c[f>>2]=0;g=_e(a,c[b+96>>2]|0,d,f)|0;d=a+8|0;if((g|0)==0){h=c[d>>2]|0;j=h-16|0;c[d>>2]=j;i=e;return g|0}a=c[d>>2]|0;b=c[f>>2]|0;f=a-16|0;k=b;l=c[f+4>>2]|0;c[k>>2]=c[f>>2];c[k+4>>2]=l;c[b+8>>2]=c[a-16+8>>2];h=c[d>>2]|0;j=h-16|0;c[d>>2]=j;i=e;return g|0}function Te(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;f=i;i=i+16|0;g=f|0;if((a[d]|0)==62){h=b+8|0;j=(c[h>>2]|0)-16|0;c[h>>2]=j;k=d+1|0;l=0;m=j}else{j=c[e+96>>2]|0;k=d;l=j;m=c[j>>2]|0}j=m+8|0;if((c[j>>2]&31|0)==6){n=c[m>>2]|0}else{n=0}d=a[k]|0;a:do{if(d<<24>>24==0){o=1}else{h=(n|0)==0;p=e+16|0;q=e+24|0;r=e+28|0;s=e+12|0;t=e+36|0;u=n+4|0;v=n+12|0;w=(l|0)==0;x=e+20|0;y=l+18|0;z=l|0;A=l+28|0;B=e+32|0;C=e+34|0;D=e+33|0;E=n+6|0;F=e+35|0;G=e+8|0;H=e+4|0;I=l+8|0;J=b+12|0;K=k;L=1;M=d;while(1){b:do{switch(M<<24>>24|0){case 83:{do{if(h){N=11}else{if((a[u]|0)==38){N=11;break}O=c[v>>2]|0;P=c[O+36>>2]|0;if((P|0)==0){Q=9912}else{Q=P+16|0}c[p>>2]=Q;P=c[O+64>>2]|0;c[q>>2]=P;c[r>>2]=c[O+68>>2];R=Q;S=(P|0)==0?9656:9264}}while(0);if((N|0)==11){N=0;c[p>>2]=10680;c[q>>2]=-1;c[r>>2]=-1;R=10680;S=10448}c[s>>2]=S;ig(t,R,60);T=L;break};case 108:{do{if(w){U=-1}else{if((a[y]&1)==0){U=-1;break}P=c[(c[c[z>>2]>>2]|0)+12>>2]|0;O=c[P+20>>2]|0;if((O|0)==0){U=0;break}U=c[O+(((c[A>>2]|0)-(c[P+12>>2]|0)>>2)-1<<2)>>2]|0}}while(0);c[x>>2]=U;T=L;break};case 116:{if(w){V=0}else{V=a[y]&64}a[F]=V;T=L;break};case 110:{c:do{if(w){N=47}else{if((a[y]&64)!=0){N=47;break}P=c[I>>2]|0;if((a[P+18|0]&1)==0){N=47;break}O=c[(c[c[P>>2]>>2]|0)+12>>2]|0;W=c[O+12>>2]|0;X=((c[P+28>>2]|0)-W>>2)-1|0;P=c[W+(X<<2)>>2]|0;switch(P&63|0){case 24:{Y=5;N=46;break};case 8:case 10:{Y=1;N=46;break};case 13:{Y=6;N=46;break};case 14:{Y=7;N=46;break};case 15:{Y=8;N=46;break};case 16:{Y=9;N=46;break};case 17:{Y=10;N=46;break};case 18:{Y=11;N=46;break};case 19:{Y=12;N=46;break};case 21:{Y=4;N=46;break};case 25:{Y=13;N=46;break};case 26:{Y=14;N=46;break};case 22:{Y=15;N=46;break};case 12:case 6:case 7:{Y=0;N=46;break};case 34:{Z=11952;_=11952;break};case 29:case 30:{W=$e(O,X,P>>>6&255,H)|0;c[G>>2]=W;if((W|0)==0){break c}else{T=L;break b}break};default:{N=47;break c}}if((N|0)==46){N=0;Z=11680;_=(c[(c[J>>2]|0)+184+(Y<<2)>>2]|0)+16|0}c[H>>2]=_;c[G>>2]=Z;T=L;break b}}while(0);if((N|0)==47){N=0;c[G>>2]=0}c[G>>2]=13808;c[H>>2]=0;T=L;break};case 117:{do{if(h){a[B]=0}else{a[B]=a[E]|0;if((a[u]|0)==38){break}a[C]=a[(c[v>>2]|0)+77|0]|0;a[D]=a[(c[v>>2]|0)+76|0]|0;T=L;break b}}while(0);a[C]=1;a[D]=0;T=L;break};case 76:case 102:{T=L;break};default:{T=0}}}while(0);W=K+1|0;P=a[W]|0;if(P<<24>>24==0){o=T;break a}else{K=W;L=T;M=P}}}}while(0);if((Va(k|0,102)|0)!=0){T=b+8|0;N=c[T>>2]|0;Z=m;m=N;_=c[Z+4>>2]|0;c[m>>2]=c[Z>>2];c[m+4>>2]=_;c[N+8>>2]=c[j>>2];c[T>>2]=(c[T>>2]|0)+16}if((Va(k|0,76)|0)==0){i=f;return o|0}do{if((n|0)!=0){if((a[n+4|0]|0)==38){break}k=n+12|0;T=c[(c[k>>2]|0)+20>>2]|0;j=Zg(b)|0;N=b+8|0;_=c[N>>2]|0;c[_>>2]=j;c[_+8>>2]=69;c[N>>2]=(c[N>>2]|0)+16;c[g>>2]=1;c[g+8>>2]=1;if((c[(c[k>>2]|0)+52>>2]|0)>0){$=0}else{i=f;return o|0}do{Wg(b,j,c[T+($<<2)>>2]|0,g);$=$+1|0;}while(($|0)<(c[(c[k>>2]|0)+52>>2]|0));i=f;return o|0}}while(0);$=b+8|0;c[(c[$>>2]|0)+8>>2]=0;c[$>>2]=(c[$>>2]|0)+16;i=f;return o|0}function Ue(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+8|0;g=f|0;f=c[b+16>>2]|0;c[g>>2]=0;h=c[1064+((c[d+8>>2]&15)+1<<2)>>2]|0;a:do{if((a[f+18|0]&1)!=0){j=c[c[f>>2]>>2]|0;k=a[j+6|0]|0;b:do{if(k<<24>>24!=0){l=j+16|0;m=k&255;n=0;while(1){o=n+1|0;if((c[(c[l+(n<<2)>>2]|0)+8>>2]|0)==(d|0)){break}if((o|0)<(m|0)){n=o}else{break b}}m=c[(c[(c[j+12>>2]|0)+28>>2]|0)+(n<<3)>>2]|0;if((m|0)==0){p=12152}else{p=m+16|0}c[g>>2]=p;q=13016;r=p;Ve(b,2888,(s=i,i=i+32|0,c[s>>2]=e,c[s+8>>2]=q,c[s+16>>2]=r,c[s+24>>2]=h,s)|0);i=s}}while(0);k=c[f+24>>2]|0;m=c[f+4>>2]|0;if(k>>>0<m>>>0){t=k}else{break}while(1){l=t+16|0;if((t|0)==(d|0)){break}if(l>>>0<m>>>0){t=l}else{break a}}m=c[j+12>>2]|0;l=$e(m,((c[f+28>>2]|0)-(c[m+12>>2]|0)>>2)-1|0,d-k>>4,g)|0;if((l|0)==0){break}q=l;r=c[g>>2]|0;Ve(b,2888,(s=i,i=i+32|0,c[s>>2]=e,c[s+8>>2]=q,c[s+16>>2]=r,c[s+24>>2]=h,s)|0);i=s}}while(0);Ve(b,10600,(s=i,i=i+16|0,c[s>>2]=e,c[s+8>>2]=h,s)|0);i=s}function Ve(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+80|0;g=f|0;h=f+64|0;f=h;c[f>>2]=e;c[f+4>>2]=0;f=gg(b,d,h|0)|0;h=g|0;d=c[b+16>>2]|0;if((a[d+18|0]&1)==0){j=60;k=0;Ze(b)}e=c[(c[c[d>>2]>>2]|0)+12>>2]|0;l=c[e+20>>2]|0;if((l|0)==0){m=0}else{m=c[l+(((c[d+28>>2]|0)-(c[e+12>>2]|0)>>2)-1<<2)>>2]|0}d=c[e+36>>2]|0;if((d|0)==0){a[h]=63;a[g+1|0]=0}else{ig(h,d+16|0,60)}hg(b,3600,(d=i,i=i+24|0,c[d>>2]=h,c[d+8>>2]=m,c[d+16>>2]=f,d)|0)|0;i=d;j=60;k=0;Ze(b)}function We(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=c[b+8>>2]|0;Ue(a,(e&15|0)==4|(e|0)==3?d:b,7760)}function Xe(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;i=i+16|0;e=(mh(b,d|0)|0)==0;Ue(a,e?b:c,6152)}function Ye(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[1064+((c[b+8>>2]&15)+1<<2)>>2]|0;b=c[1064+((c[d+8>>2]&15)+1<<2)>>2]|0;if((e|0)==(b|0)){Ve(a,4576,(f=i,i=i+8|0,c[f>>2]=e,f)|0);i=f}else{Ve(a,3944,(f=i,i=i+16|0,c[f>>2]=e,c[f+8>>2]=b,f)|0);i=f}}function Ze(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;b=c[a+68>>2]|0;if((b|0)==0){af(a,2)}d=c[a+28>>2]|0;e=d+(b+8)|0;if((c[e>>2]&15|0)!=6){af(a,6)}f=a+8|0;g=c[f>>2]|0;h=g-16|0;i=g;j=c[h+4>>2]|0;c[i>>2]=c[h>>2];c[i+4>>2]=j;c[g+8>>2]=c[g-16+8>>2];g=c[f>>2]|0;j=d+b|0;b=g-16|0;d=c[j+4>>2]|0;c[b>>2]=c[j>>2];c[b+4>>2]=d;c[g-16+8>>2]=c[e>>2];e=c[f>>2]|0;c[f>>2]=e+16;jf(a,e-16|0,1,0);af(a,2)}function _e(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;do{if((a[e+18|0]&1)==0){h=(c[e>>2]|0)+16|0;i=7}else{if((f|0)>=0){j=c[e+24>>2]|0;k=c[(c[c[e>>2]>>2]|0)+12>>2]|0;l=Cf(k,f,((c[e+28>>2]|0)-(c[k+12>>2]|0)>>2)-1|0)|0;if((l|0)==0){h=j;i=7;break}else{m=l;n=j;break}}j=c[e>>2]|0;l=d[(c[(c[j>>2]|0)+12>>2]|0)+76|0]|0;if((((c[e+24>>2]|0)-j>>4)-l|0)<=(-f|0)){o=0;return o|0}c[g>>2]=j+(l-f<<4);o=8680;return o|0}}while(0);do{if((i|0)==7){if((c[b+16>>2]|0)==(e|0)){p=b+8|0}else{p=c[e+12>>2]|0}if(((c[p>>2]|0)-h>>4|0)>=(f|0)&(f|0)>0){m=8904;n=h;break}else{o=0}return o|0}}while(0);c[g>>2]=n+(f-1<<4);o=m;return o|0}function $e(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=b+12|0;h=e;e=d;a:while(1){d=Cf(b,h+1|0,e)|0;c[f>>2]=d;if((d|0)!=0){i=3248;j=47;break}if((e|0)<=0){i=0;j=47;break}k=c[g>>2]|0;d=0;l=-1;m=0;while(1){n=c[k+(m<<2)>>2]|0;o=n&63;p=n>>>6&255;b:do{switch(o|0){case 4:{if((p|0)>(h|0)){q=l;r=d;break b}if((p+(n>>>23)|0)<(h|0)){q=l;r=d;break b}q=(m|0)<(d|0)?-1:m;r=d;break};case 34:{if((p+2|0)>(h|0)){q=l;r=d;break b}q=(m|0)<(d|0)?-1:m;r=d;break};case 29:case 30:{if((p|0)>(h|0)){q=l;r=d;break b}q=(m|0)<(d|0)?-1:m;r=d;break};case 23:{s=m-131070+(n>>>14)|0;q=l;r=(s|0)<=(e|0)&(m|0)<(s|0)&(s|0)>(d|0)?s:d;break};case 27:{if((p|0)!=(h|0)){q=l;r=d;break b}q=(m|0)<(d|0)?-1:m;r=d;break};default:{if(!((a[1184+o|0]&64)!=0&(p|0)==(h|0))){q=l;r=d;break b}q=(m|0)<(d|0)?-1:m;r=d}}}while(0);p=m+1|0;if((p|0)<(e|0)){d=r;l=q;m=p}else{break}}if((q|0)==-1){i=0;j=47;break}t=c[k+(q<<2)>>2]|0;u=t&63;switch(u|0){case 0:{break};case 6:case 7:{j=22;break a;break};case 5:{j=34;break a;break};case 1:{j=37;break a;break};case 2:{j=38;break a;break};case 12:{j=41;break a;break};default:{i=0;j=47;break a}}m=t>>>23;if(m>>>0<(t>>>6&255)>>>0){h=m;e=q}else{i=0;j=47;break}}if((j|0)==22){e=t>>>14;h=e&511;r=t>>>23;do{if((u|0)==7){v=Cf(b,r+1|0,q)|0}else{g=c[(c[b+28>>2]|0)+(r<<3)>>2]|0;if((g|0)==0){v=12152;break}v=g+16|0}}while(0);do{if((e&256|0)==0){r=$e(b,q,h,f)|0;if((r|0)==0){j=31;break}if((a[r]|0)!=99){j=31}}else{r=e&255;u=c[b+8>>2]|0;if((c[u+(r<<4)+8>>2]&15|0)!=4){j=31;break}c[f>>2]=(c[u+(r<<4)>>2]|0)+16}}while(0);if((j|0)==31){c[f>>2]=12152}if((v|0)==0){i=13440;return i|0}e=(La(v|0,2704)|0)==0;i=e?2440:13440;return i|0}else if((j|0)==34){e=c[(c[b+28>>2]|0)+(t>>>23<<3)>>2]|0;if((e|0)==0){w=12152}else{w=e+16|0}c[f>>2]=w;i=13016;return i|0}else if((j|0)==37){x=t>>>14}else if((j|0)==38){x=(c[k+(q+1<<2)>>2]|0)>>>6}else if((j|0)==41){k=t>>>14;do{if((k&256|0)==0){t=$e(b,q,k&511,f)|0;if((t|0)==0){break}if((a[t]|0)==99){i=12384}else{break}return i|0}else{t=k&255;w=c[b+8>>2]|0;if((c[w+(t<<4)+8>>2]&15|0)!=4){break}c[f>>2]=(c[w+(t<<4)>>2]|0)+16;i=12384;return i|0}}while(0);c[f>>2]=12152;i=12384;return i|0}else if((j|0)==47){return i|0}j=c[b+8>>2]|0;if((c[j+(x<<4)+8>>2]&15|0)!=4){i=0;return i|0}c[f>>2]=(c[j+(x<<4)>>2]|0)+16;i=12696;return i|0}function af(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=b+64|0;f=c[e>>2]|0;if((f|0)!=0){c[f+160>>2]=d;kc((c[e>>2]|0)+4|0,1)}a[b+6|0]=d;e=b+12|0;f=c[e>>2]|0;g=c[f+172>>2]|0;if((c[g+64>>2]|0)!=0){h=c[b+8>>2]|0;i=g+8|0;g=c[i>>2]|0;c[i>>2]=g+16;i=h-16|0;j=g;k=c[i+4>>2]|0;c[j>>2]=c[i>>2];c[j+4>>2]=k;c[g+8>>2]=c[h-16+8>>2];af(c[(c[e>>2]|0)+172>>2]|0,d)}d=c[f+168>>2]|0;if((d|0)==0){Xb()}Ac[d&511](b)|0;Xb()}function bf(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+168|0;g=1;h=0;j=i;i=i+168|0;c[j>>2]=0;while(1)switch(g|0){case 1:k=f|0;l=a+38|0;m=b[l>>1]|0;n=k+160|0;c[n>>2]=0;o=a+64|0;p=k|0;c[p>>2]=c[o>>2];c[o>>2]=k;q=kn(k+4|0,g,j)|0;g=4;break;case 4:if((q|0)==0){g=2;break}else{g=3;break};case 2:la(d|0,a|0,e|0);if((t|0)!=0&(u|0)!=0){h=ln(c[t>>2]|0,j)|0;if((h|0)>0){g=-1;break}else return 0}t=u=0;g=3;break;case 3:c[o>>2]=c[p>>2];b[l>>1]=m;i=f;return c[n>>2]|0;case-1:if((h|0)==1){q=u;g=4}t=u=0;break}return 0}function cf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=b+28|0;f=c[e>>2]|0;g=b+32|0;h=c[g>>2]|0;if((d+1|0)>>>0>268435455>>>0){_f(b)}i=$f(b,f,h<<4,d<<4)|0;c[e>>2]=i;if((h|0)<(d|0)){j=h;h=i;while(1){c[h+(j<<4)+8>>2]=0;k=j+1|0;l=c[e>>2]|0;if((k|0)<(d|0)){j=k;h=l}else{m=l;break}}}else{m=i}c[g>>2]=d;c[b+24>>2]=m+(d-5<<4);d=b+8|0;g=f;c[d>>2]=m+((c[d>>2]|0)-g>>4<<4);d=c[b+56>>2]|0;do{if((d|0)!=0){f=d+8|0;c[f>>2]=m+((c[f>>2]|0)-g>>4<<4);f=c[d>>2]|0;if((f|0)==0){break}else{n=f}do{f=n+8|0;c[f>>2]=(c[e>>2]|0)+((c[f>>2]|0)-g>>4<<4);n=c[n>>2]|0;}while((n|0)!=0)}}while(0);n=c[b+16>>2]|0;if((n|0)==0){return}else{o=n}do{n=o+4|0;c[n>>2]=(c[e>>2]|0)+((c[n>>2]|0)-g>>4<<4);n=o|0;c[n>>2]=(c[e>>2]|0)+((c[n>>2]|0)-g>>4<<4);if((a[o+18|0]&1)!=0){n=o+24|0;c[n>>2]=(c[e>>2]|0)+((c[n>>2]|0)-g>>4<<4)}o=c[o+8>>2]|0;}while((o|0)!=0);return}function df(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=c[a+32>>2]|0;if((e|0)>1e6){af(a,6)}f=b+5+((c[a+8>>2]|0)-(c[a+28>>2]|0)>>4)|0;b=e<<1;e=(b|0)>1e6?1e6:b;b=(e|0)<(f|0)?f:e;if((b|0)>1e6){cf(a,1000200);Ve(a,13416,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e}else{cf(a,b);i=d;return}}function ef(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=c[a+8>>2]|0;d=c[a+16>>2]|0;if((d|0)==0){e=b}else{f=b;b=d;while(1){d=c[b+4>>2]|0;g=f>>>0<d>>>0?d:f;d=c[b+8>>2]|0;if((d|0)==0){e=g;break}else{f=g;b=d}}}b=e-(c[a+28>>2]|0)|0;e=(b>>4)+1|0;f=((e|0)/8|0)+10+e|0;e=(f|0)>1e6?1e6:f;if((b|0)>15999984){return}if((e|0)>=(c[a+32>>2]|0)){return}cf(a,e);return}function ff(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+104|0;g=f|0;h=c[b+52>>2]|0;if((h|0)==0){i=f;return}j=b+41|0;if((a[j]|0)==0){i=f;return}k=c[b+16>>2]|0;l=b+8|0;m=c[l>>2]|0;n=b+28|0;o=m;p=c[n>>2]|0;q=o-p|0;r=k+4|0;s=(c[r>>2]|0)-p|0;c[g>>2]=d;c[g+20>>2]=e;c[g+96>>2]=k;do{if(((c[b+24>>2]|0)-o|0)<336){e=c[b+32>>2]|0;if((e|0)>1e6){af(b,6)}d=(q>>4)+25|0;p=e<<1;e=(p|0)>1e6?1e6:p;p=(e|0)<(d|0)?d:e;if((p|0)>1e6){cf(b,1000200);Ve(b,13416,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e}else{cf(b,p);t=c[l>>2]|0;break}}else{t=m}}while(0);c[r>>2]=t+320;a[j]=0;t=k+18|0;a[t]=a[t]|2;Cc[h&63](b,g);a[j]=1;c[r>>2]=(c[n>>2]|0)+s;c[l>>2]=(c[n>>2]|0)+q;a[t]=a[t]&-3;i=f;return}function gf(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;h=i;j=e+28|0;k=e+8|0;l=e+24|0;m=e+32|0;n=f;while(1){o=n;p=c[j>>2]|0;q=o-p|0;f=c[n+8>>2]&63;if((f|0)==22){r=3;break}else if((f|0)==38){r=4;break}else if((f|0)==6){r=30;break}f=hh(e,n,16)|0;s=o-(c[j>>2]|0)|0;t=f+8|0;if((c[t>>2]&15|0)!=6){r=60;break}u=c[k>>2]|0;if(u>>>0>n>>>0){v=u;while(1){w=v-16|0;x=w;y=v;z=c[x+4>>2]|0;c[y>>2]=c[x>>2];c[y+4>>2]=z;c[v+8>>2]=c[v-16+8>>2];if(w>>>0>n>>>0){v=w}else{break}}A=c[k>>2]|0}else{A=u}v=A+16|0;c[k>>2]=v;w=v;if(((c[l>>2]|0)-w|0)<16){v=c[m>>2]|0;if((v|0)>1e6){r=66;break}z=(w-(c[j>>2]|0)>>4)+5|0;w=v<<1;v=(w|0)>1e6?1e6:w;w=(v|0)<(z|0)?z:v;if((w|0)>1e6){r=68;break}cf(e,w)}w=c[j>>2]|0;v=w+s|0;z=f;y=v;x=c[z+4>>2]|0;c[y>>2]=c[z>>2];c[y+4>>2]=x;c[w+(s+8)>>2]=c[t>>2];n=v}if((r|0)==3){B=n}else if((r|0)==4){B=(c[n>>2]|0)+12|0}else if((r|0)==30){A=c[(c[n>>2]|0)+12>>2]|0;v=c[k>>2]|0;w=v-o>>4;o=w-1|0;x=A+78|0;y=d[x]|0;do{if(((c[l>>2]|0)-v>>4|0)<=(y|0)){z=c[m>>2]|0;if((z|0)>1e6){af(e,6);return 0}C=y+5+(v-p>>4)|0;D=z<<1;z=(D|0)>1e6?1e6:D;D=(z|0)<(C|0)?C:z;if((D|0)>1e6){cf(e,1000200);Ve(e,13416,(E=i,i=i+1|0,i=i+7&-8,c[E>>2]=0,E)|0);i=E;return 0}else{cf(e,D);break}}}while(0);v=A+76|0;y=a[v]|0;if((w|0)>(y&255|0)){F=o;G=y}else{y=o;while(1){o=c[k>>2]|0;c[k>>2]=o+16;c[o+8>>2]=0;o=y+1|0;w=a[v]|0;if((o|0)<(w&255|0)){y=o}else{F=o;G=w;break}}}if((a[A+77|0]|0)==0){y=c[j>>2]|0;H=y+(q+16)|0;I=y}else{y=G&255;v=c[k>>2]|0;w=v;o=d[x]|0;do{if(((c[l>>2]|0)-w>>4|0)>(o|0)){J=v}else{D=c[m>>2]|0;if((D|0)>1e6){af(e,6);return 0}z=o+5+(w-(c[j>>2]|0)>>4)|0;C=D<<1;D=(C|0)>1e6?1e6:C;C=(D|0)<(z|0)?z:D;if((C|0)>1e6){cf(e,1000200);Ve(e,13416,(E=i,i=i+1|0,i=i+7&-8,c[E>>2]=0,E)|0);i=E;return 0}else{cf(e,C);J=c[k>>2]|0;break}}}while(0);do{if(G<<24>>24!=0){w=-F|0;c[k>>2]=J+16;o=J+(w<<4)|0;v=J;C=c[o+4>>2]|0;c[v>>2]=c[o>>2];c[v+4>>2]=C;C=J+(w<<4)+8|0;c[J+8>>2]=c[C>>2];c[C>>2]=0;if((G&255)>>>0>1>>>0){K=1}else{break}do{C=c[k>>2]|0;w=K-F|0;c[k>>2]=C+16;v=J+(w<<4)|0;o=C;D=c[v+4>>2]|0;c[o>>2]=c[v>>2];c[o+4>>2]=D;D=J+(w<<4)+8|0;c[C+8>>2]=c[D>>2];c[D>>2]=0;K=K+1|0;}while((K|0)<(y|0))}}while(0);H=J;I=c[j>>2]|0}J=e+16|0;y=c[(c[J>>2]|0)+12>>2]|0;if((y|0)==0){L=Fg(e)|0}else{L=y}c[J>>2]=L;b[L+16>>1]=g;c[L>>2]=I+q;c[L+24>>2]=H;I=H+(d[x]<<4)|0;c[L+4>>2]=I;x=L+28|0;c[x>>2]=c[A+12>>2];A=L+18|0;a[A]=1;c[k>>2]=I;if((c[(c[e+12>>2]|0)+12>>2]|0)>0){Nf(e)}if((a[e+40|0]&1)==0){M=0;i=h;return M|0}c[x>>2]=(c[x>>2]|0)+4;I=c[L+8>>2]|0;do{if((a[I+18|0]&1)==0){N=0}else{if((c[(c[I+28>>2]|0)-4>>2]&63|0)!=30){N=0;break}a[A]=a[A]|64;N=4}}while(0);ff(e,N,-1);c[x>>2]=(c[x>>2]|0)-4;M=0;i=h;return M|0}else if((r|0)==60){Ue(e,n,13384);return 0}else if((r|0)==66){af(e,6);return 0}else if((r|0)==68){cf(e,1000200);Ve(e,13416,(E=i,i=i+1|0,i=i+7&-8,c[E>>2]=0,E)|0);i=E;return 0}r=c[B>>2]|0;B=c[k>>2]|0;do{if(((c[l>>2]|0)-B|0)<336){n=c[m>>2]|0;if((n|0)>1e6){af(e,6);return 0}x=(B-p>>4)+25|0;N=n<<1;n=(N|0)>1e6?1e6:N;N=(n|0)<(x|0)?x:n;if((N|0)>1e6){cf(e,1000200);Ve(e,13416,(E=i,i=i+1|0,i=i+7&-8,c[E>>2]=0,E)|0);i=E;return 0}else{cf(e,N);break}}}while(0);E=e+16|0;p=c[(c[E>>2]|0)+12>>2]|0;if((p|0)==0){O=Fg(e)|0}else{O=p}c[E>>2]=O;b[O+16>>1]=g;c[O>>2]=(c[j>>2]|0)+q;c[O+4>>2]=(c[k>>2]|0)+320;a[O+18|0]=0;if((c[(c[e+12>>2]|0)+12>>2]|0)>0){Nf(e)}O=e+40|0;if((a[O]&1)!=0){ff(e,0,-1)}q=Ac[r&511](e)|0;r=(c[k>>2]|0)+(-q<<4)|0;q=c[E>>2]|0;g=d[O]|0;if((g&6|0)==0){P=r;Q=q+8|0}else{if((g&2|0)==0){R=r}else{g=r-(c[j>>2]|0)|0;ff(e,1,-1);R=(c[j>>2]|0)+g|0}g=q+8|0;c[e+20>>2]=c[(c[g>>2]|0)+28>>2];P=R;Q=g}g=c[q>>2]|0;R=b[q+16>>1]|0;c[E>>2]=c[Q>>2];a:do{if(R<<16>>16==0){S=g}else{Q=R<<16>>16;E=g;q=P;while(1){if(q>>>0>=(c[k>>2]|0)>>>0){break}e=E+16|0;j=q;r=E;O=c[j+4>>2]|0;c[r>>2]=c[j>>2];c[r+4>>2]=O;c[E+8>>2]=c[q+8>>2];O=Q-1|0;if((O|0)==0){S=e;break a}else{Q=O;E=e;q=q+16|0}}if((Q|0)>0){T=Q;U=E}else{S=E;break}while(1){q=T-1|0;c[U+8>>2]=0;if((q|0)>0){T=q;U=U+16|0}else{break}}S=E+(Q<<4)|0}}while(0);c[k>>2]=S;M=1;i=h;return M|0}function hf(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=a+16|0;g=c[f>>2]|0;h=d[a+40|0]|0;if((h&6|0)==0){i=e;j=g+8|0}else{if((h&2|0)==0){k=e}else{h=a+28|0;l=e-(c[h>>2]|0)|0;ff(a,1,-1);k=(c[h>>2]|0)+l|0}l=g+8|0;c[a+20>>2]=c[(c[l>>2]|0)+28>>2];i=k;j=l}l=c[g>>2]|0;k=b[g+16>>1]|0;g=k<<16>>16;c[f>>2]=c[j>>2];j=a+8|0;if(k<<16>>16==0){m=l;c[j>>2]=m;n=g+1|0;return n|0}else{o=g;p=l;q=i}while(1){if(q>>>0>=(c[j>>2]|0)>>>0){break}i=p+16|0;l=q;k=p;a=c[l+4>>2]|0;c[k>>2]=c[l>>2];c[k+4>>2]=a;c[p+8>>2]=c[q+8>>2];a=o-1|0;if((a|0)==0){m=i;r=12;break}else{o=a;p=i;q=q+16|0}}if((r|0)==12){c[j>>2]=m;n=g+1|0;return n|0}if((o|0)>0){s=o;t=p}else{m=p;c[j>>2]=m;n=g+1|0;return n|0}while(1){r=s-1|0;c[t+8>>2]=0;if((r|0)>0){s=r;t=t+16|0}else{break}}m=p+(o<<4)|0;c[j>>2]=m;n=g+1|0;return n|0}function jf(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=a+38|0;j=(b[h>>1]|0)+1&65535;b[h>>1]=j;do{if((j&65535)>>>0>199>>>0){if(j<<16>>16==200){Ve(a,13392,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k}if((j&65535)>>>0<=224>>>0){break}af(a,6)}}while(0);j=(f|0)!=0;if(!j){f=a+36|0;b[f>>1]=(b[f>>1]|0)+1}if((gf(a,d,e)|0)==0){xh(a)}if(j){l=b[h>>1]|0;m=l-1&65535;b[h>>1]=m;i=g;return}j=a+36|0;b[j>>1]=(b[j>>1]|0)-1;l=b[h>>1]|0;m=l-1&65535;b[h>>1]=m;i=g;return}function kf(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;h=e+36|0;i=b[h>>1]|0;if((f|0)==0){j=1}else{j=(b[f+38>>1]|0)+1&65535}f=e+38|0;b[f>>1]=j;b[h>>1]=0;j=e+8|0;k=bf(e,44,(c[j>>2]|0)+(-g<<4)|0)|0;if((k|0)==-1){l=2;b[h>>1]=i;m=b[f>>1]|0;n=m-1&65535;b[f>>1]=n;return l|0}if(k>>>0<=1>>>0){l=k;b[h>>1]=i;m=b[f>>1]|0;n=m-1&65535;b[f>>1]=n;return l|0}g=e+16|0;o=e+28|0;p=e+41|0;q=e+68|0;r=e+32|0;s=e+12|0;t=k;a:while(1){k=c[g>>2]|0;if((k|0)==0){break}else{u=k}while(1){v=u+18|0;if((a[v]&16)!=0){break}k=c[u+8>>2]|0;if((k|0)==0){break a}else{u=k}}k=c[o>>2]|0;w=c[u+20>>2]|0;x=k+w|0;zf(e,x);if((t|0)==6){y=Rg(e,3056,23)|0;c[x>>2]=y;c[k+(w+8)>>2]=d[y+4|0]|0|64}else if((t|0)==4){y=c[(c[s>>2]|0)+180>>2]|0;c[x>>2]=y;c[k+(w+8)>>2]=d[y+4|0]|0|64}else{y=c[j>>2]|0;z=y-16|0;A=x;x=c[z+4>>2]|0;c[A>>2]=c[z>>2];c[A+4>>2]=x;c[k+(w+8)>>2]=c[y-16+8>>2]}y=k+(w+16)|0;c[j>>2]=y;c[g>>2]=u;a[p]=a[u+36|0]|0;b[h>>1]=0;if((u|0)==0){B=y}else{w=y;y=u;while(1){k=c[y+4>>2]|0;x=w>>>0<k>>>0?k:w;k=c[y+8>>2]|0;if((k|0)==0){B=x;break}else{w=x;y=k}}}y=B-(c[o>>2]|0)|0;w=(y>>4)+1|0;k=((w|0)/8|0)+10+w|0;w=(k|0)>1e6?1e6:k;do{if((y|0)<=15999984){if((w|0)>=(c[r>>2]|0)){break}cf(e,w)}}while(0);c[q>>2]=c[u+32>>2];a[v]=a[v]|32;a[u+37|0]=t;w=bf(e,48,0)|0;if(w>>>0>1>>>0){t=w}else{l=w;C=24;break}}if((C|0)==24){b[h>>1]=i;m=b[f>>1]|0;n=m-1&65535;b[f>>1]=n;return l|0}a[e+6|0]=t;C=c[j>>2]|0;if((t|0)==6){u=Rg(e,3056,23)|0;c[C>>2]=u;c[C+8>>2]=d[u+4|0]|0|64}else if((t|0)==4){u=c[(c[s>>2]|0)+180>>2]|0;c[C>>2]=u;c[C+8>>2]=d[u+4|0]|0|64}else{u=C-16|0;s=C;e=c[u+4>>2]|0;c[s>>2]=c[u>>2];c[s+4>>2]=e;c[C+8>>2]=c[C-16+8>>2]}e=C+16|0;c[j>>2]=e;c[(c[g>>2]|0)+4>>2]=e;l=t;b[h>>1]=i;m=b[f>>1]|0;n=m-1&65535;b[f>>1]=n;return l|0}function lf(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;j=c[d+16>>2]|0;if((b[d+36>>1]|0)!=0){if((c[(c[d+12>>2]|0)+172>>2]|0)==(d|0)){Ve(d,7240,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;return 0}else{Ve(d,9608,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;return 0}}a[d+6|0]=1;k=j|0;c[j+20>>2]=(c[k>>2]|0)-(c[d+28>>2]|0);if((a[j+18|0]&1)!=0){i=h;return 0}c[j+28>>2]=g;if((g|0)==0){l=d+8|0;m=c[l>>2]|0;n=~e;o=m+(n<<4)|0;c[k>>2]=o;af(d,1);return 0}c[j+24>>2]=f;l=d+8|0;m=c[l>>2]|0;n=~e;o=m+(n<<4)|0;c[k>>2]=o;af(d,1);return 0}function mf(e,f,g,h,i){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;j=e+16|0;k=c[j>>2]|0;l=e+41|0;m=a[l]|0;n=e+36|0;o=b[n>>1]|0;p=e+68|0;q=c[p>>2]|0;c[p>>2]=i;i=bf(e,f,g)|0;if((i|0)==0){c[p>>2]=q;return i|0}g=e+28|0;f=c[g>>2]|0;r=f+h|0;zf(e,r);if((i|0)==4){s=c[(c[e+12>>2]|0)+180>>2]|0;c[r>>2]=s;c[f+(h+8)>>2]=d[s+4|0]|0|64}else if((i|0)==6){s=Rg(e,3056,23)|0;c[r>>2]=s;c[f+(h+8)>>2]=d[s+4|0]|0|64}else{s=c[e+8>>2]|0;t=s-16|0;u=r;r=c[t+4>>2]|0;c[u>>2]=c[t>>2];c[u+4>>2]=r;c[f+(h+8)>>2]=c[s-16+8>>2]}s=f+(h+16)|0;c[e+8>>2]=s;c[j>>2]=k;a[l]=m;b[n>>1]=o;if((k|0)==0){v=s}else{o=s;s=k;while(1){k=c[s+4>>2]|0;n=o>>>0<k>>>0?k:o;k=c[s+8>>2]|0;if((k|0)==0){v=n;break}else{o=n;s=k}}}s=v-(c[g>>2]|0)|0;g=(s>>4)+1|0;v=((g|0)/8|0)+10+g|0;g=(v|0)>1e6?1e6:v;if((s|0)>15999984){c[p>>2]=q;return i|0}if((g|0)>=(c[e+32>>2]|0)){c[p>>2]=q;return i|0}cf(e,g);c[p>>2]=q;return i|0}function nf(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+64|0;h=g|0;j=a+36|0;b[j>>1]=(b[j>>1]|0)+1;c[h>>2]=d;c[h+56>>2]=e;c[h+52>>2]=f;f=h+16|0;c[f>>2]=0;e=h+24|0;c[e>>2]=0;d=h+28|0;c[d>>2]=0;k=h+36|0;c[k>>2]=0;l=h+40|0;c[l>>2]=0;m=h+48|0;c[m>>2]=0;n=h+4|0;c[n>>2]=0;o=h+12|0;c[o>>2]=0;p=mf(a,40,h,(c[a+8>>2]|0)-(c[a+28>>2]|0)|0,c[a+68>>2]|0)|0;c[n>>2]=$f(a,c[n>>2]|0,c[o>>2]|0,0)|0;c[o>>2]=0;$f(a,c[f>>2]|0,c[e>>2]<<1,0)|0;$f(a,c[d>>2]|0,c[k>>2]<<4,0)|0;$f(a,c[l>>2]|0,c[m>>2]<<4,0)|0;b[j>>1]=(b[j>>1]|0)-1;i=g;return p|0}function of(f,g){f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=g;i=f+16|0;j=c[i>>2]|0;if((e[f+38>>1]|0)>>>0>199>>>0){rf(f,13392,h)}k=f+6|0;l=a[k]|0;if((l<<24>>24|0)==0){if((j|0)!=(f+72|0)){rf(f,2648,h)}if((gf(f,g-16|0,-1)|0)!=0){return}xh(f);return}else if((l<<24>>24|0)==1){a[k]=0;k=f+28|0;c[j>>2]=(c[k>>2]|0)+(c[j+20>>2]|0);l=j+18|0;g=a[l]|0;if((g&1)==0){m=c[j+28>>2]|0;if((m|0)==0){n=h}else{a[j+37|0]=1;a[l]=g|8;g=Ac[m&511](f)|0;n=(c[f+8>>2]|0)+(-g<<4)|0}g=c[i>>2]|0;m=d[f+40|0]|0;if((m&6|0)==0){o=n;p=g+8|0}else{if((m&2|0)==0){q=n}else{m=n-(c[k>>2]|0)|0;ff(f,1,-1);q=(c[k>>2]|0)+m|0}m=g+8|0;c[f+20>>2]=c[(c[m>>2]|0)+28>>2];o=q;p=m}m=c[g>>2]|0;q=b[g+16>>1]|0;c[i>>2]=c[p>>2];p=f+8|0;a:do{if(q<<16>>16==0){r=m}else{i=q<<16>>16;g=m;k=o;while(1){if(k>>>0>=(c[p>>2]|0)>>>0){break}n=g+16|0;l=k;j=g;s=c[l+4>>2]|0;c[j>>2]=c[l>>2];c[j+4>>2]=s;c[g+8>>2]=c[k+8>>2];s=i-1|0;if((s|0)==0){r=n;break a}else{i=s;g=n;k=k+16|0}}if((i|0)>0){t=i;u=g}else{r=g;break}while(1){k=t-1|0;c[u+8>>2]=0;if((k|0)>0){t=k;u=u+16|0}else{break}}r=g+(i<<4)|0}}while(0);c[p>>2]=r}else{xh(f)}pf(f,0);return}else{rf(f,13672,h)}}function pf(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;f=e+16|0;g=c[f>>2]|0;h=e+72|0;if((g|0)==(h|0)){return}i=e+8|0;j=e+40|0;k=e+20|0;l=e+28|0;m=e+68|0;n=g;do{g=n+18|0;o=a[g]|0;if((o&1)==0){if((o&16)!=0){a[g]=o&-17;c[m>>2]=c[n+32>>2]}do{if((b[n+16>>1]|0)==-1){o=(c[f>>2]|0)+4|0;p=c[i>>2]|0;if((c[o>>2]|0)>>>0>=p>>>0){break}c[o>>2]=p}}while(0);p=a[g]|0;if((p&32)==0){a[n+37|0]=1}a[g]=p&-57|8;p=Ac[c[n+28>>2]&511](e)|0;o=(c[i>>2]|0)+(-p<<4)|0;p=c[f>>2]|0;q=d[j]|0;if((q&6|0)==0){r=o;s=p+8|0}else{if((q&2|0)==0){t=o}else{q=o-(c[l>>2]|0)|0;ff(e,1,-1);t=(c[l>>2]|0)+q|0}q=p+8|0;c[k>>2]=c[(c[q>>2]|0)+28>>2];r=t;s=q}q=c[p>>2]|0;o=b[p+16>>1]|0;c[f>>2]=c[s>>2];a:do{if(o<<16>>16==0){u=q}else{p=o<<16>>16;v=q;w=r;while(1){if(w>>>0>=(c[i>>2]|0)>>>0){break}x=v+16|0;y=w;z=v;A=c[y+4>>2]|0;c[z>>2]=c[y>>2];c[z+4>>2]=A;c[v+8>>2]=c[w+8>>2];A=p-1|0;if((A|0)==0){u=x;break a}else{p=A;v=x;w=w+16|0}}if((p|0)>0){B=p;C=v}else{u=v;break}while(1){w=B-1|0;c[C+8>>2]=0;if((w|0)>0){B=w;C=C+16|0}else{break}}u=v+(p<<4)|0}}while(0);c[i>>2]=u}else{wh(e);xh(e)}n=c[f>>2]|0;}while((n|0)!=(h|0));return}function qf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;g=e;h=c[g>>2]|0;j=c[h>>2]|0;c[h>>2]=j-1;h=c[g>>2]|0;if((j|0)==0){k=yh(h)|0}else{j=h+4|0;h=c[j>>2]|0;c[j>>2]=h+1;k=d[h]|0}h=c[e+52>>2]|0;j=(h|0)==0;if((k|0)==27){do{if(!j){if((Va(h|0,98)|0)!=0){break}hg(b,3512,(l=i,i=i+16|0,c[l>>2]=4392,c[l+8>>2]=h,l)|0)|0;i=l;af(b,3)}}while(0);m=ih(b,c[g>>2]|0,e+4|0,c[e+56>>2]|0)|0}else{do{if(!j){if((Va(h|0,116)|0)!=0){break}hg(b,3512,(l=i,i=i+16|0,c[l>>2]=3904,c[l+8>>2]=h,l)|0)|0;i=l;af(b,3)}}while(0);m=jg(b,c[g>>2]|0,e+4|0,e+16|0,c[e+56>>2]|0,k)|0}k=m+6|0;if((a[k]|0)==0){i=f;return}e=m+16|0;g=m+5|0;l=m;m=0;do{h=wf(b)|0;c[e+(m<<2)>>2]=h;j=h;do{if((a[h+5|0]&3)!=0){if((a[g]&4)==0){break}Df(b,l,j)}}while(0);m=m+1|0;}while((m|0)<(d[k]|0));i=f;return}function rf(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=a+8|0;c[f>>2]=e;g=Sg(a,b)|0;c[e>>2]=g;c[e+8>>2]=d[g+4|0]|0|64;c[f>>2]=(c[f>>2]|0)+16;af(a,-1)}function sf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+48|0;h=g+24|0;c[h>>2]=a;c[h+4>>2]=d;c[h+8>>2]=e;c[h+12>>2]=f;f=h+16|0;j=g|0;jh(j);c[f>>2]=Dc[d&63](a,j,18,e)|0;tf(b,h);i=g;return c[f>>2]|0}function tf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0;e=i;i=i+216|0;f=e|0;g=e+8|0;j=e+16|0;k=e+24|0;l=e+32|0;m=e+40|0;n=e+48|0;o=e+56|0;p=e+64|0;q=e+72|0;r=e+80|0;s=e+88|0;t=e+96|0;u=e+104|0;v=e+112|0;w=e+120|0;x=e+128|0;y=e+136|0;z=e+144|0;A=e+152|0;B=e+160|0;C=e+168|0;D=e+176|0;E=e+184|0;F=e+192|0;G=e+200|0;H=e+208|0;c[w>>2]=c[b+64>>2];I=d+16|0;J=c[I>>2]|0;if((J|0)==0){K=Dc[c[d+4>>2]&63](c[d>>2]|0,w,4,c[d+8>>2]|0)|0;c[I>>2]=K;L=K}else{L=J}c[v>>2]=c[b+68>>2];if((L|0)==0){J=Dc[c[d+4>>2]&63](c[d>>2]|0,v,4,c[d+8>>2]|0)|0;c[I>>2]=J;M=J}else{M=L}a[u]=a[b+76|0]|0;if((M|0)==0){L=Dc[c[d+4>>2]&63](c[d>>2]|0,u,1,c[d+8>>2]|0)|0;c[I>>2]=L;N=L}else{N=M}a[t]=a[b+77|0]|0;if((N|0)==0){M=Dc[c[d+4>>2]&63](c[d>>2]|0,t,1,c[d+8>>2]|0)|0;c[I>>2]=M;O=M}else{O=N}a[s]=a[b+78|0]|0;if((O|0)==0){N=Dc[c[d+4>>2]&63](c[d>>2]|0,s,1,c[d+8>>2]|0)|0;c[I>>2]=N;P=N}else{P=O}O=c[b+12>>2]|0;N=c[b+48>>2]|0;c[r>>2]=N;do{if((P|0)==0){s=d+4|0;M=d|0;t=d+8|0;L=Dc[c[s>>2]&63](c[M>>2]|0,r,4,c[t>>2]|0)|0;c[I>>2]=L;if((L|0)!=0){Q=L;R=13;break}L=Dc[c[s>>2]&63](c[M>>2]|0,O,N<<2,c[t>>2]|0)|0;c[I>>2]=L;t=c[b+44>>2]|0;c[n>>2]=t;if((L|0)!=0){S=L;T=t;break}L=Dc[c[d+4>>2]&63](c[d>>2]|0,n,4,c[d+8>>2]|0)|0;c[I>>2]=L;S=L;T=t}else{Q=P;R=13}}while(0);if((R|0)==13){P=c[b+44>>2]|0;c[n>>2]=P;S=Q;T=P}if((T|0)>0){P=b+8|0;Q=d+4|0;n=d|0;N=d+8|0;O=g;r=j;t=k;L=0;M=S;while(1){s=c[P>>2]|0;u=s+(L<<4)|0;J=s+(L<<4)+8|0;s=c[J>>2]|0;a[m]=s&15;if((M|0)==0){v=Dc[c[Q>>2]&63](c[n>>2]|0,m,1,c[N>>2]|0)|0;c[I>>2]=v;U=v;V=c[J>>2]|0}else{U=M;V=s}s=V&15;do{if((s|0)==1){a[l]=c[u>>2];if((U|0)!=0){W=U;break}J=Dc[c[Q>>2]&63](c[n>>2]|0,l,1,c[N>>2]|0)|0;c[I>>2]=J;W=J}else if((s|0)==3){h[k>>3]=+h[u>>3];if((U|0)!=0){W=U;break}J=Dc[c[Q>>2]&63](c[n>>2]|0,t,8,c[N>>2]|0)|0;c[I>>2]=J;W=J}else if((s|0)==4){J=c[u>>2]|0;if((J|0)==0){c[g>>2]=0;if((U|0)!=0){W=U;break}v=Dc[c[Q>>2]&63](c[n>>2]|0,O,4,c[N>>2]|0)|0;c[I>>2]=v;W=v;break}c[j>>2]=(c[J+12>>2]|0)+1;if((U|0)!=0){W=U;break}v=Dc[c[Q>>2]&63](c[n>>2]|0,r,4,c[N>>2]|0)|0;c[I>>2]=v;if((v|0)!=0){W=v;break}v=Dc[c[Q>>2]&63](c[n>>2]|0,J+16|0,c[j>>2]|0,c[N>>2]|0)|0;c[I>>2]=v;W=v}else{W=U}}while(0);u=L+1|0;if((u|0)<(T|0)){L=u;M=W}else{X=W;break}}}else{X=S}S=c[b+56>>2]|0;c[f>>2]=S;if((X|0)==0){W=Dc[c[d+4>>2]&63](c[d>>2]|0,f,4,c[d+8>>2]|0)|0;c[I>>2]=W;Y=W}else{Y=X}if((S|0)>0){X=b+16|0;W=0;do{tf(c[(c[X>>2]|0)+(W<<2)>>2]|0,d);W=W+1|0;}while((W|0)<(S|0));Z=c[I>>2]|0}else{Z=Y}Y=b+40|0;S=c[Y>>2]|0;c[q>>2]=S;if((Z|0)==0){W=Dc[c[d+4>>2]&63](c[d>>2]|0,q,4,c[d+8>>2]|0)|0;c[I>>2]=W;_=W}else{_=Z}if((S|0)>0){Z=b+28|0;W=d+4|0;q=d|0;X=d+8|0;f=0;M=_;while(1){L=c[Z>>2]|0;a[p]=a[L+(f<<3)+4|0]|0;if((M|0)==0){T=Dc[c[W>>2]&63](c[q>>2]|0,p,1,c[X>>2]|0)|0;c[I>>2]=T;$=c[Z>>2]|0;aa=T}else{$=L;aa=M}a[o]=a[$+(f<<3)+5|0]|0;if((aa|0)==0){L=Dc[c[W>>2]&63](c[q>>2]|0,o,1,c[X>>2]|0)|0;c[I>>2]=L;ba=L}else{ba=aa}L=f+1|0;if((L|0)<(S|0)){f=L;M=ba}else{ca=ba;break}}}else{ca=_}_=d+12|0;do{if((c[_>>2]|0)==0){ba=c[b+36>>2]|0;M=G;f=H;if((ba|0)==0){da=M;ea=f;R=50;break}c[H>>2]=(c[ba+12>>2]|0)+1;if((ca|0)!=0){fa=M;ga=f;break}S=d+4|0;aa=d|0;X=d+8|0;o=Dc[c[S>>2]&63](c[aa>>2]|0,f,4,c[X>>2]|0)|0;c[I>>2]=o;if((o|0)!=0){fa=M;ga=f;break}c[I>>2]=Dc[c[S>>2]&63](c[aa>>2]|0,ba+16|0,c[H>>2]|0,c[X>>2]|0)|0;fa=M;ga=f}else{da=G;ea=H;R=50}}while(0);do{if((R|0)==50){c[G>>2]=0;if((ca|0)!=0){fa=da;ga=ea;break}c[I>>2]=Dc[c[d+4>>2]&63](c[d>>2]|0,da,4,c[d+8>>2]|0)|0;fa=da;ga=ea}}while(0);if((c[_>>2]|0)==0){ha=c[b+52>>2]|0}else{ha=0}ea=c[b+20>>2]|0;c[F>>2]=ha;ga=c[I>>2]|0;do{if((ga|0)==0){da=d+4|0;fa=d|0;ca=d+8|0;G=Dc[c[da>>2]&63](c[fa>>2]|0,F,4,c[ca>>2]|0)|0;c[I>>2]=G;if((G|0)!=0){ia=G;break}G=Dc[c[da>>2]&63](c[fa>>2]|0,ea,ha<<2,c[ca>>2]|0)|0;c[I>>2]=G;ia=G}else{ia=ga}}while(0);if((c[_>>2]|0)==0){ja=c[b+60>>2]|0}else{ja=0}c[E>>2]=ja;if((ia|0)==0){ga=Dc[c[d+4>>2]&63](c[d>>2]|0,E,4,c[d+8>>2]|0)|0;c[I>>2]=ga;ka=ga}else{ka=ia}if((ja|0)>0){ia=b+24|0;ga=C;E=D;ha=d+4|0;ea=d|0;F=d+8|0;G=B;ca=A;fa=0;da=ka;while(1){R=c[(c[ia>>2]|0)+(fa*12|0)>>2]|0;do{if((R|0)==0){c[C>>2]=0;if((da|0)!=0){la=da;break}H=Dc[c[ha>>2]&63](c[ea>>2]|0,ga,4,c[F>>2]|0)|0;c[I>>2]=H;la=H}else{c[D>>2]=(c[R+12>>2]|0)+1;if((da|0)!=0){la=da;break}H=Dc[c[ha>>2]&63](c[ea>>2]|0,E,4,c[F>>2]|0)|0;c[I>>2]=H;if((H|0)!=0){la=H;break}H=Dc[c[ha>>2]&63](c[ea>>2]|0,R+16|0,c[D>>2]|0,c[F>>2]|0)|0;c[I>>2]=H;la=H}}while(0);R=c[ia>>2]|0;c[B>>2]=c[R+(fa*12|0)+4>>2];if((la|0)==0){H=Dc[c[ha>>2]&63](c[ea>>2]|0,G,4,c[F>>2]|0)|0;c[I>>2]=H;ma=c[ia>>2]|0;na=H}else{ma=R;na=la}c[A>>2]=c[ma+(fa*12|0)+8>>2];if((na|0)==0){R=Dc[c[ha>>2]&63](c[ea>>2]|0,ca,4,c[F>>2]|0)|0;c[I>>2]=R;oa=R}else{oa=na}R=fa+1|0;if((R|0)<(ja|0)){fa=R;da=oa}else{pa=oa;break}}}else{pa=ka}if((c[_>>2]|0)==0){qa=c[Y>>2]|0}else{qa=0}c[z>>2]=qa;if((pa|0)==0){Y=Dc[c[d+4>>2]&63](c[d>>2]|0,z,4,c[d+8>>2]|0)|0;c[I>>2]=Y;ra=Y}else{ra=pa}if((qa|0)<=0){i=e;return}pa=b+28|0;b=x;Y=y;z=d+4|0;_=d|0;ka=d+8|0;d=0;oa=ra;while(1){ra=c[(c[pa>>2]|0)+(d<<3)>>2]|0;do{if((ra|0)==0){c[x>>2]=0;if((oa|0)!=0){sa=oa;break}da=Dc[c[z>>2]&63](c[_>>2]|0,b,4,c[ka>>2]|0)|0;c[I>>2]=da;sa=da}else{c[y>>2]=(c[ra+12>>2]|0)+1;if((oa|0)!=0){sa=oa;break}da=Dc[c[z>>2]&63](c[_>>2]|0,Y,4,c[ka>>2]|0)|0;c[I>>2]=da;if((da|0)!=0){sa=da;break}da=Dc[c[z>>2]&63](c[_>>2]|0,ra+16|0,c[y>>2]|0,c[ka>>2]|0)|0;c[I>>2]=da;sa=da}}while(0);ra=d+1|0;if((ra|0)<(qa|0)){d=ra;oa=sa}else{break}}i=e;return}function uf(b,c){b=b|0;c=c|0;var d=0;d=Hf(b,38,(c<<4)+16|0,0,0)|0;a[d+6|0]=c;return d|0}function vf(b,d){b=b|0;d=d|0;var e=0,f=0;e=Hf(b,6,(d<<2)+16|0,0,0)|0;b=e|0;c[e+12>>2]=0;a[e+6|0]=d;if((d|0)==0){return b|0}f=e+16|0;e=d;do{e=e-1|0;c[f+(e<<2)>>2]=0;}while((e|0)!=0);return b|0}function wf(a){a=a|0;var b=0;b=Hf(a,10,32,0,0)|0;c[b+8>>2]=b+16;c[b+24>>2]=0;return b|0}function xf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=c[b+12>>2]|0;g=b+56|0;h=c[g>>2]|0;a:do{if((h|0)==0){i=g}else{j=g;k=h;while(1){l=c[k+8>>2]|0;if(l>>>0<e>>>0){i=j;break a}m=k;n=k|0;if((l|0)==(e|0)){break}l=c[n>>2]|0;if((l|0)==0){i=n;break a}else{j=n;k=l}}j=k+5|0;l=(d[j]|0)^3;if((((d[f+60|0]|0)^3)&l|0)!=0){o=m;return o|0}a[j]=l;o=m;return o|0}}while(0);m=Hf(b,10,32,i,0)|0;i=m;c[m+8>>2]=e;e=m+16|0;c[e>>2]=f+112;m=f+132|0;f=c[m>>2]|0;c[e+4>>2]=f;c[f+16>>2]=i;c[m>>2]=i;o=i;return o|0}function yf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;if((c[b+8>>2]|0)==(b+16|0)){d=b;e=$f(a,d,32,0)|0;return}f=b+16|0;g=f;h=f+4|0;c[(c[h>>2]|0)+16>>2]=c[g>>2];c[(c[g>>2]|0)+20>>2]=c[h>>2];d=b;e=$f(a,d,32,0)|0;return}function zf(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=c[a+12>>2]|0;f=a+56|0;g=c[f>>2]|0;if((g|0)==0){return}h=e+60|0;i=e+68|0;j=g;while(1){g=j;k=j+8|0;if((c[k>>2]|0)>>>0<b>>>0){l=10;break}m=j|0;c[f>>2]=c[m>>2];if((((d[h]|0)^3)&((d[j+5|0]|0)^3)|0)==0){if((c[k>>2]|0)!=(j+16|0)){n=j+16|0;o=n;p=n+4|0;c[(c[p>>2]|0)+16>>2]=c[o>>2];c[(c[o>>2]|0)+20>>2]=c[p>>2]}$f(a,j,32,0)|0}else{p=j+16|0;o=p;n=p+4|0;c[(c[n>>2]|0)+16>>2]=c[o>>2];c[(c[o>>2]|0)+20>>2]=c[n>>2];n=c[k>>2]|0;o=j+16|0;p=n;q=o;r=c[p+4>>2]|0;c[q>>2]=c[p>>2];c[q+4>>2]=r;c[j+24>>2]=c[n+8>>2];c[k>>2]=o;c[m>>2]=c[i>>2];c[i>>2]=j;Gf(e,g)}g=c[f>>2]|0;if((g|0)==0){l=10;break}else{j=g}}if((l|0)==10){return}}function Af(b){b=b|0;var d=0;d=Hf(b,9,80,0,0)|0;b=d;c[d+8>>2]=0;c[d+44>>2]=0;c[d+16>>2]=0;c[d+56>>2]=0;c[d+12>>2]=0;c[d+32>>2]=0;c[d+48>>2]=0;c[b+20>>2]=0;c[d+52>>2]=0;c[b+28>>2]=0;c[d+40>>2]=0;a[d+76|0]=0;a[d+77|0]=0;a[d+78|0]=0;c[d+24>>2]=0;c[d+60>>2]=0;c[d+64>>2]=0;c[d+68>>2]=0;c[d+36>>2]=0;return b|0}function Bf(a,b){a=a|0;b=b|0;$f(a,c[b+12>>2]|0,c[b+48>>2]<<2,0)|0;$f(a,c[b+16>>2]|0,c[b+56>>2]<<2,0)|0;$f(a,c[b+8>>2]|0,c[b+44>>2]<<4,0)|0;$f(a,c[b+20>>2]|0,c[b+52>>2]<<2,0)|0;$f(a,c[b+24>>2]|0,(c[b+60>>2]|0)*12|0,0)|0;$f(a,c[b+28>>2]|0,c[b+40>>2]<<3,0)|0;$f(a,b,80,0)|0;return}function Cf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+60>>2]|0;if((e|0)<=0){f=0;return f|0}g=c[a+24>>2]|0;a=b;b=0;while(1){if((c[g+(b*12|0)+4>>2]|0)>(d|0)){f=0;h=8;break}if((c[g+(b*12|0)+8>>2]|0)>(d|0)){i=a-1|0;if((i|0)==0){h=6;break}else{j=i}}else{j=a}i=b+1|0;if((i|0)<(e|0)){a=j;b=i}else{f=0;h=8;break}}if((h|0)==6){f=(c[g+(b*12|0)>>2]|0)+16|0;return f|0}else if((h|0)==8){return f|0}return 0}function Df(b,e,f){b=b|0;e=e|0;f=f|0;var g=0;g=c[b+12>>2]|0;if((d[g+61|0]|0)>>>0<2>>>0){Pf(g,f);return}else{f=e+5|0;a[f]=a[g+60|0]&3|a[f]&-72;return}}function Ef(b,d){b=b|0;d=d|0;var e=0;e=c[b+12>>2]|0;b=d+5|0;a[b]=a[b]&-5;b=e+88|0;c[d+24>>2]=c[b>>2];c[b>>2]=d;return}function Ff(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;if((c[e+32>>2]|0)!=0){g=c[b+12>>2]|0;h=e+5|0;a[h]=a[h]&-5;h=g+88|0;c[e+72>>2]=c[h>>2];c[h>>2]=e;return}if((a[f+5|0]&3)==0){return}h=e+5|0;e=a[h]|0;if((e&4)==0){return}g=c[b+12>>2]|0;if((d[g+61|0]|0)>>>0<2>>>0){Pf(g,f);return}else{a[h]=a[g+60|0]&3|e&-72;return}}function Gf(b,e){b=b|0;e=e|0;var f=0,g=0;f=e+5|0;g=a[f]|0;if((g&7)!=0){return}do{if((a[b+62|0]|0)!=2){if((d[b+61|0]|0)>>>0<2>>>0){break}a[f]=a[b+60|0]&3|g&-72;return}}while(0);a[f]=g&-69|4;g=c[e+8>>2]|0;if((c[g+8>>2]&64|0)==0){return}e=c[g>>2]|0;if((a[e+5|0]&3)==0){return}Pf(b,e);return}function Hf(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=c[b+12>>2]|0;i=$f(b,0,d&15,e)|0;e=i+g|0;b=e;j=(f|0)==0?h+68|0:f;a[i+(g+5)|0]=a[h+60|0]&3;a[i+(g+4)|0]=d;c[e>>2]=c[j>>2];c[j>>2]=b;return b|0}function If(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=c[b+12>>2]|0;h=e+5|0;if((a[h]&24)!=0|(f|0)==0){return}if((a[f+6|0]&4)!=0){return}if((gh(f,2,c[g+192>>2]|0)|0)==0){return}f=g+76|0;i=c[f>>2]|0;j=e|0;if((i|0)==(j|0)){do{k=Qf(b,i,1)|0;}while((k|0)==(i|0));c[f>>2]=k}k=g+68|0;while(1){f=c[k>>2]|0;if((f|0)==(e|0)){break}else{k=f|0}}c[k>>2]=c[j>>2];k=g+72|0;c[j>>2]=c[k>>2];c[k>>2]=e;e=a[h]|16;a[h]=e;if((d[g+61|0]|0)>>>0<2>>>0){a[h]=e&-65;return}else{a[h]=a[g+60|0]&3|e&-72;return}}function Jf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=b+12|0;g=c[f>>2]|0;h=g+62|0;if((d[h]|0)==(e|0)){return}if((e|0)==2){e=g+61|0;if((a[e]|0)!=0){do{Rf(b)|0;}while((a[e]|0)!=0)}c[g+20>>2]=(c[g+12>>2]|0)+(c[g+8>>2]|0);a[h]=2;return}a[h]=0;h=c[f>>2]|0;a[h+61|0]=2;c[h+64>>2]=0;g=h+72|0;do{i=Qf(b,g,1)|0;}while((i|0)==(g|0));c[h+80>>2]=i;i=h+68|0;do{j=Qf(b,i,1)|0;}while((j|0)==(i|0));c[h+76>>2]=j;j=(c[f>>2]|0)+61|0;if((1<<d[j]&-29|0)!=0){return}do{Rf(b)|0;}while((1<<d[j]&-29|0)==0);return}function Kf(a,b){a=a|0;b=b|0;var e=0;e=(c[a+12>>2]|0)+61|0;if((1<<(d[e]|0)&b|0)!=0){return}do{Rf(a)|0;}while((1<<(d[e]|0)&b|0)==0);return}function Lf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=b+12|0;e=c[d>>2]|0;f=e+104|0;while(1){g=c[f>>2]|0;if((g|0)==0){break}else{f=g|0}}g=e+72|0;h=c[g>>2]|0;if((h|0)==0){i=e}else{j=f;f=h;while(1){h=f+5|0;a[h]=a[h]|8;h=f|0;c[g>>2]=c[h>>2];c[h>>2]=c[j>>2];c[j>>2]=f;k=c[g>>2]|0;if((k|0)==0){break}else{j=h;f=k}}i=c[d>>2]|0}d=i+104|0;i=c[d>>2]|0;if((i|0)!=0){f=i;do{i=f+5|0;a[i]=a[i]&-65;Sf(b,0);f=c[d>>2]|0;}while((f|0)!=0)}a[e+60|0]=3;a[e+62|0]=0;Qf(b,g,-3)|0;Qf(b,e+68|0,-3)|0;g=e+32|0;if((c[g>>2]|0)<=0){return}f=e+24|0;e=0;do{Qf(b,(c[f>>2]|0)+(e<<2)|0,-3)|0;e=e+1|0;}while((e|0)<(c[g>>2]|0));return}function Mf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=c[b+12>>2]|0;a:do{if((a[d+62|0]|0)==2){e=d+20|0;f=c[e>>2]|0;do{if((f|0)==0){Of(b,0);g=c[d+8>>2]|0;h=c[d+12>>2]|0;c[e>>2]=h+g;i=g;j=h}else{h=d+61|0;if((a[h]|0)!=5){do{Rf(b)|0;}while((a[h]|0)!=5)}a[h]=0;g=c[d+8>>2]|0;k=c[d+12>>2]|0;if((k+g|0)>>>0>(ca(c[d+160>>2]|0,(f>>>0)/100|0)|0)>>>0){c[e>>2]=0;i=g;j=k;break}else{c[e>>2]=f;i=g;j=k;break}}}while(0);f=i+j|0;e=(f|0)/100|0;k=c[d+156>>2]|0;if((k|0)<(2147483644/(e|0)|0|0)){l=ca(k,e)|0}else{l=2147483644}Eg(d,f-l|0);m=d+61|0}else{f=d+12|0;e=c[d+164>>2]|0;k=(e|0)<40?40:e;e=((c[f>>2]|0)/200|0)+1|0;if((e|0)<(2147483644/(k|0)|0|0)){n=ca(e,k)|0}else{n=2147483644}e=d+61|0;g=n;do{g=g-(Rf(b)|0)|0;o=(a[e]|0)==5;if((g|0)<=-1600){p=17;break}}while(!o);do{if((p|0)==17){if(o){break}Eg(d,((g|0)/(k|0)|0)*200|0);m=e;break a}}while(0);k=(c[d+20>>2]|0)/100|0;g=c[d+156>>2]|0;if((g|0)<(2147483644/(k|0)|0|0)){q=ca(g,k)|0}else{q=2147483644}Eg(d,(c[d+8>>2]|0)-q+(c[f>>2]|0)|0);m=e}}while(0);q=d+104|0;if((c[q>>2]|0)==0){return}else{r=0}while(1){if((r|0)>=4){if((a[m]|0)!=5){p=26;break}}Sf(b,1);if((c[q>>2]|0)==0){p=26;break}else{r=r+1|0}}if((p|0)==26){return}}function Nf(b){b=b|0;var d=0;d=c[b+12>>2]|0;if((a[d+63|0]|0)==0){Eg(d,-1600);return}else{Mf(b);return}}function Of(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=b+12|0;g=c[f>>2]|0;h=g+62|0;i=a[h]|0;j=(e|0)!=0;do{if(j){a[h]=1;k=6}else{a[h]=0;e=(c[f>>2]|0)+104|0;l=c[e>>2]|0;if((l|0)==0){k=6;break}else{m=l}do{l=m+5|0;a[l]=a[l]&-65;Sf(b,1);m=c[e>>2]|0;}while((m|0)!=0);if((a[h]|0)==2){k=7}else{k=6}}}while(0);if((k|0)==6){if((d[g+61|0]|0)>>>0<2>>>0){k=7}}if((k|0)==7){k=c[f>>2]|0;a[k+61|0]=2;c[k+64>>2]=0;m=k+72|0;do{n=Qf(b,m,1)|0;}while((n|0)==(m|0));c[k+80>>2]=n;n=k+68|0;do{o=Qf(b,n,1)|0;}while((o|0)==(n|0));c[k+76>>2]=o}o=c[f>>2]|0;k=o+61|0;if((a[k]|0)==5){p=o;q=5}else{do{Rf(b)|0;}while((a[k]|0)!=5);k=c[f>>2]|0;p=k;q=a[k+61|0]|0}k=p+61|0;if((1<<(q&255)&-33|0)==0){do{Rf(b)|0;}while((1<<d[k]&-33|0)==0);k=c[f>>2]|0;r=k;s=a[k+61|0]|0}else{r=p;s=q}q=r+61|0;if(s<<24>>24!=5){do{Rf(b)|0;}while((a[q]|0)!=5)}do{if(i<<24>>24==2){q=(c[f>>2]|0)+61|0;if((a[q]|0)==0){break}do{Rf(b)|0;}while((a[q]|0)!=0)}}while(0);a[h]=i;i=c[g+8>>2]|0;h=c[g+12>>2]|0;q=(h+i|0)/100|0;s=c[g+156>>2]|0;if((s|0)<(2147483644/(q|0)|0|0)){t=ca(s,q)|0}else{t=2147483644}Eg(g,i-t+h|0);if(j){return}j=(c[f>>2]|0)+104|0;f=c[j>>2]|0;if((f|0)==0){return}else{u=f}do{f=u+5|0;a[f]=a[f]&-65;Sf(b,1);u=c[j>>2]|0;}while((u|0)!=0);return}function Pf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=e+5|0;a[f]=a[f]&-4;a:do{switch(d[e+4|0]|0|0){case 6:{g=b+84|0;c[e+8>>2]=c[g>>2];c[g>>2]=e;return};case 38:{g=b+84|0;c[e+8>>2]=c[g>>2];c[g>>2]=e;return};case 5:{g=b+84|0;c[e+24>>2]=c[g>>2];c[g>>2]=e;return};case 8:{g=b+84|0;c[e+60>>2]=c[g>>2];c[g>>2]=e;return};case 9:{g=b+84|0;c[e+72>>2]=c[g>>2];c[g>>2]=e;return};case 10:{g=e+8|0;h=c[g>>2]|0;do{if((c[h+8>>2]&64|0)==0){i=h}else{j=c[h>>2]|0;if((a[j+5|0]&3)==0){i=h;break}Pf(b,j);i=c[g>>2]|0}}while(0);if((i|0)==(e+16|0)){k=32;break a}return};case 4:case 20:{k=(c[e+12>>2]|0)+17|0;break};case 7:{g=c[e+8>>2]|0;do{if((g|0)!=0){if((a[g+5|0]&3)==0){break}Pf(b,g)}}while(0);g=c[e+12>>2]|0;do{if((g|0)!=0){if((a[g+5|0]&3)==0){break}Pf(b,g)}}while(0);k=(c[e+16>>2]|0)+24|0;break};default:{return}}}while(0);a[f]=a[f]|4;f=b+16|0;c[f>>2]=(c[f>>2]|0)+k;return}function Qf(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=b+12|0;h=c[g>>2]|0;i=a[h+60|0]|0;j=i&255^3;k=(a[h+62|0]|0)==2;h=k?-1:-72;l=k?64:i&3;i=k?64:0;k=c[e>>2]|0;a:do{if((k|0)==0){m=0;n=e}else{o=f;p=e;q=k;b:while(1){r=o-1|0;if((o|0)==0){m=q;n=p;break a}s=q+5|0;t=a[s]|0;u=t&255;c:do{if(((u^3)&j|0)==0){c[p>>2]=c[q>>2];switch(d[q+4|0]|0){case 4:{v=(c[g>>2]|0)+28|0;c[v>>2]=(c[v>>2]|0)-1;break};case 20:{break};case 8:{Ig(b,q);w=p;break c;break};case 10:{yf(b,q);w=p;break c;break};case 9:{Bf(b,q);w=p;break c;break};case 6:{$f(b,q,(d[q+6|0]<<2)+16|0,0)|0;w=p;break c;break};case 7:{$f(b,q,(c[q+16>>2]|0)+24|0,0)|0;w=p;break c;break};case 5:{_g(b,q);w=p;break c;break};case 38:{$f(b,q,(d[q+6|0]<<4)+16|0,0)|0;w=p;break c;break};default:{w=p;break c}}$f(b,q,(c[q+12>>2]|0)+17|0,0)|0;w=p}else{if((u&i|0)!=0){x=0;break b}do{if((a[q+4|0]|0)==8){v=q;if((c[v+28>>2]|0)==0){break}Qf(b,q+56|0,-3)|0;Gg(v);if((a[(c[g>>2]|0)+62|0]|0)==1){break}ef(v)}}while(0);a[s]=t&h|l;w=q|0}}while(0);t=c[w>>2]|0;if((t|0)==0){m=0;n=w;break a}else{o=r;p=w;q=t}}return x|0}}while(0);x=(m|0)==0?0:n;return x|0}function Rf(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;e=i;i=i+8|0;f=e|0;g=b+12|0;h=c[g>>2]|0;j=h+61|0;switch(d[j]|0){case 0:{if((c[h+84>>2]|0)!=0){k=h+16|0;l=c[k>>2]|0;Uf(h);m=(c[k>>2]|0)-l|0;i=e;return m|0}a[j]=1;l=h+20|0;c[l>>2]=c[h+16>>2];k=c[g>>2]|0;n=k+16|0;o=c[n>>2]|0;do{if((b|0)!=0){if((a[b+5|0]&3)==0){break}Pf(k,b)}}while(0);do{if((c[k+48>>2]&64|0)!=0){p=c[k+40>>2]|0;if((a[p+5|0]&3)==0){break}Pf(k,p)}}while(0);Tf(k);p=k+112|0;q=c[k+132>>2]|0;if((q|0)!=(p|0)){r=q;do{do{if((a[r+5|0]&7)==0){q=c[r+8>>2]|0;if((c[q+8>>2]&64|0)==0){break}s=c[q>>2]|0;if((a[s+5|0]&3)==0){break}Pf(k,s)}}while(0);r=c[r+20>>2]|0;}while((r|0)!=(p|0))}p=k+84|0;if((c[p>>2]|0)!=0){do{Uf(k);}while((c[p>>2]|0)!=0)}r=(c[n>>2]|0)-o|0;o=k+92|0;s=c[o>>2]|0;q=k+88|0;t=c[q>>2]|0;u=k+96|0;v=c[u>>2]|0;c[u>>2]=0;c[q>>2]=0;c[o>>2]=0;c[p>>2]=t;if((t|0)!=0){do{Uf(k);}while((c[p>>2]|0)!=0)}c[p>>2]=s;if((s|0)!=0){do{Uf(k);}while((c[p>>2]|0)!=0)}c[p>>2]=v;if((v|0)!=0){do{Uf(k);}while((c[p>>2]|0)!=0)}v=c[n>>2]|0;while(1){s=c[u>>2]|0;c[u>>2]=0;t=s;s=0;a:while(1){q=t;while(1){if((q|0)==0){break a}w=c[q+24>>2]|0;if((Vf(k,q)|0)==0){q=w}else{break}}if((c[p>>2]|0)==0){t=w;s=1;continue}while(1){Uf(k);if((c[p>>2]|0)==0){t=w;s=1;continue a}}}if((s|0)==0){break}}Wf(k,c[o>>2]|0,0);w=k+100|0;Wf(k,c[w>>2]|0,0);t=c[o>>2]|0;q=c[w>>2]|0;x=c[n>>2]|0;y=c[g>>2]|0;z=y+104|0;while(1){A=c[z>>2]|0;if((A|0)==0){break}else{z=A|0}}A=r-v+x|0;x=y+72|0;y=c[x>>2]|0;b:do{if((y|0)!=0){v=x;r=z;B=y;while(1){C=r;D=B;while(1){E=D+5|0;F=a[E]|0;if((F&3)==0){break}a[E]=F|8;F=D|0;c[v>>2]=c[F>>2];c[F>>2]=c[C>>2];c[C>>2]=D;E=c[v>>2]|0;if((E|0)==0){break b}else{C=F;D=E}}E=D|0;F=c[E>>2]|0;if((F|0)==0){break}else{v=E;r=C;B=F}}}}while(0);y=c[k+104>>2]|0;if((y|0)!=0){z=k+60|0;x=y;do{y=x+5|0;a[y]=a[z]&3|a[y]&-72;Pf(k,x);x=c[x>>2]|0;}while((x|0)!=0)}if((c[p>>2]|0)!=0){do{Uf(k);}while((c[p>>2]|0)!=0)}x=c[n>>2]|0;while(1){z=c[u>>2]|0;c[u>>2]=0;y=z;z=0;c:while(1){B=y;while(1){if((B|0)==0){break c}G=c[B+24>>2]|0;if((Vf(k,B)|0)==0){B=G}else{break}}if((c[p>>2]|0)==0){y=G;z=1;continue}while(1){Uf(k);if((c[p>>2]|0)==0){y=G;z=1;continue c}}}if((z|0)==0){break}}G=A-x|0;x=c[u>>2]|0;if((x|0)!=0){u=x;do{x=a[u+7|0]|0;A=c[u+16>>2]|0;p=A+(1<<(x&255)<<5)|0;if(x<<24>>24!=31){x=A;do{A=x+8|0;do{if((c[A>>2]|0)!=0){y=x+24|0;B=c[y>>2]|0;if((B&64|0)==0){break}C=c[x+16>>2]|0;if((B&15|0)==4){if((C|0)==0){break}if((a[C+5|0]&3)==0){break}Pf(k,C);break}else{B=C+5|0;if((a[B]&3)==0){break}c[A>>2]=0;if((a[B]&3)==0){break}c[y>>2]=11;break}}}while(0);x=x+32|0;}while(x>>>0<p>>>0)}u=c[u+24>>2]|0;}while((u|0)!=0)}u=c[w>>2]|0;if((u|0)!=0){p=u;do{u=a[p+7|0]|0;x=c[p+16>>2]|0;z=x+(1<<(u&255)<<5)|0;if(u<<24>>24!=31){u=x;do{x=u+8|0;do{if((c[x>>2]|0)!=0){A=u+24|0;y=c[A>>2]|0;if((y&64|0)==0){break}B=c[u+16>>2]|0;if((y&15|0)==4){if((B|0)==0){break}if((a[B+5|0]&3)==0){break}Pf(k,B);break}else{y=B+5|0;if((a[y]&3)==0){break}c[x>>2]=0;if((a[y]&3)==0){break}c[A>>2]=11;break}}}while(0);u=u+32|0;}while(u>>>0<z>>>0)}p=c[p+24>>2]|0;}while((p|0)!=0)}Wf(k,c[o>>2]|0,t);Wf(k,c[w>>2]|0,q);q=k+60|0;a[q]=a[q]^3;q=G+(c[n>>2]|0)|0;c[l>>2]=(c[l>>2]|0)+q;l=c[g>>2]|0;a[l+61|0]=2;c[l+64>>2]=0;n=l+72|0;G=0;do{G=G+1|0;H=Qf(b,n,1)|0;}while((H|0)==(n|0));c[l+80>>2]=H;H=l+68|0;n=0;do{n=n+1|0;I=Qf(b,H,1)|0;}while((I|0)==(H|0));c[l+76>>2]=I;m=((n+G|0)*5|0)+q|0;i=e;return m|0};case 2:{q=h+64|0;G=h+32|0;n=h+24|0;I=0;while(1){l=c[q>>2]|0;H=l+I|0;k=c[G>>2]|0;if((H|0)>=(k|0)){J=I;K=l;L=k;break}Qf(b,(c[n>>2]|0)+(H<<2)|0,-3)|0;M=I+1|0;if((M|0)<80){I=M}else{N=96;break}}if((N|0)==96){J=M;K=c[q>>2]|0;L=c[G>>2]|0}G=K+J|0;c[q>>2]=G;if((G|0)>=(L|0)){a[j]=3}m=J*5|0;i=e;return m|0};case 5:{J=h+16|0;c[J>>2]=c[h+32>>2]<<2;mn(h+84|0,0,20)|0;L=c[h+172>>2]|0;do{if((L|0)!=0){if((a[L+5|0]&3)==0){break}Pf(h,L)}}while(0);do{if((c[h+48>>2]&64|0)!=0){L=c[h+40>>2]|0;if((a[L+5|0]&3)==0){break}Pf(h,L)}}while(0);Tf(h);L=c[h+104>>2]|0;if((L|0)!=0){G=h+60|0;q=L;do{L=q+5|0;a[L]=a[G]&3|a[L]&-72;Pf(h,q);q=c[q>>2]|0;}while((q|0)!=0)}a[j]=0;m=c[J>>2]|0;i=e;return m|0};case 3:{J=h+80|0;q=c[J>>2]|0;if((q|0)==0){a[j]=4;m=0;i=e;return m|0}else{c[J>>2]=Qf(b,q,80)|0;m=400;i=e;return m|0}break};case 4:{q=h+76|0;J=c[q>>2]|0;if((J|0)!=0){c[q>>2]=Qf(b,J,80)|0;m=400;i=e;return m|0}c[f>>2]=c[h+172>>2];Qf(b,f,1)|0;f=c[g>>2]|0;if((a[f+62|0]|0)!=1){g=(c[f+32>>2]|0)/2|0;if((c[f+28>>2]|0)>>>0<g>>>0){Qg(b,g)}g=f+144|0;h=f+152|0;c[g>>2]=$f(b,c[g>>2]|0,c[h>>2]|0,0)|0;c[h>>2]=0}a[j]=5;m=5;i=e;return m|0};default:{m=0;i=e;return m|0}}return 0}function Sf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+16|0;g=f|0;h=c[b+12>>2]|0;j=h+104|0;k=c[j>>2]|0;l=k|0;c[j>>2]=c[l>>2];j=h+68|0;c[l>>2]=c[j>>2];c[j>>2]=k;j=k+5|0;l=a[j]|0;a[j]=l&-17;if((d[h+61|0]|0)>>>0>=2>>>0){a[j]=a[h+60|0]&3|l&-88}c[g>>2]=k;l=g+8|0;c[l>>2]=d[k+4|0]|0|64;k=hh(b,g,2)|0;if((k|0)==0){i=f;return}j=k+8|0;if((c[j>>2]&15|0)!=6){i=f;return}m=b+41|0;n=a[m]|0;o=h+63|0;h=a[o]|0;a[m]=0;a[o]=0;p=b+8|0;q=c[p>>2]|0;r=k;k=q;s=c[r+4>>2]|0;c[k>>2]=c[r>>2];c[k+4>>2]=s;c[q+8>>2]=c[j>>2];j=c[p>>2]|0;q=g;g=j+16|0;s=c[q+4>>2]|0;c[g>>2]=c[q>>2];c[g+4>>2]=s;c[j+24>>2]=c[l>>2];l=c[p>>2]|0;c[p>>2]=l+32;j=mf(b,34,0,l-(c[b+28>>2]|0)|0,0)|0;a[m]=n;a[o]=h;if(!((j|0)!=0&(e|0)!=0)){i=f;return}if((j|0)!=2){t=j;af(b,t)}j=c[p>>2]|0;if((c[j-16+8>>2]&15|0)==4){u=(c[j-16>>2]|0)+16|0}else{u=12320}hg(b,13288,(j=i,i=i+8|0,c[j>>2]=u,j)|0)|0;i=j;t=5;af(b,t)}function Tf(b){b=b|0;var d=0;d=c[b+252>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}Pf(b,d)}}while(0);d=c[b+256>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}Pf(b,d)}}while(0);d=c[b+260>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}Pf(b,d)}}while(0);d=c[b+264>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}Pf(b,d)}}while(0);d=c[b+268>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}Pf(b,d)}}while(0);d=c[b+272>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}Pf(b,d)}}while(0);d=c[b+276>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}Pf(b,d)}}while(0);d=c[b+280>>2]|0;do{if((d|0)!=0){if((a[d+5|0]&3)==0){break}Pf(b,d)}}while(0);d=c[b+284>>2]|0;if((d|0)==0){return}if((a[d+5|0]&3)==0){return}Pf(b,d);return}function Uf(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=b+84|0;f=c[e>>2]|0;g=f+5|0;a[g]=a[g]|4;a:do{switch(d[f+4|0]|0){case 8:{h=f+60|0;c[e>>2]=c[h>>2];i=b+88|0;c[h>>2]=c[i>>2];c[i>>2]=f;a[g]=a[g]&-5;i=f+28|0;h=c[i>>2]|0;if((h|0)==0){j=1;break a}k=f+8|0;l=c[k>>2]|0;if(h>>>0<l>>>0){m=h;n=l;while(1){do{if((c[m+8>>2]&64|0)==0){o=n}else{l=c[m>>2]|0;if((a[l+5|0]&3)==0){o=n;break}Pf(b,l);o=c[k>>2]|0}}while(0);l=m+16|0;if(l>>>0<o>>>0){m=l;n=o}else{p=l;break}}}else{p=h}do{if((a[b+61|0]|0)==1){n=f+32|0;m=(c[i>>2]|0)+(c[n>>2]<<4)|0;if(p>>>0<m>>>0){q=p}else{r=0;s=n;break}while(1){c[q+8>>2]=0;k=q+16|0;if(k>>>0<m>>>0){q=k}else{r=0;s=n;break}}}else{n=f+72|0;m=c[f+16>>2]|0;if((n|0)==(m|0)){t=0}else{k=0;l=n;while(1){n=k+1|0;u=c[l+12>>2]|0;if((u|0)==(m|0)){t=n;break}else{k=n;l=u}}}r=t;s=f+32|0}}while(0);j=(r*40|0)+112+(c[s>>2]<<4)|0;break};case 5:{i=f;h=f+24|0;c[e>>2]=c[h>>2];l=f+8|0;k=c[l>>2]|0;m=k;do{if((k|0)==0){v=33}else{if((a[k+6|0]&8)==0){u=gh(m,3,c[b+196>>2]|0)|0;n=c[l>>2]|0;if((n|0)==0){w=u}else{x=n;y=u;v=5}}else{x=m;y=0;v=5}do{if((v|0)==5){if((a[x+5|0]&3)==0){w=y;break}Pf(b,x);w=y}}while(0);if((w|0)==0){v=33;break}if((c[w+8>>2]&15|0)!=4){v=33;break}u=(c[w>>2]|0)+16|0;n=Va(u|0,107)|0;z=(n|0)!=0;n=(Va(u|0,118)|0)!=0;if(!(z|n)){v=33;break}a[g]=a[g]&-5;if(z){if(n){n=b+100|0;c[h>>2]=c[n>>2];c[n>>2]=f;break}else{Vf(b,i)|0;break}}n=a[i+7|0]|0;z=c[f+16>>2]|0;u=z+(1<<(n&255)<<5)|0;A=(c[i+28>>2]|0)>0|0;if(n<<24>>24==31){B=A}else{n=z;z=A;while(1){A=n+8|0;C=n+24|0;D=(c[C>>2]&64|0)==0;do{if((c[A>>2]|0)==0){if(D){E=z;break}if((a[(c[n+16>>2]|0)+5|0]&3)==0){E=z;break}c[C>>2]=11;E=z}else{do{if(!D){F=c[n+16>>2]|0;if((a[F+5|0]&3)==0){break}Pf(b,F)}}while(0);if((z|0)!=0){E=z;break}F=c[A>>2]|0;if((F&64|0)==0){E=0;break}G=c[n>>2]|0;if((F&15|0)!=4){E=(a[G+5|0]&3)!=0|0;break}if((G|0)==0){E=0;break}if((a[G+5|0]&3)==0){E=0;break}Pf(b,G);E=0}}while(0);A=n+32|0;if(A>>>0<u>>>0){n=A;z=E}else{B=E;break}}}if((B|0)==0){z=b+88|0;c[h>>2]=c[z>>2];c[z>>2]=f;break}else{z=b+92|0;c[h>>2]=c[z>>2];c[z>>2]=f;break}}}while(0);do{if((v|0)==33){h=f+16|0;m=c[h>>2]|0;l=m+(1<<d[i+7|0]<<5)|0;k=i+28|0;z=c[k>>2]|0;if((z|0)>0){n=f+12|0;u=0;A=z;while(1){z=c[n>>2]|0;do{if((c[z+(u<<4)+8>>2]&64|0)==0){H=A}else{D=c[z+(u<<4)>>2]|0;if((a[D+5|0]&3)==0){H=A;break}Pf(b,D);H=c[k>>2]|0}}while(0);z=u+1|0;if((z|0)<(H|0)){u=z;A=H}else{break}}I=c[h>>2]|0}else{I=m}if(I>>>0<l>>>0){J=I}else{break}do{A=J+8|0;u=c[A>>2]|0;k=J+24|0;n=(c[k>>2]&64|0)==0;do{if((u|0)==0){if(n){break}if((a[(c[J+16>>2]|0)+5|0]&3)==0){break}c[k>>2]=11}else{do{if(n){K=u}else{z=c[J+16>>2]|0;if((a[z+5|0]&3)==0){K=u;break}Pf(b,z);K=c[A>>2]|0}}while(0);if((K&64|0)==0){break}z=c[J>>2]|0;if((a[z+5|0]&3)==0){break}Pf(b,z)}}while(0);J=J+32|0;}while(J>>>0<l>>>0)}}while(0);j=(c[i+28>>2]<<4)+32+(32<<d[i+7|0])|0;break};case 9:{l=f;c[e>>2]=c[f+72>>2];m=f+32|0;h=c[m>>2]|0;do{if((h|0)!=0){if((a[h+5|0]&3)==0){break}c[m>>2]=0}}while(0);m=c[f+36>>2]|0;do{if((m|0)!=0){if((a[m+5|0]&3)==0){break}Pf(b,m)}}while(0);m=f+44|0;h=c[m>>2]|0;if((h|0)>0){i=f+8|0;A=0;u=h;while(1){h=c[i>>2]|0;do{if((c[h+(A<<4)+8>>2]&64|0)==0){L=u}else{n=c[h+(A<<4)>>2]|0;if((a[n+5|0]&3)==0){L=u;break}Pf(b,n);L=c[m>>2]|0}}while(0);h=A+1|0;if((h|0)<(L|0)){A=h;u=L}else{break}}}u=f+40|0;A=c[u>>2]|0;if((A|0)>0){i=l+28|0;h=0;n=A;while(1){A=c[(c[i>>2]|0)+(h<<3)>>2]|0;do{if((A|0)==0){M=n}else{if((a[A+5|0]&3)==0){M=n;break}Pf(b,A);M=c[u>>2]|0}}while(0);A=h+1|0;if((A|0)<(M|0)){h=A;n=M}else{break}}}n=f+56|0;h=c[n>>2]|0;if((h|0)>0){i=f+16|0;l=0;A=h;while(1){k=c[(c[i>>2]|0)+(l<<2)>>2]|0;do{if((k|0)==0){N=A}else{if((a[k+5|0]&3)==0){N=A;break}Pf(b,k);N=c[n>>2]|0}}while(0);k=l+1|0;if((k|0)<(N|0)){l=k;A=N}else{O=N;break}}}else{O=h}A=f+60|0;l=c[A>>2]|0;if((l|0)>0){i=f+24|0;k=0;z=l;while(1){D=c[(c[i>>2]|0)+(k*12|0)>>2]|0;do{if((D|0)==0){P=z}else{if((a[D+5|0]&3)==0){P=z;break}Pf(b,D);P=c[A>>2]|0}}while(0);D=k+1|0;if((D|0)<(P|0)){k=D;z=P}else{break}}Q=P;R=c[n>>2]|0}else{Q=l;R=O}j=(Q*12|0)+80+(c[m>>2]<<4)+(c[u>>2]<<3)+((c[f+48>>2]|0)+R+(c[f+52>>2]|0)<<2)|0;break};case 6:{z=f;c[e>>2]=c[f+8>>2];k=c[f+12>>2]|0;do{if((k|0)!=0){if((a[k+5|0]&3)==0){break}Pf(b,k)}}while(0);k=f+6|0;u=a[k]|0;if(u<<24>>24==0){S=u&255}else{m=0;l=u;while(1){u=c[z+16+(m<<2)>>2]|0;do{if((u|0)==0){T=l}else{if((a[u+5|0]&3)==0){T=l;break}Pf(b,u);T=a[k]|0}}while(0);u=m+1|0;n=T&255;if((u|0)<(n|0)){m=u;l=T}else{S=n;break}}}j=(S<<2)+16|0;break};case 38:{c[e>>2]=c[f+8>>2];l=f+6|0;m=a[l]|0;if(m<<24>>24==0){U=m&255}else{k=0;z=m;while(1){do{if((c[f+16+(k<<4)+8>>2]&64|0)==0){V=z}else{m=c[f+16+(k<<4)>>2]|0;if((a[m+5|0]&3)==0){V=z;break}Pf(b,m);V=a[l]|0}}while(0);m=k+1|0;n=V&255;if((m|0)<(n|0)){k=m;z=V}else{U=n;break}}}j=(U<<4)+16|0;break};default:{return}}}while(0);U=b+16|0;c[U>>2]=(c[U>>2]|0)+j;return}function Vf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=e+16|0;g=c[f>>2]|0;h=g+(1<<(d[e+7|0]|0)<<5)|0;i=e+28|0;j=c[i>>2]|0;if((j|0)>0){k=e+12|0;l=0;m=0;n=j;while(1){j=c[k>>2]|0;do{if((c[j+(m<<4)+8>>2]&64|0)==0){o=l;p=n}else{q=c[j+(m<<4)>>2]|0;if((a[q+5|0]&3)==0){o=l;p=n;break}Pf(b,q);o=1;p=c[i>>2]|0}}while(0);j=m+1|0;if((j|0)<(p|0)){l=o;m=j;n=p}else{break}}r=o;s=c[f>>2]|0}else{r=0;s=g}do{if(s>>>0<h>>>0){g=0;f=0;o=s;p=r;while(1){n=o+8|0;m=c[n>>2]|0;l=o+24|0;i=c[l>>2]|0;k=(i&64|0)==0;a:do{if((m|0)==0){if(k){t=p;u=f;v=g;break}if((a[(c[o+16>>2]|0)+5|0]&3)==0){t=p;u=f;v=g;break}c[l>>2]=11;t=p;u=f;v=g}else{do{if(k){w=m;x=18}else{j=c[o+16>>2]|0;if((i&15|0)==4){if((j|0)==0){w=m;x=18;break}if((a[j+5|0]&3)==0){w=m;x=18;break}Pf(b,j);w=c[n>>2]|0;x=18;break}q=(m&64|0)==0;if((a[j+5|0]&3)==0){if(q){t=p;u=f;v=g;break a}else{break}}if(q){t=p;u=f;v=1;break a}t=p;u=(a[(c[o>>2]|0)+5|0]&3)==0?f:1;v=1;break a}}while(0);if((x|0)==18){x=0;if((w&64|0)==0){t=p;u=f;v=g;break}}q=c[o>>2]|0;if((a[q+5|0]&3)==0){t=p;u=f;v=g;break}Pf(b,q);t=1;u=f;v=g}}while(0);m=o+32|0;if(m>>>0<h>>>0){g=v;f=u;o=m;p=t}else{break}}if((u|0)!=0){p=b+96|0;c[e+24>>2]=c[p>>2];c[p>>2]=e;y=t;return y|0}if((v|0)==0){z=t;break}p=b+100|0;c[e+24>>2]=c[p>>2];c[p>>2]=e;y=t;return y|0}else{z=r}}while(0);r=b+88|0;c[e+24>>2]=c[r>>2];c[r>>2]=e;y=z;return y|0}function Wf(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;if((e|0)==(f|0)){return}else{g=e}do{e=g;h=g+16|0;i=c[h>>2]|0;j=i+(1<<(d[e+7|0]|0)<<5)|0;k=e+28|0;if((c[k>>2]|0)>0){e=g+12|0;l=0;do{m=c[e>>2]|0;if((Yf(b,m+(l<<4)|0)|0)!=0){c[m+(l<<4)+8>>2]=0}l=l+1|0;}while((l|0)<(c[k>>2]|0));n=c[h>>2]|0}else{n=i}if(n>>>0<j>>>0){k=n;do{l=k+8|0;do{if((c[l>>2]|0)!=0){if((Yf(b,k|0)|0)==0){break}c[l>>2]=0;e=k+24|0;if((c[e>>2]&64|0)==0){break}if((a[(c[k+16>>2]|0)+5|0]&3)==0){break}c[e>>2]=11}}while(0);k=k+32|0;}while(k>>>0<j>>>0)}g=c[g+24>>2]|0;}while((g|0)!=(f|0));return}function Xf(a,b){a=a|0;b=b|0;jf(a,(c[a+8>>2]|0)-32|0,0,0);return}function Yf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=c[d+8>>2]|0;do{if((e&64|0)==0){f=0}else{g=c[d>>2]|0;if((e&15|0)!=4){f=a[g+5|0]&3;break}if((g|0)==0){f=0;break}if((a[g+5|0]&3)==0){f=0;break}Pf(b,g);f=0}}while(0);return f|0}function Zf(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;j=i;k=c[e>>2]|0;do{if((k|0)<((g|0)/2|0|0)){l=k<<1;m=(l|0)<4?4:l}else{if((k|0)<(g|0)){m=g;break}Ve(b,11872,(l=i,i=i+16|0,c[l>>2]=h,c[l+8>>2]=g,l)|0);i=l;return 0}}while(0);if((m+1|0)>>>0>(4294967293/(f>>>0)|0)>>>0){_f(b);return 0}g=ca(k,f)|0;k=ca(m,f)|0;f=c[b+12>>2]|0;h=(d|0)!=0;l=f|0;n=f+4|0;o=Dc[c[l>>2]&63](c[n>>2]|0,d,g,k)|0;if(!((o|0)==0&(k|0)!=0)){p=o;q=f+12|0;r=c[q>>2]|0;s=-g|0;t=h?s:0;u=t+k|0;v=u+r|0;c[q>>2]=v;c[e>>2]=m;i=j;return p|0}if((a[f+63|0]|0)==0){af(b,4);return 0}Of(b,1);o=Dc[c[l>>2]&63](c[n>>2]|0,d,g,k)|0;if((o|0)==0){af(b,4);return 0}else{p=o;q=f+12|0;r=c[q>>2]|0;s=-g|0;t=h?s:0;u=t+k|0;v=u+r|0;c[q>>2]=v;c[e>>2]=m;i=j;return p|0}return 0}function _f(a){a=a|0;Ve(a,13192,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0);i=a}function $f(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[b+12>>2]|0;h=(d|0)!=0;i=g|0;j=g+4|0;k=Dc[c[i>>2]&63](c[j>>2]|0,d,e,f)|0;do{if((k|0)==0&(f|0)!=0){if((a[g+63|0]|0)==0){af(b,4);return 0}Of(b,1);l=Dc[c[i>>2]&63](c[j>>2]|0,d,e,f)|0;if((l|0)!=0){m=l;break}af(b,4);return 0}else{m=k}}while(0);k=g+12|0;c[k>>2]=(h?-e|0:0)+f+(c[k>>2]|0);return m|0}function ag(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;if(a>>>0<8>>>0){b=a;return b|0}if(a>>>0>15>>>0){c=a;d=1;do{e=c+1|0;c=e>>>1;d=d+1|0;}while(e>>>0>31>>>0);f=c;g=d<<3}else{f=a;g=8}b=g|f-8;return b|0}function bg(a){a=a|0;var b=0,c=0;b=a>>>3&31;if((b|0)==0){c=a;return c|0}c=(a&7|8)<<b-1;return c|0}function cg(a){a=a|0;var b=0,c=0,e=0,f=0,g=0,h=0;b=a-1|0;if(b>>>0>255>>>0){a=b;c=0;while(1){e=c+8|0;f=a>>>8;if(a>>>0>65535>>>0){a=f;c=e}else{g=f;h=e;break}}}else{g=b;h=0}return(d[1240+g|0]|0)+h|0}function dg(a,b,c){a=a|0;b=+b;c=+c;var d=0.0;switch(a|0){case 5:{d=+T(+b,+c);break};case 3:{d=b/c;break};case 2:{d=b*c;break};case 6:{d=-0.0-b;break};case 0:{d=b+c;break};case 1:{d=b-c;break};case 4:{d=b- +Q(b/c)*c;break};default:{d=0.0}}return+d}function eg(b){b=b|0;var c=0;if((a[b+657|0]&2)==0){c=(b|32)-87|0;return c|0}else{c=b-48|0;return c|0}return 0}function fg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0,z=0,A=0,B=0,C=0,D=0.0,E=0,F=0,G=0,H=0,I=0.0,J=0,K=0,L=0.0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0.0,aa=0;g=i;i=i+8|0;j=g|0;if((mc(b|0,11672)|0)!=0){k=0;i=g;return k|0}a:do{if((mc(b|0,13168)|0)==0){l=+en(b,j);m=l;n=c[j>>2]|0}else{c[j>>2]=b;o=b;while(1){p=a[o]|0;q=o+1|0;if((a[(p&255)+657|0]&8)==0){break}else{o=q}}if((p<<24>>24|0)==43){r=0;s=q}else if((p<<24>>24|0)==45){r=1;s=q}else{r=0;s=o}do{if((a[s]|0)==48){t=a[s+1|0]|0;if(!((t<<24>>24|0)==120|(t<<24>>24|0)==88)){break}t=s+2|0;u=a[t]|0;v=u&255;w=a[v+657|0]|0;if((w&16)==0){x=0.0;y=0;z=t;A=u}else{l=0.0;u=v;v=w;w=0;B=t;while(1){if((v&2)==0){C=(u|32)-87|0}else{C=u-48|0}D=l*16.0+ +(C|0);t=w+1|0;E=B+1|0;F=a[E]|0;G=F&255;H=a[G+657|0]|0;if((H&16)==0){x=D;y=t;z=E;A=F;break}else{l=D;u=G;v=H;w=t;B=E}}}do{if(A<<24>>24==46){B=z+1|0;w=d[B]|0;v=a[w+657|0]|0;if((v&16)==0){I=x;J=0;K=B;break}else{L=x;M=w;N=v;O=0;P=B}while(1){if((N&2)==0){Q=(M|32)-87|0}else{Q=M-48|0}l=L*16.0+ +(Q|0);B=O+1|0;v=P+1|0;w=d[v]|0;u=a[w+657|0]|0;if((u&16)==0){I=l;J=B;K=v;break}else{L=l;M=w;N=u;O=B;P=v}}}else{I=x;J=0;K=z}}while(0);if((J|y|0)==0){break}v=J*-4|0;c[j>>2]=K;B=a[K]|0;do{if((B<<24>>24|0)==112|(B<<24>>24|0)==80){u=K+1|0;w=a[u]|0;if((w<<24>>24|0)==45){R=1;S=K+2|0}else if((w<<24>>24|0)==43){R=0;S=K+2|0}else{R=0;S=u}u=a[S]|0;if((a[(u&255)+657|0]&2)==0){T=v;U=K;break}else{V=S;W=0;X=u}do{V=V+1|0;W=(X<<24>>24)-48+(W*10|0)|0;X=a[V]|0;}while((a[(X&255)+657|0]&2)!=0);Y=((R|0)==0?W:-W|0)+v|0;Z=V;_=29}else{Y=v;Z=K;_=29}}while(0);if((_|0)==29){c[j>>2]=Z;T=Y;U=Z}if((r|0)==0){$=I}else{$=-0.0-I}m=+Vm($,T);n=U;break a}}while(0);h[f>>3]=0.0;k=0;i=g;return k|0}}while(0);h[f>>3]=m;if((n|0)==(b|0)){k=0;i=g;return k|0}if((a[(d[n]|0)+657|0]&8)==0){aa=n}else{f=n;do{f=f+1|0;}while((a[(d[f]|0)+657|0]&8)!=0);c[j>>2]=f;aa=f}k=(aa|0)==(b+e|0)|0;i=g;return k|0}function gg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;g=i;i=i+32|0;j=g|0;k=Va(e|0,37)|0;l=b+24|0;m=b+8|0;n=c[m>>2]|0;o=(c[l>>2]|0)-n|0;a:do{if((k|0)==0){p=0;q=e;r=o;s=n}else{t=g+8|0;u=0;v=e;w=k;y=o;z=n;b:while(1){if((y|0)<48){df(b,2);A=c[m>>2]|0}else{A=z}c[m>>2]=A+16;B=Rg(b,v,w-v|0)|0;c[A>>2]=B;c[A+8>>2]=d[B+4|0]|64;C=a[w+1|0]|0;switch(C|0){case 115:{B=(x=c[f+4>>2]|0,c[f+4>>2]=x+8,c[(c[f>>2]|0)+x>>2]|0);D=(B|0)==0?9528:B;B=jn(D|0)|0;E=c[m>>2]|0;c[m>>2]=E+16;F=Rg(b,D,B)|0;c[E>>2]=F;c[E+8>>2]=d[F+4|0]|64;break};case 112:{F=(x=c[f+4>>2]|0,c[f+4>>2]=x+8,c[(c[f>>2]|0)+x>>2]|0);E=bb(t|0,7192,(G=i,i=i+8|0,c[G>>2]=F,G)|0)|0;i=G;F=c[m>>2]|0;c[m>>2]=F+16;B=Rg(b,t,E)|0;c[F>>2]=B;c[F+8>>2]=d[B+4|0]|64;break};case 99:{a[j]=(x=c[f+4>>2]|0,c[f+4>>2]=x+8,c[(c[f>>2]|0)+x>>2]|0);B=c[m>>2]|0;c[m>>2]=B+16;F=Rg(b,j,1)|0;c[B>>2]=F;c[B+8>>2]=d[F+4|0]|64;break};case 100:{F=c[m>>2]|0;c[m>>2]=F+16;h[F>>3]=+((x=c[f+4>>2]|0,c[f+4>>2]=x+8,c[(c[f>>2]|0)+x>>2]|0)|0);c[F+8>>2]=3;break};case 102:{F=c[m>>2]|0;c[m>>2]=F+16;h[F>>3]=(x=c[f+4>>2]|0,c[f+4>>2]=x+8,+h[(c[f>>2]|0)+x>>3]);c[F+8>>2]=3;break};case 37:{F=c[m>>2]|0;c[m>>2]=F+16;B=Rg(b,5696,1)|0;c[F>>2]=B;c[F+8>>2]=d[B+4|0]|64;break};default:{break b}}B=u+2|0;F=w+2|0;E=Va(F|0,37)|0;D=c[m>>2]|0;H=(c[l>>2]|0)-D|0;if((E|0)==0){p=B;q=F;r=H;s=D;break a}else{u=B;v=F;w=E;y=H;z=D}}Ve(b,4296,(G=i,i=i+8|0,c[G>>2]=C,G)|0);i=G;return 0}}while(0);if((r|0)<32){df(b,1);I=c[m>>2]|0}else{I=s}s=jn(q|0)|0;c[m>>2]=I+16;r=Rg(b,q,s)|0;c[I>>2]=r;c[I+8>>2]=d[r+4|0]|64;if((p|0)<=0){J=c[m>>2]|0;K=J-16|0;L=K;M=c[L>>2]|0;N=M+16|0;O=N;i=g;return O|0}th(b,p|1);J=c[m>>2]|0;K=J-16|0;L=K;M=c[L>>2]|0;N=M+16|0;O=N;i=g;return O|0}function hg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;g=f;c[g>>2]=d;c[g+4>>2]=0;g=gg(a,b,f|0)|0;i=e;return g|0}function ig(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=jn(c|0)|0;f=a[c]|0;if((f<<24>>24|0)==64){if(e>>>0>d>>>0){a[b]=a[3896]|0;a[b+1|0]=a[3897]|0;a[b+2|0]=a[3898]|0;nn(b+3|0,c+(4-d+e)|0,d-3|0)|0;return}else{nn(b|0,c+1|0,e)|0;return}}else if((f<<24>>24|0)==61){f=c+1|0;if(e>>>0>d>>>0){g=d-1|0;nn(b|0,f|0,g)|0;a[b+g|0]=0;return}else{nn(b|0,f|0,e)|0;return}}else{f=Va(c|0,10)|0;nn(b|0,3496,9)|0;g=b+9|0;h=d-15|0;d=(f|0)==0;if(e>>>0<h>>>0&d){nn(g|0,c|0,e)|0;i=e+9|0}else{if(d){j=e}else{j=f-c|0}f=j>>>0>h>>>0?h:j;nn(g|0,c|0,f)|0;c=b+(f+9)|0;a[c]=a[3896]|0;a[c+1|0]=a[3897]|0;a[c+2|0]=a[3898]|0;i=f+12|0}f=b+i|0;a[f]=a[3048]|0;a[f+1|0]=a[3049]|0;a[f+2|0]=a[3050]|0;return}}function jg(d,e,f,g,h,j){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;k=i;i=i+176|0;l=k|0;m=k+16|0;n=k+40|0;o=k+120|0;p=vf(d,1)|0;q=d+8|0;r=c[q>>2]|0;c[r>>2]=p;c[r+8>>2]=70;r=(c[q>>2]|0)+16|0;c[q>>2]=r;if(((c[d+24>>2]|0)-r|0)<16){df(d,0)}r=Af(d)|0;c[p+12>>2]=r;q=o|0;c[q>>2]=r;c[r+36>>2]=Sg(d,h)|0;c[n+60>>2]=f;f=n+64|0;c[f>>2]=g;c[g+28>>2]=0;c[g+16>>2]=0;c[g+4>>2]=0;g=c[q>>2]|0;h=g+36|0;pj(d,n,e,c[h>>2]|0,j);j=c[n+52>>2]|0;e=n+48|0;c[o+8>>2]=c[e>>2];d=o+12|0;c[d>>2]=n;c[e>>2]=o;c[o+20>>2]=0;c[o+24>>2]=0;c[o+28>>2]=-1;c[o+32>>2]=0;c[o+36>>2]=0;mn(o+44|0,0,5)|0;c[o+40>>2]=c[(c[f>>2]|0)+4>>2];f=o+16|0;c[f>>2]=0;c[h>>2]=c[n+68>>2];a[g+78|0]=2;g=Zg(j)|0;c[o+4>>2]=g;h=j+8|0;e=c[h>>2]|0;c[e>>2]=g;c[e+8>>2]=69;e=(c[h>>2]|0)+16|0;c[h>>2]=e;if(((c[j+24>>2]|0)-e|0)<16){df(j,0)}a[l+10|0]=0;a[l+8|0]=a[o+46|0]|0;j=(c[d>>2]|0)+64|0;b[l+4>>1]=c[(c[j>>2]|0)+28>>2];b[l+6>>1]=c[(c[j>>2]|0)+16>>2];a[l+9|0]=0;c[l>>2]=c[f>>2];c[f>>2]=l;a[(c[q>>2]|0)+77|0]=1;c[m+16>>2]=-1;c[m+20>>2]=-1;c[m>>2]=7;c[m+8>>2]=0;kg(o,c[n+72>>2]|0,m)|0;qj(n);m=n+16|0;a:while(1){o=c[m>>2]|0;switch(o|0){case 260:case 261:case 262:case 286:case 277:{s=o;break a;break};default:{}}lg(n);if((o|0)==274){t=8;break}}if((t|0)==8){s=c[m>>2]|0}if((s|0)==286){ng(n);i=k;return p|0}else{mg(n,286);return 0}return 0}function kg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;h=c[b>>2]|0;j=h+40|0;k=c[j>>2]|0;l=b+47|0;m=d[l]|0;if((m+1|0)>>>0>255>>>0){n=b+12|0;o=c[(c[n>>2]|0)+52>>2]|0;p=c[h+64>>2]|0;if((p|0)==0){q=12360;r=hg(o,11920,(s=i,i=i+24|0,c[s>>2]=7792,c[s+8>>2]=255,c[s+16>>2]=q,s)|0)|0;i=s;t=c[n>>2]|0;nj(t,r);return 0}u=hg(o,12096,(s=i,i=i+8|0,c[s>>2]=p,s)|0)|0;i=s;q=u;r=hg(o,11920,(s=i,i=i+24|0,c[s>>2]=7792,c[s+8>>2]=255,c[s+16>>2]=q,s)|0)|0;i=s;t=c[n>>2]|0;nj(t,r);return 0}if((m|0)<(k|0)){v=k}else{m=h+28|0;c[m>>2]=Zf(c[(c[b+12>>2]|0)+52>>2]|0,c[m>>2]|0,j,8,255,7792)|0;v=c[j>>2]|0}m=h+28|0;if((k|0)<(v|0)){v=k;while(1){k=v+1|0;c[(c[m>>2]|0)+(v<<3)>>2]=0;if((k|0)<(c[j>>2]|0)){v=k}else{break}}}a[(c[m>>2]|0)+((d[l]|0)<<3)+4|0]=(c[f>>2]|0)==7|0;a[(c[m>>2]|0)+((d[l]|0)<<3)+5|0]=c[f+8>>2];c[(c[m>>2]|0)+((d[l]|0)<<3)>>2]=e;if((a[e+5|0]&3)==0){w=a[l]|0;x=w+1&255;a[l]=x;y=w&255;i=g;return y|0}if((a[h+5|0]&4)==0){w=a[l]|0;x=w+1&255;a[l]=x;y=w&255;i=g;return y|0}Df(c[(c[b+12>>2]|0)+52>>2]|0,h,e);w=a[l]|0;x=w+1&255;a[l]=x;y=w&255;i=g;return y|0}function lg(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0;f=i;i=i+440|0;g=f|0;h=f+24|0;j=f+48|0;k=f+72|0;l=f+104|0;m=f+128|0;n=f+152|0;o=f+176|0;p=f+200|0;q=f+224|0;r=f+248|0;s=f+272|0;t=f+288|0;u=f+304|0;v=f+328|0;w=f+344|0;x=f+360|0;y=f+384|0;z=f+400|0;A=f+416|0;B=f+432|0;C=e+4|0;D=c[C>>2]|0;E=e+52|0;F=(c[E>>2]|0)+38|0;G=(b[F>>1]|0)+1&65535;b[F>>1]=G;F=e+48|0;H=c[F>>2]|0;if((G&65535)>>>0>200>>>0){G=H+12|0;I=c[(c[G>>2]|0)+52>>2]|0;J=c[(c[H>>2]|0)+64>>2]|0;if((J|0)==0){K=12360;L=hg(I,11920,(M=i,i=i+24|0,c[M>>2]=3480,c[M+8>>2]=200,c[M+16>>2]=K,M)|0)|0;i=M;N=c[G>>2]|0;nj(N,L)}O=hg(I,12096,(M=i,i=i+8|0,c[M>>2]=J,M)|0)|0;i=M;K=O;L=hg(I,11920,(M=i,i=i+24|0,c[M>>2]=3480,c[M+8>>2]=200,c[M+16>>2]=K,M)|0)|0;i=M;N=c[G>>2]|0;nj(N,L)}L=e+16|0;switch(c[L>>2]|0){case 278:{qj(e);N=Gi(H)|0;qg(e,x,0)|0;G=x|0;if((c[G>>2]|0)==1){c[G>>2]=3}Zi(c[F>>2]|0,x);G=c[x+20>>2]|0;a[z+10|0]=1;a[z+8|0]=a[H+46|0]|0;x=H+12|0;b[z+4>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+28>>2];b[z+6>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+16>>2];a[z+9|0]=0;x=H+16|0;c[z>>2]=c[x>>2];c[x>>2]=z;if((c[L>>2]|0)!=259){mg(e,259)}qj(e);z=c[F>>2]|0;a[y+10|0]=0;a[y+8|0]=a[z+46|0]|0;x=z+12|0;b[y+4>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+28>>2];b[y+6>>1]=c[(c[(c[x>>2]|0)+64>>2]|0)+16>>2];a[y+9|0]=0;x=z+16|0;c[y>>2]=c[x>>2];c[x>>2]=y;a:do{y=c[L>>2]|0;switch(y|0){case 260:case 261:case 262:case 286:case 277:{break a;break};default:{}}lg(e)}while((y|0)!=274);pg(z);Hi(H,Ci(H)|0,N);if((c[L>>2]|0)==262){qj(e);pg(H);Ii(H,G);P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}if((c[C>>2]|0)==(D|0)){mg(e,262)}else{G=c[E>>2]|0;N=mj(e,262)|0;z=mj(e,278)|0;y=hg(G,7960,(M=i,i=i+24|0,c[M>>2]=N,c[M+8>>2]=z,c[M+16>>2]=D,M)|0)|0;i=M;nj(e,y)}break};case 259:{qj(e);y=c[F>>2]|0;a[w+10|0]=0;a[w+8|0]=a[y+46|0]|0;z=y+12|0;b[w+4>>1]=c[(c[(c[z>>2]|0)+64>>2]|0)+28>>2];b[w+6>>1]=c[(c[(c[z>>2]|0)+64>>2]|0)+16>>2];a[w+9|0]=0;z=y+16|0;c[w>>2]=c[z>>2];c[z>>2]=w;b:do{w=c[L>>2]|0;switch(w|0){case 260:case 261:case 262:case 286:case 277:{break b;break};default:{}}lg(e)}while((w|0)!=274);pg(y);if((c[L>>2]|0)==262){qj(e);P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}if((c[C>>2]|0)==(D|0)){mg(e,262)}else{y=c[E>>2]|0;w=mj(e,262)|0;z=mj(e,259)|0;N=hg(y,7960,(M=i,i=i+24|0,c[M>>2]=w,c[M+8>>2]=z,c[M+16>>2]=D,M)|0)|0;i=M;nj(e,N)}break};case 267:{c[B>>2]=-1;og(e,B);while(1){N=c[L>>2]|0;if((N|0)==260){X=10;break}else if((N|0)!=261){Y=N;break}og(e,B)}if((X|0)==10){qj(e);N=c[F>>2]|0;a[A+10|0]=0;a[A+8|0]=a[N+46|0]|0;z=N+12|0;b[A+4>>1]=c[(c[(c[z>>2]|0)+64>>2]|0)+28>>2];b[A+6>>1]=c[(c[(c[z>>2]|0)+64>>2]|0)+16>>2];a[A+9|0]=0;z=N+16|0;c[A>>2]=c[z>>2];c[z>>2]=A;c:do{A=c[L>>2]|0;switch(A|0){case 260:case 261:case 262:case 286:case 277:{break c;break};default:{}}lg(e)}while((A|0)!=274);pg(N);Y=c[L>>2]|0}if((Y|0)==262){qj(e);Ii(H,c[B>>2]|0);P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}if((c[C>>2]|0)==(D|0)){mg(e,262)}else{B=c[E>>2]|0;Y=mj(e,262)|0;N=mj(e,267)|0;A=hg(B,7960,(M=i,i=i+24|0,c[M>>2]=Y,c[M+8>>2]=N,c[M+16>>2]=D,M)|0)|0;i=M;nj(e,A)}break};case 264:{a[v+10|0]=1;a[v+8|0]=a[H+46|0]|0;A=H+12|0;b[v+4>>1]=c[(c[(c[A>>2]|0)+64>>2]|0)+28>>2];b[v+6>>1]=c[(c[(c[A>>2]|0)+64>>2]|0)+16>>2];a[v+9|0]=0;A=H+16|0;c[v>>2]=c[A>>2];c[A>>2]=v;qj(e);if((c[L>>2]|0)!=288){mg(e,288)}v=e+24|0;A=c[v>>2]|0;qj(e);N=c[L>>2]|0;if((N|0)==44|(N|0)==268){Y=c[F>>2]|0;B=d[Y+48|0]|0;rg(e,oj(e,9592,15)|0);rg(e,oj(e,9192,11)|0);rg(e,oj(e,8888,13)|0);rg(e,A);z=c[L>>2]|0;do{if((z|0)==44){w=4;while(1){qj(e);if((c[L>>2]|0)!=288){X=52;break}y=c[v>>2]|0;qj(e);rg(e,y);Z=c[L>>2]|0;if((Z|0)==44){w=w+1|0}else{X=54;break}}if((X|0)==52){mg(e,288)}else if((X|0)==54){_=w-2|0;$=Z;break}}else{_=1;$=z}}while(0);if(($|0)!=268){mg(e,268)}qj(e);$=c[C>>2]|0;qg(e,u,0)|0;if((c[L>>2]|0)==44){z=1;while(1){qj(e);Si(c[F>>2]|0,u);qg(e,u,0)|0;Z=z+1|0;if((c[L>>2]|0)==44){z=Z}else{aa=Z;break}}}else{aa=1}z=c[F>>2]|0;Z=3-aa|0;aa=c[u>>2]|0;do{if((aa|0)==0){X=63}else if((aa|0)==12|(aa|0)==13){v=Z+1|0;y=(v|0)<0?0:v;Pi(z,u,y);if((y|0)<=1){break}Mi(z,y-1|0)}else{Si(z,u);X=63}}while(0);do{if((X|0)==63){if((Z|0)<=0){break}u=d[z+48|0]|0;Mi(z,Z);Ai(z,u,Z)}}while(0);Li(Y,3);sg(e,B,$,_,0);}else if((N|0)==61){N=c[F>>2]|0;_=N+48|0;$=d[_]|0;rg(e,oj(e,8664,11)|0);rg(e,oj(e,8376,11)|0);rg(e,oj(e,8200,10)|0);rg(e,A);if((c[L>>2]|0)!=61){mg(e,61)}qj(e);qg(e,j,0)|0;Si(c[F>>2]|0,j);if((c[L>>2]|0)!=44){mg(e,44)}qj(e);qg(e,h,0)|0;Si(c[F>>2]|0,h);if((c[L>>2]|0)==44){qj(e);qg(e,g,0)|0;Si(c[F>>2]|0,g);}else{g=d[_]|0;Ki(N,g,Oi(N,1.0)|0)|0;Mi(N,1)}sg(e,$,D,1,1)}else{nj(e,9888)}if((c[L>>2]|0)==262){qj(e);pg(H);P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}if((c[C>>2]|0)==(D|0)){mg(e,262)}else{$=c[E>>2]|0;N=mj(e,262)|0;g=mj(e,264)|0;_=hg($,7960,(M=i,i=i+24|0,c[M>>2]=N,c[M+8>>2]=g,c[M+16>>2]=D,M)|0)|0;i=M;nj(e,_)}break};case 59:{qj(e);P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return};case 273:{_=Gi(H)|0;a[s+10|0]=1;g=H+46|0;a[s+8|0]=a[g]|0;N=H+12|0;b[s+4>>1]=c[(c[(c[N>>2]|0)+64>>2]|0)+28>>2];b[s+6>>1]=c[(c[(c[N>>2]|0)+64>>2]|0)+16>>2];a[s+9|0]=0;$=H+16|0;c[s>>2]=c[$>>2];c[$>>2]=s;a[t+10|0]=0;s=t+8|0;a[s]=a[g]|0;b[t+4>>1]=c[(c[(c[N>>2]|0)+64>>2]|0)+28>>2];b[t+6>>1]=c[(c[(c[N>>2]|0)+64>>2]|0)+16>>2];N=t+9|0;a[N]=0;c[t>>2]=c[$>>2];c[$>>2]=t;qj(e);d:while(1){t=c[L>>2]|0;switch(t|0){case 260:case 261:case 262:case 286:case 277:{ba=t;break d;break};default:{}}lg(e);if((t|0)==274){X=75;break}}if((X|0)==75){ba=c[L>>2]|0}if((ba|0)!=277){if((c[C>>2]|0)==(D|0)){mg(e,277)}else{ba=c[E>>2]|0;t=mj(e,277)|0;$=mj(e,273)|0;g=hg(ba,7960,(M=i,i=i+24|0,c[M>>2]=t,c[M+8>>2]=$,c[M+16>>2]=D,M)|0)|0;i=M;nj(e,g)}}qj(e);qg(e,r,0)|0;g=r|0;if((c[g>>2]|0)==1){c[g>>2]=3}Zi(c[F>>2]|0,r);g=c[r+20>>2]|0;if((a[N]|0)!=0){Ji(H,g,d[s]|0)}pg(H);Hi(H,g,_);pg(H);P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return};case 269:{qj(e);_=c[L>>2]|0;if((_|0)==265){qj(e);g=c[F>>2]|0;if((c[L>>2]|0)!=288){mg(e,288)}s=c[e+24>>2]|0;qj(e);rg(e,s);s=c[F>>2]|0;N=s+46|0;r=(a[N]|0)+1&255;a[N]=r;c[(c[(c[s>>2]|0)+24>>2]|0)+((b[(c[c[(c[s+12>>2]|0)+64>>2]>>2]|0)+((r&255)-1+(c[s+40>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[s+20>>2];vg(e,n,0,c[C>>2]|0);c[(c[(c[g>>2]|0)+24>>2]|0)+((b[(c[c[(c[g+12>>2]|0)+64>>2]>>2]|0)+((c[g+40>>2]|0)+(c[n+8>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[g+20>>2];P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}if((_|0)!=288){mg(e,288)}_=e+24|0;g=1;while(1){n=c[_>>2]|0;qj(e);rg(e,n);n=c[L>>2]|0;if((n|0)==61){X=102;break}else if((n|0)!=44){X=104;break}qj(e);if((c[L>>2]|0)==288){g=g+1|0}else{X=99;break}}do{if((X|0)==99){mg(e,288)}else if((X|0)==102){qj(e);qg(e,m,0)|0;if((c[L>>2]|0)==44){_=1;while(1){qj(e);Si(c[F>>2]|0,m);qg(e,m,0)|0;n=_+1|0;if((c[L>>2]|0)==44){_=n}else{ca=n;break}}}else{ca=1}_=c[m>>2]|0;w=c[F>>2]|0;n=g-ca|0;if((_|0)==0){da=w;ea=n;X=109;break}else if(!((_|0)==12|(_|0)==13)){Si(w,m);da=w;ea=n;X=109;break}_=n+1|0;n=(_|0)<0?0:_;Pi(w,m,n);if((n|0)<=1){break}Mi(w,n-1|0)}else if((X|0)==104){c[m>>2]=0;da=c[F>>2]|0;ea=g;X=109}}while(0);do{if((X|0)==109){if((ea|0)<=0){break}m=d[da+48|0]|0;Mi(da,ea);Ai(da,m,ea)}}while(0);ea=c[F>>2]|0;da=ea+46|0;m=(d[da]|0)+g&255;a[da]=m;if((g|0)==0){P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}ca=ea+20|0;n=ea|0;w=ea+12|0;_=ea+40|0;ea=g;g=m;while(1){c[(c[(c[n>>2]|0)+24>>2]|0)+((b[(c[c[(c[w>>2]|0)+64>>2]>>2]|0)+((g&255)-ea+(c[_>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[ca>>2];m=ea-1|0;if((m|0)==0){break}ea=m;g=a[da]|0}P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return};case 285:{qj(e);if((c[L>>2]|0)!=288){mg(e,288)}da=c[e+24>>2]|0;qj(e);g=c[F>>2]|0;ea=e+64|0;ca=c[ea>>2]|0;_=ca+24|0;w=g+16|0;n=b[(c[w>>2]|0)+4>>1]|0;m=ca+28|0;e:do{if((n|0)<(c[m>>2]|0)){s=_|0;r=n;while(1){N=r+1|0;if((Og(da,c[(c[s>>2]|0)+(r<<4)>>2]|0)|0)!=0){break}if((N|0)<(c[m>>2]|0)){r=N}else{break e}}N=g+12|0;$=c[(c[s>>2]|0)+(r<<4)+8>>2]|0;t=hg(c[(c[N>>2]|0)+52>>2]|0,10408,(M=i,i=i+16|0,c[M>>2]=da+16,c[M+8>>2]=$,M)|0)|0;i=M;wg(c[N>>2]|0,t)}}while(0);if((c[L>>2]|0)!=285){mg(e,285)}qj(e);M=c[g+20>>2]|0;g=c[m>>2]|0;n=ca+32|0;if((g|0)<(c[n>>2]|0)){fa=c[_>>2]|0}else{ca=_|0;t=Zf(c[E>>2]|0,c[ca>>2]|0,n,16,32767,5544)|0;c[ca>>2]=t;fa=t}t=_|0;c[fa+(g<<4)>>2]=da;c[(c[t>>2]|0)+(g<<4)+8>>2]=D;a[(c[t>>2]|0)+(g<<4)+12|0]=a[(c[F>>2]|0)+46|0]|0;c[(c[t>>2]|0)+(g<<4)+4>>2]=M;c[m>>2]=(c[m>>2]|0)+1;f:while(1){switch(c[L>>2]|0){case 59:case 285:{break};case 260:case 261:case 262:case 286:{X=130;break f;break};default:{break f}}lg(e)}if((X|0)==130){a[(c[t>>2]|0)+(g<<4)+12|0]=a[(c[w>>2]|0)+8|0]|0}w=(c[t>>2]|0)+(g<<4)|0;g=c[ea>>2]|0;ea=b[(c[(c[F>>2]|0)+16>>2]|0)+6>>1]|0;t=g+16|0;if((ea|0)>=(c[t>>2]|0)){P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}m=g+12|0;g=w|0;M=ea;g:while(1){while(1){if((Og(c[(c[m>>2]|0)+(M<<4)>>2]|0,c[g>>2]|0)|0)==0){break}xg(e,M,w);if((M|0)>=(c[t>>2]|0)){X=163;break g}}r=M+1|0;if((r|0)<(c[t>>2]|0)){M=r}else{X=163;break}}if((X|0)==163){P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}break};case 265:{qj(e);if((c[L>>2]|0)!=288){mg(e,288)}M=c[e+24>>2]|0;qj(e);t=c[F>>2]|0;if((tg(t,M,p,1)|0)==0){tg(t,c[e+72>>2]|0,p,1)|0;w=Ni(c[F>>2]|0,M)|0;c[o+16>>2]=-1;c[o+20>>2]=-1;c[o>>2]=4;c[o+8>>2]=w;$i(t,p,o)}while(1){o=c[L>>2]|0;if((o|0)==58){X=91;break}else if((o|0)!=46){ga=0;break}ug(e,p)}if((X|0)==91){ug(e,p);ga=1}vg(e,q,ga,D);Xi(c[F>>2]|0,p,q);dj(c[F>>2]|0,D);P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return};case 274:{qj(e);D=c[F>>2]|0;h:do{switch(c[L>>2]|0){case 260:case 261:case 262:case 286:case 277:case 59:{ha=0;ia=0;break};default:{qg(e,l,0)|0;if((c[L>>2]|0)==44){q=1;while(1){qj(e);Si(c[F>>2]|0,l);qg(e,l,0)|0;p=q+1|0;if((c[L>>2]|0)==44){q=p}else{ja=p;break}}}else{ja=1}q=l|0;if((c[q>>2]&-2|0)==12){Pi(D,l,-1);if((c[q>>2]|0)==12&(ja|0)==1){q=(c[(c[D>>2]|0)+12>>2]|0)+(c[l+8>>2]<<2)|0;c[q>>2]=c[q>>2]&-64|30}ha=-1;ia=d[D+46|0]|0;break h}else{if((ja|0)==1){ha=1;ia=Ti(D,l)|0;break h}else{Si(D,l);ha=ja;ia=d[D+46|0]|0;break h}}}}}while(0);Fi(D,ia,ha);if((c[L>>2]|0)!=59){P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}qj(e);P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return};case 258:case 266:{ha=Ci(H)|0;ia=c[C>>2]|0;C=(c[L>>2]|0)==266;qj(e);do{if(C){if((c[L>>2]|0)==288){D=c[e+24>>2]|0;qj(e);ka=D;break}else{mg(e,288)}}else{ka=Sg(c[E>>2]|0,7080)|0}}while(0);C=c[e+64>>2]|0;D=C+12|0;ja=C+16|0;l=c[ja>>2]|0;q=C+20|0;if((l|0)<(c[q>>2]|0)){la=c[D>>2]|0}else{C=D|0;p=Zf(c[E>>2]|0,c[C>>2]|0,q,16,32767,5544)|0;c[C>>2]=p;la=p}p=D|0;c[la+(l<<4)>>2]=ka;c[(c[p>>2]|0)+(l<<4)+8>>2]=ia;a[(c[p>>2]|0)+(l<<4)+12|0]=a[(c[F>>2]|0)+46|0]|0;c[(c[p>>2]|0)+(l<<4)+4>>2]=ha;c[ja>>2]=(c[ja>>2]|0)+1;yg(e,l)|0;P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return};default:{l=k+8|0;zg(e,l);ja=c[L>>2]|0;if((ja|0)==61|(ja|0)==44){c[k>>2]=0;Ag(e,k,1);P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}if((c[l>>2]|0)!=12){nj(e,3880)}e=(c[(c[H>>2]|0)+12>>2]|0)+(c[k+16>>2]<<2)|0;c[e>>2]=c[e>>2]&-8372225|16384;P=c[F>>2]|0;Q=P+46|0;R=a[Q]|0;S=P+48|0;a[S]=R;T=c[E>>2]|0;U=T+38|0;V=b[U>>1]|0;W=V-1&65535;b[U>>1]=W;i=f;return}}}function mg(a,b){a=a|0;b=b|0;var d=0,e=0;d=c[a+52>>2]|0;e=mj(a,b)|0;b=hg(d,4256,(d=i,i=i+8|0,c[d>>2]=e,d)|0)|0;i=d;nj(a,b)}function ng(a){a=a|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=c[a+52>>2]|0;f=a+48|0;g=c[f>>2]|0;h=c[g>>2]|0;Fi(g,0,0);pg(g);i=g+20|0;j=c[i>>2]|0;if((j+1|0)>>>0>1073741823>>>0){_f(e)}k=h+12|0;l=h+48|0;c[k>>2]=$f(e,c[k>>2]|0,c[l>>2]<<2,j<<2)|0;c[l>>2]=c[i>>2];l=c[i>>2]|0;if((l+1|0)>>>0>1073741823>>>0){_f(e)}j=h+20|0;k=h+52|0;c[j>>2]=$f(e,c[j>>2]|0,c[k>>2]<<2,l<<2)|0;c[k>>2]=c[i>>2];i=g+32|0;k=c[i>>2]|0;if((k+1|0)>>>0>268435455>>>0){_f(e)}l=h+8|0;j=h+44|0;c[l>>2]=$f(e,c[l>>2]|0,c[j>>2]<<4,k<<4)|0;c[j>>2]=c[i>>2];i=g+36|0;j=c[i>>2]|0;if((j+1|0)>>>0>1073741823>>>0){_f(e)}k=h+16|0;l=h+56|0;c[k>>2]=$f(e,c[k>>2]|0,c[l>>2]<<2,j<<2)|0;c[l>>2]=c[i>>2];i=g+44|0;l=b[i>>1]|0;if((l+1|0)>>>0>357913941>>>0){_f(e)}j=h+24|0;k=h+60|0;c[j>>2]=$f(e,c[j>>2]|0,(c[k>>2]|0)*12|0,l*12|0)|0;c[k>>2]=b[i>>1]|0;i=g+47|0;k=h+28|0;l=h+40|0;c[k>>2]=$f(e,c[k>>2]|0,c[l>>2]<<3,d[i]<<3)|0;c[l>>2]=d[i]|0;c[f>>2]=c[g+8>>2];if((c[a+16>>2]&-2|0)==288){g=c[a+24>>2]|0;oj(a,g+16|0,c[g+12>>2]|0)|0}g=e+8|0;c[g>>2]=(c[g>>2]|0)-16;if((c[(c[e+12>>2]|0)+12>>2]|0)<=0){return}Nf(e);return}function og(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+40|0;g=f|0;h=f+16|0;j=d+48|0;k=c[j>>2]|0;qj(d);qg(d,h,0)|0;l=d+16|0;if((c[l>>2]|0)!=275){mg(d,275)}qj(d);m=c[l>>2]|0;do{if((m|0)==266|(m|0)==258){_i(c[j>>2]|0,h);a[g+10|0]=0;a[g+8|0]=a[k+46|0]|0;n=k+12|0;b[g+4>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+28>>2];b[g+6>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+16>>2];a[g+9|0]=0;n=k+16|0;c[g>>2]=c[n>>2];c[n>>2]=g;n=c[h+16>>2]|0;o=c[d+4>>2]|0;p=(c[l>>2]|0)==266;qj(d);do{if(p){if((c[l>>2]|0)==288){q=c[d+24>>2]|0;qj(d);r=q;break}else{mg(d,288)}}else{r=Sg(c[d+52>>2]|0,7080)|0}}while(0);p=c[d+64>>2]|0;q=p+12|0;s=p+16|0;t=c[s>>2]|0;u=p+20|0;if((t|0)<(c[u>>2]|0)){v=c[q>>2]|0}else{p=q|0;w=Zf(c[d+52>>2]|0,c[p>>2]|0,u,16,32767,5544)|0;c[p>>2]=w;v=w}w=q|0;c[v+(t<<4)>>2]=r;c[(c[w>>2]|0)+(t<<4)+8>>2]=o;a[(c[w>>2]|0)+(t<<4)+12|0]=a[(c[j>>2]|0)+46|0]|0;c[(c[w>>2]|0)+(t<<4)+4>>2]=n;c[s>>2]=(c[s>>2]|0)+1;yg(d,t)|0;a:while(1){switch(c[l>>2]|0){case 59:case 285:{break};case 260:case 261:case 262:case 286:{break a;break};default:{x=16;break a}}lg(d)}if((x|0)==16){y=Ci(k)|0;break}pg(k);i=f;return}else{Zi(c[j>>2]|0,h);a[g+10|0]=0;a[g+8|0]=a[k+46|0]|0;n=k+12|0;b[g+4>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+28>>2];b[g+6>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+16>>2];a[g+9|0]=0;n=k+16|0;c[g>>2]=c[n>>2];c[n>>2]=g;y=c[h+20>>2]|0}}while(0);b:do{h=c[l>>2]|0;switch(h|0){case 260:case 261:case 262:case 286:case 277:{break b;break};default:{}}lg(d)}while((h|0)!=274);pg(k);if((c[l>>2]&-2|0)==260){Ei(k,e,Ci(k)|0)}Ii(k,y);i=f;return}function pg(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;g=e+16|0;h=c[g>>2]|0;j=e+12|0;k=c[j>>2]|0;l=h|0;do{if((c[l>>2]|0)!=0){if((a[h+9|0]|0)==0){break}m=Ci(e)|0;Ji(e,m,d[h+8|0]|0);Ii(e,m)}}while(0);a:do{if((a[h+10|0]|0)!=0){m=k+52|0;n=Sg(c[m>>2]|0,7080)|0;o=k+64|0;p=c[o>>2]|0;q=p+24|0;r=k+48|0;s=c[(c[r>>2]|0)+20>>2]|0;t=p+28|0;u=c[t>>2]|0;v=p+32|0;if((u|0)<(c[v>>2]|0)){w=c[q>>2]|0}else{p=q|0;x=Zf(c[m>>2]|0,c[p>>2]|0,v,16,32767,5544)|0;c[p>>2]=x;w=x}x=q|0;c[w+(u<<4)>>2]=n;c[(c[x>>2]|0)+(u<<4)+8>>2]=0;a[(c[x>>2]|0)+(u<<4)+12|0]=a[(c[r>>2]|0)+46|0]|0;c[(c[x>>2]|0)+(u<<4)+4>>2]=s;c[t>>2]=(c[t>>2]|0)+1;t=c[o>>2]|0;o=(c[t+24>>2]|0)+(u<<4)|0;u=b[(c[(c[r>>2]|0)+16>>2]|0)+6>>1]|0;r=t+16|0;if((u|0)>=(c[r>>2]|0)){break}s=t+12|0;t=o|0;x=u;do{while(1){if((Og(c[(c[s>>2]|0)+(x<<4)>>2]|0,c[t>>2]|0)|0)==0){break}xg(k,x,o);if((x|0)>=(c[r>>2]|0)){break a}}x=x+1|0;}while((x|0)<(c[r>>2]|0))}}while(0);c[g>>2]=c[l>>2];g=h+8|0;w=a[g]|0;r=e+46|0;x=(c[(c[j>>2]|0)+64>>2]|0)+4|0;c[x>>2]=(w&255)-(d[r]|0)+(c[x>>2]|0);x=a[r]|0;if((x&255)>>>0>(w&255)>>>0){o=e+20|0;t=e|0;s=e+40|0;u=x;while(1){n=c[o>>2]|0;q=u-1&255;a[r]=q;c[(c[(c[t>>2]|0)+24>>2]|0)+((b[(c[c[(c[j>>2]|0)+64>>2]>>2]|0)+((c[s>>2]|0)+(q&255)<<1)>>1]|0)*12|0)+8>>2]=n;n=a[r]|0;if((n&255)>>>0>(w&255)>>>0){u=n}else{y=n;break}}}else{y=x}a[e+48|0]=y;y=k+64|0;c[(c[y>>2]|0)+28>>2]=b[h+4>>1]|0;x=b[h+6>>1]|0;if((c[l>>2]|0)==0){l=c[y>>2]|0;if((x|0)>=(c[l+16>>2]|0)){i=f;return}y=c[l+12>>2]|0;l=c[y+(x<<4)>>2]|0;u=l;if((a[u+4|0]|0)!=4){z=12952;A=k+52|0;B=c[A>>2]|0;C=l+16|0;D=y+(x<<4)+8|0;E=c[D>>2]|0;F=hg(B,z,(G=i,i=i+16|0,c[G>>2]=C,c[G+8>>2]=E,G)|0)|0;i=G;wg(k,F)}z=(a[u+6|0]|0)!=0?9472:12952;A=k+52|0;B=c[A>>2]|0;C=l+16|0;D=y+(x<<4)+8|0;E=c[D>>2]|0;F=hg(B,z,(G=i,i=i+16|0,c[G>>2]=C,c[G+8>>2]=E,G)|0)|0;i=G;wg(k,F)}F=c[(c[j>>2]|0)+64>>2]|0;k=F+16|0;if((x|0)>=(c[k>>2]|0)){i=f;return}G=F+12|0;F=h+9|0;h=x;do{x=c[G>>2]|0;E=x+(h<<4)+12|0;C=a[g]|0;z=C&255;if((d[E]|0)>>>0>(C&255)>>>0){if((a[F]|0)==0){H=C}else{Ji(e,c[x+(h<<4)+4>>2]|0,z);H=a[g]|0}a[E]=H}h=((yg(c[j>>2]|0,h)|0)==0)+h|0;}while((h|0)<(c[k>>2]|0));i=f;return}function qg(e,f,g){e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;j=i;i=i+24|0;k=j|0;l=e+52|0;m=(c[l>>2]|0)+38|0;n=(b[m>>1]|0)+1&65535;b[m>>1]=n;m=e+48|0;o=c[m>>2]|0;if((n&65535)>>>0>200>>>0){n=o+12|0;p=c[(c[n>>2]|0)+52>>2]|0;q=c[(c[o>>2]|0)+64>>2]|0;if((q|0)==0){r=12360;s=hg(p,11920,(t=i,i=i+24|0,c[t>>2]=3480,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;nj(u,s);return 0}v=hg(p,12096,(t=i,i=i+8|0,c[t>>2]=q,t)|0)|0;i=t;r=v;s=hg(p,11920,(t=i,i=i+24|0,c[t>>2]=3480,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;nj(u,s);return 0}s=e+16|0;a:do{switch(c[s>>2]|0){case 287:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=5;c[f+8>>2]=0;h[f+8>>3]=+h[e+24>>3];w=20;break};case 270:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=1;c[f+8>>2]=0;w=20;break};case 271:{x=1;w=8;break};case 276:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=2;c[f+8>>2]=0;w=20;break};case 289:{u=Ni(o,c[e+24>>2]|0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=4;c[f+8>>2]=u;w=20;break};case 35:{x=2;w=8;break};case 263:{c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=3;c[f+8>>2]=0;w=20;break};case 45:{x=0;w=8;break};case 280:{if((a[(c[o>>2]|0)+77|0]|0)==0){nj(e,3e3);return 0}else{u=Bi(o,38,0,1,0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=13;c[f+8>>2]=u;w=20;break a}break};case 123:{Bg(e,f);break};case 265:{qj(e);vg(e,f,0,c[e+4>>2]|0);break};default:{zg(e,f)}}}while(0);if((w|0)==8){o=c[e+4>>2]|0;qj(e);qg(e,f,8)|0;aj(c[m>>2]|0,x,f,o)}else if((w|0)==20){qj(e)}switch(c[s>>2]|0){case 279:{y=6;break};case 62:{y=11;break};case 47:{y=3;break};case 94:{y=5;break};case 37:{y=4;break};case 60:{y=8;break};case 284:{y=10;break};case 282:{y=12;break};case 272:{y=14;break};case 257:{y=13;break};case 281:{y=7;break};case 43:{y=0;break};case 45:{y=1;break};case 42:{y=2;break};case 283:{y=9;break};default:{z=15;A=c[l>>2]|0;B=A+38|0;C=b[B>>1]|0;D=C-1&65535;b[B>>1]=D;i=j;return z|0}}s=e+4|0;o=y;while(1){if((d[304+(o<<1)|0]|0)<=(g|0)){z=o;w=39;break}y=c[s>>2]|0;qj(e);bj(c[m>>2]|0,o,f);x=qg(e,k,d[305+(o<<1)|0]|0)|0;cj(c[m>>2]|0,o,f,k,y);if((x|0)==15){z=15;w=39;break}else{o=x}}if((w|0)==39){A=c[l>>2]|0;B=A+38|0;C=b[B>>1]|0;D=C-1&65535;b[B>>1]=D;i=j;return z|0}return 0}function rg(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;g=c[d+48>>2]|0;h=c[d+64>>2]|0;j=g|0;k=c[j>>2]|0;l=k+60|0;m=c[l>>2]|0;n=g+44|0;if((b[n>>1]|0)<(m|0)){o=m;p=k+24|0}else{q=k+24|0;c[q>>2]=Zf(c[d+52>>2]|0,c[q>>2]|0,l,12,32767,13368)|0;o=c[l>>2]|0;p=q}if((m|0)<(o|0)){o=m;while(1){m=o+1|0;c[(c[p>>2]|0)+(o*12|0)>>2]=0;if((m|0)<(c[l>>2]|0)){o=m}else{break}}}c[(c[p>>2]|0)+((b[n>>1]|0)*12|0)>>2]=e;p=e;do{if((a[e+5|0]&3)!=0){if((a[k+5|0]&4)==0){break}Df(c[d+52>>2]|0,k,p)}}while(0);p=b[n>>1]|0;b[n>>1]=p+1;n=h+4|0;k=c[n>>2]|0;if((k+1-(c[g+40>>2]|0)|0)>200){e=g+12|0;g=c[(c[e>>2]|0)+52>>2]|0;o=c[(c[j>>2]|0)+64>>2]|0;if((o|0)==0){r=12360;s=hg(g,11920,(t=i,i=i+24|0,c[t>>2]=13368,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[e>>2]|0;nj(u,s)}j=hg(g,12096,(t=i,i=i+8|0,c[t>>2]=o,t)|0)|0;i=t;r=j;s=hg(g,11920,(t=i,i=i+24|0,c[t>>2]=13368,c[t+8>>2]=200,c[t+16>>2]=r,t)|0)|0;i=t;u=c[e>>2]|0;nj(u,s)}s=h+8|0;if((k+2|0)>(c[s>>2]|0)){u=h|0;e=Zf(c[d+52>>2]|0,c[u>>2]|0,s,2,2147483645,13368)|0;c[u>>2]=e;v=c[n>>2]|0;w=e;x=v+1|0;c[n>>2]=x;y=w+(v<<1)|0;b[y>>1]=p;i=f;return}else{v=k;w=c[h>>2]|0;x=v+1|0;c[n>>2]=x;y=w+(v<<1)|0;b[y>>1]=p;i=f;return}}function sg(e,f,g,h,j){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;k=i;i=i+32|0;l=k|0;m=k+16|0;n=e+48|0;o=c[n>>2]|0;p=o+46|0;q=(a[p]|0)+3&255;a[p]=q;r=o+20|0;s=o|0;t=o+12|0;u=o+40|0;v=3;w=q;while(1){c[(c[(c[s>>2]|0)+24>>2]|0)+((b[(c[c[(c[t>>2]|0)+64>>2]>>2]|0)+((w&255)-v+(c[u>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[r>>2];q=v-1|0;if((q|0)==0){break}v=q;w=a[p]|0}w=e+16|0;if((c[w>>2]|0)!=259){mg(e,259)}qj(e);v=(j|0)!=0;if(v){x=Di(o,33,f,131070)|0}else{x=Ci(o)|0}a[m+10|0]=0;a[m+8|0]=a[p]|0;b[m+4>>1]=c[(c[(c[t>>2]|0)+64>>2]|0)+28>>2];b[m+6>>1]=c[(c[(c[t>>2]|0)+64>>2]|0)+16>>2];a[m+9|0]=0;t=o+16|0;c[m>>2]=c[t>>2];c[t>>2]=m;m=c[n>>2]|0;t=m+46|0;p=(d[t]|0)+h&255;a[t]=p;a:do{if((h|0)!=0){j=m+20|0;r=m|0;u=m+12|0;s=m+40|0;q=h;y=p;while(1){c[(c[(c[r>>2]|0)+24>>2]|0)+((b[(c[c[(c[u>>2]|0)+64>>2]>>2]|0)+((y&255)-q+(c[s>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[j>>2];z=q-1|0;if((z|0)==0){break a}q=z;y=a[t]|0}}}while(0);Mi(o,h);t=c[n>>2]|0;a[l+10|0]=0;a[l+8|0]=a[t+46|0]|0;n=t+12|0;b[l+4>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+28>>2];b[l+6>>1]=c[(c[(c[n>>2]|0)+64>>2]|0)+16>>2];a[l+9|0]=0;n=t+16|0;c[l>>2]=c[n>>2];c[n>>2]=l;b:do{l=c[w>>2]|0;switch(l|0){case 260:case 261:case 262:case 286:case 277:{break b;break};default:{}}lg(e)}while((l|0)!=274);pg(t);pg(o);Ii(o,x);if(v){A=Di(o,32,f,131070)|0;B=x+1|0;Hi(o,A,B);dj(o,g);i=k;return}else{Bi(o,34,f,0,h)|0;dj(o,g);A=Di(o,35,f+2|0,131070)|0;B=x+1|0;Hi(o,A,B);dj(o,g);i=k;return}}function tg(e,f,g,h){e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if((e|0)==0){i=0;return i|0}j=e|0;k=e+12|0;l=e+40|0;m=d[e+46|0]|0;while(1){n=m-1|0;o=c[j>>2]|0;if((m|0)<=0){break}if((Og(f,c[(c[o+24>>2]|0)+((b[(c[c[(c[k>>2]|0)+64>>2]>>2]|0)+((c[l>>2]|0)+n<<1)>>1]|0)*12|0)>>2]|0)|0)==0){m=n}else{p=5;break}}if((p|0)==5){c[g+16>>2]=-1;c[g+20>>2]=-1;c[g>>2]=7;c[g+8>>2]=n;if((h|0)!=0){i=7;return i|0}h=e+16|0;while(1){q=c[h>>2]|0;if((d[q+8|0]|0)>(n|0)){h=q|0}else{break}}a[q+9|0]=1;i=7;return i|0}q=c[o+28>>2]|0;o=e+47|0;a:do{if((a[o]|0)==0){p=13}else{h=0;while(1){n=h+1|0;if((Og(c[q+(h<<3)>>2]|0,f)|0)!=0){break}if((n|0)<(d[o]|0)){h=n}else{p=13;break a}}if((h|0)<0){p=13}else{r=h}}}while(0);do{if((p|0)==13){if((tg(c[e+8>>2]|0,f,g,0)|0)==0){i=0;return i|0}else{r=kg(e,f,g)|0;break}}}while(0);c[g+16>>2]=-1;c[g+20>>2]=-1;c[g>>2]=8;c[g+8>>2]=r;i=8;return i|0}function ug(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+24|0;e=d|0;f=a+48|0;g=c[f>>2]|0;Ui(g,b);qj(a);if((c[a+16>>2]|0)==288){h=c[a+24>>2]|0;qj(a);j=Ni(c[f>>2]|0,h)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=4;c[e+8>>2]=j;$i(g,b,e);i=d;return}else{mg(a,288)}}function vg(e,f,g,h){e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;j=i;i=i+72|0;k=j|0;l=j+56|0;m=e+48|0;n=c[m>>2]|0;o=e+52|0;p=c[o>>2]|0;q=c[n>>2]|0;r=n+36|0;n=q+56|0;s=c[n>>2]|0;t=q+16|0;do{if((c[r>>2]|0)>=(s|0)){u=Zf(p,c[t>>2]|0,n,4,262143,12936)|0;c[t>>2]=u;if((s|0)>=(c[n>>2]|0)){break}v=s+1|0;c[u+(s<<2)>>2]=0;if((v|0)<(c[n>>2]|0)){w=v}else{break}while(1){v=w+1|0;c[(c[t>>2]|0)+(w<<2)>>2]=0;if((v|0)<(c[n>>2]|0)){w=v}else{break}}}}while(0);w=Af(p)|0;n=c[r>>2]|0;c[r>>2]=n+1;c[(c[t>>2]|0)+(n<<2)>>2]=w;n=w;do{if((a[w+5|0]&3)!=0){if((a[q+5|0]&4)==0){break}Df(p,q,n)}}while(0);n=k|0;c[n>>2]=w;c[w+64>>2]=h;w=c[o>>2]|0;c[k+8>>2]=c[m>>2];q=k+12|0;c[q>>2]=e;c[m>>2]=k;c[k+20>>2]=0;c[k+24>>2]=0;c[k+28>>2]=-1;c[k+32>>2]=0;c[k+36>>2]=0;mn(k+44|0,0,5)|0;c[k+40>>2]=c[(c[e+64>>2]|0)+4>>2];p=k+16|0;c[p>>2]=0;t=c[n>>2]|0;c[t+36>>2]=c[e+68>>2];a[t+78|0]=2;t=Zg(w)|0;c[k+4>>2]=t;r=w+8|0;s=c[r>>2]|0;c[s>>2]=t;c[s+8>>2]=69;s=(c[r>>2]|0)+16|0;c[r>>2]=s;if(((c[w+24>>2]|0)-s|0)<16){df(w,0)}a[l+10|0]=0;a[l+8|0]=a[k+46|0]|0;k=(c[q>>2]|0)+64|0;b[l+4>>1]=c[(c[k>>2]|0)+28>>2];b[l+6>>1]=c[(c[k>>2]|0)+16>>2];a[l+9|0]=0;c[l>>2]=c[p>>2];c[p>>2]=l;l=e+16|0;if((c[l>>2]|0)!=40){mg(e,40)}qj(e);if((g|0)!=0){rg(e,oj(e,2640,4)|0);g=c[m>>2]|0;p=g+46|0;k=(a[p]|0)+1&255;a[p]=k;c[(c[(c[g>>2]|0)+24>>2]|0)+((b[(c[c[(c[g+12>>2]|0)+64>>2]>>2]|0)+((k&255)-1+(c[g+40>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[g+20>>2]}g=c[m>>2]|0;k=c[g>>2]|0;p=k+77|0;a[p]=0;q=c[l>>2]|0;a:do{if((q|0)==41){x=0}else{w=e+24|0;s=0;r=q;while(1){if((r|0)==280){y=18;break}else if((r|0)!=288){y=19;break}t=c[w>>2]|0;qj(e);rg(e,t);t=s+1|0;if((a[p]|0)!=0){x=t;break a}if((c[l>>2]|0)!=44){x=t;break a}qj(e);s=t;r=c[l>>2]|0}if((y|0)==18){qj(e);a[p]=1;x=s;break}else if((y|0)==19){nj(e,13640)}}}while(0);y=c[m>>2]|0;p=y+46|0;q=(d[p]|0)+x&255;a[p]=q;b:do{if((x|0)!=0){r=y+20|0;w=y|0;t=y+12|0;v=y+40|0;u=x;z=q;while(1){c[(c[(c[w>>2]|0)+24>>2]|0)+((b[(c[c[(c[t>>2]|0)+64>>2]>>2]|0)+((z&255)-u+(c[v>>2]|0)<<1)>>1]|0)*12|0)+4>>2]=c[r>>2];A=u-1|0;if((A|0)==0){break b}u=A;z=a[p]|0}}}while(0);p=g+46|0;a[k+76|0]=a[p]|0;Mi(g,d[p]|0);if((c[l>>2]|0)!=41){mg(e,41)}qj(e);c:do{p=c[l>>2]|0;switch(p|0){case 260:case 261:case 262:case 286:case 277:{break c;break};default:{}}lg(e)}while((p|0)!=274);p=e+4|0;c[(c[n>>2]|0)+68>>2]=c[p>>2];if((c[l>>2]|0)==262){qj(e);l=c[(c[m>>2]|0)+8>>2]|0;m=Di(l,37,0,(c[l+36>>2]|0)-1|0)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=11;c[f+8>>2]=m;Si(l,f);ng(e);i=j;return}if((c[p>>2]|0)==(h|0)){mg(e,262)}else{p=c[o>>2]|0;o=mj(e,262)|0;j=mj(e,265)|0;f=hg(p,7960,(p=i,i=i+24|0,c[p>>2]=o,c[p+8>>2]=j,c[p+16>>2]=h,p)|0)|0;i=p;nj(e,f)}}function wg(a,b){a=a|0;b=b|0;c[a+16>>2]=0;nj(a,b)}function xg(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;j=c[e+48>>2]|0;k=c[e+64>>2]|0;l=k+12|0;m=c[l>>2]|0;n=a[m+(f<<4)+12|0]|0;if((n&255)>>>0<(d[g+12|0]|0)>>>0){o=c[m+(f<<4)+8>>2]|0;p=(c[(c[(c[j>>2]|0)+24>>2]|0)+((b[(c[c[(c[j+12>>2]|0)+64>>2]>>2]|0)+((c[j+40>>2]|0)+(n&255)<<1)>>1]|0)*12|0)>>2]|0)+16|0;n=hg(c[e+52>>2]|0,9208,(q=i,i=i+24|0,c[q>>2]=(c[m+(f<<4)>>2]|0)+16,c[q+8>>2]=o,c[q+16>>2]=p,q)|0)|0;i=q;wg(e,n)}Hi(j,c[m+(f<<4)+4>>2]|0,c[g+4>>2]|0);g=k+16|0;k=(c[g>>2]|0)-1|0;if((k|0)>(f|0)){r=f}else{s=k;c[g>>2]=s;i=h;return}while(1){k=c[l>>2]|0;f=r+1|0;m=k+(r<<4)|0;j=k+(f<<4)|0;c[m>>2]=c[j>>2];c[m+4>>2]=c[j+4>>2];c[m+8>>2]=c[j+8>>2];c[m+12>>2]=c[j+12>>2];j=(c[g>>2]|0)-1|0;if((f|0)<(j|0)){r=f}else{s=j;break}}c[g>>2]=s;i=h;return}function yg(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=e+48|0;h=c[(c[g>>2]|0)+16>>2]|0;i=c[e+64>>2]|0;j=c[i+12>>2]|0;k=h+4|0;l=b[k>>1]|0;m=i+28|0;if((l|0)>=(c[m>>2]|0)){n=0;return n|0}o=i+24|0;i=j+(f<<4)|0;p=l;while(1){q=c[o>>2]|0;r=q+(p<<4)|0;l=p+1|0;if((Og(c[r>>2]|0,c[i>>2]|0)|0)!=0){break}if((l|0)<(c[m>>2]|0)){p=l}else{n=0;s=10;break}}if((s|0)==10){return n|0}s=a[q+(p<<4)+12|0]|0;do{if((d[j+(f<<4)+12|0]|0)>>>0>(s&255)>>>0){if((a[h+9|0]|0)==0){if((c[m>>2]|0)<=(b[k>>1]|0)){break}}Ji(c[g>>2]|0,c[j+(f<<4)+4>>2]|0,s&255)}}while(0);xg(e,f,r);n=1;return n|0}function zg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=i;i=i+72|0;e=d|0;f=d+24|0;g=d+48|0;h=a+48|0;j=c[h>>2]|0;k=a+4|0;l=c[k>>2]|0;m=a+16|0;n=c[m>>2]|0;do{if((n|0)==40){qj(a);qg(a,b,0)|0;if((c[m>>2]|0)==41){qj(a);Ri(c[h>>2]|0,b);o=a+24|0;break}if((c[k>>2]|0)==(l|0)){mg(a,41)}else{p=c[a+52>>2]|0;q=mj(a,41)|0;r=mj(a,40)|0;s=hg(p,7960,(p=i,i=i+24|0,c[p>>2]=q,c[p+8>>2]=r,c[p+16>>2]=l,p)|0)|0;i=p;nj(a,s)}}else if((n|0)==288){s=a+24|0;p=c[s>>2]|0;qj(a);r=c[h>>2]|0;if((tg(r,p,b,1)|0)!=0){o=s;break}tg(r,c[a+72>>2]|0,b,1)|0;q=Ni(c[h>>2]|0,p)|0;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e>>2]=4;c[e+8>>2]=q;$i(r,b,e);o=s}else{nj(a,10656)}}while(0);e=g+16|0;n=g+20|0;k=g|0;s=g+8|0;a:while(1){switch(c[m>>2]|0){case 58:{qj(a);if((c[m>>2]|0)!=288){t=17;break a}r=c[o>>2]|0;qj(a);q=Ni(c[h>>2]|0,r)|0;c[e>>2]=-1;c[n>>2]=-1;c[k>>2]=4;c[s>>2]=q;Yi(j,b,g);Cg(a,b,l);continue a;break};case 91:{Ui(j,b);qj(a);qg(a,f,0)|0;Vi(c[h>>2]|0,f);if((c[m>>2]|0)!=93){t=14;break a}qj(a);$i(j,b,f);continue a;break};case 46:{ug(a,b);continue a;break};case 40:case 289:case 123:{Si(j,b);Cg(a,b,l);continue a;break};default:{t=20;break a}}}if((t|0)==14){mg(a,93)}else if((t|0)==17){mg(a,288)}else if((t|0)==20){i=d;return}}function Ag(f,g,h){f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;j=i;i=i+56|0;k=j|0;l=j+24|0;m=g+8|0;if(((c[m>>2]|0)-7|0)>>>0>=3>>>0){nj(f,3880)}n=f+16|0;o=c[n>>2]|0;do{if((o|0)==44){qj(f);c[l>>2]=g;p=l+8|0;zg(f,p);q=p|0;p=f+48|0;do{if((c[q>>2]|0)!=9){r=c[p>>2]|0;s=a[r+48|0]|0;t=s&255;if((g|0)==0){break}u=l+16|0;v=s&255;w=0;x=g;while(1){do{if((c[x+8>>2]|0)==9){y=x+16|0;z=y;A=z+3|0;B=d[A]|0;C=c[q>>2]|0;do{if((B|0)==(C|0)){D=z+2|0;if((d[D]|0)!=(c[u>>2]|0)){E=w;F=B;break}a[A]=7;a[D]=s;E=1;F=c[q>>2]|0}else{E=w;F=C}}while(0);if((F|0)!=7){G=E;break}C=y;if((b[C>>1]|0)!=(c[u>>2]|0)){G=E;break}b[C>>1]=v;G=1}else{G=w}}while(0);C=c[x>>2]|0;if((C|0)==0){break}else{w=G;x=C}}if((G|0)==0){break}Bi(r,(c[q>>2]|0)==7?0:5,t,c[u>>2]|0,0)|0;Mi(r,1)}}while(0);q=c[p>>2]|0;if(((e[(c[f+52>>2]|0)+38>>1]|0)+h|0)<=200){Ag(f,l,h+1|0);H=k|0;break}x=q+12|0;w=c[(c[x>>2]|0)+52>>2]|0;v=c[(c[q>>2]|0)+64>>2]|0;if((v|0)==0){I=12360;J=hg(w,11920,(K=i,i=i+24|0,c[K>>2]=3480,c[K+8>>2]=200,c[K+16>>2]=I,K)|0)|0;i=K;L=c[x>>2]|0;nj(L,J)}q=hg(w,12096,(K=i,i=i+8|0,c[K>>2]=v,K)|0)|0;i=K;I=q;J=hg(w,11920,(K=i,i=i+24|0,c[K>>2]=3480,c[K+8>>2]=200,c[K+16>>2]=I,K)|0)|0;i=K;L=c[x>>2]|0;nj(L,J)}else if((o|0)==61){qj(f);qg(f,k,0)|0;x=f+48|0;if((c[n>>2]|0)==44){w=1;while(1){qj(f);Si(c[x>>2]|0,k);qg(f,k,0)|0;q=w+1|0;if((c[n>>2]|0)==44){w=q}else{M=q;break}}}else{M=1}w=c[x>>2]|0;if((M|0)==(h|0)){Qi(w,k);Xi(c[x>>2]|0,m,k);i=j;return}p=h-M|0;q=k|0;v=c[q>>2]|0;do{if((v|0)==0){N=30}else if((v|0)==12|(v|0)==13){s=p+1|0;C=(s|0)<0?0:s;Pi(w,k,C);if((C|0)<=1){break}Mi(w,C-1|0)}else{Si(w,k);N=30}}while(0);do{if((N|0)==30){if((p|0)<=0){break}v=d[w+48|0]|0;Mi(w,p);Ai(w,v,p)}}while(0);if((M|0)<=(h|0)){H=q;break}w=(c[x>>2]|0)+48|0;a[w]=p+(d[w]|0);H=q}else{mg(f,61)}}while(0);h=c[f+48>>2]|0;f=(d[h+48|0]|0)-1|0;c[k+16>>2]=-1;c[k+20>>2]=-1;c[H>>2]=6;c[k+8>>2]=f;Xi(h,m,k);i=j;return}function Bg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;d=i;i=i+40|0;e=d|0;f=a+48|0;g=c[f>>2]|0;h=a+4|0;j=c[h>>2]|0;k=Bi(g,11,0,0,0)|0;l=e+36|0;c[l>>2]=0;m=e+28|0;c[m>>2]=0;n=e+32|0;c[n>>2]=0;o=e+24|0;c[o>>2]=b;c[b+16>>2]=-1;c[b+20>>2]=-1;c[b>>2]=11;c[b+8>>2]=k;p=e|0;c[e+16>>2]=-1;c[e+20>>2]=-1;q=e|0;c[q>>2]=0;c[e+8>>2]=0;Si(c[f>>2]|0,b);b=a+16|0;if((c[b>>2]|0)!=123){mg(a,123)}qj(a);a:do{if((c[b>>2]|0)!=125){b:while(1){do{if((c[q>>2]|0)!=0){Si(g,p);c[q>>2]=0;if((c[l>>2]|0)!=50){break}ej(g,c[(c[o>>2]|0)+8>>2]|0,c[n>>2]|0,50);c[l>>2]=0}}while(0);r=c[b>>2]|0;do{if((r|0)==91){Dg(a,e)}else if((r|0)==288){if((rj(a)|0)==61){Dg(a,e);break}qg(a,p,0)|0;s=c[f>>2]|0;t=c[n>>2]|0;if((t|0)>2147483645){u=10;break b}c[n>>2]=t+1;c[l>>2]=(c[l>>2]|0)+1}else{qg(a,p,0)|0;v=c[f>>2]|0;t=c[n>>2]|0;if((t|0)>2147483645){u=17;break b}c[n>>2]=t+1;c[l>>2]=(c[l>>2]|0)+1}}while(0);r=c[b>>2]|0;if((r|0)==125){break a}else if((r|0)==59){qj(a)}else if((r|0)==44){qj(a)}else{u=25;break}if((c[b>>2]|0)==125){break a}}if((u|0)==10){r=s+12|0;t=c[(c[r>>2]|0)+52>>2]|0;w=c[(c[s>>2]|0)+64>>2]|0;if((w|0)==0){x=12360;y=hg(t,11920,(z=i,i=i+24|0,c[z>>2]=12648,c[z+8>>2]=2147483645,c[z+16>>2]=x,z)|0)|0;i=z;A=c[r>>2]|0;nj(A,y)}B=hg(t,12096,(z=i,i=i+8|0,c[z>>2]=w,z)|0)|0;i=z;x=B;y=hg(t,11920,(z=i,i=i+24|0,c[z>>2]=12648,c[z+8>>2]=2147483645,c[z+16>>2]=x,z)|0)|0;i=z;A=c[r>>2]|0;nj(A,y)}else if((u|0)==17){r=v+12|0;t=c[(c[r>>2]|0)+52>>2]|0;B=c[(c[v>>2]|0)+64>>2]|0;if((B|0)==0){C=12360;D=hg(t,11920,(z=i,i=i+24|0,c[z>>2]=12648,c[z+8>>2]=2147483645,c[z+16>>2]=C,z)|0)|0;i=z;E=c[r>>2]|0;nj(E,D)}w=hg(t,12096,(z=i,i=i+8|0,c[z>>2]=B,z)|0)|0;i=z;C=w;D=hg(t,11920,(z=i,i=i+24|0,c[z>>2]=12648,c[z+8>>2]=2147483645,c[z+16>>2]=C,z)|0)|0;i=z;E=c[r>>2]|0;nj(E,D)}else if((u|0)==25){if((c[h>>2]|0)==(j|0)){mg(a,125)}else{r=c[a+52>>2]|0;t=mj(a,125)|0;w=mj(a,123)|0;B=hg(r,7960,(z=i,i=i+24|0,c[z>>2]=t,c[z+8>>2]=w,c[z+16>>2]=j,z)|0)|0;i=z;nj(a,B)}}}}while(0);qj(a);a=c[l>>2]|0;do{if((a|0)!=0){z=c[q>>2]|0;if((z|0)==0){F=a}else if((z|0)==12|(z|0)==13){Pi(g,p,-1);ej(g,c[(c[o>>2]|0)+8>>2]|0,c[n>>2]|0,-1);c[n>>2]=(c[n>>2]|0)-1;break}else{Si(g,p);F=c[l>>2]|0}ej(g,c[(c[o>>2]|0)+8>>2]|0,c[n>>2]|0,F)}}while(0);F=g|0;g=c[(c[(c[F>>2]|0)+12>>2]|0)+(k<<2)>>2]&8388607;o=(ag(c[n>>2]|0)|0)<<23|g;c[(c[(c[F>>2]|0)+12>>2]|0)+(k<<2)>>2]=o;o=c[(c[(c[F>>2]|0)+12>>2]|0)+(k<<2)>>2]&-8372225;g=(ag(c[m>>2]|0)|0)<<14&8372224|o;c[(c[(c[F>>2]|0)+12>>2]|0)+(k<<2)>>2]=g;i=d;return}function Cg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+24|0;h=g|0;j=b+48|0;k=c[j>>2]|0;l=b+16|0;m=c[l>>2]|0;if((m|0)==123){Bg(b,h)}else if((m|0)==40){qj(b);do{if((c[l>>2]|0)==41){c[h>>2]=0}else{qg(b,h,0)|0;if((c[l>>2]|0)==44){do{qj(b);Si(c[j>>2]|0,h);qg(b,h,0)|0;}while((c[l>>2]|0)==44)}Pi(k,h,-1);if((c[l>>2]|0)==41){break}if((c[b+4>>2]|0)==(f|0)){mg(b,41)}else{n=c[b+52>>2]|0;o=mj(b,41)|0;p=mj(b,40)|0;q=hg(n,7960,(n=i,i=i+24|0,c[n>>2]=o,c[n+8>>2]=p,c[n+16>>2]=f,n)|0)|0;i=n;nj(b,q)}}}while(0);qj(b)}else if((m|0)==289){m=Ni(k,c[b+24>>2]|0)|0;c[h+16>>2]=-1;c[h+20>>2]=-1;c[h>>2]=4;c[h+8>>2]=m;qj(b)}else{nj(b,11640)}b=e+8|0;m=c[b>>2]|0;l=c[h>>2]|0;if((l|0)==12|(l|0)==13){r=0;s=Bi(k,29,m,r,2)|0;t=e+16|0;c[t>>2]=-1;u=e+20|0;c[u>>2]=-1;v=e|0;c[v>>2]=12;c[b>>2]=s;dj(k,f);w=m+1|0;x=w&255;y=k+48|0;a[y]=x;i=g;return}else if((l|0)!=0){Si(k,h)}r=(d[k+48|0]|0)-m|0;s=Bi(k,29,m,r,2)|0;t=e+16|0;c[t>>2]=-1;u=e+20|0;c[u>>2]=-1;v=e|0;c[v>>2]=12;c[b>>2]=s;dj(k,f);w=m+1|0;x=w&255;y=k+48|0;a[y]=x;i=g;return}function Dg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+48|0;f=e|0;g=e+24|0;h=b+48|0;j=c[h>>2]|0;k=j+48|0;l=a[k]|0;m=b+16|0;do{if((c[m>>2]|0)==288){n=d+28|0;if((c[n>>2]|0)<=2147483645){o=c[b+24>>2]|0;qj(b);p=Ni(c[h>>2]|0,o)|0;c[f+16>>2]=-1;c[f+20>>2]=-1;c[f>>2]=4;c[f+8>>2]=p;q=n;break}n=j+12|0;p=c[(c[n>>2]|0)+52>>2]|0;o=c[(c[j>>2]|0)+64>>2]|0;if((o|0)==0){r=12360;s=hg(p,11920,(t=i,i=i+24|0,c[t>>2]=12648,c[t+8>>2]=2147483645,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;nj(u,s)}v=hg(p,12096,(t=i,i=i+8|0,c[t>>2]=o,t)|0)|0;i=t;r=v;s=hg(p,11920,(t=i,i=i+24|0,c[t>>2]=12648,c[t+8>>2]=2147483645,c[t+16>>2]=r,t)|0)|0;i=t;u=c[n>>2]|0;nj(u,s)}else{qj(b);qg(b,f,0)|0;Vi(c[h>>2]|0,f);if((c[m>>2]|0)==93){qj(b);q=d+28|0;break}else{mg(b,93)}}}while(0);c[q>>2]=(c[q>>2]|0)+1;if((c[m>>2]|0)==61){qj(b);m=Wi(j,f)|0;qg(b,g,0)|0;f=c[(c[d+24>>2]|0)+8>>2]|0;Bi(j,10,f,m,Wi(j,g)|0)|0;a[k]=l;i=e;return}else{mg(b,61)}}function Eg(a,b){a=a|0;b=b|0;var d=0,e=0;d=a+12|0;e=a+8|0;c[e>>2]=(c[d>>2]|0)-b+(c[e>>2]|0);c[d>>2]=b;return}function Fg(a){a=a|0;var b=0,d=0,e=0;b=$f(a,0,0,40)|0;d=b;e=a+16|0;c[(c[e>>2]|0)+12>>2]=d;c[b+8>>2]=c[e>>2];c[b+12>>2]=0;return d|0}function Gg(a){a=a|0;var b=0,d=0,e=0;b=(c[a+16>>2]|0)+12|0;d=c[b>>2]|0;c[b>>2]=0;if((d|0)==0){return}else{e=d}while(1){d=c[e+12>>2]|0;$f(a,e,40,0)|0;if((d|0)==0){break}else{e=d}}return}function Hg(d){d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=d+12|0;if((c[(c[e>>2]|0)+12>>2]|0)>0){Nf(d)}f=Hf(d,8,112,0,0)|0;g=f;h=d+8|0;i=c[h>>2]|0;c[i>>2]=f;c[i+8>>2]=72;c[h>>2]=(c[h>>2]|0)+16;c[f+12>>2]=c[e>>2];e=g+28|0;c[e>>2]=0;h=f+16|0;c[h>>2]=0;i=f+32|0;c[i>>2]=0;c[f+64>>2]=0;b[f+38>>1]=0;j=f+52|0;c[j>>2]=0;k=f+40|0;a[k]=0;l=f+44|0;c[l>>2]=0;a[f+41|0]=1;m=f+48|0;c[m>>2]=0;c[f+56>>2]=0;b[f+36>>1]=1;a[f+6|0]=0;c[f+68>>2]=0;a[k]=a[d+40|0]|0;k=c[d+44>>2]|0;c[l>>2]=k;c[j>>2]=c[d+52>>2];c[m>>2]=k;k=$f(d,0,0,640)|0;c[e>>2]=k;c[i>>2]=40;d=0;m=k;do{c[m+(d<<4)+8>>2]=0;d=d+1|0;m=c[e>>2]|0}while((d|0)<40);d=f+8|0;c[f+24>>2]=m+((c[i>>2]|0)-5<<4);i=f+72|0;c[f+80>>2]=0;c[f+84>>2]=0;a[f+90|0]=0;c[i>>2]=m;c[d>>2]=m+16;c[m+8>>2]=0;c[f+76>>2]=(c[d>>2]|0)+320;c[h>>2]=i;return g|0}function Ig(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=b+28|0;zf(b,c[d>>2]|0);e=c[d>>2]|0;if((e|0)==0){f=b;g=$f(a,f,112,0)|0;return}c[b+16>>2]=b+72;h=b+84|0;i=c[h>>2]|0;c[h>>2]=0;if((i|0)==0){j=e}else{e=i;while(1){i=c[e+12>>2]|0;$f(b,e,40,0)|0;if((i|0)==0){break}else{e=i}}j=c[d>>2]|0}$f(b,j,c[b+32>>2]<<4,0)|0;f=b;g=$f(a,f,112,0)|0;return}function Jg(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+24|0;g=f|0;h=f+16|0;j=Dc[d&63](e,0,8,400)|0;if((j|0)==0){k=0;i=f;return k|0}l=j;m=j+112|0;c[j>>2]=0;a[j+4|0]=8;a[j+172|0]=33;a[j+5|0]=1;a[j+174|0]=0;c[j+12>>2]=m;c[j+28>>2]=0;c[j+16>>2]=0;c[j+32>>2]=0;c[j+64>>2]=0;b[j+38>>1]=0;c[j+52>>2]=0;a[j+40|0]=0;c[j+44>>2]=0;a[j+41|0]=1;c[j+48>>2]=0;c[j+56>>2]=0;b[j+36>>1]=1;a[j+6|0]=0;c[j+68>>2]=0;c[m>>2]=d;c[j+116>>2]=e;c[j+284>>2]=l;e=xc(0)|0;c[h>>2]=e;c[g>>2]=j;c[g+4>>2]=h;c[g+8>>2]=1224;c[g+12>>2]=34;c[j+168>>2]=Pg(g|0,16,e)|0;e=j+224|0;c[j+240>>2]=e;c[j+244>>2]=e;a[j+175|0]=0;c[j+160>>2]=0;c[j+256>>2]=0;c[j+264>>2]=0;c[j+280>>2]=0;c[j+288>>2]=0;mn(j+132|0,0,16)|0;a[j+173|0]=5;mn(j+180|0,0,40)|0;c[j+120>>2]=400;c[j+124>>2]=0;c[j+268>>2]=200;c[j+272>>2]=200;c[j+276>>2]=200;mn(j+364|0,0,36)|0;if((bf(l,38,0)|0)==0){k=l;i=f;return k|0}Mg(l);k=0;i=f;return k|0}function Kg(a){a=a|0;Mg(c[(c[a+12>>2]|0)+172>>2]|0);return}



function Lg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+16|0;e=d|0;f=c[b+12>>2]|0;g=$f(b,0,0,640)|0;h=b+28|0;c[h>>2]=g;j=b+32|0;c[j>>2]=40;k=0;l=g;do{c[l+(k<<4)+8>>2]=0;k=k+1|0;l=c[h>>2]|0}while((k|0)<40);k=b+8|0;c[b+24>>2]=l+((c[j>>2]|0)-5<<4);j=b+72|0;c[b+80>>2]=0;c[b+84>>2]=0;a[b+90|0]=0;c[j>>2]=l;c[k>>2]=l+16;c[l+8>>2]=0;c[b+76>>2]=(c[k>>2]|0)+320;c[b+16>>2]=j;j=Zg(b)|0;c[f+40>>2]=j;c[f+48>>2]=69;Vg(b,j,2,0);k=e;c[k>>2]=b;l=e+8|0;c[l>>2]=72;Wg(b,j,1,e);c[k>>2]=Zg(b)|0;c[l>>2]=69;Wg(b,j,2,e);Qg(b,32);fh(b);lj(b);e=Rg(b,8512,17)|0;c[f+180>>2]=e;b=e+5|0;a[b]=a[b]|32;a[f+63|0]=1;c[f+176>>2]=vd(0)|0;i=d;return}function Mg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;b=a+12|0;d=c[b>>2]|0;e=a+28|0;zf(a,c[e>>2]|0);Lf(a);f=c[b>>2]|0;$f(a,c[f+24>>2]|0,c[f+32>>2]<<2,0)|0;f=d+144|0;b=d+152|0;c[f>>2]=$f(a,c[f>>2]|0,c[b>>2]|0,0)|0;c[b>>2]=0;b=c[e>>2]|0;if((b|0)==0){g=d|0;h=c[g>>2]|0;i=d+4|0;j=c[i>>2]|0;k=a;l=Dc[h&63](j,k,400,0)|0;return}c[a+16>>2]=a+72;f=a+84|0;m=c[f>>2]|0;c[f>>2]=0;if((m|0)==0){n=b}else{b=m;while(1){m=c[b+12>>2]|0;$f(a,b,40,0)|0;if((m|0)==0){break}else{b=m}}n=c[e>>2]|0}$f(a,n,c[a+32>>2]<<4,0)|0;g=d|0;h=c[g>>2]|0;i=d+4|0;j=c[i>>2]|0;k=a;l=Dc[h&63](j,k,400,0)|0;return}function Ng(a,b){a=a|0;b=b|0;var d=0,e=0;d=c[a+12>>2]|0;if((a|0)==(b|0)){e=1;return e|0}if((d|0)!=(c[b+12>>2]|0)){e=0;return e|0}e=(on(a+16|0,b+16|0,d|0)|0)==0|0;return e|0}function Og(b,d){b=b|0;d=d|0;var e=0,f=0;e=a[b+4|0]|0;if(e<<24>>24!=(a[d+4|0]|0)){f=0;return f|0}if(e<<24>>24==4){f=(b|0)==(d|0)|0;return f|0}e=c[b+12>>2]|0;if((b|0)==(d|0)){f=1;return f|0}if((e|0)!=(c[d+12>>2]|0)){f=0;return f|0}f=(on(b+16|0,d+16|0,e|0)|0)==0|0;return f|0}function Pg(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0,h=0;e=c^b;c=(b>>>5)+1|0;if(c>>>0>b>>>0){f=e;return f|0}else{g=b;h=e}while(1){e=(h<<5)+(h>>>2)+(d[a+(g-1)|0]|0)^h;b=g-c|0;if(b>>>0<c>>>0){f=e;break}else{g=b;h=e}}return f|0}function Qg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=c[b+12>>2]|0;f=e+24|0;Kf(b,-5);g=e+32|0;e=c[g>>2]|0;do{if((e|0)<(d|0)){if((d+1|0)>>>0>1073741823>>>0){_f(b)}h=f|0;i=$f(b,c[h>>2]|0,e<<2,d<<2)|0;c[h>>2]=i;j=c[g>>2]|0;if((j|0)<(d|0)){k=j;l=i}else{m=j;break}while(1){c[l+(k<<2)>>2]=0;j=k+1|0;if((j|0)>=(d|0)){break}k=j;l=c[h>>2]|0}m=c[g>>2]|0}else{m=e}}while(0);if((m|0)>0){e=f|0;l=d-1|0;k=0;while(1){h=(c[e>>2]|0)+(k<<2)|0;j=c[h>>2]|0;c[h>>2]=0;if((j|0)!=0){h=j;while(1){j=h|0;i=c[j>>2]|0;n=c[h+8>>2]&l;c[j>>2]=c[(c[e>>2]|0)+(n<<2)>>2];c[(c[e>>2]|0)+(n<<2)>>2]=h;n=h+5|0;a[n]=a[n]&-65;if((i|0)==0){break}else{h=i}}}h=k+1|0;i=c[g>>2]|0;if((h|0)<(i|0)){k=h}else{o=i;break}}}else{o=m}if((o|0)<=(d|0)){c[g>>2]=d;return}if((d+1|0)>>>0>1073741823>>>0){_f(b)}m=f|0;c[m>>2]=$f(b,c[m>>2]|0,o<<2,d<<2)|0;c[g>>2]=d;return}function Rg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;if(f>>>0>=41>>>0){if((f+1|0)>>>0>4294967277>>>0){_f(b);return 0}g=c[(c[b+12>>2]|0)+56>>2]|0;h=Hf(b,20,f+17|0,0,0)|0;c[h+12>>2]=f;c[h+8>>2]=g;a[h+6|0]=0;g=h+16|0;nn(g|0,e|0,f)|0;a[g+f|0]=0;i=h;return i|0}h=c[b+12>>2]|0;g=c[h+56>>2]^f;j=(f>>>5)+1|0;if(j>>>0>f>>>0){k=g}else{l=f;m=g;while(1){g=(m<<5)+(m>>>2)+(d[e+(l-1)|0]|0)^m;n=l-j|0;if(n>>>0<j>>>0){k=g;break}else{l=n;m=g}}}m=h+32|0;l=c[m>>2]|0;j=h+24|0;g=c[j>>2]|0;n=c[g+((l-1&k)<<2)>>2]|0;a:do{if((n|0)!=0){o=n;b:while(1){p=o;do{if((k|0)==(c[o+8>>2]|0)){if((c[o+12>>2]|0)!=(f|0)){break}if((on(e|0,o+16|0,f|0)|0)==0){break b}}}while(0);q=c[o>>2]|0;if((q|0)==0){break a}else{o=q}}q=o+5|0;r=(d[q]|0)^3;if((((d[h+60|0]|0)^3)&r|0)!=0){i=p;return i|0}a[q]=r;i=p;return i|0}}while(0);p=h+28|0;if((c[p>>2]|0)>>>0>=l>>>0&(l|0)<1073741823){Qg(b,l<<1);s=c[m>>2]|0;t=c[j>>2]|0}else{s=l;t=g}g=Hf(b,4,f+17|0,t+((s-1&k)<<2)|0,0)|0;c[g+12>>2]=f;c[g+8>>2]=k;a[g+6|0]=0;k=g+16|0;nn(k|0,e|0,f)|0;a[k+f|0]=0;c[p>>2]=(c[p>>2]|0)+1;i=g;return i|0}function Sg(a,b){a=a|0;b=b|0;return Rg(a,b,jn(b|0)|0)|0}function Tg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if(b>>>0>4294967269>>>0){_f(a);return 0}else{e=Hf(a,7,b+24|0,0,0)|0;c[e+16>>2]=b;c[e+8>>2]=0;c[e+12>>2]=d;return e|0}return 0}function Ug(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+8|0;g=f|0;j=e+8|0;k=c[j>>2]|0;a:do{if((k|0)==0){l=-1;m=c[b+28>>2]|0}else{do{if((k|0)==3){n=+h[e>>3];h[g>>3]=n+6755399441055744.0;o=c[g>>2]|0;if(+(o|0)!=n){break}if((o|0)<=0){break}p=c[b+28>>2]|0;if((o|0)>(p|0)){break}l=o-1|0;m=p;break a}}while(0);p=e;o=eh(b,e)|0;b:while(1){q=o+16|0;r=o+24|0;s=c[r>>2]|0;if((s|0)==(c[j>>2]|0)){if((sh(0,q,e)|0)!=0){t=15;break}u=c[r>>2]|0}else{u=s}do{if((u|0)==11){if((c[j>>2]&64|0)==0){break}if((c[q>>2]|0)==(c[p>>2]|0)){t=15;break b}}}while(0);q=c[o+28>>2]|0;if((q|0)==0){t=18;break}else{o=q}}if((t|0)==15){p=c[b+28>>2]|0;l=(o-(c[b+16>>2]|0)>>5)+p|0;m=p;break}else if((t|0)==18){Ve(a,6944,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0);i=p;return 0}}}while(0);a=b+12|0;u=l;while(1){v=u+1|0;if((v|0)>=(m|0)){break}if((c[(c[a>>2]|0)+(v<<4)+8>>2]|0)==0){u=v}else{t=21;break}}if((t|0)==21){h[e>>3]=+(u+2|0);c[j>>2]=3;u=c[a>>2]|0;a=u+(v<<4)|0;l=e+16|0;g=c[a+4>>2]|0;c[l>>2]=c[a>>2];c[l+4>>2]=g;c[e+24>>2]=c[u+(v<<4)+8>>2];w=1;i=f;return w|0}u=v-m|0;m=1<<(d[b+7|0]|0);if((u|0)>=(m|0)){w=0;i=f;return w|0}v=b+16|0;b=c[v>>2]|0;g=u;while(1){u=g+1|0;if((c[b+(g<<5)+8>>2]|0)!=0){break}if((u|0)<(m|0)){g=u}else{w=0;t=27;break}}if((t|0)==27){i=f;return w|0}t=b+(g<<5)+16|0;m=e;u=c[t+4>>2]|0;c[m>>2]=c[t>>2];c[m+4>>2]=u;c[j>>2]=c[b+(g<<5)+24>>2];b=c[v>>2]|0;v=b+(g<<5)|0;j=e+16|0;u=c[v+4>>2]|0;c[j>>2]=c[v>>2];c[j+4>>2]=u;c[e+24>>2]=c[b+(g<<5)+8>>2];w=1;i=f;return w|0}function Vg(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0.0,J=0,K=0,L=0,M=0;j=i;i=i+24|0;k=j|0;l=j+8|0;m=e+28|0;n=c[m>>2]|0;o=e+7|0;p=a[o]|0;q=p&255;r=e+16|0;s=c[r>>2]|0;if((n|0)<(f|0)){if((f+1|0)>>>0>268435455>>>0){_f(b)}t=e+12|0;u=$f(b,c[t>>2]|0,n<<4,f<<4)|0;c[t>>2]=u;v=c[m>>2]|0;do{if((v|0)<(f|0)){c[u+(v<<4)+8>>2]=0;w=v+1|0;if((w|0)<(f|0)){x=w}else{break}do{c[(c[t>>2]|0)+(x<<4)+8>>2]=0;x=x+1|0;}while((x|0)<(f|0))}}while(0);c[m>>2]=f}if((g|0)==0){c[r>>2]=1880;y=0;z=0;A=1880}else{x=cg(g)|0;if((x|0)>30){Ve(b,9120,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0);i=g}g=1<<x;if((g+1|0)>>>0>134217727>>>0){_f(b)}t=$f(b,0,0,g<<5)|0;c[r>>2]=t;v=0;u=t;do{c[u+(v<<5)+28>>2]=0;c[u+(v<<5)+24>>2]=0;c[u+(v<<5)+8>>2]=0;v=v+1|0;u=c[r>>2]|0}while((v|0)<(g|0));y=g;z=x&255;A=u}a[o]=z;c[e+20>>2]=A+(y<<5);do{if((n|0)>(f|0)){c[m>>2]=f;y=e+12|0;A=l|0;z=l+8|0;u=k;x=k+4|0;g=f;while(1){v=c[y>>2]|0;t=v+(g<<4)+8|0;if((c[t>>2]|0)==0){B=g+1|0}else{w=v+(g<<4)|0;v=g+1|0;a:do{if(g>>>0<(c[m>>2]|0)>>>0){C=w;D=29}else{E=+(v|0);h[k>>3]=E+1.0;F=(c[x>>2]|0)+(c[u>>2]|0)|0;if((F|0)<0){G=-F|0;H=(F|0)==(G|0)?0:G}else{H=F}F=(c[r>>2]|0)+(((H|0)%((1<<(d[o]|0))-1|1|0)|0)<<5)|0;while(1){if((c[F+24>>2]|0)==3){if(+h[F+16>>3]==E){break}}G=c[F+28>>2]|0;if((G|0)==0){I=E;D=31;break a}else{F=G}}C=F|0;D=29}}while(0);do{if((D|0)==29){D=0;if((C|0)!=1224){J=C;break}I=+(v|0);D=31}}while(0);if((D|0)==31){D=0;h[A>>3]=I;c[z>>2]=3;J=$g(b,e,l)|0}G=w;K=J;L=c[G+4>>2]|0;c[K>>2]=c[G>>2];c[K+4>>2]=L;c[J+8>>2]=c[t>>2];B=v}if((B|0)<(n|0)){g=B}else{break}}if((f+1|0)>>>0>268435455>>>0){_f(b)}else{g=e+12|0;c[g>>2]=$f(b,c[g>>2]|0,n<<4,f<<4)|0;break}}}while(0);f=1<<q;if(p<<24>>24!=31){p=f;do{p=p-1|0;q=s+(p<<5)+8|0;if((c[q>>2]|0)!=0){n=s+(p<<5)+16|0;B=ch(e,n)|0;if((B|0)==1224){M=$g(b,e,n)|0}else{M=B}B=s+(p<<5)|0;n=M;J=c[B+4>>2]|0;c[n>>2]=c[B>>2];c[n+4>>2]=J;c[M+8>>2]=c[q>>2]}}while((p|0)>0)}if((s|0)==1880){i=j;return}$f(b,s,f<<5,0)|0;i=j;return}function Wg(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0,q=0,r=0,s=0.0,t=0;g=i;i=i+24|0;j=g|0;k=g+8|0;l=e-1|0;a:do{if(l>>>0<(c[b+28>>2]|0)>>>0){m=(c[b+12>>2]|0)+(l<<4)|0;n=10}else{o=+(e|0);h[j>>3]=o+1.0;p=(c[j+4>>2]|0)+(c[j>>2]|0)|0;if((p|0)<0){q=-p|0;r=(p|0)==(q|0)?0:q}else{r=p}p=(c[b+16>>2]|0)+(((r|0)%((1<<(d[b+7|0]|0))-1|1|0)|0)<<5)|0;while(1){if((c[p+24>>2]|0)==3){if(+h[p+16>>3]==o){break}}q=c[p+28>>2]|0;if((q|0)==0){s=o;n=12;break a}else{p=q}}m=p|0;n=10}}while(0);do{if((n|0)==10){if((m|0)!=1224){t=m;break}s=+(e|0);n=12}}while(0);if((n|0)==12){h[k>>3]=s;c[k+8>>2]=3;t=$g(a,b,k)|0}k=f;b=t;a=c[k+4>>2]|0;c[b>>2]=c[k>>2];c[b+4>>2]=a;c[t+8>>2]=c[f+8>>2];i=g;return}function Xg(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=ch(b,c)|0;if((d|0)!=1224){e=d;return e|0}e=$g(a,b,c)|0;return e|0}function Yg(a,b,e){a=a|0;b=b|0;e=e|0;var f=0;if((c[b+16>>2]|0)==1880){f=0}else{f=1<<(d[b+7|0]|0)}Vg(a,b,e,f);return}function Zg(b){b=b|0;var d=0;d=Hf(b,5,32,0,0)|0;b=d;c[d+8>>2]=0;a[d+6|0]=-1;c[d+12>>2]=0;c[b+28>>2]=0;c[d+16>>2]=1880;a[b+7|0]=0;c[b+20>>2]=1880;return b|0}function _g(a,b){a=a|0;b=b|0;var e=0;e=c[b+16>>2]|0;if((e|0)!=1880){$f(a,e,32<<(d[b+7|0]|0),0)|0}$f(a,c[b+12>>2]|0,c[b+28>>2]<<4,0)|0;$f(a,b,32,0)|0;return}function $g(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;g=i;i=i+144|0;j=g|0;k=g+8|0;l=g+16|0;m=l;n=f+8|0;o=c[n>>2]|0;if((o|0)==0){Ve(b,8e3,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0);i=p;return 0}else if((o|0)==3){q=3}do{if((q|0)==3){r=+h[f>>3];if(r==r&!(F=0.0,F!=F)){break}Ve(b,12808,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0);i=p;return 0}}while(0);p=eh(e,f)|0;o=p+8|0;do{if((c[o>>2]|0)!=0|(p|0)==1880){s=e+20|0;t=e+16|0;u=c[t>>2]|0;v=c[s>>2]|0;while(1){if(v>>>0<=u>>>0){break}w=v-32|0;c[s>>2]=w;if((c[v-32+24>>2]|0)==0){q=37;break}else{v=w}}if((q|0)==37){s=eh(e,p+16|0)|0;if((s|0)==(p|0)){u=p+28|0;c[v-32+28>>2]=c[u>>2];c[u>>2]=w;x=w;break}else{y=s}do{z=y+28|0;y=c[z>>2]|0;}while((y|0)!=(p|0));c[z>>2]=w;v=w;s=p;c[v>>2]=c[s>>2];c[v+4>>2]=c[s+4>>2];c[v+8>>2]=c[s+8>>2];c[v+12>>2]=c[s+12>>2];c[v+16>>2]=c[s+16>>2];c[v+20>>2]=c[s+20>>2];c[v+24>>2]=c[s+24>>2];c[v+28>>2]=c[s+28>>2];c[p+28>>2]=0;c[o>>2]=0;x=p;break}mn(m|0,0,124)|0;s=e+12|0;v=c[e+28>>2]|0;u=0;A=1;B=0;C=1;while(1){if((A|0)>(v|0)){if((C|0)>(v|0)){D=B;break}else{E=v}}else{E=A}if((C|0)>(E|0)){G=C;H=0}else{I=c[s>>2]|0;J=C;K=0;while(1){L=((c[I+(J-1<<4)+8>>2]|0)!=0)+K|0;if((J|0)<(E|0)){J=J+1|0;K=L}else{break}}G=E+1|0;H=L}K=l+(u<<2)|0;c[K>>2]=(c[K>>2]|0)+H;K=H+B|0;J=u+1|0;if((J|0)<31){u=J;A=A<<1;B=K;C=G}else{D=K;break}}C=k;B=0;A=1<<(d[e+7|0]|0);u=0;a:while(1){s=A;while(1){M=s-1|0;if((s|0)==0){break a}N=c[t>>2]|0;if((c[N+(M<<5)+8>>2]|0)==0){s=M}else{break}}do{if((c[N+(M<<5)+24>>2]|0)==3){r=+h[N+(M<<5)+16>>3];h[k>>3]=r+6755399441055744.0;s=c[C>>2]|0;if(+(s|0)!=r){O=0;break}if((s-1|0)>>>0>=1073741824>>>0){O=0;break}v=l+((cg(s)|0)<<2)|0;c[v>>2]=(c[v>>2]|0)+1;O=1}else{O=0}}while(0);B=B+1|0;A=M;u=O+u|0}A=u+D|0;do{if((c[n>>2]|0)==3){r=+h[f>>3];h[j>>3]=r+6755399441055744.0;C=c[j>>2]|0;if(+(C|0)!=r){P=0;break}if((C-1|0)>>>0>=1073741824>>>0){P=0;break}t=l+((cg(C)|0)<<2)|0;c[t>>2]=(c[t>>2]|0)+1;P=1}else{P=0}}while(0);u=A+P|0;b:do{if((u|0)>0){t=0;C=1;v=0;s=0;K=0;J=0;while(1){I=c[l+(t<<2)>>2]|0;if((I|0)>0){Q=I+v|0;I=(Q|0)>(J|0);R=I?C:K;S=I?Q:s;T=Q}else{R=K;S=s;T=v}if((T|0)==(u|0)){U=R;V=S;break b}Q=C<<1;I=(Q|0)/2|0;if((I|0)<(u|0)){t=t+1|0;C=Q;v=T;s=S;K=R;J=I}else{U=R;V=S;break}}}else{U=0;V=0}}while(0);Vg(b,e,U,D+1+B-V|0);u=ch(e,f)|0;if((u|0)!=1224){W=u;i=g;return W|0}W=$g(b,e,f)|0;i=g;return W|0}else{x=p}}while(0);p=f;V=x+16|0;D=c[p+4>>2]|0;c[V>>2]=c[p>>2];c[V+4>>2]=D;c[x+24>>2]=c[n>>2];do{if((c[n>>2]&64|0)!=0){if((a[(c[f>>2]|0)+5|0]&3)==0){break}if((a[e+5|0]&4)==0){break}Ef(b,e)}}while(0);W=x|0;i=g;return W|0}function ah(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0.0,l=0,m=0;e=i;i=i+8|0;f=e|0;g=b-1|0;if(g>>>0<(c[a+28>>2]|0)>>>0){j=(c[a+12>>2]|0)+(g<<4)|0;i=e;return j|0}k=+(b|0);h[f>>3]=k+1.0;b=(c[f+4>>2]|0)+(c[f>>2]|0)|0;if((b|0)<0){f=-b|0;l=(b|0)==(f|0)?0:f}else{l=b}b=(c[a+16>>2]|0)+(((l|0)%((1<<(d[a+7|0]|0))-1|1|0)|0)<<5)|0;while(1){if((c[b+24>>2]|0)==3){if(+h[b+16>>3]==k){break}}a=c[b+28>>2]|0;if((a|0)==0){j=1224;m=10;break}else{b=a}}if((m|0)==10){i=e;return j|0}j=b|0;i=e;return j|0}function bh(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;e=(c[a+16>>2]|0)+(((1<<(d[a+7|0]|0))-1&c[b+8>>2])<<5)|0;while(1){if((c[e+24>>2]|0)==68){if((c[e+16>>2]|0)==(b|0)){break}}a=c[e+28>>2]|0;if((a|0)==0){f=1224;g=6;break}else{e=a}}if((g|0)==6){return f|0}f=e|0;return f|0}function ch(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0.0,s=0;e=i;i=i+16|0;f=e|0;g=e+8|0;j=b+8|0;k=c[j>>2]&63;do{if((k|0)==4){l=c[b>>2]|0;m=(c[a+16>>2]|0)+(((1<<(d[a+7|0]|0))-1&c[l+8>>2])<<5)|0;while(1){if((c[m+24>>2]|0)==68){if((c[m+16>>2]|0)==(l|0)){break}}n=c[m+28>>2]|0;if((n|0)==0){o=1224;p=22;break}else{m=n}}if((p|0)==22){i=e;return o|0}o=m|0;i=e;return o|0}else if((k|0)==3){q=+h[b>>3];h[g>>3]=q+6755399441055744.0;l=c[g>>2]|0;r=+(l|0);if(r!=q){break}n=l-1|0;if(n>>>0<(c[a+28>>2]|0)>>>0){o=(c[a+12>>2]|0)+(n<<4)|0;i=e;return o|0}h[f>>3]=r+1.0;n=(c[f+4>>2]|0)+(c[f>>2]|0)|0;if((n|0)<0){l=-n|0;s=(n|0)==(l|0)?0:l}else{s=n}n=(c[a+16>>2]|0)+(((s|0)%((1<<(d[a+7|0]|0))-1|1|0)|0)<<5)|0;while(1){if((c[n+24>>2]|0)==3){if(+h[n+16>>3]==r){break}}l=c[n+28>>2]|0;if((l|0)==0){o=1224;p=22;break}else{n=l}}if((p|0)==22){i=e;return o|0}o=n|0;i=e;return o|0}else if((k|0)==0){o=1224;i=e;return o|0}}while(0);k=eh(a,b)|0;while(1){if((c[k+24>>2]|0)==(c[j>>2]|0)){if((sh(0,k+16|0,b)|0)!=0){break}}a=c[k+28>>2]|0;if((a|0)==0){o=1224;p=22;break}else{k=a}}if((p|0)==22){i=e;return o|0}o=k|0;i=e;return o|0}function dh(a){a=a|0;var b=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=i;i=i+24|0;e=b|0;f=b+8|0;g=b+16|0;j=a+28|0;k=c[j>>2]|0;do{if((k|0)!=0){l=c[a+12>>2]|0;if((c[l+(k-1<<4)+8>>2]|0)!=0){break}if(k>>>0>1>>>0){m=k;n=0}else{o=0;i=b;return o|0}while(1){p=(n+m|0)>>>1;q=(c[l+(p-1<<4)+8>>2]|0)==0;r=q?p:m;s=q?n:p;if((r-s|0)>>>0>1>>>0){m=r;n=s}else{o=s;break}}i=b;return o|0}}while(0);n=a+16|0;if((c[n>>2]|0)==1880){o=k;i=b;return o|0}m=a+12|0;l=a+7|0;a=g;s=g+4|0;r=k;p=k+1|0;q=k;while(1){k=p-1|0;a:do{if(k>>>0<q>>>0){t=(c[m>>2]|0)+(k<<4)|0}else{u=+(p|0);h[g>>3]=u+1.0;v=(c[s>>2]|0)+(c[a>>2]|0)|0;if((v|0)<0){w=-v|0;x=(v|0)==(w|0)?0:w}else{x=v}v=(c[n>>2]|0)+(((x|0)%((1<<(d[l]|0))-1|1|0)|0)<<5)|0;while(1){if((c[v+24>>2]|0)==3){if(+h[v+16>>3]==u){break}}w=c[v+28>>2]|0;if((w|0)==0){t=1224;break a}else{v=w}}t=v|0}}while(0);if((c[t+8>>2]|0)==0){break}k=p<<1;if(k>>>0>2147483645>>>0){y=21;break}r=p;p=k;q=c[j>>2]|0}if((y|0)==21){y=e;q=e+4|0;t=1;while(1){x=t-1|0;b:do{if(x>>>0<(c[j>>2]|0)>>>0){z=(c[m>>2]|0)+(x<<4)|0}else{u=+(t|0);h[e>>3]=u+1.0;a=(c[q>>2]|0)+(c[y>>2]|0)|0;if((a|0)<0){s=-a|0;A=(a|0)==(s|0)?0:s}else{A=a}a=(c[n>>2]|0)+(((A|0)%((1<<(d[l]|0))-1|1|0)|0)<<5)|0;while(1){if((c[a+24>>2]|0)==3){if(+h[a+16>>3]==u){break}}s=c[a+28>>2]|0;if((s|0)==0){z=1224;break b}else{a=s}}z=a|0}}while(0);if((c[z+8>>2]|0)==0){o=x;break}else{t=t+1|0}}i=b;return o|0}if((p-r|0)>>>0<=1>>>0){o=r;i=b;return o|0}t=f;z=f+4|0;A=p;p=r;while(1){r=(A+p|0)>>>1;y=r-1|0;c:do{if(y>>>0<(c[j>>2]|0)>>>0){B=(c[m>>2]|0)+(y<<4)|0}else{u=+(r|0);h[f>>3]=u+1.0;q=(c[z>>2]|0)+(c[t>>2]|0)|0;if((q|0)<0){e=-q|0;C=(q|0)==(e|0)?0:e}else{C=q}q=(c[n>>2]|0)+(((C|0)%((1<<(d[l]|0))-1|1|0)|0)<<5)|0;while(1){if((c[q+24>>2]|0)==3){if(+h[q+16>>3]==u){break}}e=c[q+28>>2]|0;if((e|0)==0){B=1224;break c}else{q=e}}B=q|0}}while(0);y=(c[B+8>>2]|0)==0;x=y?r:A;a=y?p:r;if((x-a|0)>>>0>1>>>0){A=x;p=a}else{o=a;break}}i=b;return o|0}function eh(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+8|0;g=f|0;switch(c[e+8>>2]&63|0){case 4:{j=(c[b+16>>2]|0)+(((1<<d[b+7|0])-1&c[(c[e>>2]|0)+8>>2])<<5)|0;i=f;return j|0};case 20:{k=e;l=c[k>>2]|0;m=l+6|0;if((a[m]|0)==0){n=l+8|0;c[n>>2]=Pg(l+16|0,c[l+12>>2]|0,c[n>>2]|0)|0;a[m]=1;o=c[k>>2]|0}else{o=l}j=(c[b+16>>2]|0)+(((1<<d[b+7|0])-1&c[o+8>>2])<<5)|0;i=f;return j|0};case 1:{j=(c[b+16>>2]|0)+(((1<<d[b+7|0])-1&c[e>>2])<<5)|0;i=f;return j|0};case 22:{j=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])-1|1)>>>0)|0)<<5)|0;i=f;return j|0};case 3:{h[g>>3]=+h[e>>3]+1.0;o=(c[g+4>>2]|0)+(c[g>>2]|0)|0;if((o|0)<0){g=-o|0;p=(o|0)==(g|0)?0:g}else{p=o}j=(c[b+16>>2]|0)+(((p|0)%((1<<d[b+7|0])-1|1|0)|0)<<5)|0;i=f;return j|0};case 2:{j=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])-1|1)>>>0)|0)<<5)|0;i=f;return j|0};default:{j=(c[b+16>>2]|0)+((((c[e>>2]|0)>>>0)%(((1<<d[b+7|0])-1|1)>>>0)|0)<<5)|0;i=f;return j|0}}return 0}function fh(b){b=b|0;var d=0,e=0,f=0;d=b+12|0;e=0;do{f=Sg(b,c[1112+(e<<2)>>2]|0)|0;c[(c[d>>2]|0)+184+(e<<2)>>2]=f;f=(c[(c[d>>2]|0)+184+(e<<2)>>2]|0)+5|0;a[f]=a[f]|32;e=e+1|0;}while((e|0)<17);return}function gh(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;g=bh(b,f)|0;if((c[g+8>>2]|0)!=0){h=g;return h|0}g=b+6|0;a[g]=d[g]|0|1<<e;h=0;return h|0}function hh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=c[b+8>>2]&15;if((e|0)==5){f=c[(c[b>>2]|0)+8>>2]|0}else if((e|0)==7){f=c[(c[b>>2]|0)+8>>2]|0}else{f=c[(c[a+12>>2]|0)+252+(e<<2)>>2]|0}if((f|0)==0){g=1224;return g|0}g=bh(f,c[(c[a+12>>2]|0)+184+(d<<2)>>2]|0)|0;return g|0}function ih(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+64|0;h=g|0;j=g+24|0;k=g+48|0;l=a[f]|0;if((l<<24>>24|0)==64|(l<<24>>24|0)==61){c[k+12>>2]=f+1}else if((l<<24>>24|0)==27){c[k+12>>2]=12632}else{c[k+12>>2]=f}c[k>>2]=b;c[k+4>>2]=d;c[k+8>>2]=e;e=h|0;f=j|0;c[h>>2]=1635077147;a[h+4|0]=82;a[h+5|0]=0;a[h+6|0]=1;a[h+7|0]=4;a[h+8|0]=4;a[h+9|0]=4;a[h+10|0]=8;l=h+12|0;a[h+11|0]=0;a[l]=a[5328]|0;a[l+1|0]=a[5329]|0;a[l+2|0]=a[5330]|0;a[l+3|0]=a[5331]|0;a[l+4|0]=a[5332]|0;a[l+5|0]=a[5333]|0;a[f]=27;if((Ah(d,j+1|0,17)|0)!=0){kh(k,4168);return 0}if((on(e|0,f|0,18)|0)==0){j=vf(b,1)|0;d=b+8|0;l=c[d>>2]|0;c[l>>2]=j;c[l+8>>2]=70;l=(c[d>>2]|0)+16|0;c[d>>2]=l;if(((c[b+24>>2]|0)-l|0)<16){df(b,0)}l=Af(b)|0;h=j+12|0;c[h>>2]=l;lh(k,l);l=c[h>>2]|0;h=c[l+40>>2]|0;if((h|0)==1){m=j;i=g;return m|0}j=vf(b,h)|0;c[j+12>>2]=l;l=c[d>>2]|0;c[l-16>>2]=j;c[l-16+8>>2]=70;m=j;i=g;return m|0}if((on(e|0,f|0,4)|0)!=0){kh(k,2984);return 0}if((on(e|0,f|0,6)|0)!=0){kh(k,2608);return 0}if((on(e|0,f|0,12)|0)==0){kh(k,3440);return 0}else{kh(k,13616);return 0}return 0}function jh(b){b=b|0;var c=0;c=b;y=1635077147;a[c]=y;y=y>>8;a[c+1|0]=y;y=y>>8;a[c+2|0]=y;y=y>>8;a[c+3|0]=y;a[b+4|0]=82;a[b+5|0]=0;a[b+6|0]=1;a[b+7|0]=4;a[b+8|0]=4;a[b+9|0]=4;a[b+10|0]=8;c=b+12|0;a[b+11|0]=0;a[c]=a[5328]|0;a[c+1|0]=a[5329]|0;a[c+2|0]=a[5330]|0;a[c+3|0]=a[5331]|0;a[c+4|0]=a[5332]|0;a[c+5|0]=a[5333]|0;return}function kh(a,b){a=a|0;b=b|0;var d=0,e=0;d=a|0;hg(c[d>>2]|0,3832,(e=i,i=i+16|0,c[e>>2]=c[a+12>>2],c[e+8>>2]=b,e)|0)|0;i=e;af(c[d>>2]|0,3)}function lh(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;f=i;i=i+184|0;g=f|0;j=f+8|0;k=f+16|0;l=f+24|0;m=f+32|0;n=f+40|0;o=f+48|0;p=f+56|0;q=f+64|0;r=f+72|0;s=f+80|0;t=f+88|0;u=f+96|0;v=f+104|0;w=f+112|0;x=f+120|0;y=f+128|0;z=f+136|0;A=f+144|0;B=f+152|0;C=f+160|0;D=f+168|0;E=f+176|0;F=b+4|0;if((Ah(c[F>>2]|0,w,4)|0)!=0){kh(b,4168)}G=c[w>>2]|0;if((G|0)<0){kh(b,3440)}c[e+64>>2]=G;if((Ah(c[F>>2]|0,v,4)|0)!=0){kh(b,4168)}G=c[v>>2]|0;if((G|0)<0){kh(b,3440)}c[e+68>>2]=G;if((Ah(c[F>>2]|0,u,1)|0)!=0){kh(b,4168)}a[e+76|0]=a[u]|0;if((Ah(c[F>>2]|0,t,1)|0)!=0){kh(b,4168)}a[e+77|0]=a[t]|0;if((Ah(c[F>>2]|0,s,1)|0)!=0){kh(b,4168)}a[e+78|0]=a[s]|0;if((Ah(c[F>>2]|0,r,4)|0)!=0){kh(b,4168)}s=c[r>>2]|0;if((s|0)<0){kh(b,3440)}r=b|0;t=c[r>>2]|0;if((s+1|0)>>>0>1073741823>>>0){_f(t)}u=s<<2;G=$f(t,0,0,u)|0;c[e+12>>2]=G;c[e+48>>2]=s;if((Ah(c[F>>2]|0,G,u)|0)!=0){kh(b,4168)}if((Ah(c[F>>2]|0,n,4)|0)!=0){kh(b,4168)}u=c[n>>2]|0;if((u|0)<0){kh(b,3440)}n=c[r>>2]|0;if((u+1|0)>>>0>268435455>>>0){_f(n)}G=$f(n,0,0,u<<4)|0;n=e+8|0;c[n>>2]=G;c[e+44>>2]=u;s=(u|0)>0;a:do{if(s){t=0;v=G;while(1){c[v+(t<<4)+8>>2]=0;w=t+1|0;if((w|0)>=(u|0)){break}t=w;v=c[n>>2]|0}if(!s){break}v=k;t=j;w=b+8|0;H=0;while(1){I=c[n>>2]|0;J=I+(H<<4)|0;if((Ah(c[F>>2]|0,m,1)|0)!=0){K=35;break}L=a[m]|0;if((L|0)==1){if((Ah(c[F>>2]|0,l,1)|0)!=0){K=39;break}c[J>>2]=a[l]|0;c[I+(H<<4)+8>>2]=1}else if((L|0)==3){if((Ah(c[F>>2]|0,v,8)|0)!=0){K=42;break}h[J>>3]=+h[k>>3];c[I+(H<<4)+8>>2]=3}else if((L|0)==4){if((Ah(c[F>>2]|0,t,4)|0)!=0){K=45;break}M=c[j>>2]|0;if((M|0)==0){N=0}else{O=Bh(c[r>>2]|0,c[w>>2]|0,M)|0;if((Ah(c[F>>2]|0,O,c[j>>2]|0)|0)!=0){K=48;break}N=Rg(c[r>>2]|0,O,(c[j>>2]|0)-1|0)|0}c[J>>2]=N;c[I+(H<<4)+8>>2]=d[N+4|0]|64}else if((L|0)==0){c[I+(H<<4)+8>>2]=0}H=H+1|0;if((H|0)>=(u|0)){break a}}if((K|0)==35){kh(b,4168)}else if((K|0)==39){kh(b,4168)}else if((K|0)==42){kh(b,4168)}else if((K|0)==45){kh(b,4168)}else if((K|0)==48){kh(b,4168)}}}while(0);if((Ah(c[F>>2]|0,g,4)|0)!=0){kh(b,4168)}u=c[g>>2]|0;if((u|0)<0){kh(b,3440)}g=c[r>>2]|0;if((u+1|0)>>>0>1073741823>>>0){_f(g)}N=$f(g,0,0,u<<2)|0;g=e+16|0;c[g>>2]=N;c[e+56>>2]=u;j=(u|0)>0;do{if(j){k=0;l=N;while(1){c[l+(k<<2)>>2]=0;m=k+1|0;if((m|0)>=(u|0)){break}k=m;l=c[g>>2]|0}if(j){P=0}else{break}do{l=Af(c[r>>2]|0)|0;c[(c[g>>2]|0)+(P<<2)>>2]=l;lh(b,c[(c[g>>2]|0)+(P<<2)>>2]|0);P=P+1|0;}while((P|0)<(u|0))}}while(0);if((Ah(c[F>>2]|0,q,4)|0)!=0){kh(b,4168)}u=c[q>>2]|0;if((u|0)<0){kh(b,3440)}q=c[r>>2]|0;if((u+1|0)>>>0>536870911>>>0){_f(q)}P=$f(q,0,0,u<<3)|0;q=e+28|0;c[q>>2]=P;c[e+40>>2]=u;b:do{if((u|0)>0){c[P>>2]=0;if((u|0)>1){g=1;while(1){c[(c[q>>2]|0)+(g<<3)>>2]=0;j=g+1|0;if((j|0)<(u|0)){g=j}else{Q=0;break}}}else{Q=0}while(1){if((Ah(c[F>>2]|0,p,1)|0)!=0){K=73;break}a[(c[q>>2]|0)+(Q<<3)+4|0]=a[p]|0;if((Ah(c[F>>2]|0,o,1)|0)!=0){K=75;break}a[(c[q>>2]|0)+(Q<<3)+5|0]=a[o]|0;Q=Q+1|0;if((Q|0)>=(u|0)){break b}}if((K|0)==73){kh(b,4168)}else if((K|0)==75){kh(b,4168)}}}while(0);if((Ah(c[F>>2]|0,E,4)|0)!=0){kh(b,4168)}u=c[E>>2]|0;do{if((u|0)==0){R=0}else{Q=Bh(c[r>>2]|0,c[b+8>>2]|0,u)|0;if((Ah(c[F>>2]|0,Q,c[E>>2]|0)|0)==0){R=Rg(c[r>>2]|0,Q,(c[E>>2]|0)-1|0)|0;break}else{kh(b,4168)}}}while(0);c[e+36>>2]=R;if((Ah(c[F>>2]|0,D,4)|0)!=0){kh(b,4168)}R=c[D>>2]|0;if((R|0)<0){kh(b,3440)}D=c[r>>2]|0;if((R+1|0)>>>0>1073741823>>>0){_f(D)}E=R<<2;u=$f(D,0,0,E)|0;c[e+20>>2]=u;c[e+52>>2]=R;if((Ah(c[F>>2]|0,u,E)|0)!=0){kh(b,4168)}if((Ah(c[F>>2]|0,C,4)|0)!=0){kh(b,4168)}E=c[C>>2]|0;if((E|0)<0){kh(b,3440)}C=c[r>>2]|0;if((E+1|0)>>>0>357913941>>>0){_f(C)}u=$f(C,0,0,E*12|0)|0;C=e+24|0;c[C>>2]=u;c[e+60>>2]=E;c:do{if((E|0)>0){c[u>>2]=0;if((E|0)>1){e=1;do{c[(c[C>>2]|0)+(e*12|0)>>2]=0;e=e+1|0;}while((e|0)<(E|0))}e=B;R=A;D=z;Q=b+8|0;o=0;while(1){if((Ah(c[F>>2]|0,e,4)|0)!=0){K=102;break}p=c[B>>2]|0;if((p|0)==0){S=0}else{P=Bh(c[r>>2]|0,c[Q>>2]|0,p)|0;if((Ah(c[F>>2]|0,P,c[B>>2]|0)|0)!=0){K=105;break}S=Rg(c[r>>2]|0,P,(c[B>>2]|0)-1|0)|0}c[(c[C>>2]|0)+(o*12|0)>>2]=S;if((Ah(c[F>>2]|0,R,4)|0)!=0){K=108;break}P=c[A>>2]|0;if((P|0)<0){K=110;break}c[(c[C>>2]|0)+(o*12|0)+4>>2]=P;if((Ah(c[F>>2]|0,D,4)|0)!=0){K=112;break}P=c[z>>2]|0;if((P|0)<0){K=114;break}c[(c[C>>2]|0)+(o*12|0)+8>>2]=P;o=o+1|0;if((o|0)>=(E|0)){break c}}if((K|0)==102){kh(b,4168)}else if((K|0)==105){kh(b,4168)}else if((K|0)==108){kh(b,4168)}else if((K|0)==110){kh(b,3440)}else if((K|0)==112){kh(b,4168)}else if((K|0)==114){kh(b,3440)}}}while(0);if((Ah(c[F>>2]|0,y,4)|0)!=0){kh(b,4168)}E=c[y>>2]|0;if((E|0)<0){kh(b,3440)}if((E|0)<=0){i=f;return}y=x;C=b+8|0;z=0;while(1){if((Ah(c[F>>2]|0,y,4)|0)!=0){K=123;break}A=c[x>>2]|0;if((A|0)==0){T=0}else{S=Bh(c[r>>2]|0,c[C>>2]|0,A)|0;if((Ah(c[F>>2]|0,S,c[x>>2]|0)|0)!=0){K=126;break}T=Rg(c[r>>2]|0,S,(c[x>>2]|0)-1|0)|0}c[(c[q>>2]|0)+(z<<3)>>2]=T;S=z+1|0;if((S|0)<(E|0)){z=S}else{K=129;break}}if((K|0)==123){kh(b,4168)}else if((K|0)==126){kh(b,4168)}else if((K|0)==129){i=f;return}}function mh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0;d=i;i=i+8|0;e=d|0;f=c[a+8>>2]|0;do{if((f|0)==3){g=a}else{if((f&15|0)!=4){g=0;break}j=c[a>>2]|0;if((fg(j+16|0,c[j+12>>2]|0,e)|0)==0){g=0;break}h[b>>3]=+h[e>>3];c[b+8>>2]=3;g=b}}while(0);i=d;return g|0}function nh(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0;e=i;i=i+32|0;f=b+8|0;if((c[f>>2]|0)!=3){g=0;i=e;return g|0}j=e|0;k=bb(j|0,6672,(l=i,i=i+8|0,h[l>>3]=+h[b>>3],l)|0)|0;i=l;l=Rg(a,j,k)|0;c[b>>2]=l;c[f>>2]=d[l+4|0]|0|64;g=1;i=e;return g|0}function oh(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;h=b+12|0;j=0;k=d;l=c[d+8>>2]|0;while(1){m=k+8|0;if((l|0)==69){d=c[k>>2]|0;n=ch(d,e)|0;o=n+8|0;if((c[o>>2]|0)!=0){p=9;break}q=c[d+8>>2]|0;if((q|0)==0){p=9;break}if((a[q+6|0]&1)!=0){p=9;break}d=gh(q,0,c[(c[h>>2]|0)+184>>2]|0)|0;if((d|0)==0){p=9;break}r=d;s=c[d+8>>2]|0}else{d=hh(b,k,0)|0;q=c[d+8>>2]|0;if((q|0)==0){p=11;break}else{r=d;s=q}}q=j+1|0;if((s&15|0)==6){p=13;break}if((q|0)<100){j=q;k=r;l=s}else{p=14;break}}if((p|0)==9){s=n;n=f;l=c[s+4>>2]|0;c[n>>2]=c[s>>2];c[n+4>>2]=l;c[f+8>>2]=c[o>>2];i=g;return}else if((p|0)==11){Ue(b,k,12584)}else if((p|0)==13){o=b+28|0;l=f-(c[o>>2]|0)|0;f=b+8|0;n=c[f>>2]|0;c[f>>2]=n+16;s=r;j=n;h=c[s+4>>2]|0;c[j>>2]=c[s>>2];c[j+4>>2]=h;c[n+8>>2]=c[r+8>>2];r=c[f>>2]|0;c[f>>2]=r+16;n=k;k=r;h=c[n+4>>2]|0;c[k>>2]=c[n>>2];c[k+4>>2]=h;c[r+8>>2]=c[m>>2];m=c[f>>2]|0;c[f>>2]=m+16;r=e;h=m;k=c[r+4>>2]|0;c[h>>2]=c[r>>2];c[h+4>>2]=k;c[m+8>>2]=c[e+8>>2];jf(b,(c[f>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);e=c[o>>2]|0;o=c[f>>2]|0;m=o-16|0;c[f>>2]=m;f=m;m=e+l|0;k=c[f+4>>2]|0;c[m>>2]=c[f>>2];c[m+4>>2]=k;c[e+(l+8)>>2]=c[o-16+8>>2];i=g;return}else if((p|0)==14){Ve(b,8832,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b}}function ph(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;h=b+12|0;j=0;k=d;l=c[d+8>>2]|0;while(1){m=k+8|0;if((l|0)==69){n=c[k>>2]|0;o=n;p=ch(o,e)|0;if((c[p+8>>2]|0)!=0){q=p;break}d=c[n+8>>2]|0;if((d|0)==0){r=9;break}if((a[d+6|0]&2)!=0){r=9;break}s=gh(d,1,c[(c[h>>2]|0)+188>>2]|0)|0;if((s|0)==0){r=9;break}t=s;u=c[s+8>>2]|0}else{s=hh(b,k,1)|0;d=c[s+8>>2]|0;if((d|0)==0){r=16;break}else{t=s;u=d}}d=j+1|0;if((u&15|0)==6){r=18;break}if((d|0)<100){j=d;k=t;l=u}else{r=19;break}}do{if((r|0)==9){if((p|0)!=1224){q=p;break}q=$g(b,o,e)|0}else if((r|0)==16){Ue(b,k,12584)}else if((r|0)==18){u=b+8|0;l=c[u>>2]|0;c[u>>2]=l+16;j=t;h=l;d=c[j+4>>2]|0;c[h>>2]=c[j>>2];c[h+4>>2]=d;c[l+8>>2]=c[t+8>>2];l=c[u>>2]|0;c[u>>2]=l+16;d=k;h=l;j=c[d+4>>2]|0;c[h>>2]=c[d>>2];c[h+4>>2]=j;c[l+8>>2]=c[m>>2];l=c[u>>2]|0;c[u>>2]=l+16;j=e;h=l;d=c[j+4>>2]|0;c[h>>2]=c[j>>2];c[h+4>>2]=d;c[l+8>>2]=c[e+8>>2];l=c[u>>2]|0;c[u>>2]=l+16;d=f;h=l;j=c[d+4>>2]|0;c[h>>2]=c[d>>2];c[h+4>>2]=j;c[l+8>>2]=c[f+8>>2];jf(b,(c[u>>2]|0)-64|0,0,a[(c[b+16>>2]|0)+18|0]&1);i=g;return}else if((r|0)==19){Ve(b,6808,(u=i,i=i+1|0,i=i+7&-8,c[u>>2]=0,u)|0);i=u}}while(0);r=f;e=q;m=c[r+4>>2]|0;c[e>>2]=c[r>>2];c[e+4>>2]=m;m=f+8|0;c[q+8>>2]=c[m>>2];a[n+6|0]=0;if((c[m>>2]&64|0)==0){i=g;return}if((a[(c[f>>2]|0)+5|0]&3)==0){i=g;return}if((a[n+5|0]&4)==0){i=g;return}Ef(b,n);i=g;return}function qh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=d+8|0;g=c[f>>2]|0;do{if((g|0)==3){if((c[e+8>>2]|0)!=3){break}i=+h[d>>3]<+h[e>>3]|0;return i|0}else{if((g&15|0)!=4){break}if((c[e+8>>2]&15|0)!=4){break}j=c[d>>2]|0;k=c[e>>2]|0;l=j+16|0;m=k+16|0;n=La(l|0,m|0)|0;a:do{if((n|0)==0){o=l;p=c[j+12>>2]|0;q=m;r=c[k+12>>2]|0;while(1){s=jn(o|0)|0;t=(s|0)==(p|0);if((s|0)==(r|0)){break}if(t){u=-1;break a}v=s+1|0;s=o+v|0;w=q+v|0;x=La(s|0,w|0)|0;if((x|0)==0){o=s;p=p-v|0;q=w;r=r-v|0}else{u=x;break a}}u=t&1^1}else{u=n}}while(0);i=u>>>31;return i|0}}while(0);u=b+8|0;t=c[u>>2]|0;g=hh(b,d,13)|0;do{if((c[g+8>>2]|0)==0){n=hh(b,e,13)|0;if((c[n+8>>2]|0)!=0){y=n;break}Ye(b,d,e);return 0}else{y=g}}while(0);g=b+28|0;n=t-(c[g>>2]|0)|0;t=c[u>>2]|0;c[u>>2]=t+16;k=y;m=t;j=c[k+4>>2]|0;c[m>>2]=c[k>>2];c[m+4>>2]=j;c[t+8>>2]=c[y+8>>2];y=c[u>>2]|0;c[u>>2]=y+16;t=d;d=y;j=c[t+4>>2]|0;c[d>>2]=c[t>>2];c[d+4>>2]=j;c[y+8>>2]=c[f>>2];f=c[u>>2]|0;c[u>>2]=f+16;y=e;j=f;d=c[y+4>>2]|0;c[j>>2]=c[y>>2];c[j+4>>2]=d;c[f+8>>2]=c[e+8>>2];jf(b,(c[u>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[g>>2]|0;g=c[u>>2]|0;e=g-16|0;c[u>>2]=e;f=e;e=b+n|0;d=c[f+4>>2]|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;c[b+(n+8)>>2]=c[g-16+8>>2];g=c[u>>2]|0;u=c[g+8>>2]|0;if((u|0)==0){i=0;return i|0}if((u|0)!=1){i=1;return i|0}i=(c[g>>2]|0)!=0|0;return i|0}function rh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=d+8|0;g=c[f>>2]|0;do{if((g|0)==3){if((c[e+8>>2]|0)!=3){break}i=+h[d>>3]<=+h[e>>3]|0;return i|0}else{if((g&15|0)!=4){break}if((c[e+8>>2]&15|0)!=4){break}j=c[d>>2]|0;k=c[e>>2]|0;l=j+16|0;m=k+16|0;n=La(l|0,m|0)|0;a:do{if((n|0)==0){o=l;p=c[j+12>>2]|0;q=m;r=c[k+12>>2]|0;while(1){s=jn(o|0)|0;t=(s|0)==(p|0);if((s|0)==(r|0)){break}if(t){u=-1;break a}v=s+1|0;s=o+v|0;w=q+v|0;x=La(s|0,w|0)|0;if((x|0)==0){o=s;p=p-v|0;q=w;r=r-v|0}else{u=x;break a}}u=t&1^1}else{u=n}}while(0);i=(u|0)<1|0;return i|0}}while(0);u=b+8|0;t=c[u>>2]|0;g=hh(b,d,14)|0;do{if((c[g+8>>2]|0)==0){n=hh(b,e,14)|0;if((c[n+8>>2]|0)!=0){y=n;break}n=c[u>>2]|0;k=hh(b,e,13)|0;do{if((c[k+8>>2]|0)==0){m=hh(b,d,13)|0;if((c[m+8>>2]|0)!=0){z=m;break}Ye(b,d,e);return 0}else{z=k}}while(0);k=b+28|0;m=n-(c[k>>2]|0)|0;j=c[u>>2]|0;c[u>>2]=j+16;l=z;r=j;q=c[l+4>>2]|0;c[r>>2]=c[l>>2];c[r+4>>2]=q;c[j+8>>2]=c[z+8>>2];j=c[u>>2]|0;c[u>>2]=j+16;q=e;r=j;l=c[q+4>>2]|0;c[r>>2]=c[q>>2];c[r+4>>2]=l;c[j+8>>2]=c[e+8>>2];j=c[u>>2]|0;c[u>>2]=j+16;l=d;r=j;q=c[l+4>>2]|0;c[r>>2]=c[l>>2];c[r+4>>2]=q;c[j+8>>2]=c[f>>2];jf(b,(c[u>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);j=c[k>>2]|0;k=c[u>>2]|0;q=k-16|0;c[u>>2]=q;r=q;q=j+m|0;l=c[r+4>>2]|0;c[q>>2]=c[r>>2];c[q+4>>2]=l;c[j+(m+8)>>2]=c[k-16+8>>2];k=c[u>>2]|0;m=c[k+8>>2]|0;if((m|0)==0){i=1;return i|0}if((m|0)!=1){i=0;return i|0}i=(c[k>>2]|0)==0|0;return i|0}else{y=g}}while(0);g=b+28|0;z=t-(c[g>>2]|0)|0;t=c[u>>2]|0;c[u>>2]=t+16;k=y;m=t;j=c[k+4>>2]|0;c[m>>2]=c[k>>2];c[m+4>>2]=j;c[t+8>>2]=c[y+8>>2];y=c[u>>2]|0;c[u>>2]=y+16;t=d;d=y;j=c[t+4>>2]|0;c[d>>2]=c[t>>2];c[d+4>>2]=j;c[y+8>>2]=c[f>>2];f=c[u>>2]|0;c[u>>2]=f+16;y=e;j=f;d=c[y+4>>2]|0;c[j>>2]=c[y>>2];c[j+4>>2]=d;c[f+8>>2]=c[e+8>>2];jf(b,(c[u>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[g>>2]|0;g=c[u>>2]|0;e=g-16|0;c[u>>2]=e;f=e;e=b+z|0;d=c[f+4>>2]|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;c[b+(z+8)>>2]=c[g-16+8>>2];g=c[u>>2]|0;u=c[g+8>>2]|0;if((u|0)==0){i=0;return i|0}if((u|0)!=1){i=1;return i|0}i=(c[g>>2]|0)!=0|0;return i|0}function sh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=d+8|0;a:do{switch(c[f>>2]&63|0){case 2:{g=(c[d>>2]|0)==(c[e>>2]|0)|0;return g|0};case 22:{g=(c[d>>2]|0)==(c[e>>2]|0)|0;return g|0};case 4:{g=(c[d>>2]|0)==(c[e>>2]|0)|0;return g|0};case 20:{g=Ng(c[d>>2]|0,c[e>>2]|0)|0;return g|0};case 7:{i=c[d>>2]|0;j=c[e>>2]|0;if((i|0)==(j|0)){g=1;return g|0}if((b|0)==0){g=0;return g|0}k=c[i+8>>2]|0;i=c[j+8>>2]|0;if((k|0)==0){g=0;return g|0}if((a[k+6|0]&32)!=0){g=0;return g|0}j=b+12|0;l=gh(k,5,c[(c[j>>2]|0)+204>>2]|0)|0;if((l|0)==0){g=0;return g|0}if((k|0)==(i|0)){m=l;break a}if((i|0)==0){g=0;return g|0}if((a[i+6|0]&32)!=0){g=0;return g|0}k=gh(i,5,c[(c[j>>2]|0)+204>>2]|0)|0;if((k|0)==0){g=0;return g|0}j=c[l+8>>2]|0;if((j|0)!=(c[k+8>>2]|0)){g=0;return g|0}switch(j&63|0){case 7:{if((c[l>>2]|0)==(c[k>>2]|0)){m=l;break a}else{g=0}return g|0};case 20:{n=Ng(c[l>>2]|0,c[k>>2]|0)|0;break};case 0:{o=l;p=51;break a;break};case 3:{n=+h[l>>3]==+h[k>>3]|0;break};case 1:{n=(c[l>>2]|0)==(c[k>>2]|0)|0;break};case 4:{n=(c[l>>2]|0)==(c[k>>2]|0)|0;break};case 5:{if((c[l>>2]|0)==(c[k>>2]|0)){m=l;break a}else{g=0}return g|0};case 2:{n=(c[l>>2]|0)==(c[k>>2]|0)|0;break};case 22:{n=(c[l>>2]|0)==(c[k>>2]|0)|0;break};default:{n=(c[l>>2]|0)==(c[k>>2]|0)|0}}if((n|0)==0){g=0}else{o=l;p=51;break a}return g|0};case 3:{g=+h[d>>3]==+h[e>>3]|0;return g|0};case 0:{g=1;return g|0};case 1:{g=(c[d>>2]|0)==(c[e>>2]|0)|0;return g|0};case 5:{l=c[d>>2]|0;k=c[e>>2]|0;if((l|0)==(k|0)){g=1;return g|0}if((b|0)==0){g=0;return g|0}j=c[l+8>>2]|0;l=c[k+8>>2]|0;if((j|0)==0){g=0;return g|0}if((a[j+6|0]&32)!=0){g=0;return g|0}k=b+12|0;i=gh(j,5,c[(c[k>>2]|0)+204>>2]|0)|0;if((i|0)==0){g=0;return g|0}if((j|0)==(l|0)){m=i;break a}if((l|0)==0){g=0;return g|0}if((a[l+6|0]&32)!=0){g=0;return g|0}j=gh(l,5,c[(c[k>>2]|0)+204>>2]|0)|0;if((j|0)==0){g=0;return g|0}k=c[i+8>>2]|0;if((k|0)!=(c[j+8>>2]|0)){g=0;return g|0}switch(k&63|0){case 7:{if((c[i>>2]|0)==(c[j>>2]|0)){m=i;break a}else{g=0}return g|0};case 5:{if((c[i>>2]|0)==(c[j>>2]|0)){m=i;break a}else{g=0}return g|0};case 0:{o=i;p=51;break a;break};case 1:{q=(c[i>>2]|0)==(c[j>>2]|0)|0;break};case 2:{q=(c[i>>2]|0)==(c[j>>2]|0)|0;break};case 22:{q=(c[i>>2]|0)==(c[j>>2]|0)|0;break};case 4:{q=(c[i>>2]|0)==(c[j>>2]|0)|0;break};case 20:{q=Ng(c[i>>2]|0,c[j>>2]|0)|0;break};case 3:{q=+h[i>>3]==+h[j>>3]|0;break};default:{q=(c[i>>2]|0)==(c[j>>2]|0)|0}}if((q|0)==0){g=0}else{o=i;p=51;break a}return g|0};default:{g=(c[d>>2]|0)==(c[e>>2]|0)|0;return g|0}}}while(0);do{if((p|0)==51){if((o|0)==0){g=0}else{m=o;break}return g|0}}while(0);o=b+8|0;p=c[o>>2]|0;q=b+28|0;n=p-(c[q>>2]|0)|0;c[o>>2]=p+16;i=m;j=p;k=c[i+4>>2]|0;c[j>>2]=c[i>>2];c[j+4>>2]=k;c[p+8>>2]=c[m+8>>2];m=c[o>>2]|0;c[o>>2]=m+16;p=d;d=m;k=c[p+4>>2]|0;c[d>>2]=c[p>>2];c[d+4>>2]=k;c[m+8>>2]=c[f>>2];f=c[o>>2]|0;c[o>>2]=f+16;m=e;k=f;d=c[m+4>>2]|0;c[k>>2]=c[m>>2];c[k+4>>2]=d;c[f+8>>2]=c[e+8>>2];jf(b,(c[o>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[q>>2]|0;q=c[o>>2]|0;e=q-16|0;c[o>>2]=e;f=e;e=b+n|0;d=c[f+4>>2]|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;c[b+(n+8)>>2]=c[q-16+8>>2];q=c[o>>2]|0;o=c[q+8>>2]|0;if((o|0)==0){g=0;return g|0}if((o|0)!=1){g=1;return g|0}g=(c[q>>2]|0)!=0|0;return g|0}function th(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+32|0;g=b+8|0;j=f|0;k=b+12|0;l=b+28|0;m=b+16|0;n=e;e=c[g>>2]|0;a:while(1){o=e-32|0;p=e-32+8|0;q=c[p>>2]|0;r=e-16|0;b:do{if((q&15|0)==4|(q|0)==3){s=e-16+8|0;t=c[s>>2]|0;if((t&15|0)==4){u=q;v=r}else{if((t|0)!=3){w=7;break}t=bb(j|0,6672,(x=i,i=i+8|0,h[x>>3]=+h[r>>3],x)|0)|0;i=x;y=Rg(b,j,t)|0;t=r;c[t>>2]=y;c[s>>2]=d[y+4|0]|0|64;u=c[p>>2]|0;v=t}t=c[(c[v>>2]|0)+12>>2]|0;y=(u&15|0)==4;if((t|0)==0){if(y){z=2;break}if((u|0)!=3){z=2;break}A=bb(j|0,6672,(x=i,i=i+8|0,h[x>>3]=+h[o>>3],x)|0)|0;i=x;B=Rg(b,j,A)|0;c[o>>2]=B;c[p>>2]=d[B+4|0]|0|64;z=2;break}do{if(y){if((c[(c[o>>2]|0)+12>>2]|0)!=0){break}B=r;A=o;C=c[B+4>>2]|0;c[A>>2]=c[B>>2];c[A+4>>2]=C;c[p>>2]=c[s>>2];z=2;break b}}while(0);c:do{if((n|0)>1){s=1;y=t;while(1){C=~s;A=e+(C<<4)|0;B=e+(C<<4)+8|0;C=c[B>>2]|0;if((C&15|0)==4){D=A}else{if((C|0)!=3){E=s;F=y;break c}C=bb(j|0,6672,(x=i,i=i+8|0,h[x>>3]=+h[A>>3],x)|0)|0;i=x;G=Rg(b,j,C)|0;C=A;c[C>>2]=G;c[B>>2]=d[G+4|0]|0|64;D=C}C=c[(c[D>>2]|0)+12>>2]|0;if(C>>>0>=(-3-y|0)>>>0){w=24;break a}G=C+y|0;C=s+1|0;if((C|0)<(n|0)){s=C;y=G}else{E=C;F=G;break}}}else{E=1;F=t}}while(0);t=Bh(b,(c[k>>2]|0)+144|0,F)|0;y=0;s=E;do{G=c[e+(-s<<4)>>2]|0;C=c[G+12>>2]|0;nn(t+y|0,G+16|0,C)|0;y=C+y|0;s=s-1|0;}while((s|0)>0);s=-E|0;C=Rg(b,t,y)|0;c[e+(s<<4)>>2]=C;c[e+(s<<4)+8>>2]=d[C+4|0]|0|64;z=E}else{w=7}}while(0);if((w|0)==7){w=0;q=hh(b,o,15)|0;if((c[q+8>>2]|0)==0){C=hh(b,r,15)|0;if((c[C+8>>2]|0)==0){w=10;break}else{H=C}}else{H=q}q=o-(c[l>>2]|0)|0;C=c[g>>2]|0;c[g>>2]=C+16;s=H;G=C;B=c[s+4>>2]|0;c[G>>2]=c[s>>2];c[G+4>>2]=B;c[C+8>>2]=c[H+8>>2];C=c[g>>2]|0;c[g>>2]=C+16;B=o;G=C;s=c[B+4>>2]|0;c[G>>2]=c[B>>2];c[G+4>>2]=s;c[C+8>>2]=c[p>>2];C=c[g>>2]|0;c[g>>2]=C+16;s=r;G=C;B=c[s+4>>2]|0;c[G>>2]=c[s>>2];c[G+4>>2]=B;c[C+8>>2]=c[e-16+8>>2];jf(b,(c[g>>2]|0)-48|0,1,a[(c[m>>2]|0)+18|0]&1);C=c[l>>2]|0;B=c[g>>2]|0;G=B-16|0;c[g>>2]=G;s=G;G=C+q|0;A=c[s+4>>2]|0;c[G>>2]=c[s>>2];c[G+4>>2]=A;c[C+(q+8)>>2]=c[B-16+8>>2];z=2}B=n+1-z|0;q=(c[g>>2]|0)+(1-z<<4)|0;c[g>>2]=q;if((B|0)>1){n=B;e=q}else{w=30;break}}if((w|0)==10){We(b,o,r)}else if((w|0)==24){Ve(b,5304,(x=i,i=i+1|0,i=i+7&-8,c[x>>2]=0,x)|0);i=x}else if((w|0)==30){i=f;return}}function uh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=e+8|0;g=c[f>>2]&15;a:do{if((g|0)==5){i=c[e>>2]|0;j=i;k=c[i+8>>2]|0;i=k;do{if((k|0)!=0){if((a[k+6|0]&16)!=0){break}l=gh(i,4,c[(c[b+12>>2]|0)+200>>2]|0)|0;if((l|0)!=0){m=l;break a}}}while(0);h[d>>3]=+(dh(j)|0);c[d+8>>2]=3;return}else if((g|0)==4){h[d>>3]=+((c[(c[e>>2]|0)+12>>2]|0)>>>0>>>0);c[d+8>>2]=3;return}else{i=hh(b,e,4)|0;if((c[i+8>>2]|0)!=0){m=i;break}Ue(b,e,4152)}}while(0);g=b+28|0;i=d-(c[g>>2]|0)|0;d=b+8|0;k=c[d>>2]|0;c[d>>2]=k+16;l=m;n=k;o=c[l+4>>2]|0;c[n>>2]=c[l>>2];c[n+4>>2]=o;c[k+8>>2]=c[m+8>>2];m=c[d>>2]|0;c[d>>2]=m+16;k=e;e=m;o=c[k+4>>2]|0;c[e>>2]=c[k>>2];c[e+4>>2]=o;c[m+8>>2]=c[f>>2];m=c[d>>2]|0;c[d>>2]=m+16;o=m;e=c[k+4>>2]|0;c[o>>2]=c[k>>2];c[o+4>>2]=e;c[m+8>>2]=c[f>>2];jf(b,(c[d>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[g>>2]|0;g=c[d>>2]|0;f=g-16|0;c[d>>2]=f;d=f;f=b+i|0;m=c[d+4>>2]|0;c[f>>2]=c[d>>2];c[f+4>>2]=m;c[b+(i+8)>>2]=c[g-16+8>>2];return}function vh(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0;j=i;i=i+32|0;k=j|0;l=j+8|0;m=j+16|0;n=e+8|0;o=c[n>>2]|0;do{if((o|0)==3){p=e;q=5}else{if((o&15|0)!=4){break}r=c[e>>2]|0;if((fg(r+16|0,c[r+12>>2]|0,l)|0)==0){break}h[m>>3]=+h[l>>3];c[m+8>>2]=3;p=m;q=5}}while(0);do{if((q|0)==5){m=c[f+8>>2]|0;if((m|0)==3){if((f|0)==0){break}s=+h[f>>3]}else{if((m&15|0)!=4){break}m=c[f>>2]|0;if((fg(m+16|0,c[m+12>>2]|0,k)|0)==0){break}s=+h[k>>3]}h[d>>3]=+dg(g-6|0,+h[p>>3],s);c[d+8>>2]=3;i=j;return}}while(0);p=hh(b,e,g)|0;do{if((c[p+8>>2]|0)==0){k=hh(b,f,g)|0;if((c[k+8>>2]|0)!=0){t=k;break}Xe(b,e,f)}else{t=p}}while(0);p=b+28|0;g=d-(c[p>>2]|0)|0;d=b+8|0;k=c[d>>2]|0;c[d>>2]=k+16;q=t;m=k;l=c[q+4>>2]|0;c[m>>2]=c[q>>2];c[m+4>>2]=l;c[k+8>>2]=c[t+8>>2];t=c[d>>2]|0;c[d>>2]=t+16;k=e;e=t;l=c[k+4>>2]|0;c[e>>2]=c[k>>2];c[e+4>>2]=l;c[t+8>>2]=c[n>>2];n=c[d>>2]|0;c[d>>2]=n+16;t=f;l=n;e=c[t+4>>2]|0;c[l>>2]=c[t>>2];c[l+4>>2]=e;c[n+8>>2]=c[f+8>>2];jf(b,(c[d>>2]|0)-48|0,1,a[(c[b+16>>2]|0)+18|0]&1);b=c[p>>2]|0;p=c[d>>2]|0;f=p-16|0;c[d>>2]=f;d=f;f=b+g|0;n=c[d+4>>2]|0;c[f>>2]=c[d>>2];c[f+4>>2]=n;c[b+(g+8)>>2]=c[p-16+8>>2];i=j;return}function wh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;b=c[a+16>>2]|0;d=b+24|0;e=c[d>>2]|0;f=b+28|0;g=c[(c[f>>2]|0)-4>>2]|0;h=g&63;switch(h|0){case 26:case 25:case 24:{i=a+8|0;j=c[i>>2]|0;k=c[j-16+8>>2]|0;do{if((k|0)==0){l=1}else{if((k|0)!=1){l=0;break}l=(c[j-16>>2]|0)==0|0}}while(0);k=l^1;c[i>>2]=j-16;if((h|0)==26){h=(c[(hh(a,e+(g>>>23<<4)|0,14)|0)+8>>2]|0)==0;m=h?l:k}else{m=k}if((m|0)==(g>>>6&255|0)){return}c[f>>2]=(c[f>>2]|0)+4;return};case 13:case 14:case 15:case 16:case 17:case 18:case 19:case 21:case 6:case 7:case 12:{f=a+8|0;m=c[f>>2]|0;k=m-16|0;c[f>>2]=k;f=g>>>6&255;l=k;k=e+(f<<4)|0;h=c[l+4>>2]|0;c[k>>2]=c[l>>2];c[k+4>>2]=h;c[e+(f<<4)+8>>2]=c[m-16+8>>2];return};case 29:{if((g&8372224|0)==0){return}c[a+8>>2]=c[b+4>>2];return};case 22:{m=a+8|0;f=c[m>>2]|0;h=f-32|0;k=h-(e+(g>>>23<<4))|0;e=f-16|0;l=f-48|0;j=c[e+4>>2]|0;c[l>>2]=c[e>>2];c[l+4>>2]=j;c[f-48+8>>2]=c[f-16+8>>2];if((k|0)>16){c[m>>2]=h;th(a,k>>4)}k=c[m>>2]|0;h=c[d>>2]|0;d=g>>>6&255;g=k-16|0;f=h+(d<<4)|0;j=c[g+4>>2]|0;c[f>>2]=c[g>>2];c[f+4>>2]=j;c[h+(d<<4)+8>>2]=c[k-16+8>>2];c[m>>2]=c[b+4>>2];return};case 34:{c[a+8>>2]=c[b+4>>2];return};default:{return}}}function xh(b){b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,R=0,S=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0.0,qa=0.0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0.0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0;e=i;i=i+24|0;f=e|0;g=e+8|0;j=e+16|0;k=b+16|0;l=b+40|0;m=b+12|0;n=b+8|0;o=b+24|0;p=b+48|0;q=b+20|0;r=b+6|0;s=b+44|0;t=c[k>>2]|0;a:while(1){u=t|0;v=c[c[u>>2]>>2]|0;w=v+12|0;x=c[(c[w>>2]|0)+8>>2]|0;y=t+24|0;z=t+28|0;A=v+16|0;v=A;B=t+4|0;C=A;A=c[y>>2]|0;b:while(1){D=c[z>>2]|0;c[z>>2]=D+4;E=c[D>>2]|0;D=a[l]|0;do{if((D&12)==0){F=A}else{G=(c[p>>2]|0)-1|0;c[p>>2]=G;H=(G|0)==0;if((D&4)==0&(H^1)){F=A;break}I=c[k>>2]|0;G=D&255;if((G&8|0)==0|H^1){J=0}else{c[p>>2]=c[s>>2];J=1}K=I+18|0;H=a[K]|0;if(H<<24>>24>-1){if(J){ff(b,3,-1)}c:do{if((G&4|0)==0){L=I+28|0}else{M=c[(c[c[I>>2]>>2]|0)+12>>2]|0;N=I+28|0;O=c[N>>2]|0;P=c[M+12>>2]|0;R=(O-P>>2)-1|0;S=c[M+20>>2]|0;M=(S|0)==0;if(M){U=0}else{U=c[S+(R<<2)>>2]|0}do{if((R|0)!=0){V=c[q>>2]|0;if(O>>>0<=V>>>0){break}if(M){W=0}else{W=c[S+((V-P>>2)-1<<2)>>2]|0}if((U|0)==(W|0)){L=N;break c}}}while(0);ff(b,2,U);L=N}}while(0);c[q>>2]=c[L>>2];if((a[r]|0)==1){X=22;break a}}else{a[K]=H&127}F=c[y>>2]|0}}while(0);Y=E>>>6&255;Z=F+(Y<<4)|0;switch(E&63|0){case 4:{D=Z;G=E>>>23;while(1){c[D+8>>2]=0;if((G|0)==0){A=F;continue b}else{D=D+16|0;G=G-1|0}}break};case 6:{G=E>>>14;if((G&256|0)==0){_=F+((G&511)<<4)|0}else{_=x+((G&255)<<4)|0}oh(b,c[(c[v+(E>>>23<<2)>>2]|0)+8>>2]|0,_,Z);A=c[y>>2]|0;continue b;break};case 0:{G=E>>>23;D=F+(G<<4)|0;P=Z;S=c[D+4>>2]|0;c[P>>2]=c[D>>2];c[P+4>>2]=S;c[F+(Y<<4)+8>>2]=c[F+(G<<4)+8>>2];A=F;continue b;break};case 9:{G=c[v+(E>>>23<<2)>>2]|0;S=c[G+8>>2]|0;P=Z;D=S;M=c[P+4>>2]|0;c[D>>2]=c[P>>2];c[D+4>>2]=M;M=F+(Y<<4)+8|0;c[S+8>>2]=c[M>>2];if((c[M>>2]&64|0)==0){A=F;continue b}M=c[Z>>2]|0;if((a[M+5|0]&3)==0){A=F;continue b}if((a[G+5|0]&4)==0){A=F;continue b}Df(b,G,M);A=F;continue b;break};case 10:{M=E>>>23;if((M&256|0)==0){$=F+(M<<4)|0}else{$=x+((M&255)<<4)|0}M=E>>>14;if((M&256|0)==0){aa=F+((M&511)<<4)|0}else{aa=x+((M&255)<<4)|0}ph(b,Z,$,aa);A=c[y>>2]|0;continue b;break};case 12:{M=E>>>23;G=F+(M<<4)|0;S=Y+1|0;D=G;P=F+(S<<4)|0;O=c[D+4>>2]|0;c[P>>2]=c[D>>2];c[P+4>>2]=O;c[F+(S<<4)+8>>2]=c[F+(M<<4)+8>>2];M=E>>>14;if((M&256|0)==0){ba=F+((M&511)<<4)|0}else{ba=x+((M&255)<<4)|0}oh(b,G,ba,Z);A=c[y>>2]|0;continue b;break};case 13:{G=E>>>23;if((G&256|0)==0){ca=F+(G<<4)|0}else{ca=x+((G&255)<<4)|0}G=E>>>14;if((G&256|0)==0){da=F+((G&511)<<4)|0}else{da=x+((G&255)<<4)|0}do{if((c[ca+8>>2]|0)==3){if((c[da+8>>2]|0)!=3){break}h[Z>>3]=+h[ca>>3]+ +h[da>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);vh(b,Z,ca,da,6);A=c[y>>2]|0;continue b;break};case 8:{G=E>>>23;if((G&256|0)==0){ea=F+(G<<4)|0}else{ea=x+((G&255)<<4)|0}G=E>>>14;if((G&256|0)==0){fa=F+((G&511)<<4)|0}else{fa=x+((G&255)<<4)|0}ph(b,c[(c[v+(Y<<2)>>2]|0)+8>>2]|0,ea,fa);A=c[y>>2]|0;continue b;break};case 1:{G=E>>>14;M=x+(G<<4)|0;S=Z;O=c[M+4>>2]|0;c[S>>2]=c[M>>2];c[S+4>>2]=O;c[F+(Y<<4)+8>>2]=c[x+(G<<4)+8>>2];A=F;continue b;break};case 2:{G=c[z>>2]|0;c[z>>2]=G+4;O=(c[G>>2]|0)>>>6;G=x+(O<<4)|0;S=Z;M=c[G+4>>2]|0;c[S>>2]=c[G>>2];c[S+4>>2]=M;c[F+(Y<<4)+8>>2]=c[x+(O<<4)+8>>2];A=F;continue b;break};case 3:{c[Z>>2]=E>>>23;c[F+(Y<<4)+8>>2]=1;if((E&8372224|0)==0){A=F;continue b}c[z>>2]=(c[z>>2]|0)+4;A=F;continue b;break};case 5:{O=c[(c[v+(E>>>23<<2)>>2]|0)+8>>2]|0;M=O;S=Z;G=c[M+4>>2]|0;c[S>>2]=c[M>>2];c[S+4>>2]=G;c[F+(Y<<4)+8>>2]=c[O+8>>2];A=F;continue b;break};case 14:{O=E>>>23;if((O&256|0)==0){ga=F+(O<<4)|0}else{ga=x+((O&255)<<4)|0}O=E>>>14;if((O&256|0)==0){ha=F+((O&511)<<4)|0}else{ha=x+((O&255)<<4)|0}do{if((c[ga+8>>2]|0)==3){if((c[ha+8>>2]|0)!=3){break}h[Z>>3]=+h[ga>>3]- +h[ha>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);vh(b,Z,ga,ha,7);A=c[y>>2]|0;continue b;break};case 15:{O=E>>>23;if((O&256|0)==0){ia=F+(O<<4)|0}else{ia=x+((O&255)<<4)|0}O=E>>>14;if((O&256|0)==0){ja=F+((O&511)<<4)|0}else{ja=x+((O&255)<<4)|0}do{if((c[ia+8>>2]|0)==3){if((c[ja+8>>2]|0)!=3){break}h[Z>>3]=+h[ia>>3]*+h[ja>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);vh(b,Z,ia,ja,8);A=c[y>>2]|0;continue b;break};case 7:{O=E>>>14;if((O&256|0)==0){ka=F+((O&511)<<4)|0}else{ka=x+((O&255)<<4)|0}oh(b,F+(E>>>23<<4)|0,ka,Z);A=c[y>>2]|0;continue b;break};case 11:{O=E>>>23;G=E>>>14&511;S=Zg(b)|0;c[Z>>2]=S;c[F+(Y<<4)+8>>2]=69;if((G|O|0)!=0){M=bg(O)|0;Vg(b,S,M,bg(G)|0)}if((c[(c[m>>2]|0)+12>>2]|0)>0){c[n>>2]=F+(Y+1<<4);Nf(b);c[n>>2]=c[B>>2]}A=c[y>>2]|0;continue b;break};case 16:{G=E>>>23;if((G&256|0)==0){la=F+(G<<4)|0}else{la=x+((G&255)<<4)|0}G=E>>>14;if((G&256|0)==0){ma=F+((G&511)<<4)|0}else{ma=x+((G&255)<<4)|0}do{if((c[la+8>>2]|0)==3){if((c[ma+8>>2]|0)!=3){break}h[Z>>3]=+h[la>>3]/+h[ma>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);vh(b,Z,la,ma,9);A=c[y>>2]|0;continue b;break};case 17:{G=E>>>23;if((G&256|0)==0){na=F+(G<<4)|0}else{na=x+((G&255)<<4)|0}G=E>>>14;if((G&256|0)==0){oa=F+((G&511)<<4)|0}else{oa=x+((G&255)<<4)|0}do{if((c[na+8>>2]|0)==3){if((c[oa+8>>2]|0)!=3){break}pa=+h[na>>3];qa=+h[oa>>3];h[Z>>3]=pa-qa*+Q(pa/qa);c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);vh(b,Z,na,oa,10);A=c[y>>2]|0;continue b;break};case 18:{G=E>>>23;if((G&256|0)==0){ra=F+(G<<4)|0}else{ra=x+((G&255)<<4)|0}G=E>>>14;if((G&256|0)==0){sa=F+((G&511)<<4)|0}else{sa=x+((G&255)<<4)|0}do{if((c[ra+8>>2]|0)==3){if((c[sa+8>>2]|0)!=3){break}h[Z>>3]=+T(+(+h[ra>>3]),+(+h[sa>>3]));c[F+(Y<<4)+8>>2]=3;A=F;continue b}}while(0);vh(b,Z,ra,sa,11);A=c[y>>2]|0;continue b;break};case 19:{G=E>>>23;M=F+(G<<4)|0;if((c[F+(G<<4)+8>>2]|0)==3){h[Z>>3]=-0.0- +h[M>>3];c[F+(Y<<4)+8>>2]=3;A=F;continue b}else{vh(b,Z,M,M,12);A=c[y>>2]|0;continue b}break};case 20:{M=E>>>23;G=c[F+(M<<4)+8>>2]|0;do{if((G|0)==0){ta=1}else{if((G|0)!=1){ta=0;break}ta=(c[F+(M<<4)>>2]|0)==0|0}}while(0);c[Z>>2]=ta;c[F+(Y<<4)+8>>2]=1;A=F;continue b;break};case 21:{uh(b,Z,F+(E>>>23<<4)|0);A=c[y>>2]|0;continue b;break};case 22:{M=E>>>23;G=E>>>14&511;c[n>>2]=F+(G+1<<4);th(b,1-M+G|0);G=c[y>>2]|0;S=G+(M<<4)|0;O=S;P=G+(Y<<4)|0;D=c[O+4>>2]|0;c[P>>2]=c[O>>2];c[P+4>>2]=D;c[G+(Y<<4)+8>>2]=c[G+(M<<4)+8>>2];if((c[(c[m>>2]|0)+12>>2]|0)>0){if(Y>>>0<M>>>0){ua=S}else{ua=G+(Y+1<<4)|0}c[n>>2]=ua;Nf(b);c[n>>2]=c[B>>2]}G=c[y>>2]|0;c[n>>2]=c[B>>2];A=G;continue b;break};case 23:{if((Y|0)!=0){zf(b,(c[y>>2]|0)+(Y-1<<4)|0)}c[z>>2]=(c[z>>2]|0)+((E>>>14)-131071<<2);A=F;continue b;break};case 24:{G=E>>>23;if((G&256|0)==0){va=F+(G<<4)|0}else{va=x+((G&255)<<4)|0}G=E>>>14;if((G&256|0)==0){wa=F+((G&511)<<4)|0}else{wa=x+((G&255)<<4)|0}if((c[va+8>>2]|0)==(c[wa+8>>2]|0)){xa=(sh(b,va,wa)|0)!=0|0}else{xa=0}G=c[z>>2]|0;S=G;if((xa|0)==(Y|0)){M=c[S>>2]|0;D=M>>>6&255;if((D|0)==0){ya=G}else{zf(b,(c[y>>2]|0)+(D-1<<4)|0);ya=c[z>>2]|0}za=ya+((M>>>14)-131070<<2)|0}else{za=S+4|0}c[z>>2]=za;A=c[y>>2]|0;continue b;break};case 25:{S=E>>>23;if((S&256|0)==0){Aa=F+(S<<4)|0}else{Aa=x+((S&255)<<4)|0}S=E>>>14;if((S&256|0)==0){Ba=F+((S&511)<<4)|0}else{Ba=x+((S&255)<<4)|0}S=(qh(b,Aa,Ba)|0)==(Y|0);M=c[z>>2]|0;D=M;if(S){S=c[D>>2]|0;G=S>>>6&255;if((G|0)==0){Ca=M}else{zf(b,(c[y>>2]|0)+(G-1<<4)|0);Ca=c[z>>2]|0}Da=Ca+((S>>>14)-131070<<2)|0}else{Da=D+4|0}c[z>>2]=Da;A=c[y>>2]|0;continue b;break};case 26:{D=E>>>23;if((D&256|0)==0){Ea=F+(D<<4)|0}else{Ea=x+((D&255)<<4)|0}D=E>>>14;if((D&256|0)==0){Fa=F+((D&511)<<4)|0}else{Fa=x+((D&255)<<4)|0}D=(rh(b,Ea,Fa)|0)==(Y|0);S=c[z>>2]|0;G=S;if(D){D=c[G>>2]|0;M=D>>>6&255;if((M|0)==0){Ga=S}else{zf(b,(c[y>>2]|0)+(M-1<<4)|0);Ga=c[z>>2]|0}Ha=Ga+((D>>>14)-131070<<2)|0}else{Ha=G+4|0}c[z>>2]=Ha;A=c[y>>2]|0;continue b;break};case 27:{G=c[F+(Y<<4)+8>>2]|0;D=(G|0)==0;do{if((E&8372224|0)==0){if(D){break}if((G|0)!=1){X=191;break}if((c[Z>>2]|0)!=0){X=191}}else{if(D){X=191;break}if((G|0)!=1){break}if((c[Z>>2]|0)==0){X=191}}}while(0);if((X|0)==191){X=0;c[z>>2]=(c[z>>2]|0)+4;A=F;continue b}G=c[z>>2]|0;D=c[G>>2]|0;M=D>>>6&255;if((M|0)==0){Ia=G}else{zf(b,(c[y>>2]|0)+(M-1<<4)|0);Ia=c[z>>2]|0}c[z>>2]=Ia+((D>>>14)-131070<<2);A=F;continue b;break};case 28:{D=E>>>23;M=F+(D<<4)|0;G=c[F+(D<<4)+8>>2]|0;D=(G|0)==0;do{if((E&8372224|0)==0){if(D){break}if((G|0)!=1){X=202;break}if((c[M>>2]|0)!=0){X=202}}else{if(D){X=202;break}if((G|0)!=1){break}if((c[M>>2]|0)==0){X=202}}}while(0);if((X|0)==202){X=0;c[z>>2]=(c[z>>2]|0)+4;A=F;continue b}D=M;S=Z;P=c[D+4>>2]|0;c[S>>2]=c[D>>2];c[S+4>>2]=P;c[F+(Y<<4)+8>>2]=G;P=c[z>>2]|0;S=c[P>>2]|0;D=S>>>6&255;if((D|0)==0){Ja=P}else{zf(b,(c[y>>2]|0)+(D-1<<4)|0);Ja=c[z>>2]|0}c[z>>2]=Ja+((S>>>14)-131070<<2);A=F;continue b;break};case 29:{S=E>>>23;D=E>>>14&511;if((S|0)!=0){c[n>>2]=F+(Y+S<<4)}if((gf(b,Z,D-1|0)|0)==0){X=212;break b}if((D|0)!=0){c[n>>2]=c[B>>2]}A=c[y>>2]|0;continue b;break};case 30:{D=E>>>23;if((D|0)!=0){c[n>>2]=F+(Y+D<<4)}if((gf(b,Z,-1)|0)==0){X=217;break b}A=c[y>>2]|0;continue b;break};case 31:{X=222;break b;break};case 32:{qa=+h[F+(Y+2<<4)>>3];D=Z|0;pa=qa+ +h[D>>3];Ka=+h[F+(Y+1<<4)>>3];if(qa>0.0){if(pa>Ka){A=F;continue b}}else{if(Ka>pa){A=F;continue b}}c[z>>2]=(c[z>>2]|0)+((E>>>14)-131071<<2);h[D>>3]=pa;c[F+(Y<<4)+8>>2]=3;D=Y+3|0;h[F+(D<<4)>>3]=pa;c[F+(D<<4)+8>>2]=3;A=F;continue b;break};case 33:{D=Y+1|0;S=F+(D<<4)|0;P=Y+2|0;O=F+(P<<4)|0;R=F+(Y<<4)+8|0;V=c[R>>2]|0;if((V|0)!=3){if((V&15|0)!=4){X=238;break a}V=c[Z>>2]|0;if((fg(V+16|0,c[V+12>>2]|0,j)|0)==0){X=238;break a}h[Z>>3]=+h[j>>3];c[R>>2]=3;if((Z|0)==0){X=238;break a}}V=F+(D<<4)+8|0;D=c[V>>2]|0;if((D|0)!=3){if((D&15|0)!=4){X=243;break a}D=c[S>>2]|0;if((fg(D+16|0,c[D+12>>2]|0,g)|0)==0){X=243;break a}h[S>>3]=+h[g>>3];c[V>>2]=3}V=F+(P<<4)+8|0;P=c[V>>2]|0;if((P|0)!=3){if((P&15|0)!=4){X=248;break a}P=c[O>>2]|0;if((fg(P+16|0,c[P+12>>2]|0,f)|0)==0){X=248;break a}h[O>>3]=+h[f>>3];c[V>>2]=3}V=Z|0;h[V>>3]=+h[V>>3]- +h[O>>3];c[R>>2]=3;c[z>>2]=(c[z>>2]|0)+((E>>>14)-131071<<2);A=F;continue b;break};case 34:{R=Y+3|0;O=F+(R<<4)|0;V=Y+2|0;P=Y+5|0;S=F+(V<<4)|0;D=F+(P<<4)|0;La=c[S+4>>2]|0;c[D>>2]=c[S>>2];c[D+4>>2]=La;c[F+(P<<4)+8>>2]=c[F+(V<<4)+8>>2];V=Y+1|0;P=Y+4|0;La=F+(V<<4)|0;D=F+(P<<4)|0;S=c[La+4>>2]|0;c[D>>2]=c[La>>2];c[D+4>>2]=S;c[F+(P<<4)+8>>2]=c[F+(V<<4)+8>>2];V=Z;P=O;S=c[V+4>>2]|0;c[P>>2]=c[V>>2];c[P+4>>2]=S;c[F+(R<<4)+8>>2]=c[F+(Y<<4)+8>>2];c[n>>2]=F+(Y+6<<4);jf(b,O,E>>>14&511,1);O=c[y>>2]|0;c[n>>2]=c[B>>2];R=c[z>>2]|0;c[z>>2]=R+4;S=c[R>>2]|0;Ma=O;Na=S;Oa=O+((S>>>6&255)<<4)|0;break};case 35:{Ma=F;Na=E;Oa=Z;break};case 36:{S=E>>>23;O=E>>>14&511;if((S|0)==0){Pa=((c[n>>2]|0)-Z>>4)-1|0}else{Pa=S}if((O|0)==0){S=c[z>>2]|0;c[z>>2]=S+4;Qa=(c[S>>2]|0)>>>6}else{Qa=O}O=c[Z>>2]|0;S=O;R=Pa-50+(Qa*50|0)|0;if((R|0)>(c[S+28>>2]|0)){Yg(b,S,R)}if((Pa|0)>0){P=O+5|0;V=Pa;D=R;while(1){R=V+Y|0;La=F+(R<<4)|0;Ra=D-1|0;Wg(b,S,D,La);do{if((c[F+(R<<4)+8>>2]&64|0)!=0){if((a[(c[La>>2]|0)+5|0]&3)==0){break}if((a[P]&4)==0){break}Ef(b,O)}}while(0);La=V-1|0;if((La|0)>0){V=La;D=Ra}else{break}}}c[n>>2]=c[B>>2];A=F;continue b;break};case 37:{D=c[(c[(c[w>>2]|0)+16>>2]|0)+(E>>>14<<2)>>2]|0;V=D+32|0;O=c[V>>2]|0;P=c[D+40>>2]|0;S=c[D+28>>2]|0;d:do{if((O|0)==0){X=275}else{if((P|0)>0){G=O+16|0;M=0;while(1){La=d[S+(M<<3)+5|0]|0;if((a[S+(M<<3)+4|0]|0)==0){Sa=c[(c[C+(La<<2)>>2]|0)+8>>2]|0}else{Sa=F+(La<<4)|0}La=M+1|0;if((c[(c[G+(M<<2)>>2]|0)+8>>2]|0)!=(Sa|0)){X=275;break d}if((La|0)<(P|0)){M=La}else{break}}}c[Z>>2]=O;c[F+(Y<<4)+8>>2]=70}}while(0);if((X|0)==275){X=0;O=vf(b,P)|0;c[O+12>>2]=D;c[Z>>2]=O;c[F+(Y<<4)+8>>2]=70;if((P|0)>0){M=O+16|0;G=0;do{Ra=d[S+(G<<3)+5|0]|0;if((a[S+(G<<3)+4|0]|0)==0){c[M+(G<<2)>>2]=c[C+(Ra<<2)>>2]}else{c[M+(G<<2)>>2]=xf(b,F+(Ra<<4)|0)|0}G=G+1|0;}while((G|0)<(P|0))}if((a[D+5|0]&4)!=0){Ff(b,D,O)}c[V>>2]=O}if((c[(c[m>>2]|0)+12>>2]|0)>0){c[n>>2]=F+(Y+1<<4);Nf(b);c[n>>2]=c[B>>2]}A=c[y>>2]|0;continue b;break};case 38:{P=E>>>23;G=P-1|0;M=(F-(c[u>>2]|0)>>4)-(d[(c[w>>2]|0)+76|0]|0)|0;S=M-1|0;if((P|0)==0){if(((c[o>>2]|0)-(c[n>>2]|0)>>4|0)<=(S|0)){df(b,S)}P=c[y>>2]|0;c[n>>2]=P+(S+Y<<4);Ta=P;Ua=S;Va=P+(Y<<4)|0}else{Ta=F;Ua=G;Va=Z}if((Ua|0)<=0){A=Ta;continue b}G=1-M|0;M=0;while(1){if((M|0)<(S|0)){P=M+G|0;Ra=Ta+(P<<4)|0;La=Va+(M<<4)|0;R=c[Ra+4>>2]|0;c[La>>2]=c[Ra>>2];c[La+4>>2]=R;c[Va+(M<<4)+8>>2]=c[Ta+(P<<4)+8>>2]}else{c[Va+(M<<4)+8>>2]=0}P=M+1|0;if((P|0)<(Ua|0)){M=P}else{A=Ta;continue b}}break};default:{A=F;continue b}}M=c[Oa+24>>2]|0;if((M|0)==0){A=Ma;continue}G=Oa+16|0;S=Oa;O=c[G+4>>2]|0;c[S>>2]=c[G>>2];c[S+4>>2]=O;c[Oa+8>>2]=M;c[z>>2]=(c[z>>2]|0)+((Na>>>14)-131071<<2);A=Ma}if((X|0)==212){X=0;A=c[k>>2]|0;z=A+18|0;a[z]=a[z]|4;t=A;continue}else if((X|0)==217){X=0;A=c[k>>2]|0;z=c[A+8>>2]|0;y=c[A>>2]|0;u=c[z>>2]|0;B=A+24|0;C=(c[B>>2]|0)+(d[(c[(c[y>>2]|0)+12>>2]|0)+76|0]<<4)|0;if((c[(c[w>>2]|0)+56>>2]|0)>0){zf(b,c[z+24>>2]|0)}if(y>>>0<C>>>0){x=0;v=y;do{M=v;O=u+(x<<4)|0;S=c[M+4>>2]|0;c[O>>2]=c[M>>2];c[O+4>>2]=S;c[u+(x<<4)+8>>2]=c[y+(x<<4)+8>>2];x=x+1|0;v=y+(x<<4)|0;}while(v>>>0<C>>>0)}C=y;c[z+24>>2]=u+((c[B>>2]|0)-C>>4<<4);v=u+((c[n>>2]|0)-C>>4<<4)|0;c[n>>2]=v;c[z+4>>2]=v;c[z+28>>2]=c[A+28>>2];v=z+18|0;a[v]=a[v]|64;c[k>>2]=z;t=z;continue}else if((X|0)==222){X=0;v=E>>>23;if((v|0)!=0){c[n>>2]=F+(v-1+Y<<4)}if((c[(c[w>>2]|0)+56>>2]|0)>0){zf(b,F)}v=hf(b,Z)|0;if((a[t+18|0]&4)==0){X=227;break}C=c[k>>2]|0;if((v|0)==0){t=C;continue}c[n>>2]=c[C+4>>2];t=C;continue}}if((X|0)==22){if(!J){Wa=c[L>>2]|0;Xa=Wa;Ya=Xa-4|0;Za=Ya;c[L>>2]=Za;_a=a[K]|0;$a=_a|-128;a[K]=$a;ab=c[n>>2]|0;bb=ab-16|0;cb=I|0;c[cb>>2]=bb;af(b,1)}c[p>>2]=1;Wa=c[L>>2]|0;Xa=Wa;Ya=Xa-4|0;Za=Ya;c[L>>2]=Za;_a=a[K]|0;$a=_a|-128;a[K]=$a;ab=c[n>>2]|0;bb=ab-16|0;cb=I|0;c[cb>>2]=bb;af(b,1)}else if((X|0)==227){i=e;return}else if((X|0)==238){Ve(b,3792,(db=i,i=i+1|0,i=i+7&-8,c[db>>2]=0,db)|0);i=db}else if((X|0)==243){Ve(b,3408,(db=i,i=i+1|0,i=i+7&-8,c[db>>2]=0,db)|0);i=db}else if((X|0)==248){Ve(b,2952,(db=i,i=i+1|0,i=i+7&-8,c[db>>2]=0,db)|0);i=db}}function yh(a){a=a|0;var b=0,e=0,f=0,g=0,h=0;b=i;i=i+8|0;e=b|0;f=Ec[c[a+8>>2]&63](c[a+16>>2]|0,c[a+12>>2]|0,e)|0;g=c[e>>2]|0;if((f|0)==0|(g|0)==0){h=-1;i=b;return h|0}c[a>>2]=g-1;c[a+4>>2]=f+1;h=d[f]|0;i=b;return h|0}function zh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;c[b+16>>2]=a;c[b+8>>2]=d;c[b+12>>2]=e;c[b>>2]=0;c[b+4>>2]=0;return}function Ah(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+8|0;f=e|0;if((d|0)==0){g=0;i=e;return g|0}h=a|0;j=a+16|0;k=a+8|0;l=a+12|0;m=a+4|0;a=b;b=d;d=c[h>>2]|0;while(1){if((d|0)==0){n=Ec[c[k>>2]&63](c[j>>2]|0,c[l>>2]|0,f)|0;o=c[f>>2]|0;if((n|0)==0|(o|0)==0){g=b;p=8;break}c[h>>2]=o;c[m>>2]=n;q=o;r=n}else{q=d;r=c[m>>2]|0}n=b>>>0>q>>>0?q:b;nn(a|0,r|0,n)|0;o=(c[h>>2]|0)-n|0;c[h>>2]=o;c[m>>2]=(c[m>>2]|0)+n;if((b|0)==(n|0)){g=0;p=8;break}else{a=a+n|0;b=b-n|0;d=o}}if((p|0)==8){i=e;return g|0}return 0}function Bh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b+8|0;f=c[e>>2]|0;if(f>>>0>=d>>>0){g=c[b>>2]|0;return g|0}h=d>>>0<32>>>0?32:d;if((h+1|0)>>>0>4294967293>>>0){_f(a);return 0}d=b|0;b=$f(a,c[d>>2]|0,f,h)|0;c[d>>2]=b;c[e>>2]=h;g=b;return g|0}function Ch(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+208|0;h=g|0;j=g+104|0;k=xd(b)|0;l=1;m=1;while(1){if((Qe(d,m,h)|0)==0){break}else{l=m;m=m<<1}}if((l|0)<(m|0)){n=m;o=l;while(1){l=(n+o|0)/2|0;p=(Qe(d,l,h)|0)==0;q=p?l:n;r=p?o:l+1|0;if((r|0)<(q|0)){n=q;o=r}else{s=q;break}}}else{s=m}m=(s-1|0)>22?12:0;if((e|0)!=0){ae(b,6208,(t=i,i=i+8|0,c[t>>2]=e,t)|0)|0;i=t}Zd(b,12464,16)|0;if((Qe(d,f,j)|0)==0){u=xd(b)|0;v=u-k|0;De(b,v);i=g;return}e=s-11|0;s=j+36|0;o=j+20|0;n=j+8|0;h=j+12|0;q=j+24|0;r=j+35|0;l=j+4|0;p=f;while(1){f=p+1|0;if((f|0)==(m|0)){Zd(b,8760,5)|0;w=e}else{Te(d,6728,j)|0;ae(b,5256,(t=i,i=i+8|0,c[t>>2]=s,t)|0)|0;i=t;x=c[o>>2]|0;if((x|0)>0){ae(b,4120,(t=i,i=i+8|0,c[t>>2]=x,t)|0)|0;i=t}Zd(b,3776,4)|0;do{if((a[c[n>>2]|0]|0)==0){x=a[c[h>>2]|0]|0;if((x<<24>>24|0)==67){if((si(b,j)|0)==0){Zd(b,12920,1)|0;break}else{y=Qd(b,-1,0)|0;ae(b,4464,(t=i,i=i+8|0,c[t>>2]=y,t)|0)|0;i=t;zd(b,-2);break}}else if((x<<24>>24|0)==109){Zd(b,4400,10)|0;break}else{x=c[q>>2]|0;ae(b,4272,(t=i,i=i+16|0,c[t>>2]=s,c[t+8>>2]=x,t)|0)|0;i=t;break}}else{ae(b,4464,(t=i,i=i+8|0,c[t>>2]=c[l>>2],t)|0)|0;i=t}}while(0);if((a[r]|0)!=0){Zd(b,3384,20)|0}De(b,(xd(b)|0)-k|0);w=f}if((Qe(d,w,j)|0)==0){break}else{p=w}}u=xd(b)|0;v=u-k|0;De(b,v);i=g;return}function Dh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+104|0;f=e|0;if((Qe(a,0,f)|0)==0){g=Eh(a,2928,(h=i,i=i+16|0,c[h>>2]=b,c[h+8>>2]=d,h)|0)|0;i=h;j=g;i=e;return j|0}Te(a,2600,f)|0;do{if((La(c[f+8>>2]|0,13608)|0)==0){g=b-1|0;if((g|0)!=0){k=g;break}g=Eh(a,13320,(h=i,i=i+16|0,c[h>>2]=c[f+4>>2],c[h+8>>2]=d,h)|0)|0;i=h;j=g;i=e;return j|0}else{k=b}}while(0);b=f+4|0;g=c[b>>2]|0;if((g|0)==0){if((si(a,f)|0)==0){l=12920}else{l=Qd(a,-1,0)|0}c[b>>2]=l;m=l}else{m=g}g=Eh(a,12592,(h=i,i=i+24|0,c[h>>2]=k,c[h+8>>2]=m,c[h+16>>2]=d,h)|0)|0;i=h;j=g;i=e;return j|0}function Eh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+120|0;f=e|0;g=e+104|0;h=g|0;j=g;c[j>>2]=d;c[j+4>>2]=0;do{if((Qe(a,1,f)|0)==0){k=4}else{Te(a,12336,f)|0;j=c[f+20>>2]|0;if((j|0)<=0){k=4;break}ae(a,12080,(d=i,i=i+16|0,c[d>>2]=f+36,c[d+8>>2]=j,d)|0)|0;i=d}}while(0);if((k|0)==4){Zd(a,13800,0)|0}$d(a,b,h)|0;De(a,2);h=Be(a)|0;i=e;return h|0}function Fh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+104|0;e=d|0;do{if((Qe(a,b,e)|0)!=0){Te(a,12336,e)|0;f=c[e+20>>2]|0;if((f|0)<=0){break}ae(a,12080,(g=i,i=i+16|0,c[g>>2]=e+36,c[g+8>>2]=f,g)|0)|0;i=g;i=d;return}}while(0);Zd(a,13800,0)|0;i=d;return}function Gh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;f=c[(Pb()|0)>>2]|0;if((b|0)!=0){ce(a,1);g=1;i=e;return g|0}Vd(a);b=Qb(f|0)|0;if((d|0)==0){_d(a,b)|0}else{ae(a,11616,(h=i,i=i+16|0,c[h>>2]=d,c[h+8>>2]=b,h)|0)|0;i=h}Xd(a,f);g=3;i=e;return g|0}function Hh(a,b){a=a|0;b=b|0;var d=0;if((b|0)==(-1|0)){d=c[(Pb()|0)>>2]|0;Vd(a);_d(a,Qb(d|0)|0)|0;Xd(a,d);return 3}else if((b|0)==0){ce(a,1)}else{Vd(a)}_d(a,10640)|0;Xd(a,b);return 3}function Ih(a,b){a=a|0;b=b|0;var c=0;he(a,-1001e3,b);if((Ed(a,-1)|0)!=0){c=0;return c|0}yd(a,-2);ke(a,0,0);Dd(a,-1);pe(a,-1001e3,b);c=1;return c|0}function Jh(a,b){a=a|0;b=b|0;he(a,-1001e3,b);se(a,-2)|0;return}function Kh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=Sd(a,b)|0;if((d|0)==0){e=0;return e|0}if((le(a,b)|0)==0){e=0;return e|0}he(a,-1001e3,c);c=(Kd(a,-1,-2)|0)==0;yd(a,-3);e=c?0:d;return e|0}function Lh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=Sd(a,b)|0;do{if((f|0)!=0){if((le(a,b)|0)==0){break}he(a,-1001e3,d);g=(Kd(a,-1,-2)|0)==0;yd(a,-3);if(g){break}else{h=f}i=e;return h|0}}while(0);f=Fd(a,Ed(a,b)|0)|0;g=ae(a,4760,(j=i,i=i+16|0,c[j>>2]=d,c[j+8>>2]=f,j)|0)|0;i=j;Dh(a,b,g)|0;h=0;i=e;return h|0}function Mh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;do{if((d|0)==0){g=Qd(a,b,0)|0;if((g|0)!=0){h=g;break}g=Fd(a,4)|0;j=Fd(a,Ed(a,b)|0)|0;k=ae(a,4760,(l=i,i=i+16|0,c[l>>2]=g,c[l+8>>2]=j,l)|0)|0;i=l;Dh(a,b,k)|0;h=0}else{h=Nh(a,b,d,0)|0}}while(0);d=c[e>>2]|0;a:do{if((d|0)!=0){k=0;j=d;while(1){g=k+1|0;if((La(j|0,h|0)|0)==0){m=k;break}n=c[e+(g<<2)>>2]|0;if((n|0)==0){break a}else{k=g;j=n}}i=f;return m|0}}while(0);e=ae(a,10376,(l=i,i=i+8|0,c[l>>2]=h,l)|0)|0;i=l;m=Dh(a,b,e)|0;i=f;return m|0}function Nh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;if((Ed(a,b)|0)>=1){g=Qd(a,b,e)|0;if((g|0)!=0){h=g;i=f;return h|0}g=Fd(a,4)|0;j=Fd(a,Ed(a,b)|0)|0;k=ae(a,4760,(l=i,i=i+16|0,c[l>>2]=g,c[l+8>>2]=j,l)|0)|0;i=l;Dh(a,b,k)|0;h=0;i=f;return h|0}if((e|0)==0){h=d;i=f;return h|0}if((d|0)==0){m=0}else{m=jn(d|0)|0}c[e>>2]=m;h=d;i=f;return h|0}function Oh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=Qd(a,b,d)|0;if((f|0)!=0){i=e;return f|0}d=Fd(a,4)|0;g=Fd(a,Ed(a,b)|0)|0;h=ae(a,4760,(j=i,i=i+16|0,c[j>>2]=d,c[j+8>>2]=g,j)|0)|0;i=j;Dh(a,b,h)|0;i=e;return f|0}function Ph(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if((sd(a,b+20|0)|0)!=0){i=e;return}if((d|0)==0){Eh(a,9568,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f;i=e;return}else{Eh(a,9856,(f=i,i=i+8|0,c[f>>2]=d,f)|0)|0;i=f;i=e;return}}function Qh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;if((Ed(a,b)|0)==(d|0)){i=e;return}f=Fd(a,d)|0;d=Fd(a,Ed(a,b)|0)|0;g=ae(a,4760,(h=i,i=i+16|0,c[h>>2]=f,c[h+8>>2]=d,h)|0)|0;i=h;Dh(a,b,g)|0;i=e;return}function Rh(a,b){a=a|0;b=b|0;if((Ed(a,b)|0)!=-1){return}Dh(a,b,9168)|0;return}function Sh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0.0,g=0,h=0,j=0;d=i;i=i+8|0;e=d|0;f=+Md(a,b,e);if((c[e>>2]|0)!=0){i=d;return+f}e=Fd(a,3)|0;g=Fd(a,Ed(a,b)|0)|0;h=ae(a,4760,(j=i,i=i+16|0,c[j>>2]=e,c[j+8>>2]=g,j)|0)|0;i=j;Dh(a,b,h)|0;i=d;return+f}function Th(a,b,d){a=a|0;b=b|0;d=+d;var e=0,f=0,g=0.0,h=0,j=0,k=0;e=i;i=i+8|0;f=e|0;if((Ed(a,b)|0)<1){g=d;i=e;return+g}d=+Md(a,b,f);if((c[f>>2]|0)!=0){g=d;i=e;return+g}f=Fd(a,3)|0;h=Fd(a,Ed(a,b)|0)|0;j=ae(a,4760,(k=i,i=i+16|0,c[k>>2]=f,c[k+8>>2]=h,k)|0)|0;i=k;Dh(a,b,j)|0;g=d;i=e;return+g}function Uh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+8|0;e=d|0;f=Nd(a,b,e)|0;if((c[e>>2]|0)!=0){i=d;return f|0}e=Fd(a,3)|0;g=Fd(a,Ed(a,b)|0)|0;h=ae(a,4760,(j=i,i=i+16|0,c[j>>2]=e,c[j+8>>2]=g,j)|0)|0;i=j;Dh(a,b,h)|0;i=d;return f|0}function Vh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+8|0;e=d|0;f=Od(a,b,e)|0;if((c[e>>2]|0)!=0){i=d;return f|0}e=Fd(a,3)|0;g=Fd(a,Ed(a,b)|0)|0;h=ae(a,4760,(j=i,i=i+16|0,c[j>>2]=e,c[j+8>>2]=g,j)|0)|0;i=j;Dh(a,b,h)|0;i=d;return f|0}function Wh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+8|0;f=e|0;if((Ed(a,b)|0)<1){g=d;i=e;return g|0}d=Nd(a,b,f)|0;if((c[f>>2]|0)!=0){g=d;i=e;return g|0}f=Fd(a,3)|0;h=Fd(a,Ed(a,b)|0)|0;j=ae(a,4760,(k=i,i=i+16|0,c[k>>2]=f,c[k+8>>2]=h,k)|0)|0;i=k;Dh(a,b,j)|0;g=d;i=e;return g|0}function Xh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;e=c[a+12>>2]|0;f=a+4|0;g=c[f>>2]|0;h=a+8|0;j=c[h>>2]|0;if((g-j|0)>>>0>=b>>>0){k=j;l=c[a>>2]|0;m=l+k|0;i=d;return m|0}n=g<<1;g=(n-j|0)>>>0<b>>>0?j+b|0:n;if(g>>>0<j>>>0|(g-j|0)>>>0<b>>>0){Eh(e,8856,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b}b=Fe(e,g)|0;j=a|0;nn(b|0,c[j>>2]|0,c[h>>2]|0)|0;if((c[j>>2]|0)!=(a+16|0)){zd(e,-2)}c[j>>2]=b;c[f>>2]=g;k=c[h>>2]|0;l=b;m=l+k|0;i=d;return m|0}function Yh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;f=c[a+12>>2]|0;g=a+4|0;h=c[g>>2]|0;j=a+8|0;k=c[j>>2]|0;if((h-k|0)>>>0>=d>>>0){l=k;m=c[a>>2]|0;n=m+l|0;nn(n|0,b|0,d)|0;o=c[j>>2]|0;p=o+d|0;c[j>>2]=p;i=e;return}q=h<<1;h=(q-k|0)>>>0<d>>>0?k+d|0:q;if(h>>>0<k>>>0|(h-k|0)>>>0<d>>>0){Eh(f,8856,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}k=Fe(f,h)|0;q=a|0;nn(k|0,c[q>>2]|0,c[j>>2]|0)|0;if((c[q>>2]|0)!=(a+16|0)){zd(f,-2)}c[q>>2]=k;c[g>>2]=h;l=c[j>>2]|0;m=k;n=m+l|0;nn(n|0,b|0,d)|0;o=c[j>>2]|0;p=o+d|0;c[j>>2]=p;i=e;return}function Zh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;e=jn(b|0)|0;f=c[a+12>>2]|0;g=a+4|0;h=c[g>>2]|0;j=a+8|0;k=c[j>>2]|0;if((h-k|0)>>>0>=e>>>0){l=k;m=c[a>>2]|0;n=m+l|0;nn(n|0,b|0,e)|0;o=c[j>>2]|0;p=o+e|0;c[j>>2]=p;i=d;return}q=h<<1;h=(q-k|0)>>>0<e>>>0?k+e|0:q;if(h>>>0<k>>>0|(h-k|0)>>>0<e>>>0){Eh(f,8856,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}k=Fe(f,h)|0;q=a|0;nn(k|0,c[q>>2]|0,c[j>>2]|0)|0;if((c[q>>2]|0)!=(a+16|0)){zd(f,-2)}c[q>>2]=k;c[g>>2]=h;l=c[j>>2]|0;m=k;n=m+l|0;nn(n|0,b|0,e)|0;o=c[j>>2]|0;p=o+e|0;c[j>>2]=p;i=d;return}function _h(a){a=a|0;var b=0,d=0;b=c[a+12>>2]|0;d=a|0;Zd(b,c[d>>2]|0,c[a+8>>2]|0)|0;if((c[d>>2]|0)==(a+16|0)){return}zd(b,-2);return}function $h(a,b){a=a|0;b=b|0;var d=0,e=0;d=a+8|0;e=(c[d>>2]|0)+b|0;c[d>>2]=e;d=c[a+12>>2]|0;b=a|0;Zd(d,c[b>>2]|0,e)|0;if((c[b>>2]|0)==(a+16|0)){return}zd(d,-2);return}function ai(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;b=i;i=i+8|0;d=b|0;e=a+12|0;f=c[e>>2]|0;g=Qd(f,-1,d)|0;h=a|0;j=a+16|0;if((c[h>>2]|0)!=(j|0)){Ad(f,-2)}k=c[d>>2]|0;d=c[e>>2]|0;e=a+4|0;l=c[e>>2]|0;m=a+8|0;a=c[m>>2]|0;if((l-a|0)>>>0>=k>>>0){n=a;o=c[h>>2]|0;p=o+n|0;nn(p|0,g|0,k)|0;q=c[m>>2]|0;r=q+k|0;c[m>>2]=r;s=c[h>>2]|0;t=(s|0)!=(j|0);u=t?-2:-1;zd(f,u);i=b;return}v=l<<1;l=(v-a|0)>>>0<k>>>0?a+k|0:v;if(l>>>0<a>>>0|(l-a|0)>>>0<k>>>0){Eh(d,8856,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a}a=Fe(d,l)|0;nn(a|0,c[h>>2]|0,c[m>>2]|0)|0;if((c[h>>2]|0)!=(j|0)){zd(d,-2)}c[h>>2]=a;c[e>>2]=l;n=c[m>>2]|0;o=a;p=o+n|0;nn(p|0,g|0,k)|0;q=c[m>>2]|0;r=q+k|0;c[m>>2]=r;s=c[h>>2]|0;t=(s|0)!=(j|0);u=t?-2:-1;zd(f,u);i=b;return}function bi(a,b){a=a|0;b=b|0;c[b+12>>2]=a;c[b>>2]=b+16;c[b+8>>2]=0;c[b+4>>2]=1024;return}function ci(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;c[b+12>>2]=a;e=b+16|0;f=b|0;c[f>>2]=e;g=b+8|0;c[g>>2]=0;h=b+4|0;c[h>>2]=1024;if(d>>>0<=1024>>>0){i=0;j=e;k=j+i|0;return k|0}b=d>>>0>2048>>>0?d:2048;d=Fe(a,b)|0;nn(d|0,c[f>>2]|0,c[g>>2]|0)|0;if((c[f>>2]|0)!=(e|0)){zd(a,-2)}c[f>>2]=d;c[h>>2]=b;i=c[g>>2]|0;j=d;k=j+i|0;return k|0}function di(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;if((Ed(a,-1)|0)==0){yd(a,-2);c=-1;return c|0}d=wd(a,b)|0;je(a,d,0);b=Nd(a,-1,0)|0;yd(a,-2);if((b|0)==0){e=(Rd(a,d)|0)+1|0}else{je(a,d,b);re(a,d,0);e=b}re(a,d,e);c=e;return c|0}function ei(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((c|0)<=-1){return}d=wd(a,b)|0;je(a,d,0);re(a,d,c);Xd(a,c);re(a,d,0);return}function fi(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;g=i;i=i+1032|0;h=g|0;j=(xd(b)|0)+1|0;do{if((e|0)==0){Zd(b,8640,6)|0;k=c[o>>2]|0;c[h+4>>2]=k;l=k}else{ae(b,8352,(m=i,i=i+8|0,c[m>>2]=e,m)|0)|0;i=m;k=xb(e|0,8176)|0;c[h+4>>2]=k;if((k|0)!=0){l=k;break}k=Qb(c[(Pb()|0)>>2]|0)|0;n=(Qd(b,j,0)|0)+1|0;ae(b,4872,(m=i,i=i+24|0,c[m>>2]=7936,c[m+8>>2]=n,c[m+16>>2]=k,m)|0)|0;i=m;zd(b,j);p=7;i=g;return p|0}}while(0);k=h|0;c[k>>2]=0;n=h+4|0;q=5008;r=l;while(1){l=Qa(r|0)|0;if((l|0)==-1){s=7;break}t=q+1|0;if((l|0)!=(d[q]|0)){u=l;s=12;break}v=c[k>>2]|0;c[k>>2]=v+1;a[h+8+v|0]=l;if((a[t]|0)==0){s=11;break}q=t;r=c[n>>2]|0}if((s|0)==7){w=(e|0)!=0}else if((s|0)==11){c[k>>2]=0;u=Qa(c[n>>2]|0)|0;s=12}a:do{if((s|0)==12){if((u|0)==35){do{r=Qa(c[n>>2]|0)|0}while(!((r|0)==(-1|0)|(r|0)==10));r=Qa(c[n>>2]|0)|0;q=c[k>>2]|0;c[k>>2]=q+1;a[h+8+q|0]=10;x=r}else{x=u}r=(e|0)!=0;do{if((x|0)==27&r){q=va(e|0,7592,c[n>>2]|0)|0;c[n>>2]=q;if((q|0)==0){t=Qb(c[(Pb()|0)>>2]|0)|0;l=(Qd(b,j,0)|0)+1|0;ae(b,4872,(m=i,i=i+24|0,c[m>>2]=7432,c[m+8>>2]=l,c[m+16>>2]=t,m)|0)|0;i=m;zd(b,j);p=7;i=g;return p|0}c[k>>2]=0;t=5008;l=q;while(1){q=Qa(l|0)|0;if((q|0)==-1){w=1;break a}v=t+1|0;if((q|0)!=(d[t]|0)){y=q;break}z=c[k>>2]|0;c[k>>2]=z+1;a[h+8+z|0]=q;if((a[v]|0)==0){s=23;break}t=v;l=c[n>>2]|0}if((s|0)==23){c[k>>2]=0;y=Qa(c[n>>2]|0)|0}if((y|0)!=35){A=y;break}do{l=Qa(c[n>>2]|0)|0}while(!((l|0)==(-1|0)|(l|0)==10));A=Qa(c[n>>2]|0)|0}else{A=x}}while(0);if((A|0)==-1){w=r;break}l=c[k>>2]|0;c[k>>2]=l+1;a[h+8+l|0]=A;w=r}}while(0);A=xe(b,34,h,Qd(b,-1,0)|0,f)|0;f=c[n>>2]|0;n=gb(f|0)|0;if(w){ua(f|0)|0}if((n|0)==0){zd(b,j);p=A;i=g;return p|0}else{yd(b,j);A=Qb(c[(Pb()|0)>>2]|0)|0;n=(Qd(b,j,0)|0)+1|0;ae(b,4872,(m=i,i=i+24|0,c[m>>2]=7232,c[m+8>>2]=n,c[m+16>>2]=A,m)|0)|0;i=m;zd(b,j);p=7;i=g;return p|0}return 0}function gi(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;c[h+4>>2]=d;d=xe(a,36,h,e,f)|0;i=g;return d|0}function hi(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((le(a,b)|0)==0){d=0;return d|0}_d(a,c)|0;ie(a,-2);if((Ed(a,-1)|0)==0){yd(a,-3);d=0;return d|0}else{zd(a,-2);d=1;return d|0}return 0}function ii(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=wd(a,b)|0;if((le(a,d)|0)==0){e=0;return e|0}_d(a,c)|0;ie(a,-2);if((Ed(a,-1)|0)==0){yd(a,-3);e=0;return e|0}else{zd(a,-2);Dd(a,d);ve(a,1,1,0,0);e=1;return e|0}return 0}function ji(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+8|0;e=d|0;Ee(a,b);b=Nd(a,-1,e)|0;if((c[e>>2]|0)!=0){yd(a,-2);i=d;return b|0}Eh(a,7048,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e;yd(a,-2);i=d;return b|0}function ki(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;do{if((ii(a,b,6832)|0)==0){f=Ed(a,b)|0;if((f|0)==3|(f|0)==4){Dd(a,b);break}else if((f|0)==0){Zd(a,6360,3)|0;break}else if((f|0)==1){f=(Pd(a,b)|0)!=0;_d(a,f?6648:6512)|0;break}else{f=Fd(a,Ed(a,b)|0)|0;g=Ud(a,b)|0;ae(a,6288,(h=i,i=i+16|0,c[h>>2]=f,c[h+8>>2]=g,h)|0)|0;i=h;break}}}while(0);b=Qd(a,-1,d)|0;i=e;return b|0}function li(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;vi(a,-1001e3,6200,1)|0;he(a,-1,b);if((Ed(a,-1)|0)==5){zd(a,-2);i=e;return}yd(a,-2);je(a,-1001e3,2);if((vi(a,0,b,d)|0)!=0){Eh(a,6008,(d=i,i=i+8|0,c[d>>2]=b,d)|0)|0;i=d}Dd(a,-1);pe(a,-3,b);zd(a,-2);i=e;return}function mi(a,b){a=a|0;b=+b;var d=0,e=0,f=0.0,g=0;d=i;e=vd(a)|0;do{if((e|0)==(vd(0)|0)){f=+h[e>>3];if(f==b){break}Eh(a,5560,(g=i,i=i+16|0,h[g>>3]=b,h[g+8>>3]=f,g)|0)|0;i=g}else{Eh(a,5752,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}}while(0);Wd(a,-4660.0);do{if((Nd(a,-1,0)|0)==-4660){if((Od(a,-1,0)|0)!=-4660){break}yd(a,-2);i=d;return}}while(0);Eh(a,5336,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;yd(a,-2);i=d;return}function ni(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;mi(a,502.0);if((sd(a,d+20|0)|0)==0){Eh(a,9856,(f=i,i=i+8|0,c[f>>2]=5872,f)|0)|0;i=f}f=b|0;if((c[f>>2]|0)==0){g=~d;yd(a,g);i=e;return}b=-2-d|0;h=-d|0;if((d|0)>0){j=f}else{k=f;do{be(a,c[k+4>>2]|0,d);pe(a,b,c[k>>2]|0);k=k+8|0;}while((c[k>>2]|0)!=0);g=~d;yd(a,g);i=e;return}do{k=0;do{Dd(a,h);k=k+1|0;}while((k|0)<(d|0));be(a,c[j+4>>2]|0,d);pe(a,b,c[j>>2]|0);j=j+8|0;}while((c[j>>2]|0)!=0);g=~d;yd(a,g);i=e;return}function oi(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;he(a,b,c);if((Ed(a,-1)|0)==5){d=1;return d|0}yd(a,-2);e=wd(a,b)|0;ke(a,0,0);Dd(a,-1);pe(a,e,c);d=0;return d|0}function pi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;be(a,c,0);_d(a,b)|0;ve(a,1,1,0,0);oi(a,-1001e3,6200)|0;Dd(a,-2);pe(a,-2,b);yd(a,-2);if((d|0)==0){return}Dd(a,-1);ne(a,b);return}function qi(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+1040|0;g=f|0;h=jn(d|0)|0;j=g+12|0;c[j>>2]=a;k=g+16|0;l=g|0;c[l>>2]=k;m=g+8|0;c[m>>2]=0;n=g+4|0;c[n>>2]=1024;g=Ga(b|0,d|0)|0;if((g|0)==0){o=b;p=a;q=1024;r=0}else{s=b;b=g;g=a;t=1024;u=0;while(1){v=b-s|0;if((t-u|0)>>>0<v>>>0){w=t<<1;x=(w-u|0)>>>0<v>>>0?u+v|0:w;if(x>>>0<u>>>0|(x-u|0)>>>0<v>>>0){Eh(g,8856,(y=i,i=i+1|0,i=i+7&-8,c[y>>2]=0,y)|0)|0;i=y}w=Fe(g,x)|0;nn(w|0,c[l>>2]|0,c[m>>2]|0)|0;if((c[l>>2]|0)!=(k|0)){zd(g,-2)}c[l>>2]=w;c[n>>2]=x;z=c[m>>2]|0;A=w}else{z=u;A=c[l>>2]|0}nn(A+z|0,s|0,v)|0;w=(c[m>>2]|0)+v|0;c[m>>2]=w;v=jn(e|0)|0;x=c[j>>2]|0;B=c[n>>2]|0;if((B-w|0)>>>0<v>>>0){C=B<<1;B=(C-w|0)>>>0<v>>>0?w+v|0:C;if(B>>>0<w>>>0|(B-w|0)>>>0<v>>>0){Eh(x,8856,(y=i,i=i+1|0,i=i+7&-8,c[y>>2]=0,y)|0)|0;i=y}C=Fe(x,B)|0;nn(C|0,c[l>>2]|0,c[m>>2]|0)|0;if((c[l>>2]|0)!=(k|0)){zd(x,-2)}c[l>>2]=C;c[n>>2]=B;D=c[m>>2]|0;E=C}else{D=w;E=c[l>>2]|0}nn(E+D|0,e|0,v)|0;w=(c[m>>2]|0)+v|0;c[m>>2]=w;v=b+h|0;C=Ga(v|0,d|0)|0;B=c[j>>2]|0;x=c[n>>2]|0;if((C|0)==0){o=v;p=B;q=x;r=w;break}else{s=v;b=C;g=B;t=x;u=w}}}u=jn(o|0)|0;if((q-r|0)>>>0<u>>>0){t=q<<1;q=(t-r|0)>>>0<u>>>0?r+u|0:t;if(q>>>0<r>>>0|(q-r|0)>>>0<u>>>0){Eh(p,8856,(y=i,i=i+1|0,i=i+7&-8,c[y>>2]=0,y)|0)|0;i=y}y=Fe(p,q)|0;nn(y|0,c[l>>2]|0,c[m>>2]|0)|0;if((c[l>>2]|0)!=(k|0)){zd(p,-2)}c[l>>2]=y;c[n>>2]=q;F=c[m>>2]|0;G=y}else{F=r;G=c[l>>2]|0}nn(G+F|0,o|0,u)|0;o=(c[m>>2]|0)+u|0;c[m>>2]=o;m=c[j>>2]|0;Zd(m,c[l>>2]|0,o)|0;if((c[l>>2]|0)==(k|0)){H=Qd(a,-1,0)|0;i=f;return H|0}zd(m,-2);H=Qd(a,-1,0)|0;i=f;return H|0}function ri(){var a=0;a=Jg(36,0)|0;if((a|0)==0){return a|0}ud(a,124)|0;return a|0}function si(a,b){a=a|0;b=b|0;var c=0,d=0;c=xd(a)|0;Te(a,4672,b)|0;je(a,-1001e3,2);b=c+1|0;if((yi(a,b,2)|0)==0){yd(a,c);d=0;return d|0}else{Cd(a,-1,b);yd(a,-3);d=1;return d|0}return 0}function ti(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;a=b;e=c[a>>2]|0;if((e|0)>0){c[d>>2]=e;c[a>>2]=0;f=b+8|0;return f|0}a=b+4|0;if(($b(c[a>>2]|0)|0)!=0){f=0;return f|0}e=b+8|0;c[d>>2]=Hb(e|0,1,1024,c[a>>2]|0)|0;f=e;return f|0}function ui(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;a=b+4|0;e=c[a>>2]|0;if((e|0)==0){f=0;return f|0}c[d>>2]=e;c[a>>2]=0;f=c[b>>2]|0;return f|0}function vi(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;if((c|0)==0){f=d}else{Dd(b,c);f=d}while(1){d=Va(f|0,46)|0;if((d|0)==0){g=f+(jn(f|0)|0)|0}else{g=d}d=g-f|0;Zd(b,f,d)|0;ie(b,-2);if((Ed(b,-1)|0)==0){yd(b,-2);ke(b,0,(a[g]|0)==46?1:e);Zd(b,f,d)|0;Dd(b,-2);oe(b,-4)}else{if((Ed(b,-1)|0)!=5){break}}zd(b,-2);if((a[g]|0)==46){f=g+1|0}else{h=0;i=10;break}}if((i|0)==10){return h|0}yd(b,-3);h=f;return h|0}function wi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;if((d|0)==0){Xm(b);e=0}else{e=Ym(b,d)|0}return e|0}function xi(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[p>>2]|0;e=Qd(a,-1,0)|0;Yb(d|0,5176,(a=i,i=i+8|0,c[a>>2]=e,a)|0)|0;i=a;wa(d|0)|0;i=b;return 0}function yi(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;if((c|0)==0){d=0;return d|0}if((Ed(a,-1)|0)!=5){d=0;return d|0}Vd(a);if((Ce(a,-2)|0)==0){d=0;return d|0}e=c-1|0;while(1){if((Ed(a,-2)|0)==4){if((Kd(a,b,-1)|0)!=0){f=7;break}if((yi(a,b,e)|0)!=0){f=9;break}}yd(a,-2);if((Ce(a,-2)|0)==0){d=0;f=11;break}}if((f|0)==7){yd(a,-2);d=1;return d|0}else if((f|0)==9){zd(a,-2);Zd(a,4552,1)|0;Ad(a,-2);De(a,3);d=1;return d|0}else if((f|0)==11){return d|0}return 0}function zi(a){a=a|0;pi(a,12352,308,1);yd(a,-2);pi(a,8656,198,1);yd(a,-2);pi(a,6656,346,1);yd(a,-2);pi(a,5128,342,1);yd(a,-2);pi(a,4096,78,1);yd(a,-2);pi(a,3768,154,1);yd(a,-2);pi(a,3376,116,1);yd(a,-2);pi(a,2880,316,1);yd(a,-2);pi(a,2592,88,1);yd(a,-2);pi(a,13600,216,1);yd(a,-2);oi(a,-1001e3,5424)|0;yd(a,-2);return}function Ai(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=d+b|0;f=e-1|0;g=c[a+20>>2]|0;do{if((g|0)>(c[a+24>>2]|0)){h=(c[(c[a>>2]|0)+12>>2]|0)+(g-1<<2)|0;i=c[h>>2]|0;if((i&63|0)!=4){break}j=i>>>6&255;k=j+(i>>>23)|0;if((j|0)>(b|0)|(k+1|0)<(b|0)){if((j|0)<(b|0)|(j|0)>(e|0)){break}}l=(j|0)<(b|0)?j:b;c[h>>2]=((k|0)>(f|0)?k:f)-l<<23|l<<6&16320|i&8372287;return}}while(0);fj(a,b<<6|(d<<23)-8388608|4)|0;return}function Bi(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return fj(a,c<<6|b|d<<23|e<<14)|0}function Ci(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;b=a+28|0;d=c[b>>2]|0;c[b>>2]=-1;b=fj(a,2147450903)|0;if((d|0)==-1){e=b;return e|0}if((b|0)==-1){e=d;return e|0}f=c[(c[a>>2]|0)+12>>2]|0;g=b;while(1){h=f+(g<<2)|0;i=c[h>>2]|0;j=(i>>>14)-131071|0;if((j|0)==-1){break}k=g+1+j|0;if((k|0)==-1){break}else{g=k}}f=d+~g|0;if((((f|0)>-1?f:-f|0)|0)>131071){nj(c[a+12>>2]|0,5096);return 0}c[h>>2]=(f<<14)+2147467264|i&16383;e=b;return e|0}function Di(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return fj(a,c<<6|b|d<<14)|0}function Ei(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;if((d|0)==-1){return}e=c[b>>2]|0;if((e|0)==-1){c[b>>2]=d;return}b=c[(c[a>>2]|0)+12>>2]|0;f=e;while(1){g=b+(f<<2)|0;h=c[g>>2]|0;e=(h>>>14)-131071|0;if((e|0)==-1){break}i=f+1+e|0;if((i|0)==-1){break}else{f=i}}b=~f+d|0;if((((b|0)>-1?b:-b|0)|0)>131071){nj(c[a+12>>2]|0,5096)}c[g>>2]=h&16383|(b<<14)+2147467264;return}function Fi(a,b,c){a=a|0;b=b|0;c=c|0;fj(a,b<<6|(c<<23)+8388608|31)|0;return}function Gi(a){a=a|0;var b=0;b=c[a+20>>2]|0;c[a+24>>2]=b;return b|0}function Hi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((c[b+20>>2]|0)==(e|0)){c[b+24>>2]=e;f=b+28|0;if((d|0)==-1){return}g=c[f>>2]|0;if((g|0)==-1){c[f>>2]=d;return}f=c[(c[b>>2]|0)+12>>2]|0;h=g;while(1){i=f+(h<<2)|0;j=c[i>>2]|0;g=(j>>>14)-131071|0;if((g|0)==-1){break}k=h+1+g|0;if((k|0)==-1){break}else{h=k}}f=~h+d|0;if((((f|0)>-1?f:-f|0)|0)>131071){nj(c[b+12>>2]|0,5096)}c[i>>2]=(f<<14)+2147467264|j&16383;return}if((d|0)==-1){return}j=b|0;f=d;while(1){d=c[(c[j>>2]|0)+12>>2]|0;i=d+(f<<2)|0;h=c[i>>2]|0;k=(h>>>14)-131071|0;if((k|0)==-1){l=-1}else{l=f+1+k|0}if((f|0)>0){k=d+(f-1<<2)|0;d=c[k>>2]|0;if((a[1184+(d&63)|0]|0)<0){m=k;n=d}else{o=17}}else{o=17}if((o|0)==17){o=0;m=i;n=h}if((n&63|0)==28){c[m>>2]=n&8372224|n>>>23<<6|27;d=(c[(c[j>>2]|0)+12>>2]|0)+(f<<2)|0;k=~f+e|0;if((((k|0)>-1?k:-k|0)|0)>131071){o=20;break}c[d>>2]=c[d>>2]&16383|(k<<14)+2147467264}else{k=~f+e|0;if((((k|0)>-1?k:-k|0)|0)>131071){o=23;break}c[i>>2]=h&16383|(k<<14)+2147467264}if((l|0)==-1){o=26;break}else{f=l}}if((o|0)==20){nj(c[b+12>>2]|0,5096)}else if((o|0)==23){nj(c[b+12>>2]|0,5096)}else if((o|0)==26){return}}function Ii(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;c[a+24>>2]=c[a+20>>2];d=a+28|0;if((b|0)==-1){return}e=c[d>>2]|0;if((e|0)==-1){c[d>>2]=b;return}d=c[(c[a>>2]|0)+12>>2]|0;f=e;while(1){g=d+(f<<2)|0;h=c[g>>2]|0;e=(h>>>14)-131071|0;if((e|0)==-1){break}i=f+1+e|0;if((i|0)==-1){break}else{f=i}}d=~f+b|0;if((((d|0)>-1?d:-d|0)|0)>131071){nj(c[a+12>>2]|0,5096)}c[g>>2]=(d<<14)+2147467264|h&16383;return}function Ji(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;if((b|0)==-1){return}e=a|0;a=(d<<6)+64&16320;d=b;while(1){f=(c[(c[e>>2]|0)+12>>2]|0)+(d<<2)|0;g=c[f>>2]|0;b=(g>>>14)-131071|0;if((b|0)==-1){break}h=d+1+b|0;c[f>>2]=g&-16321|a;if((h|0)==-1){i=6;break}else{d=h}}if((i|0)==6){return}c[f>>2]=g&-16321|a;return}function Ki(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=b<<6;if((c|0)<262144){e=fj(a,d|c<<14|1)|0;return e|0}else{b=fj(a,d|2)|0;fj(a,c<<6|39)|0;e=b;return e|0}return 0}function Li(b,e){b=b|0;e=e|0;var f=0;f=(d[b+48|0]|0)+e|0;e=(c[b>>2]|0)+78|0;if((f|0)<=(d[e]|0|0)){return}if((f|0)>249){nj(c[b+12>>2]|0,5136)}a[e]=f;return}function Mi(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b+48|0;g=a[f]|0;h=(g&255)+e|0;i=(c[b>>2]|0)+78|0;if((h|0)<=(d[i]|0|0)){j=g;k=j&255;l=k+e|0;m=l&255;a[f]=m;return}if((h|0)>249){nj(c[b+12>>2]|0,5136)}a[i]=h;j=a[f]|0;k=j&255;l=k+e|0;m=l&255;a[f]=m;return}function Ni(a,b){a=a|0;b=b|0;var e=0,f=0;e=i;i=i+16|0;f=e|0;c[f>>2]=b;c[f+8>>2]=d[b+4|0]|0|64;b=gj(a,f,f)|0;i=e;return b|0}function Oi(a,b){a=a|0;b=+b;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h[f>>3]=b;j=c[(c[a+12>>2]|0)+52>>2]|0;h[g>>3]=b;c[g+8>>2]=3;if(b==0.0){k=j+8|0;l=c[k>>2]|0;c[k>>2]=l+16;m=Rg(j,f,8)|0;c[l>>2]=m;c[l+8>>2]=d[m+4|0]|0|64;m=gj(a,(c[k>>2]|0)-16|0,g)|0;c[k>>2]=(c[k>>2]|0)-16;n=m;i=e;return n|0}else{n=gj(a,g,g)|0;i=e;return n|0}return 0}function Pi(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=c[e>>2]|0;if((g|0)==13){h=e+8|0;i=b|0;j=(c[(c[i>>2]|0)+12>>2]|0)+(c[h>>2]<<2)|0;c[j>>2]=c[j>>2]&8388607|(f<<23)+8388608;j=(c[(c[i>>2]|0)+12>>2]|0)+(c[h>>2]<<2)|0;h=b+48|0;c[j>>2]=(d[h]|0)<<6|c[j>>2]&-16321;j=a[h]|0;k=(j&255)+1|0;l=(c[i>>2]|0)+78|0;do{if(k>>>0>(d[l]|0)>>>0){if(k>>>0>249>>>0){nj(c[b+12>>2]|0,5136)}else{a[l]=k;m=a[h]|0;break}}else{m=j}}while(0);a[h]=m+1;return}else if((g|0)==12){g=(c[(c[b>>2]|0)+12>>2]|0)+(c[e+8>>2]<<2)|0;c[g>>2]=c[g>>2]&-8372225|(f<<14)+16384&8372224;return}else{return}}function Qi(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b|0;e=c[d>>2]|0;if((e|0)==13){f=(c[(c[a>>2]|0)+12>>2]|0)+(c[b+8>>2]<<2)|0;c[f>>2]=c[f>>2]&8388607|16777216;c[d>>2]=11;return}else if((e|0)==12){c[d>>2]=6;d=b+8|0;c[d>>2]=(c[(c[(c[a>>2]|0)+12>>2]|0)+(c[d>>2]<<2)>>2]|0)>>>6&255;return}else{return}}function Ri(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;g=f|0;switch(c[g>>2]|0){case 13:{h=(c[(c[e>>2]|0)+12>>2]|0)+(c[f+8>>2]<<2)|0;c[h>>2]=c[h>>2]&8388607|16777216;c[g>>2]=11;return};case 12:{c[g>>2]=6;h=f+8|0;c[h>>2]=(c[(c[(c[e>>2]|0)+12>>2]|0)+(c[h>>2]<<2)>>2]|0)>>>6&255;return};case 8:{h=f+8|0;c[h>>2]=fj(e,c[h>>2]<<23|5)|0;c[g>>2]=11;return};case 9:{h=f+8|0;f=h;i=h;j=b[i>>1]|0;do{if((j&256|0)==0){if((d[e+46|0]|0)>(j|0)){break}k=e+48|0;a[k]=(a[k]|0)-1}}while(0);j=f+2|0;do{if((a[f+3|0]|0)==7){if((d[e+46|0]|0)>>>0>(d[j]|0)>>>0){l=7;break}k=e+48|0;a[k]=(a[k]|0)-1;l=7}else{l=6}}while(0);c[h>>2]=fj(e,d[j]<<23|l|b[i>>1]<<14)|0;c[g>>2]=11;return};case 7:{c[g>>2]=6;return};default:{return}}}function Si(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;Ri(b,e);do{if((c[e>>2]|0)==6){f=c[e+8>>2]|0;if((f&256|0)!=0){break}if((d[b+46|0]|0|0)>(f|0)){break}f=b+48|0;a[f]=(a[f]|0)-1}}while(0);f=b+48|0;g=a[f]|0;h=(g&255)+1|0;i=(c[b>>2]|0)+78|0;if(h>>>0<=(d[i]|0)>>>0){j=g;k=j+1&255;a[f]=k;l=k&255;m=l-1|0;hj(b,e,m);return}if(h>>>0>249>>>0){nj(c[b+12>>2]|0,5136)}a[i]=h;j=a[f]|0;k=j+1&255;a[f]=k;l=k&255;m=l-1|0;hj(b,e,m);return}function Ti(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;Ri(a,b);do{if((c[b>>2]|0)==6){e=b+8|0;f=c[e>>2]|0;if((c[b+16>>2]|0)==(c[b+20>>2]|0)){g=f;return g|0}if((f|0)<(d[a+46|0]|0|0)){h=e;break}hj(a,b,f);g=c[e>>2]|0;return g|0}else{h=b+8|0}}while(0);Si(a,b);g=c[h>>2]|0;return g|0}function Ui(a,b){a=a|0;b=b|0;var e=0,f=0;e=b|0;do{if((c[e>>2]|0)==8){if((c[b+16>>2]|0)!=(c[b+20>>2]|0)){break}return}}while(0);Ri(a,b);do{if((c[e>>2]|0)==6){f=c[b+8>>2]|0;if((c[b+16>>2]|0)==(c[b+20>>2]|0)){return}if((f|0)<(d[a+46|0]|0|0)){break}hj(a,b,f);return}}while(0);Si(a,b);return}function Vi(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;e=b+16|0;f=b+20|0;if((c[e>>2]|0)==(c[f>>2]|0)){Ri(a,b);return}Ri(a,b);do{if((c[b>>2]|0)==6){g=c[b+8>>2]|0;if((c[e>>2]|0)==(c[f>>2]|0)){return}if((g|0)<(d[a+46|0]|0|0)){break}hj(a,b,g);return}}while(0);Si(a,b);return}function Wi(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0.0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;e=i;i=i+72|0;f=e|0;g=e+8|0;j=e+24|0;k=e+40|0;l=e+56|0;m=b+16|0;n=b+20|0;o=(c[m>>2]|0)==(c[n>>2]|0);Ri(a,b);p=b|0;a:do{if(!o){do{if((c[p>>2]|0)==6){q=c[b+8>>2]|0;if((c[m>>2]|0)==(c[n>>2]|0)){break a}if((q|0)<(d[a+46|0]|0|0)){break}hj(a,b,q);break a}}while(0);Si(a,b)}}while(0);o=c[p>>2]|0;b:do{switch(o|0){case 2:case 3:case 1:{if((c[a+32>>2]|0)>=256){break b}if((o|0)==1){c[l+8>>2]=0;c[k>>2]=c[a+4>>2];c[k+8>>2]=69;r=gj(a,k,l)|0}else{c[j>>2]=(o|0)==2;c[j+8>>2]=1;r=gj(a,j,j)|0}c[b+8>>2]=r;c[p>>2]=4;s=r|256;i=e;return s|0};case 5:{q=b+8|0;t=+h[q>>3];h[f>>3]=t;u=c[(c[a+12>>2]|0)+52>>2]|0;h[g>>3]=t;c[g+8>>2]=3;if(t==0.0){v=u+8|0;w=c[v>>2]|0;c[v>>2]=w+16;x=Rg(u,f,8)|0;c[w>>2]=x;c[w+8>>2]=d[x+4|0]|0|64;x=gj(a,(c[v>>2]|0)-16|0,g)|0;c[v>>2]=(c[v>>2]|0)-16;y=x}else{y=gj(a,g,g)|0}c[q>>2]=y;c[p>>2]=4;z=y;A=18;break};case 4:{z=c[b+8>>2]|0;A=18;break};default:{}}}while(0);do{if((A|0)==18){if((z|0)>=256){break}s=z|256;i=e;return s|0}}while(0);Ri(a,b);do{if((c[p>>2]|0)==6){z=b+8|0;A=c[z>>2]|0;if((c[m>>2]|0)==(c[n>>2]|0)){s=A;i=e;return s|0}if((A|0)<(d[a+46|0]|0|0)){B=z;break}hj(a,b,A);s=c[z>>2]|0;i=e;return s|0}else{B=b+8|0}}while(0);Si(a,b);s=c[B>>2]|0;i=e;return s|0}function Xi(b,f,g){b=b|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0;h=c[f>>2]|0;if((h|0)==7){do{if((c[g>>2]|0)==6){i=c[g+8>>2]|0;if((i&256|0)!=0){break}if((d[b+46|0]|0)>(i|0)){break}i=b+48|0;a[i]=(a[i]|0)-1}}while(0);hj(b,g,c[f+8>>2]|0);return}else if((h|0)==8){Ri(b,g);do{if((c[g>>2]|0)==6){i=g+8|0;j=c[i>>2]|0;if((c[g+16>>2]|0)==(c[g+20>>2]|0)){k=j;break}if((j|0)<(d[b+46|0]|0)){l=i;m=12;break}hj(b,g,j);k=c[i>>2]|0}else{l=g+8|0;m=12}}while(0);if((m|0)==12){Si(b,g);k=c[l>>2]|0}fj(b,k<<6|c[f+8>>2]<<23|9)|0}else if((h|0)==9){h=f+8|0;f=h;k=(a[f+3|0]|0)==7?10:8;l=Wi(b,g)|0;fj(b,l<<14|k|d[f+2|0]<<6|e[h>>1]<<23)|0}if((c[g>>2]|0)!=6){return}h=c[g+8>>2]|0;if((h&256|0)!=0){return}if((d[b+46|0]|0)>(h|0)){return}h=b+48|0;a[h]=(a[h]|0)-1;return}function Yi(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;Ri(b,e);g=e|0;do{if((c[g>>2]|0)==6){h=e+8|0;i=c[h>>2]|0;if((c[e+16>>2]|0)==(c[e+20>>2]|0)){j=h;break}if((i|0)<(d[b+46|0]|0|0)){k=h;l=6;break}hj(b,e,i);j=h}else{k=e+8|0;l=6}}while(0);if((l|0)==6){Si(b,e);j=k}k=c[j>>2]|0;do{if((c[g>>2]|0)==6&(k&256|0)==0){if((d[b+46|0]|0|0)>(k|0)){break}e=b+48|0;a[e]=(a[e]|0)-1}}while(0);e=b+48|0;c[j>>2]=d[e]|0;c[g>>2]=6;g=a[e]|0;l=(g&255)+2|0;h=(c[b>>2]|0)+78|0;do{if(l>>>0>(d[h]|0)>>>0){if(l>>>0>249>>>0){nj(c[b+12>>2]|0,5136)}else{a[h]=l;m=a[e]|0;break}}else{m=g}}while(0);a[e]=m+2;m=c[j>>2]|0;fj(b,k<<23|m<<6|(Wi(b,f)|0)<<14|12)|0;if((c[f>>2]|0)!=6){return}m=c[f+8>>2]|0;if((m&256|0)!=0){return}if((d[b+46|0]|0|0)>(m|0)){return}a[e]=(a[e]|0)-1;return}function Zi(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;Ri(b,e);f=e|0;g=c[f>>2]|0;a:do{if((g|0)==10){h=c[(c[b>>2]|0)+12>>2]|0;i=e+8|0;j=c[i>>2]|0;k=h+(j<<2)|0;if((j|0)>0){l=h+(j-1<<2)|0;j=c[l>>2]|0;if((a[1184+(j&63)|0]|0)<0){m=l;n=j}else{o=4}}else{o=4}if((o|0)==4){m=k;n=c[k>>2]|0}c[m>>2]=((n&16320|0)==0)<<6|n&-16321;p=c[i>>2]|0;o=32}else if(!((g|0)==4|(g|0)==5|(g|0)==2)){i=e+8|0;do{if((g|0)==11){k=b|0;j=c[(c[(c[k>>2]|0)+12>>2]|0)+(c[i>>2]<<2)>>2]|0;if((j&63|0)!=20){o=16;break}l=b+20|0;c[l>>2]=(c[l>>2]|0)-1;fj(b,j>>>23<<6|16411)|0;j=b+28|0;l=c[j>>2]|0;c[j>>2]=-1;j=fj(b,2147450903)|0;if((l|0)==-1){p=j;o=32;break a}if((j|0)==-1){q=l;o=33;break a}h=c[(c[k>>2]|0)+12>>2]|0;k=j;while(1){r=h+(k<<2)|0;s=c[r>>2]|0;t=(s>>>14)-131071|0;if((t|0)==-1){break}u=k+1+t|0;if((u|0)==-1){break}else{k=u}}h=l+~k|0;if((((h|0)>-1?h:-h|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[r>>2]=(h<<14)+2147467264|s&16383;p=j;o=32;break a}}else if((g|0)==6){o=21}else{o=16}}while(0);if((o|0)==16){h=b+48|0;u=a[h]|0;t=(u&255)+1|0;v=(c[b>>2]|0)+78|0;do{if(t>>>0>(d[v]|0)>>>0){if(t>>>0>249>>>0){nj(c[b+12>>2]|0,5136)}else{a[v]=t;w=a[h]|0;break}}else{w=u}}while(0);u=w+1&255;a[h]=u;ij(b,e,(u&255)-1|0);if((c[f>>2]|0)==6){o=21}}do{if((o|0)==21){u=c[i>>2]|0;if((u&256|0)!=0){break}if((d[b+46|0]|0)>(u|0)){break}u=b+48|0;a[u]=(a[u]|0)-1}}while(0);fj(b,c[i>>2]<<23|16348)|0;h=b+28|0;u=c[h>>2]|0;c[h>>2]=-1;h=fj(b,2147450903)|0;if((u|0)==-1){p=h;o=32;break}if((h|0)==-1){q=u;o=33;break}t=c[(c[b>>2]|0)+12>>2]|0;v=h;while(1){x=t+(v<<2)|0;y=c[x>>2]|0;z=(y>>>14)-131071|0;if((z|0)==-1){break}A=v+1+z|0;if((A|0)==-1){break}else{v=A}}t=u+~v|0;if((((t|0)>-1?t:-t|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[x>>2]=(t<<14)+2147467264|y&16383;p=h;o=32;break}}}while(0);if((o|0)==32){if((p|0)!=-1){q=p;o=33}}do{if((o|0)==33){p=e+20|0;y=c[p>>2]|0;if((y|0)==-1){c[p>>2]=q;break}p=c[(c[b>>2]|0)+12>>2]|0;x=y;while(1){B=p+(x<<2)|0;C=c[B>>2]|0;y=(C>>>14)-131071|0;if((y|0)==-1){break}f=x+1+y|0;if((f|0)==-1){break}else{x=f}}p=q+~x|0;if((((p|0)>-1?p:-p|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[B>>2]=(p<<14)+2147467264|C&16383;break}}}while(0);C=e+16|0;e=c[C>>2]|0;c[b+24>>2]=c[b+20>>2];B=b+28|0;if((e|0)==-1){c[C>>2]=-1;return}q=c[B>>2]|0;if((q|0)==-1){c[B>>2]=e;c[C>>2]=-1;return}B=c[(c[b>>2]|0)+12>>2]|0;o=q;while(1){D=B+(o<<2)|0;E=c[D>>2]|0;q=(E>>>14)-131071|0;if((q|0)==-1){break}p=o+1+q|0;if((p|0)==-1){break}else{o=p}}B=e+~o|0;if((((B|0)>-1?B:-B|0)|0)>131071){nj(c[b+12>>2]|0,5096)}c[D>>2]=(B<<14)+2147467264|E&16383;c[C>>2]=-1;return}function _i(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;Ri(b,e);f=e|0;g=c[f>>2]|0;a:do{if((g|0)==10){h=c[e+8>>2]|0;i=29}else if(!((g|0)==1|(g|0)==3)){j=e+8|0;do{if((g|0)==11){k=b|0;l=c[(c[(c[k>>2]|0)+12>>2]|0)+(c[j>>2]<<2)>>2]|0;if((l&63|0)!=20){i=13;break}m=b+20|0;c[m>>2]=(c[m>>2]|0)-1;fj(b,l>>>23<<6|27)|0;l=b+28|0;m=c[l>>2]|0;c[l>>2]=-1;l=fj(b,2147450903)|0;if((m|0)==-1){h=l;i=29;break a}if((l|0)==-1){n=m;i=30;break a}o=c[(c[k>>2]|0)+12>>2]|0;k=l;while(1){p=o+(k<<2)|0;q=c[p>>2]|0;r=(q>>>14)-131071|0;if((r|0)==-1){break}s=k+1+r|0;if((s|0)==-1){break}else{k=s}}o=m+~k|0;if((((o|0)>-1?o:-o|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[p>>2]=(o<<14)+2147467264|q&16383;h=l;i=29;break a}}else if((g|0)==6){i=18}else{i=13}}while(0);if((i|0)==13){o=b+48|0;s=a[o]|0;r=(s&255)+1|0;t=(c[b>>2]|0)+78|0;do{if(r>>>0>(d[t]|0)>>>0){if(r>>>0>249>>>0){nj(c[b+12>>2]|0,5136)}else{a[t]=r;u=a[o]|0;break}}else{u=s}}while(0);s=u+1&255;a[o]=s;ij(b,e,(s&255)-1|0);if((c[f>>2]|0)==6){i=18}}do{if((i|0)==18){s=c[j>>2]|0;if((s&256|0)!=0){break}if((d[b+46|0]|0|0)>(s|0)){break}s=b+48|0;a[s]=(a[s]|0)-1}}while(0);fj(b,c[j>>2]<<23|32732)|0;o=b+28|0;s=c[o>>2]|0;c[o>>2]=-1;o=fj(b,2147450903)|0;if((s|0)==-1){h=o;i=29;break}if((o|0)==-1){n=s;i=30;break}r=c[(c[b>>2]|0)+12>>2]|0;t=o;while(1){v=r+(t<<2)|0;w=c[v>>2]|0;x=(w>>>14)-131071|0;if((x|0)==-1){break}y=t+1+x|0;if((y|0)==-1){break}else{t=y}}r=s+~t|0;if((((r|0)>-1?r:-r|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[v>>2]=(r<<14)+2147467264|w&16383;h=o;i=29;break}}}while(0);if((i|0)==29){if((h|0)!=-1){n=h;i=30}}do{if((i|0)==30){h=e+16|0;w=c[h>>2]|0;if((w|0)==-1){c[h>>2]=n;break}h=c[(c[b>>2]|0)+12>>2]|0;v=w;while(1){z=h+(v<<2)|0;A=c[z>>2]|0;w=(A>>>14)-131071|0;if((w|0)==-1){break}f=v+1+w|0;if((f|0)==-1){break}else{v=f}}h=n+~v|0;if((((h|0)>-1?h:-h|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[z>>2]=(h<<14)+2147467264|A&16383;break}}}while(0);A=e+20|0;e=c[A>>2]|0;c[b+24>>2]=c[b+20>>2];z=b+28|0;if((e|0)==-1){c[A>>2]=-1;return}n=c[z>>2]|0;if((n|0)==-1){c[z>>2]=e;c[A>>2]=-1;return}z=c[(c[b>>2]|0)+12>>2]|0;i=n;while(1){B=z+(i<<2)|0;C=c[B>>2]|0;n=(C>>>14)-131071|0;if((n|0)==-1){break}h=i+1+n|0;if((h|0)==-1){break}else{i=h}}z=e+~i|0;if((((z|0)>-1?z:-z|0)|0)>131071){nj(c[b+12>>2]|0,5096)}c[B>>2]=(z<<14)+2147467264|C&16383;c[A>>2]=-1;return}function $i(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0;g=e+8|0;h=g;a[h+2|0]=c[g>>2];b[g>>1]=Wi(d,f)|0;f=e|0;a[h+3|0]=(c[f>>2]|0)==8?8:7;c[f>>2]=9;return}function aj(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;j=i;i=i+24|0;k=j|0;c[k+20>>2]=-1;c[k+16>>2]=-1;c[k>>2]=5;h[k+8>>3]=0.0;if((e|0)==1){Ri(b,f);l=f|0;a:do{switch(c[l>>2]|0){case 1:case 3:{c[l>>2]=2;break};case 4:case 5:case 2:{c[l>>2]=3;break};case 10:{m=c[(c[b>>2]|0)+12>>2]|0;n=c[f+8>>2]|0;o=m+(n<<2)|0;if((n|0)>0){p=m+(n-1<<2)|0;n=c[p>>2]|0;if((a[1184+(n&63)|0]|0)<0){q=p;r=n}else{s=17}}else{s=17}if((s|0)==17){q=o;r=c[o>>2]|0}c[q>>2]=((r&16320|0)==0)<<6|r&-16321;break};case 11:{o=b+48|0;n=a[o]|0;p=(n&255)+1|0;m=(c[b>>2]|0)+78|0;do{if(p>>>0>(d[m]|0)>>>0){if(p>>>0>249>>>0){nj(c[b+12>>2]|0,5136)}else{a[m]=p;t=a[o]|0;break}}else{t=n}}while(0);n=t+1&255;a[o]=n;ij(b,f,(n&255)-1|0);if((c[l>>2]|0)==6){s=25;break a}u=f+8|0;s=28;break};case 6:{s=25;break};default:{}}}while(0);do{if((s|0)==25){t=f+8|0;r=c[t>>2]|0;if((r&256|0)!=0){u=t;s=28;break}if((d[b+46|0]|0)>(r|0)){u=t;s=28;break}r=b+48|0;a[r]=(a[r]|0)-1;u=t;s=28}}while(0);if((s|0)==28){c[u>>2]=fj(b,c[u>>2]<<23|20)|0;c[l>>2]=11}l=f+20|0;u=c[l>>2]|0;t=f+16|0;r=c[t>>2]|0;c[l>>2]=r;c[t>>2]=u;if((r|0)==-1){v=u}else{u=b|0;l=r;r=c[(c[u>>2]|0)+12>>2]|0;while(1){q=r+(l<<2)|0;if((l|0)>0){n=r+(l-1<<2)|0;p=c[n>>2]|0;if((a[1184+(p&63)|0]|0)<0){w=n;x=p}else{s=33}}else{s=33}if((s|0)==33){s=0;w=q;x=c[q>>2]|0}if((x&63|0)==28){c[w>>2]=x&8372224|x>>>23<<6|27;y=c[(c[u>>2]|0)+12>>2]|0}else{y=r}q=((c[y+(l<<2)>>2]|0)>>>14)-131071|0;if((q|0)==-1){break}p=l+1+q|0;if((p|0)==-1){break}else{l=p;r=y}}v=c[t>>2]|0}if((v|0)==-1){i=j;return}t=b|0;y=v;v=c[(c[t>>2]|0)+12>>2]|0;while(1){r=v+(y<<2)|0;if((y|0)>0){l=v+(y-1<<2)|0;u=c[l>>2]|0;if((a[1184+(u&63)|0]|0)<0){z=l;A=u}else{s=43}}else{s=43}if((s|0)==43){s=0;z=r;A=c[r>>2]|0}if((A&63|0)==28){c[z>>2]=A&8372224|A>>>23<<6|27;B=c[(c[t>>2]|0)+12>>2]|0}else{B=v}r=((c[B+(y<<2)>>2]|0)>>>14)-131071|0;if((r|0)==-1){s=54;break}u=y+1+r|0;if((u|0)==-1){s=54;break}else{y=u;v=B}}if((s|0)==54){i=j;return}}else if((e|0)==0){B=f|0;do{if((c[B>>2]|0)==5){if((c[f+16>>2]|0)!=-1){break}if((c[f+20>>2]|0)!=-1){break}v=f+8|0;h[v>>3]=-0.0- +h[v>>3];i=j;return}}while(0);Ri(b,f);do{if((c[B>>2]|0)==6){v=c[f+8>>2]|0;if((c[f+16>>2]|0)==(c[f+20>>2]|0)){break}if((v|0)<(d[b+46|0]|0)){s=10;break}hj(b,f,v)}else{s=10}}while(0);if((s|0)==10){Si(b,f)}jj(b,19,f,k,g);i=j;return}else if((e|0)==2){Ri(b,f);do{if((c[f>>2]|0)==6){e=c[f+8>>2]|0;if((c[f+16>>2]|0)==(c[f+20>>2]|0)){break}if((e|0)<(d[b+46|0]|0)){s=52;break}hj(b,f,e)}else{s=52}}while(0);if((s|0)==52){Si(b,f)}jj(b,21,f,k,g);i=j;return}else{i=j;return}}function bj(a,b,d){a=a|0;b=b|0;d=d|0;switch(b|0){case 0:case 1:case 2:case 3:case 4:case 5:{do{if((c[d>>2]|0)==5){if((c[d+16>>2]|0)!=-1){break}if((c[d+20>>2]|0)!=-1){break}return}}while(0);Wi(a,d)|0;return};case 13:{Zi(a,d);return};case 6:{Si(a,d);return};case 14:{_i(a,d);return};default:{Wi(a,d)|0;return}}}function cj(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;switch(e|0){case 13:{Ri(b,g);i=g+20|0;j=c[f+20>>2]|0;do{if((j|0)!=-1){k=c[i>>2]|0;if((k|0)==-1){c[i>>2]=j;break}l=c[(c[b>>2]|0)+12>>2]|0;m=k;while(1){n=l+(m<<2)|0;o=c[n>>2]|0;k=(o>>>14)-131071|0;if((k|0)==-1){break}p=m+1+k|0;if((p|0)==-1){break}else{m=p}}l=j+~m|0;if((((l|0)>-1?l:-l|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[n>>2]=(l<<14)+2147467264|o&16383;break}}}while(0);o=f;n=g;c[o>>2]=c[n>>2];c[o+4>>2]=c[n+4>>2];c[o+8>>2]=c[n+8>>2];c[o+12>>2]=c[n+12>>2];c[o+16>>2]=c[n+16>>2];c[o+20>>2]=c[n+20>>2];return};case 14:{Ri(b,g);n=g+16|0;o=c[f+16>>2]|0;do{if((o|0)!=-1){j=c[n>>2]|0;if((j|0)==-1){c[n>>2]=o;break}i=c[(c[b>>2]|0)+12>>2]|0;l=j;while(1){q=i+(l<<2)|0;r=c[q>>2]|0;j=(r>>>14)-131071|0;if((j|0)==-1){break}p=l+1+j|0;if((p|0)==-1){break}else{l=p}}i=o+~l|0;if((((i|0)>-1?i:-i|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[q>>2]=(i<<14)+2147467264|r&16383;break}}}while(0);r=f;q=g;c[r>>2]=c[q>>2];c[r+4>>2]=c[q+4>>2];c[r+8>>2]=c[q+8>>2];c[r+12>>2]=c[q+12>>2];c[r+16>>2]=c[q+16>>2];c[r+20>>2]=c[q+20>>2];return};case 6:{q=g+16|0;r=g+20|0;o=(c[q>>2]|0)==(c[r>>2]|0);Ri(b,g);n=g|0;a:do{if(!o){do{if((c[n>>2]|0)==6){i=c[g+8>>2]|0;if((c[q>>2]|0)==(c[r>>2]|0)){break a}if((i|0)<(d[b+46|0]|0|0)){break}hj(b,g,i);break a}}while(0);Si(b,g)}}while(0);do{if((c[n>>2]|0)==11){r=g+8|0;q=c[r>>2]|0;o=(c[b>>2]|0)+12|0;l=c[o>>2]|0;i=c[l+(q<<2)>>2]|0;if((i&63|0)!=22){break}m=f|0;p=f+8|0;do{if((c[m>>2]|0)==6){j=c[p>>2]|0;if((j&256|0)!=0){s=q;t=l;u=i;break}if((d[b+46|0]|0|0)>(j|0)){s=q;t=l;u=i;break}j=b+48|0;a[j]=(a[j]|0)-1;j=c[r>>2]|0;k=c[o>>2]|0;s=j;t=k;u=c[k+(j<<2)>>2]|0}else{s=q;t=l;u=i}}while(0);c[t+(s<<2)>>2]=c[p>>2]<<23|u&8388607;c[m>>2]=11;c[p>>2]=c[r>>2];return}}while(0);Si(b,g);jj(b,22,f,g,h);return};case 0:case 1:case 2:case 3:case 4:case 5:{jj(b,e+13|0,f,g,h);return};case 7:case 8:case 9:{kj(b,e+17|0,1,f,g);return};case 10:case 11:case 12:{kj(b,e+14|0,0,f,g);return};default:{return}}}function dj(a,b){a=a|0;b=b|0;c[(c[(c[a>>2]|0)+20>>2]|0)+((c[a+20>>2]|0)-1<<2)>>2]=b;return}function ej(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=((e-1|0)/50|0)+1|0;e=(f|0)==-1?0:f;if((g|0)<512){fj(b,d<<6|e<<23|g<<14|36)|0;h=d+1|0;i=h&255;j=b+48|0;a[j]=i;return}if((g|0)>=67108864){nj(c[b+12>>2]|0,12296)}fj(b,d<<6|e<<23|36)|0;fj(b,g<<6|39)|0;h=d+1|0;i=h&255;j=b+48|0;a[j]=i;return}function fj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;e=b|0;f=c[e>>2]|0;g=b+28|0;h=c[g>>2]|0;i=b+20|0;j=c[i>>2]|0;do{if((h|0)==-1){k=j}else{l=h;m=f;while(1){n=c[m+12>>2]|0;o=n+(l<<2)|0;p=c[o>>2]|0;q=(p>>>14)-131071|0;if((q|0)==-1){r=-1}else{r=l+1+q|0}if((l|0)>0){q=n+(l-1<<2)|0;n=c[q>>2]|0;if((a[1184+(n&63)|0]|0)<0){s=q;t=n}else{u=6}}else{u=6}if((u|0)==6){u=0;s=o;t=p}if((t&63|0)==28){c[s>>2]=t&8372224|t>>>23<<6|27;n=(c[(c[e>>2]|0)+12>>2]|0)+(l<<2)|0;q=j+~l|0;if((((q|0)>-1?q:-q|0)|0)>131071){u=9;break}c[n>>2]=c[n>>2]&16383|(q<<14)+2147467264}else{q=j+~l|0;if((((q|0)>-1?q:-q|0)|0)>131071){u=12;break}c[o>>2]=p&16383|(q<<14)+2147467264}if((r|0)==-1){u=16;break}l=r;m=c[e>>2]|0}if((u|0)==9){nj(c[b+12>>2]|0,5096);return 0}else if((u|0)==12){nj(c[b+12>>2]|0,5096);return 0}else if((u|0)==16){k=c[i>>2]|0;break}}}while(0);c[g>>2]=-1;g=f+48|0;if((k|0)<(c[g>>2]|0)){v=k;w=c[f+12>>2]|0}else{k=f+12|0;u=Zf(c[(c[b+12>>2]|0)+52>>2]|0,c[k>>2]|0,g,4,2147483645,6640)|0;c[k>>2]=u;v=c[i>>2]|0;w=u}c[w+(v<<2)>>2]=d;d=c[i>>2]|0;v=f+52|0;if((d|0)<(c[v>>2]|0)){x=d;y=c[f+20>>2]|0;z=b+12|0;A=c[z>>2]|0;B=A+8|0;C=c[B>>2]|0;D=y+(x<<2)|0;c[D>>2]=C;E=c[i>>2]|0;F=E+1|0;c[i>>2]=F;return E|0}else{d=b+12|0;b=f+20|0;f=Zf(c[(c[d>>2]|0)+52>>2]|0,c[b>>2]|0,v,4,2147483645,6640)|0;c[b>>2]=f;x=c[i>>2]|0;y=f;z=d;A=c[z>>2]|0;B=A+8|0;C=c[B>>2]|0;D=y+(x<<2)|0;c[D>>2]=C;E=c[i>>2]|0;F=E+1|0;c[i>>2]=F;return E|0}return 0}function gj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+8|0;g=f|0;j=c[(c[b+12>>2]|0)+52>>2]|0;k=Xg(j,c[b+4>>2]|0,d)|0;d=c[b>>2]|0;l=k+8|0;m=k|0;do{if((c[l>>2]|0)==3){h[g>>3]=+h[m>>3]+6755399441055744.0;k=c[g>>2]|0;n=c[d+8>>2]|0;if((c[n+(k<<4)+8>>2]|0)!=(c[e+8>>2]|0)){break}if((sh(0,n+(k<<4)|0,e)|0)==0){break}else{o=k}i=f;return o|0}}while(0);g=d+44|0;k=c[g>>2]|0;n=b+32|0;b=c[n>>2]|0;h[m>>3]=+(b|0);c[l>>2]=3;l=c[g>>2]|0;if((b|0)<(l|0)){p=l}else{l=d+8|0;c[l>>2]=Zf(j,c[l>>2]|0,g,16,67108863,8624)|0;p=c[g>>2]|0}l=d+8|0;if((k|0)<(p|0)){p=k;while(1){k=p+1|0;c[(c[l>>2]|0)+(p<<4)+8>>2]=0;if((k|0)<(c[g>>2]|0)){p=k}else{break}}}p=c[l>>2]|0;l=e;g=p+(b<<4)|0;k=c[l+4>>2]|0;c[g>>2]=c[l>>2];c[g+4>>2]=k;k=e+8|0;c[p+(b<<4)+8>>2]=c[k>>2];c[n>>2]=(c[n>>2]|0)+1;if((c[k>>2]&64|0)==0){o=b;i=f;return o|0}k=c[e>>2]|0;if((a[k+5|0]&3)==0){o=b;i=f;return o|0}if((a[d+5|0]&4)==0){o=b;i=f;return o|0}Df(j,d,k);o=b;i=f;return o|0}function hj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;ij(b,d,e);f=d|0;g=d+16|0;do{if((c[f>>2]|0)==10){h=c[d+8>>2]|0;if((h|0)==-1){break}i=c[g>>2]|0;if((i|0)==-1){c[g>>2]=h;break}j=c[(c[b>>2]|0)+12>>2]|0;k=i;while(1){l=j+(k<<2)|0;m=c[l>>2]|0;i=(m>>>14)-131071|0;if((i|0)==-1){break}n=k+1+i|0;if((n|0)==-1){break}else{k=n}}j=h+~k|0;if((((j|0)>-1?j:-j|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[l>>2]=(j<<14)+2147467264|m&16383;break}}}while(0);m=c[g>>2]|0;l=d+20|0;j=c[l>>2]|0;if((m|0)==(j|0)){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}a:do{if((m|0)==-1){q=20}else{n=c[(c[b>>2]|0)+12>>2]|0;i=m;while(1){r=n+(i<<2)|0;if((i|0)>0){s=c[n+(i-1<<2)>>2]|0;if((a[1184+(s&63)|0]|0)<0){t=s}else{q=16}}else{q=16}if((q|0)==16){q=0;t=c[r>>2]|0}if((t&63|0)!=28){q=28;break a}s=((c[r>>2]|0)>>>14)-131071|0;if((s|0)==-1){q=20;break a}r=i+1+s|0;if((r|0)==-1){q=20;break}else{i=r}}}}while(0);b:do{if((q|0)==20){if((j|0)==-1){u=-1;v=-1;break}t=c[(c[b>>2]|0)+12>>2]|0;m=j;while(1){i=t+(m<<2)|0;if((m|0)>0){n=c[t+(m-1<<2)>>2]|0;if((a[1184+(n&63)|0]|0)<0){w=n}else{q=24}}else{q=24}if((q|0)==24){q=0;w=c[i>>2]|0}if((w&63|0)!=28){q=28;break b}n=((c[i>>2]|0)>>>14)-131071|0;if((n|0)==-1){u=-1;v=-1;break b}i=m+1+n|0;if((i|0)==-1){u=-1;v=-1;break}else{m=i}}}}while(0);do{if((q|0)==28){w=b+28|0;do{if((c[f>>2]|0)==10){x=-1}else{j=c[w>>2]|0;c[w>>2]=-1;m=fj(b,2147450903)|0;if((j|0)==-1){x=m;break}if((m|0)==-1){x=j;break}t=c[(c[b>>2]|0)+12>>2]|0;i=m;while(1){y=t+(i<<2)|0;z=c[y>>2]|0;n=(z>>>14)-131071|0;if((n|0)==-1){break}k=i+1+n|0;if((k|0)==-1){break}else{i=k}}t=j+~i|0;if((((t|0)>-1?t:-t|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[y>>2]=(t<<14)+2147467264|z&16383;x=m;break}}}while(0);t=b+20|0;k=b+24|0;c[k>>2]=c[t>>2];n=e<<6;h=fj(b,n|16387)|0;c[k>>2]=c[t>>2];r=fj(b,n|8388611)|0;c[k>>2]=c[t>>2];if((x|0)==-1){u=h;v=r;break}t=c[w>>2]|0;if((t|0)==-1){c[w>>2]=x;u=h;v=r;break}k=c[(c[b>>2]|0)+12>>2]|0;n=t;while(1){A=k+(n<<2)|0;B=c[A>>2]|0;t=(B>>>14)-131071|0;if((t|0)==-1){break}s=n+1+t|0;if((s|0)==-1){break}else{n=s}}k=x+~n|0;if((((k|0)>-1?k:-k|0)|0)>131071){nj(c[b+12>>2]|0,5096)}else{c[A>>2]=(k<<14)+2147467264|B&16383;u=h;v=r;break}}}while(0);B=c[b+20>>2]|0;c[b+24>>2]=B;A=c[l>>2]|0;c:do{if((A|0)!=-1){x=b|0;z=(e|0)==255;y=e<<6&16320;k=A;while(1){w=c[(c[x>>2]|0)+12>>2]|0;s=w+(k<<2)|0;t=c[s>>2]|0;C=(t>>>14)-131071|0;if((C|0)==-1){D=-1}else{D=k+1+C|0}if((k|0)>0){C=w+(k-1<<2)|0;w=c[C>>2]|0;if((a[1184+(w&63)|0]|0)<0){E=C;F=w}else{q=52}}else{q=52}if((q|0)==52){q=0;E=s;F=t}if((F&63|0)==28){w=F>>>23;if(z|(w|0)==(e|0)){G=F&8372224|w<<6|27}else{G=F&-16321|y}c[E>>2]=G;w=(c[(c[x>>2]|0)+12>>2]|0)+(k<<2)|0;C=B+~k|0;if((((C|0)>-1?C:-C|0)|0)>131071){q=58;break}c[w>>2]=c[w>>2]&16383|(C<<14)+2147467264}else{C=u+~k|0;if((((C|0)>-1?C:-C|0)|0)>131071){q=61;break}c[s>>2]=t&16383|(C<<14)+2147467264}if((D|0)==-1){break c}else{k=D}}if((q|0)==58){nj(c[b+12>>2]|0,5096)}else if((q|0)==61){nj(c[b+12>>2]|0,5096)}}}while(0);D=c[g>>2]|0;if((D|0)==-1){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}u=b|0;G=e<<6;E=G&16320;if((e|0)==255){F=D;while(1){A=c[(c[u>>2]|0)+12>>2]|0;k=A+(F<<2)|0;x=c[k>>2]|0;y=(x>>>14)-131071|0;if((y|0)==-1){H=-1}else{H=F+1+y|0}if((F|0)>0){y=A+(F-1<<2)|0;A=c[y>>2]|0;if((a[1184+(A&63)|0]|0)<0){I=y;J=A}else{q=70}}else{q=70}if((q|0)==70){q=0;I=k;J=x}if((J&63|0)==28){c[I>>2]=J&8372224|J>>>23<<6|27;A=(c[(c[u>>2]|0)+12>>2]|0)+(F<<2)|0;y=B+~F|0;if((((y|0)>-1?y:-y|0)|0)>131071){q=87;break}c[A>>2]=c[A>>2]&16383|(y<<14)+2147467264}else{y=v+~F|0;if((((y|0)>-1?y:-y|0)|0)>131071){q=90;break}c[k>>2]=x&16383|(y<<14)+2147467264}if((H|0)==-1){q=93;break}else{F=H}}if((q|0)==87){K=b+12|0;L=c[K>>2]|0;nj(L,5096)}else if((q|0)==90){M=b+12|0;N=c[M>>2]|0;nj(N,5096)}else if((q|0)==93){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}}else{O=D}while(1){D=c[(c[u>>2]|0)+12>>2]|0;H=D+(O<<2)|0;F=c[H>>2]|0;J=(F>>>14)-131071|0;if((J|0)==-1){P=-1}else{P=O+1+J|0}if((O|0)>0){J=D+(O-1<<2)|0;D=c[J>>2]|0;if((a[1184+(D&63)|0]|0)<0){Q=J;R=D}else{q=81}}else{q=81}if((q|0)==81){q=0;Q=H;R=F}if((R&63|0)==28){if((R>>>23|0)==(e|0)){S=R&8372224|G|27}else{S=R&-16321|E}c[Q>>2]=S;D=(c[(c[u>>2]|0)+12>>2]|0)+(O<<2)|0;J=B+~O|0;if((((J|0)>-1?J:-J|0)|0)>131071){q=87;break}c[D>>2]=c[D>>2]&16383|(J<<14)+2147467264}else{J=v+~O|0;if((((J|0)>-1?J:-J|0)|0)>131071){q=90;break}c[H>>2]=F&16383|(J<<14)+2147467264}if((P|0)==-1){q=93;break}else{O=P}}if((q|0)==87){K=b+12|0;L=c[K>>2]|0;nj(L,5096)}else if((q|0)==90){M=b+12|0;N=c[M>>2]|0;nj(N,5096)}else if((q|0)==93){c[g>>2]=-1;c[l>>2]=-1;o=d+8|0;p=o;c[p>>2]=e;c[f>>2]=6;return}}function ij(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0.0,u=0;f=i;i=i+24|0;g=f|0;j=f+8|0;Ri(a,b);k=b|0;l=c[k>>2]|0;a:do{switch(l|0){case 3:case 2:{fj(a,e<<6|((l|0)==2)<<23|3)|0;break};case 4:{m=c[b+8>>2]|0;n=e<<6;if((m|0)<262144){fj(a,n|m<<14|1)|0;break a}else{fj(a,n|2)|0;fj(a,m<<6|39)|0;break a}break};case 1:{m=e+1|0;n=c[a+20>>2]|0;do{if((n|0)>(c[a+24>>2]|0)){o=(c[(c[a>>2]|0)+12>>2]|0)+(n-1<<2)|0;p=c[o>>2]|0;if((p&63|0)!=4){break}q=p>>>6&255;r=q+(p>>>23)|0;if((q|0)>(e|0)|(r+1|0)<(e|0)){if((q|0)<(e|0)|(q|0)>(m|0)){break}}s=(q|0)<(e|0)?q:e;c[o>>2]=s<<6&16320|p&8372287|((r|0)>(e|0)?r:e)-s<<23;break a}}while(0);fj(a,e<<6|4)|0;break};case 5:{t=+h[b+8>>3];h[g>>3]=t;m=c[(c[a+12>>2]|0)+52>>2]|0;h[j>>3]=t;c[j+8>>2]=3;if(t==0.0){n=m+8|0;s=c[n>>2]|0;c[n>>2]=s+16;r=Rg(m,g,8)|0;c[s>>2]=r;c[s+8>>2]=d[r+4|0]|0|64;r=gj(a,(c[n>>2]|0)-16|0,j)|0;c[n>>2]=(c[n>>2]|0)-16;u=r}else{u=gj(a,j,j)|0}r=e<<6;if((u|0)<262144){fj(a,r|u<<14|1)|0;break a}else{fj(a,r|2)|0;fj(a,u<<6|39)|0;break a}break};case 11:{r=(c[(c[a>>2]|0)+12>>2]|0)+(c[b+8>>2]<<2)|0;c[r>>2]=c[r>>2]&-16321|e<<6&16320;break};case 6:{r=c[b+8>>2]|0;if((r|0)==(e|0)){break a}fj(a,r<<23|e<<6)|0;break};default:{i=f;return}}}while(0);c[b+8>>2]=e;c[k>>2]=6;i=f;return}function jj(b,e,f,g,i){b=b|0;e=e|0;f=f|0;g=g|0;i=i|0;var j=0,k=0.0,l=0,m=0,n=0;j=f|0;do{if((c[j>>2]|0)==5){if((c[f+16>>2]|0)!=-1){break}if((c[f+20>>2]|0)!=-1){break}if((c[g>>2]|0)!=5){break}if((c[g+16>>2]|0)!=-1){break}if((c[g+20>>2]|0)!=-1){break}k=+h[g+8>>3];if((e&-2|0)==16&k==0.0){break}l=f+8|0;h[l>>3]=+dg(e-13|0,+h[l>>3],k);return}}while(0);if((e|0)==21|(e|0)==19){m=0}else{m=Wi(b,g)|0}l=Wi(b,f)|0;do{if((l|0)>(m|0)){do{if((c[j>>2]|0)==6){n=c[f+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1}}while(0);if((c[g>>2]|0)!=6){break}n=c[g+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1}else{do{if((c[g>>2]|0)==6){n=c[g+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1}}while(0);if((c[j>>2]|0)!=6){break}n=c[f+8>>2]|0;if((n&256|0)!=0){break}if((d[b+46|0]|0|0)>(n|0)){break}n=b+48|0;a[n]=(a[n]|0)-1}}while(0);c[f+8>>2]=fj(b,m<<14|e|l<<23)|0;c[j>>2]=11;c[(c[(c[b>>2]|0)+20>>2]|0)+((c[b+20>>2]|0)-1<<2)>>2]=i;return}function kj(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;i=Wi(b,g)|0;j=Wi(b,h)|0;do{if((c[h>>2]|0)==6){k=c[h+8>>2]|0;if((k&256|0)!=0){break}if((d[b+46|0]|0|0)>(k|0)){break}k=b+48|0;a[k]=(a[k]|0)-1}}while(0);h=g|0;do{if((c[h>>2]|0)==6){k=c[g+8>>2]|0;if((k&256|0)!=0){break}if((d[b+46|0]|0|0)>(k|0)){break}k=b+48|0;a[k]=(a[k]|0)-1}}while(0);k=(f|0)==0&(e|0)!=24;fj(b,(k?64:f<<6)|e|(k?j:i)<<23|(k?i:j)<<14)|0;j=b+28|0;i=c[j>>2]|0;c[j>>2]=-1;j=fj(b,2147450903)|0;if((i|0)==-1){l=j;m=g+8|0;n=m;c[n>>2]=l;c[h>>2]=10;return}if((j|0)==-1){l=i;m=g+8|0;n=m;c[n>>2]=l;c[h>>2]=10;return}k=c[(c[b>>2]|0)+12>>2]|0;e=j;while(1){o=k+(e<<2)|0;p=c[o>>2]|0;f=(p>>>14)-131071|0;if((f|0)==-1){break}q=e+1+f|0;if((q|0)==-1){break}else{e=q}}k=i+~e|0;if((((k|0)>-1?k:-k|0)|0)>131071){nj(c[b+12>>2]|0,5096)}c[o>>2]=(k<<14)+2147467264|p&16383;l=j;m=g+8|0;n=m;c[n>>2]=l;c[h>>2]=10;return}function lj(b){b=b|0;var d=0,e=0,f=0;d=0;do{e=Sg(b,c[928+(d<<2)>>2]|0)|0;f=e+5|0;a[f]=a[f]|32;d=d+1|0;a[e+6|0]=d;}while((d|0)<22);return}function mj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;if((d|0)>=257){f=c[928+(d-257<<2)>>2]|0;if((d|0)>=286){g=f;i=e;return g|0}h=hg(c[b+52>>2]|0,8392,(j=i,i=i+8|0,c[j>>2]=f,j)|0)|0;i=j;g=h;i=e;return g|0}h=c[b+52>>2]|0;if((a[d+657|0]&4)==0){b=hg(h,12120,(j=i,i=i+8|0,c[j>>2]=d,j)|0)|0;i=j;g=b;i=e;return g|0}else{b=hg(h,4384,(j=i,i=i+8|0,c[j>>2]=d,j)|0)|0;i=j;g=b;i=e;return g|0}return 0}function nj(a,b){a=a|0;b=b|0;sj(a,b,c[a+16>>2]|0)}function oj(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0;f=c[a+52>>2]|0;g=Rg(f,b,e)|0;e=f+8|0;b=c[e>>2]|0;c[e>>2]=b+16;c[b>>2]=g;c[b+8>>2]=d[g+4|0]|0|64;b=Xg(f,c[(c[a+48>>2]|0)+4>>2]|0,(c[e>>2]|0)-16|0)|0;a=b+8|0;do{if((c[a>>2]|0)==0){c[b>>2]=1;c[a>>2]=1;if((c[(c[f+12>>2]|0)+12>>2]|0)<=0){h=g;break}Nf(f);h=g}else{h=c[b+16>>2]|0}}while(0);c[e>>2]=(c[e>>2]|0)-16;return h|0}function pj(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;a[d+76|0]=46;h=d+52|0;c[h>>2]=b;c[d>>2]=g;c[d+32>>2]=286;c[d+56>>2]=e;c[d+48>>2]=0;c[d+4>>2]=1;c[d+8>>2]=1;c[d+68>>2]=f;f=Sg(b,6520)|0;c[d+72>>2]=f;b=f+5|0;a[b]=a[b]|32;b=d+60|0;d=c[b>>2]|0;f=$f(c[h>>2]|0,c[d>>2]|0,c[d+8>>2]|0,32)|0;c[c[b>>2]>>2]=f;c[(c[b>>2]|0)+8>>2]=32;return}function qj(a){a=a|0;var b=0,d=0,e=0;c[a+8>>2]=c[a+4>>2];b=a+32|0;d=b|0;if((c[d>>2]|0)==286){c[a+16>>2]=tj(a,a+24|0)|0;return}else{e=a+16|0;a=b;c[e>>2]=c[a>>2];c[e+4>>2]=c[a+4>>2];c[e+8>>2]=c[a+8>>2];c[e+12>>2]=c[a+12>>2];c[d>>2]=286;return}}function rj(a){a=a|0;var b=0;b=tj(a,a+40|0)|0;c[a+32>>2]=b;return b|0}function sj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+64|0;g=f|0;ig(g,(c[b+68>>2]|0)+16|0,60);f=b+52|0;h=c[b+4>>2]|0;j=hg(c[f>>2]|0,10360,(k=i,i=i+24|0,c[k>>2]=g,c[k+8>>2]=h,c[k+16>>2]=d,k)|0)|0;i=k;if((e|0)==0){l=c[f>>2]|0;af(l,3)}d=c[f>>2]|0;do{if((e-287|0)>>>0<3>>>0){h=b+60|0;g=c[h>>2]|0;m=g+4|0;n=c[m>>2]|0;o=g+8|0;p=c[o>>2]|0;do{if((n+1|0)>>>0>p>>>0){if(p>>>0>2147483645>>>0){sj(b,13256,0)}q=p<<1;if((q|0)==-2){_f(d)}else{r=g|0;s=$f(d,c[r>>2]|0,p,q)|0;c[r>>2]=s;c[o>>2]=q;t=c[m>>2]|0;u=s;break}}else{t=n;u=c[g>>2]|0}}while(0);c[m>>2]=t+1;a[u+t|0]=0;g=hg(c[f>>2]|0,8392,(k=i,i=i+8|0,c[k>>2]=c[c[h>>2]>>2],k)|0)|0;i=k;v=g}else{if((e|0)>=257){g=c[928+(e-257<<2)>>2]|0;if((e|0)>=286){v=g;break}n=hg(d,8392,(k=i,i=i+8|0,c[k>>2]=g,k)|0)|0;i=k;v=n;break}if((a[e+657|0]&4)==0){n=hg(d,12120,(k=i,i=i+8|0,c[k>>2]=e,k)|0)|0;i=k;v=n;break}else{n=hg(d,4384,(k=i,i=i+8|0,c[k>>2]=e,k)|0)|0;i=k;v=n;break}}}while(0);hg(d,9840,(k=i,i=i+16|0,c[k>>2]=j,c[k+8>>2]=v,k)|0)|0;i=k;l=c[f>>2]|0;af(l,3)}function tj(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0;f=i;i=i+16|0;g=f|0;h=b+60|0;c[(c[h>>2]|0)+4>>2]=0;j=b|0;k=b+56|0;l=b+4|0;a:while(1){m=c[j>>2]|0;b:while(1){switch(m|0){case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:{n=m;break a;break};case 10:case 13:{o=4;break b;break};case 46:{o=193;break a;break};case 32:case 12:case 9:case 11:{break};case 45:{break b;break};case 91:{o=35;break a;break};case 61:{o=39;break a;break};case 60:{o=47;break a;break};case 62:{o=55;break a;break};case 126:{o=63;break a;break};case 58:{o=71;break a;break};case 34:case 39:{o=79;break a;break};case-1:{p=286;o=339;break a;break};default:{o=315;break a}}q=c[k>>2]|0;r=c[q>>2]|0;c[q>>2]=r-1;q=c[k>>2]|0;if((r|0)==0){s=yh(q)|0}else{r=q+4|0;q=c[r>>2]|0;c[r>>2]=q+1;s=d[q]|0}c[j>>2]=s;m=s}if((o|0)==4){o=0;q=c[k>>2]|0;r=c[q>>2]|0;c[q>>2]=r-1;q=c[k>>2]|0;if((r|0)==0){t=yh(q)|0}else{r=q+4|0;q=c[r>>2]|0;c[r>>2]=q+1;t=d[q]|0}c[j>>2]=t;do{if((t|0)==10|(t|0)==13){if((t|0)==(m|0)){break}q=c[k>>2]|0;r=c[q>>2]|0;c[q>>2]=r-1;q=c[k>>2]|0;if((r|0)==0){u=yh(q)|0}else{r=q+4|0;q=c[r>>2]|0;c[r>>2]=q+1;u=d[q]|0}c[j>>2]=u}}while(0);q=c[l>>2]|0;c[l>>2]=q+1;if((q|0)>2147483643){o=14;break}else{continue}}q=c[k>>2]|0;r=c[q>>2]|0;c[q>>2]=r-1;q=c[k>>2]|0;if((r|0)==0){v=yh(q)|0}else{r=q+4|0;q=c[r>>2]|0;c[r>>2]=q+1;v=d[q]|0}c[j>>2]=v;if((v|0)!=45){p=45;o=339;break}q=c[k>>2]|0;r=c[q>>2]|0;c[q>>2]=r-1;q=c[k>>2]|0;if((r|0)==0){w=yh(q)|0}else{r=q+4|0;q=c[r>>2]|0;c[r>>2]=q+1;w=d[q]|0}c[j>>2]=w;do{if((w|0)==91){q=uj(b)|0;c[(c[h>>2]|0)+4>>2]=0;if((q|0)>-1){vj(b,0,q);c[(c[h>>2]|0)+4>>2]=0;continue a}else{x=c[j>>2]|0;break}}else{x=w}}while(0);while(1){if((x|0)==10|(x|0)==13|(x|0)==(-1|0)){continue a}q=c[k>>2]|0;r=c[q>>2]|0;c[q>>2]=r-1;q=c[k>>2]|0;if((r|0)==0){y=yh(q)|0}else{r=q+4|0;q=c[r>>2]|0;c[r>>2]=q+1;y=d[q]|0}c[j>>2]=y;x=y}}do{if((o|0)==14){nj(b,10568);return 0}else if((o|0)==35){y=uj(b)|0;if((y|0)>-1){vj(b,e,y);p=289;i=f;return p|0}if((y|0)==-1){p=91;i=f;return p|0}else{sj(b,4976,289);return 0}}else if((o|0)==39){y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){z=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;z=d[y]|0}c[j>>2]=z;if((z|0)!=61){p=61;i=f;return p|0}y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){A=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;A=d[y]|0}c[j>>2]=A;p=281;i=f;return p|0}else if((o|0)==47){y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){B=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;B=d[y]|0}c[j>>2]=B;if((B|0)!=61){p=60;i=f;return p|0}y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){C=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;C=d[y]|0}c[j>>2]=C;p=283;i=f;return p|0}else if((o|0)==55){y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){D=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;D=d[y]|0}c[j>>2]=D;if((D|0)!=61){p=62;i=f;return p|0}y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){E=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;E=d[y]|0}c[j>>2]=E;p=282;i=f;return p|0}else if((o|0)==63){y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){F=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;F=d[y]|0}c[j>>2]=F;if((F|0)!=61){p=126;i=f;return p|0}y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){G=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;G=d[y]|0}c[j>>2]=G;p=284;i=f;return p|0}else if((o|0)==71){y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){H=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;H=d[y]|0}c[j>>2]=H;if((H|0)!=58){p=58;i=f;return p|0}y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){I=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;I=d[y]|0}c[j>>2]=I;p=285;i=f;return p|0}else if((o|0)==79){y=c[h>>2]|0;x=y+4|0;w=c[x>>2]|0;v=y+8|0;u=c[v>>2]|0;do{if((w+1|0)>>>0>u>>>0){if(u>>>0>2147483645>>>0){sj(b,13256,0);return 0}t=u<<1;s=c[b+52>>2]|0;if((t|0)==-2){_f(s);return 0}else{q=y|0;r=$f(s,c[q>>2]|0,u,t)|0;c[q>>2]=r;c[v>>2]=t;J=c[x>>2]|0;K=r;break}}else{J=w;K=c[y>>2]|0}}while(0);y=m&255;c[x>>2]=J+1;a[K+J|0]=y;w=c[k>>2]|0;v=c[w>>2]|0;c[w>>2]=v-1;w=c[k>>2]|0;if((v|0)==0){L=yh(w)|0}else{v=w+4|0;w=c[v>>2]|0;c[v>>2]=w+1;L=d[w]|0}c[j>>2]=L;c:do{if((L|0)==(m|0)){M=L&255}else{w=b+52|0;v=g|0;u=L;d:while(1){e:do{if((u|0)==(-1|0)){o=92;break d}else if((u|0)==10|(u|0)==13){o=93;break d}else if((u|0)==92){r=c[k>>2]|0;t=c[r>>2]|0;c[r>>2]=t-1;r=c[k>>2]|0;if((t|0)==0){N=yh(r)|0}else{t=r+4|0;r=c[t>>2]|0;c[t>>2]=r+1;N=d[r]|0}c[j>>2]=N;switch(N|0){case-1:{O=-1;break e;break};case 98:{P=8;o=155;break};case 102:{P=12;o=155;break};case 110:{P=10;o=155;break};case 114:{P=13;o=155;break};case 116:{P=9;o=155;break};case 118:{P=11;o=155;break};case 120:{c[v>>2]=120;Q=1;r=0;while(1){t=c[k>>2]|0;q=c[t>>2]|0;c[t>>2]=q-1;t=c[k>>2]|0;if((q|0)==0){R=yh(t)|0}else{q=t+4|0;t=c[q>>2]|0;c[q>>2]=t+1;R=d[t]|0}c[j>>2]=R;c[g+(Q<<2)>>2]=R;if((a[R+657|0]&16)==0){o=110;break d}S=(eg(R)|0)+(r<<4)|0;t=Q+1|0;if((t|0)<3){Q=t;r=S}else{break}}P=S&255;o=155;break};case 10:case 13:{r=c[k>>2]|0;t=c[r>>2]|0;c[r>>2]=t-1;r=c[k>>2]|0;if((t|0)==0){T=yh(r)|0}else{t=r+4|0;r=c[t>>2]|0;c[t>>2]=r+1;T=d[r]|0}c[j>>2]=T;do{if((T|0)==10|(T|0)==13){if((T|0)==(N|0)){break}r=c[k>>2]|0;t=c[r>>2]|0;c[r>>2]=t-1;r=c[k>>2]|0;if((t|0)==0){U=yh(r)|0}else{t=r+4|0;r=c[t>>2]|0;c[t>>2]=r+1;U=d[r]|0}c[j>>2]=U}}while(0);r=c[l>>2]|0;c[l>>2]=r+1;if((r|0)>2147483643){o=122;break d}else{V=10}break};case 92:case 34:case 39:{P=N&255;o=155;break};case 122:{r=c[k>>2]|0;t=c[r>>2]|0;c[r>>2]=t-1;r=c[k>>2]|0;if((t|0)==0){W=yh(r)|0}else{t=r+4|0;r=c[t>>2]|0;c[t>>2]=r+1;W=d[r]|0}c[j>>2]=W;if((a[W+657|0]&8)==0){O=W;break e}else{X=W}while(1){if((X|0)==10|(X|0)==13){r=c[k>>2]|0;t=c[r>>2]|0;c[r>>2]=t-1;r=c[k>>2]|0;if((t|0)==0){Y=yh(r)|0}else{t=r+4|0;r=c[t>>2]|0;c[t>>2]=r+1;Y=d[r]|0}c[j>>2]=Y;do{if((Y|0)==10|(Y|0)==13){if((Y|0)==(X|0)){Z=X;break}r=c[k>>2]|0;t=c[r>>2]|0;c[r>>2]=t-1;r=c[k>>2]|0;if((t|0)==0){_=yh(r)|0}else{t=r+4|0;r=c[t>>2]|0;c[t>>2]=r+1;_=d[r]|0}c[j>>2]=_;Z=_}else{Z=Y}}while(0);r=c[l>>2]|0;c[l>>2]=r+1;if((r|0)>2147483643){o=139;break d}else{$=Z}}else{r=c[k>>2]|0;t=c[r>>2]|0;c[r>>2]=t-1;r=c[k>>2]|0;if((t|0)==0){aa=yh(r)|0}else{t=r+4|0;r=c[t>>2]|0;c[t>>2]=r+1;aa=d[r]|0}c[j>>2]=aa;$=aa}if((a[$+657|0]&8)==0){O=$;break e}else{X=$}}break};case 97:{P=7;o=155;break};default:{if((a[N+657|0]&2)==0){o=146;break d}else{ba=0;ca=0;da=N}while(1){if((a[da+657|0]&2)==0){ea=ba;fa=ca;break}c[g+(ba<<2)>>2]=da;r=da-48+(ca*10|0)|0;t=c[k>>2]|0;q=c[t>>2]|0;c[t>>2]=q-1;t=c[k>>2]|0;if((q|0)==0){ga=yh(t)|0}else{q=t+4|0;t=c[q>>2]|0;c[q>>2]=t+1;ga=d[t]|0}c[j>>2]=ga;t=ba+1|0;if((t|0)<3){ba=t;ca=r;da=ga}else{ea=t;fa=r;break}}if((fa|0)>255){o=153;break d}else{V=fa&255}}}if((o|0)==155){o=0;r=c[k>>2]|0;t=c[r>>2]|0;c[r>>2]=t-1;r=c[k>>2]|0;if((t|0)==0){ha=yh(r)|0}else{t=r+4|0;r=c[t>>2]|0;c[t>>2]=r+1;ha=d[r]|0}c[j>>2]=ha;V=P}r=c[h>>2]|0;t=r+4|0;q=c[t>>2]|0;s=r+8|0;ia=c[s>>2]|0;if((q+1|0)>>>0>ia>>>0){if(ia>>>0>2147483645>>>0){o=162;break d}ja=ia<<1;ka=c[w>>2]|0;if((ja|0)==-2){o=164;break d}la=r|0;ma=$f(ka,c[la>>2]|0,ia,ja)|0;c[la>>2]=ma;c[s>>2]=ja;na=c[t>>2]|0;oa=ma}else{na=q;oa=c[r>>2]|0}c[t>>2]=na+1;a[oa+na|0]=V;O=c[j>>2]|0}else{t=c[h>>2]|0;r=t+4|0;q=c[r>>2]|0;ma=t+8|0;ja=c[ma>>2]|0;if((q+1|0)>>>0>ja>>>0){if(ja>>>0>2147483645>>>0){o=170;break d}s=ja<<1;pa=c[w>>2]|0;if((s|0)==-2){o=172;break d}la=t|0;ia=$f(pa,c[la>>2]|0,ja,s)|0;c[la>>2]=ia;c[ma>>2]=s;qa=c[r>>2]|0;ra=ia}else{qa=q;ra=c[t>>2]|0}c[r>>2]=qa+1;a[ra+qa|0]=u;r=c[k>>2]|0;t=c[r>>2]|0;c[r>>2]=t-1;r=c[k>>2]|0;if((t|0)==0){sa=yh(r)|0}else{t=r+4|0;r=c[t>>2]|0;c[t>>2]=r+1;sa=d[r]|0}c[j>>2]=sa;O=sa}}while(0);if((O|0)==(m|0)){M=y;break c}else{u=O}}if((o|0)==92){sj(b,12896,286);return 0}else if((o|0)==93){sj(b,12896,289);return 0}else if((o|0)==110){wj(b,v,Q+1|0,12048);return 0}else if((o|0)==122){nj(b,10568);return 0}else if((o|0)==139){nj(b,10568);return 0}else if((o|0)==146){wj(b,j,1,12560);return 0}else if((o|0)==153){wj(b,v,ea,12264);return 0}else if((o|0)==162){sj(b,13256,0);return 0}else if((o|0)==164){_f(ka);return 0}else if((o|0)==170){sj(b,13256,0);return 0}else if((o|0)==172){_f(pa);return 0}}}while(0);y=c[h>>2]|0;x=y+4|0;u=c[x>>2]|0;w=y+8|0;r=c[w>>2]|0;do{if((u+1|0)>>>0>r>>>0){if(r>>>0>2147483645>>>0){sj(b,13256,0);return 0}t=r<<1;q=c[b+52>>2]|0;if((t|0)==-2){_f(q);return 0}else{ia=y|0;s=$f(q,c[ia>>2]|0,r,t)|0;c[ia>>2]=s;c[w>>2]=t;ta=c[x>>2]|0;ua=s;break}}else{ta=u;ua=c[y>>2]|0}}while(0);c[x>>2]=ta+1;a[ua+ta|0]=M;y=c[k>>2]|0;u=c[y>>2]|0;c[y>>2]=u-1;y=c[k>>2]|0;if((u|0)==0){va=yh(y)|0}else{u=y+4|0;y=c[u>>2]|0;c[u>>2]=y+1;va=d[y]|0}c[j>>2]=va;y=c[h>>2]|0;u=c[b+52>>2]|0;w=Rg(u,(c[y>>2]|0)+1|0,(c[y+4>>2]|0)-2|0)|0;y=u+8|0;r=c[y>>2]|0;c[y>>2]=r+16;c[r>>2]=w;c[r+8>>2]=d[w+4|0]|64;r=Xg(u,c[(c[b+48>>2]|0)+4>>2]|0,(c[y>>2]|0)-16|0)|0;s=r+8|0;do{if((c[s>>2]|0)==0){c[r>>2]=1;c[s>>2]=1;if((c[(c[u+12>>2]|0)+12>>2]|0)<=0){wa=w;break}Nf(u);wa=w}else{wa=c[r+16>>2]|0}}while(0);c[y>>2]=(c[y>>2]|0)-16;c[e>>2]=wa;p=289;i=f;return p|0}else if((o|0)==193){r=c[h>>2]|0;w=r+4|0;u=c[w>>2]|0;s=r+8|0;x=c[s>>2]|0;do{if((u+1|0)>>>0>x>>>0){if(x>>>0>2147483645>>>0){sj(b,13256,0);return 0}t=x<<1;ia=c[b+52>>2]|0;if((t|0)==-2){_f(ia);return 0}else{q=r|0;ma=$f(ia,c[q>>2]|0,x,t)|0;c[q>>2]=ma;c[s>>2]=t;xa=c[w>>2]|0;ya=ma;break}}else{xa=u;ya=c[r>>2]|0}}while(0);c[w>>2]=xa+1;a[ya+xa|0]=46;r=c[k>>2]|0;u=c[r>>2]|0;c[r>>2]=u-1;r=c[k>>2]|0;if((u|0)==0){za=yh(r)|0}else{u=r+4|0;r=c[u>>2]|0;c[u>>2]=r+1;za=d[r]|0}c[j>>2]=za;do{if((za|0)!=0){if((Ma(4080,za|0,2)|0)==0){break}r=c[h>>2]|0;u=r+4|0;s=c[u>>2]|0;x=r+8|0;y=c[x>>2]|0;do{if((s+1|0)>>>0>y>>>0){if(y>>>0>2147483645>>>0){sj(b,13256,0);return 0}ma=y<<1;t=c[b+52>>2]|0;if((ma|0)==-2){_f(t);return 0}else{q=r|0;ia=$f(t,c[q>>2]|0,y,ma)|0;c[q>>2]=ia;c[x>>2]=ma;Aa=c[u>>2]|0;Ba=ia;break}}else{Aa=s;Ba=c[r>>2]|0}}while(0);c[u>>2]=Aa+1;a[Ba+Aa|0]=za;r=c[k>>2]|0;s=c[r>>2]|0;c[r>>2]=s-1;r=c[k>>2]|0;if((s|0)==0){Ca=yh(r)|0}else{s=r+4|0;r=c[s>>2]|0;c[s>>2]=r+1;Ca=d[r]|0}c[j>>2]=Ca;if((Ca|0)==0){p=279;i=f;return p|0}if((Ma(4080,Ca|0,2)|0)==0){p=279;i=f;return p|0}r=c[h>>2]|0;s=r+4|0;x=c[s>>2]|0;y=r+8|0;v=c[y>>2]|0;do{if((x+1|0)>>>0>v>>>0){if(v>>>0>2147483645>>>0){sj(b,13256,0);return 0}ia=v<<1;ma=c[b+52>>2]|0;if((ia|0)==-2){_f(ma);return 0}else{q=r|0;t=$f(ma,c[q>>2]|0,v,ia)|0;c[q>>2]=t;c[y>>2]=ia;Da=c[s>>2]|0;Ea=t;break}}else{Da=x;Ea=c[r>>2]|0}}while(0);c[s>>2]=Da+1;a[Ea+Da|0]=Ca;r=c[k>>2]|0;x=c[r>>2]|0;c[r>>2]=x-1;r=c[k>>2]|0;if((x|0)==0){Fa=yh(r)|0}else{x=r+4|0;r=c[x>>2]|0;c[x>>2]=r+1;Fa=d[r]|0}c[j>>2]=Fa;p=280;i=f;return p|0}}while(0);if((a[za+657|0]&2)==0){p=46}else{n=za;break}i=f;return p|0}else if((o|0)==315){if((a[m+657|0]&1)==0){w=c[k>>2]|0;r=c[w>>2]|0;c[w>>2]=r-1;w=c[k>>2]|0;if((r|0)==0){Ga=yh(w)|0}else{r=w+4|0;w=c[r>>2]|0;c[r>>2]=w+1;Ga=d[w]|0}c[j>>2]=Ga;p=m;i=f;return p|0}w=b+52|0;r=m&255;while(1){x=c[h>>2]|0;y=x+4|0;v=c[y>>2]|0;u=x+8|0;t=c[u>>2]|0;if((v+1|0)>>>0>t>>>0){if(t>>>0>2147483645>>>0){o=320;break}ia=t<<1;Ha=c[w>>2]|0;if((ia|0)==-2){o=322;break}q=x|0;ma=$f(Ha,c[q>>2]|0,t,ia)|0;c[q>>2]=ma;c[u>>2]=ia;Ia=c[y>>2]|0;Ja=ma}else{Ia=v;Ja=c[x>>2]|0}c[y>>2]=Ia+1;a[Ja+Ia|0]=r;y=c[k>>2]|0;x=c[y>>2]|0;c[y>>2]=x-1;y=c[k>>2]|0;if((x|0)==0){Ka=yh(y)|0}else{x=y+4|0;y=c[x>>2]|0;c[x>>2]=y+1;Ka=d[y]|0}c[j>>2]=Ka;if((a[Ka+657|0]&3)==0){o=328;break}else{r=Ka&255}}if((o|0)==320){sj(b,13256,0);return 0}else if((o|0)==322){_f(Ha);return 0}else if((o|0)==328){r=c[h>>2]|0;y=c[w>>2]|0;x=Rg(y,c[r>>2]|0,c[r+4>>2]|0)|0;r=y+8|0;v=c[r>>2]|0;c[r>>2]=v+16;c[v>>2]=x;c[v+8>>2]=d[x+4|0]|64;v=Xg(y,c[(c[b+48>>2]|0)+4>>2]|0,(c[r>>2]|0)-16|0)|0;ma=v+8|0;do{if((c[ma>>2]|0)==0){c[v>>2]=1;c[ma>>2]=1;if((c[(c[y+12>>2]|0)+12>>2]|0)<=0){La=x;break}Nf(y);La=x}else{La=c[v+16>>2]|0}}while(0);c[r>>2]=(c[r>>2]|0)-16;c[e>>2]=La;v=La;if((a[v+4|0]|0)!=4){p=288;i=f;return p|0}x=a[v+6|0]|0;if(x<<24>>24==0){p=288;i=f;return p|0}p=x&255|256;i=f;return p|0}}else if((o|0)==339){i=f;return p|0}}while(0);La=c[h>>2]|0;Ha=La+4|0;Ka=c[Ha>>2]|0;Ia=La+8|0;Ja=c[Ia>>2]|0;do{if((Ka+1|0)>>>0>Ja>>>0){if(Ja>>>0>2147483645>>>0){sj(b,13256,0);return 0}m=Ja<<1;Ga=c[b+52>>2]|0;if((m|0)==-2){_f(Ga);return 0}else{za=La|0;Fa=$f(Ga,c[za>>2]|0,Ja,m)|0;c[za>>2]=Fa;c[Ia>>2]=m;Na=c[Ha>>2]|0;Oa=Fa;break}}else{Na=Ka;Oa=c[La>>2]|0}}while(0);c[Ha>>2]=Na+1;a[Oa+Na|0]=n;Na=c[k>>2]|0;Oa=c[Na>>2]|0;c[Na>>2]=Oa-1;Na=c[k>>2]|0;if((Oa|0)==0){Pa=yh(Na)|0}else{Oa=Na+4|0;Na=c[Oa>>2]|0;c[Oa>>2]=Na+1;Pa=d[Na]|0}c[j>>2]=Pa;do{if((n|0)==48){if((Pa|0)==0){Qa=3760;Ra=0;break}if((Ma(3368,Pa|0,3)|0)==0){Qa=3760;Ra=Pa;break}Na=c[h>>2]|0;Oa=Na+4|0;Ha=c[Oa>>2]|0;La=Na+8|0;Ka=c[La>>2]|0;do{if((Ha+1|0)>>>0>Ka>>>0){if(Ka>>>0>2147483645>>>0){sj(b,13256,0);return 0}Ia=Ka<<1;Ja=c[b+52>>2]|0;if((Ia|0)==-2){_f(Ja);return 0}else{Fa=Na|0;m=$f(Ja,c[Fa>>2]|0,Ka,Ia)|0;c[Fa>>2]=m;c[La>>2]=Ia;Sa=c[Oa>>2]|0;Ta=m;break}}else{Sa=Ha;Ta=c[Na>>2]|0}}while(0);c[Oa>>2]=Sa+1;a[Ta+Sa|0]=Pa;Na=c[k>>2]|0;Ha=c[Na>>2]|0;c[Na>>2]=Ha-1;Na=c[k>>2]|0;if((Ha|0)==0){Ua=yh(Na)|0}else{Ha=Na+4|0;Na=c[Ha>>2]|0;c[Ha>>2]=Na+1;Ua=d[Na]|0}c[j>>2]=Ua;Qa=2872;Ra=Ua}else{Qa=3760;Ra=Pa}}while(0);Pa=b+52|0;Ua=Ra;f:while(1){do{if((Ua|0)==0){Va=0}else{if((Ma(Qa|0,Ua|0,3)|0)==0){Va=Ua;break}Ra=c[h>>2]|0;Sa=Ra+4|0;Ta=c[Sa>>2]|0;n=Ra+8|0;Na=c[n>>2]|0;if((Ta+1|0)>>>0>Na>>>0){if(Na>>>0>2147483645>>>0){o=259;break f}Ha=Na<<1;Wa=c[Pa>>2]|0;if((Ha|0)==-2){o=261;break f}La=Ra|0;Ka=$f(Wa,c[La>>2]|0,Na,Ha)|0;c[La>>2]=Ka;c[n>>2]=Ha;Xa=c[Sa>>2]|0;Ya=Ka}else{Xa=Ta;Ya=c[Ra>>2]|0}c[Sa>>2]=Xa+1;a[Ya+Xa|0]=Ua;Sa=c[k>>2]|0;Ra=c[Sa>>2]|0;c[Sa>>2]=Ra-1;Sa=c[k>>2]|0;if((Ra|0)==0){Za=yh(Sa)|0}else{Ra=Sa+4|0;Sa=c[Ra>>2]|0;c[Ra>>2]=Sa+1;Za=d[Sa]|0}c[j>>2]=Za;if((Za|0)==0){Va=0;break}if((Ma(2584,Za|0,3)|0)==0){Va=Za;break}Sa=c[h>>2]|0;Ra=Sa+4|0;Ta=c[Ra>>2]|0;Ka=Sa+8|0;Ha=c[Ka>>2]|0;if((Ta+1|0)>>>0>Ha>>>0){if(Ha>>>0>2147483645>>>0){o=271;break f}n=Ha<<1;_a=c[Pa>>2]|0;if((n|0)==-2){o=273;break f}La=Sa|0;Na=$f(_a,c[La>>2]|0,Ha,n)|0;c[La>>2]=Na;c[Ka>>2]=n;$a=c[Ra>>2]|0;ab=Na}else{$a=Ta;ab=c[Sa>>2]|0}c[Ra>>2]=$a+1;a[ab+$a|0]=Za;Ra=c[k>>2]|0;Sa=c[Ra>>2]|0;c[Ra>>2]=Sa-1;Ra=c[k>>2]|0;if((Sa|0)==0){bb=yh(Ra)|0}else{Sa=Ra+4|0;Ra=c[Sa>>2]|0;c[Sa>>2]=Ra+1;bb=d[Ra]|0}c[j>>2]=bb;Va=bb}}while(0);cb=c[h>>2]|0;db=cb+4|0;eb=c[db>>2]|0;fb=cb+8|0;gb=c[fb>>2]|0;hb=(eb+1|0)>>>0>gb>>>0;if(!((a[Va+657|0]&16)!=0|(Va|0)==46)){o=291;break}if(hb){if(gb>>>0>2147483645>>>0){o=283;break}Oa=gb<<1;ib=c[Pa>>2]|0;if((Oa|0)==-2){o=285;break}Ra=cb|0;Sa=$f(ib,c[Ra>>2]|0,gb,Oa)|0;c[Ra>>2]=Sa;c[fb>>2]=Oa;jb=c[db>>2]|0;kb=Sa}else{jb=eb;kb=c[cb>>2]|0}c[db>>2]=jb+1;a[kb+jb|0]=Va;Sa=c[k>>2]|0;Oa=c[Sa>>2]|0;c[Sa>>2]=Oa-1;Sa=c[k>>2]|0;if((Oa|0)==0){lb=yh(Sa)|0}else{Oa=Sa+4|0;Sa=c[Oa>>2]|0;c[Oa>>2]=Sa+1;lb=d[Sa]|0}c[j>>2]=lb;Ua=lb}if((o|0)==259){sj(b,13256,0);return 0}else if((o|0)==261){_f(Wa);return 0}else if((o|0)==271){sj(b,13256,0);return 0}else if((o|0)==273){_f(_a);return 0}else if((o|0)==283){sj(b,13256,0);return 0}else if((o|0)==285){_f(ib);return 0}else if((o|0)==291){do{if(hb){if(gb>>>0>2147483645>>>0){sj(b,13256,0);return 0}o=gb<<1;ib=c[Pa>>2]|0;if((o|0)==-2){_f(ib);return 0}else{_a=cb|0;Wa=$f(ib,c[_a>>2]|0,gb,o)|0;c[_a>>2]=Wa;c[fb>>2]=o;mb=c[db>>2]|0;nb=Wa;break}}else{mb=eb;nb=c[cb>>2]|0}}while(0);c[db>>2]=mb+1;a[nb+mb|0]=0;mb=b+76|0;nb=a[mb]|0;db=c[h>>2]|0;cb=c[db>>2]|0;eb=c[db+4>>2]|0;if((eb|0)==0){ob=cb;pb=-1}else{db=eb;do{db=db-1|0;eb=cb+db|0;if((a[eb]|0)==46){a[eb]=nb}}while((db|0)!=0);db=c[h>>2]|0;ob=c[db>>2]|0;pb=(c[db+4>>2]|0)-1|0}db=e|0;if((fg(ob,pb,db)|0)!=0){p=287;i=f;return p|0}pb=a[mb]|0;ob=a[c[(Ob()|0)>>2]|0]|0;a[mb]=ob;e=c[h>>2]|0;nb=c[e>>2]|0;cb=c[e+4>>2]|0;if((cb|0)==0){qb=nb;rb=-1}else{e=cb;do{e=e-1|0;cb=nb+e|0;if((a[cb]|0)==pb<<24>>24){a[cb]=ob}}while((e|0)!=0);e=c[h>>2]|0;qb=c[e>>2]|0;rb=(c[e+4>>2]|0)-1|0}if((fg(qb,rb,db)|0)!=0){p=287;i=f;return p|0}p=a[mb]|0;mb=c[h>>2]|0;h=c[mb>>2]|0;f=c[mb+4>>2]|0;if((f|0)==0){sj(b,13576,287);return 0}else{sb=f}do{sb=sb-1|0;f=h+sb|0;if((a[f]|0)==p<<24>>24){a[f]=46}}while((sb|0)!=0);sj(b,13576,287);return 0}return 0}function uj(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;e=b|0;f=c[e>>2]|0;g=b+60|0;h=c[g>>2]|0;i=h+4|0;j=c[i>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((j+1|0)>>>0>l>>>0){if(l>>>0>2147483645>>>0){sj(b,13256,0);return 0}m=l<<1;n=c[b+52>>2]|0;if((m|0)==-2){_f(n);return 0}else{o=h|0;p=$f(n,c[o>>2]|0,l,m)|0;c[o>>2]=p;c[k>>2]=m;q=c[i>>2]|0;r=p;break}}else{q=j;r=c[h>>2]|0}}while(0);c[i>>2]=q+1;a[r+q|0]=f;q=b+56|0;r=c[q>>2]|0;i=c[r>>2]|0;c[r>>2]=i-1;r=c[q>>2]|0;if((i|0)==0){s=yh(r)|0}else{i=r+4|0;r=c[i>>2]|0;c[i>>2]=r+1;s=d[r]|0}c[e>>2]=s;if((s|0)!=61){t=s;u=0;v=(t|0)!=(f|0);w=v<<31>>31;x=w^u;return x|0}s=b+52|0;r=61;i=0;while(1){h=c[g>>2]|0;j=h+4|0;k=c[j>>2]|0;l=h+8|0;p=c[l>>2]|0;if((k+1|0)>>>0>p>>>0){if(p>>>0>2147483645>>>0){y=16;break}m=p<<1;z=c[s>>2]|0;if((m|0)==-2){y=18;break}o=h|0;n=$f(z,c[o>>2]|0,p,m)|0;c[o>>2]=n;c[l>>2]=m;A=c[j>>2]|0;B=n}else{A=k;B=c[h>>2]|0}c[j>>2]=A+1;a[B+A|0]=r;j=c[q>>2]|0;h=c[j>>2]|0;c[j>>2]=h-1;j=c[q>>2]|0;if((h|0)==0){C=yh(j)|0}else{h=j+4|0;j=c[h>>2]|0;c[h>>2]=j+1;C=d[j]|0}c[e>>2]=C;j=i+1|0;if((C|0)==61){r=C&255;i=j}else{t=C;u=j;y=24;break}}if((y|0)==16){sj(b,13256,0);return 0}else if((y|0)==18){_f(z);return 0}else if((y|0)==24){v=(t|0)!=(f|0);w=v<<31>>31;x=w^u;return x|0}return 0}function vj(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;g=b|0;h=c[g>>2]|0;i=b+60|0;j=c[i>>2]|0;k=j+4|0;l=c[k>>2]|0;m=j+8|0;n=c[m>>2]|0;do{if((l+1|0)>>>0>n>>>0){if(n>>>0>2147483645>>>0){sj(b,13256,0)}o=n<<1;p=c[b+52>>2]|0;if((o|0)==-2){_f(p)}else{q=j|0;r=$f(p,c[q>>2]|0,n,o)|0;c[q>>2]=r;c[m>>2]=o;s=c[k>>2]|0;t=r;break}}else{s=l;t=c[j>>2]|0}}while(0);c[k>>2]=s+1;a[t+s|0]=h;h=b+56|0;s=c[h>>2]|0;t=c[s>>2]|0;c[s>>2]=t-1;s=c[h>>2]|0;if((t|0)==0){u=yh(s)|0}else{t=s+4|0;s=c[t>>2]|0;c[t>>2]=s+1;u=d[s]|0}c[g>>2]=u;do{if((u|0)==10|(u|0)==13){s=c[h>>2]|0;t=c[s>>2]|0;c[s>>2]=t-1;s=c[h>>2]|0;if((t|0)==0){v=yh(s)|0}else{t=s+4|0;s=c[t>>2]|0;c[t>>2]=s+1;v=d[s]|0}c[g>>2]=v;do{if((v|0)==10|(v|0)==13){if((v|0)==(u|0)){break}s=c[h>>2]|0;t=c[s>>2]|0;c[s>>2]=t-1;s=c[h>>2]|0;if((t|0)==0){w=yh(s)|0}else{t=s+4|0;s=c[t>>2]|0;c[t>>2]=s+1;w=d[s]|0}c[g>>2]=w}}while(0);s=b+4|0;t=c[s>>2]|0;c[s>>2]=t+1;if((t|0)<=2147483643){x=23;break}nj(b,10568)}else{y=u}}while(0);a:while(1){if((x|0)==23){x=0;y=c[g>>2]|0}z=(e|0)==0;A=b+52|0;b:do{if(z){u=y;while(1){if((u|0)==93){x=32;break b}else if((u|0)==10|(u|0)==13){break b}else if((u|0)==(-1|0)){x=31;break a}w=c[h>>2]|0;v=c[w>>2]|0;c[w>>2]=v-1;w=c[h>>2]|0;if((v|0)==0){B=yh(w)|0}else{v=w+4|0;w=c[v>>2]|0;c[v>>2]=w+1;B=d[w]|0}c[g>>2]=B;u=B}}else{u=y;while(1){if((u|0)==93){x=32;break b}else if((u|0)==10|(u|0)==13){break b}else if((u|0)==(-1|0)){x=31;break a}w=c[i>>2]|0;v=w+4|0;t=c[v>>2]|0;s=w+8|0;k=c[s>>2]|0;if((t+1|0)>>>0>k>>>0){if(k>>>0>2147483645>>>0){x=67;break a}j=k<<1;C=c[A>>2]|0;if((j|0)==-2){x=69;break a}l=w|0;m=$f(C,c[l>>2]|0,k,j)|0;c[l>>2]=m;c[s>>2]=j;D=c[v>>2]|0;E=m}else{D=t;E=c[w>>2]|0}c[v>>2]=D+1;a[E+D|0]=u;v=c[h>>2]|0;w=c[v>>2]|0;c[v>>2]=w-1;v=c[h>>2]|0;if((w|0)==0){F=yh(v)|0}else{w=v+4|0;v=c[w>>2]|0;c[w>>2]=v+1;F=d[v]|0}c[g>>2]=F;u=F}}}while(0);if((x|0)==32){x=0;if((uj(b)|0)==(f|0)){x=33;break}else{x=23;continue}}u=c[i>>2]|0;v=u+4|0;w=c[v>>2]|0;t=u+8|0;m=c[t>>2]|0;if((w+1|0)>>>0>m>>>0){if(m>>>0>2147483645>>>0){x=47;break}j=m<<1;G=c[A>>2]|0;if((j|0)==-2){x=49;break}s=u|0;l=$f(G,c[s>>2]|0,m,j)|0;c[s>>2]=l;c[t>>2]=j;H=c[v>>2]|0;I=l}else{H=w;I=c[u>>2]|0}c[v>>2]=H+1;a[I+H|0]=10;v=c[g>>2]|0;u=c[h>>2]|0;w=c[u>>2]|0;c[u>>2]=w-1;u=c[h>>2]|0;if((w|0)==0){J=yh(u)|0}else{w=u+4|0;u=c[w>>2]|0;c[w>>2]=u+1;J=d[u]|0}c[g>>2]=J;do{if((J|0)==10|(J|0)==13){if((J|0)==(v|0)){break}u=c[h>>2]|0;w=c[u>>2]|0;c[u>>2]=w-1;u=c[h>>2]|0;if((w|0)==0){K=yh(u)|0}else{w=u+4|0;u=c[w>>2]|0;c[w>>2]=u+1;K=d[u]|0}c[g>>2]=K}}while(0);v=b+4|0;u=c[v>>2]|0;c[v>>2]=u+1;if((u|0)>2147483643){x=61;break}if(!z){x=23;continue}c[(c[i>>2]|0)+4>>2]=0;x=23}if((x|0)==31){sj(b,(e|0)!=0?11848:11592,286)}else if((x|0)==33){K=c[g>>2]|0;J=c[i>>2]|0;H=J+4|0;I=c[H>>2]|0;F=J+8|0;D=c[F>>2]|0;do{if((I+1|0)>>>0>D>>>0){if(D>>>0>2147483645>>>0){sj(b,13256,0)}E=D<<1;y=c[A>>2]|0;if((E|0)==-2){_f(y)}else{B=J|0;u=$f(y,c[B>>2]|0,D,E)|0;c[B>>2]=u;c[F>>2]=E;L=c[H>>2]|0;M=u;break}}else{L=I;M=c[J>>2]|0}}while(0);c[H>>2]=L+1;a[M+L|0]=K;K=c[h>>2]|0;L=c[K>>2]|0;c[K>>2]=L-1;K=c[h>>2]|0;if((L|0)==0){N=yh(K)|0}else{L=K+4|0;K=c[L>>2]|0;c[L>>2]=K+1;N=d[K]|0}c[g>>2]=N;if(z){return}z=c[i>>2]|0;i=f+2|0;f=c[A>>2]|0;A=Rg(f,(c[z>>2]|0)+i|0,(c[z+4>>2]|0)-(i<<1)|0)|0;i=f+8|0;z=c[i>>2]|0;c[i>>2]=z+16;c[z>>2]=A;c[z+8>>2]=d[A+4|0]|0|64;z=Xg(f,c[(c[b+48>>2]|0)+4>>2]|0,(c[i>>2]|0)-16|0)|0;N=z+8|0;do{if((c[N>>2]|0)==0){c[z>>2]=1;c[N>>2]=1;if((c[(c[f+12>>2]|0)+12>>2]|0)<=0){O=A;break}Nf(f);O=A}else{O=c[z+16>>2]|0}}while(0);c[i>>2]=(c[i>>2]|0)-16;c[e>>2]=O;return}else if((x|0)==47){sj(b,13256,0)}else if((x|0)==49){_f(G)}else if((x|0)==61){nj(b,10568)}else if((x|0)==67){sj(b,13256,0)}else if((x|0)==69){_f(C)}}function wj(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;c[(c[a+60>>2]|0)+4>>2]=0;xj(a,92);if((d|0)>0){f=0}else{sj(a,e,289)}while(1){g=c[b+(f<<2)>>2]|0;if((g|0)==-1){h=4;break}xj(a,g);g=f+1|0;if((g|0)<(d|0)){f=g}else{h=4;break}}if((h|0)==4){sj(a,e,289)}}function xj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=c[b+60>>2]|0;f=e+4|0;g=c[f>>2]|0;h=e+8|0;i=c[h>>2]|0;if((g+1|0)>>>0<=i>>>0){j=g;k=c[e>>2]|0;l=d&255;m=j+1|0;c[f>>2]=m;n=k+j|0;a[n]=l;return}if(i>>>0>2147483645>>>0){sj(b,13256,0)}g=i<<1;o=c[b+52>>2]|0;if((g|0)==-2){_f(o)}b=e|0;e=$f(o,c[b>>2]|0,i,g)|0;c[b>>2]=e;c[h>>2]=g;j=c[f>>2]|0;k=e;l=d&255;m=j+1|0;c[f>>2]=m;n=k+j|0;a[n]=l;return}function yj(a){a=a|0;je(a,-1001e3,2);je(a,-1001e3,2);pe(a,-2,3984);ni(a,2248,0);Zd(a,11992,7)|0;pe(a,-2,8280);return 1}function zj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;if((Pd(a,1)|0)==0){d=Nh(a,2,4048,0)|0;e=Eh(a,4088,(f=i,i=i+8|0,c[f>>2]=d,f)|0)|0;i=f;g=e;i=b;return g|0}else{g=xd(a)|0;i=b;return g|0}return 0}function Aj(a){a=a|0;var b=0,d=0,e=0;b=c[1496+((Mh(a,1,4840,1544)|0)<<2)>>2]|0;d=Ae(a,b,Wh(a,2,0)|0)|0;if((b|0)==5|(b|0)==9){ce(a,d);e=1;return e|0}else if((b|0)==3){b=Ae(a,4,0)|0;Wd(a,+(d|0)+ +(b|0)*.0009765625);Xd(a,b);e=2;return e|0}else{Xd(a,d);e=1;return e|0}return 0}function Bj(a){a=a|0;var b=0,c=0;b=Nh(a,1,0,0)|0;yd(a,1);if((fi(a,b,0)|0)==0){ve(a,0,-1,0,224);c=(xd(a)|0)-1|0;return c|0}else{c=Be(a)|0;return c|0}return 0}function Cj(a){a=a|0;var b=0,c=0;b=Wh(a,2,1)|0;yd(a,1);if(!((Id(a,1)|0)!=0&(b|0)>0)){c=Be(a)|0;return c|0}Fh(a,b);Dd(a,1);De(a,2);c=Be(a)|0;return c|0}function Dj(a){a=a|0;Rh(a,1);if((le(a,1)|0)==0){Vd(a);return 1}else{hi(a,1,7208)|0;return 1}return 0}function Ej(a){a=a|0;Xj(a,5280,1,208);return 3}function Fj(a){a=a|0;var b=0,c=0,d=0,e=0;b=Nh(a,1,0,0)|0;c=Nh(a,2,0,0)|0;d=(Ed(a,3)|0)!=-1;if((fi(a,b,c)|0)!=0){Vd(a);Ad(a,-2);e=2;return e|0}if(!d){e=1;return e|0}Dd(a,d?3:0);if((He(a,-2,1)|0)!=0){e=1;return e|0}yd(a,-2);e=1;return e|0}function Gj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;i=i+8|0;d=b|0;e=Qd(a,1,d)|0;f=Nh(a,3,5992,0)|0;g=(Ed(a,4)|0)!=-1;if((e|0)==0){h=Nh(a,2,5856,0)|0;Qh(a,1,6);yd(a,5);j=xe(a,38,0,h,f)|0}else{h=Nh(a,2,e,0)|0;j=gi(a,e,c[d>>2]|0,h,f)|0}if((j|0)!=0){Vd(a);Ad(a,-2);k=2;i=b;return k|0}if(!g){k=1;i=b;return k|0}Dd(a,g?4:0);if((He(a,-2,1)|0)!=0){k=1;i=b;return k|0}yd(a,-2);k=1;i=b;return k|0}function Hj(a){a=a|0;var b=0;Qh(a,1,5);yd(a,2);if((Ce(a,1)|0)!=0){b=2;return b|0}Vd(a);b=1;return b|0}function Ij(a){a=a|0;Xj(a,6176,0,58);return 3}function Jj(a){a=a|0;Rh(a,1);Vd(a);Ad(a,1);return _j(a,(we(a,(xd(a)|0)-2|0,-1,0,0,56)|0)==0|0)|0}function Kj(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+8|0;d=b|0;e=xd(a)|0;fe(a,8808);f=c[q>>2]|0;a:do{if((e|0)>=1){g=1;while(1){Dd(a,-1);Dd(a,g);ve(a,1,1,0,0);h=Qd(a,-1,d)|0;if((h|0)==0){break}if((g|0)>1){xa(9,f|0)|0}ya(h|0,1,c[d>>2]|0,f|0)|0;yd(a,-2);if((g|0)<(e|0)){g=g+1|0}else{break a}}g=Eh(a,6456,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;j=g;i=b;return j|0}}while(0);xa(10,f|0)|0;wa(f|0)|0;j=0;i=b;return j|0}function Lj(a){a=a|0;Rh(a,1);Rh(a,2);ce(a,Kd(a,1,2)|0);return 1}function Mj(a){a=a|0;if(((Ed(a,1)|0)&-2|0)!=4){Dh(a,1,6600)|0}Xd(a,Rd(a,1)|0);return 1}function Nj(a){a=a|0;Qh(a,1,5);Rh(a,2);yd(a,2);ie(a,1);return 1}function Oj(a){a=a|0;Qh(a,1,5);Rh(a,2);Rh(a,3);yd(a,3);qe(a,1);return 1}function Pj(b){b=b|0;var c=0,d=0,e=0,f=0;c=xd(b)|0;do{if((Ed(b,1)|0)==4){if((a[Qd(b,1,0)|0]|0)!=35){break}Xd(b,c-1|0);d=1;return d|0}}while(0);e=Uh(b,1)|0;if((e|0)<0){f=e+c|0}else{f=(e|0)>(c|0)?c:e}if((f|0)<=0){Dh(b,1,6776)|0}d=c-f|0;return d|0}function Qj(a){a=a|0;var b=0,d=0,e=0;b=i;d=Ed(a,2)|0;Qh(a,1,5);if(!((d|0)==5|(d|0)==0)){Dh(a,2,7400)|0}if((hi(a,1,7208)|0)==0){yd(a,2);se(a,1)|0;e=1;i=b;return e|0}else{d=Eh(a,7e3,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;e=d;i=b;return e|0}return 0}function Rj(b){b=b|0;var e=0,f=0,g=0,h=0.0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0.0,u=0,v=0.0,w=0.0;e=i;i=i+16|0;f=e|0;g=e+8|0;do{if((Ed(b,2)|0)<1){h=+Md(b,1,f);if((c[f>>2]|0)==0){Rh(b,1);break}Wd(b,h);i=e;return 1}else{j=Oh(b,1,g)|0;k=j+(c[g>>2]|0)|0;l=Uh(b,2)|0;if((l-2|0)>>>0>=35>>>0){Dh(b,2,7736)|0}m=Sb(j|0,7568)|0;n=j+m|0;o=a[n]|0;if((o<<24>>24|0)==45){p=1;q=j+(m+1)|0}else if((o<<24>>24|0)==43){p=0;q=j+(m+1)|0}else{p=0;q=n}if((Cb(d[q]|0|0)|0)==0){break}h=+(l|0);r=0.0;n=q;while(1){m=a[n]|0;j=m&255;if((j-48|0)>>>0<10>>>0){s=(m<<24>>24)-48|0}else{s=(vb(j|0)|0)-55|0}if((s|0)>=(l|0)){t=r;u=n;break}v=h*r+ +(s|0);j=n+1|0;if((Cb(d[j]|0|0)|0)==0){t=v;u=j;break}else{r=v;n=j}}if((u+(Sb(u|0,7568)|0)|0)!=(k|0)){break}if((p|0)==0){w=t}else{w=-0.0-t}Wd(b,w);i=e;return 1}}while(0);Vd(b);i=e;return 1}function Sj(a){a=a|0;Rh(a,1);ki(a,1,0)|0;return 1}function Tj(a){a=a|0;Rh(a,1);_d(a,Fd(a,Ed(a,1)|0)|0)|0;return 1}function Uj(a){a=a|0;var b=0;b=xd(a)|0;if((b|0)<=1){Dh(a,2,8144)|0}Dd(a,1);Cd(a,2,1);Bd(a,2);return _j(a,(we(a,b-2|0,-1,1,0,56)|0)==0|0)|0}function Vj(a){a=a|0;return(xd(a)|0)-1|0}function Wj(a){a=a|0;var b=0,c=0;b=Uh(a,2)|0;Qh(a,1,5);c=b+1|0;Xd(a,c);je(a,1,c);c=(Ed(a,-1)|0)==0;return(c?1:2)|0}function Xj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if((hi(a,1,b)|0)!=0){Dd(a,1);ve(a,1,3,0,0);return}Qh(a,1,5);be(a,d,0);Dd(a,1);if((c|0)==0){Vd(a);return}else{Xd(a,0);return}}function Yj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;Ph(a,2,5712);Dd(a,1);ve(a,0,1,0,0);if((Ed(a,-1)|0)==0){yd(a,-2);c[d>>2]=0;e=0;i=b;return e|0}if((Id(a,-1)|0)==0){Eh(a,5496,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f}Bd(a,5);e=Qd(a,5,d)|0;i=b;return e|0}function Zj(a){a=a|0;return _j(a,(ue(a,0)|0)==1|0)|0}function _j(a,b){a=a|0;b=b|0;var c=0;if((sd(a,1)|0)==0){yd(a,0);ce(a,0);_d(a,7912)|0;c=2;return c|0}else{ce(a,b);Bd(a,1);c=xd(a)|0;return c|0}return 0}function $j(a){a=a|0;ke(a,0,12);ni(a,2144,0);return 1}function ak(a){a=a|0;var b=0,c=0,d=0,e=0;b=Vh(a,1)|0;c=Uh(a,2)|0;if((c|0)>-1&(b|0)<0){if((c|0)>31){d=-1}else{d=b>>>(c>>>0)|~(-1>>>(c>>>0))}Yd(a,d);return 1}d=-c|0;if((c|0)>0){e=(c|0)>31?0:b>>>(c>>>0)}else{e=(d|0)>31?0:b<<d}Yd(a,e);return 1}function bk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=xd(a)|0;if((b|0)<1){c=-1}else{d=1;e=-1;while(1){f=(Vh(a,d)|0)&e;if((d|0)<(b|0)){d=d+1|0;e=f}else{c=f;break}}}Yd(a,c);return 1}function ck(a){a=a|0;Yd(a,~(Vh(a,1)|0));return 1}function dk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=xd(a)|0;if((b|0)<1){c=0}else{d=1;e=0;while(1){f=Vh(a,d)|0|e;if((d|0)<(b|0)){d=d+1|0;e=f}else{c=f;break}}}Yd(a,c);return 1}function ek(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=xd(a)|0;if((b|0)<1){c=0}else{d=1;e=0;while(1){f=(Vh(a,d)|0)^e;if((d|0)<(b|0)){d=d+1|0;e=f}else{c=f;break}}}Yd(a,c);return 1}function fk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=xd(a)|0;if((b|0)<1){c=1}else{d=1;e=-1;while(1){f=(Vh(a,d)|0)&e;if((d|0)<(b|0)){d=d+1|0;e=f}else{break}}c=(f|0)!=0|0}ce(a,c);return 1}function gk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=Vh(a,1)|0;e=Uh(a,2)|0;f=Wh(a,3,1)|0;if((e|0)<=-1){Dh(a,2,12856)|0}if((f|0)<=0){Dh(a,3,12528)|0}if((f+e|0)>32){Eh(a,12216,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}Yd(a,d>>>(e>>>0)&~(-2<<f-1));i=b;return 1}function hk(a){a=a|0;var b=0,c=0,d=0,e=0;b=Uh(a,2)|0;c=Vh(a,1)|0;d=b&31;if((d|0)==0){e=c}else{e=c>>>((32-d|0)>>>0)|c<<d}Yd(a,e);return 1}function ik(a){a=a|0;var b=0,c=0,d=0,e=0;b=Vh(a,1)|0;c=Uh(a,2)|0;if((c|0)<0){d=-c|0;e=(d|0)>31?0:b>>>(d>>>0);Yd(a,e);return 1}else{e=(c|0)>31?0:b<<c;Yd(a,e);return 1}return 0}function jk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=Vh(a,1)|0;e=Vh(a,2)|0;f=Uh(a,3)|0;g=Wh(a,4,1)|0;if((f|0)<=-1){Dh(a,3,12856)|0}if((g|0)<=0){Dh(a,4,12528)|0}if((g+f|0)>32){Eh(a,12216,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h}h=~(-2<<g-1);Yd(a,d&~(h<<f)|(e&h)<<f);i=b;return 1}function kk(a){a=a|0;var b=0,c=0,d=0,e=0;b=-(Uh(a,2)|0)|0;c=Vh(a,1)|0;d=b&31;if((d|0)==0){e=c}else{e=c>>>((32-d|0)>>>0)|c<<d}Yd(a,e);return 1}function lk(a){a=a|0;var b=0,c=0,d=0,e=0;b=Vh(a,1)|0;c=Uh(a,2)|0;d=-c|0;if((c|0)>0){e=(c|0)>31?0:b>>>(c>>>0);Yd(a,e);return 1}else{e=(d|0)>31?0:b<<d;Yd(a,e);return 1}return 0}function mk(a){a=a|0;ke(a,0,6);ni(a,2088,0);return 1}function nk(a){a=a|0;var b=0;Qh(a,1,6);b=Hg(a)|0;Dd(a,1);td(a,b,1);return 1}function ok(a){a=a|0;var b=0,c=0,d=0;b=Td(a,1)|0;if((b|0)==0){Dh(a,1,2536)|0}c=tk(a,b,(xd(a)|0)-1|0)|0;if((c|0)<0){ce(a,0);Ad(a,-2);d=2;return d|0}else{ce(a,1);Ad(a,~c);d=c+1|0;return d|0}return 0}function pk(a){a=a|0;ce(a,ee(a)|0);return 2}function qk(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;i=i+104|0;c=b|0;d=Td(a,1)|0;if((d|0)==0){Dh(a,1,2536)|0}do{if((d|0)==(a|0)){Zd(a,8160,7)|0}else{e=ze(d)|0;if((e|0)==1){Zd(a,13544,9)|0;break}else if((e|0)==0){if((Qe(d,0,c)|0)>0){Zd(a,13184,6)|0;break}if((xd(d)|0)==0){Zd(a,12848,4)|0;break}else{Zd(a,13544,9)|0;break}}else{Zd(a,12848,4)|0;break}}}while(0);i=b;return 1}function rk(a){a=a|0;var b=0;Qh(a,1,6);b=Hg(a)|0;Dd(a,1);td(a,b,1);be(a,108,1);return 1}function sk(a){a=a|0;return lf(a,xd(a)|0,0,0)|0}function tk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((sd(b,c)|0)==0){Zd(a,3704,28)|0;d=-1;return d|0}do{if((ze(b)|0)==0){if((xd(b)|0)!=0){break}Zd(a,3312,28)|0;d=-1;return d|0}}while(0);td(a,b,c);if((kf(b,a,c)|0)>>>0>=2>>>0){td(b,a,1);d=-1;return d|0}c=xd(b)|0;if((sd(a,c+1|0)|0)==0){yd(b,~c);Zd(a,2824,26)|0;d=-1;return d|0}else{td(b,a,c);d=c;return d|0}return 0}function uk(a){a=a|0;var b=0,c=0,d=0;b=Td(a,-1001001)|0;c=tk(a,b,xd(a)|0)|0;if((c|0)>=0){d=c;return d|0}if((Id(a,-1)|0)!=0){Fh(a,1);Ad(a,-2);De(a,2)}d=Be(a)|0;return d|0}function vk(a){a=a|0;ke(a,0,16);ni(a,1952,0);return 1}function wk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+256|0;d=c[p>>2]|0;ya(4424,11,1,d|0)|0;wa(d|0)|0;e=b|0;f=c[o>>2]|0;if((Ta(e|0,250,f|0)|0)==0){i=b;return 0}while(1){if((La(e|0,4344)|0)==0){g=3;break}if((gi(a,e,jn(e|0)|0,4208,0)|0)==0){if((we(a,0,0,0,0,0)|0)!=0){g=6}}else{g=6}if((g|0)==6){g=0;h=Qd(a,-1,0)|0;Yb(d|0,4128,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j;wa(d|0)|0}yd(a,0);ya(4424,11,1,d|0)|0;wa(d|0)|0;if((Ta(e|0,250,f|0)|0)==0){g=3;break}}if((g|0)==3){i=b;return 0}return 0}function xk(a){a=a|0;if((Ed(a,1)|0)==7){me(a,1);return 1}else{Vd(a);return 1}return 0}function yk(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;c=i;i=i+8|0;d=c|0;if((Ed(b,1)|0)==8){e=Td(b,1)|0}else{e=b}f=Oe(e)|0;g=Ne(e)|0;if((g|0)!=0&(g|0)!=42){Zd(b,4624,13)|0}else{oi(b,-1001e3,10552)|0;ee(e)|0;td(e,b,1);ie(b,-2);zd(b,-2)}g=d|0;if((f&1|0)==0){h=0}else{a[g]=99;h=1}if((f&2|0)==0){j=h}else{a[d+h|0]=114;j=h+1|0}if((f&4|0)==0){k=j}else{a[d+j|0]=108;k=j+1|0}a[d+k|0]=0;_d(b,g)|0;Xd(b,Pe(e)|0);i=c;return 3}



function zk(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+104|0;f=e|0;if((Ed(b,1)|0)==8){g=Td(b,1)|0;h=1}else{g=b;h=0}j=h|2;k=Nh(b,j,7392,0)|0;l=h+1|0;do{if((Hd(b,l)|0)==0){if((Ed(b,l)|0)==6){ae(b,7200,(h=i,i=i+8|0,c[h>>2]=k,h)|0)|0;i=h;h=Qd(b,-1,0)|0;Dd(b,l);td(b,g,1);m=h;break}n=Dh(b,l,6968)|0;i=e;return n|0}else{if((Qe(g,Nd(b,l,0)|0,f)|0)!=0){m=k;break}Vd(b);n=1;i=e;return n|0}}while(0);if((Te(g,m,f)|0)==0){n=Dh(b,j,6760)|0;i=e;return n|0}ke(b,0,2);if((Va(m|0,83)|0)!=0){_d(b,c[f+16>>2]|0)|0;pe(b,-2,6592);_d(b,f+36|0)|0;pe(b,-2,6440);Xd(b,c[f+24>>2]|0);pe(b,-2,6328);Xd(b,c[f+28>>2]|0);pe(b,-2,6264);_d(b,c[f+12>>2]|0)|0;pe(b,-2,6144)}if((Va(m|0,108)|0)!=0){Xd(b,c[f+20>>2]|0);pe(b,-2,5976)}if((Va(m|0,117)|0)!=0){Xd(b,d[f+32|0]|0);pe(b,-2,5848);Xd(b,d[f+33|0]|0);pe(b,-2,5704);ce(b,a[f+34|0]|0);pe(b,-2,5480)}if((Va(m|0,110)|0)!=0){_d(b,c[f+4>>2]|0)|0;pe(b,-2,5272);_d(b,c[f+8>>2]|0)|0;pe(b,-2,5064)}if((Va(m|0,116)|0)!=0){ce(b,a[f+35|0]|0);pe(b,-2,4944)}if((Va(m|0,76)|0)!=0){if((g|0)==(b|0)){Dd(b,-2);zd(b,-3)}else{td(g,b,1)}pe(b,-2,4824)}if((Va(m|0,102)|0)==0){n=1;i=e;return n|0}if((g|0)==(b|0)){Dd(b,-2);zd(b,-3)}else{td(g,b,1)}pe(b,-2,4728);n=1;i=e;return n|0}function Ak(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+104|0;c=b|0;if((Ed(a,1)|0)==8){d=Td(a,1)|0;e=1}else{d=a;e=0}f=Uh(a,e|2)|0;g=e+1|0;if((Ed(a,g)|0)==6){Dd(a,g);_d(a,Re(a,0,f)|0)|0;h=1;i=b;return h|0}if((Qe(d,Uh(a,g)|0,c)|0)==0){h=Dh(a,g,11560)|0;i=b;return h|0}g=Re(d,c,f)|0;if((g|0)==0){Vd(a);h=1;i=b;return h|0}else{td(d,a,1);_d(a,g)|0;Dd(a,-2);h=2;i=b;return h|0}return 0}function Bk(a){a=a|0;Dd(a,-1001e3);return 1}function Ck(a){a=a|0;Rh(a,1);if((le(a,1)|0)!=0){return 1}Vd(a);return 1}function Dk(a){a=a|0;var b=0,c=0,d=0;b=Uh(a,2)|0;Qh(a,1,6);c=Ge(a,1,b)|0;if((c|0)==0){d=0;return d|0}_d(a,c)|0;Ad(a,-2);d=2;return d|0}function Ek(a){a=a|0;var b=0,c=0,e=0,f=0,g=0;b=i;i=i+208|0;c=b|0;e=b+104|0;f=Uh(a,2)|0;Qh(a,1,6);Dd(a,1);Te(a,7904,e)|0;if((f|0)>0){if((f|0)>(d[e+32|0]|0|0)){g=3}}else{g=3}if((g|0)==3){Dh(a,2,7712)|0}e=Uh(a,4)|0;Qh(a,3,6);Dd(a,3);Te(a,7904,c)|0;if((e|0)>0){if((e|0)>(d[c+32|0]|0|0)){g=6}}else{g=6}if((g|0)==6){Dh(a,4,7712)|0}if((Gd(a,1)|0)!=0){Dh(a,1,7544)|0}if((Gd(a,3)|0)==0){Je(a,1,f,3,e);i=b;return 0}Dh(a,3,7544)|0;Je(a,1,f,3,e);i=b;return 0}function Fk(a){a=a|0;var b=0,c=0,e=0,f=0;b=i;i=i+104|0;c=b|0;e=Uh(a,2)|0;Qh(a,1,6);Dd(a,1);Te(a,7904,c)|0;if((e|0)>0){if((e|0)>(d[c+32|0]|0|0)){f=3}}else{f=3}if((f|0)==3){Dh(a,2,7712)|0}de(a,Ie(a,1,e)|0);i=b;return 1}function Gk(a){a=a|0;if((Ed(a,1)|0)==2){Dh(a,1,8096)|0}Qh(a,1,7);if((Ed(a,2)|0)>=1){Qh(a,2,5)}yd(a,2);te(a,1);return 1}function Hk(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((Ed(a,1)|0)==8){b=Td(a,1)|0;c=1}else{b=a;c=0}d=c+1|0;if((Ed(a,d)|0)<1){yd(a,d);e=0;f=0;g=0}else{h=Oh(a,c|2,0)|0;Qh(a,d,6);i=Wh(a,c+3|0,0)|0;c=(Va(h|0,99)|0)!=0|0;j=(Va(h|0,114)|0)==0;k=j?c:c|2;c=(Va(h|0,108)|0)==0;h=c?k:k|4;e=(i|0)>0?h|8:h;f=i;g=42}if((oi(a,-1001e3,10552)|0)!=0){l=ee(b)|0;td(b,a,1);Dd(a,d);qe(a,-3);m=Me(b,g,e,f)|0;return 0}_d(a,10344)|0;pe(a,-2,9824);Dd(a,-1);se(a,-2)|0;l=ee(b)|0;td(b,a,1);Dd(a,d);qe(a,-3);m=Me(b,g,e,f)|0;return 0}function Ik(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=i;i=i+104|0;c=b|0;if((Ed(a,1)|0)==8){d=Td(a,1)|0;e=1}else{d=a;e=0}f=e+1|0;if((Qe(d,Uh(a,f)|0,c)|0)==0){g=Dh(a,f,11560)|0;i=b;return g|0}else{f=e+3|0;Rh(a,f);yd(a,f);td(a,d,1);_d(a,Se(d,c,Uh(a,e|2)|0)|0)|0;g=1;i=b;return g|0}return 0}function Jk(a){a=a|0;var b=0;b=Ed(a,2)|0;if(!((b|0)==5|(b|0)==0)){Dh(a,2,11800)|0}yd(a,2);se(a,1)|0;return 1}function Kk(a){a=a|0;var b=0,c=0,d=0;Rh(a,3);b=Uh(a,2)|0;Qh(a,1,6);c=He(a,1,b)|0;if((c|0)==0){d=0;return d|0}_d(a,c)|0;Ad(a,-1);d=1;return d|0}function Lk(a){a=a|0;var b=0,c=0,d=0,e=0;if((Ed(a,1)|0)==8){b=Td(a,1)|0;c=1}else{b=a;c=0}d=c+1|0;e=Qd(a,d,0)|0;do{if((e|0)==0){if((Ed(a,d)|0)<1){break}Dd(a,d);return 1}}while(0);Ch(a,b,e,Wh(a,c|2,(b|0)==(a|0)|0)|0);return 1}function Mk(a,b){a=a|0;b=b|0;var d=0;oi(a,-1001e3,10552)|0;ee(a)|0;ie(a,-2);if((Ed(a,-1)|0)!=6){return}_d(a,c[1712+(c[b>>2]<<2)>>2]|0)|0;d=c[b+20>>2]|0;if((d|0)>-1){Xd(a,d)}else{Vd(a)}ve(a,2,0,0,0);return}function Nk(a){a=a|0;var b=0,d=0,e=0;ke(a,0,11);ni(a,1616,0);Ih(a,4008)|0;Dd(a,-1);pe(a,-2,3288);ni(a,1736,0);yd(a,-2);b=c[o>>2]|0;d=Fe(a,8)|0;e=d+4|0;c[e>>2]=0;Jh(a,4008);c[d>>2]=b;c[e>>2]=202;Dd(a,-1);pe(a,-1001e3,3464);pe(a,-2,11632);e=c[q>>2]|0;b=Fe(a,8)|0;d=b+4|0;c[d>>2]=0;Jh(a,4008);c[b>>2]=e;c[d>>2]=202;Dd(a,-1);pe(a,-1001e3,7944);pe(a,-2,6296);d=c[p>>2]|0;e=Fe(a,8)|0;b=e+4|0;c[b>>2]=0;Jh(a,4008);c[e>>2]=d;c[b>>2]=202;pe(a,-2,4752);return 1}function Ok(a){a=a|0;var b=0,d=0,e=0;b=i;if((Ed(a,1)|0)==-1){he(a,-1001e3,7944)}if((c[(Lh(a,1,4008)|0)+4>>2]|0)==0){Eh(a,9792,(d=i,i=i+1|0,i=i+7&-8,c[d>>2]=0,d)|0)|0;i=d}d=(Lh(a,1,4008)|0)+4|0;e=c[d>>2]|0;c[d>>2]=0;d=Ac[e&511](a)|0;i=b;return d|0}function Pk(a){a=a|0;var b=0,d=0,e=0;b=i;he(a,-1001e3,7944);d=Sd(a,-1)|0;if((c[d+4>>2]|0)==0){Eh(a,5664,(e=i,i=i+8|0,c[e>>2]=7948,e)|0)|0;i=e}e=Gh(a,(wa(c[d>>2]|0)|0)==0|0,0)|0;i=b;return e|0}function Qk(a){a=a|0;gl(a,3464,5056);return 1}function Rk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;if((Ed(a,1)|0)==-1){Vd(a)}if((Ed(a,1)|0)==0){he(a,-1001e3,3464);Bd(a,1);if((c[(Lh(a,1,4008)|0)+4>>2]|0)!=0){d=0;il(a,d);i=b;return 1}Eh(a,9792,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e;d=0;il(a,d);i=b;return 1}else{f=Oh(a,1,0)|0;g=Fe(a,8)|0;h=g+4|0;c[h>>2]=0;Jh(a,4008);j=g;c[j>>2]=0;c[h>>2]=310;h=xb(f|0,5056)|0;c[j>>2]=h;if((h|0)==0){h=Qb(c[(Pb()|0)>>2]|0)|0;Eh(a,4696,(e=i,i=i+16|0,c[e>>2]=f,c[e+8>>2]=h,e)|0)|0;i=e}Bd(a,1);d=1;il(a,d);i=b;return 1}return 0}function Sk(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=Oh(b,1,0)|0;e=Nh(b,2,5056,0)|0;f=Fe(b,8)|0;g=f+4|0;c[g>>2]=0;Jh(b,4008);h=f;c[h>>2]=0;c[g>>2]=310;g=a[e]|0;do{if(g<<24>>24==0){i=4}else{f=e+1|0;if((Ma(4616,g<<24>>24|0,4)|0)==0){i=4;break}j=(a[f]|0)==43?e+2|0:f;if((a[(a[j]|0)==98?j+1|0:j]|0)!=0){i=4}}}while(0);if((i|0)==4){Dh(b,2,4504)|0}i=xb(d|0,e|0)|0;c[h>>2]=i;if((i|0)!=0){k=1;return k|0}k=Gh(b,0,d)|0;return k|0}function Tk(a){a=a|0;gl(a,7944,4800);return 1}function Uk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=Oh(a,1,0)|0;Nh(a,2,5056,0)|0;e=Fe(a,8)|0;f=e+4|0;c[f>>2]=0;Jh(a,4008);Eh(a,4920,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;c[e>>2]=0;c[f>>2]=348;f=Gh(a,0,d)|0;i=b;return f|0}function Vk(a){a=a|0;var b=0,d=0,e=0;b=i;he(a,-1001e3,3464);d=Sd(a,-1)|0;if((c[d+4>>2]|0)==0){Eh(a,5664,(e=i,i=i+8|0,c[e>>2]=3468,e)|0)|0;i=e}e=kl(a,c[d>>2]|0,1)|0;i=b;return e|0}function Wk(a){a=a|0;var b=0,d=0,e=0,f=0;b=Fe(a,8)|0;d=b+4|0;c[d>>2]=0;Jh(a,4008);e=b;c[e>>2]=0;c[d>>2]=310;d=Oa()|0;c[e>>2]=d;if((d|0)!=0){f=1;return f|0}f=Gh(a,0,0)|0;return f|0}function Xk(a){a=a|0;var b=0;Rh(a,1);b=Kh(a,1,4008)|0;if((b|0)==0){Vd(a);return 1}if((c[b+4>>2]|0)==0){Zd(a,5464,11)|0;return 1}else{Zd(a,5264,4)|0;return 1}return 0}function Yk(a){a=a|0;var b=0,d=0,e=0;b=i;he(a,-1001e3,7944);d=Sd(a,-1)|0;if((c[d+4>>2]|0)==0){Eh(a,5664,(e=i,i=i+8|0,c[e>>2]=7948,e)|0)|0;i=e}e=ll(a,c[d>>2]|0,1)|0;i=b;return e|0}function Zk(a){a=a|0;var b=0,d=0,e=0;b=i;d=Lh(a,1,4008)|0;if((c[d+4>>2]|0)==0){Eh(a,9792,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=Gh(a,(wa(c[d>>2]|0)|0)==0|0,0)|0;i=b;return e|0}function _k(a){a=a|0;var b=0,d=0;b=i;if((c[(Lh(a,1,4008)|0)+4>>2]|0)!=0){il(a,0);i=b;return 1}Eh(a,9792,(d=i,i=i+1|0,i=i+7&-8,c[d>>2]=0,d)|0)|0;i=d;il(a,0);i=b;return 1}function $k(a){a=a|0;var b=0,d=0,e=0;b=i;d=Lh(a,1,4008)|0;if((c[d+4>>2]|0)==0){Eh(a,9792,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=kl(a,c[d>>2]|0,2)|0;i=b;return e|0}function al(a){a=a|0;var b=0,d=0,e=0,f=0.0,g=0,h=0;b=i;d=Lh(a,1,4008)|0;if((c[d+4>>2]|0)==0){Eh(a,9792,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=c[d>>2]|0;d=Mh(a,2,8312,1848)|0;f=+Th(a,3,0.0);g=~~f;if(+(g|0)!=f){Dh(a,3,7872)|0}if((gc(e|0,g|0,c[1864+(d<<2)>>2]|0)|0)==0){Wd(a,+($a(e|0)|0));h=1;i=b;return h|0}else{h=Gh(a,0,0)|0;i=b;return h|0}return 0}function bl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=Lh(a,1,4008)|0;if((c[d+4>>2]|0)==0){Eh(a,9792,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=c[d>>2]|0;d=Mh(a,2,0,1816)|0;f=Wh(a,3,1024)|0;g=Gh(a,(yc(e|0,0,c[1832+(d<<2)>>2]|0,f|0)|0)==0|0,0)|0;i=b;return g|0}function cl(a){a=a|0;var b=0,d=0,e=0;b=i;d=Lh(a,1,4008)|0;if((c[d+4>>2]|0)==0){Eh(a,9792,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}e=c[d>>2]|0;Dd(a,1);d=ll(a,e,2)|0;i=b;return d|0}function dl(a){a=a|0;var b=0,d=0;b=Lh(a,1,4008)|0;if((c[b+4>>2]|0)==0){return 0}if((c[b>>2]|0)==0){return 0}b=(Lh(a,1,4008)|0)+4|0;d=c[b>>2]|0;c[b>>2]=0;Ac[d&511](a)|0;return 0}function el(a){a=a|0;var b=0,d=0;b=i;d=Lh(a,1,4008)|0;if((c[d+4>>2]|0)==0){Zd(a,11544,13)|0;i=b;return 1}else{ae(a,10536,(a=i,i=i+8|0,c[a>>2]=c[d>>2],a)|0)|0;i=a;i=b;return 1}return 0}function fl(a){a=a|0;c[(Lh(a,1,4008)|0)+4>>2]=202;Vd(a);Zd(a,3648,26)|0;return 2}function gl(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;if((Ed(a,1)|0)<1){he(a,-1001e3,b);i=e;return}f=Qd(a,1,0)|0;do{if((f|0)==0){if((c[(Lh(a,1,4008)|0)+4>>2]|0)==0){Eh(a,9792,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}Dd(a,1)}else{h=Fe(a,8)|0;j=h+4|0;c[j>>2]=0;Jh(a,4008);k=h;c[k>>2]=0;c[j>>2]=310;j=xb(f|0,d|0)|0;c[k>>2]=j;if((j|0)!=0){break}j=Qb(c[(Pb()|0)>>2]|0)|0;Eh(a,4696,(g=i,i=i+16|0,c[g>>2]=f,c[g+8>>2]=j,g)|0)|0;i=g}}while(0);pe(a,-1001e3,b);he(a,-1001e3,b);i=e;return}function hl(a){a=a|0;return Gh(a,(ua(c[(Lh(a,1,4008)|0)>>2]|0)|0)==0|0,0)|0}function il(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=xd(a)|0;d=c-1|0;if((c|0)>=19){Dh(a,17,6920)|0}Dd(a,1);Xd(a,d);ce(a,b);if((c|0)>=2){b=1;while(1){e=b+1|0;Dd(a,e);if((b|0)<(d|0)){b=e}else{break}}}be(a,196,c+2|0);return}function jl(a){a=a|0;Lh(a,1,4008)|0;return Hh(a,-1)|0}function kl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+2088|0;g=f|0;j=f+1040|0;k=f+1048|0;l=xd(b)|0;dc(d|0);a:do{if((l|0)==1){m=e+1|0;n=nl(b,d,1)|0}else{Ph(b,l+19|0,7688);o=k+8|0;p=g+8|0;q=e;r=l-2|0;b:while(1){do{if((Ed(b,q)|0)==3){s=Nd(b,q,0)|0;if((s|0)==0){t=Qa(d|0)|0;Tb(t|0,d|0)|0;Zd(b,0,0)|0;u=(t|0)!=-1|0;break}else{bi(b,k);t=Hb(Xh(k,s)|0,1,s|0,d|0)|0;c[o>>2]=(c[o>>2]|0)+t;_h(k);u=(t|0)!=0|0;break}}else{t=Qd(b,q,0)|0;if((t|0)==0){v=10}else{if((a[t]|0)!=42){v=10}}if((v|0)==10){v=0;Dh(b,q,7528)|0}s=a[t+1|0]|0;if((s|0)==108){u=nl(b,d,1)|0;break}else if((s|0)==76){u=nl(b,d,0)|0;break}else if((s|0)==110){t=Ia(d|0,7184,(w=i,i=i+8|0,c[w>>2]=j,w)|0)|0;i=w;if((t|0)!=1){v=14;break b}Wd(b,+h[j>>3]);u=1;break}else if((s|0)==97){bi(b,g);s=Hb(Xh(g,1024)|0,1,1024,d|0)|0;c[p>>2]=(c[p>>2]|0)+s;if(s>>>0>=1024>>>0){s=1024;do{s=s<<(s>>>0<1073741824>>>0);t=Hb(Xh(g,s)|0,1,s|0,d|0)|0;c[p>>2]=(c[p>>2]|0)+t;}while(t>>>0>=s>>>0)}_h(g);u=1;break}else{break b}}}while(0);s=q+1|0;if((r|0)!=0&(u|0)!=0){q=s;r=r-1|0}else{m=s;n=u;break a}}if((v|0)==14){Vd(b);m=q+1|0;n=0;break}x=Dh(b,q,7376)|0;i=f;return x|0}}while(0);if((gb(d|0)|0)!=0){x=Gh(b,0,0)|0;i=f;return x|0}if((n|0)==0){yd(b,-2);Vd(b)}x=m-e|0;i=f;return x|0}function ll(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0;e=i;i=i+8|0;f=e|0;g=xd(a)|0;if((g|0)==(d|0)){j=1;i=e;return j|0}k=d;l=1;m=g-d|0;while(1){d=m-1|0;do{if((Ed(a,k)|0)==3){if((l|0)==0){n=0;break}o=+Md(a,k,0);g=Yb(b|0,10336,(p=i,i=i+8|0,h[p>>3]=o,p)|0)|0;i=p;n=(g|0)>0|0}else{g=Oh(a,k,f)|0;if((l|0)==0){n=0;break}p=ya(g|0,1,c[f>>2]|0,b|0)|0;n=(p|0)==(c[f>>2]|0)|0}}while(0);if((d|0)==0){break}else{k=k+1|0;l=n;m=d}}if((n|0)!=0){j=1;i=e;return j|0}j=Gh(a,0,0)|0;i=e;return j|0}function ml(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=Sd(a,-1001001)|0;e=Nd(a,-1001002,0)|0;if((c[d+4>>2]|0)==0){f=Eh(a,6736,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;h=f;i=b;return h|0}yd(a,1);if((e|0)>=1){f=1;while(1){Dd(a,-1001003-f|0);if((f|0)<(e|0)){f=f+1|0}else{break}}}f=kl(a,c[d>>2]|0,2)|0;if((Ed(a,-f|0)|0)!=0){h=f;i=b;return h|0}if((f|0)>1){d=Qd(a,1-f|0,0)|0;f=Eh(a,6584,(g=i,i=i+8|0,c[g>>2]=d,g)|0)|0;i=g;h=f;i=b;return h|0}if((Pd(a,-1001003)|0)==0){h=0;i=b;return h|0}yd(a,0);Dd(a,-1001001);f=(Lh(a,1,4008)|0)+4|0;g=c[f>>2]|0;c[f>>2]=0;Ac[g&511](a)|0;h=0;i=b;return h|0}function nl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+1040|0;g=f|0;bi(b,g);h=Xh(g,1024)|0;a:do{if((Ta(h|0,1024,d|0)|0)!=0){j=g+8|0;k=h;while(1){l=jn(k|0)|0;if((l|0)!=0){if((a[k+(l-1)|0]|0)==10){break}}c[j>>2]=(c[j>>2]|0)+l;k=Xh(g,1024)|0;if((Ta(k|0,1024,d|0)|0)==0){break a}}c[j>>2]=l-e+(c[j>>2]|0);_h(g);m=1;i=f;return m|0}}while(0);_h(g);m=(Rd(b,-1)|0)!=0|0;i=f;return m|0}function ol(a){a=a|0;ke(a,0,28);ni(a,424,0);Wd(a,3.141592653589793);pe(a,-2,3280);Wd(a,s);pe(a,-2,11536);return 1}function pl(a){a=a|0;Wd(a,+R(+(+Sh(a,1))));return 1}function ql(a){a=a|0;Wd(a,+X(+Sh(a,1)));return 1}function rl(a){a=a|0;Wd(a,+Y(+Sh(a,1)));return 1}function sl(a){a=a|0;var b=0.0;b=+Sh(a,1);Wd(a,+_(+b,+(+Sh(a,2))));return 1}function tl(a){a=a|0;Wd(a,+Z(+Sh(a,1)));return 1}function ul(a){a=a|0;Wd(a,+ba(+Sh(a,1)));return 1}function vl(a){a=a|0;Wd(a,+Ra(+(+Sh(a,1))));return 1}function wl(a){a=a|0;Wd(a,+U(+Sh(a,1)));return 1}function xl(a){a=a|0;Wd(a,+Sh(a,1)/.017453292519943295);return 1}function yl(a){a=a|0;Wd(a,+$(+Sh(a,1)));return 1}function zl(a){a=a|0;Wd(a,+Q(+Sh(a,1)));return 1}function Al(a){a=a|0;var b=0.0;b=+Sh(a,1);Wd(a,+db(+b,+(+Sh(a,2))));return 1}function Bl(a){a=a|0;var b=0,d=0;b=i;i=i+8|0;d=b|0;Wd(a,+zb(+(+Sh(a,1)),d|0));Xd(a,c[d>>2]|0);i=b;return 2}function Cl(a){a=a|0;var b=0.0;b=+Sh(a,1);Wd(a,+Vm(b,Uh(a,2)|0));return 1}function Dl(a){a=a|0;Wd(a,+Gb(+(+Sh(a,1))));return 1}function El(a){a=a|0;var b=0.0,c=0.0,d=0.0;b=+Sh(a,1);do{if((Ed(a,2)|0)<1){c=+aa(b)}else{d=+Sh(a,2);if(d==10.0){c=+Gb(+b);break}else{c=+aa(b)/+aa(d);break}}}while(0);Wd(a,c);return 1}function Fl(a){a=a|0;var b=0,c=0.0,d=0.0,e=0,f=0.0,g=0.0;b=xd(a)|0;c=+Sh(a,1);if((b|0)<2){d=c}else{e=2;f=c;while(1){c=+Sh(a,e);g=c>f?c:f;if((e|0)<(b|0)){e=e+1|0;f=g}else{d=g;break}}}Wd(a,d);return 1}function Gl(a){a=a|0;var b=0,c=0.0,d=0.0,e=0,f=0.0,g=0.0;b=xd(a)|0;c=+Sh(a,1);if((b|0)<2){d=c}else{e=2;f=c;while(1){c=+Sh(a,e);g=c<f?c:f;if((e|0)<(b|0)){e=e+1|0;f=g}else{d=g;break}}}Wd(a,d);return 1}function Hl(a){a=a|0;var b=0,c=0,d=0.0;b=i;i=i+8|0;c=b|0;d=+Ka(+(+Sh(a,1)),c|0);Wd(a,+h[c>>3]);Wd(a,d);i=b;return 2}function Il(a){a=a|0;var b=0.0;b=+Sh(a,1);Wd(a,+T(+b,+(+Sh(a,2))));return 1}function Jl(a){a=a|0;Wd(a,+Sh(a,1)*.017453292519943295);return 1}function Kl(a){a=a|0;var b=0,d=0.0,e=0,f=0.0,g=0,h=0.0;b=i;d=+((sa()|0)%2147483647|0|0)/2147483647.0;e=xd(a)|0;if((e|0)==1){f=+Sh(a,1);if(f<1.0){Dh(a,1,7352)|0}Wd(a,+Q(d*f)+1.0);g=1;i=b;return g|0}else if((e|0)==0){Wd(a,d);g=1;i=b;return g|0}else if((e|0)==2){f=+Sh(a,1);h=+Sh(a,2);if(f>h){Dh(a,2,7352)|0}Wd(a,f+ +Q(d*(h-f+1.0)));g=1;i=b;return g|0}else{e=Eh(a,7152,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;g=e;i=b;return g|0}return 0}function Ll(a){a=a|0;Wb(Vh(a,1)|0);sa()|0;return 0}function Ml(a){a=a|0;Wd(a,+kb(+(+Sh(a,1))));return 1}function Nl(a){a=a|0;Wd(a,+V(+Sh(a,1)));return 1}function Ol(a){a=a|0;Wd(a,+S(+Sh(a,1)));return 1}function Pl(a){a=a|0;Wd(a,+Nb(+(+Sh(a,1))));return 1}function Ql(a){a=a|0;Wd(a,+W(+Sh(a,1)));return 1}function Rl(a){a=a|0;ke(a,0,11);ni(a,88,0);return 1}function Sl(a){a=a|0;Wd(a,+(Xa()|0)/1.0e6);return 1}function Tl(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+1256|0;e=d|0;f=d+8|0;g=d+16|0;h=d+1056|0;j=Nh(b,1,8296,0)|0;if((Ed(b,2)|0)<1){k=xc(0)|0}else{k=~~+Sh(b,2)}c[e>>2]=k;if((a[j]|0)==33){l=j+1|0;m=ib(e|0)|0}else{l=j;m=Da(e|0)|0}if((m|0)==0){Vd(b);i=d;return 1}if((La(l|0,8064)|0)==0){ke(b,0,9);Xd(b,c[m>>2]|0);pe(b,-2,12784);Xd(b,c[m+4>>2]|0);pe(b,-2,12488);Xd(b,c[m+8>>2]|0);pe(b,-2,12176);Xd(b,c[m+12>>2]|0);pe(b,-2,12e3);Xd(b,(c[m+16>>2]|0)+1|0);pe(b,-2,11752);Xd(b,(c[m+20>>2]|0)+1900|0);pe(b,-2,11520);Xd(b,(c[m+24>>2]|0)+1|0);pe(b,-2,7848);Xd(b,(c[m+28>>2]|0)+1|0);pe(b,-2,7672);e=c[m+32>>2]|0;if((e|0)<0){i=d;return 1}ce(b,e);pe(b,-2,10520);i=d;return 1}e=f|0;a[e]=37;bi(b,g);j=g+8|0;k=g+4|0;n=g|0;o=f+1|0;p=h|0;h=f+2|0;f=l;while(1){l=a[f]|0;if((l<<24>>24|0)==0){break}else if((l<<24>>24|0)!=37){q=c[j>>2]|0;if(q>>>0<(c[k>>2]|0)>>>0){r=l;s=q}else{Xh(g,1)|0;r=a[f]|0;s=c[j>>2]|0}c[j>>2]=s+1;a[(c[n>>2]|0)+s|0]=r;f=f+1|0;continue}q=f+1|0;l=f+2|0;t=a[q]|0;do{if(t<<24>>24==0){u=20}else{if((Ma(7496,t<<24>>24|0,23)|0)==0){u=20;break}a[o]=t;a[h]=0;v=l}}while(0);if((u|0)==20){u=0;l=ae(b,7112,(t=i,i=i+8|0,c[t>>2]=q,t)|0)|0;i=t;Dh(b,1,l)|0;v=q}Yh(g,p,rb(p|0,200,e|0,m|0)|0);f=v}_h(g);i=d;return 1}function Ul(a){a=a|0;var b=0;b=~~+Sh(a,1);Wd(a,+sc(b|0,~~+Th(a,2,0.0)|0));return 1}function Vl(a){a=a|0;var b=0,c=0,d=0;b=Nh(a,1,0,0)|0;c=Db(b|0)|0;if((b|0)==0){ce(a,c);d=1;return d|0}else{d=Hh(a,c)|0;return d|0}return 0}function Wl(a){a=a|0;var b=0;if((Ed(a,1)|0)==1){b=(Pd(a,1)|0)==0|0}else{b=Wh(a,1,0)|0}if((Pd(a,2)|0)!=0){Kg(a)}if((a|0)==0){return 0}else{ab(b|0);return 0}return 0}function Xl(a){a=a|0;_d(a,Kb(Oh(a,1,0)|0)|0)|0;return 1}function Yl(a){a=a|0;var b=0;b=Oh(a,1,0)|0;return Gh(a,(Ja(b|0)|0)==0|0,b)|0}function Zl(a){a=a|0;var b=0;b=Oh(a,1,0)|0;return Gh(a,(Ub(b|0,Oh(a,2,0)|0)|0)==0|0,0)|0}function _l(a){a=a|0;var b=0;b=Nh(a,1,0,0)|0;_d(a,ub(c[400+((Mh(a,2,9776,368)|0)<<2)>>2]|0,b|0)|0)|0;return 1}function $l(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+96|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;h=b+32|0;j=b+40|0;k=b+48|0;if((Ed(a,1)|0)<1){l=xc(0)|0}else{Qh(a,1,5);yd(a,1);he(a,-1,12784);m=Nd(a,-1,j)|0;n=(c[j>>2]|0)==0?0:m;yd(a,-2);c[k>>2]=n;he(a,-1,12488);n=Nd(a,-1,h)|0;m=(c[h>>2]|0)==0?0:n;yd(a,-2);c[k+4>>2]=m;he(a,-1,12176);m=Nd(a,-1,g)|0;n=(c[g>>2]|0)==0?12:m;yd(a,-2);c[k+8>>2]=n;he(a,-1,12e3);n=Nd(a,-1,f)|0;if((c[f>>2]|0)==0){f=Eh(a,10288,(o=i,i=i+8|0,c[o>>2]=12e3,o)|0)|0;i=o;p=f}else{yd(a,-2);p=n}c[k+12>>2]=p;he(a,-1,11752);p=Nd(a,-1,e)|0;if((c[e>>2]|0)==0){e=Eh(a,10288,(o=i,i=i+8|0,c[o>>2]=11752,o)|0)|0;i=o;q=e}else{yd(a,-2);q=p}c[k+16>>2]=q-1;he(a,-1,11520);q=Nd(a,-1,d)|0;if((c[d>>2]|0)==0){d=Eh(a,10288,(o=i,i=i+8|0,c[o>>2]=11520,o)|0)|0;i=o;r=d}else{yd(a,-2);r=q}c[k+20>>2]=r-1900;he(a,-1,10520);if((Ed(a,-1)|0)==0){s=-1}else{s=Pd(a,-1)|0}yd(a,-2);c[k+32>>2]=s;l=Aa(k|0)|0}if((l|0)==-1){Vd(a);i=b;return 1}else{Wd(a,+(l|0));i=b;return 1}return 0}function am(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+24|0;d=b|0;if((Ba(d|0)|0)==0){e=Eh(a,13112,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f;g=e;i=b;return g|0}else{_d(a,d)|0;g=1;i=b;return g|0}return 0}function bm(a){a=a|0;ke(a,0,14);ni(a,184,0);ke(a,0,1);Zd(a,13784,0)|0;Dd(a,-2);se(a,-2)|0;yd(a,-2);Dd(a,-2);pe(a,-2,10632);yd(a,-2);return 1}function cm(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+8|0;e=b|0;f=Oh(a,1,e)|0;g=Wh(a,2,1)|0;h=c[e>>2]|0;do{if((g|0)>-1){j=g}else{if(h>>>0<(-g|0)>>>0){j=0;break}j=g+1+h|0}}while(0);h=Wh(a,3,j)|0;g=c[e>>2]|0;do{if((h|0)>-1){k=h}else{if(g>>>0<(-h|0)>>>0){k=0;break}k=h+1+g|0}}while(0);h=(j|0)==0?1:j;j=k>>>0>g>>>0?g:k;if(j>>>0<h>>>0){l=0;i=b;return l|0}k=j-h+1|0;if((j|0)==-1){j=Eh(a,5232,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;l=j;i=b;return l|0}Ph(a,k,5232);if((k|0)<=0){l=k;i=b;return l|0}j=h-1|0;h=0;while(1){Xd(a,d[f+(j+h)|0]|0);g=h+1|0;if((g|0)<(k|0)){h=g}else{l=k;break}}i=b;return l|0}function dm(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;c=i;i=i+1040|0;d=c|0;e=xd(b)|0;f=ci(b,d,e)|0;if((e|0)<1){$h(d,e);i=c;return 1}else{g=1}while(1){h=Uh(b,g)|0;if((h&255|0)!=(h|0)){Dh(b,g,5440)|0}a[f+(g-1)|0]=h;if((g|0)<(e|0)){g=g+1|0}else{break}}$h(d,e);i=c;return 1}function em(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+1040|0;d=b|0;Qh(a,1,6);yd(a,1);bi(a,d);if((ye(a,34,d)|0)==0){_h(d);e=1;i=b;return e|0}else{d=Eh(a,5632,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;e=d;i=b;return e|0}return 0}function fm(a){a=a|0;return rm(a,1)|0}function gm(b){b=b|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0.0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0.0,aa=0,ba=0;e=i;i=i+1104|0;f=e|0;g=e+24|0;j=e+32|0;k=e+1072|0;l=e+1096|0;m=xd(b)|0;n=Oh(b,1,g)|0;o=c[g>>2]|0;g=n+o|0;bi(b,j);a:do{if((o|0)>0){p=j+8|0;q=j+4|0;r=j|0;s=k|0;t=k+1|0;u=e+8|0;v=n;w=1;b:while(1){x=v;while(1){z=a[x]|0;if(z<<24>>24==37){A=x+1|0;if((a[A]|0)!=37){break}B=c[p>>2]|0;if(B>>>0<(c[q>>2]|0)>>>0){C=37;D=B}else{Xh(j,1)|0;C=a[A]|0;D=c[p>>2]|0}c[p>>2]=D+1;a[(c[r>>2]|0)+D|0]=C;E=x+2|0}else{B=c[p>>2]|0;if(B>>>0<(c[q>>2]|0)>>>0){F=z;G=B}else{Xh(j,1)|0;F=a[x]|0;G=c[p>>2]|0}c[p>>2]=G+1;a[(c[r>>2]|0)+G|0]=F;E=x+1|0}if(E>>>0<g>>>0){x=E}else{break a}}x=Xh(j,512)|0;B=w+1|0;if((w|0)>=(m|0)){Dh(b,B,7096)|0}z=a[A]|0;c:do{if(z<<24>>24==0){H=A;I=0}else{J=A;K=z;while(1){L=J+1|0;if((Ma(6128,K<<24>>24|0,6)|0)==0){H=J;I=K;break c}M=a[L]|0;if(M<<24>>24==0){H=L;I=0;break}else{J=L;K=M}}}}while(0);z=A;if((H-z|0)>>>0>5>>>0){Eh(b,5936,(N=i,i=i+1|0,i=i+7&-8,c[N>>2]=0,N)|0)|0;i=N;O=a[H]|0}else{O=I}K=((O&255)-48|0)>>>0<10>>>0?H+1|0:H;J=((d[K]|0)-48|0)>>>0<10>>>0?K+1|0:K;K=a[J]|0;if(K<<24>>24==46){M=J+1|0;L=((d[M]|0)-48|0)>>>0<10>>>0?J+2|0:M;M=((d[L]|0)-48|0)>>>0<10>>>0?L+1|0:L;P=M;Q=a[M]|0}else{P=J;Q=K}if(((Q&255)-48|0)>>>0<10>>>0){Eh(b,5792,(N=i,i=i+1|0,i=i+7&-8,c[N>>2]=0,N)|0)|0;i=N}a[s]=37;K=P-z|0;nn(t|0,A|0,K+1|0)|0;a[k+(K+2)|0]=0;K=P+1|0;R=a[P]|0;d:do{switch(R|0){case 101:case 69:case 102:case 103:case 71:{a[k+(jn(s|0)|0)|0]=0;S=+Sh(b,B);z=bb(x|0,s|0,(N=i,i=i+8|0,h[N>>3]=S,N)|0)|0;i=N;T=z;break};case 113:{z=Oh(b,B,f)|0;J=c[p>>2]|0;if(J>>>0<(c[q>>2]|0)>>>0){U=J}else{Xh(j,1)|0;U=c[p>>2]|0}c[p>>2]=U+1;a[(c[r>>2]|0)+U|0]=34;J=c[f>>2]|0;c[f>>2]=J-1;if((J|0)!=0){J=z;while(1){z=a[J]|0;do{if((z<<24>>24|0)==34|(z<<24>>24|0)==92|(z<<24>>24|0)==10){M=c[p>>2]|0;if(M>>>0<(c[q>>2]|0)>>>0){V=M}else{Xh(j,1)|0;V=c[p>>2]|0}c[p>>2]=V+1;a[(c[r>>2]|0)+V|0]=92;M=c[p>>2]|0;if(M>>>0<(c[q>>2]|0)>>>0){W=M}else{Xh(j,1)|0;W=c[p>>2]|0}M=a[J]|0;c[p>>2]=W+1;a[(c[r>>2]|0)+W|0]=M}else if((z<<24>>24|0)==0){X=0;Y=44}else{if((tc(z&255|0)|0)!=0){X=d[J]|0;Y=44;break}M=c[p>>2]|0;if(M>>>0<(c[q>>2]|0)>>>0){Z=M}else{Xh(j,1)|0;Z=c[p>>2]|0}M=a[J]|0;c[p>>2]=Z+1;a[(c[r>>2]|0)+Z|0]=M}}while(0);if((Y|0)==44){Y=0;if(((d[J+1|0]|0)-48|0)>>>0<10>>>0){bb(u|0,6240,(N=i,i=i+8|0,c[N>>2]=X,N)|0)|0;i=N}else{bb(u|0,6304,(N=i,i=i+8|0,c[N>>2]=X,N)|0)|0;i=N}Zh(j,u)}z=c[f>>2]|0;c[f>>2]=z-1;if((z|0)==0){break}else{J=J+1|0}}}J=c[p>>2]|0;if(J>>>0<(c[q>>2]|0)>>>0){_=J}else{Xh(j,1)|0;_=c[p>>2]|0}c[p>>2]=_+1;a[(c[r>>2]|0)+_|0]=34;T=0;break};case 99:{J=Uh(b,B)|0;z=bb(x|0,s|0,(N=i,i=i+8|0,c[N>>2]=J,N)|0)|0;i=N;T=z;break};case 100:case 105:{S=+Sh(b,B);z=~~S;$=S- +(z|0);if(!($>-1.0&$<1.0)){Dh(b,B,6888)|0}J=jn(s|0)|0;M=k+(J-1)|0;L=a[M]|0;aa=M;y=108;a[aa]=y;y=y>>8;a[aa+1|0]=y;a[k+J|0]=L;a[k+(J+1)|0]=0;J=bb(x|0,s|0,(N=i,i=i+8|0,c[N>>2]=z,N)|0)|0;i=N;T=J;break};case 111:case 117:case 120:case 88:{$=+Sh(b,B);J=~~$;S=$- +(J>>>0>>>0);if(!(S>-1.0&S<1.0)){Dh(b,B,6536)|0}z=jn(s|0)|0;L=k+(z-1)|0;aa=a[L]|0;M=L;y=108;a[M]=y;y=y>>8;a[M+1|0]=y;a[k+z|0]=aa;a[k+(z+1)|0]=0;z=bb(x|0,s|0,(N=i,i=i+8|0,c[N>>2]=J,N)|0)|0;i=N;T=z;break};case 115:{z=ki(b,B,l)|0;J=(Va(s|0,46)|0)==0;if(J&(c[l>>2]|0)>>>0>99>>>0){ai(j);T=0;break d}else{J=bb(x|0,s|0,(N=i,i=i+8|0,c[N>>2]=z,N)|0)|0;i=N;yd(b,-2);T=J;break d}break};default:{break b}}}while(0);c[p>>2]=(c[p>>2]|0)+T;if(K>>>0<g>>>0){v=K;w=B}else{break a}}w=Eh(b,6384,(N=i,i=i+8|0,c[N>>2]=R,N)|0)|0;i=N;ba=w;i=e;return ba|0}}while(0);_h(j);ba=1;i=e;return ba|0}function hm(a){a=a|0;Oh(a,1,0)|0;Oh(a,2,0)|0;yd(a,2);Xd(a,0);be(a,212,3);return 1}function im(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;d=i;i=i+1344|0;e=d|0;f=d+8|0;g=d+16|0;h=d+24|0;j=d+304|0;k=Oh(b,1,f)|0;l=Oh(b,2,g)|0;m=Ed(b,3)|0;n=Wh(b,4,(c[f>>2]|0)+1|0)|0;o=(a[l]|0)==94;if((m-3|0)>>>0>=4>>>0){Dh(b,3,7640)|0}bi(b,j);if(o){p=(c[g>>2]|0)-1|0;c[g>>2]=p;q=l+1|0;r=p}else{q=l;r=c[g>>2]|0}g=h+16|0;c[g>>2]=b;c[h>>2]=200;l=h+4|0;c[l>>2]=k;p=h+8|0;c[p>>2]=k+(c[f>>2]|0);c[h+12>>2]=q+r;r=h+20|0;f=j+8|0;s=j+4|0;t=j|0;u=h+28|0;v=h+24|0;w=k;k=0;while(1){if(k>>>0>=n>>>0){x=w;y=k;z=48;break}c[r>>2]=0;A=tm(h,w,q)|0;if((A|0)==0){B=k;z=43}else{C=k+1|0;D=c[g>>2]|0;do{if((m|0)==6){Dd(D,3);E=c[r>>2]|0;F=(E|0)==0&(w|0)!=0?1:E;Ph(c[g>>2]|0,F,11496);if((F|0)>0){E=0;do{um(h,E,w,A);E=E+1|0;}while((E|0)<(F|0))}ve(D,F,1,0,0);z=37}else if((m|0)==5){a:do{if((c[r>>2]|0)>0){E=c[u>>2]|0;do{if((E|0)==-1){Eh(D,10264,(G=i,i=i+1|0,i=i+7&-8,c[G>>2]=0,G)|0)|0;i=G;H=c[g>>2]|0;I=c[v>>2]|0}else{J=c[v>>2]|0;if((E|0)!=-2){H=D;I=J;break}Xd(D,J+1-(c[l>>2]|0)|0);break a}}while(0);Zd(H,I,E)|0}else{Zd(D,w,A-w|0)|0}}while(0);ge(D,3);z=37}else{F=Qd(D,3,e)|0;if((c[e>>2]|0)==0){break}J=A-w|0;K=0;do{L=F+K|0;M=a[L]|0;do{if(M<<24>>24==37){N=K+1|0;O=F+N|0;P=a[O]|0;Q=P<<24>>24;if(((P&255)-48|0)>>>0<10>>>0){if(P<<24>>24==48){Yh(j,w,J);R=N;break}else{um(h,Q-49|0,w,A);ai(j);R=N;break}}if(P<<24>>24!=37){Eh(c[g>>2]|0,7304,(G=i,i=i+8|0,c[G>>2]=37,G)|0)|0;i=G}P=c[f>>2]|0;if(P>>>0<(c[s>>2]|0)>>>0){S=P}else{Xh(j,1)|0;S=c[f>>2]|0}P=a[O]|0;c[f>>2]=S+1;a[(c[t>>2]|0)+S|0]=P;R=N}else{N=c[f>>2]|0;if(N>>>0<(c[s>>2]|0)>>>0){T=M;U=N}else{Xh(j,1)|0;T=a[L]|0;U=c[f>>2]|0}c[f>>2]=U+1;a[(c[t>>2]|0)+U|0]=T;R=K}}while(0);K=R+1|0;}while(K>>>0<(c[e>>2]|0)>>>0)}}while(0);if((z|0)==37){z=0;do{if((Pd(D,-1)|0)==0){yd(D,-2);Zd(D,w,A-w|0)|0}else{if((Id(D,-1)|0)!=0){break}K=Fd(D,Ed(D,-1)|0)|0;Eh(D,7456,(G=i,i=i+8|0,c[G>>2]=K,G)|0)|0;i=G}}while(0);ai(j)}if(A>>>0>w>>>0){V=A;W=C}else{B=C;z=43}}if((z|0)==43){z=0;if(w>>>0>=(c[p>>2]|0)>>>0){x=w;y=B;z=48;break}D=c[f>>2]|0;if(D>>>0<(c[s>>2]|0)>>>0){X=D}else{Xh(j,1)|0;X=c[f>>2]|0}D=a[w]|0;c[f>>2]=X+1;a[(c[t>>2]|0)+X|0]=D;V=w+1|0;W=B}if(o){x=V;y=W;z=48;break}else{w=V;k=W}}if((z|0)==48){Yh(j,x,(c[p>>2]|0)-x|0);_h(j);Xd(b,y);i=d;return 2}return 0}function jm(a){a=a|0;var b=0,d=0;b=i;i=i+8|0;d=b|0;Oh(a,1,d)|0;Xd(a,c[d>>2]|0);i=b;return 1}function km(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+1048|0;f=e|0;g=e+8|0;h=Oh(b,1,f)|0;j=ci(b,g,c[f>>2]|0)|0;if((c[f>>2]|0)==0){k=0;$h(g,k);i=e;return 1}else{l=0}while(1){a[j+l|0]=pn(d[h+l|0]|0|0)|0;b=l+1|0;m=c[f>>2]|0;if(b>>>0<m>>>0){l=b}else{k=m;break}}$h(g,k);i=e;return 1}function lm(a){a=a|0;return rm(a,0)|0}function mm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;b=i;i=i+1056|0;d=b|0;e=b+8|0;f=b+16|0;g=Oh(a,1,d)|0;h=Uh(a,2)|0;j=Nh(a,3,13784,e)|0;if((h|0)<1){Zd(a,13784,0)|0;k=1;i=b;return k|0}l=c[d>>2]|0;m=c[e>>2]|0;n=hb(l|0,m|0)|0;do{if(!G){if(n>>>0>=(2147483647/(h>>>0)|0)>>>0){break}o=(ca(m,h-1|0)|0)+(ca(l,h)|0)|0;p=ci(a,f,o)|0;nn(p|0,g|0,c[d>>2]|0)|0;if((h|0)>1){q=p;p=h;while(1){r=p-1|0;s=c[d>>2]|0;t=q+s|0;u=c[e>>2]|0;if((u|0)==0){v=t;w=s}else{nn(t|0,j|0,u)|0;v=q+((c[e>>2]|0)+s)|0;w=c[d>>2]|0}nn(v|0,g|0,w)|0;if((r|0)>1){q=v;p=r}else{break}}}$h(f,o);k=1;i=b;return k|0}}while(0);f=Eh(a,11720,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;k=f;i=b;return k|0}function nm(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+1048|0;e=d|0;f=d+8|0;g=Oh(b,1,e)|0;h=ci(b,f,c[e>>2]|0)|0;b=c[e>>2]|0;if((b|0)==0){j=0;$h(f,j);i=d;return 1}else{k=0;l=b}while(1){a[h+k|0]=a[g+(l+~k)|0]|0;b=k+1|0;m=c[e>>2]|0;if(m>>>0>b>>>0){k=b;l=m}else{j=m;break}}$h(f,j);i=d;return 1}function om(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+8|0;d=b|0;e=Oh(a,1,d)|0;f=Uh(a,2)|0;g=c[d>>2]|0;do{if((f|0)>-1){h=f}else{if(g>>>0<(-f|0)>>>0){h=0;break}h=f+1+g|0}}while(0);g=Wh(a,3,-1)|0;f=c[d>>2]|0;do{if((g|0)>-1){j=g}else{if(f>>>0<(-g|0)>>>0){j=0;break}j=g+1+f|0}}while(0);g=(h|0)==0?1:h;h=j>>>0>f>>>0?f:j;if(h>>>0<g>>>0){Zd(a,13784,0)|0;i=b;return 1}else{Zd(a,e+(g-1)|0,1-g+h|0)|0;i=b;return 1}return 0}function pm(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+1048|0;f=e|0;g=e+8|0;h=Oh(b,1,f)|0;j=ci(b,g,c[f>>2]|0)|0;if((c[f>>2]|0)==0){k=0;$h(g,k);i=e;return 1}else{l=0}while(1){a[j+l|0]=vb(d[h+l|0]|0|0)|0;b=l+1|0;m=c[f>>2]|0;if(b>>>0<m>>>0){l=b}else{k=m;break}}$h(g,k);i=e;return 1}function qm(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;Yh(d,b,c);return 0}function rm(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=i;i=i+296|0;f=e|0;g=e+8|0;h=e+16|0;j=Oh(b,1,f)|0;k=Oh(b,2,g)|0;l=Wh(b,3,1)|0;m=c[f>>2]|0;do{if((l|0)>-1){n=l;o=4}else{if(m>>>0<(-l|0)>>>0){p=1;break}n=l+1+m|0;o=4}}while(0);do{if((o|0)==4){if((n|0)==0){p=1;break}if(n>>>0<=(m+1|0)>>>0){p=n;break}Vd(b);q=1;i=e;return q|0}}while(0);n=(d|0)!=0;a:do{if(n){d=(Pd(b,4)|0)==0;m=c[g>>2]|0;if(d){d=0;do{l=k+d|0;if((mc(l|0,7832)|0)!=0){o=20;break a}d=d+1+(jn(l|0)|0)|0;}while(d>>>0<=m>>>0)}d=j+(p-1)|0;l=(c[f>>2]|0)-p+1|0;b:do{if((m|0)==0){if((d|0)==0){break a}else{r=d}}else{if(m>>>0>l>>>0){break a}s=m-1|0;if((l|0)==(s|0)){break a}t=a[k]|0;u=k+1|0;v=d;w=l-s|0;while(1){x=Ma(v|0,t|0,w|0)|0;if((x|0)==0){break a}y=x+1|0;if((on(y|0,u|0,s|0)|0)==0){r=x;break b}x=y;z=v+w|0;if((z|0)==(x|0)){break a}else{v=y;w=z-x|0}}}}while(0);l=r-j|0;Xd(b,l+1|0);Xd(b,l+(c[g>>2]|0)|0);q=2;i=e;return q|0}else{o=20}}while(0);c:do{if((o|0)==20){r=j+(p-1)|0;l=(a[k]|0)==94;if(l){d=(c[g>>2]|0)-1|0;c[g>>2]=d;A=k+1|0;B=d}else{A=k;B=c[g>>2]|0}d=h+16|0;c[d>>2]=b;c[h>>2]=200;c[h+4>>2]=j;m=h+8|0;c[m>>2]=j+(c[f>>2]|0);c[h+12>>2]=A+B;w=h+20|0;d:do{if(l){c[w>>2]=0;v=tm(h,r,A)|0;if((v|0)==0){break c}else{C=r;D=v}}else{v=r;while(1){c[w>>2]=0;s=tm(h,v,A)|0;if((s|0)!=0){C=v;D=s;break d}if(v>>>0>=(c[m>>2]|0)>>>0){break c}v=v+1|0}}}while(0);if(n){m=j;Xd(b,1-m+C|0);Xd(b,D-m|0);m=c[w>>2]|0;Ph(c[d>>2]|0,m,11496);if((m|0)>0){r=0;do{um(h,r,0,0);r=r+1|0;}while((r|0)<(m|0))}q=m+2|0;i=e;return q|0}else{r=c[w>>2]|0;l=(r|0)==0&(C|0)!=0?1:r;Ph(c[d>>2]|0,l,11496);if((l|0)>0){E=0}else{q=l;i=e;return q|0}while(1){um(h,E,C,D);r=E+1|0;if((r|0)<(l|0)){E=r}else{q=l;break}}i=e;return q|0}}}while(0);Vd(b);q=1;i=e;return q|0}function sm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=i;i=i+296|0;d=b|0;e=b+280|0;f=b+288|0;g=Qd(a,-1001001,e)|0;h=Qd(a,-1001002,f)|0;j=d+16|0;c[j>>2]=a;c[d>>2]=200;c[d+4>>2]=g;k=c[e>>2]|0;e=d+8|0;c[e>>2]=g+k;c[d+12>>2]=h+(c[f>>2]|0);f=Nd(a,-1001003,0)|0;if((f|0)>(k|0)){l=0;i=b;return l|0}k=d+20|0;m=g+f|0;while(1){c[k>>2]=0;n=tm(d,m,h)|0;f=m+1|0;if((n|0)!=0){break}if(f>>>0>(c[e>>2]|0)>>>0){l=0;o=7;break}else{m=f}}if((o|0)==7){i=b;return l|0}Xd(a,n-g+((n|0)==(m|0))|0);Bd(a,-1001003);a=c[k>>2]|0;k=(a|0)==0&(m|0)!=0?1:a;Ph(c[j>>2]|0,k,11496);if((k|0)>0){p=0}else{l=k;i=b;return l|0}while(1){um(d,p,m,n);j=p+1|0;if((j|0)<(k|0)){p=j}else{l=k;break}}i=b;return l|0}function tm(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0;g=i;h=b|0;j=c[h>>2]|0;c[h>>2]=j-1;if((j|0)==0){Eh(c[b+16>>2]|0,9752,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}j=b+12|0;l=c[j>>2]|0;a:do{if((l|0)==(f|0)){m=e}else{n=b+8|0;o=b+16|0;p=b+4|0;q=b+20|0;r=f;s=e;t=l;b:while(1){u=s+1|0;v=s-1|0;w=r;x=t;c:while(1){y=a[w]|0;z=y<<24>>24;d:do{if((z|0)==36){A=w+1|0;if((A|0)==(x|0)){B=23;break b}else{C=A;D=A;B=89}}else if((z|0)==40){B=7;break b}else if((z|0)==37){A=w+1|0;E=a[A]|0;switch(E<<24>>24|0){case 102:{break};case 98:{B=25;break c;break};case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:{B=69;break c;break};default:{if((A|0)==(x|0)){Eh(c[o>>2]|0,8720,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}C=w+2|0;D=A;B=89;break d}}A=w+2|0;do{if((a[A]|0)==91){F=w+3|0;B=40}else{Eh(c[o>>2]|0,9424,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k;G=a[A]|0;H=w+3|0;if((G|0)==91){F=H;B=40;break}else if((G|0)!=37){I=H;J=H;break}if((H|0)==(c[j>>2]|0)){Eh(c[o>>2]|0,8720,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}I=w+4|0;J=H}}while(0);if((B|0)==40){B=0;H=(a[F]|0)==94?w+4|0:F;while(1){if((H|0)==(c[j>>2]|0)){Eh(c[o>>2]|0,8536,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}G=H+1|0;if((a[H]|0)==37){K=G>>>0<(c[j>>2]|0)>>>0?H+2|0:G}else{K=G}if((a[K]|0)==93){break}else{H=K}}I=K+1|0;J=F}if((s|0)==(c[p>>2]|0)){L=0}else{L=d[v]|0}H=I-1|0;G=(a[J]|0)==94;M=G?J:A;N=G&1;G=N^1;O=M+1|0;e:do{if(O>>>0<H>>>0){P=M;Q=O;while(1){R=a[Q]|0;S=P+2|0;T=a[S]|0;f:do{if(R<<24>>24==37){if((vm(L,T&255)|0)==0){U=S}else{V=G;break e}}else{do{if(T<<24>>24==45){W=P+3|0;if(W>>>0>=H>>>0){break}if((R&255)>>>0>L>>>0){U=W;break f}if((d[W]|0)>>>0<L>>>0){U=W;break f}else{V=G;break e}}}while(0);if((R&255|0)==(L|0)){V=G;break e}else{U=Q}}}while(0);R=U+1|0;if(R>>>0<H>>>0){P=U;Q=R}else{V=N;break}}}else{V=N}}while(0);if((V|0)!=0){m=0;break a}N=a[s]|0;G=N&255;O=(a[J]|0)==94;M=O?J:A;Q=O&1;O=Q^1;P=M+1|0;g:do{if(P>>>0<H>>>0){R=M;T=P;while(1){S=a[T]|0;W=R+2|0;X=a[W]|0;h:do{if(S<<24>>24==37){if((vm(G,X&255)|0)==0){Y=W}else{Z=O;break g}}else{do{if(X<<24>>24==45){_=R+3|0;if(_>>>0>=H>>>0){break}if((S&255)>>>0>(N&255)>>>0){Y=_;break h}if((d[_]|0)>>>0<(N&255)>>>0){Y=_;break h}else{Z=O;break g}}}while(0);if(S<<24>>24==N<<24>>24){Z=O;break g}else{Y=T}}}while(0);S=Y+1|0;if(S>>>0<H>>>0){R=Y;T=S}else{Z=Q;break}}}else{Z=Q}}while(0);if((Z|0)==0){m=0;break a}else{$=I}}else if((z|0)==41){B=16;break b}else{Q=w+1|0;if(y<<24>>24!=91){C=Q;D=Q;B=89;break}H=(a[Q]|0)==94?w+2|0:Q;O=x;while(1){if((H|0)==(O|0)){Eh(c[o>>2]|0,8536,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}N=H+1|0;if((a[H]|0)==37){aa=N>>>0<(c[j>>2]|0)>>>0?H+2|0:N}else{aa=N}if((a[aa]|0)==93){break}H=aa;O=c[j>>2]|0}C=aa+1|0;D=Q;B=89}}while(0);i:do{if((B|0)==89){B=0;do{if((c[n>>2]|0)>>>0>s>>>0){y=a[s]|0;z=y&255;O=a[w]|0;H=O<<24>>24;j:do{if((H|0)==46){ba=a[C]|0}else if((H|0)==37){ca=vm(z,d[D]|0)|0;B=104}else if((H|0)==91){N=C-1|0;G=(a[D]|0)==94;P=G?D:w;M=G&1;G=M^1;A=P+1|0;if(A>>>0<N>>>0){da=P;ea=A}else{ca=M;B=104;break}while(1){A=a[ea]|0;P=da+2|0;T=a[P]|0;k:do{if(A<<24>>24==37){if((vm(z,T&255)|0)==0){fa=P}else{ca=G;B=104;break j}}else{do{if(T<<24>>24==45){R=da+3|0;if(R>>>0>=N>>>0){break}if((A&255)>>>0>(y&255)>>>0){fa=R;break k}if((d[R]|0)>>>0<(y&255)>>>0){fa=R;break k}else{ca=G;B=104;break j}}}while(0);if(A<<24>>24==y<<24>>24){ca=G;B=104;break j}else{fa=ea}}}while(0);A=fa+1|0;if(A>>>0<N>>>0){da=fa;ea=A}else{ca=M;B=104;break}}}else{ca=O<<24>>24==y<<24>>24|0;B=104}}while(0);if((B|0)==104){B=0;y=a[C]|0;if((ca|0)==0){ga=y;break}else{ba=y}}y=ba<<24>>24;if((y|0)==45){B=109;break b}else if((y|0)==43){B=112;break b}else if((y|0)==42){ha=s;break b}else if((y|0)!=63){ia=u;ja=C;break c}y=C+1|0;O=tm(b,u,y)|0;if((O|0)==0){$=y;break i}else{m=O;break a}}else{ga=a[C]|0}}while(0);if(!((ga<<24>>24|0)==42|(ga<<24>>24|0)==63|(ga<<24>>24|0)==45)){m=0;break a}$=C+1|0}}while(0);Q=c[j>>2]|0;if(($|0)==(Q|0)){m=s;break a}else{w=$;x=Q}}if((B|0)==25){B=0;v=w+2|0;if((x-1|0)>>>0<=v>>>0){Eh(c[o>>2]|0,8232,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}Q=a[s]|0;if(Q<<24>>24!=(a[v]|0)){m=0;break a}v=a[w+3|0]|0;O=c[n>>2]|0;if(u>>>0<O>>>0){ka=s;la=1;ma=u}else{m=0;break a}while(1){y=a[ma]|0;if(y<<24>>24==v<<24>>24){z=la-1|0;if((z|0)==0){break}else{na=z}}else{na=(y<<24>>24==Q<<24>>24)+la|0}y=ma+1|0;if(y>>>0<O>>>0){ka=ma;la=na;ma=y}else{m=0;break a}}ia=ka+2|0;ja=w+4|0}else if((B|0)==69){B=0;O=E&255;Q=O-49|0;do{if((Q|0)<0){B=72}else{if((Q|0)>=(c[q>>2]|0)){B=72;break}v=c[b+24+(Q<<3)+4>>2]|0;if((v|0)==-1){B=72}else{oa=Q;pa=v}}}while(0);if((B|0)==72){B=0;Q=Eh(c[o>>2]|0,9064,(k=i,i=i+8|0,c[k>>2]=O-48,k)|0)|0;i=k;oa=Q;pa=c[b+24+(Q<<3)+4>>2]|0}if(((c[n>>2]|0)-s|0)>>>0<pa>>>0){m=0;break a}if((on(c[b+24+(oa<<3)>>2]|0,s|0,pa|0)|0)!=0){m=0;break a}Q=s+pa|0;if((Q|0)==0){m=0;break a}ia=Q;ja=w+2|0}Q=c[j>>2]|0;if((ja|0)==(Q|0)){m=ia;break a}else{r=ja;s=ia;t=Q}}if((B|0)==7){t=w+1|0;if((a[t]|0)==41){r=c[q>>2]|0;if((r|0)>31){Eh(c[o>>2]|0,11496,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}c[b+24+(r<<3)>>2]=s;c[b+24+(r<<3)+4>>2]=-2;c[q>>2]=r+1;r=tm(b,s,w+2|0)|0;if((r|0)!=0){m=r;break}c[q>>2]=(c[q>>2]|0)-1;m=0;break}else{r=c[q>>2]|0;if((r|0)>31){Eh(c[o>>2]|0,11496,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}c[b+24+(r<<3)>>2]=s;c[b+24+(r<<3)+4>>2]=-1;c[q>>2]=r+1;r=tm(b,s,t)|0;if((r|0)!=0){m=r;break}c[q>>2]=(c[q>>2]|0)-1;m=0;break}}else if((B|0)==16){r=w+1|0;t=c[q>>2]|0;while(1){p=t-1|0;if((t|0)<=0){B=19;break}if((c[b+24+(p<<3)+4>>2]|0)==-1){qa=p;break}else{t=p}}if((B|0)==19){t=Eh(c[o>>2]|0,8040,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k;qa=t}t=b+24+(qa<<3)+4|0;c[t>>2]=s-(c[b+24+(qa<<3)>>2]|0);q=tm(b,s,r)|0;if((q|0)!=0){m=q;break}c[t>>2]=-1;m=0;break}else if((B|0)==23){m=(s|0)==(c[n>>2]|0)?s:0;break}else if((B|0)==109){t=C+1|0;q=tm(b,s,t)|0;if((q|0)!=0){m=q;break}q=C-1|0;p=s;while(1){if((c[n>>2]|0)>>>0<=p>>>0){m=0;break a}Q=a[p]|0;v=Q&255;x=a[w]|0;y=x<<24>>24;l:do{if((y|0)==37){ra=vm(v,d[D]|0)|0;B=147}else if((y|0)==91){z=(a[D]|0)==94;H=z?D:w;M=z&1;z=M^1;N=H+1|0;if(N>>>0<q>>>0){sa=H;ta=N}else{ra=M;B=147;break}while(1){N=a[ta]|0;H=sa+2|0;G=a[H]|0;m:do{if(N<<24>>24==37){if((vm(v,G&255)|0)==0){ua=H}else{ra=z;B=147;break l}}else{do{if(G<<24>>24==45){A=sa+3|0;if(A>>>0>=q>>>0){break}if((N&255)>>>0>(Q&255)>>>0){ua=A;break m}if((d[A]|0)>>>0<(Q&255)>>>0){ua=A;break m}else{ra=z;B=147;break l}}}while(0);if(N<<24>>24==Q<<24>>24){ra=z;B=147;break l}else{ua=ta}}}while(0);N=ua+1|0;if(N>>>0<q>>>0){sa=ua;ta=N}else{ra=M;B=147;break}}}else if((y|0)!=46){ra=x<<24>>24==Q<<24>>24|0;B=147}}while(0);if((B|0)==147){B=0;if((ra|0)==0){m=0;break a}}Q=p+1|0;x=tm(b,Q,t)|0;if((x|0)==0){p=Q}else{m=x;break a}}}else if((B|0)==112){ha=u}p=c[n>>2]|0;if(p>>>0>ha>>>0){t=C-1|0;q=0;s=ha;r=p;while(1){p=a[s]|0;o=p&255;x=a[w]|0;Q=x<<24>>24;n:do{if((Q|0)==46){va=r}else if((Q|0)==37){wa=vm(o,d[D]|0)|0;B=129}else if((Q|0)==91){y=(a[D]|0)==94;v=y?D:w;O=y&1;y=O^1;M=v+1|0;if(M>>>0<t>>>0){xa=v;ya=M}else{wa=O;B=129;break}while(1){M=a[ya]|0;v=xa+2|0;z=a[v]|0;o:do{if(M<<24>>24==37){if((vm(o,z&255)|0)==0){za=v}else{wa=y;B=129;break n}}else{do{if(z<<24>>24==45){N=xa+3|0;if(N>>>0>=t>>>0){break}if((M&255)>>>0>(p&255)>>>0){za=N;break o}if((d[N]|0)>>>0<(p&255)>>>0){za=N;break o}else{wa=y;B=129;break n}}}while(0);if(M<<24>>24==p<<24>>24){wa=y;B=129;break n}else{za=ya}}}while(0);M=za+1|0;if(M>>>0<t>>>0){xa=za;ya=M}else{wa=O;B=129;break}}}else{wa=x<<24>>24==p<<24>>24|0;B=129}}while(0);if((B|0)==129){B=0;if((wa|0)==0){Aa=q;break}va=c[n>>2]|0}p=q+1|0;x=ha+p|0;if(va>>>0>x>>>0){q=p;s=x;r=va}else{Aa=p;break}}if((Aa|0)>-1){Ba=Aa}else{m=0;break}}else{Ba=0}r=C+1|0;s=Ba;while(1){q=tm(b,ha+s|0,r)|0;if((q|0)!=0){m=q;break a}if((s|0)>0){s=s-1|0}else{m=0;break}}}}while(0);c[h>>2]=(c[h>>2]|0)+1;i=g;return m|0}function um(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;if((c[a+20>>2]|0)<=(b|0)){g=c[a+16>>2]|0;if((b|0)==0){Zd(g,d,e-d|0)|0;i=f;return}else{Eh(g,10496,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;i=f;return}}g=c[a+24+(b<<3)+4>>2]|0;do{if((g|0)==-1){d=a+16|0;Eh(c[d>>2]|0,10264,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;j=c[d>>2]|0;k=c[a+24+(b<<3)>>2]|0}else{d=c[a+16>>2]|0;e=c[a+24+(b<<3)>>2]|0;if((g|0)!=-2){j=d;k=e;break}Xd(d,e+1-(c[a+4>>2]|0)|0);i=f;return}}while(0);Zd(j,k,g)|0;i=f;return}function vm(a,b){a=a|0;b=b|0;var c=0,d=0;switch(pn(b|0)|0){case 97:{c=Eb(a|0)|0;break};case 99:{c=tc(a|0)|0;break};case 100:{c=(a-48|0)>>>0<10>>>0|0;break};case 103:{c=nc(a|0)|0;break};case 108:{c=ob(a|0)|0;break};case 112:{c=cc(a|0)|0;break};case 115:{c=Ca(a|0)|0;break};case 117:{c=qb(a|0)|0;break};case 119:{c=Cb(a|0)|0;break};case 120:{c=_a(a|0)|0;break};case 122:{c=(a|0)==0|0;break};default:{d=(b|0)==(a|0)|0;return d|0}}if((ob(b|0)|0)!=0){d=c;return d|0}d=(c|0)==0|0;return d|0}function wm(a){a=a|0;ke(a,0,7);ni(a,24,0);he(a,-1,2760);ne(a,2760);return 1}function xm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+1048|0;d=b|0;e=b+1040|0;f=Nh(a,2,13792,e)|0;Qh(a,1,5);g=Wh(a,3,1)|0;if((Ed(a,4)|0)<1){h=ji(a,1)|0}else{h=Uh(a,4)|0}bi(a,d);do{if((g|0)<(h|0)){j=g;do{je(a,1,j);if((Id(a,-1)|0)==0){k=Fd(a,Ed(a,-1)|0)|0;Eh(a,12400,(l=i,i=i+16|0,c[l>>2]=k,c[l+8>>2]=j,l)|0)|0;i=l}ai(d);Yh(d,f,c[e>>2]|0);j=j+1|0;}while((j|0)<(h|0))}else{if((g|0)==(h|0)){break}_h(d);i=b;return 1}}while(0);je(a,1,h);if((Id(a,-1)|0)==0){g=Fd(a,Ed(a,-1)|0)|0;Eh(a,12400,(l=i,i=i+16|0,c[l>>2]=g,c[l+8>>2]=h,l)|0)|0;i=l}ai(d);_h(d);i=b;return 1}function ym(a){a=a|0;var b=0.0,c=0.0,d=0.0;Qh(a,1,5);Vd(a);a:do{if((Ce(a,1)|0)==0){b=0.0}else{c=0.0;while(1){while(1){yd(a,-2);if((Ed(a,-1)|0)==3){d=+Md(a,-1,0);if(d>c){break}}if((Ce(a,1)|0)==0){b=c;break a}}if((Ce(a,1)|0)==0){b=d;break}else{c=d}}}}while(0);Wd(a,b);return 1}function zm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;Qh(a,1,5);d=ji(a,1)|0;e=d+1|0;f=xd(a)|0;if((f|0)==3){g=2}else if((f|0)==2){h=e}else{f=Eh(a,12736,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j;k=f;i=b;return k|0}do{if((g|0)==2){f=Uh(a,2)|0;if((f|0)<1|(f|0)>(e|0)){Dh(a,2,2464)|0}if((d|0)<(f|0)){h=f;break}else{l=e}while(1){j=l-1|0;je(a,1,j);re(a,1,l);if((j|0)>(f|0)){l=j}else{h=f;break}}}}while(0);re(a,1,h);k=0;i=b;return k|0}function Am(a){a=a|0;var b=0,c=0;b=xd(a)|0;ke(a,b,1);Xd(a,b);pe(a,-2,13096);if((b|0)<=0){return 1}Dd(a,1);re(a,-2,1);Bd(a,1);if((b|0)>1){c=b}else{return 1}do{re(a,1,c);c=c-1|0;}while((c|0)>1);return 1}function Bm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;Qh(a,1,5);d=Wh(a,2,1)|0;if((Ed(a,3)|0)<1){e=ji(a,1)|0}else{e=Uh(a,3)|0}if((e|0)<(d|0)){f=0;i=b;return f|0}g=e-d|0;h=g+1|0;do{if((g|0)>=0){if((sd(a,h)|0)==0){break}je(a,1,d);if((e|0)>(d|0)){j=d}else{f=h;i=b;return f|0}while(1){k=j+1|0;je(a,1,k);if((k|0)<(e|0)){j=k}else{f=h;break}}i=b;return f|0}}while(0);h=Eh(a,13464,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;f=h;i=b;return f|0}function Cm(a){a=a|0;var b=0,c=0,d=0,e=0;Qh(a,1,5);b=ji(a,1)|0;c=Wh(a,2,b)|0;do{if((c|0)!=(b|0)){if(!((c|0)<1|(c|0)>(b+1|0))){break}Dh(a,1,2464)|0}}while(0);je(a,1,c);if((c|0)<(b|0)){d=c}else{e=c;Vd(a);re(a,1,e);return 1}while(1){c=d+1|0;je(a,1,c);re(a,1,d);if((c|0)<(b|0)){d=c}else{e=b;break}}Vd(a);re(a,1,e);return 1}function Dm(a){a=a|0;var b=0;Qh(a,1,5);b=ji(a,1)|0;Ph(a,40,13792);if((Ed(a,2)|0)>=1){Qh(a,2,6)}yd(a,2);Em(a,1,b);return 0}function Em(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;if((d|0)>(b|0)){f=b;g=d}else{i=e;return}while(1){je(a,1,f);je(a,1,g);if((Fm(a,-1,-2)|0)==0){yd(a,-3)}else{re(a,1,f);re(a,1,g)}d=g-f|0;if((d|0)==1){h=24;break}b=(g+f|0)/2|0;je(a,1,b);je(a,1,f);do{if((Fm(a,-2,-1)|0)==0){yd(a,-2);je(a,1,g);if((Fm(a,-1,-2)|0)==0){yd(a,-3);break}else{re(a,1,b);re(a,1,g);break}}else{re(a,1,b);re(a,1,f)}}while(0);if((d|0)==2){h=24;break}je(a,1,b);Dd(a,-1);j=g-1|0;je(a,1,j);re(a,1,b);re(a,1,j);k=j;l=f;while(1){m=l+1|0;je(a,1,m);if((Fm(a,-1,-2)|0)==0){n=l;o=m}else{p=m;while(1){if((g|0)<=(p|0)){Eh(a,2720,(q=i,i=i+1|0,i=i+7&-8,c[q>>2]=0,q)|0)|0;i=q}yd(a,-2);m=p+1|0;je(a,1,m);if((Fm(a,-1,-2)|0)==0){n=p;o=m;break}else{p=m}}}p=k-1|0;je(a,1,p);if((Fm(a,-3,-1)|0)==0){r=k;s=p}else{m=p;while(1){if((m|0)<=(f|0)){Eh(a,2720,(q=i,i=i+1|0,i=i+7&-8,c[q>>2]=0,q)|0)|0;i=q}yd(a,-2);p=m-1|0;je(a,1,p);if((Fm(a,-3,-1)|0)==0){r=m;s=p;break}else{m=p}}}if((r|0)<=(o|0)){break}re(a,1,o);re(a,1,s);k=s;l=o}yd(a,-4);je(a,1,j);je(a,1,o);re(a,1,j);re(a,1,o);l=(o-f|0)<(g-o|0);k=n+2|0;b=l?k:f;d=l?g:n;Em(a,l?f:k,l?n:g);if((d|0)>(b|0)){f=b;g=d}else{h=24;break}}if((h|0)==24){i=e;return}}function Fm(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((Ed(a,2)|0)==0){d=Ld(a,b,c,1)|0;return d|0}else{Dd(a,2);Dd(a,b-1|0);Dd(a,c-2|0);ve(a,2,1,0,0);c=Pd(a,-1)|0;yd(a,-2);d=c;return d|0}return 0}function Gm(a){a=a|0;oi(a,-1001e3,2688)|0;ke(a,0,1);be(a,46,0);pe(a,-2,10456);se(a,-2)|0;ke(a,0,3);ni(a,336,0);ke(a,4,0);Dd(a,-2);be(a,146,1);re(a,-2,1);Dd(a,-2);be(a,60,1);re(a,-2,2);Dd(a,-2);be(a,340,1);re(a,-2,3);Dd(a,-2);be(a,38,1);re(a,-2,4);Dd(a,-1);pe(a,-3,7616);pe(a,-2,6040);Rm(a,4544,3920,3584,3104);Rm(a,2712,2448,13448,13024);Zd(a,12720,10)|0;pe(a,-2,12392);oi(a,-1001e3,12160)|0;pe(a,-2,11976);oi(a,-1001e3,11704)|0;pe(a,-2,11488);je(a,-1001e3,2);Dd(a,-2);ni(a,1592,1);yd(a,-2);return 1}function Hm(a){a=a|0;var b=0,c=0,d=0;b=Oh(a,1,0)|0;c=Sm(a,b,Oh(a,2,0)|0)|0;if((c|0)==0){d=1;return d|0}Vd(a);Ad(a,-2);_d(a,(c|0)==1?4496:4416)|0;d=3;return d|0}function Im(a){a=a|0;var b=0,c=0,d=0,e=0;b=Oh(a,1,0)|0;c=Oh(a,2,0)|0;d=Nh(a,3,6528,0)|0;if((Tm(a,b,c,d,Nh(a,4,7088,0)|0)|0)!=0){e=1;return e|0}Vd(a);Ad(a,-2);e=2;return e|0}function Jm(a){a=a|0;Qh(a,1,5);if((le(a,1)|0)==0){ke(a,0,1);Dd(a,-1);se(a,1)|0}je(a,-1001e3,2);pe(a,-2,4560);return 0}function Km(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+104|0;d=b|0;e=Oh(a,1,0)|0;f=xd(a)|0;li(a,e,1);he(a,-1,9056);g=(Ed(a,-1)|0)==0;yd(a,-2);if(g){Dd(a,-1);pe(a,-2,8224);_d(a,e)|0;pe(a,-2,9056);g=cb(e|0,46)|0;Zd(a,e,((g|0)==0?e:g+1|0)-e|0)|0;pe(a,-2,8024)}Dd(a,-1);do{if((Qe(a,1,d)|0)==0){h=6}else{if((Te(a,8712,d)|0)==0){h=6;break}if((Gd(a,-1)|0)!=0){h=6}}}while(0);if((h|0)==6){Eh(a,8472,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h}Dd(a,-2);He(a,-2,1)|0;yd(a,-2);if((f|0)<2){i=b;return 1}else{j=2}while(1){if((Ed(a,j)|0)==6){Dd(a,j);Dd(a,-2);ve(a,1,0,0,0)}if((j|0)<(f|0)){j=j+1|0}else{break}}i=b;return 1}function Lm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+1040|0;d=b|0;e=Oh(a,1,0)|0;yd(a,1);he(a,-1001e3,12160);he(a,2,e);if((Pd(a,-1)|0)!=0){i=b;return 1}yd(a,-2);bi(a,d);he(a,-1001001,6040);if((Ed(a,3)|0)==5){f=1}else{Eh(a,9712,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;f=1}while(1){je(a,3,f);if((Ed(a,-1)|0)==0){yd(a,-2);_h(d);h=Qd(a,-1,0)|0;Eh(a,9392,(g=i,i=i+16|0,c[g>>2]=e,c[g+8>>2]=h,g)|0)|0;i=g}_d(a,e)|0;ve(a,1,2,0,0);if((Ed(a,-2)|0)==6){break}if((Id(a,-2)|0)==0){yd(a,-3)}else{yd(a,-2);ai(d)}f=f+1|0}_d(a,e)|0;Ad(a,-2);ve(a,2,1,0,0);if((Ed(a,-1)|0)!=0){pe(a,2,e)}he(a,2,e);if((Ed(a,-1)|0)!=0){i=b;return 1}ce(a,1);Dd(a,-1);pe(a,2,e);i=b;return 1}function Mm(a){a=a|0;var b=0,c=0;b=ji(a,1)|0;if((b|0)>0){c=b}else{return 0}do{je(a,1,c);Sd(a,-1)|0;yd(a,-2);c=c-1|0;}while((c|0)>0);return 0}function Nm(a){a=a|0;var b=0,d=0;b=i;d=Oh(a,1,0)|0;he(a,-1001e3,11704);he(a,-1,d);if((Ed(a,-1)|0)!=0){i=b;return 1}ae(a,5016,(a=i,i=i+8|0,c[a>>2]=d,a)|0)|0;i=a;i=b;return 1}function Om(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=Oh(a,1,0)|0;he(a,-1001001,4544);e=Qd(a,-1,0)|0;if((e|0)==0){Eh(a,5904,(f=i,i=i+8|0,c[f>>2]=4544,f)|0)|0;i=f}g=Tm(a,d,e,6528,7088)|0;if((g|0)==0){h=1;i=b;return h|0}if((fi(a,g,0)|0)==0){_d(a,g)|0;h=2;i=b;return h|0}else{e=Qd(a,1,0)|0;d=Qd(a,-1,0)|0;j=Eh(a,6680,(f=i,i=i+24|0,c[f>>2]=e,c[f+8>>2]=g,c[f+16>>2]=d,f)|0)|0;i=f;h=j;i=b;return h|0}return 0}function Pm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=Oh(a,1,0)|0;he(a,-1001001,2712);e=Qd(a,-1,0)|0;if((e|0)==0){Eh(a,5904,(f=i,i=i+8|0,c[f>>2]=2712,f)|0)|0;i=f}g=Tm(a,d,e,6528,7088)|0;if((g|0)==0){h=1;i=b;return h|0}if((Um(a,g,d)|0)==0){_d(a,g)|0;h=2;i=b;return h|0}else{d=Qd(a,1,0)|0;e=Qd(a,-1,0)|0;j=Eh(a,6680,(f=i,i=i+24|0,c[f>>2]=d,c[f+8>>2]=g,c[f+16>>2]=e,f)|0)|0;i=f;h=j;i=b;return h|0}return 0}function Qm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=Oh(a,1,0)|0;e=Va(d|0,46)|0;if((e|0)==0){f=0;i=b;return f|0}Zd(a,d,e-d|0)|0;e=Qd(a,-1,0)|0;he(a,-1001001,2712);g=Qd(a,-1,0)|0;if((g|0)==0){Eh(a,5904,(h=i,i=i+8|0,c[h>>2]=2712,h)|0)|0;i=h}j=Tm(a,e,g,6528,7088)|0;if((j|0)==0){f=1;i=b;return f|0}g=Um(a,j,d)|0;if((g|0)==2){ae(a,6856,(h=i,i=i+16|0,c[h>>2]=d,c[h+8>>2]=j,h)|0)|0;i=h;f=1;i=b;return f|0}else if((g|0)==0){_d(a,j)|0;f=2;i=b;return f|0}else{g=Qd(a,1,0)|0;d=Qd(a,-1,0)|0;e=Eh(a,6680,(h=i,i=i+24|0,c[h>>2]=g,c[h+8>>2]=j,c[h+16>>2]=d,h)|0)|0;i=h;f=e;i=b;return f|0}return 0}function Rm(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=Kb(c|0)|0;if((f|0)==0){c=Kb(d|0)|0;if((c|0)!=0){g=c;h=3}}else{g=f;h=3}do{if((h|0)==3){he(a,-1001e3,7288);f=Pd(a,-1)|0;yd(a,-2);if((f|0)!=0){break}qi(a,qi(a,g,7824,7624)|0,7448,e)|0;zd(a,-2);pe(a,-2,b);return}}while(0);_d(a,e)|0;pe(a,-2,b);return}function Sm(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;he(b,-1001e3,2688);he(b,-1,c);c=Sd(b,-1)|0;yd(b,-3);if((c|0)==0){Zd(b,6056,58)|0;e=1;return e|0}if((a[d]|0)==42){ce(b,1);e=0;return e|0}else{Zd(b,6056,58)|0;e=2;return e|0}return 0}function Tm(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+1040|0;j=h|0;bi(b,j);if((a[f]|0)==0){k=d}else{k=qi(b,d,f,g)|0}g=e;while(1){e=a[g]|0;if((e<<24>>24|0)==0){l=12;break}else if((e<<24>>24|0)==59){g=g+1|0;continue}e=Va(g|0,59)|0;if((e|0)==0){m=g+(jn(g|0)|0)|0}else{m=e}Zd(b,g,m-g|0)|0;if((m|0)==0){l=12;break}n=qi(b,Qd(b,-1,0)|0,5784,k)|0;zd(b,-2);o=xb(n|0,5416)|0;if((o|0)!=0){l=10;break}ae(b,5616,(e=i,i=i+8|0,c[e>>2]=n,e)|0)|0;i=e;zd(b,-2);ai(j);g=m}if((l|0)==10){ua(o|0)|0;p=n;i=h;return p|0}else if((l|0)==12){_h(j);p=0;i=h;return p|0}return 0}function Um(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=qi(a,d,6528,6376)|0;d=Va(f|0,45)|0;do{if((d|0)==0){g=f}else{h=Zd(a,f,d-f|0)|0;j=ae(a,6224,(k=i,i=i+8|0,c[k>>2]=h,k)|0)|0;i=k;h=Sm(a,b,j)|0;if((h|0)==2){g=d+1|0;break}else{l=h;i=e;return l|0}}}while(0);d=ae(a,6224,(k=i,i=i+8|0,c[k>>2]=g,k)|0)|0;i=k;l=Sm(a,b,d)|0;i=e;return l|0}function Vm(a,b){a=+a;b=b|0;return+(+an(a,b))}function Wm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[3456]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=13864+(h<<2)|0;j=13864+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[3456]=e&~(1<<g)}else{if(l>>>0<(c[3460]|0)>>>0){Xb();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{Xb();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[3458]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=13864+(p<<2)|0;m=13864+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[3456]=e&~(1<<r)}else{if(l>>>0<(c[3460]|0)>>>0){Xb();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{Xb();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[3458]|0;if((l|0)!=0){q=c[3461]|0;d=l>>>3;l=d<<1;f=13864+(l<<2)|0;k=c[3456]|0;h=1<<d;do{if((k&h|0)==0){c[3456]=k|h;s=f;t=13864+(l+2<<2)|0}else{d=13864+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[3460]|0)>>>0){s=g;t=d;break}Xb();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[3458]=m;c[3461]=e;n=i;return n|0}l=c[3457]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[14128+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[3460]|0;if(r>>>0<i>>>0){Xb();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){Xb();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){Xb();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){Xb();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){Xb();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{Xb();return 0}}}while(0);a:do{if((e|0)!=0){f=d+28|0;i=14128+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[3457]=c[3457]&~(1<<c[f>>2]);break a}else{if(e>>>0<(c[3460]|0)>>>0){Xb();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break a}}}while(0);if(v>>>0<(c[3460]|0)>>>0){Xb();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[3458]|0;if((f|0)!=0){e=c[3461]|0;i=f>>>3;f=i<<1;q=13864+(f<<2)|0;k=c[3456]|0;g=1<<i;do{if((k&g|0)==0){c[3456]=k|g;y=q;z=13864+(f+2<<2)|0}else{i=13864+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[3460]|0)>>>0){y=l;z=i;break}Xb();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[3458]=p;c[3461]=m}n=d+8|0;return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[3457]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[14128+(A<<2)>>2]|0;b:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break b}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[14128+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[3458]|0)-g|0)>>>0){o=g;break}q=K;m=c[3460]|0;if(q>>>0<m>>>0){Xb();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){Xb();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){Xb();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){Xb();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){Xb();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{Xb();return 0}}}while(0);c:do{if((e|0)!=0){i=K+28|0;m=14128+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[3457]=c[3457]&~(1<<c[i>>2]);break c}else{if(e>>>0<(c[3460]|0)>>>0){Xb();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break c}}}while(0);if(L>>>0<(c[3460]|0)>>>0){Xb();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);d:do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=13864+(e<<2)|0;r=c[3456]|0;j=1<<i;do{if((r&j|0)==0){c[3456]=r|j;O=m;P=13864+(e+2<<2)|0}else{i=13864+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[3460]|0)>>>0){O=d;P=i;break}Xb();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=14128+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[3457]|0;l=1<<Q;if((m&l|0)==0){c[3457]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}l=c[j>>2]|0;if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}e:do{if((c[l+4>>2]&-8|0)==(J|0)){S=l}else{j=l;m=J<<R;while(1){T=j+16+(m>>>31<<2)|0;i=c[T>>2]|0;if((i|0)==0){break}if((c[i+4>>2]&-8|0)==(J|0)){S=i;break e}else{j=i;m=m<<1}}if(T>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[T>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break d}}}while(0);l=S+8|0;m=c[l>>2]|0;i=c[3460]|0;if(S>>>0>=i>>>0&m>>>0>=i>>>0){c[m+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=m;c[q+(g+12)>>2]=S;c[q+(g+24)>>2]=0;break}else{Xb();return 0}}}while(0);n=K+8|0;return n|0}}while(0);K=c[3458]|0;if(K>>>0>=o>>>0){S=K-o|0;T=c[3461]|0;if(S>>>0>15>>>0){J=T;c[3461]=J+o;c[3458]=S;c[J+(o+4)>>2]=S|1;c[J+K>>2]=S;c[T+4>>2]=o|3}else{c[3458]=0;c[3461]=0;c[T+4>>2]=K|3;S=T+(K+4)|0;c[S>>2]=c[S>>2]|1}n=T+8|0;return n|0}T=c[3459]|0;if(T>>>0>o>>>0){S=T-o|0;c[3459]=S;T=c[3462]|0;K=T;c[3462]=K+o;c[K+(o+4)>>2]=S|1;c[T+4>>2]=o|3;n=T+8|0;return n|0}do{if((c[3436]|0)==0){T=Vb(30)|0;if((T-1&T|0)==0){c[3438]=T;c[3437]=T;c[3439]=-1;c[3440]=-1;c[3441]=0;c[3567]=0;c[3436]=(xc(0)|0)&-16^1431655768;break}else{Xb();return 0}}}while(0);T=o+48|0;S=c[3438]|0;K=o+47|0;J=S+K|0;R=-S|0;S=J&R;if(S>>>0<=o>>>0){n=0;return n|0}Q=c[3566]|0;do{if((Q|0)!=0){O=c[3564]|0;P=O+S|0;if(P>>>0<=O>>>0|P>>>0>Q>>>0){n=0}else{break}return n|0}}while(0);f:do{if((c[3567]&4|0)==0){Q=c[3462]|0;g:do{if((Q|0)==0){U=181}else{P=Q;O=14272;while(1){V=O|0;L=c[V>>2]|0;if(L>>>0<=P>>>0){W=O+4|0;if((L+(c[W>>2]|0)|0)>>>0>P>>>0){break}}L=c[O+8>>2]|0;if((L|0)==0){U=181;break g}else{O=L}}if((O|0)==0){U=181;break}P=J-(c[3459]|0)&R;if(P>>>0>=2147483647>>>0){X=0;break}e=Mb(P|0)|0;if((e|0)==((c[V>>2]|0)+(c[W>>2]|0)|0)){Y=e;Z=P;U=190}else{_=P;$=e;U=191}}}while(0);do{if((U|0)==181){Q=Mb(0)|0;if((Q|0)==-1){X=0;break}e=Q;P=c[3437]|0;L=P-1|0;if((L&e|0)==0){aa=S}else{aa=S-e+(L+e&-P)|0}P=c[3564]|0;e=P+aa|0;if(!(aa>>>0>o>>>0&aa>>>0<2147483647>>>0)){X=0;break}L=c[3566]|0;if((L|0)!=0){if(e>>>0<=P>>>0|e>>>0>L>>>0){X=0;break}}L=Mb(aa|0)|0;if((L|0)==(Q|0)){Y=Q;Z=aa;U=190}else{_=aa;$=L;U=191}}}while(0);h:do{if((U|0)==190){if((Y|0)==-1){X=Z}else{ba=Z;ca=Y;U=201;break f}}else if((U|0)==191){L=-_|0;do{if(($|0)!=-1&_>>>0<2147483647>>>0&T>>>0>_>>>0){Q=c[3438]|0;e=K-_+Q&-Q;if(e>>>0>=2147483647>>>0){da=_;break}if((Mb(e|0)|0)==-1){Mb(L|0)|0;X=0;break h}else{da=e+_|0;break}}else{da=_}}while(0);if(($|0)==-1){X=0}else{ba=da;ca=$;U=201;break f}}}while(0);c[3567]=c[3567]|4;ea=X;U=198}else{ea=0;U=198}}while(0);do{if((U|0)==198){if(S>>>0>=2147483647>>>0){break}X=Mb(S|0)|0;$=Mb(0)|0;if(!((X|0)!=-1&($|0)!=-1&X>>>0<$>>>0)){break}da=$-X|0;$=da>>>0>(o+40|0)>>>0;if($){ba=$?da:ea;ca=X;U=201}}}while(0);do{if((U|0)==201){ea=(c[3564]|0)+ba|0;c[3564]=ea;if(ea>>>0>(c[3565]|0)>>>0){c[3565]=ea}ea=c[3462]|0;i:do{if((ea|0)==0){S=c[3460]|0;if((S|0)==0|ca>>>0<S>>>0){c[3460]=ca}c[3568]=ca;c[3569]=ba;c[3571]=0;c[3465]=c[3436];c[3464]=-1;S=0;do{X=S<<1;da=13864+(X<<2)|0;c[13864+(X+3<<2)>>2]=da;c[13864+(X+2<<2)>>2]=da;S=S+1|0;}while(S>>>0<32>>>0);S=ca+8|0;if((S&7|0)==0){fa=0}else{fa=-S&7}S=ba-40-fa|0;c[3462]=ca+fa;c[3459]=S;c[ca+(fa+4)>>2]=S|1;c[ca+(ba-36)>>2]=40;c[3463]=c[3440]}else{S=14272;while(1){ga=c[S>>2]|0;ha=S+4|0;ia=c[ha>>2]|0;if((ca|0)==(ga+ia|0)){U=213;break}da=c[S+8>>2]|0;if((da|0)==0){break}else{S=da}}do{if((U|0)==213){if((c[S+12>>2]&8|0)!=0){break}da=ea;if(!(da>>>0>=ga>>>0&da>>>0<ca>>>0)){break}c[ha>>2]=ia+ba;da=c[3462]|0;X=(c[3459]|0)+ba|0;$=da;_=da+8|0;if((_&7|0)==0){ja=0}else{ja=-_&7}_=X-ja|0;c[3462]=$+ja;c[3459]=_;c[$+(ja+4)>>2]=_|1;c[$+(X+4)>>2]=40;c[3463]=c[3440];break i}}while(0);if(ca>>>0<(c[3460]|0)>>>0){c[3460]=ca}S=ca+ba|0;X=14272;while(1){ka=X|0;if((c[ka>>2]|0)==(S|0)){U=223;break}$=c[X+8>>2]|0;if(($|0)==0){break}else{X=$}}do{if((U|0)==223){if((c[X+12>>2]&8|0)!=0){break}c[ka>>2]=ca;S=X+4|0;c[S>>2]=(c[S>>2]|0)+ba;S=ca+8|0;if((S&7|0)==0){la=0}else{la=-S&7}S=ca+(ba+8)|0;if((S&7|0)==0){ma=0}else{ma=-S&7}S=ca+(ma+ba)|0;$=S;_=la+o|0;da=ca+_|0;K=da;T=S-(ca+la)-o|0;c[ca+(la+4)>>2]=o|3;j:do{if(($|0)==(c[3462]|0)){Y=(c[3459]|0)+T|0;c[3459]=Y;c[3462]=K;c[ca+(_+4)>>2]=Y|1}else{if(($|0)==(c[3461]|0)){Y=(c[3458]|0)+T|0;c[3458]=Y;c[3461]=K;c[ca+(_+4)>>2]=Y|1;c[ca+(Y+_)>>2]=Y;break}Y=ba+4|0;Z=c[ca+(Y+ma)>>2]|0;if((Z&3|0)==1){aa=Z&-8;W=Z>>>3;k:do{if(Z>>>0<256>>>0){V=c[ca+((ma|8)+ba)>>2]|0;R=c[ca+(ba+12+ma)>>2]|0;J=13864+(W<<1<<2)|0;do{if((V|0)!=(J|0)){if(V>>>0<(c[3460]|0)>>>0){Xb();return 0}if((c[V+12>>2]|0)==($|0)){break}Xb();return 0}}while(0);if((R|0)==(V|0)){c[3456]=c[3456]&~(1<<W);break}do{if((R|0)==(J|0)){na=R+8|0}else{if(R>>>0<(c[3460]|0)>>>0){Xb();return 0}L=R+8|0;if((c[L>>2]|0)==($|0)){na=L;break}Xb();return 0}}while(0);c[V+12>>2]=R;c[na>>2]=V}else{J=S;L=c[ca+((ma|24)+ba)>>2]|0;O=c[ca+(ba+12+ma)>>2]|0;do{if((O|0)==(J|0)){e=ma|16;Q=ca+(Y+e)|0;P=c[Q>>2]|0;if((P|0)==0){M=ca+(e+ba)|0;e=c[M>>2]|0;if((e|0)==0){oa=0;break}else{pa=e;qa=M}}else{pa=P;qa=Q}while(1){Q=pa+20|0;P=c[Q>>2]|0;if((P|0)!=0){pa=P;qa=Q;continue}Q=pa+16|0;P=c[Q>>2]|0;if((P|0)==0){break}else{pa=P;qa=Q}}if(qa>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[qa>>2]=0;oa=pa;break}}else{Q=c[ca+((ma|8)+ba)>>2]|0;if(Q>>>0<(c[3460]|0)>>>0){Xb();return 0}P=Q+12|0;if((c[P>>2]|0)!=(J|0)){Xb();return 0}M=O+8|0;if((c[M>>2]|0)==(J|0)){c[P>>2]=O;c[M>>2]=Q;oa=O;break}else{Xb();return 0}}}while(0);if((L|0)==0){break}O=ca+(ba+28+ma)|0;V=14128+(c[O>>2]<<2)|0;do{if((J|0)==(c[V>>2]|0)){c[V>>2]=oa;if((oa|0)!=0){break}c[3457]=c[3457]&~(1<<c[O>>2]);break k}else{if(L>>>0<(c[3460]|0)>>>0){Xb();return 0}R=L+16|0;if((c[R>>2]|0)==(J|0)){c[R>>2]=oa}else{c[L+20>>2]=oa}if((oa|0)==0){break k}}}while(0);if(oa>>>0<(c[3460]|0)>>>0){Xb();return 0}c[oa+24>>2]=L;J=ma|16;O=c[ca+(J+ba)>>2]|0;do{if((O|0)!=0){if(O>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[oa+16>>2]=O;c[O+24>>2]=oa;break}}}while(0);O=c[ca+(Y+J)>>2]|0;if((O|0)==0){break}if(O>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[oa+20>>2]=O;c[O+24>>2]=oa;break}}}while(0);ra=ca+((aa|ma)+ba)|0;sa=aa+T|0}else{ra=$;sa=T}Y=ra+4|0;c[Y>>2]=c[Y>>2]&-2;c[ca+(_+4)>>2]=sa|1;c[ca+(sa+_)>>2]=sa;Y=sa>>>3;if(sa>>>0<256>>>0){W=Y<<1;Z=13864+(W<<2)|0;O=c[3456]|0;L=1<<Y;do{if((O&L|0)==0){c[3456]=O|L;ta=Z;ua=13864+(W+2<<2)|0}else{Y=13864+(W+2<<2)|0;V=c[Y>>2]|0;if(V>>>0>=(c[3460]|0)>>>0){ta=V;ua=Y;break}Xb();return 0}}while(0);c[ua>>2]=K;c[ta+12>>2]=K;c[ca+(_+8)>>2]=ta;c[ca+(_+12)>>2]=Z;break}W=da;L=sa>>>8;do{if((L|0)==0){va=0}else{if(sa>>>0>16777215>>>0){va=31;break}O=(L+1048320|0)>>>16&8;aa=L<<O;Y=(aa+520192|0)>>>16&4;V=aa<<Y;aa=(V+245760|0)>>>16&2;R=14-(Y|O|aa)+(V<<aa>>>15)|0;va=sa>>>((R+7|0)>>>0)&1|R<<1}}while(0);L=14128+(va<<2)|0;c[ca+(_+28)>>2]=va;c[ca+(_+20)>>2]=0;c[ca+(_+16)>>2]=0;Z=c[3457]|0;R=1<<va;if((Z&R|0)==0){c[3457]=Z|R;c[L>>2]=W;c[ca+(_+24)>>2]=L;c[ca+(_+12)>>2]=W;c[ca+(_+8)>>2]=W;break}R=c[L>>2]|0;if((va|0)==31){wa=0}else{wa=25-(va>>>1)|0}l:do{if((c[R+4>>2]&-8|0)==(sa|0)){xa=R}else{L=R;Z=sa<<wa;while(1){ya=L+16+(Z>>>31<<2)|0;aa=c[ya>>2]|0;if((aa|0)==0){break}if((c[aa+4>>2]&-8|0)==(sa|0)){xa=aa;break l}else{L=aa;Z=Z<<1}}if(ya>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[ya>>2]=W;c[ca+(_+24)>>2]=L;c[ca+(_+12)>>2]=W;c[ca+(_+8)>>2]=W;break j}}}while(0);R=xa+8|0;Z=c[R>>2]|0;J=c[3460]|0;if(xa>>>0>=J>>>0&Z>>>0>=J>>>0){c[Z+12>>2]=W;c[R>>2]=W;c[ca+(_+8)>>2]=Z;c[ca+(_+12)>>2]=xa;c[ca+(_+24)>>2]=0;break}else{Xb();return 0}}}while(0);n=ca+(la|8)|0;return n|0}}while(0);X=ea;_=14272;while(1){za=c[_>>2]|0;if(za>>>0<=X>>>0){Aa=c[_+4>>2]|0;Ba=za+Aa|0;if(Ba>>>0>X>>>0){break}}_=c[_+8>>2]|0}_=za+(Aa-39)|0;if((_&7|0)==0){Ca=0}else{Ca=-_&7}_=za+(Aa-47+Ca)|0;da=_>>>0<(ea+16|0)>>>0?X:_;_=da+8|0;K=ca+8|0;if((K&7|0)==0){Da=0}else{Da=-K&7}K=ba-40-Da|0;c[3462]=ca+Da;c[3459]=K;c[ca+(Da+4)>>2]=K|1;c[ca+(ba-36)>>2]=40;c[3463]=c[3440];c[da+4>>2]=27;c[_>>2]=c[3568];c[_+4>>2]=c[3569];c[_+8>>2]=c[3570];c[_+12>>2]=c[3571];c[3568]=ca;c[3569]=ba;c[3571]=0;c[3570]=_;_=da+28|0;c[_>>2]=7;if((da+32|0)>>>0<Ba>>>0){K=_;while(1){_=K+4|0;c[_>>2]=7;if((K+8|0)>>>0<Ba>>>0){K=_}else{break}}}if((da|0)==(X|0)){break}K=da-ea|0;_=X+(K+4)|0;c[_>>2]=c[_>>2]&-2;c[ea+4>>2]=K|1;c[X+K>>2]=K;_=K>>>3;if(K>>>0<256>>>0){T=_<<1;$=13864+(T<<2)|0;S=c[3456]|0;j=1<<_;do{if((S&j|0)==0){c[3456]=S|j;Ea=$;Fa=13864+(T+2<<2)|0}else{_=13864+(T+2<<2)|0;Z=c[_>>2]|0;if(Z>>>0>=(c[3460]|0)>>>0){Ea=Z;Fa=_;break}Xb();return 0}}while(0);c[Fa>>2]=ea;c[Ea+12>>2]=ea;c[ea+8>>2]=Ea;c[ea+12>>2]=$;break}T=ea;j=K>>>8;do{if((j|0)==0){Ga=0}else{if(K>>>0>16777215>>>0){Ga=31;break}S=(j+1048320|0)>>>16&8;X=j<<S;da=(X+520192|0)>>>16&4;_=X<<da;X=(_+245760|0)>>>16&2;Z=14-(da|S|X)+(_<<X>>>15)|0;Ga=K>>>((Z+7|0)>>>0)&1|Z<<1}}while(0);j=14128+(Ga<<2)|0;c[ea+28>>2]=Ga;c[ea+20>>2]=0;c[ea+16>>2]=0;$=c[3457]|0;Z=1<<Ga;if(($&Z|0)==0){c[3457]=$|Z;c[j>>2]=T;c[ea+24>>2]=j;c[ea+12>>2]=ea;c[ea+8>>2]=ea;break}Z=c[j>>2]|0;if((Ga|0)==31){Ha=0}else{Ha=25-(Ga>>>1)|0}m:do{if((c[Z+4>>2]&-8|0)==(K|0)){Ia=Z}else{j=Z;$=K<<Ha;while(1){Ja=j+16+($>>>31<<2)|0;X=c[Ja>>2]|0;if((X|0)==0){break}if((c[X+4>>2]&-8|0)==(K|0)){Ia=X;break m}else{j=X;$=$<<1}}if(Ja>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[Ja>>2]=T;c[ea+24>>2]=j;c[ea+12>>2]=ea;c[ea+8>>2]=ea;break i}}}while(0);K=Ia+8|0;Z=c[K>>2]|0;$=c[3460]|0;if(Ia>>>0>=$>>>0&Z>>>0>=$>>>0){c[Z+12>>2]=T;c[K>>2]=T;c[ea+8>>2]=Z;c[ea+12>>2]=Ia;c[ea+24>>2]=0;break}else{Xb();return 0}}}while(0);ea=c[3459]|0;if(ea>>>0<=o>>>0){break}Z=ea-o|0;c[3459]=Z;ea=c[3462]|0;K=ea;c[3462]=K+o;c[K+(o+4)>>2]=Z|1;c[ea+4>>2]=o|3;n=ea+8|0;return n|0}}while(0);c[(Pb()|0)>>2]=12;n=0;return n|0}function Xm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[3460]|0;if(b>>>0<e>>>0){Xb()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){Xb()}h=f&-8;i=a+(h-8)|0;j=i;a:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){Xb()}if((n|0)==(c[3461]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[3458]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=13864+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){Xb()}if((c[k+12>>2]|0)==(n|0)){break}Xb()}}while(0);if((s|0)==(k|0)){c[3456]=c[3456]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){Xb()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}Xb()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){Xb()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){Xb()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){Xb()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{Xb()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=14128+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[3457]=c[3457]&~(1<<c[v>>2]);q=n;r=o;break a}else{if(p>>>0<(c[3460]|0)>>>0){Xb()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break a}}}while(0);if(A>>>0<(c[3460]|0)>>>0){Xb()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3460]|0)>>>0){Xb()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[3460]|0)>>>0){Xb()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){Xb()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){Xb()}do{if((e&2|0)==0){if((j|0)==(c[3462]|0)){B=(c[3459]|0)+r|0;c[3459]=B;c[3462]=q;c[q+4>>2]=B|1;if((q|0)!=(c[3461]|0)){return}c[3461]=0;c[3458]=0;return}if((j|0)==(c[3461]|0)){B=(c[3458]|0)+r|0;c[3458]=B;c[3461]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;b:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=13864+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[3460]|0)>>>0){Xb()}if((c[u+12>>2]|0)==(j|0)){break}Xb()}}while(0);if((g|0)==(u|0)){c[3456]=c[3456]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[3460]|0)>>>0){Xb()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}Xb()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[3460]|0)>>>0){Xb()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[3460]|0)>>>0){Xb()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){Xb()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{Xb()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=14128+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[3457]=c[3457]&~(1<<c[t>>2]);break b}else{if(f>>>0<(c[3460]|0)>>>0){Xb()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break b}}}while(0);if(E>>>0<(c[3460]|0)>>>0){Xb()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[3460]|0)>>>0){Xb()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[3460]|0)>>>0){Xb()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[3461]|0)){H=B;break}c[3458]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=13864+(d<<2)|0;A=c[3456]|0;E=1<<r;do{if((A&E|0)==0){c[3456]=A|E;I=e;J=13864+(d+2<<2)|0}else{r=13864+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[3460]|0)>>>0){I=h;J=r;break}Xb()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=14128+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[3457]|0;d=1<<K;c:do{if((r&d|0)==0){c[3457]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{A=c[I>>2]|0;if((K|0)==31){L=0}else{L=25-(K>>>1)|0}d:do{if((c[A+4>>2]&-8|0)==(H|0)){M=A}else{J=A;E=H<<L;while(1){N=J+16+(E>>>31<<2)|0;h=c[N>>2]|0;if((h|0)==0){break}if((c[h+4>>2]&-8|0)==(H|0)){M=h;break d}else{J=h;E=E<<1}}if(N>>>0<(c[3460]|0)>>>0){Xb()}else{c[N>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break c}}}while(0);A=M+8|0;B=c[A>>2]|0;E=c[3460]|0;if(M>>>0>=E>>>0&B>>>0>=E>>>0){c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=M;c[q+24>>2]=0;break}else{Xb()}}}while(0);q=(c[3464]|0)-1|0;c[3464]=q;if((q|0)==0){O=14280}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[3464]=-1;return}function Ym(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=Wm(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(Pb()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=fn(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=Wm(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;nn(f|0,a|0,g>>>0<b>>>0?g:b)|0;Xm(a);d=f;return d|0}function Zm(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0.0,m=0,n=0,o=0,p=0,q=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,S=0,T=0.0,U=0.0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0.0,ja=0.0,ka=0,la=0,ma=0.0,na=0.0,oa=0,pa=0.0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0.0,ya=0,za=0.0,Aa=0,Ba=0.0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0.0,Ia=0,Ja=0.0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,eb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0,sc=0,tc=0,uc=0,vc=0,wc=0,xc=0,yc=0,zc=0,Ac=0,Bc=0,Cc=0,Dc=0,Ec=0,Fc=0,Gc=0,Hc=0,Ic=0,Jc=0,Kc=0,Lc=0.0,Mc=0,Nc=0,Oc=0,Pc=0,Qc=0.0,Rc=0.0,Sc=0.0,Tc=0,Uc=0,Vc=0.0,Wc=0.0,Xc=0.0,Yc=0.0,Zc=0,_c=0,$c=0.0,ad=0,bd=0;g=i;i=i+512|0;h=g|0;if((e|0)==2){j=-1074;k=53}else if((e|0)==1){j=-1074;k=53}else if((e|0)==0){j=-149;k=24}else{l=0.0;i=g;return+l}e=b+4|0;m=b+100|0;do{n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;o=d[n]|0}else{o=$m(b)|0}}while((Ca(o|0)|0)!=0);do{if((o|0)==45|(o|0)==43){n=1-(((o|0)==45)<<1)|0;p=c[e>>2]|0;if(p>>>0<(c[m>>2]|0)>>>0){c[e>>2]=p+1;q=d[p]|0;t=n;break}else{q=$m(b)|0;t=n;break}}else{q=o;t=1}}while(0);o=0;n=q;while(1){if((n|32|0)!=(a[3568+o|0]|0)){u=o;v=n;break}do{if(o>>>0<7>>>0){q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;w=d[q]|0;break}else{w=$m(b)|0;break}}else{w=n}}while(0);q=o+1|0;if(q>>>0<8>>>0){o=q;n=w}else{u=q;v=w;break}}do{if((u|0)==3){x=23}else if((u|0)!=8){w=(f|0)!=0;if(u>>>0>3>>>0&w){if((u|0)==8){break}else{x=23;break}}a:do{if((u|0)==0){n=0;o=v;while(1){if((o|32|0)!=(a[11480+n|0]|0)){y=o;z=n;break a}do{if(n>>>0<2>>>0){q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;A=d[q]|0;break}else{A=$m(b)|0;break}}else{A=o}}while(0);q=n+1|0;if(q>>>0<3>>>0){n=q;o=A}else{y=A;z=q;break}}}else{y=v;z=u}}while(0);if((z|0)==3){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;B=d[o]|0}else{B=$m(b)|0}if((B|0)==40){C=1}else{if((c[m>>2]|0)==0){l=+r;i=g;return+l}c[e>>2]=(c[e>>2]|0)-1;l=+r;i=g;return+l}while(1){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;D=d[o]|0}else{D=$m(b)|0}if(!((D-48|0)>>>0<10>>>0|(D-65|0)>>>0<26>>>0)){if(!((D-97|0)>>>0<26>>>0|(D|0)==95)){break}}C=C+1|0}if((D|0)==41){l=+r;i=g;return+l}o=(c[m>>2]|0)==0;if(!o){c[e>>2]=(c[e>>2]|0)-1}if(!w){c[(Pb()|0)>>2]=22;_m(b,0);l=0.0;i=g;return+l}if((C|0)==0|o){l=+r;i=g;return+l}else{E=C}while(1){o=E-1|0;c[e>>2]=(c[e>>2]|0)-1;if((o|0)==0){l=+r;break}else{E=o}}i=g;return+l}else if((z|0)==0){do{if((y|0)==48){w=c[e>>2]|0;if(w>>>0<(c[m>>2]|0)>>>0){c[e>>2]=w+1;F=d[w]|0}else{F=$m(b)|0}if((F|32|0)!=120){if((c[m>>2]|0)==0){H=48;break}c[e>>2]=(c[e>>2]|0)-1;H=48;break}w=c[e>>2]|0;if(w>>>0<(c[m>>2]|0)>>>0){c[e>>2]=w+1;I=d[w]|0;J=0}else{I=$m(b)|0;J=0}while(1){if((I|0)==46){x=70;break}else if((I|0)!=48){K=I;L=0;M=0;N=0;O=0;P=J;Q=0;S=0;T=1.0;U=0.0;V=0;break}w=c[e>>2]|0;if(w>>>0<(c[m>>2]|0)>>>0){c[e>>2]=w+1;I=d[w]|0;J=1;continue}else{I=$m(b)|0;J=1;continue}}do{if((x|0)==70){w=c[e>>2]|0;if(w>>>0<(c[m>>2]|0)>>>0){c[e>>2]=w+1;W=d[w]|0}else{W=$m(b)|0}if((W|0)==48){X=0;Y=0}else{K=W;L=0;M=0;N=0;O=0;P=J;Q=1;S=0;T=1.0;U=0.0;V=0;break}while(1){w=c[e>>2]|0;if(w>>>0<(c[m>>2]|0)>>>0){c[e>>2]=w+1;Z=d[w]|0}else{Z=$m(b)|0}w=qn(Y,X,-1,-1)|0;o=G;if((Z|0)==48){X=o;Y=w}else{K=Z;L=0;M=0;N=o;O=w;P=1;Q=1;S=0;T=1.0;U=0.0;V=0;break}}}}while(0);b:while(1){w=K-48|0;do{if(w>>>0<10>>>0){_=w;x=83}else{o=K|32;n=(K|0)==46;if(!((o-97|0)>>>0<6>>>0|n)){$=K;break b}if(n){if((Q|0)==0){aa=L;ba=M;da=L;ea=M;fa=P;ga=1;ha=S;ia=T;ja=U;ka=V;break}else{$=46;break b}}else{_=(K|0)>57?o-87|0:w;x=83;break}}}while(0);if((x|0)==83){x=0;w=0;do{if((L|0)<(w|0)|(L|0)==(w|0)&M>>>0<8>>>0){la=S;ma=T;na=U;oa=_+(V<<4)|0}else{o=0;if((L|0)<(o|0)|(L|0)==(o|0)&M>>>0<14>>>0){pa=T*.0625;la=S;ma=pa;na=U+pa*+(_|0);oa=V;break}if((_|0)==0|(S|0)!=0){la=S;ma=T;na=U;oa=V;break}la=1;ma=T;na=U+T*.5;oa=V}}while(0);w=qn(M,L,1,0)|0;aa=G;ba=w;da=N;ea=O;fa=1;ga=Q;ha=la;ia=ma;ja=na;ka=oa}w=c[e>>2]|0;if(w>>>0<(c[m>>2]|0)>>>0){c[e>>2]=w+1;K=d[w]|0;L=aa;M=ba;N=da;O=ea;P=fa;Q=ga;S=ha;T=ia;U=ja;V=ka;continue}else{K=$m(b)|0;L=aa;M=ba;N=da;O=ea;P=fa;Q=ga;S=ha;T=ia;U=ja;V=ka;continue}}if((P|0)==0){w=(c[m>>2]|0)==0;if(!w){c[e>>2]=(c[e>>2]|0)-1}do{if((f|0)==0){_m(b,0)}else{if(w){break}o=c[e>>2]|0;c[e>>2]=o-1;if((Q|0)==0){break}c[e>>2]=o-2}}while(0);l=+(t|0)*0.0;i=g;return+l}w=(Q|0)==0;o=w?M:O;n=w?L:N;w=0;if((L|0)<(w|0)|(L|0)==(w|0)&M>>>0<8>>>0){w=V;q=L;p=M;while(1){qa=w<<4;ra=qn(p,q,1,0)|0;sa=G;ta=0;if((sa|0)<(ta|0)|(sa|0)==(ta|0)&ra>>>0<8>>>0){w=qa;q=sa;p=ra}else{ua=qa;break}}}else{ua=V}do{if(($|32|0)==112){p=hn(b,f)|0;q=G;if(!((p|0)==0&(q|0)==(-2147483648|0))){va=q;wa=p;break}if((f|0)==0){_m(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){va=0;wa=0;break}c[e>>2]=(c[e>>2]|0)-1;va=0;wa=0;break}}else{if((c[m>>2]|0)==0){va=0;wa=0;break}c[e>>2]=(c[e>>2]|0)-1;va=0;wa=0}}while(0);p=qn(o<<2|0>>>30,n<<2|o>>>30,-32,-1)|0;q=qn(p,G,wa,va)|0;p=G;if((ua|0)==0){l=+(t|0)*0.0;i=g;return+l}w=0;if((p|0)>(w|0)|(p|0)==(w|0)&q>>>0>(-j|0)>>>0){c[(Pb()|0)>>2]=34;l=+(t|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}w=j-106|0;qa=(w|0)<0|0?-1:0;if((p|0)<(qa|0)|(p|0)==(qa|0)&q>>>0<w>>>0){c[(Pb()|0)>>2]=34;l=+(t|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((ua|0)>-1){w=ua;pa=U;qa=p;ra=q;while(1){sa=w<<1;if(pa<.5){xa=pa;ya=sa}else{xa=pa+-1.0;ya=sa|1}za=pa+xa;sa=qn(ra,qa,-1,-1)|0;ta=G;if((ya|0)>-1){w=ya;pa=za;qa=ta;ra=sa}else{Aa=ya;Ba=za;Da=ta;Ea=sa;break}}}else{Aa=ua;Ba=U;Da=p;Ea=q}ra=0;qa=rn(32,0,j,(j|0)<0|0?-1:0)|0;w=qn(Ea,Da,qa,G)|0;qa=G;if((ra|0)>(qa|0)|(ra|0)==(qa|0)&k>>>0>w>>>0){qa=w;if((qa|0)<0){Fa=0;x=126}else{Ga=qa;x=124}}else{Ga=k;x=124}do{if((x|0)==124){if((Ga|0)<53){Fa=Ga;x=126;break}Ha=0.0;Ia=Ga;Ja=+(t|0)}}while(0);if((x|0)==126){pa=+(t|0);Ha=+fb(+(+an(1.0,84-Fa|0)),+pa);Ia=Fa;Ja=pa}q=(Ia|0)<32&Ba!=0.0&(Aa&1|0)==0;pa=Ja*(q?0.0:Ba)+(Ha+Ja*+(((q&1)+Aa|0)>>>0>>>0))-Ha;if(pa==0.0){c[(Pb()|0)>>2]=34}l=+bn(pa,Ea);i=g;return+l}else{H=y}}while(0);q=j+k|0;p=-q|0;qa=H;w=0;while(1){if((qa|0)==46){x=137;break}else if((qa|0)!=48){Ka=qa;La=0;Ma=w;Na=0;Oa=0;break}ra=c[e>>2]|0;if(ra>>>0<(c[m>>2]|0)>>>0){c[e>>2]=ra+1;qa=d[ra]|0;w=1;continue}else{qa=$m(b)|0;w=1;continue}}do{if((x|0)==137){qa=c[e>>2]|0;if(qa>>>0<(c[m>>2]|0)>>>0){c[e>>2]=qa+1;Pa=d[qa]|0}else{Pa=$m(b)|0}if((Pa|0)==48){Qa=0;Ra=0}else{Ka=Pa;La=1;Ma=w;Na=0;Oa=0;break}while(1){qa=qn(Ra,Qa,-1,-1)|0;ra=G;o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;Sa=d[o]|0}else{Sa=$m(b)|0}if((Sa|0)==48){Qa=ra;Ra=qa}else{Ka=Sa;La=1;Ma=1;Na=ra;Oa=qa;break}}}}while(0);w=h|0;c[w>>2]=0;qa=Ka-48|0;ra=(Ka|0)==46;c:do{if(qa>>>0<10>>>0|ra){o=h+496|0;n=Na;sa=Oa;ta=0;Ta=0;Ua=0;Va=Ma;Wa=La;Xa=0;Ya=0;Za=Ka;_a=qa;$a=ra;d:while(1){do{if($a){if((Wa|0)==0){ab=Ya;bb=Xa;cb=1;eb=Va;gb=Ua;hb=ta;ib=Ta;jb=ta;kb=Ta}else{break d}}else{lb=qn(Ta,ta,1,0)|0;mb=G;nb=(Za|0)!=48;if((Xa|0)>=125){if(!nb){ab=Ya;bb=Xa;cb=Wa;eb=Va;gb=Ua;hb=mb;ib=lb;jb=n;kb=sa;break}c[o>>2]=c[o>>2]|1;ab=Ya;bb=Xa;cb=Wa;eb=Va;gb=Ua;hb=mb;ib=lb;jb=n;kb=sa;break}ob=h+(Xa<<2)|0;if((Ya|0)==0){pb=_a}else{pb=Za-48+((c[ob>>2]|0)*10|0)|0}c[ob>>2]=pb;ob=Ya+1|0;qb=(ob|0)==9;ab=qb?0:ob;bb=(qb&1)+Xa|0;cb=Wa;eb=1;gb=nb?lb:Ua;hb=mb;ib=lb;jb=n;kb=sa}}while(0);lb=c[e>>2]|0;if(lb>>>0<(c[m>>2]|0)>>>0){c[e>>2]=lb+1;rb=d[lb]|0}else{rb=$m(b)|0}lb=rb-48|0;mb=(rb|0)==46;if(lb>>>0<10>>>0|mb){n=jb;sa=kb;ta=hb;Ta=ib;Ua=gb;Va=eb;Wa=cb;Xa=bb;Ya=ab;Za=rb;_a=lb;$a=mb}else{sb=jb;tb=kb;ub=hb;vb=ib;wb=gb;xb=eb;yb=cb;zb=bb;Ab=ab;Bb=rb;x=160;break c}}Cb=(Va|0)!=0;Db=n;Eb=sa;Fb=ta;Gb=Ta;Hb=Ua;Ib=Xa;Jb=Ya;x=168}else{sb=Na;tb=Oa;ub=0;vb=0;wb=0;xb=Ma;yb=La;zb=0;Ab=0;Bb=Ka;x=160}}while(0);do{if((x|0)==160){ra=(yb|0)==0;qa=ra?vb:tb;$a=ra?ub:sb;ra=(xb|0)!=0;if(!(ra&(Bb|32|0)==101)){if((Bb|0)>-1){Cb=ra;Db=$a;Eb=qa;Fb=ub;Gb=vb;Hb=wb;Ib=zb;Jb=Ab;x=168;break}else{Kb=$a;Lb=qa;Mb=ra;Nb=ub;Ob=vb;Qb=wb;Rb=zb;Sb=Ab;x=170;break}}ra=hn(b,f)|0;_a=G;do{if((ra|0)==0&(_a|0)==(-2147483648|0)){if((f|0)==0){_m(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){Tb=0;Ub=0;break}c[e>>2]=(c[e>>2]|0)-1;Tb=0;Ub=0;break}}else{Tb=_a;Ub=ra}}while(0);ra=qn(Ub,Tb,qa,$a)|0;Vb=G;Wb=ra;Xb=ub;Yb=vb;Zb=wb;_b=zb;$b=Ab}}while(0);do{if((x|0)==168){if((c[m>>2]|0)==0){Kb=Db;Lb=Eb;Mb=Cb;Nb=Fb;Ob=Gb;Qb=Hb;Rb=Ib;Sb=Jb;x=170;break}c[e>>2]=(c[e>>2]|0)-1;if(Cb){Vb=Db;Wb=Eb;Xb=Fb;Yb=Gb;Zb=Hb;_b=Ib;$b=Jb}else{x=171}}}while(0);if((x|0)==170){if(Mb){Vb=Kb;Wb=Lb;Xb=Nb;Yb=Ob;Zb=Qb;_b=Rb;$b=Sb}else{x=171}}if((x|0)==171){c[(Pb()|0)>>2]=22;_m(b,0);l=0.0;i=g;return+l}ra=c[w>>2]|0;if((ra|0)==0){l=+(t|0)*0.0;i=g;return+l}_a=0;do{if((Wb|0)==(Yb|0)&(Vb|0)==(Xb|0)&((Xb|0)<(_a|0)|(Xb|0)==(_a|0)&Yb>>>0<10>>>0)){if(!(k>>>0>30>>>0|(ra>>>(k>>>0)|0)==0)){break}l=+(t|0)*+(ra>>>0>>>0);i=g;return+l}}while(0);ra=(j|0)/-2|0;_a=(ra|0)<0|0?-1:0;if((Vb|0)>(_a|0)|(Vb|0)==(_a|0)&Wb>>>0>ra>>>0){c[(Pb()|0)>>2]=34;l=+(t|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}ra=j-106|0;_a=(ra|0)<0|0?-1:0;if((Vb|0)<(_a|0)|(Vb|0)==(_a|0)&Wb>>>0<ra>>>0){c[(Pb()|0)>>2]=34;l=+(t|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if(($b|0)==0){ac=_b}else{if(($b|0)<9){ra=h+(_b<<2)|0;_a=$b;Ya=c[ra>>2]|0;do{Ya=Ya*10|0;_a=_a+1|0;}while((_a|0)<9);c[ra>>2]=Ya}ac=_b+1|0}_a=Wb;do{if((Zb|0)<9){if(!((Zb|0)<=(_a|0)&(_a|0)<18)){break}if((_a|0)==9){l=+(t|0)*+((c[w>>2]|0)>>>0>>>0);i=g;return+l}if((_a|0)<9){l=+(t|0)*+((c[w>>2]|0)>>>0>>>0)/+(c[1920+(8-_a<<2)>>2]|0);i=g;return+l}Xa=k+27+(_a*-3|0)|0;Ua=c[w>>2]|0;if(!((Xa|0)>30|(Ua>>>(Xa>>>0)|0)==0)){break}l=+(t|0)*+(Ua>>>0>>>0)*+(c[1920+(_a-10<<2)>>2]|0);i=g;return+l}}while(0);w=(_a|0)%9|0;if((w|0)==0){bc=0;cc=ac;dc=0;ec=_a}else{Ya=(_a|0)>-1?w:w+9|0;w=c[1920+(8-Ya<<2)>>2]|0;do{if((ac|0)==0){fc=0;gc=0;hc=_a}else{ra=1e9/(w|0)|0;Ua=_a;Xa=0;Ta=0;ta=0;while(1){sa=h+(Ta<<2)|0;n=c[sa>>2]|0;Va=((n>>>0)/(w>>>0)|0)+ta|0;c[sa>>2]=Va;ic=ca((n>>>0)%(w>>>0)|0,ra)|0;n=Ta+1|0;if((Ta|0)==(Xa|0)&(Va|0)==0){jc=n&127;kc=Ua-9|0}else{jc=Xa;kc=Ua}if((n|0)==(ac|0)){break}else{Ua=kc;Xa=jc;Ta=n;ta=ic}}if((ic|0)==0){fc=ac;gc=jc;hc=kc;break}c[h+(ac<<2)>>2]=ic;fc=ac+1|0;gc=jc;hc=kc}}while(0);bc=gc;cc=fc;dc=0;ec=9-Ya+hc|0}e:while(1){w=h+(bc<<2)|0;if((ec|0)<18){_a=cc;ta=dc;while(1){Ta=0;Xa=_a+127|0;Ua=_a;while(1){ra=Xa&127;$a=h+(ra<<2)|0;qa=c[$a>>2]|0;n=qn(qa<<29|0>>>3,0<<29|qa>>>3,Ta,0)|0;qa=G;Va=0;if(qa>>>0>Va>>>0|qa>>>0==Va>>>0&n>>>0>1e9>>>0){Va=Bn(n,qa,1e9,0)|0;sa=Cn(n,qa,1e9,0)|0;lc=Va;mc=sa}else{lc=0;mc=n}c[$a>>2]=mc;$a=(ra|0)==(bc|0);if((ra|0)!=(Ua+127&127|0)|$a){nc=Ua}else{nc=(mc|0)==0?ra:Ua}if($a){break}else{Ta=lc;Xa=ra-1|0;Ua=nc}}Ua=ta-29|0;if((lc|0)==0){_a=nc;ta=Ua}else{oc=Ua;pc=nc;qc=lc;break}}}else{if((ec|0)==18){rc=cc;sc=dc}else{tc=bc;uc=cc;vc=dc;wc=ec;break}while(1){if((c[w>>2]|0)>>>0>=9007199>>>0){tc=bc;uc=rc;vc=sc;wc=18;break e}ta=0;_a=rc+127|0;Ua=rc;while(1){Xa=_a&127;Ta=h+(Xa<<2)|0;ra=c[Ta>>2]|0;$a=qn(ra<<29|0>>>3,0<<29|ra>>>3,ta,0)|0;ra=G;n=0;if(ra>>>0>n>>>0|ra>>>0==n>>>0&$a>>>0>1e9>>>0){n=Bn($a,ra,1e9,0)|0;sa=Cn($a,ra,1e9,0)|0;xc=n;yc=sa}else{xc=0;yc=$a}c[Ta>>2]=yc;Ta=(Xa|0)==(bc|0);if((Xa|0)!=(Ua+127&127|0)|Ta){zc=Ua}else{zc=(yc|0)==0?Xa:Ua}if(Ta){break}else{ta=xc;_a=Xa-1|0;Ua=zc}}Ua=sc-29|0;if((xc|0)==0){rc=zc;sc=Ua}else{oc=Ua;pc=zc;qc=xc;break}}}w=bc+127&127;if((w|0)==(pc|0)){Ua=pc+127&127;_a=h+((pc+126&127)<<2)|0;c[_a>>2]=c[_a>>2]|c[h+(Ua<<2)>>2];Ac=Ua}else{Ac=pc}c[h+(w<<2)>>2]=qc;bc=w;cc=Ac;dc=oc;ec=ec+9|0}f:while(1){Bc=uc+1&127;Ya=h+((uc+127&127)<<2)|0;w=tc;Ua=vc;_a=wc;while(1){ta=(_a|0)==18;Xa=(_a|0)>27?9:1;Cc=w;Dc=Ua;while(1){Ta=0;while(1){$a=Ta+Cc&127;if(($a|0)==(uc|0)){Ec=2;break}sa=c[h+($a<<2)>>2]|0;$a=c[1912+(Ta<<2)>>2]|0;if(sa>>>0<$a>>>0){Ec=2;break}n=Ta+1|0;if(sa>>>0>$a>>>0){Ec=Ta;break}if((n|0)<2){Ta=n}else{Ec=n;break}}if((Ec|0)==2&ta){break f}Fc=Xa+Dc|0;if((Cc|0)==(uc|0)){Cc=uc;Dc=Fc}else{break}}ta=(1<<Xa)-1|0;Ta=1e9>>>(Xa>>>0);Gc=_a;Hc=Cc;n=Cc;Ic=0;do{$a=h+(n<<2)|0;sa=c[$a>>2]|0;ra=(sa>>>(Xa>>>0))+Ic|0;c[$a>>2]=ra;Ic=ca(sa&ta,Ta)|0;sa=(n|0)==(Hc|0)&(ra|0)==0;n=n+1&127;Gc=sa?Gc-9|0:Gc;Hc=sa?n:Hc;}while((n|0)!=(uc|0));if((Ic|0)==0){w=Hc;Ua=Fc;_a=Gc;continue}if((Bc|0)!=(Hc|0)){break}c[Ya>>2]=c[Ya>>2]|1;w=Hc;Ua=Fc;_a=Gc}c[h+(uc<<2)>>2]=Ic;tc=Hc;uc=Bc;vc=Fc;wc=Gc}_a=Cc&127;if((_a|0)==(uc|0)){c[h+(Bc-1<<2)>>2]=0;Jc=Bc}else{Jc=uc}pa=+((c[h+(_a<<2)>>2]|0)>>>0>>>0);_a=Cc+1&127;if((_a|0)==(Jc|0)){Ua=Jc+1&127;c[h+(Ua-1<<2)>>2]=0;Kc=Ua}else{Kc=Jc}za=+(t|0);Lc=za*(pa*1.0e9+ +((c[h+(_a<<2)>>2]|0)>>>0>>>0));_a=Dc+53|0;Ua=_a-j|0;if((Ua|0)<(k|0)){if((Ua|0)<0){Mc=1;Nc=0;x=244}else{Oc=Ua;Pc=1;x=243}}else{Oc=k;Pc=0;x=243}if((x|0)==243){if((Oc|0)<53){Mc=Pc;Nc=Oc;x=244}else{Qc=0.0;Rc=0.0;Sc=Lc;Tc=Pc;Uc=Oc}}if((x|0)==244){pa=+fb(+(+an(1.0,105-Nc|0)),+Lc);Vc=+db(+Lc,+(+an(1.0,53-Nc|0)));Qc=pa;Rc=Vc;Sc=pa+(Lc-Vc);Tc=Mc;Uc=Nc}w=Cc+2&127;do{if((w|0)==(Kc|0)){Wc=Rc}else{Ya=c[h+(w<<2)>>2]|0;do{if(Ya>>>0<5e8>>>0){if((Ya|0)==0){if((Cc+3&127|0)==(Kc|0)){Xc=Rc;break}}Xc=za*.25+Rc}else{if(Ya>>>0>5e8>>>0){Xc=za*.75+Rc;break}if((Cc+3&127|0)==(Kc|0)){Xc=za*.5+Rc;break}else{Xc=za*.75+Rc;break}}}while(0);if((53-Uc|0)<=1){Wc=Xc;break}if(+db(+Xc,+1.0)!=0.0){Wc=Xc;break}Wc=Xc+1.0}}while(0);za=Sc+Wc-Qc;do{if((_a&2147483647|0)>(-2-q|0)){if(+R(+za)<9007199254740992.0){Yc=za;Zc=Tc;_c=Dc}else{Yc=za*.5;Zc=(Tc|0)!=0&(Uc|0)==(Ua|0)?0:Tc;_c=Dc+1|0}if((_c+50|0)<=(p|0)){if(!((Zc|0)!=0&Wc!=0.0)){$c=Yc;ad=_c;break}}c[(Pb()|0)>>2]=34;$c=Yc;ad=_c}else{$c=za;ad=Dc}}while(0);l=+bn($c,ad);i=g;return+l}else{if((c[m>>2]|0)!=0){c[e>>2]=(c[e>>2]|0)-1}c[(Pb()|0)>>2]=22;_m(b,0);l=0.0;i=g;return+l}}}while(0);do{if((x|0)==23){b=(c[m>>2]|0)==0;if(!b){c[e>>2]=(c[e>>2]|0)-1}if(u>>>0<4>>>0|(f|0)==0|b){break}else{bd=u}do{c[e>>2]=(c[e>>2]|0)-1;bd=bd-1|0;}while(bd>>>0>3>>>0)}}while(0);l=+(t|0)*s;i=g;return+l}function _m(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a+104>>2]=b;d=c[a+8>>2]|0;e=c[a+4>>2]|0;f=d-e|0;c[a+108>>2]=f;if((b|0)!=0&(f|0)>(b|0)){c[a+100>>2]=e+b;return}else{c[a+100>>2]=d;return}}function $m(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=b+104|0;f=c[e>>2]|0;if((f|0)==0){g=3}else{if((c[b+108>>2]|0)<(f|0)){g=3}}do{if((g|0)==3){f=dn(b)|0;if((f|0)<0){break}h=c[e>>2]|0;i=c[b+8>>2]|0;do{if((h|0)==0){g=8}else{j=c[b+4>>2]|0;k=h-(c[b+108>>2]|0)-1|0;if((i-j|0)<=(k|0)){g=8;break}c[b+100>>2]=j+k}}while(0);if((g|0)==8){c[b+100>>2]=i}h=c[b+4>>2]|0;if((i|0)!=0){k=b+108|0;c[k>>2]=i+1-h+(c[k>>2]|0)}k=h-1|0;if((d[k]|0|0)==(f|0)){l=f;return l|0}a[k]=f;l=f;return l|0}}while(0);c[b+100>>2]=0;l=-1;return l|0}function an(a,b){a=+a;b=b|0;var d=0.0,e=0,f=0.0,g=0;do{if((b|0)>1023){d=a*8.98846567431158e+307;e=b-1023|0;if((e|0)<=1023){f=d;g=e;break}e=b-2046|0;f=d*8.98846567431158e+307;g=(e|0)>1023?1023:e}else{if((b|0)>=-1022){f=a;g=b;break}d=a*2.2250738585072014e-308;e=b+1022|0;if((e|0)>=-1022){f=d;g=e;break}e=b+2044|0;f=d*2.2250738585072014e-308;g=(e|0)<-1022?-1022:e}}while(0);return+(f*(c[k>>2]=0<<20|0>>>12,c[k+4>>2]=g+1023<<20|0>>>12,+h[k>>3]))}function bn(a,b){a=+a;b=b|0;return+(+an(a,b))}function cn(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=b+74|0;e=a[d]|0;a[d]=e-1&255|e;e=b+20|0;d=b+44|0;if((c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){Ec[c[b+36>>2]&63](b,0,0)|0}c[b+16>>2]=0;c[b+28>>2]=0;c[e>>2]=0;e=b|0;f=c[e>>2]|0;if((f&20|0)==0){g=c[d>>2]|0;c[b+8>>2]=g;c[b+4>>2]=g;h=0;return h|0}if((f&4|0)==0){h=-1;return h|0}c[e>>2]=f|32;h=-1;return h|0}function dn(a){a=a|0;var b=0,e=0,f=0,g=0;b=i;i=i+8|0;e=b|0;if((c[a+8>>2]|0)==0){if((cn(a)|0)==0){f=3}else{g=-1}}else{f=3}do{if((f|0)==3){if((Ec[c[a+32>>2]&63](a,e,1)|0)!=1){g=-1;break}g=d[e]|0}}while(0);i=b;return g|0}function en(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0.0,j=0,k=0,l=0,m=0;d=i;i=i+112|0;e=d|0;mn(e|0,0,112)|0;f=e+4|0;c[f>>2]=a;g=e+8|0;c[g>>2]=-1;c[e+44>>2]=a;c[e+76>>2]=-1;_m(e,0);h=+Zm(e,1,1);j=(c[f>>2]|0)-(c[g>>2]|0)+(c[e+108>>2]|0)|0;if((b|0)==0){k=112;l=0;i=d;return+h}if((j|0)==0){m=a}else{m=a+j|0}c[b>>2]=m;k=112;l=0;i=d;return+h}function fn(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[3460]|0;k=e&3;if(!((k|0)!=1&g>>>0>=j>>>0&g>>>0<h>>>0)){Xb();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){Xb();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[3438]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15>>>0){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;gn(g+b|0,k);n=a;return n|0}if((i|0)==(c[3462]|0)){k=(c[3459]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[3462]=g+b;c[3459]=l;n=a;return n|0}if((i|0)==(c[3461]|0)){l=(c[3458]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[3458]=q;c[3461]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;a:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=13864+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){Xb();return 0}if((c[l+12>>2]|0)==(i|0)){break}Xb();return 0}}while(0);if((k|0)==(l|0)){c[3456]=c[3456]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){Xb();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}Xb();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){Xb();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){Xb();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){Xb();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{Xb();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=14128+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3457]=c[3457]&~(1<<c[t>>2]);break a}else{if(s>>>0<(c[3460]|0)>>>0){Xb();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break a}}}while(0);if(y>>>0<(c[3460]|0)>>>0){Xb();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[3460]|0)>>>0){Xb();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;gn(g+b|0,q);n=a;return n|0}return 0}function gn(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;a:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[3460]|0;if(i>>>0<l>>>0){Xb()}if((j|0)==(c[3461]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[3458]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=13864+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){Xb()}if((c[p+12>>2]|0)==(j|0)){break}Xb()}}while(0);if((q|0)==(p|0)){c[3456]=c[3456]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){Xb()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}Xb()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){Xb()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){Xb()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){Xb()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{Xb()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=14128+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3457]=c[3457]&~(1<<c[t>>2]);n=j;o=k;break a}else{if(m>>>0<(c[3460]|0)>>>0){Xb()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break a}}}while(0);if(y>>>0<(c[3460]|0)>>>0){Xb()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3460]|0)>>>0){Xb()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[3460]|0)>>>0){Xb()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[3460]|0;if(e>>>0<a>>>0){Xb()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[3462]|0)){A=(c[3459]|0)+o|0;c[3459]=A;c[3462]=n;c[n+4>>2]=A|1;if((n|0)!=(c[3461]|0)){return}c[3461]=0;c[3458]=0;return}if((f|0)==(c[3461]|0)){A=(c[3458]|0)+o|0;c[3458]=A;c[3461]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;b:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=13864+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){Xb()}if((c[g+12>>2]|0)==(f|0)){break}Xb()}}while(0);if((t|0)==(g|0)){c[3456]=c[3456]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){Xb()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}Xb()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){Xb()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){Xb()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){Xb()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{Xb()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=14128+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[3457]=c[3457]&~(1<<c[l>>2]);break b}else{if(m>>>0<(c[3460]|0)>>>0){Xb()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break b}}}while(0);if(C>>>0<(c[3460]|0)>>>0){Xb()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[3460]|0)>>>0){Xb()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[3460]|0)>>>0){Xb()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[3461]|0)){F=A;break}c[3458]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=13864+(z<<2)|0;C=c[3456]|0;b=1<<o;do{if((C&b|0)==0){c[3456]=C|b;G=y;H=13864+(z+2<<2)|0}else{o=13864+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[3460]|0)>>>0){G=d;H=o;break}Xb()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=14128+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[3457]|0;z=1<<I;if((o&z|0)==0){c[3457]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}z=c[G>>2]|0;if((I|0)==31){J=0}else{J=25-(I>>>1)|0}c:do{if((c[z+4>>2]&-8|0)==(F|0)){K=z}else{I=z;G=F<<J;while(1){L=I+16+(G>>>31<<2)|0;o=c[L>>2]|0;if((o|0)==0){break}if((c[o+4>>2]&-8|0)==(F|0)){K=o;break c}else{I=o;G=G<<1}}if(L>>>0<(c[3460]|0)>>>0){Xb()}c[L>>2]=y;c[n+24>>2]=I;c[n+12>>2]=n;c[n+8>>2]=n;return}}while(0);L=K+8|0;F=c[L>>2]|0;J=c[3460]|0;if(!(K>>>0>=J>>>0&F>>>0>=J>>>0)){Xb()}c[F+12>>2]=y;c[L>>2]=y;c[n+8>>2]=F;c[n+12>>2]=K;c[n+24>>2]=0;return}function hn(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=a+4|0;f=c[e>>2]|0;g=a+100|0;if(f>>>0<(c[g>>2]|0)>>>0){c[e>>2]=f+1;h=d[f]|0}else{h=$m(a)|0}do{if((h|0)==45|(h|0)==43){f=c[e>>2]|0;i=(h|0)==45|0;if(f>>>0<(c[g>>2]|0)>>>0){c[e>>2]=f+1;j=d[f]|0}else{j=$m(a)|0}if(!((j-48|0)>>>0>9>>>0&(b|0)!=0)){k=i;l=j;break}if((c[g>>2]|0)==0){k=i;l=j;break}c[e>>2]=(c[e>>2]|0)-1;k=i;l=j}else{k=0;l=h}}while(0);if((l-48|0)>>>0>9>>>0){if((c[g>>2]|0)==0){m=-2147483648;n=0;return(G=m,n)|0}c[e>>2]=(c[e>>2]|0)-1;m=-2147483648;n=0;return(G=m,n)|0}else{o=l;p=0}while(1){q=o-48+(p*10|0)|0;l=c[e>>2]|0;if(l>>>0<(c[g>>2]|0)>>>0){c[e>>2]=l+1;r=d[l]|0}else{r=$m(a)|0}if((r-48|0)>>>0<10>>>0&(q|0)<214748364){o=r;p=q}else{break}}p=q;o=(q|0)<0|0?-1:0;if((r-48|0)>>>0<10>>>0){q=r;l=o;h=p;while(1){j=An(h,l,10,0)|0;b=G;i=qn(q,(q|0)<0|0?-1:0,-48,-1)|0;f=qn(i,G,j,b)|0;b=G;j=c[e>>2]|0;if(j>>>0<(c[g>>2]|0)>>>0){c[e>>2]=j+1;s=d[j]|0}else{s=$m(a)|0}j=21474836;if((s-48|0)>>>0<10>>>0&((b|0)<(j|0)|(b|0)==(j|0)&f>>>0<2061584302>>>0)){q=s;l=b;h=f}else{t=s;u=b;v=f;break}}}else{t=r;u=o;v=p}if((t-48|0)>>>0<10>>>0){do{t=c[e>>2]|0;if(t>>>0<(c[g>>2]|0)>>>0){c[e>>2]=t+1;w=d[t]|0}else{w=$m(a)|0}}while((w-48|0)>>>0<10>>>0)}if((c[g>>2]|0)!=0){c[e>>2]=(c[e>>2]|0)-1}e=(k|0)!=0;k=rn(0,0,v,u)|0;m=e?G:u;n=e?k:v;return(G=m,n)|0}function jn(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function kn(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;v=v+1|0;c[a>>2]=v;while((e|0)<40){if((c[d+(e<<2)>>2]|0)==0){c[d+(e<<2)>>2]=v;c[d+((e<<2)+4)>>2]=b;c[d+((e<<2)+8)>>2]=0;return 0}e=e+2|0}nb(116);nb(111);nb(111);nb(32);nb(109);nb(97);nb(110);nb(121);nb(32);nb(115);nb(101);nb(116);nb(106);nb(109);nb(112);nb(115);nb(32);nb(105);nb(110);nb(32);nb(97);nb(32);nb(102);nb(117);nb(110);nb(99);nb(116);nb(105);nb(111);nb(110);nb(32);nb(99);nb(97);nb(108);nb(108);nb(44);nb(32);nb(98);nb(117);nb(105);nb(108);nb(100);nb(32);nb(119);nb(105);nb(116);nb(104);nb(32);nb(97);nb(32);nb(104);nb(105);nb(103);nb(104);nb(101);nb(114);nb(32);nb(118);nb(97);nb(108);nb(117);nb(101);nb(32);nb(102);nb(111);nb(114);nb(32);nb(77);nb(65);nb(88);nb(95);nb(83);nb(69);nb(84);nb(74);nb(77);nb(80);nb(83);nb(10);da(0);return 0}function ln(a,b){a=a|0;b=b|0;var d=0,e=0;while((d|0)<20){e=c[b+(d<<2)>>2]|0;if((e|0)==0)break;if((e|0)==(a|0)){return c[b+((d<<2)+4)>>2]|0}d=d+2|0}return 0}function mn(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function nn(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function on(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0;while((e|0)<(c|0)){f=d[a+e|0]|0;g=d[b+e|0]|0;if((f|0)!=(g|0))return((f|0)>(g|0)?1:-1)|0;e=e+1|0}return 0}function pn(a){a=a|0;if((a|0)<65)return a|0;if((a|0)>90)return a|0;return a-65+97|0}function qn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(G=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function rn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(G=e,a-c>>>0|0)|0}function sn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){G=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}G=a<<c-32;return 0}function tn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){G=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}G=0;return b>>>c-32|0}function un(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){G=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}G=(b|0)<0?-1:0;return b>>c-32|0}function vn(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function wn(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function xn(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=ca(d,c)|0;f=a>>>16;a=(e>>>16)+(ca(d,f)|0)|0;d=b>>>16;b=ca(d,c)|0;return(G=(a>>>16)+(ca(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function yn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=rn(e^a,f^b,e,f)|0;b=G;a=g^e;e=h^f;f=rn((Dn(i,b,rn(g^c,h^d,g,h)|0,G,0)|0)^a,G^e,a,e)|0;return(G=G,f)|0}function zn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=rn(h^a,j^b,h,j)|0;b=G;Dn(m,b,rn(k^d,l^e,k,l)|0,G,g)|0;l=rn(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=G;i=f;return(G=j,l)|0}function An(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=xn(e,a)|0;f=G;return(G=(ca(b,a)|0)+(ca(d,e)|0)+f|f&0,c|0|0)|0}function Bn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=Dn(a,b,c,d,0)|0;return(G=G,e)|0}function Cn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;Dn(a,b,d,e,g)|0;i=f;return(G=c[g+4>>2]|0,c[g>>2]|0)|0}function Dn(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(G=n,o)|0}else{if(!m){n=0;o=0;return(G=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(G=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(G=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(G=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((wn(l|0)|0)>>>0);return(G=n,o)|0}p=(vn(l|0)|0)-(vn(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(G=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(G=n,o)|0}else{if(!m){r=(vn(l|0)|0)-(vn(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(G=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(G=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(vn(j|0)|0)+33-(vn(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(G=n,o)|0}else{p=wn(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(G=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;F=0;H=0}else{g=d|0|0;d=k|e&0;e=qn(g,d,-1,-1)|0;k=G;i=w;w=v;v=u;u=t;t=s;s=0;while(1){I=w>>>31|i<<1;J=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;rn(e,k,j,a)|0;b=G;h=b>>31|((b|0)<0?-1:0)<<1;K=h&1;L=rn(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=G;b=t-1|0;if((b|0)==0){break}else{i=I;w=J;v=M;u=L;t=b;s=K}}B=I;C=J;D=M;E=L;F=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(K|0)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|F;o=(K<<1|0>>>31)&-2|H;return(G=n,o)|0}function En(a,b){a=a|0;b=b|0;return Ac[a&511](b|0)|0}function Fn(a){a=a|0;return ia(0,a|0)|0}function Gn(a){a=a|0;return ia(1,a|0)|0}function Hn(a){a=a|0;return ia(2,a|0)|0}function In(a){a=a|0;return ia(3,a|0)|0}function Jn(a){a=a|0;return ia(4,a|0)|0}function Kn(a){a=a|0;return ia(5,a|0)|0}function Ln(a){a=a|0;return ia(6,a|0)|0}function Mn(a){a=a|0;return ia(7,a|0)|0}function Nn(a){a=a|0;return ia(8,a|0)|0}function On(a){a=a|0;return ia(9,a|0)|0}function Pn(a){a=a|0;return ia(10,a|0)|0}function Qn(a){a=a|0;return ia(11,a|0)|0}function Rn(a){a=a|0;return ia(12,a|0)|0}function Sn(a){a=a|0;return ia(13,a|0)|0}function Tn(a){a=a|0;return ia(14,a|0)|0}function Un(a){a=a|0;return ia(15,a|0)|0}function Vn(a,b){a=a|0;b=b|0;Bc[a&63](b|0)}function Wn(a){a=a|0;ia(0,a|0)}function Xn(a){a=a|0;ia(1,a|0)}function Yn(a){a=a|0;ia(2,a|0)}function Zn(a){a=a|0;ia(3,a|0)}function _n(a){a=a|0;ia(4,a|0)}function $n(a){a=a|0;ia(5,a|0)}function ao(a){a=a|0;ia(6,a|0)}function bo(a){a=a|0;ia(7,a|0)}function co(a){a=a|0;ia(8,a|0)}function eo(a){a=a|0;ia(9,a|0)}function fo(a){a=a|0;ia(10,a|0)}function go(a){a=a|0;ia(11,a|0)}function ho(a){a=a|0;ia(12,a|0)}function io(a){a=a|0;ia(13,a|0)}function jo(a){a=a|0;ia(14,a|0)}function ko(a){a=a|0;ia(15,a|0)}function lo(a,b,c){a=a|0;b=b|0;c=c|0;Cc[a&63](b|0,c|0)}function mo(a,b){a=a|0;b=b|0;ia(0,a|0,b|0)}function no(a,b){a=a|0;b=b|0;ia(1,a|0,b|0)}function oo(a,b){a=a|0;b=b|0;ia(2,a|0,b|0)}function po(a,b){a=a|0;b=b|0;ia(3,a|0,b|0)}function qo(a,b){a=a|0;b=b|0;ia(4,a|0,b|0)}function ro(a,b){a=a|0;b=b|0;ia(5,a|0,b|0)}function so(a,b){a=a|0;b=b|0;ia(6,a|0,b|0)}function to(a,b){a=a|0;b=b|0;ia(7,a|0,b|0)}function uo(a,b){a=a|0;b=b|0;ia(8,a|0,b|0)}function vo(a,b){a=a|0;b=b|0;ia(9,a|0,b|0)}function wo(a,b){a=a|0;b=b|0;ia(10,a|0,b|0)}function xo(a,b){a=a|0;b=b|0;ia(11,a|0,b|0)}function yo(a,b){a=a|0;b=b|0;ia(12,a|0,b|0)}function zo(a,b){a=a|0;b=b|0;ia(13,a|0,b|0)}function Ao(a,b){a=a|0;b=b|0;ia(14,a|0,b|0)}function Bo(a,b){a=a|0;b=b|0;ia(15,a|0,b|0)}function Co(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return Dc[a&63](b|0,c|0,d|0,e|0)|0}function Do(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(0,a|0,b|0,c|0,d|0)|0}function Eo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(1,a|0,b|0,c|0,d|0)|0}function Fo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(2,a|0,b|0,c|0,d|0)|0}function Go(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(3,a|0,b|0,c|0,d|0)|0}function Ho(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(4,a|0,b|0,c|0,d|0)|0}function Io(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(5,a|0,b|0,c|0,d|0)|0}function Jo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(6,a|0,b|0,c|0,d|0)|0}function Ko(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(7,a|0,b|0,c|0,d|0)|0}function Lo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(8,a|0,b|0,c|0,d|0)|0}function Mo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(9,a|0,b|0,c|0,d|0)|0}function No(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(10,a|0,b|0,c|0,d|0)|0}function Oo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(11,a|0,b|0,c|0,d|0)|0}function Po(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(12,a|0,b|0,c|0,d|0)|0}function Qo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(13,a|0,b|0,c|0,d|0)|0}function Ro(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(14,a|0,b|0,c|0,d|0)|0}function So(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ia(15,a|0,b|0,c|0,d|0)|0}function To(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return Ec[a&63](b|0,c|0,d|0)|0}function Uo(a,b,c){a=a|0;b=b|0;c=c|0;return ia(0,a|0,b|0,c|0)|0}function Vo(a,b,c){a=a|0;b=b|0;c=c|0;return ia(1,a|0,b|0,c|0)|0}function Wo(a,b,c){a=a|0;b=b|0;c=c|0;return ia(2,a|0,b|0,c|0)|0}function Xo(a,b,c){a=a|0;b=b|0;c=c|0;return ia(3,a|0,b|0,c|0)|0}function Yo(a,b,c){a=a|0;b=b|0;c=c|0;return ia(4,a|0,b|0,c|0)|0}function Zo(a,b,c){a=a|0;b=b|0;c=c|0;return ia(5,a|0,b|0,c|0)|0}function _o(a,b,c){a=a|0;b=b|0;c=c|0;return ia(6,a|0,b|0,c|0)|0}function $o(a,b,c){a=a|0;b=b|0;c=c|0;return ia(7,a|0,b|0,c|0)|0}function ap(a,b,c){a=a|0;b=b|0;c=c|0;return ia(8,a|0,b|0,c|0)|0}function bp(a,b,c){a=a|0;b=b|0;c=c|0;return ia(9,a|0,b|0,c|0)|0}function cp(a,b,c){a=a|0;b=b|0;c=c|0;return ia(10,a|0,b|0,c|0)|0}function dp(a,b,c){a=a|0;b=b|0;c=c|0;return ia(11,a|0,b|0,c|0)|0}function ep(a,b,c){a=a|0;b=b|0;c=c|0;return ia(12,a|0,b|0,c|0)|0}function fp(a,b,c){a=a|0;b=b|0;c=c|0;return ia(13,a|0,b|0,c|0)|0}function gp(a,b,c){a=a|0;b=b|0;c=c|0;return ia(14,a|0,b|0,c|0)|0}function hp(a,b,c){a=a|0;b=b|0;c=c|0;return ia(15,a|0,b|0,c|0)|0}function ip(a){a=a|0;Fc[a&63]()}function jp(){ia(0)}function kp(){ia(1)}function lp(){ia(2)}function mp(){ia(3)}function np(){ia(4)}function op(){ia(5)}function pp(){ia(6)}function qp(){ia(7)}function rp(){ia(8)}function sp(){ia(9)}function tp(){ia(10)}function up(){ia(11)}function vp(){ia(12)}function wp(){ia(13)}function xp(){ia(14)}function yp(){ia(15)}function zp(a,b,c){a=a|0;b=b|0;c=c|0;return Gc[a&63](b|0,c|0)|0}function Ap(a,b){a=a|0;b=b|0;return ia(0,a|0,b|0)|0}function Bp(a,b){a=a|0;b=b|0;return ia(1,a|0,b|0)|0}function Cp(a,b){a=a|0;b=b|0;return ia(2,a|0,b|0)|0}function Dp(a,b){a=a|0;b=b|0;return ia(3,a|0,b|0)|0}function Ep(a,b){a=a|0;b=b|0;return ia(4,a|0,b|0)|0}function Fp(a,b){a=a|0;b=b|0;return ia(5,a|0,b|0)|0}function Gp(a,b){a=a|0;b=b|0;return ia(6,a|0,b|0)|0}function Hp(a,b){a=a|0;b=b|0;return ia(7,a|0,b|0)|0}function Ip(a,b){a=a|0;b=b|0;return ia(8,a|0,b|0)|0}function Jp(a,b){a=a|0;b=b|0;return ia(9,a|0,b|0)|0}function Kp(a,b){a=a|0;b=b|0;return ia(10,a|0,b|0)|0}function Lp(a,b){a=a|0;b=b|0;return ia(11,a|0,b|0)|0}function Mp(a,b){a=a|0;b=b|0;return ia(12,a|0,b|0)|0}function Np(a,b){a=a|0;b=b|0;return ia(13,a|0,b|0)|0}function Op(a,b){a=a|0;b=b|0;return ia(14,a|0,b|0)|0}function Pp(a,b){a=a|0;b=b|0;return ia(15,a|0,b|0)|0}function Qp(a){a=a|0;da(0);return 0}function Rp(a){a=a|0;da(1)}function Sp(a,b){a=a|0;b=b|0;da(2)}function Tp(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;da(3);return 0}function Up(a,b,c){a=a|0;b=b|0;c=c|0;da(4);return 0}function Vp(){da(5)}function Wp(a,b){a=a|0;b=b|0;da(6);return 0}




// EMSCRIPTEN_END_FUNCS
var Ac=[Qp,Qp,Fn,Qp,Gn,Qp,Hn,Qp,In,Qp,Jn,Qp,Kn,Qp,Ln,Qp,Mn,Qp,Nn,Qp,On,Qp,Pn,Qp,Qn,Qp,Rn,Qp,Sn,Qp,Tn,Qp,Un,Qp,al,Qp,Ij,Qp,Qm,Qp,Tj,Qp,el,Qp,Yk,Qp,Mm,Qp,dk,Qp,Ck,Qp,tl,Qp,bk,Qp,Zj,Qp,Hj,Qp,Om,Qp,Dl,Qp,Am,Qp,Ml,Qp,pl,Qp,pd,Qp,yk,Qp,ql,Qp,Fk,Qp,Nk,Qp,_k,Qp,Sl,Qp,Ak,Qp,cl,Qp,ol,Qp,nm,Qp,dm,Qp,$l,Qp,Kk,Qp,Wk,Qp,Yl,Qp,fm,Qp,Tl,Qp,xl,Qp,uk,Qp,lm,Qp,Hm,Qp,Jl,Qp,bm,Qp,zj,Qp,Sj,Qp,zl,Qp,xi,Qp,yl,Qp,zm,Qp,pm,Qp,Rk,Qp,em,Qp,od,Qp,zk,Qp,Jk,Qp,ek,Qp,jk,Qp,Nm,Qp,Hl,Qp,md,Qp,hm,Qp,Rl,Qp,nd,Qp,Bm,Qp,jd,Qp,rl,Qp,mm,Qp,am,Qp,Dk,Qp,Ek,Qp,Rj,Qp,nk,Qp,gm,Qp,Lm,Qp,Ok,Qp,im,Qp,Kl,Qp,Uj,Qp,$k,Qp,rk,Qp,pk,Qp,sl,Qp,ml,Qp,Gm,Qp,Il,Qp,fl,Qp,lk,Qp,gk,Qp,Wj,Qp,Ql,Qp,sm,Qp,Uk,Qp,vk,Qp,Cm,Qp,Bl,Qp,ul,Qp,Vj,Qp,Jj,Qp,wl,Qp,Pl,Qp,Tk,Qp,hk,Qp,ld,Qp,Mj,Qp,sk,Qp,Hk,Qp,Ul,Qp,Cj,Qp,Im,Qp,km,Qp,Gl,Qp,Bj,Qp,Fl,Qp,cm,Qp,_l,Qp,Ll,Qp,Lj,Qp,Zk,Qp,Dj,Qp,wk,Qp,Vk,Qp,Cl,Qp,ym,Qp,Fj,Qp,Xl,Qp,Kj,Qp,Sk,Qp,El,Qp,qk,Qp,om,Qp,Ik,Qp,ok,Qp,jm,Qp,Al,Qp,Qj,Qp,Zl,Qp,xm,Qp,Ej,Qp,yj,Qp,hl,Qp,Xk,Qp,Nl,Qp,$j,Qp,ik,Qp,Gk,Qp,Wl,Qp,Pj,Qp,Qk,Qp,Bk,Qp,fk,Qp,Oj,Qp,kk,Qp,Aj,Qp,Jm,Qp,Pm,Qp,wm,Qp,Gj,Qp,mk,Qp,jl,Qp,ck,Qp,Ol,Qp,vl,Qp,Nj,Qp,Vl,Qp,dl,Qp,Dm,Qp,ak,Qp,kd,Qp,Lk,Qp,Pk,Qp,xk,Qp,bl,Qp,Km,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp,Qp];var Bc=[Rp,Rp,Wn,Rp,Xn,Rp,Yn,Rp,Zn,Rp,_n,Rp,$n,Rp,ao,Rp,bo,Rp,co,Rp,eo,Rp,fo,Rp,go,Rp,ho,Rp,io,Rp,jo,Rp,ko,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp,Rp];var Cc=[Sp,Sp,mo,Sp,no,Sp,oo,Sp,po,Sp,qo,Sp,ro,Sp,so,Sp,to,Sp,uo,Sp,vo,Sp,wo,Sp,xo,Sp,yo,Sp,zo,Sp,Ao,Sp,Bo,Sp,Xf,Sp,Le,Sp,Lg,Sp,qf,Sp,Mk,Sp,of,Sp,Ke,Sp,pf,Sp,Sp,Sp,Sp,Sp,Sp,Sp,Sp,Sp,Sp,Sp,Sp,Sp,Sp,Sp];var Dc=[Tp,Tp,Do,Tp,Eo,Tp,Fo,Tp,Go,Tp,Ho,Tp,Io,Tp,Jo,Tp,Ko,Tp,Lo,Tp,Mo,Tp,No,Tp,Oo,Tp,Po,Tp,Qo,Tp,Ro,Tp,So,Tp,qm,Tp,wi,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp,Tp];var Ec=[Up,Up,Uo,Up,Vo,Up,Wo,Up,Xo,Up,Yo,Up,Zo,Up,_o,Up,$o,Up,ap,Up,bp,Up,cp,Up,dp,Up,ep,Up,fp,Up,gp,Up,hp,Up,ti,Up,ui,Up,Yj,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up,Up];var Fc=[Vp,Vp,jp,Vp,kp,Vp,lp,Vp,mp,Vp,np,Vp,op,Vp,pp,Vp,qp,Vp,rp,Vp,sp,Vp,tp,Vp,up,Vp,vp,Vp,wp,Vp,xp,Vp,yp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp,Vp];var Gc=[Wp,Wp,Ap,Wp,Bp,Wp,Cp,Wp,Dp,Wp,Ep,Wp,Fp,Wp,Gp,Wp,Hp,Wp,Ip,Wp,Jp,Wp,Kp,Wp,Lp,Wp,Mp,Wp,Np,Wp,Op,Wp,Pp,Wp,Jg,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp,Wp];return{_strlen:jn,_jslua_toref:dd,_main:rd,_jslua_call:gd,_lua_gettable:ge,_jslua_pop_string:$c,_jslua_push_number:cd,_jslua_push_string:ad,_lua_getmetatable:le,_lua_gettop:xd,_lua_createtable:ke,_lua_settable:oe,_lua_tonumberx:Md,_lua_rawset:qe,_lua_setmetatable:se,_lua_pushvalue:Dd,_lua_settop:yd,_memset:mn,_jslua_execute:hd,_memcpy:nn,_lua_pushnil:Vd,_lua_next:Ce,___jslua_set_fp:Yc,_lua_rawseti:re,_jslua_delete_state:qd,_jslua_pop_number:bd,_jslua_unref:fd,_jslua_push_ref:ed,_testSetjmp:ln,_saveSetjmp:kn,_free:Xm,_lua_tolstring:Qd,_tolower:pn,_memcmp:on,_malloc:Wm,_jslua_push_jsvar:Zc,_jslua_new_state:id,_realloc:Ym,_lua_type:Ed,runPostSets:Xc,stackAlloc:Hc,stackSave:Ic,stackRestore:Jc,setThrew:Kc,setTempRet0:Nc,setTempRet1:Oc,setTempRet2:Pc,setTempRet3:Qc,setTempRet4:Rc,setTempRet5:Sc,setTempRet6:Tc,setTempRet7:Uc,setTempRet8:Vc,setTempRet9:Wc,dynCall_ii:En,dynCall_vi:Vn,dynCall_vii:lo,dynCall_iiiii:Co,dynCall_iiii:To,dynCall_v:ip,dynCall_iii:zp}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "jsCall": jsCall, "invoke_ii": invoke_ii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiiii": invoke_iiiii, "invoke_iiii": invoke_iiii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "_llvm_lifetime_end": _llvm_lifetime_end, "_lseek": _lseek, "_rand": _rand, "__scanString": __scanString, "_fclose": _fclose, "_freopen": _freopen, "_fflush": _fflush, "_fputc": _fputc, "_fwrite": _fwrite, "_send": _send, "_mktime": _mktime, "_tmpnam": _tmpnam, "_isspace": _isspace, "_localtime": _localtime, "_read": _read, "_ceil": _ceil, "_strstr": _strstr, "_fsync": _fsync, "_fscanf": _fscanf, "_remove": _remove, "_modf": _modf, "_strcmp": _strcmp, "_memchr": _memchr, "_llvm_va_end": _llvm_va_end, "_tmpfile": _tmpfile, "_snprintf": _snprintf, "_fgetc": _fgetc, "_cosh": _cosh, "__getFloat": __getFloat, "_fgets": _fgets, "_close": _close, "_strchr": _strchr, "_asin": _asin, "_clock": _clock, "___setErrNo": ___setErrNo, "_emscripten_exit_with_live_runtime": _emscripten_exit_with_live_runtime, "_isxdigit": _isxdigit, "_ftell": _ftell, "_exit": _exit, "_sprintf": _sprintf, "_strrchr": _strrchr, "_fmod": _fmod, "__isLeapYear": __isLeapYear, "_copysign": _copysign, "_ferror": _ferror, "_llvm_uadd_with_overflow_i32": _llvm_uadd_with_overflow_i32, "_gmtime": _gmtime, "_localtime_r": _localtime_r, "_sinh": _sinh, "_recv": _recv, "_cos": _cos, "_putchar": _putchar, "_islower": _islower, "_acos": _acos, "_isupper": _isupper, "_strftime": _strftime, "_strncmp": _strncmp, "_tzset": _tzset, "_setlocale": _setlocale, "_toupper": _toupper, "_pread": _pread, "_fopen": _fopen, "_open": _open, "_frexp": _frexp, "__arraySum": __arraySum, "_log": _log, "_isalnum": _isalnum, "_system": _system, "_isalpha": _isalpha, "_rmdir": _rmdir, "_log10": _log10, "_fread": _fread, "__reallyNegative": __reallyNegative, "__formatString": __formatString, "_getenv": _getenv, "_llvm_pow_f64": _llvm_pow_f64, "_sbrk": _sbrk, "_tanh": _tanh, "_localeconv": _localeconv, "___errno_location": ___errno_location, "_strerror": _strerror, "_llvm_lifetime_start": _llvm_lifetime_start, "_strspn": _strspn, "_ungetc": _ungetc, "_rename": _rename, "_sysconf": _sysconf, "_srand": _srand, "_abort": _abort, "_fprintf": _fprintf, "_tan": _tan, "___buildEnvironment": ___buildEnvironment, "_feof": _feof, "__addDays": __addDays, "_gmtime_r": _gmtime_r, "_ispunct": _ispunct, "_clearerr": _clearerr, "_fabs": _fabs, "_floor": _floor, "_fseek": _fseek, "_sqrt": _sqrt, "_emscripten_asm_const_int": _emscripten_asm_const_int, "_sin": _sin, "_longjmp": _longjmp, "_atan": _atan, "_strpbrk": _strpbrk, "_isgraph": _isgraph, "_unlink": _unlink, "__exit": __exit, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_difftime": _difftime, "_iscntrl": _iscntrl, "_atan2": _atan2, "_write": _write, "_exp": _exp, "_time": _time, "_setvbuf": _setvbuf, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "_stderr": _stderr, "_stdout": _stdout }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _jslua_toref = Module["_jslua_toref"] = asm["_jslua_toref"];
var _main = Module["_main"] = asm["_main"];
var _jslua_call = Module["_jslua_call"] = asm["_jslua_call"];
var _lua_gettable = Module["_lua_gettable"] = asm["_lua_gettable"];
var _jslua_pop_string = Module["_jslua_pop_string"] = asm["_jslua_pop_string"];
var _jslua_push_number = Module["_jslua_push_number"] = asm["_jslua_push_number"];
var _jslua_push_string = Module["_jslua_push_string"] = asm["_jslua_push_string"];
var _lua_getmetatable = Module["_lua_getmetatable"] = asm["_lua_getmetatable"];
var _lua_gettop = Module["_lua_gettop"] = asm["_lua_gettop"];
var _lua_createtable = Module["_lua_createtable"] = asm["_lua_createtable"];
var _lua_settable = Module["_lua_settable"] = asm["_lua_settable"];
var _lua_tonumberx = Module["_lua_tonumberx"] = asm["_lua_tonumberx"];
var _lua_rawset = Module["_lua_rawset"] = asm["_lua_rawset"];
var _lua_setmetatable = Module["_lua_setmetatable"] = asm["_lua_setmetatable"];
var _lua_pushvalue = Module["_lua_pushvalue"] = asm["_lua_pushvalue"];
var _lua_settop = Module["_lua_settop"] = asm["_lua_settop"];
var _memset = Module["_memset"] = asm["_memset"];
var _jslua_execute = Module["_jslua_execute"] = asm["_jslua_execute"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _lua_pushnil = Module["_lua_pushnil"] = asm["_lua_pushnil"];
var _lua_next = Module["_lua_next"] = asm["_lua_next"];
var ___jslua_set_fp = Module["___jslua_set_fp"] = asm["___jslua_set_fp"];
var _lua_rawseti = Module["_lua_rawseti"] = asm["_lua_rawseti"];
var _jslua_delete_state = Module["_jslua_delete_state"] = asm["_jslua_delete_state"];
var _jslua_pop_number = Module["_jslua_pop_number"] = asm["_jslua_pop_number"];
var _jslua_unref = Module["_jslua_unref"] = asm["_jslua_unref"];
var _jslua_push_ref = Module["_jslua_push_ref"] = asm["_jslua_push_ref"];
var _testSetjmp = Module["_testSetjmp"] = asm["_testSetjmp"];
var _saveSetjmp = Module["_saveSetjmp"] = asm["_saveSetjmp"];
var _free = Module["_free"] = asm["_free"];
var _lua_tolstring = Module["_lua_tolstring"] = asm["_lua_tolstring"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _memcmp = Module["_memcmp"] = asm["_memcmp"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _jslua_push_jsvar = Module["_jslua_push_jsvar"] = asm["_jslua_push_jsvar"];
var _jslua_new_state = Module["_jslua_new_state"] = asm["_jslua_new_state"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _lua_type = Module["_lua_type"] = asm["_lua_type"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };

// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






