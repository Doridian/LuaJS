LuaJS
=====

Lua VM running in Javascript (using emscripten)

Build instructions
------------------

Run `emmake make` then you can just open index.htm in the web folder.

Usage of Lua from JavaScript
----------------------------

```javascript
var L = new LuaState();
var value;
value = L.run("return 1+2"); //value == [3]

value = L.run("return {a = 1, b = 2}"); //value[0] instanceof LuaTable, value[0] instanceof LuaReference
value[0].get("a"); // == 1
value.toObject(recursive, unrefAll) //converts LuaTable to JavaScript object (will drop all other LuaReferences if unrefAll == true)
value[0].unref();

var func = L.run("return function(a,b) return a + b end"); //func[0] instanceof LuaFunction, func[0] instanceof LuaReference
value = func[0].call(3,4); //value == [7]
func.unref();
```

All LuaReference values have to be freed using `.unref()` to prevent leaking Lua references

Usage of JavaScript from Lua
----------------------------
Lua knows the library `js`, where the `js.global` table equals the JavaScript `window` object

When you call JS functions from Lua, the function parameters will always be automatically converted to JS equivalents (and internally .unref()'d, except functions).

You can convert JS objects/arrays to native Lua tables by using jsObject:toTable(recursive), however you can also directly index JS objects from Lua

Todo
----
Try to find a clever way to do finalizers/garbage collector hooks in JS.

`__pairs / __ipairs` for jsObject/jsArray metatable in Lua to make them iterable
