exports = (function() {
	function inherit(childClass, parentClass) {
		childClass.prototype = Object.create(parentClass.prototype);
		childClass.prototype.constructor = childClass;
	}
	
	function ajaxPromise(url) {
		return new Promise(function(resolve, reject) {
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState==XMLHttpRequest.DONE) {
					if(xmlhttp.status == 200)
						resolve(xmlhttp.responseText);
					else
						reject(xmlhttp.status);
				}
			};
			xmlhttp.open("GET", url, true);
			xmlhttp.send();
		});
	}

	var lua_execute = Module.cwrap("jslua_execute", "number", ["number", "string"]);
	var lua_call = Module.cwrap("jslua_call", "number", ["number", "number"]);

	var lua_settop = Module.cwrap("lua_settop", "", ["number", "number"]);
	var lua_gettop = Module.cwrap("lua_gettop", "number", ["number"]);
	
	var lua_type = Module.cwrap("lua_type", "number", ["number", "number"]);

	var lua_new_state = Module.cwrap("jslua_new_state", "number", []);
	var lua_delete_state = Module.cwrap("jslua_delete_state", "", ["number"]);

	var lua_pop_string = Module.cwrap("jslua_pop_string", "string", ["number"]);
	var lua_push_string = Module.cwrap("jslua_push_string", "", ["number", "string"]);
	var lua_pop_number = Module.cwrap("jslua_pop_number", "number", ["number"]);
	var lua_push_number = Module.cwrap("jslua_push_number", "", ["number", "number"]);
	
	var lua_push_jsvar = Module.cwrap("jslua_push_jsvar", "", ["number", "number", "number"]);
	
	var lua_gettable = Module.cwrap("lua_gettable", "", ["number", "number"]);
	var lua_settable = Module.cwrap("lua_settable", "", ["number", "number"]);

	var lua_toref = Module.cwrap("jslua_toref", "number", ["number", "number"]);
	var lua_push_ref = Module.cwrap("jslua_push_ref", "", ["number", "number"]);
	var lua_unref = Module.cwrap("jslua_unref", "", ["number", "number"]);
	
	var lua_createtable = Module.cwrap("lua_createtable", "", ["number"]);
	
	var lua_pushvalue = Module.cwrap("lua_pushvalue", "", ["number", "number"]);
	var lua_pushnil = Module.cwrap("lua_pushnil", "", ["number"]);
	
	var lua_next = Module.cwrap("lua_next", "", ["number", "number"]);
	
	var lua_tolstring = Module.cwrap("lua_tolstring", "string", ["number", "number", "number"]);
	var lua_tonumberx = Module.cwrap("lua_tonumberx", "number", ["number", "number", "number"]);
	
	var lua_getmetatable = Module.cwrap("lua_getmetatable", "number", ["number", "number"]);
	var lua_setmetatable = Module.cwrap("lua_setmetatable", "number", ["number", "number"]);
	
	function lua_pop(state, n) {
		lua_settop(state, -n-1);
	}
	
	function lua_pop_top(state) {
		lua_pop(state, 1);
	}
	
	function lua_pop_ref(state) {
		var ref = lua_toref(state, -1);
		lua_pop_top();
		return ref;
	}
	
	function lua_tostring(a, b) {
		return lua_tolstring(a, b, 0);
	}
	
	function lua_tonumber(state, i) {
		return lua_tonumberx(state, i, 0);
	}
	
	var luaTypes = {
		nil: 0,
		bool: 1,
		boolean: 1,
		lightuserdata: 2,
		number: 3,
		string: 4,
		table: 5,
		function: 6,
		userdata: 7,
		thread: 8,
		coroutine: 8
	};
	
	var luaJSDataTypes = {
		function: 1,
		array: 2,
		object: 3
	};
	
	var luaConstants = {
		LUA_REGISTRYINDEX: -10000,
		LUA_ENVIRONINDEX: -10001,
		LUA_GLOBALSINDEX: -10002,
		LUA_RIDX_GLOBALS: 2
	};

	var MOD_PATH = {
		"lua": "/usr/local/share/lua/5.2/",
		"c": "/usr/local/lib/lua/5.2/",
	};

	for(var idx in MOD_PATH)
		FS.createPath("/", MOD_PATH[idx].substr(1), true, true);
	
	function decode_single(state, pos) {
		switch(lua_type(state, pos)) {
			case luaTypes.nil:
				return null;
			case luaTypes.number:
				return lua_tonumber(state, pos);
			case luaTypes.string:
				return lua_tostring(state, pos);
			case luaTypes.table:
				return new LuaTable(state, lua_toref(state, pos));
			case luaTypes.function:
				return new LuaFunction(state, lua_toref(state, pos));
			default:
				return new LuaReference(state, lua_toref(state, pos));
		}
	}
	

	function decode_stack(state, stack_size) {
		var ret = [];
		for(var i = 0; i < stack_size; i++) {
			ret.unshift(decode_single(state, -1));
			lua_pop_top(state);
		}
		return ret;
	}
	
	var luaPassedVars = [];
	
	function luaGetVarPtr(varObj) {
		var i = luaPassedVars.length;
		luaPassedVars.push(varObj);
		return i;
	}
	
	function push_var(state, arg) {
		if(arg === null) {
			lua_pushnil(state);
			return;
		}
		switch(typeof arg) {
			case "undefined":
				lua_pushnil(state);
				break;
			case "boolean":
				lua_push_boolean(state, arg ? 1 : 0);
				break;
			case "number":
				lua_push_number(state, arg);
				break;
			case "string":
				lua_push_string(state, arg);
				break;
			case "function":
				lua_push_jsvar(state, luaGetVarPtr(arg), luaJSDataTypes.function);
				break;
			case "object":
				if(arg instanceof LuaReference)
					arg.push(state);
				else if(arg instanceof Array)
					lua_push_jsvar(state, luaGetVarPtr(arg), luaJSDataTypes.array);
				else
					lua_push_jsvar(state, luaGetVarPtr(arg), luaJSDataTypes.object);
				break;
			default:
				throw new LuaError("Unhandled value push: " + arg);
		}
	}
	
	function luaCallFunction(func, state, stack_size) {
		var variables = decode_stack(state, stack_size);
		push_var(state, func.apply(null, variables));
	}
	
	function luaEval(str, state, stack_size) {
		return luaCallFunction(function() { eval(str); }, state, stack_size);
	}
	
	function luaCallFunctionString(funcDef, state, stack_size) {
		return luaCallFunction(eval(funcDef), state, stack_size);
	}
	
	function luaCallFunctionPointer(funcPtr, state, stack_size) {
		return luaCallFunction(luaPassedVars[funcPtr], state, stack_size);
	}
	
	Module.ccall("__jslua_set_cfp", "", ["number"], [Runtime.addFunction(luaCallFunctionPointer)]);
	
	//LuaError
	function LuaError(msg) {
		Error.apply(this, arguments);
		this.message = msg;
	}

	inherit(LuaError, Error);

	//LuaRerefence
	function LuaReference(state, index) {
		this.state = state;
		this.index = index;
	}

	LuaReference.prototype.unref = function() {
		lua_unref(this.state, this.index);
	}

	LuaReference.prototype.push = function(state) {
		if(state && state != this.state)
			throw new Error("Wrong Lua state");
		lua_push_ref(this.state, this.index);
	}

	//LuaFunction
	function LuaFunction() {
		LuaReference.apply(this, arguments);
	}

	inherit(LuaFunction, LuaReference);

	LuaFunction.prototype.call = function() {
		this.push(this.state);
		
		for(var i = 0; i < arguments.length; i++) {
			try {
				push_var(this.state, arguments[i])
			} catch(e) {
				for(;i>=0;i--)
					lua_pop(this.state, 1);
				throw e;
			}
		}
		
		var stack = lua_call(this.state, arguments.length);
		var ret = decode_stack(this.state, Math.abs(stack));
		if (stack < 0)
			throw new LuaError(ret[0]);
		return ret;
	}
	
	//LuaTable
	function LuaTable() {
		LuaReference.apply(this, arguments);
	}
	
	inherit(LuaTable, LuaReference);
	
	LuaTable.prototype.set = function(key, value) {
		var type = typeof key;
		this.push();
		push_var(this.state, key);
		push_var(this.state, value);
		lua_settable(this.state, -3);
		lua_pop(this.state, 1);
		
	}
	
	LuaTable.prototype.get = function(key) {
		this.push();
		push_var(this.state, key);
		lua_gettable(this.state, -2);
		var ret = decode_single(this.state, -1);
		lua_pop(this.state, 2);
		return ret;
	}
	
	LuaTable.prototype.toObject = function() {
		this.push();
		lua_pushnil(this.state);
		var ret = {}
		while(lua_next(this.state, -2)) {
			lua_pushvalue(this.state, -2);
			var key = lua_tostring(this.state, -1);
			var value = decode_single(this.state, -2);
			ret[key] = value;
			lua_pop(this.state, 2);
		}
		lua_pop(this.state, 1);
		return ret;
	}
	
	LuaTable.prototype.getmetatable = function() {
		this.push();
		lua_getmetatable(this.state, -1);
		var ret = decode_single(this.state, -1);
		lua_pop(this.state, 1);
		return ret;
	}
	
	LuaTable.prototype.setmetatable = function() {
		this.push();
		lua_setmetatable(this.state, -1);
		lua_pop(this.state, 1);
	}

	//LuaState
	function LuaState() {
		this.state = lua_new_state();
	}

	LuaState.prototype.close = function() {
		lua_delete_state(this.state);
	}

	LuaState.prototype.run = function(code) {
		var stack = lua_execute(this.state, code);
		var ret = decode_stack(this.state, Math.abs(stack));
		if (stack < 0)
			throw new LuaError(ret[0]);
		return ret;
	}
	
	LuaState.prototype.getGlobalTable = function() {
		return new LuaTable(this.state, luaConstants.LUA_RIDX_GLOBALS);
	}
	
	LuaState.prototype.createTable = function() {
		lua_createtable(this.state, 0, 0);
		return new LuaTable(this.state, lua_pop_ref(this.state));
	}
	
	LuaState.prototype.require = function(libname, type) {
		var extension;
		if(type == "lua")
			extension = ".lua";
		else
			throw new Error("Unsupported type");
		
		var self = this;
		
		return ajaxPromise('modules/' + libname + extension).then(function(data) {
			FS.createDataFile(MOD_PATH[type], libname + extension, data, true, true);
			self.run(libname + ' = require"' + libname + '"');
		});
	}

	LuaState.prototype.loadDocumentScripts = function(doc) {
		var self = this;
		var xPathResult = document.evaluate( '//script[@type="text/lua"]', doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		var node;
		var scriptPromises = [];
		while(node = xPathResult.iterateNext()) {
			scriptPromises.push(ajaxPromise(node.src));
		}
		
		Promise.all(scriptPromises).then(function(scripts) {
			scripts.forEach(function(data) {
				self.run(data);
			});
		});
	}

	LuaState.prototype.listenForScripts = function(doc) {
		var self = this;
		var observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if(mutation.type == "childList") {
					Array.prototype.slice.call(mutation.addedNodes).forEach(function(node) {
						if(node instanceof HTMLScriptElement && node.type.toLowerCase() == "text/lua") {
							if(node.src)
								ajaxPromise(node.src).then(function(data) {
									self.run(data);
								});
							else
								self.run(node.textContent);
						}
					});
				}	
			});
		});    
		observer.observe(doc, {
			childList: true,
			subtree: true
		});		
	}
	
	return {
		LuaState: LuaState,
		LuaFunction: LuaFunction,
		LuaReference: LuaReference,
	};  
})();

for(var idx in exports) {
	if(exports.hasOwnProperty(idx))
		window[idx] = exports[idx];
}

